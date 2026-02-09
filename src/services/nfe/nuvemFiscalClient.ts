// =====================================================
// CLIENTE NUVEM FISCAL
// Integração com API Nuvem Fiscal para emissão de NF-e
// =====================================================

import axios from 'axios'
import type { AxiosInstance } from 'axios'
import type { RetornoSEFAZ } from './types'
import { NuvemFiscalAuth } from './nuvemFiscalAuth'

interface NuvemFiscalConfig {
  clientId: string
  clientSecret: string
  ambiente: 'SANDBOX' | 'PRODUCAO'
}

/*
// Interface temporária - será refatorada
interface DadosNFe {
  natureza_operacao: string
  tipo_documento: number // 0=entrada, 1=saída
  finalidade_emissao: number // 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
  ambiente: number // 1=Produção, 2=Homologação
  emitente: {
    cpf_cnpj: string
    inscricao_estadual?: string
    nome_razao_social: string
    nome_fantasia?: string
    regime_tributario: number // 1=Simples Nacional, 2=Simples exc., 3=Regime Normal
    endereco: {
      logradouro: string
      numero: string
      complemento?: string
      bairro: string
      codigo_municipio: string
      nome_municipio: string
      uf: string
      cep: string
    }
  }
  destinatario: {
    cpf_cnpj: string
    inscricao_estadual?: string
    indicador_inscricao_estadual: number // 1=Contribuinte, 2=Isento, 9=Não contribuinte
    nome_razao_social: string
    endereco: {
      logradouro: string
      numero: string
      complemento?: string
      bairro: string
      codigo_municipio: string
      nome_municipio: string
      uf: string
      cep: string
    }
  }
  itens: Array<{
    numero_item: number
    codigo_produto: string
    descricao: string
    cfop: string
    ncm: string
    unidade_comercial: string
    quantidade_comercial: number
    valor_unitario_comercial: number
    valor_bruto: number
    icms: {
      origem: number
      situacao_tributaria: string
      modalidade_base_calculo?: number
      base_calculo?: number
      aliquota?: number
      valor?: number
    }
    pis: {
      situacao_tributaria: string
      base_calculo?: number
      aliquota?: number
      valor?: number
    }
    cofins: {
      situacao_tributaria: string
      base_calculo?: number
      aliquota?: number
      valor?: number
    }
  }>
  pagamento: {
    formas_pagamento: Array<{
      meio_pagamento: number // 01=Dinheiro, 02=Cheque, 03=Cartão Crédito, etc
      valor: number
    }>
  }
  informacoes_adicionais_contribuinte?: string
}
*/

/**
 * Cliente para integração com Nuvem Fiscal
 * Documentação: https://dev.nuvemfiscal.com.br/docs
 */
export class NuvemFiscalClient {
  private client: AxiosInstance
  private ambiente: 'SANDBOX' | 'PRODUCAO'
  private auth: NuvemFiscalAuth

  constructor(config: NuvemFiscalConfig) {
    this.ambiente = config.ambiente
    this.auth = new NuvemFiscalAuth({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      ambiente: config.ambiente
    })
    
    const baseURL = config.ambiente === 'SANDBOX' 
      ? 'https://api.sandbox.nuvemfiscal.com.br'
      : 'https://api.nuvemfiscal.com.br'

    this.client = axios.create({
      baseURL,
      timeout: 60000 // 60 segundos
    })

    console.log(`🌐 Nuvem Fiscal Client configurado [${config.ambiente}]`)
    console.log(`🔐 Usando OAuth 2.0 (client_credentials)`)
  }

