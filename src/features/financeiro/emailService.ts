/**
 * SERVIÇO DE ENVIO DE EMAIL
 * Chama a Edge Function 'send-email' no Supabase via SMTP configurado.
 *
 * Para ativar o envio de emails:
 * 1. Acesse Configurações → E-mail no sistema
 * 2. Preencha os dados do servidor SMTP do seu provedor de e-mail
 * 3. Clique em "Salvar Configurações" e teste com "Testar envio"
 * 4. Faça o deploy da edge function: supabase functions deploy send-email
 */

import { supabase } from '../../lib/supabase'

export interface EnvioEmailParams {
  destinatario: string
  assunto: string
  corpoHtml: string
  pdfBase64?: string
  pdfNomeArquivo?: string
}

export interface EnvioEmailResult {
  sucesso: boolean
  erro?: string
}

/**
 * Envia email com anexo PDF opcional via Edge Function Supabase (SMTP)
 */
export async function enviarEmailNotificacao(
  params: EnvioEmailParams
): Promise<EnvioEmailResult> {
  try {
    const payload: Record<string, unknown> = {
      to: params.destinatario,
      subject: params.assunto,
      html: params.corpoHtml,
    }

    if (params.pdfBase64 && params.pdfNomeArquivo) {
      payload.pdfBase64 = params.pdfBase64
      payload.pdfFileName = params.pdfNomeArquivo
    }

    const { data, error } = await supabase.functions.invoke('send-email', {
      body: payload,
    })

    if (error) {
      return { sucesso: false, erro: error.message || 'Erro ao chamar serviço de email' }
    }

    if (data?.error) {
      return { sucesso: false, erro: data.error }
    }

    return { sucesso: true }
  } catch (err) {
    return {
      sucesso: false,
      erro: err instanceof Error ? err.message : 'Erro desconhecido ao enviar email',
    }
  }
}

/**
 * Gera o corpo HTML padrão para notificação extrajudicial
 */
export function gerarHtmlEmailNotificacao(
  nomeCliente: string,
  tipoNotificacao: 'fundo_propaganda' | 'royalties',
  valorTotal: number
): string {
  const tipoLabel =
    tipoNotificacao === 'fundo_propaganda'
      ? 'Taxa de Propaganda'
      : 'Royalties'

  const valorFormatado = valorTotal.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 30px; }
        .header { background-color: #394353; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 20px; }
        .body { background: #f9f9f9; padding: 24px; border: 1px solid #ddd; }
        .footer { background: #394353; color: #C9C4B5; padding: 12px 20px; font-size: 12px; text-align: center; border-radius: 0 0 8px 8px; }
        .destaque { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 16px; margin: 16px 0; border-radius: 4px; }
        .valor { font-size: 22px; font-weight: bold; color: #d32f2f; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>NOTIFICAÇÃO EXTRAJUDICIAL</h1>
          <p style="margin:8px 0 0; font-size:14px;">CRESCI E PERDI FRANCHISING LTDA</p>
        </div>
        <div class="body">
          <p>Prezado(a) <strong>${nomeCliente}</strong>,</p>
          <p>Encaminhamos em anexo a <strong>Notificação Extrajudicial – Primeira Advertência</strong> referente ao não pagamento de <strong>${tipoLabel}</strong>.</p>
          <div class="destaque">
            <p style="margin:0">Valor total do débito:</p>
            <p class="valor" style="margin:4px 0 0">${valorFormatado}</p>
          </div>
          <p>Solicitamos que o pagamento seja efetuado no prazo máximo de <strong>15 (quinze) dias</strong>, conforme detalhado no documento em anexo.</p>
          <p>Em caso de dúvidas, entre em contato com nossa equipe.</p>
          <p>Atenciosamente,</p>
          <p><strong>CRESCI E PERDI FRANCHISING LTDA</strong><br />
          Rua Campos Salles, nº 820, Centro, São José do Rio Pardo/SP<br />
          CNPJ: 27.767.670/0001-94</p>
        </div>
        <div class="footer">
          Este é um comunicado oficial. Não responda a este email automaticamente.
        </div>
      </div>
    </body>
    </html>
  `
}
