// =====================================================
// MOTOR FISCAL ATUALIZADO - VERSÃO 2.0
// Suporta NF-e, NFC-e e NFS-e com validações completas
// Data: 05/01/2026
// =====================================================

import { regrasTributacaoService } from './regrasTributacaoService'
import type { NotaFiscalItemFormData } from './types'

interface ContextoFiscal {
  empresaId: number
  tipoDocumento: 'NFE' | 'NFCE' | 'NFSE' // OBRIGATÓRIO
  tipoOperacao: string
  ufOrigem: string
  ufDestino: string
  regimeEmitente?: 'SIMPLES' | 'PRESUMIDO' | 'REAL'
  clienteContribuinte?: boolean
  cfop?: string
}

interface ResultadoValidacao {
  valido: boolean
  erros: Array<{
    codigo: string
    mensagem: string
    bloqueante: boolean
  }>
}

interface TributosCalculados {
  // Identificação
  origem_mercadoria: string
  
  // ICMS (apenas para NF-e/NFC-e)
  cst_icms?: string
  csosn_icms?: string
  modalidade_bc_icms?: string
  reducao_bc_icms: number
  base_calculo_icms: number
  aliquota_icms: number
  valor_icms: number
  
  // ICMS-ST (apenas para NF-e/NFC-e)
  modalidade_bc_icms_st?: string
  mva_st: number
  reducao_bc_icms_st: number
  base_calculo_icms_st: number
  aliquota_icms_st: number
  valor_icms_st: number
  
  // PIS/COFINS (todos os documentos)
  cst_pis?: string
  base_calculo_pis: number
  aliquota_pis: number
  valor_pis: number
  
  cst_cofins?: string
  base_calculo_cofins: number
  aliquota_cofins: number
  valor_cofins: number
  
  // IPI (apenas para NF-e/NFC-e)
  cst_ipi?: string
  base_calculo_ipi: number
  aliquota_ipi: number
  valor_ipi: number
  
  // ISS (apenas para NFS-e)
  aliquota_iss?: number
  base_calculo_iss?: number
  valor_iss?: number
  retencao_iss?: boolean
  item_lista_servico?: string
  codigo_tributacao_municipio?: string
  municipio_incidencia_iss?: string
  
  // Retenções (NFS-e)
  aliquota_ir?: number
  valor_ir?: number
  aliquota_csll?: number
  valor_csll?: number
  aliquota_inss?: number
  valor_inss?: number
  
  // Mensagens fiscais
  mensagens_fiscais?: string[]
}

/**
 * Valida se o documento fiscal está conforme a legislação antes de calcular tributos
 */
export async function validarDocumentoFiscal(
  tipoDocumento: 'NFE' | 'NFCE' | 'NFSE',
  _regimeEmitente: string,
  itens: NotaFiscalItemFormData[]
): Promise<ResultadoValidacao> {
  const erros: Array<{ codigo: string; mensagem: string; bloqueante: boolean }> = []
  
  for (const item of itens) {
    // Validações para NF-e e NFC-e (produtos)
    if (tipoDocumento === 'NFE' || tipoDocumento === 'NFCE') {
      // NCM obrigatório
      if (!item.ncm || item.ncm.length !== 8) {
        erros.push({
          codigo: 'NFE_NCM_OBRIGATORIO',
          mensagem: `Item "${item.descricao}": NCM é obrigatório e deve ter 8 dígitos`,
          bloqueante: true
        })
      }
      
      // CFOP obrigatório
      if (!item.cfop) {
        erros.push({
          codigo: 'NFE_CFOP_OBRIGATORIO',
          mensagem: `Item "${item.descricao}": CFOP é obrigatório`,
          bloqueante: true
        })
      }
    }
    
    // Validações para NFS-e (serviços)
    if (tipoDocumento === 'NFSE') {
      // ISS obrigatório
      if (!item.aliquota_iss || item.aliquota_iss === 0) {
        erros.push({
          codigo: 'NFSE_ISS_OBRIGATORIO',
          mensagem: `Item "${item.descricao}": Alíquota ISS é obrigatória para NFS-e`,
          bloqueante: true
        })
      }
      
      // Item da lista de serviços obrigatório
      if (!item.item_lista_servico) {
        erros.push({
          codigo: 'NFSE_ITEM_LISTA_LC116',
          mensagem: `Item "${item.descricao}": Item da Lista de Serviços LC 116/2003 é obrigatório`,
          bloqueante: true
        })
      }
    }
  }
  
  const temErrosBloqueantes = erros.some(e => e.bloqueante)
  
  return {
    valido: !temErrosBloqueantes,
    erros
  }
}

/**
 * Busca a regra de tributação mais específica para o item
 */
