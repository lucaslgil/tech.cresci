/**
 * MODAL - SEGUNDA NOTIFICAÇÃO EXTRAJUDICIAL
 * Permite editar e enviar 2ª advertência sobre notificação já existente
 */

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, CheckCircle2, AlertCircle, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { gerarNotificacaoPDFBase64, type DadosNotificacao } from './notificacaoService'
import { enviarEmailNotificacao, gerarHtmlEmailNotificacao } from './emailService'

interface Props {
  notificacaoId: string
  notificacao: {
    franqueado_nome: string
    email_destino: string | null
    dados_json: DadosNotificacao
    tipo: 'fundo_propaganda' | 'royalties'
  }
  aberto: boolean
  onFechar: () => void
  onSalvo?: () => void
}

const labelTipo: Record<string, string> = {
  fundo_propaganda: 'Fundo de Propaganda',
  royalties: 'Royalties',
}

export const Modal2aNotificacao: React.FC<Props> = ({ notificacaoId, notificacao, aberto, onFechar, onSalvo }) => {
  // Estado editável dos dados
  const [dados, setDados] = useState(notificacao.dados_json)
  const [emailDestino, setEmailDestino] = useState(notificacao.email_destino || '')
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null)

  const handleDadosChange = (field: string, value: any) => {
    setDados(prev => ({ ...prev, [field]: value }))
  }

  const handleEnviar = async () => {
    if (!emailDestino.trim()) {
      setFeedback({ tipo: 'erro', msg: 'Informe o e-mail do destinatário.' })
      return
    }

    setEnviandoEmail(true)
    setFeedback(null)

    try {
      // Gerar PDF com dados da 2ª notificação (com numeroAdvertencia='2a')
      const { base64: pdfBase64, nomeArquivo: pdfNomeArquivo } = gerarNotificacaoPDFBase64({
        ...dados,
        dataEmissao: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      }, '2a')

      // HTML do email para 2ª notificação
      const html = gerarHtmlEmailNotificacao(notificacao.franqueado_nome, notificacao.tipo, dados.valorTotal)
      const tipoLabel = labelTipo[notificacao.tipo]
      const assunto = `Notificação Extrajudicial – ${tipoLabel} – SEGUNDA ADVERTÊNCIA – ${notificacao.franqueado_nome}`

      const resultado = await enviarEmailNotificacao({
        destinatario: emailDestino,
        assunto,
        corpoHtml: html,
        pdfBase64,
        pdfNomeArquivo,
      })

      if (resultado.sucesso) {
        // Atualizar status para 2ª advertência no banco
        const { error: updateError } = await supabase
          .from('notificacoes_extrajudiciais')
          .update({
            status_advertencia: '2a_advertencia',
            email_enviado: true,
            email_enviado_em: new Date().toISOString(),
            dados_json: dados  // Salvar dados editados
          })
          .eq('id', notificacaoId)

        if (updateError) throw new Error(updateError.message)

        setFeedback({ tipo: 'sucesso', msg: '2ª Notificação enviada com sucesso!' })
        onSalvo?.()
        setTimeout(onFechar, 1500)
      } else {
        setFeedback({ tipo: 'erro', msg: resultado.erro || 'Falha no envio do e-mail.' })
      }
    } catch (e) {
      setFeedback({ tipo: 'erro', msg: e instanceof Error ? e.message : 'Erro ao enviar.' })
    } finally {
      setEnviandoEmail(false)
    }
  }

  if (!aberto) return null

  const ModalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#C9C4B5]" style={{ backgroundColor: '#394353' }}>
          <div>
            <h2 className="text-base font-semibold text-white">2ª Notificação Extrajudicial</h2>
            <p className="text-xs text-gray-300 mt-0.5">{labelTipo[notificacao.tipo]} – Segunda Advertência</p>
          </div>
          <button onClick={onFechar} className="text-gray-300 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Dados do cliente – Editáveis */}
          <div className="bg-gray-50 border border-[#C9C4B5] rounded p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-600 uppercase">Dados do Franqueado(a)</p>
            
            {/* Nome e CPF */}
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Nome Completo"
                value={dados.nomeCompleto}
                onChange={(e) => handleDadosChange('nomeCompleto', e.target.value)}
                className="col-span-2 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
              />
              <input
                type="text"
                placeholder="CPF"
                value={dados.cpf}
                onChange={(e) => handleDadosChange('cpf', e.target.value)}
                className="px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
              />
            </div>

            {/* Nacionalidade, Profissão, Estado Civil */}
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Nacionalidade"
                value={dados.nacionalidade || ''}
                onChange={(e) => handleDadosChange('nacionalidade', e.target.value)}
                className="px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
              />
              <input
                type="text"
                placeholder="Profissão"
                value={dados.profissao || ''}
                onChange={(e) => handleDadosChange('profissao', e.target.value)}
                className="px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
              />
              <input
                type="text"
                placeholder="Estado Civil"
                value={dados.estadoCivilDoc || ''}
                onChange={(e) => handleDadosChange('estadoCivilDoc', e.target.value)}
                className="px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
              />
            </div>

            {/* RG e Endereço */}
            <input
              type="text"
              placeholder="RG (opcional)"
              value={dados.rg || ''}
              onChange={(e) => handleDadosChange('rg', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
            />
            <input
              type="text"
              placeholder="Endereço (opcional)"
              value={dados.endereco || ''}
              onChange={(e) => handleDadosChange('endereco', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
            />
          </div>

          {/* Dados de Débito */}
          <div className="bg-gray-50 border border-[#C9C4B5] rounded p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-600 uppercase">Dados de Débito</p>
            
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Território"
                value={dados.territorioUnidade}
                onChange={(e) => handleDadosChange('territorioUnidade', e.target.value)}
                className="px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
              />
              <input
                type="text"
                placeholder="Mês Competência"
                value={dados.mesCompetencia}
                onChange={(e) => handleDadosChange('mesCompetencia', e.target.value)}
                className="px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
              />
            </div>

            {/* Valores */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Valor Original</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={dados.valorOriginal}
                  onChange={(e) => handleDadosChange('valorOriginal', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Multa %</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={dados.multaPercentual}
                  onChange={(e) => handleDadosChange('multaPercentual', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Juros %</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={dados.jurosPercentual}
                  onChange={(e) => handleDadosChange('jurosPercentual', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Total</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={dados.valorTotal}
                  onChange={(e) => handleDadosChange('valorTotal', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
                />
              </div>
            </div>
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
              E-mail para Envio *
            </label>
            <input
              type="email"
              placeholder="email@franqueado.com.br"
              value={emailDestino}
              onChange={(e) => setEmailDestino(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
            />
          </div>

          {/* Aviso */}
          <div className="bg-amber-50 border border-amber-200 rounded p-3">
            <p className="text-xs text-amber-700">
              <strong>⚠️ Segunda Advertência:</strong> Esta é a segunda notificação. Após esta, a próxima etapa será a rescisão contratual.
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
              {feedback.tipo === 'sucesso' ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {feedback.msg}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onFechar}
              disabled={enviandoEmail}
              className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              onClick={handleEnviar}
              disabled={enviandoEmail}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded hover:opacity-90 transition disabled:opacity-50 bg-amber-600"
            >
              {enviandoEmail ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Mail size={15} />
              )}
              Enviar 2ª Notificação
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(ModalContent, document.body)
}
