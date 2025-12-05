// =====================================================
// TIPOS E INTERFACES - CADASTROS FISCAIS AUXILIARES
// Sistema Fiscal Moderno - ERP Brasileiro
// Data: 01/12/2025
// =====================================================

/**
 * CADASTRO DE NCM (Nomenclatura Comum do Mercosul)
 */
export interface NCM {
  id: string | number
  codigo: string // 8 dígitos
  descricao: string
  unidade_tributavel?: string
  aliquota_nacional?: number // % médio
  aliquota_importacao?: number
  ativo: boolean
  created_at?: string
  updated_at?: string
}

export interface NCMFormData {
  codigo: string
  descricao: string
  unidade_tributavel?: string
  aliquota_nacional?: number
  aliquota_importacao?: number
  ativo: boolean
}

/**
 * CADASTRO DE CEST (Código Especificador da Substituição Tributária)
 */
export interface CEST {
  id: string | number
  ncm_id: string | number // FK para NCM
  codigo: string // 7 dígitos
  descricao: string
  ativo: boolean
  created_at?: string
  updated_at?: string
}

/**
 * CADASTRO DE CFOP (Código Fiscal de Operações e Prestações)
 */
export interface CFOP {
  id: string | number
  codigo: string // 4 dígitos (1000-7999)
  descricao: string
  finalidade: 'ENTRADA' | 'SAIDA'
  tipo_operacao: 'VENDA' | 'COMPRA' | 'TRANSFERENCIA' | 'DEVOLUCAO' | 'BONIFICACAO' | 'REMESSA' | 'RETORNO' | 'OUTRAS'
  movimenta_estoque: boolean
  movimenta_financeiro: boolean
  dentro_estado: boolean // CFOP 5xxx = dentro estado, 6xxx = fora estado, 7xxx = exterior
  ativo: boolean
  created_at?: string
  updated_at?: string
}

export interface CFOPFormData {
  codigo: string
  descricao: string
  finalidade: 'ENTRADA' | 'SAIDA'
  tipo_operacao: string
  movimenta_estoque: boolean
  movimenta_financeiro: boolean
  dentro_estado: boolean
  ativo: boolean
}

/**
 * OPERAÇÃO FISCAL (Regra Tributária Completa)
 */
export interface OperacaoFiscal {
  id: string | number
  codigo: string
  nome: string
  descricao?: string
  
  // CFOPs vinculados
  cfop_dentro_estado: string // Ex: 5102
  cfop_fora_estado: string // Ex: 6102
  cfop_exterior?: string // Ex: 7102
  
  // Regime tributário aplicável
  regime_tributario: 'SIMPLES' | 'PRESUMIDO' | 'REAL' | 'TODOS'
  
  // Finalidade
  finalidade: 'ENTRADA' | 'SAIDA'
  tipo_operacao: string
  
  // ICMS
  cst_icms?: string
  csosn_icms?: string
  modalidade_bc_icms?: string // 0=Margem Valor Agregado; 1=Pauta; 2=Preço Tabelado; 3=Valor da operação
  reducao_bc_icms?: number
  aliquota_icms?: number
  
  // Substituição Tributária
  calcula_st: boolean
  cst_icms_st?: string
  modalidade_bc_st?: string
  mva_st?: number
  reducao_bc_st?: number
  aliquota_st?: number
  
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
  
  // Controles
  calcula_icms: boolean
  calcula_pis: boolean
  calcula_cofins: boolean
  calcula_ipi: boolean
  
  // DIFAL (Diferencial de Alíquota)
  calcula_difal: boolean
  
  // FCP (Fundo de Combate à Pobreza)
  calcula_fcp: boolean
  aliquota_fcp?: number
  
  ativo: boolean
  created_at?: string
  updated_at?: string
}

export interface OperacaoFiscalFormData {
  codigo: string
  nome: string
  descricao?: string
  cfop_dentro_estado: string
  cfop_fora_estado: string
  cfop_exterior?: string
  regime_tributario: 'SIMPLES' | 'PRESUMIDO' | 'REAL' | 'TODOS'
  finalidade: 'ENTRADA' | 'SAIDA'
  tipo_operacao: string
  cst_icms?: string
  csosn_icms?: string
  modalidade_bc_icms?: string
  reducao_bc_icms?: number
  aliquota_icms?: number
  calcula_st: boolean
  cst_icms_st?: string
  modalidade_bc_st?: string
  mva_st?: number
  reducao_bc_st?: number
  aliquota_st?: number
  cst_pis?: string
  aliquota_pis?: number
  cst_cofins?: string
  aliquota_cofins?: number
  cst_ipi?: string
  aliquota_ipi?: number
  enquadramento_ipi?: string
  calcula_icms: boolean
  calcula_pis: boolean
  calcula_cofins: boolean
  calcula_ipi: boolean
  calcula_difal: boolean
  calcula_fcp: boolean
  aliquota_fcp?: number
  ativo: boolean
}

