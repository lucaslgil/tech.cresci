/**
 * TIPOS E INTERFACES - MÓDULO DE CLIENTES
 * Baseado no modelo de dados SQL criado
 */

// =====================================================
// TIPOS CONSTANTES (substituindo enums para compatibilidade)
// =====================================================

export const TipoPessoa = {
  FISICA: 'FISICA',
  JURIDICA: 'JURIDICA'
} as const
export type TipoPessoa = typeof TipoPessoa[keyof typeof TipoPessoa]

export const TipoEndereco = {
  COMERCIAL: 'COMERCIAL',
  RESIDENCIAL: 'RESIDENCIAL',
  COBRANCA: 'COBRANCA',
  ENTREGA: 'ENTREGA'
} as const
export type TipoEndereco = typeof TipoEndereco[keyof typeof TipoEndereco]

export const TipoContato = {
  TELEFONE: 'TELEFONE',
  CELULAR: 'CELULAR',
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP',
  SKYPE: 'SKYPE',
  OUTROS: 'OUTROS'
} as const
export type TipoContato = typeof TipoContato[keyof typeof TipoContato]

export const RegimeTributario = {
  SIMPLES_NACIONAL: 'SIMPLES_NACIONAL',
  LUCRO_PRESUMIDO: 'LUCRO_PRESUMIDO',
  LUCRO_REAL: 'LUCRO_REAL',
  MEI: 'MEI',
  ISENTO: 'ISENTO'
} as const
export type RegimeTributario = typeof RegimeTributario[keyof typeof RegimeTributario]

export const ContribuinteICMS = {
  CONTRIBUINTE: 'CONTRIBUINTE',
  ISENTO: 'ISENTO',
  NAO_CONTRIBUINTE: 'NAO_CONTRIBUINTE'
} as const
export type ContribuinteICMS = typeof ContribuinteICMS[keyof typeof ContribuinteICMS]

export const StatusCliente = {
  ATIVO: 'ATIVO',
  INATIVO: 'INATIVO',
  BLOQUEADO: 'BLOQUEADO',
  SUSPENSO: 'SUSPENSO'
} as const
export type StatusCliente = typeof StatusCliente[keyof typeof StatusCliente]

export const TipoBloqueio = {
  COMERCIAL: 'COMERCIAL',
  FINANCEIRO: 'FINANCEIRO',
  COMPLETO: 'COMPLETO'
} as const
export type TipoBloqueio = typeof TipoBloqueio[keyof typeof TipoBloqueio]

// =====================================================
// INTERFACES PRINCIPAIS
// =====================================================

export interface Cliente {
  // Identificação
  id: number
  codigo: string
  tipo_pessoa: TipoPessoa
  
  // Dados Pessoa Física
  nome_completo?: string
  cpf?: string
  rg?: string
  data_nascimento?: string
  genero?: string
  
  // Dados Pessoa Jurídica
  razao_social?: string
  nome_fantasia?: string
  cnpj?: string
  inscricao_estadual?: string
  inscricao_municipal?: string
  cnae_principal?: string
  
  // Dados Fiscais
  regime_tributario?: RegimeTributario
  contribuinte_icms: ContribuinteICMS
  consumidor_final: boolean
  codigo_suframa?: string
  
  // Dados Financeiros
  limite_credito: number
  condicao_pagamento_id?: number
  tabela_preco_id?: number
  
  // Status e Bloqueios
  status: StatusCliente
  bloqueio?: TipoBloqueio
  motivo_bloqueio?: string
  data_bloqueio?: string
  
  // Observações
  observacoes?: string
  observacoes_internas?: string
  
  // Auditoria
  created_at: string
  updated_at: string
  created_by?: number
  updated_by?: number
  ultimo_vendedor_id?: number
}

export interface ClienteEndereco {
  id: number
  cliente_id: number
  tipo: TipoEndereco
  principal: boolean
  
  // Dados do endereço
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  pais: string
  
  // Coordenadas
  latitude?: number
  longitude?: number
  
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface ClienteContato {
  id: number
  cliente_id: number
  tipo: TipoContato
  descricao?: string
  principal: boolean
  valor: string
  
  // Flags especiais
  recebe_nfe: boolean
  recebe_cobranca: boolean
  recebe_marketing: boolean
  
  validado: boolean
  data_validacao?: string
  observacoes?: string
  
  created_at: string
  updated_at: string
}

export interface ClienteHistorico {
  id: number
  cliente_id: number
  tipo?: string
  acao: string
  campo_alterado?: string
  valor_anterior?: string
  valor_novo?: string
  descricao?: string
  created_at: string
  usuario_id?: number
  ip_origem?: string
}

export interface CondicaoPagamento {
  id: number
  codigo: string
  descricao: string
  parcelas: number
  dias_primeira_parcela: number
  dias_entre_parcelas: number
  percentual_entrada: number
  ativo: boolean
  padrao: boolean
  created_at: string
  updated_at: string
}

export interface TabelaPreco {
  id: number
  codigo: string
  descricao: string
  percentual_desconto: number
  percentual_acrescimo: number
  ativo: boolean
  padrao: boolean
  data_inicio?: string
  data_fim?: string
  created_at: string
  updated_at: string
}

// =====================================================
// INTERFACES PARA FORMULÁRIOS
// =====================================================

export interface ClienteFormData {
  // Campos de controle
  id?: number
  codigo?: string
  status?: StatusCliente
  