  /**
   * Obter headers autenticados
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.auth.getAccessToken()
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  /**
   * Emitir NF-e através da Nuvem Fiscal
   */
  async emitirNFe(dados: any): Promise<RetornoSEFAZ> {
    try {
      // Validar estrutura
      if (!dados || !dados.infNFe) {
        throw new Error('Dados da NF-e inválidos: estrutura infNFe ausente')
      }

      const qtdItens = dados.infNFe.det?.length || 0
      
      console.log('📤 Enviando NF-e para Nuvem Fiscal...', {
        ambiente: this.ambiente,
        ambienteNota: dados.ambiente,
        natureza: dados.infNFe.ide?.natOp || 'N/A',
        itens: qtdItens
      })

      console.log('📦 Estrutura da NF-e:', {
        ambiente: dados.ambiente,
        referencia: dados.referencia,
        temInfNFe: !!dados.infNFe,
        temIde: !!dados.infNFe?.ide,
        temEmit: !!dados.infNFe?.emit,
        temDest: !!dados.infNFe?.dest,
        qtdItens
      })

      // Endpoint: POST /nfe
      const headers = await this.getAuthHeaders()
      console.log('🔑 Headers preparados, enviando requisição...')
      
      const response = await this.client.post('/nfe', dados, { headers })

      console.log('📥 Resposta da Nuvem Fiscal (completa):', response.data)
      console.log('📥 Resposta JSON:', JSON.stringify(response.data, null, 2))

      // Processar resposta
      const resultado = this.processarResposta(response.data)
      console.log('📊 Resultado processado:', resultado)
      
      return resultado

    } catch (error: any) {
      console.error('❌ Erro ao emitir NF-e na Nuvem Fiscal:', error)

      if (error.response) {
        const apiError = error.response.data
        console.error('📋 Detalhes COMPLETOS do erro:', apiError)
        console.error('📋 Detalhes JSON:', JSON.stringify(apiError, null, 2))
        console.error('🔢 Status:', error.response.status)
        console.error('📨 Headers:', error.response.headers)
        console.error('🔍 Error code:', apiError.error?.code)
        console.error('💬 Error message:', apiError.error?.message)
        
        // Tratamento especial para erro de certificado
        if (apiError.error?.code === 'CertificateNotFound') {
          throw new Error(
            '🔐 CERTIFICADO NÃO CONFIGURADO\n\n' +
            '✅ Todos os campos da nota estão corretos!\n' +
            'Agora você precisa:\n\n' +
            '1. Acessar: https://sandbox.nuvemfiscal.com.br\n' +
            '2. Ir em Configurações → Certificados Digitais\n' +
            '3. Fazer upload do arquivo .pfx\n' +
            '4. Vincular à empresa (CNPJ: 43.670.056/0001-66)\n' +
            '5. Testar novamente\n\n' +
            '📖 Consulte: CONFIGURAR_CERTIFICADO_NUVEM_FISCAL.md'
          )
        }
        
        // Tentar extrair mensagem de erro mais específica
        const errorMessage = apiError.error?.message ||
                           apiError.error || 
                           apiError.message || 
                           apiError.erro || 
                           apiError.mensagem ||
                           (apiError.errors ? JSON.stringify(apiError.errors) : null) ||
                           JSON.stringify(apiError)
        
        throw new Error(`Erro ${error.response.status}: ${errorMessage}`)
      }

      throw new Error(`Erro na comunicação com Nuvem Fiscal: ${error.message}`)
    }
  }

  /**   * Configurar empresa na Nuvem Fiscal
   */
  async configurarEmpresa(cnpj: string, certificadoPfx: string, senhaCertificado: string): Promise<void> {
    try {
      console.log(`🏢 Configurando empresa na Nuvem Fiscal: ${cnpj}`)

      const headers = await this.getAuthHeaders()
      
      const config = {
        certificado: {
          arquivo: certificadoPfx, // Base64 do .pfx
          senha: senhaCertificado
        }
      }

      const cnpjLimpo = cnpj.replace(/\D/g, '')
      const response = await this.client.put(`/empresas/${cnpjLimpo}/nfe`, config, { headers })

      console.log('✅ Empresa configurada com sucesso na Nuvem Fiscal')
      console.log('📋 Resposta:', response.data)

    } catch (error: any) {
      console.error('❌ Erro ao configurar empresa:', error)
      
      if (error.response) {
        const apiError = error.response.data
        console.error('📋 Detalhes:', JSON.stringify(apiError, null, 2))
      }
      
      throw new Error(`Erro ao configurar empresa: ${error.message}`)
    }
  }

  /**   * Consultar NF-e emitida
   */
  async consultarNFe(id: string): Promise<RetornoSEFAZ> {
    try {
      console.log(`🔍 Consultando NF-e na Nuvem Fiscal: ${id}`)

      const headers = await this.getAuthHeaders()
      const response = await this.client.get(`/nfe/${id}`, { headers })

      return this.processarResposta(response.data)

    } catch (error: any) {
      console.error('❌ Erro ao consultar NF-e:', error)
      throw new Error(`Erro ao consultar NF-e: ${error.message}`)
    }
  }