async function buscarRegraTributacao(
  item: NotaFiscalItemFormData,
  contexto: ContextoFiscal
): Promise<any | null> {
  try {
    const { data: regras } = await regrasTributacaoService.listar(contexto.empresaId)
    
    if (!regras || regras.length === 0) {
      return null
    }
    
    // Filtrar regras aplicáveis
    const regrasAplicaveis = regras.filter(r => {
      if (!r.ativo) return false
      
      // Tipo de documento deve corresponder (ou ser genérico)
      if (r.tipo_documento && r.tipo_documento !== contexto.tipoDocumento) return false
      
      // NCM (prioridade alta)
      if (r.ncm && r.ncm !== item.ncm) return false
      
      // CEST
      if (r.cest && r.cest !== item.cest) return false
      
      // UF Origem/Destino
      if (r.uf_origem && r.uf_origem !== contexto.ufOrigem) return false
      if (r.uf_destino && r.uf_destino !== contexto.ufDestino) return false
      
      // CFOP
      if (r.cfop_saida && r.cfop_saida !== contexto.cfop) return false
      
      // Operação Fiscal
      if (r.operacao_fiscal && r.operacao_fiscal !== contexto.tipoOperacao) return false
      
      return true
    })
    
    if (regrasAplicaveis.length === 0) {
      return null
    }
    
    // Ordenar por prioridade (maior primeiro)
    regrasAplicaveis.sort((a, b) => {
      const prioridadeA = a.prioridade || 0
      const prioridadeB = b.prioridade || 0
      return prioridadeB - prioridadeA
    })
    
    // Retornar a regra mais específica
    return regrasAplicaveis[0]
  } catch (error) {
    console.error('Erro ao buscar regra de tributação:', error)
    return null
  }
}

/**
 * Aplica o motor fiscal no item calculando todos os tributos
 * @deprecated Use processarNotaFiscalCompleta para processar a nota inteira
 */
