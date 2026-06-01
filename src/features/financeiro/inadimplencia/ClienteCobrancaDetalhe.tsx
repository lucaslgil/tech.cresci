import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, FileText, Clock, Calendar,
  CheckCircle2, XCircle, Phone, Mail,
  MessageCircle, Users, Briefcase, RefreshCw, ChevronDown, Edit2,
  Upload, X, Paperclip,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import {
  sincronizarClienteSolutto, listarContasCliente, obterAcompanhamento,
  listarInteracoes, listarTimeline,
  criarInteracao, criarNegociacao, atualizarNegociacao,
  upsertAcompanhamento, uploadAnexoInteracao,
} from './service'
import {
  STATUS_OPERACIONAL_LABEL, STATUS_OPERACIONAL_COLOR, FASE_LABEL, FASE_COLOR,
  CANAL_LABEL, EMPRESA_RESPONSAVEL_LABEL, REGRAS_PARCELAMENTO,
  calcularFase,
} from './types'
import type {
  ContaReceberResumo, Interacao, Negociacao, TimelineEvento,
  AcompanhamentoCliente, Canal, StatusOperacional, EmpresaResponsavel,
  AnexoInteracao, TituloNegociado,
} from './types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const R$ = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const dtBR = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('pt-BR') : '—'

const dtHoraBR = (s: string) =>
  new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const STATUS_TITULO_CLS: Record<ContaReceberResumo['status_calculado'], string> = {
  QUITADO:    'bg-green-100 text-green-800',
  A_VENCER:   'bg-blue-100 text-blue-700',
  VENCE_HOJE: 'bg-yellow-100 text-yellow-800',
  VENCIDO:    'bg-red-100 text-red-800',
}

const ICONE_CANAL: Record<Canal, React.ElementType> = {
  WHATSAPP:  MessageCircle,
  EMAIL:     Mail,
  LIGACAO:   Phone,
  REUNIAO:   Users,
  JURIDICO:  Briefcase,
  OBSERVACAO:FileText,
}

const TIMELINE_COR: Record<string, string> = {
  blue:    'bg-blue-500',
  green:   'bg-green-500',
  red:     'bg-red-500',
  orange:  'bg-orange-500',
  yellow:  'bg-yellow-500',
  purple:  'bg-purple-500',
  gray:    'bg-gray-400',
}

const floor2 = (v: number) => Math.floor(v * 100) / 100

// Taxa diária com precisão total (padrão bancário): arredonda apenas no final, por componente
const calcJuros = (taxaMensal: number, diasAtraso: number) =>
  (taxaMensal / 30) * diasAtraso   // precisão total; exibição usa .toFixed(2)

// Trunca multa e juros separadamente (igual banco), depois soma
const calcTotalTitulo = (base: number, pMulta: number, pJuros: number) =>
  base + floor2(base * pMulta / 100) + floor2(base * pJuros / 100)

const EMPRESAS_RESP = Object.entries(EMPRESA_RESPONSAVEL_LABEL) as [EmpresaResponsavel, string][]

// ─────────────────────────────────────────────────────────────────────────────

