-- =====================================================
-- CORRIGIR RLS PARA OPERAÇÕES FISCAIS
-- Execute este script no Supabase SQL Editor
-- Data: 14/01/2026
-- =====================================================
-- 
-- Este script corrige as políticas RLS para permitir
-- que usuários autenticados possam inserir/editar/deletar
-- operações fiscais
-- 
-- =====================================================

-- =====================================================
-- 1. REMOVER TODAS AS POLICIES EXISTENTES
-- =====================================================

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar Operações Fiscais" ON operacoes_fiscais;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir Operações Fiscais" ON operacoes_fiscais;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar Operações Fiscais" ON operacoes_fiscais;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar Operações Fiscais" ON operacoes_fiscais;

DROP POLICY IF EXISTS "Permitir leitura Operações Fiscais" ON operacoes_fiscais;
DROP POLICY IF EXISTS "Permitir inserção Operações admin" ON operacoes_fiscais;
DROP POLICY IF EXISTS "Permitir atualização Operações admin" ON operacoes_fiscais;
DROP POLICY IF EXISTS "Permitir deleção Operações admin" ON operacoes_fiscais;

-- =====================================================
-- 2. CRIAR NOVAS POLICIES CORRETAS
-- =====================================================

-- Política de leitura (SELECT) - todos os usuários autenticados
CREATE POLICY "Usuários autenticados podem visualizar Operações Fiscais"
  ON operacoes_fiscais
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política de inserção (INSERT) - todos os usuários autenticados
CREATE POLICY "Usuários autenticados podem inserir Operações Fiscais"
  ON operacoes_fiscais
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização (UPDATE) - todos os usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar Operações Fiscais"
  ON operacoes_fiscais
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Política de deleção (DELETE) - todos os usuários autenticados
CREATE POLICY "Usuários autenticados podem deletar Operações Fiscais"
  ON operacoes_fiscais
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- =====================================================
-- 3. VERIFICAR SE RLS ESTÁ HABILITADO
-- =====================================================

ALTER TABLE operacoes_fiscais ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. VERIFICAR AS POLICIES CRIADAS
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'operacoes_fiscais'
ORDER BY policyname;

-- =====================================================
-- FIM DA CORREÇÃO
-- =====================================================

SELECT 'Policies RLS para operacoes_fiscais corrigidas com sucesso!' AS resultado;
