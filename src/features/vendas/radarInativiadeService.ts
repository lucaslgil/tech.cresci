/**
 * SERVIÇO - RADAR DE INATIVIDADE
 * Consulta itens comprados por cada cliente no webservice Solutto
 * via Supabase Edge Function (proxy seguro para credenciais)
 */

import { listarClientes } from '../clientes/services'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

/**
 * Busca TODOS os clientes contornando o max_rows=1000 do PostgREST.
 * Faz requisições paginadas de 1000 em 1000 até esgotar.
 */
async function listarTodosClientes(): Promise<any[]> {
  const BATCH = 1000
  const todos: any[] = []
  let offset = 0

  while (true) {
    const resultado = await listarClientes({ limite: BATCH, offset })
    const pagina = resultado.data
    if (!pagina || pagina.length === 0) break
    todos.push(...pagina)
    if (pagina.length < BATCH) break
    offset += BATCH
  }

  return todos
}

// =====================================================
// TIPOS
// =====================================================

export interface ItemCompradoSolutto {
  codigo: string
  descricao: string
  unidade: string
  quantidade: number
  valor_unitario: number
  data_venda: string
  numero_pedido: string
}

export interface ClienteRadar {
  id: number
  nome: string
  nome_fantasia: string | null
  codigo: string
  produtos_comprados: ProdutoRadar[]
  produtos_nao_comprados: ProdutoRadar[]
  ultima_compra: string | null
  dias_sem_compra: number | null
}

export interface ProdutoRadar {
  codigo: string
  descricao: string
  ultima_compra?: string
  total_compras?: number
  valor_total?: number
}

export interface ResultadoRadar {
  clientes: ClienteRadar[]
  universo_produtos: ProdutoRadar[]
  total_clientes: number
  clientes_inativos_30d: number
  clientes_inativos_60d: number
  clientes_inativos_90d: number
  data_consulta: string
}

export interface ProgressoRadar {
  total: number
  processados: number
  atual_nome: string
  erros: number
}

export interface ClienteDisponivelRadar {
  id: number
  solutto_cliente_id: number | null
  nome: string
  tipo_pessoa: 'JURIDICA' | 'FISICA'
  status: string
}

export interface FiltrosRadar {
  /** IDs internos dos clientes selecionados. Se vazio/undefined, usa todos. */
  clientes_selecionados?: number[]
  /** Data início ISO yyyy-mm-dd. Itens com data_venda anterior são descartados. */
  data_inicio?: string
  /** Data fim ISO yyyy-mm-dd. Itens com data_venda posterior são descartados. */
  data_fim?: string
  /** Termos de busca de produto (OR). Filtra por código ou nome. Vazio = todos. */
  filtro_produtos?: string[]
  /** Quando true, considera apenas os itens da compra mais recente de cada cliente. */
  apenas_ultima_compra?: boolean
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function calcularDiasSemCompra(dataUltimaCompra: string | null): number | null {
  if (!dataUltimaCompra) return null

  // Aceita ISO 8601 com timezone (ex: 2023-08-22T14:16:53-03:00), yyyy-mm-dd ou dd/mm/yyyy
  let data: Date | null = null

  // ISO 8601 / datetime — deixa o Date fazer o parse direto
  const isoMatch = dataUltimaCompra.match(/^\d{4}-\d{2}-\d{2}/)
  if (isoMatch) {
    data = new Date(dataUltimaCompra)
  }

  // dd/mm/yyyy
  if (!data) {
    const dmY = dataUltimaCompra.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
    if (dmY) {
      data = new Date(parseInt(dmY[3]), parseInt(dmY[2]) - 1, parseInt(dmY[1]))
    }
  }

  if (!data || isNaN(data.getTime())) return null

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dataZerada = new Date(data.getFullYear(), data.getMonth(), data.getDate())

  const diff = hoje.getTime() - dataZerada.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function encontrarUltimaCompra(itens: ItemCompradoSolutto[]): string | null {
  if (itens.length === 0) return null

  // Ordena as datas convertendo para timestamp para comparação correta com timezones
  const datasValidas = itens
    .map(i => i.data_venda)
    .filter(d => !!d)
    .map(d => ({ original: d, ts: new Date(d).getTime() }))
    .filter(d => !isNaN(d.ts))
    .sort((a, b) => b.ts - a.ts)

  return datasValidas.length > 0 ? datasValidas[0].original : null
}

// =====================================================
// CONSULTA PRINCIPAL
// =====================================================

/**
 * Consulta o webservice Solutto para um único cliente
 */
async function consultarClienteSolutto(clienteId: number): Promise<ItemCompradoSolutto[]> {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/solutto-radar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ cliente_id: clienteId }),
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    console.error('[Radar] HTTP', resp.status, 'for', clienteId, text.substring(0, 100))
    throw new Error(`HTTP ${resp.status}`)
  }

  const data = await resp.json()

  if (data?.error) {
    console.error('[Radar] data.error for', clienteId, data.error)
    throw new Error(data.error)
  }

  return (data?.itens as ItemCompradoSolutto[]) || []
}

