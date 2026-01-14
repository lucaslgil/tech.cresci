-- ============================================================
-- ADICIONAR CAMPO 'TELEFONE_COMERCIAL_ID' NA TABELA COLABORADORES
-- ============================================================
-- Data: 06 de Janeiro de 2026
-- Objetivo: Adicionar referência à linha telefônica comercial do colaborador
-- ============================================================

-- Adicionar a coluna 'telefone_comercial_id' na tabela colaboradores
-- Essa coluna fará referência à tabela linhas_telefonicas
ALTER TABLE colaboradores 
ADD COLUMN telefone_comercial_id BIGINT REFERENCES linhas_telefonicas(id) ON DELETE SET NULL;

-- Criar índice para melhorar performance em consultas
CREATE INDEX idx_colaboradores_telefone_comercial ON colaboradores(telefone_comercial_id);

-- ============================================================
-- VERIFICAÇÕES (Execute após o ALTER TABLE)
-- ============================================================

-- 1. Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'colaboradores' 
  AND column_name = 'telefone_comercial_id';

-- 2. Verificar registros existentes (devem ter NULL no novo campo)
SELECT id, nome, telefone, telefone_comercial_id
FROM colaboradores
LIMIT 10;

-- 3. Verificar índice criado
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'colaboradores'
  AND indexname = 'idx_colaboradores_telefone_comercial';

-- 4. Verificar integridade referencial
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'colaboradores'
  AND kcu.column_name = 'telefone_comercial_id';

-- ============================================================
-- CONSULTA COMPLETA (Colaborador com Linha Telefônica)
-- ============================================================

SELECT 
  c.id,
  c.nome,
  c.telefone as telefone_pessoal,
  c.setor,
  c.cargo,
  lt.numero_linha as telefone_comercial,
  lt.tipo as tipo_linha,
  lt.operadora,
  lt.plano,
  lt.status as status_linha
FROM colaboradores c
LEFT JOIN linhas_telefonicas lt ON c.telefone_comercial_id = lt.id
ORDER BY c.nome
LIMIT 10;

-- ============================================================
-- EXEMPLOS DE USO
-- ============================================================

-- Atribuir uma linha telefônica a um colaborador específico
-- (Substitua os IDs pelos valores reais do seu banco)
-- UPDATE colaboradores 
-- SET telefone_comercial_id = 1 
-- WHERE id = 1;

-- Remover vinculação de linha telefônica
-- UPDATE colaboradores 
-- SET telefone_comercial_id = NULL 
-- WHERE id = 1;

-- Buscar colaboradores com linha telefônica específica
-- SELECT c.nome, c.setor, lt.numero_linha, lt.operadora
-- FROM colaboradores c
-- INNER JOIN linhas_telefonicas lt ON c.telefone_comercial_id = lt.id
-- WHERE lt.operadora = 'Vivo';

-- Buscar colaboradores sem linha telefônica comercial
-- SELECT nome, setor, cargo
-- FROM colaboradores
-- WHERE telefone_comercial_id IS NULL;

-- ============================================================
-- REVERTER (USE APENAS SE NECESSÁRIO)
-- ============================================================

-- Para reverter as alterações (cuidado ao usar!):
-- DROP INDEX IF EXISTS idx_colaboradores_telefone_comercial;
-- ALTER TABLE colaboradores DROP COLUMN IF EXISTS telefone_comercial_id;

-- ============================================================
-- OBSERVAÇÕES IMPORTANTES
-- ============================================================

-- 1. A coluna permite NULL, então colaboradores podem ou não ter linha comercial
-- 2. ON DELETE SET NULL garante que se a linha for excluída, o colaborador não será afetado
-- 3. O índice melhora a performance em queries que filtram por linha telefônica
-- 4. Esta alteração não afeta os dados existentes (todos terão NULL inicialmente)
-- 5. É necessário atualizar manualmente os registros existentes se houver vinculações
