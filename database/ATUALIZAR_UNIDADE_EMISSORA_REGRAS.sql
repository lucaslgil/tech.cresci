-- =====================================================
-- ATUALIZAR CAMPO UNIDADE_EMISSORA EM REGRAS_TRIBUTACAO
-- Execute este script no Supabase SQL Editor
-- Data: 14/01/2026
-- =====================================================
-- 
-- Este script garante que o campo unidade_emissora
-- armazene corretamente o ID da empresa emissora
-- 
-- =====================================================

-- =====================================================
-- 1. VERIFICAR SE A COLUNA EXISTE E SEU TIPO
-- =====================================================

SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'regras_tributacao'
AND column_name = 'unidade_emissora';

-- =====================================================
-- 2. DROPAR VIEW TEMPORARIAMENTE
-- =====================================================

-- Salvar a definição da view antes de dropar
DO $$
BEGIN
    -- Dropar a view que depende da coluna
    DROP VIEW IF EXISTS vw_regras_tributacao_ordenadas CASCADE;
    RAISE NOTICE 'View vw_regras_tributacao_ordenadas removida temporariamente';
END $$;

-- =====================================================
-- 3. ATUALIZAR TIPO DA COLUNA
-- =====================================================

-- Opção A: Se preferir manter como VARCHAR (mais flexível)
-- Já suporta tanto ID numérico quanto texto descritivo
ALTER TABLE regras_tributacao 
ALTER COLUMN unidade_emissora TYPE VARCHAR(100);

-- =====================================================
-- 4. RECRIAR A VIEW
-- =====================================================

-- Recriar a view com a mesma definição
CREATE OR REPLACE VIEW vw_regras_tributacao_ordenadas AS
SELECT 
    r.*,
    -- Calcular prioridade dinamicamente
    (
        CASE WHEN r.ncm IS NOT NULL THEN 100 ELSE 0 END +
        CASE WHEN r.cest IS NOT NULL THEN 80 ELSE 0 END +
        CASE WHEN r.categoria IS NOT NULL THEN 60 ELSE 0 END +
        CASE WHEN r.cfop_entrada IS NOT NULL THEN 50 ELSE 0 END +
        CASE WHEN r.cfop_saida IS NOT NULL THEN 50 ELSE 0 END +
        CASE WHEN r.uf_origem IS NOT NULL THEN 40 ELSE 0 END +
        CASE WHEN r.uf_destino IS NOT NULL THEN 40 ELSE 0 END +
        CASE WHEN r.tipo_contribuinte IS NOT NULL THEN 30 ELSE 0 END +
        CASE WHEN r.origem_mercadoria IS NOT NULL THEN 20 ELSE 0 END +
        COALESCE(r.prioridade, 0)
    ) AS prioridade_calculada
FROM regras_tributacao r
WHERE r.ativo = true
ORDER BY prioridade_calculada DESC, r.id DESC;

COMMENT ON VIEW vw_regras_tributacao_ordenadas IS 'View com regras ordenadas por prioridade calculada';

-- =====================================================
-- 5. ADICIONAR COMENTÁRIO
-- =====================================================

-- =====================================================
-- 5. ADICIONAR COMENTÁRIO
-- =====================================================

COMMENT ON COLUMN regras_tributacao.unidade_emissora 
IS 'ID da empresa emissora (referência para empresas.id)';

-- =====================================================
-- 6. VERIFICAR RESULTADO
-- =====================================================

SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'regras_tributacao'
AND column_name = 'unidade_emissora';

-- Verificar constraints
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'regras_tributacao'
AND kcu.column_name = 'unidade_emissora';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

SELECT '✅ Campo unidade_emissora configurado com sucesso!' AS resultado;
