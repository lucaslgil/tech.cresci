-- =====================================================
-- ADICIONAR PERMISSÕES DE FRANQUIAS AOS USUÁRIOS ATIVOS
-- Data: 2026-03-05
-- Descrição: Inclui as chaves franquias, franquias_unidades
--            e franquias_parametros no JSON de permissões
--            dos usuários que ainda não as possuem.
--
-- ⚠️  ATENÇÃO: Este script apenas ADICIONA as chaves com
--    valor false nos usuários que ainda não as têm.
--    Para conceder acesso, edite o usuário pela tela
--    Configurações > Usuários.
-- =====================================================

-- Adicionar chave 'franquias' (false) onde ainda não existe
UPDATE usuarios
SET permissoes = jsonb_set(
  COALESCE(permissoes, '{}'::jsonb),
  '{franquias}',
  'false',
  true
)
WHERE ativo = true
  AND NOT (permissoes ? 'franquias');

-- Adicionar chave 'franquias_unidades' (false) onde ainda não existe
UPDATE usuarios
SET permissoes = jsonb_set(
  COALESCE(permissoes, '{}'::jsonb),
  '{franquias_unidades}',
  'false',
  true
)
WHERE ativo = true
  AND NOT (permissoes ? 'franquias_unidades');

-- Adicionar chave 'franquias_parametros' (false) onde ainda não existe
UPDATE usuarios
SET permissoes = jsonb_set(
  COALESCE(permissoes, '{}'::jsonb),
  '{franquias_parametros}',
  'false',
  true
)
WHERE ativo = true
  AND NOT (permissoes ? 'franquias_parametros');

-- ── Para conceder acesso a um usuário específico: ──────────────────────
-- Substitua 'SEU_USER_ID_AQUI' pelo UUID do usuário desejado.
--
-- UPDATE usuarios
-- SET permissoes = jsonb_set(
--   COALESCE(permissoes, '{}'::jsonb),
--   '{franquias_parametros}',
--   'true',
--   true
-- )
-- WHERE id = 'SEU_USER_ID_AQUI';
