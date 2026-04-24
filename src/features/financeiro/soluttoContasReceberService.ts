/**
 * SERVIÇO DE SINCRONIZAÇÃO SOLUTTO → CONTAS A RECEBER
 *
 * Fluxo: Solutto (somente leitura) → Edge Function → Supabase (escrita)
 * Jamais escreve ou altera dados na Solutto.
 */

import { supabase } from '../../lib/supabase'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// =====================================================
// TIPOS
// =====================================================

export interface ContaReceberSolutto {
  solutto_id: number
  numero_documento: string
  descricao: string
  data_emissao: string
  data_vencimento: string
  data_pagamento: string
  valor_original: number
  valor_pago: number
  valor_saldo: number
  status: string
  forma_pagamento: string
  observacoes: string
  dados_extras: Record<string, string>
}

export interface ProgressoSyncContas {
  total: number
  processados: number
  atualizados: number
  criados: number
  erros: number
  mensagem: string
}

export interface ResultadoSyncContas {
  total_solutto: number
  atualizados: number
  criados: number
  erros: number
  detalhes_erros: Array<{ numero: string; motivo: string }>
}

export interface ResultadoSyncTodos {
  total: number
  criados: number
  atualizados: number
  erros: number
  detalhes_erros: Array<{ cliente: string; motivo: string }>
}

export interface ProgressoSyncTodos {
  processados: number
  total: number
  criados: number
  atualizados: number
  erros: number
}

// =====================================================
// HELPERS INTERNOS
// =====================================================

async function obterEmpresaId(): Promise<number> {
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
  return data.empresa_id as number
}

/**
 * Mapeia status retornado pela Solutto para os status da nossa tabela.
 * Se não reconhecer, usa ABERTO por padrão.
 */
function mapearStatus(statusSolutto: string, dataPagamento: string, valorSaldo: number): string {
  // Campo 'quitada' da Solutto: '1' = pago, '0' = aberto
  if (statusSolutto === '1') return 'QUITADA'
  if (statusSolutto === '0') {
    if (dataPagamento && valorSaldo <= 0) return 'QUITADA'
    if (dataPagamento && valorSaldo > 0)  return 'PARCIAL'
    return 'ABERTO'
  }

  // Fallback para strings textuais (compatibilidade futura)
  const s = (statusSolutto || '').toLowerCase()
  if (s.includes('pago') || s.includes('quitado') || s.includes('baixado') || s.includes('liquidado')) return 'QUITADA'
  if (s.includes('parcial')) return 'PARCIAL'
  if (s.includes('cancel') || s.includes('estorno')) return 'CANCELADO'
  if (dataPagamento && valorSaldo <= 0) return 'QUITADA'
  if (dataPagamento && valorSaldo > 0)  return 'PARCIAL'

  return 'ABERTO'
}

// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Sincroniza as contas a receber de um cliente específico via Solutto.
 *
 * @param nossoClienteId      ID do cliente na nossa base (clientes.id)
 * @param soluttoClienteId    ID do cliente no Solutto (clientes.solutto_cliente_id)
 * @param clienteNome         Nome do cliente (para preenchimento dos registros)
 * @param onProgress          Callback de progresso
 * @param signal              AbortSignal para cancelamento
 */
