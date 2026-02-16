// =====================================================
// SERVICES - SINCRONIZAÇÃO VENDAS
// Envia vendas do PDV para a retaguarda
// =====================================================

import { createClient } from '@supabase/supabase-js'
import { ConfigPDV } from '../types/electron'
import { Venda, VendasService } from './vendasService'

export interface ResultadoSincronizacao {
  sucesso: boolean
  vendasSincronizadas: number
  erros: string[]
}

export class SincronizacaoVendasService {
  private config: ConfigPDV
  private vendasService: VendasService
  private supabase: any

  constructor(config: ConfigPDV) {
    this.config = config
    this.vendasService = new VendasService(config)
    
    // Inicializar cliente Supabase
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
  }

  /**
   * Sincronizar todas as vendas pendentes
   */
  async sincronizarTodas(): Promise<ResultadoSincronizacao> {
    const vendas = await this.vendasService.listarNaoSincronizadas()
    
    if (vendas.length === 0) {
      return {
        sucesso: true,
        vendasSincronizadas: 0,
        erros: []
      }
    }

    let sincronizadas = 0
    const erros: string[] = []

    for (const venda of vendas) {
      try {
        await this.sincronizarVenda(venda)
        sincronizadas++
      } catch (error: any) {
        erros.push(`Venda ${venda.uuid}: ${error.message}`)
      }
    }

    return {
      sucesso: erros.length === 0,
      vendasSincronizadas: sincronizadas,
      erros
    }
  }

  /**
   * Sincronizar uma venda específica
   */
  private async sincronizarVenda(venda: Venda): Promise<void> {
    // 1. Inserir venda na retaguarda
    const { data: vendaRetaguarda, error: vendaError } = await this.supabase
      .from('vendas')
      .insert({
        empresa_id: venda.empresa_id,
        numero: venda.numero,
        tipo_venda: venda.tipo_venda,
        status: venda.status,
        cliente_id: venda.cliente_id,
        data_venda: venda.data_venda,
        subtotal: venda.subtotal,
        desconto: venda.desconto,
        acrescimo: venda.acrescimo,
        total: venda.total,
        vendedor: venda.usuario_nome,
        observacoes: venda.observacoes,
        origem: 'PDV',
        pdv_uuid: venda.uuid // Guardar UUID do PDV
      })
      .select()
      .single()

    if (vendaError) throw vendaError

    // 2. Inserir itens
    if (venda.itens && venda.itens.length > 0) {
      const itensParaInserir = venda.itens.map(item => ({
        venda_id: vendaRetaguarda.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        desconto: item.desconto,
        acrescimo: item.acrescimo,
        valor_total: item.valor_total,
        numero_item: item.numero_item
      }))

      const { error: itensError } = await this.supabase
        .from('vendas_itens')
        .insert(itensParaInserir)

      if (itensError) throw itensError
    }

    // 3. Inserir pagamentos (se houver)
    if (venda.pagamentos && venda.pagamentos.length > 0) {
      const pagamentosParaInserir = venda.pagamentos.map(pag => ({
        venda_id: vendaRetaguarda.id,
        forma_pagamento: pag.forma_pagamento,
        valor: pag.valor,
        parcela: pag.numero_parcela
      }))

      const { error: pagError } = await this.supabase
        .from('vendas_pagamentos')
        .insert(pagamentosParaInserir)

      if (pagError) throw pagError
    }

    // 4. Marcar como sincronizada no PDV
    await this.vendasService.marcarComoSincronizada(venda.id!, vendaRetaguarda.id)
  }

  /**
   * Verificar quantidade de vendas pendentes
   */
  async contarPendentes(): Promise<number> {
    const vendas = await this.vendasService.listarNaoSincronizadas()
    return vendas.length
  }
}
