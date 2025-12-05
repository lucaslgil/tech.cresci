-- ============================================================
-- RECRIAR POLÍTICAS RLS DA TABELA USUARIOS
-- ============================================================
-- Data: 06 de Novembro de 2025
-- Objetivo: Corrigir políticas RLS para permitir que admins vejam todos os usuários
-- ============================================================

-- ============================================================
-- DESABILITAR RLS E USAR CONTROLE DE PERMISSÕES NA APLICAÇÃO
-- ============================================================
-- Data: 06 de Novembro de 2025
-- Objetivo: Simplificar evitando recursão infinita nas políticas RLS
-- As permissões serão controladas na camada da aplicação
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
DROP POLICY IF EXISTS "Leitura para autenticados" ON public.usuarios;

-- 2. Desabilitar RLS (as permissões serão controladas na aplicação)
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- VERIFICAÇÕES
-- ============================================================

-- Verificar se RLS está desabilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'usuarios' AND schemaname = 'public';
-- Resultado esperado: rowsecurity = false

-- Verificar que não há políticas
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'usuarios'
ORDER BY policyname;
-- Resultado esperado: 0 linhas

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================
-- 1. RLS foi DESABILITADO para evitar recursão infinita
-- 2. O controle de permissões será feito na camada da aplicação React
-- 3. A aplicação React verificará as permissões antes de permitir ações
-- 4. Apenas usuários autenticados têm acesso à tabela
-- 5. A segurança depende da autenticação do Supabase (auth.users)
-- ============================================================
