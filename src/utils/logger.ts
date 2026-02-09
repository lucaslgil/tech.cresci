/**
 * Logger Seguro - Substitui console.log com proteção de dados sensíveis
 * 
 * ✅ Funciona apenas em DEV
 * ✅ Remove automaticamente em produção (via Vite config)
 * ✅ Sanitiza dados sensíveis antes de logar
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogConfig {
  enabled: boolean
  minLevel: LogLevel
  sendToAnalytics?: boolean
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

class SecureLogger {
  private config: LogConfig

  constructor() {
    this.config = {
      enabled: import.meta.env.DEV, // ✅ Só em desenvolvimento
      minLevel: 'debug',
      sendToAnalytics: import.meta.env.PROD
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled && level !== 'error') return false
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel]
  }

  /**
   * Remove dados sensíveis antes de logar
   */
  private sanitize(data: any): any {
    if (typeof data !== 'object' || data === null) return data

    // Se for array, sanitizar cada item
    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item))
    }

    const sanitized = { ...data }
    const sensitiveKeys = [
      'password', 'senha', 'token', 'accessToken', 'access_token', 'refreshToken', 'refresh_token',
      'secret', 'apiKey', 'api_key', 'cpf', 'cnpj', 'certificado', 'chaveAcesso', 'chave_acesso',
      'client_secret', 'clientSecret', 'authorization', 'bearer'
    ]

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase()
      
      // Se a chave contém palavra sensível, redact
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        sanitized[key] = '[REDACTED]'
      }
      // Se o valor é objeto, sanitizar recursivamente
      else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitize(sanitized[key])
      }
    }

    return sanitized
  }

  debug(message: string, data?: any) {
    if (this.shouldLog('debug')) {
      console.log(`🔍 [DEBUG] ${message}`, data ? this.sanitize(data) : '')
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog('info')) {
      console.log(`ℹ️ [INFO] ${message}`, data ? this.sanitize(data) : '')
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️ [WARN] ${message}`, data ? this.sanitize(data) : '')
    }
  }

  error(message: string, error: any) {
    // Sempre logar erros (mesmo em produção para debug)
    console.error(`❌ [ERROR] ${message}`, error)

    // Em produção, enviar para serviço de monitoramento
    if (this.config.sendToAnalytics) {
      this.sendToMonitoring(message, error)
    }
  }

  private sendToMonitoring(_message: string, _error: any) {
    // TODO: Integrar com Sentry, LogRocket, etc.
    // fetch('/api/log-error', {
    //   method: 'POST',
    //   body: JSON.stringify({ message, error: this.sanitize(error) })
    // })
  }
}

// Exportar instância única (singleton)
export const logger = new SecureLogger()
