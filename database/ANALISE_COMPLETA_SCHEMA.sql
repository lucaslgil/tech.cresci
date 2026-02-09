-- ============================================
-- ANÁLISE COMPLETA DO SCHEMA - VERIFICAR TUDO
-- ============================================

-- 1. VERIFICAR SE TABELA itens_nota_fiscal EXISTE
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'itens_nota_fiscal'
) as tabela_itens_existe;

-- 2. LISTAR TODAS AS TABELAS RELACIONADAS A NOTAS
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%nota%'
ORDER BY table_name;

-- 3. ESTRUTURA COMPLETA DA TABELA notas_fiscais
SELECT 
  column_name, 
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notas_fiscais' 
ORDER BY ordinal_position;

-- 4. TODAS AS CONSTRAINTS DA TABELA notas_fiscais
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'notas_fiscais'::regclass
ORDER BY conname;

-- 5. SE EXISTIR, ESTRUTURA DA TABELA DE ITENS
SELECT 
  column_name, 
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('itens_nota_fiscal', 'itens_notas_fiscais', 'nota_fiscal_itens', 'nfe_itens')
ORDER BY table_name, ordinal_position;
