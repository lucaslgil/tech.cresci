-- =====================================================
-- NORMALIZAÇÃO DE NCM E CFOP - PRODUTOS E REGRAS
-- Data: 23/01/2026
-- Problema: NCM com formatação diferente impede match
-- =====================================================

-- 1️⃣ VERIFICAR FORMATAÇÃO ATUAL

-- Produtos
SELECT 
    'PRODUTOS' as tabela,
    codigo_interno,
    nome,
    ncm as ncm_atual,
    LENGTH(ncm) as tamanho_ncm,
    cfop_saida as cfop_atual,
    LENGTH(cfop_saida) as tamanho_cfop,
    CASE 
        WHEN ncm ~ '[^0-9]' THEN '❌ TEM FORMATAÇÃO'
        WHEN LENGTH(ncm) != 8 THEN '❌ TAMANHO ERRADO'
        ELSE '✅ OK'
    END as status_ncm,
    CASE 
        WHEN cfop_saida ~ '[^0-9]' THEN '❌ TEM FORMATAÇÃO'
        WHEN LENGTH(cfop_saida) != 4 THEN '❌ TAMANHO ERRADO'
        ELSE '✅ OK'
    END as status_cfop
FROM produtos
WHERE ativo = true
ORDER BY codigo_interno;

-- Regras de Tributação
SELECT 
    'REGRAS' as tabela,
    ncm as ncm_atual,
    LENGTH(ncm) as tamanho_ncm,
    cfop_saida as cfop_atual,
    LENGTH(cfop_saida) as tamanho_cfop,
    CASE 
        WHEN ncm ~ '[^0-9]' THEN '❌ TEM FORMATAÇÃO'
        WHEN LENGTH(ncm) != 8 THEN '❌ TAMANHO ERRADO'
        ELSE '✅ OK'
    END as status_ncm,
    CASE 
        WHEN cfop_saida ~ '[^0-9]' THEN '❌ TEM FORMATAÇÃO'
        WHEN LENGTH(cfop_saida) != 4 THEN '❌ TAMANHO ERRADO'
        ELSE '✅ OK'
    END as status_cfop
FROM regras_tributacao
WHERE ativo = true
ORDER BY ncm;

