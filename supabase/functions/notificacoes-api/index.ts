// ═══════════════════════════════════════════════════════════════════════════
// EDGE FUNCTION: notificacoes-api
// API REST para consumo externo das notificações de cobrança (ex: Girabot).
//
// Autenticação: header  X-API-Key: <NOTIFICACOES_API_KEY>
//
// Rotas:
//   GET  /notificacoes-api
//     → Retorna notificações com status PENDENTE_GIRABOT.
//       Parâmetros opcionais:
//         ?status=PENDENTE_GIRABOT | REGISTRADA | EXPORTADA_GIRABOT | RESPONDIDA | all
//         ?empresa_id=<n>   (filtra por empresa; sem isso retorna todas)
//         ?limit=<n>        (padrão 100, máximo 500)
//       Após a resposta, atualiza status → EXPORTADA_GIRABOT automaticamente
//       (somente quando status=PENDENTE_GIRABOT ou padrão).
//
//   PATCH /notificacoes-api/<id>
//     Body: { "status": "RESPONDIDA" | "EXPORTADA_GIRABOT" }
//     → Atualiza o status de uma notificação específica.
//
// Deploy:
//   supabase functions deploy notificacoes-api --no-verify-jwt
//
// Secrets necessários:
//   NOTIFICACOES_API_KEY   — chave que o sistema externo envia no header
//   SUPABASE_URL           — preenchido automaticamente pelo Supabase
//   SUPABASE_SERVICE_ROLE_KEY — preenchido automaticamente pelo Supabase
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

const STATUS_VALIDOS = ['REGISTRADA', 'PENDENTE_GIRABOT', 'EXPORTADA_GIRABOT', 'RESPONDIDA']

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  // ── Autenticação ──────────────────────────────────────────────────────────
  const apiKey = req.headers.get('x-api-key') ?? ''
  const expectedKey = Deno.env.get('NOTIFICACOES_API_KEY') ?? ''

  if (!expectedKey) {
    return json({ erro: 'API Key não configurada no servidor.' }, 500)
  }
  if (apiKey !== expectedKey) {
    return json({ erro: 'Não autorizado. Informe o header X-API-Key correto.' }, 401)
  }

  // ── Cliente Supabase (service role — ignora RLS) ──────────────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  )

  const url      = new URL(req.url)
  const segments = url.pathname.replace(/^\/notificacoes-api\/?/, '').split('/').filter(Boolean)
  const idParam  = segments[0] ? parseInt(segments[0], 10) : null

  // ══════════════════════════════════════════════════════════════════════════
  // GET /notificacoes-api
  // ══════════════════════════════════════════════════════════════════════════
  if (req.method === 'GET') {
    const statusParam   = url.searchParams.get('status') ?? 'PENDENTE_GIRABOT'
    const empresaParam  = url.searchParams.get('empresa_id')
    const limitParam    = Math.min(parseInt(url.searchParams.get('limit') ?? '100', 10), 500)
    const marcarExportada = statusParam === 'PENDENTE_GIRABOT'

    // Busca na view que já agrega os títulos em JSON
    let query = supabase
      .from('vw_notificacoes_girabot')
      .select('*')
      .order('data_notificacao', { ascending: true })
      .limit(limitParam)

    if (statusParam !== 'all') {
      if (!STATUS_VALIDOS.includes(statusParam)) {
        return json({ erro: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')} ou all` }, 400)
      }
      query = query.eq('status', statusParam)
    }

    if (empresaParam) {
      query = query.eq('empresa_id', parseInt(empresaParam, 10))
    }

    const { data, error } = await query
    if (error) return json({ erro: error.message }, 500)

    const notificacoes = data ?? []

    // Marca como EXPORTADA_GIRABOT após a leitura (somente PENDENTE_GIRABOT)
    if (marcarExportada && notificacoes.length > 0) {
      const ids = notificacoes.map((n: { id: number }) => n.id)
      const agora = new Date().toISOString()
      await supabase
        .from('inadimplencia_notificacoes')
        .update({ status: 'EXPORTADA_GIRABOT', girabot_exportado_em: agora })
        .in('id', ids)
      // Atualiza o campo status na resposta sem refazer a query
      notificacoes.forEach((n: Record<string, unknown>) => {
        n.status = 'EXPORTADA_GIRABOT'
        n.girabot_exportado_em = agora
      })
    }

    return json({
      total: notificacoes.length,
      exportadas_agora: marcarExportada ? notificacoes.length : 0,
      notificacoes,
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PATCH /notificacoes-api/<id>
  // ══════════════════════════════════════════════════════════════════════════
  if (req.method === 'PATCH') {
    if (!idParam || isNaN(idParam)) {
      return json({ erro: 'Informe o ID da notificação na URL: /notificacoes-api/<id>' }, 400)
    }

    let body: { status?: string }
    try {
      body = await req.json()
    } catch {
      return json({ erro: 'Body JSON inválido.' }, 400)
    }

    const novoStatus = body.status
    if (!novoStatus || !STATUS_VALIDOS.includes(novoStatus)) {
      return json({ erro: `status inválido. Use: ${STATUS_VALIDOS.join(', ')}` }, 400)
    }

    const updates: Record<string, unknown> = { status: novoStatus }
    if (novoStatus === 'EXPORTADA_GIRABOT') {
      updates.girabot_exportado_em = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('inadimplencia_notificacoes')
      .update(updates)
      .eq('id', idParam)
      .select('id, status, girabot_exportado_em, cliente_nome, solutto_cliente_id')
      .single()

    if (error) return json({ erro: error.message }, 500)
    if (!data)  return json({ erro: 'Notificação não encontrada.' }, 404)

    return json({ ok: true, notificacao: data })
  }

  return json({ erro: 'Método não suportado. Use GET ou PATCH.' }, 405)
})
