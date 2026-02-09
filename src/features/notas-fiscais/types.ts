// =====================================================
// TIPOS E INTERFACES - MÓDULO NOTAS FISCAIS
// Sistema Fiscal - NF-e / NFC-e
// Data: 01/12/2025
// =====================================================

/**
 * NOTA FISCAL ELETRÔNICA (NF-e / NFC-e)
 */
export interface NotaFiscal {
  id: string | number
  
  // Identificação
  tipo_nota: 'NFE' | 'NFCE' // 55 = NF-e, 65 = NFC-e
  numero: number
  serie: number
  chave_acesso: string // 44 dígitos
  
  // Datas
  data_emissao: string
  data_saida?: string
  
  // Natureza da Operação
  natureza_operacao: string
  cfop_predominante: string
  
  // Finalidade
  finalidade: '1' | '2' | '3' | '4' // 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
  
  // Destinatário/Remetente
  cliente_id?: string | number
  destinatario_tipo: 'CLIENTE' | 'FORNECEDOR' | 'OUTRO'
  destinatario_cpf_cnpj?: string
  destinatario_nome?: string
  destinatario_ie?: string
  destinatario_email?: string
  destinatario_telefone?: string
  
  // Endereço
  destinatario_logradouro?: string
  destinatario_numero?: string
  destinatario_complemento?: string
  destinatario_bairro?: string
  destinatario_cidade?: string
  destinatario_uf?: string
  destinatario_cep?: string
  destinatario_codigo_municipio?: string
  
  // Totais
  valor_produtos: number
  valor_frete: number
  valor_seguro: number
  valor_desconto: number
  valor_outras_despesas: number
  valor_total: number
  
  // Impostos
  base_calculo_icms: number
  valor_icms: number
  base_calculo_icms_st: number
  valor_icms_st: number
  valor_ipi: number
  valor_pis: number
  valor_cofins: number
  valor_aproximado_tributos: number // Lei da Transparência
  
  // Transporte
  modalidade_frete: '0' | '1' | '2' | '3' | '4' | '9' // 0=Emitente, 1=Destinatário, 9=Sem frete
  transportadora_cpf_cnpj?: string
  transportadora_nome?: string
  transportadora_ie?: string
  transportadora_endereco?: string
  transportadora_municipio?: string
  transportadora_uf?: string
  veiculo_placa?: string
  veiculo_uf?: string
  volume_quantidade?: number
  volume_especie?: string
  volume_peso_bruto?: number
  volume_peso_liquido?: number
  
  // Pagamento
  forma_pagamento: '0' | '1' // 0=À vista, 1=À prazo
  meio_pagamento?: string // 01=Dinheiro, 02=Cheque, 03=Cartão Crédito, etc
  valor_pago?: number
  valor_troco?: number
  
  // Status
  status: 'RASCUNHO' | 'PROCESSANDO' | 'AUTORIZADA' | 'CANCELADA' | 'DENEGADA' | 'REJEITADA' | 'INUTILIZADA'
  status_sefaz?: string
  codigo_status_sefaz?: string
  motivo_status?: string
  
  // XML e Protocolo
  xml_enviado?: string
  xml_autorizado?: string
  protocolo_autorizacao?: string
  data_autorizacao?: string
  
  // Integração Nuvem Fiscal
  nuvem_fiscal_id?: string
  
  // Cancelamento
  data_cancelamento?: string
  protocolo_cancelamento?: string
  protocolo_evento_cancelamento?: string
  motivo_cancelamento?: string
  justificativa_cancelamento?: string
  
  // Contingência
  em_contingencia: boolean
  tipo_contingencia?: string
  motivo_contingencia?: string
  
  // Observações
  informacoes_complementares?: string
  informacoes_fisco?: string
  
  // Controle
  usuario_id?: string | number
  created_at?: string
  updated_at?: string
}

/**
 * ITEM DA NOTA FISCAL
 */
export interface NotaFiscalItem {
  id: string | number
  nota_fiscal_id: string | number
  numero_item: number
  
  // Produto
  produto_id?: string | number
  codigo_produto: string
  codigo_barras?: string
  descricao: string
  ncm: string
  cest?: string
  cfop: string
  unidade_comercial: string
  
  // Quantidades e Valores
  quantidade_comercial: number
  valor_unitario_comercial: number
  valor_bruto: number
  valor_desconto: number
  valor_frete: number
  valor_seguro: number
  valor_outras_despesas: number
  valor_total: number
  
  // Unidade Tributável (pode ser diferente da comercial)
  unidade_tributavel: string
  quantidade_tributavel: number
  valor_unitario_tributavel: number
  
