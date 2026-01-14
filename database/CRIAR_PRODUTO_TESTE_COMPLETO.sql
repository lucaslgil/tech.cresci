-- =====================================================
-- CRIAR PRODUTO DE TESTE COMPLETO PARA EMISSÃO DE NF
-- Com todos os impostos: ICMS, PIS, COFINS, IBS, CBS
-- Data: 13/01/2026
-- VERSÃO CORRIGIDA - ESTRUTURA REAL DAS TABELAS
-- =====================================================

-- =====================================================
-- 1. VERIFICAR/CRIAR EMPRESA DE TESTE
-- =====================================================

DO $$
DECLARE
  v_empresa_id INTEGER;
BEGIN
  -- Tentar buscar primeira empresa
  SELECT id INTO v_empresa_id
  FROM empresas
  LIMIT 1;
  
  -- Se não existir, criar empresa de teste
  IF v_empresa_id IS NULL THEN
    INSERT INTO empresas (
      codigo,
      razao_social,
      nome_fantasia,
      cnpj,
      email,
      telefone,
      cep,
      endereco,
      numero,
      cidade,
      estado
    ) VALUES (
      'EMP999',
      'EMPRESA TESTE LTDA',
      'Empresa Teste',
      '12.345.678/0001-90',
      'contato@empresateste.com.br',
      '(11) 98765-4321',
      '01310-100',
      'Avenida Paulista',
      '1000',
      'São Paulo',
      'SP'
    ) RETURNING id INTO v_empresa_id;
    
    RAISE NOTICE 'Empresa de teste criada com ID: %', v_empresa_id;
  ELSE
    RAISE NOTICE 'Usando empresa existente ID: %', v_empresa_id;
  END IF;
END $$;

-- =====================================================
-- 2. CRIAR NCM DE TESTE (Mouse - Periférico)
-- =====================================================

INSERT INTO ncm (
  codigo,
  descricao,
  ativo
) VALUES (
  '85176255',
  'Mouse (rato) - periférico de entrada para computador',
  TRUE
) ON CONFLICT (codigo) DO UPDATE SET
  descricao = EXCLUDED.descricao;

-- =====================================================
-- 3. CRIAR CFOP DE TESTE (Venda dentro do estado)
-- =====================================================

INSERT INTO cfop (
  codigo,
  descricao,
  aplicacao,
  tipo_operacao,
  movimenta_estoque,
  movimenta_financeiro,
  calcula_icms,
  calcula_ipi,
  calcula_pis,
  calcula_cofins,
  ativo
) VALUES (
  '5102',
  'Venda de mercadoria adquirida ou recebida de terceiros',
  'VENDAS',
  'SAIDA',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE
) ON CONFLICT (codigo) DO UPDATE SET
  descricao = EXCLUDED.descricao;

-- =====================================================
-- 4. CRIAR PRODUTO DE TESTE COMPLETO
-- =====================================================

DO $$
DECLARE
  v_empresa_id INTEGER;
  v_produto_id UUID;
