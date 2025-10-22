-- Migração para adicionar coluna 'categoria' na tabela 'itens'
-- Data: ${new Date().toISOString()}
-- Descrição: Adiciona campo categoria para classificar itens do inventário

-- Adicionar coluna categoria à tabela itens
ALTER TABLE itens 
ADD COLUMN categoria TEXT;

-- Comentário na coluna para documentação
COMMENT ON COLUMN itens.categoria IS 'Categoria do item (ex: Eletrônicos, Mobiliário, Equipamentos, etc.)';

-- Atualizar itens existentes com categoria padrão (opcional)
-- UPDATE itens SET categoria = 'Outros' WHERE categoria IS NULL;