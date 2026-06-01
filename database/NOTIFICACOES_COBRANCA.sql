-- ═══════════════════════════════════════════════════════════════════════════════
-- MÓDULO: NOTIFICAÇÕES DE COBRANÇA
-- Registra notificações enviadas a franqueados/clientes inadimplentes.
-- Estrutura preparada para consumo via API pelo Girabot.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Tabela principal: inadimplencia_notificacoes ────────────────────────────────
CREATE TABLE IF NOT EXISTS inadimplencia_notificacoes (
  id                    BIGSERIAL    PRIMARY KEY,
  empresa_id            INTEGER      NOT NULL,

  -- Identificação do cliente (snapshot no momento da notificação)
  solutto_cliente_id    INTEGER      NOT NULL,
  cliente_id            INTEGER,           -- pode ser NULL se não mapeado no sistema
  cliente_nome          TEXT         NOT NULL,
  cliente_cpf_cnpj      TEXT,

  -- Operador que criou
  usuario_id            UUID         REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Canais pelos quais a notificação foi efetivamente enviada
  -- Valores possíveis: WHATSAPP, EMAIL, LIGACAO, EXTRAJUDICIAL, JUDICIAL
  canais_enviados       TEXT[]       NOT NULL DEFAULT '{}',

  -- Texto livre de observações
  observacoes           TEXT,

  -- Status de ciclo da notificação
  status                TEXT         NOT NULL DEFAULT 'REGISTRADA'
    CHECK (status IN ('REGISTRADA', 'PENDENTE_GIRABOT', 'EXPORTADA_GIRABOT', 'RESPONDIDA')),

  -- Rastreio de exportação para o Girabot
  girabot_exportado_em  TIMESTAMPTZ,

  data_notificacao      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Tabela de títulos por notificação ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inadimplencia_notificacoes_titulos (
  id                    BIGSERIAL    PRIMARY KEY,
  notificacao_id        BIGINT       NOT NULL
    REFERENCES inadimplencia_notificacoes(id) ON DELETE CASCADE,

  -- Identificação do título no Solutto
  solutto_id            INTEGER      NOT NULL,
  numero_documento      TEXT,

  -- Snapshot imutável — valores no momento da notificação
  valor_original        NUMERIC(12,2) NOT NULL,
  vencimento_original   DATE          NOT NULL,
  valor_saldo_original  NUMERIC(12,2) NOT NULL DEFAULT 0,
  dias_atraso_original  INTEGER       NOT NULL DEFAULT 0,

  -- Proposta de negociação preenchida pelo operador
  valor_atual           NUMERIC(12,2),           -- base de cálculo negociada
  percentual_multa      NUMERIC(5,2)  NOT NULL DEFAULT 0,
  percentual_juros      NUMERIC(5,2)  NOT NULL DEFAULT 0,
  valor_total_calculado NUMERIC(12,2),           -- valor_atual * (1 + multa% + juros%)

  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Índices ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notif_empresa_data
  ON inadimplencia_notificacoes(empresa_id, data_notificacao DESC);

CREATE INDEX IF NOT EXISTS idx_notif_cliente
  ON inadimplencia_notificacoes(empresa_id, solutto_cliente_id);

CREATE INDEX IF NOT EXISTS idx_notif_status
  ON inadimplencia_notificacoes(status)
  WHERE status IN ('PENDENTE_GIRABOT', 'REGISTRADA');

CREATE INDEX IF NOT EXISTS idx_notif_titulos_notif
  ON inadimplencia_notificacoes_titulos(notificacao_id);

-- ── Trigger: updated_at automático ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at_notificacoes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notificacoes_updated_at ON inadimplencia_notificacoes;
CREATE TRIGGER trg_notificacoes_updated_at
  BEFORE UPDATE ON inadimplencia_notificacoes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_notificacoes();

-- ── RLS ────────────────────────────────────────────────────────────────────────
ALTER TABLE inadimplencia_notificacoes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE inadimplencia_notificacoes_titulos ENABLE ROW LEVEL SECURITY;

-- Acesso por empresa_id do usuário autenticado
CREATE POLICY notificacoes_empresa_policy ON inadimplencia_notificacoes
  USING (
    empresa_id = (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid() LIMIT 1
    )
  );

-- Acesso transitivo via notificacao_id
CREATE POLICY notif_titulos_empresa_policy ON inadimplencia_notificacoes_titulos
  USING (
    notificacao_id IN (
      SELECT id FROM inadimplencia_notificacoes
      WHERE empresa_id = (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid() LIMIT 1
      )
    )
  );

-- ── View para o Girabot ────────────────────────────────────────────────────────
-- Agrega notificações com seus títulos em formato JSON para consumo externo.
CREATE OR REPLACE VIEW vw_notificacoes_girabot AS
SELECT
  n.id,
  n.empresa_id,
  n.solutto_cliente_id,
  n.cliente_nome,
  n.cliente_cpf_cnpj,
  n.canais_enviados,
  n.observacoes,
  n.status,
  n.data_notificacao,
  n.girabot_exportado_em,
  COALESCE(
    json_agg(
      json_build_object(
        'solutto_id',            t.solutto_id,
        'numero_documento',      t.numero_documento,
        'valor_original',        t.valor_original,
        'vencimento_original',   t.vencimento_original,
        'valor_saldo_original',  t.valor_saldo_original,
        'dias_atraso_original',  t.dias_atraso_original,
        'valor_atual',           t.valor_atual,
        'percentual_multa',      t.percentual_multa,
        'percentual_juros',      t.percentual_juros,
        'valor_total_calculado', t.valor_total_calculado
      ) ORDER BY t.vencimento_original
    ) FILTER (WHERE t.id IS NOT NULL),
    '[]'::json
  ) AS titulos
FROM inadimplencia_notificacoes n
LEFT JOIN inadimplencia_notificacoes_titulos t ON t.notificacao_id = n.id
GROUP BY n.id
ORDER BY n.data_notificacao DESC;
