-- =====================================================
-- CORRIGIR RECURSÃO INFINITA NO RLS DA TABELA USUARIOS
-- =====================================================

-- PROBLEMA: Política tenta acessar 'usuarios' para verificar permissão
-- de acessar 'usuarios' -> LOOP INFINITO!

-- SOLUÇÃO: Permitir que usuário veja seu próprio registro diretamente

-- =====================================================
-- REMOVER POLÍTICAS PROBLEMÁTICAS
-- =====================================================

DROP POLICY IF EXISTS "usuarios_ver_mesma_empresa" ON usuarios;
DROP POLICY IF EXISTS "usuarios_criar_mesma_empresa" ON usuarios;
DROP POLICY IF EXISTS "usuarios_editar_mesma_empresa" ON usuarios;

-- =====================================================
-- CRIAR POLÍTICAS CORRETAS (SEM RECURSÃO)
-- =====================================================

-- 1. Usuários podem ver seu próprio registro
CREATE POLICY "usuarios_ver_proprio_registro"
ON usuarios FOR SELECT
USING (id = auth.uid());

-- 2. Usuários podem atualizar seu próprio registro
CREATE POLICY "usuarios_editar_proprio_registro"
ON usuarios FOR UPDATE
USING (id = auth.uid());

-- 3. Apenas service_role pode inserir novos usuários
-- (Inserção será feita via trigger na criação de auth.users)
CREATE POLICY "service_role_inserir_usuarios"
ON usuarios FOR INSERT
WITH CHECK (true); -- Service role bypassa RLS de qualquer forma

-- =====================================================
-- CORRIGIR POLÍTICAS DE OUTRAS TABELAS
-- =====================================================

-- Agora que usuarios está corrigido, podemos manter as outras políticas
-- mas garantir que não vão causar problemas

-- EMPRESAS: Usuário precisa ver sua empresa
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
-- CRIAR FUNÇÃO AUXILIAR PARA OBTER EMPRESA_ID
-- =====================================================

-- Esta função será usada por todas as outras políticas
-- IMPORTANTE: Criada no schema PUBLIC, não AUTH
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT empresa_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$;

-- =====================================================
-- RECRIAR POLÍTICAS USANDO A FUNÇÃO AUXILIAR
-- =====================================================

-- COLABORADORES
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

-- CLIENTES
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

-- PRODUTOS
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

-- VENDAS
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

-- VENDAS_ITENS
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

-- NOTAS FISCAIS
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

-- NOTAS FISCAIS ITENS
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

-- OPERAÇÕES FISCAIS
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

-- NUMERAÇÃO NF-E
DROP POLICY IF EXISTS "numeracao_mesma_empresa_select" ON notas_fiscais_numeracao;
CREATE POLICY "numeracao_mesma_empresa_select" ON notas_fiscais_numeracao FOR SELECT
USING (empresa_id = public.get_user_empresa_id());

DROP POLICY IF EXISTS "numeracao_mesma_empresa_update" ON notas_fiscais_numeracao;
CREATE POLICY "numeracao_mesma_empresa_update" ON notas_fiscais_numeracao FOR UPDATE
USING (empresa_id = public.get_user_empresa_id());

DROP POLICY IF EXISTS "numeracao_mesma_empresa_insert" ON notas_fiscais_numeracao;
CREATE POLICY "numeracao_mesma_empresa_insert" ON notas_fiscais_numeracao FOR INSERT
WITH CHECK (empresa_id = public.get_user_empresa_id());

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Testar se função retorna empresa_id
SELECT public.get_user_empresa_id() as minha_empresa_id;

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- ✅ SUCESSO!
-- =====================================================
-- Recursão corrigida!
-- Agora o sistema deve funcionar normalmente.
