/**
 * SERVIÇO - RELATÓRIOS DO RADAR DE INATIVIDADE SALVOS
 * Persiste relatórios no Supabase (tabela radar_relatorios_salvos),
 * vinculados à empresa e ao usuário autenticado.
 */

import { supabase } from '../../lib/supabase'
import type { ResultadoRadar } from './radarInativiadeService'

// =====================================================
// TIPOS
// =====================================================

export interface RelatorioSalvo {
  id: string
  titulo: string
  data_gravacao: string   // = created_at da tabela
  resumo: string
  resultado: ResultadoRadar
}

// Formato retornado pelo Supabase
interface RelatorioRow {
  id: string
  titulo: string
  resumo: string
  resultado: ResultadoRadar
  created_at: string
}

// =====================================================
// HELPERS INTERNOS
// =====================================================

async function obterEmpresaEUsuario(): Promise<{ empresaId: number; usuarioId: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  if (error || !data?.empresa_id) {
    throw new Error('Usuário não possui empresa associada')
  }

  return { empresaId: data.empresa_id as number, usuarioId: user.id }
}

function rowParaRelatorio(row: RelatorioRow): RelatorioSalvo {
  return {
    id:            row.id,
    titulo:        row.titulo,
    resumo:        row.resumo,
    data_gravacao: row.created_at,
    resultado:     row.resultado,
  }
}

// =====================================================
// API PÚBLICA (async — usa Supabase)
// =====================================================

export async function listarRelatoriosSalvos(): Promise<RelatorioSalvo[]> {
  try {
    const { empresaId } = await obterEmpresaEUsuario()

    const { data, error } = await supabase
      .from('radar_relatorios_salvos')
      .select('id, titulo, resumo, resultado, created_at')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return (data as RelatorioRow[]).map(rowParaRelatorio)
  } catch {
    return []
  }
}

export async function salvarRelatorio(
  titulo: string,
  resumo: string,
  resultado: ResultadoRadar
): Promise<RelatorioSalvo> {
  const { empresaId, usuarioId } = await obterEmpresaEUsuario()

  const { data, error } = await supabase
    .from('radar_relatorios_salvos')
    .insert({
      empresa_id: empresaId,
      usuario_id: usuarioId,
      titulo:     titulo.trim() || 'Relatório sem título',
      resumo,
      resultado,
    })
    .select('id, titulo, resumo, resultado, created_at')
    .single()

  if (error) throw error
  return rowParaRelatorio(data as RelatorioRow)
}

export async function excluirRelatorio(id: string): Promise<void> {
  const { error } = await supabase
    .from('radar_relatorios_salvos')
    .delete()
    .eq('id', id)

  if (error) throw error
}

