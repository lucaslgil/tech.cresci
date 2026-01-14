-- =====================================================
-- VERIFICAR ESTRUTURA ATUAL DA TABELA PRODUTOS
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'produtos'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICAR SE AS NOVAS COLUNAS JÁ EXISTEM
-- =====================================================

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'aliquota_ibs') 
    THEN 'aliquota_ibs: JÁ EXISTE' 
    ELSE 'aliquota_ibs: NÃO EXISTE' 
  END as coluna_ibs,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'aliquota_cbs') 
    THEN 'aliquota_cbs: JÁ EXISTE' 
    ELSE 'aliquota_cbs: NÃO EXISTE' 
  END as coluna_cbs,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'regime_transicao') 
    THEN 'regime_transicao: JÁ EXISTE' 
    ELSE 'regime_transicao: NÃO EXISTE' 
  END as coluna_regime;
