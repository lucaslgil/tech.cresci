-- ====================================
-- CORRIGIR RLS PARA PERMITIR DELETE EM VENDAS
-- Data: 03/12/2025
-- ====================================

-- Garantir que a tabela vendas tenha RLS habilitado
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas de DELETE se existirem
DROP POLICY IF EXISTS "Permitir delete de vendas" ON vendas;
DROP POLICY IF EXISTS "Usuários podem deletar vendas" ON vendas;
DROP POLICY IF EXISTS "Permitir exclusão de vendas" ON vendas;

-- Criar política para permitir DELETE de vendas (apenas orçamentos e canceladas)
CREATE POLICY "Permitir exclusão de vendas"
ON vendas
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND (status = 'ORCAMENTO' OR status = 'CANCELADO')
);

-- Garantir que há política de SELECT
DROP POLICY IF EXISTS "Permitir visualização de vendas" ON vendas;
CREATE POLICY "Permitir visualização de vendas"
ON vendas
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Garantir que há política de INSERT
DROP POLICY IF EXISTS "Permitir criação de vendas" ON vendas;
CREATE POLICY "Permitir criação de vendas"
ON vendas
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Garantir que há política de UPDATE
DROP POLICY IF EXISTS "Permitir atualização de vendas" ON vendas;
CREATE POLICY "Permitir atualização de vendas"
ON vendas
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- ====================================
-- POLÍTICAS PARA VENDAS_ITENS
-- ====================================

ALTER TABLE vendas_itens ENABLE ROW LEVEL SECURITY;

-- DELETE em cascata quando a venda for excluída
DROP POLICY IF EXISTS "Permitir exclusão de itens de vendas" ON vendas_itens;
CREATE POLICY "Permitir exclusão de itens de vendas"
ON vendas_itens
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM vendas 
    WHERE vendas.id = vendas_itens.venda_id 
    AND (vendas.status = 'ORCAMENTO' OR vendas.status = 'CANCELADO')
  )
);

DROP POLICY IF EXISTS "Permitir visualização de itens" ON vendas_itens;
CREATE POLICY "Permitir visualização de itens"
ON vendas_itens
FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Permitir criação de itens" ON vendas_itens;
CREATE POLICY "Permitir criação de itens"
ON vendas_itens
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Permitir atualização de itens" ON vendas_itens;
CREATE POLICY "Permitir atualização de itens"
ON vendas_itens
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- ====================================
-- POLÍTICAS PARA VENDAS_PARCELAS
-- ====================================

ALTER TABLE vendas_parcelas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir exclusão de parcelas" ON vendas_parcelas;
CREATE POLICY "Permitir exclusão de parcelas"
ON vendas_parcelas
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM vendas 
    WHERE vendas.id = vendas_parcelas.venda_id 
    AND (vendas.status = 'ORCAMENTO' OR vendas.status = 'CANCELADO')
  )
);

DROP POLICY IF EXISTS "Permitir visualização de parcelas" ON vendas_parcelas;
CREATE POLICY "Permitir visualização de parcelas"
ON vendas_parcelas
FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Permitir criação de parcelas" ON vendas_parcelas;
CREATE POLICY "Permitir criação de parcelas"
ON vendas_parcelas
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Permitir atualização de parcelas" ON vendas_parcelas;
CREATE POLICY "Permitir atualização de parcelas"
ON vendas_parcelas
FOR UPDATE
USING (auth.uid() IS NOT NULL);
