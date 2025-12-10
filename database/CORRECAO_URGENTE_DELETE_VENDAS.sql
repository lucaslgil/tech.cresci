-- =====================================================
-- CORREÇÃO URGENTE: POLICY DE DELETE EM VENDAS
-- Problema: Policies muito restritivas impedem exclusão
-- Data: 09/12/2025
-- =====================================================

-- ====================================
-- TABELA: VENDAS
-- ====================================

-- Remover policy restritiva antiga
DROP POLICY IF EXISTS "Permitir exclusão de vendas" ON vendas;

-- Criar policy PERMISSIVA para DELETE
-- Permite exclusão de vendas em QUALQUER status para usuários autenticados
CREATE POLICY "Permitir exclusão de vendas"
ON vendas
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- ====================================
-- TABELA: VENDAS_ITENS
-- ====================================

-- Remover policy restritiva antiga
DROP POLICY IF EXISTS "Permitir exclusão de itens de vendas" ON vendas_itens;

-- Criar policy PERMISSIVA para DELETE
CREATE POLICY "Permitir exclusão de itens de vendas"
ON vendas_itens
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- ====================================
-- TABELA: VENDAS_PARCELAS
-- ====================================

-- Remover policy restritiva antiga
DROP POLICY IF EXISTS "Permitir exclusão de parcelas" ON vendas_parcelas;

-- Criar policy PERMISSIVA para DELETE
CREATE POLICY "Permitir exclusão de parcelas"
ON vendas_parcelas
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- ====================================
-- VERIFICAÇÃO
-- ====================================

-- Verificar policies criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('vendas', 'vendas_itens', 'vendas_parcelas')
  AND cmd = 'DELETE'
ORDER BY tablename, policyname;

-- ====================================
-- OBSERVAÇÃO
-- ====================================
-- ANTES: Só permitia excluir vendas com status ORCAMENTO ou CANCELADO
-- DEPOIS: Permite excluir vendas em QUALQUER status
-- 
-- Se precisar de controle de exclusão por status, 
-- implemente na aplicação (frontend/backend), não no RLS
-- ====================================
