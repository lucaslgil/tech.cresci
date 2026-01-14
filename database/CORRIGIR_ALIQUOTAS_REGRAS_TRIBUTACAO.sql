-- =====================================================
-- CORREÇÃO: Campos de Alíquotas - Regras de Tributação
-- PROBLEMA: NUMERIC(5,4) aceita apenas até 9.9999
-- SOLUÇÃO: Alterar para NUMERIC(5,2) - aceita até 999.99
-- Data: 14/01/2026
-- =====================================================

-- PARTE 1: Remover a view que depende da tabela
DROP VIEW IF EXISTS vw_regras_tributacao_ordenadas CASCADE;

-- PARTE 2: Adicionar campos IBS/CBS se não existirem
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
  ADD COLUMN IF NOT EXISTS mensagem_nf_cbs TEXT;

-- PARTE 3: Alterar precision dos campos de alíquota existentes

-- ICMS Operação Própria
ALTER TABLE regras_tributacao 
  ALTER COLUMN aliquota_icms_proprio TYPE NUMERIC(5,2),
  ALTER COLUMN aliquota_fcp TYPE NUMERIC(5,2),
  ALTER COLUMN reducao_bc_icms_proprio TYPE NUMERIC(5,2);

-- ICMS ST
ALTER TABLE regras_tributacao 
  ALTER COLUMN aliquota_icms_st TYPE NUMERIC(5,2),
  ALTER COLUMN aliquota_fcp_st TYPE NUMERIC(5,2),
  ALTER COLUMN reducao_bc_st TYPE NUMERIC(5,2);

-- ICMS DIFAL
ALTER TABLE regras_tributacao 
  ALTER COLUMN aliquota_interestadual TYPE NUMERIC(5,2),
  ALTER COLUMN aliquota_uf_destino TYPE NUMERIC(5,2),
  ALTER COLUMN aliquota_fcp_uf_destino TYPE NUMERIC(5,2);

-- Desoneração
ALTER TABLE regras_tributacao 
  ALTER COLUMN aliquota_desoneracao TYPE NUMERIC(5,2);

-- PIS/COFINS
ALTER TABLE regras_tributacao 
  ALTER COLUMN aliquota_pis TYPE NUMERIC(5,2),
  ALTER COLUMN reducao_bc_pis TYPE NUMERIC(5,2),
  ALTER COLUMN aliquota_cofins TYPE NUMERIC(5,2),
  ALTER COLUMN reducao_bc_cofins TYPE NUMERIC(5,2);

-- IPI
ALTER TABLE regras_tributacao 
  ALTER COLUMN aliquota_ipi TYPE NUMERIC(5,2),
  ALTER COLUMN reducao_bc_ipi TYPE NUMERIC(5,2);

-- Outras retenções
ALTER TABLE regras_tributacao 
  ALTER COLUMN aliquota_csll TYPE NUMERIC(5,2),
  ALTER COLUMN aliquota_ir TYPE NUMERIC(5,2),
  ALTER COLUMN aliquota_inss TYPE NUMERIC(5,2),
  ALTER COLUMN aliquota_outras_retencoes TYPE NUMERIC(5,2);

-- PARTE 4: Recriar a view
CREATE OR REPLACE VIEW vw_regras_tributacao_ordenadas AS
SELECT 
  rt.*,
  -- Calcula prioridade: mais específico = maior prioridade
  (CASE WHEN rt.ncm IS NOT NULL THEN 100 ELSE 0 END +
   CASE WHEN rt.categoria IS NOT NULL THEN 50 ELSE 0 END +
   CASE WHEN rt.cfop_saida IS NOT NULL THEN 25 ELSE 0 END +
   CASE WHEN rt.cfop_entrada IS NOT NULL THEN 25 ELSE 0 END +
   CASE WHEN rt.tipo_contribuinte IS NOT NULL THEN 10 ELSE 0 END) as prioridade_calculada
FROM regras_tributacao rt
WHERE rt.ativo = true
ORDER BY prioridade_calculada DESC, rt.created_at DESC;

-- PARTE 5: Verificação
SELECT 
  column_name, 
  data_type, 
  numeric_precision, 
  numeric_scale
FROM information_schema.columns
WHERE table_name = 'regras_tributacao' 
  AND column_name LIKE '%aliquota%'
ORDER BY column_name;

COMMENT ON TABLE regras_tributacao IS 'Tabela corrigida em 14/01/2026 - Alíquotas NUMERIC(5,2) para aceitar valores até 999.99%';
