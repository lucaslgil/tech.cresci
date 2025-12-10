-- =====================================================
-- ANÁLISE E CORREÇÃO COMPLETA DE POLICIES DE DELETE
-- Verificar e corrigir todas as tabelas principais
-- Data: 09/12/2025
-- =====================================================

-- ====================================
-- VERIFICAR POLICIES ATUAIS
-- ====================================

-- Ver todas as policies de DELETE no banco
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'DELETE' THEN '🗑️ DELETE'
    WHEN cmd = 'SELECT' THEN '👁️ SELECT'
    WHEN cmd = 'INSERT' THEN '➕ INSERT'
    WHEN cmd = 'UPDATE' THEN '✏️ UPDATE'
    ELSE cmd
  END as operacao,
  qual as condicao
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'DELETE'
ORDER BY tablename, policyname;

-- ====================================
-- CORREÇÕES NECESSÁRIAS
-- ====================================

-- VENDAS e relacionadas (CRÍTICO)
DROP POLICY IF EXISTS "Permitir exclusão de vendas" ON vendas;
CREATE POLICY "Permitir exclusão de vendas"
  ON vendas FOR DELETE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Permitir exclusão de itens de vendas" ON vendas_itens;
CREATE POLICY "Permitir exclusão de itens de vendas"
  ON vendas_itens FOR DELETE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Permitir exclusão de parcelas" ON vendas_parcelas;
CREATE POLICY "Permitir exclusão de parcelas"
  ON vendas_parcelas FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- CONTAS A RECEBER e relacionadas (CRÍTICO)
DROP POLICY IF EXISTS "Permitir exclusão de contas a receber" ON contas_receber;
CREATE POLICY "Permitir exclusão de contas a receber"
  ON contas_receber FOR DELETE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Permitir exclusão de pagamentos" ON pagamentos_receber;
CREATE POLICY "Permitir exclusão de pagamentos"
  ON pagamentos_receber FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- PRODUTOS
DROP POLICY IF EXISTS "Permitir exclusão de produtos" ON produtos;
CREATE POLICY "Permitir exclusão de produtos"
  ON produtos FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- CLIENTES
DROP POLICY IF EXISTS "Permitir exclusão de clientes" ON clientes;
CREATE POLICY "Permitir exclusão de clientes"
  ON clientes FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- EMPRESAS
DROP POLICY IF EXISTS "Permitir exclusão de empresas" ON empresas;
CREATE POLICY "Permitir exclusão de empresas"
  ON empresas FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- COLABORADORES
DROP POLICY IF EXISTS "Permitir exclusão de colaboradores" ON colaboradores;
CREATE POLICY "Permitir exclusão de colaboradores"
  ON colaboradores FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ITENS (Inventário)
DROP POLICY IF EXISTS "Permitir exclusão de itens" ON itens;
CREATE POLICY "Permitir exclusão de itens"
  ON itens FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- LINHAS TELEFÔNICAS
DROP POLICY IF EXISTS "Permitir exclusão de linhas" ON linhas_telefonicas;
CREATE POLICY "Permitir exclusão de linhas"
  ON linhas_telefonicas FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- TAREFAS
DROP POLICY IF EXISTS "Permitir exclusão de tarefas" ON tarefas;
CREATE POLICY "Permitir exclusão de tarefas"
  ON tarefas FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ====================================
-- VERIFICAÇÃO PÓS-CORREÇÃO
-- ====================================

-- Contar quantas policies de DELETE foram criadas
SELECT 
  COUNT(*) as total_policies_delete,
  STRING_AGG(DISTINCT tablename, ', ' ORDER BY tablename) as tabelas_com_delete
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'DELETE';

-- Verificar tabelas SEM policy de DELETE
SELECT DISTINCT 
  t.tablename,
  CASE 
    WHEN p.policyname IS NULL THEN '❌ SEM POLICY DELETE'
    ELSE '✅ TEM POLICY DELETE'
  END as status
FROM pg_tables t
LEFT JOIN pg_policies p 
  ON p.tablename = t.tablename 
  AND p.cmd = 'DELETE'
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT LIKE 'sql_%'
  AND t.tablename NOT IN ('_prisma_migrations', 'schema_migrations')
ORDER BY status, t.tablename;

-- ====================================
-- RESUMO
-- ====================================
-- Este script:
-- 1. Lista todas as policies DELETE atuais
-- 2. Cria/atualiza policies para tabelas principais
-- 3. Verifica quais tabelas ainda não têm policy
-- 
-- IMPORTANTE: Todas as policies criadas permitem DELETE
-- para qualquer usuário autenticado (auth.uid() IS NOT NULL)
-- ====================================
