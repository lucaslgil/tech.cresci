import React from 'react'
import type { Venda } from '../types'

interface ParametrosImpressao {
  logoUrl: string | null;
  nomeEmpresa: string;
  slogan: string;
  mostrarLogo: boolean;
}

interface PedidoA4Props {
  venda: Venda
  parametros: ParametrosImpressao
  formatarData: (data: string) => string
  formatarMoeda: (valor: number) => string
  calcularTotal: () => number
}

export default function PedidoA4({ venda, parametros, formatarData, formatarMoeda, calcularTotal }: PedidoA4Props) {
  return (
    <div className="bg-white p-8 print:p-12" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Cabeçalho */}
      <div className="border-b-2 border-[#394353] pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {parametros.mostrarLogo && parametros.logoUrl && (
              <img src={parametros.logoUrl} alt="Logo" className="max-h-20 max-w-[140px] object-contain" />
            )}

            <div>
              <h1 className="text-2xl font-bold text-[#394353]">{parametros.nomeEmpresa}</h1>
              <p className="text-xs text-gray-600 mt-1">{parametros.slogan}</p>
            </div>
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
                <td className="text-xs p-2 text-right border border-[#C9C4B5] font-semibold">{formatarMoeda(item.quantidade * item.valor_unitario)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totalizadores e rodapé compactos */}
      <div className="flex justify-end mb-6">
        <div className="w-64 border border-[#C9C4B5] rounded-md p-3">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold text-gray-800">{formatarMoeda(venda.itens?.reduce((acc, item) => acc + (item.quantidade * item.valor_unitario), 0) || 0)}</span>
          </div>
          {venda.desconto && venda.desconto > 0 && (
            <div className="flex justify-between text-xs mb-2 text-red-600"><span>Desconto:</span><span className="font-semibold">-{formatarMoeda(venda.desconto)}</span></div>
          )}
          {venda.frete && venda.frete > 0 && (
            <div className="flex justify-between text-xs mb-2"><span className="text-gray-600">Frete:</span><span className="font-semibold text-gray-800">{formatarMoeda(venda.frete)}</span></div>
          )}
          <div className="flex justify-between text-sm font-bold border-t-2 border-[#394353] pt-2 mt-2">
            <span className="text-[#394353]">TOTAL:</span>
            <span className="text-[#394353]">{formatarMoeda(calcularTotal())}</span>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-[#C9C4B5] pt-4 mt-8">
        <div className="text-center text-xs text-gray-500">
          <p>Documento gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
          <p className="mt-1">CRESCI E PERDI FRANCHISING - Sistema de Gestão</p>
        </div>
      </div>
    </div>
  )
}
