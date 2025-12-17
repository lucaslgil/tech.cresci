// =====================================================
// TYPES - CONTAS A RECEBER
// Interfaces e tipos para módulo financeiro
// Data: 08/12/2025
// =====================================================

export const STATUS_CONTA = {
  ABERTO: 'ABERTO',
  QUITADA: 'QUITADA',
  PAGO: 'PAGO',
  PARCIAL: 'PARCIAL',
  VENCIDO: 'VENCIDO',
  CANCELADO: 'CANCELADO'
} as const

export type StatusConta = typeof STATUS_CONTA[keyof typeof STATUS_CONTA]

export const STATUS_LABELS = [
  { value: 'ABERTO', label: 'Aberto', color: 'bg-blue-100 text-blue-800' },
  { value: 'QUITADA', label: 'Quitada', color: 'bg-green-100 text-green-800' },
  { value: 'PARCIAL', label: 'Parcial', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'VENCIDO', label: 'Em atraso', color: 'bg-red-100 text-red-800' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'bg-gray-100 text-gray-800' }
]

export interface ContaReceber {
  id: number
  venda_id?: number
  numero_venda?: number
  cliente_id: number
  cliente_nome: string
  cliente_cpf_cnpj?: string
  descricao: string
  numero_documento?: string
  numero_parcela: number
  total_parcelas: number
  valor_original: number
  valor_juros: number
  valor_desconto: number
  valor_total: number
  valor_pago: number
  valor_saldo: number
  data_emissao: string
  data_vencimento: string
  data_pagamento?: string
  status: StatusConta
  forma_pagamento?: string
  observacoes?: string
  created_at?: string
  updated_at?: string
}

export interface PagamentoReceber {
  id: number
  conta_receber_id: number
  data_pagamento: string
  valor_pago: number
  forma_pagamento: string
  valor_juros: number
  valor_desconto: number
  observacoes?: string
  created_at?: string
}

export interface ContaReceberFormData {
  venda_id?: number
  numero_venda?: number
  cliente_id: number
  cliente_nome: string
  cliente_cpf_cnpj?: string
  descricao: string
  numero_documento?: string
  numero_parcela?: number
  total_parcelas?: number
  valor_original: number
  valor_juros?: number
  valor_desconto?: number
  data_emissao: string
  data_vencimento: string
  forma_pagamento?: string
  observacoes?: string
  status?: StatusConta
}

export interface PagamentoFormData {
  conta_receber_id: number
  data_pagamento: string
  valor_pago: number
  forma_pagamento: string
  valor_juros?: number
  valor_desconto?: number
  observacoes?: string
}

export interface FiltrosContasReceber {
  status?: StatusConta | 'TODOS'
  cliente_id?: number
  data_inicio?: string
  data_fim?: string
  vencimento_inicio?: string
  vencimento_fim?: string
  busca?: string
}

export interface ResumoContasReceber {
  total_contas: number
  total_aberto: number
  total_pago: number
  total_vencido: number
  valor_total: number
  valor_recebido: number
  valor_pendente: number
}

// Helper para calcular valor total com juros e descontos
export const calcularValorTotal = (
  valorOriginal: number,
  juros: number = 0,
  desconto: number = 0
): number => {
  return valorOriginal + juros - desconto
}

// Helper para obter cor do status
export const getStatusColor = (status: StatusConta): string => {
  const statusObj = STATUS_LABELS.find(s => s.value === status)
  return statusObj?.color || 'bg-gray-100 text-gray-800'
}

// Helper para formatar valor em moeda
export const formatarMoeda = (valor: number): string => {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Helper para calcular dias em atraso
export const calcularDiasAtraso = (dataVencimento: string): number => {
  const hoje = new Date()
  const vencimento = new Date(dataVencimento)
  const diff = hoje.getTime() - vencimento.getTime()
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
  return dias > 0 ? dias : 0
}

// Helper para obter o status efetivo da conta (considerando atraso)
export const obterStatusEfetivo = (conta: { status: StatusConta; data_vencimento: string; valor_saldo: number }): StatusConta => {
  // Se já está quitado, pago ou cancelado, mantém o status
  if (conta.status === 'QUITADA' || conta.status === 'PAGO' || conta.status === 'CANCELADO') {
    return conta.status
  }
  
  // Se tem saldo (não foi totalmente pago) e está vencido
  const diasAtraso = calcularDiasAtraso(conta.data_vencimento)
  if (diasAtraso > 0 && conta.valor_saldo > 0) {
    return 'VENCIDO' // Retorna como VENCIDO (exibir como "Em atraso")
  }
  
  // Caso contrário, retorna o status original
  return conta.status
}
