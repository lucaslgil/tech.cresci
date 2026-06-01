import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Plus, Search, Loader2, CheckCircle2, XCircle, AlertTriangle,
  ChevronRight, ChevronLeft, MessageCircle, Mail, Phone, Scale,
  Gavel, Eye, Clock, Users, Edit2, Trash2,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import {
  buscarClientesSolutto,
  sincronizarEListarContasVencidas,
  criarNotificacao,
  listarNotificacoes,
  atualizarNotificacao,
  deletarNotificacao,
} from './service'
import {
  CANAL_NOTIFICACAO_LABEL,
} from './types'
import type {
  ClienteSearchResult,
  ContaReceberResumo,
  CanalNotificacao,
  Notificacao,
} from './types'

// ─── Formatadores ─────────────────────────────────────────────────────────────

const R$ = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const dtBR = (s: string) =>
  new Date(s + (s.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('pt-BR')

const dtHoraBR = (s: string) =>
  new Date(s).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

// ─── Canais disponíveis para notificação ──────────────────────────────────────

const CANAIS_NOTIFICACAO: { id: CanalNotificacao; icone: React.ElementType; cor: string }[] = [
  { id: 'WHATSAPP',      icone: MessageCircle, cor: 'text-green-600' },
  { id: 'EMAIL',         icone: Mail,          cor: 'text-blue-600'  },
  { id: 'LIGACAO',       icone: Phone,         cor: 'text-purple-600'},
  { id: 'EXTRAJUDICIAL', icone: Scale,         cor: 'text-orange-600'},
  { id: 'JUDICIAL',      icone: Gavel,         cor: 'text-red-600'   },
]

// ─── Badges de canal ──────────────────────────────────────────────────────────

const CanalBadge: React.FC<{ canal: CanalNotificacao }> = ({ canal }) => {
  const cfg = CANAIS_NOTIFICACAO.find(c => c.id === canal)
  const Ic  = cfg?.icone ?? Bell
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
      <Ic className={`h-3 w-3 ${cfg?.cor ?? ''}`} />
      {CANAL_NOTIFICACAO_LABEL[canal]}
    </span>
  )
}

// ─── Linha editável de título na proposta ─────────────────────────────────────

interface TituloEdicao {
  conta: ContaReceberResumo
  valor_atual: number
  percentual_multa: number
  percentual_juros: number   // juros total já calculado (taxa_mensal × meses)
}

const floor2 = (v: number) => Math.floor(v * 100) / 100

// Trunca multa e juros separadamente (padrão bancário), depois soma
function calcularTotal(t: TituloEdicao): number {
  return t.valor_atual + floor2(t.valor_atual * t.percentual_multa / 100) + floor2(t.valor_atual * t.percentual_juros / 100)
}

// Retorna a taxa efetiva com precisão total — sem arredondar; exibição usa toFixed(4)
function calcularJurosDiario(taxaMensal: number, diasAtraso: number): number {
  return (taxaMensal / 30) * diasAtraso
}

// ─── MODAL: Incluir Notificação (3 passos) ────────────────────────────────────

type ModalStep = 'buscar' | 'contas' | 'proposta'

const ModalNovaNotificacao: React.FC<{
  empresaId: number
  onClose: () => void
  onSaved: () => void
}> = ({ empresaId, onClose, onSaved }) => {

  const [step, setStep]                   = useState<ModalStep>('buscar')
  const [busca, setBusca]                 = useState('')
  const [resultados, setResultados]       = useState<ClienteSearchResult[]>([])
  const [buscando, setBuscando]           = useState(false)
  const [clienteSel, setClienteSel]       = useState<ClienteSearchResult | null>(null)
  const [sincronizando, setSincronizando] = useState(false)
  const [contas, setContas]               = useState<ContaReceberResumo[]>([])
  const [contasErro, setContasErro]       = useState('')
  const [selecionadas, setSelecionadas]   = useState<Set<number>>(new Set())
  const [titulos, setTitulos]             = useState<TituloEdicao[]>([])
  const [canais, setCanais]               = useState<Set<CanalNotificacao>>(new Set())
  const [observacoes, setObservacoes]     = useState('')
  const [salvando, setSalvando]           = useState(false)
  const [salvoErro, setSalvoErro]         = useState('')

  // Padrões globais de correção (aplicados a todos os títulos)
  const [multaGlobal, setMultaGlobal]   = useState(10)    // 10% de multa
  const [taxaMensal, setTaxaMensal]     = useState(1.0)   // 1% ao mês (padrão bancário)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Step 1: busca de cliente ─────────────────────────────────────────────

  const handleBusca = (valor: string) => {
    setBusca(valor)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (valor.trim().length < 2) { setResultados([]); return }
    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      try {
        const res = await buscarClientesSolutto(valor, empresaId)
        setResultados(res)
      } catch { setResultados([]) }
      finally { setBuscando(false) }
    }, 350)
  }

  const selecionarCliente = async (c: ClienteSearchResult) => {
    setClienteSel(c)
    setResultados([])
    setContas([])
    setContasErro('')
    setSelecionadas(new Set())
    setStep('contas')
    setSincronizando(true)
    try {
      const vencidas = await sincronizarEListarContasVencidas(
        c.solutto_cliente_id,
        c.cliente_id,
        empresaId,
        c.cliente_nome,
        c.cliente_cpf_cnpj,
      )
      setContas(vencidas)
      // Pré-seleciona todos
      setSelecionadas(new Set(vencidas.map(v => v.solutto_id)))
    } catch (e: any) {
      setContasErro(e?.message ?? 'Erro ao carregar contas')
    } finally {
      setSincronizando(false)
    }
  }

  // ── Step 2: selecionar contas → montar proposta ───────────────────────────

  const irParaProposta = () => {
    const contasSelecionadas = contas.filter(c => selecionadas.has(c.solutto_id))
    setTitulos(
      contasSelecionadas.map(c => ({
        conta:            c,
        valor_atual:      c.valor_saldo,
        percentual_multa: multaGlobal,
        percentual_juros: calcularJurosDiario(taxaMensal, c.dias_atraso),
      }))
    )
    setStep('proposta')
  }

  // Recalcula todos os títulos com os valores globais atuais
  const recalcularTodos = () => {
    setTitulos(prev => prev.map(t => ({
      ...t,
      percentual_multa: multaGlobal,
      percentual_juros: calcularJurosDiario(taxaMensal, t.conta.dias_atraso),
    })))
  }

  // ── Step 3: edição de proposta ────────────────────────────────────────────

  const atualizarTitulo = (idx: number, campo: keyof Omit<TituloEdicao, 'conta'>, valor: number) => {
    setTitulos(prev => prev.map((t, i) => i === idx ? { ...t, [campo]: Math.max(0, valor) } : t))
  }

  const toggleCanal = (canal: CanalNotificacao) => {
    setCanais(prev => {
      const next = new Set(prev)
      next.has(canal) ? next.delete(canal) : next.add(canal)
      return next
    })
  }

  const totalGeral = useMemo(
    () => titulos.reduce((s, t) => s + calcularTotal(t), 0),
    [titulos]
  )

  const salvar = async () => {
    if (canais.size === 0) { setSalvoErro('Selecione ao menos um canal de envio.'); return }
    if (titulos.length === 0) { setSalvoErro('Nenhum título selecionado.'); return }
    setSalvando(true)
    setSalvoErro('')
    try {
      await criarNotificacao({
        empresaId,
        soluttoClienteId: clienteSel!.solutto_cliente_id,
        clienteId:        clienteSel!.cliente_id,
        clienteNome:      clienteSel!.cliente_nome,
        clienteCpfCnpj:   clienteSel!.cliente_cpf_cnpj,
        titulos: titulos.map(t => ({
          solutto_id:           t.conta.solutto_id,
          numero_documento:     t.conta.numero_documento,
          valor_original:       t.conta.valor_original,
          vencimento_original:  t.conta.data_vencimento.split('T')[0],
          valor_saldo_original: t.conta.valor_saldo,
          dias_atraso_original: t.conta.dias_atraso,
          valor_atual:          t.valor_atual,
          percentual_multa:     t.percentual_multa,
          percentual_juros:     t.percentual_juros,
          valor_total_calculado: calcularTotal(t),
        })),
        canais_enviados:  Array.from(canais),
        observacoes,
        multaGlobal:      multaGlobal,
        taxaMensalGlobal: taxaMensal,
      })
      onSaved()
    } catch (e: any) {
      setSalvoErro(e?.message ?? 'Erro ao salvar. Tente novamente.')
      setSalvando(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">

        {/* Header do modal */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-blue-100 rounded-xl p-2">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">Incluir Notificação de Cobrança</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {step === 'buscar'   && 'Passo 1 de 3 — Selecione o cliente'}
              {step === 'contas'   && 'Passo 2 de 3 — Títulos vencidos'}
              {step === 'proposta' && 'Passo 3 de 3 — Proposta de negociação'}
            </p>
          </div>
          {/* Indicadores de passo */}
          <div className="flex items-center gap-1.5">
            {(['buscar', 'contas', 'proposta'] as ModalStep[]).map((s, i) => (
              <div key={s} className={`h-2 w-2 rounded-full transition-colors ${step === s ? 'bg-blue-600' : 'bg-gray-200'}`} />
            ))}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* ── PASSO 1: Buscar cliente ────────────────────────────────────── */}
        {step === 'buscar' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                autoFocus
                value={busca}
                onChange={e => handleBusca(e.target.value)}
                placeholder="Digite o nome do franqueado / cliente..."
                className="w-full pl-9 pr-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {buscando && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 animate-spin" />
              )}
            </div>

            {resultados.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {resultados.map(r => (
                  <button
                    key={r.solutto_cliente_id}
                    onClick={() => selecionarCliente(r)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{r.cliente_nome}</p>
                      {r.cliente_cpf_cnpj && (
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{r.cliente_cpf_cnpj}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400" />
                  </button>
                ))}
              </div>
            )}

            {busca.length >= 2 && !buscando && resultados.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                <p className="text-sm">Nenhum cliente encontrado para "{busca}"</p>
                <p className="text-xs mt-1">Verifique se o cliente possui contas sincronizadas do Solutto</p>
              </div>
            )}

            {busca.length < 2 && (
              <div className="text-center py-8 text-gray-300">
                <Search className="h-10 w-10 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Digite ao menos 2 caracteres para buscar</p>
              </div>
            )}
          </div>
        )}

        {/* ── PASSO 2: Títulos vencidos ──────────────────────────────────── */}
        {step === 'contas' && (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Cliente selecionado */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-900">{clienteSel?.cliente_nome}</p>
                  {clienteSel?.cliente_cpf_cnpj && (
                    <p className="text-xs text-blue-500 font-mono">{clienteSel.cliente_cpf_cnpj}</p>
                  )}
                </div>
                <button
                  onClick={() => { setStep('buscar'); setClienteSel(null) }}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Trocar
                </button>
              </div>

              {/* Sincronizando */}
              {sincronizando && (
                <div className="flex items-center gap-3 text-sm text-gray-500 py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  Sincronizando contas com o Solutto...
                </div>
              )}

              {/* Erro */}
              {contasErro && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-700">{contasErro}</p>
                </div>
              )}

              {/* Sem contas vencidas */}
              {!sincronizando && !contasErro && contas.length === 0 && (
                <div className="text-center py-10">
                  <CheckCircle2 className="h-10 w-10 mx-auto text-green-300 mb-3" />
                  <p className="text-sm font-semibold text-gray-600">Nenhum título vencido encontrado</p>
                  <p className="text-xs text-gray-400 mt-1">Este cliente não possui contas em atraso no Solutto</p>
                </div>
              )}

              {/* Tabela de contas */}
              {!sincronizando && contas.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Títulos Vencidos ({contas.length})
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelecionadas(new Set(contas.map(c => c.solutto_id)))}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Todos
                      </button>
                      <span className="text-gray-300">·</span>
                      <button
                        onClick={() => setSelecionadas(new Set())}
                        className="text-xs text-gray-400 hover:underline"
                      >
                        Nenhum
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="min-w-full text-sm divide-y divide-gray-100">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2.5 w-8"></th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Cód. C.R.</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Referência</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Vencimento</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Valor Original</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Saldo</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Atraso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {contas.map(c => {
                          const sel = selecionadas.has(c.solutto_id)
                          return (
                            <tr
                              key={c.solutto_id}
                              onClick={() => setSelecionadas(prev => {
                                const next = new Set(prev)
                                sel ? next.delete(c.solutto_id) : next.add(c.solutto_id)
                                return next
                              })}
                              className={`cursor-pointer transition-colors ${sel ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                            >
                              <td className="px-3 py-2.5 text-center">
                                <input type="checkbox" readOnly checked={sel}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 pointer-events-none" />
                              </td>
                              <td className="px-3 py-2.5 font-mono text-xs font-bold text-blue-700">
                                {c.solutto_id}
                              </td>
                              <td className="px-3 py-2.5 font-mono text-xs text-gray-500">
                                {c.numero_documento ?? '—'}
                              </td>
                              <td className="px-3 py-2.5 text-xs text-gray-600">
                                {dtBR(c.data_vencimento)}
                              </td>
                              <td className="px-3 py-2.5 text-xs text-right text-gray-700">
                                {R$(c.valor_original)}
                              </td>
                              <td className="px-3 py-2.5 text-xs text-right font-semibold text-red-700">
                                {R$(c.valor_saldo)}
                              </td>
                              <td className="px-3 py-2.5 text-xs text-right text-orange-600">
                                {c.dias_atraso}d
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {selecionadas.size} de {contas.length} título{contas.length !== 1 ? 's' : ''} selecionado{selecionadas.size !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Footer passo 2 */}
            <div className="p-4 border-t border-gray-100 flex justify-between">
              <button
                onClick={() => setStep('buscar')}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </button>
              <button
                disabled={selecionadas.size === 0 || sincronizando}
                onClick={irParaProposta}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-40"
              >
                Continuar com {selecionadas.size} título{selecionadas.size !== 1 ? 's' : ''}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {/* ── PASSO 3: Proposta de negociação ───────────────────────────── */}
        {step === 'proposta' && (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Cliente resumo */}
              <div className="bg-gray-50 rounded-xl px-4 py-2.5 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">{clienteSel?.cliente_nome}</p>
                <button
                  onClick={() => setStep('contas')}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Alterar seleção
                </button>
              </div>

              {/* Painel de taxas + fórmula */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                  Taxas de Correção Monetária
                </p>

                {/* Inputs de taxa */}
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Multa (%)</label>
                    <input
                      type="number" min="0" max="100" step="0.1"
                      value={multaGlobal}
                      onChange={e => setMultaGlobal(parseFloat(e.target.value) || 0)}
                      className="w-24 text-right text-sm px-2 py-1.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Taxa de Juros (% ao mês)</label>
                    <input
                      type="number" min="0" max="100" step="0.01"
                      value={taxaMensal}
                      onChange={e => setTaxaMensal(parseFloat(e.target.value) || 0)}
                      className="w-28 text-right text-sm px-2 py-1.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    />
                  </div>
                  <button
                    onClick={recalcularTodos}
                    className="px-4 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-lg transition-colors"
                  >
                    Recalcular todos
                  </button>
                </div>

                {/* Fórmula explicada */}
                <div className="bg-white border border-blue-200 rounded-lg px-3 py-2.5 space-y-1">
                  <p className="text-xs font-semibold text-blue-800">Como o sistema calcula:</p>
                  <p className="text-xs text-gray-600 font-mono">
                    Total = Base + (Base × {multaGlobal}%) + (Base × {taxaMensal}% ÷ 30 × dias em atraso)
                  </p>
                  <div className="flex gap-4 text-xs text-gray-500 pt-1">
                    <span className="text-orange-600">● Multa: aplicada uma única vez sobre o valor base</span>
                    <span className="text-blue-600">● Juros: {taxaMensal}% ÷ 30 = {(taxaMensal / 30).toFixed(4)}%/dia × dias em atraso</span>
                  </div>
                </div>
              </div>

              {/* Títulos da proposta — um card por título */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Valores da Proposta ({titulos.length} título{titulos.length !== 1 ? 's' : ''})
                </p>

                {titulos.map((t, idx) => {
                  const multaR   = floor2(t.valor_atual * t.percentual_multa / 100)
                  const jurosR   = floor2(t.valor_atual * t.percentual_juros / 100)
                  const totalR   = calcularTotal(t)
                  return (
                    <div key={t.conta.solutto_id}
                      className="border border-gray-200 rounded-xl bg-white overflow-hidden">

                      {/* Cabeçalho do card */}
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-blue-700">{t.conta.solutto_id}</span>
                          <span className="text-xs text-gray-500 truncate max-w-xs">
                            {t.conta.numero_documento ?? '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>Venc. {dtBR(t.conta.data_vencimento)}</span>
                          <span className="bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
                            {t.conta.dias_atraso}d atraso
                          </span>
                        </div>
                      </div>

                      {/* Cálculo em linha */}
                      <div className="grid grid-cols-4 divide-x divide-gray-100">

                        {/* Base */}
                        <div className="px-4 py-3">
                          <p className="text-xs text-gray-400 mb-0.5">Base</p>
                          <p className="text-sm font-semibold text-gray-800">{R$(t.valor_atual)}</p>
                        </div>

                        {/* Multa */}
                        <div className="px-4 py-3">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-xs text-gray-400">+ Multa</p>
                            <input
                              type="number" min="0" max="100" step="0.1"
                              value={t.percentual_multa}
                              onChange={e => atualizarTitulo(idx, 'percentual_multa', parseFloat(e.target.value) || 0)}
                              className="w-14 text-right text-xs px-1.5 py-0.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-400"
                            />
                            <span className="text-xs text-gray-400">%</span>
                          </div>
                          <p className="text-sm font-semibold text-orange-600">+{R$(multaR)}</p>
                        </div>

                        {/* Juros */}
                        <div className="px-4 py-3">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-xs text-gray-400">+ Juros</p>
                            <input
                              type="number" min="0" max="100" step="0.0001"
                              value={parseFloat(t.percentual_juros.toFixed(4))}
                              onChange={e => atualizarTitulo(idx, 'percentual_juros', parseFloat(e.target.value) || 0)}
                              className="w-16 text-right text-xs px-1.5 py-0.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                            <span className="text-xs text-gray-400">%</span>
                          </div>
                          <p className="text-sm font-semibold text-blue-600">+{R$(jurosR)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {taxaMensal}%÷30×{t.conta.dias_atraso}d
                          </p>
                        </div>

                        {/* Total */}
                        <div className="px-4 py-3 bg-gray-50/50">
                          <p className="text-xs text-gray-400 mb-0.5">= Total</p>
                          <p className="text-base font-bold text-gray-900">{R$(totalR)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Rodapé geral */}
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <p className="text-sm font-semibold text-blue-800">{titulos.length} título{titulos.length !== 1 ? 's' : ''} — Total Geral da Proposta</p>
                  <p className="text-lg font-bold text-blue-700">{R$(totalGeral)}</p>
                </div>
              </div>

              {/* Canais de envio */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Notificação Enviada Via *
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CANAIS_NOTIFICACAO.map(({ id, icone: Ic, cor }) => {
                    const ativo = canais.has(id)
                    return (
                      <label
                        key={id}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          ativo
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={ativo}
                          onChange={() => toggleCanal(id)}
                          className="sr-only"
                        />
                        <Ic className={`h-4 w-4 flex-shrink-0 ${ativo ? cor : 'text-gray-400'}`} />
                        <span className={`text-xs font-medium ${ativo ? 'text-gray-900' : 'text-gray-500'}`}>
                          {CANAL_NOTIFICACAO_LABEL[id]}
                        </span>
                        {ativo && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 ml-auto flex-shrink-0" />}
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Observações Internas
                </label>
                <textarea
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  rows={3}
                  placeholder="Detalhes adicionais, contexto da negociação, próximos passos..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>

              {salvoErro && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  {salvoErro}
                </div>
              )}
            </div>

            {/* Footer passo 3 */}
            <div className="p-4 border-t border-gray-100 flex justify-between">
              <button
                onClick={() => setStep('contas')}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="inline-flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                {salvando ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> Registrar Notificação</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── MODAL: Confirmar Exclusão ────────────────────────────────────────────────

const ModalConfirmarExclusao: React.FC<{
  notificacao: Notificacao
  onClose: () => void
  onConfirmed: () => void
}> = ({ notificacao, onClose, onConfirmed }) => {
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro]           = useState('')

  const confirmar = async () => {
    setExcluindo(true)
    setErro('')
    try {
      await deletarNotificacao(notificacao.id)
      onConfirmed()
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao excluir. Tente novamente.')
      setExcluindo(false)
    }
  }

  const qtdTitulos  = (notificacao.titulos ?? []).length
  const dtFormatada = new Date(notificacao.data_notificacao).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-5 border-b border-red-100 flex items-center gap-3">
          <div className="bg-red-100 rounded-xl p-2">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Excluir Notificação</h2>
            <p className="text-xs text-gray-400 mt-0.5">Esta ação não pode ser desfeita</p>
          </div>
        </div>

        {/* Corpo */}
        <div className="p-5 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-red-900">{notificacao.cliente_nome}</p>
            {notificacao.cliente_cpf_cnpj && (
              <p className="text-xs font-mono text-red-700">{notificacao.cliente_cpf_cnpj}</p>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-red-700 pt-1">
              <span>{qtdTitulos} título{qtdTitulos !== 1 ? 's' : ''} vinculado{qtdTitulos !== 1 ? 's' : ''}</span>
              <span>·</span>
              <span>{dtFormatada}</span>
            </div>
          </div>

          <p className="text-sm text-gray-700">
            Tem certeza que deseja excluir esta notificação?{' '}
            <span className="font-semibold">Todos os títulos vinculados também serão removidos.</span>
          </p>

          {erro && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {erro}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={excluindo}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={excluindo}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
          >
            {excluindo
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Excluindo...</>
              : <><Trash2 className="h-4 w-4" /> Sim, excluir</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MODAL: Editar Notificação ────────────────────────────────────────────────

const ModalEditarNotificacao: React.FC<{
  notificacao: Notificacao
  onClose: () => void
  onSaved: () => void
}> = ({ notificacao, onClose, onSaved }) => {
  const [canais, setCanais]       = useState<Set<CanalNotificacao>>(new Set(notificacao.canais_enviados))
  const [observacoes, setObs]     = useState(notificacao.observacoes ?? '')
  const [status, setStatus]       = useState(notificacao.status)
  const [salvando, setSalvando]   = useState(false)
  const [erro, setErro]           = useState('')

  const toggleCanal = (c: CanalNotificacao) => setCanais(prev => {
    const next = new Set(prev)
    next.has(c) ? next.delete(c) : next.add(c)
    return next
  })

  const salvar = async () => {
    if (canais.size === 0) { setErro('Selecione ao menos um canal.'); return }
    setSalvando(true)
    setErro('')
    try {
      await atualizarNotificacao(notificacao.id, {
        canais_enviados: Array.from(canais),
        observacoes:     observacoes.trim() || null,
        status,
      })
      onSaved()
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao salvar.')
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
          <div className="bg-blue-100 rounded-xl p-2">
            <Edit2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">Editar Notificação #{notificacao.id}</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{notificacao.cliente_nome}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Títulos vinculados (somente leitura) */}
          {(notificacao.titulos ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Títulos desta Notificação
              </p>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full text-xs divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Cód. C.R.</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Referência</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-500">Valor Calc.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {(notificacao.titulos ?? []).map(t => (
                      <tr key={t.id}>
                        <td className="px-3 py-2 font-mono font-bold text-blue-700">{t.solutto_id}</td>
                        <td className="px-3 py-2 font-mono text-gray-500">{t.numero_documento ?? '—'}</td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {t.valor_total_calculado != null
                            ? new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(t.valor_total_calculado)
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Canais */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Canais Enviados *
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CANAIS_NOTIFICACAO.map(({ id, icone: Ic, cor }) => {
                const ativo = canais.has(id)
                return (
                  <label key={id}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      ativo ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                    <input type="checkbox" checked={ativo} onChange={() => toggleCanal(id)} className="sr-only" />
                    <Ic className={`h-4 w-4 flex-shrink-0 ${ativo ? cor : 'text-gray-400'}`} />
                    <span className={`text-xs font-medium ${ativo ? 'text-gray-900' : 'text-gray-500'}`}>
                      {CANAL_NOTIFICACAO_LABEL[id]}
                    </span>
                    {ativo && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 ml-auto flex-shrink-0" />}
                  </label>
                )
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as Notificacao['status'])}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="REGISTRADA">Registrada</option>
              <option value="PENDENTE_GIRABOT">Pendente Girabot</option>
              <option value="EXPORTADA_GIRABOT">Exportada Girabot</option>
              <option value="RESPONDIDA">Respondida</option>
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
              Observações Internas
            </label>
            <textarea
              value={observacoes}
              onChange={e => setObs(e.target.value)}
              rows={3}
              placeholder="Detalhes adicionais, contexto..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          {erro && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {erro}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={salvar} disabled={salvando}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
            {salvando ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : <><CheckCircle2 className="h-4 w-4" /> Salvar Alterações</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── STATUS DA NOTIFICAÇÃO ────────────────────────────────────────────────────

const STATUS_NOTIF_LABEL: Record<Notificacao['status'], string> = {
  REGISTRADA:         'Registrada',
  PENDENTE_GIRABOT:   'Pend. Girabot',
  EXPORTADA_GIRABOT:  'Exportada',
  RESPONDIDA:         'Respondida',
}
const STATUS_NOTIF_COLOR: Record<Notificacao['status'], string> = {
  REGISTRADA:         'bg-blue-100 text-blue-700',
  PENDENTE_GIRABOT:   'bg-yellow-100 text-yellow-700',
  EXPORTADA_GIRABOT:  'bg-green-100 text-green-700',
  RESPONDIDA:         'bg-gray-100 text-gray-600',
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export const GestaoCobranca: React.FC = () => {
  const navigate = useNavigate()

  const [empresaId, setEmpresaId]         = useState<number | null>(null)
  const [notificacoes, setNotificacoes]   = useState<Notificacao[]>([])
  const [loading, setLoading]             = useState(true)
  const [modalAberto, setModalAberto]     = useState(false)
  const [editando, setEditando]           = useState<Notificacao | null>(null)
  const [excluindo, setExcluindo]         = useState<Notificacao | null>(null)
  const [busca, setBusca]                 = useState('')

  // ── Carrega empresa ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', session.user.id)
        .single()
      if (data) setEmpresaId(data.empresa_id)
    })
  }, [])

  // ── Carrega notificações ─────────────────────────────────────────────────
  const carregar = useCallback(async (id: number) => {
    try {
      const data = await listarNotificacoes(id)
      setNotificacoes(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (empresaId) carregar(empresaId)
  }, [empresaId, carregar])

  // ── Filtro de busca ──────────────────────────────────────────────────────
  const lista = useMemo(() => {
    if (!busca.trim()) return notificacoes
    const q = busca.toLowerCase()
    return notificacoes.filter(n =>
      n.cliente_nome.toLowerCase().includes(q) ||
      (n.cliente_cpf_cnpj ?? '').includes(q.replace(/\D/g, ''))
    )
  }, [notificacoes, busca])

  // ── Stats ────────────────────────────────────────────────────────────────
  const hoje = new Date().toISOString().split('T')[0]
  const stats = useMemo(() => {
    const totalHoje    = notificacoes.filter(n => n.data_notificacao.startsWith(hoje)).length
    const totalMes     = notificacoes.filter(n => n.data_notificacao.startsWith(hoje.slice(0, 7))).length
    const totalGeral   = notificacoes.length
    const clientesUniq = new Set(notificacoes.map(n => n.solutto_cliente_id)).size
    return { totalHoje, totalMes, totalGeral, clientesUniq }
  }, [notificacoes, hoje])

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Cobranças</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Registro de notificações enviadas a franqueados / clientes inadimplentes
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition-colors"
        >
          <Plus className="h-4 w-4" />
          Incluir Notificação
        </button>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Notificações Hoje',    valor: stats.totalHoje,    sub: 'registradas hoje',       cor: 'border-blue-100'   },
          { label: 'Este Mês',             valor: stats.totalMes,     sub: 'no mês atual',           cor: 'border-purple-100' },
          { label: 'Total Registradas',    valor: stats.totalGeral,   sub: 'desde o início',         cor: 'border-gray-100'   },
          { label: 'Clientes Notificados', valor: stats.clientesUniq, sub: 'franqueados distintos',  cor: 'border-orange-100' },
        ].map(({ label, valor, sub, cor }) => (
          <div key={label} className={`bg-white rounded-2xl border ${cor} p-5`}>
            <p className="text-3xl font-bold text-gray-900">{valor}</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tabela de notificações ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

        {/* Filtros */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou CPF/CNPJ..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <span className="text-xs text-gray-400 ml-auto">
            {lista.length} notificaç{lista.length !== 1 ? 'ões' : 'ão'}
          </span>
        </div>

        {/* Empty state */}
        {!loading && lista.length === 0 && (
          <div className="text-center py-16 px-6">
            <Bell className="mx-auto h-12 w-12 text-gray-200 mb-4" />
            <p className="text-base font-semibold text-gray-600">
              {notificacoes.length === 0
                ? 'Nenhuma notificação registrada'
                : 'Nenhum resultado para o filtro aplicado'}
            </p>
            <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
              {notificacoes.length === 0
                ? 'Clique em "Incluir Notificação" para registrar a primeira notificação de cobrança.'
                : 'Ajuste os filtros para ver mais resultados.'}
            </p>
            {notificacoes.length === 0 && (
              <button
                onClick={() => setModalAberto(true)}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                <Plus className="h-4 w-4" />
                Incluir Notificação
              </button>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Tabela */}
        {!loading && lista.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-50 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Canais Enviados</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Títulos</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Proposta</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Data</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lista.map((n, idx) => {
                  const totalProposta = (n.titulos ?? []).reduce(
                    (s, t) => s + (t.valor_total_calculado ?? t.valor_atual ?? t.valor_original),
                    0
                  )
                  return (
                    <tr key={n.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-blue-50/20 transition-colors`}>

                      {/* Cliente */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-gray-900">{n.cliente_nome}</div>
                        {n.cliente_cpf_cnpj && (
                          <div className="text-xs text-gray-400 font-mono mt-0.5">{n.cliente_cpf_cnpj}</div>
                        )}
                      </td>

                      {/* Canais */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {n.canais_enviados.map(c => <CanalBadge key={c} canal={c} />)}
                        </div>
                      </td>

                      {/* Títulos */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {(n.titulos ?? []).length} título{(n.titulos ?? []).length !== 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* Total proposta */}
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-800">
                        {totalProposta > 0 ? R$(totalProposta) : '—'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_NOTIF_COLOR[n.status]}`}>
                          {STATUS_NOTIF_LABEL[n.status]}
                        </span>
                      </td>

                      {/* Data */}
                      <td className="px-4 py-3.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {dtHoraBR(n.data_notificacao)}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditando(n)}
                            title="Editar notificação"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-3 w-3" />
                            Editar
                          </button>
                          {n.cliente_id && (
                            <button
                              onClick={() => navigate(`/financeiro/cobranca/${n.cliente_id}`)}
                              title="Ver histórico completo do cliente"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                            >
                              <Eye className="h-3 w-3" />
                              Histórico
                            </button>
                          )}
                          <button
                            onClick={() => setExcluindo(n)}
                            title="Excluir notificação"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Nova notificação ──────────────────────────────────────── */}
      {modalAberto && empresaId && (
        <ModalNovaNotificacao
          empresaId={empresaId}
          onClose={() => setModalAberto(false)}
          onSaved={() => {
            setModalAberto(false)
            if (empresaId) carregar(empresaId)
          }}
        />
      )}

      {/* ── Modal: Editar notificação ─────────────────────────────────────── */}
      {editando && (
        <ModalEditarNotificacao
          notificacao={editando}
          onClose={() => setEditando(null)}
          onSaved={() => {
            setEditando(null)
            if (empresaId) carregar(empresaId)
          }}
        />
      )}

      {/* ── Confirmação de exclusão ───────────────────────────────────────── */}
      {excluindo && (
        <ModalConfirmarExclusao
          notificacao={excluindo}
          onClose={() => setExcluindo(null)}
          onConfirmed={() => {
            setExcluindo(null)
            if (empresaId) carregar(empresaId)
          }}
        />
      )}
    </div>
  )
}
