// =====================================================
// CLIENTE SEFAZ - Suporta API e Direto
// Comunicação com SEFAZ (API paga ou SOAP gratuito)
// =====================================================

import axios, { type AxiosInstance } from 'axios'
import type { ConfiguracaoNFe, RetornoSEFAZ } from './types'
import { AssinaturaDigitalService } from './assinaturaDigitalService'
import { SefazClientDireto } from './sefazClientDireto'

export class SefazClient {
  private api?: AxiosInstance
  private config: ConfiguracaoNFe
  private clienteDireto?: SefazClientDireto
  private assinatura?: AssinaturaDigitalService

  constructor(config: ConfiguracaoNFe) {
    this.config = config

    const provider = config.api_intermediaria?.provider || 'DIRETO'

    if (provider === 'DIRETO') {
      // Modo GRATUITO - Comunicação direta SOAP
      console.log('🆓 Modo GRATUITO: Comunicação direta com SEFAZ')
      
      if (!config.certificado?.arquivo || !config.certificado?.senha) {
        throw new Error('Certificado digital obrigatório para comunicação direta')
      }

      this.assinatura = new AssinaturaDigitalService()
      // Certificado será carregado no primeiro uso
    } else {
      // Modo PAGO - API intermediária
      console.log(`💳 Modo API: ${provider}`)
      
      const baseURLs = {
        FOCUS: config.ambiente === 'PRODUCAO' 
          ? 'https://api.focusnfe.com.br' 
          : 'https://homologacao.focusnfe.com.br',
        TECNOSPEED: config.ambiente === 'PRODUCAO'
          ? 'https://api.tecnospeed.com.br'
          : 'https://homologacao.tecnospeed.com.br',
        ENOTAS: 'https://api.enotasgw.com.br',
        DIRETO: ''
      }

      this.api = axios.create({
        baseURL: config.api_intermediaria?.base_url || baseURLs[provider],
        headers: {
          'Authorization': `Bearer ${config.api_intermediaria?.token || ''}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      })
    }
  }

  async enviarNFe(xml: string, referencia: string): Promise<RetornoSEFAZ> {
    try {
      const provider = this.config.api_intermediaria?.provider || 'DIRETO'

      if (provider === 'DIRETO') {
        return await this.enviarDiretoSEFAZ(xml)
      } else if (provider === 'FOCUS') {
        return await this.enviarFocusNFe(xml, referencia)
      }

      throw new Error(`Provider ${provider} não implementado`)
    } catch (error: any) {
      console.error('Erro ao enviar NF-e:', error)
      return {
        status: 'ERRO',
        mensagem: error.message || 'Erro ao enviar nota fiscal',
        erros: [{
          codigo: 'ERRO_ENVIO',
          mensagem: error.message
        }]
      }
    }
  }

  private async enviarDiretoSEFAZ(xml: string): Promise<RetornoSEFAZ> {
    if (!this.assinatura) {
      throw new Error('Serviço de assinatura não inicializado')
    }

    // Carregar certificado na primeira vez
    if (!this.clienteDireto) {
      console.log('🔐 Carregando certificado digital...')
      await this.assinatura.carregarCertificado(
        this.config.certificado!.arquivo!,
        this.config.certificado!.senha!
      )

      // Validar certificado
      const validacao = this.assinatura.validarCertificado()
      if (!validacao.valido) {
        throw new Error(validacao.mensagem)
      }

      console.log('✅', validacao.mensagem)

      // Criar cliente SEFAZ direto
      // TODO: Pegar UF da empresa
      this.clienteDireto = new SefazClientDireto(
        this.assinatura,
        this.config.ambiente,
        'SP' // TODO: Parametrizar
      )
    }

    return await this.clienteDireto.enviarNFe(xml)
  }

  private async enviarFocusNFe(xml: string, referencia: string): Promise<RetornoSEFAZ> {
    try {
      // Focus NFe usa JSON ao invés de XML
      const response = await this.api!.post(`/v2/nfe?ref=${referencia}`, {
        xml_nfe: Buffer.from(xml).toString('base64')
      })

      const data = response.data

      // Processar resposta da Focus
      if (data.status === 'autorizado') {
        return {
          status: 'AUTORIZADA',
          chave_acesso: data.chave_nfe,
          numero_protocolo: data.protocolo,
          data_autorizacao: data.data_emissao,
          codigo_status: data.codigo_status,
          mensagem: data.mensagem_sefaz || 'Nota fiscal autorizada com sucesso',
          xml_autorizado: data.caminho_xml_nota_fiscal ? 
            await this.baixarXML(data.caminho_xml_nota_fiscal) : undefined,
          xml_assinado: xml
        }
      } else if (data.status === 'processando_autorizacao') {
        return {
          status: 'PROCESSANDO',
          mensagem: 'Nota fiscal em processamento na SEFAZ',
          codigo_status: data.codigo_status
        }
      } else if (data.status === 'erro_autorizacao' || data.status === 'rejeitado') {
        return {
          status: 'REJEITADA',
          codigo_status: data.codigo_status,
          mensagem: data.mensagem_sefaz || 'Nota fiscal rejeitada',
          erros: data.erros?.map((e: any) => ({
            codigo: e.codigo,
            mensagem: e.mensagem
          }))
        }
      } else if (data.status === 'denegado') {
        return {
          status: 'DENEGADA',
          codigo_status: data.codigo_status,
          mensagem: data.mensagem_sefaz || 'Nota fiscal denegada'
        }
      }

      return {
        status: 'ERRO',
        mensagem: 'Status desconhecido: ' + data.status
      }
    } catch (error: any) {
      console.error('Erro Focus NFe:', error.response?.data || error)
      
      const errorData = error.response?.data
      return {
        status: 'ERRO',
        mensagem: errorData?.mensagem || error.message || 'Erro ao comunicar com Focus NFe',
        erros: errorData?.erros || [{
          codigo: 'ERRO_API',
          mensagem: error.message
        }]
      }
    }
  }

  async consultarNFe(chaveAcesso: string): Promise<RetornoSEFAZ> {
    try {
      const provider = this.config.api_intermediaria?.provider || 'FOCUS'

      if (provider === 'FOCUS') {
        const response = await this.api!.get(`/v2/nfe/${chaveAcesso}`)
        const data = response.data

        return {
          status: this.mapearStatusFocus(data.status),
          chave_acesso: data.chave_nfe,
          numero_protocolo: data.protocolo,
          data_autorizacao: data.data_emissao,
          mensagem: data.mensagem_sefaz || 'Consulta realizada',
          xml_autorizado: data.caminho_xml_nota_fiscal ?
            await this.baixarXML(data.caminho_xml_nota_fiscal) : undefined
        }
      }

      throw new Error(`Provider ${provider} não implementado`)
    } catch (error: any) {
      return {
        status: 'ERRO',
        mensagem: error.message || 'Erro ao consultar nota fiscal'
      }
    }
  }

  async cancelarNFe(chaveAcesso: string, justificativa: string): Promise<RetornoSEFAZ> {
    try {
      const provider = this.config.api_intermediaria?.provider || 'FOCUS'

      if (provider === 'FOCUS') {
        const response = await this.api!.delete(`/v2/nfe/${chaveAcesso}`, {
          data: { justificativa }
        })

        const data = response.data

        if (data.status === 'cancelado') {
          return {
            status: 'CANCELADA',
            chave_acesso: chaveAcesso,
            numero_protocolo: data.protocolo,
            mensagem: 'Nota fiscal cancelada com sucesso'
          }
        }

        return {
          status: 'ERRO',
          mensagem: data.mensagem_sefaz || 'Erro ao cancelar nota fiscal'
        }
      }

      throw new Error(`Provider ${provider} não implementado`)
    } catch (error: any) {
      return {
        status: 'ERRO',
        mensagem: error.response?.data?.mensagem || error.message || 'Erro ao cancelar nota fiscal'
      }
    }
  }

  async inutilizarNumero(serie: number, numeroInicial: number, numeroFinal: number, justificativa: string): Promise<RetornoSEFAZ> {
    try {
      const provider = this.config.api_intermediaria?.provider || 'FOCUS'

      if (provider === 'FOCUS') {
        const response = await this.api!.post('/v2/nfe/inutilizacao', {
          serie,
          numero_inicial: numeroInicial,
          numero_final: numeroFinal,
          justificativa
        })

        const data = response.data

        return {
          status: 'AUTORIZADA',
          numero_protocolo: data.protocolo,
          mensagem: 'Números inutilizados com sucesso'
        }
      }

      throw new Error(`Provider ${provider} não implementado`)
    } catch (error: any) {
      return {
        status: 'ERRO',
        mensagem: error.message || 'Erro ao inutilizar números'
      }
    }
  }

  private async baixarXML(url: string): Promise<string> {
    try {
      const response = await axios.get(url)
      return response.data
    } catch (error) {
      console.error('Erro ao baixar XML:', error)
      return ''
    }
  }

  private mapearStatusFocus(status: string): RetornoSEFAZ['status'] {
    const mapeamento: { [key: string]: RetornoSEFAZ['status'] } = {
      'autorizado': 'AUTORIZADA',
      'processando_autorizacao': 'PROCESSANDO',
      'rejeitado': 'REJEITADA',
      'erro_autorizacao': 'REJEITADA',
      'cancelado': 'CANCELADA',
      'denegado': 'DENEGADA'
    }
    return mapeamento[status] || 'ERRO'
  }
}
