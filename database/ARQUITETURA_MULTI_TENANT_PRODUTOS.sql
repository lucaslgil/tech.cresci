-- =====================================================
-- ARQUITETURA MULTI-TENANT PARA PRODUTOS
-- Melhor Prática: Produtos Compartilhados com Vínculo
-- =====================================================

-- CONCEITO:
-- 1. Tabela 'produtos_catalogo' = Catálogo centralizado de produtos
-- 2. Tabela 'empresa_produtos' = Vincula produto a empresas + dados específicos
-- 3. Permite: Um produto em múltiplas empresas com preços/estoque diferentes

-- =====================================================
-- PASSO 1: CRIAR TABELA DE CATÁLOGO CENTRALIZADO
-- =====================================================

CREATE TABLE IF NOT EXISTS produtos_catalogo (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  descricao TEXT NOT NULL,
  descricao_detalhada TEXT,
  unidade TEXT DEFAULT 'UN',
  
  -- Dados fiscais (compartilhados)
  ean13 TEXT,
  ncm TEXT,
  cest TEXT,
  origem_mercadoria TEXT DEFAULT '0',
  
  -- Controle
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_produtos_catalogo_codigo ON produtos_catalogo(codigo);
CREATE INDEX idx_produtos_catalogo_ean13 ON produtos_catalogo(ean13);
CREATE INDEX idx_produtos_catalogo_ativo ON produtos_catalogo(ativo);

-- =====================================================
-- PASSO 2: CRIAR TABELA DE VÍNCULO EMPRESA-PRODUTO
-- =====================================================

CREATE TABLE IF NOT EXISTS empresa_produtos (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  produto_catalogo_id BIGINT NOT NULL REFERENCES produtos_catalogo(id) ON DELETE CASCADE,
  
  -- Dados específicos da empresa
  preco_custo DECIMAL(15,2) DEFAULT 0,
  preco_venda DECIMAL(15,2) NOT NULL,
  estoque_atual DECIMAL(15,3) DEFAULT 0,
  estoque_minimo DECIMAL(15,3) DEFAULT 0,
  estoque_maximo DECIMAL(15,3) DEFAULT 0,
  
  -- CFOP pode variar por empresa (ex: dentro/fora do estado)
  cfop TEXT,
  
  -- Controle
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  usuario_cadastro TEXT,
  usuario_atualizacao TEXT,
  
  -- Garante que um produto só pode ser vinculado uma vez por empresa
  UNIQUE(empresa_id, produto_catalogo_id)
);

CREATE INDEX idx_empresa_produtos_empresa ON empresa_produtos(empresa_id);
CREATE INDEX idx_empresa_produtos_produto ON empresa_produtos(produto_catalogo_id);
CREATE INDEX idx_empresa_produtos_ativo ON empresa_produtos(empresa_id, ativo);

-- =====================================================
-- PASSO 3: MIGRAR DADOS EXISTENTES DA TABELA PRODUTOS
-- =====================================================

-- 3.1: Inserir produtos únicos no catálogo (apenas campos essenciais)
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
  p.ativo
FROM produtos p
WHERE p.ativo = true 
  AND p.nome IS NOT NULL 
  AND TRIM(p.nome) != ''
ORDER BY p.nome, p.created_at
ON CONFLICT (codigo) DO NOTHING;

-- 3.2: Criar vínculos empresa-produto
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
  p.ativo,
  p.usuario_cadastro::TEXT
FROM produtos p
INNER JOIN produtos_catalogo pc ON pc.descricao = p.nome
WHERE p.ativo = true 
  AND p.nome IS NOT NULL
  AND TRIM(p.nome) != ''
ON CONFLICT (empresa_id, produto_catalogo_id) DO UPDATE
SET 
  preco_venda = EXCLUDED.preco_venda,
  estoque_atual = EXCLUDED.estoque_atual,
  updated_at = NOW();

-- =====================================================
-- PASSO 4: CRIAR VIEW PARA MANTER COMPATIBILIDADE
-- =====================================================

-- View que simula a estrutura antiga (para não quebrar queries existentes)
CREATE OR REPLACE VIEW produtos_view AS
SELECT 
  ep.id,
  ep.empresa_id,
  pc.codigo,
  pc.descricao,
  pc.unidade,
  ep.preco_venda,
  ep.estoque_atual,
  pc.ean13,
  pc.ncm,
  ep.cfop,
  pc.cest,
  pc.origem_mercadoria,
  ep.ativo,
  ep.created_at,
  ep.updated_at
FROM empresa_produtos ep
INNER JOIN produtos_catalogo pc ON pc.id = ep.produto_catalogo_id;

-- =====================================================
-- PASSO 5: POLÍTICAS RLS PARA SEGURANÇA
-- =====================================================

-- RLS para produtos_catalogo (todos podem ler)
ALTER TABLE produtos_catalogo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catalogo_select_public ON produtos_catalogo;
CREATE POLICY catalogo_select_public
ON produtos_catalogo
FOR SELECT
TO public
USING (ativo = true);

DROP POLICY IF EXISTS catalogo_all_authenticated ON produtos_catalogo;
CREATE POLICY catalogo_all_authenticated
ON produtos_catalogo
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS para empresa_produtos (por empresa)
ALTER TABLE empresa_produtos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS empresa_produtos_select_public ON empresa_produtos;
CREATE POLICY empresa_produtos_select_public
ON empresa_produtos
FOR SELECT
TO public
USING (ativo = true);

DROP POLICY IF EXISTS empresa_produtos_all_authenticated ON empresa_produtos;
CREATE POLICY empresa_produtos_all_authenticated
ON empresa_produtos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- PASSO 6: VERIFICAÇÕES E DIAGNÓSTICOS
-- =====================================================

-- Ver produtos no catálogo
SELECT COUNT(*) as total_catalogo FROM produtos_catalogo WHERE ativo = true;

-- Ver vínculos por empresa
SELECT 
  empresa_id,
  COUNT(id) as total_produtos
FROM empresa_produtos
WHERE ativo = true
GROUP BY empresa_id
ORDER BY empresa_id;

-- Ver produtos da empresa 4 (para o PDV)
SELECT 
  pc.codigo,
  pc.descricao,
  ep.preco_venda,
  ep.estoque_atual
FROM empresa_produtos ep
INNER JOIN produtos_catalogo pc ON pc.id = ep.produto_catalogo_id
WHERE ep.empresa_id = 4 AND ep.ativo = true
ORDER BY pc.descricao
LIMIT 10;

-- =====================================================
-- IMPORTANTE: PRÓXIMOS PASSOS
-- =====================================================

-- 1. Execute este SQL completo no Supabase
-- 2. Ajuste o código do PDV para usar empresa_produtos
-- 3. Ajuste a tela de cadastro para permitir multi-empresa
-- 4. OPCIONAL: Renomear/remover tabela produtos antiga após validação
--    ALTER TABLE produtos RENAME TO produtos_old;

-- =====================================================