-- 2️⃣ CRIAR FUNÇÃO DE NORMALIZAÇÃO
CREATE OR REPLACE FUNCTION normalizar_ncm_cfop(valor TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Remove todos os caracteres que não sejam números
    RETURN REGEXP_REPLACE(valor, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Testar função
SELECT 
    '0000.00.00' as original,
    normalizar_ncm_cfop('0000.00.00') as normalizado,
    '5.102' as original_cfop,
    normalizar_ncm_cfop('5.102') as normalizado_cfop;

-- 3️⃣ NORMALIZAR NCM E CFOP NA TABELA PRODUTOS
UPDATE produtos
SET 
    ncm = normalizar_ncm_cfop(ncm),
    cfop_saida = normalizar_ncm_cfop(cfop_saida),
    updated_at = NOW()
WHERE ativo = true
AND (
    ncm ~ '[^0-9]' OR 
    cfop_saida ~ '[^0-9]'
);

-- Verificar produtos atualizados
SELECT 
    codigo_interno,
    nome,
    ncm,
    cfop_saida,
    'Produto atualizado' as status
FROM produtos
WHERE ativo = true
ORDER BY codigo_interno;

-- 4️⃣ NORMALIZAR NCM E CFOP NA TABELA REGRAS_TRIBUTACAO
UPDATE regras_tributacao
SET 
    ncm = normalizar_ncm_cfop(ncm),
    cfop_saida = normalizar_ncm_cfop(cfop_saida),
    cfop_entrada = normalizar_ncm_cfop(cfop_entrada),
    updated_at = NOW()
WHERE ativo = true
AND (
    ncm ~ '[^0-9]' OR 
    cfop_saida ~ '[^0-9]' OR
    cfop_entrada ~ '[^0-9]'
);

-- Verificar regras atualizadas
SELECT 
    id,
    nome,
    ncm,
    cfop_saida,
    cfop_entrada,
    'Regra atualizada' as status
FROM regras_tributacao
WHERE ativo = true
ORDER BY prioridade DESC, ncm;

-- 5️⃣ VALIDAR MATCH ENTRE PRODUTOS E REGRAS
SELECT 
    p.codigo_interno as produto,
    p.nome,
    p.ncm as produto_ncm,
    p.cfop_saida as produto_cfop,
    r.id as regra_id,
    r.nome as regra_nome,
    r.ncm as regra_ncm,
    r.cfop_saida as regra_cfop,
    CASE 
        WHEN p.ncm = r.ncm AND p.cfop_saida = r.cfop_saida THEN '✅ MATCH PERFEITO'
        WHEN p.ncm = r.ncm THEN '⚠️ NCM OK, CFOP diferente'
        WHEN p.cfop_saida = r.cfop_saida THEN '⚠️ CFOP OK, NCM diferente'
        ELSE '❌ SEM MATCH'
    END as status_match
FROM produtos p
LEFT JOIN regras_tributacao r ON (
    r.ncm = p.ncm AND 
    r.cfop_saida = p.cfop_saida AND
    r.ativo = true
)
WHERE p.ativo = true
ORDER BY p.codigo_interno;

-- 6️⃣ VERIFICAR SE TODOS OS PRODUTOS TÊM REGRA
SELECT 
    COUNT(*) as total_produtos,
    COUNT(CASE WHEN r.id IS NOT NULL THEN 1 END) as com_regra,
    COUNT(CASE WHEN r.id IS NULL THEN 1 END) as sem_regra
FROM produtos p
LEFT JOIN regras_tributacao r ON (
    r.ncm = p.ncm AND 
    r.cfop_saida = p.cfop_saida AND
    r.ativo = true
)
WHERE p.ativo = true;

-- 7️⃣ LISTAR PRODUTOS SEM REGRA (PRECISAM DE ATENÇÃO)
SELECT 
    p.codigo_interno,
    p.nome,
    p.ncm,
    p.cfop_saida,
    '❌ SEM REGRA - Criar ou usar regra genérica' as alerta
FROM produtos p
LEFT JOIN regras_tributacao r ON (
    r.ncm = p.ncm AND 
    r.cfop_saida = p.cfop_saida AND
    r.ativo = true
)
WHERE p.ativo = true
AND r.id IS NULL;

-- 8️⃣ CRIAR TRIGGER PARA NORMALIZAR AUTOMATICAMENTE
-- Produtos
CREATE OR REPLACE FUNCTION trigger_normalizar_produtos()
RETURNS TRIGGER AS $$
BEGIN
    -- Normalizar NCM (remover formatação)
    IF NEW.ncm IS NOT NULL THEN
        NEW.ncm := normalizar_ncm_cfop(NEW.ncm);
    END IF;
    
    -- Normalizar CFOP
    IF NEW.cfop_saida IS NOT NULL THEN
        NEW.cfop_saida := normalizar_ncm_cfop(NEW.cfop_saida);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalizar_produtos ON produtos;
CREATE TRIGGER trg_normalizar_produtos
    BEFORE INSERT OR UPDATE ON produtos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_normalizar_produtos();

-- Regras de Tributação
CREATE OR REPLACE FUNCTION trigger_normalizar_regras()
RETURNS TRIGGER AS $$
BEGIN
    -- Normalizar NCM
    IF NEW.ncm IS NOT NULL THEN
        NEW.ncm := normalizar_ncm_cfop(NEW.ncm);
    END IF;
    
    -- Normalizar CFOPs
    IF NEW.cfop_saida IS NOT NULL THEN
        NEW.cfop_saida := normalizar_ncm_cfop(NEW.cfop_saida);
    END IF;
    
    IF NEW.cfop_entrada IS NOT NULL THEN
        NEW.cfop_entrada := normalizar_ncm_cfop(NEW.cfop_entrada);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalizar_regras ON regras_tributacao;
CREATE TRIGGER trg_normalizar_regras
    BEFORE INSERT OR UPDATE ON regras_tributacao
    FOR EACH ROW
    EXECUTE FUNCTION trigger_normalizar_regras();

-- 9️⃣ VERIFICAR TAMANHO DOS CAMPOS (devem suportar valores já normalizados)
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    CASE 
        WHEN column_name = 'ncm' AND character_maximum_length >= 8 THEN '✅ OK'
        WHEN column_name = 'cfop_saida' AND character_maximum_length >= 4 THEN '✅ OK'
        WHEN column_name = 'cfop_entrada' AND character_maximum_length >= 4 THEN '✅ OK'
        ELSE '⚠️ AJUSTAR'
    END as status
FROM information_schema.columns
WHERE table_name IN ('produtos', 'regras_tributacao')
AND column_name IN ('ncm', 'cest', 'cfop_saida', 'cfop_entrada')
ORDER BY table_name, column_name;

-- 🔟 VALIDAÇÃO FINAL
DO $$
DECLARE
    produtos_com_formatacao INTEGER;
    regras_com_formatacao INTEGER;
    produtos_com_regra INTEGER;
    produtos_sem_regra INTEGER;
BEGIN
    -- Contar problemas
    SELECT COUNT(*) INTO produtos_com_formatacao
    FROM produtos
    WHERE ativo = true
    AND (ncm ~ '[^0-9]' OR cfop_saida ~ '[^0-9]');
    
    SELECT COUNT(*) INTO regras_com_formatacao
    FROM regras_tributacao
    WHERE ativo = true
    AND (ncm ~ '[^0-9]' OR cfop_saida ~ '[^0-9]');
    
    -- Contar matches
    SELECT COUNT(*) INTO produtos_com_regra
    FROM produtos p
    INNER JOIN regras_tributacao r ON (
        r.ncm = p.ncm AND 
        r.cfop_saida = p.cfop_saida AND
        r.ativo = true
    )
    WHERE p.ativo = true;
    
    SELECT COUNT(*) INTO produtos_sem_regra
    FROM produtos p
    LEFT JOIN regras_tributacao r ON (
        r.ncm = p.ncm AND 
        r.cfop_saida = p.cfop_saida AND
        r.ativo = true
    )
    WHERE p.ativo = true
    AND r.id IS NULL;
    
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ NORMALIZAÇÃO CONCLUÍDA';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Produtos com formatação: %', produtos_com_formatacao;
    RAISE NOTICE 'Regras com formatação: %', regras_com_formatacao;
    RAISE NOTICE 'Produtos com regra: %', produtos_com_regra;
    RAISE NOTICE 'Produtos sem regra: %', produtos_sem_regra;
    RAISE NOTICE '================================================';
    
    IF produtos_com_formatacao > 0 OR regras_com_formatacao > 0 THEN
        RAISE WARNING '⚠️ Ainda existem registros com formatação!';
    ELSE
        RAISE NOTICE '✅ Todos os NCMs e CFOPs normalizados!';
    END IF;
    
    IF produtos_sem_regra > 0 THEN
        RAISE WARNING '⚠️ % produtos sem regra de tributação', produtos_sem_regra;
        RAISE NOTICE '💡 Crie regras específicas ou uma regra genérica (NCM NULL)';
    ELSE
        RAISE NOTICE '✅ Todos os produtos têm regra de tributação!';
    END IF;
END $$;

-- =====================================================
-- DOCUMENTAÇÃO
-- =====================================================
/*
📋 O QUE ESTE SCRIPT FAZ:

1. ✅ Remove formatação de NCM e CFOP (pontos, traços, etc)
2. ✅ Padroniza: NCM com 8 dígitos, CFOP com 4 dígitos
3. ✅ Cria triggers para normalizar automaticamente
4. ✅ Valida match entre produtos e regras
5. ✅ Identifica produtos sem regra

🎯 RESULTADO ESPERADO:
- NCM: 00000000 (sem pontos)
- CFOP: 5102 (sem pontos)
- Match perfeito entre produto e regra

⚠️ IMPORTANTE:
- NÃO criar FK entre produto e regra
- Busca dinâmica baseada em contexto
- Permite múltiplas regras por produto
*/