/**
 * Diagnóstico: testa um ID Solutto específico e retorna o resultado raw
 */
export async function diagnosticarSoluttoId(soluttoId: number) {
  console.log('[Radar][DIAG] Testando Solutto ID:', soluttoId)
  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/solutto-radar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ cliente_id: soluttoId }),
    })
    const data = await resp.json()
    console.log('[Radar][DIAG] status:', resp.status, 'itens:', data?.itens?.length ?? 'N/A')
    return { data, error: null }
  } catch (e) {
    console.error('[Radar][DIAG] fetch error:', e)
    return { data: null, error: String(e) }
  }
}

/**
 * Retorna todos os clientes ativos com solutto_cliente_id para exibição no seletor de filtro.
 */
export async function buscarClientesDisponiveis(): Promise<ClienteDisponivelRadar[]> {
  const clientes = await listarTodosClientes()
  return clientes
    .map((c: any) => ({
      id: c.id as number,
      solutto_cliente_id: (c.solutto_cliente_id as number | null) ?? null,
      nome: (c.razao_social || c.nome_fantasia || c.nome_completo || `Cliente #${c.id}`) as string,
      tipo_pessoa: ((c.tipo_pessoa as string) === 'FISICA' ? 'FISICA' : 'JURIDICA') as 'JURIDICA' | 'FISICA',
      status: (c.status as string) || 'ATIVO',
    }))
    .sort((a: ClienteDisponivelRadar, b: ClienteDisponivelRadar) => a.nome.localeCompare(b.nome))
}

/**
 * Executa o Radar de Inatividade para os clientes e filtros especificados.
 * Chama onProgress a cada cliente processado.
 */
