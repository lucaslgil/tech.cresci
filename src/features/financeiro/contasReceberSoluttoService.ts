/**
 * SERVIÇO - Contas a Receber Solutto (tabela append-only)
 *
 * Lê da tabela `contas_receber_solutto` e dispara a Edge Function
 * `solutto-sync-contas-receber-novas` para sincronização manual.
 */

import { supabase } from '../../lib/supabase'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// =====================================================
// TIPOS
// =====================================================

export interface ContaReceberSolutto {
  id: number
  empresa_id: number
  cliente_id: number | null
  solutto_cliente_id: number
  solutto_id: number
  cliente_nome: string
  cliente_cpf_cnpj: string | null
  numero_documento: string | null
  descricao: string | null
  data_emissao: string | null
  data_vencimento: string
  data_pagamento: string | null
  valor_original: number
  valor_pago: number
  valor_saldo: number
  forma_pagamento: string | null
  observacoes: string | null
  status: 'ABERTO' | 'QUITADA' | 'PARCIAL' | 'VENCIDO' | 'CANCELADO'
  negociacao_status: string | null
  negociacao_atualizada_em: string | null
  sincronizado_em: string
  created_at: string
}

export interface FiltrosCRSolutto {
  status?: ContaReceberSolutto['status'] | 'TODOS'
  busca?: string                 // pesquisa por nome/documento
  cliente_id?: number
  vencimento_inicio?: string
  vencimento_fim?: string
}

export interface ResumoCRSolutto {
  total_contas: number
  total_aberto: number
  total_quitado: number
  total_vencido: number
  valor_total: number
  valor_recebido: number
  valor_pendente: number
}

export interface SyncLogEntry {
  id: number
  origem: 'MANUAL' | 'CRON'
  iniciado_em: string
  finalizado_em: string | null
  clientes_processados: number
  contas_inseridas: number
  contas_ignoradas: number
  erros: number
  sucesso: boolean
}

export interface ProgressoSync {
  processados: number
  inseridas: number
  ignoradas: number
  erros: number
  mensagem: string
}

export interface ResultadoSync {
  processados: number
  inseridas: number
  ignoradas: number
  erros: number
  detalhes_erros: Array<{ cliente: string; motivo: string }>
}

// =====================================================
// LISTAGEM
// =====================================================

export async function listarContasReceberSolutto(
  filtros: FiltrosCRSolutto = {}
): Promise<ContaReceberSolutto[]> {
  let query = supabase
    .from('contas_receber_solutto')
    .select('*')
    .order('data_vencimento', { ascending: false })
    .limit(2000)

  if (filtros.status && filtros.status !== 'TODOS') {
    query = query.eq('status', filtros.status)
  }
  if (filtros.cliente_id) {
    query = query.eq('cliente_id', filtros.cliente_id)
  }
  if (filtros.vencimento_inicio) {
    query = query.gte('data_vencimento', filtros.vencimento_inicio)
  }
  if (filtros.vencimento_fim) {
    query = query.lte('data_vencimento', filtros.vencimento_fim)
  }
  if (filtros.busca && filtros.busca.trim().length > 0) {
    const termo = `%${filtros.busca.trim()}%`
    query = query.or(`cliente_nome.ilike.${termo},numero_documento.ilike.${termo},descricao.ilike.${termo}`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data || []) as ContaReceberSolutto[]
}

export function calcularResumo(contas: ContaReceberSolutto[]): ResumoCRSolutto {
  const hoje = new Date().toISOString().split('T')[0]

  let total_aberto  = 0
  let total_quitado = 0
  let total_vencido = 0
  let valor_total     = 0
  let valor_recebido  = 0
  let valor_pendente  = 0

  for (const c of contas) {
    valor_total    += Number(c.valor_original)
    valor_recebido += Number(c.valor_pago)
    valor_pendente += Number(c.valor_saldo)

    if (c.status === 'QUITADA') total_quitado++
    else if (c.data_vencimento < hoje && Number(c.valor_saldo) > 0) total_vencido++
    else total_aberto++
  }

  return {
    total_contas: contas.length,
    total_aberto,
    total_quitado,
    total_vencido,
    valor_total,
    valor_recebido,
    valor_pendente,
  }
}

// =====================================================
// SYNC MANUAL (via Edge Function)
// =====================================================

export async function sincronizarManual(
  onProgress: (p: ProgressoSync) => void,
  signal?: AbortSignal
): Promise<ResultadoSync> {
  let totalProcessados = 0
  let totalInseridas   = 0
  let totalIgnoradas   = 0
  let totalErros       = 0
  const detalhes_erros: Array<{ cliente: string; motivo: string }> = []

  const LOTE = 10

  while (true) {
    if (signal?.aborted) throw new DOMException('Cancelado pelo usuário', 'AbortError')

    // Obter token a cada iteração — o Supabase JS auto-renova a sessão em background,
    // mas precisamos puxar o token fresco para chamadas longas que ultrapassam o TTL (1h)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || SUPABASE_ANON_KEY

    const resp = await fetch(`${SUPABASE_URL}/functions/v1/solutto-sync-contas-receber-novas`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ limite: LOTE }),
      signal,
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(`Erro na sincronização: ${resp.status} ${text.slice(0, 200)}`)
    }

    const data = await resp.json() as {
      processados: number
      inseridas:   number
      ignoradas:   number
      erros:       number
      detalhes_erros: Array<{ cliente: string; motivo: string }>
      tem_mais:    boolean
      error?:      string
    }

    if (data.error) throw new Error(data.error)

    totalProcessados += data.processados
    totalInseridas   += data.inseridas
    totalIgnoradas   += data.ignoradas
    totalErros       += data.erros
    detalhes_erros.push(...(data.detalhes_erros || []))

    onProgress({
      processados: totalProcessados,
      inseridas:   totalInseridas,
      ignoradas:   totalIgnoradas,
      erros:       totalErros,
      mensagem:    `Processados ${totalProcessados} clientes...`,
    })

    if (!data.tem_mais || data.processados === 0) break
  }

  return {
    processados: totalProcessados,
    inseridas:   totalInseridas,
    ignoradas:   totalIgnoradas,
    erros:       totalErros,
    detalhes_erros,
  }
}

// =====================================================
// LOG de execuções
// =====================================================

export async function listarUltimosSyncs(limite = 10): Promise<SyncLogEntry[]> {
  const { data, error } = await supabase
    .from('contas_receber_solutto_sync_log')
    .select('id, origem, iniciado_em, finalizado_em, clientes_processados, contas_inseridas, contas_ignoradas, erros, sucesso')
    .order('iniciado_em', { ascending: false })
    .limit(limite)

  if (error) throw new Error(error.message)
  return (data || []) as SyncLogEntry[]
}