export async function aplicarMotorFiscalNoItem(item: NotaFiscalItemFormData, contexto: ContextoFiscal): Promise<TributosCalculados> {
  // Valores base do item
  const valor_bruto = (item.quantidade_comercial || 0) * (item.valor_unitario_comercial || 0)
  const valor_desconto = item.valor_desconto || 0
  const valor_frete = item.valor_frete || 0
  const valor_seguro = item.valor_seguro || 0
  const valor_outras_despesas = item.valor_outras_despesas || 0
  const valor_total = valor_bruto - valor_desconto + valor_frete + valor_seguro + valor_outras_despesas
  
  // Buscar regra de tributação
  const regra = await buscarRegraTributacao(item, contexto)
  
  // Resultado padrão
  const resultado: TributosCalculados = {
    origem_mercadoria: regra?.origem_mercadoria || '0',
    reducao_bc_icms: 0,
    base_calculo_icms: 0,
    aliquota_icms: 0,
    valor_icms: 0,
    mva_st: 0,
    reducao_bc_icms_st: 0,
    base_calculo_icms_st: 0,
    aliquota_icms_st: 0,
    valor_icms_st: 0,
    base_calculo_pis: 0,
    aliquota_pis: 0,
    valor_pis: 0,
    base_calculo_cofins: 0,
    aliquota_cofins: 0,
    valor_cofins: 0,
    base_calculo_ipi: 0,
    aliquota_ipi: 0,
    valor_ipi: 0,
    mensagens_fiscais: []
  }
  
  // ==========================================
  // CÁLCULOS PARA NF-e e NFC-e (PRODUTOS)
  // ==========================================
  if (contexto.tipoDocumento === 'NFE' || contexto.tipoDocumento === 'NFCE') {
    if (regra) {
      // Usar CSOSN para Simples Nacional, CST para Regime Normal
      if (contexto.regimeEmitente === 'SIMPLES') {
        resultado.csosn_icms = regra.csosn_icms
      } else {
        resultado.cst_icms = regra.cst_icms
      }
      
      resultado.modalidade_bc_icms = regra.modalidade_bc_icms
      resultado.reducao_bc_icms = Number(regra.reducao_bc_icms || 0)
      resultado.aliquota_icms = Number(regra.aliquota_icms || 0)
      
      // Base de cálculo ICMS
      resultado.base_calculo_icms = valor_total * (1 - resultado.reducao_bc_icms / 100)
      resultado.valor_icms = resultado.base_calculo_icms * (resultado.aliquota_icms / 100)
      
      // ICMS-ST
      if (regra.mva_st && regra.mva_st > 0) {
        resultado.modalidade_bc_icms_st = regra.modalidade_bc_st
        resultado.mva_st = Number(regra.mva_st || 0)
        resultado.aliquota_icms_st = Number(regra.aliquota_icms_st || 0)
        resultado.reducao_bc_icms_st = Number(regra.reducao_bc_st || 0)
        
        // Calcular base ST: (valor_total + IPI) * (1 + MVA/100)
        const valor_ipi_base = valor_total * (Number(regra.aliquota_ipi || 0) / 100)
        resultado.base_calculo_icms_st = (valor_total + valor_ipi_base) * (1 + resultado.mva_st / 100) * (1 - resultado.reducao_bc_icms_st / 100)
        
        // Valor ICMS-ST = (BC ST * Aliq ST) - ICMS próprio
        const icms_st_total = resultado.base_calculo_icms_st * (resultado.aliquota_icms_st / 100)
        resultado.valor_icms_st = Math.max(0, icms_st_total - resultado.valor_icms)
      }
      
      // IPI
      resultado.cst_ipi = regra.cst_ipi
      resultado.aliquota_ipi = Number(regra.aliquota_ipi || 0)
      resultado.base_calculo_ipi = valor_total
      resultado.valor_ipi = resultado.base_calculo_ipi * (resultado.aliquota_ipi / 100)
      
      // PIS
      resultado.cst_pis = regra.cst_pis
      resultado.aliquota_pis = Number(regra.aliquota_pis || 0)
      resultado.base_calculo_pis = valor_total
      resultado.valor_pis = resultado.base_calculo_pis * (resultado.aliquota_pis / 100)
      
      // COFINS
      resultado.cst_cofins = regra.cst_cofins
      resultado.aliquota_cofins = Number(regra.aliquota_cofins || 0)
      resultado.base_calculo_cofins = valor_total
      resultado.valor_cofins = resultado.base_calculo_cofins * (resultado.aliquota_cofins / 100)
      
      // Mensagens fiscais
      if (regra.mensagem_nf_icms) resultado.mensagens_fiscais?.push(regra.mensagem_nf_icms)
      if (regra.mensagem_nf_pis) resultado.mensagens_fiscais?.push(regra.mensagem_nf_pis)
      if (regra.mensagem_nf_cofins) resultado.mensagens_fiscais?.push(regra.mensagem_nf_cofins)
      if (regra.mensagem_nf_ipi) resultado.mensagens_fiscais?.push(regra.mensagem_nf_ipi)
    }
  }
  
  // ==========================================
  // CÁLCULOS PARA NFS-e (SERVIÇOS)
  // ==========================================
  if (contexto.tipoDocumento === 'NFSE') {
    if (regra) {
      // ISS
      resultado.aliquota_iss = Number(regra.aliquota_iss || 0)
      resultado.base_calculo_iss = valor_total
      resultado.valor_iss = (resultado.base_calculo_iss || 0) * (resultado.aliquota_iss / 100)
      resultado.retencao_iss = regra.retencao_iss || false
      resultado.item_lista_servico = regra.item_lista_servico_lc116
      resultado.codigo_tributacao_municipio = regra.codigo_tributacao_municipio_iss
      resultado.municipio_incidencia_iss = regra.municipio_incidencia_iss
      
      // PIS
      resultado.cst_pis = regra.cst_pis
      resultado.aliquota_pis = Number(regra.aliquota_pis || 0)
      resultado.base_calculo_pis = valor_total
      resultado.valor_pis = resultado.base_calculo_pis * (resultado.aliquota_pis / 100)
      
      // COFINS
      resultado.cst_cofins = regra.cst_cofins
      resultado.aliquota_cofins = Number(regra.aliquota_cofins || 0)
      resultado.base_calculo_cofins = valor_total
      resultado.valor_cofins = resultado.base_calculo_cofins * (resultado.aliquota_cofins / 100)
      
      // IR
      resultado.aliquota_ir = Number(regra.aliquota_ir || 0)
      resultado.valor_ir = valor_total * (resultado.aliquota_ir / 100)
      
      // CSLL
      resultado.aliquota_csll = Number(regra.aliquota_csll || 0)
      resultado.valor_csll = valor_total * (resultado.aliquota_csll / 100)
      
      // INSS
      resultado.aliquota_inss = Number(regra.aliquota_inss || 0)
      resultado.valor_inss = valor_total * (resultado.aliquota_inss / 100)
      
      // Mensagens fiscais
      if (regra.mensagem_nf_iss) resultado.mensagens_fiscais?.push(regra.mensagem_nf_iss)
      if (regra.mensagem_nf_pis) resultado.mensagens_fiscais?.push(regra.mensagem_nf_pis)
      if (regra.mensagem_nf_cofins) resultado.mensagens_fiscais?.push(regra.mensagem_nf_cofins)
      if (regra.mensagem_nf_ir) resultado.mensagens_fiscais?.push(regra.mensagem_nf_ir)
      if (regra.mensagem_nf_csll) resultado.mensagens_fiscais?.push(regra.mensagem_nf_csll)
      if (regra.mensagem_nf_inss) resultado.mensagens_fiscais?.push(regra.mensagem_nf_inss)
    }
  }
  
  return resultado
}

