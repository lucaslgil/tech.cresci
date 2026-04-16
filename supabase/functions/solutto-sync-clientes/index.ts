// Supabase Edge Function - Solutto Sync Clientes
// SOMENTE LEITURA da Solutto — nunca escreve no webservice externo.
// Chama Retorna_Cliente_V3, parseia o XML e retorna JSON para o frontend.
//
// Deploy: supabase functions deploy solutto-sync-clientes
// Secrets (os mesmos do solutto-radar):
//   SOLUTTO_EMPRESA, SOLUTTO_USUARIO, SOLUTTO_SENHA

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export interface ClienteSolutto {
  solutto_id: number
  codigo: string
  nome: string
  nome_fantasia: string
  email: string
  cpf: string
  cnpj: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  inscricao_estadual: string
  inscricao_municipal: string
  data_nascimento: string
  sexo: string
  obs: string
  status: 'ATIVO' | 'INATIVO'
}

/**
 * Extrai o texto de uma tag XML pelo nome (case-insensitive).
 */
function extrairTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1].trim() : ''
}

/**
 * Extrai todos os registros do DataSet Solutto.
 * Cada linha do DataSet tem atributo diffgr:id (ex: diffgr:id="Table1").
 * Usamos isso como marcador de linha, independente do nome da tag.
 */
function extrairRegistros(xml: string): Array<Record<string, string>> {
  const registros: Array<Record<string, string>> = []

  // Localiza o bloco diffgram
  const diffgramMatch = xml.match(/<diffgr:diffgram[\s\S]*?>([\s\S]*?)<\/diffgr:diffgram>/i)
  if (!diffgramMatch) return registros

  const diffgramContent = diffgramMatch[1]

  // Encontra o nome da tag de container (primeiro elemento filho do diffgram)
  const containerMatch = diffgramContent.match(/<([A-Za-z_][A-Za-z0-9_]*)(?:\s[^>]*)?>/)
  if (!containerMatch) return registros

  const containerTag = containerMatch[1]

  // Extrai o conteúdo do container
  const containerRegex = new RegExp(
    `<${containerTag}[^>]*>([\\s\\S]*?)<\\/${containerTag}>`, 'i'
  )
  const containerMatch2 = diffgramContent.match(containerRegex)
  if (!containerMatch2) return registros

  const containerContent = containerMatch2[1]

  // Encontra o nome da tag de registro (primeiro elemento filho do container)
  const recordTagMatch = containerContent.match(/<([A-Za-z_][A-Za-z0-9_]*)(?:\s[^>]*)?>/)
  if (!recordTagMatch) return registros

  const recordTag = recordTagMatch[1]

  // Extrai todos os registros
  const recordRegex = new RegExp(
    `<${recordTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${recordTag}>`, 'gi'
  )

  let match
  while ((match = recordRegex.exec(containerContent)) !== null) {
    const conteudo = match[1]
    const registro: Record<string, string> = {}

    // Extrai todos os campos do registro
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
 * Converte um registro bruto do DataSet em ClienteSolutto normalizado.
 */
function normalizarCliente(r: Record<string, string>): ClienteSolutto | null {
  // O campo "id" interno do Solutto é obrigatório
  const soluttoId = parseInt(r['id'] || r['cliente_id'] || '0', 10)
  if (!soluttoId || isNaN(soluttoId)) return null

  // Monta telefone concatenando DDD + número
  const ddd = (r['ddd_telefone1'] || r['ddd'] || '').trim()
  const tel = (r['telefone1'] || r['telefone'] || '').trim()
  const telefone = ddd && tel ? `${ddd}${tel}` : tel || ddd

  // Remove máscaras de documentos
  const cnpj = (r['cnpj'] || '').replace(/\D/g, '')
  const cpf  = (r['cpf']  || '').replace(/\D/g, '')
  const cep  = (r['cep']  || '').replace(/\D/g, '')

  // Status: 367 = ATIVO, 368 = INATIVO
  const statusCodigo = parseInt(r['status'] || '0', 10)
  const status: 'ATIVO' | 'INATIVO' = statusCodigo === 368 ? 'INATIVO' : 'ATIVO'

  return {
    solutto_id:          soluttoId,
    codigo:              r['codigo']              || '',
    nome:                r['nome']                || '',
    nome_fantasia:       r['nome_fantasia']       || r['apelido'] || '',
    email:               r['email']               || '',
    cpf,
    cnpj,
    telefone,
    endereco:            r['endereco1']           || r['endereco'] || '',
    cidade:              r['cidade']              || '',
    estado:              r['estado']              || '',
    cep,
    inscricao_estadual:  r['inscricao_estadual']  || r['ie'] || '',
    inscricao_municipal: r['inscricao_municipal'] || r['im'] || '',
    data_nascimento:     r['data_nascimento']     || '',
    sexo:                r['sexo']                || '',
    obs:                 r['obs']                 || r['observacoes'] || '',
    status,
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

    // Chama Retorna_Cliente_V3 com parâmetros vazios (retorna TODOS os clientes)
    // campo, valor e id_categoria vazios = sem filtro
    const params = new URLSearchParams({
      empresa,
      usuario,
      senha,
      campo:        '',
      valor:        '',
      id_categoria: '',
    })

    const url = `https://api.solutto.com.br/wsclientes.asmx/Retorna_Cliente_V3?${params.toString()}`

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
        JSON.stringify({ error: 'Solutto retornou erro de autenticação ou de parâmetros', clientes: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const registros = extrairRegistros(xmlText)
    const clientes: ClienteSolutto[] = []

    for (const r of registros) {
      const c = normalizarCliente(r)
      if (c) clientes.push(c)
    }

    console.log(`[solutto-sync-clientes] Retornados ${clientes.length} clientes da Solutto`)

    return new Response(
      JSON.stringify({ clientes, total: clientes.length }),
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
