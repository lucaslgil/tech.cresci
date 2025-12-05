-- ============================================================
-- ADICIONAR COLUNA 'OPERADORA' NA TABELA LINHAS_TELEFONICAS
-- ============================================================
-- Data: 04 de Novembro de 2025
-- Objetivo: Adicionar campo para armazenar a operadora da linha telefônica
-- ============================================================

-- Adicionar a coluna 'operadora' na tabela linhas_telefonicas
ALTER TABLE linhas_telefonicas 
ADD COLUMN operadora TEXT NOT NULL DEFAULT 'Não informada';

-- Remover o valor default após a adição (para novas inserções serem obrigatórias)
ALTER TABLE linhas_telefonicas 
ALTER COLUMN operadora DROP DEFAULT;

-- Opcional: Criar índice para melhorar performance em buscas por operadora
CREATE INDEX idx_linhas_telefonicas_operadora ON linhas_telefonicas(operadora);

-- ============================================================
-- VERIFICAÇÕES (Execute após o ALTER TABLE)
-- ============================================================

-- 1. Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'linhas_telefonicas' 
  AND column_name = 'operadora';

-- 2. Verificar registros existentes (devem ter 'Não informada')
SELECT id, numero_linha, operadora
FROM linhas_telefonicas
LIMIT 10;

-- 3. Verificar índice criado
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'linhas_telefonicas'
  AND indexname = 'idx_linhas_telefonicas_operadora';

-- ============================================================
-- ATUALIZAR REGISTROS EXISTENTES (OPCIONAL)
-- ============================================================
-- Se você deseja atualizar os registros existentes com operadoras específicas,
-- execute comandos UPDATE conforme necessário:

-- Exemplo:
-- UPDATE linhas_telefonicas 
-- SET operadora = 'Vivo' 
-- WHERE numero_linha LIKE '(11)%';

-- UPDATE linhas_telefonicas 
-- SET operadora = 'Claro' 
-- WHERE numero_linha LIKE '(21)%';

-- ============================================================
-- ROLLBACK (Em caso de erro ou necessidade de reverter)
-- ============================================================
-- CUIDADO: Isso removerá a coluna e todos os dados nela!
-- 
-- DROP INDEX IF EXISTS idx_linhas_telefonicas_operadora;
-- ALTER TABLE linhas_telefonicas DROP COLUMN IF EXISTS operadora;

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================
-- 1. A coluna é criada como NOT NULL, mas com default temporário
-- 2. O default 'Não informada' é removido após criação para forçar
--    preenchimento em novos registros
-- 3. Registros existentes ficarão com 'Não informada' até serem atualizados
-- 4. O índice ajuda em queries de filtro por operadora
-- ============================================================
