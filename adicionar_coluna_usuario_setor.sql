-- ============================================================
-- ADICIONAR COLUNA 'USUARIO_SETOR' NA TABELA LINHAS_TELEFONICAS
-- ============================================================
-- Data: 04 de Novembro de 2025
-- Objetivo: Adicionar campo de texto livre para armazenar usuário ou setor da linha telefônica
-- ============================================================

-- Adicionar a coluna 'usuario_setor' na tabela linhas_telefonicas
ALTER TABLE linhas_telefonicas 
ADD COLUMN usuario_setor VARCHAR(30) NULL;

-- Criar índice para melhorar performance em buscas por usuario_setor
CREATE INDEX idx_linhas_telefonicas_usuario_setor ON linhas_telefonicas(usuario_setor);

-- ============================================================
-- VERIFICAÇÕES (Execute após o ALTER TABLE)
-- ============================================================

-- 1. Verificar se a coluna foi adicionada
SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'linhas_telefonicas' 
  AND column_name = 'usuario_setor';

-- 2. Verificar registros existentes (devem ter NULL)
SELECT id, numero_linha, operadora, usuario_setor, plano
FROM linhas_telefonicas
LIMIT 10;

-- 3. Verificar índice criado
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'linhas_telefonicas'
  AND indexname = 'idx_linhas_telefonicas_usuario_setor';

-- ============================================================
-- ATUALIZAR REGISTROS EXISTENTES (OPCIONAL)
-- ============================================================
-- Se você deseja atualizar os registros existentes com usuários/setores específicos,
-- execute comandos UPDATE conforme necessário:

-- Exemplo:
-- UPDATE linhas_telefonicas 
-- SET usuario_setor = 'TI - Suporte' 
-- WHERE operadora = 'Vivo';

-- UPDATE linhas_telefonicas 
-- SET usuario_setor = 'Vendas' 
-- WHERE plano LIKE '%Controle%';

-- ============================================================
-- ROLLBACK (Em caso de erro ou necessidade de reverter)
-- ============================================================
-- CUIDADO: Isso removerá a coluna e todos os dados nela!
-- 
-- DROP INDEX IF EXISTS idx_linhas_telefonicas_usuario_setor;
-- ALTER TABLE linhas_telefonicas DROP COLUMN IF EXISTS usuario_setor;

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================
-- 1. A coluna aceita NULL (campo opcional)
-- 2. Tamanho máximo: 30 caracteres (VARCHAR(30))
-- 3. Pode conter qualquer texto livre
-- 4. Útil para identificar usuário final ou setor que usa a linha
-- 5. Diferente de 'responsavel_id' que referencia um colaborador cadastrado
-- 6. Exemplos de uso:
--    - "TI - Suporte"
--    - "Vendas"
--    - "Marketing"
--    - "João - Administrativo"
--    - "Recepção"
-- 7. O índice ajuda em queries de filtro por usuario_setor
-- ============================================================

-- ============================================================
-- CONSULTAS ÚTEIS
-- ============================================================

-- Listar todas as linhas com usuario_setor preenchido
SELECT numero_linha, operadora, usuario_setor, plano
FROM linhas_telefonicas
WHERE usuario_setor IS NOT NULL
ORDER BY usuario_setor;

-- Contar linhas por usuario_setor
SELECT usuario_setor, COUNT(*) as total
FROM linhas_telefonicas
WHERE usuario_setor IS NOT NULL
GROUP BY usuario_setor
ORDER BY total DESC;

-- Listar linhas sem usuario_setor definido
SELECT id, numero_linha, operadora, plano
FROM linhas_telefonicas
WHERE usuario_setor IS NULL;

-- ============================================================
