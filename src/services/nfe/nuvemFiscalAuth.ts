// =====================================================
// SERVIÇO DE AUTENTICAÇÃO NUVEM FISCAL
// Gerencia OAuth 2.0 (client_credentials flow)
// =====================================================

import axios from 'axios'
import { logger } from '../../utils/logger'

interface TokenResponse {
  access_token: string
  token_type: string
  scope: string
  expires_in: number
}

interface Credentials {
  clientId: string
  clientSecret: string
  ambiente: 'SANDBOX' | 'PRODUCAO'
}

/**
 * Gerencia autenticação OAuth 2.0 com Nuvem Fiscal
 */
export class NuvemFiscalAuth {
  private credentials: Credentials
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(credentials: Credentials) {
    this.credentials = credentials
  }

  /**
   * Obter token de acesso (com cache)
   */
  async getAccessToken(): Promise<string> {
    // Se token existe e ainda é válido, retorna do cache
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      logger.debug('Usando token em cache')
      return this.accessToken
    }

    logger.debug('Obtendo novo token de acesso')
    
    try {
      // Montar corpo da requisição OAuth
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
        scope: 'empresa cep cnpj nfe nfce nfse cte mdfe' // Todos os escopos necessários
      })

      const response = await axios.post<TokenResponse>(
        'https://auth.nuvemfiscal.com.br/oauth/token',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 30000
        }
      )

      this.accessToken = response.data.access_token
      
      // Calcular expiração (renovar 5 minutos antes do vencimento)
      const expiresInMs = response.data.expires_in * 1000
      const bufferMs = 5 * 60 * 1000 // 5 minutos
      this.tokenExpiry = Date.now() + expiresInMs - bufferMs

      logger.info('Token obtido com sucesso', { expiresIn: response.data.expires_in })

      return this.accessToken

    } catch (error: any) {
      logger.error('Erro ao obter token OAuth', error)
      
      if (error.response) {
        throw new Error(
          `Erro de autenticação (${error.response.status}): ${
            error.response.data?.error_description || 
            error.response.data?.error || 
            'Credenciais inválidas'
          }`
        )
      }

      throw new Error(`Erro ao autenticar: ${error.message}`)
    }
  }

  /**
   * Invalidar token (forçar renovação)
   */
  invalidateToken(): void {
    this.accessToken = null
    this.tokenExpiry = 0
    logger.debug('Token invalidado - será renovado na próxima requisição')
  }
}
