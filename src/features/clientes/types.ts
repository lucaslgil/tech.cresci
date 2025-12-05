/**
 * TIPOS E INTERFACES - MÓDULO DE CLIENTES
 * Baseado no modelo de dados SQL criado
 */

// =====================================================
// ENUMS
// =====================================================

export enum TipoPessoa {
  FISICA = 'FISICA',
  JURIDICA = 'JURIDICA'
}

export enum TipoEndereco {
  COMERCIAL = 'COMERCIAL',
  RESIDENCIAL = 'RESIDENCIAL',
  COBRANCA = 'COBRANCA',
  ENTREGA = 'ENTREGA'
}

export enum TipoContato {
  TELEFONE = 'TELEFONE',
  CELULAR = 'CELULAR',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP'
}

export enum RegimeTributario {
  SIMPLES_NACIONAL = 'SIMPLES_NACIONAL',
  LUCRO_PRESUMIDO = 'LUCRO_PRESUMIDO',
  LUCRO_REAL = 'LUCRO_REAL',
  MEI = 'MEI',
  ISENTO = 'ISENTO'
}

export enum ContribuinteICMS {
  CONTRIBUINTE = 'CONTRIBUINTE',
  ISENTO = 'ISENTO',
  NAO_CONTRIBUINTE = 'NAO_CONTRIBUINTE'
}

export enum StatusCliente {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  BLOQUEADO = 'BLOQUEADO',
  SUSPENSO = 'SUSPENSO'
}

export enum TipoBloqueio {
  COMERCIAL = 'COMERCIAL',
  FINANCEIRO = 'FINANCEIRO',
  COMPLETO = 'COMPLETO'
}

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
  consumidor_final?: boolean
  
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

export const TipoPessoaLabels: Record<TipoPessoa, string> = {
  [TipoPessoa.FISICA]: 'Pessoa Física',
  [TipoPessoa.JURIDICA]: 'Pessoa Jurídica'
}

export const TipoEnderecoLabels: Record<TipoEndereco, string> = {
  [TipoEndereco.COMERCIAL]: 'Comercial',
  [TipoEndereco.RESIDENCIAL]: 'Residencial',
  [TipoEndereco.COBRANCA]: 'Cobrança',
  [TipoEndereco.ENTREGA]: 'Entrega'
}

export const TipoContatoLabels: Record<TipoContato, string> = {
  [TipoContato.TELEFONE]: 'Telefone',
  [TipoContato.CELULAR]: 'Celular',
  [TipoContato.EMAIL]: 'E-mail',
  [TipoContato.WHATSAPP]: 'WhatsApp'
}

export const RegimeTributarioLabels: Record<RegimeTributario, string> = {
  [RegimeTributario.SIMPLES_NACIONAL]: 'Simples Nacional',
  [RegimeTributario.LUCRO_PRESUMIDO]: 'Lucro Presumido',
  [RegimeTributario.LUCRO_REAL]: 'Lucro Real',
  [RegimeTributario.MEI]: 'MEI',
  [RegimeTributario.ISENTO]: 'Isento'
}

export const ContribuinteICMSLabels: Record<ContribuinteICMS, string> = {
  [ContribuinteICMS.CONTRIBUINTE]: 'Contribuinte',
  [ContribuinteICMS.ISENTO]: 'Isento',
  [ContribuinteICMS.NAO_CONTRIBUINTE]: 'Não Contribuinte'
}

export const StatusClienteLabels: Record<StatusCliente, string> = {
  [StatusCliente.ATIVO]: 'Ativo',
  [StatusCliente.INATIVO]: 'Inativo',
  [StatusCliente.BLOQUEADO]: 'Bloqueado',
  [StatusCliente.SUSPENSO]: 'Suspenso'
}

export const TipoBloqueioLabels: Record<TipoBloqueio, string> = {
  [TipoBloqueio.COMERCIAL]: 'Comercial',
  [TipoBloqueio.FINANCEIRO]: 'Financeiro',
  [TipoBloqueio.COMPLETO]: 'Completo'
}

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
