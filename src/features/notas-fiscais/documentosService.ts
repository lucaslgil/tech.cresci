// =====================================================
// SERVIÇO DE DOCUMENTOS NF-e
// Geração de XML, Espelho e DANFE
// Data: 23/01/2026
// =====================================================

import type { NotaFiscalFormData } from './types'

/**
 * Gera XML da NF-e localmente (antes do envio à SEFAZ)
 * Usado para validação e pré-visualização
 * TODO: Implementar após ajuste de tipos em NotaFiscalFormData
 */
/*
export async function gerarXMLLocal(notaFiscal: NotaFiscalFormData): Promise<Blob> {
  try {
    // Montar estrutura XML conforme layout da NF-e 4.00
    const xml = construirXMLNFe(notaFiscal)
    
    // Converter para Blob para download
    const blob = new Blob([xml], { type: 'application/xml' })
    return blob
  } catch (error) {
    console.error('Erro ao gerar XML:', error)
    throw new Error('Falha ao gerar XML da nota fiscal')
  }
}
*/

/**
 * Baixa XML gerado localmente
 */
export function baixarXMLLocal(notaFiscal: NotaFiscalFormData) {
  // TODO: Implementar após definir campos corretos em NotaFiscalFormData
  console.log('Gerando XML para nota fiscal:', notaFiscal)
  alert('🚧 Função em desenvolvimento. XML será gerado após ajuste dos campos da NF-e.')
  
  /* 
  gerarXMLLocal(notaFiscal).then(blob => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `NFe_RASCUNHO.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  })
  */
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
