/**
 * Service para comunicação com Nuvem Fiscal via Edge Function
 * 
 * ✅ SEGURO: Credenciais ficam no servidor (Edge Function)
 * ❌ NUNCA usar VITE_NUVEM_FISCAL_* (expõe credenciais no bundle)
 */

import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nuvem-fiscal`

/**
 * Call Edge Function with authentication
 */
async function callEdgeFunction<T>(payload: any): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Usuário não autenticado')
  }

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erro na comunicação com Nuvem Fiscal')
  }

  return await response.json()
}

export interface EmitirNFeParams {
  nfeData: any
  ambiente?: 'homologacao' | 'producao'
}

export interface CancelarNFeParams {
  id: string
  justificativa: string
}

export interface InutilizarNumeracaoParams {
  cnpj: string
  serie: string
  numeroInicial: number
  numeroFinal: number
  justificativa: string
  ambiente: 'homologacao' | 'producao'
}

/**
 * Emitir NF-e
 */
export async function emitirNFe(params: EmitirNFeParams) {
  logger.info('Emitindo NF-e via Edge Function')
  
  return callEdgeFunction({
    action: 'emitir',
    ...params,
  })
}

/**
 * Consultar NF-e
 */
export async function consultarNFe(id: string) {
  logger.debug('Consultando NF-e')
  
  return callEdgeFunction({
    action: 'consultar',
    id,
  })
}

/**
 * Cancelar NF-e
 */
export async function cancelarNFe(params: CancelarNFeParams) {
  logger.info('Cancelando NF-e')
  
  if (!params.justificativa || params.justificativa.length < 15) {
    throw new Error('Justificativa deve ter no mínimo 15 caracteres')
  }
  
  return callEdgeFunction({
    action: 'cancelar',
    ...params,
  })
}

/**
 * Inutilizar numeração
 */
export async function inutilizarNumeracao(params: InutilizarNumeracaoParams) {
  logger.info('Inutilizando numeração', { range: `${params.numeroInicial}-${params.numeroFinal}` })
  
  if (!params.justificativa || params.justificativa.length < 15) {
    throw new Error('Justificativa deve ter no mínimo 15 caracteres')
  }
  
  return callEdgeFunction({
    action: 'inutilizar',
    ...params,
  })
}

/**
 * Testar conexão com Nuvem Fiscal
 */
export async function testarConexao() {
  logger.debug('Testando conexão com Nuvem Fiscal')
  
  return callEdgeFunction({
    action: 'test',
  })
}

// ==========================================
// EXEMPLO DE USO NO COMPONENTE
// ==========================================
/*
import { emitirNFe, consultarNFe, cancelarNFe } from '../services/nuvemFiscalService'

// Emitir NF-e
const resultado = await emitirNFe({
  nfeData: {
    // dados da nota...
  },
  ambiente: 'homologacao' // ou 'producao'
})

// Consultar NF-e
const nota = await consultarNFe('id-da-nota')

// Cancelar NF-e
await cancelarNFe({
  id: 'id-da-nota',
  justificativa: 'Nota emitida com erro de valores'
})
*/