BEGIN
  -- Buscar primeira empresa
  SELECT id INTO v_empresa_id
  FROM empresas
  LIMIT 1;
  
  -- Verificar se produto já existe e deletar
  DELETE FROM produtos WHERE codigo_interno = 'PROD-001';
  
  -- Criar produto
  INSERT INTO produtos (
    empresa_id,
    codigo_interno,
    codigo_barras,
    nome,
    descricao,
    categoria,
    unidade_medida,
    
    -- Dados Fiscais
    ncm,
    cest,
    cfop_entrada,
    cfop_saida,
    origem_mercadoria,
    
    -- ICMS (Sistema Antigo)
    cst_icms,
    csosn_icms,
    aliquota_icms,
    
    -- PIS (Sistema Antigo)
    cst_pis,
    aliquota_pis,
    
    -- COFINS (Sistema Antigo)
    cst_cofins,
    aliquota_cofins,
    
    -- IPI (Sistema Antigo)
    cst_ipi,
    aliquota_ipi,
    
    -- IBS e CBS (Sistema Novo - Reforma 2026)
    aliquota_ibs,
    aliquota_cbs,
    regime_transicao,
    excecao_ibs,
    excecao_cbs,
    cst_ibs,
    cst_cbs,
    
    -- Dados Comerciais
    preco_custo,
    preco_venda,
    margem_lucro,
    permite_desconto,
    desconto_maximo,
    
    -- Estoque
    estoque_atual,
    estoque_minimo,
    estoque_maximo,
    controla_estoque,
    
    -- Status
    ativo
  ) VALUES (
    v_empresa_id,
    'PROD-001',
    '7891234567890',
    'Mouse Óptico USB Preto',
    'Mouse óptico com fio USB, 1000 DPI, cor preto, plug and play',
    'INFORMÁTICA',
    'UN',
    
    -- Dados Fiscais
    '85176255',
    '2108600',
    '1102',
    '5102',
    0,
    
    -- ICMS - Simples Nacional
    NULL,
    '102',
    18.00,
    
    -- PIS
    '01',
    1.65,
    
    -- COFINS
    '01',
    7.60,
    
    -- IPI
    '53',
    0.00,
    
    -- IBS e CBS (Reforma 2026)
    27.00,
    12.00,
    'MISTO',
    FALSE,
    FALSE,
    '00',
    '00',
    
    -- Dados Comerciais
    45.00,
    89.90,
    99.78,
    TRUE,
    10.00,
    
    -- Estoque
    50,
    10,
    100,
    TRUE,
    
    -- Status
    TRUE
  ) RETURNING id INTO v_produto_id;
  
  RAISE NOTICE '✅ Produto de teste criado com ID: %', v_produto_id;
  RAISE NOTICE '📦 Código: PROD-001 | Preço: R$ 89,90 | Estoque: 50 UN';
END $$;

-- =====================================================
-- 5. CRIAR REGRA DE TRIBUTAÇÃO PARA O PRODUTO
-- =====================================================

DO $$
DECLARE
  v_empresa_id INTEGER;
  v_regra_id BIGINT;
BEGIN
  -- Buscar primeira empresa
  SELECT id INTO v_empresa_id
  FROM empresas
  LIMIT 1;
  
  -- Deletar regra antiga se existir
  DELETE FROM regras_tributacao WHERE ncm = '85176255';
  
  -- Criar regra de tributação
  INSERT INTO regras_tributacao (
    empresa_id,
    nome,
    ativo,
    
    -- Filtros
    ncm,
    cfop_saida,
    origem_mercadoria,
    
    -- ICMS
    csosn_icms,
    aliquota_icms,
    
    -- PIS
    cst_pis,
    aliquota_pis,
    
    -- COFINS
    cst_cofins,
    aliquota_cofins,
    
    -- IPI
    cst_ipi,
    aliquota_ipi,
    
    -- IBS e CBS (Reforma 2026)
    aliquota_ibs,
    aliquota_cbs,
    cst_ibs,
    cst_cbs,
    base_calculo_ibs_diferenciada,
    base_calculo_cbs_diferenciada,
    reducao_base_ibs,
    reducao_base_cbs,
    percentual_diferimento_ibs,
    percentual_diferimento_cbs,
    ano_vigencia
  ) VALUES (
    v_empresa_id,
    'Regra Padrão - Produtos de Informática (NCM 8517)',
    TRUE,
    
    -- Filtros
    '85176255',
    '5102',
    '0',
    
    -- ICMS
    '102',
    18.00,
    
    -- PIS
    '01',
    1.65,
    
    -- COFINS
    '01',
    7.60,
    
    -- IPI
    '53',
    0.00,
    
    -- IBS e CBS
    27.00,
    12.00,
    '00',
    '00',
    FALSE,
    FALSE,
    0.00,
    0.00,
    0.00,
    0.00,
    2026
  ) RETURNING id INTO v_regra_id;
  
  RAISE NOTICE '✅ Regra de tributação criada com ID: %', v_regra_id;
END $$;

-- =====================================================
-- 6. CRIAR CLIENTE DE TESTE
-- =====================================================

DO $$
DECLARE
  v_empresa_id INTEGER;
  v_cliente_id UUID;
