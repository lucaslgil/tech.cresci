-- =====================================================
-- CORREÇÃO FORÇADA - Últimos 3 campos NUMERIC(5,4)
-- aliquota_ibs, aliquota_cbs, aliquota_iss
-- Data: 14/01/2026
-- =====================================================

-- Remover view temporariamente
DROP VIEW IF EXISTS vw_regras_tributacao_ordenadas CASCADE;

-- Forçar alteração dos 3 campos problemáticos
ALTER TABLE regras_tributacao 
  ALTER COLUMN aliquota_ibs TYPE NUMERIC(5,2);

ALTER TABLE regras_tributacao 
  ALTER COLUMN aliquota_cbs TYPE NUMERIC(5,2);

ALTER TABLE regras_tributacao 
  ALTER COLUMN aliquota_iss TYPE NUMERIC(5,2);

-- Recriar view
CREATE OR REPLACE VIEW vw_regras_tributacao_ordenadas AS
SELECT 
  rt.*,
  (CASE WHEN rt.ncm IS NOT NULL THEN 100 ELSE 0 END +
   CASE WHEN rt.categoria IS NOT NULL THEN 50 ELSE 0 END +
   CASE WHEN rt.cfop_saida IS NOT NULL THEN 25 ELSE 0 END +
   CASE WHEN rt.cfop_entrada IS NOT NULL THEN 25 ELSE 0 END +
   CASE WHEN rt.tipo_contribuinte IS NOT NULL THEN 10 ELSE 0 END) as prioridade_calculada
FROM regras_tributacao rt
WHERE rt.ativo = true
ORDER BY prioridade_calculada DESC, rt.created_at DESC;

-- Verificação final - NÃO DEVE APARECER NENHUM (5,4)
SELECT 
  column_name,
  CONCAT('NUMERIC(', numeric_precision, ',', numeric_scale, ')') as tipo
FROM information_schema.columns
WHERE table_name = 'regras_tributacao' 
  AND column_name IN ('aliquota_ibs', 'aliquota_cbs', 'aliquota_iss')
ORDER BY column_name;

-- Deve mostrar:
-- aliquota_cbs  | NUMERIC(5,2)
-- aliquota_ibs  | NUMERIC(5,2)
-- aliquota_iss  | NUMERIC(5,2)
