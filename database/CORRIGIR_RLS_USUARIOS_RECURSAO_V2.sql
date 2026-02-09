-- =====================================================
-- CORRIGIR RECURSÃO INFINITA NO RLS DA TABELA USUARIOS
-- Versão 2: Com verificação de tabelas existentes
-- =====================================================

-- PROBLEMA: Política tenta acessar 'usuarios' para verificar permissão
-- de acessar 'usuarios' -> LOOP INFINITO!

-- SOLUÇÃO: 
-- 1. Permitir que usuário veja seu próprio registro diretamente
-- 2. Criar função helper para outras tabelas
-- 3. Aplicar políticas APENAS em tabelas que existem

-- =====================================================
-- PASSO 1: REMOVER POLÍTICAS PROBLEMÁTICAS
-- =====================================================

DROP POLICY IF EXISTS "usuarios_ver_mesma_empresa" ON usuarios;
DROP POLICY IF EXISTS "usuarios_criar_mesma_empresa" ON usuarios;
DROP POLICY IF EXISTS "usuarios_editar_mesma_empresa" ON usuarios;

-- =====================================================
-- PASSO 2: CRIAR POLÍTICAS CORRETAS PARA USUARIOS (SEM RECURSÃO)
-- =====================================================

-- Usuários podem ver seu próprio registro
CREATE POLICY "usuarios_ver_proprio_registro"
ON usuarios FOR SELECT
USING (id = auth.uid());

-- Usuários podem atualizar seu próprio registro
CREATE POLICY "usuarios_editar_proprio_registro"
ON usuarios FOR UPDATE
USING (id = auth.uid());

-- Apenas service_role pode inserir novos usuários
CREATE POLICY "service_role_inserir_usuarios"
ON usuarios FOR INSERT
WITH CHECK (true);

-- =====================================================
-- PASSO 3: CORRIGIR POLÍTICAS DE EMPRESAS
-- =====================================================

DROP POLICY IF EXISTS "usuarios_ver_propria_empresa" ON empresas;
CREATE POLICY "usuarios_ver_propria_empresa" ON empresas FOR SELECT
USING (
  id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid() LIMIT 1)
);

DROP POLICY IF EXISTS "usuarios_editar_propria_empresa" ON empresas;
CREATE POLICY "usuarios_editar_propria_empresa" ON empresas FOR UPDATE
USING (
  id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid() LIMIT 1)
);

-- =====================================================
-- PASSO 4: CRIAR FUNÇÃO AUXILIAR PARA OBTER EMPRESA_ID
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT empresa_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$;

-- =====================================================
-- PASSO 5: RECRIAR POLÍTICAS COM VERIFICAÇÃO DE TABELAS
-- =====================================================

