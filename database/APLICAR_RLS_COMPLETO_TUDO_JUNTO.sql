-- =====================================================
-- APLICAR RLS COMPLETO - TUDO EM UM ÚNICO SCRIPT
-- Execução: Supabase Dashboard > SQL Editor
-- Data: 09/02/2026
-- =====================================================

-- Este script faz TUDO automaticamente:
-- 1. Adiciona empresa_id (se não existir)
-- 2. Vincula registros existentes à primeira empresa
-- 3. Torna empresa_id obrigatório
-- 4. Aplica RLS em todas as tabelas

-- =====================================================
-- PASSO 1: ADICIONAR empresa_id (se não existir)
-- =====================================================

-- Adicionar empresa_id em TODAS as tabelas que precisam
DO $$
BEGIN
  -- usuarios
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='empresa_id') THEN
    ALTER TABLE usuarios ADD COLUMN empresa_id BIGINT REFERENCES empresas(id) ON DELETE RESTRICT;
  END IF;
  
  -- clientes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='empresa_id') THEN
    ALTER TABLE clientes ADD COLUMN empresa_id BIGINT REFERENCES empresas(id) ON DELETE RESTRICT;
  END IF;
  
  -- produtos
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='produtos' AND column_name='empresa_id') THEN
    ALTER TABLE produtos ADD COLUMN empresa_id BIGINT REFERENCES empresas(id) ON DELETE RESTRICT;
  END IF;
  
  -- vendas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendas' AND column_name='empresa_id') THEN
    ALTER TABLE vendas ADD COLUMN empresa_id BIGINT REFERENCES empresas(id) ON DELETE RESTRICT;
  END IF;
  
  -- vendas_itens
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='vendas_itens') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendas_itens' AND column_name='empresa_id') THEN
      ALTER TABLE vendas_itens ADD COLUMN empresa_id BIGINT REFERENCES empresas(id) ON DELETE RESTRICT;
    END IF;
  END IF;
  
  -- colaboradores (verificar se existe e se já não tem empresa_id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='colaboradores') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='colaboradores' AND column_name='empresa_id') THEN
      ALTER TABLE colaboradores ADD COLUMN empresa_id BIGINT REFERENCES empresas(id) ON DELETE RESTRICT;
    END IF;
  END IF;
  
  -- notas_fiscais
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notas_fiscais') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notas_fiscais' AND column_name='empresa_id') THEN
      ALTER TABLE notas_fiscais ADD COLUMN empresa_id BIGINT REFERENCES empresas(id) ON DELETE RESTRICT;
    END IF;
  END IF;
  
  -- operacoes_fiscais
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='operacoes_fiscais') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operacoes_fiscais' AND column_name='empresa_id') THEN
      ALTER TABLE operacoes_fiscais ADD COLUMN empresa_id BIGINT REFERENCES empresas(id) ON DELETE RESTRICT;
    END IF;
  END IF;
  
  -- notas_fiscais_numeracao
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notas_fiscais_numeracao') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notas_fiscais_numeracao' AND column_name='empresa_id') THEN
      ALTER TABLE notas_fiscais_numeracao ADD COLUMN empresa_id BIGINT REFERENCES empresas(id) ON DELETE RESTRICT;
    END IF;
  END IF;
END $$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_produtos_empresa_id ON produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vendas_empresa_id ON vendas(empresa_id);

-- Índices condicionais (só se a tabela existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='vendas_itens') THEN
    CREATE INDEX IF NOT EXISTS idx_vendas_itens_empresa_id ON vendas_itens(empresa_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='colaboradores') THEN
    CREATE INDEX IF NOT EXISTS idx_colaboradores_empresa_id ON colaboradores(empresa_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notas_fiscais') THEN
    CREATE INDEX IF NOT EXISTS idx_notas_fiscais_empresa_id ON notas_fiscais(empresa_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='operacoes_fiscais') THEN
    CREATE INDEX IF NOT EXISTS idx_operacoes_fiscais_empresa_id ON operacoes_fiscais(empresa_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notas_fiscais_numeracao') THEN
    CREATE INDEX IF NOT EXISTS idx_notas_fiscais_numeracao_empresa_id ON notas_fiscais_numeracao(empresa_id);
  END IF;
END $$;

-- =====================================================
-- PASSO 2: VINCULAR REGISTROS À PRIMEIRA EMPRESA
-- =====================================================

DO $$
DECLARE
  primeira_empresa_id BIGINT;
BEGIN
  -- Pegar ID da primeira empresa
  SELECT id INTO primeira_empresa_id FROM empresas ORDER BY id LIMIT 1;
  
  IF primeira_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma empresa encontrada! Crie uma empresa primeiro.';
  END IF;
  
  -- Atualizar registros sem empresa_id (apenas tabelas que existem)
  UPDATE usuarios SET empresa_id = primeira_empresa_id WHERE empresa_id IS NULL;
  UPDATE clientes SET empresa_id = primeira_empresa_id WHERE empresa_id IS NULL;
  UPDATE produtos SET empresa_id = primeira_empresa_id WHERE empresa_id IS NULL;
  UPDATE vendas SET empresa_id = primeira_empresa_id WHERE empresa_id IS NULL;
  
  -- Tabelas opcionais
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='vendas_itens') THEN
    UPDATE vendas_itens SET empresa_id = primeira_empresa_id WHERE empresa_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='colaboradores') THEN
    UPDATE colaboradores SET empresa_id = primeira_empresa_id WHERE empresa_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notas_fiscais') THEN
    UPDATE notas_fiscais SET empresa_id = primeira_empresa_id WHERE empresa_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='operacoes_fiscais') THEN
    UPDATE operacoes_fiscais SET empresa_id = primeira_empresa_id WHERE empresa_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notas_fiscais_numeracao') THEN
    UPDATE notas_fiscais_numeracao SET empresa_id = primeira_empresa_id WHERE empresa_id IS NULL;
  END IF;
  
  RAISE NOTICE 'Registros vinculados à empresa ID: %', primeira_empresa_id;