export const ClienteCobrancaDetalhe: React.FC = () => {
  const { clienteId } = useParams<{ clienteId: string }>()
  const navigate = useNavigate()

  const [empresaId, setEmpresaId] = useState<number | null>(null)
  const [clienteInfo, setClienteInfo] = useState<{ nome: string; cpf_cnpj: string; solutto_cliente_id: number | null } | null>(null)
  const [contas, setContas] = useState<ContaReceberResumo[]>([])
  const [acompanhamento, setAcompanhamento] = useState<AcompanhamentoCliente | null>(null)
  const [interacoes, setInteracoes] = useState<Interacao[]>([])
  const [timeline, setTimeline] = useState<TimelineEvento[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [activeTab, setActiveTab] = useState<'titulos' | 'interacoes' | 'negociacao'>('titulos')

  // Modais
  const [showModalInteracao, setShowModalInteracao] = useState(false)
  const [showModalNegociacao, setShowModalNegociacao] = useState(false)

  const cId = parseInt(clienteId ?? '0')

  // ── Carrega empresa do usuário ───────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data } = await supabase.from('usuarios').select('empresa_id').eq('id', session.user.id).single()
      if (data) setEmpresaId(data.empresa_id)
    })
  }, [])

  // ── Carrega dados do cliente ─────────────────────────────────────────────
  const carregar = useCallback(async (eId: number) => {
    setSyncing(true)
    try {
      // Info básica do cliente
      const { data: cli } = await supabase
        .from('clientes')
        .select('id, nome, cpf_cnpj, solutto_cliente_id')
        .eq('id', cId)
        .single()
      if (cli) setClienteInfo({ nome: cli.nome, cpf_cnpj: cli.cpf_cnpj, solutto_cliente_id: cli.solutto_cliente_id })

      // Sync Solutto se tiver ID
      if (cli?.solutto_cliente_id) {
        await sincronizarClienteSolutto(cli.solutto_cliente_id, cId, eId)
      }

      const [c, ac, inter, tl] = await Promise.all([
        listarContasCliente(cId, eId),
        obterAcompanhamento(cId, eId),
        listarInteracoes(cId, eId),
        listarTimeline(cId, eId),
      ])

      setContas(c)
      setAcompanhamento(ac)
      setInteracoes(inter)
      setTimeline(tl)

      // Atualiza dados financeiros no acompanhamento
      await upsertAcompanhamento({
        clienteId:         cId,
        soluttoClienteId:  cli?.solutto_cliente_id ?? null,
        empresaId:         eId,
        contas:            c,
      })

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }, [cId])

  useEffect(() => {
    if (empresaId) carregar(empresaId)
  }, [empresaId, carregar])

  // ── Derived ──────────────────────────────────────────────────────────────
  const vencidas   = contas.filter(c => c.status_calculado === 'VENCIDO')
  const aVencer    = contas.filter(c => c.status_calculado === 'A_VENCER' || c.status_calculado === 'VENCE_HOJE')
  const diasMax    = acompanhamento?.dias_atraso_max ?? Math.max(0, ...vencidas.map(c => c.dias_atraso))
  const valorTotal = vencidas.reduce((s, c) => s + c.valor_saldo, 0)
  const fase       = calcularFase(diasMax)

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600" />
    </div>
  )

  return (
    <div className="p-6 space-y-5">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/financeiro/controle-inadimplencia')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{clienteInfo?.nome ?? '—'}</h1>
            <div className="flex items-center gap-3 mt-1">
              {clienteInfo?.cpf_cnpj && <span className="text-xs text-gray-400 font-mono">{clienteInfo.cpf_cnpj}</span>}
              {acompanhamento && (
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_OPERACIONAL_COLOR[acompanhamento.status_operacional]}`}>
                  {STATUS_OPERACIONAL_LABEL[acompanhamento.status_operacional]}
                </span>
              )}
              {fase && (
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${FASE_COLOR[fase]}`}>
                  {FASE_LABEL[fase]}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => empresaId && carregar(empresaId)}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
          <button
            onClick={() => setShowModalInteracao(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova Interação
          </button>
          <button
            onClick={() => setShowModalNegociacao(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-green-700 hover:bg-green-800 rounded-lg"
          >
            <FileText className="h-3.5 w-3.5" />
            Nova Negociação
          </button>
        </div>
      </div>

      {/* ── Cards de Resumo ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-red-100 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Vencido</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{R$(valorTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">{vencidas.length} título{vencidas.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-xl border border-orange-100 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Dias de Atraso</p>
          <p className="text-2xl font-bold text-orange-700 mt-1">{diasMax > 0 ? `${diasMax} dias` : '—'}</p>
          <p className="text-xs text-gray-400 mt-1">Título mais antigo</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-100 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">A Vencer</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{R$(aVencer.reduce((s,c)=>s+c.valor_saldo,0))}</p>
          <p className="text-xs text-gray-400 mt-1">{aVencer.length} título{aVencer.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Próx. Acompanhamento</p>
          <p className="text-sm font-semibold text-gray-800 mt-1">
            {acompanhamento?.proximo_acompanhamento ? dtBR(acompanhamento.proximo_acompanhamento) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Última interação: {acompanhamento?.ultima_interacao_em ? dtBR(acompanhamento.ultima_interacao_em) : 'Nunca'}
          </p>
        </div>
      </div>

      {/* ── Conteúdo em 2 colunas ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Coluna esquerda: Títulos + Interações ────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex border-b border-gray-100">
              {([
                { k: 'titulos',    l: `Títulos (${contas.length})` },
                { k: 'interacoes', l: `Interações (${interacoes.length})` },
                { k: 'negociacao', l: 'Negociações' },
              ] as { k: typeof activeTab; l: string }[]).map(t => (
                <button key={t.k} onClick={() => setActiveTab(t.k)}
                  className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === t.k ? 'border-slate-700 text-slate-800' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  {t.l}
                </button>
              ))}
            </div>

            {/* Títulos */}
            {activeTab === 'titulos' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-50 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Documento', 'Vencimento', 'Valor Original', 'Saldo', 'Status', 'Dias Atraso'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {contas.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{c.numero_documento ?? `#${c.solutto_id}`}</div>
                          {c.descricao && <div className="text-xs text-gray-400">{c.descricao}</div>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{dtBR(c.data_vencimento)}</td>
                        <td className="px-4 py-3 font-medium">{R$(c.valor_original)}</td>
                        <td className="px-4 py-3 font-semibold">{R$(c.valor_saldo)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded ${STATUS_TITULO_CLS[c.status_calculado]}`}>
                            {c.status_calculado.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {c.dias_atraso > 0 ? `${c.dias_atraso}d` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Interações */}
            {activeTab === 'interacoes' && (
              <div className="divide-y divide-gray-50">
                {interacoes.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">Nenhuma interação registrada</p>
                ) : interacoes.map(i => {
                  // Usa canais[] se disponível, fallback para [canal]
                  const canaisExibir: Canal[] = (i.canais && i.canais.length > 0) ? i.canais : [i.canal]
                  const IcPrimario = ICONE_CANAL[canaisExibir[0]]
                  return (
                    <div key={i.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <IcPrimario className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {canaisExibir.map(c => (
                              <span key={c} className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                {CANAL_LABEL[c]}
                              </span>
                            ))}
                            {i.status_operacional_resultante && (
                              <span className={`text-xs px-2 py-0.5 rounded ${STATUS_OPERACIONAL_COLOR[i.status_operacional_resultante]}`}>
                                → {STATUS_OPERACIONAL_LABEL[i.status_operacional_resultante]}
                              </span>
                            )}
                            <span className="text-xs text-gray-400 ml-auto">{dtHoraBR(i.data_interacao)}</span>
                          </div>
                          <p className="text-sm text-gray-800 mt-1">{i.descricao}</p>
                          {i.resultado && <p className="text-xs text-gray-500 mt-1">Resultado: {i.resultado}</p>}
                          {i.proximo_acompanhamento && (
                            <p className="text-xs text-blue-600 mt-1">
                              <Calendar className="inline h-3 w-3 mr-1" />
                              Próximo acomp.: {dtBR(i.proximo_acompanhamento)}
                            </p>
                          )}
                          {/* Snapshot financeiro */}
                          {i.snapshot_financeiro?.valor_total_vencido > 0 && (
                            <div className="mt-2 text-xs text-gray-400 bg-gray-50 rounded px-3 py-1.5">
                              Na data: {R$(i.snapshot_financeiro.valor_total_vencido)} vencidos
                              ({i.snapshot_financeiro.titulos_vencidos} título{i.snapshot_financeiro.titulos_vencidos !== 1 ? 's' : ''})
                              — {i.snapshot_financeiro.dias_atraso_max} dias atraso
                            </div>
                          )}
                          {/* Anexos */}
                          {i.anexos && i.anexos.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {i.anexos.map((a: AnexoInteracao, idx: number) => (
                                <a key={idx} href={a.url} target="_blank" rel="noopener noreferrer"
                                  title={a.nome} className="group block relative">
                                  {a.tipo.startsWith('image/') ? (
                                    <img src={a.url} alt={a.nome}
                                      className="h-14 w-14 object-cover rounded-lg border border-gray-200 group-hover:border-blue-400 transition-colors" />
                                  ) : (
                                    <div className="h-14 w-14 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center gap-0.5 group-hover:border-red-400 transition-colors">
                                      <Paperclip className="h-4 w-4 text-red-400" />
                                      <span className="text-xs text-red-500 font-medium">PDF</span>
                                    </div>
                                  )}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Negociações */}
            {activeTab === 'negociacao' && (
              <NegociacoesHistorico clienteId={cId} empresaId={empresaId ?? 0} />
            )}
          </div>
        </div>

        {/* Coluna direita: Timeline ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline Operacional
          </h3>
          {timeline.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Nenhum evento registrado</p>
          ) : (
            <div className="space-y-0">
              {timeline.map((ev, idx) => (
                <div key={ev.id} className="flex gap-3 pb-4 relative">
                  {/* Linha vertical */}
                  {idx < timeline.length - 1 && (
                    <div className="absolute left-3.5 top-6 bottom-0 w-0.5 bg-gray-100" />
                  )}
                  {/* Dot */}
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full ${TIMELINE_COR[ev.cor] ?? 'bg-gray-400'} flex items-center justify-center z-10`}>
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-xs font-semibold text-gray-800 leading-tight">{ev.titulo}</p>
                    {ev.descricao && <p className="text-xs text-gray-500 mt-0.5 leading-tight">{ev.descricao}</p>}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-xs text-gray-400">{dtHoraBR(ev.data_evento)}</p>
                      {ev.usuario_nome && (
                        <span className="text-xs text-gray-400">· {ev.usuario_nome}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Nova Interação ──────────────────────────────────────────── */}
      {showModalInteracao && (
        <ModalNovaInteracao
          clienteId={cId}
          empresaId={empresaId ?? 0}
          soluttoClienteId={clienteInfo?.solutto_cliente_id ?? null}
          onClose={() => setShowModalInteracao(false)}
          onSaved={() => { setShowModalInteracao(false); if (empresaId) carregar(empresaId) }}
        />
      )}

      {/* ── Modal: Nova Negociação ─────────────────────────────────────────── */}
      {showModalNegociacao && (
        <ModalNovaNegociacao
          clienteId={cId}
          empresaId={empresaId ?? 0}
          contasVencidas={vencidas}
          onClose={() => setShowModalNegociacao(false)}
          onSaved={() => { setShowModalNegociacao(false); if (empresaId) carregar(empresaId) }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: Editar Negociação
// ─────────────────────────────────────────────────────────────────────────────

const ModalEditarNegociacao: React.FC<{
  negociacao: Negociacao
  onClose: () => void
  onSaved: () => void
}> = ({ negociacao, onClose, onSaved }) => {
  const [empresaResp, setEmpresaResp]  = useState<EmpresaResponsavel>(negociacao.empresa_responsavel)
  const [multaGlobal, setMultaGlobal]  = useState(negociacao.percentual_multa)
  const [taxaMensal, setTaxaMensal]    = useState(negociacao.percentual_juros)
  const [parcelas, setParcelas]        = useState(negociacao.quantidade_parcelas)
  const [dataVenc, setDataVenc]        = useState(negociacao.data_vencimento_negociacao.split('T')[0])
  const [statusNeg, setStatusNeg]      = useState(negociacao.status_negociacao)
  const [obs, setObs]                  = useState(negociacao.observacoes_financeiras ?? '')
  const [saving, setSaving]            = useState(false)
  const [erro, setErro]                = useState('')

  const regra = REGRAS_PARCELAMENTO[empresaResp]
  const titulos = (negociacao.titulos_negociados ?? []) as TituloNegociado[]

  // Recalcula total com os valores editados
  const valorOriginal   = titulos.reduce((s, t) => s + t.valor_saldo, 0) || negociacao.valor_original
  const perTitulo = titulos.map(t => {
    const pJuros = calcJuros(taxaMensal, t.dias_atraso)
    const total  = calcTotalTitulo(t.valor_saldo, multaGlobal, pJuros)
    return { t, pJuros, total }
  })
  const valorTotal  = perTitulo.length > 0
    ? perTitulo.reduce((s, r) => s + r.total, 0)
    : negociacao.valor_original * (1 + multaGlobal / 100 + taxaMensal / 100)
  const valorParcela = valorTotal / Math.max(1, parcelas)

  const salvar = async () => {
    setSaving(true)
    setErro('')
    try {
      await atualizarNegociacao(negociacao.id, {
        empresa_responsavel:        empresaResp,
        percentual_multa:           multaGlobal,
        percentual_juros:           taxaMensal,
        quantidade_parcelas:        parcelas,
        valor_total_corrigido:      Math.round(valorTotal * 100) / 100,
        valor_parcela:              Math.round(valorParcela * 100) / 100,
        data_vencimento_negociacao: dataVenc,
        observacoes_financeiras:    obs.trim() || null,
        status_negociacao:          statusNeg,
      })
      onSaved()
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao salvar')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-gray-100 flex-shrink-0 flex items-center gap-3">
          <div className="bg-green-100 rounded-xl p-2">
            <Edit2 className="h-4 w-4 text-green-700" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">Editar Negociação #{negociacao.id}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {EMPRESA_RESPONSAVEL_LABEL[negociacao.empresa_responsavel]} · v{negociacao.versao}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Títulos negociados (somente leitura) */}
          {titulos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Títulos desta Negociação
              </p>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full text-xs divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Cód. C.R.</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Referência</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-500">Saldo</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-500">Atraso</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-500">Valor Atual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {perTitulo.map(({ t, total }) => (
                      <tr key={t.solutto_id}>
                        <td className="px-3 py-2 font-mono font-bold text-blue-700">{t.solutto_id}</td>
                        <td className="px-3 py-2 font-mono text-gray-500">{t.numero_documento ?? '—'}</td>
                        <td className="px-3 py-2 text-right font-semibold text-red-700">{R$(t.valor_saldo)}</td>
                        <td className="px-3 py-2 text-right text-orange-600">{t.dias_atraso}d</td>
                        <td className="px-3 py-2 text-right font-bold text-green-700">{R$(total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Taxas */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Taxas de Correção</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Multa (%)</label>
                <input type="number" min="0" max="100" step="0.1" value={multaGlobal}
                  onChange={e => setMultaGlobal(parseFloat(e.target.value) || 0)}
                  className="w-full text-right text-sm px-2 py-1.5 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Juros (% ao mês)</label>
                <input type="number" min="0" max="100" step="0.01" value={taxaMensal}
                  onChange={e => setTaxaMensal(parseFloat(e.target.value) || 0)}
                  className="w-full text-right text-sm px-2 py-1.5 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
              </div>
            </div>
            {/* Resumo recalculado */}
            <div className="grid grid-cols-3 gap-3 bg-white rounded-lg border border-amber-200 p-3 text-sm">
              <div>
                <p className="text-xs text-amber-700">Base ({titulos.length || 1} CR)</p>
                <p className="font-bold text-gray-900">{R$(valorOriginal)}</p>
              </div>
              <div>
                <p className="text-xs text-amber-700">Total corrigido</p>
                <p className="font-bold text-green-700">{R$(valorTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-amber-700">{parcelas}x de</p>
                <p className="font-bold text-green-700">{R$(valorParcela)}</p>
              </div>
            </div>
          </div>

          {/* Empresa + Parcelas + Data */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Empresa Responsável</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {EMPRESAS_RESP.map(([v, l]) => (
                <button key={v} onClick={() => { setEmpresaResp(v); setParcelas(1) }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    empresaResp === v ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">Parcelas</label>
              <select value={parcelas} onChange={e => setParcelas(parseInt(e.target.value))} disabled={!regra.permite}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-50 disabled:text-gray-400">
                {Array.from({ length: regra.max_parcelas }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}x</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Vencimento 1ª Parcela</label>
              <input type="date" value={dataVenc} onChange={e => setDataVenc(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Status</label>
            <select value={statusNeg} onChange={e => setStatusNeg(e.target.value as Negociacao['status_negociacao'])}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400">
              <option value="ATIVA">Ativa</option>
              <option value="CUMPRIDA">Cumprida</option>
              <option value="QUEBRADA">Quebrada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Observações Financeiras</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2}
              placeholder="Condições especiais, notas da negociação..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
          </div>

          {erro && <p className="text-xs text-red-600">{erro}</p>}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={salvar} disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-green-700 hover:bg-green-800 rounded-lg disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: Histórico de negociações
// ─────────────────────────────────────────────────────────────────────────────

const NegociacoesHistorico: React.FC<{ clienteId: number; empresaId: number }> = ({ clienteId, empresaId }) => {
  const [lista, setLista]           = useState<Negociacao[]>([])
  const [expandido, setExpandido]   = useState<Set<number>>(new Set())
  const [editandoNeg, setEditandoNeg] = useState<Negociacao | null>(null)

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('inadimplencia_negociacoes')
      .select(`*, parcelas:inadimplencia_negociacoes_parcelas(*)`)
      .eq('cliente_id', clienteId).eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
    setLista((data ?? []) as Negociacao[])
  }, [clienteId, empresaId])

  useEffect(() => { carregar() }, [carregar])

  if (lista.length === 0) return <p className="text-sm text-gray-400 text-center py-10">Nenhuma negociação registrada</p>

  const toggleExpandido = (id: number) => setExpandido(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  return (
    <div className="divide-y divide-gray-50">
      {lista.map(n => {
        const titulos = (n.titulos_negociados ?? []) as TituloNegociado[]
        const aberto  = expandido.has(n.id)
        return (
          <div key={n.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-semibold text-gray-700">{EMPRESA_RESPONSAVEL_LABEL[n.empresa_responsavel]}</span>
                <span className="text-xs text-gray-400 ml-2">v{n.versao}</span>
                <span className="text-xs text-gray-400 ml-2">{new Date(n.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  n.status_negociacao === 'ATIVA'    ? 'bg-green-100 text-green-800' :
                  n.status_negociacao === 'CUMPRIDA' ? 'bg-blue-100 text-blue-800'  :
                  n.status_negociacao === 'QUEBRADA' ? 'bg-red-100 text-red-800'    :
                  'bg-gray-100 text-gray-600'
                }`}>{n.status_negociacao}</span>
                <button
                  onClick={() => setEditandoNeg(n)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                >
                  <Edit2 className="h-3 w-3" />
                  Editar
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
              <div><span className="text-gray-400">Original:</span> {R$(n.valor_original)}</div>
              <div><span className="text-gray-400">Corrigido:</span> {R$(n.valor_total_corrigido)}</div>
              <div><span className="text-gray-400">Parcelas:</span> {n.quantidade_parcelas}x {R$(n.valor_parcela)}</div>
            </div>
            {n.observacoes_financeiras && (
              <p className="text-xs text-gray-400 mt-1 italic">{n.observacoes_financeiras}</p>
            )}
            {/* Títulos negociados */}
            {titulos.length > 0 && (
              <div className="mt-2">
                <button onClick={() => toggleExpandido(n.id)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <ChevronDown className={`h-3 w-3 transition-transform ${aberto ? 'rotate-180' : ''}`} />
                  {aberto ? 'Ocultar' : 'Ver'} {titulos.length} título{titulos.length !== 1 ? 's' : ''} negociado{titulos.length !== 1 ? 's' : ''}
                </button>
                {aberto && (
                  <div className="mt-2 border border-gray-100 rounded-lg overflow-hidden">
                    <table className="min-w-full text-xs divide-y divide-gray-50">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-500">Cód. C.R.</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-500">Referência</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-500">Vencimento</th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-500">Saldo</th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-500">Atraso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 bg-white">
                        {titulos.map(t => (
                          <tr key={t.solutto_id}>
                            <td className="px-3 py-2 font-mono font-bold text-blue-700">{t.solutto_id}</td>
                            <td className="px-3 py-2 font-mono text-gray-500">{t.numero_documento ?? '—'}</td>
                            <td className="px-3 py-2 text-gray-600">{dtBR(t.data_vencimento)}</td>
                            <td className="px-3 py-2 text-right text-red-700 font-semibold">{R$(t.valor_saldo)}</td>
                            <td className="px-3 py-2 text-right text-orange-600">{t.dias_atraso}d</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {/* Parcelas */}
            {n.parcelas && n.parcelas.length > 0 && (
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {n.parcelas.map(p => (
                  <div key={p.id}
                    className={`text-xs px-2 py-0.5 rounded border ${
                      p.status === 'PAGO' ? 'bg-green-100 border-green-300 text-green-800' :
                      p.status === 'ATRASADO' ? 'bg-red-100 border-red-300 text-red-800' :
                      'bg-white border-gray-300 text-gray-700'
                    }`}>
                    {p.numero_parcela}ª {dtBR(p.data_vencimento)} — {R$(p.valor_parcela)}
                    {p.status === 'PAGO' && ' ✓'}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {editandoNeg && (
        <ModalEditarNegociacao
          negociacao={editandoNeg}
          onClose={() => setEditandoNeg(null)}
          onSaved={() => { setEditandoNeg(null); carregar() }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: Nova Interação
// ─────────────────────────────────────────────────────────────────────────────

const CANAIS: Canal[] = ['WHATSAPP','EMAIL','LIGACAO','REUNIAO','JURIDICO','OBSERVACAO']
const STATUS_OP_LIST = Object.entries(STATUS_OPERACIONAL_LABEL) as [StatusOperacional, string][]

const ModalNovaInteracao: React.FC<{
  clienteId: number; empresaId: number; soluttoClienteId: number | null
  onClose: () => void; onSaved: () => void
}> = ({ clienteId, empresaId, soluttoClienteId, onClose, onSaved }) => {
  const [canaisSel, setCanaisSel] = useState<Set<Canal>>(new Set(['WHATSAPP']))
  const [descricao, setDescricao]         = useState('')
  const [resultado, setResultado]         = useState('')
  const [statusResultante, setStatusResultante] = useState<StatusOperacional | ''>('')
  const [proximoAcomp, setProximoAcomp]   = useState('')
  const [arquivos, setArquivos]           = useState<File[]>([])
  const [previews, setPreviews]           = useState<string[]>([])
  const [dragOver, setDragOver]           = useState(false)
  const [saving, setSaving]               = useState(false)
  const [erro, setErro]                   = useState('')
  const fileInputRef                      = useRef<HTMLInputElement>(null)
  const objectUrlsRef                     = useRef<string[]>([])

  useEffect(() => () => { objectUrlsRef.current.forEach(URL.revokeObjectURL) }, [])

  const adicionarArquivos = useCallback((files: FileList | File[]) => {
    const novosArquivos: File[] = []
    const novosPreviews: string[] = []
    Array.from(files).forEach(f => {
      if (f.size > 10_000_000) { setErro(`"${f.name}" excede 10 MB`); return }
      const tipoOk = f.type.startsWith('image/') || f.type === 'application/pdf'
      if (!tipoOk) { setErro(`"${f.name}" não é imagem nem PDF`); return }
      const url = f.type.startsWith('image/') ? URL.createObjectURL(f) : ''
      if (url) objectUrlsRef.current.push(url)
      novosArquivos.push(f)
      novosPreviews.push(url)
    })
    if (novosArquivos.length > 0) {
      setArquivos(prev => [...prev, ...novosArquivos])
      setPreviews(prev => [...prev, ...novosPreviews])
    }
  }, [])

  const removerArquivo = (idx: number) => {
    if (previews[idx]) URL.revokeObjectURL(previews[idx])
    setArquivos(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    adicionarArquivos(e.dataTransfer.files)
  }

  const toggleCanal = (c: Canal) => setCanaisSel(prev => {
    const next = new Set(prev)
    if (next.has(c) && next.size > 1) next.delete(c)
    else next.add(c)
    return next
  })

  const salvar = async () => {
    if (!descricao.trim()) { setErro('Descrição obrigatória'); return }
    if (canaisSel.size === 0) { setErro('Selecione ao menos um canal'); return }
    setSaving(true)
    setErro('')
    try {
      const anexos: AnexoInteracao[] = []
      for (const arquivo of arquivos) {
        const a = await uploadAnexoInteracao(arquivo, empresaId, clienteId)
        anexos.push(a)
      }
      await criarInteracao({
        empresaId, clienteId, soluttoClienteId,
        canais: Array.from(canaisSel),
        descricao: descricao.trim(),
        resultado: resultado.trim() || undefined,
        statusOperacionalResultante: statusResultante as StatusOperacional || undefined,
        proximoAcompanhamento: proximoAcomp || null,
        anexos: anexos.length > 0 ? anexos : undefined,
      })
      onSaved()
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">Nova Interação de Cobrança</h2>
          <p className="text-xs text-gray-400 mt-0.5">Selecione um ou mais canais utilizados</p>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Canais (multi-select) */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Canais *</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CANAIS.map(c => {
                const ativo = canaisSel.has(c)
                const Ic = ICONE_CANAL[c]
                return (
                  <button key={c} onClick={() => toggleCanal(c)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border-2 transition-colors ${
                      ativo ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}>
                    <Ic className="h-3 w-3" />
                    {CANAL_LABEL[c]}
                    {ativo && <CheckCircle2 className="h-3 w-3 text-blue-500" />}
                  </button>
                )
              })}
            </div>
          </div>
          {/* Descrição */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Descrição *</label>
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              rows={3}
              placeholder="Descreva o que foi feito, dito ou acordado..."
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>
          {/* Resultado */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Resultado</label>
            <input
              value={resultado}
              onChange={e => setResultado(e.target.value)}
              placeholder="Ex: Cliente prometeu pagar até dia 30..."
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {/* Status resultante + Próximo acomp */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status Resultante</label>
              <select
                value={statusResultante}
                onChange={e => setStatusResultante(e.target.value as StatusOperacional | '')}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Manter atual</option>
                {STATUS_OP_LIST.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Próximo Acomp.</label>
              <input
                type="date"
                value={proximoAcomp}
                onChange={e => setProximoAcomp(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          {/* Upload de anexos */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Anexos</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-2 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors select-none ${
                dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <Upload className="h-5 w-5 mx-auto text-gray-400 mb-1" />
              <p className="text-xs text-gray-500">Arraste ou clique para anexar</p>
              <p className="text-xs text-gray-400">JPG, PNG, WebP, PDF · máx. 10 MB por arquivo</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={e => e.target.files && adicionarArquivos(e.target.files)}
              />
            </div>
            {arquivos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {arquivos.map((f, idx) => (
                  <div key={idx} className="relative group">
                    {previews[idx] ? (
                      <img src={previews[idx]} alt={f.name}
                        className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                    ) : (
                      <div className="h-16 w-16 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center gap-0.5">
                        <Paperclip className="h-5 w-5 text-red-400" />
                        <span className="text-xs text-red-500 font-medium">PDF</span>
                      </div>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); removerArquivo(idx) }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                    <p className="text-xs text-gray-400 mt-1 max-w-[64px] truncate text-center">{f.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {erro && <p className="text-xs text-red-600">{erro}</p>}
        </div>
        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={salvar} disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
            {saving ? (arquivos.length > 0 ? 'Enviando arquivos...' : 'Salvando...') : 'Registrar Interação'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: Nova Negociação
// ─────────────────────────────────────────────────────────────────────────────

const ModalNovaNegociacao: React.FC<{
  clienteId: number; empresaId: number; contasVencidas: ContaReceberResumo[]
  onClose: () => void; onSaved: () => void
}> = ({ clienteId, empresaId, contasVencidas, onClose, onSaved }) => {
  const [empresaResp, setEmpresaResp]   = useState<EmpresaResponsavel>('FRANCHISING')
  const [titulosSel, setTitulosSel]     = useState<Set<number>>(
    new Set(contasVencidas.map(c => c.solutto_id))
  )
  const [multaGlobal, setMultaGlobal]   = useState(10)
  const [taxaMensal, setTaxaMensal]     = useState(1.0)
  const [parcelas, setParcelas]         = useState(1)
  const [dataPrimeiraParcela, setData]  = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })
  const [obs, setObs]     = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro]   = useState('')

  const regra             = REGRAS_PARCELAMENTO[empresaResp]
  const titulosSelecionados = contasVencidas.filter(c => titulosSel.has(c.solutto_id))

  const toggleTitulo = (soluttoId: number) => setTitulosSel(prev => {
    const next = new Set(prev); next.has(soluttoId) ? next.delete(soluttoId) : next.add(soluttoId); return next
  })

  // Cálculo por título
  const perTitulo = titulosSelecionados.map(c => {
    const pJuros = calcJuros(taxaMensal, c.dias_atraso)
    const total  = calcTotalTitulo(c.valor_saldo, multaGlobal, pJuros)
    return { c, pJuros, total }
  })
  const valorOriginal       = titulosSelecionados.reduce((s, c) => s + c.valor_saldo, 0)
  const valorTotalCalc      = perTitulo.reduce((s, t) => s + t.total, 0)
  const valorParcelaCalc    = parcelas > 0 ? valorTotalCalc / parcelas : valorTotalCalc

  const salvar = async () => {
    if (titulosSel.size === 0) { setErro('Selecione ao menos um título'); return }
    setSaving(true)
    try {
      await criarNegociacao({
        empresaId, clienteId,
        empresaResponsavel:            empresaResp,
        valorOriginal:                 Math.round(valorOriginal * 100) / 100,
        percentualMulta:               multaGlobal,
        percentualJuros:               taxaMensal,
        quantidadeParcelas:            parcelas,
        dataVencimentoPrimeiraParcela: dataPrimeiraParcela,
        observacoesFinanceiras:        obs.trim() || undefined,
        valorTotalManual:              Math.round(valorTotalCalc * 100) / 100,
        titulosNegociados:             titulosSelecionados.map(c => ({
          solutto_id:       c.solutto_id,
          numero_documento: c.numero_documento,
          valor_original:   c.valor_original,
          valor_saldo:      c.valor_saldo,
          dias_atraso:      c.dias_atraso,
          data_vencimento:  c.data_vencimento,
        })),
      })
      onSaved()
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">Nova Negociação Financeira</h2>
          <p className="text-xs text-gray-400 mt-1">
            Selecione os títulos e defina as taxas — uma nova negociação ativa cancela a anterior
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Seleção de títulos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Títulos a Negociar *
              </label>
              <div className="flex gap-2 text-xs">
                <button onClick={() => setTitulosSel(new Set(contasVencidas.map(c => c.solutto_id)))}
                  className="text-blue-600 hover:underline">Todos</button>
                <span className="text-gray-300">·</span>
                <button onClick={() => setTitulosSel(new Set())}
                  className="text-gray-400 hover:underline">Nenhum</button>
              </div>
            </div>
            {contasVencidas.length === 0 ? (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-4 text-center">
                Nenhum título vencido encontrado para este cliente
              </p>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full text-xs divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 w-8" />
                      <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase">Cód. C.R.</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase">Referência</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase">Vencimento</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-500 uppercase">Saldo</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-500 uppercase">Atraso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {contasVencidas.map(c => {
                      const sel = titulosSel.has(c.solutto_id)
                      return (
                        <tr key={c.solutto_id} onClick={() => toggleTitulo(c.solutto_id)}
                          className={`cursor-pointer transition-colors ${sel ? 'bg-green-50/60' : 'hover:bg-gray-50'}`}>
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" readOnly checked={sel}
                              className="h-4 w-4 rounded border-gray-300 text-green-600 pointer-events-none" />
                          </td>
                          <td className="px-3 py-2 font-mono font-bold text-blue-700">{c.solutto_id}</td>
                          <td className="px-3 py-2 font-mono text-gray-500">{c.numero_documento ?? '—'}</td>
                          <td className="px-3 py-2 text-gray-600">{dtBR(c.data_vencimento)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-red-700">{R$(c.valor_saldo)}</td>
                          <td className="px-3 py-2 text-right text-orange-600">{c.dias_atraso}d</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Painel de taxas globais */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Taxas de Correção Monetária</p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Multa (%)</label>
                <input type="number" min="0" max="100" step="0.1" value={multaGlobal}
                  onChange={e => setMultaGlobal(parseFloat(e.target.value) || 0)}
                  className="w-24 text-right text-sm px-2 py-1.5 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Taxa de Juros (% ao mês)</label>
                <input type="number" min="0" max="100" step="0.01" value={taxaMensal}
                  onChange={e => setTaxaMensal(parseFloat(e.target.value) || 0)}
                  className="w-28 text-right text-sm px-2 py-1.5 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
              </div>
            </div>
            <div className="bg-white border border-amber-200 rounded-lg px-3 py-2">
              <p className="text-xs font-mono text-gray-600">
                Total = Base + (Base × {multaGlobal}%) + (Base × {taxaMensal}% ÷ 30 × dias em atraso)
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Juros: {taxaMensal}% ÷ 30 = {(taxaMensal / 30).toFixed(4)}%/dia × dias em atraso
              </p>
            </div>
          </div>

          {/* Cards por título */}
          {perTitulo.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Cálculo por Título ({perTitulo.length})
              </p>
              {perTitulo.map(({ c, pJuros, total }) => {
                const multaR = floor2(c.valor_saldo * multaGlobal / 100)
                const jurosR = floor2(c.valor_saldo * pJuros / 100)
                return (
                  <div key={c.solutto_id} className="border border-gray-200 rounded-xl bg-white overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-blue-700">{c.solutto_id}</span>
                        <span className="text-xs text-gray-500">{c.numero_documento ?? '—'}</span>
                      </div>
                      <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
                        {c.dias_atraso}d atraso
                      </span>
                    </div>
                    <div className="grid grid-cols-4 divide-x divide-gray-100">
                      <div className="px-4 py-3">
                        <p className="text-xs text-gray-400 mb-0.5">Base</p>
                        <p className="text-sm font-semibold text-gray-800">{R$(c.valor_saldo)}</p>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-xs text-gray-400 mb-0.5">+ Multa {multaGlobal}%</p>
                        <p className="text-sm font-semibold text-orange-600">+{R$(multaR)}</p>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-xs text-gray-400 mb-0.5">+ Juros {pJuros.toFixed(2)}%</p>
                        <p className="text-sm font-semibold text-blue-600">+{R$(jurosR)}</p>
                      </div>
                      <div className="px-4 py-3 bg-gray-50/50">
                        <p className="text-xs text-gray-400 mb-0.5">= Total</p>
                        <p className="text-base font-bold text-gray-900">{R$(total)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
              {/* Total geral */}
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-green-800">
                  {perTitulo.length} título{perTitulo.length !== 1 ? 's' : ''} — Total Geral da Proposta
                </p>
                <p className="text-lg font-bold text-green-700">{R$(valorTotalCalc)}</p>
              </div>
            </div>
          )}

          {/* Empresa responsável */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Empresa Responsável *</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {EMPRESAS_RESP.map(([v, l]) => (
                <button key={v} onClick={() => { setEmpresaResp(v); setParcelas(1) }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    empresaResp === v ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {l}
                </button>
              ))}
            </div>
            {!regra.permite && (
              <p className="text-xs text-amber-600 mt-1">⚠ {empresaResp} — somente pagamento à vista</p>
            )}
          </div>

          {/* Parcelas + Vencimento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">Parcelas</label>
              <select value={parcelas} onChange={e => setParcelas(parseInt(e.target.value))} disabled={!regra.permite}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-50 disabled:text-gray-400">
                {Array.from({ length: regra.max_parcelas }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}x {n > 1 ? `— ${R$(valorParcelaCalc)} cada` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Vencimento 1ª Parcela</label>
              <input type="date" value={dataPrimeiraParcela} onChange={e => setData(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-semibold text-gray-600">Observações Financeiras</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2}
              placeholder="Condições especiais, notas da negociação..."
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
          </div>

          {erro && <p className="text-xs text-red-600">{erro}</p>}
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={salvar} disabled={saving || titulosSel.size === 0}
            className="px-4 py-2 text-sm font-semibold text-white bg-green-700 hover:bg-green-800 rounded-lg disabled:opacity-50">
            {saving ? 'Criando acordo...' : `Criar Negociação (${titulosSel.size} CR — ${R$(valorTotalCalc)})`}
          </button>
        </div>
      </div>
    </div>
  )
}
