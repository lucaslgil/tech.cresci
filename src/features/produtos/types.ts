// =====================================================
// TIPOS E INTERFACES - MÓDULO DE PRODUTOS
// Compatível com NF-e, NFC-e, CF-e-SAT, SPED
// Data: 01/12/2025
// =====================================================

/**
 * Origem da Mercadoria (NF-e)
 * 0 - Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8
 * 1 - Estrangeira - Importação direta, exceto a indicada no código 6
 * 2 - Estrangeira - Adquirida no mercado interno, exceto a indicada no código 7
 * 3 - Nacional, mercadoria ou bem com Conteúdo de Importação superior a 40% e inferior ou igual a 70%
 * 4 - Nacional, cuja produção tenha sido feita em conformidade com os processos produtivos básicos
 * 5 - Nacional, mercadoria ou bem com Conteúdo de Importação inferior ou igual a 40%
 * 6 - Estrangeira - Importação direta, sem similar nacional, constante em lista da CAMEX
 * 7 - Estrangeira - Adquirida no mercado interno, sem similar nacional, constante em lista da CAMEX
 * 8 - Nacional, mercadoria ou bem com Conteúdo de Importação superior a 70%
 */
export type OrigemMercadoria = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

/**
 * Regime Tributário da Empresa
 */
export type RegimeTributario = 'SIMPLES' | 'PRESUMIDO' | 'REAL'

/**
 * Unidades de Medida mais comuns
 */
export type UnidadeMedida = 
  | 'UN'  // Unidade
  | 'CX'  // Caixa
  | 'PC'  // Peça
  | 'KG'  // Quilograma
  | 'G'   // Grama
  | 'L'   // Litro
  | 'ML'  // Mililitro
  | 'M'   // Metro
  | 'M2'  // Metro quadrado
  | 'M3'  // Metro cúbico
  | 'PAR' // Par
  | 'DZ'  // Dúzia
  | 'TON' // Tonelada
  | string // Permite outras unidades

/**
 * Tipo de Movimentação de Estoque
 */
export type TipoMovimentacao = 
  | 'ENTRADA' 
  | 'SAIDA' 
  | 'AJUSTE' 
  | 'INVENTARIO' 
  | 'DEVOLUCAO' 
  | 'TRANSFERENCIA'

/**
 * Status do Estoque
 */
export type StatusEstoque = 
  | 'SEM_ESTOQUE' 
  | 'ESTOQUE_BAIXO' 
  | 'ESTOQUE_NORMAL' 
  | 'ESTOQUE_ALTO'

/**
 * Interface principal do Produto
 */
export interface Produto {
  // Identificação
  id: string
  codigo_interno: string
  codigo_barras?: string
  nome: string
  descricao?: string
  
  // Classificação
  categoria?: string
  unidade_medida: UnidadeMedida
  
  // Dados Fiscais
  ncm: string
  cest?: string
  cfop_entrada?: string
  cfop_saida?: string
  origem_mercadoria?: OrigemMercadoria
  
  // ICMS
  cst_icms?: string
  csosn_icms?: string
  aliquota_icms?: number
  reducao_bc_icms?: number
  
  // Substituição Tributária
  cst_icms_st?: string
  mva_st?: number
  aliquota_icms_st?: number
  reducao_bc_icms_st?: number
  
  // PIS
  cst_pis?: string
  aliquota_pis?: number
  
  // COFINS
  cst_cofins?: string
  aliquota_cofins?: number
  
  // IPI
  cst_ipi?: string
  aliquota_ipi?: number
  enquadramento_ipi?: string
  
  // Regime Tributário
  regime_tributario?: RegimeTributario
  
  // Reforma Tributária 2026 - IBS e CBS
  aliquota_ibs?: number
  aliquota_cbs?: number
  regime_transicao?: 'MISTO' | 'ANTIGO' | 'NOVO'
  excecao_ibs?: boolean
  excecao_cbs?: boolean
  aliquota_ibs_reduzida?: number
  aliquota_cbs_reduzida?: number
  cst_ibs?: string
  cst_cbs?: string
  
  // Dados Comerciais
  preco_custo?: number
  preco_venda: number
  margem_lucro?: number
  permite_desconto?: boolean
  desconto_maximo?: number
  
  // Controle de Estoque
  estoque_atual: number
  estoque_minimo?: number
  estoque_maximo?: number
  localizacao?: string
  
  // Controle de Lote/Série/Validade
  controla_lote?: boolean
  controla_serie?: boolean
  controla_validade?: boolean
  dias_validade?: number
  
  // Status e Controle
  ativo: boolean
  data_cadastro?: string
  data_atualizacao?: string
  usuario_cadastro?: string
  usuario_atualizacao?: string
  
  // Observações
  observacoes?: string
  
  // Metadados
  created_at?: string
  updated_at?: string
}

/**
 * Produto com informação de status de estoque (da view)
 */
export interface ProdutoComEstoque extends Produto {
  status_estoque: StatusEstoque
}

/**
 * Interface para formulário de cadastro/edição
 */
export interface ProdutoFormData {
  // Dados Gerais
  codigo_interno: string
  codigo_barras?: string
  nome: string
  descricao?: string
  categoria?: string
  unidade_medida: UnidadeMedida
  
  // Dados Fiscais
  ncm: string
  cest?: string
  cfop_entrada?: string
  cfop_saida?: string
  origem_mercadoria?: OrigemMercadoria
  
  // ICMS
  cst_icms?: string
  csosn_icms?: string
  aliquota_icms?: number
  reducao_bc_icms?: number
  
  // Substituição Tributária
  cst_icms_st?: string
  mva_st?: number
  aliquota_icms_st?: number
  reducao_bc_icms_st?: number
  
  // PIS/COFINS
  cst_pis?: string
  aliquota_pis?: number
  cst_cofins?: string
  aliquota_cofins?: number
  
  // IPI
  cst_ipi?: string
  aliquota_ipi?: number
  enquadramento_ipi?: string
  
  // Regime
  regime_tributario?: RegimeTributario
  
  // Reforma Tributária 2026 - IBS e CBS
  aliquota_ibs?: number
  aliquota_cbs?: number
  regime_transicao?: 'MISTO' | 'ANTIGO' | 'NOVO'
  excecao_ibs?: boolean
  excecao_cbs?: boolean
  aliquota_ibs_reduzida?: number
  aliquota_cbs_reduzida?: number
  cst_ibs?: string
  cst_cbs?: string
  
  // Comercial
  preco_custo?: number
  preco_venda: number
  margem_lucro?: number
  permite_desconto?: boolean
  desconto_maximo?: number
  
  // Estoque
  estoque_atual: number
  estoque_minimo?: number
  estoque_maximo?: number
  localizacao?: string
  
  // Controles
  controla_lote?: boolean
  controla_serie?: boolean
  controla_validade?: boolean
  dias_validade?: number
  
  // Status
  ativo: boolean
  observacoes?: string
}

/**
 * Interface para Movimentação de Estoque
 */
export interface MovimentacaoEstoque {
  id: string
  produto_id: string
  tipo_movimentacao: TipoMovimentacao
  quantidade: number
  estoque_anterior: number
  estoque_atual: number
  
  // Referência ao documento fiscal
  documento_fiscal_id?: string
  numero_documento?: string
  serie_documento?: string
  
  // Dados adicionais
  lote?: string
  serie?: string
  data_validade?: string
  
  // Auditoria
  observacoes?: string
  usuario_id?: string
  data_movimentacao: string
  created_at: string
}

/**
 * Interface para Histórico de Preços
 */
export interface HistoricoPrecos {
  id: string
  produto_id: string
  preco_custo_anterior?: number
  preco_custo_novo?: number
  preco_venda_anterior?: number
  preco_venda_novo?: number
  motivo?: string
  usuario_id?: string
  data_alteracao: string
}

/**
 * Filtros para busca de produtos
 */
export interface ProdutoFiltros {
  nome?: string
  categoria?: string
  ncm?: string
  cfop?: string
  ativo?: boolean
  estoque_baixo?: boolean
}

/**
 * Configuração de ordenação
 */
export interface ProdutoOrdenacao {
  campo: keyof Produto
  direcao: 'asc' | 'desc'
}

/**
 * CSTs de ICMS mais comuns
 */
export const CST_ICMS = [
  { value: '00', label: '00 - Tributada integralmente' },
  { value: '10', label: '10 - Tributada e com cobrança do ICMS por substituição tributária' },
  { value: '20', label: '20 - Com redução de base de cálculo' },
  { value: '30', label: '30 - Isenta ou não tributada e com cobrança do ICMS por substituição tributária' },
  { value: '40', label: '40 - Isenta' },
  { value: '41', label: '41 - Não tributada' },
  { value: '50', label: '50 - Suspensão' },
  { value: '51', label: '51 - Diferimento' },
  { value: '60', label: '60 - ICMS cobrado anteriormente por substituição tributária' },
  { value: '70', label: '70 - Com redução de base de cálculo e cobrança do ICMS por substituição tributária' },
  { value: '90', label: '90 - Outras' }
]

/**
 * CSOSNs do Simples Nacional
 */
