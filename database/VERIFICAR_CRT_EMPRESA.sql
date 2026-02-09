-- =====================================================
-- VERIFICAR CRT/REGIME DA EMPRESA
-- =====================================================

-- Verificar dados fiscais da empresa
SELECT 
  id,
  cnpj,
  razao_social,
  regime_tributario,
  crt,
  inscricao_estadual,
  emite_nfe
FROM empresas
WHERE cnpj = '43670056000166';

-- =====================================================
-- ATUALIZAR CRT PARA LUCRO PRESUMIDO
-- Execute apenas se o CRT estiver incorreto
-- =====================================================

-- DESCOMENTE as linhas abaixo para atualizar:

-- UPDATE empresas
-- SET 
--   regime_tributario = 'PRESUMIDO',
--   crt = '3'
-- WHERE cnpj = '43670056000166';

-- Verificar após atualização:
-- SELECT regime_tributario, crt FROM empresas WHERE cnpj = '43670056000166';
