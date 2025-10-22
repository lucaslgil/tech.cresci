-- ATUALIZAÇÃO: Adicionar campo responsavel_id na tabela itens
-- Execute este SQL no Supabase para adicionar o campo de responsável aos itens

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

-- 3. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_itens_responsavel_id ON itens(responsavel_id);

-- 4. Atualizar alguns itens com responsáveis (exemplo)
-- Vincule itens existentes a colaboradores existentes
UPDATE itens 
SET responsavel_id = (
    SELECT id FROM colaboradores 
    WHERE nome LIKE '%João%' 
    LIMIT 1
)
WHERE codigo IN ('ITEM-001', 'ITEM-003') 
AND responsavel_id IS NULL;

-- 5. Verificar se a coluna foi adicionada corretamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'itens' 
AND column_name = 'responsavel_id';

-- 6. Teste da consulta que o frontend usa
SELECT 
    i.id,
    i.codigo,
    i.item,
    i.modelo,
    i.status,
    i.valor,
    i.responsavel_id,
    c.nome as responsavel_nome,
    c.cpf as responsavel_cpf,
    c.email as responsavel_email,
    c.telefone as responsavel_telefone,
    c.cargo as responsavel_cargo,
    c.setor as responsavel_setor
FROM itens i
LEFT JOIN colaboradores c ON i.responsavel_id = c.id
ORDER BY i.codigo;

-- 7. Comentário na coluna
COMMENT ON COLUMN itens.responsavel_id IS 'ID do colaborador responsável pelo item';