-- =====================================================
-- CRIAR TABELA: franquia_parametros
-- Data: 2026-03-05
-- Descrição: Tabela genérica de parâmetros configuráveis
--            para o módulo de franquias.
--
-- Tipos suportados:
--   'status'        → Status das unidades
--   'etapa'         → Etapas de implantação
--   'modalidade'    → Modalidade/Modelo de unidade
--   'tipo_contrato' → Tipo de contrato
-- =====================================================

CREATE TABLE IF NOT EXISTS franquia_parametros (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id  BIGINT      NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo        VARCHAR(50) NOT NULL,
  label       VARCHAR(200) NOT NULL,
  cor         VARCHAR(7)  DEFAULT NULL,
  ordem       INTEGER     NOT NULL DEFAULT 0,
  ativo       BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_franquia_parametros_empresa_tipo_label
    UNIQUE (empresa_id, tipo, label)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_franquia_parametros_empresa_tipo
  ON franquia_parametros (empresa_id, tipo);

-- Comentários
COMMENT ON TABLE franquia_parametros IS
  'Parâmetros configuráveis do módulo de franquias (status, etapa, modalidade, tipo de contrato).';

COMMENT ON COLUMN franquia_parametros.tipo IS
  'Tipo do parâmetro: status | etapa | modalidade | tipo_contrato';

COMMENT ON COLUMN franquia_parametros.label IS
  'Texto de exibição do parâmetro';

COMMENT ON COLUMN franquia_parametros.cor IS
  'Cor HEX opcional para exibição em badges/tags';

COMMENT ON COLUMN franquia_parametros.ordem IS
  'Ordem de exibição na listagem (menor = primeiro)';

-- ── RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE franquia_parametros ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ler parâmetros da própria empresa
CREATE POLICY "franquia_parametros_select"
  ON franquia_parametros FOR SELECT
  TO authenticated
  USING (empresa_id = (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid() LIMIT 1
  ));

-- Apenas admins/gestores gerenciam parâmetros
CREATE POLICY "franquia_parametros_insert"
  ON franquia_parametros FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid() LIMIT 1
  ));

CREATE POLICY "franquia_parametros_update"
  ON franquia_parametros FOR UPDATE
  TO authenticated
  USING (empresa_id = (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid() LIMIT 1
  ));

CREATE POLICY "franquia_parametros_delete"
  ON franquia_parametros FOR DELETE
  TO authenticated
  USING (empresa_id = (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid() LIMIT 1
  ));
