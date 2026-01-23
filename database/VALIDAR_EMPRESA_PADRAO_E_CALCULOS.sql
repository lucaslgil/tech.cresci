-- =====================================================
-- SCRIPT DE VALIDAÇÃO - EMPRESA PADRÃO E CÁLCULOS FISCAIS
-- Data: 23/01/2026
-- =====================================================

-- 1️⃣ VERIFICAR SE CAMPO EXISTE
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'empresas' 
AND column_name IN ('empresa_padrao_nfe', 'estado', 'regime_tributario');

-- 2️⃣ VERIFICAR EMPRESAS CADASTRADAS
SELECT 
    id,
    codigo,
    nome_fantasia,
    cnpj,
    estado,
    regime_tributario,
    emite_nfe,
    empresa_padrao_nfe,
    serie_nfe,
    ambiente_nfe,
    ativo
FROM empresas
WHERE ativo = true
ORDER BY empresa_padrao_nfe DESC NULLS LAST, nome_fantasia;

-- 3️⃣ CONTAR EMPRESAS POR STATUS
SELECT 
    CASE 
        WHEN emite_nfe = true AND empresa_padrao_nfe = true THEN '⭐ Empresa Padrão NF-e'
        WHEN emite_nfe = true THEN '✅ Emite NF-e'
        ELSE '❌ Não emite NF-e'
    END as status,
    COUNT(*) as quantidade
FROM empresas
WHERE ativo = true
GROUP BY emite_nfe, empresa_padrao_nfe
ORDER BY empresa_padrao_nfe DESC NULLS LAST;

-- 4️⃣ VERIFICAR SE TRIGGER EXISTE
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trg_garantir_unica_empresa_padrao_nfe';

-- 5️⃣ VERIFICAR REGRAS DE TRIBUTAÇÃO CADASTRADAS
SELECT 
    COUNT(*) as total_regras,
    COUNT(CASE WHEN ativo = true THEN 1 END) as regras_ativas,
    COUNT(DISTINCT ncm) as ncms_cadastrados,
    COUNT(DISTINCT cfop_saida) as cfops_cadastrados
FROM regras_tributacao;

-- 6️⃣ VERIFICAR PRODUTOS COM DADOS FISCAIS COMPLETOS
SELECT 
    COUNT(*) as total_produtos,
    COUNT(CASE WHEN ncm IS NOT NULL AND ncm != '' THEN 1 END) as com_ncm,
    COUNT(CASE WHEN cfop_saida IS NOT NULL THEN 1 END) as com_cfop,
    COUNT(CASE WHEN ncm IS NOT NULL AND cfop_saida IS NOT NULL THEN 1 END) as completos
FROM produtos
WHERE ativo = true;

-- 7️⃣ TESTE: DEFINIR EMPRESA PADRÃO (AJUSTAR ID)
-- Descomente e ajuste o ID conforme sua necessidade
/*
UPDATE empresas 
SET empresa_padrao_nfe = true 
WHERE id = 1; -- Altere para o ID da sua empresa
*/

-- 8️⃣ VERIFICAR ÚLTIMAS NOTAS EMITIDAS
SELECT 
    nf.id,
    nf.numero,
    nf.serie,
    nf.tipo_nota,
    nf.modelo,
    nf.chave_acesso,
    nf.valor_total,
    nf.status,
    nf.destinatario_nome,
    nf.created_at
FROM notas_fiscais nf
ORDER BY nf.created_at DESC
LIMIT 5;

-- 9️⃣ VERIFICAR ITENS DA ÚLTIMA NOTA COM IMPOSTOS
SELECT 
    nfi.numero_item,
    nfi.codigo_produto,
    nfi.descricao,
    nfi.ncm,
    nfi.cfop,
    nfi.quantidade_comercial,
    nfi.valor_unitario_comercial,
    nfi.valor_total,
    nfi.base_calculo_icms,
    nfi.valor_icms,
    nfi.valor_pis,
    nfi.valor_cofins,
    nfi.valor_ipi
FROM notas_fiscais_itens nfi
WHERE nfi.nota_fiscal_id = (
    SELECT id FROM notas_fiscais ORDER BY created_at DESC LIMIT 1
)
ORDER BY nfi.numero_item;

-- 🔟 VERIFICAR ÍNDICES CRIADOS
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'empresas'
AND indexname LIKE '%padrao%';

