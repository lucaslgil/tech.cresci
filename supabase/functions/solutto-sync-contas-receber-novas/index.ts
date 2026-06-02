// Supabase Edge Function - Solutto Sync Contas a Receber (INCREMENTAL)
//
// Sincroniza as contas a receber de TODOS os clientes com solutto_cliente_id
// para a tabela `contas_receber_solutto`. Inserção INCREMENTAL: registros já
// existentes (mesmo empresa_id + solutto_id) são ignorados — nunca atualizados.
//
// Modos de invocação:
//   - Frontend (manual): JWT do usuário no header Authorization. Filtra empresa_id.
//   - Cron diário (pg_cron): header X-Cron-Secret = CRON_SECRET. Processa TODAS as empresas.
//
// Deploy: supabase functions deploy solutto-sync-contas-receber-novas
// Secrets: SOLUTTO_EMPRESA, SOLUTTO_USUARIO, SOLUTTO_SENHA, CRON_SECRET

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://tech-cresci.vercel.app',
  'https://tech.crescieperdi.com.br',
  'http://localhost:5173',
  'http://localhost:5174',
]
function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
    'Access-Control-Allow-Methods': 'POST, GET, PATCH, OPTIONS, PUT, DELETE',
    'Vary': 'Origin',
  }
}

// ─────────────────────────────────────────────
// XML PARSING
// ─────────────────────────────────────────────

function extrairRegistros(xml: string): Array<Record<string, string>> {
  const registros: Array<Record<string, string>> = []

  const diffgramMatch = xml.match(/<diffgr:diffgram[\s\S]*?>([\s\S]*?)<\/diffgr:diffgram>/i)
  if (!diffgramMatch) return registros
  const diffgramContent = diffgramMatch[1]

  const containerMatch = diffgramContent.match(/<([A-Za-z_][A-Za-z0-9_]*)(?:\s[^>]*)?>/)
  if (!containerMatch) return registros
  const containerTag = containerMatch[1]

  const containerRegex = new RegExp(`<${containerTag}[^>]*>([\\s\\S]*?)<\\/${containerTag}>`, 'i')
  const containerMatch2 = diffgramContent.match(containerRegex)
  if (!containerMatch2) return registros
  const containerContent = containerMatch2[1]

  const recordTagMatch = containerContent.match(/<([A-Za-z_][A-Za-z0-9_]*)(?:\s[^>]*)?>/)
  if (!recordTagMatch) return registros
  const recordTag = recordTagMatch[1]

  const recordRegex = new RegExp(`<${recordTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${recordTag}>`, 'gi')
  let match
  while ((match = recordRegex.exec(containerContent)) !== null) {
    const conteudo = match[1]
    const registro: Record<string, string> = {}
    const campoRegex = /<([A-Za-z_][A-Za-z0-9_]*)(?:\s[^>]*)?>([^<]*)<\/\1>/gi
    let campoMatch
    while ((campoMatch = campoRegex.exec(conteudo)) !== null) {
      registro[campoMatch[1].toLowerCase()] = campoMatch[2].trim()
    }
    if (Object.keys(registro).length > 0) registros.push(registro)
  }
  return registros
}

function normalizarData(raw: string): string | null {
  if (!raw) return null
  const dmy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  if (iso) return iso[1]
  return null
}

function normalizarValor(raw: string): number {
  if (!raw) return 0
  const valor = parseFloat(raw)
  return isNaN(valor) ? 0 : Math.round(valor * 100) / 100
}

function mapearStatus(quitada: string, dataPagamento: string | null, valorSaldo: number): string {
  if (quitada === '1') return 'QUITADA'
  if (dataPagamento && valorSaldo <= 0) return 'QUITADA'
  if (dataPagamento && valorSaldo > 0)  return 'PARCIAL'
  return 'ABERTO'
}

interface ContaNormalizada {
  solutto_id: number
  numero_documento: string
  descricao: string
  data_emissao: string | null
  data_vencimento: string | null
  data_pagamento: string | null
  valor_original: number
  valor_pago: number
  valor_saldo: number
  status_solutto: string
  forma_pagamento: string
  observacoes: string
  dados_extras: Record<string, string>
}

