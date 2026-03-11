// =====================================================
// HOOK: useUnidades
// Gerenciamento de estados e operações de banco de dados
// do módulo de Unidades Franqueadas
// =====================================================

import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../../../lib/supabase'
import { useAuth } from '../../../shared/context/AuthContext'
import type { Unidade, SocioUnidade, FormUnidade } from './types'

// Tipo mínimo para exibição de clientes vinculados
export interface ClienteInfo {
  id: number
  codigo: string
  tipo_pessoa: 'FISICA' | 'JURIDICA'
  nome_completo?: string
  razao_social?: string
  nome_fantasia?: string
  cpf?: string
  cnpj?: string
  email?: string
  telefone?: string
  status: string
  limite_credito: number
}

export const useUnidades = () => {
  const { user } = useAuth()
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [empresaId, setEmpresaId] = useState<string | null>(null)

  // Busca o empresa_id do usuário logado
  useEffect(() => {
    const fetchEmpresaId = async () => {
      if (!user || !isSupabaseConfigured) return
      const { data } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', user.id)
        .single()
      if (data?.empresa_id) setEmpresaId(data.empresa_id)
    }
    fetchEmpresaId()
  }, [user])

  // Busca todas as unidades da empresa
  const fetchUnidades = useCallback(async () => {
    if (!empresaId || !isSupabaseConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('franquia_unidades')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('nome_unidade', { ascending: true })
      if (error) throw error
      setUnidades(data || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar unidades'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [empresaId])

  useEffect(() => {
    if (empresaId) fetchUnidades()
  }, [empresaId, fetchUnidades])

  // Converte o formulário para os dados do banco
  const parseFormToPayload = (form: FormUnidade) => ({
    codigo_unidade: form.codigo_unidade.trim(),
    nome_unidade: form.nome_unidade.trim(),
    nome_fantasia: form.nome_fantasia.trim() || null,
    status: form.status,
    data_abertura: form.data_abertura || null,
    data_assinatura_contrato: form.data_assinatura_contrato || null,
    nome_franqueado: form.nome_franqueado.trim(),
    cpf_cnpj_franqueado: form.cpf_cnpj_franqueado.trim() || null,
    email_franqueado: form.email_franqueado.trim() || null,
    telefone_franqueado: form.telefone_franqueado.trim() || null,
    cep: form.cep.replace(/\D/g, '') || null,
    rua: form.rua.trim() || null,
    numero: form.numero.trim() || null,
    complemento: form.complemento.trim() || null,
    bairro: form.bairro.trim() || null,
    cidade: form.cidade.trim() || null,
    estado: form.estado || null,
    pais: form.pais.trim() || 'Brasil',
    latitude: form.latitude ? parseFloat(form.latitude) : null,
    longitude: form.longitude ? parseFloat(form.longitude) : null,
    tipo_contrato: form.tipo_contrato.trim() || null,
    prazo_contrato_meses: form.prazo_contrato_meses ? parseInt(form.prazo_contrato_meses) : null,
    data_inicio_contrato: form.data_inicio_contrato || null,
    data_termino_contrato: form.data_termino_contrato || null,
    taxa_franquia: form.taxa_franquia ? parseFloat(form.taxa_franquia) : null,
    royalties_percentual: form.royalties_percentual ? parseFloat(form.royalties_percentual) : null,
    fundo_marketing_percentual: form.fundo_marketing_percentual ? parseFloat(form.fundo_marketing_percentual) : null,
    taxa_tecnologica: form.taxa_tecnologica ? parseFloat(form.taxa_tecnologica) : null,
    modelo_unidade: form.modelo_unidade || null,
    tamanho_loja_m2: form.tamanho_loja_m2 ? parseFloat(form.tamanho_loja_m2) : null,
    capacidade_operacional: form.capacidade_operacional ? parseInt(form.capacidade_operacional) : null,
    horario_funcionamento: form.horario_funcionamento.trim()
      ? { descricao: form.horario_funcionamento.trim() }
      : null,
    etapa_atual: form.etapa_atual,
    faturamento_meta_mensal: form.faturamento_meta_mensal ? parseFloat(form.faturamento_meta_mensal) : null,
    cliente_id: form.cliente_id ?? null,
    franqueado_id: form.franqueado_id ?? null,
  })

  // Cria nova unidade
  const criarUnidade = async (form: FormUnidade): Promise<Unidade> => {
    if (!empresaId || !user) throw new Error('Usuário não autenticado')
    const payload = {
      ...parseFormToPayload(form),
      empresa_id: empresaId,
      created_by: user.id,
      updated_by: user.id,
    }
    const { data, error } = await supabase
      .from('franquia_unidades')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    await fetchUnidades()
    return data as Unidade
  }

  // Atualiza unidade existente
  const atualizarUnidade = async (id: string, form: FormUnidade): Promise<Unidade> => {
    if (!user) throw new Error('Usuário não autenticado')
    const payload = {
      ...parseFormToPayload(form),
      updated_by: user.id,
    }
    const { data, error } = await supabase
      .from('franquia_unidades')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    await fetchUnidades()
    return data as Unidade
  }

  // Exclui unidade
  const excluirUnidade = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('franquia_unidades')
      .delete()
      .eq('id', id)
    if (error) throw error
    await fetchUnidades()
  }

  // ── SÓCIOS ──────────────────────────────────────────

  const fetchSocios = async (unidadeId: string): Promise<SocioUnidade[]> => {
    if (!isSupabaseConfigured) return []
    const { data, error } = await supabase
      .from('franquia_unidades_socios')
      .select('*')
      .eq('unidade_id', unidadeId)
      .order('nome')
    if (error) throw error
    return (data || []) as SocioUnidade[]
  }

  const salvarSocio = async (
    socio: Partial<SocioUnidade>,
    unidadeId: string
  ): Promise<SocioUnidade> => {
    if (!empresaId || !user) throw new Error('Usuário não autenticado')

    if (socio.id) {
      const { data, error } = await supabase
        .from('franquia_unidades_socios')
        .update({
          nome: socio.nome,
          cpf_cnpj: socio.cpf_cnpj || null,
          email: socio.email || null,
          telefone: socio.telefone || null,
          percentual_participacao: socio.percentual_participacao || null,
          tipo_socio: socio.tipo_socio || 'socio',
        })
        .eq('id', socio.id)
        .select()
        .single()
      if (error) throw error
      return data as SocioUnidade
    } else {
      const { data, error } = await supabase
        .from('franquia_unidades_socios')
        .insert({
          unidade_id: unidadeId,
          empresa_id: empresaId,
          nome: socio.nome,
          cpf_cnpj: socio.cpf_cnpj || null,
          email: socio.email || null,
          telefone: socio.telefone || null,
          percentual_participacao: socio.percentual_participacao || null,
          tipo_socio: socio.tipo_socio || 'socio',
        })
        .select()
        .single()
      if (error) throw error
      return data as SocioUnidade
    }
  }

  const excluirSocio = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('franquia_unidades_socios')
      .delete()
      .eq('id', id)
    if (error) throw error
  }

  // Busca clientes para vínculo (autocomplete)
  const searchClientes = async (term: string): Promise<ClienteInfo[]> => {
    if (!isSupabaseConfigured || !empresaId || !term.trim()) return []
    const { data } = await supabase
      .from('clientes')
      .select('id, codigo, tipo_pessoa, nome_completo, razao_social, nome_fantasia, cpf, cnpj, email, telefone, status, limite_credito')
      .eq('empresa_id', empresaId)
      .or(
        `nome_completo.ilike.%${term}%,razao_social.ilike.%${term}%,cpf.ilike.%${term}%,cnpj.ilike.%${term}%,codigo.ilike.%${term}%`
      )
      .limit(10)
    return (data || []) as ClienteInfo[]
  }

  // Busca clientes Pessoa Física (para vínculo de franqueado)
  const searchClientesPF = async (term: string): Promise<ClienteInfo[]> => {
    if (!isSupabaseConfigured || !empresaId || !term.trim()) return []
    const { data } = await supabase
      .from('clientes')
      .select('id, codigo, tipo_pessoa, nome_completo, razao_social, nome_fantasia, cpf, cnpj, email, telefone, status, limite_credito')
      .eq('empresa_id', empresaId)
      .eq('tipo_pessoa', 'FISICA')
      .or(
        `nome_completo.ilike.%${term}%,cpf.ilike.%${term}%,codigo.ilike.%${term}%`
      )
      .limit(10)
    return (data || []) as ClienteInfo[]
  }

  // Busca um cliente específico pelo ID (para exibir no modal)
  const fetchClienteById = async (id: number): Promise<ClienteInfo | null> => {
    if (!isSupabaseConfigured) return null
    const { data } = await supabase
      .from('clientes')
      .select('id, codigo, tipo_pessoa, nome_completo, razao_social, nome_fantasia, cpf, cnpj, email, telefone, status, limite_credito')
      .eq('id', id)
      .single()
    return data as ClienteInfo | null
  }

  // Busca uma unidade específica por ID
  const fetchUnidadeById = async (id: string): Promise<Unidade | null> => {
    if (!isSupabaseConfigured) return null
    const { data, error } = await supabase
      .from('franquia_unidades')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data as Unidade
  }

  return {
    unidades,
    loading,
    error,
    empresaId,
    fetchUnidades,
    fetchUnidadeById,
    criarUnidade,
    atualizarUnidade,
    excluirUnidade,
    fetchSocios,
    salvarSocio,
    excluirSocio,
    searchClientes,
    searchClientesPF,
    fetchClienteById,
  }
}
