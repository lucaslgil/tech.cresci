-- =====================================================
-- ADICIONAR PERMISSÃO: vendas_parametros
-- Adiciona permissão para acessar parâmetros de vendas
-- Data: 17/12/2025
-- =====================================================

-- Adicionar permissão aos usuários Admin
UPDATE usuarios
SET permissoes = CASE 
  WHEN permissoes IS NULL THEN ARRAY['vendas_parametros']::text[]
  WHEN NOT (permissoes @> ARRAY['vendas_parametros']::text[]) THEN array_append(permissoes, 'vendas_parametros')
  ELSE permissoes
END
WHERE cargo = 'Admin';

-- Verificar permissões atualizadas
SELECT 
  nome,
  email,
  cargo,
  permissoes
FROM usuarios
WHERE cargo = 'Admin'
ORDER BY nome;
