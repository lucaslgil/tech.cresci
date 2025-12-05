-- ====================================
-- APLICAR CORREÇÃO COMPLETA - EXCLUSÃO DE VENDAS
-- Execute este script no SQL Editor do Supabase
-- Data: 03/12/2025
-- ====================================

BEGIN;

-- ====================================
-- PASSO 1: CORRIGIR FOREIGN KEYS COM CASCADE
-- ====================================

-- VENDAS_ITENS: Recriar FK com CASCADE
ALTER TABLE vendas_itens DROP CONSTRAINT IF EXISTS vendas_itens_venda_id_fkey;
ALTER TABLE vendas_itens
ADD CONSTRAINT vendas_itens_venda_id_fkey
FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE;

-- VENDAS_PARCELAS: Recriar FK com CASCADE
ALTER TABLE vendas_parcelas DROP CONSTRAINT IF EXISTS vendas_parcelas_venda_id_fkey;
ALTER TABLE vendas_parcelas
ADD CONSTRAINT vendas_parcelas_venda_id_fkey
FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE;

-- ====================================
-- PASSO 2: CONFIGURAR RLS PARA VENDAS
-- ====================================

ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Permitir delete de vendas" ON vendas;
DROP POLICY IF EXISTS "Usuários podem deletar vendas" ON vendas;
DROP POLICY IF EXISTS "Permitir exclusão de vendas" ON vendas;
DROP POLICY IF EXISTS "Permitir visualização de vendas" ON vendas;
DROP POLICY IF EXISTS "Permitir criação de vendas" ON vendas;
DROP POLICY IF EXISTS "Permitir atualização de vendas" ON vendas;

-- Criar políticas novas
CREATE POLICY "Permitir visualização de vendas"
ON vendas FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir criação de vendas"
ON vendas FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir atualização de vendas"
ON vendas FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir exclusão de vendas"
ON vendas FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND (status = 'ORCAMENTO' OR status = 'CANCELADO')
);

-- ====================================
-- PASSO 3: CONFIGURAR RLS PARA VENDAS_ITENS
-- ====================================

ALTER TABLE vendas_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir exclusão de itens de vendas" ON vendas_itens;
DROP POLICY IF EXISTS "Permitir visualização de itens" ON vendas_itens;
DROP POLICY IF EXISTS "Permitir criação de itens" ON vendas_itens;
DROP POLICY IF EXISTS "Permitir atualização de itens" ON vendas_itens;

CREATE POLICY "Permitir visualização de itens"
ON vendas_itens FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir criação de itens"
ON vendas_itens FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir atualização de itens"
ON vendas_itens FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir exclusão de itens de vendas"
ON vendas_itens FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM vendas 
    WHERE vendas.id = vendas_itens.venda_id 
    AND (vendas.status = 'ORCAMENTO' OR vendas.status = 'CANCELADO')
  )
);

-- ====================================
-- PASSO 4: CONFIGURAR RLS PARA VENDAS_PARCELAS
-- ====================================

ALTER TABLE vendas_parcelas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir exclusão de parcelas" ON vendas_parcelas;
DROP POLICY IF EXISTS "Permitir visualização de parcelas" ON vendas_parcelas;
DROP POLICY IF EXISTS "Permitir criação de parcelas" ON vendas_parcelas;
DROP POLICY IF EXISTS "Permitir atualização de parcelas" ON vendas_parcelas;

CREATE POLICY "Permitir visualização de parcelas"
ON vendas_parcelas FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir criação de parcelas"
ON vendas_parcelas FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir atualização de parcelas"
ON vendas_parcelas FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir exclusão de parcelas"
ON vendas_parcelas FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM vendas 
    WHERE vendas.id = vendas_parcelas.venda_id 
    AND (vendas.status = 'ORCAMENTO' OR vendas.status = 'CANCELADO')
  )
);

COMMIT;

-- ====================================
-- VERIFICAÇÃO
-- ====================================

-- Verificar foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('vendas_itens', 'vendas_parcelas');

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('vendas', 'vendas_itens', 'vendas_parcelas')
ORDER BY tablename, cmd;
