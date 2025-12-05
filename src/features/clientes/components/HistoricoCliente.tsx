/**
 * HISTÓRICO DO CLIENTE - COMPONENTE
 */

import { useState, useEffect } from 'react'
import { listarHistorico } from '../services'
import { formatarDataHora } from '../utils'
import type { ClienteHistorico } from '../types'

interface Props {
  clienteId: string
}

export function HistoricoCliente({ clienteId }: Props) {
  const [historico, setHistorico] = useState<ClienteHistorico[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    carregarHistorico()
  }, [clienteId])

  async function carregarHistorico() {
    setCarregando(true)
    try {
      const dados = await listarHistorico(clienteId)
      setHistorico(dados)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setCarregando(false)
    }
  }

  function getIconeTipo(tipo: string): string {
    const icones: Record<string, string> = {
      'CADASTRO': '➕',
      'EDICAO': '✏️',
      'BLOQUEIO': '🔒',
      'DESBLOQUEIO': '🔓',
      'VENDA': '🛒',
      'PAGAMENTO': '💰',
      'OBSERVACAO': '📝',
      'CONTATO': '📞',
      'EMAIL': '📧'
    }
    return icones[tipo] || '📋'
  }

  function getCorTipo(tipo: string): string {
    const cores: Record<string, string> = {
      'CADASTRO': 'bg-green-100 text-green-800',
      'EDICAO': 'bg-blue-100 text-blue-800',
      'BLOQUEIO': 'bg-red-100 text-red-800',
      'DESBLOQUEIO': 'bg-green-100 text-green-800',
      'VENDA': 'bg-purple-100 text-purple-800',
      'PAGAMENTO': 'bg-green-100 text-green-800',
      'OBSERVACAO': 'bg-gray-100 text-gray-800',
      'CONTATO': 'bg-blue-100 text-blue-800',
      'EMAIL': 'bg-indigo-100 text-indigo-800'
    }
    return cores[tipo] || 'bg-gray-100 text-gray-800'
  }

  if (carregando) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Histórico de Atividades ({historico.length})
        </h3>
        <button
          onClick={carregarHistorico}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          🔄 Atualizar
        </button>
      </div>

      {historico.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600">Nenhum registro no histórico</p>
        </div>
      ) : (
        <div className="relative">
          {/* Linha do tempo */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          <div className="space-y-6">
            {historico.map((item, index) => (
              <div key={item.id} className="relative pl-12">
                {/* Ícone na linha do tempo */}
                <div className="absolute left-0 flex items-center justify-center w-8 h-8 bg-white border-2 border-gray-200 rounded-full">
                  <span className="text-sm">{getIconeTipo(item.tipo)}</span>
                </div>

                {/* Conteúdo */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getCorTipo(item.tipo)}`}>
                        {item.tipo}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatarDataHora(item.created_at)}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-900 mb-2">{item.descricao}</p>

                  {item.usuario_id && (
                    <p className="text-xs text-gray-500">
                      Por: {(item as any).usuario?.nome_completo || `Usuário #${item.usuario_id}`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
