-- =====================================================
-- MIGRAÇÃO: Campos de sincronização Solutto em contas_receber
-- Data: 17/04/2026
-- =====================================================
-- Adiciona colunas para rastrear registros sincronizados
-- via webservice Solutto (Retorna_Contas_Receber_Por_Cliente_V1).
-- =====================================================

-- 1. Adicionar campo de origem (MANUAL ou SOLUTTO)
ALTER TABLE contas_receber
  ADD COLUMN IF NOT EXISTS origem TEXT NOT NULL DEFAULT 'MANUAL'
    CHECK (origem IN ('MANUAL', 'SOLUTTO'));

-- 2. Adicionar ID único da Solutto (para evitar duplicatas na re-sincronização)
ALTER TABLE contas_receber
  ADD COLUMN IF NOT EXISTS solutto_id BIGINT;

-- 3. Adicionar timestamp da última sincronização
ALTER TABLE contas_receber
  ADD COLUMN IF NOT EXISTS solutto_sincronizado_em TIMESTAMPTZ;

-- 4. Adicionar JSON com dados brutos da Solutto (para auditoria / campos extras)
ALTER TABLE contas_receber
  ADD COLUMN IF NOT EXISTS solutto_dados_extras JSONB;

-- 5. Índice único para evitar duplicatas por solutto_id + empresa_id
--    (empresa_id pode não existir na tabela — se não existir, use somente solutto_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contas_receber' AND column_name = 'empresa_id'
  ) THEN
    -- Tabela tem empresa_id: índice composto
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'contas_receber'
        AND indexname = 'uq_contas_receber_solutto_id_empresa'
    ) THEN
      CREATE UNIQUE INDEX uq_contas_receber_solutto_id_empresa
        ON contas_receber (solutto_id, empresa_id)
        WHERE solutto_id IS NOT NULL;
    END IF;
  ELSE
    -- Sem empresa_id: índice simples
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'contas_receber'
        AND indexname = 'uq_contas_receber_solutto_id'
    ) THEN
      CREATE UNIQUE INDEX uq_contas_receber_solutto_id
        ON contas_receber (solutto_id)
        WHERE solutto_id IS NOT NULL;
    END IF;
  END IF;
END;
$$;

-- 6. Comentários explicativos
COMMENT ON COLUMN contas_receber.origem                  IS 'Origem do registro: MANUAL (criado na plataforma) ou SOLUTTO (sincronizado via webservice)';
COMMENT ON COLUMN contas_receber.solutto_id              IS 'ID interno do registro no sistema Solutto (usado para evitar duplicatas na re-sincronização)';
COMMENT ON COLUMN contas_receber.solutto_sincronizado_em IS 'Timestamp da última sincronização com a Solutto';
COMMENT ON COLUMN contas_receber.solutto_dados_extras    IS 'Campos brutos retornados pela Solutto que não têm mapeamento direto (para auditoria)';
