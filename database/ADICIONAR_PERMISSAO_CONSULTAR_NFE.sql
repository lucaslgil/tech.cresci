-- =====================================================
-- ADICIONAR PERMISSÃO: CONSULTAR NOTAS FISCAIS
-- Data: 26/01/2026
-- =====================================================

-- Adicionar nova permissão para consultar notas fiscais no campo JSON permissoes
-- Esta permissão permite visualizar, filtrar e exportar notas fiscais emitidas

-- Atualizar campo JSON permissoes para todos os usuários ativos
UPDATE usuarios 
SET permissoes = jsonb_set(
  COALESCE(permissoes, '{}'::jsonb),
  '{notas_fiscais_consultar}',
  'true',
  true
)
WHERE ativo = true;

-- Verificar resultado
SELECT 
  id,
  nome,
  email,
  permissoes->'notas_fiscais_consultar' as notas_fiscais_consultar,
  permissoes->'notas_fiscais_emitir' as notas_fiscais_emitir
FROM usuarios
WHERE ativo = true
ORDER BY nome;

-- Permissão "Consultar Notas Fiscais" configurada com sucesso!
