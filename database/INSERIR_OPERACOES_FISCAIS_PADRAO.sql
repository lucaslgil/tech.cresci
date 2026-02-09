-- =====================================================
-- OPERAÇÕES FISCAIS PADRÃO
-- Data: 26/01/2026
-- =====================================================

-- Este script cria operações fiscais padrão para emissão de NF-e
-- Cada operação define: Tipo, Natureza, CFOPs e controles fiscais

-- Inserir operações fiscais mais comuns
INSERT INTO operacoes_fiscais (
  codigo, 
  nome, 
  descricao,
  tipo_operacao,
  finalidade,
  natureza_operacao,
  cfop_dentro_estado,
  cfop_fora_estado,
  cfop_exterior,
  regime_tributario,
  calcular_icms,
  calcular_ipi,
  calcular_pis,
  calcular_cofins,
  calcular_st,
  ativo
) VALUES

-- ===== VENDAS =====
(
  'VENDA001',
  'Venda de Mercadoria',
  'Venda padrão de mercadoria para consumidor final',
  'VENDA',
  'SAIDA',
  'Venda de mercadoria',
  '5102', -- Dentro do estado
  '6102', -- Fora do estado
  '7102', -- Exterior
  'TODOS',
  true, true, true, true, false, true
),

(
  'VENDA002',
  'Venda de Produção Própria',
  'Venda de produto fabricado/industrializado no estabelecimento',
  'VENDA',
  'SAIDA',
  'Venda de produção do estabelecimento',
  '5101',
  '6101',
  '7101',
  'TODOS',
  true, true, true, true, false, true
),

(
  'VENDA003',
  'Venda com Substituição Tributária',
  'Venda de mercadoria sujeita ao regime de substituição tributária',
  'VENDA',
  'SAIDA',
  'Venda com substituição tributária',
  '5405',
  '6404',
  NULL,
  'TODOS',
  true, false, true, true, true, true
),

(
  'VENDA004',
  'Venda para Consumidor Final',
  'Venda direta ao consumidor final (pessoa física)',
  'VENDA',
  'SAIDA',
  'Venda a consumidor final',
  '5102',
  '6108',
  NULL,
  'TODOS',
  true, false, true, true, false, true
),

-- ===== DEVOLUÇÕES =====
(
  'DEVOL001',
  'Devolução de Compra',
  'Devolução de mercadoria adquirida para revenda',
  'DEVOLUCAO_COMPRA',
  'SAIDA',
  'Devolução de compra de mercadoria',
  '5202',
  '6202',
  '7202',
  'TODOS',
  true, false, true, true, false, true
),

(
  'DEVOL002',
  'Devolução de Venda',
  'Devolução de mercadoria vendida (entrada)',
  'DEVOLUCAO_VENDA',
  'ENTRADA',
  'Devolução de venda de mercadoria',
  '1202',
  '2202',
  '3202',
  'TODOS',
  true, false, true, true, false, true
),

-- ===== TRANSFERÊNCIAS =====
(
  'TRANSF001',
  'Transferência entre Filiais',
  'Transferência de mercadoria entre estabelecimentos da mesma empresa',
  'TRANSFERENCIA',
  'SAIDA',
  'Transferência de mercadoria',
  '5152',
  '6152',
  NULL,
  'TODOS',
  true, false, false, false, false, true
),

-- ===== REMESSAS =====
(
  'REMESSA001',
  'Remessa para Conserto',
  'Remessa de mercadoria para conserto ou reparo',
  'REMESSA',
  'SAIDA',
  'Remessa para conserto',
  '5915',
  '6915',
  NULL,
  'TODOS',
  false, false, false, false, false, true
),

(
  'REMESSA002',
  'Remessa em Comodato',
  'Remessa de mercadoria em comodato (empréstimo)',
  'REMESSA',
  'SAIDA',
  'Remessa em comodato',
  '5908',
  '6908',
  NULL,
  'TODOS',
  false, false, false, false, false, true
),

-- ===== RETORNOS =====
(
  'RETORNO001',
  'Retorno de Conserto',
  'Retorno de mercadoria remetida para conserto',
  'RETORNO',
  'ENTRADA',
  'Retorno de conserto',
  '1916',
  '2916',
  NULL,
  'TODOS',
  false, false, false, false, false, true
),

(
  'RETORNO002',
  'Retorno de Comodato',
  'Retorno de mercadoria remetida em comodato',
  'RETORNO',
  'ENTRADA',
  'Retorno de comodato',
  '1909',
  '2909',
  NULL,
  'TODOS',
  false, false, false, false, false, true
),

-- ===== BONIFICAÇÕES =====
(
  'BONIF001',
  'Bonificação/Doação/Brinde',
  'Saída de mercadoria a título de bonificação, doação ou brinde',
  'BONIFICACAO',
  'SAIDA',
  'Bonificação/Doação',
  '5910',
  '6910',
  NULL,
  'TODOS',
  true, false, false, false, false, true
),

-- ===== COMPRAS =====
(
  'COMPRA001',
  'Compra para Comercialização',
  'Compra de mercadoria para revenda',
  'COMPRA',
  'ENTRADA',
  'Compra para comercialização',
  '1102',
  '2102',
  '3102',
  'TODOS',
  true, true, true, true, false, true
),

(
  'COMPRA002',
  'Compra para Industrialização',
  'Compra de matéria-prima ou insumo para produção',
  'COMPRA',
  'ENTRADA',
  'Compra para industrialização',
  '1101',
  '2101',
  '3101',
  'TODOS',
  true, true, true, true, false, true
),

-- ===== OUTRAS OPERAÇÕES =====
(
  'OUTRAS001',
  'Simples Remessa',
  'Remessa de mercadoria sem transferência de propriedade',
  'OUTRAS',
  'SAIDA',
  'Simples remessa',
  '5949',
  '6949',
  NULL,
  'TODOS',
  false, false, false, false, false, true
),

(
  'OUTRAS002',
  'Ajuste de Estoque',
  'Lançamento para ajuste/acerto de estoque',
  'OUTRAS',
  'SAIDA',
  'Ajuste de estoque',
  '5927',
  '6927',
  NULL,
  'TODOS',
  false, false, false, false, false, true
)

ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  tipo_operacao = EXCLUDED.tipo_operacao,
  finalidade = EXCLUDED.finalidade,
  natureza_operacao = EXCLUDED.natureza_operacao,
  cfop_dentro_estado = EXCLUDED.cfop_dentro_estado,
  cfop_fora_estado = EXCLUDED.cfop_fora_estado,
  cfop_exterior = EXCLUDED.cfop_exterior,
  updated_at = NOW();

-- Verificar operações criadas
SELECT 
  codigo,
  nome,
  tipo_operacao,
  CASE 
    WHEN finalidade = 'ENTRADA' THEN '⬇️ Entrada'
    WHEN finalidade = 'SAIDA' THEN '⬆️ Saída'
    ELSE finalidade 
  END as direcao,
  cfop_dentro_estado,
  cfop_fora_estado,
  natureza_operacao
FROM operacoes_fiscais
ORDER BY tipo_operacao, codigo;

-- ✅ Operações fiscais padrão configuradas!
-- Total: 18 operações cobrindo os principais cenários