  // Tipo
  tipo_pessoa: TipoPessoa
  
  // Pessoa Física
  nome_completo?: string
  cpf?: string
  rg?: string
  data_nascimento?: string
  genero?: string
  sexo?: string
  estado_civil?: string
  
  // Pessoa Jurídica
  razao_social?: string
  nome_fantasia?: string
  cnpj?: string
  inscricao_estadual?: string
  inscricao_municipal?: string
  cnae_principal?: string
  
  // Dados Fiscais
  regime_tributario?: RegimeTributario
  contribuinte_icms?: ContribuinteICMS
  codigo_suframa?: string
  inscricao_suframa?: string
  consumidor_final?: boolean
  simples_nacional?: boolean
  observacoes_fiscais?: string
  
  // Dados Financeiros
  condicao_pagamento_id?: number
  tabela_preco_id?: number
  limite_credito?: number
  
  // Observações gerais
  observacoes?: string
  observacoes_internas?: string
  
  // Timestamps
  created_at?: string
  updated_at?: string
}

export interface EnderecoFormData {
  tipo: TipoEndereco
  principal: boolean
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  pais: string
  observacoes?: string
}

export interface ContatoFormData {
  tipo: TipoContato
  descricao?: string
  principal: boolean
  valor: string
  recebe_nfe: boolean
  recebe_cobranca: boolean
  recebe_marketing: boolean
  observacoes?: string
}

// =====================================================
// INTERFACES PARA VIEWS E LISTAGENS
// =====================================================

export interface ClienteCompleto extends Cliente {
  // Endereço principal
  endereco_principal?: string
  endereco_numero?: string
  endereco_bairro?: string
  endereco_cidade?: string
  endereco_estado?: string
  endereco_cep?: string
  
  // Contatos principais
  telefone_principal?: string
  email_principal?: string
  
  // Descrições relacionadas
  condicao_pagamento_descricao?: string
  tabela_preco_descricao?: string
  vendedor_nome?: string
  
  // Arrays relacionados (carregados separadamente)
  enderecos?: ClienteEndereco[]
  contatos?: ClienteContato[]
}

// =====================================================
// INTERFACES PARA FILTROS E BUSCAS
// =====================================================

export interface ClienteFiltros {
  busca?: string // Busca geral (nome, CPF, CNPJ, código)
  tipo_pessoa?: TipoPessoa
  status?: StatusCliente
  regime_tributario?: RegimeTributario
  contribuinte_icms?: ContribuinteICMS
  cidade?: string
  estado?: string
  vendedor_id?: number
  condicao_pagamento_id?: number
  tabela_preco_id?: number
  data_cadastro_inicio?: string
  data_cadastro_fim?: string
  bloqueado?: boolean
  ordenar_por?: string
  ordem_direcao?: 'asc' | 'desc'
  limite?: number
  offset?: number
}

// =====================================================
// INTERFACES PARA VALIDAÇÕES
// =====================================================

/**
 * Erro de validação
 */
export interface ValidationError {
  field: string
  message: string
}

/**
 * Resultado de validação
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// =====================================================
// LABELS E HELPERS
// =====================================================

export const TipoPessoaLabels = {
  'FISICA': 'Pessoa Física',
  'JURIDICA': 'Pessoa Jurídica'
} as const

export const TipoEnderecoLabels = {
  'COMERCIAL': 'Comercial',
  'RESIDENCIAL': 'Residencial',
  'COBRANCA': 'Cobrança',
  'ENTREGA': 'Entrega'
} as const

export const TipoContatoLabels = {
  'TELEFONE': 'Telefone',
  'CELULAR': 'Celular',
  'EMAIL': 'E-mail',
  'WHATSAPP': 'WhatsApp',
  'SKYPE': 'Skype',
  'OUTROS': 'Outros'
} as const

export const RegimeTributarioLabels = {
  'SIMPLES_NACIONAL': 'Simples Nacional',
  'LUCRO_PRESUMIDO': 'Lucro Presumido',
  'LUCRO_REAL': 'Lucro Real',
  'MEI': 'MEI',
  'ISENTO': 'Isento'
} as const

export const ContribuinteICMSLabels = {
  'CONTRIBUINTE': 'Contribuinte',
  'ISENTO': 'Isento',
  'NAO_CONTRIBUINTE': 'Não Contribuinte'
} as const

export const StatusClienteLabels = {
  'ATIVO': 'Ativo',
  'INATIVO': 'Inativo',
  'BLOQUEADO': 'Bloqueado',
  'SUSPENSO': 'Suspenso'
} as const

export const TipoBloqueioLabels = {
  'COMERCIAL': 'Comercial',
  'FINANCEIRO': 'Financeiro',
  'COMPLETO': 'Completo'
} as const

// =====================================================
// ESTADOS BRASILEIROS
// =====================================================

export const EstadosBrasileiros = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' }
]
