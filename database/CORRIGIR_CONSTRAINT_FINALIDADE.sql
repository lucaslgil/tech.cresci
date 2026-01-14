-- =====================================================
-- CORRIGIR CONSTRAINT FINALIDADE EM OPERAÇÕES FISCAIS
-- Execute este script no Supabase SQL Editor
-- Data: 14/01/2026
-- =====================================================
-- 
-- A constraint de finalidade está com valores antigos (ENTRADA/SAIDA)
-- mas o sistema espera valores novos (NORMAL/COMPLEMENTAR/AJUSTE/DEVOLUCAO)
-- Este script corrige a constraint.
-- 
-- =====================================================

-- =====================================================
-- 1. REMOVER A CONSTRAINT ANTIGA
-- =====================================================

-- Listar todas as constraints da coluna finalidade
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Buscar o nome da constraint
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    INNER JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'operacoes_fiscais'
    AND con.contype = 'c'
    AND con.consrc LIKE '%finalidade%'
    OR con.conbin::text LIKE '%finalidade%';
    
    -- Se encontrou, remover
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE operacoes_fiscais DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Constraint % removida', constraint_name;
    END IF;
    
    -- Tentar remover pelo nome provável
    EXECUTE 'ALTER TABLE operacoes_fiscais DROP CONSTRAINT IF EXISTS operacoes_fiscais_finalidade_check';
    RAISE NOTICE 'Constraint operacoes_fiscais_finalidade_check removida';
    
END $$;

-- =====================================================
-- 2. CRIAR A NOVA CONSTRAINT CORRETA
-- =====================================================

ALTER TABLE operacoes_fiscais 
ADD CONSTRAINT operacoes_fiscais_finalidade_check 
CHECK (finalidade IN ('NORMAL', 'COMPLEMENTAR', 'AJUSTE', 'DEVOLUCAO'));

-- =====================================================
-- 3. VERIFICAR AS CONSTRAINTS DA TABELA
-- =====================================================

SELECT 
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'operacoes_fiscais'
AND con.contype = 'c'
ORDER BY con.conname;

-- =====================================================
-- FIM DA CORREÇÃO
-- =====================================================

SELECT 'Constraint de finalidade corrigida com sucesso!' AS resultado;
