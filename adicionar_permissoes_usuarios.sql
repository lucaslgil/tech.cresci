-- ============================================================
-- ADICIONAR COLUNA 'PERMISSOES' E 'ATIVO' NA TABELA USUARIOS
-- ============================================================
-- Data: 06 de Novembro de 2025
-- Objetivo: Adicionar colunas de permissões e status (se a tabela já existir)
-- ATENÇÃO: Se a tabela 'usuarios' não existe, execute primeiro 'criar_tabela_usuarios.sql'
-- ============================================================

-- 1. Adicionar coluna de permissões (JSONB para flexibilidade)
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS permissoes JSONB DEFAULT '{"cadastro_empresa": false, "cadastro_colaborador": false, "inventario_item": false, "inventario_relatorio": false, "inventario_linhas": false, "configuracoes": false}'::jsonb;

-- 2. Adicionar coluna de status ativo/inativo
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- 3. Criar índice para melhorar performance em buscas por status
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

-- 4. Criar índice GIN para buscas dentro do JSON de permissões
CREATE INDEX IF NOT EXISTS idx_usuarios_permissoes ON usuarios USING GIN (permissoes);

-- ============================================================
-- VERIFICAÇÕES (Execute após o ALTER TABLE)
-- ============================================================

-- 1. Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'usuarios' 
  AND column_name IN ('permissoes', 'ativo');

-- 2. Verificar estrutura atual da tabela
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- 3. Verificar usuários existentes
SELECT id, email, nome, ativo, permissoes
FROM usuarios
LIMIT 10;

-- 4. Verificar índices criados
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'usuarios'
  AND indexname IN ('idx_usuarios_ativo', 'idx_usuarios_permissoes');

-- ============================================================
-- ATUALIZAR PERMISSÕES DE USUÁRIOS EXISTENTES (OPCIONAL)
-- ============================================================

-- Exemplo: Dar todas as permissões para um usuário administrador
-- UPDATE usuarios 
-- SET permissoes = '{"cadastro_empresa": true, "cadastro_colaborador": true, "inventario_item": true, "inventario_relatorio": true, "inventario_linhas": true, "configuracoes": true}'::jsonb
-- WHERE email = 'admin@empresa.com';

-- Exemplo: Dar permissões específicas para um usuário
-- UPDATE usuarios 
-- SET permissoes = '{"cadastro_empresa": false, "cadastro_colaborador": true, "inventario_item": true, "inventario_relatorio": true, "inventario_linhas": false, "configuracoes": false}'::jsonb
-- WHERE email = 'usuario@empresa.com';

-- ============================================================
-- CONSULTAS ÚTEIS
-- ============================================================

-- Listar usuários ativos
SELECT id, email, nome, cargo, ativo
FROM usuarios
WHERE ativo = true
ORDER BY nome;

-- Listar usuários inativos
SELECT id, email, nome, cargo, ativo
FROM usuarios
WHERE ativo = false
ORDER BY nome;

-- Listar usuários com permissão de configurações
SELECT id, email, nome, permissoes
FROM usuarios
WHERE permissoes->>'configuracoes' = 'true';

-- Listar usuários com permissão de cadastro de empresa
SELECT id, email, nome, permissoes
FROM usuarios
WHERE permissoes->>'cadastro_empresa' = 'true';

-- Contar usuários por status
SELECT 
  ativo,
  COUNT(*) as total
FROM usuarios
GROUP BY ativo;

-- Ver todas as permissões de um usuário específico
SELECT 
  email,
  nome,
  permissoes->>'cadastro_empresa' as cadastro_empresa,
  permissoes->>'cadastro_colaborador' as cadastro_colaborador,
  permissoes->>'inventario_item' as inventario_item,
  permissoes->>'inventario_relatorio' as inventario_relatorio,
  permissoes->>'inventario_linhas' as inventario_linhas,
  permissoes->>'configuracoes' as configuracoes
FROM usuarios
WHERE email = 'usuario@empresa.com';

-- ============================================================
-- ROLLBACK (Em caso de erro ou necessidade de reverter)
-- ============================================================
-- CUIDADO: Isso removerá as colunas e todos os dados nelas!
-- 
-- DROP INDEX IF EXISTS idx_usuarios_ativo;
-- DROP INDEX IF EXISTS idx_usuarios_permissoes;
-- ALTER TABLE usuarios DROP COLUMN IF EXISTS permissoes;
-- ALTER TABLE usuarios DROP COLUMN IF EXISTS ativo;

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================
-- 1. JSONB permite flexibilidade para adicionar novas permissões no futuro
-- 2. Índice GIN no JSONB permite buscas eficientes dentro das permissões
-- 3. Por padrão, novos usuários terão ativo=true e todas permissões=false
-- 4. Usuários existentes receberão as novas colunas com valores padrão
-- 5. Recomenda-se atualizar manualmente as permissões dos usuários existentes
-- 6. O campo 'ativo' permite desativar usuários sem deletá-los do banco
-- ============================================================

-- ============================================================
-- ESTRUTURA ESPERADA DA TABELA USUARIOS
-- ============================================================
-- id (UUID, PK, referencia auth.users)
-- email (TEXT, UNIQUE, NOT NULL)
-- nome (TEXT)
-- telefone (TEXT)
-- cargo (TEXT)
-- foto_perfil (TEXT)
-- permissoes (JSONB) - NOVA COLUNA
-- ativo (BOOLEAN) - NOVA COLUNA
-- created_at (TIMESTAMP)
-- updated_at (TIMESTAMP)
-- ============================================================