export async function sincronizarContasReceberSolutto(
  nossoClienteId: number,
  soluttoClienteId: number,
  clienteNome: string,
  onProgress: (p: ProgressoSyncContas) => void,
  signal?: AbortSignal
): Promise<ResultadoSyncContas> {
  onProgress({ total: 0, processados: 0, atualizados: 0, criados: 0, erros: 0, mensagem: 'Consultando Solutto...' })

  // 1. Chamar Edge Function
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/solutto-contas-receber`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ solutto_cliente_id: soluttoClienteId }),
    signal,
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`Erro ao consultar Solutto: ${resp.status} ${text.slice(0, 150)}`)
  }

  const { contas, error } = await resp.json() as { contas: ContaReceberSolutto[]; error?: string }

  if (error) throw new Error(error)
  if (!contas || contas.length === 0) {
    return { total_solutto: 0, atualizados: 0, criados: 0, erros: 0, detalhes_erros: [] }
  }

  // 2. Carregar registros já existentes para este cliente com origem SOLUTTO
  onProgress({ total: contas.length, processados: 0, atualizados: 0, criados: 0, erros: 0, mensagem: 'Carregando base local...' })

  const empresaId = await obterEmpresaId()

  const { data: existentes } = await supabase
    .from('contas_receber')
    .select('id, solutto_id')
    .eq('cliente_id', nossoClienteId)
    .not('solutto_id', 'is', null)

  const mapaExistentes = new Map<number, number>()
  for (const e of (existentes || [])) {
    if (e.solutto_id) mapaExistentes.set(e.solutto_id, e.id)
  }

  // 3. Processar cada conta
  let atualizados = 0
  let criados = 0
  let erros = 0
  const detalhes_erros: Array<{ numero: string; motivo: string }> = []

  for (let i = 0; i < contas.length; i++) {
    if (signal?.aborted) break

    const c = contas[i]
    const identificador = c.numero_documento || String(c.solutto_id)

    onProgress({
      total: contas.length,
      processados: i,
      atualizados,
      criados,
      erros,
      mensagem: identificador,
    })

    try {
      const statusMapeado = mapearStatus(c.status, c.data_pagamento, c.valor_saldo)

      // Calcular saldo: se a Solutto retornou saldo zerado mas há valor original e valor pago
      const valorSaldo = c.valor_saldo > 0
        ? c.valor_saldo
        : Math.max(0, c.valor_original - c.valor_pago)

      const payload: Record<string, unknown> = {
        cliente_id:               nossoClienteId,
        cliente_nome:             clienteNome,
        descricao:                c.descricao || `Conta Solutto #${c.solutto_id}`,
        numero_documento:         c.numero_documento || null,
        numero_parcela:           1,
        total_parcelas:           1,
        valor_original:           c.valor_original,
        valor_juros:              0,
        valor_desconto:           0,
        valor_total:              c.valor_original,
        valor_pago:               c.valor_pago,
        valor_saldo:              valorSaldo,
        data_emissao:             c.data_emissao || new Date().toISOString().split('T')[0],
        data_vencimento:          c.data_vencimento || new Date().toISOString().split('T')[0],
        data_pagamento:           c.data_pagamento || null,
        status:                   statusMapeado,
        forma_pagamento:          c.forma_pagamento || null,
        observacoes:              c.observacoes || null,
        origem:                   'SOLUTTO',
        solutto_id:               c.solutto_id,
        solutto_sincronizado_em:  new Date().toISOString(),
        solutto_dados_extras:     c.dados_extras,
      }

      // Incluir empresa_id se disponível
      if (empresaId) {
        payload.empresa_id = empresaId
      }

      const idExistente = mapaExistentes.get(c.solutto_id)

      if (idExistente) {
        // ATUALIZA
        const { solutto_id: _, origem: __, empresa_id: ___, ...camposUpdate } = payload as any
        const { error: updateError } = await supabase
          .from('contas_receber')
          .update({ ...camposUpdate, solutto_sincronizado_em: new Date().toISOString() })
          .eq('id', idExistente)

        if (updateError) throw new Error(updateError.message)
        atualizados++
      } else {
        // CRIA
        const { error: insertError } = await supabase
          .from('contas_receber')
          .insert(payload)

        if (insertError) throw new Error(insertError.message)
        criados++
      }
    } catch (err) {
      erros++
      detalhes_erros.push({
        numero: c.numero_documento || String(c.solutto_id),
        motivo: err instanceof Error ? err.message : String(err),
      })
    }

    if (!signal?.aborted && i < contas.length - 1) {
      await new Promise(r => setTimeout(r, 30))
    }
  }

  return { total_solutto: contas.length, atualizados, criados, erros, detalhes_erros }
}

// =====================================================
// SYNC TODOS OS CLIENTES (chama Edge Function server-side)
// =====================================================

/**
 * Retorna quantos clientes têm vínculo com a Solutto (para exibir antes de sincronizar).
 */
export async function contarClientesComSolutto(): Promise<number> {
  const { count } = await supabase
    .from('clientes')
    .select('id', { count: 'exact', head: true })
    .not('solutto_cliente_id', 'is', null)
  return count || 0
}

/**
 * Dispara a sincronização de TODOS os clientes via Edge Function server-side.
 * Processa em lotes de 50 clientes por chamada para evitar timeout (150s).
 */
export async function iniciarSyncTodosClientes(
  totalClientes: number,
  onProgress: (p: ProgressoSyncTodos) => void,
  signal?: AbortSignal
): Promise<ResultadoSyncTodos> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || SUPABASE_ANON_KEY

  const LOTE = 10
  let processados = 0, criados = 0, atualizados = 0, erros = 0
  const detalhes_erros: Array<{ cliente: string; motivo: string }> = []

  while (true) {
    if (signal?.aborted) throw new DOMException('Cancelado pelo usuário', 'AbortError')

    const resp = await fetch(`${SUPABASE_URL}/functions/v1/solutto-sync-all-contas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
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
      processados: number; criados: number; atualizados: number
      erros: number; detalhes_erros: Array<{ cliente: string; motivo: string }>
      tem_mais: boolean; error?: string
    }

    if (data.error) throw new Error(data.error)

    processados += data.processados
    criados     += data.criados
    atualizados += data.atualizados
    erros       += data.erros
    detalhes_erros.push(...(data.detalhes_erros || []))

    onProgress({
      processados: Math.min(processados, totalClientes),
      total: totalClientes,
      criados,
      atualizados,
      erros,
    })

    if (!data.tem_mais || data.processados === 0) break
  }

  return { total: processados, criados, atualizados, erros, detalhes_erros }
}

