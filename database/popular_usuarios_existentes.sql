-- ============================================================
-- POPULAR TABELA USUARIOS COM USUÁRIOS EXISTENTES DO AUTH.USERS
-- ============================================================
-- Data: 06 de Novembro de 2025
-- Objetivo: Sincronizar usuários do Supabase Authentication com a tabela usuarios
-- ============================================================

-- 1. Inserir todos os usuários do auth.users na tabela usuarios
INSERT INTO public.usuarios (id, email, nome, ativo, permissoes)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'nome', email) as nome,
  true as ativo,
  '{"cadastro_empresa": false, "cadastro_colaborador": false, "inventario_item": false, "inventario_relatorio": false, "inventario_linhas": false, "configuracoes": false}'::jsonb as permissoes
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.usuarios WHERE usuarios.id = users.id
)
AND deleted_at IS NULL;  -- Apenas usuários não deletados

-- 2. Verificar quantos usuários foram inseridos
SELECT 
  'Usuários inseridos' as operacao,
  COUNT(*) as total
FROM public.usuarios;

-- 3. Listar todos os usuários agora na tabela
SELECT 
  id,
  email,
  nome,
  cargo,
  ativo,
  permissoes,
  created_at
FROM public.usuarios
ORDER BY created_at DESC;

-- ============================================================
-- VERIFICAÇÃO: Comparar auth.users com public.usuarios
-- ============================================================

-- Ver usuários que estão no auth.users mas NÃO estão em usuarios
SELECT 
  'Em auth.users mas não em usuarios' as status,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN public.usuarios p ON u.id = p.id
WHERE p.id IS NULL
  AND u.deleted_at IS NULL;

-- Ver total em cada tabela
SELECT 
  'auth.users' as tabela,
  COUNT(*) as total
FROM auth.users
WHERE deleted_at IS NULL
UNION ALL
SELECT 
  'public.usuarios' as tabela,
  COUNT(*) as total
FROM public.usuarios;

-- ============================================================
-- PRÓXIMO PASSO: DAR PERMISSÕES AO ADMINISTRADOR
-- ============================================================
-- Após popular a tabela, execute um dos comandos abaixo:

-- OPÇÃO 1: Se souber seu e-mail
-- UPDATE public.usuarios 
-- SET permissoes = '{"cadastro_empresa": true, "cadastro_colaborador": true, "inventario_item": true, "inventario_relatorio": true, "inventario_linhas": true, "configuracoes": true}'::jsonb,
--     nome = COALESCE(nome, 'Administrador'),
--     cargo = 'Administrador do Sistema'
-- WHERE email = 'paulo.pinheiro@crescieperdi.com.br';

-- OPÇÃO 2: Dar permissão ao primeiro usuário cadastrado
-- UPDATE public.usuarios 
-- SET permissoes = '{"cadastro_empresa": true, "cadastro_colaborador": true, "inventario_item": true, "inventario_relatorio": true, "inventario_linhas": true, "configuracoes": true}'::jsonb,
--     nome = COALESCE(nome, 'Administrador'),
--     cargo = 'Administrador do Sistema'
-- WHERE id = (SELECT id FROM public.usuarios ORDER BY created_at ASC LIMIT 1);

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================
-- 1. Este script é IDEMPOTENTE (pode ser executado várias vezes sem problemas)
-- 2. Usa WHERE NOT EXISTS para evitar duplicatas
-- 3. Todos os usuários são inseridos com permissões = false por padrão
-- 4. Todos os usuários são inseridos como ativo = true
-- 5. O trigger handle_new_user() cuidará de novos usuários daqui pra frente
-- 6. Usuários deletados (deleted_at IS NOT NULL) são ignorados
-- ============================================================
