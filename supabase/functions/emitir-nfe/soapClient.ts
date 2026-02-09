// =====================================================
// CLIENTE SOAP SEFAZ (Comunicação Direta)
// =====================================================

export interface RetornoSEFAZ {
  sucesso: boolean
  status: string
  chave_acesso?: string
  protocolo?: string
  mensagem: string
  xml_autorizado?: string
  data_autorizacao?: string
}

export async function enviarNFeSEFAZ(
  xmlAssinado: string,
  ambiente: 'PRODUCAO' | 'HOMOLOGACAO',
  uf: string
): Promise<RetornoSEFAZ> {
  
  const url = getURLWebservice(uf, ambiente, 'NFeAutorizacao')
  
  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:nfe="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
  <soap:Header/>
  <soap:Body>
    <nfe:nfeDadosMsg>
      <![CDATA[
        <?xml version="1.0" encoding="UTF-8"?>
        <enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
          <idLote>1</idLote>
          <indSinc>1</indSinc>
          ${xmlAssinado}
        </enviNFe>
      ]]>
    </nfe:nfeDadosMsg>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
        'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4'
      },
      body: soapEnvelope
    })

    const responseText = await response.text()
    console.log('📥 Resposta SEFAZ:', responseText)

    // Parser simplificado da resposta
    const chaveMatch = responseText.match(/<chNFe>(\d{44})<\/chNFe>/)
    const protocoloMatch = responseText.match(/<nProt>(\d+)<\/nProt>/)
    const statusMatch = responseText.match(/<cStat>(\d+)<\/cStat>/)
    const mensagemMatch = responseText.match(/<xMotivo>(.*?)<\/xMotivo>/)

    const status = statusMatch ? statusMatch[1] : '000'
    const mensagem = mensagemMatch ? mensagemMatch[1] : 'Resposta não processada'

    // Status 100 = Autorizada
    const autorizada = status === '100'

    return {
      sucesso: autorizada,
      status: autorizada ? 'AUTORIZADA' : 'REJEITADA',
      chave_acesso: chaveMatch ? chaveMatch[1] : undefined,
      protocolo: protocoloMatch ? protocoloMatch[1] : undefined,
      mensagem: `${status} - ${mensagem}`,
      xml_autorizado: autorizada ? xmlAssinado : undefined,
      data_autorizacao: autorizada ? new Date().toISOString() : undefined
    }
  } catch (error: any) {
    return {
      sucesso: false,
      status: 'ERRO',
      mensagem: `Erro ao comunicar com SEFAZ: ${error.message}`
    }
  }
}

function getURLWebservice(uf: string, ambiente: 'PRODUCAO' | 'HOMOLOGACAO', servico: string): string {
  // URLs dos webservices por UF (SP como exemplo)
  const urls: Record<string, Record<string, Record<string, string>>> = {
    'SP': {
      'PRODUCAO': {
        'NFeAutorizacao': 'https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx'
      },
      'HOMOLOGACAO': {
        'NFeAutorizacao': 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx'
      }
    },
    // Ambiente Nacional (Virtual RS) - usado por outros estados
    'SVRS': {
      'PRODUCAO': {
        'NFeAutorizacao': 'https://nfe.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx'
      },
      'HOMOLOGACAO': {
        'NFeAutorizacao': 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx'
      }
    }
  }

  // Se UF não implementada, usa SVRS (Virtual RS)
  const estadoConfig = urls[uf] || urls['SVRS']
  return estadoConfig[ambiente][servico]
}

export async function consultarNFe(
  chaveAcesso: string,
  ambiente: 'PRODUCAO' | 'HOMOLOGACAO',
  uf: string
): Promise<RetornoSEFAZ> {
  
  const url = getURLWebservice(uf, ambiente, 'NFeConsulta')
  
  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Body>
    <nfeConsultaNF xmlns="http://www.portalfiscal.inf.br/nfe">
      <consSitNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
        <tpAmb>${ambiente === 'PRODUCAO' ? '1' : '2'}</tpAmb>
        <xServ>CONSULTAR</xServ>
        <chNFe>${chaveAcesso}</chNFe>
      </consSitNFe>
    </nfeConsultaNF>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8'
      },
      body: soapEnvelope
    })

    const responseText = await response.text()
    
    const statusMatch = responseText.match(/<cStat>(\d+)<\/cStat>/)
    const mensagemMatch = responseText.match(/<xMotivo>(.*?)<\/xMotivo>/)
    
    return {
      sucesso: statusMatch?.[1] === '100',
      status: statusMatch?.[1] === '100' ? 'AUTORIZADA' : 'REJEITADA',
      chave_acesso: chaveAcesso,
      mensagem: mensagemMatch?.[1] || 'Consulta realizada'
    }
  } catch (error: any) {
    return {
      sucesso: false,
      status: 'ERRO',
      mensagem: `Erro ao consultar: ${error.message}`
    }
  }
}
