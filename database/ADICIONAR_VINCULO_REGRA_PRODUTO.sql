-- =====================================================
-- ADICIONAR VÍNCULO DIRETO: PRODUTO → REGRA TRIBUTAÇÃO
-- Data: 23/01/2026
-- Abordagem Híbrida: Vínculo direto + Busca dinâmica
-- =====================================================

-- 1️⃣ ADICIONAR CAMPO OPCIONAL regra_tributacao_id
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS regra_tributacao_id INTEGER 
REFERENCES regras_tributacao(id) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_produtos_regra_tributacao 
ON produtos(regra_tributacao_id);

-- Comentário explicativo
COMMENT ON COLUMN produtos.regra_tributacao_id IS 
'ID da regra de tributação preferencial. Se NULL, motor fiscal busca dinamicamente por NCM+CFOP+UF';

-- 2️⃣ VERIFICAR REGRAS DISPONÍVEIS
SELECT 
    id,
    nome,
    ncm,
    cfop_saida,
    csosn_icms,
    cst_icms,
    aliquota_icms,
    aliquota_pis,
    aliquota_cofins,
    ativo
FROM regras_tributacao
WHERE ativo = true
ORDER BY prioridade DESC, ncm;

-- 3️⃣ POPULAR AUTOMATICAMENTE PRODUTOS COM SUAS REGRAS
-- Vincula produtos às regras baseado em NCM + CFOP (match exato)
UPDATE produtos p
SET regra_tributacao_id = r.id,
    updated_at = NOW()
FROM regras_tributacao r
WHERE p.ativo = true
AND r.ativo = true
AND p.ncm = r.ncm
AND p.cfop_saida = r.cfop_saida
AND p.regra_tributacao_id IS NULL;

-- Verificar produtos vinculados
SELECT 
    p.codigo_interno,
    p.nome,
    p.ncm,
    p.cfop_saida,
    p.regra_tributacao_id,
    r.nome as regra_nome,
    r.aliquota_icms,
    r.aliquota_pis,
    r.aliquota_cofins,
    CASE 
        WHEN p.regra_tributacao_id IS NOT NULL THEN '✅ VINCULADO'
        ELSE '⚠️ SEM VÍNCULO (busca dinâmica)'
    END as status
FROM produtos p
LEFT JOIN regras_tributacao r ON r.id = p.regra_tributacao_id
WHERE p.ativo = true
ORDER BY p.codigo_interno;

-- 4️⃣ ESTATÍSTICAS DE VINCULAÇÃO
SELECT 
    COUNT(*) as total_produtos,
    COUNT(regra_tributacao_id) as com_vinculo_direto,
    COUNT(*) - COUNT(regra_tributacao_id) as sem_vinculo
FROM produtos
WHERE ativo = true;

-- 5️⃣ PRODUTOS SEM VÍNCULO (precisam de atenção)
SELECT 
    p.codigo_interno,
    p.nome,
    p.ncm,
    p.cfop_saida,
    '⚠️ Sem regra vinculada - Motor fiscal buscará dinamicamente' as alerta,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM regras_tributacao r 
            WHERE r.ncm = p.ncm 
            AND r.cfop_saida = p.cfop_saida 
            AND r.ativo = true
        ) THEN '✅ Tem regra compatível (busca dinâmica funcionará)'
        ELSE '❌ Sem regra compatível (criar regra ou usar genérica)'
    END as situacao
FROM produtos p
WHERE p.ativo = true
AND p.regra_tributacao_id IS NULL
ORDER BY p.codigo_interno;

-- 6️⃣ CRIAR VIEW PARA FACILITAR CONSULTAS
CREATE OR REPLACE VIEW vw_produtos_com_tributacao AS
SELECT 
    p.id as produto_id,
    p.codigo_interno,
    p.nome as produto_nome,
    p.ncm,
    p.cest,
    p.cfop_saida,
    p.origem_mercadoria,
    p.regra_tributacao_id,
    r.id as regra_id,
    r.nome as regra_nome,
    r.tipo_documento,
    r.csosn_icms,
    r.cst_icms,
    r.aliquota_icms,
    r.reducao_bc_icms,
    r.modalidade_bc_icms,
    r.cst_pis,
    r.aliquota_pis,
    r.cst_cofins,
    r.aliquota_cofins,
    r.cst_ipi,
    r.aliquota_ipi,
    CASE 
        WHEN p.regra_tributacao_id IS NOT NULL THEN 'VINCULO_DIRETO'
        WHEN EXISTS (
            SELECT 1 FROM regras_tributacao r2 
            WHERE r2.ncm = p.ncm 
            AND r2.cfop_saida = p.cfop_saida 
            AND r2.ativo = true
        ) THEN 'BUSCA_DINAMICA'
        ELSE 'SEM_REGRA'
    END as tipo_vinculo
FROM produtos p
LEFT JOIN regras_tributacao r ON r.id = p.regra_tributacao_id
WHERE p.ativo = true;

-- Testar view
SELECT * FROM vw_produtos_com_tributacao LIMIT 5;

