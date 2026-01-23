// =====================================================
// SERVIÇO DE DOCUMENTOS NF-e
// Geração de XML, Espelho e DANFE
// Data: 23/01/2026
// =====================================================

import type { NotaFiscalFormData } from './types'

/**
 * Gera XML da NF-e localmente (antes do envio à SEFAZ)
 * Usado para validação e pré-visualização
 */
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

/**
 * Baixa XML gerado localmente
 */
export function baixarXMLLocal(notaFiscal: NotaFiscalFormData) {
  gerarXMLLocal(notaFiscal).then(blob => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `NFe_${notaFiscal.numero_nota}_RASCUNHO.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  })
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
  gerarEspelhoNFe(notaFiscal).then(blob => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Espelho_NFe_${notaFiscal.numero_nota}_SEM_VALIDADE.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  })
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
 */
function construirXMLNFe(nf: NotaFiscalFormData): string {
  const dataEmissao = new Date().toISOString()
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe versao="4.00">
      <!-- ========== IDENTIFICAÇÃO ========== -->
      <ide>
        <cUF>${nf.codigo_uf || '35'}</cUF>
        <cNF>${String(nf.numero_nota).padStart(8, '0')}</cNF>
        <natOp>${nf.natureza_operacao || 'Venda de mercadoria'}</natOp>
        <mod>${nf.modelo_documento === 'NFE' ? '55' : '65'}</mod>
        <serie>${nf.serie || '1'}</serie>
        <nNF>${nf.numero_nota}</nNF>
        <dhEmi>${dataEmissao}</dhEmi>
        <tpNF>${nf.tipo_operacao === 'SAIDA' ? '1' : '0'}</tpNF>
        <idDest>${nf.indicador_destino || '1'}</idDest>
        <cMunFG>${nf.codigo_municipio || '3550308'}</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <tpAmb>${nf.ambiente || '2'}</tpAmb>
        <finNFe>${nf.finalidade || '1'}</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>1.0</verProc>
      </ide>

      <!-- ========== EMITENTE ========== -->
      <emit>
        <CNPJ>${nf.emitente_cnpj?.replace(/\D/g, '')}</CNPJ>
        <xNome>${nf.emitente_razao_social}</xNome>
        <xFant>${nf.emitente_nome_fantasia}</xFant>
        <enderEmit>
          <xLgr>${nf.emitente_logradouro}</xLgr>
          <nro>${nf.emitente_numero}</nro>
          <xBairro>${nf.emitente_bairro}</xBairro>
          <cMun>${nf.codigo_municipio}</cMun>
          <xMun>${nf.emitente_cidade}</xMun>
          <UF>${nf.emitente_estado}</UF>
          <CEP>${nf.emitente_cep?.replace(/\D/g, '')}</CEP>
        </enderEmit>
        <IE>${nf.emitente_inscricao_estadual}</IE>
        <CRT>${nf.regime_tributario === 'SIMPLES' ? '1' : nf.regime_tributario === 'PRESUMIDO' ? '3' : '3'}</CRT>
      </emit>

      <!-- ========== DESTINATÁRIO ========== -->
      <dest>
        ${nf.destinatario_tipo_pessoa === 'JURIDICA' 
          ? `<CNPJ>${nf.destinatario_cnpj?.replace(/\D/g, '')}</CNPJ>`
          : `<CPF>${nf.destinatario_cpf?.replace(/\D/g, '')}</CPF>`
        }
        <xNome>${nf.destinatario_nome}</xNome>
        <enderDest>
          <xLgr>${nf.destinatario_logradouro}</xLgr>
          <nro>${nf.destinatario_numero}</nro>
          <xBairro>${nf.destinatario_bairro}</xBairro>
          <cMun>${nf.destinatario_codigo_municipio}</cMun>
          <xMun>${nf.destinatario_cidade}</xMun>
          <UF>${nf.destinatario_estado}</UF>
          <CEP>${nf.destinatario_cep?.replace(/\D/g, '')}</CEP>
        </enderDest>
        ${nf.destinatario_inscricao_estadual 
          ? `<IE>${nf.destinatario_inscricao_estadual}</IE>` 
          : '<indIEDest>9</indIEDest>'
        }
      </dest>

      <!-- ========== PRODUTOS/SERVIÇOS ========== -->
      ${nf.itens?.map((item, index) => `
      <det nItem="${index + 1}">
        <prod>
          <cProd>${item.codigo_produto}</cProd>
          <cEAN></cEAN>
          <xProd>${item.descricao}</xProd>
          <NCM>${item.ncm?.replace(/\D/g, '')}</NCM>
          ${item.cest ? `<CEST>${item.cest?.replace(/\D/g, '')}</CEST>` : ''}
          <CFOP>${item.cfop}</CFOP>
          <uCom>${item.unidade_comercial}</uCom>
          <qCom>${item.quantidade_comercial}</qCom>
          <vUnCom>${item.valor_unitario_comercial.toFixed(4)}</vUnCom>
          <vProd>${(item.quantidade_comercial * item.valor_unitario_comercial).toFixed(2)}</vProd>
          <cEANTrib></cEANTrib>
          <uTrib>${item.unidade_comercial}</uTrib>
          <qTrib>${item.quantidade_comercial}</qTrib>
          <vUnTrib>${item.valor_unitario_comercial.toFixed(4)}</vUnTrib>
          <indTot>1</indTot>
        </prod>
        
        <imposto>
          <!-- ICMS -->
          <ICMS>
            ${nf.regime_tributario === 'SIMPLES' ? `
            <ICMSSN${item.csosn_icms}>
              <orig>${item.origem_mercadoria || '0'}</orig>
              <CSOSN>${item.csosn_icms}</CSOSN>
              ${item.aliquota_icms ? `<pCredSN>${item.aliquota_icms}</pCredSN>` : ''}
              ${item.valor_icms ? `<vCredICMSSN>${item.valor_icms.toFixed(2)}</vCredICMSSN>` : ''}
            </ICMSSN${item.csosn_icms}>
            ` : `
            <ICMS${item.cst_icms}>
              <orig>${item.origem_mercadoria || '0'}</orig>
              <CST>${item.cst_icms}</CST>
              ${item.base_calculo_icms ? `<vBC>${item.base_calculo_icms.toFixed(2)}</vBC>` : ''}
              ${item.aliquota_icms ? `<pICMS>${item.aliquota_icms}</pICMS>` : ''}
              ${item.valor_icms ? `<vICMS>${item.valor_icms.toFixed(2)}</vICMS>` : ''}
            </ICMS${item.cst_icms}>
            `}
          </ICMS>
          
          <!-- PIS -->
          <PIS>
            <PISAliq>
              <CST>${item.cst_pis || '01'}</CST>
              <vBC>${item.base_calculo_pis?.toFixed(2) || '0.00'}</vBC>
              <pPIS>${item.aliquota_pis || '0.00'}</pPIS>
              <vPIS>${item.valor_pis?.toFixed(2) || '0.00'}</vPIS>
            </PISAliq>
          </PIS>
          
          <!-- COFINS -->
          <COFINS>
            <COFINSAliq>
              <CST>${item.cst_cofins || '01'}</CST>
              <vBC>${item.base_calculo_cofins?.toFixed(2) || '0.00'}</vBC>
              <pCOFINS>${item.aliquota_cofins || '0.00'}</pCOFINS>
              <vCOFINS>${item.valor_cofins?.toFixed(2) || '0.00'}</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      `).join('')}

      <!-- ========== TOTALIZADORES ========== -->
      <total>
        <ICMSTot>
          <vBC>${nf.valor_base_calculo || '0.00'}</vBC>
          <vICMS>${nf.valor_icms || '0.00'}</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>${nf.valor_produtos || '0.00'}</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>${nf.valor_desconto || '0.00'}</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>${nf.valor_pis || '0.00'}</vPIS>
          <vCOFINS>${nf.valor_cofins || '0.00'}</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>${nf.valor_total || '0.00'}</vNF>
        </ICMSTot>
      </total>

      <!-- ========== TRANSPORTE ========== -->
      <transp>
        <modFrete>${nf.modalidade_frete || '9'}</modFrete>
      </transp>

      <!-- ========== PAGAMENTO ========== -->
      <pag>
        <detPag>
          <indPag>${nf.forma_pagamento === 'AVISTA' ? '0' : '1'}</indPag>
          <tPag>${nf.meio_pagamento || '01'}</tPag>
          <vPag>${nf.valor_total || '0.00'}</vPag>
        </detPag>
      </pag>

      <!-- ========== INFORMAÇÕES ADICIONAIS ========== -->
      ${nf.informacoes_adicionais ? `
      <infAdic>
        <infCpl>${nf.informacoes_adicionais}</infCpl>
      </infAdic>
      ` : ''}
    </infNFe>
  </NFe>
</nfeProc>`
}

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
