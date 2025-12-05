// =====================================================
// SERVICES - CADASTROS FISCAIS AUXILIARES
// Serviços para NCM, CFOP, Operações Fiscais e Unidades
// Data: 02/12/2025
// =====================================================

import { supabase } from '../../lib/supabase'
import type {
  NCM,
  NCMFormData,
  NCMFiltros,
  CFOP,
  CFOPFormData,
  CFOPFiltros,
  OperacaoFiscal,
  OperacaoFiscalFormData,
  OperacaoFiscalFiltros,
  UnidadeMedida,
  UnidadeMedidaFormData,
  UnidadeMedidaFiltros,
  ResultadoCadastro
} from './types'

// =====================================================
// NCM - NOMENCLATURA COMUM DO MERCOSUL
// =====================================================

export const ncmService = {
  async listar(filtros?: NCMFiltros) {
    try {
      let query = supabase
        .from('ncm')
        .select('*')
        .order('codigo', { ascending: true })

      if (filtros?.busca) {
        query = query.or(`codigo.ilike.%${filtros.busca}%,descricao.ilike.%${filtros.busca}%`)
      }

      if (filtros?.codigo) {
        query = query.eq('codigo', filtros.codigo)
      }

      if (filtros?.ativo !== undefined) {
        query = query.eq('ativo', filtros.ativo)
      }

      const { data, error } = await query

      if (error) throw error
      return data as NCM[]
    } catch (error) {
      console.error('Erro ao listar NCM:', error)
      throw error
    }
  },

  async buscarPorId(id: number) {
    try {
      const { data, error } = await supabase
        .from('ncm')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as NCM
    } catch (error) {
      console.error('Erro ao buscar NCM:', error)
      throw error
    }
  },

  async criar(dados: NCMFormData): Promise<ResultadoCadastro> {
    try {
      const { data, error } = await supabase
        .from('ncm')
        .insert([{
          ...dados,
          ativo: dados.ativo ?? true
        }])
        .select()
        .single()

      if (error) throw error

      return {
        sucesso: true,
        mensagem: 'NCM cadastrado com sucesso',
        id: data.id
      }
    } catch (error: any) {
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao cadastrar NCM'
      }
    }
  },

  async atualizar(id: number, dados: Partial<NCMFormData>): Promise<ResultadoCadastro> {
    try {
      const { error } = await supabase
        .from('ncm')
        .update(dados)
        .eq('id', id)

      if (error) throw error

      return {
        sucesso: true,
        mensagem: 'NCM atualizado com sucesso'
      }
    } catch (error: any) {
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao atualizar NCM'
      }
    }
  },

  async deletar(id: number): Promise<ResultadoCadastro> {
    try {
      const { error } = await supabase
        .from('ncm')
        .delete()
        .eq('id', id)

      if (error) throw error

      return {
        sucesso: true,
        mensagem: 'NCM excluído com sucesso'
      }
    } catch (error: any) {
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao excluir NCM'
      }
    }
  }
}

// =====================================================
// CFOP - CÓDIGO FISCAL DE OPERAÇÕES
// =====================================================

