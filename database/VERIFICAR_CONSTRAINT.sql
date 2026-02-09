-- ============================================
-- VERIFICAR E CORRIGIR CONSTRAINT destinatario_tipo
-- ============================================

-- 1. Ver a constraint atual
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'notas_fiscais'::regclass 
  AND conname LIKE '%destinatario_tipo%';

-- 2. REMOVER a constraint antiga (se existir)
ALTER TABLE notas_fiscais 
DROP CONSTRAINT IF EXISTS notas_fiscais_destinatario_tipo_check;

-- 3. CRIAR constraint correta (aceitar 'F' e 'J')
ALTER TABLE notas_fiscais 
ADD CONSTRAINT notas_fiscais_destinatario_tipo_check 
CHECK (destinatario_tipo IN ('F', 'J'));

-- 4. Verificar se funcionou
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'notas_fiscais'::regclass 
  AND conname LIKE '%destinatario_tipo%';

-- Resultado esperado:
-- CHECK (destinatario_tipo IN ('F', 'J'))