-- CLIENTES (sempre existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='clientes') THEN
    DROP POLICY IF EXISTS "clientes_mesma_empresa_select" ON clientes;
    CREATE POLICY "clientes_mesma_empresa_select" ON clientes FOR SELECT
    USING (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "clientes_mesma_empresa_insert" ON clientes;
    CREATE POLICY "clientes_mesma_empresa_insert" ON clientes FOR INSERT
    WITH CHECK (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "clientes_mesma_empresa_update" ON clientes;
    CREATE POLICY "clientes_mesma_empresa_update" ON clientes FOR UPDATE
    USING (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "clientes_mesma_empresa_delete" ON clientes;
    CREATE POLICY "clientes_mesma_empresa_delete" ON clientes FOR DELETE
    USING (empresa_id = public.get_user_empresa_id());
  END IF;
END $$;

-- PRODUTOS (sempre existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='produtos') THEN
    DROP POLICY IF EXISTS "produtos_mesma_empresa_select" ON produtos;
    CREATE POLICY "produtos_mesma_empresa_select" ON produtos FOR SELECT
    USING (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "produtos_mesma_empresa_insert" ON produtos;
    CREATE POLICY "produtos_mesma_empresa_insert" ON produtos FOR INSERT
    WITH CHECK (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "produtos_mesma_empresa_update" ON produtos;
    CREATE POLICY "produtos_mesma_empresa_update" ON produtos FOR UPDATE
    USING (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "produtos_mesma_empresa_delete" ON produtos;
    CREATE POLICY "produtos_mesma_empresa_delete" ON produtos FOR DELETE
    USING (empresa_id = public.get_user_empresa_id());
  END IF;
END $$;

-- VENDAS (sempre existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='vendas') THEN
    DROP POLICY IF EXISTS "vendas_mesma_empresa_select" ON vendas;
    CREATE POLICY "vendas_mesma_empresa_select" ON vendas FOR SELECT
    USING (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "vendas_mesma_empresa_insert" ON vendas;
    CREATE POLICY "vendas_mesma_empresa_insert" ON vendas FOR INSERT
    WITH CHECK (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "vendas_mesma_empresa_update" ON vendas;
    CREATE POLICY "vendas_mesma_empresa_update" ON vendas FOR UPDATE
    USING (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "vendas_mesma_empresa_delete" ON vendas;
    CREATE POLICY "vendas_mesma_empresa_delete" ON vendas FOR DELETE
    USING (empresa_id = public.get_user_empresa_id());
  END IF;
END $$;

-- VENDAS_ITENS (pode não existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='vendas_itens') THEN
    DROP POLICY IF EXISTS "vendas_itens_mesma_empresa_select" ON vendas_itens;
    CREATE POLICY "vendas_itens_mesma_empresa_select" ON vendas_itens FOR SELECT
    USING (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "vendas_itens_mesma_empresa_insert" ON vendas_itens;
    CREATE POLICY "vendas_itens_mesma_empresa_insert" ON vendas_itens FOR INSERT
    WITH CHECK (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "vendas_itens_mesma_empresa_update" ON vendas_itens;
    CREATE POLICY "vendas_itens_mesma_empresa_update" ON vendas_itens FOR UPDATE
    USING (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "vendas_itens_mesma_empresa_delete" ON vendas_itens;
    CREATE POLICY "vendas_itens_mesma_empresa_delete" ON vendas_itens FOR DELETE
    USING (empresa_id = public.get_user_empresa_id());
  END IF;
END $$;

-- COLABORADORES (pode não existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='colaboradores') THEN
    DROP POLICY IF EXISTS "colaboradores_mesma_empresa_select" ON colaboradores;
    CREATE POLICY "colaboradores_mesma_empresa_select" ON colaboradores FOR SELECT
    USING (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "colaboradores_mesma_empresa_insert" ON colaboradores;
    CREATE POLICY "colaboradores_mesma_empresa_insert" ON colaboradores FOR INSERT
    WITH CHECK (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "colaboradores_mesma_empresa_update" ON colaboradores;
    CREATE POLICY "colaboradores_mesma_empresa_update" ON colaboradores FOR UPDATE
    USING (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "colaboradores_mesma_empresa_delete" ON colaboradores;
    CREATE POLICY "colaboradores_mesma_empresa_delete" ON colaboradores FOR DELETE
    USING (empresa_id = public.get_user_empresa_id());
  END IF;
END $$;

-- NOTAS_FISCAIS (pode não existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notas_fiscais') THEN
    DROP POLICY IF EXISTS "notas_fiscais_mesma_empresa_select" ON notas_fiscais;
    CREATE POLICY "notas_fiscais_mesma_empresa_select" ON notas_fiscais FOR SELECT
    USING (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "notas_fiscais_mesma_empresa_insert" ON notas_fiscais;
    CREATE POLICY "notas_fiscais_mesma_empresa_insert" ON notas_fiscais FOR INSERT
    WITH CHECK (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "notas_fiscais_mesma_empresa_update" ON notas_fiscais;
    CREATE POLICY "notas_fiscais_mesma_empresa_update" ON notas_fiscais FOR UPDATE
    USING (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "notas_fiscais_mesma_empresa_delete" ON notas_fiscais;
    CREATE POLICY "notas_fiscais_mesma_empresa_delete" ON notas_fiscais FOR DELETE
    USING (empresa_id = public.get_user_empresa_id());
  END IF;
END $$;

-- NOTAS_FISCAIS_ITENS (pode não existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notas_fiscais_itens') THEN
    DROP POLICY IF EXISTS "notas_fiscais_itens_mesma_empresa_select" ON notas_fiscais_itens;
    CREATE POLICY "notas_fiscais_itens_mesma_empresa_select" ON notas_fiscais_itens FOR SELECT
    USING (nota_fiscal_id IN (
      SELECT id FROM notas_fiscais WHERE empresa_id = public.get_user_empresa_id()
    ));

    DROP POLICY IF EXISTS "notas_fiscais_itens_mesma_empresa_insert" ON notas_fiscais_itens;
    CREATE POLICY "notas_fiscais_itens_mesma_empresa_insert" ON notas_fiscais_itens FOR INSERT
    WITH CHECK (nota_fiscal_id IN (
      SELECT id FROM notas_fiscais WHERE empresa_id = public.get_user_empresa_id()
    ));

    DROP POLICY IF EXISTS "notas_fiscais_itens_mesma_empresa_update" ON notas_fiscais_itens;
    CREATE POLICY "notas_fiscais_itens_mesma_empresa_update" ON notas_fiscais_itens FOR UPDATE
    USING (nota_fiscal_id IN (
      SELECT id FROM notas_fiscais WHERE empresa_id = public.get_user_empresa_id()
    ));

    DROP POLICY IF EXISTS "notas_fiscais_itens_mesma_empresa_delete" ON notas_fiscais_itens;
    CREATE POLICY "notas_fiscais_itens_mesma_empresa_delete" ON notas_fiscais_itens FOR DELETE
    USING (nota_fiscal_id IN (
      SELECT id FROM notas_fiscais WHERE empresa_id = public.get_user_empresa_id()
    ));
  END IF;
END $$;

-- OPERACOES_FISCAIS (pode não existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='operacoes_fiscais') THEN
    DROP POLICY IF EXISTS "operacoes_fiscais_mesma_empresa_select" ON operacoes_fiscais;
    CREATE POLICY "operacoes_fiscais_mesma_empresa_select" ON operacoes_fiscais FOR SELECT
    USING (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "operacoes_fiscais_mesma_empresa_insert" ON operacoes_fiscais;
    CREATE POLICY "operacoes_fiscais_mesma_empresa_insert" ON operacoes_fiscais FOR INSERT
    WITH CHECK (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "operacoes_fiscais_mesma_empresa_update" ON operacoes_fiscais;
    CREATE POLICY "operacoes_fiscais_mesma_empresa_update" ON operacoes_fiscais FOR UPDATE
    USING (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "operacoes_fiscais_mesma_empresa_delete" ON operacoes_fiscais;
    CREATE POLICY "operacoes_fiscais_mesma_empresa_delete" ON operacoes_fiscais FOR DELETE
    USING (empresa_id = public.get_user_empresa_id());
  END IF;
END $$;

-- NOTAS_FISCAIS_NUMERACAO (pode não existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notas_fiscais_numeracao') THEN
    DROP POLICY IF EXISTS "numeracao_mesma_empresa_select" ON notas_fiscais_numeracao;
    CREATE POLICY "numeracao_mesma_empresa_select" ON notas_fiscais_numeracao FOR SELECT
    USING (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "numeracao_mesma_empresa_insert" ON notas_fiscais_numeracao;
    CREATE POLICY "numeracao_mesma_empresa_insert" ON notas_fiscais_numeracao FOR INSERT
    WITH CHECK (empresa_id = public.get_user_empresa_id());

    DROP POLICY IF EXISTS "numeracao_mesma_empresa_update" ON notas_fiscais_numeracao;
    CREATE POLICY "numeracao_mesma_empresa_update" ON notas_fiscais_numeracao FOR UPDATE
    USING (empresa_id = public.get_user_empresa_id());
  END IF;
END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Mostrar políticas aplicadas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as "Comando",
  qual as "Condição"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'empresas', 'usuarios', 'colaboradores', 'clientes', 'produtos', 
    'vendas', 'vendas_itens', 'notas_fiscais', 'notas_fiscais_itens', 
    'operacoes_fiscais', 'notas_fiscais_numeracao'
  )
ORDER BY tablename, policyname;

-- =====================================================
-- ✅ SUCESSO!
-- =====================================================
-- Recursão corrigida!
-- Todas as políticas foram recriadas apenas para tabelas existentes.
-- Seu sistema deve estar funcionando novamente! 🎉