export const cfopService = {
  async listar(filtros?: CFOPFiltros) {
    try {
      let query = supabase
        .from('cfop')
        .select('*')
        .order('codigo', { ascending: true })

      if (filtros?.busca) {
        query = query.or(`codigo.ilike.%${filtros.busca}%,descricao.ilike.%${filtros.busca}%`)
      }

      if (filtros?.codigo) {
        query = query.eq('codigo', filtros.codigo)
      }

      if (filtros?.tipo_operacao) {
        query = query.eq('tipo_operacao', filtros.tipo_operacao)
      }

      if (filtros?.ativo !== undefined) {
        query = query.eq('ativo', filtros.ativo)
      }

      const { data, error } = await query

      if (error) throw error
      return data as CFOP[]
    } catch (error) {
      console.error('Erro ao listar CFOP:', error)
      throw error
    }
  },

  async buscarPorId(id: number) {
    try {
      const { data, error } = await supabase
        .from('cfop')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as CFOP
    } catch (error) {
      console.error('Erro ao buscar CFOP:', error)
      throw error
    }
  },

  async criar(dados: CFOPFormData): Promise<ResultadoCadastro> {
    try {
      const { data, error } = await supabase
        .from('cfop')
        .insert([{
          ...dados,
          ativo: dados.ativo ?? true,
          movimenta_estoque: dados.movimenta_estoque ?? false,
          movimenta_financeiro: dados.movimenta_financeiro ?? false,
          calcula_icms: dados.calcula_icms ?? false,
          calcula_ipi: dados.calcula_ipi ?? false,
          calcula_pis: dados.calcula_pis ?? false,
          calcula_cofins: dados.calcula_cofins ?? false
        }])
        .select()
        .single()

      if (error) throw error

      return {
        sucesso: true,
        mensagem: 'CFOP cadastrado com sucesso',
        id: data.id
      }
    } catch (error: any) {
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao cadastrar CFOP'
      }
    }
  },

  async atualizar(id: number, dados: Partial<CFOPFormData>): Promise<ResultadoCadastro> {
    try {
      const { error } = await supabase
        .from('cfop')
        .update(dados)
        .eq('id', id)

      if (error) throw error

      return {
        sucesso: true,
        mensagem: 'CFOP atualizado com sucesso'
      }
    } catch (error: any) {
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao atualizar CFOP'
      }
    }
  },

  async deletar(id: number): Promise<ResultadoCadastro> {
    try {
      const { error } = await supabase
        .from('cfop')
        .delete()
        .eq('id', id)

      if (error) throw error

      return {
        sucesso: true,
        mensagem: 'CFOP excluído com sucesso'
      }
    } catch (error: any) {
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao excluir CFOP'
      }
    }
  }
}

// =====================================================
// OPERAÇÕES FISCAIS
// =====================================================

export const operacoesFiscaisService = {
  async listar(filtros?: OperacaoFiscalFiltros) {
    try {
      let query = supabase
        .from('operacoes_fiscais')
        .select('*')
        .order('codigo', { ascending: true })

      if (filtros?.busca) {
        query = query.or(`codigo.ilike.%${filtros.busca}%,nome.ilike.%${filtros.busca}%`)
      }

      if (filtros?.codigo) {
        query = query.eq('codigo', filtros.codigo)
      }

      if (filtros?.tipo_operacao) {
        query = query.eq('tipo_operacao', filtros.tipo_operacao)
      }

      if (filtros?.ativo !== undefined) {
        query = query.eq('ativo', filtros.ativo)
      }

      const { data, error } = await query

      if (error) throw error
      return data as OperacaoFiscal[]
    } catch (error) {
      console.error('Erro ao listar Operações Fiscais:', error)
      throw error
    }
  },

  async buscarPorId(id: number) {
    try {
      const { data, error } = await supabase
        .from('operacoes_fiscais')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as OperacaoFiscal
    } catch (error) {
      console.error('Erro ao buscar Operação Fiscal:', error)
      throw error
    }
  },

  async criar(dados: OperacaoFiscalFormData): Promise<ResultadoCadastro> {
    try {
      const { data, error } = await supabase
        .from('operacoes_fiscais')
        .insert([{
          ...dados,
          ativo: dados.ativo ?? true,
          calcular_icms: dados.calcular_icms ?? true,
          calcular_ipi: dados.calcular_ipi ?? true,
          calcular_pis: dados.calcular_pis ?? true,
          calcular_cofins: dados.calcular_cofins ?? true,
          calcular_st: dados.calcular_st ?? false,
          movimenta_estoque: dados.movimenta_estoque ?? true,
          movimenta_financeiro: dados.movimenta_financeiro ?? true,
          gera_duplicata: dados.gera_duplicata ?? true,
          gera_comissao: dados.gera_comissao ?? true
        }])
        .select()
        .single()

      if (error) throw error

      return {
        sucesso: true,
        mensagem: 'Operação Fiscal cadastrada com sucesso',
        id: data.id
      }
    } catch (error: any) {
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao cadastrar Operação Fiscal'
      }
    }
  },

  async atualizar(id: number, dados: Partial<OperacaoFiscalFormData>): Promise<ResultadoCadastro> {
    try {
      const { error } = await supabase
        .from('operacoes_fiscais')
        .update(dados)
        .eq('id', id)

      if (error) throw error

      return {
        sucesso: true,
        mensagem: 'Operação Fiscal atualizada com sucesso'
      }
    } catch (error: any) {
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao atualizar Operação Fiscal'
      }
    }
  },

  async deletar(id: number): Promise<ResultadoCadastro> {
    try {
      const { error } = await supabase
        .from('operacoes_fiscais')
        .delete()
        .eq('id', id)

      if (error) throw error

      return {
        sucesso: true,
        mensagem: 'Operação Fiscal excluída com sucesso'
      }
    } catch (error: any) {
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao excluir Operação Fiscal'
      }
    }
  }
}

