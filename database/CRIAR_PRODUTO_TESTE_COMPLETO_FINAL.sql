-- =====================================================
-- CRIAR PRODUTO DE TESTE COMPLETO PARA EMISSÃO DE NF
-- Com todos os impostos: ICMS, PIS, COFINS, IBS, CBS
-- Data: 13/01/2026
-- VERSÃO FINAL - ESTRUTURA REAL DAS TABELAS
-- =====================================================

-- =====================================================
-- 1. CRIAR NCM DE TESTE (Mouse - Periférico)
-- =====================================================

DO $$
BEGIN
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

  RAISE NOTICE '✅ NCM 85176255 criado/atualizado';
END $$;

-- =====================================================
-- 2. CRIAR CFOP DE TESTE (Venda dentro do estado)
-- =====================================================

DO $$
BEGIN
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
    descricao = EXCLUDED.descricao,
    aplicacao = EXCLUDED.aplicacao,
    tipo_operacao = EXCLUDED.tipo_operacao;

  RAISE NOTICE '✅ CFOP 5102 criado/atualizado';
END $$;

-- =====================================================
-- 3. CRIAR PRODUTO DE TESTE COMPLETO
-- =====================================================

DO $$
DECLARE
  v_produto_id UUID;
BEGIN
  -- Deletar produto existente se houver
  DELETE FROM produtos WHERE codigo_interno = 'PROD-001';
  
  -- Criar produto
  INSERT INTO produtos (
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
    reducao_bc_icms,
    
    -- Substituição Tributária
    cst_icms_st,
    mva_st,
    aliquota_icms_st,
    reducao_bc_icms_st,
    
    -- PIS (Sistema Antigo)
    cst_pis,
    aliquota_pis,
    
    -- COFINS (Sistema Antigo)
    cst_cofins,
    aliquota_cofins,
    
    -- IPI (Sistema Antigo)
    cst_ipi,
    aliquota_ipi,
    enquadramento_ipi,
    
    -- Regime Tributário
    regime_tributario,
    
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
    localizacao,
    
    -- Controle Lote/Série
    controla_lote,
    controla_serie,
    controla_validade,
    dias_validade,
    
    -- Status
    ativo,
    observacoes
  ) VALUES (
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
    0.00,
    
    -- Substituição Tributária
    NULL,
    0.00,
    0.00,
    0.00,
    
    -- PIS
    '01',
    1.65,
    
    -- COFINS
    '01',
    7.60,
    
    -- IPI
    '53',
    0.00,
    '999',
    
    -- Regime
    'SIMPLES',
    
    -- Dados Comerciais
    45.00,
    89.90,
    99.78,
    TRUE,
    10.00,
    
    -- Estoque
    50.000,
    10.000,
    100.000,
    'PRATELEIRA-A1',
    
    -- Controle
    FALSE,
    FALSE,
    FALSE,
    NULL,
    
    -- Status
    TRUE,
    'Produto criado para teste de emissão de NF-e com Reforma Tributária 2026'
  ) RETURNING id INTO v_produto_id;
  
  RAISE NOTICE '✅ Produto PROD-001 criado com ID: %', v_produto_id;
  RAISE NOTICE '📦 Nome: Mouse Óptico USB Preto';
  RAISE NOTICE '💰 Preço: R$ 89,90 | Estoque: 50 UN';
END $$;

-- =====================================================
-- 4. CRIAR REGRA DE TRIBUTAÇÃO PARA O PRODUTO
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
  
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma empresa encontrada no sistema. Cadastre uma empresa primeiro.';
  END IF;
  
  -- Deletar regra antiga se existir
  DELETE FROM regras_tributacao 
  WHERE ncm = '85176255' AND empresa_id = v_empresa_id;
  
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
  RAISE NOTICE '📋 NCM: 85176255 | IBS: 27%% | CBS: 12%%';
END $$;

-- =====================================================
-- 5. CRIAR CLIENTE DE TESTE
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
  
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma empresa encontrada no sistema. Cadastre uma empresa primeiro.';
  END IF;
  
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
  RAISE NOTICE '👤 Razão Social: CLIENTE TESTE LTDA';
  RAISE NOTICE '📄 CNPJ: 98.765.432/0001-00';
END $$;

-- =====================================================
-- 6. VERIFICAR DADOS CRIADOS
-- =====================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '=========================================';
  RAISE NOTICE '✅ SCRIPT EXECUTADO COM SUCESSO!';
  RAISE NOTICE '=========================================';

  -- Verificar produto
  SELECT COUNT(*) INTO v_count FROM produtos WHERE codigo_interno = 'PROD-001';
  IF v_count > 0 THEN
    RAISE NOTICE '📦 Produto PROD-001: CRIADO';
  ELSE
    RAISE WARNING '⚠️ Produto PROD-001: NÃO ENCONTRADO';
  END IF;

  -- Verificar NCM
  SELECT COUNT(*) INTO v_count FROM ncm WHERE codigo = '85176255';
  IF v_count > 0 THEN
    RAISE NOTICE '🏷️ NCM 85176255: CRIADO';
  ELSE
    RAISE WARNING '⚠️ NCM 85176255: NÃO ENCONTRADO';
  END IF;

  -- Verificar CFOP
  SELECT COUNT(*) INTO v_count FROM cfop WHERE codigo = '5102';
  IF v_count > 0 THEN
    RAISE NOTICE '📑 CFOP 5102: CRIADO';
  ELSE
    RAISE WARNING '⚠️ CFOP 5102: NÃO ENCONTRADO';
  END IF;

  -- Verificar Regra
  SELECT COUNT(*) INTO v_count FROM regras_tributacao WHERE ncm = '85176255';
  IF v_count > 0 THEN
    RAISE NOTICE '⚖️ Regra Tributação NCM 85176255: CRIADA';
  ELSE
    RAISE WARNING '⚠️ Regra Tributação: NÃO ENCONTRADA';
  END IF;

  -- Verificar Cliente
  SELECT COUNT(*) INTO v_count FROM clientes WHERE cpf_cnpj = '98765432000100';
  IF v_count > 0 THEN
    RAISE NOTICE '👤 Cliente 98765432000100: CRIADO';
  ELSE
    RAISE WARNING '⚠️ Cliente: NÃO ENCONTRADO';
  END IF;

  RAISE NOTICE '=========================================';
END $$;

-- =====================================================
-- 7. INSTRUÇÕES FINAIS
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
