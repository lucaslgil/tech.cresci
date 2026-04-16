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
  const [todasAsVendas, setTodasAsVendas] = useState<Venda[]>([]) // Armazenar todos os dados
  const [carregando, setCarregando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null)
  const [filtrosAplicados, setFiltrosAplicados] = useState(false)

  const [filtros, setFiltros] = useState<VendaFiltros>({})

  // Estado para métricas
  const [metricas, setMetricas] = useState({
    totalVendas: 0,
    orcamentos: 0,
    emAberto: 0,
    fechados: 0,
    valorTotal: 0,
    totalRegistros: 0
  })

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1)
  const REGISTROS_POR_PAGINA = 100

  useEffect(() => {
    // Não carrega automaticamente ao entrar - aguarda o filtro
  }, [])

  // Aplicar paginação quando a página mudar ou os dados carregarem
  useEffect(() => {
    if (filtrosAplicados && todasAsVendas.length > 0) {
      const indiceInicio = (paginaAtual - 1) * REGISTROS_POR_PAGINA
      const indiceFim = indiceInicio + REGISTROS_POR_PAGINA
      const vendasPaginadas = todasAsVendas.slice(indiceInicio, indiceFim)
      setVendas(vendasPaginadas)
    }
  }, [paginaAtual, todasAsVendas, filtrosAplicados])

  const carregarVendas = async () => {
    setCarregando(true)
    try {
      const dados = await vendasService.listar(filtros)
      
      // Armazenar todos os dados para paginação em memória
      setTodasAsVendas(dados)
      
      // Calcular métricas com todos os dados
      const totalRegistros = dados.length
      const novasMetricas = {
        totalVendas: totalRegistros,
        orcamentos: dados.filter(v => v.status === 'ORCAMENTO').length,
        emAberto: dados.filter(v => v.status === 'PEDIDO_ABERTO').length,
        fechados: dados.filter(v => v.status === 'PEDIDO_FECHADO').length,
        valorTotal: dados.reduce((sum, v) => sum + Number(v.total), 0),
        totalRegistros: totalRegistros
      }
      
      setMetricas(novasMetricas)
      setFiltrosAplicados(true)
    } catch (error) {
      setToast({ tipo: 'error', mensagem: 'Erro ao carregar vendas' })
      setMetricas({
        totalVendas: 0,
        orcamentos: 0,
        emAberto: 0,
        fechados: 0,
        valorTotal: 0,
        totalRegistros: 0
      })
      setTodasAsVendas([])
    } finally {
      setCarregando(false)
    }
  }

  const aplicarFiltros = () => {
    setPaginaAtual(1) // Resetar para primeira página
    carregarVendas()
  }

  const limparFiltros = () => {
    setFiltros({})
    setPaginaAtual(1)
    setMetricas({
      totalVendas: 0,
      orcamentos: 0,
      emAberto: 0,
      fechados: 0,
      valorTotal: 0,
      totalRegistros: 0
    })
    setVendas([])
    setTodasAsVendas([])
    setFiltrosAplicados(false)
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
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Filtros de Pesquisa</h2>
          <div className="flex items-center gap-2">
            {Object.keys(filtros).length > 0 && (
              <button
                onClick={limparFiltros}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Limpar filtros
              </button>
            )}
            <button
              onClick={carregarVendas}
              disabled={!filtrosAplicados}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-800 rounded transition-colors"
              title="Atualizar resultados"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Painel de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Status
            </label>
            <select
              value={filtros.status || ''}
              onChange={(e) => setFiltros({ ...filtros, status: e.target.value as StatusVenda })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os Status</option>
              {STATUS_VENDA_LABELS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
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
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Vendedor
            </label>
            <input
              type="text"
              value={filtros.vendedor || ''}
              onChange={(e) => setFiltros({ ...filtros, vendedor: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nome do vendedor"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={limparFiltros}
            className="px-4 py-2 text-sm bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={aplicarFiltros}
            className="px-4 py-2 text-sm text-white rounded-md hover:opacity-90 font-semibold transition-opacity flex items-center gap-2"
            style={{ backgroundColor: '#394353' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Indicadores de Dashboard */}
      {filtrosAplicados && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card Total de Vendas */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total de Vendas</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{metricas.totalVendas}</p>
                <p className="text-xs text-blue-700 mt-2">
                  {metricas.totalRegistros > REGISTROS_POR_PAGINA 
                    ? `${metricas.totalRegistros} total (mostrando ${metricas.totalVendas})`
                    : `${metricas.totalRegistros} no total`
                  }
                </p>
              </div>
              <div className="text-blue-300 opacity-20">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card Orçamentos */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Orçamentos</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{metricas.orcamentos}</p>
                <p className="text-xs text-purple-700 mt-2">
                  {metricas.totalVendas > 0 
                    ? `${((metricas.orcamentos / metricas.totalVendas) * 100).toFixed(1)}% do total`
                    : "-"
                  }
                </p>
              </div>
              <div className="text-purple-300 opacity-20">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card Em Aberto */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Em Aberto</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">{metricas.emAberto}</p>
                <p className="text-xs text-amber-700 mt-2">
                  {metricas.totalVendas > 0 
                    ? `${((metricas.emAberto / metricas.totalVendas) * 100).toFixed(1)}% do total`
                    : "-"
                  }
                </p>
              </div>
              <div className="text-amber-300 opacity-20">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card Fechados */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Fechados</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{metricas.fechados}</p>
                <p className="text-xs text-green-700 mt-2">
                  {metricas.totalVendas > 0 
                    ? `${((metricas.fechados / metricas.totalVendas) * 100).toFixed(1)}% do total`
                    : "-"
                  }
                </p>
              </div>
              <div className="text-green-300 opacity-20">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card Valor Total */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Valor Total</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">
                  R$ {metricas.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-emerald-700 mt-2">
                  {metricas.totalVendas > 0 
                    ? `Média: R$ ${(metricas.valorTotal / metricas.totalVendas).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "-"
                  }
                </p>
              </div>
              <div className="text-emerald-300 opacity-20">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem quando nenhum filtro foi aplicado */}
      {!filtrosAplicados ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Nenhum filtro aplicado</h3>
          <p className="mt-2 text-sm text-gray-600 max-w-sm mx-auto">
            Use os filtros acima para pesquisar vendas. Após aplicar os filtros, você verá os indicadores e a lista de vendas será exibida.
          </p>
          <div className="mt-6">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-4 py-2 text-sm text-white rounded-md hover:opacity-90 transition-opacity font-semibold"
              style={{ backgroundColor: '#394353' }}
            >
              Ir para Filtros
            </button>
          </div>
        </div>
      ) : (
        /* Tabela de Vendas */
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          {carregando ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
              <p className="text-sm text-gray-600 mt-3">Carregando vendas...</p>
            </div>
          ) : vendas.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-3 text-base font-semibold text-gray-900">Nenhuma venda encontrada</h3>
              <p className="mt-1 text-sm text-gray-600">Nenhum resultado para os filtros aplicados.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y border-t" style={{ borderColor: '#C9C4B5' }}>
                  <thead style={{ backgroundColor: '#394353' }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Número
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y" style={{ borderColor: '#C9C4B5' }}>
                    {vendas.map((venda) => (
                      <tr key={venda.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs font-semibold text-gray-900">#{venda.numero}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-600">{venda.tipo_venda}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">{venda.cliente_nome || 'Consumidor'}</div>
                          {venda.cliente_cpf_cnpj && (
                            <div className="text-xs text-gray-500">{venda.cliente_cpf_cnpj}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            {new Date(venda.data_venda).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs font-semibold text-gray-900">
                            R$ {Number(venda.total).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center ${getStatusColor(venda.status)}`}>
                            {getStatusLabel(venda.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-xs">
                          <div className="flex items-center justify-end gap-2">
                            {/* Botão Ver Detalhes - sempre visível */}
                            <button
                              onClick={() => navigate(`/vendas/${venda.id}`)}
                              style={{ backgroundColor: '#E5F6F7', color: '#009FC4' }}
                              className="px-2 py-1 text-xs rounded hover:opacity-80 font-semibold transition-opacity"
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
                                  className="px-2 py-1 text-xs text-white rounded hover:opacity-90 transition-opacity font-semibold"
                                  title="Confirmar pedido"
                                >
                                  Confirmar
                                </button>

                                <button
                                  onClick={() => handleCancelar(venda.id)}
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-semibold"
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
                                className="px-2 py-1 text-xs text-white rounded hover:opacity-90 transition-opacity flex items-center gap-1 font-semibold"
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

              {/* Paginação */}
              {metricas.totalRegistros > REGISTROS_POR_PAGINA && (
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: '#C9C4B5' }}>
                  <div className="text-xs text-gray-600">
                    Mostrando <span className="font-semibold">{((paginaAtual - 1) * REGISTROS_POR_PAGINA) + 1}</span> a <span className="font-semibold">{Math.min(paginaAtual * REGISTROS_POR_PAGINA, metricas.totalRegistros)}</span> de <span className="font-semibold">{metricas.totalRegistros}</span> registros
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPaginaAtual(paginaAtual - 1)}
                      disabled={paginaAtual === 1}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Anterior
                    </button>
                    
                    <span className="text-xs text-gray-700 font-medium px-3 py-1.5">
                      Página <span className="font-semibold">{paginaAtual}</span> de <span className="font-semibold">{Math.ceil(metricas.totalRegistros / REGISTROS_POR_PAGINA)}</span>
                    </span>
                    
                    <button
                      onClick={() => setPaginaAtual(paginaAtual + 1)}
                      disabled={paginaAtual >= Math.ceil(metricas.totalRegistros / REGISTROS_POR_PAGINA)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Próxima →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
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
