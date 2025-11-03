-- ========================================
-- GUIA RÁPIDO: APLICAR HISTÓRICO DE VINCULAÇÕES
-- ========================================
-- Execute este script no SQL Editor do Supabase
-- Data: 03/11/2025
-- ========================================

-- PASSO 1: Criar a tabela de histórico
-- Copie e execute o conteúdo do arquivo:
-- database/criar_historico_vinculacao_itens.sql

-- PASSO 2: Verificar se a tabela foi criada
SELECT 
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_name = 'historico_vinculacao_itens';

-- Resultado esperado: 1 linha com table_name = 'historico_vinculacao_itens'

-- PASSO 3: Verificar colunas criadas
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'historico_vinculacao_itens'
ORDER BY ordinal_position;

-- PASSO 4: Verificar índices criados
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'historico_vinculacao_itens';

-- Devem existir 4 índices:
-- - idx_historico_vinculacao_colaborador
-- - idx_historico_vinculacao_item
-- - idx_historico_vinculacao_data
-- - idx_historico_vinculacao_acao

-- PASSO 5: Verificar políticas RLS
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'historico_vinculacao_itens';

-- Devem existir 4 políticas (SELECT, INSERT, UPDATE, DELETE)

-- PASSO 6 (OPCIONAL): Migrar dados existentes
-- Se você já tem itens vinculados e quer criar histórico retroativo:

INSERT INTO historico_vinculacao_itens (
  colaborador_id,
  item_id,
  acao,
  usuario_acao,
  item_codigo,
  item_nome,
  item_modelo,
  item_categoria,
  item_numero_serie,
  item_valor,
  colaborador_nome,
  colaborador_cpf_cnpj,
  colaborador_cargo,
  colaborador_setor
)
SELECT 
  i.responsavel_id,
  i.id,
  'vinculado'::VARCHAR(20),
  'Sistema - Migração Automática',
  i.codigo,
  i.item,
  i.modelo,
  i.categoria,
  i.numero_serie,
  i.valor,
  c.nome,
  COALESCE(c.cpf, c.cnpj),
  c.cargo,
  c.setor
FROM itens i
INNER JOIN colaboradores c ON i.responsavel_id = c.id
WHERE i.responsavel_id IS NOT NULL;

-- Verificar quantos registros foram criados
SELECT COUNT(*) as total_migrado
FROM historico_vinculacao_itens
WHERE usuario_acao = 'Sistema - Migração Automática';

-- PASSO 7: Testar inserção manual
-- Teste inserir um registro de exemplo:
INSERT INTO historico_vinculacao_itens (
  colaborador_id,
  item_id,
  acao,
  usuario_acao,
  item_codigo,
  item_nome,
  item_valor,
  colaborador_nome
)
VALUES (
  (SELECT id FROM colaboradores LIMIT 1),
  (SELECT id FROM itens LIMIT 1),
  'vinculado',
  'teste@empresa.com',
  'TEST-001',
  'Item de Teste',
  100.00,
  'Teste Usuario'
);

-- Verificar se foi inserido
SELECT * FROM historico_vinculacao_itens 
WHERE usuario_acao = 'teste@empresa.com'
ORDER BY created_at DESC
LIMIT 1;

-- PASSO 8: Testar consulta de histórico por colaborador
SELECT 
  acao,
  data_acao,
  item_codigo,
  item_nome,
  item_valor,
  usuario_acao
FROM historico_vinculacao_itens
WHERE colaborador_id = (SELECT id FROM colaboradores LIMIT 1)
ORDER BY data_acao DESC;

-- PASSO 9: Estatísticas gerais
SELECT 
  acao,
  COUNT(*) as quantidade,
  SUM(item_valor) as valor_total
FROM historico_vinculacao_itens
GROUP BY acao;

-- PASSO 10: Limpar registros de teste (OPCIONAL)
-- Se você criou o registro de teste, pode deletá-lo:
-- DELETE FROM historico_vinculacao_itens 
-- WHERE usuario_acao = 'teste@empresa.com';

-- ========================================
-- ✅ VERIFICAÇÃO FINAL
-- ========================================
-- Execute esta query para ver um resumo completo:

SELECT 
  'Tabela criada' as status,
  COUNT(*) as total_registros,
  COUNT(DISTINCT colaborador_id) as colaboradores_com_historico,
  COUNT(DISTINCT item_id) as itens_com_historico,
  MIN(data_acao) as primeira_acao,
  MAX(data_acao) as ultima_acao
FROM historico_vinculacao_itens;

-- ========================================
-- 🎉 PRONTO!
-- ========================================
-- Após executar este script, abra o sistema:
-- http://localhost:5173/cadastro/colaborador
-- 
-- Clique no ícone 📦 de qualquer colaborador
-- Vá para a aba "Histórico"
-- ========================================
