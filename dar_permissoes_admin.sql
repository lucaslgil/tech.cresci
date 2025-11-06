-- ============================================================
-- DAR PERMISSÕES ADMINISTRATIVAS AO PRIMEIRO USUÁRIO
-- ============================================================
-- Data: 06 de Novembro de 2025
-- Objetivo: Dar todas as permissões ao primeiro usuário (admin)
-- ============================================================

-- IMPORTANTE: Substitua 'SEU-EMAIL@EXEMPLO.COM' pelo seu e-mail real!

-- 1. Atualizar permissões do primeiro usuário
UPDATE public.usuarios 
SET permissoes = '{"cadastro_empresa": true, "cadastro_colaborador": true, "inventario_item": true, "inventario_relatorio": true, "inventario_linhas": true, "configuracoes": true}'::jsonb,
    ativo = true,
    nome = COALESCE(nome, 'Administrador'),
    cargo = COALESCE(cargo, 'Administrador do Sistema')
WHERE email = 'SEU-EMAIL@EXEMPLO.COM';

-- 2. Verificar se a atualização foi bem-sucedida
SELECT 
  email,
  nome,
  cargo,
  ativo,
  permissoes->>'cadastro_empresa' as cadastro_empresa,
  permissoes->>'cadastro_colaborador' as cadastro_colaborador,
  permissoes->>'inventario_item' as inventario_item,
  permissoes->>'inventario_relatorio' as inventario_relatorio,
  permissoes->>'inventario_linhas' as inventario_linhas,
  permissoes->>'configuracoes' as configuracoes
FROM public.usuarios
WHERE email = 'SEU-EMAIL@EXEMPLO.COM';

-- ============================================================
-- ALTERNATIVA: Se não souber o e-mail, atualize o primeiro usuário
-- ============================================================
-- Descomente as linhas abaixo para dar permissões ao primeiro usuário criado

-- UPDATE public.usuarios 
-- SET permissoes = '{"cadastro_empresa": true, "cadastro_colaborador": true, "inventario_item": true, "inventario_relatorio": true, "inventario_linhas": true, "configuracoes": true}'::jsonb,
--     ativo = true,
--     nome = COALESCE(nome, 'Administrador'),
--     cargo = COALESCE(cargo, 'Administrador do Sistema')
-- WHERE id = (
--   SELECT id FROM public.usuarios ORDER BY created_at ASC LIMIT 1
-- );

-- ============================================================
-- VERIFICAR TODOS OS USUÁRIOS
-- ============================================================
SELECT 
  id,
  email,
  nome,
  cargo,
  ativo,
  permissoes,
  created_at
FROM public.usuarios
ORDER BY created_at;

-- ============================================================
-- NOTAS
-- ============================================================
-- 1. Execute este script APÓS criar a tabela usuarios
-- 2. Execute ANTES de tentar usar a tela de Configurações
-- 3. Substitua o e-mail pelo seu e-mail cadastrado
-- 4. Verifique se o update retornou 1 linha afetada
-- ============================================================
