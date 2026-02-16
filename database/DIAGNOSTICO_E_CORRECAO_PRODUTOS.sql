-- =====================================================
-- DIAGNÓSTICO: Por que nenhum produto foi migrado?
-- =====================================================

-- 1. Ver estrutura da tabela produtos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'produtos' 
ORDER BY ordinal_position;

-- 2. Contar produtos por status
SELECT 
  ativo,
  COUNT(*) as total,
  COUNT(CASE WHEN nome IS NULL OR TRIM(nome) = '' THEN 1 END) as sem_nome
FROM produtos
GROUP BY ativo;

-- 3. Ver primeiros 10 produtos (independente do status)
SELECT id, codigo_interno, nome, ativo, preco_venda, estoque_atual, empresa_id
FROM produtos
LIMIT 10;

-- =====================================================
-- CORREÇÃO: Migrar TODOS os produtos (ativos e inativos)
-- =====================================================

-- Limpar dados anteriores se necessário
-- TRUNCATE TABLE empresa_produtos CASCADE;
-- TRUNCATE TABLE produtos_catalogo CASCADE;

-- Inserir produtos no catálogo (TODOS, não só ativos)
INSERT INTO produtos_catalogo (
  codigo, 
  descricao, 
  unidade, 
  ativo
)
SELECT DISTINCT ON (p.nome)
  COALESCE(p.codigo_interno, 'PROD-' || substring(p.id::TEXT, 1, 8)) as codigo,
  p.nome as descricao,
  COALESCE(p.unidade_medida, 'UN') as unidade,
  true as ativo -- Forçar todos como ativos no catálogo
FROM produtos p
WHERE p.nome IS NOT NULL 
  AND TRIM(p.nome) != ''
ORDER BY p.nome, p.created_at
ON CONFLICT (codigo) DO NOTHING;

-- Ver quantos foram inseridos
SELECT COUNT(*) as total_catalogo FROM produtos_catalogo;

-- Criar vínculos empresa-produto (TODOS os produtos)
INSERT INTO empresa_produtos (
  empresa_id, 
  produto_catalogo_id, 
  preco_venda, 
  estoque_atual,
  ativo,
  usuario_cadastro
)
SELECT 
  p.empresa_id,
  pc.id as produto_catalogo_id,
  COALESCE(p.preco_venda, 0) as preco_venda,
  COALESCE(p.estoque_atual, 0) as estoque_atual,
  COALESCE(p.ativo, true) as ativo,
  p.usuario_cadastro::TEXT
FROM produtos p
INNER JOIN produtos_catalogo pc ON pc.descricao = p.nome
WHERE p.nome IS NOT NULL
  AND TRIM(p.nome) != ''
ON CONFLICT (empresa_id, produto_catalogo_id) DO UPDATE
SET 
  preco_venda = EXCLUDED.preco_venda,
  estoque_atual = EXCLUDED.estoque_atual,
  ativo = EXCLUDED.ativo,
  updated_at = NOW();

-- Ver quantos vínculos foram criados
SELECT 
  empresa_id,
  COUNT(id) as total_produtos
FROM empresa_produtos
GROUP BY empresa_id
ORDER BY empresa_id;

-- Ver produtos da empresa 4 (para o PDV)
SELECT 
  pc.codigo,
  pc.descricao,
  ep.preco_venda,
  ep.estoque_atual,
  ep.ativo
FROM empresa_produtos ep
INNER JOIN produtos_catalogo pc ON pc.id = ep.produto_catalogo_id
WHERE ep.empresa_id = 4
ORDER BY pc.descricao
LIMIT 10;
