// =====================================================
// RELATÓRIOS FINANCEIROS
// Hub de relatórios + Contas a Receber Solutto com filtros
// Data: 19/05/2026
// =====================================================

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  FileText, Search, Loader2, AlertCircle, DollarSign,
  RefreshCw, Filter, BarChart3, TrendingDown, Clock,
  ArrowLeft, ChevronUp, ChevronDown, ChevronsUpDown, X,
} from 'lucide-react'
import { listarClientes } from '../clientes/services'
import type { Cliente } from '../clientes/types'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// =====================================================
// TIPOS
// =====================================================

interface ContaReceberSolutto {
  solutto_id: number
  numero_documento: string
  descricao: string
  data_emissao: string
  data_vencimento: string
  data_pagamento: string
  valor_original: number
  valor_pago: number
  valor_saldo: number
  status: string
  forma_pagamento: string
  observacoes: string
  dados_extras: Record<string, string>
}

interface ContaComCliente extends ContaReceberSolutto {
  cliente_nome: string
  cliente_id: number
}

type ClienteComSolutto = Cliente & { solutto_cliente_id?: number }
type StatusKey = 'aberto' | 'parcial' | 'quitada'
type Tela = 'hub' | 'report'

// =====================================================
// HELPERS
// =====================================================

const fmt$ = (v: number | null | undefined) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '—'
  try {
    const [y, m, day] = d.split('T')[0].split('-')
    return `${day}/${m}/${y}`
  } catch { return d }
}

function getStatusKey(c: ContaReceberSolutto): StatusKey {
  if (c.status === '1' || (c.data_pagamento && c.valor_saldo <= 0)) return 'quitada'
  if (c.data_pagamento && c.valor_saldo > 0) return 'parcial'
  return 'aberto'
}

const STATUS_CONFIG: Record<StatusKey, { label: string; cor: string }> = {
  aberto:  { label: 'Em Aberto', cor: 'bg-red-100 text-red-800' },
  parcial: { label: 'Parcial',   cor: 'bg-yellow-100 text-yellow-800' },
  quitada: { label: 'Quitada',   cor: 'bg-green-100 text-green-800' },
}

function compareVal(a: unknown, b: unknown, dir: 'asc' | 'desc'): number {
  const m = dir === 'asc' ? 1 : -1
  if (a == null && b == null) return 0
  if (a == null) return 1 * m
  if (b == null) return -1 * m
  if (typeof a === 'number' && typeof b === 'number') return (a - b) * m
  return String(a).localeCompare(String(b), 'pt-BR') * m
}

// =====================================================
// RELATÓRIOS DISPONÍVEIS (hub)
// =====================================================

