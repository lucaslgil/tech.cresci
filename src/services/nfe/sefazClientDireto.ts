// =====================================================
// CLIENTE SEFAZ DIRETO - SOAP
// Comunicação direta com SEFAZ (GRATUITA)
// =====================================================

import axios from 'axios'
import { AssinaturaDigitalService } from './assinaturaDigitalService'
import type { RetornoSEFAZ } from './types'

interface WebServiceSEFAZ {
  autorizacao: string
  retAutorizacao: string
  consultaProtocolo: string
  cancelamento: string
  inutilizacao: string
  consultaCadastro: string
}

export class SefazClientDireto {
  private assinatura: AssinaturaDigitalService
  private ambiente: 'PRODUCAO' | 'HOMOLOGACAO'
  private uf: string

  constructor(assinatura: AssinaturaDigitalService, ambiente: 'PRODUCAO' | 'HOMOLOGACAO', uf: string) {
    this.assinatura = assinatura
    this.ambiente = ambiente
    this.uf = uf
  }

  /**
   * Enviar NF-e para autorização
   */
  async enviarNFe(xml: string): Promise<RetornoSEFAZ> {
    try {
      // 1. Assinar XML
      console.log('🔐 Assinando XML...')
      const xmlAssinado = this.assinatura.assinarXML(xml)

      // 2. Montar lote
      const lote = this.montarLote(xmlAssinado)

      // 3. Enviar para SEFAZ
      console.log('📤 Enviando para SEFAZ...')
      const wsUrl = this.getWebServiceURL('autorizacao')
      const soapEnvelope = this.montarSoapAutorizacao(lote)

      const response = await axios.post(wsUrl, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote'
        },
        timeout: 60000
      })

