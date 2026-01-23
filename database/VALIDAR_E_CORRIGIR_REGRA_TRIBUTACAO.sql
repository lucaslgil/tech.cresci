-- =====================================================
-- VALIDAÇÃO E CORREÇÃO - REGRAS DE TRIBUTAÇÃO
-- Data: 23/01/2026
-- Objetivo: Validar e corrigir regra para calcular impostos
-- =====================================================

-- 1️⃣ VERIFICAR REGRA ATUAL
SELECT 
    id,
    ncm,
    cfop_saida,
    csosn_icms,
    cst_pis,
    cst_cofins,
    -- ICMS
    aliquota_icms,
    reducao_bc_icms,
    modalidade_bc_icms,
    -- PIS/COFINS
    aliquota_pis,
    aliquota_cofins,
    -- IPI
    cst_ipi,
    aliquota_ipi,
    -- Outros
    origem_mercadoria,
    ativo
FROM regras_tributacao
WHERE ncm = '00000000' AND cfop_saida = '5102';

-- 2️⃣ ATUALIZAR REGRA COM ALÍQUOTAS COMPLETAS
-- Simples Nacional - CSOSN 101 (Tributada com permissão de crédito)
UPDATE regras_tributacao
SET 
    -- Origem da Mercadoria (0 = Nacional)
    origem_mercadoria = '0',
    
    -- ICMS (Simples Nacional - CSOSN 101)
    csosn_icms = '101',
    aliquota_icms = 18.00,  -- 18% padrão SP
    reducao_bc_icms = 0,
    modalidade_bc_icms = '0', -- 0 = Margem Valor Agregado (MVA)
    
    -- PIS (01 = Operação Tributável com Alíquota Básica)
    cst_pis = '01',
    aliquota_pis = 1.65,  -- 1,65% padrão
    
    -- COFINS (01 = Operação Tributável com Alíquota Básica)
    cst_cofins = '01',
    aliquota_cofins = 7.60,  -- 7,60% padrão
    
    -- IPI (99 = Outras Saídas)
    cst_ipi = '99',
    aliquota_ipi = 0,  -- 0% se não houver IPI
    
    -- Mensagens fiscais (opcional)
    mensagem_nf_icms = 'Simples Nacional - CSOSN 101',
    mensagem_nf_pis = 'PIS - CST 01 - Alíquota 1,65%',
    mensagem_nf_cofins = 'COFINS - CST 01 - Alíquota 7,60%',
    
    -- Garantir que está ativa
    ativo = true,
    
    -- Atualizar timestamp
    updated_at = NOW()
    
WHERE ncm = '00000000' AND cfop_saida = '5102';

-- 3️⃣ VERIFICAR SE A ATUALIZAÇÃO FOI APLICADA
SELECT 
    '✅ REGRA ATUALIZADA' as status,
    ncm,
    cfop_saida,
    csosn_icms,
    aliquota_icms || '%' as aliq_icms,
    cst_pis,
    aliquota_pis || '%' as aliq_pis,
    cst_cofins,
    aliquota_cofins || '%' as aliq_cofins,
    cst_ipi,
    aliquota_ipi || '%' as aliq_ipi,
    origem_mercadoria,
    ativo
FROM regras_tributacao
WHERE ncm = '00000000' AND cfop_saida = '5102';

-- 4️⃣ VALIDAR ESTRUTURA COMPLETA DA REGRA
SELECT 
    CASE 
        WHEN ncm IS NOT NULL AND ncm != '' THEN '✅'
        ELSE '❌'
    END as ncm_ok,
    CASE 
        WHEN cfop_saida IS NOT NULL THEN '✅'
        ELSE '❌'
    END as cfop_ok,
    CASE 
        WHEN csosn_icms IS NOT NULL OR cst_icms IS NOT NULL THEN '✅'
        ELSE '❌'
    END as icms_ok,
    CASE 
        WHEN aliquota_icms > 0 THEN '✅'
        ELSE '⚠️ Zerado'
    END as aliq_icms_ok,
    CASE 
        WHEN cst_pis IS NOT NULL AND aliquota_pis > 0 THEN '✅'
        ELSE '❌'
    END as pis_ok,
    CASE 
        WHEN cst_cofins IS NOT NULL AND aliquota_cofins > 0 THEN '✅'
        ELSE '❌'
    END as cofins_ok,
    CASE 
        WHEN origem_mercadoria IS NOT NULL THEN '✅'
        ELSE '❌'
    END as origem_ok,
    CASE 
        WHEN ativo = true THEN '✅'
        ELSE '❌'
    END as ativo_ok
FROM regras_tributacao
WHERE ncm = '00000000' AND cfop_saida = '5102';

-- 5️⃣ TESTE DE CÁLCULO MANUAL
-- Simular cálculo para um item de R$ 50,00
WITH item_teste AS (
    SELECT 
        50.00 as valor_total,
        r.aliquota_icms,
        r.aliquota_pis,
        r.aliquota_cofins,
        r.aliquota_ipi
    FROM regras_tributacao r
    WHERE r.ncm = '00000000' AND r.cfop_saida = '5102'
)
SELECT 
    '💰 SIMULAÇÃO DE CÁLCULO' as tipo,
    'R$ ' || valor_total::TEXT as valor_item,
    'R$ ' || ROUND((valor_total * aliquota_icms / 100), 2)::TEXT as valor_icms_esperado,
    'R$ ' || ROUND((valor_total * aliquota_pis / 100), 2)::TEXT as valor_pis_esperado,
    'R$ ' || ROUND((valor_total * aliquota_cofins / 100), 2)::TEXT as valor_cofins_esperado,
    'R$ ' || ROUND((valor_total * aliquota_ipi / 100), 2)::TEXT as valor_ipi_esperado
