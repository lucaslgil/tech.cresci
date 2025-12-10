// =====================================================
// SERVICE - CONTAS A RECEBER
// Funções para gerenciar contas a receber
// Data: 08/12/2025
// =====================================================

import { supabase } from '../../lib/supabase'
import type {
  ContaReceber,
  ContaReceberFormData,
  PagamentoReceber,
  PagamentoFormData,
  FiltrosContasReceber,
  ResumoContasReceber
} from './types'
import { calcularValorTotal } from './types'

/**
 * Listar contas a receber com filtros
 */
export const listarContasReceber = async (
  filtros?: FiltrosContasReceber
): Promise<{ data: ContaReceber[] | null; error: any }> => {
  try {
    let query = supabase
      .from('contas_receber')
      .select('*')
      .order('data_vencimento', { ascending: true })

    // Aplicar filtros
    if (filtros?.status && filtros.status !== 'TODOS') {
      query = query.eq('status', filtros.status)
    }

    if (filtros?.cliente_id) {
      query = query.eq('cliente_id', filtros.cliente_id)
    }

    if (filtros?.data_inicio) {
      query = query.gte('data_emissao', filtros.data_inicio)
    }

    if (filtros?.data_fim) {
      query = query.lte('data_emissao', filtros.data_fim)
    }

    if (filtros?.vencimento_inicio) {
      query = query.gte('data_vencimento', filtros.vencimento_inicio)
    }

    if (filtros?.vencimento_fim) {
      query = query.lte('data_vencimento', filtros.vencimento_fim)
    }

    if (filtros?.busca) {
      query = query.or(`cliente_nome.ilike.%${filtros.busca}%,numero_documento.ilike.%${filtros.busca}%,descricao.ilike.%${filtros.busca}%`)
    }

    const { data, error } = await query

    return { data, error }
  } catch (error) {
    console.error('Erro ao listar contas a receber:', error)
    return { data: null, error }
  }
}

/**
 * Buscar conta por ID
 */
export const buscarContaPorId = async (
  id: number
): Promise<{ data: ContaReceber | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('contas_receber')
      .select('*')
      .eq('id', id)
      .single()

    return { data, error }
  } catch (error) {
    console.error('Erro ao buscar conta:', error)
    return { data: null, error }
  }
}

/**
 * Buscar contas por venda_id
 */
export const buscarContasPorVenda = async (
  venda_id: number
): Promise<{ data: ContaReceber[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('contas_receber')
      .select('*')
      .eq('venda_id', venda_id)
      .order('numero_parcela', { ascending: true })

    return { data, error }
  } catch (error) {
    console.error('Erro ao buscar contas da venda:', error)
    return { data: null, error }
  }
}

/**
 * Criar nova conta a receber
 */
export const criarContaReceber = async (
  dados: ContaReceberFormData
): Promise<{ data: ContaReceber | null; error: any }> => {
  try {
    const valorTotal = calcularValorTotal(
      dados.valor_original,
      dados.valor_juros,
      dados.valor_desconto
    )

    const { data, error } = await supabase
      .from('contas_receber')
      .insert({
        ...dados,
        valor_total: valorTotal,
        valor_saldo: valorTotal,
        valor_pago: 0,
        numero_parcela: dados.numero_parcela || 1,
        total_parcelas: dados.total_parcelas || 1,
        valor_juros: dados.valor_juros || 0,
        valor_desconto: dados.valor_desconto || 0
      })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Erro ao criar conta a receber:', error)
    return { data: null, error }
  }
}

/**
 * Criar múltiplas contas a receber (para vendas parceladas)
 */
export const criarContasParceladas = async (params: {
  venda_id: number
  numero_venda: number
  cliente_id: number
  cliente_nome: string
  cliente_cpf_cnpj?: string
  valor_total: number
  numero_parcelas: number
  data_vencimento_primeira: string
  dias_entre_parcelas?: number
}): Promise<{ data: ContaReceber[] | null; error: any }> => {
  try {
    const {
      venda_id,
      numero_venda,
      cliente_id,
      cliente_nome,
      cliente_cpf_cnpj,
      valor_total,
      numero_parcelas,
      data_vencimento_primeira,
      dias_entre_parcelas = 30
    } = params

    console.log('📦 criarContasParceladas recebeu:', params)

    const valorParcela = valor_total / numero_parcelas
    const contas: any[] = []

    for (let i = 1; i <= numero_parcelas; i++) {
      const dataVencimento = new Date(data_vencimento_primeira + 'T00:00:00')
      dataVencimento.setDate(dataVencimento.getDate() + (i - 1) * dias_entre_parcelas)

      contas.push({
        venda_id,
        numero_venda,
        cliente_id,
        cliente_nome,
        cliente_cpf_cnpj: cliente_cpf_cnpj || null,
        descricao: `Venda #${numero_venda} - Parcela ${i}/${numero_parcelas}`,
        numero_documento: `${numero_venda}/${i}`,
        numero_parcela: i,
        total_parcelas: numero_parcelas,
        valor_original: valorParcela,
        valor_juros: 0,
        valor_desconto: 0,
        valor_total: valorParcela,
        valor_pago: 0,
        valor_saldo: valorParcela,
        data_emissao: new Date().toISOString().split('T')[0],
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        status: 'ABERTO'
      })
    }

    console.log('💾 Inserindo contas no banco:', contas)

    const { data, error } = await supabase
      .from('contas_receber')
      .insert(contas)
      .select()

    console.log('📊 Resultado da inserção:', { data, error })

    return { data, error }
  } catch (error) {
    console.error('Erro ao criar contas parceladas:', error)
    return { data: null, error }
  }
}

/**
 * Atualizar conta a receber
 */
export const atualizarContaReceber = async (
  id: number,
  dados: Partial<ContaReceberFormData>
): Promise<{ data: ContaReceber | null; error: any }> => {
  try {
    const dadosAtualizacao: any = { ...dados }

    // Recalcular valor total se necessário
    if (dados.valor_original !== undefined || dados.valor_juros !== undefined || dados.valor_desconto !== undefined) {
      const conta = await buscarContaPorId(id)
      if (conta.data) {
        dadosAtualizacao.valor_total = calcularValorTotal(
          dados.valor_original ?? conta.data.valor_original,
          dados.valor_juros ?? conta.data.valor_juros,
          dados.valor_desconto ?? conta.data.valor_desconto
        )
        dadosAtualizacao.valor_saldo = dadosAtualizacao.valor_total - conta.data.valor_pago
      }
    }

    const { data, error } = await supabase
      .from('contas_receber')
      .update(dadosAtualizacao)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Erro ao atualizar conta:', error)
    return { data: null, error }
  }
}

/**
 * Cancelar conta a receber
 */
export const cancelarConta = async (
  id: number
): Promise<{ data: ContaReceber | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('contas_receber')
      .update({ status: 'CANCELADO' })
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Erro ao cancelar conta:', error)
    return { data: null, error }
  }
}

/**
 * Excluir conta a receber permanentemente
 */
export const excluirConta = async (
  id: number
): Promise<{ data: any | null; error: any }> => {
  try {
    console.log('Iniciando exclusão da conta ID:', id)
    
    // Primeiro, deletar todos os pagamentos relacionados
    console.log('Deletando pagamentos relacionados...')
    const { error: pagamentosError } = await supabase
      .from('pagamentos_receber')
      .delete()
      .eq('conta_receber_id', id)

    if (pagamentosError) {
      console.error('Erro ao excluir pagamentos:', pagamentosError)
      throw pagamentosError
    }
    console.log('Pagamentos deletados')

    // Depois, deletar a conta
    console.log('Deletando conta...')
    const { data, error } = await supabase
      .from('contas_receber')
      .delete()
      .eq('id', id)
      .select()

    if (error) {
      console.error('Erro ao deletar conta:', error)
      throw error
    }

    console.log('Conta deletada com sucesso:', data)
    return { data: true, error: null }
  } catch (error) {
    console.error('Erro ao excluir conta:', error)
    return { data: null, error }
  }
}

/**
 * Reabrir conta a receber (voltar para ABERTO)
 */
export const reabrirConta = async (
  id: number
): Promise<{ data: ContaReceber | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('contas_receber')
      .update({ status: 'ABERTO' })
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Erro ao reabrir conta:', error)
    return { data: null, error }
  }
}

/**
 * Registrar pagamento (baixa)
 */
export const registrarPagamento = async (
  dados: PagamentoFormData
): Promise<{ data: PagamentoReceber | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('pagamentos_receber')
      .insert({
        ...dados,
        valor_juros: dados.valor_juros || 0,
        valor_desconto: dados.valor_desconto || 0
      })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error)
    return { data: null, error }
  }
}

/**
 * Listar pagamentos de uma conta
 */
export const listarPagamentos = async (
  contaId: number
): Promise<{ data: PagamentoReceber[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('pagamentos_receber')
      .select('*')
      .eq('conta_receber_id', contaId)
      .order('data_pagamento', { ascending: false })

    return { data, error }
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error)
    return { data: null, error }
  }
}

/**
 * Obter resumo financeiro
 */
export const obterResumo = async (
  filtros?: FiltrosContasReceber
): Promise<{ data: ResumoContasReceber | null; error: any }> => {
  try {
    const { data: contas, error } = await listarContasReceber(filtros)

    if (error || !contas) {
      return { data: null, error }
    }

    const resumo: ResumoContasReceber = {
      total_contas: contas.length,
      total_aberto: contas.filter(c => c.status === 'ABERTO').length,
      total_pago: contas.filter(c => c.status === 'PAGO').length,
      total_vencido: contas.filter(c => c.status === 'VENCIDO').length,
      valor_total: contas.reduce((sum, c) => sum + c.valor_total, 0),
      valor_recebido: contas.reduce((sum, c) => sum + c.valor_pago, 0),
      valor_pendente: contas.reduce((sum, c) => sum + c.valor_saldo, 0)
    }

    return { data: resumo, error: null }
  } catch (error) {
    console.error('Erro ao obter resumo:', error)
    return { data: null, error }
  }
}
