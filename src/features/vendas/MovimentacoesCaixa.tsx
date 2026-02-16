// =====================================================
// COMPONENTE - MOVIMENTAÇÕES DE CAIXA
// Listagem e gestão de movimentações de caixa
// Data: 11/02/2026
// =====================================================

import { useState, useEffect } from 'react'
import { movimentacoesCaixaService, type MovimentacaoCaixa, type StatusCaixa } from './movimentacoesCaixaService'
import { supabase } from '../../lib/supabase'

export function MovimentacoesCaixa() {
  // Remover uso de useAuth já que não existe
  // const { user } = useAuth()

  // Estados
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoCaixa[]>([])
  const [statusCaixa, setStatusCaixa] = useState<StatusCaixa | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  // Filtros
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0])
  const [tipoFiltro, setTipoFiltro] = useState('')

  // Modais
  const [mostrarNovaMovimentacao, setMostrarNovaMovimentacao] = useState(false)
  const [mostrarAbrirCaixa, setMostrarAbrirCaixa] = useState(false)
  const [mostrarFecharCaixa, setMostrarFecharCaixa] = useState(false)

  // Form data
  const [tipo, setTipo] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('')

  // Totais
  const [totais, setTotais] = useState({ total_entradas: 0, total_saidas: 0, saldo: 0 })

  // Toast
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null)

  useEffect(() => {
    carregarDados()
  }, [dataInicio, dataFim, tipoFiltro])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const carregarDados = async () => {
    setLoading(true)
    try {
      const [movs, status, tots] = await Promise.all([
        movimentacoesCaixaService.listar({
          data_inicio: dataInicio,
          data_fim: dataFim + 'T23:59:59',
          tipo: tipoFiltro || undefined
        }),
        movimentacoesCaixaService.statusCaixa(),
        movimentacoesCaixaService.calcularTotais({
          data_inicio: dataInicio,
          data_fim: dataFim + 'T23:59:59'
        })
      ])

      setMovimentacoes(movs)
      setStatusCaixa(status)
      setTotais(tots)
    } catch (error: any) {
      setToast({ tipo: 'error', mensagem: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleCriarMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!valor || !descricao) {
      setToast({ tipo: 'error', mensagem: 'Preencha todos os campos obrigatórios' })
      return
    }

    setSalvando(true)
    try {
      await movimentacoesCaixaService.criar({
        tipo,
        valor: parseFloat(valor),
        descricao,
        categoria: categoria || undefined
      })

      setToast({ tipo: 'success', mensagem: 'Movimentação registrada com sucesso!' })
      setMostrarNovaMovimentacao(false)
      limparFormulario()
      carregarDados()
    } catch (error: any) {
      setToast({ tipo: 'error', mensagem: error.message })
    } finally {
      setSalvando(false)
    }
  }

  const handleAbrirCaixa = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!valor) {
      setToast({ tipo: 'error', mensagem: 'Informe o valor inicial' })
      return
    }

    setSalvando(true)
    try {
      // Buscar usuário do Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('nome_completo')
        .eq('id', user.id)
        .single()

      await movimentacoesCaixaService.abrirCaixa(
        parseFloat(valor),
        usuario?.nome_completo || 'Usuário'
      )

      setToast({ tipo: 'success', mensagem: 'Caixa aberto com sucesso!' })
      setMostrarAbrirCaixa(false)
      limparFormulario()
      carregarDados()
    } catch (error: any) {
      setToast({ tipo: 'error', mensagem: error.message })
    } finally {
      setSalvando(false)
    }
  }

  const handleFecharCaixa = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!valor) {
      setToast({ tipo: 'error', mensagem: 'Informe o valor final' })
      return
    }

    setSalvando(true)
    try {
      // Buscar usuário do Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('nome_completo')
        .eq('id', user.id)
        .single()

      await movimentacoesCaixaService.fecharCaixa(
        parseFloat(valor),
        usuario?.nome_completo || 'Usuário',
        descricao || undefined
      )

      setToast({ tipo: 'success', mensagem: 'Caixa fechado com sucesso!' })
      setMostrarFecharCaixa(false)
      limparFormulario()
      carregarDados()
    } catch (error: any) {
      setToast({ tipo: 'error', mensagem: error.message })
    } finally {
      setSalvando(false)
    }
  }

  const limparFormulario = () => {
    setTipo('ENTRADA')
    setValor('')
    setDescricao('')
    setCategoria('')
  }

  const getTipoBadge = (tipo: string) => {
    const badges = {
      ENTRADA: 'bg-green-100 text-green-800',
      SAIDA: 'bg-red-100 text-red-800',
      ABERTURA: 'bg-blue-100 text-blue-800',
      FECHAMENTO: 'bg-purple-100 text-purple-800'
    }
    return badges[tipo as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Toast */}
      {toast && (
        <div 
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            toast.tipo === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white font-semibold`}
        >
          {toast.mensagem}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-base font-bold text-gray-900">Movimentações de Caixa</h1>
              <p className="text-xs text-gray-600 mt-1">
                {movimentacoes.length} {movimentacoes.length === 1 ? 'movimentação' : 'movimentações'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {statusCaixa?.caixa_aberto ? (
                <button
                  onClick={() => setMostrarFecharCaixa(true)}
                  className="px-3 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <span className="w-4 h-4 sm:w-5 sm:h-5">🔒</span>
                  <span className="hidden sm:inline">Fechar Caixa</span>
                </button>
              ) : (
                <button
                  onClick={() => setMostrarAbrirCaixa(true)}
                  className="px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <span className="w-4 h-4 sm:w-5 sm:h-5">🔓</span>
                  <span className="hidden sm:inline">Abrir Caixa</span>
                </button>
              )}

              <button
                onClick={() => setMostrarNovaMovimentacao(true)}
                disabled={!statusCaixa?.caixa_aberto}
                className="px-3 py-2 bg-[#394353] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                <span className="w-4 h-4 sm:w-5 sm:h-5">➕</span>
                <span className="hidden sm:inline">Nova Movimentação</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status do Caixa */}
      {statusCaixa?.caixa_aberto && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Caixa Aberto</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div>
                  <p className="text-xs text-gray-600">Abertura</p>
                  <p className="text-sm font-semibold">R$ {statusCaixa.valor_abertura?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Entradas</p>
                  <p className="text-sm font-semibold text-green-600">R$ {statusCaixa.total_entradas.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Saídas</p>
                  <p className="text-sm font-semibold text-red-600">R$ {statusCaixa.total_saidas.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Saldo Atual</p>
                  <p className="text-base font-bold text-[#394353]">R$ {statusCaixa.saldo_atual.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
            >
              <option value="">Todos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
              <option value="ABERTURA">Abertura</option>
              <option value="FECHAMENTO">Fechamento</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={carregarDados}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200"
            >
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Totais do Período */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-700 mb-1">Total Entradas</p>
          <p className="text-2xl font-bold text-green-600">R$ {totais.total_entradas.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-700 mb-1">Total Saídas</p>
          <p className="text-2xl font-bold text-red-600">R$ {totais.total_saidas.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-700 mb-1">Saldo do Período</p>
          <p className="text-2xl font-bold text-[#394353]">R$ {totais.saldo.toFixed(2)}</p>
        </div>
      </div>

      {/* Listagem */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#394353] text-white">
                <th className="px-4 py-3 text-left text-xs font-semibold">Data/Hora</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Categoria</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Usuário</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    Carregando...
                  </td>
                </tr>
              ) : movimentacoes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    Nenhuma movimentação encontrada
                  </td>
                </tr>
              ) : (
                movimentacoes.map((mov) => (
                  <tr key={mov.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs">
                      {new Date(mov.data_movimentacao).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getTipoBadge(mov.tipo)}`}>
                        {mov.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{mov.descricao}</td>
                    <td className="px-4 py-3 text-xs">{mov.categoria || '-'}</td>
                    <td className={`px-4 py-3 text-xs text-right font-semibold ${
                      mov.tipo === 'ENTRADA' || mov.tipo === 'ABERTURA' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {mov.tipo === 'ENTRADA' || mov.tipo === 'ABERTURA' ? '+' : '-'} R$ {mov.valor.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-xs">{mov.usuario_nome}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="text-gray-600">{mov.origem || 'MANUAL'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nova Movimentação */}
      {mostrarNovaMovimentacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-[#394353] text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h2 className="text-xl font-bold">Nova Movimentação</h2>
              <button onClick={() => setMostrarNovaMovimentacao(false)} className="text-white hover:opacity-80 text-2xl">
                ×
              </button>
            </div>

            <form onSubmit={handleCriarMovimentacao} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as 'ENTRADA' | 'SAIDA')}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                >
                  <option value="ENTRADA">Entrada</option>
                  <option value="SAIDA">Saída</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <input
                  type="text"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ex: Sangria, Troco, Pagamento"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarNovaMovimentacao(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 px-4 py-2 bg-[#394353] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Abrir Caixa */}
      {mostrarAbrirCaixa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h2 className="text-xl font-bold">🔓 Abrir Caixa</h2>
              <button onClick={() => setMostrarAbrirCaixa(false)} className="text-white hover:opacity-80 text-2xl">
                ×
              </button>
            </div>

            <form onSubmit={handleAbrirCaixa} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Inicial (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarAbrirCaixa(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {salvando ? 'Abrindo...' : 'Abrir Caixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Fechar Caixa */}
      {mostrarFecharCaixa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-purple-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h2 className="text-xl font-bold">🔒 Fechar Caixa</h2>
              <button onClick={() => setMostrarFecharCaixa(false)} className="text-white hover:opacity-80 text-2xl">
                ×
              </button>
            </div>

            <form onSubmit={handleFecharCaixa} className="p-6 space-y-4">
              {statusCaixa && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-600 mb-2">Saldo Esperado:</p>
                  <p className="text-2xl font-bold text-[#394353]">R$ {statusCaixa.saldo_atual.toFixed(2)}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Final Contado (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  placeholder="Observações sobre o fechamento (opcional)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarFecharCaixa(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {salvando ? 'Fechando...' : 'Fechar Caixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
