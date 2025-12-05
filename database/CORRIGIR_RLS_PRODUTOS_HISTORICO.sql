-- =====================================================
-- CORREÇÃO: Adicionar política RLS faltante
-- Tabela: produtos_precos_historico
-- Data: 04/12/2025
-- =====================================================

-- Adicionar política de INSERT para produtos_precos_historico
-- Isso permite que o trigger registre automaticamente o histórico de preços

-- Remover política se já existir (para evitar erro de duplicação)
DROP POLICY IF EXISTS "Usuários autenticados podem inserir histórico de preços" ON public.produtos_precos_historico;

-- Criar política de INSERT
CREATE POLICY "Usuários autenticados podem inserir histórico de preços"
  ON public.produtos_precos_historico
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Verificar políticas ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'produtos_precos_historico'
ORDER BY policyname;
