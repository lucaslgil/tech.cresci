// =====================================================
// SERVICE - REGRAS DE TRIBUTAÇÃO
// Gerenciamento de regras fiscais automáticas
// Data: 02/12/2025
// =====================================================

import { supabase } from '../../lib/supabase'

export interface RegraTributacao {
  id?: number
  empresa_id?: number
  nome: string
  ativo?: boolean
  
  // Filtros
  ncm?: string
  cest?: string
  categoria?: string
  cfop_entrada?: string
  cfop_saida?: string
  origem_mercadoria?: string
  
  // Configurações
  operacao_fiscal?: string
  unidade_emissora?: string
  tipo_contribuinte?: string
  codigo_tributacao_municipio?: string
  item_lista_servico?: string
  
  // ICMS
  cst_icms?: string
  csosn_icms?: string
  aliquota_icms?: number
  reducao_bc_icms?: number
  incide_icms_ipi?: boolean
  mensagem_nf_icms?: string
  
  // ICMS Operação Própria
  aliquota_icms_proprio?: number
  aliquota_fcp?: number
  modalidade_bc_icms?: string
  reducao_bc_icms_proprio?: number
  
  // ICMS ST
  cst_icms_st?: string
  mva_st?: number
  aliquota_icms_st?: number
  aliquota_fcp_st?: number
  modalidade_bc_st?: string
  reducao_bc_st?: number
  fator_multiplicador_st?: number
  
  // ICMS Diferimento
  aliquota_diferimento?: number
  
  // ICMS DIFAL
  aliquota_interestadual?: number
  aliquota_uf_destino?: number
  aliquota_fcp_uf_destino?: number
  partilha_origem?: number
  partilha_destino?: number
  informar_difal_outras_despesas?: boolean
  utilizar_calculo_difal_dentro?: boolean
  
  // ICMS Desoneração
  codigo_beneficio_fiscal?: string
  aliquota_desoneracao?: number
  motivo_desoneracao?: string
  
  // PIS
  cst_pis?: string
  aliquota_pis?: number
  reducao_bc_pis?: number
  mensagem_nf_pis?: string
  icms_nao_incide_pis?: boolean
  
  // COFINS
  cst_cofins?: string
  aliquota_cofins?: number
  reducao_bc_cofins?: number
  mensagem_nf_cofins?: string
  icms_nao_incide_cofins?: boolean
  
  // IPI
  cst_ipi?: string
  aliquota_ipi?: number
  reducao_bc_ipi?: number
  mensagem_nf_ipi?: string
  enquadramento_ipi?: string
  
  // CSLL
  aliquota_csll?: number
  mensagem_nf_csll?: string
  
  // IR
  aliquota_ir?: number
  mensagem_nf_ir?: string
  
  // INSS
  aliquota_inss?: number
  mensagem_nf_inss?: string
  
  // Outras
  outras_retencoes?: string
  aliquota_outras_retencoes?: number
  
  created_at?: string
  updated_at?: string
}

export const regrasTributacaoService = {
  // Listar todas as regras da empresa
  async listar(empresaId: number): Promise<{ data: RegraTributacao[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('regras_tributacao')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('nome')

      return { data, error }
    } catch (error) {
      console.error('Erro ao listar regras:', error)
      return { data: null, error }
    }
  },

  // Buscar regra por ID
  async buscarPorId(id: number): Promise<{ data: RegraTributacao | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('regras_tributacao')
        .select('*')
        .eq('id', id)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Erro ao buscar regra:', error)
      return { data: null, error }
    }
  },

  // Buscar regra por NCM
  async buscarPorNCM(ncm: string, empresaId: number): Promise<{ data: RegraTributacao | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('regras_tributacao')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ncm', ncm)
        .eq('ativo', true)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Erro ao buscar regra por NCM:', error)
      return { data: null, error }
    }
  },

  // Criar nova regra
  async criar(regra: RegraTributacao): Promise<{ data: RegraTributacao | null; error: any }> {
    try {
      // Limpar campos vazios
      const regraNova = Object.fromEntries(
        Object.entries(regra).map(([key, value]) => [key, value === '' ? null : value])
      )

      const { data, error } = await supabase
        .from('regras_tributacao')
        .insert([regraNova])
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar regra:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Erro ao criar regra:', error)
      return { data: null, error }
    }
  },

  // Atualizar regra existente
  async atualizar(id: number, regra: Partial<RegraTributacao>): Promise<{ data: RegraTributacao | null; error: any }> {
    try {
      // Limpar campos vazios
      const regraAtualizada = Object.fromEntries(
        Object.entries(regra).map(([key, value]) => [key, value === '' ? null : value])
      )

      const { data, error } = await supabase
        .from('regras_tributacao')
        .update(regraAtualizada)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar regra:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Erro ao atualizar regra:', error)
      return { data: null, error }
    }
  },

  // Deletar regra (soft delete)
  async deletar(id: number): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('regras_tributacao')
        .update({ ativo: false })
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar regra:', error)
      }

      return { error }
    } catch (error) {
      console.error('Erro ao deletar regra:', error)
      return { error }
    }
  },

  // Deletar permanentemente
  async deletarPermanente(id: number): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('regras_tributacao')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar permanentemente regra:', error)
      }

      return { error }
    } catch (error) {
      console.error('Erro ao deletar permanentemente regra:', error)
      return { error }
    }
  },

  // Aplicar regra a um produto
  async aplicarRegraEmProduto(ncm: string, empresaId: number) {
    const { data, error } = await this.buscarPorNCM(ncm, empresaId)
    
    if (error || !data) {
      return null
    }

    // Retorna objeto com dados fiscais para aplicar no produto
    return {
      cst_icms: data.cst_icms,
      csosn_icms: data.csosn_icms,
      aliquota_icms: data.aliquota_icms,
      reducao_bc_icms: data.reducao_bc_icms,
      cst_pis: data.cst_pis,
      aliquota_pis: data.aliquota_pis,
      cst_cofins: data.cst_cofins,
      aliquota_cofins: data.aliquota_cofins,
      cst_ipi: data.cst_ipi,
      aliquota_ipi: data.aliquota_ipi,
      cfop_entrada: data.cfop_entrada,
      cfop_saida: data.cfop_saida,
      origem_mercadoria: data.origem_mercadoria
    }
  }
}
