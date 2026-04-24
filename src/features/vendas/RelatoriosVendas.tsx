/**
 * RELATÓRIOS DE VENDAS
 * Dashboard e análises de vendas
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileText, Activity, BookMarked, Trash2, ChevronRight, BarChart2,
  Users, AlertTriangle, ShoppingCart, Package, TrendingDown, CheckCircle2,
} from 'lucide-react'
import { Toast } from '../../shared/components/Toast'
import { RadarInatividade } from './RadarInatividade'
import type { ResultadoRadar } from './radarInativiadeService'
import {
  listarRelatoriosSalvos,
  salvarRelatorio,
  excluirRelatorio,
  type RelatorioSalvo,
} from './radarRelatoriosSalvos'

// =====================================================
// KPIs derivados de um ResultadoRadar
// =====================================================
function calcularKPIs(r: ResultadoRadar) {
  const semCompras    = r.clientes.filter(c => c.dias_sem_compra === null).length
  const ativos30d     = r.clientes.filter(c => c.dias_sem_compra !== null && c.dias_sem_compra < 30).length
  const coberturas    = r.clientes.map(c => {
    const total = c.produtos_comprados.length + c.produtos_nao_comprados.length
    return total > 0 ? (c.produtos_comprados.length / total) * 100 : 0
  })
  const coberturaMedia = coberturas.length > 0
    ? Math.round(coberturas.reduce((a, b) => a + b, 0) / coberturas.length)
    : 0

  return {
    totalClientes:   r.total_clientes,
    inativos90d:     r.clientes_inativos_90d,
    inativos60d:     r.clientes_inativos_60d,
    inativos30d:     r.clientes_inativos_30d,
    semCompras,
    ativos30d,
    coberturaMedia,
    universoProdutos: r.universo_produtos.length,
  }
}

export const RelatoriosVendas: React.FC = () => {
  const [carregando, setCarregando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null)
  const [abaSelecionada, setAbaSelecionada] = useState<'dashboard' | 'radar'>('dashboard')

  // Relatórios salvos
  const [relatoriosSalvos, setRelatoriosSalvos] = useState<RelatorioSalvo[]>([])
  // ID do relatório selecionado no dashboard (checkbox)
  const [relatorioSelecionadoId, setRelatorioSelecionadoId] = useState<string | null>(null)
  // Resultado restaurado ao clicar em "Abrir"
  const [resultadoRestaurado, setResultadoRestaurado] = useState<ResultadoRadar | null>(null)

  useEffect(() => {
    const salvos = listarRelatoriosSalvos()
    setRelatoriosSalvos(salvos)
    // Pré-seleciona o mais recente se houver
    if (salvos.length > 0) setRelatorioSelecionadoId(salvos[0].id)
  }, [])

  const handleGravar = useCallback((resultado: ResultadoRadar, titulo: string, resumo: string) => {
    const salvo = salvarRelatorio(titulo, resumo, resultado)
    const lista = listarRelatoriosSalvos()
    setRelatoriosSalvos(lista)
    setRelatorioSelecionadoId(salvo.id)
    setToast({ tipo: 'success', mensagem: `Relatório "${titulo}" gravado com sucesso!` })
  }, [])

  const handleAbrirRelatorio = (relatorio: RelatorioSalvo, e: React.MouseEvent) => {
    e.stopPropagation()
    setResultadoRestaurado(relatorio.resultado)
    setAbaSelecionada('radar')
  }

  const handleExcluirRelatorio = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    excluirRelatorio(id)
    const lista = listarRelatoriosSalvos()
    setRelatoriosSalvos(lista)
    if (relatorioSelecionadoId === id) {
      setRelatorioSelecionadoId(lista.length > 0 ? lista[0].id : null)
    }
  }

  const handleToggleSelecao = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setRelatorioSelecionadoId(prev => prev === id ? null : id)
  }

  // KPIs do relatório selecionado
  const kpis = useMemo(() => {
    if (!relatorioSelecionadoId) return null
    const rel = relatoriosSalvos.find(r => r.id === relatorioSelecionadoId)
    if (!rel) return null
    return { ...calcularKPIs(rel.resultado), titulo: rel.titulo, dataConsulta: rel.resultado.data_consulta }
  }, [relatorioSelecionadoId, relatoriosSalvos])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" style={{color: '#394353'}} />
                Relatórios
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                Análises e relatórios de vendas
              </p>
            </div>

            {/* Abas */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setAbaSelecionada('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  abaSelecionada === 'dashboard'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Dashboard
              </button>
              <button
                onClick={() => setAbaSelecionada('radar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  abaSelecionada === 'radar'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Radar de Inatividade
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo por aba */}
        {abaSelecionada === 'radar' ? (
          <RadarInatividade
            resultadoInicial={resultadoRestaurado}
            onGravar={handleGravar}
          />
        ) : carregando ? (
          <div className="bg-white rounded-lg shadow-sm p-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
              <p className="text-sm text-gray-600 mt-3">Carregando dados...</p>
            </div>
          </div>
        ) : (
          <>
            {/* ---- Cards de KPI ---- */}
            {kpis ? (
              <>
                {/* Cabeçalho do relatório selecionado */}
                <div className="mb-3 px-1 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 flex-shrink-0" style={{color: '#394353'}} />
                  <p className="text-xs font-semibold truncate" style={{color: '#394353'}}>{kpis.titulo}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    · Consulta em {new Date(kpis.dataConsulta).toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Total Clientes */}
                  <div className="bg-white rounded-lg shadow-sm p-3 border" style={{borderColor: '#C9C4B5'}}>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500">Total Clientes</p>
                    </div>
                    <p className="text-2xl font-bold" style={{color: '#394353'}}>{kpis.totalClientes}</p>
                  </div>

                  {/* Inativos +90 dias */}
                  <div className="bg-white rounded-lg shadow-sm p-3 border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500">Inativos +90 dias</p>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{kpis.inativos90d}</p>
                    <p className="text-xs text-red-400 mt-0.5">
                      {kpis.totalClientes > 0 ? Math.round((kpis.inativos90d / kpis.totalClientes) * 100) : 0}% do total
                    </p>
                  </div>

                  {/* Inativos +60 dias */}
                  <div className="bg-white rounded-lg shadow-sm p-3 border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500">Inativos +60 dias</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{kpis.inativos60d}</p>
                    <p className="text-xs text-orange-400 mt-0.5">
                      {kpis.totalClientes > 0 ? Math.round((kpis.inativos60d / kpis.totalClientes) * 100) : 0}% do total
                    </p>
                  </div>

                  {/* Inativos +30 dias */}
                  <div className="bg-white rounded-lg shadow-sm p-3 border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500">Inativos +30 dias</p>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">{kpis.inativos30d}</p>
                    <p className="text-xs text-yellow-500 mt-0.5">
                      {kpis.totalClientes > 0 ? Math.round((kpis.inativos30d / kpis.totalClientes) * 100) : 0}% do total
                    </p>
                  </div>

                  {/* Sem compras */}
                  <div className="bg-white rounded-lg shadow-sm p-3 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingCart className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500">Sem Compras Registradas</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-600">{kpis.semCompras}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Nunca compraram</p>
                  </div>

                  {/* Ativos últimos 30d */}
                  <div className="bg-white rounded-lg shadow-sm p-3 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500">Ativos (últimos 30 dias)</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{kpis.ativos30d}</p>
                    <p className="text-xs text-green-400 mt-0.5">Compraram recentemente</p>
                  </div>

                  {/* Cobertura média */}
                  <div className="bg-white rounded-lg shadow-sm p-3 border" style={{borderColor: '#C9C4B5'}}>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500">Cobertura Média</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{kpis.coberturaMedia}%</p>
                    <p className="text-xs text-purple-400 mt-0.5">Produtos comprados / universo</p>
                  </div>

                  {/* Universo de Produtos */}
                  <div className="bg-white rounded-lg shadow-sm p-3 border" style={{borderColor: '#C9C4B5'}}>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500">Universo de Produtos</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{kpis.universoProdutos}</p>
                    <p className="text-xs text-blue-400 mt-0.5">Produtos no período</p>
                  </div>
                </div>
              </>
            ) : (
              // Sem relatório selecionado: mostra placeholder
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center mb-0" style={{borderColor: '#C9C4B5'}}>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3" style={{backgroundColor: 'rgba(57,67,83,0.07)'}}>
                  <BarChart2 className="w-7 h-7" style={{color: '#394353'}} />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Selecione um relatório gravado</p>
                <p className="text-xs text-gray-400">
                  Marque o checkbox de um relatório abaixo para ver os indicadores do Radar de Inatividade aqui.
                </p>
              </div>
            )}

            {/* ---- Relatórios Gravados do Radar ---- */}
            <div className="mt-4 bg-white rounded-lg shadow-sm border" style={{borderColor: '#C9C4B5'}}>
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{borderColor: '#C9C4B5'}}>
                <BookMarked className="w-4 h-4 flex-shrink-0" style={{color: '#394353'}} />
                <h2 className="text-sm font-semibold" style={{color: '#394353'}}>
                  Relatórios do Radar de Inatividade Gravados
                </h2>
                {relatoriosSalvos.length > 0 && (
                  <span className="ml-auto text-xs text-gray-400">{relatoriosSalvos.length} gravado(s)</span>
                )}
              </div>

              {relatoriosSalvos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{backgroundColor: 'rgba(57,67,83,0.08)'}}>
                    <BarChart2 className="w-6 h-6" style={{color: '#394353'}} />
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Nenhum relatório gravado ainda</p>
                  <p className="text-xs text-gray-400">
                    Execute um Radar de Inatividade e clique em <strong>"Gravar Relatório"</strong> para salvá-lo aqui.
                  </p>
                </div>
              ) : (
                <ul className="divide-y" style={{borderColor: '#C9C4B5'}}>
                  {relatoriosSalvos.map(rel => {
                    const selecionado = relatorioSelecionadoId === rel.id
                    return (
                      <li
                        key={rel.id}
                        onClick={(e) => handleToggleSelecao(rel.id, e)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors group ${
                          selecionado ? 'bg-slate-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Checkbox (radio behavior) */}
                        <div
                          className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                            selecionado
                              ? 'border-transparent'
                              : 'border-gray-300 bg-white'
                          }`}
                          style={selecionado ? {backgroundColor: '#394353', borderColor: '#394353'} : {}}
                        >
                          {selecionado && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>

                        <div
                          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                          style={{backgroundColor: selecionado ? 'rgba(57,67,83,0.15)' : 'rgba(57,67,83,0.07)'}}
                        >
                          <Activity className="w-3.5 h-3.5" style={{color: '#394353'}} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${selecionado ? 'text-gray-900' : 'text-gray-700'}`}>
                            {rel.titulo}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{rel.resumo}</p>
                          <p className="text-xs text-gray-300 mt-0.5">
                            Gravado em {new Date(rel.data_gravacao).toLocaleString('pt-BR')}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => handleAbrirRelatorio(rel, e)}
                            className="text-xs text-gray-400 group-hover:text-slate-600 flex items-center gap-0.5 transition-colors hover:underline"
                          >
                            Abrir <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleExcluirRelatorio(rel.id, e)}
                            className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Excluir relatório"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

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
          </>
        )}
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

