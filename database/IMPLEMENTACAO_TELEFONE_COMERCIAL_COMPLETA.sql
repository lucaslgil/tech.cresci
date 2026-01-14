-- ============================================================
-- IMPLEMENTAÇÃO COMPLETA: TELEFONE COMERCIAL PARA COLABORADORES
-- ============================================================
-- Data: 06 de Janeiro de 2026
-- Objetivo: Vincular linhas telefônicas aos colaboradores e exibir no termo de responsabilidade
-- ============================================================

-- ┌─────────────────────────────────────────────────────────┐
-- │ PASSO 1: VERIFICAR SE A TABELA LINHAS_TELEFONICAS EXISTE │
-- └─────────────────────────────────────────────────────────┘

-- Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'linhas_telefonicas'
);

-- Se não existir, execute o script: criar_tabela_linhas_telefonicas.sql
-- Se já existir, prossiga para o próximo passo


-- ┌─────────────────────────────────────────────────────────┐
-- │ PASSO 2: VERIFICAR SE A COLUNA OPERADORA EXISTE         │
-- └─────────────────────────────────────────────────────────┘

-- Verificar se a coluna operadora existe
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'linhas_telefonicas' 
  AND column_name = 'operadora';

-- Se não existir, adicione com o comando abaixo:
-- ALTER TABLE linhas_telefonicas 
-- ADD COLUMN operadora TEXT NOT NULL DEFAULT 'Não informada';
-- 
-- ALTER TABLE linhas_telefonicas 
-- ALTER COLUMN operadora DROP DEFAULT;
--
-- CREATE INDEX idx_linhas_telefonicas_operadora ON linhas_telefonicas(operadora);


-- ┌─────────────────────────────────────────────────────────┐
-- │ PASSO 3: ADICIONAR COLUNA TELEFONE_COMERCIAL_ID         │
-- └─────────────────────────────────────────────────────────┘

-- Adicionar a coluna 'telefone_comercial_id' na tabela colaboradores
ALTER TABLE colaboradores 
ADD COLUMN IF NOT EXISTS telefone_comercial_id BIGINT REFERENCES linhas_telefonicas(id) ON DELETE SET NULL;

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_telefone_comercial ON colaboradores(telefone_comercial_id);

-- Comentário na coluna
COMMENT ON COLUMN colaboradores.telefone_comercial_id IS 'Referência à linha telefônica comercial do colaborador';


-- ┌─────────────────────────────────────────────────────────┐
-- │ PASSO 4: VERIFICAÇÕES                                    │
-- └─────────────────────────────────────────────────────────┘

-- 1. Verificar se a coluna foi adicionada
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'colaboradores' 
  AND column_name = 'telefone_comercial_id';

-- 2. Verificar estrutura completa da tabela colaboradores
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'colaboradores'
ORDER BY ordinal_position;

-- 3. Verificar registros existentes (devem ter NULL no novo campo)
SELECT 
    id, 
    nome, 
    telefone, 
    telefone_comercial_id
FROM colaboradores
LIMIT 10;

-- 4. Verificar índice criado
SELECT 
    indexname, 
    indexdef
FROM pg_indexes
WHERE tablename = 'colaboradores'
  AND indexname = 'idx_colaboradores_telefone_comercial';

-- 5. Verificar integridade referencial (foreign key)
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


-- ┌─────────────────────────────────────────────────────────┐
-- │ PASSO 5: CONSULTAS DE TESTE                             │
-- └─────────────────────────────────────────────────────────┘

-- Consulta completa: Colaborador com Linha Telefônica Comercial
SELECT 
    c.id,
    c.nome,
    c.telefone AS telefone_pessoal,
    c.setor,
    c.cargo,
    c.email,
    lt.numero_linha AS telefone_comercial,
    lt.tipo AS tipo_linha,
    lt.operadora,
    lt.plano,
    lt.valor_plano,
    lt.status AS status_linha
FROM colaboradores c
LEFT JOIN linhas_telefonicas lt ON c.telefone_comercial_id = lt.id
ORDER BY c.nome
LIMIT 10;

-- Ver todas as colunas do colaborador
SELECT * FROM colaboradores LIMIT 5;

-- Ver todas as linhas telefônicas disponíveis
SELECT 
    id,
    numero_linha,
    tipo,
    operadora,
    plano,
    valor_plano,
    status
FROM linhas_telefonicas
ORDER BY numero_linha;


-- ┌─────────────────────────────────────────────────────────┐
-- │ PASSO 6: EXEMPLOS DE USO                                 │
-- └─────────────────────────────────────────────────────────┘

-- Exemplo 1: Atribuir uma linha telefônica a um colaborador
-- (Substitua os IDs pelos valores reais do seu banco)
/*
UPDATE colaboradores 
SET telefone_comercial_id = 1  -- ID da linha telefônica
WHERE id = 10;  -- ID do colaborador
*/

-- Exemplo 2: Remover vinculação de linha telefônica
/*
UPDATE colaboradores 
SET telefone_comercial_id = NULL 
WHERE id = 10;
*/

