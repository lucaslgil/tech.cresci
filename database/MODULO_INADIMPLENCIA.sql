-- ============================================================
-- MÓDULO: GESTÃO DE COBRANÇAS E INADIMPLÊNCIA
-- Sistema TechCresci – Camada operacional (NÃO financeira)
-- Fonte de dados financeiros: Solutto (via contas_receber_solutto)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. ACOMPANHAMENTO POR CLIENTE (estado operacional da cobrança)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inadimplencia_acompanhamentos (
  id                     BIGSERIAL PRIMARY KEY,
  empresa_id             INTEGER NOT NULL REFERENCES public.empresas(id),
  cliente_id             INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  solutto_cliente_id     INTEGER,

  -- Status operacional (separado do status financeiro)
  status_operacional     TEXT NOT NULL DEFAULT 'SEM_CONTATO'
    CHECK (status_operacional IN (
      'SEM_CONTATO', 'EM_ACOMPANHAMENTO', 'AGUARDANDO_RETORNO',
      'NEGOCIANDO', 'PROMESSA_PAGAMENTO', 'ACORDO_ATIVO', 'JURIDICO', 'ENCERRADO'
    )),

  -- Fase de cobrança (calculado com base nos dias de atraso)
  fase_cobranca          TEXT
    CHECK (fase_cobranca IN ('FASE_1', 'FASE_2', 'FASE_3', 'FASE_4')),

  -- Dados financeiros consolidados (recalculados a cada sync/interação)
  dias_atraso_max        INTEGER  NOT NULL DEFAULT 0,
  valor_total_vencido    DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_titulos_vencidos INTEGER NOT NULL DEFAULT 0,

  -- Controle operacional
  ultima_interacao_em    TIMESTAMPTZ,
  proximo_acompanhamento DATE,
  responsavel_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  observacoes_gerais     TEXT,

  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(empresa_id, cliente_id)
);

