-- =====================================================
-- ADICIONAR CAMPOS IBS/CBS - Regras de Tributação
-- Reforma Tributária 2026
-- Data: 14/01/2026
-- =====================================================

-- PARTE 1: Adicionar campos IBS/CBS se não existirem
ALTER TABLE regras_tributacao
  ADD COLUMN IF NOT EXISTS cst_ibs VARCHAR(3),
  ADD COLUMN IF NOT EXISTS aliquota_ibs NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS reducao_bc_ibs NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS diferimento_ibs NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS mensagem_nf_ibs TEXT,
  
  ADD COLUMN IF NOT EXISTS cst_cbs VARCHAR(3),
  ADD COLUMN IF NOT EXISTS aliquota_cbs NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS reducao_bc_cbs NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS diferimento_cbs NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS mensagem_nf_cbs TEXT,
  
  ADD COLUMN IF NOT EXISTS ano_vigencia INTEGER DEFAULT 2026,
  ADD COLUMN IF NOT EXISTS percentual_cronograma_ibs NUMERIC(5,2) DEFAULT 27.00,
  ADD COLUMN IF NOT EXISTS percentual_cronograma_cbs NUMERIC(5,2) DEFAULT 12.00;

-- PARTE 2: Comentários explicativos
COMMENT ON COLUMN regras_tributacao.cst_ibs IS 'Código de Situação Tributária do IBS (00=Tributado, 10=Redução BC, 20=Diferimento, 30=Isento, 40=Não Tributado, 41=Suspenso)';
COMMENT ON COLUMN regras_tributacao.cst_cbs IS 'Código de Situação Tributária da CBS (mesmos códigos do IBS)';
COMMENT ON COLUMN regras_tributacao.aliquota_ibs IS 'Alíquota do IBS em % (padrão futur 26.5%)';
COMMENT ON COLUMN regras_tributacao.aliquota_cbs IS 'Alíquota da CBS em % (padrão futuro 8.8%)';
COMMENT ON COLUMN regras_tributacao.ano_vigencia IS 'Ano de vigência da regra (2026 a 2033)';
COMMENT ON COLUMN regras_tributacao.percentual_cronograma_ibs IS 'Percentual do cronograma transitório do IBS para este ano';
COMMENT ON COLUMN regras_tributacao.percentual_cronograma_cbs IS 'Percentual do cronograma transitório da CBS para este ano';

-- PARTE 3: Índices para performance
CREATE INDEX IF NOT EXISTS idx_regras_tributacao_ano_vigencia ON regras_tributacao(ano_vigencia);
CREATE INDEX IF NOT EXISTS idx_regras_tributacao_cst_ibs ON regras_tributacao(cst_ibs) WHERE cst_ibs IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_regras_tributacao_cst_cbs ON regras_tributacao(cst_cbs) WHERE cst_cbs IS NOT NULL;

-- PARTE 4: Verificação
SELECT 
  column_name, 
  data_type, 
  character_maximum_length,
  numeric_precision, 
  numeric_scale
FROM information_schema.columns
WHERE table_name = 'regras_tributacao' 
  AND column_name IN ('cst_ibs', 'cst_cbs', 'aliquota_ibs', 'aliquota_cbs', 'reducao_bc_ibs', 'reducao_bc_cbs')
ORDER BY column_name;
