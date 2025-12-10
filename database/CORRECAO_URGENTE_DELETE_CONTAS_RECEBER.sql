-- =====================================================
-- CORREÇÃO URGENTE: ADICIONAR POLICY DE DELETE
-- Tabela: contas_receber
-- Data: 09/12/2025
-- =====================================================

-- Policy: Usuários autenticados podem excluir contas a receber
CREATE POLICY "Permitir exclusão de contas a receber"
  ON contas_receber FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Policy: Usuários autenticados podem excluir pagamentos
CREATE POLICY "Permitir exclusão de pagamentos"
  ON pagamentos_receber FOR DELETE
  USING (auth.uid() IS NOT NULL);