/**
 * Processa todos os itens da nota fiscal aplicando o motor fiscal
 */
export async function processarNotaFiscalCompleta(
  itens: NotaFiscalItemFormData[],
  contexto: ContextoFiscal
): Promise<{
  itensTributados: Array<NotaFiscalItemFormData & TributosCalculados>
  totais: {
    valor_produtos: number
    valor_desconto: number
    valor_frete: number
    valor_seguro: number
    valor_outras_despesas: number
    valor_total: number
    base_calculo_icms: number
    valor_icms: number
    base_calculo_icms_st: number
    valor_icms_st: number
    valor_ipi: number
    valor_pis: number
    valor_cofins: number
    valor_iss?: number
    valor_ir?: number
    valor_csll?: number
    valor_inss?: number
  }
  mensagens_fiscais: string[]
  validacao: ResultadoValidacao
}> {
  // Validar documento antes de processar
  const validacao = await validarDocumentoFiscal(
    contexto.tipoDocumento,
    contexto.regimeEmitente || 'SIMPLES',
    itens
  )
  
  // Se houver erros bloqueantes, não processar
  if (!validacao.valido) {
    return {
      itensTributados: [],
      totais: {
        valor_produtos: 0,
        valor_desconto: 0,
        valor_frete: 0,
        valor_seguro: 0,
        valor_outras_despesas: 0,
        valor_total: 0,
        base_calculo_icms: 0,
        valor_icms: 0,
        base_calculo_icms_st: 0,
        valor_icms_st: 0,
        valor_ipi: 0,
        valor_pis: 0,
        valor_cofins: 0
      },
      mensagens_fiscais: [],
      validacao
    }
  }
  
  // Processar cada item
  const itensTributados: Array<NotaFiscalItemFormData & TributosCalculados> = []
  const mensagensFiscaisSet = new Set<string>()
  
  const totais = {
    valor_produtos: 0,
    valor_desconto: 0,
    valor_frete: 0,
    valor_seguro: 0,
    valor_outras_despesas: 0,
    valor_total: 0,
    base_calculo_icms: 0,
    valor_icms: 0,
    base_calculo_icms_st: 0,
    valor_icms_st: 0,
    valor_ipi: 0,
    valor_pis: 0,
    valor_cofins: 0,
    valor_iss: 0,
    valor_ir: 0,
    valor_csll: 0,
    valor_inss: 0
  }
  
  for (const item of itens) {
    const tributosCalculados = await aplicarMotorFiscalNoItem(item, contexto)
    
    const itemCompleto = {
      ...item,
      ...tributosCalculados
    }
    
    itensTributados.push(itemCompleto)
    
    // Somar totais
    const valor_item = (item.quantidade_comercial || 0) * (item.valor_unitario_comercial || 0)
    totais.valor_produtos += valor_item
    totais.valor_desconto += item.valor_desconto || 0
    totais.valor_frete += item.valor_frete || 0
    totais.valor_seguro += item.valor_seguro || 0
    totais.valor_outras_despesas += item.valor_outras_despesas || 0
    
    totais.base_calculo_icms += tributosCalculados.base_calculo_icms
    totais.valor_icms += tributosCalculados.valor_icms
    totais.base_calculo_icms_st += tributosCalculados.base_calculo_icms_st
    totais.valor_icms_st += tributosCalculados.valor_icms_st
    totais.valor_ipi += tributosCalculados.valor_ipi
    totais.valor_pis += tributosCalculados.valor_pis
    totais.valor_cofins += tributosCalculados.valor_cofins
    
    if (tributosCalculados.valor_iss) totais.valor_iss += tributosCalculados.valor_iss
    if (tributosCalculados.valor_ir) totais.valor_ir += tributosCalculados.valor_ir
    if (tributosCalculados.valor_csll) totais.valor_csll += tributosCalculados.valor_csll
    if (tributosCalculados.valor_inss) totais.valor_inss += tributosCalculados.valor_inss
    
    // Coletar mensagens fiscais
    if (tributosCalculados.mensagens_fiscais) {
      tributosCalculados.mensagens_fiscais.forEach(msg => mensagensFiscaisSet.add(msg))
    }
  }
  
  totais.valor_total = totais.valor_produtos - totais.valor_desconto + totais.valor_frete + totais.valor_seguro + totais.valor_outras_despesas
  
  return {
    itensTributados,
    totais,
    mensagens_fiscais: Array.from(mensagensFiscaisSet),
    validacao
  }
}
