-- =====================================================
-- SOLUÇÃO RÁPIDA: VINCULAR PRODUTOS EXISTENTES À EMPRESA 4
-- (Usar enquanto não implementa arquitetura completa)
-- =====================================================

-- DIAGNÓSTICO: Ver estrutura atual da tabela produtos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'produtos' 
ORDER BY ordinal_position;

-- Ver produtos por empresa
SELECT 
  empresa_id,
  COUNT(*) as total,
  COUNT(CASE WHEN ativo = true THEN 1 END) as ativos
FROM produtos
GROUP BY empresa_id;

-- =====================================================
-- SOLUÇÃO TEMPORÁRIA: COMPARTILHAR PRODUTOS
-- =====================================================

-- Opção A: Copiar produtos da empresa 1 para empresa 4 (mantém separado)
INSERT INTO produtos (
  empresa_id, descricao, unidade, preco_venda, estoque_atual,
  ean13, ncm, cfop, cest, origem_mercadoria, ativo,
  created_at, updated_at, usuario_cadastro
)
SELECT 
  4 as empresa_id,
  descricao, 
  unidade, 
  preco_venda, 
  0 as estoque_atual, -- Zerar estoque para empresa 4
  ean13, 
  ncm, 
  cfop, 
  cest, 
  origem_mercadoria, 
  ativo,
  NOW() as created_at,
  NOW() as updated_at,
  usuario_cadastro
FROM produtos
WHERE empresa_id != 4 AND ativo = true
ON CONFLICT DO NOTHING;

-- Verificar resultado
SELECT 
  empresa_id,
  COUNT(*) as total_produtos
FROM produtos
WHERE ativo = true
GROUP BY empresa_id;

-- Ver alguns produtos da empresa 4
SELECT id, descricao, preco_venda, estoque_atual, ativo
FROM produtos
WHERE empresa_id = 4 AND ativo = true
LIMIT 5;

-- =====================================================
-- APÓS EXECUTAR: Sincronizar no PDV
-- =====================================================
