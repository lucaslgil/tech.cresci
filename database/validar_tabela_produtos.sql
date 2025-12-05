-- =====================================================
-- SCRIPT DE VALIDAÇÃO - MÓDULO DE PRODUTOS
-- Execute este script no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. Verificar se a tabela produtos existe
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('produtos', 'produtos_movimentacoes', 'produtos_precos_historico');

-- 2. Verificar colunas da tabela produtos
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'produtos'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar índices
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'produtos'
  AND schemaname = 'public';

-- 4. Verificar triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'produtos'
  AND trigger_schema = 'public';

-- 5. Verificar policies (RLS)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('produtos', 'produtos_movimentacoes', 'produtos_precos_historico');

-- 6. Verificar view
SELECT 
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'vw_produtos_estoque';

-- 7. Inserir produto de teste
INSERT INTO produtos (
  codigo_interno,
  nome,
  ncm,
  unidade_medida,
  preco_venda,
  estoque_atual,
  ativo,
  regime_tributario,
  csosn_icms,
  categoria
) VALUES (
  'TESTE-001',
  'Produto de Teste',
  '12345678',
  'UN',
  100.00,
  10,
  true,
  'SIMPLES',
  '102',
  'Teste'
) RETURNING *;

-- 8. Consultar produtos
SELECT * FROM produtos;

-- 9. Consultar view com status de estoque
SELECT * FROM vw_produtos_estoque;

-- 10. Deletar produto de teste
DELETE FROM produtos WHERE codigo_interno = 'TESTE-001';
