// =====================================================
// CONTAS A RECEBER - MÓDULO FINANCEIRO
// Gestão de contas a receber com integração a vendas
// Data: 08/12/2025
// =====================================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  DollarSign, Plus, Search, Filter, Calendar, 
  CheckCircle, XCircle, Clock, AlertCircle, Download, ExternalLink
} from 'lucide-react'
import { Toast } from '../../shared/components/Toast'
import { DatePicker } from '../../shared/components/DatePicker'
import {
  listarContasReceber,
  criarContaReceber,
  registrarPagamento,
  cancelarConta,
  excluirConta,
  reabrirConta,
  obterResumo,
  listarPagamentos
} from './contasReceberService'
import { listarClientes } from '../clientes/services'
import type { Cliente } from '../clientes/types'
import type {
  ContaReceber,
  ContaReceberFormData,
  PagamentoFormData,
  FiltrosContasReceber,
  ResumoContasReceber,
  StatusConta,
  PagamentoReceber
} from './types'
import {
  STATUS_LABELS,
  formatarMoeda,
  calcularDiasAtraso,
  getStatusColor
} from './types'

export const ContasReceber: React.FC = () => {
  const navigate = useNavigate()
  const [contas, setContas] = useState<ContaReceber[]>([])
  const [resumo, setResumo] = useState<ResumoContasReceber | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // Modal de nova conta
  const [showModal, setShowModal] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [contaEditando, setContaEditando] = useState<ContaReceber | null>(null)
  const [salvando, setSalvando] = useState(false)
  
  // Modal de pagamento
  const [showPagamentoModal, setShowPagamentoModal] = useState(false)
  const [contaSelecionada, setContaSelecionada] = useState<ContaReceber | null>(null)
  const [pagamentos, setPagamentos] = useState<PagamentoReceber[]>([])
  const [loadingPagamentos, setLoadingPagamentos] = useState(false)
  
  // Autocomplete de clientes
  const [buscaCliente, setBuscaCliente] = useState('')
  const [clientesSugeridos, setClientesSugeridos] = useState<Cliente[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [mostrarSugestoesClientes, setMostrarSugestoesClientes] = useState(false)
  
  // Filtros
  const [filtros, setFiltros] = useState<FiltrosContasReceber>({
    status: 'TODOS'
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  
  // Form de nova conta
  const [formData, setFormData] = useState<ContaReceberFormData>({
    cliente_id: 0,
    cliente_nome: '',
    descricao: '',
    valor_original: 0,
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: new Date().toISOString().split('T')[0]
  })
  
  // Form de pagamento
  const [pagamentoData, setPagamentoData] = useState<PagamentoFormData>({
    conta_receber_id: 0,
    data_pagamento: new Date().toISOString().split('T')[0],
    valor_pago: 0,
    forma_pagamento: 'DINHEIRO'
  })

  useEffect(() => {
    carregarDados()
  }, [filtros])

  // Buscar clientes conforme digitação
  useEffect(() => {
    const buscarClientesDebounced = async () => {
      if (buscaCliente.length >= 2) {
        const resultado = await listarClientes({ busca: buscaCliente })
        if (resultado.data) {
          setClientesSugeridos(resultado.data.slice(0, 5))
          setMostrarSugestoesClientes(true)
        }
      } else {
        setClientesSugeridos([])
        setMostrarSugestoesClientes(false)
      }
    }

    const timeoutId = setTimeout(buscarClientesDebounced, 300)
    return () => clearTimeout(timeoutId)
  }, [buscaCliente])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const [contasResult, resumoResult] = await Promise.all([
        listarContasReceber(filtros),
        obterResumo(filtros)
      ])

      if (contasResult.data) setContas(contasResult.data)
      if (resumoResult.data) setResumo(resumoResult.data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setToast({ message: 'Erro ao carregar contas', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSelecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente)
    setBuscaCliente(cliente.nome_completo || cliente.razao_social || '')
    setFormData(prev => ({
      ...prev,
      cliente_id: Number(cliente.id),
      cliente_nome: cliente.nome_completo || cliente.razao_social || '',
      cliente_cpf_cnpj: cliente.cpf || cliente.cnpj
    }))
    setMostrarSugestoesClientes(false)
  }

  const handleEdit = (conta: ContaReceber) => {
    setModoEdicao(true)
    setContaEditando(conta)
    setFormData({
      cliente_id: conta.cliente_id,
      cliente_nome: conta.cliente_nome || '',
      venda_id: conta.venda_id || undefined,
      descricao: conta.descricao,
      data_emissao: conta.data_emissao,
      data_vencimento: conta.data_vencimento,
      valor_original: conta.valor_original,
      valor_acrescimo: conta.valor_acrescimo,
      valor_desconto: conta.valor_desconto,
      numero_documento: conta.numero_documento || '',
      forma_pagamento: conta.forma_pagamento || '',
      observacoes: conta.observacoes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!contaEditando) return
    
    if (!confirm('Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setSalvando(true)
      console.log('Excluindo conta ID:', contaEditando.id)
      
      const { error } = await excluirConta(contaEditando.id)

      if (error) {
        console.error('Erro retornado:', error)
        // Verificar se é erro de venda bloqueada
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes('Pedido Fechado')) {
          setToast({ message: errorMessage, type: 'error' })
          setShowModal(false)
          setModoEdicao(false)
          setContaEditando(null)
          resetForm()
          return
        }
        throw error
      }

      console.log('Conta excluída com sucesso')
      setToast({ message: 'Conta excluída com sucesso!', type: 'success' })
      
      // Fechar modal e limpar estado
      setShowModal(false)
      setModoEdicao(false)
      setContaEditando(null)
      resetForm()
      
      // Recarregar dados imediatamente
      console.log('Recarregando dados...')
      await carregarDados()
    } catch (error) {
      console.error('Erro ao excluir conta:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setToast({ message: `Erro ao excluir conta: ${errorMessage}`, type: 'error' })
    } finally {
      setSalvando(false)
    }
  }

  const handleReabrir = async () => {
    if (!contaEditando) return
    
    if (!confirm('Deseja reabrir esta conta? O status voltará para "Em Aberto".')) {
      return
    }

    try {
      setSalvando(true)
      const { error } = await reabrirConta(contaEditando.id)

      if (error) throw error

      setToast({ message: 'Conta reaberta com sucesso!', type: 'success' })
      
      // Atualizar os dados da conta editando
      const { data: contasAtualizadas } = await listarContasReceber()
      const contaAtualizada = contasAtualizadas?.find(c => c.id === contaEditando.id)
      if (contaAtualizada) {
        setContaEditando(contaAtualizada)
      }
      
      carregarDados()
    } catch (error) {
      console.error('Erro ao reabrir conta:', error)
      setToast({ message: 'Erro ao reabrir conta', type: 'error' })
    } finally {
      setSalvando(false)
    }
  }

  const handleReceberFromModal = () => {
    if (!contaEditando) return
    setShowModal(false)
    abrirModalPagamento(contaEditando)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.cliente_id || !formData.descricao || formData.valor_original <= 0) {
      setToast({ message: 'Preencha todos os campos obrigatórios', type: 'error' })
      return
    }

    try {
      setSalvando(true)
      const { data, error } = await criarContaReceber(formData)

      if (error) throw error

      setToast({ message: 'Conta criada com sucesso!', type: 'success' })
      setShowModal(false)
      resetForm()
      carregarDados()
    } catch (error) {
      console.error('Erro ao criar conta:', error)
      setToast({ message: 'Erro ao criar conta', type: 'error' })
    } finally {
      setSalvando(false)
    }
  }

  const abrirModalPagamento = async (conta: ContaReceber) => {
    setContaSelecionada(conta)
    setPagamentoData({
      conta_receber_id: conta.id,
      data_pagamento: new Date().toISOString().split('T')[0],
      valor_pago: conta.valor_saldo,
      forma_pagamento: 'DINHEIRO'
    })
    setShowPagamentoModal(true)
    
    // Carregar histórico de pagamentos
    setLoadingPagamentos(true)
    const { data } = await listarPagamentos(conta.id)
    if (data) setPagamentos(data)
    setLoadingPagamentos(false)
  }

  const handleRegistrarPagamento = async (e: React.FormEvent) => {
    e.preventDefault()

    if (pagamentoData.valor_pago <= 0) {
      setToast({ message: 'Valor do pagamento deve ser maior que zero', type: 'error' })
      return
    }

    try {
      setSalvando(true)
      const { error } = await registrarPagamento(pagamentoData)

      if (error) throw error

      setToast({ message: 'Pagamento registrado com sucesso!', type: 'success' })
      setShowPagamentoModal(false)
      carregarDados()
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error)
      setToast({ message: 'Erro ao registrar pagamento', type: 'error' })
    } finally {
      setSalvando(false)
    }
  }

  const handleCancelar = async (id: number) => {
    if (!confirm('Deseja realmente cancelar esta conta?')) return

    try {
      const { error } = await cancelarConta(id)
      if (error) throw error

      setToast({ message: 'Conta cancelada com sucesso!', type: 'success' })
      carregarDados()
    } catch (error) {
      console.error('Erro ao cancelar conta:', error)
      setToast({ message: 'Erro ao cancelar conta', type: 'error' })
    }
  }

  const resetForm = () => {
    setFormData({
      cliente_id: 0,
      cliente_nome: '',
      descricao: '',
      valor_original: 0,
      data_emissao: new Date().toISOString().split('T')[0],
      data_vencimento: new Date().toISOString().split('T')[0]
    })
    setBuscaCliente('')
    setClienteSelecionado(null)
  }

  return (
    <div className="p-3">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Cabeçalho */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Contas a Receber</h1>
        <p className="text-sm text-gray-600">Gestão de recebimentos e cobranças</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-[#C9C4B5] p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total a Receber</p>
              <p className="text-lg font-bold text-gray-900">
                {formatarMoeda(resumo?.valor_pendente || 0)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#C9C4B5] p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Já Recebido</p>
              <p className="text-lg font-bold text-green-600">
                {formatarMoeda(resumo?.valor_recebido || 0)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#C9C4B5] p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Contas em Aberto</p>
              <p className="text-lg font-bold text-orange-600">{resumo?.total_aberto || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#C9C4B5] p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Contas Vencidas</p>
              <p className="text-lg font-bold text-red-600">{resumo?.total_vencido || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Ações */}
      <div className="bg-white rounded-lg border border-[#C9C4B5] p-3 mb-4">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              style={{ backgroundColor: '#394353' }}
              className="px-3 py-2 text-sm text-white rounded-md hover:opacity-90 transition-opacity flex items-center gap-2 font-semibold"
            >
              <Plus className="w-4 h-4" />
              Nova Conta
            </button>
            
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="px-3 py-2 text-sm border border-[#C9C4B5] rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          </div>

          <div className="flex gap-2">
            {STATUS_LABELS.map((status) => (
              <button
                key={status.value}
                onClick={() => setFiltros(prev => ({ ...prev, status: status.value as StatusConta | 'TODOS' }))}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  filtros.status === status.value
                    ? status.color
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.label}
              </button>
            ))}
            <button
              onClick={() => setFiltros(prev => ({ ...prev, status: 'TODOS' }))}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                filtros.status === 'TODOS'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
          </div>
        </div>

        {/* Painel de Filtros Expandido */}
        {mostrarFiltros && (
          <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Período de Emissão
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filtros.data_inicio || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, data_inicio: e.target.value }))}
                  className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                />
                <input
                  type="date"
                  value={filtros.data_fim || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, data_fim: e.target.value }))}
                  className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Período de Vencimento
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filtros.vencimento_inicio || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, vencimento_inicio: e.target.value }))}
                  className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                />
                <input
                  type="date"
                  value={filtros.vencimento_fim || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, vencimento_fim: e.target.value }))}
                  className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filtros.busca || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                  placeholder="Cliente, documento..."
                  className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Contas */}
      <div className="bg-white rounded-lg border border-[#C9C4B5] overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#394353]"></div>
          </div>
        ) : contas.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">Nenhuma conta encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: '#394353' }}>
                <tr>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-white">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-white">Vencimento</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-white">Cliente</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-white">Descrição</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-white">N° Venda</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-white">Documento</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-white">Valor</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-white">Pago</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-white">Saldo</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-white">Status</th>
                </tr>
              </thead>
              <tbody>
                {contas.map((conta, index) => {
                  const diasAtraso = calcularDiasAtraso(conta.data_vencimento)
                  
                  return (
                    <tr key={conta.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleEdit(conta)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="Editar conta"
                        >
                          #{String(conta.id).slice(0, 8)}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <div>
                          {new Date(conta.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                          {diasAtraso > 0 && conta.status !== 'PAGO' && conta.status !== 'CANCELADO' && (
                            <span className="block text-red-600 font-semibold">
                              {diasAtraso} dias em atraso
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs">{conta.cliente_nome}</td>
                      <td className="px-3 py-2 text-xs">{conta.descricao}</td>
                      <td className="px-3 py-2 text-center">
                        {conta.venda_id && conta.numero_venda ? (
                          <button
                            onClick={() => navigate(`/vendas/${conta.venda_id}`)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Abrir venda"
                          >
                            #{conta.numero_venda}
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs">{conta.numero_documento || '-'}</td>
                      <td className="px-3 py-2 text-xs text-right font-semibold">
                        {formatarMoeda(conta.valor_total)}
                      </td>
                      <td className="px-3 py-2 text-xs text-right text-green-600">
                        {formatarMoeda(conta.valor_pago)}
                      </td>
                      <td className="px-3 py-2 text-xs text-right font-semibold">
                        {formatarMoeda(conta.valor_saldo)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(conta.status)}`}>
                          {STATUS_LABELS.find(s => s.value === conta.status)?.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Nova Conta */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div style={{ backgroundColor: '#394353' }} className="p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {modoEdicao ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setModoEdicao(false)
                  setContaEditando(null)
                  resetForm()
                }}
                className="text-white hover:text-gray-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cliente <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={buscaCliente}
                    onChange={(e) => setBuscaCliente(e.target.value)}
                    onFocus={() => setMostrarSugestoesClientes(clientesSugeridos.length > 0)}
                    placeholder="Digite para buscar..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#394353]"
                  />
                  
                  {mostrarSugestoesClientes && clientesSugeridos.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {clientesSugeridos.map((cliente) => (
                        <div
                          key={cliente.id}
                          onClick={() => handleSelecionarCliente(cliente)}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {cliente.nome_completo || cliente.razao_social}
                          </div>
                          <div className="text-xs text-gray-600">
                            {cliente.cpf || cliente.cnpj}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {clienteSelecionado && (
                  <div className="mt-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    ✓ {clienteSelecionado.nome_completo || clienteSelecionado.razao_social}
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Descrição <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Ex: Venda de produtos, Serviços prestados..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#394353]"
                />
              </div>

              {/* Número do Documento */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Número do Documento
                </label>
                <input
                  type="text"
                  value={formData.numero_documento || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero_documento: e.target.value }))}
                  placeholder="Ex: NF-12345, REC-001..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#394353]"
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Valor <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_original || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor_original: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#394353]"
                />
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Data de Emissão <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.data_emissao}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_emissao: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#394353]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Data de Vencimento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.data_vencimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#394353]"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={3}
                  placeholder="Informações adicionais..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#394353]"
                />
              </div>

              {/* Botões */}
              <div className="flex justify-between gap-2 pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                  {modoEdicao && contaEditando && (
                    <>
                      {/* Botão Receber - disponível se não for PAGO ou CANCELADO */}
                      {contaEditando.status !== 'PAGO' && contaEditando.status !== 'CANCELADO' && (
                        <button
                          type="button"
                          onClick={handleReceberFromModal}
                          className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
                        >
                          Receber
                        </button>
                      )}
                      
                      {/* Botão Reabrir - disponível se estiver PAGO */}
                      {contaEditando.status === 'PAGO' && (
                        <button
                          type="button"
                          onClick={handleReabrir}
                          disabled={salvando}
                          className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 font-semibold disabled:opacity-50"
                        >
                          Reabrir Conta
                        </button>
                      )}
                      
                      {/* Botão Excluir - disponível apenas se NÃO for PAGO */}
                      {contaEditando.status !== 'PAGO' && (
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={salvando}
                          className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold disabled:opacity-50"
                        >
                          Excluir
                        </button>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setModoEdicao(false)
                      setContaEditando(null)
                      resetForm()
                    }}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando || modoEdicao}
                    style={{ backgroundColor: '#394353' }}
                    className="px-4 py-2 text-sm text-white rounded-md hover:opacity-90 transition-opacity font-semibold disabled:opacity-50"
                  >
                    {salvando ? 'Salvando...' : 'Salvar Conta'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Pagamento */}
      {showPagamentoModal && contaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div style={{ backgroundColor: '#394353' }} className="p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Registrar Pagamento</h2>
              <button
                onClick={() => {
                  setShowPagamentoModal(false)
                  setContaSelecionada(null)
                  setPagamentos([])
                }}
                className="text-white hover:text-gray-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Informações da Conta */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Informações da Conta</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-600">Cliente:</span>
                    <span className="ml-1 font-medium">{contaSelecionada.cliente_nome}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Vencimento:</span>
                    <span className="ml-1 font-medium">
                      {new Date(contaSelecionada.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Valor Total:</span>
                    <span className="ml-1 font-medium">{formatarMoeda(contaSelecionada.valor_total)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Já Pago:</span>
                    <span className="ml-1 font-medium text-green-600">{formatarMoeda(contaSelecionada.valor_pago)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Saldo Devedor:</span>
                    <span className="ml-1 font-bold text-lg text-red-600">{formatarMoeda(contaSelecionada.valor_saldo)}</span>
                  </div>
                </div>
              </div>

              {/* Formulário de Pagamento */}
              <form onSubmit={handleRegistrarPagamento} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Data do Pagamento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={pagamentoData.data_pagamento}
                      onChange={(e) => setPagamentoData(prev => ({ ...prev, data_pagamento: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#394353]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Valor Pago <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={contaSelecionada.valor_saldo}
                      value={pagamentoData.valor_pago || ''}
                      onChange={(e) => setPagamentoData(prev => ({ ...prev, valor_pago: parseFloat(e.target.value) || 0 }))}
                      placeholder="0,00"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#394353]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Forma de Pagamento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={pagamentoData.forma_pagamento}
                    onChange={(e) => setPagamentoData(prev => ({ ...prev, forma_pagamento: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#394353]"
                  >
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    <option value="TRANSFERENCIA">Transferência Bancária</option>
                    <option value="BOLETO">Boleto</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={pagamentoData.observacoes || ''}
                    onChange={(e) => setPagamentoData(prev => ({ ...prev, observacoes: e.target.value }))}
                    rows={2}
                    placeholder="Informações sobre o pagamento..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#394353]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPagamentoModal(false)
                      setContaSelecionada(null)
                      setPagamentos([])
                    }}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold disabled:opacity-50"
                  >
                    {salvando ? 'Registrando...' : 'Registrar Pagamento'}
                  </button>
                </div>
              </form>

              {/* Histórico de Pagamentos */}
              {pagamentos.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Histórico de Pagamentos</h3>
                  <div className="space-y-2">
                    {pagamentos.map((pag) => (
                      <div key={pag.id} className="bg-gray-50 rounded p-2 text-xs">
                        <div className="flex justify-between">
                          <span className="font-medium">
                            {new Date(pag.data_pagamento + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                          <span className="font-bold text-green-600">{formatarMoeda(pag.valor_pago)}</span>
                        </div>
                        <div className="text-gray-600 mt-1">
                          {pag.forma_pagamento}
                          {pag.observacoes && ` - ${pag.observacoes}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

