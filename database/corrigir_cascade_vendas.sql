-- ====================================
-- VERIFICAR E CORRIGIR FOREIGN KEYS COM ON DELETE CASCADE
-- Para permitir exclusão completa de vendas
-- Data: 03/12/2025
-- ====================================

-- Verificar foreign keys existentes
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (tc.table_name IN ('vendas_itens', 'vendas_parcelas'));

-- ====================================
-- RECRIAR FOREIGN KEYS COM CASCADE
-- ====================================

-- VENDAS_ITENS: Recriar FK para venda_id com ON DELETE CASCADE
DO $$
BEGIN
    -- Remover constraint antiga se existir
    ALTER TABLE vendas_itens 
    DROP CONSTRAINT IF EXISTS vendas_itens_venda_id_fkey;
    
    -- Criar nova constraint com CASCADE
    ALTER TABLE vendas_itens
    ADD CONSTRAINT vendas_itens_venda_id_fkey
    FOREIGN KEY (venda_id)
    REFERENCES vendas(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE 'FK vendas_itens.venda_id atualizada com ON DELETE CASCADE';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao atualizar FK vendas_itens: %', SQLERRM;
END $$;

-- VENDAS_PARCELAS: Recriar FK para venda_id com ON DELETE CASCADE
DO $$
BEGIN
    -- Remover constraint antiga se existir
    ALTER TABLE vendas_parcelas 
    DROP CONSTRAINT IF EXISTS vendas_parcelas_venda_id_fkey;
    
    -- Criar nova constraint com CASCADE
    ALTER TABLE vendas_parcelas
    ADD CONSTRAINT vendas_parcelas_venda_id_fkey
    FOREIGN KEY (venda_id)
    REFERENCES vendas(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE 'FK vendas_parcelas.venda_id atualizada com ON DELETE CASCADE';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao atualizar FK vendas_parcelas: %', SQLERRM;
END $$;

-- ====================================
-- VERIFICAR RESULTADO
-- ====================================

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('vendas_itens', 'vendas_parcelas')
ORDER BY tc.table_name;