-- =====================================================
-- RESULTADOS ESPERADOS
-- =====================================================
-- 1️⃣ 3 colunas retornadas (empresa_padrao_nfe, estado, regime_tributario)
-- 2️⃣ Lista de empresas com coluna empresa_padrao_nfe = true em uma delas
-- 3️⃣ Pelo menos 1 empresa com status "⭐ Empresa Padrão NF-e"
-- 4️⃣ Trigger "trg_garantir_unica_empresa_padrao_nfe" encontrado
-- 5️⃣ Pelo menos algumas regras de tributação ativas
-- 6️⃣ Produtos com NCM e CFOP preenchidos
-- 9️⃣ Itens com valores de impostos calculados (não NULL)
-- 🔟 Índice idx_empresas_padrao_nfe criado
-- =====================================================

-- 📊 ESTATÍSTICAS FISCAIS
SELECT 
    'EMPRESAS' as categoria,
    (SELECT COUNT(*) FROM empresas WHERE ativo = true) as total,
    (SELECT COUNT(*) FROM empresas WHERE ativo = true AND emite_nfe = true) as emite_nfe,
    (SELECT COUNT(*) FROM empresas WHERE ativo = true AND empresa_padrao_nfe = true) as empresa_padrao
UNION ALL
SELECT 
    'REGRAS TRIBUTAÇÃO',
    (SELECT COUNT(*) FROM regras_tributacao) as total,
    (SELECT COUNT(*) FROM regras_tributacao WHERE ativo = true) as ativas,
    (SELECT COUNT(DISTINCT ncm) FROM regras_tributacao WHERE ativo = true) as ncms_unicos
UNION ALL
SELECT 
    'PRODUTOS',
    (SELECT COUNT(*) FROM produtos WHERE ativo = true) as total,
    (SELECT COUNT(*) FROM produtos WHERE ativo = true AND ncm IS NOT NULL) as com_ncm,
    (SELECT COUNT(*) FROM produtos WHERE ativo = true AND cfop_saida IS NOT NULL) as com_cfop
UNION ALL
SELECT 
    'NOTAS FISCAIS',
    (SELECT COUNT(*) FROM notas_fiscais) as total,
    (SELECT COUNT(*) FROM notas_fiscais WHERE status = 'AUTORIZADA') as autorizadas,
    (SELECT COUNT(*) FROM notas_fiscais WHERE status = 'RASCUNHO') as rascunhos;

-- ✅ VALIDAÇÃO FINAL
DO $$
DECLARE
    empresa_padrao_count INTEGER;
    empresas_emissoras INTEGER;
    regras_ativas INTEGER;
BEGIN
    -- Contar empresas padrão
    SELECT COUNT(*) INTO empresa_padrao_count
    FROM empresas
    WHERE ativo = true AND empresa_padrao_nfe = true;
    
    -- Contar empresas emissoras
    SELECT COUNT(*) INTO empresas_emissoras
    FROM empresas
    WHERE ativo = true AND emite_nfe = true;
    
    -- Contar regras ativas
    SELECT COUNT(*) INTO regras_ativas
    FROM regras_tributacao
    WHERE ativo = true;
    
    RAISE NOTICE '================================================';
    RAISE NOTICE '🔍 VALIDAÇÃO DO SISTEMA FISCAL';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Empresas Emissoras: %', empresas_emissoras;
    RAISE NOTICE 'Empresa Padrão NF-e: %', empresa_padrao_count;
    RAISE NOTICE 'Regras Tributação Ativas: %', regras_ativas;
    RAISE NOTICE '================================================';
    
    IF empresa_padrao_count = 0 THEN
        RAISE WARNING '⚠️ ATENÇÃO: Nenhuma empresa definida como padrão!';
        RAISE NOTICE '💡 SOLUÇÃO: Execute: UPDATE empresas SET empresa_padrao_nfe = true WHERE id = <SEU_ID>;';
    ELSIF empresa_padrao_count = 1 THEN
        RAISE NOTICE '✅ Empresa padrão configurada corretamente';
    ELSE
        RAISE WARNING '⚠️ ATENÇÃO: Múltiplas empresas definidas como padrão (trigger deve corrigir automaticamente)';
    END IF;
    
    IF empresas_emissoras = 0 THEN
        RAISE WARNING '⚠️ ATENÇÃO: Nenhuma empresa configurada para emitir NF-e!';
        RAISE NOTICE '💡 SOLUÇÃO: Edite uma empresa e marque o checkbox "Emite NF-e"';
    END IF;
    
    IF regras_ativas = 0 THEN
        RAISE WARNING '⚠️ ATENÇÃO: Nenhuma regra de tributação cadastrada!';
        RAISE NOTICE '💡 SOLUÇÃO: Acesse Notas Fiscais > Regras de Tributação e cadastre regras';
    ELSE
        RAISE NOTICE '✅ % regras de tributação cadastradas', regras_ativas;
    END IF;
    
    RAISE NOTICE '================================================';
END $$;
