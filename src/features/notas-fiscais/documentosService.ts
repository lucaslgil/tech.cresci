// =====================================================
// SERVIÇO DE DOCUMENTOS NF-e
// Geração de XML, Espelho e DANFE
// Data: 23/01/2026
// =====================================================

import type { NotaFiscalFormData } from './types'
import { XMLGenerator } from '../../services/nfe/xmlGenerator'
import type { NotaFiscalDados } from '../../services/nfe/types'

/**
 * Converte NotaFiscalFormData para o formato NotaFiscalDados (API)
 */
function converterParaFormatoAPI(notaFiscal: NotaFiscalFormData, empresa: any): NotaFiscalDados {
  // Mapear finalidade
  let finalidadeNota: 'NORMAL' | 'COMPLEMENTAR' | 'AJUSTE' | 'DEVOLUCAO' = 'NORMAL'
  if (notaFiscal.finalidade === '1') finalidadeNota = 'NORMAL'
  else if (notaFiscal.finalidade === '2') finalidadeNota = 'COMPLEMENTAR'
  else if (notaFiscal.finalidade === '3') finalidadeNota = 'AJUSTE'
  else if (notaFiscal.finalidade === '4') finalidadeNota = 'DEVOLUCAO'
  
  return {
    numero: 1, // Será definido no momento da transmissão
    serie: notaFiscal.serie || 1,
    tipo_nota: notaFiscal.tipo_nota === 'NFE' ? 'NFE' : 'NFCE',
    modelo: notaFiscal.tipo_nota === 'NFE' ? '55' : '65',
    ambiente: 'HOMOLOGACAO',
    tipo_emissao: 'NORMAL',
    finalidade: finalidadeNota,
    
    // Emitente
    emitente: {
      cnpj: empresa?.cnpj || '00000000000000',
      razao_social: empresa?.razao_social || '',
      nome_fantasia: empresa?.nome_fantasia || '',
      inscricao_estadual: empresa?.inscricao_estadual || '',
      regime_tributario: empresa?.regime_tributario || 'SIMPLES',
      crt: empresa?.crt || '1',
      logradouro: empresa?.logradouro || '',
      numero: empresa?.numero || 'S/N',
      complemento: empresa?.complemento || '',
      bairro: empresa?.bairro || '',
      codigo_municipio: empresa?.codigo_municipio || '0000000',
      cidade: empresa?.cidade || '',
      uf: empresa?.estado || 'SP',
      cep: empresa?.cep || '00000000',
      telefone: empresa?.telefone || '',
      email: empresa?.email || ''
    },
    
    // Destinatário
    destinatario: {
      cpf_cnpj: notaFiscal.destinatario_cpf_cnpj || '',
      nome_razao: notaFiscal.destinatario_nome || '',
      tipo_pessoa: notaFiscal.destinatario_tipo === 'FISICA' ? 'FISICA' : 'JURIDICA',
      indicador_ie: notaFiscal.destinatario_indicador_ie || 'CONTRIBUINTE',
      inscricao_estadual: '', // Será preenchido se contribuinte
      logradouro: notaFiscal.destinatario_logradouro || '',
      numero: notaFiscal.destinatario_numero || 'S/N',
      complemento: notaFiscal.destinatario_complemento || '',
      bairro: notaFiscal.destinatario_bairro || '',
      codigo_municipio: notaFiscal.destinatario_codigo_municipio || '0000000',
      cidade: notaFiscal.destinatario_cidade || '',
      uf: notaFiscal.destinatario_uf || 'SP',
      cep: notaFiscal.destinatario_cep || '00000000',
      telefone: notaFiscal.destinatario_telefone || '',
      email: notaFiscal.destinatario_email || ''
    },
    
    // Itens
    itens: notaFiscal.itens.map((item, index) => ({
      numero_item: index + 1,
      codigo_produto: item.codigo_produto || '',
      descricao: item.descricao || '',
      ncm: item.ncm,
      cfop: item.cfop,
      unidade: item.unidade_comercial || 'UN',
      quantidade: item.quantidade_comercial || 0,
      valor_unitario: item.valor_unitario_comercial || 0,
      valor_total: (item.quantidade_comercial || 0) * (item.valor_unitario_comercial || 0),
      valor_desconto: item.valor_desconto || 0,
      valor_total_tributos: 0,
      impostos: {
        icms: {
          origem: (item.origem_mercadoria || '0') as '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8',
          cst: item.cst_icms || '00',
          base_calculo: item.base_calculo_icms || 0,
          aliquota: item.aliquota_icms || 0,
          valor: item.valor_icms || 0
        },
        pis: {
          cst: item.cst_pis || '01',
          base_calculo: item.base_calculo_pis || 0,
          aliquota: item.aliquota_pis || 0,
          valor: item.valor_pis || 0
        },
        cofins: {
          cst: item.cst_cofins || '01',
          base_calculo: item.base_calculo_cofins || 0,
          aliquota: item.aliquota_cofins || 0,
          valor: item.valor_cofins || 0
        }
      }
    })),
    
    // Totais
    totais: {
      valor_produtos: notaFiscal.itens.reduce((sum, item) => sum + ((item.quantidade_comercial || 0) * (item.valor_unitario_comercial || 0)), 0),
      valor_desconto: 0,
      valor_frete: 0,
      valor_seguro: 0,
      valor_outras_despesas: 0,
      valor_total: notaFiscal.itens.reduce((sum, item) => sum + ((item.quantidade_comercial || 0) * (item.valor_unitario_comercial || 0)), 0),
      base_calculo_icms: notaFiscal.itens.reduce((sum, item) => sum + (item.base_calculo_icms || 0), 0),
      valor_icms: notaFiscal.itens.reduce((sum, item) => sum + (item.valor_icms || 0), 0),
      base_calculo_icms_st: 0,
      valor_icms_st: 0,
      valor_icms_desonerado: 0,
      valor_ipi: 0,
      valor_pis: notaFiscal.itens.reduce((sum, item) => sum + (item.valor_pis || 0), 0),
      valor_cofins: notaFiscal.itens.reduce((sum, item) => sum + (item.valor_cofins || 0), 0),
      valor_total_tributos: 0
    },
    
    informacoes_complementares: notaFiscal.informacoes_complementares || '',
    informacoes_fisco: ''
  }
}

