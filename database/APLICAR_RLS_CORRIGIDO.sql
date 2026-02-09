-- =====================================================
-- APLICAR ROW LEVEL SECURITY (RLS) - VERSÃO CORRIGIDA
-- Execução: Supabase Dashboard > SQL Editor
-- Data: 09/02/2026
-- =====================================================

-- ⚠️ IMPORTANTE: Execute ADICIONAR_EMPRESA_ID_TODAS_TABELAS.sql
--    ANTES de executar este script!

-- =====================================================
-- PASSO 1: HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_fiscais_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE operacoes_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_fiscais_numeracao ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABELA: EMPRESAS
-- Usuários só veem sua própria empresa
-- =====================================================

DROP POLICY IF EXISTS "usuarios_ver_propria_empresa" ON empresas;
CREATE POLICY "usuarios_ver_propria_empresa"
ON empresas FOR SELECT
USING (
  id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "usuarios_editar_propria_empresa" ON empresas;
CREATE POLICY "usuarios_editar_propria_empresa"
ON empresas FOR UPDATE
USING (
  id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- =====================================================
-- TABELA: USUÁRIOS
-- Usuários veem apenas outros usuários da mesma empresa
-- =====================================================

DROP POLICY IF EXISTS "usuarios_ver_mesma_empresa" ON usuarios;
CREATE POLICY "usuarios_ver_mesma_empresa"
ON usuarios FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "usuarios_criar_mesma_empresa" ON usuarios;
CREATE POLICY "usuarios_criar_mesma_empresa"
ON usuarios FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "usuarios_editar_mesma_empresa" ON usuarios;
CREATE POLICY "usuarios_editar_mesma_empresa"
ON usuarios FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- =====================================================
-- TABELA: COLABORADORES
-- =====================================================

DROP POLICY IF EXISTS "colaboradores_mesma_empresa_select" ON colaboradores;
CREATE POLICY "colaboradores_mesma_empresa_select"
ON colaboradores FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "colaboradores_mesma_empresa_insert" ON colaboradores;
CREATE POLICY "colaboradores_mesma_empresa_insert"
ON colaboradores FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "colaboradores_mesma_empresa_update" ON colaboradores;
CREATE POLICY "colaboradores_mesma_empresa_update"
ON colaboradores FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "colaboradores_mesma_empresa_delete" ON colaboradores;
CREATE POLICY "colaboradores_mesma_empresa_delete"
ON colaboradores FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- =====================================================
-- TABELA: CLIENTES
-- =====================================================

DROP POLICY IF EXISTS "clientes_mesma_empresa_select" ON clientes;
CREATE POLICY "clientes_mesma_empresa_select"
ON clientes FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "clientes_mesma_empresa_insert" ON clientes;
CREATE POLICY "clientes_mesma_empresa_insert"
ON clientes FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "clientes_mesma_empresa_update" ON clientes;
CREATE POLICY "clientes_mesma_empresa_update"
ON clientes FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "clientes_mesma_empresa_delete" ON clientes;
CREATE POLICY "clientes_mesma_empresa_delete"
ON clientes FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- =====================================================
-- TABELA: PRODUTOS
-- =====================================================

DROP POLICY IF EXISTS "produtos_mesma_empresa_select" ON produtos;
CREATE POLICY "produtos_mesma_empresa_select"
ON produtos FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "produtos_mesma_empresa_insert" ON produtos;
CREATE POLICY "produtos_mesma_empresa_insert"
ON produtos FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "produtos_mesma_empresa_update" ON produtos;
CREATE POLICY "produtos_mesma_empresa_update"
ON produtos FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "produtos_mesma_empresa_delete" ON produtos;
CREATE POLICY "produtos_mesma_empresa_delete"
ON produtos FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- =====================================================
-- TABELA: VENDAS
-- =====================================================

DROP POLICY IF EXISTS "vendas_mesma_empresa_select" ON vendas;
CREATE POLICY "vendas_mesma_empresa_select"
ON vendas FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "vendas_mesma_empresa_insert" ON vendas;
CREATE POLICY "vendas_mesma_empresa_insert"
ON vendas FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "vendas_mesma_empresa_update" ON vendas;
CREATE POLICY "vendas_mesma_empresa_update"
ON vendas FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "vendas_mesma_empresa_delete" ON vendas;
CREATE POLICY "vendas_mesma_empresa_delete"
ON vendas FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- =====================================================
-- TABELA: VENDAS_ITENS
-- =====================================================

DROP POLICY IF EXISTS "vendas_itens_mesma_empresa_select" ON vendas_itens;
CREATE POLICY "vendas_itens_mesma_empresa_select"
ON vendas_itens FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "vendas_itens_mesma_empresa_insert" ON vendas_itens;
CREATE POLICY "vendas_itens_mesma_empresa_insert"
ON vendas_itens FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "vendas_itens_mesma_empresa_update" ON vendas_itens;
CREATE POLICY "vendas_itens_mesma_empresa_update"
ON vendas_itens FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "vendas_itens_mesma_empresa_delete" ON vendas_itens;
CREATE POLICY "vendas_itens_mesma_empresa_delete"
ON vendas_itens FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- =====================================================
-- TABELA: NOTAS FISCAIS
-- =====================================================

DROP POLICY IF EXISTS "notas_fiscais_mesma_empresa_select" ON notas_fiscais;
CREATE POLICY "notas_fiscais_mesma_empresa_select"
ON notas_fiscais FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "notas_fiscais_mesma_empresa_insert" ON notas_fiscais;
CREATE POLICY "notas_fiscais_mesma_empresa_insert"
ON notas_fiscais FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "notas_fiscais_mesma_empresa_update" ON notas_fiscais;
CREATE POLICY "notas_fiscais_mesma_empresa_update"
ON notas_fiscais FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "notas_fiscais_mesma_empresa_delete" ON notas_fiscais;
CREATE POLICY "notas_fiscais_mesma_empresa_delete"
ON notas_fiscais FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- =====================================================
-- TABELA: NOTAS FISCAIS ITENS
-- =====================================================

DROP POLICY IF EXISTS "notas_fiscais_itens_mesma_empresa_select" ON notas_fiscais_itens;
CREATE POLICY "notas_fiscais_itens_mesma_empresa_select"
ON notas_fiscais_itens FOR SELECT
USING (
  nota_fiscal_id IN (
    SELECT id FROM notas_fiscais
    WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "notas_fiscais_itens_mesma_empresa_insert" ON notas_fiscais_itens;
CREATE POLICY "notas_fiscais_itens_mesma_empresa_insert"
ON notas_fiscais_itens FOR INSERT
WITH CHECK (
  nota_fiscal_id IN (
    SELECT id FROM notas_fiscais
    WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "notas_fiscais_itens_mesma_empresa_update" ON notas_fiscais_itens;
CREATE POLICY "notas_fiscais_itens_mesma_empresa_update"
ON notas_fiscais_itens FOR UPDATE
USING (
  nota_fiscal_id IN (
    SELECT id FROM notas_fiscais
    WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "notas_fiscais_itens_mesma_empresa_delete" ON notas_fiscais_itens;
CREATE POLICY "notas_fiscais_itens_mesma_empresa_delete"
ON notas_fiscais_itens FOR DELETE
USING (
  nota_fiscal_id IN (
    SELECT id FROM notas_fiscais
    WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  )
);

-- =====================================================
-- TABELA: OPERAÇÕES FISCAIS
-- =====================================================

DROP POLICY IF EXISTS "operacoes_fiscais_mesma_empresa_select" ON operacoes_fiscais;
CREATE POLICY "operacoes_fiscais_mesma_empresa_select"
ON operacoes_fiscais FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "operacoes_fiscais_mesma_empresa_insert" ON operacoes_fiscais;
CREATE POLICY "operacoes_fiscais_mesma_empresa_insert"
ON operacoes_fiscais FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "operacoes_fiscais_mesma_empresa_update" ON operacoes_fiscais;
CREATE POLICY "operacoes_fiscais_mesma_empresa_update"
ON operacoes_fiscais FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "operacoes_fiscais_mesma_empresa_delete" ON operacoes_fiscais;
CREATE POLICY "operacoes_fiscais_mesma_empresa_delete"
ON operacoes_fiscais FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- =====================================================
-- TABELA: NUMERAÇÃO NF-E
-- =====================================================

DROP POLICY IF EXISTS "numeracao_mesma_empresa_select" ON notas_fiscais_numeracao;
CREATE POLICY "numeracao_mesma_empresa_select"
ON notas_fiscais_numeracao FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "numeracao_mesma_empresa_update" ON notas_fiscais_numeracao;
CREATE POLICY "numeracao_mesma_empresa_update"
ON notas_fiscais_numeracao FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "numeracao_mesma_empresa_insert" ON notas_fiscais_numeracao;
CREATE POLICY "numeracao_mesma_empresa_insert"
ON notas_fiscais_numeracao FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- =====================================================
-- VERIFICAR RLS APLICADO
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'empresas', 'usuarios', 'colaboradores', 'clientes', 'produtos', 
    'vendas', 'vendas_itens', 'notas_fiscais', 'notas_fiscais_itens', 
    'operacoes_fiscais', 'notas_fiscais_numeracao'
  )
ORDER BY tablename;

-- Todas as tabelas devem retornar rowsecurity = true

-- =====================================================
-- TESTAR ISOLAMENTO (OPCIONAL)
-- =====================================================

-- Logue como usuário da Empresa A e execute:
-- SELECT * FROM clientes;
-- Deve retornar APENAS clientes da empresa A

-- Logue como usuário da Empresa B e execute:
-- SELECT * FROM clientes;
-- Deve retornar APENAS clientes da empresa B

-- Se conseguir ver dados de outras empresas, o RLS NÃO está funcionando!
