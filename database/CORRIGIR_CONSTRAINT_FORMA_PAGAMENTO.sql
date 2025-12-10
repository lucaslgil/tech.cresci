-- =====================================================
-- CORREÇÃO: Remover constraint forma_pagamento na tabela vendas
-- As formas de pagamento devem vir da tabela cadastrada em Parâmetros Financeiros
-- Data: 08/12/2025
-- =====================================================

-- Remover constraint que impede usar formas de pagamento personalizadas
ALTER TABLE vendas 
DROP CONSTRAINT IF EXISTS vendas_forma_pagamento_check;

-- Verificar se a constraint foi removida
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'vendas'::regclass
  AND conname LIKE '%forma_pagamento%';
