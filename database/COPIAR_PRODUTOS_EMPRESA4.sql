-- =====================================================
-- COPIAR PRODUTOS DA EMPRESA 1 PARA EMPRESA 4
-- =====================================================

-- Copiar produtos da empresa 1 para empresa 4
INSERT INTO produtos (
  empresa_id,
  codigo_interno,
  codigo_barras,
  nome,
  descricao,
  categoria,
  unidade_medida,
  ncm,
  cest,
  cfop_entrada,
  cfop_saida,
  origem_mercadoria,
  preco_custo,
  preco_venda,
  estoque_minimo,
  estoque_atual,
  ativo,
  usuario_cadastro,
  data_cadastro
)
SELECT 
  4 as empresa_id, -- Empresa 4 (PDV)
  codigo_interno,
  codigo_barras,
  nome,
  descricao,
  categoria,
  unidade_medida,
  ncm,
  cest,
  cfop_entrada,
  cfop_saida,
  origem_mercadoria,
  preco_custo,
  preco_venda,
  estoque_minimo,
  0 as estoque_atual, -- Zerar estoque para empresa 4
  ativo,
  usuario_cadastro,
  NOW() as data_cadastro
FROM produtos
WHERE empresa_id = 1
  AND ativo = true;

-- Verificar resultado
SELECT COUNT(*) as total 
FROM produtos 
WHERE empresa_id = 4;

-- Ver produtos da empresa 4
SELECT 
  codigo_interno,
  nome,
  preco_venda,
  estoque_atual,
  unidade_medida,
  ativo
FROM produtos
WHERE empresa_id = 4 AND ativo = true
ORDER BY nome
LIMIT 10;
