// =====================================================
// COMPONENTE - HISTÓRICO DE VENDAS PDV
// Visualização das vendas realizadas
// =====================================================

import { useState, useEffect } from 'react'
import { ConfigPDV } from '../types/electron'
import { VendasService, Venda } from '../services/vendasService'

interface HistoricoVendasProps {
  config: ConfigPDV
  onVoltar: () => void
}

export default function HistoricoVendas({ config, onVoltar }: HistoricoVendasProps) {
  const vendasService = new VendasService(config)
  
  const [vendas, setVendas] = useState<Venda[]>([])
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null)
  const [loading, setLoading] = useState(true)
  const [estatisticas, setEstatisticas] = useState({
    totalVendas: 0,
    valorTotal: 0,
    vendasFechadas: 0,
    vendasAbertas: 0
  })

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setLoading(true)
    try {
      const [vendasData, estatisticasData] = await Promise.all([
        vendasService.listar(50),
        vendasService.estatisticasDoDia()
      ])
      setVendas(vendasData)
      setEstatisticas(estatisticasData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const visualizarVenda = async (id: number) => {
    try {
      const venda = await vendasService.buscarPorId(id)
      setVendaSelecionada(venda)
    } catch (error) {
      console.error('Erro ao buscar venda:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      PEDIDO_ABERTO: 'bg-yellow-100 text-yellow-800',
      PEDIDO_FECHADO: 'bg-blue-100 text-blue-800',
      FATURADO: 'bg-green-100 text-green-800',
      CANCELADO: 'bg-red-100 text-red-800'
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getStatusTexto = (status: string) => {
    const textos = {
      PEDIDO_ABERTO: 'Aberto',
      PEDIDO_FECHADO: 'Fechado',
      FATURADO: 'Faturado',
      CANCELADO: 'Cancelado'
    }
    return textos[status as keyof typeof textos] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-gray-600">Carregando vendas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#394353] text-white shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onVoltar}
                className="text-white hover:opacity-80"
              >
                ← Voltar
              </button>
              <h1 className="text-xl font-bold">Histórico de Vendas</h1>
            </div>
            <button
              onClick={carregarDados}
              className="px-3 py-1 bg-white text-[#394353] rounded text-sm font-semibold hover:opacity-90"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>
      </header>

      {/* Estatísticas do Dia */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-[#C9C4B5] p-4">
            <p className="text-xs text-gray-600 mb-1">Total de Vendas</p>
            <p className="text-2xl font-bold text-[#394353]">{estatisticas.totalVendas}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#C9C4B5] p-4">
            <p className="text-xs text-gray-600 mb-1">Valor Total</p>
            <p className="text-2xl font-bold text-green-600">
              R$ {estatisticas.valorTotal.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-[#C9C4B5] p-4">
            <p className="text-xs text-gray-600 mb-1">Vendas Fechadas</p>
            <p className="text-2xl font-bold text-blue-600">{estatisticas.vendasFechadas}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#C9C4B5] p-4">
            <p className="text-xs text-gray-600 mb-1">Vendas Abertas</p>
            <p className="text-2xl font-bold text-yellow-600">{estatisticas.vendasAbertas}</p>
          </div>
        </div>

        {/* Lista de Vendas */}
        <div className="bg-white rounded-lg border border-[#C9C4B5]">
          <div className="bg-[#394353] text-white px-4 py-3 rounded-t-lg">
            <h2 className="text-base font-semibold">Últimas Vendas</h2>
          </div>
          
          {vendas.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhuma venda registrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Sincronizado</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vendas.map((venda) => (
                    <tr key={venda.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs">
                        {new Date(venda.data_venda).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {venda.cliente_nome || 'Cliente não informado'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(venda.status)}`}>
                          {getStatusTexto(venda.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {venda.sincronizado ? (
                          <span className="text-green-600 font-semibold">✓ Sim</span>
                        ) : (
                          <span className="text-yellow-600 font-semibold">⏳ Não</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-semibold">
                        R$ {venda.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => visualizarVenda(venda.id!)}
                          className="text-[#394353] hover:underline text-xs font-semibold"
                        >
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes da Venda */}
      {vendaSelecionada && (
        <ModalDetalhesVenda
          venda={vendaSelecionada}
          onFechar={() => setVendaSelecionada(null)}
        />
      )}
    </div>
  )
}

// Modal de Detalhes da Venda
interface ModalDetalhesVendaProps {
  venda: Venda
  onFechar: () => void
}

function ModalDetalhesVenda({ venda, onFechar }: ModalDetalhesVendaProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#394353] text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-xl font-bold">Detalhes da Venda</h2>
          <button onClick={onFechar} className="text-white hover:opacity-80 text-2xl">
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Informações Gerais */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600">Data da Venda</p>
              <p className="text-sm font-semibold">
                {new Date(venda.data_venda).toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Status</p>
              <p className="text-sm font-semibold">{venda.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Cliente</p>
              <p className="text-sm font-semibold">
                {venda.cliente_nome || 'Não informado'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">CPF</p>
              <p className="text-sm font-semibold">
                {venda.cliente_cpf || 'Não informado'}
              </p>
            </div>
          </div>

          {/* Itens */}
          <div>
            <h3 className="text-sm font-bold mb-2">Itens da Venda</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Produto</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Qtd</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Preço</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {venda.itens?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-xs">{item.numero_item}</td>
                      <td className="px-3 py-2 text-xs">
                        {item.produto_descricao}
                        <br />
                        <span className="text-gray-500">Cód: {item.produto_codigo}</span>
                      </td>
                      <td className="px-3 py-2 text-xs text-right">{item.quantidade}</td>
                      <td className="px-3 py-2 text-xs text-right">
                        R$ {item.preco_unitario.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-xs text-right font-semibold">
                        R$ {item.valor_total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagamentos */}
          {venda.pagamentos && venda.pagamentos.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-2">Formas de Pagamento</h3>
              <div className="space-y-2">
                {venda.pagamentos.map((pag) => (
                  <div
                    key={pag.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm font-medium">{pag.forma_pagamento}</span>
                    <span className="text-sm font-semibold">R$ {pag.valor.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totais */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-medium">R$ {venda.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Total:</span>
                <span className="text-[#394353]">R$ {venda.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Observações */}
          {venda.observacoes && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Observações</p>
              <p className="text-sm">{venda.observacoes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4">
          <button
            onClick={onFechar}
            className="w-full px-4 py-2 bg-[#394353] text-white text-sm font-semibold rounded-lg hover:opacity-90"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
