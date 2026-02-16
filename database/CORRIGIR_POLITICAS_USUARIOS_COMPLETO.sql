-- =====================================================
-- CORRIGIR POLÍTICAS DE USUARIOS - PERMITIR GESTÃO COMPLETA
-- =====================================================

-- PROBLEMA: 
-- 1. Política UPDATE só permite editar o próprio registro
-- 2. Não permite administrador gerenciar outros usuários
-- 3. Não permite criar novos usuários da empresa

-- SOLUÇÃO: Permitir gerenciar todos os usuários da mesma empresa

-- =====================================================
-- REMOVER TODAS AS POLÍTICAS EXISTENTES
-- =====================================================

DROP POLICY IF EXISTS "usuarios_ver_proprio_registro" ON usuarios;
DROP POLICY IF EXISTS "usuarios_editar_proprio_registro" ON usuarios;
DROP POLICY IF EXISTS "service_role_inserir_usuarios" ON usuarios;
DROP POLICY IF EXISTS "usuarios_ver_mesma_empresa" ON usuarios;
DROP POLICY IF EXISTS "usuarios_inserir_mesma_empresa" ON usuarios;
DROP POLICY IF EXISTS "usuarios_atualizar_mesma_empresa" ON usuarios;
DROP POLICY IF EXISTS "usuarios_deletar_mesma_empresa" ON usuarios;

-- =====================================================
-- CRIAR POLÍTICAS CORRETAS - GESTÃO COMPLETA DA EMPRESA
-- =====================================================

-- 1. SELECT: Ver todos os usuários da mesma empresa
CREATE POLICY "usuarios_ver_mesma_empresa" ON usuarios FOR SELECT
USING (empresa_id = public.get_user_empresa_id());

-- 2. INSERT: Criar novos usuários na mesma empresa
CREATE POLICY "usuarios_inserir_mesma_empresa" ON usuarios FOR INSERT
WITH CHECK (empresa_id = public.get_user_empresa_id());

-- 3. UPDATE: Atualizar usuários da mesma empresa
CREATE POLICY "usuarios_atualizar_mesma_empresa" ON usuarios FOR UPDATE
USING (empresa_id = public.get_user_empresa_id())
WITH CHECK (empresa_id = public.get_user_empresa_id());

-- 4. DELETE: Deletar usuários da mesma empresa (exceto a si mesmo)
CREATE POLICY "usuarios_deletar_mesma_empresa" ON usuarios FOR DELETE
USING (
  empresa_id = public.get_user_empresa_id() 
  AND id != auth.uid()  -- Não pode deletar a si mesmo
);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Ver todas as políticas aplicadas
SELECT 
  tablename,
  policyname,
  cmd as "Comando",
  qual as "Condição USING",
  with_check as "Condição WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'usuarios'
ORDER BY cmd, policyname;

-- Testar: Deve retornar todos os usuários da sua empresa
SELECT id, nome, email, cargo, empresa_id 
FROM usuarios
ORDER BY nome;

-- =====================================================
-- ✅ RESULTADO ESPERADO
-- =====================================================
-- SELECT: Ver todos os usuários da empresa
-- INSERT: Criar novos usuários na empresa
-- UPDATE: Editar permissões de qualquer usuário da empresa
-- DELETE: Remover usuários (exceto você mesmo)
