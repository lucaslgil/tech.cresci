// =====================================================
// GERADOR XML NF-e/NFC-e
// Gera XML no formato oficial da SEFAZ
// =====================================================

import type { NotaFiscalDados } from './types'

export class XMLGenerator {
  private static formatarData(data: Date): string {
    return data.toISOString()
  }

  private static formatarValor(valor: number): string {
    return valor.toFixed(2)
  }

  private static gerarChaveAcesso(nota: NotaFiscalDados): string {
    // Formato: UF + AAMM + CNPJ + MOD + SERIE + NUMERO + TIPO_EMISSAO + CODIGO + DV
    const uf = nota.emitente.uf
    const aamm = new Date().toISOString().substring(2, 7).replace('-', '')
    const cnpj = nota.emitente.cnpj.replace(/\D/g, '')
    const modelo = nota.modelo
    const serie = String(nota.serie).padStart(3, '0')
    const numero = String(nota.numero).padStart(9, '0')
    const tipoEmissao = nota.tipo_emissao === 'NORMAL' ? '1' : '9'
    const codigoNumerico = String(Math.floor(Math.random() * 100000000)).padStart(8, '0')
    
    const chave = uf + aamm + cnpj + modelo + serie + numero + tipoEmissao + codigoNumerico
    const dv = this.calcularDigitoVerificador(chave)
    
    return chave + dv
  }

  private static calcularDigitoVerificador(chave: string): string {
    let soma = 0
    let peso = 2
    
    for (let i = chave.length - 1; i >= 0; i--) {
      soma += parseInt(chave[i]) * peso
      peso = peso === 9 ? 2 : peso + 1
    }
    
    const resto = soma % 11
    const dv = resto <= 1 ? 0 : 11 - resto
    
    return String(dv)
  }

