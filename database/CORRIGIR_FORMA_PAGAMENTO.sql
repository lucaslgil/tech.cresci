-- ============================================
-- CORRIGIR CONSTRAINT forma_pagamento
-- Aceitar todos os códigos válidos da NFe 4.0
-- ============================================

ALTER TABLE notas_fiscais 
DROP CONSTRAINT IF EXISTS notas_fiscais_forma_pagamento_check;

-- Códigos válidos da NFe 4.0:
-- 01 = Dinheiro
-- 02 = Cheque
-- 03 = Cartão de Crédito
-- 04 = Cartão de Débito
-- 05 = Crédito Loja
-- 10 = Vale Alimentação
-- 11 = Vale Refeição
-- 12 = Vale Presente
-- 13 = Vale Combustível
-- 15 = Boleto Bancário
-- 17 = Pagamento Instantâneo (PIX)
-- 18 = Transferência bancária, Carteira Digital
-- 19 = Programa de fidelidade, Cashback, Crédito Virtual
-- 90 = Sem pagamento
-- 99 = Outros

ALTER TABLE notas_fiscais 
ADD CONSTRAINT notas_fiscais_forma_pagamento_check 
CHECK (forma_pagamento IN ('01', '02', '03', '04', '05', '10', '11', '12', '13', '15', '17', '18', '19', '90', '99'));

-- Verificar
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'notas_fiscais'::regclass 
  AND conname LIKE '%forma_pagamento%';
