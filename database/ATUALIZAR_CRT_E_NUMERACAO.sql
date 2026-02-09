-- =====================================================
-- ATUALIZAR GESTÃO DE NUMERAÇÃO NFE
-- =====================================================

-- 1. Atualizar CRT para Lucro Presumido
UPDATE empresas
SET 
  regime_tributario = 'PRESUMIDO',
  crt = '3'
WHERE cnpj = '43670056000166';

-- 2. Resetar numeração para 1 (a nota rejeitada vai usar o número 1 novamente)
UPDATE empresas
SET ultimo_numero_nfe = 0  -- Próximo será 1
WHERE cnpj = '43670056000166';

-- 3. Verificar resultado
SELECT 
  cnpj,
  razao_social,
  regime_tributario,
  crt,
  ultimo_numero_nfe,
  serie_nfe
FROM empresas
WHERE cnpj = '43670056000166';

-- =====================================================
-- NOTA IMPORTANTE:
-- - A nota rejeitada ficará como histórico
-- - Ao editar e retransmitir, usará o MESMO número (1)
-- - Só incrementa após AUTORIZAÇÃO bem-sucedida
-- =====================================================