  // Impostos - ICMS
  origem_mercadoria: string // 0 a 8
  cst_icms?: string
  csosn_icms?: string
  modalidade_bc_icms?: string
  reducao_bc_icms?: number
  base_calculo_icms: number
  aliquota_icms: number
  valor_icms: number
  
  // ICMS ST
  modalidade_bc_icms_st?: string
  mva_st?: number
  reducao_bc_icms_st?: number
  base_calculo_icms_st: number
  aliquota_icms_st: number
  valor_icms_st: number
  
  // ICMS Desoneração
  valor_icms_desoneracao?: number
  motivo_desoneracao?: string
  
  // PIS
  cst_pis?: string
  base_calculo_pis: number
  aliquota_pis: number
  valor_pis: number
  
  // COFINS
  cst_cofins?: string
  base_calculo_cofins: number
  aliquota_cofins: number
  valor_cofins: number
  
  // IPI
  cst_ipi?: string
  cnpj_produtor?: string
  codigo_selo?: string
  quantidade_selo?: number
  enquadramento_ipi?: string
  base_calculo_ipi: number
  aliquota_ipi: number
  valor_ipi: number
  
  // Informações Adicionais
  informacoes_adicionais?: string
  
  created_at?: string
  updated_at?: string
}

/**
 * FORM DATA PARA EMISSÃO DE NOTA
 */
export interface NotaFiscalFormData {
  // Empresa Emissora
  empresa_id?: number
  
  tipo_nota: 'NFE' | 'NFCE'
  serie: number
  natureza_operacao: string
  finalidade: '1' | '2' | '3' | '4'
  
  // Cliente
  cliente_id?: string | number
  destinatario_tipo?: 'FISICA' | 'JURIDICA'
  destinatario_cpf_cnpj?: string
  destinatario_nome?: string
  destinatario_ie?: string
  destinatario_indicador_ie?: 'CONTRIBUINTE' | 'ISENTO' | 'NAO_CONTRIBUINTE'
  destinatario_email?: string
  destinatario_telefone?: string
  destinatario_logradouro?: string
  destinatario_numero?: string
  destinatario_complemento?: string
  destinatario_bairro?: string
  destinatario_cidade?: string
  destinatario_uf?: string
  destinatario_cep?: string
  destinatario_codigo_municipio?: string
  
  // Itens
  itens: NotaFiscalItemFormData[]
  
  // Totais
  valor_frete?: number
  valor_seguro?: number
  valor_desconto?: number
  valor_outras_despesas?: number
  
  // Transporte
  modalidade_frete: '0' | '1' | '2' | '3' | '4' | '9'
  transportadora_cpf_cnpj?: string
  transportadora_nome?: string
  veiculo_placa?: string
  veiculo_uf?: string
  volume_quantidade?: number
  volume_especie?: string
  volume_peso_bruto?: number
  volume_peso_liquido?: number
  
  // Pagamento
  forma_pagamento: '0' | '1'
  meio_pagamento?: string
  valor_pago?: number
  
  // Observações
  informacoes_complementares?: string
  informacoes_fisco?: string
}

export interface NotaFiscalItemFormData {
  produto_id?: string | number
  codigo_produto?: string
  produto_codigo?: string
  produto_descricao?: string
  descricao?: string
  ncm: string
  cest?: string
  cfop: string
  unidade?: string
  unidade_comercial?: string
  quantidade?: number
  quantidade_comercial?: number
  valor_unitario?: number
  valor_unitario_comercial?: number
  valor_total?: number
  valor_desconto?: number
  valor_frete?: number
  valor_seguro?: number
  valor_outras_despesas?: number
  operacao_fiscal_id?: string | number
  aliquota_iss?: number
  item_lista_servico?: string
  
  // Vínculo direto com regra de tributação (opcional)
  regra_tributacao_id?: number
  
  // Campos calculados pelo Motor Fiscal
  origem_mercadoria?: string
  
  // ICMS
  icms_origem?: string
  icms_cst?: string
  cst_icms?: string
  csosn_icms?: string
  modalidade_bc_icms?: string
  reducao_bc_icms?: number
  icms_base_calculo?: number
  base_calculo_icms?: number
  icms_aliquota?: number
  aliquota_icms?: number
  icms_valor?: number
  valor_icms?: number
  
  // ICMS-ST
  modalidade_bc_icms_st?: string
  mva_st?: number
  reducao_bc_icms_st?: number
  base_calculo_icms_st?: number
  aliquota_icms_st?: number
  valor_icms_st?: number
  
  // PIS
  pis_cst?: string
  cst_pis?: string
  pis_base_calculo?: number
  base_calculo_pis?: number
  pis_aliquota?: number
  aliquota_pis?: number
  pis_valor?: number
  valor_pis?: number
  