  static gerar(nota: NotaFiscalDados): string {
    const chaveAcesso = this.gerarChaveAcesso(nota)
    const dataEmissao = this.formatarData(new Date())

    let xml = '<?xml version="1.0" encoding="UTF-8"?>'
    xml += '<NFe xmlns="http://www.portalfiscal.inf.br/nfe">'
    xml += '<infNFe Id="NFe' + chaveAcesso + '" versao="4.00">'
    
    // IDE - Identificação
    xml += '<ide>'
    xml += `<cUF>${this.getCodigoUF(nota.emitente.uf)}</cUF>`
    xml += `<cNF>${String(nota.numero).padStart(8, '0')}</cNF>`
    xml += `<natOp>Venda de mercadoria</natOp>`
    xml += `<mod>${nota.modelo}</mod>`
    xml += `<serie>${nota.serie}</serie>`
    xml += `<nNF>${nota.numero}</nNF>`
    xml += `<dhEmi>${dataEmissao}</dhEmi>`
    xml += `<tpNF>1</tpNF>` // 1=Saída
    xml += `<idDest>1</idDest>` // 1=Operação interna
    xml += `<cMunFG>${nota.emitente.codigo_municipio}</cMunFG>`
    xml += `<tpImp>1</tpImp>` // 1=DANFE Normal
    xml += `<tpEmis>1</tpEmis>` // 1=Emissão Normal
    xml += `<tpAmb>${nota.ambiente === 'PRODUCAO' ? '1' : '2'}</tpAmb>`
    xml += `<finNFe>1</finNFe>` // 1=Normal
    xml += `<indFinal>${nota.destinatario.tipo_pessoa === 'FISICA' ? '1' : '0'}</indFinal>`
    xml += `<indPres>1</indPres>` // 1=Presencial
    xml += `<procEmi>0</procEmi>` // 0=Aplicativo
    xml += `<verProc>1.0</verProc>`
    xml += '</ide>'
    
    // EMIT - Emitente
    xml += '<emit>'
    xml += `<CNPJ>${nota.emitente.cnpj.replace(/\D/g, '')}</CNPJ>`
    xml += `<xNome>${this.escapeXml(nota.emitente.razao_social)}</xNome>`
    if (nota.emitente.nome_fantasia) {
      xml += `<xFant>${this.escapeXml(nota.emitente.nome_fantasia)}</xFant>`
    }
    xml += '<enderEmit>'
    xml += `<xLgr>${this.escapeXml(nota.emitente.logradouro)}</xLgr>`
    xml += `<nro>${nota.emitente.numero}</nro>`
    if (nota.emitente.complemento) {
      xml += `<xCpl>${this.escapeXml(nota.emitente.complemento)}</xCpl>`
    }
    xml += `<xBairro>${this.escapeXml(nota.emitente.bairro)}</xBairro>`
    xml += `<cMun>${nota.emitente.codigo_municipio}</cMun>`
    xml += `<xMun>${this.escapeXml(nota.emitente.cidade)}</xMun>`
    xml += `<UF>${nota.emitente.uf}</UF>`
    xml += `<CEP>${nota.emitente.cep.replace(/\D/g, '')}</CEP>`
    xml += '</enderEmit>'
    xml += `<IE>${nota.emitente.inscricao_estadual.replace(/\D/g, '')}</IE>`
    xml += `<CRT>${nota.emitente.crt}</CRT>`
    xml += '</emit>'
    
    // DEST - Destinatário
    xml += '<dest>'
    if (nota.destinatario.tipo_pessoa === 'FISICA') {
      xml += `<CPF>${nota.destinatario.cpf_cnpj.replace(/\D/g, '')}</CPF>`
    } else {
      xml += `<CNPJ>${nota.destinatario.cpf_cnpj.replace(/\D/g, '')}</CNPJ>`
    }
    xml += `<xNome>${this.escapeXml(nota.destinatario.nome_razao)}</xNome>`
    xml += '<enderDest>'
    xml += `<xLgr>${this.escapeXml(nota.destinatario.logradouro)}</xLgr>`
    xml += `<nro>${nota.destinatario.numero}</nro>`
    if (nota.destinatario.complemento) {
      xml += `<xCpl>${this.escapeXml(nota.destinatario.complemento)}</xCpl>`
    }
    xml += `<xBairro>${this.escapeXml(nota.destinatario.bairro)}</xBairro>`
    xml += `<cMun>${nota.destinatario.codigo_municipio}</cMun>`
    xml += `<xMun>${this.escapeXml(nota.destinatario.cidade)}</xMun>`
    xml += `<UF>${nota.destinatario.uf}</UF>`
    xml += `<CEP>${nota.destinatario.cep.replace(/\D/g, '')}</CEP>`
    xml += '</enderDest>'
    xml += `<indIEDest>${this.getIndicadorIE(nota.destinatario.indicador_ie)}</indIEDest>`
    
    // IE do destinatário (apenas para contribuintes)
    if (nota.destinatario.indicador_ie === 'CONTRIBUINTE' && nota.destinatario.inscricao_estadual) {
      const ieDestinatario = nota.destinatario.inscricao_estadual.trim().toUpperCase()
      if (ieDestinatario !== 'ISENTO') {
        xml += `<IE>${ieDestinatario.replace(/\D/g, '')}</IE>`
      }
    }
    
    xml += '</dest>'
    
    // DET - Itens
    nota.itens.forEach((item, index) => {
      xml += `<det nItem="${index + 1}">`
      xml += '<prod>'
      xml += `<cProd>${this.escapeXml(item.codigo_produto)}</cProd>`
      xml += `<xProd>${this.escapeXml(item.descricao)}</xProd>`
      xml += `<NCM>${item.ncm.replace(/\D/g, '')}</NCM>`
      xml += `<CFOP>${item.cfop}</CFOP>`
      xml += `<uCom>${this.escapeXml(item.unidade)}</uCom>`
      xml += `<qCom>${this.formatarValor(item.quantidade)}</qCom>`
      xml += `<vUnCom>${this.formatarValor(item.valor_unitario)}</vUnCom>`
      xml += `<vProd>${this.formatarValor(item.valor_total)}</vProd>`
      xml += `<uTrib>${this.escapeXml(item.unidade)}</uTrib>`
      xml += `<qTrib>${this.formatarValor(item.quantidade)}</qTrib>`
      xml += `<vUnTrib>${this.formatarValor(item.valor_unitario)}</vUnTrib>`
      if (item.valor_desconto) {
        xml += `<vDesc>${this.formatarValor(item.valor_desconto)}</vDesc>`
      }
      xml += '</prod>'
      
      // IMPOSTO
      xml += '<imposto>'
      xml += `<vTotTrib>${this.formatarValor(item.valor_total_tributos || 0)}</vTotTrib>`
      
      // ICMS
      xml += '<ICMS>'
      xml += `<ICMS${item.impostos.icms.cst}>`
      xml += `<orig>${item.impostos.icms.origem}</orig>`
      xml += `<CST>${item.impostos.icms.cst}</CST>`
      if (item.impostos.icms.base_calculo) {
        xml += `<vBC>${this.formatarValor(item.impostos.icms.base_calculo)}</vBC>`
        xml += `<pICMS>${this.formatarValor(item.impostos.icms.aliquota || 0)}</pICMS>`
        xml += `<vICMS>${this.formatarValor(item.impostos.icms.valor || 0)}</vICMS>`
      }
      xml += `</ICMS${item.impostos.icms.cst}>`
      xml += '</ICMS>'
      
      // PIS
      xml += '<PIS>'
      xml += `<PIS${item.impostos.pis.cst}>`
      xml += `<CST>${item.impostos.pis.cst}</CST>`
      if (item.impostos.pis.base_calculo) {
        xml += `<vBC>${this.formatarValor(item.impostos.pis.base_calculo)}</vBC>`
        xml += `<pPIS>${this.formatarValor(item.impostos.pis.aliquota || 0)}</pPIS>`
        xml += `<vPIS>${this.formatarValor(item.impostos.pis.valor || 0)}</vPIS>`
      }
      xml += `</PIS${item.impostos.pis.cst}>`
      xml += '</PIS>'
      
      // COFINS
      xml += '<COFINS>'
      xml += `<COFINS${item.impostos.cofins.cst}>`
      xml += `<CST>${item.impostos.cofins.cst}</CST>`
      if (item.impostos.cofins.base_calculo) {
        xml += `<vBC>${this.formatarValor(item.impostos.cofins.base_calculo)}</vBC>`
        xml += `<pCOFINS>${this.formatarValor(item.impostos.cofins.aliquota || 0)}</pCOFINS>`
        xml += `<vCOFINS>${this.formatarValor(item.impostos.cofins.valor || 0)}</vCOFINS>`
      }
      xml += `</COFINS${item.impostos.cofins.cst}>`
      xml += '</COFINS>'
      
      xml += '</imposto>'
      xml += '</det>'
    })
    
    // TOTAL
    xml += '<total>'
    xml += '<ICMSTot>'
    xml += `<vBC>${this.formatarValor(nota.totais.base_calculo_icms)}</vBC>`
    xml += `<vICMS>${this.formatarValor(nota.totais.valor_icms)}</vICMS>`
    xml += `<vICMSDeson>${this.formatarValor(nota.totais.valor_icms_desonerado)}</vICMSDeson>`
    xml += `<vBCST>${this.formatarValor(nota.totais.base_calculo_icms_st)}</vBCST>`
    xml += `<vST>${this.formatarValor(nota.totais.valor_icms_st)}</vST>`
    xml += `<vProd>${this.formatarValor(nota.totais.valor_produtos)}</vProd>`
    xml += `<vFrete>${this.formatarValor(nota.totais.valor_frete)}</vFrete>`
    xml += `<vSeg>${this.formatarValor(nota.totais.valor_seguro)}</vSeg>`
    xml += `<vDesc>${this.formatarValor(nota.totais.valor_desconto)}</vDesc>`
    xml += `<vII>0.00</vII>`
    xml += `<vIPI>${this.formatarValor(nota.totais.valor_ipi)}</vIPI>`
    xml += `<vPIS>${this.formatarValor(nota.totais.valor_pis)}</vPIS>`
    xml += `<vCOFINS>${this.formatarValor(nota.totais.valor_cofins)}</vCOFINS>`
    xml += `<vOutro>${this.formatarValor(nota.totais.valor_outras_despesas)}</vOutro>`
    xml += `<vNF>${this.formatarValor(nota.totais.valor_total)}</vNF>`
    xml += `<vTotTrib>${this.formatarValor(nota.totais.valor_total_tributos)}</vTotTrib>`
    xml += '</ICMSTot>'
    xml += '</total>'
    
    // TRANSP - Transporte
    xml += '<transp>'
    xml += `<modFrete>${this.getModalidadeFrete(nota.transporte?.modalidade || 'SEM_FRETE')}</modFrete>`
    xml += '</transp>'
    
    // INFADIC - Informações Adicionais
    if (nota.informacoes_complementares || nota.informacoes_fisco) {
      xml += '<infAdic>'
      if (nota.informacoes_complementares) {
        xml += `<infCpl>${this.escapeXml(nota.informacoes_complementares)}</infCpl>`
      }
      if (nota.informacoes_fisco) {
        xml += `<infAdFisco>${this.escapeXml(nota.informacoes_fisco)}</infAdFisco>`
      }
      xml += '</infAdic>'
    }
    
    xml += '</infNFe>'
    xml += '</NFe>'
    
    return xml
  }

  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  private static getCodigoUF(uf: string): string {
    const codigos: { [key: string]: string } = {
      'RO': '11', 'AC': '12', 'AM': '13', 'RR': '14', 'PA': '15', 'AP': '16', 'TO': '17',
      'MA': '21', 'PI': '22', 'CE': '23', 'RN': '24', 'PB': '25', 'PE': '26', 'AL': '27',
      'SE': '28', 'BA': '29', 'MG': '31', 'ES': '32', 'RJ': '33', 'SP': '35', 'PR': '41',
      'SC': '42', 'RS': '43', 'MS': '50', 'MT': '51', 'GO': '52', 'DF': '53'
    }
    return codigos[uf] || '35'
  }

  private static getIndicadorIE(indicador: string): string {
    if (indicador === 'CONTRIBUINTE') return '1'
    if (indicador === 'ISENTO') return '2'
    return '9' // NAO_CONTRIBUINTE
  }

  private static getModalidadeFrete(modalidade: string): string {
    const modalidades: { [key: string]: string } = {
      'EMITENTE': '0',
      'DESTINATARIO': '1',
      'TERCEIROS': '2',
      'PROPRIO': '3',
      'SEM_FRETE': '9'
    }
    return modalidades[modalidade] || '9'
  }
}