END $$;

-- =====================================================
-- PASSO 3: TORNAR empresa_id OBRIGATÓRIO
-- =====================================================

DO $$
BEGIN
  -- Verificar se não há registros sem empresa_id antes de tornar NOT NULL
  IF (SELECT COUNT(*) FROM usuarios WHERE empresa_id IS NULL) = 0 THEN
    ALTER TABLE usuarios ALTER COLUMN empresa_id SET NOT NULL;
  END IF;
  
  IF (SELECT COUNT(*) FROM clientes WHERE empresa_id IS NULL) = 0 THEN
    ALTER TABLE clientes ALTER COLUMN empresa_id SET NOT NULL;
  END IF;
  
  IF (SELECT COUNT(*) FROM produtos WHERE empresa_id IS NULL) = 0 THEN
    ALTER TABLE produtos ALTER COLUMN empresa_id SET NOT NULL;
  END IF;
  
  IF (SELECT COUNT(*) FROM vendas WHERE empresa_id IS NULL) = 0 THEN
    ALTER TABLE vendas ALTER COLUMN empresa_id SET NOT NULL;
  END IF;
  
  -- Tabelas opcionais
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='vendas_itens') THEN
    IF (SELECT COUNT(*) FROM vendas_itens WHERE empresa_id IS NULL) = 0 THEN
      ALTER TABLE vendas_itens ALTER COLUMN empresa_id SET NOT NULL;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='colaboradores') THEN
    IF (SELECT COUNT(*) FROM colaboradores WHERE empresa_id IS NULL) = 0 THEN
      ALTER TABLE colaboradores ALTER COLUMN empresa_id SET NOT NULL;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notas_fiscais') THEN
    IF (SELECT COUNT(*) FROM notas_fiscais WHERE empresa_id IS NULL) = 0 THEN
      ALTER TABLE notas_fiscais ALTER COLUMN empresa_id SET NOT NULL;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='operacoes_fiscais') THEN
    IF (SELECT COUNT(*) FROM operacoes_fiscais WHERE empresa_id IS NULL) = 0 THEN
      ALTER TABLE operacoes_fiscais ALTER COLUMN empresa_id SET NOT NULL;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notas_fiscais_numeracao') THEN
    IF (SELECT COUNT(*) FROM notas_fiscais_numeracao WHERE empresa_id IS NULL) = 0 THEN
      ALTER TABLE notas_fiscais_numeracao ALTER COLUMN empresa_id SET NOT NULL;
    END IF;
  END IF;
END $$;

-- =====================================================
-- PASSO 4: HABILITAR RLS (apenas em tabelas que existem)
-- =====================================================

DO $$
BEGIN
  -- Tabelas principais (sempre existem)
  ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
  ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
  ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
  ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
  
  -- Tabelas opcionais
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='colaboradores') THEN
    ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='vendas_itens') THEN
    ALTER TABLE vendas_itens ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notas_fiscais') THEN
    ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notas_fiscais_itens') THEN
    ALTER TABLE notas_fiscais_itens ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='operacoes_fiscais') THEN
    ALTER TABLE operacoes_fiscais ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notas_fiscais_numeracao') THEN
    ALTER TABLE notas_fiscais_numeracao ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =====================================================
-- PASSO 5: CRIAR POLÍTICAS RLS
-- =====================================================

