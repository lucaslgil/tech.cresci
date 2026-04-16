/**
 * MODAL - SINCRONIZAÇÃO DE CLIENTES COM A SOLUTTO
 * Exibe progresso e resultado da sincronização.
 * Leitura exclusiva da Solutto; escrita apenas no nosso Supabase.
 */

import React, { useState, useRef } from 'react'
import {
  X,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Users,
  ArrowDownCircle,
  PencilLine,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  sincronizarClientesSolutto,
  type ProgressoSync,
  type ResultadoSync,
} from './soluttoSyncService'

interface Props {
  onClose: () => void
  onSucesso: () => void
}

type Estado = 'idle' | 'executando' | 'concluido' | 'erro'

const ModalSyncSolutto: React.FC<Props> = ({ onClose, onSucesso }) => {
  const [estado, setEstado] = useState<Estado>('idle')
  const [progresso, setProgresso] = useState<ProgressoSync | null>(null)
  const [resultado, setResultado] = useState<ResultadoSync | null>(null)
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [mostrarErros, setMostrarErros] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const iniciarSync = async () => {
    setEstado('executando')
    setErroGeral(null)
    setResultado(null)
    abortRef.current = new AbortController()

    try {
      const res = await sincronizarClientesSolutto(
        p => setProgresso(p),
        abortRef.current.signal
      )
      setResultado(res)
      setEstado('concluido')
      onSucesso()
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setEstado('idle')
      } else {
        setErroGeral(err instanceof Error ? err.message : 'Erro desconhecido')
        setEstado('erro')
      }
    }
  }

  const cancelar = () => {
    abortRef.current?.abort()
    setEstado('idle')
  }

  const pct = progresso && progresso.total > 0
    ? Math.round((progresso.processados / progresso.total) * 100)
    : 0

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div
        className="relative w-full max-w-lg bg-white rounded-lg shadow-lg border"
        style={{ borderColor: '#C9C4B5' }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center px-5 py-4 border-b"
          style={{ borderBottomColor: '#C9C4B5' }}
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" style={{ color: '#394353' }} />
            <h3 className="text-base font-semibold" style={{ color: '#394353' }}>
              Atualizar Cadastros via Solutto
            </h3>
          </div>
          {estado !== 'executando' && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">

          {/* ── IDLE ── */}
          {estado === 'idle' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 font-medium mb-1">Como funciona</p>
                <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                  <li>Consulta todos os clientes cadastrados na Solutto</li>
                  <li>Clientes existentes na nossa base são <strong>atualizados</strong> (nome, CNPJ, IE, etc.)</li>
                  <li>Clientes novos (não encontrados) são <strong>criados</strong> com status Ativo</li>
                  <li>Nenhuma alteração é feita na Solutto — somente leitura</li>
                </ul>
              </div>

              {erroGeral && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                  <strong>Erro:</strong> {erroGeral}
                </div>
              )}
            </>
          )}

          {/* ── EXECUTANDO ── */}
          {estado === 'executando' && progresso && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: '#394353' }} />
                <p className="text-xs font-medium truncate" style={{ color: '#394353' }}>
                  {progresso.mensagem || 'Processando...'}
                </p>
              </div>

              {/* Barra de progresso */}
              <div className="bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, backgroundColor: '#394353' }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                {progresso.processados} de {progresso.total} clientes ({pct}%)
              </p>

              {/* Contadores parciais */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
                  <p className="text-xs text-green-600">Atualizados</p>
                  <p className="text-base font-bold text-green-700">{progresso.atualizados}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
                  <p className="text-xs text-blue-600">Criados</p>
                  <p className="text-base font-bold text-blue-700">{progresso.criados}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded p-2 text-center">
                  <p className="text-xs text-red-600">Erros</p>
                  <p className="text-base font-bold text-red-700">{progresso.erros}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── CONCLUÍDO ── */}
          {estado === 'concluido' && resultado && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-green-700">Sincronização concluída!</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 border border-gray-200 rounded p-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Total Solutto</p>
                    <p className="text-base font-bold" style={{ color: '#394353' }}>{resultado.total_solutto}</p>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center gap-2">
                  <PencilLine className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-green-600">Atualizados</p>
                    <p className="text-base font-bold text-green-700">{resultado.atualizados}</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-center gap-2">
                  <ArrowDownCircle className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600">Criados</p>
                    <p className="text-base font-bold text-blue-700">{resultado.criados}</p>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded p-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-xs text-red-500">Erros</p>
                    <p className="text-base font-bold text-red-600">{resultado.erros}</p>
                  </div>
                </div>
              </div>

              {/* Detalhes de erros (colapsável) */}
              {resultado.detalhes_erros.length > 0 && (
                <div>
                  <button
                    onClick={() => setMostrarErros(v => !v)}
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    {mostrarErros ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Ver {resultado.detalhes_erros.length} erro(s)
                  </button>
                  {mostrarErros && (
                    <div className="mt-2 max-h-36 overflow-y-auto space-y-1">
                      {resultado.detalhes_erros.map((e, i) => (
                        <div key={i} className="bg-red-50 border border-red-100 rounded px-2 py-1.5">
                          <p className="text-xs font-medium text-red-700 truncate">{e.nome}</p>
                          <p className="text-xs text-red-500 truncate">{e.motivo}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── ERRO GERAL ── */}
          {estado === 'erro' && erroGeral && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              <strong>Erro:</strong> {erroGeral}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-2 px-5 py-3 border-t"
          style={{ borderTopColor: '#C9C4B5' }}
        >
          {estado === 'idle' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm border rounded-md font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                style={{ borderColor: '#C9C4B5' }}
              >
                Cancelar
              </button>
              <button
                onClick={iniciarSync}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white rounded-md font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#394353' }}
              >
                <RefreshCw className="w-4 h-4" />
                Iniciar Sincronização
              </button>
            </>
          )}

          {estado === 'executando' && (
            <button
              onClick={cancelar}
              className="px-4 py-2 text-sm border rounded-md font-semibold text-red-600 border-red-300 hover:bg-red-50 transition-colors"
            >
              Cancelar
            </button>
          )}

          {(estado === 'concluido' || estado === 'erro') && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-white rounded-md font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#394353' }}
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModalSyncSolutto
