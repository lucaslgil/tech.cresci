// ─────────────────────────────────────────────────────────────────────────────
// TIPOS E CONSTANTES – MÓDULO DE GESTÃO DE COBRANÇAS
// ─────────────────────────────────────────────────────────────────────────────

// ── Status operacionais (camada operacional, separada do status financeiro) ──

export const STATUS_OPERACIONAL = {
  SEM_CONTATO:        'SEM_CONTATO',
  EM_ACOMPANHAMENTO:  'EM_ACOMPANHAMENTO',
  AGUARDANDO_RETORNO: 'AGUARDANDO_RETORNO',
  NEGOCIANDO:         'NEGOCIANDO',
  PROMESSA_PAGAMENTO: 'PROMESSA_PAGAMENTO',
  ACORDO_ATIVO:       'ACORDO_ATIVO',
  JURIDICO:           'JURIDICO',
  ENCERRADO:          'ENCERRADO',
} as const
export type StatusOperacional = typeof STATUS_OPERACIONAL[keyof typeof STATUS_OPERACIONAL]

export const STATUS_OPERACIONAL_LABEL: Record<StatusOperacional, string> = {
  SEM_CONTATO:        'Sem Contato',
  EM_ACOMPANHAMENTO:  'Em Acompanhamento',
  AGUARDANDO_RETORNO: 'Aguardando Retorno',
  NEGOCIANDO:         'Negociando',
  PROMESSA_PAGAMENTO: 'Promessa de Pagamento',
  ACORDO_ATIVO:       'Acordo Ativo',
  JURIDICO:           'Jurídico',
  ENCERRADO:          'Encerrado',
}

export const STATUS_OPERACIONAL_COLOR: Record<StatusOperacional, string> = {
  SEM_CONTATO:        'bg-gray-100 text-gray-600',
  EM_ACOMPANHAMENTO:  'bg-blue-100 text-blue-700',
  AGUARDANDO_RETORNO: 'bg-yellow-100 text-yellow-700',
  NEGOCIANDO:         'bg-purple-100 text-purple-700',
  PROMESSA_PAGAMENTO: 'bg-orange-100 text-orange-700',
  ACORDO_ATIVO:       'bg-green-100 text-green-700',
  JURIDICO:           'bg-red-100 text-red-700',
  ENCERRADO:          'bg-gray-100 text-gray-500',
}

// ── Fases de cobrança (baseado em dias de atraso) ────────────────────────────

export const FASE_COBRANCA = {
  FASE_1: 'FASE_1', // D+1 a D+5
  FASE_2: 'FASE_2', // D+6 a D+30
  FASE_3: 'FASE_3', // D+31 a D+60
  FASE_4: 'FASE_4', // D+61+
} as const
export type FaseCobranca = typeof FASE_COBRANCA[keyof typeof FASE_COBRANCA]

export const FASE_LABEL: Record<FaseCobranca, string> = {
  FASE_1: 'Fase 1 (1–5 dias)',
  FASE_2: 'Fase 2 (6–30 dias)',
  FASE_3: 'Fase 3 (31–60 dias)',
  FASE_4: 'Fase 4 (61+ dias)',
}

export const FASE_COLOR: Record<FaseCobranca, string> = {
  FASE_1: 'bg-yellow-100 text-yellow-800',
  FASE_2: 'bg-orange-100 text-orange-800',
  FASE_3: 'bg-red-100 text-red-800',
  FASE_4: 'bg-red-200 text-red-900 font-bold',
}

export function calcularFase(diasAtraso: number): FaseCobranca | null {
  if (diasAtraso <= 0)  return null
  if (diasAtraso <= 5)  return 'FASE_1'
  if (diasAtraso <= 30) return 'FASE_2'
  if (diasAtraso <= 60) return 'FASE_3'
  return 'FASE_4'
}

// ── Canais de interação ──────────────────────────────────────────────────────

export const CANAL = {
  WHATSAPP:  'WHATSAPP',
  EMAIL:     'EMAIL',
  LIGACAO:   'LIGACAO',
  REUNIAO:   'REUNIAO',
  JURIDICO:  'JURIDICO',
  OBSERVACAO:'OBSERVACAO',
} as const
export type Canal = typeof CANAL[keyof typeof CANAL]

export const CANAL_LABEL: Record<Canal, string> = {
  WHATSAPP:  'WhatsApp',
  EMAIL:     'E-mail',
  LIGACAO:   'Ligação',
  REUNIAO:   'Reunião',
  JURIDICO:  'Jurídico',
  OBSERVACAO:'Observação Interna',
}

export const CANAL_ICON: Record<Canal, string> = {
  WHATSAPP:  'message-circle',
  EMAIL:     'mail',
  LIGACAO:   'phone',
  REUNIAO:   'users',
  JURIDICO:  'briefcase',
  OBSERVACAO:'file-text',
}

