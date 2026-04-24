// Supabase Edge Function - Solutto Contas a Receber
// SOMENTE LEITURA da Solutto — nunca escreve no webservice externo.
// Chama Retorna_Contas_Receber_Por_Cliente_V1, parseia o XML e retorna JSON.
//
// Deploy: supabase functions deploy solutto-contas-receber
// Secrets (os mesmos do solutto-sync-clientes):
//   SOLUTTO_EMPRESA, SOLUTTO_USUARIO, SOLUTTO_SENHA

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

/**
 * Extrai todos os registros do DataSet retornado pela Solutto.
 * Usa a mesma lógica genérica do solutto-sync-clientes.
 */
function extrairRegistros(xml: string): Array<Record<string, string>> {
  const registros: Array<Record<string, string>> = []

  const diffgramMatch = xml.match(/<diffgr:diffgram[\s\S]*?>([\s\S]*?)<\/diffgr:diffgram>/i)
  if (!diffgramMatch) return registros

  const diffgramContent = diffgramMatch[1]

  const containerMatch = diffgramContent.match(/<([A-Za-z_][A-Za-z0-9_]*)(?:\s[^>]*)?>/)
  if (!containerMatch) return registros
  const containerTag = containerMatch[1]

  const containerRegex = new RegExp(
    `<${containerTag}[^>]*>([\\s\\S]*?)<\\/${containerTag}>`, 'i'
  )
  const containerMatch2 = diffgramContent.match(containerRegex)
  if (!containerMatch2) return registros

  const containerContent = containerMatch2[1]

  const recordTagMatch = containerContent.match(/<([A-Za-z_][A-Za-z0-9_]*)(?:\s[^>]*)?>/)
  if (!recordTagMatch) return registros
  const recordTag = recordTagMatch[1]

  const recordRegex = new RegExp(
    `<${recordTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${recordTag}>`, 'gi'
  )

  let match
  while ((match = recordRegex.exec(containerContent)) !== null) {
    const conteudo = match[1]
    const registro: Record<string, string> = {}

    const campoRegex = /<([A-Za-z_][A-Za-z0-9_]*)(?:\s[^>]*)?>([^<]*)<\/\1>/gi
    let campoMatch
    while ((campoMatch = campoRegex.exec(conteudo)) !== null) {
      registro[campoMatch[1].toLowerCase()] = campoMatch[2].trim()
    }

    if (Object.keys(registro).length > 0) {
      registros.push(registro)
    }
  }

  return registros
}

/**
 * Converte string de data DD/MM/YYYY ou YYYY-MM-DD para ISO (YYYY-MM-DD).
 */
function normalizarData(raw: string): string {
  if (!raw) return ''
  // Formato DD/MM/YYYY
  const dmy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`
  // Formato YYYY-MM-DDThh:mm:ss
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  if (iso) return iso[1]
  return raw
}

/**
 * Converte string numérica para float.
 * A Solutto retorna números com ponto como separador decimal (ex: "10234.0200").
 */
function normalizarValor(raw: string): number {
  if (!raw) return 0
  // Solutto usa ponto como decimal — parseFloat lida diretamente
  const valor = parseFloat(raw)
  return isNaN(valor) ? 0 : Math.round(valor * 100) / 100
}

/**
 * Normaliza um registro bruto para ContaReceberSolutto.
 */
function normalizarConta(r: Record<string, string>): ContaReceberSolutto | null {
  // O ID interno da Solutto — tenta vários nomes comuns
  const idRaw = r['id'] || r['id_conta'] || r['idconta'] || r['codigo'] || ''
  const soluttoId = parseInt(idRaw, 10)
  if (!soluttoId || isNaN(soluttoId)) return null

  // Guarda todos os campos originais para referência
  const dados_extras = { ...r }

  // Campos reais retornados pelo webservice Retorna_Contas_Receber_Por_Cliente_V1:
  // id, venda, metodo_pagamento, metodo_pagamento_nome, unidade,
  // data_vencimento, data_pagamento, valor, valor_recebido,
  // quitada (0|1), referencia, obs, cliente_id, cliente_codigo
  const valorOriginal = normalizarValor(r['valor'] || '0')
  const valorPago     = normalizarValor(r['valor_recebido'] || '0')
  const valorSaldo    = Math.max(0, Math.round((valorOriginal - valorPago) * 100) / 100)

  return {
    solutto_id:       soluttoId,
    numero_documento: r['referencia'] || '',
    descricao:        r['referencia'] || r['metodo_pagamento_nome'] || `Conta Solutto #${soluttoId}`,
    data_emissao:     normalizarData(r['data_saida'] || ''),
    data_vencimento:  normalizarData(r['data_vencimento'] || ''),
    data_pagamento:   normalizarData(r['data_pagamento'] || ''),
    valor_original:   valorOriginal,
    valor_pago:       valorPago,
    valor_saldo:      valorSaldo,
    status:           r['quitada'] || '0',
    forma_pagamento:  r['metodo_pagamento_nome'] || '',
    observacoes:      r['obs'] || '',
    dados_extras,
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const empresa = Deno.env.get('SOLUTTO_EMPRESA')
    const usuario = Deno.env.get('SOLUTTO_USUARIO')
    const senha   = Deno.env.get('SOLUTTO_SENHA')

    if (!empresa || !usuario || !senha) {
      return new Response(
        JSON.stringify({ error: 'Credenciais Solutto não configuradas (SOLUTTO_EMPRESA, SOLUTTO_USUARIO, SOLUTTO_SENHA)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Lê o cliente_id do body
    let body: { solutto_cliente_id?: number } = {}
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Body inválido — esperado { solutto_cliente_id: number }' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const soluttoClienteId = body.solutto_cliente_id
    if (!soluttoClienteId || isNaN(Number(soluttoClienteId))) {
      return new Response(
        JSON.stringify({ error: 'Parâmetro solutto_cliente_id é obrigatório e deve ser um número inteiro' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const params = new URLSearchParams({
      empresa,
      usuario,
      senha,
      cliente_id: String(soluttoClienteId),
    })

    const url = `https://api.solutto.com.br/wscontas_receber.asmx/Retorna_Contas_Receber_Por_Cliente_V1?${params.toString()}`

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'text/xml' },
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Solutto retornou status ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const xmlText = await response.text()

    // Detecção de erro retornado pelo Solutto no corpo
    if (xmlText.includes('Table_Erro') || xmlText.includes('table_erro')) {
      return new Response(
        JSON.stringify({ error: 'Solutto retornou erro de autenticação ou parâmetros inválidos', contas: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const registros = extrairRegistros(xmlText)
    const contas: ContaReceberSolutto[] = []

    for (const r of registros) {
      const c = normalizarConta(r)
      if (c) contas.push(c)
    }

    return new Response(
      JSON.stringify({ contas, total: contas.length, xml_raw: xmlText.slice(0, 500) }),
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
