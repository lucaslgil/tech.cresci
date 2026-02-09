// Supabase Edge Function - Nuvem Fiscal API
// Deploy: supabase functions deploy nuvem-fiscal
// Secrets: supabase secrets set NUVEM_FISCAL_CLIENT_ID=xxx NUVEM_FISCAL_CLIENT_SECRET=xxx

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TokenCache {
  access_token: string
  expires_at: number
}

let tokenCache: TokenCache | null = null

/**
 * Obtém token OAuth2 da Nuvem Fiscal (com cache)
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now()
  
  // Retornar token em cache se ainda válido (renovar 5min antes)
  if (tokenCache && tokenCache.expires_at > now + 300000) {
    console.log('Using cached token')
    return tokenCache.access_token
  }

  const CLIENT_ID = Deno.env.get('NUVEM_FISCAL_CLIENT_ID')
  const CLIENT_SECRET = Deno.env.get('NUVEM_FISCAL_CLIENT_SECRET')

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Credenciais Nuvem Fiscal não configuradas')
  }

  console.log('Requesting new token from Nuvem Fiscal')

  const response = await fetch('https://auth.nuvemfiscal.com.br/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get token: ${response.status} - ${error}`)
  }

  const data = await response.json()
  
  // Cachear token (expires_in em segundos)
  tokenCache = {
    access_token: data.access_token,
    expires_at: now + (data.expires_in * 1000),
  }

  return data.access_token
}

/**
 * Emitir NF-e via Nuvem Fiscal
 */
async function emitirNFe(nfeData: any, ambiente: 'homologacao' | 'producao'): Promise<any> {
  const token = await getAccessToken()

  const response = await fetch('https://api.nuvemfiscal.com.br/nfe', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...nfeData,
      ambiente: ambiente === 'producao' ? 1 : 2,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Erro na emissão: ${JSON.stringify(error)}`)
  }

  return await response.json()
}

/**
 * Consultar NF-e
 */
async function consultarNFe(id: string): Promise<any> {
  const token = await getAccessToken()

  const response = await fetch(`https://api.nuvemfiscal.com.br/nfe/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Erro na consulta: ${JSON.stringify(error)}`)
  }

  return await response.json()
}

/**
 * Cancelar NF-e
 */
async function cancelarNFe(id: string, justificativa: string): Promise<any> {
  const token = await getAccessToken()

  const response = await fetch(`https://api.nuvemfiscal.com.br/nfe/${id}/cancelamento`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ justificativa }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Erro no cancelamento: ${JSON.stringify(error)}`)
  }

  return await response.json()
}

/**
 * Inutilizar numeração
 */
async function inutilizarNumeracao(data: any): Promise<any> {
  const token = await getAccessToken()

  const response = await fetch('https://api.nuvemfiscal.com.br/nfe/inutilizacao', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Erro na inutilização: ${JSON.stringify(error)}`)
  }

  return await response.json()
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Parse do body
    const { action, ...params } = await req.json()

    let result

    // Executar ação solicitada
    switch (action) {
      case 'emitir':
        result = await emitirNFe(params.nfeData, params.ambiente || 'homologacao')
        break

      case 'consultar':
        result = await consultarNFe(params.id)
        break

      case 'cancelar':
        result = await cancelarNFe(params.id, params.justificativa)
        break

      case 'inutilizar':
        result = await inutilizarNumeracao(params)
        break

      case 'test':
        // Endpoint de teste
        const token = await getAccessToken()
        result = { success: true, message: 'Token obtained successfully', hasToken: !!token }
        break

      default:
        throw new Error(`Action not supported: ${action}`)
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
