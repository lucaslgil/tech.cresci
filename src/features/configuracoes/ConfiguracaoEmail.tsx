/**
 * CONFIGURAÇÃO DE EMAIL (SMTP)
 * Tela: Configurações → E-mail
 * Funciona como o Thunderbird: usuário preenche host, porta, usuário, senha e segurança.
 */

import React, { useState, useEffect } from 'react'
import { Mail, Eye, EyeOff, Save, TestTube2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface SmtpConfig {
  id?: number
  nome_remetente: string
  email_remetente: string
  smtp_host: string
  smtp_porta: number
  smtp_usuario: string
  smtp_senha: string
  smtp_seguranca: 'STARTTLS' | 'SSL/TLS' | 'NONE'
}

const PADRAO: SmtpConfig = {
  nome_remetente: 'CRESCI E PERDI',
  email_remetente: '',
  smtp_host: '',
  smtp_porta: 587,
  smtp_usuario: '',
  smtp_senha: '',
  smtp_seguranca: 'STARTTLS',
}

// Presets para provedores comuns
const PRESETS: Record<string, Partial<SmtpConfig>> = {
  gmail: { smtp_host: 'smtp.gmail.com', smtp_porta: 587, smtp_seguranca: 'STARTTLS' },
  outlook: { smtp_host: 'smtp.office365.com', smtp_porta: 587, smtp_seguranca: 'STARTTLS' },
  yahoo: { smtp_host: 'smtp.mail.yahoo.com', smtp_porta: 587, smtp_seguranca: 'STARTTLS' },
  sendgrid: { smtp_host: 'smtp.sendgrid.net', smtp_porta: 587, smtp_seguranca: 'STARTTLS' },
  locaweb: { smtp_host: 'email-ssl.com.br', smtp_porta: 465, smtp_seguranca: 'SSL/TLS' },
  uol: { smtp_host: 'smtp.uol.com.br', smtp_porta: 587, smtp_seguranca: 'STARTTLS' },
  personalizado: {},
}

export const ConfiguracaoEmail: React.FC = () => {
  const [config, setConfig] = useState<SmtpConfig>(PADRAO)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [testando, setTestando] = useState(false)
  const [emailTeste, setEmailTeste] = useState('')
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null)
  const [carregando, setCarregando] = useState(true)

  // ── Carregar configuração existente ──────────────────────────────────────
  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      try {
        const { data } = await supabase
          .from('configuracoes_email')
          .select('*')
          .maybeSingle()

        if (data) {
          setConfig({
            id: data.id,
            nome_remetente: data.nome_remetente || '',
            email_remetente: data.email_remetente || '',
            smtp_host: data.smtp_host || '',
            smtp_porta: data.smtp_porta || 587,
            smtp_usuario: data.smtp_usuario || '',
            smtp_senha: data.smtp_senha || '',
            smtp_seguranca: data.smtp_seguranca || 'STARTTLS',
          })
        }
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const set = (campo: keyof SmtpConfig, valor: string | number) =>
    setConfig((prev) => ({ ...prev, [campo]: valor }))

  const aplicarPreset = (preset: string) => {
    const p = PRESETS[preset]
    if (p) setConfig((prev) => ({ ...prev, ...p }))
  }

  // ── Salvar ────────────────────────────────────────────────────────────────
  const handleSalvar = async () => {
    if (!config.smtp_host || !config.smtp_usuario || !config.smtp_senha || !config.email_remetente) {
      setFeedback({ tipo: 'erro', msg: 'Preencha todos os campos obrigatórios.' })
      return
    }
    setSalvando(true)
    setFeedback(null)
    try {
      // Obter usuário autenticado e seu empresa_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado.')

      const { data: usuarioDb, error: usuarioError } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', user.id)
        .single()

      if (usuarioError || !usuarioDb?.empresa_id) {
        throw new Error('Empresa não encontrada para o usuário logado.')
      }

      const empresaId = usuarioDb.empresa_id

      const payload = {
        empresa_id: empresaId,
        nome_remetente: config.nome_remetente,
        email_remetente: config.email_remetente,
        smtp_host: config.smtp_host,
        smtp_porta: config.smtp_porta,
        smtp_usuario: config.smtp_usuario,
        smtp_senha: config.smtp_senha,
        smtp_seguranca: config.smtp_seguranca,
        updated_at: new Date().toISOString(),
      }

      let erro
      if (config.id) {
        const r = await supabase.from('configuracoes_email').update(payload).eq('id', config.id)
        erro = r.error
      } else {
        const r = await supabase.from('configuracoes_email').insert(payload).select().single()
        erro = r.error
        if (!erro && r.data) setConfig((prev) => ({ ...prev, id: r.data.id }))
      }

      if (erro) throw new Error(erro.message)
      setFeedback({ tipo: 'sucesso', msg: 'Configurações salvas com sucesso!' })
    } catch (err) {
      setFeedback({ tipo: 'erro', msg: err instanceof Error ? err.message : 'Erro ao salvar.' })
    } finally {
      setSalvando(false)
    }
  }

  // ── Testar envio ──────────────────────────────────────────────────────────
  const handleTestar = async () => {
    if (!emailTeste.trim()) {
      setFeedback({ tipo: 'erro', msg: 'Informe um e-mail para teste.' })
      return
    }
    setTestando(true)
    setFeedback(null)
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailTeste,
          subject: 'Teste de Configuração SMTP – CRESCI E PERDI',
          html: `
            <div style="font-family:Arial,sans-serif;padding:20px">
              <h2 style="color:#394353">✅ E-mail de teste</h2>
              <p>As configurações de SMTP foram aplicadas com sucesso.</p>
              <p>Sistema: <strong>CRESCI E PERDI</strong></p>
              <p style="color:#888;font-size:12px">Este é um e-mail automático de teste.</p>
            </div>
          `,
        },
      })

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Falha no envio')
      }
      setFeedback({ tipo: 'sucesso', msg: `E-mail de teste enviado para ${emailTeste}!` })
    } catch (err) {
      setFeedback({ tipo: 'erro', msg: err instanceof Error ? err.message : 'Erro ao testar.' })
    } finally {
      setTestando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-6 max-w-2xl">

      {/* Intro */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Mail size={20} className="text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800">Configuração SMTP</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Configure os dados do seu servidor de e-mail (igual ao Thunderbird/Outlook).
            As notificações extrajudiciais serão enviadas com esta conta.
          </p>
        </div>
      </div>

      {/* Preset rápido */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
          Provedor (atalho)
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.keys(PRESETS).map((p) => (
            <button
              key={p}
              onClick={() => aplicarPreset(p)}
              className="px-3 py-1 text-xs rounded border border-[#C9C4B5] hover:border-[#394353] hover:text-[#394353] transition-colors capitalize"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Formulário */}
      <div className="grid grid-cols-2 gap-4">

        {/* Nome remetente */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
            Nome do Remetente *
          </label>
          <input
            type="text"
            value={config.nome_remetente}
            onChange={(e) => set('nome_remetente', e.target.value)}
            placeholder="CRESCI E PERDI"
            className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
          />
        </div>

        {/* Email remetente */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
            E-mail Remetente *
          </label>
          <input
            type="email"
            value={config.email_remetente}
            onChange={(e) => set('email_remetente', e.target.value)}
            placeholder="notificacoes@crescieperdi.com.br"
            className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
          />
        </div>

        {/* Host SMTP */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
            Servidor SMTP (Host) *
          </label>
          <input
            type="text"
            value={config.smtp_host}
            onChange={(e) => set('smtp_host', e.target.value)}
            placeholder="mail.crescieperdi.com.br"
            className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
          />
        </div>

        {/* Porta */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
            Porta *
          </label>
          <input
            type="number"
            value={config.smtp_porta}
            onChange={(e) => set('smtp_porta', parseInt(e.target.value) || 587)}
            className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
          />
          <p className="text-xs text-gray-400 mt-1">587 = STARTTLS  |  465 = SSL/TLS  |  25 = Sem criptografia</p>
        </div>

        {/* Segurança */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
            Segurança *
          </label>
          <select
            value={config.smtp_seguranca}
            onChange={(e) => set('smtp_seguranca', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
          >
            <option value="STARTTLS">STARTTLS (recomendado, porta 587)</option>
            <option value="SSL/TLS">SSL/TLS (porta 465)</option>
            <option value="NONE">Sem criptografia (não recomendado)</option>
          </select>
        </div>

        {/* Usuário SMTP */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
            Usuário SMTP *
          </label>
          <input
            type="text"
            value={config.smtp_usuario}
            onChange={(e) => set('smtp_usuario', e.target.value)}
            placeholder="notificacoes@crescieperdi.com.br"
            className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
          />
        </div>

        {/* Senha SMTP */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
            Senha SMTP *
          </label>
          <div className="relative">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={config.smtp_senha}
              onChange={(e) => set('smtp_senha', e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 pr-10 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {mostrarSenha ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Salvar */}
      <div className="flex gap-3">
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded hover:opacity-90 transition disabled:opacity-50"
          style={{ backgroundColor: '#394353' }}
        >
          {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Salvar Configurações
        </button>
      </div>

      {/* Divider */}
      <hr className="border-[#C9C4B5]" />

      {/* Teste de envio */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Testar Envio
        </p>
        <div className="flex gap-3">
          <input
            type="email"
            placeholder="Digite um e-mail para receber o teste"
            value={emailTeste}
            onChange={(e) => setEmailTeste(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
          />
          <button
            onClick={handleTestar}
            disabled={testando}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {testando ? <Loader2 size={14} className="animate-spin" /> : <TestTube2 size={14} />}
            Testar
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Salve as configurações antes de testar.
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
            feedback.tipo === 'sucesso'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {feedback.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {feedback.msg}
        </div>
      )}
    </div>
  )
}
