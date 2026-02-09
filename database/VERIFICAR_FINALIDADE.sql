-- ============================================
-- VERIFICAR E CORRIGIR CONSTRAINT finalidade
-- ============================================

-- 1. Ver a constraint atual
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'notas_fiscais'::regclass 
  AND conname LIKE '%finalidade%';

-- 2. REMOVER a constraint antiga
ALTER TABLE notas_fiscais 
DROP CONSTRAINT IF EXISTS notas_fiscais_finalidade_check;

-- 3. CRIAR constraint correta (aceitar os códigos NFe)
-- Códigos da NFe 4.0:
-- 1 = Normal
-- 2 = Complementar
-- 3 = Ajuste
-- 4 = Devolução
ALTER TABLE notas_fiscais 
ADD CONSTRAINT notas_fiscais_finalidade_check 
CHECK (finalidade IN ('1', '2', '3', '4'));

-- 4. Verificar
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'notas_fiscais'::regclass 
  AND conname LIKE '%finalidade%';
