-- ============================================
-- VERIFICAR CONSTRAINT forma_pagamento
-- ============================================

SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'notas_fiscais'::regclass 
  AND conname LIKE '%forma_pagamento%';
