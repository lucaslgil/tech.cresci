-- ========================================
-- SETUP: Coluna responsavel_id na tabela itens
-- ========================================
-- Execute este SQL no Supabase para configurar o vínculo 
-- entre itens e colaboradores responsáveis
--
-- Data: 2025-10-28
-- ========================================

-- 1. Adicionar coluna responsavel_id na tabela itens (se não existir)
ALTER TABLE itens 
ADD COLUMN IF NOT EXISTS responsavel_id BIGINT;

-- 2. Criar foreign key para colaboradores (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_itens_responsavel' 
        AND table_name = 'itens'
    ) THEN
        ALTER TABLE itens 
        ADD CONSTRAINT fk_itens_responsavel 
        FOREIGN KEY (responsavel_id) 
        REFERENCES colaboradores(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_itens_responsavel_id ON itens(responsavel_id);

-- 4. Adicionar comentário na coluna para documentação
COMMENT ON COLUMN itens.responsavel_id IS 'ID do colaborador responsável pelo item';

-- 5. Verificar se a coluna foi criada corretamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'itens' 
AND column_name = 'responsavel_id';

-- 6. Verificar se o foreign key foi criado
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
AND tc.table_name = 'itens'
AND kcu.column_name = 'responsavel_id';

-- ========================================
-- CONSULTAS DE TESTE
-- ========================================

-- Teste 1: Ver todos os itens com seus responsáveis
SELECT 
    i.id,
    i.codigo,
    i.item,
    i.categoria,
    i.setor,
    i.status,
    i.responsavel_id,
    c.nome as responsavel_nome,
    c.email as responsavel_email,
    c.cargo as responsavel_cargo
FROM itens i
LEFT JOIN colaboradores c ON i.responsavel_id = c.id
ORDER BY i.codigo;

-- Teste 2: Ver itens SEM responsável atribuído
SELECT 
    codigo,
    item,
    setor,
    status
FROM itens
WHERE responsavel_id IS NULL
ORDER BY codigo;

-- Teste 3: Ver itens COM responsável atribuído
SELECT 
    i.codigo,
    i.item,
    c.nome as responsavel
FROM itens i
INNER JOIN colaboradores c ON i.responsavel_id = c.id
ORDER BY c.nome, i.codigo;

-- Teste 4: Contar itens por responsável
SELECT 
    c.nome as responsavel,
    COUNT(i.id) as total_itens
FROM colaboradores c
LEFT JOIN itens i ON c.id = i.responsavel_id
GROUP BY c.id, c.nome
ORDER BY total_itens DESC, c.nome;

-- ========================================
-- OBSERVAÇÕES IMPORTANTES
-- ========================================
--
-- 1. A coluna responsavel_id é OPCIONAL (nullable)
--    Isso permite que itens existam sem responsável atribuído
--
-- 2. ON DELETE SET NULL garante que se um colaborador for excluído,
--    os itens dele não serão excluídos, apenas terão responsavel_id = NULL
--
-- 3. O vínculo é feito na tela de Colaboradores através da função
--    "Vincular Itens e Gerar Termo"
--
-- 4. Agora a tela de Itens exibe o nome do responsável na coluna
--    após "Setor" automaticamente
--
-- 5. A consulta no frontend usa LEFT JOIN para pegar colaboradores:
--    SELECT *, colaboradores (nome, cpf, email) FROM itens
--
-- ========================================
