-- =====================================================
-- CORREÇÃO RÁPIDA - EMPRESA PADRÃO E CFOP PRODUTOS
-- Data: 23/01/2026
-- =====================================================

-- 1️⃣ DEFINIR PRIMEIRA EMPRESA COMO PADRÃO
-- (Altere o WHERE se quiser definir outra empresa)
UPDATE empresas 
SET empresa_padrao_nfe = true 
WHERE id = (
    SELECT id FROM empresas 
    WHERE ativo = true AND emite_nfe = true 
    ORDER BY id 
    LIMIT 1
);

-- Verificar qual empresa foi definida como padrão
SELECT 
    id, 
    codigo, 
    nome_fantasia, 
    cnpj, 
    empresa_padrao_nfe 
FROM empresas 
WHERE empresa_padrao_nfe = true;

-- 2️⃣ ADICIONAR CFOP PADRÃO NOS PRODUTOS (5102 - Venda dentro do estado)
UPDATE produtos 
SET cfop_saida = '5102'
WHERE ativo = true 
AND (cfop_saida IS NULL OR cfop_saida = '');

-- Verificar produtos atualizados
SELECT 
    id,
    codigo_interno,
    nome,
    ncm,
    cfop_saida,
    ativo
FROM produtos
WHERE ativo = true;

-- 3️⃣ VALIDAÇÃO FINAL
SELECT 
    'EMPRESAS' as categoria,
    (SELECT COUNT(*) FROM empresas WHERE ativo = true) as total,
    (SELECT COUNT(*) FROM empresas WHERE ativo = true AND emite_nfe = true) as emite_nfe,
    (SELECT COUNT(*) FROM empresas WHERE ativo = true AND empresa_padrao_nfe = true) as empresa_padrao
UNION ALL
SELECT 
    'PRODUTOS',
    (SELECT COUNT(*) FROM produtos WHERE ativo = true) as total,
    (SELECT COUNT(*) FROM produtos WHERE ativo = true AND ncm IS NOT NULL) as com_ncm,
    (SELECT COUNT(*) FROM produtos WHERE ativo = true AND cfop_saida IS NOT NULL) as com_cfop;

-- ✅ RESULTADO ESPERADO
-- EMPRESAS: empresa_padrao = 1
-- PRODUTOS: com_cfop = 2

RAISE NOTICE '================================================';
RAISE NOTICE '✅ CORREÇÕES APLICADAS COM SUCESSO!';
RAISE NOTICE '================================================';
RAISE NOTICE '1. Empresa padrão definida';
RAISE NOTICE '2. CFOP 5102 adicionado aos produtos';
RAISE NOTICE '================================================';
RAISE NOTICE 'Agora teste a emissão de NF-e:';
RAISE NOTICE '1. Acesse: Cadastro > Empresa';
RAISE NOTICE '2. Verifique se a empresa tem ⭐ marcado';
RAISE NOTICE '3. Acesse: Notas Fiscais > Emitir NF-e';
RAISE NOTICE '4. A empresa deve estar pré-selecionada!';
RAISE NOTICE '================================================';
