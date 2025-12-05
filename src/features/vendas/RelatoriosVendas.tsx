/**
 * RELATÓRIOS DE VENDAS
 * Dashboard e análises de vendas
 */

import React, { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'
import { vendasService } from './vendasService'
import type { Venda } from './types'
import { Toast } from '../../shared/components/Toast'

export const RelatoriosVendas: React.FC = () => {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [carregando, setCarregando] = useState(true)
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null)

  useEffect(() => {
    carregarVendas()
  }, [])

  const carregarVendas = async () => {
    setCarregando(true)
    try {
      const dados = await vendasService.listar({})
      setVendas(dados)
    } catch (error) {
      setToast({ tipo: 'error', mensagem: 'Erro ao carregar vendas' })
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" style={{color: '#394353'}} />
                Relatórios
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                Análises e relatórios de vendas
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard de Vendas */}
        {carregando ? (
          <div className="bg-white rounded-lg shadow-sm p-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
              <p className="text-sm text-gray-600 mt-3">Carregando dados...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total de Vendas */}
            <div className="bg-white rounded-lg shadow p-3 border" style={{borderColor: '#C9C4B5'}}>
              <p className="text-xs text-gray-600 mb-2">Total de Vendas</p>
              <p className="text-2xl font-bold text-gray-900">{vendas.length}</p>
            </div>

            {/* Orçamentos */}
            <div className="bg-white rounded-lg shadow p-3 border" style={{borderColor: '#C9C4B5'}}>
              <p className="text-xs text-gray-600 mb-2">Orçamentos</p>
              <p className="text-2xl font-bold text-gray-600">
                {vendas.filter(v => v.status === 'ORCAMENTO').length}
              </p>
            </div>

            {/* Em Aberto */}
            <div className="bg-white rounded-lg shadow p-3 border" style={{borderColor: '#C9C4B5'}}>
              <p className="text-xs text-gray-600 mb-2">Pedidos em Aberto</p>
              <p className="text-2xl font-bold text-yellow-600">
                {vendas.filter(v => v.status === 'PEDIDO_ABERTO').length}
              </p>
            </div>

            {/* Fechados */}
            <div className="bg-white rounded-lg shadow p-3 border" style={{borderColor: '#C9C4B5'}}>
              <p className="text-xs text-gray-600 mb-2">Pedidos Fechados</p>
              <p className="text-2xl font-bold text-green-600">
                {vendas.filter(v => v.status === 'PEDIDO_FECHADO').length}
              </p>
            </div>

            {/* Cancelados */}
            <div className="bg-white rounded-lg shadow p-3 border" style={{borderColor: '#C9C4B5'}}>
              <p className="text-xs text-gray-600 mb-2">Cancelados</p>
              <p className="text-2xl font-bold text-red-600">
                {vendas.filter(v => v.status === 'CANCELADO').length}
              </p>
            </div>

            {/* Valor Total */}
            <div className="bg-white rounded-lg shadow p-3 border" style={{borderColor: '#C9C4B5'}}>
              <p className="text-xs text-gray-600 mb-2">Valor Total</p>
              <p className="text-2xl font-bold" style={{ color: '#394353' }}>
                R$ {vendas.reduce((sum, v) => sum + Number(v.total), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Valor Médio */}
            <div className="bg-white rounded-lg shadow p-3 border" style={{borderColor: '#C9C4B5'}}>
              <p className="text-xs text-gray-600 mb-2">Valor Médio</p>
              <p className="text-2xl font-bold" style={{ color: '#394353' }}>
                R$ {vendas.length > 0 ? (vendas.reduce((sum, v) => sum + Number(v.total), 0) / vendas.length).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
              </p>
            </div>

            {/* Ticket Médio (Pedidos Fechados) */}
            <div className="bg-white rounded-lg shadow p-3 border" style={{borderColor: '#C9C4B5'}}>
              <p className="text-xs text-gray-600 mb-2">Ticket Médio (Fechados)</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {(() => {
                  const fechados = vendas.filter(v => v.status === 'PEDIDO_FECHADO')
                  return fechados.length > 0 
                    ? (fechados.reduce((sum, v) => sum + Number(v.total), 0) / fechados.length).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '0,00'
                })()}
              </p>
            </div>
          </div>
        )}

        {/* Área de Futuros Relatórios */}
        <div className="mt-4 bg-white rounded-lg shadow-sm p-6 border" style={{borderColor: '#C9C4B5'}}>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3" style={{backgroundColor: 'rgba(57, 67, 83, 0.1)'}}>
              <FileText className="w-8 h-8" style={{color: '#394353'}} />
            </div>
            <h2 className="text-base font-semibold mb-2" style={{color: '#394353'}}>
              Mais Relatórios em Breve
            </h2>
            <p className="text-xs text-gray-500">
              Estamos desenvolvendo gráficos, análises por período, vendedor, produtos mais vendidos e muito mais! 🚀
            </p>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.tipo}
          message={toast.mensagem}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