  // COFINS
  cofins_cst?: string
  cst_cofins?: string
  cofins_base_calculo?: number
  base_calculo_cofins?: number
  cofins_aliquota?: number
  aliquota_cofins?: number
  cofins_valor?: number
  valor_cofins?: number
  
  // IPI
  cst_ipi?: string
  base_calculo_ipi?: number
  aliquota_ipi?: number
  valor_ipi?: number
  
  // ISS (NFS-e)
  base_calculo_iss?: number
  valor_iss?: number
  retencao_iss?: boolean
  codigo_tributacao_municipio?: string
  municipio_incidencia_iss?: string
  
  // IBS e CBS (Reforma Tributária)
  ibs_aliquota?: number
  ibs_valor?: number
  cbs_aliquota?: number
  cbs_valor?: number
  
  // Retenções
  aliquota_ir?: number
  valor_ir?: number
  aliquota_csll?: number
  valor_csll?: number
  aliquota_inss?: number
  valor_inss?: number
  
  // Totais
  valor_total_tributos?: number
  
  // Mensagens fiscais
  mensagens_fiscais?: string[]
}

/**
 * EVENTO DA NOTA FISCAL (Cancelamento, Carta de Correção, etc)
 */
export interface NotaFiscalEvento {
  id: string | number
  nota_fiscal_id: string | number
  tipo_evento: 'CANCELAMENTO' | 'CARTA_CORRECAO' | 'MANIFESTACAO' | 'EPEC'
  sequencia_evento: number
  chave_acesso: string
  data_evento: string
  descricao_evento: string
  protocolo?: string
  xml_evento?: string
  status: 'PENDENTE' | 'REGISTRADO' | 'REJEITADO'
  codigo_status?: string
  motivo?: string
  created_at?: string
  updated_at?: string
}

/**
 * RETORNO DA SEFAZ
 */
export interface RetornoSEFAZ {
  sucesso: boolean
  codigo: string
  mensagem: string
  chave_acesso?: string
  protocolo?: string
  data_autorizacao?: string
  xml_retorno?: string
  xml_protocolo?: string
}

/**
 * CONFIGURAÇÕES DE EMISSÃO
 */
export interface ConfiguracaoEmissao {
  ambiente: 'PRODUCAO' | 'HOMOLOGACAO'
  tipo_emissao: '1' | '6' | '7' // 1=Normal, 6=SVC-AN, 7=SVC-RS
  certificado_id: string | number
  serie_nfe: number
  serie_nfce: number
  proximo_numero_nfe: number
  proximo_numero_nfce: number
  csc_id?: string
  csc_codigo?: string
}

/**
 * CONSTANTES
 */
export const FINALIDADES_NOTA = [
  { value: '1', label: '1 - NF-e Normal' },
  { value: '2', label: '2 - NF-e Complementar' },
  { value: '3', label: '3 - NF-e de Ajuste' },
  { value: '4', label: '4 - Devolução de Mercadoria' }
]

export const MODALIDADES_FRETE = [
  { value: '0', label: '0 - Emitente (CIF)' },
  { value: '1', label: '1 - Destinatário (FOB)' },
  { value: '2', label: '2 - Terceiros' },
  { value: '3', label: '3 - Próprio (remetente)' },
  { value: '4', label: '4 - Próprio (destinatário)' },
  { value: '9', label: '9 - Sem Frete' }
]

export const FORMAS_PAGAMENTO = [
  { value: '0', label: '0 - À Vista' },
  { value: '1', label: '1 - À Prazo' }
]

export const MEIOS_PAGAMENTO = [
  { value: '01', label: '01 - Dinheiro' },
  { value: '02', label: '02 - Cheque' },
  { value: '03', label: '03 - Cartão de Crédito' },
  { value: '04', label: '04 - Cartão de Débito' },
  { value: '05', label: '05 - Crédito Loja' },
  { value: '10', label: '10 - Vale Alimentação' },
  { value: '11', label: '11 - Vale Refeição' },
  { value: '12', label: '12 - Vale Presente' },
  { value: '13', label: '13 - Vale Combustível' },
  { value: '15', label: '15 - Boleto Bancário' },
  { value: '90', label: '90 - Sem Pagamento' },
  { value: '99', label: '99 - Outros' }
]

export const STATUS_NOTA_CORES = {
  RASCUNHO: 'bg-gray-100 text-gray-800',
  PROCESSANDO: 'bg-blue-100 text-blue-800',
  AUTORIZADA: 'bg-green-100 text-green-800',
  CANCELADA: 'bg-red-100 text-red-800',
  DENEGADA: 'bg-orange-100 text-orange-800',
  REJEITADA: 'bg-red-100 text-red-800',
  INUTILIZADA: 'bg-gray-100 text-gray-800'
}