function normalizarConta(r: Record<string, string>): ContaNormalizada | null {
  const idRaw = r['id'] || r['id_conta'] || r['idconta'] || r['codigo'] || ''
  const soluttoId = parseInt(idRaw, 10)
  if (!soluttoId || isNaN(soluttoId)) return null

  const valorOriginal = normalizarValor(r['valor'] || r['valor_original'] || '0')
  const valorPago     = normalizarValor(r['valor_recebido'] || r['valor_pago'] || '0')
  const valorSaldo    = Math.max(0, Math.round((valorOriginal - valorPago) * 100) / 100)

  return {
    solutto_id:       soluttoId,
    numero_documento: r['referencia'] || r['numero_documento'] || '',
    descricao:        r['referencia'] || r['metodo_pagamento_nome'] || r['descricao'] || `Conta Solutto #${soluttoId}`,
    data_emissao:     normalizarData(r['data_saida'] || r['data_emissao'] || r['data'] || ''),
    data_vencimento:  normalizarData(r['data_vencimento'] || r['vencimento'] || ''),
    data_pagamento:   normalizarData(r['data_pagamento'] || r['data_baixa'] || ''),
    valor_original:   valorOriginal,
    valor_pago:       valorPago,
    valor_saldo:      valorSaldo,
    status_solutto:   r['quitada'] || r['status'] || '0',
    forma_pagamento:  r['metodo_pagamento_nome'] || r['forma_pagamento'] || '',
    observacoes:      r['obs'] || r['observacoes'] || '',
    dados_extras:     { ...r },
  }
}

