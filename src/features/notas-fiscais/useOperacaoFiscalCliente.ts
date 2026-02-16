// =====================================================
// HOOK - Buscar Operação Fiscal Padrão do Cliente
// Hook para pré-selecionar operação fiscal baseada no tipo de contribuinte
// Data: 10/02/2026
// =====================================================

import { useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { logger } from '../../utils/logger'

interface OperacaoFiscalCliente {
  operacao_fiscal_id: number | null
  operacao_fiscal_codigo: string | null
  operacao_fiscal_nome: string | null
  cfop_dentro_estado: string | null
  cfop_fora_estado: string | null
  cfop_exterior: string | null
  natureza_operacao: string | null
  tipo_contribuinte_nome: string | null
  eh_exportacao: boolean | null
}

/**
 * Hook para buscar operação fiscal padrão do cliente
 * baseada no tipo de contribuinte vinculado
 */
export function useOperacaoFiscalCliente() {
  
  /**
   * Busca a operação fiscal padrão do cliente
   * @param clienteId - ID do cliente
   * @param ufDestino - UF de destino (opcional) para determinar CFOP correto
   * @returns Operação fiscal padrão ou null
   */
  const buscarOperacaoFiscalCliente = useCallback(async (
    clienteId: number | string,
    ufDestino?: string
  ): Promise<OperacaoFiscalCliente | null> => {
    try {
      logger.debug('Buscando operação fiscal do cliente', { clienteId, ufDestino })

      // Buscar cliente com tipo de contribuinte e operação fiscal padrão
      const { data, error } = await supabase
        .from('clientes')
        .select(`
          id,
          tipo_contribuinte_id,
          tipos_contribuinte (
            id,
            nome,
            operacao_fiscal_padrao_id,
            operacoes_fiscais (
              id,
              codigo,
              nome,
              cfop_dentro_estado,
              cfop_fora_estado,
              cfop_exterior,
              natureza_operacao,
              eh_exportacao
            )
          )
        `)
        .eq('id', clienteId)
        .single()

      if (error) {
        logger.error('Erro ao buscar operação fiscal do cliente', error)
        return null
      }

      if (!data || !data.tipos_contribuinte || !data.tipos_contribuinte.operacoes_fiscais) {
        logger.debug('Cliente sem operação fiscal padrão configurada')
        return null
      }

      const tipoContribuinte = data.tipos_contribuinte as any
      const operacaoFiscal = tipoContribuinte.operacoes_fiscais

      logger.info('Operação fiscal encontrada', {
        tipoContribuinte: tipoContribuinte.nome,
        operacao: operacaoFiscal.nome
      })

      return {
        operacao_fiscal_id: operacaoFiscal.id,
        operacao_fiscal_codigo: operacaoFiscal.codigo,
        operacao_fiscal_nome: operacaoFiscal.nome,
        cfop_dentro_estado: operacaoFiscal.cfop_dentro_estado,
        cfop_fora_estado: operacaoFiscal.cfop_fora_estado,
        cfop_exterior: operacaoFiscal.cfop_exterior,
        natureza_operacao: operacaoFiscal.natureza_operacao,
        tipo_contribuinte_nome: tipoContribuinte.nome,
        eh_exportacao: operacaoFiscal.eh_exportacao
      }
    } catch (error) {
      logger.error('Erro ao buscar operação fiscal do cliente', error)
      return null
    }
  }, [])

  return { buscarOperacaoFiscalCliente }
}