export const CSOSN_ICMS = [
  { value: '101', label: '101 - Tributada pelo Simples Nacional com permissão de crédito' },
  { value: '102', label: '102 - Tributada pelo Simples Nacional sem permissão de crédito' },
  { value: '103', label: '103 - Isenção do ICMS no Simples Nacional para faixa de receita bruta' },
  { value: '201', label: '201 - Tributada pelo Simples Nacional com permissão de crédito e com cobrança do ICMS por ST' },
  { value: '202', label: '202 - Tributada pelo Simples Nacional sem permissão de crédito e com cobrança do ICMS por ST' },
  { value: '203', label: '203 - Isenção do ICMS no Simples Nacional para faixa de receita bruta e com cobrança do ICMS por ST' },
  { value: '300', label: '300 - Imune' },
  { value: '400', label: '400 - Não tributada pelo Simples Nacional' },
  { value: '500', label: '500 - ICMS cobrado anteriormente por ST ou por antecipação' },
  { value: '900', label: '900 - Outros' }
]

/**
 * CSTs de PIS/COFINS
 */
export const CST_PIS_COFINS = [
  { value: '01', label: '01 - Operação Tributável com Alíquota Básica' },
  { value: '02', label: '02 - Operação Tributável com Alíquota Diferenciada' },
  { value: '03', label: '03 - Operação Tributável com Alíquota por Unidade de Medida de Produto' },
  { value: '04', label: '04 - Operação Tributável Monofásica - Revenda a Alíquota Zero' },
  { value: '05', label: '05 - Operação Tributável por Substituição Tributária' },
  { value: '06', label: '06 - Operação Tributável a Alíquota Zero' },
  { value: '07', label: '07 - Operação Isenta da Contribuição' },
  { value: '08', label: '08 - Operação sem Incidência da Contribuição' },
  { value: '09', label: '09 - Operação com Suspensão da Contribuição' },
  { value: '49', label: '49 - Outras Operações de Saída' },
  { value: '50', label: '50 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita Tributada no Mercado Interno' },
  { value: '99', label: '99 - Outras Operações' }
]

/**
 * CSTs de IPI
 */
export const CST_IPI = [
  { value: '00', label: '00 - Entrada com Recuperação de Crédito' },
  { value: '01', label: '01 - Entrada Tributada com Alíquota Zero' },
  { value: '02', label: '02 - Entrada Isenta' },
  { value: '03', label: '03 - Entrada Não-Tributada' },
  { value: '04', label: '04 - Entrada Imune' },
  { value: '05', label: '05 - Entrada com Suspensão' },
  { value: '49', label: '49 - Outras Entradas' },
  { value: '50', label: '50 - Saída Tributada' },
  { value: '51', label: '51 - Saída Tributada com Alíquota Zero' },
  { value: '52', label: '52 - Saída Isenta' },
  { value: '53', label: '53 - Saída Não-Tributada' },
  { value: '54', label: '54 - Saída Imune' },
  { value: '55', label: '55 - Saída com Suspensão' },
  { value: '99', label: '99 - Outras Saídas' }
]

/**
 * Categorias padrão de produtos
 */
export const CATEGORIAS_PADRAO = [
  'Eletrônicos',
  'Informática',
  'Móveis',
  'Material de Escritório',
  'Ferramentas',
  'EPIs',
  'Telefonia',
  'Acessórios',
  'Consumíveis',
  'Outros'
]

/**
 * Unidades de medida mais comuns
 */
export const UNIDADES_MEDIDA = [
  { value: 'UN', label: 'Unidade' },
  { value: 'CX', label: 'Caixa' },
  { value: 'PC', label: 'Peça' },
  { value: 'KG', label: 'Quilograma' },
  { value: 'G', label: 'Grama' },
  { value: 'L', label: 'Litro' },
  { value: 'ML', label: 'Mililitro' },
  { value: 'M', label: 'Metro' },
  { value: 'M2', label: 'Metro Quadrado' },
  { value: 'M3', label: 'Metro Cúbico' },
  { value: 'PAR', label: 'Par' },
  { value: 'DZ', label: 'Dúzia' },
  { value: 'TON', label: 'Tonelada' }
]

/**
 * Origens da mercadoria
 */
export const ORIGENS_MERCADORIA = [
  { value: 0, label: '0 - Nacional' },
  { value: 1, label: '1 - Estrangeira - Importação direta' },
  { value: 2, label: '2 - Estrangeira - Adquirida no mercado interno' },
  { value: 3, label: '3 - Nacional com Conteúdo de Importação > 40% e ≤ 70%' },
  { value: 4, label: '4 - Nacional - Processos produtivos básicos' },
  { value: 5, label: '5 - Nacional com Conteúdo de Importação ≤ 40%' },
  { value: 6, label: '6 - Estrangeira - Importação direta sem similar' },
  { value: 7, label: '7 - Estrangeira - Mercado interno sem similar' },
  { value: 8, label: '8 - Nacional com Conteúdo de Importação > 70%' }
]
