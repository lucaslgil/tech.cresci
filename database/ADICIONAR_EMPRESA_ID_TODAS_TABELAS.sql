-- =====================================================
-- ADICIONAR COLUNA empresa_id EM TODAS AS TABELAS
-- Execução: Supabase Dashboard > SQL Editor
-- Data: 09/02/2026
-- =====================================================

-- ============ IMPORTANTE ============
-- Este script adiciona empresa_id em tabelas que não têm
-- Necessário para implementar isolamento multi-tenant (RLS)
-- Execute ANTES de aplicar o RLS
-- =====================================

-- 1. ADICIONAR empresa_id em USUARIOS
-- Relaciona usuário com sua empresa
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS empresa_id BIGINT REFERENCES empresas(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON usuarios(empresa_id);

COMMENT ON COLUMN usuarios.empresa_id IS 'Empresa à qual o usuário pertence';

-- 2. ADICIONAR empresa_id em CLIENTES
-- Cada cliente pertence a uma empresa
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS empresa_id BIGINT REFERENCES empresas(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON clientes(empresa_id);

COMMENT ON COLUMN clientes.empresa_id IS 'Empresa que cadastrou o cliente';

-- 3. ADICIONAR empresa_id em PRODUTOS
-- Cada produto pertence a uma empresa
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS empresa_id BIGINT REFERENCES empresas(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_produtos_empresa_id ON produtos(empresa_id);

COMMENT ON COLUMN produtos.empresa_id IS 'Empresa à qual o produto pertence';

-- 4. ADICIONAR empresa_id em VENDAS
-- Cada venda pertence a uma empresa
ALTER TABLE vendas 
ADD COLUMN IF NOT EXISTS empresa_id BIGINT REFERENCES empresas(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_vendas_empresa_id ON vendas(empresa_id);

COMMENT ON COLUMN vendas.empresa_id IS 'Empresa que realizou a venda';

-- 5. ADICIONAR empresa_id em VENDAS_ITENS (se não tiver)
ALTER TABLE vendas_itens 
ADD COLUMN IF NOT EXISTS empresa_id BIGINT REFERENCES empresas(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_vendas_itens_empresa_id ON vendas_itens(empresa_id);

-- =====================================================
-- ATUALIZAR REGISTROS EXISTENTES
-- =====================================================

-- ⚠️ ATENÇÃO: Se você já tem dados no banco, precisa atualizar 
-- os registros existentes para vincular à empresa correta

-- Exemplo: Se você tem apenas 1 empresa no sistema, faça:
-- UPDATE usuarios SET empresa_id = (SELECT id FROM empresas LIMIT 1) WHERE empresa_id IS NULL;
-- UPDATE clientes SET empresa_id = (SELECT id FROM empresas LIMIT 1) WHERE empresa_id IS NULL;
-- UPDATE produtos SET empresa_id = (SELECT id FROM empresas LIMIT 1) WHERE empresa_id IS NULL;
-- UPDATE vendas SET empresa_id = (SELECT id FROM empresas LIMIT 1) WHERE empresa_id IS NULL;

-- Se você tem múltiplas empresas, precisa definir uma lógica específica
-- para vincular os dados existentes às empresas corretas

-- =====================================================
-- TORNAR empresa_id OBRIGATÓRIO (DEPOIS DE PREENCHER)
-- =====================================================

-- Descomente as linhas abaixo SOMENTE DEPOIS de garantir que
-- todos os registros existentes têm empresa_id preenchido:

-- ALTER TABLE usuarios ALTER COLUMN empresa_id SET NOT NULL;
-- ALTER TABLE clientes ALTER COLUMN empresa_id SET NOT NULL;
-- ALTER TABLE produtos ALTER COLUMN empresa_id SET NOT NULL;
-- ALTER TABLE vendas ALTER COLUMN empresa_id SET NOT NULL;

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

-- Verificar estrutura da tabela usuarios
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'usuarios'
  AND column_name = 'empresa_id';

-- Verificar se há registros sem empresa_id
SELECT 'usuarios' as tabela, COUNT(*) as registros_sem_empresa
FROM usuarios WHERE empresa_id IS NULL
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes WHERE empresa_id IS NULL
UNION ALL
SELECT 'produtos', COUNT(*) FROM produtos WHERE empresa_id IS NULL
UNION ALL
SELECT 'vendas', COUNT(*) FROM vendas WHERE empresa_id IS NULL;

-- Se todos retornarem 0, pode prosseguir com RLS
