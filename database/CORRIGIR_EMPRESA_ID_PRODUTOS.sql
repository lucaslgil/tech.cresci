-- =====================================================
-- CORRIGIR EMPRESA_ID DOS PRODUTOS
-- =====================================================

-- PASSO 1: DIAGNOSTICAR - Ver quais empresas têm produtos
SELECT 
  empresa_id,
  COUNT(*) as total_produtos,
  MIN(codigo) as primeiro_codigo,
  MAX(codigo) as ultimo_codigo
FROM produtos
GROUP BY empresa_id
ORDER BY empresa_id;

-- PASSO 2: Ver detalhes das empresas cadastradas
SELECT 
  id,
  codigo,
  nome_fantasia,
  razao_social
FROM empresas
ORDER BY id;

-- =====================================================
-- SOLUÇÃO 1: TRANSFERIR TODOS OS PRODUTOS PARA EMPRESA 4
-- (Execute esta opção se todos os produtos devem pertencer à empresa 4)
-- =====================================================

-- Atualizar produtos da empresa 1 para empresa 4
UPDATE produtos 
SET empresa_id = 4 
WHERE empresa_id = 1;

-- Verificar resultado
SELECT 
  empresa_id,
  COUNT(*) as total_produtos
FROM produtos
GROUP BY empresa_id;

-- =====================================================
-- SOLUÇÃO 2: DUPLICAR PRODUTOS PARA EMPRESA 4
-- (Execute esta opção se quiser manter produtos em ambas empresas)
-- =====================================================

-- Inserir cópias dos produtos da empresa 1 na empresa 4
-- INSERT INTO produtos (
--   empresa_id, codigo, descricao, unidade, preco_venda, estoque_atual,
--   ean13, ncm, cfop, cest, origem_mercadoria, ativo, 
--   created_at, updated_at, usuario_cadastro, usuario_atualizacao
-- )
-- SELECT 
--   4 as empresa_id,
--   codigo, descricao, unidade, preco_venda, 0 as estoque_atual,
--   ean13, ncm, cfop, cest, origem_mercadoria, ativo,
--   created_at, NOW() as updated_at, usuario_cadastro, usuario_atualizacao
-- FROM produtos
-- WHERE empresa_id = 1
-- ON CONFLICT (empresa_id, codigo) DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Confirmar que empresa 4 tem produtos
SELECT COUNT(*) as produtos_empresa_4
FROM produtos
WHERE empresa_id = 4 AND ativo = true;

-- Ver alguns produtos da empresa 4
SELECT id, codigo, descricao, preco_venda, ativo
FROM produtos
WHERE empresa_id = 4
LIMIT 10;

-- =====================================================
-- IMPORTANTE: 
-- Após executar este SQL, no PDV:
-- 1. Clique em Sincronizar novamente
-- 2. Os produtos devem aparecer normalmente
-- =====================================================