/**
 * UNIDADE DE MEDIDA (Padronizado)
 */
export interface UnidadeMedida {
  id: string | number
  codigo: string // UN, CX, KG, etc.
  descricao: string
  ativo: boolean
  created_at?: string
  updated_at?: string
}

/**
 * CATEGORIA DE PRODUTO
 */
export interface CategoriaProduto {
  id: string | number
  codigo: string
  nome: string
  descricao?: string
  categoria_pai_id?: string | number // Para hierarquia
  operacao_fiscal_padrao_id?: string | number // Operação fiscal padrão para esta categoria
  ativo: boolean
  created_at?: string
  updated_at?: string
}

/**
 * TABELA IBPT (Imposto Sobre Produtos)
 */
export interface TabelaIBPT {
  id: string | number
  ncm: string
  descricao: string
  nacional_federal: number // %
  importados_federal: number // %
  estadual: number // %
  municipal: number // %
  vigencia_inicio: string
  vigencia_fim: string
  chave: string
  versao: string
  fonte: string
  created_at?: string
  updated_at?: string
}

/**
 * REGRAS DE ICMS POR UF
 */
export interface RegraICMSUF {
  id: string | number
  uf_origem: string // SP, RJ, etc.
  uf_destino: string
  aliquota_interna: number // Alíquota interna do estado
  aliquota_interestadual: number // 4%, 7% ou 12%
  mva_original?: number
  mva_ajustada?: number
  fcp_aliquota?: number // Fundo de Combate à Pobreza
  vigencia_inicio: string
  vigencia_fim?: string
  ativo: boolean
  created_at?: string
  updated_at?: string
}

/**
 * CERTIFICADO DIGITAL
 */
export interface CertificadoDigital {
  id: string | number
  tipo: 'A1' | 'A3'
  arquivo?: string // Para A1 (base64)
  senha?: string // Criptografada
  caminho?: string // Para A3
  cnpj: string
  nome_empresa: string
  validade_inicio: string
  validade_fim: string
  ativo: boolean
  created_at?: string
  updated_at?: string
}

/**
 * PARÂMETROS FISCAIS GLOBAIS
 */
export interface ParametrosFiscais {
  id: string | number
  
  // Dados da Empresa
  cnpj: string
  inscricao_estadual: string
  inscricao_municipal?: string
  regime_tributario: 'SIMPLES' | 'PRESUMIDO' | 'REAL'
  crt: '1' | '2' | '3' // 1=Simples Nacional, 2=Simples Nacional - excesso, 3=Regime Normal
  uf: string
  
  // Numeração de NF-e
  serie_nfe: number
  numero_atual_nfe: number
  serie_nfce: number
  numero_atual_nfce: number
  
  // Certificado
  certificado_id?: string | number
  
  // Ambiente
  ambiente: 'PRODUCAO' | 'HOMOLOGACAO'
  
  // Responsável Técnico
  responsavel_cpf?: string
  responsavel_nome?: string
  responsavel_email?: string
  responsavel_telefone?: string
  
  // CSC (Código de Segurança do Contribuinte) para NFC-e
  csc_id?: string
  csc_codigo?: string
  
  // Configurações de Envio
  timeout_sefaz: number // segundos
  tentativas_reenvio: number
  
  // Emails
  email_copia_xml?: string
  email_copia_danfe?: string
  
  created_at?: string
  updated_at?: string
}

/**
 * CONSTANTES FISCAIS
 */
export const TIPOS_OPERACAO = [
  { value: 'VENDA', label: 'Venda' },
  { value: 'COMPRA', label: 'Compra' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
  { value: 'DEVOLUCAO', label: 'Devolução' },
  { value: 'BONIFICACAO', label: 'Bonificação' },
  { value: 'REMESSA', label: 'Remessa' },
  { value: 'RETORNO', label: 'Retorno' },
  { value: 'OUTRAS', label: 'Outras' }
]

export const MODALIDADES_BC_ICMS = [
  { value: '0', label: '0 - Margem Valor Agregado (%)' },
  { value: '1', label: '1 - Pauta (Valor)' },
  { value: '2', label: '2 - Preço Tabelado Máx. (valor)' },
  { value: '3', label: '3 - Valor da operação' }
]

export const UFS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export const CRT_TIPOS = [
  { value: '1', label: '1 - Simples Nacional' },
  { value: '2', label: '2 - Simples Nacional - Excesso de sublimite de receita bruta' },
  { value: '3', label: '3 - Regime Normal' }
]
