/**
 * RADAR DE INATIVIDADE
 * Relatório que cruza os clientes da base com os itens comprados no Solutto
 * e identifica quais produtos cada cliente não está comprando e há quanto
 * tempo ele não efetua compras.
 */

import React, { useState, useRef, useMemo, useEffect } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  Download,
  Play,
  XCircle,
  Loader2,
  Users,
  BarChart2,
  Filter,
  X,
  Calendar,
  Package,
  Save,
} from 'lucide-react'
import { DatePickerInput } from '../../shared/components/DatePicker'
import {
  executarRadarInatividade,
  buscarClientesDisponiveis,
  diagnosticarSoluttoId,
  type ResultadoRadar,
  type ClienteRadar,
  type ProgressoRadar,
  type ClienteDisponivelRadar,
  type FiltrosRadar,
} from './radarInativiadeService'

// =====================================================
// HELPERS
// =====================================================

function classeInatividade(dias: number | null): string {
  if (dias === null) return 'bg-gray-100 text-gray-600'
  if (dias >= 90) return 'bg-red-100 text-red-700'
  if (dias >= 60) return 'bg-orange-100 text-orange-700'
  if (dias >= 30) return 'bg-yellow-100 text-yellow-700'
  return 'bg-green-100 text-green-700'
}

function labelInatividade(dias: number | null): string {
  if (dias === null) return 'Sem compras'
  if (dias === 0) return 'Comprou hoje'
  if (dias === 1) return '1 dia atrás'
  return `${dias} dias atrás`
}