-- ─────────────────────────────────────────────────────────────
-- 2. INTERAÇÕES / NOTIFICAÇÕES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inadimplencia_interacoes (
  id                            BIGSERIAL PRIMARY KEY,
  empresa_id                    INTEGER NOT NULL REFERENCES public.empresas(id),
  cliente_id                    INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  solutto_cliente_id            INTEGER,

  -- Responsável pela interação
  usuario_id                    UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Canal de comunicação
  canal                         TEXT NOT NULL
    CHECK (canal IN ('WHATSAPP', 'EMAIL', 'LIGACAO', 'REUNIAO', 'JURIDICO', 'OBSERVACAO')),
  tipo_interacao                TEXT,

  -- Conteúdo
  descricao                     TEXT NOT NULL,
  observacao                    TEXT,
  resultado                     TEXT,

  -- Status operacional resultante desta interação
  status_operacional_resultante TEXT
    CHECK (status_operacional_resultante IN (
      'SEM_CONTATO', 'EM_ACOMPANHAMENTO', 'AGUARDANDO_RETORNO',
      'NEGOCIANDO', 'PROMESSA_PAGAMENTO', 'ACORDO_ATIVO', 'JURIDICO', 'ENCERRADO'
    )),

  -- Datas
  data_interacao                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  proximo_acompanhamento        DATE,

  -- Origem (preparado para integração futura com Girabot)
  origem                        TEXT NOT NULL DEFAULT 'MANUAL'
    CHECK (origem IN ('MANUAL', 'SISTEMA', 'INTEGRACAO', 'GIRABOT')),

  -- Arquivos anexados (array de { nome, url, tipo, tamanho })
  anexos                        JSONB NOT NULL DEFAULT '[]',

  -- Snapshot financeiro no momento da criação (imutável, para auditoria)
  snapshot_financeiro           JSONB NOT NULL DEFAULT '{}',

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 3. NEGOCIAÇÕES FINANCEIRAS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inadimplencia_negociacoes (
  id                         BIGSERIAL PRIMARY KEY,
  empresa_id                 INTEGER NOT NULL REFERENCES public.empresas(id),
  cliente_id                 INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  interacao_id               BIGINT REFERENCES public.inadimplencia_interacoes(id) ON DELETE SET NULL,

  -- Empresa responsável pela cobrança
  empresa_responsavel        TEXT NOT NULL
    CHECK (empresa_responsavel IN ('FRANCHISING', 'SUPRIMENTOS', 'TAXA_PROPAGANDA')),

  -- Valores
  valor_original             DECIMAL(15,2) NOT NULL,
  percentual_multa           DECIMAL(5,2)  NOT NULL DEFAULT 0,
  percentual_juros           DECIMAL(5,2)  NOT NULL DEFAULT 0,
  quantidade_parcelas        INTEGER       NOT NULL DEFAULT 1
    CHECK (quantidade_parcelas BETWEEN 1 AND 6),
  valor_total_corrigido      DECIMAL(15,2) NOT NULL,
  valor_parcela              DECIMAL(15,2) NOT NULL,

  -- Vencimento da negociação / 1ª parcela
  data_vencimento_negociacao DATE NOT NULL,

  -- Texto livre
  observacoes_financeiras    TEXT,

  -- Ciclo de vida da negociação
  status_negociacao          TEXT NOT NULL DEFAULT 'ATIVA'
    CHECK (status_negociacao IN ('ATIVA', 'CUMPRIDA', 'QUEBRADA', 'CANCELADA')),

  -- Auditoria
  responsavel_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Snapshot das regras de negócio aplicadas no momento da criação (imutável)
  snapshot_regras            JSONB NOT NULL DEFAULT '{}',

  -- Versionamento (nova negociação substitui a anterior)
  versao                     INTEGER NOT NULL DEFAULT 1,
  negociacao_anterior_id     BIGINT REFERENCES public.inadimplencia_negociacoes(id) ON DELETE SET NULL,

  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 4. PARCELAS DA NEGOCIAÇÃO
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inadimplencia_negociacoes_parcelas (
  id             BIGSERIAL PRIMARY KEY,
  negociacao_id  BIGINT NOT NULL
    REFERENCES public.inadimplencia_negociacoes(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL,
  valor_parcela  DECIMAL(15,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  status         TEXT NOT NULL DEFAULT 'PENDENTE'
    CHECK (status IN ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO')),
  data_pagamento DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(negociacao_id, numero_parcela)
);

-- ─────────────────────────────────────────────────────────────
-- 5. TIMELINE DE EVENTOS (auditoria completa)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inadimplencia_timeline (
  id              BIGSERIAL PRIMARY KEY,
  empresa_id      INTEGER NOT NULL REFERENCES public.empresas(id),
  cliente_id      INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,

  -- Classificação do evento
  tipo_evento     TEXT NOT NULL,
  --  Valores possíveis (não restringido por CHECK para permitir expansão futura):
  --  TITULO_VENCEU | INTERACAO_CRIADA | NEGOCIACAO_CRIADA | NEGOCIACAO_ATUALIZADA
  --  NEGOCIACAO_CANCELADA | PAGAMENTO_DETECTADO | STATUS_ALTERADO | FASE_ALTERADA
  --  ACORDO_CRIADO | ACORDO_QUEBRADO | JURIDICO_ACIONADO | SYNC_REALIZADO

  -- Exibição
  titulo          TEXT NOT NULL,
  descricao       TEXT,

  -- Dados estruturados (payload para exportação futura via JSON/API)
  dados           JSONB NOT NULL DEFAULT '{}',

  -- Quem gerou o evento (NULL = sistema automático)
  usuario_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Vínculo ao objeto que gerou o evento
  referencia_id   TEXT,   -- ID do objeto relacionado (string para suportar vários tipos)
  referencia_tipo TEXT,   -- 'interacao' | 'negociacao' | 'conta_receber' | 'sistema'

  -- Visual (para renderização no frontend)
  icone           TEXT DEFAULT 'circle',
  cor             TEXT DEFAULT 'gray',

  data_evento     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- ÍNDICES
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_inад_acomp_empresa_cliente
  ON public.inadimplencia_acompanhamentos(empresa_id, cliente_id);
CREATE INDEX IF NOT EXISTS idx_inад_acomp_status
  ON public.inadimplencia_acompanhamentos(status_operacional);
CREATE INDEX IF NOT EXISTS idx_inад_acomp_proximo
  ON public.inadimplencia_acompanhamentos(proximo_acompanhamento)
  WHERE proximo_acompanhamento IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inад_inter_cliente
  ON public.inadimplencia_interacoes(cliente_id, empresa_id);
CREATE INDEX IF NOT EXISTS idx_inад_inter_data
  ON public.inadimplencia_interacoes(data_interacao DESC);
CREATE INDEX IF NOT EXISTS idx_inад_inter_usuario
  ON public.inadimplencia_interacoes(usuario_id);

CREATE INDEX IF NOT EXISTS idx_inад_neg_cliente
  ON public.inadimplencia_negociacoes(cliente_id, empresa_id);
CREATE INDEX IF NOT EXISTS idx_inад_neg_status
  ON public.inadimplencia_negociacoes(status_negociacao);

CREATE INDEX IF NOT EXISTS idx_inад_timeline_cliente
  ON public.inadimplencia_timeline(cliente_id, empresa_id, data_evento DESC);
CREATE INDEX IF NOT EXISTS idx_inад_timeline_tipo
  ON public.inadimplencia_timeline(tipo_evento);

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS DE updated_at
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_inadimplencia_acompanhamentos_upd ON public.inadimplencia_acompanhamentos;
CREATE TRIGGER trg_inadimplencia_acompanhamentos_upd
  BEFORE UPDATE ON public.inadimplencia_acompanhamentos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_inadimplencia_negociacoes_upd ON public.inadimplencia_negociacoes;
CREATE TRIGGER trg_inadimplencia_negociacoes_upd
  BEFORE UPDATE ON public.inadimplencia_negociacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.inadimplencia_acompanhamentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inadimplencia_interacoes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inadimplencia_negociacoes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inadimplencia_negociacoes_parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inadimplencia_timeline          ENABLE ROW LEVEL SECURITY;

-- Políticas: autenticados podem ver/criar/editar dentro da própria empresa
DO $$ BEGIN
  -- acompanhamentos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='inadimplencia_acompanhamentos' AND policyname='inад_acomp_select') THEN
    CREATE POLICY inад_acomp_select ON public.inadimplencia_acompanhamentos FOR SELECT TO authenticated USING (true);
    CREATE POLICY inад_acomp_insert ON public.inadimplencia_acompanhamentos FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY inад_acomp_update ON public.inadimplencia_acompanhamentos FOR UPDATE TO authenticated USING (true);
  END IF;
  -- interacoes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='inadimplencia_interacoes' AND policyname='inад_inter_select') THEN
    CREATE POLICY inад_inter_select ON public.inadimplencia_interacoes FOR SELECT TO authenticated USING (true);
    CREATE POLICY inад_inter_insert ON public.inadimplencia_interacoes FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY inад_inter_update ON public.inadimplencia_interacoes FOR UPDATE TO authenticated USING (true);
  END IF;
  -- negociacoes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='inadimplencia_negociacoes' AND policyname='inад_neg_select') THEN
    CREATE POLICY inад_neg_select ON public.inadimplencia_negociacoes FOR SELECT TO authenticated USING (true);
    CREATE POLICY inад_neg_insert ON public.inadimplencia_negociacoes FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY inад_neg_update ON public.inadimplencia_negociacoes FOR UPDATE TO authenticated USING (true);
  END IF;
  -- parcelas
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='inadimplencia_negociacoes_parcelas' AND policyname='inад_parc_select') THEN
    CREATE POLICY inад_parc_select ON public.inadimplencia_negociacoes_parcelas FOR SELECT TO authenticated USING (true);
    CREATE POLICY inад_parc_insert ON public.inadimplencia_negociacoes_parcelas FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY inад_parc_update ON public.inadimplencia_negociacoes_parcelas FOR UPDATE TO authenticated USING (true);
  END IF;
  -- timeline
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='inadimplencia_timeline' AND policyname='inад_tl_select') THEN
    CREATE POLICY inад_tl_select ON public.inadimplencia_timeline FOR SELECT TO authenticated USING (true);
    CREATE POLICY inад_tl_insert ON public.inadimplencia_timeline FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- VIEW: DASHBOARD DE COBRANÇA (agrega clientes inadimplentes)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.vw_cobranca_clientes AS
SELECT
  crs.cliente_id,
  crs.solutto_cliente_id,
  crs.empresa_id,

  -- Nome/documento do cliente (snapshot do último sync)
  MAX(crs.cliente_nome)     AS cliente_nome,
  MAX(crs.cliente_cpf_cnpj) AS cliente_cpf_cnpj,

  -- Totais financeiros calculados em tempo real
  COUNT(*)                  FILTER (
    WHERE crs.status NOT IN ('QUITADA','CANCELADO')
      AND crs.data_vencimento::date < CURRENT_DATE
      AND crs.valor_saldo > 0
  )                         AS titulos_vencidos,

  COALESCE(SUM(crs.valor_saldo) FILTER (
    WHERE crs.status NOT IN ('QUITADA','CANCELADO')
      AND crs.data_vencimento::date < CURRENT_DATE
      AND crs.valor_saldo > 0
  ), 0)                     AS valor_total_vencido,

  COALESCE(MAX(CURRENT_DATE - crs.data_vencimento::date) FILTER (
    WHERE crs.status NOT IN ('QUITADA','CANCELADO')
      AND crs.data_vencimento::date < CURRENT_DATE
      AND crs.valor_saldo > 0
  ), 0)                     AS dias_atraso_max,

  -- Dados de acompanhamento operacional
  COALESCE(ia.status_operacional, 'SEM_CONTATO') AS status_operacional,
  ia.fase_cobranca,
  ia.ultima_interacao_em,
  ia.proximo_acompanhamento,
  ia.responsavel_id,
  ia.id                     AS acompanhamento_id

FROM public.contas_receber_solutto crs
LEFT JOIN public.inadimplencia_acompanhamentos ia
       ON ia.cliente_id  = crs.cliente_id
      AND ia.empresa_id  = crs.empresa_id
WHERE crs.cliente_id IS NOT NULL
GROUP BY
  crs.cliente_id, crs.solutto_cliente_id, crs.empresa_id,
  ia.status_operacional, ia.fase_cobranca, ia.ultima_interacao_em,
  ia.proximo_acompanhamento, ia.responsavel_id, ia.id
HAVING
  COALESCE(SUM(crs.valor_saldo) FILTER (
    WHERE crs.status NOT IN ('QUITADA','CANCELADO')
      AND crs.data_vencimento::date < CURRENT_DATE
      AND crs.valor_saldo > 0
  ), 0) > 0;

-- ═══════════════════════════════════════════════════════════
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ═══════════════════════════════════════════════════════════

COMMENT ON TABLE public.inadimplencia_acompanhamentos IS
  'Estado operacional de cobrança por cliente. Uma linha por cliente em cobrança.';
COMMENT ON TABLE public.inadimplencia_interacoes IS
  'Log imutável de cada interação/notificação de cobrança. Inclui snapshot financeiro.';
COMMENT ON TABLE public.inadimplencia_negociacoes IS
  'Acordos financeiros firmados. Versionados — uma nova negociação cancela a anterior.';
COMMENT ON TABLE public.inadimplencia_negociacoes_parcelas IS
  'Cronograma de parcelas de cada negociação.';
COMMENT ON TABLE public.inadimplencia_timeline IS
  'Timeline completa de eventos operacionais e financeiros por cliente.';
COMMENT ON VIEW  public.vw_cobranca_clientes IS
  'Visão consolidada de clientes inadimplentes para o dashboard de cobrança.';
