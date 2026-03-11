// Supabase Edge Function: create-user - VERSÃO SIMPLIFICADA PARA DEBUG
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  console.log('🔴 [1] Edge Function chamada - método:', req.method)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔴 [2] Tentando ler corpo')
    const text = await req.text()
    console.log('🔴 [3] Corpo recebido, tamanho:', text.length)

    const payload = JSON.parse(text)
    console.log('🔴 [4] Payload parseado:', { email: payload.email, nome: payload.nome })

    const { email, password, nome, cargo, telefone, permissoes, ativo, empresas } = payload

    if (!email || !password || !nome || !empresas || empresas.length === 0) {
      console.log('🔴 [5] Validação falhou')
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios faltando' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔴 [6] Criando client admin')
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('🔴 [7] Criando usuário em auth')
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome }
    })

    if (createAuthError) {
      console.log('🔴 [ERRO] ao criar auth:', createAuthError.message)
      throw createAuthError
    }

    console.log('🔴 [8] Usuário criado:', authData.user?.id)

    console.log('🔴 [9] Atualizando usuarios')
    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({ 
        nome, 
        cargo, 
        telefone, 
        permissoes, 
        ativo,
        empresa_id: empresas[0]  // Atribuir a primeira empresa como empresa_id
      })
      .eq('id', authData.user!.id)

    if (updateError) {
      console.log('🔴 [ERRO] ao atualizar usuarios:', updateError.message)
      throw updateError
    }

    console.log('🔴 [10] Inserindo vínculos')
    const { error: vinculoError } = await supabaseAdmin
      .from('users_empresas')
      .insert(empresas.map(emp_id => ({ user_id: authData.user!.id, empresa_id: emp_id })))

    if (vinculoError) {
      console.log('🔴 [ERRO] ao inserir vínculos:', vinculoError.message)
      throw vinculoError
    }

    console.log('🔴 [11] ✅ Sucesso!')
    return new Response(
      JSON.stringify({ sucesso: true, user_id: authData.user!.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('🔴 [ERRO GERAL]:', msg)
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
