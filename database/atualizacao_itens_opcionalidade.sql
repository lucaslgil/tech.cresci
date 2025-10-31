-- =====================================================
-- ATUALIZAÇÃO DA TABELA ITENS - CAMPOS OPCIONAIS
-- Execute no Supabase SQL Editor
-- =====================================================

-- 1. Remover as restrições NOT NULL para tornar campos opcionais
ALTER TABLE itens 
ALTER COLUMN item DROP NOT NULL,
ALTER COLUMN setor DROP NOT NULL,
ALTER COLUMN status DROP NOT NULL;

-- 2. Adicionar coluna categoria se ainda não existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='itens' AND column_name='categoria') THEN
        ALTER TABLE itens ADD COLUMN categoria TEXT;
        COMMENT ON COLUMN itens.categoria IS 'Categoria do item (ex: Eletrônicos, Mobiliário, Equipamentos, etc.)';
    END IF;
END $$;

-- 3. Atualizar valores NULL para empty string se necessário (opcional)
-- UPDATE itens SET 
--     item = COALESCE(item, ''),
--     setor = COALESCE(setor, ''),
--     status = COALESCE(status, ''),
--     categoria = COALESCE(categoria, '');

-- 4. Verificar a estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'itens' 
ORDER BY ordinal_position;