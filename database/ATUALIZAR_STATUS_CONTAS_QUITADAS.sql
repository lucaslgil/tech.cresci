-- =====================================================
-- SCRIPT: ATUALIZAR STATUS DAS CONTAS EXISTENTES
-- Objetivo: Marcar contas à vista como QUITADA
-- Data: 12/12/2025
-- =====================================================

-- 1. Verificar contas que serão atualizadas (visualizar antes de executar)
SELECT 
  id,
  descricao,
  forma_pagamento,
  status,
  valor_original,
  data_vencimento
FROM contas_receber
WHERE forma_pagamento IN ('Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito')
  AND status = 'ABERTO'
ORDER BY created_at DESC;

-- 2. Atualizar contas à vista para status QUITADA
UPDATE contas_receber
SET 
  status = 'QUITADA',
  valor_pago = valor_original,
  valor_saldo = 0,
  data_pagamento = data_emissao,
  updated_at = NOW()
WHERE forma_pagamento IN ('Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito')
  AND status = 'ABERTO';

-- 3. Verificar resultado
SELECT 
  forma_pagamento,
  status,
  COUNT(*) as quantidade,
  SUM(valor_original) as total
FROM contas_receber
GROUP BY forma_pagamento, status
ORDER BY forma_pagamento, status;

-- 4. Resumo geral
SELECT 
  'QUITADA' as status, COUNT(*) as quantidade, SUM(valor_original) as total
FROM contas_receber
WHERE status = 'QUITADA'
UNION ALL
SELECT 
  'ABERTO' as status, COUNT(*) as quantidade, SUM(valor_original) as total
FROM contas_receber
WHERE status = 'ABERTO'
UNION ALL
SELECT 
  'PAGO' as status, COUNT(*) as quantidade, SUM(valor_original) as total
FROM contas_receber
WHERE status = 'PAGO';