function formatarDataBR(dataIso: string | null): string {
  if (!dataIso) return '—'
  const d = new Date(dataIso)
  if (isNaN(d.getTime())) return dataIso
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function filtrarClientesResultado(
  clientes: ClienteRadar[],
  busca: string,
  filtroPeriodo: string
): ClienteRadar[] {
  return clientes.filter(c => {
    const termoBusca = busca.toLowerCase()
    const matchBusca =
      !busca ||
      c.nome.toLowerCase().includes(termoBusca) ||
      c.codigo.toLowerCase().includes(termoBusca)

    const matchPeriodo =
      filtroPeriodo === 'todos' ||
      (filtroPeriodo === 'sem_compras' && c.dias_sem_compra === null) ||
      (filtroPeriodo === '30d' && c.dias_sem_compra !== null && c.dias_sem_compra >= 30) ||
      (filtroPeriodo === '60d' && c.dias_sem_compra !== null && c.dias_sem_compra >= 60) ||
      (filtroPeriodo === '90d' && c.dias_sem_compra !== null && c.dias_sem_compra >= 90)

    return matchBusca && matchPeriodo
  })
}

// =====================================================
// SUBCOMPONENTE: Linha de cliente expandível
// =====================================================

const LinhaCliente: React.FC<{ cliente: ClienteRadar }> = ({ cliente }) => {
  const [expandido, setExpandido] = useState(false)

  const percentualComprado =
    cliente.produtos_comprados.length + cliente.produtos_nao_comprados.length > 0
      ? Math.round(
          (cliente.produtos_comprados.length /
            (cliente.produtos_comprados.length + cliente.produtos_nao_comprados.length)) *
            100
        )
      : 0

  return (
    <>
      <tr
        className="hover:bg-slate-50 transition-colors cursor-pointer"
        onClick={() => setExpandido(e => !e)}
      >
        <td className="px-3 py-2 text-xs font-medium text-gray-900 max-w-[200px] truncate">
          {cliente.nome}
        </td>
        <td className="px-3 py-2 text-xs text-gray-500 max-w-[160px] truncate">
          {cliente.nome_fantasia || '—'}
        </td>
        <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">
          {formatarDataBR(cliente.ultima_compra)}
        </td>
        <td className="px-3 py-2 whitespace-nowrap">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classeInatividade(cliente.dias_sem_compra)}`}
          >
            <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
            {labelInatividade(cliente.dias_sem_compra)}
          </span>
        </td>
        <td className="px-3 py-2 text-xs text-center">
          <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
            <CheckCircle className="w-3 h-3" />
            {cliente.produtos_comprados.length}
          </span>
        </td>
        <td className="px-3 py-2 text-xs text-center">
          <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
            <XCircle className="w-3 h-3" />
            {cliente.produtos_nao_comprados.length}
          </span>
        </td>
        <td className="px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: `${percentualComprado}%`,
                  backgroundColor:
                    percentualComprado >= 70 ? '#16a34a' : percentualComprado >= 40 ? '#d97706' : '#dc2626',
                }}
              />
            </div>
            <span className="text-gray-500 flex-shrink-0">{percentualComprado}%</span>
          </div>
        </td>
        <td className="px-2 py-2 text-center">
          {expandido ? (
            <ChevronUp className="w-4 h-4 text-gray-400 mx-auto" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400 mx-auto" />
          )}
        </td>
      </tr>

      {expandido && (
        <tr>
          <td colSpan={8} className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Produtos que o cliente compra ({cliente.produtos_comprados.length})
                </p>
                {cliente.produtos_comprados.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Nenhum produto encontrado</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {[...cliente.produtos_comprados]
                      .sort((a, b) => {
                        const ta = a.ultima_compra ? new Date(a.ultima_compra).getTime() : 0
                        const tb = b.ultima_compra ? new Date(b.ultima_compra).getTime() : 0
                        return tb - ta
                      })
                      .map((p, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between bg-white border border-green-100 rounded px-2 py-1.5 gap-2"
                      >
                        <div className="min-w-0">
                          {p.codigo && (
                            <span className="text-xs text-gray-400 mr-1">[{p.codigo}]</span>
                          )}
                          <span className="text-xs text-gray-700 font-medium">{p.descricao || '—'}</span>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs text-gray-500">
                            {p.total_compras}x · Últ: {formatarDataBR(p.ultima_compra || null)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-red-600 flex items-center gap-1 mb-2">
                  <XCircle className="w-3.5 h-3.5" />
                  Produtos que o cliente NÃO compra ({cliente.produtos_nao_comprados.length})
                </p>
                {cliente.produtos_nao_comprados.length === 0 ? (
                  <p className="text-xs text-green-600 italic">✓ Cliente compra todos os produtos</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {cliente.produtos_nao_comprados.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center bg-white border border-red-100 rounded px-2 py-1.5 gap-2"
                      >
                        {p.codigo && (
                          <span className="text-xs text-gray-400">[{p.codigo}]</span>
                        )}
                        <span className="text-xs text-gray-700 font-medium truncate">
                          {p.descricao || '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

interface RadarInativiadeProps {
  resultadoInicial?: ResultadoRadar | null
  onGravar?: (resultado: ResultadoRadar, titulo: string, resumo: string) => void
}

export const RadarInatividade: React.FC<RadarInativiadeProps> = ({ resultadoInicial, onGravar }) => {
  // --- Resultado e execução ---
  const [resultado, setResultado] = useState<ResultadoRadar | null>(resultadoInicial ?? null)
  const [progresso, setProgresso] = useState<ProgressoRadar | null>(null)
  const [executando, setExecutando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Quando o relatório inicial muda (usuário clicou em um salvo no dashboard)
  useEffect(() => {
    setResultado(resultadoInicial ?? null)
  }, [resultadoInicial])

  // --- Modal Gravar ---
  const [modalGravar, setModalGravar] = useState(false)
  const [tituloGravar, setTituloGravar] = useState('')
  const [gravacaoOk, setGravacaoOk] = useState(false)

  // --- Filtros pré-geração ---
  const [clientesDisponiveis, setClientesDisponiveis] = useState<ClienteDisponivelRadar[]>([])
  const [clientesCarregando, setClientesCarregando] = useState(true)
  const [buscaCliente, setBuscaCliente] = useState('')
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set())
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [filtroProdutos, setFiltroProdutos] = useState('')
  const [apenasUltimaCompra, setApenasUltimaCompra] = useState(false)
  const [filtroJuridica, setFiltroJuridica] = useState(true)
  const [filtroFisica, setFiltroFisica] = useState(true)
  const [filtroAtivo, setFiltroAtivo] = useState(true)
  const [filtroInativo, setFiltroInativo] = useState(true)

  // --- Filtros pós-geração ---
  const [busca, setBusca] = useState('')
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos')
  const [ordenacao, setOrdenacao] = useState<{ campo: string; direcao: 'asc' | 'desc' }>({
    campo: 'dias_sem_compra',
    direcao: 'desc',
  })

  // --- Diagnóstico ---
  const [diagResultado, setDiagResultado] = useState<string | null>(null)
  const [diagExecutando, setDiagExecutando] = useState(false)

  // Carrega clientes ao montar
  useEffect(() => {
    buscarClientesDisponiveis()
      .then(lista => {
        setClientesDisponiveis(lista)
        setSelecionados(new Set(lista.map(c => c.id)))
      })
      .catch(() => {})
      .finally(() => setClientesCarregando(false))
  }, [])

  // Lista filtrada pelos 4 checkboxes de tipo/status
  const clientesElegiveis = useMemo(() => {
    return clientesDisponiveis.filter(c => {
      const passaTipo =
        (filtroJuridica && c.tipo_pessoa === 'JURIDICA') ||
        (filtroFisica && c.tipo_pessoa === 'FISICA')
      const passaStatus =
        (filtroAtivo && c.status === 'ATIVO') ||
        (filtroInativo && c.status !== 'ATIVO')
      return passaTipo && passaStatus
    })
  }, [clientesDisponiveis, filtroJuridica, filtroFisica, filtroAtivo, filtroInativo])

  // Lista filtrada pela busca no seletor
  const clientesFiltradosSeletor = useMemo(() => {
    if (!buscaCliente) return clientesElegiveis
    const termo = buscaCliente.toLowerCase()
    return clientesElegiveis.filter(c => c.nome.toLowerCase().includes(termo))
  }, [clientesElegiveis, buscaCliente])

  const toggleCliente = (id: number) => {
    setSelecionados(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleTodos = () => {
    const todosElegiveisSelected = clientesElegiveis.length > 0 && clientesElegiveis.every(c => selecionados.has(c.id))
    if (todosElegiveisSelected) {
      setSelecionados(prev => {
        const next = new Set(prev)
        clientesElegiveis.forEach(c => next.delete(c.id))
        return next
      })
    } else {
      setSelecionados(prev => {
        const next = new Set(prev)
        clientesElegiveis.forEach(c => next.add(c.id))
        return next
      })
    }
  }

  const selecionarVisiveis = () => {
    setSelecionados(prev => {
      const next = new Set(prev)
      clientesFiltradosSeletor.forEach(c => next.add(c.id))
      return next
    })
  }

  const desselecionarVisiveis = () => {
    setSelecionados(prev => {
      const next = new Set(prev)
      clientesFiltradosSeletor.forEach(c => next.delete(c.id))
      return next
    })
  }

  // ---- Executar radar ----
  const iniciarRadar = async () => {
    setErro(null)
    setResultado(null)
    setExecutando(true)
    setProgresso({ total: 0, processados: 0, atual_nome: 'Preparando...', erros: 0 })
    abortRef.current = new AbortController()

    const elegiveisIds = new Set(clientesElegiveis.map(c => c.id))
    const filtros: FiltrosRadar = {
      clientes_selecionados: Array.from(selecionados).filter(id => elegiveisIds.has(id)),
      data_inicio: dataInicio || undefined,
      data_fim: dataFim || undefined,
      filtro_produtos: filtroProdutos
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0),
      apenas_ultima_compra: apenasUltimaCompra || undefined,
    }

    try {
      const res = await executarRadarInatividade(
        prog => setProgresso(prog),
        abortRef.current.signal,
        filtros
      )
      setResultado(res)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setExecutando(false)
      setProgresso(null)
    }
  }

  const cancelarRadar = () => abortRef.current?.abort()

  // ---- Clientes ordenados (pós-geração) ----
  const clientesFiltrados = useMemo(() => {
    if (!resultado) return []
    const filtrados = filtrarClientesResultado(resultado.clientes, busca, filtroPeriodo)
    return [...filtrados].sort((a, b) => {
      const dir = ordenacao.direcao === 'asc' ? 1 : -1
      if (ordenacao.campo === 'nome') return dir * a.nome.localeCompare(b.nome)
      if (ordenacao.campo === 'dias_sem_compra') {
        return dir * ((a.dias_sem_compra ?? 99999) - (b.dias_sem_compra ?? 99999))
      }
      if (ordenacao.campo === 'produtos_comprados') {
        return dir * (a.produtos_comprados.length - b.produtos_comprados.length)
      }
      if (ordenacao.campo === 'produtos_nao_comprados') {
        return dir * (a.produtos_nao_comprados.length - b.produtos_nao_comprados.length)
      }
      return 0
    })
  }, [resultado, busca, filtroPeriodo, ordenacao])

  const alternarOrdenacao = (campo: string) => {
    setOrdenacao(prev =>
      prev.campo === campo
        ? { campo, direcao: prev.direcao === 'asc' ? 'desc' : 'asc' }
        : { campo, direcao: 'desc' }
    )
  }

  const iconOrdenacao = (campo: string) =>
    ordenacao.campo === campo
      ? ordenacao.direcao === 'asc'
        ? <ChevronUp className="w-3 h-3 inline ml-0.5" />
        : <ChevronDown className="w-3 h-3 inline ml-0.5" />
      : null

  // ---- Exportar CSV ----
  const exportarCSV = () => {
    if (!resultado) return
    const linhas = [
      'Cliente;Nome Fantasia;Código;Última Compra;Dias Sem Compra;Qtd Comprados;Qtd Não Comprados;Produtos Não Comprados',
    ]
    for (const c of clientesFiltrados) {
      const naoComprados = c.produtos_nao_comprados.map(p => p.descricao || p.codigo).join(' | ')
      linhas.push(
        [`"${c.nome}"`, `"${c.nome_fantasia || ''}"`, c.codigo, formatarDataBR(c.ultima_compra), c.dias_sem_compra ?? 'N/A',
          c.produtos_comprados.length, c.produtos_nao_comprados.length, `"${naoComprados}"`].join(';')
      )
    }
    const blob = new Blob(['\uFEFF' + linhas.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `radar-inatividade-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const confirmarGravacao = () => {
    if (!resultado || !onGravar) return
    const resumo = `${resultado.total_clientes} clientes · Consulta em ${new Date(resultado.data_consulta).toLocaleString('pt-BR')}`
    onGravar(resultado, tituloGravar || 'Relatório sem título', resumo)
    setGravacaoOk(true)
  }

  // =====================================================
  // RENDER — Configuração / pré-geração
  // =====================================================

  if (!resultado && !executando) {
    return (
      <div className="mt-4 space-y-3">
        {/* Cabeçalho */}
        <div className="bg-white rounded-lg shadow-sm border p-4" style={{ borderColor: '#C9C4B5' }}>
          <div className="flex items-center gap-3">
            <div
              className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full"
              style={{ backgroundColor: 'rgba(57,67,83,0.08)' }}
            >
              <BarChart2 className="w-5 h-5" style={{ color: '#394353' }} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: '#394353' }}>
                Radar de Inatividade
              </h2>
              <p className="text-xs text-gray-400">
                Configure os filtros e clique em Gerar para iniciar a consulta no Solutto (unidade 1352698).
              </p>
            </div>
          </div>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
            <strong>Erro:</strong> {erro}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* ---- Filtro de clientes ---- */}
          <div
            className="lg:col-span-1 bg-white rounded-lg shadow-sm border p-4 flex flex-col"
            style={{ borderColor: '#C9C4B5' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 flex-shrink-0" style={{ color: '#394353' }} />
              <p className="text-sm font-semibold" style={{ color: '#394353' }}>Clientes</p>
              {!clientesCarregando && (
                <span className="ml-auto text-xs text-gray-400">
                  {clientesElegiveis.filter(c => selecionados.has(c.id)).length}/{clientesElegiveis.length}
                </span>
              )}
            </div>

            {clientesCarregando ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-xs">Carregando...</span>
              </div>
            ) : (
              <>
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={buscaCliente}
                    onChange={e => setBuscaCliente(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-slate-400"
                  />
                  {buscaCliente && (
                    <button
                      onClick={() => setBuscaCliente('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clientesElegiveis.length > 0 && clientesElegiveis.every(c => selecionados.has(c.id))}
                      onChange={toggleTodos}
                      className="w-3.5 h-3.5 accent-slate-700"
                    />
                    <span className="text-xs text-gray-600 font-medium">Todos</span>
                  </label>
                  {buscaCliente && (
                    <div className="flex gap-1 ml-auto">
                      <button onClick={selecionarVisiveis} className="text-xs text-blue-600 hover:underline">
                        + visíveis
                      </button>
                      <span className="text-gray-300">|</span>
                      <button onClick={desselecionarVisiveis} className="text-xs text-gray-400 hover:underline">
                        − visíveis
                      </button>
                    </div>
                  )}
                </div>

                {/* Filtros rápidos de tipo e status */}
                <div className="flex flex-col gap-1.5 mb-2 px-0.5 py-2 border-t border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox" checked={filtroJuridica} onChange={e => setFiltroJuridica(e.target.checked)} className="w-3.5 h-3.5 accent-slate-700 flex-shrink-0" />
                      <span className="text-xs text-gray-600">PJ</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox" checked={filtroFisica} onChange={e => setFiltroFisica(e.target.checked)} className="w-3.5 h-3.5 accent-slate-700 flex-shrink-0" />
                      <span className="text-xs text-gray-600">PF</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox" checked={filtroAtivo} onChange={e => setFiltroAtivo(e.target.checked)} className="w-3.5 h-3.5 accent-slate-700 flex-shrink-0" />
                      <span className="text-xs text-gray-600">Ativo</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox" checked={filtroInativo} onChange={e => setFiltroInativo(e.target.checked)} className="w-3.5 h-3.5 accent-slate-700 flex-shrink-0" />
                      <span className="text-xs text-gray-600">Inativo</span>
                    </label>
                  </div>
                </div>

                <div
                  className="flex-1 overflow-y-auto border border-gray-100 rounded divide-y divide-gray-50"
                  style={{ maxHeight: 260 }}
                >
                  {clientesFiltradosSeletor.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-4">Nenhum cliente.</p>
                  ) : (
                    clientesFiltradosSeletor.map(c => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selecionados.has(c.id)}
                          onChange={() => toggleCliente(c.id)}
                          className="w-3.5 h-3.5 flex-shrink-0 accent-slate-700"
                        />
                        <span className="text-xs text-gray-700 truncate">{c.nome}</span>
                      </label>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* ---- Filtros de data e produto ---- */}
          <div className="lg:col-span-2 flex flex-col gap-3">

            {/* Data */}
            <div className="bg-white rounded-lg shadow-sm border p-4" style={{ borderColor: '#C9C4B5' }}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#394353' }} />
                <p className="text-sm font-semibold" style={{ color: '#394353' }}>Período das compras</p>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Filtra os itens pelo intervalo de datas. Deixe em branco para considerar todo o histórico.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-medium">Data início</label>
                  <DatePickerInput
                    value={dataInicio}
                    onChange={setDataInicio}
                    placeholder="dd/mm/aaaa"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-medium">Data fim</label>
                  <DatePickerInput
                    value={dataFim}
                    onChange={setDataFim}
                    placeholder="dd/mm/aaaa"
                  />
                </div>
              </div>
              {(dataInicio || dataFim) && (
                <button
                  onClick={() => { setDataInicio(''); setDataFim('') }}
                  className="mt-2 text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Limpar datas
                </button>
              )}

              {/* Apenas última compra */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={apenasUltimaCompra}
                    onChange={e => setApenasUltimaCompra(e.target.checked)}
                    className="w-3.5 h-3.5 accent-slate-700 flex-shrink-0"
                  />
                  <span className="text-xs font-medium text-gray-700">Retorna apenas última compra</span>
                </label>
                {apenasUltimaCompra && (
                  <p className="mt-1 text-xs text-gray-400 pl-5">
                    Considera somente os itens da compra mais recente de cada cliente, ignorando o histórico anterior.
                  </p>
                )}
              </div>
            </div>

            {/* Produto */}
            <div className="bg-white rounded-lg shadow-sm border p-4" style={{ borderColor: '#C9C4B5' }}>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 flex-shrink-0" style={{ color: '#394353' }} />
                <p className="text-sm font-semibold" style={{ color: '#394353' }}>Filtro de produtos</p>
              </div>
              <p className="text-xs text-gray-400 mb-2">
                Digite um termo por linha (nome ou código parcial). O universo será restrito aos produtos que correspondem.
                Deixe vazio para considerar todos.
              </p>
              <textarea
                value={filtroProdutos}
                onChange={e => setFiltroProdutos(e.target.value)}
                placeholder={'PAPEL A4\nCAIXA\n3031'}
                rows={4}
                className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-slate-400 resize-none font-mono"
              />
              {filtroProdutos && (
                <p className="text-xs text-gray-400 mt-1">
                  {filtroProdutos.split('\n').filter(s => s.trim()).length} termo(s) configurado(s)
                </p>
              )}
            </div>

            {/* Diagnóstico */}
            <div className="bg-white rounded-lg shadow-sm border p-3" style={{ borderColor: '#C9C4B5' }}>
              <p className="text-xs text-gray-400 font-medium mb-2">Diagnóstico — testar conexão com Solutto</p>
              <button
                onClick={async () => {
                  setDiagExecutando(true)
                  setDiagResultado(null)
                  try {
                    const r = await diagnosticarSoluttoId(2771898)
                    setDiagResultado(JSON.stringify(r, null, 2))
                  } catch (e) {
                    setDiagResultado('Erro: ' + (e instanceof Error ? e.message : String(e)))
                  } finally {
                    setDiagExecutando(false)
                  }
                }}
                disabled={diagExecutando}
                className="text-xs px-3 py-1.5 rounded border font-medium hover:opacity-80 transition-opacity"
                style={{ borderColor: '#394353', color: '#394353' }}
              >
                {diagExecutando ? 'Testando...' : 'Testar ID 2771898'}
              </button>
              {diagResultado && (
                <pre className="mt-2 text-xs bg-gray-50 border rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap" style={{ borderColor: '#C9C4B5' }}>
                  {diagResultado}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé: botão gerar */}
        <div
          className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between gap-4"
          style={{ borderColor: '#C9C4B5' }}
        >
          <p className="text-xs text-gray-400">
            {clientesCarregando ? (
              'Carregando lista de clientes...'
            ) : clientesElegiveis.filter(c => selecionados.has(c.id)).length === 0 ? (
              <span className="text-red-500 font-medium">Selecione ao menos um cliente.</span>
            ) : (
              <>
                <strong className="text-gray-600">{clientesElegiveis.filter(c => selecionados.has(c.id)).length}</strong> cliente(s) selecionado(s)
                {(dataInicio || dataFim) && (
                  <> · <strong className="text-gray-600">{dataInicio || '…'}</strong> até{' '}
                  <strong className="text-gray-600">{dataFim || '…'}</strong></>
                )}
                {filtroProdutos && (
                  <> · <strong className="text-gray-600">
                    {filtroProdutos.split('\n').filter(s => s.trim()).length}
                  </strong> produto(s) filtrado(s)</>
                )}
              </>
            )}
          </p>
          <button
            onClick={iniciarRadar}
            disabled={clientesCarregando || clientesElegiveis.filter(c => selecionados.has(c.id)).length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            style={{ backgroundColor: '#394353' }}
          >
            <Play className="w-4 h-4" />
            Gerar Radar
          </button>
        </div>
      </div>
    )
  }

  // =====================================================
  // RENDER — Executando
  // =====================================================

  if (executando && progresso) {
    const pct = progresso.total > 0 ? Math.round((progresso.processados / progresso.total) * 100) : 0

    return (
      <div className="mt-4 bg-white rounded-lg shadow-sm border p-6" style={{ borderColor: '#C9C4B5' }}>
        <div className="max-w-md mx-auto text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: '#394353' }} />
          <h2 className="text-base font-semibold mb-1" style={{ color: '#394353' }}>
            Gerando Radar de Inatividade...
          </h2>
          <p className="text-xs text-gray-500 mb-4 truncate">
            Consultando: <strong>{progresso.atual_nome}</strong>
          </p>
          <div className="bg-gray-100 rounded-full h-2 mb-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, backgroundColor: '#394353' }}
            />
          </div>
          <p className="text-xs text-gray-500 mb-1">
            {progresso.processados} de {progresso.total} clientes ({pct}%)
          </p>
          {progresso.erros > 0 && (
            <p className="text-xs text-orange-500 mb-3">
              {progresso.erros} cliente(s) sem dados no Solutto
            </p>
          )}
          <button
            onClick={cancelarRadar}
            className="mt-3 text-xs text-gray-400 hover:text-red-500 underline transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  // =====================================================
  // RENDER — Resultado
  // =====================================================

  return (
    <div className="mt-4 space-y-4">
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow-sm p-3 border" style={{ borderColor: '#C9C4B5' }}>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-xs text-gray-500">Total Clientes</p>
          </div>
          <p className="text-xl font-bold" style={{ color: '#394353' }}>{resultado!.total_clientes}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-3 border border-yellow-200">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <p className="text-xs text-gray-500">Inativos +30 dias</p>
          </div>
          <p className="text-xl font-bold text-yellow-600">{resultado!.clientes_inativos_30d}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-3 border border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <p className="text-xs text-gray-500">Inativos +60 dias</p>
          </div>
          <p className="text-xl font-bold text-orange-600">{resultado!.clientes_inativos_60d}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-3 border border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-gray-500">Inativos +90 dias</p>
          </div>
          <p className="text-xl font-bold text-red-600">{resultado!.clientes_inativos_90d}</p>
        </div>
      </div>

      {/* Toolbar pós-geração */}
      <div className="bg-white rounded-lg shadow-sm border p-3" style={{ borderColor: '#C9C4B5' }}>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-slate-400"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filtroPeriodo}
              onChange={e => setFiltroPeriodo(e.target.value)}
              className="text-xs border border-gray-200 rounded py-1.5 px-2 focus:outline-none focus:border-slate-400"
            >
              <option value="todos">Todos os clientes</option>
              <option value="sem_compras">Sem compras registradas</option>
              <option value="30d">Inativos +30 dias</option>
              <option value="60d">Inativos +60 dias</option>
              <option value="90d">Inativos +90 dias</option>
            </select>
            <button
              onClick={exportarCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-300 bg-white hover:bg-slate-50 rounded font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
            {onGravar && (
              <button
                onClick={() => { setTituloGravar(''); setGravacaoOk(false); setModalGravar(true) }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-green-600 text-green-700 bg-white hover:bg-green-50 rounded font-medium transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Gravar Relatório
              </button>
            )}
            <button
              onClick={() => { setResultado(null); setErro(null) }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white rounded font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#394353' }}
            >
              <Filter className="w-3.5 h-3.5" />
              Nova Consulta
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Exibindo <strong>{clientesFiltrados.length}</strong> de{' '}
          <strong>{resultado!.total_clientes}</strong> clientes · Consulta em{' '}
          {new Date(resultado!.data_consulta).toLocaleString('pt-BR')}
        </p>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden" style={{ borderColor: '#C9C4B5' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr style={{ backgroundColor: '#394353' }}>
                <th
                  className="px-3 py-2 text-left text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                  onClick={() => alternarOrdenacao('nome')}
                >
                  Cliente {iconOrdenacao('nome')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white whitespace-nowrap">
                  Nome Fantasia
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white whitespace-nowrap">
                  Última Compra
                </th>
                <th
                  className="px-3 py-2 text-left text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                  onClick={() => alternarOrdenacao('dias_sem_compra')}
                >
                  Inatividade {iconOrdenacao('dias_sem_compra')}
                </th>
                <th
                  className="px-3 py-2 text-center text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                  onClick={() => alternarOrdenacao('produtos_comprados')}
                >
                  Compra {iconOrdenacao('produtos_comprados')}
                </th>
                <th
                  className="px-3 py-2 text-center text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                  onClick={() => alternarOrdenacao('produtos_nao_comprados')}
                >
                  Não Compra {iconOrdenacao('produtos_nao_comprados')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white whitespace-nowrap">
                  Cobertura
                </th>
                <th className="px-2 py-2 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-gray-400">
                    Nenhum cliente encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map(cliente => (
                  <LinhaCliente key={cliente.id} cliente={cliente} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Gravar Relatório */}
      {modalGravar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl border p-6 w-full max-w-md mx-4" style={{ borderColor: '#C9C4B5' }}>
            {gravacaoOk ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-1">Relatório gravado!</h3>
                <p className="text-xs text-gray-500 mb-4">
                  O relatório foi salvo e estará disponível na aba <strong>Dashboard</strong>.
                </p>
                <button
                  onClick={() => setModalGravar(false)}
                  className="px-5 py-2 text-sm font-semibold text-white rounded hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#394353' }}
                >
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Gravar Relatório</h3>
                  <button onClick={() => setModalGravar(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Dê um nome para identificar este relatório na lista de salvos.
                </p>
                <input
                  type="text"
                  value={tituloGravar}
                  onChange={e => setTituloGravar(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmarGravacao()}
                  placeholder="Ex: Clientes inativos – Jan/2026"
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-slate-500 mb-4"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setModalGravar(false)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarGravacao}
                    className="px-4 py-2 text-sm font-semibold text-white rounded hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
                    style={{ backgroundColor: '#394353' }}
                  >
                    <Save className="w-3.5 h-3.5" />
                    Gravar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