// ── Empresas responsáveis ────────────────────────────────────────────────────

export const EMPRESA_RESPONSAVEL = {
  FRANCHISING:     'FRANCHISING',
  SUPRIMENTOS:     'SUPRIMENTOS',
  TAXA_PROPAGANDA: 'TAXA_PROPAGANDA',
} as const
export type EmpresaResponsavel = typeof EMPRESA_RESPONSAVEL[keyof typeof EMPRESA_RESPONSAVEL]

export const EMPRESA_RESPONSAVEL_LABEL: Record<EmpresaResponsavel, string> = {
  FRANCHISING:     'Franchising (Royalties)',
  SUPRIMENTOS:     'Suprimentos',
  TAXA_PROPAGANDA: 'Taxa de Propaganda',
}

// ── Regras de parcelamento (estrutura configurável) ──────────────────────────
// Alterar aqui para ajustar as regras sem refatoração de código

export const REGRAS_PARCELAMENTO: Record<EmpresaResponsavel, {
  permite: boolean
  max_parcelas: number
  taxa_juros_base: number  // 0.08 = 8%
}> = {
  FRANCHISING:     { permite: true,  max_parcelas: 6, taxa_juros_base: 0.08 },
  SUPRIMENTOS:     { permite: false, max_parcelas: 1, taxa_juros_base: 0.08 },
  TAXA_PROPAGANDA: { permite: false, max_parcelas: 1, taxa_juros_base: 0.08 },
}

// ── Cálculo de negociação ────────────────────────────────────────────────────

export function calcularNegociacao(params: {
  valor_original: number
  percentual_multa: number
  percentual_juros: number
  quantidade_parcelas: number
  empresa_responsavel: EmpresaResponsavel
}): { valor_total_corrigido: number; valor_parcela: number } {
  const { valor_original, percentual_multa, percentual_juros, quantidade_parcelas } = params
  const multa  = valor_original * (percentual_multa / 100)
  const juros  = valor_original * (percentual_juros / 100)
  const total  = valor_original + multa + juros
  // Aplica taxa de juros base da empresa (8%) sobre o total já corrigido
  const regra   = REGRAS_PARCELAMENTO[params.empresa_responsavel]
  const totalCorrigido = total * (1 + regra.taxa_juros_base)
  const parcela = totalCorrigido / quantidade_parcelas
  return {
    valor_total_corrigido: Math.round(totalCorrigido * 100) / 100,
    valor_parcela:         Math.round(parcela * 100) / 100,
  }
}

// ── Tipos das entidades do banco ─────────────────────────────────────────────

export interface AcompanhamentoCliente {
  id: number
  empresa_id: number
  cliente_id: number
  solutto_cliente_id: number | null
  status_operacional: StatusOperacional
  fase_cobranca: FaseCobranca | null
  dias_atraso_max: number
  valor_total_vencido: number
  total_titulos_vencidos: number
  ultima_interacao_em: string | null
  proximo_acompanhamento: string | null
  responsavel_id: string | null
  observacoes_gerais: string | null
  created_at: string
  updated_at: string
}

export interface Interacao {
  id: number
  empresa_id: number
  cliente_id: number
  solutto_cliente_id: number | null
  usuario_id: string | null
  canal: Canal
  canais: Canal[]           // todos os canais (multi-select); fallback para [canal]
  tipo_interacao: string | null
  descricao: string
  observacao: string | null
  resultado: string | null
  status_operacional_resultante: StatusOperacional | null
  data_interacao: string
  proximo_acompanhamento: string | null
  origem: 'MANUAL' | 'SISTEMA' | 'INTEGRACAO' | 'GIRABOT'
  anexos: AnexoInteracao[]
  snapshot_financeiro: SnapshotFinanceiro
  created_at: string
  // joined
  usuario_nome?: string
}

export interface AnexoInteracao {
  nome: string
  url: string
  tipo: string
  tamanho: number
}

export interface SnapshotFinanceiro {
  data_snapshot: string
  valor_total_vencido: number
  titulos_vencidos: number
  dias_atraso_max: number
  fase_cobranca: FaseCobranca | null
  titulos: SnapshotTitulo[]
}

export interface SnapshotTitulo {
  solutto_id: number
  numero_documento: string
  valor_saldo: number
  data_vencimento: string
  dias_atraso: number
}

export interface TituloNegociado {
  solutto_id: number
  numero_documento: string | null
  valor_original: number
  valor_saldo: number
  dias_atraso: number
  data_vencimento: string
}

