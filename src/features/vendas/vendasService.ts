// =====================================================
// SERVICES - VENDAS
// Serviços para gestão de vendas, orçamentos e pedidos
// Data: 02/12/2025
// =====================================================

import { supabase } from '../../lib/supabase'
import type {
  Venda,
  VendaFormData,
  VendaParcela,
  VendaFiltros,
  VendaEstatisticas,
  ResultadoVenda
} from './types'
import { calcularSubtotalVenda, calcularTotalVenda } from './types'
import { criarContasParceladas } from '../financeiro/contasReceberService'

/**
 * CRUD DE VENDAS
 */
export const vendasService = {
  /**
   * Lista vendas com filtros opcionais
   */
  async listar(filtros?: VendaFiltros): Promise<Venda[]> {
    let query = supabase
      .from('vendas')
      .select('*')
      .order('created_at', { ascending: false })

    if (filtros?.numero) {
      query = query.eq('numero', filtros.numero)
    }

    if (filtros?.tipo_venda) {
      query = query.eq('tipo_venda', filtros.tipo_venda)
    }

    if (filtros?.status) {
      query = query.eq('status', filtros.status)
    }

    if (filtros?.cliente_id) {
      query = query.eq('cliente_id', filtros.cliente_id)
    }

    if (filtros?.vendedor) {
      query = query.ilike('vendedor', `%${filtros.vendedor}%`)
    }

    if (filtros?.forma_pagamento) {
      query = query.eq('forma_pagamento', filtros.forma_pagamento)
    }

    if (filtros?.data_inicio) {
      query = query.gte('data_venda', filtros.data_inicio)
    }

    if (filtros?.data_fim) {
      query = query.lte('data_venda', filtros.data_fim)
    }

    if (filtros?.valor_minimo) {
      query = query.gte('total', filtros.valor_minimo)
    }

    if (filtros?.valor_maximo) {
      query = query.lte('total', filtros.valor_maximo)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  /**
   * Busca venda por ID com itens e parcelas
   */
  async buscarPorId(id: number | string): Promise<Venda | null> {
    const { data: venda, error: vendaError } = await supabase
      .from('vendas')
      .select('*')
      .eq('id', id)
      .single()

    if (vendaError) throw vendaError
    if (!venda) return null

    // Buscar itens
    const { data: itens } = await supabase
      .from('vendas_itens')
      .select('*')
      .eq('venda_id', id)
      .order('numero_item')

    // Buscar parcelas
    const { data: parcelas } = await supabase
      .from('vendas_parcelas')
      .select('*')
      .eq('venda_id', id)
      .order('numero_parcela')

    return {
      ...venda,
      itens: itens || [],
      parcelas: parcelas || []
    } as any
  },

  /**
   * Busca venda por número
   */
  async buscarPorNumero(numero: number): Promise<Venda | null> {
    const { data, error } = await supabase
      .from('vendas')
      .select('*')
      .eq('numero', numero)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  /**
   * Cria nova venda
   */
  async criar(formData: VendaFormData): Promise<ResultadoVenda> {
    try {
      // Validar dados
      const validacao = this.validarVenda(formData)
      if (!validacao.valido) {
        return {
          sucesso: false,
          mensagem: validacao.mensagem || 'Dados inválidos'
        }
      }

      // Obter próximo número
      const { data: numeroData, error: numeroError } = await supabase
        .rpc('obter_proximo_numero_venda')

      if (numeroError) throw numeroError
      const numero = numeroData

      // Calcular totais
      const subtotal = calcularSubtotalVenda(formData.itens)
      const total = calcularTotalVenda(formData)

      // Buscar dados do cliente se informado
      let clienteNome = ''
      let clienteCpfCnpj = ''

      if (formData.cliente_id) {
        const { data: cliente } = await supabase
          .from('clientes')
          .select('nome_completo, razao_social, cpf, cnpj')
          .eq('id', formData.cliente_id)
          .single()

        if (cliente) {
          clienteNome = cliente.nome_completo || cliente.razao_social || ''
          // Remover formatação do CPF/CNPJ (manter apenas números)
          const cpfCnpj = cliente.cpf || cliente.cnpj || ''
          clienteCpfCnpj = cpfCnpj.replace(/\D/g, '')
        }
      }

      // Calcular comissão se houver
      const comissaoValor = formData.comissao_percentual
        ? (total * formData.comissao_percentual / 100)
        : undefined

      // Criar venda
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          numero,
          tipo_venda: formData.tipo_venda,
          status: formData.status || 'PEDIDO_ABERTO',
          cliente_id: formData.cliente_id,
          cliente_nome: clienteNome,
          cliente_cpf_cnpj: clienteCpfCnpj,
          data_venda: formData.data_venda,
          data_validade: formData.data_validade,
          subtotal,
          desconto: formData.desconto || 0,
          acrescimo: formData.acrescimo || 0,
          frete: formData.frete || 0,
          outras_despesas: formData.outras_despesas || 0,
          total,
          forma_pagamento: formData.forma_pagamento,
          condicao_pagamento: formData.condicao_pagamento,
          numero_parcelas: formData.numero_parcelas || 1,
          vendedor: formData.vendedor,
          comissao_percentual: formData.comissao_percentual,
          comissao_valor: comissaoValor,
          observacoes: formData.observacoes,
          observacoes_internas: formData.observacoes_internas
        })
        .select()
        .single()

      if (vendaError) throw vendaError

      // Criar itens
      const itensParaInserir = formData.itens.map((item, index) => {
        const valorTotal = item.quantidade * item.valor_unitario
        const descontoValor = item.desconto_valor || (valorTotal * (item.desconto_percentual || 0) / 100)
        const acrescimoValor = item.acrescimo_valor || (valorTotal * (item.acrescimo_percentual || 0) / 100)
        const valorFinal = valorTotal - descontoValor + acrescimoValor

        // Função helper para garantir null em strings vazias
        const stringOrNull = (value: any, maxLength: number) => {
          if (!value) return null
          const str = String(value).trim()
          return str.length > 0 ? str.substring(0, maxLength) : null
        }

        return {
          venda_id: venda.id,
          numero_item: index + 1,
          produto_id: item.produto_id || null,
          produto_codigo: stringOrNull(item.produto_codigo, 14),
          produto_nome: stringOrNull(item.produto_nome, 200) || 'Produto sem nome',
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          valor_total: valorTotal,
          desconto_percentual: item.desconto_percentual || 0,
          desconto_valor: descontoValor,
          acrescimo_percentual: item.acrescimo_percentual || 0,
          acrescimo_valor: acrescimoValor,
          valor_final: valorFinal,
          observacoes: stringOrNull(item.observacoes, 500)
        }
      })

      console.log('Itens para inserir:', JSON.stringify(itensParaInserir, null, 2))

      const { error: itensError } = await supabase
        .from('vendas_itens')
        .insert(itensParaInserir)

      if (itensError) throw itensError

      // Criar parcelas se parcelado
      if (formData.condicao_pagamento === 'PARCELADO' && formData.numero_parcelas && formData.numero_parcelas > 1) {
        const valorParcela = total / formData.numero_parcelas
        const dataBase = new Date(formData.data_venda)

        const parcelasParaInserir = Array.from({ length: formData.numero_parcelas }, (_, index) => {
          const dataVencimento = new Date(dataBase)
          dataVencimento.setMonth(dataVencimento.getMonth() + index)

          return {
            venda_id: venda.id,
            numero_parcela: index + 1,
            valor: valorParcela,
            data_vencimento: dataVencimento.toISOString().split('T')[0],
            status: 'PENDENTE'
          }
        })

        const { error: parcelasError } = await supabase
          .from('vendas_parcelas')
          .insert(parcelasParaInserir)

        if (parcelasError) throw parcelasError
      }

      // INTEGRAÇÃO FINANCEIRA: Criar contas a receber automaticamente
      // Apenas criar contas se o status for diferente de ORCAMENTO
      console.log('🔍 Verificando criação de contas a receber...')
      console.log('Status:', formData.status)
      console.log('Cliente ID:', formData.cliente_id)
      
      if (formData.status !== 'ORCAMENTO' && formData.cliente_id) {
        try {
          const numeroParcelas = (formData.condicao_pagamento === 'PARCELADO' && formData.numero_parcelas)
            ? formData.numero_parcelas
            : 1

          // Data de vencimento: se à vista, 0 dias, senão 30 dias da primeira parcela
          const dataBase = new Date(formData.data_venda)
          const diasAteVencimento = formData.condicao_pagamento === 'A_VISTA' ? 0 : 30
          dataBase.setDate(dataBase.getDate() + diasAteVencimento)

          console.log('💰 Criando contas a receber:', {
            venda_id: venda.id,
            numero_venda: numero,
            cliente_id: formData.cliente_id,
            cliente_nome: clienteNome,
            valor_total: total,
            numero_parcelas: numeroParcelas
          })

          const resultado = await criarContasParceladas({
            venda_id: venda.id,
            numero_venda: numero,
            cliente_id: typeof formData.cliente_id === 'string' ? parseInt(formData.cliente_id) : formData.cliente_id,
            cliente_nome: clienteNome,
            cliente_cpf_cnpj: clienteCpfCnpj,
            valor_total: total,
            numero_parcelas: numeroParcelas,
            data_vencimento_primeira: dataBase.toISOString().split('T')[0],
            dias_entre_parcelas: 30
          })

          if (resultado.error) {
            console.error('❌ Erro ao criar contas a receber:', resultado.error)
          } else {
            console.log('✅ Contas a receber criadas com sucesso!', resultado.data)
          }
        } catch (error) {
          console.error('❌ Exceção ao criar contas a receber:', error)
        }
      } else {
        console.log('⚠️ Contas a receber NÃO criadas. Motivo:', {
          isOrcamento: formData.status === 'ORCAMENTO',
          temCliente: !!formData.cliente_id
        })
      }

      return {
        sucesso: true,
        mensagem: `Venda #${numero} criada com sucesso!`,
        dados: venda,
        venda,
        numero
      }
    } catch (error) {
      console.error('Erro ao criar venda:', error)
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : 'Erro ao criar venda'
      }
    }
  },

  /**
   * Atualiza venda existente
   */
  async atualizar(id: number | string, dados: Partial<VendaFormData>): Promise<ResultadoVenda> {
    try {
      // Se está atualizando apenas o status, fazer update simples
      const keys = Object.keys(dados)
      if (keys.length === 1 && keys[0] === 'status') {
        const { data, error } = await supabase
          .from('vendas')
          .update({ status: dados.status })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        return {
          sucesso: true,
          mensagem: 'Status atualizado com sucesso!',
          venda: data
        }
      }

      // Atualização completa: calcular totais
      const subtotal = dados.itens ? calcularSubtotalVenda(dados.itens) : 0
      const total = dados.itens ? calcularTotalVenda(dados) : 0

      // Buscar dados do cliente se informado
      let clienteNome = dados.cliente_nome || ''
      let clienteCpfCnpj = dados.cliente_cpf_cnpj || ''

      if (dados.cliente_id && !clienteNome) {
        const { data: cliente } = await supabase
          .from('clientes')
          .select('nome_completo, razao_social, cpf, cnpj')
          .eq('id', dados.cliente_id)
          .single()

        if (cliente) {
          clienteNome = cliente.nome_completo || cliente.razao_social || ''
          const cpfCnpj = cliente.cpf || cliente.cnpj || ''
          clienteCpfCnpj = cpfCnpj.replace(/\D/g, '')
        }
      }

      // Atualizar venda
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .update({
          tipo_venda: dados.tipo_venda,
          status: dados.status,
          cliente_id: dados.cliente_id,
          cliente_nome: clienteNome,
          cliente_cpf_cnpj: clienteCpfCnpj,
          data_venda: dados.data_venda,
          data_validade: dados.data_validade,
          subtotal,
          desconto: dados.desconto || 0,
          acrescimo: dados.acrescimo || 0,
          frete: dados.frete || 0,
          outras_despesas: dados.outras_despesas || 0,
          total,
          forma_pagamento: dados.forma_pagamento,
          condicao_pagamento: dados.condicao_pagamento,
          numero_parcelas: dados.numero_parcelas || 1,
          vendedor: dados.vendedor,
          observacoes: dados.observacoes,
          observacoes_internas: dados.observacoes_internas
        })
        .eq('id', id)
        .select()
        .single()

      if (vendaError) throw vendaError

      // Atualizar itens: deletar todos e recriar
      if (dados.itens) {
        // Deletar itens antigos
        await supabase
          .from('vendas_itens')
          .delete()
          .eq('venda_id', id)

        // Inserir novos itens
        const itensParaInserir = dados.itens.map((item, index) => {
          const valorTotal = item.quantidade * item.valor_unitario
          const descontoValor = item.desconto_valor || (valorTotal * (item.desconto_percentual || 0) / 100)
          const acrescimoValor = item.acrescimo_valor || (valorTotal * (item.acrescimo_percentual || 0) / 100)
          const valorFinal = valorTotal - descontoValor + acrescimoValor

          const stringOrNull = (value: any, maxLength: number) => {
            if (!value) return null
            const str = String(value).trim()
            return str.length > 0 ? str.substring(0, maxLength) : null
          }

          return {
            venda_id: id,
            numero_item: index + 1,
            produto_id: item.produto_id || null,
            produto_codigo: stringOrNull(item.produto_codigo, 14),
            produto_nome: stringOrNull(item.produto_nome, 200) || 'Produto sem nome',
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            valor_total: valorTotal,
            desconto_percentual: item.desconto_percentual || 0,
            desconto_valor: descontoValor,
            acrescimo_percentual: item.acrescimo_percentual || 0,
            acrescimo_valor: acrescimoValor,
            valor_final: valorFinal,
            observacoes: stringOrNull(item.observacoes, 500)
          }
        })

        const { error: itensError } = await supabase
          .from('vendas_itens')
          .insert(itensParaInserir)

        if (itensError) throw itensError
      }

      return {
        sucesso: true,
        mensagem: 'Venda atualizada com sucesso!',
        venda
      }
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : 'Erro ao atualizar venda'
      }
    }
  },

  /**
   * Deleta venda (apenas se ainda for orçamento ou cancelado)
   */
  async deletar(id: number | string): Promise<ResultadoVenda> {
    try {
      // Verificar se é orçamento ou cancelado
      const { data: venda } = await supabase
        .from('vendas')
        .select('status')
        .eq('id', id)
        .single()

      if (venda && venda.status !== 'ORCAMENTO' && venda.status !== 'CANCELADO' && venda.status !== 'PEDIDO_ABERTO') {
        return {
          sucesso: false,
          mensagem: 'Apenas orçamentos, pedidos em aberto e vendas canceladas podem ser excluídos'
        }
      }

      const { error } = await supabase
        .from('vendas')
        .delete()
        .eq('id', id)

      if (error) throw error

      return {
        sucesso: true,
        mensagem: 'Venda excluída com sucesso!'
      }
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : 'Erro ao excluir venda'
      }
    }
  },

  /**
   * MUDANÇAS DE STATUS
   */

  async confirmarPedido(id: number | string): Promise<ResultadoVenda> {
    try {
      // Buscar venda atual
      const venda = await this.buscarPorId(id)
      if (!venda) {
        return {
          sucesso: false,
          mensagem: 'Venda não encontrada'
        }
      }

      if (venda.status !== 'PEDIDO_ABERTO') {
        return {
          sucesso: false,
          mensagem: 'Apenas pedidos em aberto podem ser confirmados'
        }
      }

      // Atualizar status para PEDIDO_FECHADO
      const { data, error } = await supabase
        .from('vendas')
        .update({
          status: 'PEDIDO_FECHADO',
          data_aprovacao: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // TODO: Aqui será implementada a movimentação de estoque (baixa)
      // await this.movimentarEstoque(id, 'SAIDA')

      return {
        sucesso: true,
        mensagem: 'Pedido confirmado com sucesso! Estoque será movimentado.',
        venda: data
      }
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : 'Erro ao confirmar pedido'
      }
    }
  },

  async reabrirPedido(id: number | string): Promise<ResultadoVenda> {
    try {
      // Buscar venda atual
      const venda = await this.buscarPorId(id)
      if (!venda) {
        return {
          sucesso: false,
          mensagem: 'Venda não encontrada'
        }
      }

      if (venda.status !== 'PEDIDO_FECHADO') {
        return {
          sucesso: false,
          mensagem: 'Apenas pedidos fechados podem ser reabertos'
        }
      }

      // Atualizar status para PEDIDO_ABERTO
      const { data, error } = await supabase
        .from('vendas')
        .update({
          status: 'PEDIDO_ABERTO',
          data_aprovacao: null
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // TODO: Aqui será implementada a devolução de estoque
      // await this.movimentarEstoque(id, 'ENTRADA')

      return {
        sucesso: true,
        mensagem: 'Pedido reaberto com sucesso! Estoque será devolvido.',
        venda: data
      }
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : 'Erro ao reabrir pedido'
      }
    }
  },

  async cancelar(id: number | string, motivo?: string): Promise<ResultadoVenda> {
    try {
      // Buscar venda atual
      const venda = await this.buscarPorId(id)
      if (!venda) {
        return {
          sucesso: false,
          mensagem: 'Venda não encontrada'
        }
      }

      if (venda.status === 'PEDIDO_FECHADO') {
        return {
          sucesso: false,
          mensagem: 'Não é possível cancelar um pedido fechado. Reabra o pedido primeiro.'
        }
      }

      const { data, error } = await supabase
        .from('vendas')
        .update({
          status: 'CANCELADO',
          observacoes_internas: motivo
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Cancelar parcelas pendentes
      await supabase
        .from('vendas_parcelas')
        .update({ status: 'CANCELADO' })
        .eq('venda_id', id)
        .eq('status', 'PENDENTE')

      return {
        sucesso: true,
        mensagem: 'Venda cancelada com sucesso!',
        venda: data
      }
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : 'Erro ao cancelar venda'
      }
    }
  },

  /**
   * HELPER: Atualizar status
   */
  async atualizarStatus(id: number | string, status: string): Promise<ResultadoVenda> {
    try {
      const { data, error } = await supabase
        .from('vendas')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return {
        sucesso: true,
        mensagem: `Status atualizado para ${status}`,
        venda: data
      }
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : 'Erro ao atualizar status'
      }
    }
  },

  /**
   * GESTÃO DE PARCELAS
   */

  async buscarParcelas(vendaId: number | string): Promise<VendaParcela[]> {
    const { data, error } = await supabase
      .from('vendas_parcelas')
      .select('*')
      .eq('venda_id', vendaId)
      .order('numero_parcela')

    if (error) throw error
    return data || []
  },

  async registrarPagamentoParcela(
    parcelaId: number | string,
    valorPago: number,
    dataPagamento?: string
  ): Promise<ResultadoVenda> {
    try {
      const { error } = await supabase
        .from('vendas_parcelas')
        .update({
          valor_pago: valorPago,
          data_pagamento: dataPagamento || new Date().toISOString().split('T')[0],
          status: 'PAGO'
        })
        .eq('id', parcelaId)

      if (error) throw error

      return {
        sucesso: true,
        mensagem: 'Pagamento registrado com sucesso!'
      }
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : 'Erro ao registrar pagamento'
      }
    }
  },

  /**
   * ESTATÍSTICAS
   */

  async obterEstatisticas(dataInicio?: string, dataFim?: string): Promise<VendaEstatisticas> {
    let query = supabase
      .from('vendas')
      .select('tipo_venda, total, status')

    if (dataInicio) {
      query = query.gte('data_venda', dataInicio)
    }

    if (dataFim) {
      query = query.lte('data_venda', dataFim)
    }

    const { data, error } = await query

    if (error) throw error

    const vendas = data || []

    const totalVendas = vendas.filter(v => v.status !== 'CANCELADO').length
    const totalOrcamentos = vendas.filter(v => v.tipo_venda === 'ORCAMENTO').length
    const totalPedidos = vendas.filter(v => v.tipo_venda === 'PEDIDO').length
    const totalVendasDiretas = vendas.filter(v => v.tipo_venda === 'VENDA_DIRETA').length
    const valorTotal = vendas
      .filter(v => v.status !== 'CANCELADO')
      .reduce((sum, v) => sum + Number(v.total), 0)

    return {
      total_vendas: totalVendas,
      total_orcamentos: totalOrcamentos,
      total_pedidos: totalPedidos,
      total_vendas_diretas: totalVendasDiretas,
      valor_total: valorTotal,
      valor_medio: totalVendas > 0 ? valorTotal / totalVendas : 0,
      ticket_medio: totalVendas > 0 ? valorTotal / totalVendas : 0,
      total_itens_vendidos: 0 // TODO: calcular com JOIN
    }
  },

  /**
   * VALIDAÇÃO
   */

  validarVenda(formData: VendaFormData): { valido: boolean; mensagem?: string } {
    if (!formData.tipo_venda) {
      return { valido: false, mensagem: 'Tipo de venda é obrigatório' }
    }

    if (!formData.data_venda) {
      return { valido: false, mensagem: 'Data da venda é obrigatória' }
    }

    if (!formData.itens || formData.itens.length === 0) {
      return { valido: false, mensagem: 'Adicione pelo menos um item' }
    }

    if (!formData.forma_pagamento) {
      return { valido: false, mensagem: 'Forma de pagamento é obrigatória' }
    }

    if (!formData.condicao_pagamento) {
      return { valido: false, mensagem: 'Condição de pagamento é obrigatória' }
    }

    // Validar itens
    for (const item of formData.itens) {
      if (!item.produto_nome) {
        return { valido: false, mensagem: 'Todos os itens devem ter nome/descrição' }
      }

      if (item.quantidade <= 0) {
        return { valido: false, mensagem: 'Quantidade deve ser maior que zero' }
      }

      if (item.valor_unitario <= 0) {
        return { valido: false, mensagem: 'Valor unitário deve ser maior que zero' }
      }
    }

    return { valido: true }
  },

  /**
   * CONTROLE DE BLOQUEIO
   */

  async bloquear(id: number | string, motivo?: string): Promise<ResultadoVenda> {
    try {
      const { data, error } = await supabase
        .rpc('bloquear_venda', {
          p_venda_id: id,
          p_motivo: motivo || 'Bloqueado manualmente'
        })

      if (error) throw error

      if (data?.sucesso) {
        return {
          sucesso: true,
          mensagem: data.mensagem
        }
      } else {
        return {
          sucesso: false,
          mensagem: data?.mensagem || 'Erro ao bloquear venda'
        }
      }
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : 'Erro ao bloquear venda'
      }
    }
  },

  async desbloquear(id: number | string): Promise<ResultadoVenda> {
    try {
      const { data, error } = await supabase
        .rpc('desbloquear_venda', {
          p_venda_id: id
        })

      if (error) throw error

      if (data?.sucesso) {
        return {
          sucesso: true,
          mensagem: data.mensagem
        }
      } else {
        return {
          sucesso: false,
          mensagem: data?.mensagem || 'Erro ao desbloquear venda'
        }
      }
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : 'Erro ao desbloquear venda'
      }
    }
  }
}