/**
 * Baixa XML gerado localmente
 */
export async function baixarXMLLocal(notaFiscal: NotaFiscalFormData) {
  try {
    console.log('🔧 Gerando XML para validação...')
    console.log('Dados da nota:', notaFiscal)
    
    // Buscar dados da empresa
    const { data: empresa } = await import('../../lib/supabase').then(m => 
      m.supabase.from('empresas').select('*').eq('id', notaFiscal.empresa_id).single()
    )
    
    if (!empresa) {
      throw new Error('Empresa não encontrada')
    }
    
    // Buscar dados do cliente (se necessário)
    // TODO: Implementar busca do cliente se necessário
    
    // Converter para formato da API
    const dadosAPI = converterParaFormatoAPI(notaFiscal, empresa)
    
    console.log('📋 Dados convertidos para API:', dadosAPI)
    
    // Gerar XML usando o XMLGenerator
    const xml = XMLGenerator.gerar(dadosAPI)
    
    console.log('✅ XML gerado com sucesso!')
    console.log('📄 Tamanho do XML:', xml.length, 'caracteres')
    
    // Criar Blob e fazer download
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `NFe_${notaFiscal.tipo_nota}_Serie${notaFiscal.serie}_RASCUNHO.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    console.log('📥 Download iniciado!')
  } catch (error) {
    console.error('❌ Erro ao gerar XML:', error)
    alert(`Erro ao gerar XML: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Gera PDF "Espelho" (sem validade fiscal)
 * Para conferência antes do envio
 */
export async function gerarEspelhoNFe(notaFiscal: NotaFiscalFormData): Promise<Blob> {
  try {
    // Chamar endpoint do backend para gerar PDF
    const response = await fetch('/api/fiscal/nfe/espelho', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notaFiscal)
    })
    
    if (!response.ok) {
      throw new Error('Erro ao gerar espelho da NF-e')
    }
    
    const blob = await response.blob()
    return blob
  } catch (error) {
    console.error('Erro ao gerar espelho:', error)
    throw new Error('Falha ao gerar espelho da nota fiscal')
  }
}

/**
 * Baixa espelho da NF-e
 */
export function baixarEspelhoNFe(notaFiscal: NotaFiscalFormData) {
  // TODO: Implementar após backend estar pronto
  console.log('Gerando espelho para nota fiscal:', notaFiscal)
  alert('🚧 Função em desenvolvimento. Espelho será gerado após criação do endpoint no backend.')
  
  /*
  gerarEspelhoNFe(notaFiscal).then(blob => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Espelho_NFe_SEM_VALIDADE.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  })
  */
}

/**
 * Gera DANFE oficial (após autorização SEFAZ)
 */
export async function gerarDANFe(chaveAcesso: string): Promise<Blob> {
  try {
    // Chamar endpoint do backend para gerar DANFE com chave
    const response = await fetch(`/api/fiscal/nfe/danfe/${chaveAcesso}`, {
      method: 'GET'
    })
    
    if (!response.ok) {
      throw new Error('Erro ao gerar DANFE')
    }
    
    const blob = await response.blob()
    return blob
  } catch (error) {
    console.error('Erro ao gerar DANFE:', error)
    throw new Error('Falha ao gerar DANFE da nota fiscal')
  }
}

/**
 * Baixa DANFE oficial
 */
export function baixarDANFe(chaveAcesso: string, numeroNota: string) {
  gerarDANFe(chaveAcesso).then(blob => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `DANFE_NFe_${numeroNota}_${chaveAcesso.substring(0, 8)}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  })
}

/**
 * Constrói XML da NF-e conforme layout 4.00
 * TODO: Implementar após ajuste de tipos em NotaFiscalFormData
 */
/*
function construirXMLNFe(): string {
  // Placeholder - será implementado quando todos os campos estiverem corretos
  const dataEmissao = new Date().toISOString()
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe versao="4.00">
      <!-- Em desenvolvimento -->
      <ide>
        <dhEmi>${dataEmissao}</dhEmi>
      </ide>
    </infNFe>
  </NFe>
</nfeProc>`
}
*/

/**
 * Valida XML localmente antes do envio
 */
export async function validarXMLLocal(xml: string): Promise<{
  valido: boolean
  erros: string[]
}> {
  const erros: string[] = []
  
  // Validações básicas
  if (!xml.includes('<NFe')) {
    erros.push('Estrutura XML inválida')
  }
  
  if (!xml.includes('<emit>')) {
    erros.push('Dados do emitente não encontrados')
  }
  
  if (!xml.includes('<dest>')) {
    erros.push('Dados do destinatário não encontrados')
  }
  
  if (!xml.includes('<det ')) {
    erros.push('Nenhum item/produto encontrado')
  }
  
  return {
    valido: erros.length === 0,
    erros
  }
}