      // 4. Processar resposta
      return this.processarRespostaAutorizacao(response.data)
    } catch (error: any) {
      console.error('❌ Erro ao enviar NF-e:', error)
      return {
        status: 'ERRO',
        mensagem: error.message || 'Erro ao comunicar com SEFAZ',
        erros: [{
          codigo: 'ERRO_COMUNICACAO',
          mensagem: error.message
        }]
      }
    }
  }

  /**
   * Consultar recibo de processamento
   */
  async consultarRecibo(numeroRecibo: string): Promise<RetornoSEFAZ> {
    try {
      const wsUrl = this.getWebServiceURL('retAutorizacao')
      const soapEnvelope = this.montarSoapConsultaRecibo(numeroRecibo)

      const response = await axios.post(wsUrl, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRetAutorizacao4/nfeRetAutorizacaoLote'
        },
        timeout: 30000
      })

      return this.processarRespostaConsulta(response.data)
    } catch (error: any) {
      return {
        status: 'ERRO',
        mensagem: error.message || 'Erro ao consultar recibo'
      }
    }
  }

  /**
   * Cancelar NF-e
   */
  async cancelarNFe(chaveAcesso: string, numeroProtocolo: string, justificativa: string): Promise<RetornoSEFAZ> {
    try {
      // Montar XML de cancelamento
      const xmlCancelamento = this.montarXMLCancelamento(chaveAcesso, numeroProtocolo, justificativa)
      
      // Assinar
      const xmlAssinado = this.assinatura.assinarXML(xmlCancelamento)

      // Enviar
      const wsUrl = this.getWebServiceURL('cancelamento')
      const soapEnvelope = this.montarSoapCancelamento(xmlAssinado)

      const response = await axios.post(wsUrl, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEvento'
        }
      })

      return this.processarRespostaCancelamento(response.data)
    } catch (error: any) {
      return {
        status: 'ERRO',
        mensagem: error.message || 'Erro ao cancelar NF-e'
      }
    }
  }

  /**
   * Obter URL do WebService por UF e ambiente
   */
  private getWebServiceURL(servico: keyof WebServiceSEFAZ): string {
    const urls = this.getURLsPorUF()
    return urls[servico]
  }

  /**
   * URLs dos WebServices por UF
   */
  private getURLsPorUF(): WebServiceSEFAZ {
    const isProd = this.ambiente === 'PRODUCAO'
    
    // URLs para São Paulo (SP)
    if (this.uf === 'SP') {
      return {
        autorizacao: isProd
          ? 'https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx'
          : 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
        retAutorizacao: isProd
          ? 'https://nfe.fazenda.sp.gov.br/ws/nferetautorizacao4.asmx'
          : 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nferetautorizacao4.asmx',
        consultaProtocolo: isProd
          ? 'https://nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx'
          : 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx',
        cancelamento: isProd
          ? 'https://nfe.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx'
          : 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx',
        inutilizacao: isProd
          ? 'https://nfe.fazenda.sp.gov.br/ws/nfeinutilizacao4.asmx'
          : 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeinutilizacao4.asmx',
        consultaCadastro: 'https://nfe.fazenda.sp.gov.br/ws/cadconsultacadastro4.asmx'
      }
    }

    // Para outros estados, usar SVRS (Sefaz Virtual Rio Grande do Sul)
    return {
      autorizacao: isProd
        ? 'https://nfe.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx'
        : 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      retAutorizacao: isProd
        ? 'https://nfe.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx'
        : 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
      consultaProtocolo: isProd
        ? 'https://nfe.svrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx'
        : 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
      cancelamento: isProd
        ? 'https://nfe.svrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx'
        : 'https://nfe-homologacao.svrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx',
      inutilizacao: isProd
        ? 'https://nfe.svrs.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx'
        : 'https://nfe-homologacao.svrs.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx',
      consultaCadastro: 'https://cad.svrs.rs.gov.br/ws/cadconsultacadastro/cadconsultacadastro4.asmx'
    }
  }

  /**
   * Montar lote de NFe
   */
  private montarLote(xmlNFe: string): string {
    const numeroLote = Date.now().toString().substring(0, 15)
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <idLote>${numeroLote}</idLote>
  <indSinc>1</indSinc>
  ${xmlNFe}
</enviNFe>`
  }

  /**
   * Montar SOAP de autorização
   */
  private montarSoapAutorizacao(lote: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:nfe="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
  <soap:Header/>
  <soap:Body>
    <nfe:nfeDadosMsg>${this.escapeCData(lote)}</nfe:nfeDadosMsg>
  </soap:Body>
</soap:Envelope>`
  }

  /**
   * Montar SOAP de consulta recibo
   */
  private montarSoapConsultaRecibo(numeroRecibo: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:nfe="http://www.portalfiscal.inf.br/nfe/wsdl/NFeRetAutorizacao4">
  <soap:Header/>
  <soap:Body>
    <nfe:nfeDadosMsg>
      <consReciNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
        <tpAmb>${this.ambiente === 'PRODUCAO' ? '1' : '2'}</tpAmb>
        <nRec>${numeroRecibo}</nRec>
      </consReciNFe>
    </nfe:nfeDadosMsg>
  </soap:Body>
</soap:Envelope>`
  }

  /**
   * Montar XML de cancelamento
   */
  private montarXMLCancelamento(chaveAcesso: string, protocolo: string, justificativa: string): string {
    const evento = `110111` // Tipo evento cancelamento
    const sequencial = '1'
    const dhEvento = new Date().toISOString()
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<evento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">
  <infEvento Id="ID${evento}${chaveAcesso}${sequencial.padStart(2, '0')}">
    <cOrgao>${chaveAcesso.substring(0, 2)}</cOrgao>
    <tpAmb>${this.ambiente === 'PRODUCAO' ? '1' : '2'}</tpAmb>
    <CNPJ>${this.extrairCNPJCertificado()}</CNPJ>
    <chNFe>${chaveAcesso}</chNFe>
    <dhEvento>${dhEvento}</dhEvento>
    <tpEvento>${evento}</tpEvento>
    <nSeqEvento>${sequencial}</nSeqEvento>
    <verEvento>1.00</verEvento>
    <detEvento versao="1.00">
      <descEvento>Cancelamento</descEvento>
      <nProt>${protocolo}</nProt>
      <xJust>${justificativa}</xJust>
    </detEvento>
  </infEvento>
</evento>`
  }

  /**
   * Montar SOAP de cancelamento
   */
  private montarSoapCancelamento(xmlEvento: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:nfe="http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4">
  <soap:Header/>
  <soap:Body>
    <nfe:nfeDadosMsg>${this.escapeCData(xmlEvento)}</nfe:nfeDadosMsg>
  </soap:Body>
</soap:Envelope>`
  }

  /**
   * Processar resposta de autorização
   */
  private processarRespostaAutorizacao(xml: string): RetornoSEFAZ {
    // Parser simplificado - em produção use xml2js
    const statusMatch = xml.match(/<cStat>(\d+)<\/cStat>/)
    const mensagemMatch = xml.match(/<xMotivo>(.+?)<\/xMotivo>/)
    const reciboMatch = xml.match(/<nRec>(\d+)<\/nRec>/)

    const codigoStatus = statusMatch ? statusMatch[1] : '999'
    const mensagem = mensagemMatch ? mensagemMatch[1] : 'Erro desconhecido'
    const numeroRecibo = reciboMatch ? reciboMatch[1] : undefined

    if (codigoStatus === '103' || codigoStatus === '104') {
      // Lote recebido com sucesso - aguardar processamento
      return {
        status: 'PROCESSANDO',
        codigo_status: codigoStatus,
        mensagem: `Lote em processamento. Recibo: ${numeroRecibo}`,
        numeroProtocolo: numeroRecibo
      }
    } else if (codigoStatus === '100') {
      // Autorizado
      return {
        status: 'AUTORIZADA',
        codigo_status: codigoStatus,
        mensagem: 'Nota fiscal autorizada',
        xml_autorizado: xml
      }
    } else {
      // Rejeitado
      return {
        status: 'REJEITADA',
        codigo_status: codigoStatus,
        mensagem,
        erros: [{
          codigo: codigoStatus,
          mensagem
        }]
      }
    }
  }

  /**
   * Processar resposta de consulta
   */
  private processarRespostaConsulta(xml: string): RetornoSEFAZ {
    const statusMatch = xml.match(/<cStat>(\d+)<\/cStat>/)
    const mensagemMatch = xml.match(/<xMotivo>(.+?)<\/xMotivo>/)
    const chaveMatch = xml.match(/<chNFe>(\d{44})<\/chNFe>/)
    const protocoloMatch = xml.match(/<nProt>(\d+)<\/nProt>/)

    const codigoStatus = statusMatch ? statusMatch[1] : '999'
    const mensagem = mensagemMatch ? mensagemMatch[1] : 'Erro desconhecido'

    if (codigoStatus === '100') {
      return {
        status: 'AUTORIZADA',
        codigo_status: codigoStatus,
        mensagem: 'Autorizado o uso da NF-e',
        chaveAcesso: chaveMatch ? chaveMatch[1] : undefined,
        numeroProtocolo: protocoloMatch ? protocoloMatch[1] : undefined,
        xml_autorizado: xml
      }
    } else {
      return {
        status: 'REJEITADA',
        codigo_status: codigoStatus,
        mensagem
      }
    }
  }

  /**
   * Processar resposta de cancelamento
   */
  private processarRespostaCancelamento(xml: string): RetornoSEFAZ {
    const statusMatch = xml.match(/<cStat>(\d+)<\/cStat>/)
    const mensagemMatch = xml.match(/<xMotivo>(.+?)<\/xMotivo>/)

    const codigoStatus = statusMatch ? statusMatch[1] : '999'
    const mensagem = mensagemMatch ? mensagemMatch[1] : 'Erro desconhecido'

    if (codigoStatus === '135' || codigoStatus === '136') {
      return {
        status: 'CANCELADA',
        codigo_status: codigoStatus,
        mensagem: 'Cancelamento homologado'
      }
    } else {
      return {
        status: 'ERRO',
        codigo_status: codigoStatus,
        mensagem
      }
    }
  }

  private escapeCData(text: string): string {
    return `<![CDATA[${text}]]>`
  }

  private extrairCNPJCertificado(): string {
    const info = this.assinatura.getInfoCertificado()
    return info?.cnpj || ''
  }
}
