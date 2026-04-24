/**
 * RELATÓRIOS DE VENDAS
 * Dashboard e análises de vendas
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileText, Activity, BookMarked, Trash2, ChevronRight, BarChart2,
  Users, AlertTriangle, ShoppingCart, Package, TrendingDown, CheckCircle2,
  X,
} from 'lucide-react'
import { Toast } from '../../shared/components/Toast'
import { RadarInatividade } from './RadarInatividade'
import type { ResultadoRadar, ClienteRadar, ProdutoRadar } from './radarInativiadeService'
import {
  listarRelatoriosSalvos,
  salvarRelatorio,
  excluirRelatorio,
  type RelatorioSalvo,
} from './radarRelatoriosSalvos'

// =====================================================
// TIPOS DO MODAL
// =====================================================

type TipoModalKPI =
  | 'total'
  | 'inativos90'
  | 'inativos60'
  | 'inativos30'
  | 'semCompras'
  | 'ativos30'
  | 'cobertura'
  | 'produtos'

interface DadosModal {
  tipo: TipoModalKPI
  titulo: string
  clientes?: ClienteRadar[]
  produtos?: ProdutoRadar[]
}

// =====================================================
// MODAL DE DETALHES DO KPI
// =====================================================

const ModalKPI: React.FC<{ dados: DadosModal; onClose: () => void }> = ({ dados, onClose }) => {
  const [busca, setBusca] = useState('')

  const clientesFiltrados = useMemo(() => {
    if (!dados.clientes) return []
    if (!busca) return dados.clientes
    const t = busca.toLowerCase()
    return dados.clientes.filter(c =>
      c.nome.toLowerCase().includes(t) ||
      (c.nome_fantasia || '').toLowerCase().includes(t) ||
      c.codigo.toLowerCase().includes(t)
    )
  }, [dados.clientes, busca])

  const produtosFiltrados = useMemo(() => {
    if (!dados.produtos) return []
    if (!busca) return dados.produtos
    const t = busca.toLowerCase()
    return dados.produtos.filter(p =>
      (p.descricao || '').toLowerCase().includes(t) ||
      p.codigo.toLowerCase().includes(t)
    )
  }, [dados.produtos, busca])

  const total = dados.clientes?.length ?? dados.produtos?.length ?? 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#C9C4B5' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: '#394353' }}>{dados.titulo}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {dados.clientes ? `${total} cliente${total !== 1 ? 's' : ''}` : `${total} produto${total !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Busca */}
        <div className="px-5 py-3 border-b" style={{ borderColor: '#C9C4B5' }}>
          <input
            type="text"
            placeholder={dados.clientes ? 'Buscar por nome, fantasia ou código...' : 'Buscar produto...'}
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2"
            style={{ borderColor: '#C9C4B5', focusRingColor: '#394353' }}
            autoFocus
          />
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1">
          {dados.clientes && (
            <table className="w-full text-xs">
              <thead className="sticky top-0" style={{ backgroundColor: '#394353' }}>
                <tr>
                  <th className="text-left px-4 py-2 text-white font-semibold">#</th>
                  <th className="text-left px-4 py-2 text-white font-semibold">Razão Social</th>
                  <th className="text-left px-4 py-2 text-white font-semibold">Nome Fantasia</th>
                  <th className="text-left px-4 py-2 text-white font-semibold">Cód.</th>
                  {(dados.tipo !== 'semCompras' && dados.tipo !== 'total') && (
                    <th className="text-right px-4 py-2 text-white font-semibold">Dias s/ compra</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nenhum resultado encontrado.</td>
                  </tr>
                ) : clientesFiltrados.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2 font-medium text-gray-800">{c.nome}</td>
                    <td className="px-4 py-2 text-gray-500">{c.nome_fantasia || '—'}</td>
                    <td className="px-4 py-2 text-gray-400">{c.codigo}</td>
                    {(dados.tipo !== 'semCompras' && dados.tipo !== 'total') && (
                      <td className="px-4 py-2 text-right font-semibold text-gray-700">
                        {c.dias_sem_compra != null ? `${c.dias_sem_compra}d` : '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {dados.produtos && (
            <table className="w-full text-xs">
              <thead className="sticky top-0" style={{ backgroundColor: '#394353' }}>
                <tr>
                  <th className="text-left px-4 py-2 text-white font-semibold">#</th>
                  <th className="text-left px-4 py-2 text-white font-semibold">Código</th>
                  <th className="text-left px-4 py-2 text-white font-semibold">Descrição</th>
                  <th className="text-right px-4 py-2 text-white font-semibold">Total Compras</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">Nenhum resultado encontrado.</td>
                  </tr>
                ) : produtosFiltrados.map((p, i) => (
                  <tr key={p.codigo} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2 font-medium text-gray-700">{p.codigo}</td>
                    <td className="px-4 py-2 text-gray-800">{p.descricao || '—'}</td>
                    <td className="px-4 py-2 text-right font-semibold text-blue-600">
                      {p.total_compras != null ? p.total_compras : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

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
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null)
  const [abaSelecionada, setAbaSelecionada] = useState<'dashboard' | 'radar'>('dashboard')

  // Relatórios salvos
  const [relatoriosSalvos, setRelatoriosSalvos] = useState<RelatorioSalvo[]>([])
  // ID do relatório selecionado no dashboard (checkbox)
  const [relatorioSelecionadoId, setRelatorioSelecionadoId] = useState<string | null>(null)
  // Resultado restaurado ao clicar em "Abrir"
  const [resultadoRestaurado, setResultadoRestaurado] = useState<ResultadoRadar | null>(null)

  useEffect(() => {
    listarRelatoriosSalvos().then(salvos => {
      setRelatoriosSalvos(salvos)
      if (salvos.length > 0) setRelatorioSelecionadoId(salvos[0].id)
    })
  }, [])

  const handleGravar = useCallback(async (resultado: ResultadoRadar, titulo: string, resumo: string) => {
    try {
      const salvo = await salvarRelatorio(titulo, resumo, resultado)
      const lista = await listarRelatoriosSalvos()
      setRelatoriosSalvos(lista)
      setRelatorioSelecionadoId(salvo.id)
      setToast({ tipo: 'success', mensagem: `Relatório "${titulo}" gravado com sucesso!` })
    } catch {
      setToast({ tipo: 'error', mensagem: 'Erro ao gravar relatório. Tente novamente.' })
    }
  }, [])

  const handleAbrirRelatorio = (relatorio: RelatorioSalvo, e: React.MouseEvent) => {
    e.stopPropagation()
    setResultadoRestaurado(relatorio.resultado)
    setAbaSelecionada('radar')
  }

  const handleExcluirRelatorio = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await excluirRelatorio(id)
      const lista = await listarRelatoriosSalvos()
      setRelatoriosSalvos(lista)
      if (relatorioSelecionadoId === id) {
        setRelatorioSelecionadoId(lista.length > 0 ? lista[0].id : null)
      }
    } catch {
      setToast({ tipo: 'error', mensagem: 'Erro ao excluir relatório.' })
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
    return { ...calcularKPIs(rel.resultado), titulo: rel.titulo, dataConsulta: rel.resultado.data_consulta, resultado: rel.resultado }
  }, [relatorioSelecionadoId, relatoriosSalvos])

  // Modal de detalhes de KPI
  const [modalKPI, setModalKPI] = useState<DadosModal | null>(null)

  const abrirModalKPI = useCallback((tipo: TipoModalKPI) => {
    if (!kpis) return
    const r = kpis.resultado
    const mapa: Record<TipoModalKPI, DadosModal> = {
      total:      { tipo, titulo: 'Total de Clientes',                   clientes: r.clientes },
      inativos90: { tipo, titulo: 'Clientes Inativos há +90 dias',       clientes: r.clientes.filter(c => c.dias_sem_compra !== null && c.dias_sem_compra >= 90) },
      inativos60: { tipo, titulo: 'Clientes Inativos há +60 dias',       clientes: r.clientes.filter(c => c.dias_sem_compra !== null && c.dias_sem_compra >= 60) },
      inativos30: { tipo, titulo: 'Clientes Inativos há +30 dias',       clientes: r.clientes.filter(c => c.dias_sem_compra !== null && c.dias_sem_compra >= 30) },
      semCompras: { tipo, titulo: 'Clientes Sem Compras Registradas',    clientes: r.clientes.filter(c => c.dias_sem_compra === null) },
      ativos30:   { tipo, titulo: 'Clientes Ativos (últimos 30 dias)',   clientes: r.clientes.filter(c => c.dias_sem_compra !== null && c.dias_sem_compra < 30) },
      cobertura:  { tipo, titulo: 'Cobertura por Cliente',               clientes: [...r.clientes].sort((a, b) => {
        const pa = a.produtos_comprados.length + a.produtos_nao_comprados.length
        const pb = b.produtos_comprados.length + b.produtos_nao_comprados.length
        const ca = pa > 0 ? a.produtos_comprados.length / pa : 0
        const cb = pb > 0 ? b.produtos_comprados.length / pb : 0
        return cb - ca
      })},
      produtos:   { tipo, titulo: 'Universo de Produtos',                produtos: r.universo_produtos },
    }
    setModalKPI(mapa[tipo])
  }, [kpis])

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
                  <div onClick={() => abrirModalKPI('total')} className="bg-white rounded-lg shadow-sm p-3 border cursor-pointer hover:shadow-md hover:border-gray-300 transition-all" style={{borderColor: '#C9C4B5'}}>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500">Total Clientes</p>
                    </div>
                    <p className="text-2xl font-bold" style={{color: '#394353'}}>{kpis.totalClientes}</p>
                  </div>

                  {/* Inativos +90 dias */}
                  <div onClick={() => abrirModalKPI('inativos90')} className="bg-white rounded-lg shadow-sm p-3 border border-red-200 cursor-pointer hover:shadow-md hover:border-red-300 transition-all">
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
                  <div onClick={() => abrirModalKPI('inativos60')} className="bg-white rounded-lg shadow-sm p-3 border border-orange-200 cursor-pointer hover:shadow-md hover:border-orange-300 transition-all">
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
                  <div onClick={() => abrirModalKPI('inativos30')} className="bg-white rounded-lg shadow-sm p-3 border border-yellow-200 cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all">
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
                  <div onClick={() => abrirModalKPI('semCompras')} className="bg-white rounded-lg shadow-sm p-3 border border-slate-200 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingCart className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500">Sem Compras Registradas</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-600">{kpis.semCompras}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Nunca compraram</p>
                  </div>

                  {/* Ativos últimos 30d */}
                  <div onClick={() => abrirModalKPI('ativos30')} className="bg-white rounded-lg shadow-sm p-3 border border-green-200 cursor-pointer hover:shadow-md hover:border-green-300 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500">Ativos (últimos 30 dias)</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{kpis.ativos30d}</p>
                    <p className="text-xs text-green-400 mt-0.5">Compraram recentemente</p>
                  </div>

                  {/* Cobertura média */}
                  <div onClick={() => abrirModalKPI('cobertura')} className="bg-white rounded-lg shadow-sm p-3 border cursor-pointer hover:shadow-md hover:border-purple-200 transition-all" style={{borderColor: '#C9C4B5'}}>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500">Cobertura Média</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{kpis.coberturaMedia}%</p>
                    <p className="text-xs text-purple-400 mt-0.5">Produtos comprados / universo</p>
                  </div>

                  {/* Universo de Produtos */}
                  <div onClick={() => abrirModalKPI('produtos')} className="bg-white rounded-lg shadow-sm p-3 border cursor-pointer hover:shadow-md hover:border-blue-200 transition-all" style={{borderColor: '#C9C4B5'}}>
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

      {modalKPI && (
        <ModalKPI dados={modalKPI} onClose={() => setModalKPI(null)} />
      )}
    </div>
  )
}