// ─────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
  const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey      = Deno.env.get('SUPABASE_ANON_KEY')!
  const empresa      = Deno.env.get('SOLUTTO_EMPRESA')
  const usuario      = Deno.env.get('SOLUTTO_USUARIO')
  const senha        = Deno.env.get('SOLUTTO_SENHA')
  const cronSecret   = Deno.env.get('CRON_SECRET')

  if (!empresa || !usuario || !senha) {
    return new Response(
      JSON.stringify({ error: 'Credenciais Solutto não configuradas' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }

  const adminClient = createClient(supabaseUrl, serviceKey)

  // ── Autenticação ──────────────────────────────────────────────
  let empresaIdFiltro: number | null = null
  let origem: 'MANUAL' | 'CRON' = 'MANUAL'

  const xCronSecret = req.headers.get('X-Cron-Secret')
  const isCronCall  = cronSecret && xCronSecret === cronSecret

  if (isCronCall) {
    origem = 'CRON'
    empresaIdFiltro = null // processa todas
  } else {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    const { data: usuarioData } = await adminClient
      .from('usuarios')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (!usuarioData?.empresa_id) {
      return new Response(
        JSON.stringify({ error: 'Usuário sem empresa associada' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }
    empresaIdFiltro = usuarioData.empresa_id as number
  }

  // ── Parâmetros de paginação ───────────────────────────────────
  let limite = 10
  try {
    const body = await req.json().catch(() => ({}))
    if (body?.limite && typeof body.limite === 'number' && body.limite > 0 && body.limite <= 50) {
      limite = body.limite
    }
  } catch { /* default */ }

  // ── Cria registro de log ──────────────────────────────────────
  const { data: logRow } = await adminClient
    .from('contas_receber_solutto_sync_log')
    .insert({
      empresa_id: empresaIdFiltro,
      origem,
      iniciado_em: new Date().toISOString(),
    })
    .select('id')
    .single()
  const logId = logRow?.id as number | undefined

  // ── Buscar clientes com vínculo Solutto ─────────────────────
  let clientesQuery = adminClient
    .from('clientes')
    .select('id, empresa_id, solutto_cliente_id, nome_completo, razao_social, cpf, cnpj, solutto_contas_sincronizado_em')
    .not('solutto_cliente_id', 'is', null)
    .order('solutto_contas_sincronizado_em', { ascending: true, nullsFirst: true })
    .limit(limite)

  if (empresaIdFiltro !== null) {
    clientesQuery = clientesQuery.eq('empresa_id', empresaIdFiltro)
  }

  const { data: clientes, error: clientesError } = await clientesQuery

  if (clientesError) {
    if (logId) {
      await adminClient.from('contas_receber_solutto_sync_log').update({
        finalizado_em: new Date().toISOString(),
        sucesso: false,
        detalhes_erros: { erro: clientesError.message },
      }).eq('id', logId)
    }
    return new Response(
      JSON.stringify({ error: `Erro ao buscar clientes: ${clientesError.message}` }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }

  if (!clientes || clientes.length === 0) {
    if (logId) {
      await adminClient.from('contas_receber_solutto_sync_log').update({
        finalizado_em: new Date().toISOString(),
        sucesso: true,
      }).eq('id', logId)
    }
    return new Response(
      JSON.stringify({ processados: 0, inseridas: 0, ignoradas: 0, erros: 0, detalhes_erros: [], tem_mais: false }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }

  // ── Processar cada cliente ────────────────────────────────────
  let totalInseridas  = 0
  let totalIgnoradas  = 0
  let totalErros      = 0
  const detalhes_erros: Array<{ cliente: string; motivo: string }> = []

  for (const cliente of clientes) {
    const nomeCliente = (cliente.nome_completo || cliente.razao_social || `Cliente #${cliente.id}`) as string
    const cpfCnpj     = cliente.cnpj || cliente.cpf || null
    const agora       = new Date().toISOString()

    try {
      // Chama Solutto
      const params = new URLSearchParams({
        empresa, usuario, senha,
        cliente_id: String(cliente.solutto_cliente_id),
      })
      const url = `https://api.solutto.com.br/wscontas_receber.asmx/Retorna_Contas_Receber_Por_Cliente_V1?${params}`

      const resp = await fetch(url, { headers: { Accept: 'text/xml' } })
      if (!resp.ok) {
        totalErros++
        detalhes_erros.push({ cliente: nomeCliente, motivo: `HTTP ${resp.status}` })
        continue
      }

      const xml = await resp.text()

      if (xml.includes('Table_Erro') || xml.includes('table_erro')) {
        totalErros++
        detalhes_erros.push({ cliente: nomeCliente, motivo: 'Solutto retornou Table_Erro' })
        continue
      }

      const registros = extrairRegistros(xml)
      const contas = registros.map(normalizarConta).filter(Boolean) as ContaNormalizada[]

      if (contas.length === 0) {
        await adminClient.from('clientes')
          .update({ solutto_contas_sincronizado_em: agora })
          .eq('id', cliente.id)
        continue
      }

      // Quais solutto_ids JÁ existem na tabela para essa empresa?
      const idsSolutto = contas.map(c => c.solutto_id)
      const { data: existentes } = await adminClient
        .from('contas_receber_solutto')
        .select('solutto_id')
        .eq('empresa_id', cliente.empresa_id)
        .in('solutto_id', idsSolutto)

      const setExistentes = new Set<number>((existentes || []).map(e => Number(e.solutto_id)))

      const novas = contas.filter(c => !setExistentes.has(c.solutto_id))
      const ignoradas = contas.length - novas.length
      totalIgnoradas += ignoradas

      if (novas.length === 0) {
        await adminClient.from('clientes')
          .update({ solutto_contas_sincronizado_em: agora })
          .eq('id', cliente.id)
        continue
      }

      const payloads = novas.map(c => {
        const status = mapearStatus(c.status_solutto, c.data_pagamento, c.valor_saldo)
        return {
          empresa_id:           cliente.empresa_id,
          cliente_id:           cliente.id,
          solutto_cliente_id:   cliente.solutto_cliente_id,
          solutto_id:           c.solutto_id,
          cliente_nome:         nomeCliente,
          cliente_cpf_cnpj:     cpfCnpj,
          numero_documento:     c.numero_documento || null,
          descricao:            c.descricao,
          data_emissao:         c.data_emissao,
          data_vencimento:      c.data_vencimento || agora.split('T')[0],
          data_pagamento:       c.data_pagamento,
          valor_original:       c.valor_original,
          valor_pago:           c.valor_pago,
          valor_saldo:          c.valor_saldo,
          forma_pagamento:      c.forma_pagamento || null,
          observacoes:          c.observacoes || null,
          status,
          sincronizado_em:      agora,
          solutto_dados_extras: c.dados_extras,
        }
      })

      // Insert com ON CONFLICT DO NOTHING (graças à unique constraint da tabela)
      const { data: inseridosRows, error: insertError } = await adminClient
        .from('contas_receber_solutto')
        .upsert(payloads, {
          onConflict: 'empresa_id,solutto_id',
          ignoreDuplicates: true,
        })
        .select('id')

      if (insertError) {
        totalErros++
        detalhes_erros.push({ cliente: nomeCliente, motivo: insertError.message })
      } else {
        totalInseridas += inseridosRows?.length ?? novas.length
      }

      await adminClient.from('clientes')
        .update({ solutto_contas_sincronizado_em: agora })
        .eq('id', cliente.id)

    } catch (err) {
      totalErros++
      detalhes_erros.push({
        cliente: nomeCliente,
        motivo: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // ── Finaliza log ──────────────────────────────────────────────
  if (logId) {
    await adminClient.from('contas_receber_solutto_sync_log').update({
      finalizado_em: new Date().toISOString(),
      clientes_processados: clientes.length,
      contas_inseridas: totalInseridas,
      contas_ignoradas: totalIgnoradas,
      erros: totalErros,
      detalhes_erros: detalhes_erros.length > 0 ? detalhes_erros : null,
      sucesso: totalErros === 0,
    }).eq('id', logId)
  }

  return new Response(
    JSON.stringify({
      processados: clientes.length,
      inseridas:   totalInseridas,
      ignoradas:   totalIgnoradas,
      erros:       totalErros,
      detalhes_erros,
      tem_mais:    clientes.length === limite,
    }),
    { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
  )
})
