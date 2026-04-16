// Supabase Edge Function - Solutto Radar de Inatividade
// Deploy: supabase functions deploy solutto-radar
// Secrets:
//   supabase secrets set SOLUTTO_EMPRESA="Cresci e Perdi"
//   supabase secrets set SOLUTTO_USUARIO="Lucas Gil"
//   supabase secrets set SOLUTTO_SENHA="Gil14789632*"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const UNIDADE_SUPRIMENTOS = 1352698

interface ItemComprado {
  codigo: string
  descricao: string
  unidade: number
  quantidade: number
  valor_unitario: number
  data_venda: string
  numero_pedido: string
}

/**
 * Extrai texto de um elemento XML pelo nome da tag (case-insensitive)
 */
function extrairTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1].trim() : ''
}

/**
 * Extrai todas as ocorrências de blocos <ITEM_COMPRADO> do XML Solutto.
 * O retorno do webservice é um DataSet/.NET com diffgr:diffgram contendo
 * <ITENS_COMPRADOS><ITEM_COMPRADO diffgr:id="...">...</ITEM_COMPRADO></ITENS_COMPRADOS>
 */
function extrairItensComprados(xml: string): string[] {
  const blocos: string[] = []
  const regex = /<ITEM_COMPRADO[\s\S]*?>([\s\S]*?)<\/ITEM_COMPRADO>/gi
  let match
  while ((match = regex.exec(xml)) !== null) {
    blocos.push(match[1])
  }
  return blocos
}

/**
 * Parse do XML DataSet retornado pelo Solutto.
 * Estrutura real:
 *   <DataSet><diffgr:diffgram>
 *     <ITENS_COMPRADOS>
 *       <ITEM_COMPRADO diffgr:id="ITEM_COMPRADO1" ...>
 *         <venda_codigo>...</venda_codigo>
 *         <unidade>1352698</unidade>
 *         <produto_codigo>...</produto_codigo>
 *         <produto_nome>...</produto_nome>
 *         <quantidade_comprada>...</quantidade_comprada>
 *         <valor_unitario>...</valor_unitario>
 *         <venda_data_saida>2023-08-22T14:16:53-03:00</venda_data_saida>
 *       </ITEM_COMPRADO>
 *     </ITENS_COMPRADOS>
 *   </diffgr:diffgram></DataSet>
 */
function parsearXmlSolutto(xml: string): ItemComprado[] {
  // Quando o cliente não tem compras, Solutto retorna um DataSet com Table_Erro
  // Isso NÃO é um erro — significa apenas que não há registros. Retorna array vazio.
  if (xml.includes('Table_Erro') || xml.includes('table_erro')) {
    return []
  }

  const itens: ItemComprado[] = []
  const blocos = extrairItensComprados(xml)

  for (const bloco of blocos) {
    // Filtrar apenas itens da unidade de suprimentos 1352698
    const unidadeStr = extrairTag(bloco, 'unidade')
    const unidade = parseInt(unidadeStr, 10)
    if (unidade !== UNIDADE_SUPRIMENTOS) continue

    const codigo    = extrairTag(bloco, 'produto_codigo')
    const descricao = extrairTag(bloco, 'produto_nome')
    const qtd       = parseFloat(extrairTag(bloco, 'quantidade_comprada') || '0')
    const valorUnit = parseFloat(extrairTag(bloco, 'valor_unitario') || '0')

    // venda_data_saida vem como ISO 8601 com timezone: 2023-08-22T14:16:53-03:00
    const dataVenda    = extrairTag(bloco, 'venda_data_saida') || extrairTag(bloco, 'venda_data_encomenda') || ''
    const numeroPedido = extrairTag(bloco, 'venda_codigo')

    if (codigo || descricao) {
      itens.push({
        codigo,
        descricao,
        unidade,
        quantidade: qtd,
        valor_unitario: valorUnit,
        data_venda: dataVenda,
        numero_pedido: numeroPedido,
      })
    }
  }

  return itens
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const empresa = Deno.env.get('SOLUTTO_EMPRESA')
    const usuario = Deno.env.get('SOLUTTO_USUARIO')
    const senha = Deno.env.get('SOLUTTO_SENHA')

    if (!empresa || !usuario || !senha) {
      return new Response(
        JSON.stringify({ error: 'Credenciais Solutto não configuradas nos secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { cliente_id } = body

    if (!cliente_id && cliente_id !== 0) {
      return new Response(
        JSON.stringify({ error: 'cliente_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Chama o webservice via HTTP GET
    const params = new URLSearchParams({
      empresa,
      usuario,
      senha,
      cliente_id: String(cliente_id),
    })

    const url = `https://api.solutto.com.br/wsvendas.asmx/Retorna_Itens_Comprados_Pelo_Cliente_V1?${params.toString()}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/xml',
      },
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Webservice retornou status ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const xmlText = await response.text()

    let itens: ItemComprado[] = []
    try {
      itens = parsearXmlSolutto(xmlText)
    } catch (parseError) {
      // Erro inesperado no parse — loga mas retorna vazio para não travar o loop
      console.error('Erro ao parsear XML cliente', cliente_id, parseError)
      console.error('XML preview:', xmlText.substring(0, 300))
      itens = []
    }

    return new Response(
      JSON.stringify({ itens, cliente_id }),
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
