// =====================================================
// TYPES - CADASTROS FISCAIS AUXILIARES
// Tipos para NCM, CFOP, Operações Fiscais e Unidades
// Data: 02/12/2025
// =====================================================

// =====================================================
// NCM - NOMENCLATURA COMUM DO MERCOSUL
// =====================================================

export interface NCM {
  id: number
  codigo: string // Formato: 0000.00.00
  descricao: string
  unidade_tributaria?: string
  aliquota_nacional_federal?: number
  cest?: string
  ativo: boolean
  created_at?: string
  updated_at?: string
}

export interface NCMFormData {
  codigo: string
  descricao: string
  unidade_tributaria?: string
  aliquota_nacional_federal?: number
  cest?: string
  ativo?: boolean
}

export interface NCMFiltros {
  busca?: string
  codigo?: string
  ativo?: boolean
}

// =====================================================
// CFOP - CÓDIGO FISCAL DE OPERAÇÕES E PRESTAÇÕES
// =====================================================

export interface CFOP {
  id: number
  codigo: string // Formato: 0.000
  descricao: string
  aplicacao: string
  tipo_operacao: TipoOperacaoCFOP
  movimenta_estoque: boolean
  movimenta_financeiro: boolean
  calcula_icms: boolean
  calcula_ipi: boolean
  calcula_pis: boolean
  calcula_cofins: boolean
  observacoes?: string
  ativo: boolean
  created_at?: string
  updated_at?: string
}

export const TIPO_OPERACAO_CFOP = {
  ENTRADA: 'ENTRADA',
  SAIDA: 'SAIDA',
  ENTRADA_IMPORTACAO: 'ENTRADA_IMPORTACAO'
} as const

export type TipoOperacaoCFOP = typeof TIPO_OPERACAO_CFOP[keyof typeof TIPO_OPERACAO_CFOP]

export interface CFOPFormData {
  codigo: string
  descricao: string
  aplicacao: string
  tipo_operacao: TipoOperacaoCFOP
  movimenta_estoque?: boolean
  movimenta_financeiro?: boolean
  calcula_icms?: boolean
  calcula_ipi?: boolean
  calcula_pis?: boolean
  calcula_cofins?: boolean
  observacoes?: string
  ativo?: boolean
}

export interface CFOPFiltros {
  busca?: string
  codigo?: string
  tipo_operacao?: TipoOperacaoCFOP
  ativo?: boolean
}

// Labels para CFOP
export const TIPO_OPERACAO_CFOP_LABELS = [
  { value: 'ENTRADA', label: 'Entrada' },
  { value: 'SAIDA', label: 'Saída' },
  { value: 'ENTRADA_IMPORTACAO', label: 'Entrada (Importação)' }
] as const

// =====================================================
// OPERAÇÕES FISCAIS
// =====================================================

export interface OperacaoFiscal {
  id: number
  codigo: string
  nome: string
  descricao?: string
  cfop_dentro_estado?: string
  cfop_fora_estado?: string
  cfop_exterior?: string
  tipo_operacao: TipoOperacaoFiscal
  finalidade: FinalidadeOperacao
  natureza_operacao: string
  
  // Tributação
  calcular_icms: boolean
  calcular_ipi: boolean
  calcular_pis: boolean
  calcular_cofins: boolean
  calcular_st: boolean
  
  // Controles
  movimenta_estoque: boolean
  movimenta_financeiro: boolean
  gera_duplicata: boolean
  gera_comissao: boolean
  
  // Observações
  mensagem_nota?: string
  observacoes?: string
  
  ativo: boolean
  created_at?: string
  updated_at?: string
}

export const TIPO_OPERACAO_FISCAL = {
  VENDA: 'VENDA',
  COMPRA: 'COMPRA',
  DEVOLUCAO_VENDA: 'DEVOLUCAO_VENDA',
  DEVOLUCAO_COMPRA: 'DEVOLUCAO_COMPRA',
  TRANSFERENCIA: 'TRANSFERENCIA',
  REMESSA: 'REMESSA',
  RETORNO: 'RETORNO',
  OUTRAS: 'OUTRAS'
} as const

export type TipoOperacaoFiscal = typeof TIPO_OPERACAO_FISCAL[keyof typeof TIPO_OPERACAO_FISCAL]

export const FINALIDADE_OPERACAO = {
  NORMAL: 'NORMAL',
  COMPLEMENTAR: 'COMPLEMENTAR',
  AJUSTE: 'AJUSTE',
  DEVOLUCAO: 'DEVOLUCAO'
} as const

export type FinalidadeOperacao = typeof FINALIDADE_OPERACAO[keyof typeof FINALIDADE_OPERACAO]

export interface OperacaoFiscalFormData {
  codigo: string
  nome: string
  descricao?: string
  cfop_dentro_estado?: string
  cfop_fora_estado?: string
  cfop_exterior?: string
  tipo_operacao: TipoOperacaoFiscal
  finalidade: FinalidadeOperacao
  natureza_operacao: string
  calcular_icms?: boolean
  calcular_ipi?: boolean
  calcular_pis?: boolean
  calcular_cofins?: boolean
  calcular_st?: boolean
  movimenta_estoque?: boolean
  movimenta_financeiro?: boolean
  gera_duplicata?: boolean
  gera_comissao?: boolean
  mensagem_nota?: string
  observacoes?: string
  ativo?: boolean
}

export interface OperacaoFiscalFiltros {
  busca?: string
  codigo?: string
  tipo_operacao?: TipoOperacaoFiscal
  ativo?: boolean
}

// Labels
export const TIPO_OPERACAO_FISCAL_LABELS = [
  { value: 'VENDA', label: 'Venda' },
  { value: 'COMPRA', label: 'Compra' },
  { value: 'DEVOLUCAO_VENDA', label: 'Devolução de Venda' },
  { value: 'DEVOLUCAO_COMPRA', label: 'Devolução de Compra' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
  { value: 'REMESSA', label: 'Remessa' },
  { value: 'RETORNO', label: 'Retorno' },
  { value: 'OUTRAS', label: 'Outras' }
] as const

export const FINALIDADE_OPERACAO_LABELS = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'COMPLEMENTAR', label: 'Complementar' },
  { value: 'AJUSTE', label: 'Ajuste' },
  { value: 'DEVOLUCAO', label: 'Devolução' }
] as const

// =====================================================
// UNIDADES DE MEDIDA
// =====================================================

export interface UnidadeMedida {
  id: number
  codigo: string
  descricao: string
  sigla: string
  permite_decimal: boolean
  casas_decimais?: number
  observacoes?: string
  ativo: boolean
  created_at?: string
  updated_at?: string
}

export interface UnidadeMedidaFormData {
  codigo: string
  descricao: string
  sigla: string
  permite_decimal?: boolean
  casas_decimais?: number
  observacoes?: string
  ativo?: boolean
}

export interface UnidadeMedidaFiltros {
  busca?: string
  codigo?: string
  ativo?: boolean
}

// =====================================================
// RESULTADO GENÉRICO
// =====================================================

export interface ResultadoCadastro {
  sucesso: boolean
  mensagem: string
  id?: number
}
