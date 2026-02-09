// =====================================================
// COMPONENTE - LISTAGEM DE VENDAS
// Lista, filtra e gerencia vendas
// Data: 02/12/2025
// =====================================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { vendasService } from './vendasService'
import type { Venda, VendaFiltros, StatusVenda } from './types'
import { STATUS_VENDA_LABELS, getStatusColor, getStatusLabel } from './types'
import { Toast } from '../../shared/components/Toast'
import { DateRangePicker } from '../../shared/components/DatePicker'

export default function ListagemVendas() {
  const navigate = useNavigate()
  const [vendas, setVendas] = useState<Venda[]>([])
  const [carregando, setCarregando] = useState(true)
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null)

  const [filtros, setFiltros] = useState<VendaFiltros>({})
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  useEffect(() => {
    carregarVendas()
  }, [])

  const carregarVendas = async () => {
    setCarregando(true)
    try {
      const dados = await vendasService.listar(filtros)
      setVendas(dados)
    } catch (error) {
      setToast({ tipo: 'error', mensagem: 'Erro ao carregar vendas' })
    } finally {
      setCarregando(false)
    }
  }

  const aplicarFiltros = () => {
    carregarVendas()
    setMostrarFiltros(false)
  }

  const limparFiltros = () => {
    setFiltros({})
    setTimeout(carregarVendas, 100)
  }

  const handleConfirmar = async (id: number | string) => {
    try {
      const resultado = await vendasService.confirmarPedido(id)
      if (resultado.sucesso) {
        setToast({ tipo: 'success', mensagem: resultado.mensagem })
        carregarVendas()
      } else {
        setToast({ tipo: 'error', mensagem: resultado.mensagem })
      }
    } catch (error) {
      setToast({ tipo: 'error', mensagem: 'Erro ao confirmar pedido' })
    }
  }

  const handleCancelar = async (id: number | string) => {
    if (!confirm('Deseja realmente cancelar esta venda?')) return

    try {
      const resultado = await vendasService.cancelar(id)
      if (resultado.sucesso) {
        setToast({ tipo: 'success', mensagem: resultado.mensagem })
        carregarVendas()
      } else {
        setToast({ tipo: 'error', mensagem: resultado.mensagem })
      }
    } catch (error) {
      setToast({ tipo: 'error', mensagem: 'Erro ao cancelar venda' })
    }
  }

  const handleEmitirNotaFiscal = (venda: Venda) => {
    // Navegar para tela de emissão de nota fiscal com dados da venda
    navigate('/notas-fiscais/emitir', { state: { venda } })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Vendas</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gerenciamento de orçamentos, pedidos e vendas
            </p>
          </div>
          <button
            onClick={() => navigate('/vendas/nova')}
            className="px-3 py-1.5 text-sm text-white rounded-lg hover:opacity-90 flex items-center gap-1.5 transition-opacity"
            style={{ backgroundColor: '#394353' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Venda
          </button>
        </div>
      </div>

      {/* Barra de Ações */}
      <div className="bg-white rounded-lg shadow p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
            </button>

            {Object.keys(filtros).length > 0 && (
              <button
                onClick={limparFiltros}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Limpar filtros
              </button>
            )}
          </div>

          <button
            onClick={carregarVendas}
            className="px-4 py-2 text-slate-600 hover:text-slate-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Painel de Filtros */}
        {mostrarFiltros && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filtros.status || ''}
                  onChange={(e) => setFiltros({ ...filtros, status: e.target.value as StatusVenda })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                >
                  <option value="">Todos</option>
                  {STATUS_VENDA_LABELS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Período
                </label>
                <DateRangePicker
                  startDate={filtros.data_inicio ? new Date(filtros.data_inicio) : null}
                  endDate={filtros.data_fim ? new Date(filtros.data_fim) : null}
                  onStartDateChange={(date) => setFiltros({ ...filtros, data_inicio: date ? date.toISOString().split('T')[0] : undefined })}
                  onEndDateChange={(date) => setFiltros({ ...filtros, data_fim: date ? date.toISOString().split('T')[0] : undefined })}
                  startPlaceholder="Data inicial"
                  endPlaceholder="Data final"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Vendedor
                </label>
                <input
                  type="text"
                  value={filtros.vendedor || ''}
                  onChange={(e) => setFiltros({ ...filtros, vendedor: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  placeholder="Nome do vendedor"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setMostrarFiltros(false)}
                className="px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={aplicarFiltros}
                className="px-3 py-1.5 text-sm text-white rounded-md hover:opacity-90"
                style={{ backgroundColor: '#394353' }}
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Vendas */}
      <div className="bg-white rounded-lg shadow overflow-hidden border" style={{ borderColor: '#C9C4B5' }}>
        {carregando ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            <p className="text-sm text-gray-600 mt-3">Carregando vendas...</p>
          </div>
        ) : vendas.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma venda encontrada</h3>
            <p className="mt-1 text-xs text-gray-500">Comece criando uma nova venda.</p>
            <div className="mt-4">
              <button
                onClick={() => navigate('/vendas/nova')}
                className="px-3 py-1.5 text-sm text-white rounded-md hover:opacity-90"
                style={{ backgroundColor: '#394353' }}
              >
                + Nova Venda
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y" style={{ borderColor: '#C9C4B5' }}>
              <thead style={{ backgroundColor: '#394353' }}>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                    Número
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                    Tipo
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                    Cliente
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                    Data
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                    Total
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                    Status
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-white uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y" style={{ borderColor: '#C9C4B5' }}>
                {vendas.map((venda) => (
                  <tr key={venda.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">#{venda.numero}</div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="text-xs text-gray-600">{venda.tipo_venda}</div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="text-xs text-gray-900">{venda.cliente_nome || 'Consumidor'}</div>
                      {venda.cliente_cpf_cnpj && (
                        <div className="text-xs text-gray-500">{venda.cliente_cpf_cnpj}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {new Date(venda.data_venda).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="text-xs font-semibold text-gray-900">
                        R$ {Number(venda.total).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(venda.status)}`}>
                        {getStatusLabel(venda.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botão Ver Detalhes - sempre visível */}
                        <button
                          onClick={() => navigate(`/vendas/${venda.id}`)}
                          style={{ backgroundColor: '#E5F6F7', color: '#009FC4' }}
                          className="px-2 py-1 text-xs rounded hover:opacity-80 font-semibold"
                          title="Ver detalhes"
                        >
                          Ver Detalhes
                        </button>

                        {/* Botões para PEDIDO_ABERTO */}
                        {venda.status === 'PEDIDO_ABERTO' && (
                          <>
                            <button
                              onClick={() => handleConfirmar(venda.id)}
                              style={{ backgroundColor: '#394353' }}
                              className="px-2 py-1 text-xs text-white rounded hover:opacity-90"
                              title="Confirmar pedido"
                            >
                              Confirmar
                            </button>

                            <button
                              onClick={() => handleCancelar(venda.id)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                              title="Cancelar venda"
                            >
                              Cancelar
                            </button>
                          </>
                        )}

                        {/* Botões para PEDIDO_FECHADO */}
                        {venda.status === 'PEDIDO_FECHADO' && (
                          <button
                            onClick={() => handleEmitirNotaFiscal(venda)}
                            style={{ backgroundColor: '#394353' }}
                            className="px-2 py-1 text-xs text-white rounded hover:opacity-90 flex items-center gap-1"
                            title="Emitir Nota Fiscal"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Emitir NF
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resumo */}
      {vendas.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          <div className="bg-white rounded-lg shadow p-3">
            <p className="text-xs text-gray-600">Total de Vendas</p>
            <p className="text-lg font-bold text-gray-900">{vendas.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-3">
            <p className="text-xs text-gray-600">Orçamentos</p>
            <p className="text-lg font-bold text-gray-600">
              {vendas.filter(v => v.status === 'ORCAMENTO').length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-3">
            <p className="text-xs text-gray-600">Em Aberto</p>
            <p className="text-lg font-bold text-yellow-600">
              {vendas.filter(v => v.status === 'PEDIDO_ABERTO').length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-3">
            <p className="text-xs text-gray-600">Fechados</p>
            <p className="text-lg font-bold text-green-600">
              {vendas.filter(v => v.status === 'PEDIDO_FECHADO').length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-3">
            <p className="text-xs text-gray-600">Valor Total</p>
            <p className="text-lg font-bold" style={{ color: '#394353' }}>
              R$ {vendas.reduce((sum, v) => sum + Number(v.total), 0).toFixed(2)}
            </p>
          </div>
        </div>
      )}

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
