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

      if (error) {
        // Detectar erro de tabela ausente no Supabase/PostgREST e lançar mensagem amigável
        const msg = (error.message || '').toString()
        if (msg.includes("Could not find the table 'public.cfop'") || (error.code && error.code === 'PGRST205')) {
          throw new Error("Tabela 'cfop' não encontrada no projeto Supabase. Execute 'database/aplicar_cadastros_auxiliares.sql' no SQL editor do Supabase e habilite RLS/permissões.")
        }
        throw error
      }
      return data as CFOP[]
    } catch (error) {
      console.error('Erro ao listar CFOP')
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

      if (error) {
        const msg = (error.message || '').toString()
        if (msg.includes("Could not find the table 'public.cfop'") || (error.code && error.code === 'PGRST205')) {
          throw new Error("Tabela 'cfop' não encontrada no projeto Supabase. Execute 'database/aplicar_cadastros_auxiliares.sql' no SQL editor do Supabase e habilite RLS/permissões.")
        }
        throw error
      }
      return data as CFOP
    } catch (error) {
      console.error('Erro ao buscar CFOP')
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
      const msg = (error?.message || '').toString()
      if (msg.includes("Could not find the table 'public.cfop'") || (error?.code === 'PGRST205')) {
        return {
          sucesso: false,
          mensagem: "Tabela 'cfop' não encontrada no Supabase. Execute 'database/aplicar_cadastros_auxiliares.sql' no SQL editor do Supabase."
        }
      }
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
      const msg = (error?.message || '').toString()
      if (msg.includes("Could not find the table 'public.cfop'") || (error?.code === 'PGRST205')) {
        return {
          sucesso: false,
          mensagem: "Tabela 'cfop' não encontrada no Supabase. Execute 'database/aplicar_cadastros_auxiliares.sql' no SQL editor do Supabase."
        }
      }
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
      const msg = (error?.message || '').toString()
      if (msg.includes("Could not find the table 'public.cfop'") || (error?.code === 'PGRST205')) {
        return {
          sucesso: false,
          mensagem: "Tabela 'cfop' não encontrada no Supabase. Execute 'database/aplicar_cadastros_auxiliares.sql' no SQL editor do Supabase."
        }
      }
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
          regime_tributario: dados.regime_tributario ?? 'TODOS',
          ativo: dados.ativo ?? true,
          calcular_icms: dados.calcular_icms ?? true,
          calcular_ipi: dados.calcular_ipi ?? true,
          calcular_pis: dados.calcular_pis ?? true,
          calcular_cofins: dados.calcular_cofins ?? true,
          calcular_st: dados.calcular_st ?? false
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

// =====================================================
// ICMS-ST POR UF
// =====================================================

export const icmsStService = {
  async listar(filtros?: any) {
    try {
      let query = supabase
        .from('icms_st_por_uf')
        .select('*')
        .order('uf_origem', { ascending: true })

      if (filtros?.busca) {
        query = query.or(`uf_origem.ilike.%${filtros.busca}%,uf_destino.ilike.%${filtros.busca}%`)
      }

      if (filtros?.uf_origem) query = query.eq('uf_origem', filtros.uf_origem)
      if (filtros?.uf_destino) query = query.eq('uf_destino', filtros.uf_destino)
      if (filtros?.ncm) query = query.eq('ncm', filtros.ncm)
      if (filtros?.ativo !== undefined) query = query.eq('ativo', filtros.ativo)

      const { data, error } = await query
      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao listar ICMS-ST por UF:', error)
      throw error
    }
  },

  async buscarPorId(id: number) {
    try {
      const { data, error } = await supabase
        .from('icms_st_por_uf')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar ICMS-ST por ID:', error)
      throw error
    }
  },

  async criar(dados: any) {
    try {
      const { data, error } = await supabase
        .from('icms_st_por_uf')
        .insert([dados])
        .select()
        .single()
      if (error) throw error
      return { sucesso: true, mensagem: 'ICMS-ST cadastrado', id: data.id }
    } catch (error: any) {
      return { sucesso: false, mensagem: error.message || 'Erro ao cadastrar ICMS-ST' }
    }
  },

  async atualizar(id: number, dados: any) {
    try {
      const { error } = await supabase
        .from('icms_st_por_uf')
        .update(dados)
        .eq('id', id)
      if (error) throw error
      return { sucesso: true, mensagem: 'ICMS-ST atualizado' }
    } catch (error: any) {
      return { sucesso: false, mensagem: error.message || 'Erro ao atualizar ICMS-ST' }
    }
  },

  async deletar(id: number) {
    try {
      const { error } = await supabase
        .from('icms_st_por_uf')
        .delete()
        .eq('id', id)
      if (error) throw error
      return { sucesso: true, mensagem: 'ICMS-ST excluído' }
    } catch (error: any) {
      return { sucesso: false, mensagem: error.message || 'Erro ao excluir ICMS-ST' }
    }
  }
}

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
