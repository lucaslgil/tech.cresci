/**
 * MODAL - SINCRONIZAR TODOS OS CLIENTES (Solutto → Contas a Receber)
 *
 * Dispara a Edge Function server-side que percorre TODOS os clientes
 * com solutto_cliente_id e importa as contas a receber de cada um.
 */

import { useState, useEffect, useRef } from 'react'
import { X, RefreshCw, CheckCircle, AlertCircle, Users, Loader2 } from 'lucide-react'
import {
  contarClientesComSolutto,
  iniciarSyncTodosClientes,
  type ResultadoSyncTodos,
  type ProgressoSyncTodos,
} from './soluttoContasReceberService'

interface Props {
  onClose: () => void
  onSucesso: () => void
}

type Etapa = 'pronto' | 'contando' | 'sincronizando' | 'resultado'

const ModalSyncTodosClientes: React.FC<Props> = ({ onClose, onSucesso }) => {
  const [etapa, setEtapa] = useState<Etapa>('contando')
  const [totalClientes, setTotalClientes] = useState(0)
  const [resultado, setResultado] = useState<ResultadoSyncTodos | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const [progresso, setProgresso] = useState<ProgressoSyncTodos | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Contar clientes ao abrir
  useEffect(() => {
    contarClientesComSolutto()
      .then((count) => {
        setTotalClientes(count)
        setEtapa('pronto')
      })
      .catch(() => {
        setTotalClientes(0)
        setEtapa('pronto')
      })
  }, [])

  // Timer de tempo decorrido durante sync
  useEffect(() => {
    if (etapa === 'sincronizando') {
      setTempoDecorrido(0)
      timerRef.current = setInterval(() => setTempoDecorrido(t => t + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [etapa])

  const estimativaSegundos = Math.max(totalClientes * 0.12, 5)

  const handleSincronizar = async () => {
    setEtapa('sincronizando')
    setErro(null)
    setProgresso({ processados: 0, total: totalClientes, criados: 0, atualizados: 0, erros: 0 })

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await iniciarSyncTodosClientes(
        totalClientes,
        (p) => setProgresso(p),
        ctrl.signal
      )
      setResultado(res)
      setEtapa('resultado')
      if (res.criados > 0 || res.atualizados > 0) {
        onSucesso()
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setErro('Sincronização cancelada.')
      } else {
        setErro(err instanceof Error ? err.message : 'Erro desconhecido')
      }
      setEtapa('pronto')
    }
  }

  const handleCancelar = () => {
    abortRef.current?.abort()
  }

  const formatarTempo = (s: number) => {
    if (s < 60) return `${s}s`
    return `${Math.floor(s / 60)}m ${s % 60}s`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">

        {/* Cabeçalho */}
        <div style={{ backgroundColor: '#394353' }} className="p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold text-white">Sincronizar Todos os Clientes</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* ── CONTANDO ── */}
          {etapa === 'contando' && (
            <div className="flex items-center gap-3 py-4 justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#394353]" />
              <span className="text-sm text-gray-600">Verificando clientes...</span>
            </div>
          )}

          {/* ── PRONTO ── */}
          {etapa === 'pronto' && (
            <>
              {/* Card de quantidade */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#394353' }}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: '#394353' }}>{totalClientes}</p>
                  <p className="text-xs text-gray-500">clientes com vínculo Solutto</p>
                </div>
              </div>

              {totalClientes === 0 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2 text-sm text-yellow-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Nenhum cliente possui vínculo com a Solutto. Sincronize os clientes primeiro.</span>
                </div>
              ) : (
                <>
                  {/* Estimativa */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Estimativa de duração</p>
                    <p className="text-xs text-blue-600">
                      ~{estimativaSegundos < 60
                        ? `${Math.round(estimativaSegundos)} segundos`
                        : `${Math.round(estimativaSegundos / 60)} minutos`
                      } para {totalClientes} clientes
                    </p>
                  </div>

                  {/* Como funciona */}
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-xs font-semibold text-gray-700 mb-1">O que acontece:</p>
                    <ul className="text-xs text-gray-600 space-y-0.5 list-disc list-inside">
                      <li>Busca contas a receber de cada cliente na Solutto</li>
                      <li>Registros novos são criados com origem "SOLUTTO"</li>
                      <li>Registros existentes são atualizados</li>
                      <li>Processamento ocorre totalmente no servidor</li>
                    </ul>
                  </div>
                </>
              )}

              {erro && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{erro}</span>
                </div>
              )}
            </>
          )}

          {/* ── SINCRONIZANDO ── */}
          {etapa === 'sincronizando' && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#394353] flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Sincronizando clientes...</p>
                  <p className="text-xs text-gray-500">
                    {progresso
                      ? `${progresso.processados} de ${progresso.total} clientes`
                      : 'Iniciando...'}
                  </p>
                </div>
              </div>

              {/* Barra de progresso real */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: progresso && progresso.total > 0
                      ? `${Math.round((progresso.processados / progresso.total) * 100)}%`
                      : '2%',
                    backgroundColor: '#394353',
                  }}
                />
              </div>
              <p className="text-xs text-center text-gray-500">
                {progresso && progresso.total > 0
                  ? `${Math.round((progresso.processados / progresso.total) * 100)}%`
                  : '0%'}
              </p>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-50 border border-slate-200 rounded-md p-2 text-center">
                  <p className="text-xs text-gray-500">Tempo</p>
                  <p className="text-base font-bold text-gray-700">{formatarTempo(tempoDecorrido)}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-md p-2 text-center">
                  <p className="text-xs text-green-600">Criados</p>
                  <p className="text-base font-bold text-green-700">{progresso?.criados ?? 0}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-center">
                  <p className="text-xs text-blue-600">Atualizados</p>
                  <p className="text-base font-bold text-blue-700">{progresso?.atualizados ?? 0}</p>
                </div>
              </div>

              <p className="text-xs text-center text-gray-400">
                Não feche esta janela até concluir
              </p>
            </div>
          )}

          {/* ── RESULTADO ── */}
          {etapa === 'resultado' && resultado && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm font-semibold">
                  Sincronização concluída em {formatarTempo(tempoDecorrido)}!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Clientes processados</p>
                  <p className="text-xl font-bold" style={{ color: '#394353' }}>{resultado.total}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
                  <p className="text-xs text-green-600 mb-1">Criados</p>
                  <p className="text-xl font-bold text-green-700">{resultado.criados}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-center">
                  <p className="text-xs text-blue-600 mb-1">Atualizados</p>
                  <p className="text-xl font-bold text-blue-700">{resultado.atualizados}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-center">
                  <p className="text-xs text-red-600 mb-1">Erros</p>
                  <p className="text-xl font-bold text-red-700">{resultado.erros}</p>
                </div>
              </div>

              {resultado.detalhes_erros.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-28 overflow-y-auto">
                  <p className="text-xs font-semibold text-red-700 mb-2">Clientes com erro:</p>
                  {resultado.detalhes_erros.map((e, i) => (
                    <p key={i} className="text-xs text-red-600">
                      <strong>{e.cliente}:</strong> {e.motivo}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200 flex justify-between gap-2">
          {etapa === 'pronto' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={handleSincronizar}
                disabled={totalClientes === 0}
                style={{ backgroundColor: '#394353' }}
                className="px-4 py-2 text-sm text-white rounded-md hover:opacity-90 transition-opacity font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Sincronizar {totalClientes > 0 ? `(${totalClientes} clientes)` : ''}
              </button>
            </>
          )}

          {etapa === 'sincronizando' && (
            <>
              <button
                onClick={handleCancelar}
                className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
              >
                Cancelar
              </button>
              <span className="text-xs text-gray-400 self-center">Processando no servidor...</span>
            </>
          )}

          {etapa === 'resultado' && (
            <button
              onClick={onClose}
              style={{ backgroundColor: '#394353' }}
              className="px-4 py-2 text-sm text-white rounded-md hover:opacity-90 transition-opacity font-semibold ml-auto"
            >
              Fechar
            </button>
          )}

          {etapa === 'contando' && (
            <span className="text-xs text-gray-400 self-center ml-auto">Aguarde...</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModalSyncTodosClientes
