// Supabase Edge Function - Solutto Sync All Contas a Receber
// Sincroniza contas a receber de TODOS os clientes com solutto_cliente_id.
// Execução: manual (frontend) ou automática (pg_cron via X-Cron-Secret).
//
// Deploy: supabase functions deploy solutto-sync-all-contas
// Secrets necessários: SOLUTTO_EMPRESA, SOLUTTO_USUARIO, SOLUTTO_SENHA, CRON_SECRET (opcional)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

// ─────────────────────────────────────────────
// XML PARSING (mesmo algoritmo dos demais funções)
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

function normalizarData(raw: string): string {
  if (!raw) return ''
  const dmy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  if (iso) return iso[1]
  return raw
}

function normalizarValor(raw: string): number {
  if (!raw) return 0
  // Solutto usa ponto como decimal (ex: "10234.0200") — parseFloat direto
  const valor = parseFloat(raw)
  return isNaN(valor) ? 0 : Math.round(valor * 100) / 100
}

interface ContaNormalizada {
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

function normalizarConta(r: Record<string, string>): ContaNormalizada | null {
  const idRaw = r['id'] || r['id_conta'] || r['idconta'] || r['codigo'] || ''
  const soluttoId = parseInt(idRaw, 10)
  if (!soluttoId || isNaN(soluttoId)) return null

  return {
    solutto_id:       soluttoId,
    numero_documento: r['numero_documento'] || r['numero'] || r['num_doc'] || r['documento'] || '',
    descricao:        r['descricao'] || r['historico'] || r['obs'] || '',
    data_emissao:     normalizarData(r['data_emissao'] || r['data_lancamento'] || r['data'] || ''),
    data_vencimento:  normalizarData(r['data_vencimento'] || r['vencimento'] || ''),
    data_pagamento:   normalizarData(r['data_pagamento'] || r['data_baixa'] || ''),
    valor_original:   normalizarValor(r['valor'] || r['valor_original'] || r['valor_titulo'] || '0'),
    valor_pago:       normalizarValor(r['valor_pago'] || r['valor_recebido'] || r['valor_baixa'] || '0'),
    valor_saldo:      normalizarValor(r['saldo'] || r['valor_saldo'] || r['saldo_a_receber'] || '0'),
    status:           r['status'] || r['situacao'] || '',
    forma_pagamento:  r['forma_pagamento'] || r['forma_recebimento'] || '',
    observacoes:      r['observacoes'] || r['obs'] || '',
    dados_extras:     { ...r },
  }
}

function mapearStatus(quitada: string, dataPagamento: string, valorSaldo: number): string {
  // quitada=1 → pago; quitada=0 → verificar data/saldo
  if (quitada === '1') return 'QUITADA'
  if (dataPagamento && valorSaldo <= 0) return 'QUITADA'
  if (dataPagamento && valorSaldo > 0)  return 'PARCIAL'
  return 'ABERTO'
}

// ─────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl      = Deno.env.get('SUPABASE_URL')!
    const serviceKey       = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey          = Deno.env.get('SUPABASE_ANON_KEY')!
    const empresa          = Deno.env.get('SOLUTTO_EMPRESA')
    const usuario          = Deno.env.get('SOLUTTO_USUARIO')
    const senha            = Deno.env.get('SOLUTTO_SENHA')
    const cronSecret       = Deno.env.get('CRON_SECRET')

