import React, { useEffect, useMemo, useState } from 'react'
import {
  RefreshCw, Search, Filter, AlertCircle, CheckCircle2,
  Clock, X, Download, History
} from 'lucide-react'
import {
  listarContasReceberSolutto,
  calcularResumo,
  sincronizarManual,
  listarUltimosSyncs,
  type ContaReceberSolutto,
  type ResumoCRSolutto,
  type SyncLogEntry,
  type FiltrosCRSolutto,
  type ProgressoSync,
} from './contasReceberSoluttoService'

const formatarMoeda = (v: number) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatarData = (d: string | null) => {
  if (!d) return '—'
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

const formatarDataHora = (d: string | null) => {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR')
}

const corStatus: Record<ContaReceberSolutto['status'], string> = {
  ABERTO:    'bg-blue-100 text-blue-800',
  PARCIAL:   'bg-yellow-100 text-yellow-800',
  QUITADA:   'bg-green-100 text-green-800',
  VENCIDO:   'bg-red-100 text-red-800',
  CANCELADO: 'bg-gray-100 text-gray-800',
}

function statusEfetivo(c: ContaReceberSolutto): ContaReceberSolutto['status'] {
  if (c.status === 'QUITADA' || c.status === 'CANCELADO') return c.status
  const hoje = new Date().toISOString().split('T')[0]
  if (c.data_vencimento < hoje && Number(c.valor_saldo) > 0) return 'VENCIDO'
  return c.status
}

export const ContasReceberSolutto: React.FC = () => {
  const [contas, setContas] = useState<ContaReceberSolutto[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [filtros, setFiltros] = useState<FiltrosCRSolutto>({ status: 'TODOS' })
  const [busca, setBusca] = useState('')

  // Sync state
  const [syncOpen, setSyncOpen]   = useState(false)
  const [syncRunning, setSyncRunning] = useState(false)
  const [progresso, setProgresso] = useState<ProgressoSync | null>(null)
  const [resultadoSync, setResultadoSync] = useState<{
    inseridas: number; ignoradas: number; erros: number;
    detalhes_erros: Array<{ cliente: string; motivo: string }>
  } | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  // Histórico
  const [logs, setLogs] = useState<SyncLogEntry[]>([])
  const [logsOpen, setLogsOpen] = useState(false)

  const resumo: ResumoCRSolutto = useMemo(() => calcularResumo(contas), [contas])

  async function carregar() {
    setLoading(true)
    setErro(null)
    try {
      const data = await listarContasReceberSolutto({ ...filtros, busca })
      setContas(data)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar contas')
    } finally {
      setLoading(false)
    }
  }

  async function carregarLogs() {
    try {
      const data = await listarUltimosSyncs(15)
      setLogs(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { carregar(); carregarLogs() }, []) // eslint-disable-line
  useEffect(() => { carregar() }, [filtros.status, filtros.vencimento_inicio, filtros.vencimento_fim]) // eslint-disable-line

  async function iniciarSync() {
    setSyncOpen(true)
    setSyncRunning(true)
    setResultadoSync(null)
    setProgresso({ processados: 0, inseridas: 0, ignoradas: 0, erros: 0, mensagem: 'Iniciando...' })

    const ac = new AbortController()
    setAbortController(ac)

    try {
      const r = await sincronizarManual((p) => setProgresso(p), ac.signal)
      setResultadoSync({
        inseridas: r.inseridas,
        ignoradas: r.ignoradas,
        erros: r.erros,
        detalhes_erros: r.detalhes_erros,
      })
      await carregar()
      await carregarLogs()
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setResultadoSync({ inseridas: 0, ignoradas: 0, erros: 1, detalhes_erros: [{ cliente: 'Geral', motivo: (err as Error).message }] })
      }
    } finally {
      setSyncRunning(false)
      setAbortController(null)
    }
  }

  function cancelarSync() {
    abortController?.abort()
  }

  function exportarCSV() {
    if (contas.length === 0) return
    const linhas = [
      ['Cliente', 'CPF/CNPJ', 'Documento', 'Descrição', 'Emissão', 'Vencimento', 'Valor Original', 'Valor Pago', 'Saldo', 'Status'].join(';'),
      ...contas.map(c => [
        c.cliente_nome,
        c.cliente_cpf_cnpj || '',
        c.numero_documento || '',
        (c.descricao || '').replace(/;/g, ','),
        formatarData(c.data_emissao),
        formatarData(c.data_vencimento),
        c.valor_original,
        c.valor_pago,
        c.valor_saldo,
        statusEfetivo(c),
      ].join(';'))
    ]
    const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `contas-receber-solutto-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* CABEÇALHO */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas a Receber - Solutto</h1>
          <p className="text-sm text-gray-600 mt-1">
            Histórico sincronizado do webservice Solutto. Sincronização automática diária às 20h.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setLogsOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <History className="w-4 h-4" />
            Histórico de Syncs
          </button>
          <button
            onClick={exportarCSV}
            disabled={contas.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={iniciarSync}
            disabled={syncRunning}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncRunning ? 'animate-spin' : ''}`} />
            Sincronizar Agora
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <CardResumo
          titulo="Total de Contas"
          valor={resumo.total_contas.toString()}
          subtitulo={formatarMoeda(resumo.valor_total)}
          cor="border-l-blue-500"
        />
        <CardResumo
          titulo="Em Aberto"
          valor={resumo.total_aberto.toString()}
          subtitulo={formatarMoeda(resumo.valor_pendente)}
          cor="border-l-yellow-500"
        />
        <CardResumo
          titulo="Quitadas"
          valor={resumo.total_quitado.toString()}
          subtitulo={formatarMoeda(resumo.valor_recebido)}
          cor="border-l-green-500"
        />
        <CardResumo
          titulo="Vencidas"
          valor={resumo.total_vencido.toString()}
          subtitulo="títulos em atraso"
          cor="border-l-red-500"
        />
      </div>

      {/* FILTROS */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') carregar() }}
              placeholder="Buscar por cliente, documento ou descrição..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filtros.status}
            onChange={e => setFiltros({ ...filtros, status: e.target.value as any })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todos os status</option>
            <option value="ABERTO">Em aberto</option>
            <option value="PARCIAL">Parcial</option>
            <option value="QUITADA">Quitada</option>
            <option value="VENCIDO">Vencido</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          <input
            type="date"
            value={filtros.vencimento_inicio || ''}
            onChange={e => setFiltros({ ...filtros, vencimento_inicio: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            title="Vencimento de"
          />
          <input
            type="date"
            value={filtros.vencimento_fim || ''}
            onChange={e => setFiltros({ ...filtros, vencimento_fim: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            title="Vencimento até"
          />
        </div>
        <div className="flex justify-end mt-3 gap-2">
          <button
            onClick={() => { setFiltros({ status: 'TODOS' }); setBusca(''); }}
            className="text-sm px-3 py-1.5 text-gray-600 hover:text-gray-900"
          >Limpar</button>
          <button
            onClick={carregar}
            className="text-sm px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-md"
          >Aplicar</button>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {erro && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {erro}
          </div>
        )}
        {loading ? (
          <div className="p-12 text-center text-gray-500">Carregando contas...</div>
        ) : contas.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Nenhuma conta encontrada. Use "Sincronizar Agora" para buscar do Solutto.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs uppercase text-gray-500 font-semibold">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-right">Pago</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contas.map(c => {
                  const st = statusEfetivo(c)
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-gray-900">{c.cliente_nome}</div>
                        {c.cliente_cpf_cnpj && (
                          <div className="text-xs text-gray-500">{c.cliente_cpf_cnpj}</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">{c.numero_documento || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-700 max-w-xs truncate" title={c.descricao || ''}>
                        {c.descricao || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">{formatarData(c.data_vencimento)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-900">{formatarMoeda(c.valor_original)}</td>
                      <td className="px-4 py-2.5 text-right text-green-700">{formatarMoeda(c.valor_pago)}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatarMoeda(c.valor_saldo)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${corStatus[st]}`}>
                          {st}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE SYNC */}
      {syncOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <RefreshCw className={`w-5 h-5 ${syncRunning ? 'animate-spin text-blue-500' : 'text-green-500'}`} />
                Sincronização Solutto
              </h3>
              {!syncRunning && (
                <button onClick={() => setSyncOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="px-6 py-5 space-y-4">
              {progresso && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <CardMini titulo="Processados" valor={progresso.processados} />
                  <CardMini titulo="Inseridas"   valor={progresso.inseridas}    cor="text-green-600" />
                  <CardMini titulo="Ignoradas"   valor={progresso.ignoradas}    cor="text-gray-500" />
                  <CardMini titulo="Erros"       valor={progresso.erros}        cor="text-red-600" />
                </div>
              )}

              {syncRunning && progresso && (
                <div className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded px-3 py-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  {progresso.mensagem}
                </div>
              )}

              {resultadoSync && (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="text-sm text-green-900">
                      <strong>Sincronização concluída.</strong><br />
                      {resultadoSync.inseridas} novas contas inseridas, {resultadoSync.ignoradas} ignoradas (já existentes), {resultadoSync.erros} erros.
                    </div>
                  </div>

                  {resultadoSync.detalhes_erros.length > 0 && (
                    <div className="border border-red-200 rounded-md">
                      <div className="bg-red-50 px-3 py-2 text-xs font-semibold text-red-900 border-b border-red-200">
                        Erros encontrados
                      </div>
                      <div className="max-h-48 overflow-y-auto divide-y divide-red-100">
                        {resultadoSync.detalhes_erros.slice(0, 50).map((e, i) => (
                          <div key={i} className="px-3 py-1.5 text-xs">
                            <div className="font-medium text-gray-900">{e.cliente}</div>
                            <div className="text-red-700">{e.motivo}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
              {syncRunning ? (
                <button
                  onClick={cancelarSync}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                >
                  Cancelar
                </button>
              ) : (
                <button
                  onClick={() => setSyncOpen(false)}
                  className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-900 text-white rounded-md"
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTÓRICO */}
      {logsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-600" />
                Histórico de Sincronizações
              </h3>
              <button onClick={() => setLogsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr className="text-left">
                    <th className="px-4 py-2">Origem</th>
                    <th className="px-4 py-2">Início</th>
                    <th className="px-4 py-2">Fim</th>
                    <th className="px-4 py-2 text-right">Clientes</th>
                    <th className="px-4 py-2 text-right">Inseridas</th>
                    <th className="px-4 py-2 text-right">Ignoradas</th>
                    <th className="px-4 py-2 text-right">Erros</th>
                    <th className="px-4 py-2">Sucesso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">Nenhuma execução registrada ainda.</td></tr>
                  ) : logs.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          l.origem === 'CRON' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>{l.origem}</span>
                      </td>
                      <td className="px-4 py-2 text-gray-700">{formatarDataHora(l.iniciado_em)}</td>
                      <td className="px-4 py-2 text-gray-700">{formatarDataHora(l.finalizado_em)}</td>
                      <td className="px-4 py-2 text-right">{l.clientes_processados}</td>
                      <td className="px-4 py-2 text-right text-green-700">{l.contas_inseridas}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{l.contas_ignoradas}</td>
                      <td className="px-4 py-2 text-right text-red-700">{l.erros}</td>
                      <td className="px-4 py-2">
                        {l.sucesso
                          ? <span className="text-green-600 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> OK</span>
                          : <span className="text-red-600 inline-flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Falha</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

const CardResumo: React.FC<{ titulo: string; valor: string; subtitulo: string; cor: string }> = ({ titulo, valor, subtitulo, cor }) => (
  <div className={`bg-white border border-gray-200 border-l-4 ${cor} rounded-lg p-4`}>
    <div className="text-xs uppercase font-semibold text-gray-500">{titulo}</div>
    <div className="text-2xl font-bold text-gray-900 mt-1">{valor}</div>
    <div className="text-xs text-gray-500 mt-1">{subtitulo}</div>
  </div>
)

const CardMini: React.FC<{ titulo: string; valor: number; cor?: string }> = ({ titulo, valor, cor = 'text-gray-900' }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-center">
    <div className="text-xs uppercase text-gray-500">{titulo}</div>
    <div className={`text-xl font-bold ${cor} mt-0.5`}>{valor}</div>
  </div>
)

export default ContasReceberSolutto
