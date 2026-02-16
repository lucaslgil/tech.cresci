// =====================================================
// TIPOS - INTEGRAÇÃO NF-e/NFC-e
// Definições de tipos para emissão de notas fiscais
// =====================================================

export interface NotaFiscalDados {
  // Identificação
  empresa_id: number
  numero: number
  serie: number
  tipo_nota: 'NFE' | 'NFCE'
  modelo: '55' | '65'
  tipo_emissao: 'NORMAL' | 'CONTINGENCIA'
  ambiente: 'PRODUCAO' | 'HOMOLOGACAO'
  finalidade: 'NORMAL' | 'COMPLEMENTAR' | 'AJUSTE' | 'DEVOLUCAO'
  natureza_operacao?: string
  
  // Emitente
  emitente: {
    cnpj: string
    razao_social: string
    nome_fantasia?: string
    inscricao_estadual: string
    inscricao_municipal?: string
    regime_tributario: 'SIMPLES' | 'PRESUMIDO' | 'REAL'
    crt: '1' | '2' | '3'
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    uf: string
    cep: string
    codigo_municipio: string
    telefone?: string
    email?: string
  }
  
  // Destinatário
  destinatario: {
    tipo_pessoa: 'FISICA' | 'JURIDICA' | 'ESTRANGEIRO'
    cpf_cnpj: string
    nome_razao: string
    inscricao_estadual?: string
    indicador_ie: 'CONTRIBUINTE' | 'ISENTO' | 'NAO_CONTRIBUINTE'
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    uf: string
    cep: string
    codigo_municipio: string
    telefone?: string
    email?: string
    
    // Campos para exportação
    pais_codigo?: string  // Código Bacen (ex: 1058=Brasil, 0132=Argentina)
    pais_nome?: string    // Nome do país
  }
  
  // Produtos/Serviços
  itens: ItemNotaFiscal[]
  
  // Totais
  totais: {
    valor_produtos: number
    valor_frete: number
    valor_seguro: number
    valor_desconto: number
    valor_outras_despesas: number
    outras_despesas?: number
    valor_total_tributos: number
    valor_total: number
    
    // ICMS
    base_calculo_icms: number
    valor_icms: number
    valor_icms_desonerado: number
    
    // ICMS ST
    base_calculo_icms_st: number
    valor_icms_st: number
    
    // PIS
    valor_pis: number
    
    // COFINS
    valor_cofins: number
    
    // IPI
    valor_ipi: number
    
    // CBS/IBS (Reforma Tributária)
    valor_cbs?: number
    valor_ibs?: number
  }
  
  // Transporte
  transporte?: {
    modalidade: 'EMITENTE' | 'DESTINATARIO' | 'TERCEIROS' | 'PROPRIO' | 'SEM_FRETE'
    transportadora?: {
      cpf_cnpj?: string
      nome_razao?: string
      inscricao_estadual?: string
      endereco?: string
      cidade?: string
      uf?: string
    }
    veiculo?: {
      placa?: string
      uf?: string
    }
    volumes?: {
      quantidade?: number
      especie?: string
      marca?: string
      numeracao?: string
      peso_liquido?: number
      peso_bruto?: number
    }[]
  }
  
  // Pagamento
  pagamento?: {
    forma_pagamento: 'DINHEIRO' | 'CHEQUE' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX' | 'BOLETO' | 'OUTROS'
    valor_pago?: number
    troco?: number
  }
  
  // Informações Adicionais
  informacoes_complementares?: string
  informacoes_fisco?: string
  
  // Dados específicos de Exportação (CFOP 7xxx)
  exportacao?: {
    uf_embarque: string                    // UF de saída para o exterior
    local_embarque: string                 // Porto, aeroporto, fronteira terrestre
    local_despacho?: string                // Local de despacho (opcional)
    tipo_operacao: '1' | '2' | '3'         // 1=Venda direta, 2=Intermediada por trading, 3=Outras
  }
}

export interface ItemNotaFiscal {
  numero_item: number
  codigo_produto: string
  descricao: string
  ncm: string
  cfop: string
  unidade: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  valor_desconto?: number
  valor_outras_despesas?: number
  
  // Impostos
  impostos: {
    // ICMS
    icms: {
      origem: '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
      cst: string
      modalidade_bc?: string
      base_calculo?: number
      aliquota?: number
      valor?: number
    }
    
    // IPI
    ipi?: {
      cst: string
      base_calculo?: number
      aliquota?: number
      valor?: number
    }
    
    // PIS
    pis: {
      cst: string
      base_calculo?: number
      aliquota?: number
      valor?: number
    }
    
    // COFINS
    cofins: {
      cst: string
      base_calculo?: number
      aliquota?: number
      valor?: number
    }
    
    // CBS/IBS (Reforma Tributária)
    cbs?: {
      aliquota?: number
      valor?: number
    }
    
    ibs?: {
      aliquota?: number
      valor?: number
    }
  }
  
  // Tributação Aproximada (Lei da Transparência)
  valor_total_tributos?: number
}

export interface RetornoSEFAZ {
  status: 'AUTORIZADA' | 'REJEITADA' | 'PROCESSANDO' | 'ERRO' | 'CANCELADA' | 'DENEGADA'
  chaveAcesso?: string
  numeroProtocolo?: string
  dataHoraAutorizacao?: string
  codigo?: string
  codigo_status?: string
  mensagem: string
  xmlAssinado?: string
  xmlRetorno?: string
  xml_autorizado?: string
  xml_assinado?: string
  nuvemFiscalId?: string // ID interno da Nuvem Fiscal para referências futuras
  erros?: {
    codigo: string
    mensagem: string
  }[]
}

export interface ConfiguracaoNFe {
  ambiente: 'PRODUCAO' | 'HOMOLOGACAO'
  certificado?: {
    tipo: 'A1' | 'A3'
    arquivo?: ArrayBuffer
    senha?: string
  }
  csc?: {
    id: string
    codigo: string
  }
  api_intermediaria?: {
    provider: 'FOCUS' | 'TECNOSPEED' | 'ENOTAS' | 'DIRETO'
    token?: string
    base_url?: string
  }
}