  /**
   * Baixar XML da NF-e
   */
  async baixarXML(id: string): Promise<string> {
    try {
      console.log(`📄 Baixando XML da NF-e: ${id}`)

      const headers = await this.getAuthHeaders()
      const response = await this.client.get(`/nfe/${id}/xml`, {
        headers,
        responseType: 'text'
      })

      return response.data

    } catch (error: any) {
      console.error('❌ Erro ao baixar XML:', error)
      throw new Error(`Erro ao baixar XML: ${error.message}`)
    }
  }

  /**
   * Baixar PDF (DANFE) da NF-e
   */
  async baixarPDF(id: string): Promise<Blob> {
    try {
      console.log(`📄 Baixando PDF da NF-e: ${id}`)

      const headers = await this.getAuthHeaders()
      const response = await this.client.get(`/nfe/${id}/pdf`, {
        headers,
        responseType: 'blob'
      })

      return response.data

    } catch (error: any) {
      console.error('❌ Erro ao baixar PDF:', error)
      throw new Error(`Erro ao baixar PDF: ${error.message}`)
    }
  }

  /**
   * Cancelar NF-e
   */
  async cancelarNFe(id: string, justificativa: string): Promise<RetornoSEFAZ> {
    try {
      console.log(`🚫 Cancelando NF-e: ${id}`)
      console.log(`📝 Justificativa: ${justificativa}`)

      if (justificativa.length < 15) {
        throw new Error('Justificativa deve ter no mínimo 15 caracteres')
      }

      const headers = await this.getAuthHeaders()
      
      // Corpo da requisição conforme documentação Nuvem Fiscal
      const body = {
        justificativa: justificativa
      }
      
      console.log('📤 Enviando cancelamento:', { id, body })
      
      const response = await this.client.post(`/nfe/${id}/cancelamento`, body, { headers })

      console.log('✅ Resposta do cancelamento:', response.data)
      return this.processarResposta(response.data)

    } catch (error: any) {
      console.error('❌ Erro ao cancelar NF-e:', error)
      
      // Capturar detalhes do erro da API
      if (error.response) {
        console.error('📛 Status:', error.response.status)
        console.error('📛 Dados do erro:', error.response.data)
        console.error('📛 Headers:', error.response.headers)
        
        const mensagemErro = error.response.data?.mensagem || 
                            error.response.data?.message || 
                            error.response.data?.erro ||
                            JSON.stringify(error.response.data)
        
        throw new Error(`Erro da API (${error.response.status}): ${mensagemErro}`)
      }
      
      throw new Error(`Erro ao cancelar NF-e: ${error.message}`)
    }
  }

  /**
   * Processar resposta da API e converter para formato padrão do sistema
   */
  private processarResposta(dados: any): RetornoSEFAZ {
    // Status possíveis na Nuvem Fiscal:
    // - autorizado: NF-e autorizada pela SEFAZ
    // - processando: NF-e em processamento
    // - rejeitado: NF-e rejeitada pela SEFAZ
    // - cancelado: NF-e cancelada
    // - denegado: NF-e denegada

    const statusMap: Record<string, 'AUTORIZADA' | 'REJEITADA' | 'DENEGADA' | 'CANCELADA' | 'PROCESSANDO'> = {
      'autorizado': 'AUTORIZADA',
      'rejeitado': 'REJEITADA',
      'denegado': 'DENEGADA',
      'cancelado': 'CANCELADA',
      'processando': 'PROCESSANDO'
    }

    return {
      status: statusMap[dados.status] || 'REJEITADA',
      codigo: String(dados.autorizacao?.codigo_status || dados.codigo_status || ''),
      mensagem: dados.autorizacao?.motivo_status || dados.mensagem_sefaz || dados.mensagem || '',
      chaveAcesso: dados.autorizacao?.chave_acesso || dados.chave_acesso || dados.chave || '',
      numeroProtocolo: dados.numero_protocolo || '',
      dataHoraAutorizacao: dados.autorizacao?.data_recebimento || dados.data_autorizacao || new Date().toISOString(),
      xmlAssinado: dados.xml || '',
      xmlRetorno: dados.xml_retorno || '',
      nuvemFiscalId: dados.id || '' // ID interno da Nuvem Fiscal
    }
  }

  /**
   * Verificar saúde da API
   */
  async verificarConexao(): Promise<boolean> {
    try {
      // Endpoint de health check (se disponível)
      await this.client.get('/empresas', { timeout: 5000 })
      console.log('✅ Conexão com Nuvem Fiscal OK')
      return true
    } catch (error) {
      console.error('❌ Falha na conexão com Nuvem Fiscal:', error)
      return false
    }
  }
}