    if (!empresa || !usuario || !senha) {
      return new Response(
        JSON.stringify({ error: 'Credenciais Solutto não configuradas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Cliente admin (service role) — bypassa RLS, deve filtrar empresa_id manualmente
    const adminClient = createClient(supabaseUrl, serviceKey)

    // ── Autenticação ──────────────────────────────────────────────
    let empresaId: number | null = null

    const xCronSecret = req.headers.get('X-Cron-Secret')
    const isCronCall  = cronSecret && xCronSecret === cronSecret

    if (isCronCall) {
      // Cron: sincroniza todas as empresas (empresaId null = sem filtro de empresa)
      empresaId = null
    } else {
      // Frontend: requer JWT do usuário autenticado
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Não autorizado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      })
      const { data: { user }, error: userError } = await userClient.auth.getUser()
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Usuário não autenticado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      empresaId = usuarioData.empresa_id as number
    }

    // ── Parâmetros de paginação ───────────────────────────────────
    let limite = 10
    try {
      const body = await req.json().catch(() => ({}))
      if (body?.limite && typeof body.limite === 'number' && body.limite > 0 && body.limite <= 50) {
        limite = body.limite
      }
    } catch { /* usa padrão */ }

    // ── Buscar clientes com vínculo Solutto (somente o lote atual) ─
    let clientesQuery = adminClient
      .from('clientes')
      .select('id, solutto_cliente_id, nome_completo, razao_social, solutto_contas_sincronizado_em')
      .not('solutto_cliente_id', 'is', null)
      .order('solutto_contas_sincronizado_em', { ascending: true, nullsFirst: true })
      .limit(limite)

    if (empresaId !== null) {
      clientesQuery = clientesQuery.eq('empresa_id', empresaId)
    }

    const { data: clientes, error: clientesError } = await clientesQuery

    if (clientesError) {
      return new Response(
        JSON.stringify({ error: `Erro ao buscar clientes: ${clientesError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!clientes || clientes.length === 0) {
      return new Response(
        JSON.stringify({ processados: 0, criados: 0, atualizados: 0, erros: 0, detalhes_erros: [], tem_mais: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Processar cada cliente ────────────────────────────────────
    let criados = 0
    let atualizados = 0
    let erros = 0
    const detalhes_erros: Array<{ cliente: string; motivo: string }> = []

    for (const cliente of clientes) {
      const nomeCliente = (cliente.nome_completo || cliente.razao_social || `Cliente #${cliente.id}`) as string
      const agora = new Date().toISOString()

      try {
        // Chamar Solutto
        const params = new URLSearchParams({
          empresa,
          usuario,
          senha,
          cliente_id: String(cliente.solutto_cliente_id),
        })
        const url = `https://api.solutto.com.br/wscontas_receber.asmx/Retorna_Contas_Receber_Por_Cliente_V1?${params}`

        const resp = await fetch(url, { headers: { Accept: 'text/xml' } })
        if (!resp.ok) {
          erros++
          detalhes_erros.push({ cliente: nomeCliente, motivo: `HTTP ${resp.status}` })
          continue
        }

        const xml = await resp.text()

        if (xml.includes('Table_Erro') || xml.includes('table_erro')) {
          erros++
          detalhes_erros.push({ cliente: nomeCliente, motivo: 'Solutto retornou Table_Erro' })
          continue
        }

        const registros = extrairRegistros(xml)
        const contas = registros.map(normalizarConta).filter(Boolean) as ContaNormalizada[]

        if (contas.length === 0) {
          await adminClient
            .from('clientes')
            .update({ solutto_contas_sincronizado_em: agora })
            .eq('id', cliente.id)
          continue
        }

        // Construir payload para bulk insert
        const payloads = contas.map((c) => {
          const status = mapearStatus(c.status, c.data_pagamento, c.valor_saldo)
          const row: Record<string, unknown> = {
            cliente_id:              cliente.id,
            cliente_nome:            nomeCliente,
            descricao:               c.descricao || `Conta Solutto #${c.solutto_id}`,
            numero_documento:        c.numero_documento || null,
            numero_parcela:          1,
            total_parcelas:          1,
            valor_original:          c.valor_original,
            valor_juros:             0,
            valor_desconto:          0,
            valor_total:             c.valor_original,
            valor_pago:              c.valor_pago,
            valor_saldo:             c.valor_saldo,
            data_emissao:            c.data_emissao || agora.split('T')[0],
            data_vencimento:         c.data_vencimento || agora.split('T')[0],
            data_pagamento:          c.data_pagamento || null,
            status,
            forma_pagamento:         c.forma_pagamento || null,
            observacoes:             c.observacoes || null,
            origem:                  'SOLUTTO',
            solutto_id:              c.solutto_id,
            solutto_sincronizado_em: agora,
            solutto_dados_extras:    c.dados_extras,
          }
          if (empresaId !== null) row.empresa_id = empresaId
          return row
        })

        // Contar existentes antes (para calcular criados vs atualizados)
        const { count: countAntes } = await adminClient
          .from('contas_receber')
          .select('id', { count: 'exact', head: true })
          .eq('cliente_id', cliente.id)
          .eq('origem', 'SOLUTTO')

        // Apagar registros antigos da Solutto para este cliente e reinserir
        await adminClient
          .from('contas_receber')
          .delete()
          .eq('cliente_id', cliente.id)
          .eq('origem', 'SOLUTTO')

        const { error: insertError } = await adminClient
          .from('contas_receber')
          .insert(payloads)

        if (insertError) {
          erros++
          detalhes_erros.push({ cliente: nomeCliente, motivo: insertError.message })
        } else {
          const antes = countAntes || 0
          criados     += contas.length - Math.min(antes, contas.length)
          atualizados += Math.min(antes, contas.length)
        }

        // Atualizar timestamp no cliente
        await adminClient
          .from('clientes')
          .update({ solutto_contas_sincronizado_em: agora })
          .eq('id', cliente.id)

      } catch (err) {
        erros++
        detalhes_erros.push({
          cliente: nomeCliente,
          motivo: err instanceof Error ? err.message : String(err),
        })
      }

      // Sem pausa — bulk upsert é rápido o suficiente
    }

    return new Response(
      JSON.stringify({
        processados: clientes.length,
        criados,
        atualizados,
        erros,
        detalhes_erros,
        tem_mais: clientes.length === limite,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
