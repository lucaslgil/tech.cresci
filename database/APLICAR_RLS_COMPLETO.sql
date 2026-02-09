-- =====================================================
-- APLICAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- Execução: Supabase Dashboard > SQL Editor
-- =====================================================

-- ============ EMPRESAS ============
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

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
    SELECT empresa_id FROM usuarios 
    WHERE id = auth.uid() AND perfil = 'admin'
  )
);

-- ============ USUÁRIOS ============
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

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
    SELECT empresa_id FROM usuarios 
    WHERE id = auth.uid() AND perfil = 'admin'
  )
);

-- ============ CLIENTES ============
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

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

-- ============ PRODUTOS ============
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

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

-- ============ VENDAS ============
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

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

-- ============ NOTAS FISCAIS ============
ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;

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

-- ============ NOTAS FISCAIS ITENS ============
ALTER TABLE notas_fiscais_itens ENABLE ROW LEVEL SECURITY;

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

-- ============ OPERAÇÕES FISCAIS ============
ALTER TABLE operacoes_fiscais ENABLE ROW LEVEL SECURITY;

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

-- ============ NUMERAÇÃO NF-E ============
ALTER TABLE notas_fiscais_numeracao ENABLE ROW LEVEL SECURITY;

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
    'empresas', 'usuarios', 'clientes', 'produtos', 'vendas',
    'notas_fiscais', 'notas_fiscais_itens', 'operacoes_fiscais',
    'notas_fiscais_numeracao'
  )
ORDER BY tablename;

-- Deve retornar rowsecurity = true para todas as tabelas