const RELATORIOS = [
  {
    id: 'contas_receber_solutto',
    titulo: 'Contas a Receber — Solutto',
    descricao: 'Consulta completa das contas a receber de um ou mais clientes via webservice Solutto, com filtros avançados.',
    icone: DollarSign,
    ativo: true,
    cor: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5',
    corIcone: 'bg-emerald-100 text-emerald-700',
    corLink: 'text-emerald-700',
  },
  {
    id: 'contas_pagar_solutto',
    titulo: 'Contas a Pagar — Solutto',
    descricao: 'Consulta de contas a pagar integrada ao sistema Solutto.',
    icone: TrendingDown,
    ativo: false,
    cor: 'bg-slate-50 border-slate-200',
    corIcone: 'bg-slate-100 text-slate-400',
    corLink: '',
  },
  {
    id: 'extrato_periodo',
    titulo: 'Extrato por Período',
    descricao: 'Extrato financeiro consolidado com entradas e saídas por período.',
    icone: BarChart3,
    ativo: false,
    cor: 'bg-slate-50 border-slate-200',
    corIcone: 'bg-slate-100 text-slate-400',
    corLink: '',
  },
  {
    id: 'inadimplencia',
    titulo: 'Análise de Inadimplência',
    descricao: 'Relatório de clientes inadimplentes com ranking e histórico de cobrança.',
    icone: Clock,
    ativo: false,
    cor: 'bg-slate-50 border-slate-200',
    corIcone: 'bg-slate-100 text-slate-400',
    corLink: '',
  },
]

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export const RelatoriosFinanceiros: React.FC = () => {
  const [tela, setTela] = useState<Tela>('hub')

  // ── Multi-select de clientes
  const [busca, setBusca] = useState('')
  const [sugestoes, setSugestoes] = useState<ClienteComSolutto[]>([])
  const [selecionados, setSelecionados] = useState<ClienteComSolutto[]>([])
  const [showSugestoes, setShowSugestoes] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ── Filtros
  const [statusFiltro,   setStatusFiltro]   = useState<StatusKey[]>([])
  const [dataVencDe,     setDataVencDe]     = useState('')
  const [dataVencAte,    setDataVencAte]    = useState('')
  const [dataEmissaoDe,  setDataEmissaoDe]  = useState('')
  const [dataEmissaoAte, setDataEmissaoAte] = useState('')
  const [formaPgto,      setFormaPgto]      = useState('')
  const [valorMin,       setValorMin]       = useState('')
  const [valorMax,       setValorMax]       = useState('')

  // ── Dados brutos (todos os clientes, sem filtros locais)
  const [bruto,      setBruto]      = useState<ContaComCliente[] | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [progresso,  setProgresso]  = useState<{ atual: number; total: number; nome: string } | null>(null)
  const [erro,       setErro]       = useState<string | null>(null)

  // ── Ordenação
  const [sort, setSort] = useState<{ col: string; dir: 'asc' | 'desc' }>({
    col: 'data_vencimento', dir: 'asc',
  })

  // ── Busca de clientes com debounce
  useEffect(() => {
    if (busca.length < 2) { setSugestoes([]); setShowSugestoes(false); return }
    const t = setTimeout(async () => {
      const res = await listarClientes({ busca })
      if (res.data) {
        const filtered = (res.data as ClienteComSolutto[])
          .filter(c => !selecionados.find(s => s.id === c.id))
          .slice(0, 8)
        setSugestoes(filtered)
        setShowSugestoes(true)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [busca, selecionados])

  // ── Fechar dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSugestoes(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const addCliente = (c: ClienteComSolutto) => {
    setSelecionados(prev => [...prev, c])
    setBusca('')
    setSugestoes([])
    setShowSugestoes(false)
  }

  const removeCliente = (id: number) =>
    setSelecionados(prev => prev.filter(c => c.id !== id))

  const toggleStatus = (s: StatusKey) =>
    setStatusFiltro(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const limparFiltros = () => {
    setStatusFiltro([])
    setDataVencDe(''); setDataVencAte('')
    setDataEmissaoDe(''); setDataEmissaoAte('')
    setFormaPgto(''); setValorMin(''); setValorMax('')
  }

  // ── Consultar Solutto (um cliente por vez, combina resultados)
  const handleConsultar = async () => {
    if (selecionados.length === 0) { setErro('Selecione pelo menos um cliente.'); return }
    const semSolutto = selecionados.filter(c => !(c as any).solutto_cliente_id)
    if (semSolutto.length > 0) {
      setErro(`Clientes sem vínculo Solutto: ${semSolutto.map(c => c.nome_completo || c.razao_social).join(', ')}`)
      return
    }

    setCarregando(true)
    setErro(null)
    setBruto(null)

    const todas: ContaComCliente[] = []

    for (let i = 0; i < selecionados.length; i++) {
      const cliente = selecionados[i]
      const soluttoId = (cliente as any).solutto_cliente_id as number
      const nome = cliente.nome_completo || cliente.razao_social || `#${cliente.id}`

      setProgresso({ atual: i + 1, total: selecionados.length, nome })

      try {
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/solutto-contas-receber`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ solutto_cliente_id: soluttoId }),
        })
        if (!resp.ok) {
          const text = await resp.text().catch(() => '')
          throw new Error(`Erro em "${nome}": ${resp.status}${text ? ' — ' + text.slice(0, 120) : ''}`)
        }
        const json = await resp.json() as { contas: ContaReceberSolutto[]; error?: string }
        if (json.error) throw new Error(json.error)
        for (const c of (json.contas || [])) {
          todas.push({ ...c, cliente_nome: nome, cliente_id: cliente.id })
        }
      } catch (e: any) {
        setErro(e.message || 'Erro desconhecido')
        setCarregando(false)
        setProgresso(null)
        return
      }
    }

    setBruto(todas)
    setCarregando(false)
    setProgresso(null)
  }

  // ── Clique no cabeçalho de coluna
  const handleSort = (col: string) =>
    setSort(prev => ({ col, dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc' }))

  // Helper: renderiza <th> ordenável
  const thSort = (col: string, label: string, alignRight = false) => (
    <th
      onClick={() => handleSort(col)}
      className={`px-3 py-2.5 text-xs font-semibold text-white whitespace-nowrap cursor-pointer select-none hover:bg-white/10 transition-colors ${alignRight ? 'text-right' : 'text-left'}`}
    >
      <div className={`flex items-center gap-1 ${alignRight ? 'justify-end' : ''}`}>
        {label}
        {sort.col === col
          ? sort.dir === 'asc'
            ? <ChevronUp className="w-3 h-3 flex-shrink-0" />
            : <ChevronDown className="w-3 h-3 flex-shrink-0" />
          : <ChevronsUpDown className="w-3 h-3 flex-shrink-0 opacity-40" />
        }
      </div>
    </th>
  )

  // ── Filtros locais + ordenação (memo)
  const contasExibidas = useMemo(() => {
    if (!bruto) return null
    const statusOrder: Record<StatusKey, number> = { aberto: 0, parcial: 1, quitada: 2 }

    let data = bruto.filter(c => {
      const sk = getStatusKey(c)
      if (statusFiltro.length > 0 && !statusFiltro.includes(sk)) return false
      const dvenc = c.data_vencimento?.split('T')[0] ?? ''
      const demis = c.data_emissao?.split('T')[0]    ?? ''
      if (dataVencDe     && dvenc && dvenc < dataVencDe)     return false
      if (dataVencAte    && dvenc && dvenc > dataVencAte)    return false
      if (dataEmissaoDe  && demis && demis < dataEmissaoDe)  return false
      if (dataEmissaoAte && demis && demis > dataEmissaoAte) return false
      if (formaPgto && !(c.forma_pagamento || '').toLowerCase().includes(formaPgto.toLowerCase())) return false
      if (valorMin && c.valor_original < parseFloat(valorMin)) return false
      if (valorMax && c.valor_original > parseFloat(valorMax)) return false
      return true
    })

    data = [...data].sort((a, b) => {
      if (sort.col === 'status_key')
        return compareVal(statusOrder[getStatusKey(a)], statusOrder[getStatusKey(b)], sort.dir)
      return compareVal((a as any)[sort.col], (b as any)[sort.col], sort.dir)
    })
    return data
  }, [bruto, statusFiltro, dataVencDe, dataVencAte, dataEmissaoDe, dataEmissaoAte, formaPgto, valorMin, valorMax, sort])

  const resumo = useMemo(() => {
    if (!contasExibidas || contasExibidas.length === 0) return null
    return {
      total:         contasExibidas.length,
      valorTotal:    contasExibidas.reduce((s, c) => s + (c.valor_original || 0), 0),
      valorRecebido: contasExibidas.reduce((s, c) => s + (c.valor_pago     || 0), 0),
      valorSaldo:    contasExibidas.reduce((s, c) => s + (c.valor_saldo    || 0), 0),
    }
  }, [contasExibidas])

  const multiCliente = selecionados.length > 1

  // ════════════════════════════════════════════════
  // TELA 1 — HUB DE RELATÓRIOS
  // ════════════════════════════════════════════════

  if (tela === 'hub') {
    return (
      <div className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">

        <div className="bg-white border-b mb-6 -mx-3 sm:-mx-4 md:-mx-6 -mt-3 sm:-mt-4 md:-mt-6 px-3 sm:px-4 md:px-6 pt-4 pb-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-800">Relatórios Financeiros</h1>
              <p className="text-xs text-slate-500">Selecione o relatório desejado</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RELATORIOS.map(r => (
            <div
              key={r.id}
              onClick={() => r.ativo && setTela('report')}
              className={`relative border rounded-xl p-4 transition-all duration-150 ${r.cor} ${r.ativo ? 'cursor-pointer' : 'opacity-55 cursor-not-allowed'}`}
            >
              {!r.ativo && (
                <span className="absolute top-3 right-3 text-xs font-medium px-2 py-0.5 bg-white/80 text-slate-500 rounded-full border border-slate-200">
                  Em breve
                </span>
              )}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 flex-shrink-0 ${r.corIcone}`}>
                <r.icone className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">{r.titulo}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{r.descricao}</p>
              {r.ativo && (
                <p className={`mt-3 text-xs font-semibold ${r.corLink}`}>Abrir relatório →</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════
  // TELA 2 — CONTAS A RECEBER SOLUTTO
  // ════════════════════════════════════════════════

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">

      {/* Cabeçalho com botão voltar */}
      <div className="bg-white border-b mb-5 -mx-3 sm:-mx-4 md:-mx-6 -mt-3 sm:-mt-4 md:-mt-6 px-3 sm:px-4 md:px-6 pt-4 pb-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setTela('hub'); setBruto(null); setErro(null) }}
            className="p-1.5 rounded-md hover:bg-slate-100 transition-colors flex-shrink-0"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
            <DollarSign className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-800">Contas a Receber — Solutto</h1>
            <p className="text-xs text-slate-500">Relatórios Financeiros · Webservice Solutto</p>
          </div>
        </div>
      </div>

      {/* ── PAINEL DE FILTROS ───────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Filter className="w-4 h-4 flex-shrink-0" />
          Filtros da Consulta
        </h2>

        <div className="space-y-4">

          {/* Multi-select de clientes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Clientes <span className="text-slate-400 font-normal">(um ou mais)</span>
            </label>
            <div className="border border-slate-300 rounded-lg p-2 min-h-[44px] flex flex-wrap gap-1.5 items-center focus-within:ring-2 focus-within:ring-slate-400 transition-shadow">
              {selecionados.map(c => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-white flex-shrink-0"
                  style={{ backgroundColor: '#394353' }}
                >
                  <span className="max-w-[160px] truncate">{c.nome_completo || c.razao_social}</span>
                  <button
                    onClick={() => removeCliente(c.id)}
                    className="ml-0.5 hover:text-red-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <div className="relative flex-1 min-w-[180px]" ref={dropdownRef}>
                <input
                  type="text"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  onFocus={() => busca.length >= 2 && setShowSugestoes(true)}
                  placeholder={selecionados.length === 0 ? 'Digite para buscar clientes...' : 'Adicionar mais...'}
                  className="w-full text-sm outline-none placeholder:text-slate-400 bg-transparent py-0.5"
                />

                {showSugestoes && sugestoes.length > 0 && (
                  <div className="absolute top-full left-0 z-50 w-80 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                    {sugestoes.map(c => {
                      const temSolutto = !!(c as any).solutto_cliente_id
                      return (
                        <button
                          key={c.id}
                          onClick={() => addCliente(c)}
                          disabled={!temSolutto}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
                        >
                          <span className="font-medium text-slate-800 truncate mr-2">
                            {c.nome_completo || c.razao_social || `#${c.id}`}
                          </span>
                          {temSolutto ? (
                            <span className="flex-shrink-0 text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                              Solutto #{(c as any).solutto_cliente_id}
                            </span>
                          ) : (
                            <span className="flex-shrink-0 text-xs px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-full">
                              Sem vínculo
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            {selecionados.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">
                Apenas clientes com vínculo Solutto podem ser consultados
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
            <div className="flex flex-wrap items-center gap-3">
              {(Object.entries(STATUS_CONFIG) as [StatusKey, { label: string; cor: string }][]).map(([key, cfg]) => (
                <label key={key} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={statusFiltro.includes(key)}
                    onChange={() => toggleStatus(key)}
                    className="w-4 h-4 rounded border-slate-300 focus:ring-slate-500"
                  />
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cor}`}>
                    {cfg.label}
                  </span>
                </label>
              ))}
              {statusFiltro.length === 0 && <span className="text-xs text-slate-400">(todos)</span>}
              {statusFiltro.length > 0 && (
                <button onClick={() => setStatusFiltro([])} className="text-xs text-slate-400 hover:text-slate-600 underline">
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Vencimento De</label>
              <input type="date" value={dataVencDe} onChange={e => setDataVencDe(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Vencimento Até</label>
              <input type="date" value={dataVencAte} onChange={e => setDataVencAte(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Emissão De</label>
              <input type="date" value={dataEmissaoDe} onChange={e => setDataEmissaoDe(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Emissão Até</label>
              <input type="date" value={dataEmissaoAte} onChange={e => setDataEmissaoAte(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
          </div>

          {/* Valor e forma de pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Valor Mínimo (R$)</label>
              <input
                type="number" min="0" step="0.01"
                value={valorMin} onChange={e => setValorMin(e.target.value)}
                placeholder="0,00"
                className="w-full text-sm border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Valor Máximo (R$)</label>
              <input
                type="number" min="0" step="0.01"
                value={valorMax} onChange={e => setValorMax(e.target.value)}
                placeholder="Sem limite"
                className="w-full text-sm border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Forma de Pagamento</label>
              <input
                type="text"
                value={formaPgto} onChange={e => setFormaPgto(e.target.value)}
                placeholder="Ex: Boleto, Pix, Cartão..."
                className="w-full text-sm border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <button
              onClick={limparFiltros}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline"
            >
              Limpar todos os filtros
            </button>
            <button
              onClick={handleConsultar}
              disabled={selecionados.length === 0 || carregando}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#394353' }}
            >
              {carregando
                ? <><Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />Consultando...</>
                : <><Search className="w-4 h-4 flex-shrink-0" />Consultar</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      {/* Loading com barra de progresso */}
      {carregando && progresso && (
        <div className="flex flex-col items-center py-16 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-slate-400" />
          <p className="text-sm font-medium">
            Consultando {progresso.atual} de {progresso.total}
          </p>
          <p className="text-xs text-slate-400 mt-1">{progresso.nome}</p>
          {progresso.total > 1 && (
            <div className="mt-3 w-48 bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-slate-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(progresso.atual / progresso.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Resultados */}
      {contasExibidas !== null && !carregando && (
        <>
          {/* Cards de resumo */}
          {resumo && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
                <p className="text-xs text-slate-500 mb-1">Registros exibidos</p>
                <p className="text-2xl font-bold text-slate-800">{resumo.total}</p>
                {bruto && bruto.length !== resumo.total && (
                  <p className="text-xs text-slate-400 mt-0.5">de {bruto.length} totais</p>
                )}
              </div>
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
                <p className="text-xs text-slate-500 mb-1">Valor Total</p>
                <p className="text-sm font-bold text-slate-800">{fmt$(resumo.valorTotal)}</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
                <p className="text-xs text-slate-500 mb-1">Total Recebido</p>
                <p className="text-sm font-bold text-green-700">{fmt$(resumo.valorRecebido)}</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
                <p className="text-xs text-slate-500 mb-1">Saldo em Aberto</p>
                <p className="text-sm font-bold text-red-700">{fmt$(resumo.valorSaldo)}</p>
              </div>
            </div>
          )}

          {/* Tabela interativa */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-700">Resultado da Consulta</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 flex-shrink-0">
                  {contasExibidas.length} {contasExibidas.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>
              <button
                onClick={handleConsultar}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar
              </button>
            </div>

            {contasExibidas.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-slate-400">
                <FileText className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">Nenhuma conta corresponde aos filtros</p>
                <p className="text-xs mt-1">Tente ajustar os critérios de busca</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1020px]">
                  <thead>
                    <tr style={{ backgroundColor: '#394353' }}>
                      {multiCliente && thSort('cliente_nome', 'Cliente')}
                      {thSort('numero_documento', 'Nº Documento')}
                      {thSort('descricao', 'Descrição')}
                      {thSort('data_emissao', 'Emissão')}
                      {thSort('data_vencimento', 'Vencimento')}
                      {thSort('data_pagamento', 'Pagamento')}
                      {thSort('valor_original', 'Valor Original', true)}
                      {thSort('valor_pago', 'Valor Pago', true)}
                      {thSort('valor_saldo', 'Saldo', true)}
                      {thSort('forma_pagamento', 'Forma Pgto')}
                      {thSort('status_key', 'Status')}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contasExibidas.map((c, idx) => {
                      const sk = getStatusKey(c)
                      const scfg = STATUS_CONFIG[sk]
                      return (
                        <tr key={`${c.solutto_id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                          {multiCliente && (
                            <td className="px-3 py-2.5 text-xs font-medium text-slate-700 max-w-[140px]">
                              <span className="block truncate" title={c.cliente_nome}>{c.cliente_nome}</span>
                            </td>
                          )}
                          <td className="px-3 py-2.5 text-xs font-medium text-slate-700 whitespace-nowrap">
                            {c.numero_documento || '—'}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-700 max-w-[200px]">
                            <span className="block truncate" title={c.descricao}>{c.descricao || '—'}</span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{fmtDate(c.data_emissao)}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{fmtDate(c.data_vencimento)}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{fmtDate(c.data_pagamento)}</td>
                          <td className="px-3 py-2.5 text-xs font-medium text-slate-700 text-right whitespace-nowrap">{fmt$(c.valor_original)}</td>
                          <td className="px-3 py-2.5 text-xs font-medium text-green-700 text-right whitespace-nowrap">{fmt$(c.valor_pago)}</td>
                          <td className="px-3 py-2.5 text-xs font-semibold text-right whitespace-nowrap">
                            <span className={c.valor_saldo > 0 ? 'text-red-600' : 'text-slate-600'}>
                              {fmt$(c.valor_saldo)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">
                            {c.forma_pagamento || '—'}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${scfg.cor}`}>
                              {scfg.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>

                  {/* Linha de totais */}
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
                      <td
                        colSpan={multiCliente ? 6 : 5}
                        className="px-3 py-2.5 text-xs text-slate-700 text-right"
                      >
                        Totais:
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-800 text-right whitespace-nowrap">
                        {fmt$(contasExibidas.reduce((s, c) => s + (c.valor_original || 0), 0))}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-green-700 text-right whitespace-nowrap">
                        {fmt$(contasExibidas.reduce((s, c) => s + (c.valor_pago || 0), 0))}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-red-700 text-right whitespace-nowrap">
                        {fmt$(contasExibidas.reduce((s, c) => s + (c.valor_saldo || 0), 0))}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Estado inicial */}
      {contasExibidas === null && !carregando && !erro && (
        <div className="flex flex-col items-center py-20 text-slate-400">
          <div className="p-4 bg-slate-100 rounded-full mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">Configure os filtros e clique em Consultar</p>
          <p className="text-xs text-slate-400 mt-1">Selecione um ou mais clientes para iniciar</p>
        </div>
      )}
    </div>
  )
}

export default RelatoriosFinanceiros