// =====================================================
// UNIDADES DE MEDIDA
// =====================================================

export const unidadesMedidaService = {
  async listar(filtros?: UnidadeMedidaFiltros) {
    try {
      let query = supabase
        .from('unidades_medida')
        .select('*')
        .order('sigla', { ascending: true })

      if (filtros?.busca) {
        query = query.or(`codigo.ilike.%${filtros.busca}%,descricao.ilike.%${filtros.busca}%,sigla.ilike.%${filtros.busca}%`)
      }

      if (filtros?.codigo) {
        query = query.eq('codigo', filtros.codigo)
      }

      if (filtros?.ativo !== undefined) {
        query = query.eq('ativo', filtros.ativo)
      }

      const { data, error } = await query

      if (error) throw error
      return data as UnidadeMedida[]
    } catch (error) {
      console.error('Erro ao listar Unidades de Medida:', error)
      throw error
    }
  },

  async buscarPorId(id: number) {
    try {
      const { data, error } = await supabase
        .from('unidades_medida')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as UnidadeMedida
    } catch (error) {
      console.error('Erro ao buscar Unidade de Medida:', error)
      throw error
    }
  },

  async criar(dados: UnidadeMedidaFormData): Promise<ResultadoCadastro> {
    try {
      const { data, error } = await supabase
        .from('unidades_medida')
        .insert([{
          ...dados,
          ativo: dados.ativo ?? true,
          permite_decimal: dados.permite_decimal ?? false,
          casas_decimais: dados.casas_decimais ?? 0
        }])
        .select()
        .single()

      if (error) throw error

      return {
        sucesso: true,
        mensagem: 'Unidade de Medida cadastrada com sucesso',
        id: data.id
      }
    } catch (error: any) {
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao cadastrar Unidade de Medida'
      }
    }
  },

  async atualizar(id: number, dados: Partial<UnidadeMedidaFormData>): Promise<ResultadoCadastro> {
    try {
      const { error } = await supabase
        .from('unidades_medida')
        .update(dados)
        .eq('id', id)

      if (error) throw error

      return {
        sucesso: true,
        mensagem: 'Unidade de Medida atualizada com sucesso'
      }
    } catch (error: any) {
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao atualizar Unidade de Medida'
      }
    }
  },

  async deletar(id: number): Promise<ResultadoCadastro> {
    try {
      const { error } = await supabase
        .from('unidades_medida')
        .delete()
        .eq('id', id)

      if (error) throw error

      return {
        sucesso: true,
        mensagem: 'Unidade de Medida excluída com sucesso'
      }
    } catch (error: any) {
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao excluir Unidade de Medida'
      }
    }
  }
}
