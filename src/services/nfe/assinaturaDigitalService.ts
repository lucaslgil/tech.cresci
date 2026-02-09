// =====================================================
// SERVIÇO DE ASSINATURA DIGITAL
// Assina XML com certificado digital A1
// =====================================================

import forge from 'node-forge'
import { SignedXml } from 'xml-crypto'
import { DOMParser } from 'xmldom'

export class AssinaturaDigitalService {
  private certificado: forge.pki.Certificate | null = null
  private privateKey: forge.pki.PrivateKey | null = null

  /**
   * Carregar certificado A1 (.pfx/.p12)
   */
  async carregarCertificado(arquivo: ArrayBuffer, senha: string): Promise<void> {
    try {
      // Converter ArrayBuffer para string binária que o forge entende
      const bytes = new Uint8Array(arquivo)
      let binaryString = ''
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i])
      }
      
      // Parse do certificado (modo não estrito para evitar bytes remanescentes)
      const p12Asn1 = forge.asn1.fromDer(binaryString, false)
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, senha)

      // Extrair chave privada
      const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
      const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]
      if (!keyBag || !keyBag.key) {
        throw new Error('Chave privada não encontrada no certificado')
      }
      this.privateKey = keyBag.key as forge.pki.PrivateKey

      // Extrair certificado
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
      const certBag = certBags[forge.pki.oids.certBag]?.[0]
      if (!certBag || !certBag.cert) {
        throw new Error('Certificado não encontrado')
      }
      this.certificado = certBag.cert

      console.log('✅ Certificado carregado com sucesso')
      console.log('   Válido até:', this.certificado.validity.notAfter)
      console.log('   Subject:', this.certificado.subject.getField('CN')?.value)
    } catch (error: any) {
      if (error.message.includes('Invalid password')) {
        throw new Error('Senha do certificado incorreta')
      }
      throw new Error(`Erro ao carregar certificado: ${error.message}`)
    }
  }

  /**
   * Assinar XML da NF-e
   */
  assinarXML(xml: string): string {
    if (!this.certificado || !this.privateKey) {
      throw new Error('Certificado não carregado. Use carregarCertificado() primeiro.')
    }

    try {
      // Parse XML
      const doc = new DOMParser().parseFromString(xml, 'text/xml')
      
      // Buscar elemento infNFe (que será assinado)
      const infNFe = doc.getElementsByTagName('infNFe')[0]
      if (!infNFe) {
        throw new Error('Elemento infNFe não encontrado no XML')
      }

      const infNFeId = infNFe.getAttribute('Id')
      if (!infNFeId) {
        throw new Error('Atributo Id não encontrado em infNFe')
      }

      // Configurar assinatura
      const sig = new SignedXml()
      
      sig.addReference({
        xpath: `//*[@Id='${infNFeId}']`,
        transforms: [
          'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
          'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
        ],
        digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256'
      })

      // Canonicalization
      sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
      sig.signatureAlgorithm = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256'

      // Converter chave privada para PEM
      const privateKeyPem = forge.pki.privateKeyToPem(this.privateKey)
      // @ts-ignore - API de xml-crypto
      sig.signingKey = privateKeyPem

      // Adicionar certificado à assinatura
      // @ts-ignore - API de xml-crypto
      sig.keyInfoProvider = {
        getKeyInfo: () => {
          const certPem = forge.pki.certificateToPem(this.certificado!)
          const certBase64 = certPem
            .replace('-----BEGIN CERTIFICATE-----', '')
            .replace('-----END CERTIFICATE-----', '')
            .replace(/\n/g, '')
          
          return `<X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data>`
        }
      }

      // Computar assinatura
      sig.computeSignature(xml, {
        location: { reference: `//*[@Id='${infNFeId}']`, action: 'after' }
      })

      // Retornar XML assinado
      return sig.getSignedXml()
    } catch (error: any) {
      throw new Error(`Erro ao assinar XML: ${error.message}`)
    }
  }

  /**
   * Validar se certificado está válido
   */
  validarCertificado(): { valido: boolean; mensagem: string } {
    if (!this.certificado) {
      return { valido: false, mensagem: 'Certificado não carregado' }
    }

    const agora = new Date()
    const validade = this.certificado.validity

    if (agora < validade.notBefore) {
      return { 
        valido: false, 
        mensagem: `Certificado ainda não é válido. Válido a partir de ${validade.notBefore.toLocaleDateString('pt-BR')}` 
      }
    }

    if (agora > validade.notAfter) {
      return { 
        valido: false, 
        mensagem: `Certificado vencido em ${validade.notAfter.toLocaleDateString('pt-BR')}` 
      }
    }

    return { 
      valido: true, 
      mensagem: `Certificado válido até ${validade.notAfter.toLocaleDateString('pt-BR')}` 
    }
  }

  /**
   * Extrair informações do certificado
   */
  getInfoCertificado(): {
    cnpj: string
    razaoSocial: string
    validoAte: string
  } {
    if (!this.certificado) {
      throw new Error('Certificado não carregado')
    }

    const subject = this.certificado.subject
    const cnpj = this.extrairCNPJ(subject) || ''
    // @ts-ignore - node-forge API
    const cn = subject.attributes.find((attr: any) => attr.shortName === 'CN')?.value || ''
    
    // Converter data para ISO string (YYYY-MM-DD)
    const validadeFim = this.certificado.validity.notAfter
    const ano = validadeFim.getFullYear()
    const mes = String(validadeFim.getMonth() + 1).padStart(2, '0')
    const dia = String(validadeFim.getDate()).padStart(2, '0')
    const dataISO = `${ano}-${mes}-${dia}`
    
    return {
      cnpj,
      razaoSocial: String(cn || ''),
      validoAte: dataISO
    }
  }

  private extrairCNPJ(subject: any): string | undefined {
    // @ts-ignore - node-forge API
    const serialNumber = subject.attributes.find((attr: any) => attr.shortName === 'serialNumber')?.value
    if (serialNumber) {
      const match = serialNumber.match(/\d{14}/)
      if (match) return match[0]
    }

    // @ts-ignore - node-forge API
    const cn = subject.attributes.find((attr: any) => attr.shortName === 'CN')?.value
    if (cn) {
      const match = cn.match(/\d{14}/)
      if (match) return match[0]
    }

    return undefined
  }
}
