// =====================================================
// ASSINATURA DIGITAL (Deno)
// Assina XML usando certificado A1 (.pfx)
// =====================================================

import forge from 'https://esm.sh/node-forge@1.3.1'

/**
 * Assinar XML com certificado A1
 */
export async function assinarXML(
  xml: string,
  certificadoBuffer: Uint8Array,
  senha: string
): Promise<string> {
  
  console.log('🔏 Iniciando assinatura digital...')
  
  try {
    // 1. Converter Uint8Array para string binária
    const bytes = new Uint8Array(certificadoBuffer)
    let binaryString = ''
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i])
    }
    
    // 2. Parse do certificado PFX
    console.log('📜 Carregando certificado...')
    const p12Asn1 = forge.asn1.fromDer(binaryString, false)
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, senha)
    
    // 3. Extrair chave privada
    const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
    const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]
    if (!keyBag || !keyBag.key) {
      throw new Error('Chave privada não encontrada no certificado')
    }
    const privateKey = keyBag.key as forge.pki.PrivateKey
    
    // 4. Extrair certificado
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
    const certBag = certBags[forge.pki.oids.certBag]?.[0]
    if (!certBag || !certBag.cert) {
      throw new Error('Certificado não encontrado')
    }
    const certificate = certBag.cert
    
    console.log('✅ Certificado carregado:', certificate.subject.getField('CN')?.value)
    console.log('📅 Válido até:', certificate.validity.notAfter)
    
    // 5. Extrair elemento infNFe do XML
    const infNFeMatch = xml.match(/<infNFe[^>]*Id="([^"]+)"[^>]*>([\s\S]*?)<\/infNFe>/)
    if (!infNFeMatch) {
      throw new Error('Elemento infNFe não encontrado no XML')
    }
    
    const infNFeId = infNFeMatch[1]
    const infNFeContent = infNFeMatch[0]
    
    console.log('🔍 Elemento infNFe encontrado, ID:', infNFeId)
    
    // 6. Canonicalizar o XML (C14N)
    const canonicalXml = canonicalizarXML(infNFeContent)
    
    // 7. Calcular hash SHA-256
    const md = forge.md.sha256.create()
    md.update(canonicalXml, 'utf8')
    const digest = md.digest()
    const digestBase64 = forge.util.encode64(digest.bytes())
    
    console.log('🔐 Hash calculado (SHA-256):', digestBase64.substring(0, 20) + '...')
    
    // 8. Montar SignedInfo
    const signedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
  <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
  <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
  <Reference URI="#${infNFeId}">
    <Transforms>
      <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
      <Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
    </Transforms>
    <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
    <DigestValue>${digestBase64}</DigestValue>
  </Reference>
</SignedInfo>`
    
    // 9. Canonicalizar SignedInfo
    const canonicalSignedInfo = canonicalizarXML(signedInfo)
    
    // 10. Assinar SignedInfo com chave privada (RSA-SHA256)
    const mdSign = forge.md.sha256.create()
    mdSign.update(canonicalSignedInfo, 'utf8')
    const signature = privateKey.sign(mdSign)
    const signatureBase64 = forge.util.encode64(signature)
    
    console.log('✍️ Assinatura gerada:', signatureBase64.substring(0, 20) + '...')
    
    // 11. Extrair certificado em Base64
    const certPem = forge.pki.certificateToPem(certificate)
    const certBase64 = certPem
      .replace('-----BEGIN CERTIFICATE-----', '')
      .replace('-----END CERTIFICATE-----', '')
      .replace(/\n/g, '')
      .trim()
    
    // 12. Montar elemento Signature completo
    const signatureElement = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
  ${signedInfo}
  <SignatureValue>${signatureBase64}</SignatureValue>
  <KeyInfo>
    <X509Data>
      <X509Certificate>${certBase64}</X509Certificate>
    </X509Data>
  </KeyInfo>
</Signature>`
    
    // 13. Inserir Signature no XML (depois de infNFe, antes de fechar NFe)
    const xmlAssinado = xml.replace('</infNFe>', `</infNFe>\n${signatureElement}`)
    
    console.log('✅ XML assinado com sucesso!')
    
    return xmlAssinado
    
  } catch (error: any) {
    console.error('❌ Erro ao assinar XML:', error)
    throw new Error(`Erro ao assinar XML: ${error.message}`)
  }
}

/**
 * Canonicalizar XML (C14N)
 * Simplificado - para produção, usar biblioteca completa
 */
function canonicalizarXML(xml: string): string {
  return xml
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/>\s+</g, '><')
    .trim()
}

/**
 * Validar certificado A1
 */
export async function validarCertificado(
  certificadoBuffer: Uint8Array,
  senha: string
): Promise<{ valido: boolean; mensagem: string; dataValidade?: string }> {
  
  try {
    console.log('🔍 Validando certificado...')
    
    // Converter para string binária
    const bytes = new Uint8Array(certificadoBuffer)
    let binaryString = ''
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i])
    }
    
    // Parse do certificado
    const p12Asn1 = forge.asn1.fromDer(binaryString, false)
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, senha)
    
    // Extrair certificado
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
    const certBag = certBags[forge.pki.oids.certBag]?.[0]
    
    if (!certBag || !certBag.cert) {
      return {
        valido: false,
        mensagem: 'Certificado não encontrado no arquivo PFX'
      }
    }
    
    const certificate = certBag.cert
    const agora = new Date()
    const validade = certificate.validity.notAfter
    
    // Verificar validade
    if (agora > validade) {
      return {
        valido: false,
        mensagem: `Certificado vencido em ${validade.toLocaleDateString('pt-BR')}`,
        dataValidade: validade.toISOString()
      }
    }
    
    if (agora < certificate.validity.notBefore) {
      return {
        valido: false,
        mensagem: 'Certificado ainda não é válido',
        dataValidade: validade.toISOString()
      }
    }
    
    const cn = certificate.subject.getField('CN')?.value
    const diasRestantes = Math.floor((validade.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
    
    console.log(`✅ Certificado válido: ${cn}`)
    console.log(`📅 Válido até: ${validade.toLocaleDateString('pt-BR')} (${diasRestantes} dias restantes)`)
    
    return {
      valido: true,
      mensagem: `Certificado válido (${cn}) - ${diasRestantes} dias restantes`,
      dataValidade: validade.toISOString()
    }
  } catch (error: any) {
    if (error.message?.includes('Invalid password')) {
      return {
        valido: false,
        mensagem: 'Senha do certificado incorreta'
      }
    }
    return {
      valido: false,
      mensagem: `Erro ao validar: ${error.message}`
    }
  }
}