-- EMPRESAS
DROP POLICY IF EXISTS "usuarios_ver_propria_empresa" ON empresas;
CREATE POLICY "usuarios_ver_propria_empresa" ON empresas FOR SELECT
USING (id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "usuarios_editar_propria_empresa" ON empresas;
CREATE POLICY "usuarios_editar_propria_empresa" ON empresas FOR UPDATE
USING (id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- USUÁRIOS
DROP POLICY IF EXISTS "usuarios_ver_mesma_empresa" ON usuarios;
CREATE POLICY "usuarios_ver_mesma_empresa" ON usuarios FOR SELECT
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "usuarios_criar_mesma_empresa" ON usuarios;
CREATE POLICY "usuarios_criar_mesma_empresa" ON usuarios FOR INSERT
WITH CHECK (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "usuarios_editar_mesma_empresa" ON usuarios;
CREATE POLICY "usuarios_editar_mesma_empresa" ON usuarios FOR UPDATE
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- COLABORADORES
DROP POLICY IF EXISTS "colaboradores_mesma_empresa_select" ON colaboradores;
CREATE POLICY "colaboradores_mesma_empresa_select" ON colaboradores FOR SELECT
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "colaboradores_mesma_empresa_insert" ON colaboradores;
CREATE POLICY "colaboradores_mesma_empresa_insert" ON colaboradores FOR INSERT
WITH CHECK (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "colaboradores_mesma_empresa_update" ON colaboradores;
CREATE POLICY "colaboradores_mesma_empresa_update" ON colaboradores FOR UPDATE
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "colaboradores_mesma_empresa_delete" ON colaboradores;
CREATE POLICY "colaboradores_mesma_empresa_delete" ON colaboradores FOR DELETE
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- CLIENTES
DROP POLICY IF EXISTS "clientes_mesma_empresa_select" ON clientes;
CREATE POLICY "clientes_mesma_empresa_select" ON clientes FOR SELECT
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "clientes_mesma_empresa_insert" ON clientes;
CREATE POLICY "clientes_mesma_empresa_insert" ON clientes FOR INSERT
WITH CHECK (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "clientes_mesma_empresa_update" ON clientes;
CREATE POLICY "clientes_mesma_empresa_update" ON clientes FOR UPDATE
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "clientes_mesma_empresa_delete" ON clientes;
CREATE POLICY "clientes_mesma_empresa_delete" ON clientes FOR DELETE
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- PRODUTOS
DROP POLICY IF EXISTS "produtos_mesma_empresa_select" ON produtos;
CREATE POLICY "produtos_mesma_empresa_select" ON produtos FOR SELECT
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "produtos_mesma_empresa_insert" ON produtos;
CREATE POLICY "produtos_mesma_empresa_insert" ON produtos FOR INSERT
WITH CHECK (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "produtos_mesma_empresa_update" ON produtos;
CREATE POLICY "produtos_mesma_empresa_update" ON produtos FOR UPDATE
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "produtos_mesma_empresa_delete" ON produtos;
CREATE POLICY "produtos_mesma_empresa_delete" ON produtos FOR DELETE
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- VENDAS
DROP POLICY IF EXISTS "vendas_mesma_empresa_select" ON vendas;
CREATE POLICY "vendas_mesma_empresa_select" ON vendas FOR SELECT
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "vendas_mesma_empresa_insert" ON vendas;
CREATE POLICY "vendas_mesma_empresa_insert" ON vendas FOR INSERT
WITH CHECK (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "vendas_mesma_empresa_update" ON vendas;
CREATE POLICY "vendas_mesma_empresa_update" ON vendas FOR UPDATE
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "vendas_mesma_empresa_delete" ON vendas;
CREATE POLICY "vendas_mesma_empresa_delete" ON vendas FOR DELETE
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- VENDAS_ITENS
DROP POLICY IF EXISTS "vendas_itens_mesma_empresa_select" ON vendas_itens;
CREATE POLICY "vendas_itens_mesma_empresa_select" ON vendas_itens FOR SELECT
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "vendas_itens_mesma_empresa_insert" ON vendas_itens;
CREATE POLICY "vendas_itens_mesma_empresa_insert" ON vendas_itens FOR INSERT
WITH CHECK (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "vendas_itens_mesma_empresa_update" ON vendas_itens;
CREATE POLICY "vendas_itens_mesma_empresa_update" ON vendas_itens FOR UPDATE
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "vendas_itens_mesma_empresa_delete" ON vendas_itens;
CREATE POLICY "vendas_itens_mesma_empresa_delete" ON vendas_itens FOR DELETE
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- NOTAS FISCAIS
DROP POLICY IF EXISTS "notas_fiscais_mesma_empresa_select" ON notas_fiscais;
CREATE POLICY "notas_fiscais_mesma_empresa_select" ON notas_fiscais FOR SELECT
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "notas_fiscais_mesma_empresa_insert" ON notas_fiscais;
CREATE POLICY "notas_fiscais_mesma_empresa_insert" ON notas_fiscais FOR INSERT
WITH CHECK (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "notas_fiscais_mesma_empresa_update" ON notas_fiscais;
CREATE POLICY "notas_fiscais_mesma_empresa_update" ON notas_fiscais FOR UPDATE
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "notas_fiscais_mesma_empresa_delete" ON notas_fiscais;
CREATE POLICY "notas_fiscais_mesma_empresa_delete" ON notas_fiscais FOR DELETE
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- NOTAS FISCAIS ITENS
DROP POLICY IF EXISTS "notas_fiscais_itens_mesma_empresa_select" ON notas_fiscais_itens;
CREATE POLICY "notas_fiscais_itens_mesma_empresa_select" ON notas_fiscais_itens FOR SELECT
USING (nota_fiscal_id IN (
  SELECT id FROM notas_fiscais WHERE empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
));

DROP POLICY IF EXISTS "notas_fiscais_itens_mesma_empresa_insert" ON notas_fiscais_itens;
CREATE POLICY "notas_fiscais_itens_mesma_empresa_insert" ON notas_fiscais_itens FOR INSERT
WITH CHECK (nota_fiscal_id IN (
  SELECT id FROM notas_fiscais WHERE empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
));

DROP POLICY IF EXISTS "notas_fiscais_itens_mesma_empresa_update" ON notas_fiscais_itens;
CREATE POLICY "notas_fiscais_itens_mesma_empresa_update" ON notas_fiscais_itens FOR UPDATE
USING (nota_fiscal_id IN (
  SELECT id FROM notas_fiscais WHERE empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
));

DROP POLICY IF EXISTS "notas_fiscais_itens_mesma_empresa_delete" ON notas_fiscais_itens;
CREATE POLICY "notas_fiscais_itens_mesma_empresa_delete" ON notas_fiscais_itens FOR DELETE
USING (nota_fiscal_id IN (
  SELECT id FROM notas_fiscais WHERE empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
));

-- OPERAÇÕES FISCAIS
DROP POLICY IF EXISTS "operacoes_fiscais_mesma_empresa_select" ON operacoes_fiscais;
CREATE POLICY "operacoes_fiscais_mesma_empresa_select" ON operacoes_fiscais FOR SELECT
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "operacoes_fiscais_mesma_empresa_insert" ON operacoes_fiscais;
CREATE POLICY "operacoes_fiscais_mesma_empresa_insert" ON operacoes_fiscais FOR INSERT
WITH CHECK (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "operacoes_fiscais_mesma_empresa_update" ON operacoes_fiscais;
CREATE POLICY "operacoes_fiscais_mesma_empresa_update" ON operacoes_fiscais FOR UPDATE
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "operacoes_fiscais_mesma_empresa_delete" ON operacoes_fiscais;
CREATE POLICY "operacoes_fiscais_mesma_empresa_delete" ON operacoes_fiscais FOR DELETE
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- NUMERAÇÃO NF-E
DROP POLICY IF EXISTS "numeracao_mesma_empresa_select" ON notas_fiscais_numeracao;
CREATE POLICY "numeracao_mesma_empresa_select" ON notas_fiscais_numeracao FOR SELECT
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "numeracao_mesma_empresa_update" ON notas_fiscais_numeracao;
CREATE POLICY "numeracao_mesma_empresa_update" ON notas_fiscais_numeracao FOR UPDATE
USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "numeracao_mesma_empresa_insert" ON notas_fiscais_numeracao;
CREATE POLICY "numeracao_mesma_empresa_insert" ON notas_fiscais_numeracao FOR INSERT
WITH CHECK (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar RLS ativado
SELECT 
  tablename,
  rowsecurity as "RLS Ativado?"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'empresas', 'usuarios', 'colaboradores', 'clientes', 'produtos', 
    'vendas', 'vendas_itens', 'notas_fiscais', 'notas_fiscais_itens', 
    'operacoes_fiscais', 'notas_fiscais_numeracao'
  )
ORDER BY tablename;

-- Verificar se há registros sem empresa_id
SELECT 'usuarios' as tabela, COUNT(*) as sem_empresa FROM usuarios WHERE empresa_id IS NULL
UNION ALL SELECT 'clientes', COUNT(*) FROM clientes WHERE empresa_id IS NULL
UNION ALL SELECT 'produtos', COUNT(*) FROM produtos WHERE empresa_id IS NULL
UNION ALL SELECT 'vendas', COUNT(*) FROM vendas WHERE empresa_id IS NULL
UNION ALL SELECT 'vendas_itens', COUNT(*) FROM vendas_itens WHERE empresa_id IS NULL;

-- ✅ Se tudo deu certo:
-- - RLS Ativado? = true para todas
-- - sem_empresa = 0 para todas

-- =====================================================
-- SUCESSO! 🎉
-- =====================================================
-- RLS aplicado com sucesso!
-- Todos os seus dados estão protegidos.
-- Cada usuário só verá dados da própria empresa.
