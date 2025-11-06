-- ============================================================
-- RECRIAR POLÍTICAS RLS DA TABELA USUARIOS
-- ============================================================
-- Data: 06 de Novembro de 2025
-- Objetivo: Corrigir políticas RLS para permitir que admins vejam todos os usuários
-- ============================================================

-- 1. Remover políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Admins podem gerenciar todos os usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Ver próprio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Admins podem ver todos" ON public.usuarios;
DROP POLICY IF EXISTS "Atualizar próprio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Admins podem criar usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Admins podem atualizar usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Admins podem deletar usuários" ON public.usuarios;

-- 2. Criar novas políticas

-- Política 1: Usuários podem ver seu próprio perfil
CREATE POLICY "Ver próprio perfil"
  ON public.usuarios
  FOR SELECT
  USING (auth.uid() = id);

-- Política 2: Admins podem ver todos os usuários
CREATE POLICY "Admins podem ver todos"
  ON public.usuarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
      AND ativo = true
      AND permissoes->>'configuracoes' = 'true'
    )
  );

-- Política 3: Usuários podem atualizar seu próprio perfil (nome, telefone, cargo, foto)
CREATE POLICY "Atualizar próprio perfil"
  ON public.usuarios
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política 4: Admins podem inserir novos usuários
CREATE POLICY "Admins podem criar usuários"
  ON public.usuarios
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
      AND ativo = true
      AND permissoes->>'configuracoes' = 'true'
    )
  );

-- Política 5: Admins podem atualizar qualquer usuário
CREATE POLICY "Admins podem atualizar usuários"
  ON public.usuarios
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
      AND ativo = true
      AND permissoes->>'configuracoes' = 'true'
    )
  );

-- Política 6: Admins podem deletar usuários
CREATE POLICY "Admins podem deletar usuários"
  ON public.usuarios
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
      AND ativo = true
      AND permissoes->>'configuracoes' = 'true'
    )
  );

-- ============================================================
-- VERIFICAÇÕES
-- ============================================================

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'usuarios'
ORDER BY policyname;

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================
-- 1. Agora usuários com permissao->>'configuracoes' = 'true' podem:
--    - Ver todos os usuários (SELECT)
--    - Criar novos usuários (INSERT)
--    - Atualizar qualquer usuário (UPDATE)
--    - Deletar usuários (DELETE)
-- 2. Usuários comuns podem apenas:
--    - Ver seu próprio perfil (SELECT)
--    - Atualizar seu próprio perfil (UPDATE)
-- 3. As políticas são cumulativas (OR lógico)
-- ============================================================
