// =====================================================
// COMPONENTE - IMPRESSÃO DE PEDIDO
// Template A4 para impressão de pedidos de venda
// Data: 09/12/2025
// =====================================================

import { useEffect, useState } from 'react'
import { vendasService } from '../vendasService'
import type { Venda } from '../types'

interface ImpressaoPedidoProps {
  vendaId: string | number
  onClose: () => void
}

export function ImpressaoPedido({ vendaId, onClose }: ImpressaoPedidoProps) {
  const [venda, setVenda] = useState<Venda | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const carregarVenda = async () => {
      try {
        const resultado = await vendasService.buscarPorId(Number(vendaId))
        if (resultado) {
          setVenda(resultado)
        }
      } catch (error) {
        console.error('Erro ao carregar venda:', error)
      } finally {
        setCarregando(false)
      }
    }

    carregarVenda()
  }, [vendaId])

  const handleImprimir = () => {
    window.print()
  }

  if (carregando) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <p className="text-sm">Carregando pedido...</p>
        </div>
      </div>
    )
  }

  if (!venda) {
    return null
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const calcularTotal = () => {
    const subtotal = venda.itens?.reduce((acc, item) => {
      return acc + (item.quantidade * item.valor_unitario)
    }, 0) || 0

    const desconto = venda.desconto || 0
    const frete = venda.frete || 0
    
    return subtotal - desconto + frete
  }

  return (
    <>
      {/* Overlay e botões - não imprimem */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Visualização de Impressão</h2>
            <div className="flex gap-2">
              <button
                onClick={handleImprimir}
                className="px-4 py-2 bg-[#394353] text-white text-sm font-semibold rounded-md hover:opacity-90 transition-all"
              >
                🖨️ Imprimir
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white text-sm font-semibold rounded-md hover:bg-gray-600 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>

          {/* Conteúdo imprimível */}
          <div id="area-impressao">
            <PedidoA4 venda={venda} formatarData={formatarData} formatarMoeda={formatarMoeda} calcularTotal={calcularTotal} />
          </div>
        </div>
      </div>

      {/* Versão para impressão - oculta na tela */}
      <div className="hidden print:block">
        <PedidoA4 venda={venda} formatarData={formatarData} formatarMoeda={formatarMoeda} calcularTotal={calcularTotal} />
      </div>
    </>
  )
}

// Componente do template A4
interface PedidoA4Props {
  venda: Venda
  formatarData: (data: string) => string
  formatarMoeda: (valor: number) => string
  calcularTotal: () => number
}

function PedidoA4({ venda, formatarData, formatarMoeda, calcularTotal }: PedidoA4Props) {
  return (
    <div className="bg-white p-8 print:p-12" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Cabeçalho */}
      <div className="border-b-2 border-[#394353] pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#394353]">CRESCI E PERDI FRANCHISING</h1>
            <p className="text-xs text-gray-600 mt-1">Sistema de Gestão</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Pedido Nº</p>
            <p className="text-2xl font-bold text-[#394353]">#{venda.numero || venda.id}</p>
          </div>
        </div>
      </div>

      {/* Informações do Pedido */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border border-[#C9C4B5] rounded-md p-3">
          <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase border-b border-gray-200 pb-1">Cliente</h3>
          <p className="text-sm font-semibold text-gray-800">{venda.cliente_nome || 'Não informado'}</p>
          {venda.cliente_cpf_cnpj && (
            <p className="text-xs text-gray-600 mt-1">CPF/CNPJ: {venda.cliente_cpf_cnpj}</p>
          )}
        </div>

        <div className="border border-[#C9C4B5] rounded-md p-3">
          <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase border-b border-gray-200 pb-1">Dados do Pedido</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-600">Data:</p>
              <p className="font-semibold text-gray-800">{formatarData(venda.data_venda)}</p>
            </div>
            <div>
              <p className="text-gray-600">Status:</p>
              <p className="font-semibold text-gray-800">{venda.status?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vendedor */}
      {venda.vendedor && (
        <div className="border border-[#C9C4B5] rounded-md p-3 mb-6">
          <h3 className="text-xs font-semibold text-gray-700 mb-1 uppercase border-b border-gray-200 pb-1">Vendedor</h3>
          <p className="text-sm text-gray-800">{venda.vendedor}</p>
        </div>
      )}

      {/* Itens do Pedido */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Itens do Pedido</h3>
        <table className="w-full border-collapse border border-[#C9C4B5]">
          <thead>
            <tr style={{ backgroundColor: '#394353' }}>
              <th className="text-left text-xs font-semibold text-white p-2 border border-[#C9C4B5]">Código</th>
              <th className="text-left text-xs font-semibold text-white p-2 border border-[#C9C4B5]">Descrição</th>
              <th className="text-center text-xs font-semibold text-white p-2 border border-[#C9C4B5]">Qtd</th>
              <th className="text-right text-xs font-semibold text-white p-2 border border-[#C9C4B5]">Valor Unit.</th>
              <th className="text-right text-xs font-semibold text-white p-2 border border-[#C9C4B5]">Total</th>
            </tr>
          </thead>
          <tbody>
            {venda.itens?.map((item, index) => (
              <tr key={index} className="border-b border-[#C9C4B5]">
                <td className="text-xs p-2 border border-[#C9C4B5]">{item.produto_codigo || '-'}</td>
                <td className="text-xs p-2 border border-[#C9C4B5]">{item.produto_nome}</td>
                <td className="text-xs p-2 text-center border border-[#C9C4B5]">{item.quantidade}</td>
                <td className="text-xs p-2 text-right border border-[#C9C4B5]">{formatarMoeda(item.valor_unitario)}</td>
                <td className="text-xs p-2 text-right border border-[#C9C4B5] font-semibold">
                  {formatarMoeda(item.quantidade * item.valor_unitario)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totalizadores */}
      <div className="flex justify-end mb-6">
        <div className="w-64 border border-[#C9C4B5] rounded-md p-3">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold text-gray-800">
              {formatarMoeda(venda.itens?.reduce((acc, item) => acc + (item.quantidade * item.valor_unitario), 0) || 0)}
            </span>
          </div>
          
          {venda.desconto && venda.desconto > 0 && (
            <div className="flex justify-between text-xs mb-2 text-red-600">
              <span>Desconto:</span>
              <span className="font-semibold">-{formatarMoeda(venda.desconto)}</span>
            </div>
          )}
          
          {venda.frete && venda.frete > 0 && (
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-600">Frete:</span>
              <span className="font-semibold text-gray-800">{formatarMoeda(venda.frete)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm font-bold border-t-2 border-[#394353] pt-2 mt-2">
            <span className="text-[#394353]">TOTAL:</span>
            <span className="text-[#394353]">{formatarMoeda(calcularTotal())}</span>
          </div>
        </div>
      </div>

      {/* Forma de Pagamento */}
      <div className="border border-[#C9C4B5] rounded-md p-3 mb-6">
        <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase border-b border-gray-200 pb-1">Condições de Pagamento</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-gray-600">Forma de Pagamento:</p>
            <p className="font-semibold text-gray-800">{venda.forma_pagamento?.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-gray-600">Condição:</p>
            <p className="font-semibold text-gray-800">{venda.condicao_pagamento?.replace('_', ' ')}</p>
          </div>
        </div>
        {venda.numero_parcelas && venda.numero_parcelas > 1 && (
          <p className="text-xs text-gray-600 mt-2">Parcelado em {venda.numero_parcelas}x</p>
        )}
      </div>

      {/* Observações */}
      {venda.observacoes && (
        <div className="border border-[#C9C4B5] rounded-md p-3 mb-6">
          <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase border-b border-gray-200 pb-1">Observações</h3>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{venda.observacoes}</p>
        </div>
      )}

      {/* Rodapé */}
      <div className="border-t-2 border-[#C9C4B5] pt-4 mt-8">
        <div className="text-center text-xs text-gray-500">
          <p>Documento gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
          <p className="mt-1">CRESCI E PERDI FRANCHISING - Sistema de Gestão</p>
        </div>
      </div>
    </div>
  )
}