-- Exemplo 3: Buscar colaboradores com linha de operadora específica
/*
SELECT 
    c.nome, 
    c.setor, 
    lt.numero_linha, 
    lt.operadora,
    lt.tipo
FROM colaboradores c
INNER JOIN linhas_telefonicas lt ON c.telefone_comercial_id = lt.id
WHERE lt.operadora = 'Vivo';
*/

-- Exemplo 4: Buscar colaboradores sem linha telefônica comercial
/*
SELECT 
    nome, 
    setor, 
    cargo,
    telefone
FROM colaboradores
WHERE telefone_comercial_id IS NULL;
*/

-- Exemplo 5: Contar colaboradores por operadora
/*
SELECT 
    COALESCE(lt.operadora, 'Sem linha') AS operadora,
    COUNT(c.id) AS total_colaboradores
FROM colaboradores c
LEFT JOIN linhas_telefonicas lt ON c.telefone_comercial_id = lt.id
GROUP BY lt.operadora
ORDER BY total_colaboradores DESC;
*/


-- ┌─────────────────────────────────────────────────────────┐
-- │ PASSO 7: DADOS DE TESTE (OPCIONAL)                       │
-- └─────────────────────────────────────────────────────────┘

-- Se você deseja criar dados de teste:

-- Inserir linhas telefônicas de exemplo (se necessário)
/*
INSERT INTO linhas_telefonicas (numero_linha, tipo, operadora, plano, valor_plano, status) VALUES
('(11) 98765-4321', 'eSIM', 'Vivo', 'Controle 20GB', 59.90, 'Ativa'),
('(11) 97654-3210', 'Chip Físico', 'Claro', 'Pós 30GB', 89.90, 'Ativa'),
('(11) 96543-2109', 'eSIM', 'Tim', 'Black 50GB', 119.90, 'Ativa'),
('(11) 95432-1098', 'Chip Físico', 'Oi', 'Controle 15GB', 49.90, 'Ativa');
*/

-- Atribuir linhas aos colaboradores (ajuste os IDs conforme necessário)
/*
UPDATE colaboradores 
SET telefone_comercial_id = (SELECT id FROM linhas_telefonicas WHERE numero_linha = '(11) 98765-4321')
WHERE nome = 'João Silva';
*/


-- ┌─────────────────────────────────────────────────────────┐
-- │ PASSO 8: VALIDAÇÃO FINAL                                 │
-- └─────────────────────────────────────────────────────────┘

-- Verificar se tudo está funcionando corretamente
SELECT 
    'Tabela colaboradores' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(telefone_comercial_id) AS com_telefone_comercial,
    COUNT(*) - COUNT(telefone_comercial_id) AS sem_telefone_comercial
FROM colaboradores

UNION ALL

SELECT 
    'Tabela linhas_telefonicas' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(CASE WHEN status = 'Ativa' THEN 1 END) AS ativas,
    COUNT(CASE WHEN status = 'Inativa' THEN 1 END) AS inativas
FROM linhas_telefonicas;


-- ┌─────────────────────────────────────────────────────────┐
-- │ REVERTER ALTERAÇÕES (USE APENAS SE NECESSÁRIO)           │
-- └─────────────────────────────────────────────────────────┘

-- ATENÇÃO: Os comandos abaixo irão REMOVER as alterações!
-- Use apenas se precisar desfazer tudo

/*
-- Remover índice
DROP INDEX IF EXISTS idx_colaboradores_telefone_comercial;

-- Remover coluna
ALTER TABLE colaboradores DROP COLUMN IF EXISTS telefone_comercial_id;

-- Verificar remoção
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'colaboradores' 
  AND column_name = 'telefone_comercial_id';
*/


-- ┌─────────────────────────────────────────────────────────┐
-- │ OBSERVAÇÕES IMPORTANTES                                  │
-- └─────────────────────────────────────────────────────────┘

/*
1. COMPATIBILIDADE:
   - A coluna permite NULL, então colaboradores podem ou não ter linha comercial
   - Não afeta dados existentes (todos iniciam com NULL)

2. INTEGRIDADE:
   - ON DELETE SET NULL: se a linha for excluída, o colaborador não é afetado
   - Foreign Key garante que apenas linhas existentes podem ser vinculadas

3. PERFORMANCE:
   - Índice criado para otimizar consultas que filtram por telefone_comercial_id
   - Consultas com JOIN são eficientes

4. FRONTEND:
   - O campo aparece na tela de cadastro de colaborador
   - Busca as linhas telefônicas da tabela linhas_telefonicas
   - Mostra número, tipo e operadora no select

5. TERMO DE RESPONSABILIDADE:
   - Exibe Numero/Tipo/Operadora ao lado dos campos do item
   - Layout em 2 colunas conforme solicitado

6. SEGURANÇA:
   - Certifique-se de que as RLS policies estão configuradas
   - Usuários autenticados devem ter permissão para ler ambas as tabelas
*/


-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
-- Após executar este script com sucesso, o sistema estará pronto!
-- Teste acessando: http://localhost:5173/cadastro/colaborador