export async function executarRadarInatividade(
  onProgress: (progresso: ProgressoRadar) => void,
  signal?: AbortSignal,
  filtros?: FiltrosRadar
): Promise<ResultadoRadar> {
  // 1. Busca todos os clientes (todos os tipos e status) — em batches de 1000 para contornar max_rows
  let clientes = await listarTodosClientes()

  // Aplicar filtro de clientes selecionados
  if (filtros?.clientes_selecionados && filtros.clientes_selecionados.length > 0) {
    const idSet = new Set(filtros.clientes_selecionados)
    clientes = clientes.filter((c: any) => idSet.has(c.id))
  }

  // Normaliza datas de filtro para timestamps (início = 00:00:00, fim = 23:59:59 BRT)
  const tsInicio = filtros?.data_inicio ? new Date(filtros.data_inicio + 'T00:00:00-03:00').getTime() : null
  const tsFim    = filtros?.data_fim    ? new Date(filtros.data_fim    + 'T23:59:59-03:00').getTime() : null

  // Normaliza termos de produto para lowercase
  const termosProduto = (filtros?.filtro_produtos ?? [])
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 0)

  const total = clientes.length
  let processados = 0
  let erros = 0

  // Universo de todos os produtos encontrados (por código)
  const universoProdutos = new Map<string, ProdutoRadar>()

  // Itens por cliente
  const itensPorCliente = new Map<number, ItemCompradoSolutto[]>()

  // 2. Processa cada cliente com delay para não sobrecarregar o webservice
  for (const cliente of clientes) {
    if (signal?.aborted) break

    const nome = cliente.razao_social || cliente.nome_fantasia || cliente.nome_completo || `Cliente #${cliente.id}`

    onProgress({ total, processados, atual_nome: nome, erros })

    try {
      const solutto_id = (cliente as any).solutto_cliente_id
      let itens: ItemCompradoSolutto[] = []
      if (solutto_id) {
        itens = await consultarClienteSolutto(solutto_id)
      }

      // Filtro de data
      if (tsInicio !== null || tsFim !== null) {
        itens = itens.filter(item => {
          if (!item.data_venda) return false
          const ts = new Date(item.data_venda).getTime()
          if (isNaN(ts)) return true // manter se data inválida
          if (tsInicio !== null && ts < tsInicio) return false
          if (tsFim !== null && ts > tsFim) return false
          return true
        })
      }

      // Filtro de produto
      if (termosProduto.length > 0) {
        itens = itens.filter(item => {
          const cod  = (item.codigo   || '').toLowerCase()
          const nome = (item.descricao || '').toLowerCase()
          return termosProduto.some(t => cod.includes(t) || nome.includes(t))
        })
      }

      // Apenas última compra: mantém somente os itens da data de compra mais recente (só relevante se tem itens)
      if (filtros?.apenas_ultima_compra && itens.length > 0) {
        const datasValidas = itens
          .map(i => i.data_venda)
          .filter(d => !!d)
          .map(d => new Date(d).getTime())
          .filter(ts => !isNaN(ts))

        if (datasValidas.length > 0) {
          const tsMaximo = Math.max(...datasValidas)
          const dataMaximaStr = new Date(tsMaximo).toISOString().slice(0, 10) // yyyy-mm-dd
          itens = itens.filter(item => {
            if (!item.data_venda) return false
            const ts = new Date(item.data_venda).getTime()
            if (isNaN(ts)) return false
            return new Date(ts).toISOString().slice(0, 10) === dataMaximaStr
          })
        }
      }

      itensPorCliente.set(cliente.id, itens)

      // Acumula o universo de produtos
      for (const item of itens) {
        const chave = item.codigo || item.descricao
        if (!chave) continue

        if (!universoProdutos.has(chave)) {
          universoProdutos.set(chave, {
            codigo: item.codigo,
            descricao: item.descricao,
          })
        }
      }
    } catch (catchErr) {
      // Erro real ao chamar o webservice (rede, timeout, auth) — continua e contabiliza
      console.warn('Erro ao consultar cliente Solutto ID', (cliente as any).solutto_cliente_id, catchErr)
      itensPorCliente.set(cliente.id, [])
      erros++
    }

    processados++

    // Pequeno delay para não bater rate limit
    if (!signal?.aborted) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  // 3. Monta resultado por cliente
  const universoProdutosArray = Array.from(universoProdutos.values())

  const clientesRadar: ClienteRadar[] = []

  for (const cliente of clientes) {
    const itens = itensPorCliente.get(cliente.id) || []
    const nome = cliente.razao_social || cliente.nome_fantasia || cliente.nome_completo || `Cliente #${cliente.id}`

    // Agrupa por produto
    const produtosCompradosMap = new Map<string, ProdutoRadar>()
    for (const item of itens) {
      const chave = item.codigo || item.descricao
      if (!chave) continue

      if (produtosCompradosMap.has(chave)) {
        const p = produtosCompradosMap.get(chave)!
        p.total_compras = (p.total_compras || 0) + 1
        p.valor_total = (p.valor_total || 0) + (item.quantidade * item.valor_unitario)
        // Mantém a data mais recente
        if (item.data_venda && (!p.ultima_compra || item.data_venda > p.ultima_compra)) {
          p.ultima_compra = item.data_venda
        }
      } else {
        produtosCompradosMap.set(chave, {
          codigo: item.codigo,
          descricao: item.descricao,
          ultima_compra: item.data_venda,
          total_compras: 1,
          valor_total: item.quantidade * item.valor_unitario,
        })
      }
    }

    const produtosComprados = Array.from(produtosCompradosMap.values())

    // Produtos não comprados = universo - comprados
    const codigosComprados = new Set(produtosComprados.map(p => p.codigo || p.descricao))
    const produtosNaoComprados = universoProdutosArray.filter(
      p => !codigosComprados.has(p.codigo || p.descricao)
    )

    const ultimaCompraData = encontrarUltimaCompra(itens)
    const diasSemCompra = calcularDiasSemCompra(ultimaCompraData)

    clientesRadar.push({
      id: cliente.id,
      nome,
      nome_fantasia: (cliente as any).nome_fantasia || null,
      codigo: cliente.codigo || String(cliente.id),
      produtos_comprados: produtosComprados,
      produtos_nao_comprados: produtosNaoComprados,
      ultima_compra: ultimaCompraData,
      dias_sem_compra: diasSemCompra,
    })
  }

  // 4. Estatísticas de inatividade
  const inativos30 = clientesRadar.filter(c => c.dias_sem_compra !== null && c.dias_sem_compra >= 30).length
  const inativos60 = clientesRadar.filter(c => c.dias_sem_compra !== null && c.dias_sem_compra >= 60).length
  const inativos90 = clientesRadar.filter(c => c.dias_sem_compra !== null && c.dias_sem_compra >= 90).length

  return {
    clientes: clientesRadar,
    universo_produtos: universoProdutosArray,
    total_clientes: clientesRadar.length,
    clientes_inativos_30d: inativos30,
    clientes_inativos_60d: inativos60,
    clientes_inativos_90d: inativos90,
    data_consulta: new Date().toISOString(),
  }
}
