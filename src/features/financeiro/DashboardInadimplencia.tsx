/**
 * DASHBOARD DE NOTIFICAÇÕES EXTRAJUDICIAIS
 * Lista todas as notificações salvas com status de advertência e envio de e-mail.
 */

import React, { useEffect, useState, useCallback } from 'react'
import { FileText, Mail, RefreshCw, Search, MailCheck, MailX, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { gerarNotificacaoPDF, type DadosNotificacao } from './notificacaoService'
import { enviarEmailNotificacao, gerarHtmlEmailNotificacao } from './emailService'
import { Modal2aNotificacao } from './Modal2aNotificacao'

interface Notificacao {
  id: string
  tipo: 'fundo_propaganda' | 'royalties'
  franqueado_nome: string
  franqueado_cpf: string
  territorio: string
  mes_competencia: string
  valor_total: number
  email_destino: string | null
  status_advertencia: string
  email_enviado: boolean
  email_enviado_em: string | null
  dados_json: DadosNotificacao
  criado_em: string
}

const labelTipo: Record<string, string> = {
  fundo_propaganda: 'Fundo de Propaganda',
  royalties: 'Royalties',
}

const labelStatus: Record<string, string> = {
  '1a_advertencia': '1ª Advertência',
  '2a_advertencia': '2ª Advertência',
  '3a_advertencia': '3ª Advertência',
  'rescisao': 'Rescisão',
}

function formatarMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

interface Props {
  refreshKey?: number
}

export const DashboardInadimplencia: React.FC<Props> = ({ refreshKey }) => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [reenvioId, setReenvioId] = useState<string | null>(null)
  const [feedbacks, setFeedbacks] = useState<Record<string, { tipo: 'sucesso' | 'erro'; msg: string }>>({})
  const [show2aModal, setShow2aModal] = useState(false)
  const [selected2aNotificacao, setSelected2aNotificacao] = useState<Notificacao | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const { data } = await supabase
        .from('notificacoes_extrajudiciais')
        .select('*')
        .order('criado_em', { ascending: false })
      setNotificacoes((data as Notificacao[]) || [])
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar, refreshKey])

  const filtradas = notificacoes.filter(n => {
    const q = busca.toLowerCase()
    return (
      n.franqueado_nome.toLowerCase().includes(q) ||
      n.territorio.toLowerCase().includes(q) ||
      n.mes_competencia.toLowerCase().includes(q) ||
      labelTipo[n.tipo]?.toLowerCase().includes(q)
    )
  })

  const handleGerarPDF = (n: Notificacao) => {
    gerarNotificacaoPDF(n.dados_json)
  }

  const handleReenviarEmail = async (n: Notificacao) => {
    if (!n.email_destino) {
      setFeedbacks(p => ({ ...p, [n.id]: { tipo: 'erro', msg: 'E-mail não cadastrado.' } }))
      return
    }
    setReenvioId(n.id)
    setFeedbacks(p => { const c = { ...p }; delete c[n.id]; return c })
    try {
      const { base64: pdfBase64, nomeArquivo: pdfNomeArquivo } = (await import('./notificacaoService')).gerarNotificacaoPDFBase64(n.dados_json)
      const html = gerarHtmlEmailNotificacao(n.franqueado_nome, n.tipo, n.valor_total)
      const assunto = `Notificação Extrajudicial – ${labelTipo[n.tipo]} – ${n.franqueado_nome}`
      const resultado = await enviarEmailNotificacao({ destinatario: n.email_destino, assunto, corpoHtml: html, pdfBase64, pdfNomeArquivo })
      if (resultado.sucesso) {
        await supabase.from('notificacoes_extrajudiciais')
          .update({ email_enviado: true, email_enviado_em: new Date().toISOString() })
          .eq('id', n.id)
        setNotificacoes(prev => prev.map(x => x.id === n.id ? { ...x, email_enviado: true, email_enviado_em: new Date().toISOString() } : x))
        setFeedbacks(p => ({ ...p, [n.id]: { tipo: 'sucesso', msg: 'Reenviado!' } }))
      } else {
        setFeedbacks(p => ({ ...p, [n.id]: { tipo: 'erro', msg: resultado.erro || 'Falha.' } }))
      }
    } finally {
      setReenvioId(null)
    }
  }

  const handle2aNotificacao = (n: Notificacao) => {
    setSelected2aNotificacao(n)
    setShow2aModal(true)
  }

  return (
    <div className="bg-white rounded-lg border border-[#C9C4B5] overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#C9C4B5]" style={{ backgroundColor: '#394353' }}>
        <h2 className="text-sm font-semibold text-white">Notificações Extrajudiciais — Histórico</h2>
        <button onClick={carregar} title="Atualizar" className="text-gray-300 hover:text-white transition">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Busca */}
      <div className="px-4 py-3 border-b border-[#C9C4B5]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por franqueado, território, mês..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
          />
        </div>
      </div>

      {/* Tabela */}
      {carregando ? (
        <div className="flex items-center justify-center py-12 text-sm text-gray-400">
          <RefreshCw size={16} className="animate-spin mr-2" /> Carregando...
        </div>
      ) : filtradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-sm text-gray-400 gap-2">
          <FileText size={28} className="opacity-30" />
          {busca ? 'Nenhuma notificação encontrada para a busca.' : 'Nenhuma notificação salva ainda.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: '#394353' }} className="text-white">
                <th className="text-left px-3 py-2 font-semibold">Franqueado(a)</th>
                <th className="text-left px-3 py-2 font-semibold">Tipo</th>
                <th className="text-left px-3 py-2 font-semibold">Território</th>
                <th className="text-left px-3 py-2 font-semibold">Mês Comp.</th>
                <th className="text-right px-3 py-2 font-semibold">Valor Total</th>
                <th className="text-center px-3 py-2 font-semibold">Status</th>
                <th className="text-center px-3 py-2 font-semibold">E-mail</th>
                <th className="text-center px-3 py-2 font-semibold">Data</th>
                <th className="text-center px-3 py-2 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((n, idx) => (
                <React.Fragment key={n.id}>
                  <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-800">{n.franqueado_nome}</p>
                      <p className="text-gray-400">{n.franqueado_cpf}</p>
                    </td>
                    <td className="px-3 py-2 text-gray-700">{labelTipo[n.tipo] ?? n.tipo}</td>
                    <td className="px-3 py-2 text-gray-700">{n.territorio}</td>
                    <td className="px-3 py-2 text-gray-700">{n.mes_competencia}</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-800">{formatarMoeda(n.valor_total)}</td>

                    {/* Status advertência */}
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          n.status_advertencia === '1a_advertencia'
                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}
                      >
                        {labelStatus[n.status_advertencia] ?? n.status_advertencia}
                      </span>
                    </td>

                    {/* Status e-mail */}
                    <td className="px-3 py-2 text-center">
                      {n.email_enviado ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                          <MailCheck size={11} /> Enviado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                          <MailX size={11} /> Não enviado
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2 text-center text-gray-500">{formatarData(n.criado_em)}</td>

                    {/* Ações */}
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleGerarPDF(n)}
                          title="Gerar PDF"
                          className="p-1.5 rounded text-white hover:opacity-80 transition"
                          style={{ backgroundColor: '#394353' }}
                        >
                          <FileText size={13} />
                        </button>
                        {n.status_advertencia === '1a_advertencia' && (
                          <button
                            onClick={() => handle2aNotificacao(n)}
                            title="Enviar 2ª Notificação"
                            className="p-1.5 rounded text-white hover:opacity-80 transition bg-amber-600"
                          >
                            <AlertCircle size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => handleReenviarEmail(n)}
                          disabled={reenvioId === n.id}
                          title={n.email_enviado ? 'Reenviar e-mail' : 'Enviar e-mail'}
                          className="p-1.5 rounded text-white hover:opacity-80 transition disabled:opacity-50 bg-blue-600"
                        >
                          {reenvioId === n.id ? <RefreshCw size={13} className="animate-spin" /> : <Mail size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {feedbacks[n.id] && (
                    <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td colSpan={9} className="px-3 pb-2">
                        <span className={`text-xs ${feedbacks[n.id].tipo === 'sucesso' ? 'text-green-600' : 'text-red-600'}`}>
                          {feedbacks[n.id].msg}
                        </span>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rodapé contador */}
      {!carregando && filtradas.length > 0 && (
        <div className="px-4 py-2 border-t border-[#C9C4B5] text-xs text-gray-400">
          {filtradas.length} notificação{filtradas.length !== 1 ? 'ões' : ''} • {filtradas.filter(n => n.email_enviado).length} com e-mail enviado
        </div>
      )}

      {/* Modal 2ª Notificação */}
      {selected2aNotificacao && (
        <Modal2aNotificacao
          notificacaoId={selected2aNotificacao.id}
          notificacao={selected2aNotificacao}
          aberto={show2aModal}
          onFechar={() => {
            setShow2aModal(false)
            setSelected2aNotificacao(null)
          }}
          onSalvo={() => {
            setShow2aModal(false)
            setSelected2aNotificacao(null)
            carregar()
          }}
        />
      )}
    </div>
  )
}
