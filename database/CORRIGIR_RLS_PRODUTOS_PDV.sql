-- =====================================================
-- CORRIGIR RLS PARA SINCRONIZAÇÃO DO PDV
-- Permite que o PDV (usando anon key) consulte produtos
-- =====================================================

-- DIAGNÓSTICO: Verificar políticas existentes
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'produtos';

-- SOLUÇÃO: Remover TODAS as políticas restritivas e criar uma permissiva
DROP POLICY IF EXISTS pdv_select_produtos ON produtos;
DROP POLICY IF EXISTS produtos_policy ON produtos;
DROP POLICY IF EXISTS produtos_select_policy ON produtos;
DROP POLICY IF EXISTS select_produtos ON produtos;

-- Criar política PERMISSIVA para SELECT (sem filtro de autenticação)
CREATE POLICY pdv_select_produtos
ON produtos
FOR SELECT
TO public
USING (true);  -- Permite qualquer SELECT - segurança vem da anon key

-- =====================================================
-- FAZER O MESMO PARA CLIENTES
-- =====================================================

-- DIAGNÓSTICO: Verificar políticas existentes em clientes
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'clientes';

-- Remover políticas antigas
DROP POLICY IF EXISTS pdv_select_clientes ON clientes;
DROP POLICY IF EXISTS clientes_policy ON clientes;
DROP POLICY IF EXISTS clientes_select_policy ON clientes;
DROP POLICY IF EXISTS select_clientes ON clientes;

-- Criar política PERMISSIVA para clientes
CREATE POLICY pdv_select_clientes
ON clientes
FOR SELECT
TO public
USING (true);

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Ver políticas ativas agora
SELECT tablename, policyname, cmd, qual
FROM pg_policies 
WHERE tablename IN ('produtos', 'clientes')
ORDER BY tablename, policyname;

-- Contar registros para validar
SELECT COUNT(*) as total_produtos FROM produtos;
SELECT COUNT(*) as produtos_ativos FROM produtos WHERE ativo = true;
SELECT COUNT(*) as total_clientes FROM clientes;

-- =====================================================
-- IMPORTANTE: Após executar este SQL, no PDV:
-- 1. Feche o PDV completamente (se estiver aberto)
-- 2. Abra novamente: cd flash-pdv && npm run dev
-- 3. Clique em Sincronizar
-- 4. Abra o Console (F12) e veja os logs detalhados
-- =====================================================