export interface Negociacao {
  id: number
  empresa_id: number
  cliente_id: number
  interacao_id: number | null
  empresa_responsavel: EmpresaResponsavel
  valor_original: number
  percentual_multa: number
  percentual_juros: number
  quantidade_parcelas: number
  valor_total_corrigido: number
  valor_parcela: number
  data_vencimento_negociacao: string
  observacoes_financeiras: string | null
  status_negociacao: 'ATIVA' | 'CUMPRIDA' | 'QUEBRADA' | 'CANCELADA'
  responsavel_id: string | null
  snapshot_regras: typeof REGRAS_PARCELAMENTO[EmpresaResponsavel]
  versao: number
  negociacao_anterior_id: number | null
  titulos_negociados: TituloNegociado[]
  created_at: string
  updated_at: string
  // joined
  parcelas?: NegociacaoParcela[]
  responsavel_nome?: string
}

export interface NegociacaoParcela {
  id: number
  negociacao_id: number
  numero_parcela: number
  valor_parcela: number
  data_vencimento: string
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO'
  data_pagamento: string | null
}

export interface TimelineEvento {
  id: number
  empresa_id: number
  cliente_id: number
  tipo_evento: string
  titulo: string
  descricao: string | null
  dados: Record<string, unknown>
  usuario_id: string | null
  referencia_id: string | null
  referencia_tipo: string | null
  icone: string
  cor: string
  data_evento: string
  created_at: string
  // joined
  usuario_nome?: string
}

// ── Tipo composto para o dashboard ──────────────────────────────────────────

export interface ClienteCobranca {
  cliente_id: number
  solutto_cliente_id: number | null
  empresa_id: number
  cliente_nome: string
  cliente_cpf_cnpj: string | null
  titulos_vencidos: number
  valor_total_vencido: number
  dias_atraso_max: number
  status_operacional: StatusOperacional
  fase_cobranca: FaseCobranca | null
  ultima_interacao_em: string | null
  proximo_acompanhamento: string | null
  responsavel_id: string | null
  acompanhamento_id: number | null
}

// ── Tipo composto para a tela de detalhe ────────────────────────────────────

export interface ClienteCobrancaDetalheData {
  cliente: ClienteCobranca
  acompanhamento: AcompanhamentoCliente | null
  contas: ContaReceberResumo[]
  interacoes: Interacao[]
  negociacao_ativa: Negociacao | null
  timeline: TimelineEvento[]
}

export interface ContaReceberResumo {
  id: number
  solutto_id: number
  numero_documento: string | null
  descricao: string | null
  data_vencimento: string
  data_pagamento: string | null
  valor_original: number
  valor_pago: number
  valor_saldo: number
  status: string
  // calculado
  dias_atraso: number
  status_calculado: 'QUITADO' | 'A_VENCER' | 'VENCE_HOJE' | 'VENCIDO'
}

// ── Canais de notificação (multi-select, diferente dos canais de interação) ──

export const CANAL_NOTIFICACAO = {
  WHATSAPP:      'WHATSAPP',
  EMAIL:         'EMAIL',
  LIGACAO:       'LIGACAO',
  EXTRAJUDICIAL: 'EXTRAJUDICIAL',
  JUDICIAL:      'JUDICIAL',
} as const
export type CanalNotificacao = typeof CANAL_NOTIFICACAO[keyof typeof CANAL_NOTIFICACAO]

export const CANAL_NOTIFICACAO_LABEL: Record<CanalNotificacao, string> = {
  WHATSAPP:      'WhatsApp',
  EMAIL:         'E-mail',
  LIGACAO:       'Ligação Telefônica',
  EXTRAJUDICIAL: 'Notificação Extrajudicial',
  JUDICIAL:      'Notificação Judicial',
}

// ── Resultado de busca de cliente para o modal de nova notificação ────────────

export interface ClienteSearchResult {
  solutto_cliente_id: number
  cliente_id: number | null
  cliente_nome: string
  cliente_cpf_cnpj: string | null
}

// ── Notificação de cobrança ───────────────────────────────────────────────────

export interface Notificacao {
  id: number
  empresa_id: number
  solutto_cliente_id: number
  cliente_id: number | null
  cliente_nome: string
  cliente_cpf_cnpj: string | null
  usuario_id: string | null
  canais_enviados: CanalNotificacao[]
  observacoes: string | null
  status: 'REGISTRADA' | 'PENDENTE_GIRABOT' | 'EXPORTADA_GIRABOT' | 'RESPONDIDA'
  girabot_exportado_em: string | null
  data_notificacao: string
  created_at: string
  // joined
  titulos?: NotificacaoTitulo[]
}

export interface NotificacaoTitulo {
  id: number
  notificacao_id: number
  solutto_id: number
  numero_documento: string | null
  valor_original: number
  vencimento_original: string
  valor_saldo_original: number
  dias_atraso_original: number
  valor_atual: number | null
  percentual_multa: number
  percentual_juros: number
  valor_total_calculado: number | null
}