BEGIN
  -- Buscar primeira empresa
  SELECT id INTO v_empresa_id
  FROM empresas
  LIMIT 1;
  
  -- Deletar cliente antigo se existir
  DELETE FROM clientes WHERE cpf_cnpj = '98765432000100';
  
  -- Criar cliente de teste
  INSERT INTO clientes (
    empresa_id,
    tipo_pessoa,
    cpf_cnpj,
    nome,
    razao_social,
    inscricao_estadual,
    email,
    telefone,
    celular,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    uf,
    codigo_municipio,
    ativo
  ) VALUES (
    v_empresa_id,
    'JURIDICA',
    '98765432000100',
    'CLIENTE TESTE LTDA',
    'CLIENTE TESTE COMERCIO DE PRODUTOS LTDA',
    '987654321',
    'cliente@teste.com.br',
    '(11) 3456-7890',
    '(11) 98765-4321',
    '04101-300',
    'Avenida Brigadeiro Luís Antônio',
    '500',
    'Sala 10',
    'Bela Vista',
    'São Paulo',
    'SP',
    '3550308',
    TRUE
  ) RETURNING id INTO v_cliente_id;
  
  RAISE NOTICE '✅ Cliente de teste criado com ID: %', v_cliente_id;
  RAISE NOTICE '👤 CNPJ: 98.765.432/0001-00';
END $$;

-- =====================================================
-- 7. VERIFICAR DADOS CRIADOS
-- =====================================================

SELECT '✅ SCRIPT EXECUTADO COM SUCESSO!' AS status;

-- Mostrar resumo completo
SELECT 
  'EMPRESA' AS tipo,
  razao_social AS nome,
  cnpj AS documento
FROM empresas
LIMIT 1;

SELECT 
  'PRODUTO' AS tipo,
  nome AS nome,
  codigo_interno AS documento
FROM produtos
WHERE codigo_interno = 'PROD-001';

SELECT 
  'CLIENTE' AS tipo,
  nome AS nome,
  cpf_cnpj AS documento
FROM clientes
WHERE cpf_cnpj = '98765432000100';

-- =====================================================
-- 8. INSTRUÇÕES FINAIS
-- =====================================================

/*
✅ DADOS CRIADOS COM SUCESSO!

📦 PRODUTO:
- Código: PROD-001
- Nome: Mouse Óptico USB Preto
- NCM: 85176255
- Código de Barras: 7891234567890
- Preço: R$ 89,90
- Estoque: 50 unidades

💰 IMPOSTOS CONFIGURADOS:
Sistema Antigo:
- ICMS: 18% (CSOSN 102 - Simples Nacional)
- PIS: 1.65%
- COFINS: 7.60%
- IPI: 0% (CST 53)

Sistema Novo (Reforma 2026):
- IBS: 27%
- CBS: 12%
- Regime: MISTO (calcula ambos durante transição)

👤 CLIENTE DE TESTE:
- CNPJ: 98.765.432/0001-00
- Razão Social: CLIENTE TESTE LTDA
- Cidade: São Paulo/SP

📋 COMO EMITIR A NOTA FISCAL:

1. Acesse: Menu → NOTAS FISCAIS → Emissão de Notas Fiscais

2. Selecione:
   - Modo: AVULSA (emissão manual)
   - Tipo: NFE (Nota Fiscal Eletrônica)
   - Série: 1
   - Natureza: Venda
   - CFOP: 5102

3. Destinatário:
   - Busque pelo CNPJ: 98765432000100
   - Ou selecione: CLIENTE TESTE LTDA

4. Adicionar Item:
   - Busque pelo código: PROD-001
   - Ou pelo nome: Mouse Óptico
   - Quantidade: 1
   - Valor Unitário: R$ 89,90

5. Sistema calculará automaticamente:
   Sistema Antigo (100% em 2026):
   - ICMS: R$ 16,18 (18%)
   - PIS: R$ 1,48 (1.65%)
   - COFINS: R$ 6,83 (7.6%)
   
   Sistema Novo (1% em 2026):
   - IBS: R$ 0,24 (27% × 1%)
   - CBS: R$ 0,11 (12% × 1%)
   
   Total de Impostos: ~R$ 24,84
   Carga Tributária: ~27.64%

6. Clique em "Emitir Nota Fiscal"

🎯 PRÓXIMOS PASSOS:
- Configure certificado digital para transmissão SEFAZ
- Configure série de notas na empresa
- Configure ambiente (homologação/produção)
*/
