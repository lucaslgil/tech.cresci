// =====================================================
// TIPOS - MÓDULO DE UNIDADES FRANQUEADAS
// =====================================================

export type StatusUnidade =
  | 'prospeccao'
  | 'pre_contrato'
  | 'implantacao'
  | 'inauguracao'
  | 'ativa'
  | 'suspensa'
  | 'encerrada'

export type EtapaUnidade =
  | 'prospeccao'
  | 'pre_contrato'
  | 'implantacao'
  | 'inauguracao'
  | 'operacao'
  | 'suspensao'
  | 'encerramento'

export type ModeloUnidade =
  | 'loja'
  | 'quiosque'
  | 'dark_kitchen'
  | 'home_office'
  | 'outro'

export type StatusPagamento =
  | 'pendente'
  | 'pago'
  | 'inadimplente'
  | 'negociando'

export type TipoSocio =
  | 'administrador'
  | 'socio'
  | 'investidor'
  | 'outro'

export type TipoDocumento =
  | 'contrato_franquia'
  | 'aditivo_contratual'
  | 'documento_franqueado'
  | 'alvara'
  | 'licenca'
  | 'outro'

export interface Unidade {
  id: string
  empresa_id: string
  codigo_unidade: string
  nome_unidade: string
  nome_fantasia: string | null
  status: StatusUnidade
  data_abertura: string | null
  data_assinatura_contrato: string | null

  nome_franqueado: string
  cpf_cnpj_franqueado: string | null
  email_franqueado: string | null
  telefone_franqueado: string | null

  cep: string | null
  rua: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  pais: string | null
  latitude: number | null
  longitude: number | null

  tipo_contrato: string | null
  prazo_contrato_meses: number | null
  data_inicio_contrato: string | null
  data_termino_contrato: string | null
  taxa_franquia: number | null
  royalties_percentual: number | null
  fundo_marketing_percentual: number | null
  taxa_tecnologica: number | null

  modelo_unidade: ModeloUnidade | null
  tamanho_loja_m2: number | null
  capacidade_operacional: number | null
  horario_funcionamento: Record<string, string> | null

  etapa_atual: EtapaUnidade
  faturamento_meta_mensal: number | null
  cliente_id: number | null
  franqueado_id: number | null

  created_at: string
  updated_at: string
}

export interface SocioUnidade {
  id: string
  unidade_id: string
  empresa_id: string
  nome: string
  cpf_cnpj: string | null
  email: string | null
  telefone: string | null
  percentual_participacao: number | null
  tipo_socio: TipoSocio | null
  created_at: string
}

export interface HistoricoEtapa {
  id: string
  unidade_id: string
  etapa_anterior: string | null
  etapa_nova: string
  responsavel_id: string | null
  responsavel_nome: string | null
  notas: string | null
  data_mudanca: string
}

export interface DocumentoUnidade {
  id: string
  unidade_id: string
  tipo_documento: TipoDocumento
  nome_arquivo: string
  url_arquivo: string | null
  data_documento: string | null
  data_validade: string | null
  versao: string | null
  notas: string | null
  created_at: string
}

export interface IndicadorUnidade {
  id: string
  unidade_id: string
  mes_referencia: string
  faturamento_bruto: number | null
  faturamento_liquido: number | null
  valor_royalties: number | null
  valor_marketing: number | null
  valor_taxa_tecnologica: number | null
  status_pagamento: StatusPagamento
  notas: string | null
}

export interface FormUnidade {
  codigo_unidade: string
  nome_unidade: string
  nome_fantasia: string
  status: StatusUnidade
  data_abertura: string
  data_assinatura_contrato: string
  nome_franqueado: string
  cpf_cnpj_franqueado: string
  email_franqueado: string
  telefone_franqueado: string
  cep: string
  rua: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  pais: string
  latitude: string
  longitude: string
  tipo_contrato: string
  prazo_contrato_meses: string
  data_inicio_contrato: string
  data_termino_contrato: string
  taxa_franquia: string
  royalties_percentual: string
  fundo_marketing_percentual: string
  taxa_tecnologica: string
  modelo_unidade: ModeloUnidade | ''
  tamanho_loja_m2: string
  capacidade_operacional: string
  horario_funcionamento: string
  etapa_atual: EtapaUnidade
  faturamento_meta_mensal: string
  cliente_id: number | null
  franqueado_id: number | null
}

export const INITIAL_FORM: FormUnidade = {
  codigo_unidade: '',
  nome_unidade: '',
  nome_fantasia: '',
  status: 'implantacao',
  data_abertura: '',
  data_assinatura_contrato: '',
  nome_franqueado: '',
  cpf_cnpj_franqueado: '',
  email_franqueado: '',
  telefone_franqueado: '',
  cep: '',
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  pais: 'Brasil',
  latitude: '',
  longitude: '',
  tipo_contrato: '',
  prazo_contrato_meses: '',
  data_inicio_contrato: '',
  data_termino_contrato: '',
  taxa_franquia: '',
  royalties_percentual: '',
  fundo_marketing_percentual: '',
  taxa_tecnologica: '',
  modelo_unidade: '',
  tamanho_loja_m2: '',
  capacidade_operacional: '',
  horario_funcionamento: '',
  etapa_atual: 'prospeccao',
  faturamento_meta_mensal: '',
  cliente_id: null,
  franqueado_id: null,
}

export const STATUS_LABELS: Record<StatusUnidade, string> = {
  prospeccao: 'Prospecção',
  pre_contrato: 'Pré-contrato',
  implantacao: 'Implantação',
  inauguracao: 'Inauguração',
  ativa: 'Ativa',
  suspensa: 'Suspensa',
  encerrada: 'Encerrada',
}

export const ETAPA_LABELS: Record<EtapaUnidade, string> = {
  prospeccao: 'Prospecção',
  pre_contrato: 'Pré-contrato',
  implantacao: 'Implantação',
  inauguracao: 'Inauguração',
  operacao: 'Operação',
  suspensao: 'Suspensão',
  encerramento: 'Encerramento',
}

export const MODELO_LABELS: Record<ModeloUnidade, string> = {
  loja: 'Loja',
  quiosque: 'Quiosque',
  dark_kitchen: 'Dark Kitchen',
  home_office: 'Home Office',
  outro: 'Outro',
}

export const STATUS_COLORS: Record<StatusUnidade, string> = {
  prospeccao: 'bg-gray-100 text-gray-700',
  pre_contrato: 'bg-yellow-100 text-yellow-800',
  implantacao: 'bg-orange-100 text-orange-800',
  inauguracao: 'bg-blue-100 text-blue-800',
  ativa: 'bg-green-100 text-green-800',
  suspensa: 'bg-red-100 text-red-800',
  encerrada: 'bg-slate-200 text-slate-600',
}

export const ETAPA_COLORS: Record<EtapaUnidade, string> = {
  prospeccao: 'bg-gray-100 text-gray-700',
  pre_contrato: 'bg-yellow-100 text-yellow-800',
  implantacao: 'bg-orange-100 text-orange-800',
  inauguracao: 'bg-blue-100 text-blue-800',
  operacao: 'bg-green-100 text-green-800',
  suspensao: 'bg-red-100 text-red-800',
  encerramento: 'bg-slate-200 text-slate-600',
}

export const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

export const TIPOS_SOCIO: { value: TipoSocio; label: string }[] = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'socio', label: 'Sócio' },
  { value: 'investidor', label: 'Investidor' },
  { value: 'outro', label: 'Outro' },
]
