// =====================================================
// TYPES - MÓDULO DE VENDAS
// Interfaces e tipos para gestão de vendas
// Data: 02/12/2025
// =====================================================

/**
 * ENUMS E CONSTANTES
 */

export const STATUS_VENDA = {
  ORCAMENTO: 'ORCAMENTO',
  PEDIDO_ABERTO: 'PEDIDO_ABERTO',
  PEDIDO_FECHADO: 'PEDIDO_FECHADO',
  CANCELADO: 'CANCELADO'
} as const

export type StatusVenda = typeof STATUS_VENDA[keyof typeof STATUS_VENDA]

export const TIPO_VENDA = {
  ORCAMENTO: 'ORCAMENTO',
  PEDIDO: 'PEDIDO'
} as const

export type TipoVenda = typeof TIPO_VENDA[keyof typeof TIPO_VENDA]

export const FORMA_PAGAMENTO = {
  DINHEIRO: 'DINHEIRO',
  PIX: 'PIX',
  CARTAO_CREDITO: 'CARTAO_CREDITO',
  CARTAO_DEBITO: 'CARTAO_DEBITO',
  BOLETO: 'BOLETO',
  TRANSFERENCIA: 'TRANSFERENCIA',
  CHEQUE: 'CHEQUE',
  CREDIARIO: 'CREDIARIO'
} as const

export type FormaPagamento = typeof FORMA_PAGAMENTO[keyof typeof FORMA_PAGAMENTO]

export const CONDICAO_PAGAMENTO = {
  A_VISTA: 'A_VISTA',
  PARCELADO: 'PARCELADO',
  A_PRAZO: 'A_PRAZO'
} as const

export type CondicaoPagamento = typeof CONDICAO_PAGAMENTO[keyof typeof CONDICAO_PAGAMENTO]

/**
 * CONSTANTES COM LABELS
 */

export const STATUS_VENDA_LABELS = [
  { value: 'ORCAMENTO', label: 'Orçamento', color: 'bg-slate-100 text-slate-700' },
  { value: 'PEDIDO_ABERTO', label: 'Pedido em Aberto', color: 'bg-blue-100 text-blue-700' },
  { value: 'PEDIDO_FECHADO', label: 'Pedido Fechado', color: 'bg-green-100 text-green-700' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'bg-red-100 text-red-700' }
]

export const TIPO_VENDA_LABELS = [
  { value: 'ORCAMENTO', label: 'Orçamento' },
  { value: 'PEDIDO', label: 'Pedido de Venda' },
  { value: 'VENDA_DIRETA', label: 'Venda Direta' }
]

export const FORMA_PAGAMENTO_LABELS = [
  { value: 'DINHEIRO', label: 'Dinheiro', icon: '💵' },
  { value: 'PIX', label: 'PIX', icon: '📱' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito', icon: '💳' },
  { value: 'CARTAO_DEBITO', label: 'Cartão de Débito', icon: '💳' },
  { value: 'BOLETO', label: 'Boleto Bancário', icon: '🧾' },
  { value: 'TRANSFERENCIA', label: 'Transferência Bancária', icon: '🏦' },
  { value: 'CHEQUE', label: 'Cheque', icon: '📝' },
  { value: 'CREDIARIO', label: 'Crediário/Carnê', icon: '📋' }
]

export const CONDICAO_PAGAMENTO_LABELS = [
  { value: 'A_VISTA', label: 'À Vista' },
  { value: 'PARCELADO', label: 'Parcelado' },
  { value: 'A_PRAZO', label: 'A Prazo' }
]

/**
 * INTERFACES PRINCIPAIS
 */

export interface Venda {
  id: number | string
  numero: number
  tipo_venda: TipoVenda
  status: StatusVenda
  
  // Cliente
  cliente_id: number | string
  cliente_nome?: string
  cliente_cpf_cnpj?: string
  
  // Datas
  data_venda: string
  data_validade?: string
  data_aprovacao?: string
  data_faturamento?: string
  data_entrega?: string
  
  // Valores
  subtotal: number
  desconto: number
  acrescimo: number
  frete: number
  outras_despesas: number
  total: number
  
  // Pagamento
  forma_pagamento: FormaPagamento
  condicao_pagamento: CondicaoPagamento
  numero_parcelas?: number
  
  // Observações e informações adicionais
  observacoes?: string
  observacoes_internas?: string
  vendedor?: string
  comissao_percentual?: number
  comissao_valor?: number
  
  // Vínculo com NF-e (se foi faturado)
  nota_fiscal_id?: number | string
  nota_fiscal_chave?: string
  
  // Controle de bloqueio
  bloqueado?: boolean
  bloqueado_por?: string
  bloqueado_em?: string
  motivo_bloqueio?: string
  
  // Metadados
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

export interface VendaItem {
  id: number | string
  venda_id: number | string
  numero_item: number
  
  // Produto
  produto_id: number | string
  produto_codigo?: string
  produto_nome?: string
  
  // Quantidades e valores
  quantidade: number
  valor_unitario: number
  valor_total: number
  desconto_percentual?: number
  desconto_valor?: number
  acrescimo_percentual?: number
  acrescimo_valor?: number
  valor_final: number
  
  // Observações
  observacoes?: string
  
  // Metadados
  created_at?: string
  updated_at?: string
}

export interface VendaParcela {
  id: number | string
  venda_id: number | string
  numero_parcela: number
  
  // Valores
  valor: number
  valor_pago?: number
  
  // Datas
  data_vencimento: string
  data_pagamento?: string
  
  // Status
  status: 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO'
  
  // Forma de pagamento (pode ser diferente por parcela)
  forma_pagamento?: FormaPagamento
  
  // Observações
  observacoes?: string
  
  // Metadados
  created_at?: string
  updated_at?: string
}

/**
 * FORM DATA INTERFACES
 */

export interface VendaFormData {
  tipo_venda: TipoVenda
  cliente_id?: number | string
  data_venda: string
  data_validade?: string
  
  // Valores
  desconto?: number
  acrescimo?: number
  frete?: number
  outras_despesas?: number
  
  // Pagamento
  forma_pagamento: FormaPagamento
  condicao_pagamento: CondicaoPagamento
  numero_parcelas?: number
  
  // Observações
  observacoes?: string
  observacoes_internas?: string
  vendedor?: string
  comissao_percentual?: number
  
  // Itens
  itens: VendaItemFormData[]
  
  // Parcelas (geradas automaticamente ou customizadas)
  parcelas?: VendaParcelaFormData[]
}

export interface VendaItemFormData {
  produto_id?: number | string
  produto_codigo?: string
  produto_nome?: string
  quantidade: number
  valor_unitario: number
  desconto_percentual?: number
  desconto_valor?: number
  acrescimo_percentual?: number
  acrescimo_valor?: number
  observacoes?: string
}

export interface VendaParcelaFormData {
  numero_parcela: number
  valor: number
  data_vencimento: string
  forma_pagamento?: FormaPagamento
}

/**
 * FILTROS E CONSULTAS
 */

export interface VendaFiltros {
  numero?: number
  tipo_venda?: TipoVenda
  status?: StatusVenda
  cliente_id?: number | string
  data_inicio?: string
  data_fim?: string
  vendedor?: string
  forma_pagamento?: FormaPagamento
  valor_minimo?: number
  valor_maximo?: number
}

/**
 * ESTATÍSTICAS E RELATÓRIOS
 */

export interface VendaEstatisticas {
  total_vendas: number
  total_orcamentos: number
  total_pedidos: number
  total_vendas_diretas: number
  valor_total: number
  valor_medio: number
  ticket_medio: number
  total_itens_vendidos: number
}

export interface VendaPorStatus {
  status: StatusVenda
  quantidade: number
  valor_total: number
}

export interface VendaPorFormaPagamento {
  forma_pagamento: FormaPagamento
  quantidade: number
  valor_total: number
}

export interface VendaPorVendedor {
  vendedor: string
  quantidade: number
  valor_total: number
  comissao_total: number
}

/**
 * RESPOSTA DE AÇÕES
 */

export interface ResultadoVenda {
  sucesso: boolean
  mensagem: string
  venda?: Venda
  numero?: number
}

/**
 * HELPERS
 */

export const getStatusColor = (status: StatusVenda): string => {
  const statusObj = STATUS_VENDA_LABELS.find(s => s.value === status)
  return statusObj?.color || 'bg-slate-100 text-slate-700'
}

export const getStatusLabel = (status: StatusVenda): string => {
  const statusObj = STATUS_VENDA_LABELS.find(s => s.value === status)
  return statusObj?.label || status
}

export const getFormaPagamentoIcon = (forma: FormaPagamento): string => {
  const formaObj = FORMA_PAGAMENTO_LABELS.find(f => f.value === forma)
  return formaObj?.icon || '💰'
}

export const calcularTotalItem = (item: VendaItemFormData): number => {
  const valorBruto = item.quantidade * item.valor_unitario
  const desconto = item.desconto_valor || (valorBruto * (item.desconto_percentual || 0) / 100)
  const acrescimo = item.acrescimo_valor || (valorBruto * (item.acrescimo_percentual || 0) / 100)
  return valorBruto - desconto + acrescimo
}

export const calcularSubtotalVenda = (itens: VendaItemFormData[]): number => {
  return itens.reduce((sum, item) => sum + calcularTotalItem(item), 0)
}

export const calcularTotalVenda = (formData: VendaFormData): number => {
  const subtotal = calcularSubtotalVenda(formData.itens)
  const desconto = formData.desconto || 0
  const acrescimo = formData.acrescimo || 0
  const frete = formData.frete || 0
  const outras = formData.outras_despesas || 0
  
  return subtotal - desconto + acrescimo + frete + outras
}
