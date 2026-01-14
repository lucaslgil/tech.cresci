-- =====================================================
-- CORRIGIR COLUNA REGIME_TRIBUTARIO EM OPERAÇÕES FISCAIS
-- Execute este script no Supabase SQL Editor
-- Data: 14/01/2026
-- =====================================================
-- 
-- A tabela operacoes_fiscais foi criada com regime_tributario
-- como NOT NULL, mas o formulário não envia esse campo.
-- Este script torna a coluna opcional com valor padrão.
-- 
-- =====================================================

-- =====================================================
-- 1. VERIFICAR SE A COLUNA EXISTE
-- =====================================================

DO $$
BEGIN
    -- Se a coluna existe, remover NOT NULL e adicionar default
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'operacoes_fiscais' 
        AND column_name = 'regime_tributario'
    ) THEN
        -- Remover constraint NOT NULL
        ALTER TABLE operacoes_fiscais 
        ALTER COLUMN regime_tributario DROP NOT NULL;
        
        -- Adicionar valor padrão
        ALTER TABLE operacoes_fiscais 
        ALTER COLUMN regime_tributario SET DEFAULT 'TODOS';
        
        -- Atualizar registros que estão NULL
        UPDATE operacoes_fiscais 
        SET regime_tributario = 'TODOS' 
        WHERE regime_tributario IS NULL;
        
        RAISE NOTICE 'Coluna regime_tributario ajustada com sucesso!';
    ELSE
        -- Se não existe, criar a coluna
        ALTER TABLE operacoes_fiscais 
        ADD COLUMN regime_tributario VARCHAR(20) DEFAULT 'TODOS'
        CHECK (regime_tributario IN ('SIMPLES', 'PRESUMIDO', 'REAL', 'TODOS'));
        
        RAISE NOTICE 'Coluna regime_tributario criada com sucesso!';
    END IF;
END $$;

-- =====================================================
-- 2. VERIFICAR A ESTRUTURA DA TABELA
-- =====================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'operacoes_fiscais'
ORDER BY ordinal_position;

-- =====================================================
-- FIM DA CORREÇÃO
-- =====================================================

SELECT 'Coluna regime_tributario corrigida com sucesso!' AS resultado;
