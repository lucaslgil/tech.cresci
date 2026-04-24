/**
 * MODAL - SINCRONIZAÇÃO DE CONTAS A RECEBER COM A SOLUTTO
 *
 * Leitura exclusiva da Solutto; escrita apenas no nosso Supabase.
 * Permite buscar as contas a receber de um cliente específico via webservice.
 */

import { useState, useEffect, useRef } from 'react'
import { X, RefreshCw, CheckCircle, AlertCircle, Search, Loader2, ExternalLink } from 'lucide-react'
import { listarClientes } from '../clientes/services'
import type { Cliente } from '../clientes/types'
import {
  sincronizarContasReceberSolutto,
  type ProgressoSyncContas,
  type ResultadoSyncContas,
} from './soluttoContasReceberService'

interface Props {
  onClose: () => void
  onSucesso: () => void
}

type Etapa = 'selecionar' | 'sincronizando' | 'resultado'

const ModalSyncContasReceber: React.FC<Props> = ({ onClose, onSucesso }) => {
  const [etapa, setEtapa] = useState<Etapa>('selecionar')
  const [buscaCliente, setBuscaCliente] = useState('')
  const [clientesSugeridos, setClientesSugeridos] = useState<Cliente[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<(Cliente & { solutto_cliente_id?: number }) | null>(null)
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [progresso, setProgresso] = useState<ProgressoSyncContas | null>(null)
  const [resultado, setResultado] = useState<ResultadoSyncContas | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounce de busca de clientes
  useEffect(() => {
    const buscar = async () => {
      if (buscaCliente.length < 2) {
        setClientesSugeridos([])
        setMostrarSugestoes(false)
        return
      }
      const res = await listarClientes({ busca: buscaCliente })
      if (res.data) {
        setClientesSugeridos(res.data.slice(0, 6))
        setMostrarSugestoes(true)
      }
    }
    const t = setTimeout(buscar, 300)
    return () => clearTimeout(t)
  }, [buscaCliente])

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMostrarSugestoes(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelecionarCliente = (c: Cliente & { solutto_cliente_id?: number }) => {
    setClienteSelecionado(c)
    setBuscaCliente(c.nome_completo || c.razao_social || '')
    setMostrarSugestoes(false)
    setErro(null)
  }

  const handleSincronizar = async () => {
    if (!clienteSelecionado) return

    const soluttoClienteId = (clienteSelecionado as any).solutto_cliente_id as number | undefined
    if (!soluttoClienteId) {
      setErro('Este cliente não possui vínculo com a Solutto (solutto_cliente_id ausente). Sincronize os clientes primeiro via "Atualizar Cadastros via Solutto".')
      return
    }

    setEtapa('sincronizando')
    setErro(null)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await sincronizarContasReceberSolutto(
        Number(clienteSelecionado.id),
        soluttoClienteId,
        clienteSelecionado.nome_completo || clienteSelecionado.razao_social || '',
        (p) => setProgresso({ ...p }),
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
      setEtapa('selecionar')
    }
  }

  const handleCancelarSync = () => {
    abortRef.current?.abort()
  }

  const handleNovaSincronizacao = () => {
    setEtapa('selecionar')
    setResultado(null)
    setProgresso(null)
    setErro(null)
    setBuscaCliente('')
    setClienteSelecionado(null)
  }

  const nomeCliente = clienteSelecionado?.nome_completo || clienteSelecionado?.razao_social || ''
  const soluttoId = (clienteSelecionado as any)?.solutto_cliente_id as number | undefined
  const percentual = progresso && progresso.total > 0
    ? Math.round((progresso.processados / progresso.total) * 100)
    : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Cabeçalho */}
        <div style={{ backgroundColor: '#394353' }} className="p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold text-white">Sincronizar Contas a Receber (Solutto)</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">

          {/* ── ETAPA: SELECIONAR CLIENTE ── */}
          {etapa === 'selecionar' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Selecione um cliente para buscar as contas a receber no sistema Solutto e importar para esta plataforma.
              </p>

              {/* Busca de cliente */}
              <div ref={dropdownRef} className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cliente <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={buscaCliente}
                    onChange={(e) => { setBuscaCliente(e.target.value); setClienteSelecionado(null) }}
                    placeholder="Digite o nome ou CPF/CNPJ do cliente..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#394353]"
                  />
                </div>

                {mostrarSugestoes && clientesSugeridos.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-56 overflow-y-auto">
                    {clientesSugeridos.map((c) => {
                      const clienteComSolutto = c as Cliente & { solutto_cliente_id?: number }
                      return (
                        <div
                          key={c.id}
                          onClick={() => handleSelecionarCliente(clienteComSolutto)}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              {c.nome_completo || c.razao_social}
                            </span>
                            {clienteComSolutto.solutto_cliente_id ? (
                              <span className="text-xs text-green-600 font-semibold ml-2 flex-shrink-0">
                                ✓ Solutto #{clienteComSolutto.solutto_cliente_id}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 ml-2 flex-shrink-0">Sem vínculo</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{c.cpf || c.cnpj || ''}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Info do cliente selecionado */}
              {clienteSelecionado && (
                <div className={`p-3 rounded-md border text-sm ${soluttoId ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  {soluttoId ? (
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        <strong>{nomeCliente}</strong> — ID Solutto: <strong>{soluttoId}</strong>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-yellow-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>{nomeCliente}</strong> não possui vínculo com a Solutto. Sincronize os clientes primeiro.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Mensagem de erro */}
              {erro && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{erro}</span>
                </div>
              )}

              {/* Informativo */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs font-semibold text-blue-700 mb-1">Como funciona:</p>
                <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
                  <li>Consulta todas as contas a receber do cliente na Solutto</li>
                  <li>Registros novos são criados com origem "SOLUTTO"</li>
                  <li>Registros existentes são atualizados (valores, status, datas)</li>
                  <li>Nenhuma alteração é feita na Solutto — somente leitura</li>
                </ul>
              </div>
            </div>
          )}

          {/* ── ETAPA: SINCRONIZANDO ── */}
          {etapa === 'sincronizando' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-[#394353]" />
                <p className="text-sm font-semibold text-gray-800">Sincronizando com Solutto...</p>
              </div>

              {progresso && (
                <>
                  {/* Barra de progresso */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{progresso.processados} / {progresso.total} contas</span>
                      <span>{percentual}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentual}%`, backgroundColor: '#394353' }}
                      />
                    </div>
                  </div>

                  {/* Mensagem atual */}
                  <p className="text-xs text-gray-500 truncate">{progresso.mensagem}</p>

                  {/* Contadores */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-green-50 border border-green-200 rounded-md p-2 text-center">
                      <p className="text-xs text-green-600">Criados</p>
                      <p className="text-base font-bold text-green-700">{progresso.criados}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-center">
                      <p className="text-xs text-blue-600">Atualizados</p>
                      <p className="text-base font-bold text-blue-700">{progresso.atualizados}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-md p-2 text-center">
                      <p className="text-xs text-red-600">Erros</p>
                      <p className="text-base font-bold text-red-700">{progresso.erros}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── ETAPA: RESULTADO ── */}
          {etapa === 'resultado' && resultado && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm font-semibold">Sincronização concluída!</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Total Solutto</p>
                  <p className="text-xl font-bold" style={{ color: '#394353' }}>{resultado.total_solutto}</p>
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
                <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-32 overflow-y-auto">
                  <p className="text-xs font-semibold text-red-700 mb-2">Detalhes dos erros:</p>
                  {resultado.detalhes_erros.map((e, i) => (
                    <p key={i} className="text-xs text-red-600">
                      <strong>{e.numero}:</strong> {e.motivo}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200 flex justify-between gap-2">
          {etapa === 'selecionar' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={handleSincronizar}
                disabled={!clienteSelecionado || !soluttoId}
                style={{ backgroundColor: '#394353' }}
                className="px-4 py-2 text-sm text-white rounded-md hover:opacity-90 transition-opacity font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Sincronizar
              </button>
            </>
          )}

          {etapa === 'sincronizando' && (
            <>
              <button
                onClick={handleCancelarSync}
                className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
              >
                Cancelar
              </button>
              <span className="text-xs text-gray-400 self-center">Aguarde...</span>
            </>
          )}

          {etapa === 'resultado' && (
            <>
              <button
                onClick={handleNovaSincronizacao}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Novo cliente
              </button>
              <button
                onClick={onClose}
                style={{ backgroundColor: '#394353' }}
                className="px-4 py-2 text-sm text-white rounded-md hover:opacity-90 transition-opacity font-semibold"
              >
                Fechar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModalSyncContasReceber
