// =====================================================
// SERVICES - MOVIMENTAÇÕES DE CAIXA
// Gestão de movimentações de caixa (entradas/saídas)
// Data: 11/02/2026
// =====================================================

import { supabase } from '../../lib/supabase'

export interface MovimentacaoCaixa {
  id: number
  empresa_id: number
  tipo: 'ENTRADA' | 'SAIDA' | 'ABERTURA' | 'FECHAMENTO'
  valor: number
  data_movimentacao: string
  descricao: string
  categoria?: string
  venda_id?: number
  origem?: string
  pdv_uuid?: string
  caixa_aberto: boolean
  caixa_numero?: number
  usuario_id: string
  usuario_nome: string
  created_at: string
  updated_at: string
}

export interface MovimentacaoFormData {
  tipo: 'ENTRADA' | 'SAIDA'
  valor: number
  data_movimentacao?: string
  descricao: string
  categoria?: string
}

export interface MovimentacaoFiltros {
  data_inicio?: string
  data_fim?: string
  tipo?: string
  usuario_id?: string
  categoria?: string
  caixa_numero?: number
}

export interface StatusCaixa {
  caixa_aberto: boolean
  caixa_numero?: number
  valor_abertura?: number
  total_entradas: number
  total_saidas: number
  saldo_atual: number
  data_abertura?: string
}

/**
 * SERVIÇOS DE MOVIMENTAÇÕES DE CAIXA
 */
export const movimentacoesCaixaService = {
  /**
   * Listar movimentações com filtros
   */
  async listar(filtros?: MovimentacaoFiltros): Promise<MovimentacaoCaixa[]> {
    let query = supabase
      .from('movimentacoes_caixa')
      .select('*')
      .is('deleted_at', null)
      .order('data_movimentacao', { ascending: false })

    if (filtros?.data_inicio) {
      query = query.gte('data_movimentacao', filtros.data_inicio)
    }

    if (filtros?.data_fim) {
      query = query.lte('data_movimentacao', filtros.data_fim)
    }

    if (filtros?.tipo) {
      query = query.eq('tipo', filtros.tipo)
    }

    if (filtros?.usuario_id) {
      query = query.eq('usuario_id', filtros.usuario_id)
    }

    if (filtros?.categoria) {
      query = query.eq('categoria', filtros.categoria)
    }

    if (filtros?.caixa_numero) {
      query = query.eq('caixa_numero', filtros.caixa_numero)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  /**
   * Buscar movimentação por ID
   */
  async buscarPorId(id: number): Promise<MovimentacaoCaixa | null> {
    const { data, error } = await supabase
      .from('movimentacoes_caixa')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Criar movimentação manual
   */
  async criar(dados: MovimentacaoFormData): Promise<MovimentacaoCaixa> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    // Buscar dados do usuário
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('nome_completo')
      .eq('id', user.id)
      .single()

    // Buscar empresa_id do usuário
    const { data: empresaData } = await supabase
      .from('usuarios_empresas')
      .select('empresas_permitidas')
      .eq('usuario_id', user.id)
      .single()

    if (!empresaData?.empresas_permitidas?.[0]) {
      throw new Error('Empresa não encontrada')
    }

    const { data, error } = await supabase
      .from('movimentacoes_caixa')
      .insert({
        empresa_id: empresaData.empresas_permitidas[0],
        tipo: dados.tipo,
        valor: dados.valor,
        data_movimentacao: dados.data_movimentacao || new Date().toISOString(),
        descricao: dados.descricao,
        categoria: dados.categoria,
        origem: 'MANUAL',
        usuario_id: user.id,
        usuario_nome: usuario?.nome_completo || 'Usuário',
        caixa_aberto: true
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Atualizar movimentação
   */
  async atualizar(id: number, dados: Partial<MovimentacaoFormData>): Promise<MovimentacaoCaixa> {
    const { data, error } = await supabase
      .from('movimentacoes_caixa')
      .update({
        ...dados,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Excluir movimentação (soft delete)
   */
  async excluir(id: number): Promise<void> {
    const { error } = await supabase
      .from('movimentacoes_caixa')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Obter status do caixa atual
   */
  async statusCaixa(): Promise<StatusCaixa | null> {
    const { data: empresaData } = await supabase
      .from('usuarios_empresas')
      .select('empresas_permitidas')
      .eq('usuario_id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    if (!empresaData?.empresas_permitidas?.[0]) {
      return null
    }

    const { data, error } = await supabase
      .rpc('status_caixa', {
        p_empresa_id: empresaData.empresas_permitidas[0]
      })

    if (error) throw error
    return data?.[0] || null
  },

  /**
   * Abrir caixa
   */
  async abrirCaixa(valorInicial: number, usuarioNome: string): Promise<number> {
    const { data: empresaData } = await supabase
      .from('usuarios_empresas')
      .select('empresas_permitidas')
      .eq('usuario_id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    if (!empresaData?.empresas_permitidas?.[0]) {
      throw new Error('Empresa não encontrada')
    }

    const { data, error } = await supabase
      .rpc('abrir_caixa', {
        p_empresa_id: empresaData.empresas_permitidas[0],
        p_valor_inicial: valorInicial,
        p_usuario_nome: usuarioNome
      })

    if (error) throw error
    return data
  },

  /**
   * Fechar caixa
   */
  async fecharCaixa(valorFinal: number, usuarioNome: string, observacoes?: string): Promise<number> {
    const { data: empresaData } = await supabase
      .from('usuarios_empresas')
      .select('empresas_permitidas')
      .eq('usuario_id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    if (!empresaData?.empresas_permitidas?.[0]) {
      throw new Error('Empresa não encontrada')
    }

    const { data, error } = await supabase
      .rpc('fechar_caixa', {
        p_empresa_id: empresaData.empresas_permitidas[0],
        p_valor_final: valorFinal,
        p_usuario_nome: usuarioNome,
        p_observacoes: observacoes
      })

    if (error) throw error
    return data
  },

  /**
   * Calcular totais do período
   */
  async calcularTotais(filtros?: MovimentacaoFiltros): Promise<{
    total_entradas: number
    total_saidas: number
    saldo: number
  }> {
    const movimentacoes = await this.listar(filtros)

    const total_entradas = movimentacoes
      .filter(m => m.tipo === 'ENTRADA' || m.tipo === 'ABERTURA')
      .reduce((sum, m) => sum + m.valor, 0)

    const total_saidas = movimentacoes
      .filter(m => m.tipo === 'SAIDA')
      .reduce((sum, m) => sum + m.valor, 0)

    return {
      total_entradas,
      total_saidas,
      saldo: total_entradas - total_saidas
    }
  },

  /**
   * Listar resumo diário
   */
  async resumoDiario(dataInicio?: string, dataFim?: string): Promise<any[]> {
    let query = supabase
      .from('vw_caixa_resumo_diario')
      .select('*')
      .order('data', { ascending: false })

    if (dataInicio) {
      query = query.gte('data', dataInicio)
    }

    if (dataFim) {
      query = query.lte('data', dataFim)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }
}
