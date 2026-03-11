// =====================================================
// HOOK: useParametros
// Gerenciamento de parâmetros configuráveis de franquias
// =====================================================

import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../../../lib/supabase'
import { useAuth } from '../../../shared/context/AuthContext'
import type { ParametroFranquia, FormParametro, TipoParametro } from './types'

export const useParametros = () => {
  const { user } = useAuth()
  const [parametros, setParametros] = useState<ParametroFranquia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [empresaId, setEmpresaId] = useState<string | null>(null)

  // Busca empresa_id do usuário
  useEffect(() => {
    const fetchEmpresaId = async () => {
      if (!user || !isSupabaseConfigured) return
      const { data } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', user.id)
        .single()
      if (data?.empresa_id) setEmpresaId(String(data.empresa_id))
    }
    fetchEmpresaId()
  }, [user])

  // Busca todos os parâmetros da empresa
  const fetchParametros = useCallback(async () => {
    if (!empresaId || !isSupabaseConfigured) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('franquia_parametros')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('tipo')
      .order('ordem')
      .order('label')
    if (err) {
      setError('Erro ao carregar parâmetros.')
      console.error(err)
    } else {
      setParametros((data as ParametroFranquia[]) ?? [])
    }
    setLoading(false)
  }, [empresaId])

  useEffect(() => {
    if (empresaId) fetchParametros()
  }, [empresaId, fetchParametros])

  // Helpers para obter parâmetros por tipo (apenas ativos)
  const getByTipo = useCallback(
    (tipo: TipoParametro): ParametroFranquia[] =>
      parametros.filter(p => p.tipo === tipo && p.ativo),
    [parametros]
  )

  // Criar parâmetro
  const createParametro = useCallback(async (form: FormParametro): Promise<boolean> => {
    if (!empresaId || !isSupabaseConfigured) return false
    setSaving(true)
    const payload = {
      empresa_id: empresaId,
      tipo: form.tipo,
      label: form.label.trim(),
      cor: form.cor.trim() || null,
      ordem: parseInt(form.ordem) || 0,
      ativo: form.ativo,
    }
    const { error: err } = await supabase.from('franquia_parametros').insert(payload)
    setSaving(false)
    if (err) {
      console.error(err)
      return false
    }
    await fetchParametros()
    return true
  }, [empresaId, fetchParametros])

  // Atualizar parâmetro
  const updateParametro = useCallback(async (id: string, form: FormParametro): Promise<boolean> => {
    if (!isSupabaseConfigured) return false
    setSaving(true)
    const payload = {
      tipo: form.tipo,
      label: form.label.trim(),
      cor: form.cor.trim() || null,
      ordem: parseInt(form.ordem) || 0,
      ativo: form.ativo,
      updated_at: new Date().toISOString(),
    }
    const { error: err } = await supabase.from('franquia_parametros').update(payload).eq('id', id)
    setSaving(false)
    if (err) {
      console.error(err)
      return false
    }
    await fetchParametros()
    return true
  }, [fetchParametros])

  // Excluir parâmetro
  const deleteParametro = useCallback(async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false
    const { error: err } = await supabase.from('franquia_parametros').delete().eq('id', id)
    if (err) {
      console.error(err)
      return false
    }
    await fetchParametros()
    return true
  }, [fetchParametros])

  // Busca parâmetros de forma standalone (para usar em outros hooks/páginas)
  const fetchParametrosByEmpresa = useCallback(async (empId: string): Promise<ParametroFranquia[]> => {
    if (!isSupabaseConfigured) return []
    const { data } = await supabase
      .from('franquia_parametros')
      .select('*')
      .eq('empresa_id', empId)
      .eq('ativo', true)
      .order('tipo')
      .order('ordem')
      .order('label')
    return (data as ParametroFranquia[]) ?? []
  }, [])

  return {
    parametros,
    loading,
    error,
    saving,
    getByTipo,
    fetchParametros,
    fetchParametrosByEmpresa,
    createParametro,
    updateParametro,
    deleteParametro,
  }
}
