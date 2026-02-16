-- =====================================================
-- CORRIGIR POLÍTICA DE USUÁRIOS - PERMITIR VER MESMA EMPRESA
-- =====================================================

-- PROBLEMA: Política atual só permite ver o próprio registro
-- SOLUÇÃO: Permitir ver todos os usuários da mesma empresa

-- =====================================================
-- REMOVER POLÍTICA MUITO RESTRITIVA
-- =====================================================

DROP POLICY IF EXISTS "usuarios_ver_proprio_registro" ON usuarios;

-- =====================================================
-- CRIAR POLÍTICA CORRETA - VER USUÁRIOS DA MESMA EMPRESA
-- =====================================================

-- Usuários podem ver todos os registros da mesma empresa
-- Usa a função helper para evitar recursão
CREATE POLICY "usuarios_ver_mesma_empresa" ON usuarios FOR SELECT
USING (empresa_id = public.get_user_empresa_id());

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Ver política aplicada
SELECT 
  tablename,
  policyname,
  cmd as "Comando",
  qual as "Condição"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'usuarios'
ORDER BY policyname;

-- Testar: Deve retornar todos os usuários da sua empresa
SELECT id, nome, email, cargo, empresa_id 
FROM usuarios
ORDER BY nome;

-- =====================================================
-- ✅ RESULTADO ESPERADO
-- =====================================================
-- Você deve ver TODOS os usuários da sua empresa agora!
