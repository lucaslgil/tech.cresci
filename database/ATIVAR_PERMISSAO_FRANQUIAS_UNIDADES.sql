-- =====================================================
-- ATIVAR PERMISSÃO franquias_unidades
-- Execute no Supabase → SQL Editor
-- =====================================================

-- 1. Ver todos os usuários e suas permissões atuais de franquias
SELECT
  id,
  email,
  nome,
  permissoes->>'franquias'          AS franquias,
  permissoes->>'franquias_unidades' AS franquias_unidades
FROM usuarios
ORDER BY nome;

-- =====================================================
-- 2. Ativar franquias_unidades para TODOS os usuários
--    que já têm franquias = true
-- =====================================================
UPDATE usuarios
SET permissoes = permissoes || '{"franquias_unidades": true}'::jsonb
WHERE (permissoes->>'franquias')::boolean = true;

-- =====================================================
-- 3. Ativar para UM usuário específico pelo e-mail
--    (substitua o e-mail abaixo)
-- =====================================================
-- UPDATE usuarios
-- SET permissoes = permissoes || '{"franquias": true, "franquias_unidades": true}'::jsonb
-- WHERE email = 'seu@email.com';

-- =====================================================
-- 4. Ativar para TODOS os usuários (sem filtro)
-- =====================================================
-- UPDATE usuarios
-- SET permissoes = permissoes || '{"franquias_unidades": true}'::jsonb
-- WHERE permissoes IS NOT NULL;

-- =====================================================
-- 5. Verificar resultado após atualização
-- =====================================================
SELECT
  id,
  email,
  nome,
  permissoes->>'franquias_unidades' AS franquias_unidades
FROM usuarios;
