// Supabase Edge Function: send-email (SMTP via nodemailer)
//
// Sem dependência de serviços externos pagos.
// Lê as configurações SMTP da tabela 'configuracoes_email' do banco.
//
// Deploy: supabase functions deploy send-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
// @deno-types="npm:@types/nodemailer"
import nodemailer from "npm:nodemailer@6.9.14"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EmailPayload {
  to: string
  subject: string
  html: string
  pdfBase64?: string
  pdfFileName?: string
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── 1. Verificar autorização ────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 2. Descobrir empresa do usuário ─────────────────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: usuarioDb } = await supabaseAdmin
      .from('usuarios')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (!usuarioDb?.empresa_id) {
      return new Response(
        JSON.stringify({ error: 'empresa_id não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 3. Buscar configuração SMTP da empresa ──────────────────────────────
    const { data: smtpConfig, error: configError } = await supabaseAdmin
      .from('configuracoes_email')
      .select('*')
      .eq('empresa_id', usuarioDb.empresa_id)
      .single()

    if (configError || !smtpConfig) {
      return new Response(
        JSON.stringify({ error: 'Configurações de e-mail não encontradas. Acesse Configurações → E-mail para configurar.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 4. Dados do email ───────────────────────────────────────────────────
    const payload: EmailPayload = await req.json()
    const { to, subject, html, pdfBase64, pdfFileName } = payload

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 5. Montar transporte SMTP ───────────────────────────────────────────
    const seguranca = smtpConfig.smtp_seguranca as string
    const transportConfig: Record<string, unknown> = {
      host: smtpConfig.smtp_host,
      port: smtpConfig.smtp_porta,
      auth: {
        user: smtpConfig.smtp_usuario,
        pass: smtpConfig.smtp_senha,
      },
    }

    if (seguranca === 'SSL/TLS') {
      transportConfig.secure = true
    } else if (seguranca === 'STARTTLS') {
      transportConfig.secure = false
      transportConfig.requireTLS = true
    } else {
      transportConfig.secure = false
      transportConfig.ignoreTLS = true
    }

    const transporter = nodemailer.createTransport(transportConfig)

    // ── 6. Montar mensagem ──────────────────────────────────────────────────
    const mailOptions: Record<string, unknown> = {
      from: `"${smtpConfig.nome_remetente}" <${smtpConfig.email_remetente}>`,
      to,
      subject,
      html,
    }

    if (pdfBase64 && pdfFileName) {
      mailOptions.attachments = [
        {
          filename: pdfFileName,
          content: pdfBase64,
          encoding: 'base64',
          contentType: 'application/pdf',
        },
      ]
    }

    // ── 7. Enviar ───────────────────────────────────────────────────────────
    const info = await transporter.sendMail(mailOptions)

    return new Response(
      JSON.stringify({ sucesso: true, messageId: info.messageId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ error: 'Erro ao enviar e-mail', detalhes: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