FROM item_teste;

-- 6️⃣ VERIFICAR SE PRODUTOS TÊM NCM E CFOP CORRETOS
SELECT 
    p.id,
    p.codigo_interno,
    p.nome,
    p.ncm,
    p.cfop_saida,
    CASE 
        WHEN p.ncm = '00000000' AND p.cfop_saida = '5102' THEN '✅ Match com regra'
        WHEN p.ncm = '00000000' THEN '⚠️ NCM ok, CFOP diferente'
        WHEN p.cfop_saida = '5102' THEN '⚠️ CFOP ok, NCM diferente'
        ELSE '❌ Não match'
    END as status_regra
FROM produtos p
WHERE p.ativo = true
ORDER BY p.codigo_interno;

-- 7️⃣ CRIAR REGRA GENÉRICA (SE NECESSÁRIO)
-- Esta regra serve como fallback para produtos sem NCM específico
INSERT INTO regras_tributacao (
    empresa_id,
    nome,
    ncm,
    cfop_saida,
    origem_mercadoria,
    -- ICMS Simples Nacional
    csosn_icms,
    aliquota_icms,
    reducao_bc_icms,
    modalidade_bc_icms,
    -- PIS
    cst_pis,
    aliquota_pis,
    -- COFINS
    cst_cofins,
    aliquota_cofins,
    -- IPI
    cst_ipi,
    aliquota_ipi,
    -- Controle
    ativo,
    prioridade,
    tipo_documento,
    mensagem_nf_icms,
    mensagem_nf_pis,
    mensagem_nf_cofins
) 
SELECT 
    (SELECT id FROM empresas WHERE ativo = true AND emite_nfe = true ORDER BY id LIMIT 1),
    'REGRA GENÉRICA - Venda dentro do Estado',
    NULL,  -- NULL = aplica para qualquer NCM
    '5102',
    '0',  -- Nacional
    '101',  -- CSOSN Simples Nacional
    18.00,  -- ICMS 18%
    0,
    '0',
    '01',  -- PIS tributável
    1.65,
    '01',  -- COFINS tributável
    7.60,
    '99',  -- IPI outras saídas
    0,
    true,
    0,  -- Prioridade baixa (regras específicas têm prioridade maior)
    'NFE',
    'Simples Nacional - CSOSN 101 - Permissão de crédito',
    'PIS - CST 01 - Base de cálculo com alíquota de 1,65%',
    'COFINS - CST 01 - Base de cálculo com alíquota de 7,60%'
WHERE NOT EXISTS (
    SELECT 1 FROM regras_tributacao 
    WHERE ncm IS NULL AND cfop_saida = '5102' AND ativo = true
);

-- 8️⃣ LISTAR TODAS AS REGRAS ATIVAS
SELECT 
    id,
    nome,
    ncm,
    cfop_saida,
    csosn_icms as icms,
    aliquota_icms || '%' as aliq_icms,
    cst_pis as pis,
    aliquota_pis || '%' as aliq_pis,
    cst_cofins as cofins,
    aliquota_cofins || '%' as aliq_cofins,
    prioridade,
    ativo
FROM regras_tributacao
WHERE ativo = true
ORDER BY prioridade DESC, ncm NULLS LAST;

-- =====================================================
-- 📋 CHECKLIST DE VALIDAÇÃO
-- =====================================================
-- ✅ Regra existe para NCM 00000000 + CFOP 5102
-- ✅ Alíquotas preenchidas (ICMS, PIS, COFINS)
-- ✅ CST/CSOSN definidos corretamente
-- ✅ Origem mercadoria definida
-- ✅ Regra ativa
-- ✅ Produtos com NCM e CFOP corretos
-- =====================================================

-- 🎯 RESULTADO ESPERADO APÓS ATUALIZAÇÃO:
-- Ao adicionar produtos na NF-e, os impostos devem ser calculados:
-- - Base ICMS: R$ 50,00
-- - Valor ICMS: R$ 9,00 (18%)
-- - Valor PIS: R$ 0,83 (1,65%)
-- - Valor COFINS: R$ 3,80 (7,60%)
-- Total Tributos: R$ 13,63

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ SCRIPT DE VALIDAÇÃO CONCLUÍDO';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Verifique os resultados acima';
    RAISE NOTICE '2. Acesse: Notas Fiscais > Emitir NF-e';
    RAISE NOTICE '3. Adicione um produto';
    RAISE NOTICE '4. Verifique se os impostos aparecem na tabela';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Se ainda não aparecer:';
    RAISE NOTICE '1. Abra o Console do navegador (F12)';
    RAISE NOTICE '2. Procure por erros em vermelho';
    RAISE NOTICE '3. Verifique se o motor fiscal está sendo chamado';
    RAISE NOTICE '================================================';
END $$;