-- 7️⃣ CRIAR FUNÇÃO PARA BUSCAR REGRA DO PRODUTO
CREATE OR REPLACE FUNCTION obter_regra_produto(
    p_produto_id UUID,  -- UUID em vez de INTEGER
    p_uf_destino VARCHAR(2) DEFAULT NULL,
    p_regime_emitente VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
    regra_id BIGINT,  -- BIGINT em vez de INTEGER
    regra_nome VARCHAR,
    tipo_busca VARCHAR,
    aliquota_icms DECIMAL,
    aliquota_pis DECIMAL,
    aliquota_cofins DECIMAL
) AS $$
BEGIN
    -- Primeiro: Tenta vínculo direto
    RETURN QUERY
    SELECT 
        r.id,
        r.nome,
        'VINCULO_DIRETO'::VARCHAR,
        r.aliquota_icms,
        r.aliquota_pis,
        r.aliquota_cofins
    FROM produtos p
    INNER JOIN regras_tributacao r ON r.id = p.regra_tributacao_id
    WHERE p.id = p_produto_id
    AND r.ativo = true
    LIMIT 1;
    
    -- Se não encontrou, busca dinâmica por NCM + CFOP
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            r.id,
            r.nome,
            'BUSCA_DINAMICA'::VARCHAR,
            r.aliquota_icms,
            r.aliquota_pis,
            r.aliquota_cofins
        FROM produtos p
        INNER JOIN regras_tributacao r ON (
            r.ncm = p.ncm 
            AND r.cfop_saida = p.cfop_saida
        )
        WHERE p.id = p_produto_id
        AND r.ativo = true
        AND (p_uf_destino IS NULL OR r.uf_destino IS NULL OR r.uf_destino = p_uf_destino)
        ORDER BY r.prioridade DESC NULLS LAST
        LIMIT 1;
    END IF;
    
    -- Se ainda não encontrou, busca regra genérica (NCM NULL)
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            r.id,
            r.nome,
            'REGRA_GENERICA'::VARCHAR,
            r.aliquota_icms,
            r.aliquota_pis,
            r.aliquota_cofins
        FROM regras_tributacao r
        WHERE r.ativo = true
        AND r.ncm IS NULL
        AND (p_uf_destino IS NULL OR r.uf_destino IS NULL OR r.uf_destino = p_uf_destino)
        ORDER BY r.prioridade DESC NULLS LAST
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Testar função
SELECT * FROM obter_regra_produto(
    (SELECT id FROM produtos WHERE codigo_interno = '000001' LIMIT 1)
);

-- 8️⃣ VALIDAÇÃO FINAL
DO $$
DECLARE
    total_produtos INTEGER;
    com_vinculo INTEGER;
    com_regra_disponivel INTEGER;
    sem_regra INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_produtos FROM produtos WHERE ativo = true;
    SELECT COUNT(*) INTO com_vinculo FROM produtos WHERE ativo = true AND regra_tributacao_id IS NOT NULL;
    
    SELECT COUNT(*) INTO com_regra_disponivel
    FROM produtos p
    WHERE p.ativo = true
    AND EXISTS (
        SELECT 1 FROM regras_tributacao r 
        WHERE r.ncm = p.ncm 
        AND r.cfop_saida = p.cfop_saida 
        AND r.ativo = true
    );
    
    sem_regra := total_produtos - com_regra_disponivel;
    
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ VÍNCULO PRODUTO → REGRA IMPLEMENTADO';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Total de produtos: %', total_produtos;
    RAISE NOTICE 'Com vínculo direto: % (%.1f%%)', com_vinculo, (com_vinculo::FLOAT / total_produtos * 100);
    RAISE NOTICE 'Com regra disponível: % (%.1f%%)', com_regra_disponivel, (com_regra_disponivel::FLOAT / total_produtos * 100);
    RAISE NOTICE 'Sem regra: % (%.1f%%)', sem_regra, (sem_regra::FLOAT / total_produtos * 100);
    RAISE NOTICE '================================================';
    
    IF com_vinculo = total_produtos THEN
        RAISE NOTICE '✅ Todos os produtos têm vínculo direto!';
    ELSIF com_regra_disponivel = total_produtos THEN
        RAISE NOTICE '✅ Todos os produtos têm regra disponível (direto ou dinâmico)!';
    ELSE
        RAISE WARNING '⚠️ % produtos sem regra de tributação', sem_regra;
        RAISE NOTICE '💡 Crie regras específicas ou use regra genérica (NCM NULL)';
    END IF;
END $$;

-- =====================================================
-- DOCUMENTAÇÃO
-- =====================================================
/*
📋 ABORDAGEM HÍBRIDA IMPLEMENTADA:

1️⃣ VÍNCULO DIRETO (Prioridade)
   - Campo: produtos.regra_tributacao_id
   - Usuário escolhe regra no cadastro
   - Motor fiscal usa direto (mais rápido)

2️⃣ BUSCA DINÂMICA (Fallback)
   - Se regra_tributacao_id = NULL
   - Busca por NCM + CFOP + UF + Regime
   - Flexível para casos especiais

3️⃣ REGRA GENÉRICA (Última opção)
   - NCM NULL na regra
   - Aplica para qualquer produto sem regra específica

🎯 PRÓXIMOS PASSOS:
1. Executar este script
2. Atualizar motor fiscal (fiscalEngine.ts)
3. Adicionar dropdown no cadastro de produtos
4. Testar emissão de NF-e
*/
