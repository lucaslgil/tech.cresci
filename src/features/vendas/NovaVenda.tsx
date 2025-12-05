// =====================================================
// COMPONENTE - NOVA VENDA
// Tela para criar orçamentos e pedidos de venda
// Data: 02/12/2025
// =====================================================

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { vendasService } from './vendasService'
import type { VendaFormData, VendaItemFormData } from './types'
import {
  TIPO_VENDA_LABELS,
  calcularTotalItem,
  calcularTotalVenda
} from './types'
import { Toast } from '../../shared/components/Toast'
import { DatePicker } from '../../shared/components/DatePicker'
import { Search, Plus, FileText, Trash2, Lock, Unlock } from 'lucide-react'
import { listarClientes } from '../clientes/services'
import { buscarProdutos } from '../produtos/produtosService'
import type { Cliente } from '../clientes/types'
import type { Produto } from '../produtos/types'
import { BotoesAcaoVenda } from './components/BotoesAcaoVenda'
import { useParametrosFinanceiros } from './hooks/useParametrosFinanceiros'

export default function NovaVenda() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [carregando, setCarregando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null)
  const [statusVenda, setStatusVenda] = useState<string>('ORCAMENTO')
  const [numeroVenda, setNumeroVenda] = useState<number | null>(null)
  const [vendaBloqueada, setVendaBloqueada] = useState(false)

  // Hook para buscar parâmetros financeiros
  const { formasPagamento, parcelamentos, carregando: carregandoParametros } = useParametrosFinanceiros()

  // Refs para detectar clique fora
  const clienteRef = useRef<HTMLDivElement>(null)
  const produtoRef = useRef<HTMLDivElement>(null)
  const clienteSelecionadoRef = useRef(false)

  // Estados para autocomplete de clientes
  const [buscaCliente, setBuscaCliente] = useState('')
  const [clientesSugeridos, setClientesSugeridos] = useState<Cliente[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [mostrarSugestoesClientes, setMostrarSugestoesClientes] = useState(false)

  // Estados para autocomplete de produtos
  const [buscaProduto, setBuscaProduto] = useState('')
  const [produtosSugeridos, setProdutosSugeridos] = useState<Produto[]>([])
  const [mostrarSugestoesProdutos, setMostrarSugestoesProdutos] = useState(false)

  const [formData, setFormData] = useState<VendaFormData>({
    tipo_venda: 'PEDIDO',
    data_venda: new Date().toISOString().split('T')[0],
    data_validade: undefined,
    forma_pagamento: 'DINHEIRO',
    condicao_pagamento: 'A_VISTA',
    numero_parcelas: 1,
    itens: []
  })

  const [itemAtual, setItemAtual] = useState<VendaItemFormData>({
    produto_codigo: undefined,
    produto_nome: undefined,
    quantidade: 1,
    valor_unitario: 0
  })

  // Buscar clientes conforme digitação
  useEffect(() => {
    const buscarClientesDebounced = async () => {
      if (buscaCliente.length >= 2 && !clienteSelecionadoRef.current) {
        const resultado = await listarClientes({ busca: buscaCliente })
        if (resultado.data) {
          setClientesSugeridos(resultado.data.slice(0, 5)) // Limitar a 5 sugestões
          setMostrarSugestoesClientes(true)
        }
      } else {
        setClientesSugeridos([])
        setMostrarSugestoesClientes(false)
      }
      clienteSelecionadoRef.current = false
    }

    const timeoutId = setTimeout(buscarClientesDebounced, 300)
    return () => clearTimeout(timeoutId)
  }, [buscaCliente])

  // Buscar produtos conforme digitação
  useEffect(() => {
    const buscarProdutosDebounced = async () => {
      if (buscaProduto.length >= 2) {
        const resultado = await buscarProdutos({ nome: buscaProduto, ativo: true })
        if (resultado.data) {
          setProdutosSugeridos(resultado.data.slice(0, 5)) // Limitar a 5 sugestões
          setMostrarSugestoesProdutos(true)
        }
      } else {
        setProdutosSugeridos([])
        setMostrarSugestoesProdutos(false)
      }
    }

    const timeoutId = setTimeout(buscarProdutosDebounced, 300)
    return () => clearTimeout(timeoutId)
  }, [buscaProduto])

  // Detectar clique fora do campo de cliente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clienteRef.current && !clienteRef.current.contains(event.target as Node)) {
        setMostrarSugestoesClientes(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Detectar clique fora do campo de produto
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (produtoRef.current && !produtoRef.current.contains(event.target as Node)) {
        setMostrarSugestoesProdutos(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Carregar venda se estiver editando
  useEffect(() => {
    if (id) {
      carregarVenda()
    }
  }, [id])

  const carregarVenda = async () => {
    if (!id) return

    setCarregando(true)
    try {
      const venda = await vendasService.buscarPorId(id)
      if (venda) {
        setStatusVenda(venda.status || 'ORCAMENTO')
        setNumeroVenda(venda.numero || null)
        setVendaBloqueada(venda.bloqueado || false)
        setFormData({
          tipo_venda: venda.tipo_venda,
          data_venda: venda.data_venda,
          data_validade: venda.data_validade,
          cliente_id: venda.cliente_id,
          vendedor: venda.vendedor,
          forma_pagamento: venda.forma_pagamento,
          condicao_pagamento: venda.condicao_pagamento,
          numero_parcelas: venda.numero_parcelas,
          desconto: venda.desconto,
          acrescimo: venda.acrescimo,
          frete: venda.frete,
          outras_despesas: venda.outras_despesas,
          observacoes: venda.observacoes,
          observacoes_internas: venda.observacoes_internas,
          itens: venda.itens || []
        })

        // Carregar nome do cliente se houver
        if (venda.cliente_nome) {
          clienteSelecionadoRef.current = true
          setBuscaCliente(venda.cliente_nome)
          setClientesSugeridos([])
          setMostrarSugestoesClientes(false)
        }
      }
    } catch (error) {
      setToast({ tipo: 'error', mensagem: 'Erro ao carregar venda' })
    } finally {
      setCarregando(false)
    }
  }

  const selecionarCliente = (cliente: Cliente) => {
    clienteSelecionadoRef.current = true
    setClienteSelecionado(cliente)
    setBuscaCliente(cliente.nome_completo || cliente.razao_social || '')
    setFormData(prev => ({ ...prev, cliente_id: Number(cliente.id) }))
    setMostrarSugestoesClientes(false)
    setClientesSugeridos([])
  }

  const selecionarProduto = (produto: Produto) => {
    setItemAtual({
      produto_codigo: produto.codigo_interno || produto.codigo_barras || '',
      produto_nome: produto.nome,
      produto_id: produto.id,
      quantidade: 1,
      valor_unitario: Number(produto.preco_venda || 0)
    })
    setBuscaProduto('')
    setMostrarSugestoesProdutos(false)
  }

  const adicionarItem = () => {
    if (!itemAtual.produto_nome || !itemAtual.produto_nome.trim()) {
      setToast({ tipo: 'error', mensagem: 'Preencha o nome do produto' })
      return
    }

    if (itemAtual.quantidade <= 0 || itemAtual.valor_unitario <= 0) {
      setToast({ tipo: 'error', mensagem: 'Quantidade e valor devem ser maiores que zero' })
      return
    }

    setFormData(prev => ({
      ...prev,
      itens: [...prev.itens, itemAtual]
    }))

    setItemAtual({
      produto_codigo: undefined,
      produto_nome: undefined,
      quantidade: 1,
      valor_unitario: 0
    })

    setToast({ tipo: 'success', mensagem: 'Item adicionado' })
  }

  const removerItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    if (formData.itens.length === 0) {
      setToast({ tipo: 'error', mensagem: 'Adicione pelo menos um item' })
      return
    }

    console.log('FormData antes de enviar:', JSON.stringify(formData, null, 2))

    setCarregando(true)
    try {
      if (id) {
        // Atualizar venda existente (mantém status atual ou define como PEDIDO_ABERTO)
        const statusAtual = statusVenda || 'PEDIDO_ABERTO'
        const resultado = await vendasService.atualizar(id, { ...formData, status: statusAtual as any })
        if (resultado.sucesso) {
          setToast({ tipo: 'success', mensagem: 'Pedido atualizado com sucesso!' })
          // Recarregar dados
          carregarVenda()
        } else {
          setToast({ tipo: 'error', mensagem: resultado.mensagem })
        }
      } else {
        // Criar nova venda com status PEDIDO_ABERTO
        const resultado = await vendasService.criar({ ...formData, status: 'PEDIDO_ABERTO' as any })
        if (resultado.sucesso && resultado.dados) {
          setToast({ tipo: 'success', mensagem: 'Pedido criado com status: Pedido em Aberto' })
          
          // Atualizar URL para modo de edição e carregar dados
          const vendaId = resultado.dados.id
          navigate(`/vendas/${vendaId}`, { replace: true })
          
          // Aguardar um momento para a URL ser atualizada e então carregar os dados
          setTimeout(async () => {
            try {
              const vendaCarregada = await vendasService.buscarPorId(vendaId)
              if (vendaCarregada) {
                setStatusVenda(vendaCarregada.status || 'PEDIDO_ABERTO')
                setNumeroVenda(vendaCarregada.numero || null)
                setVendaBloqueada(vendaCarregada.bloqueado || false)
                setFormData({
                  tipo_venda: vendaCarregada.tipo_venda,
                  data_venda: vendaCarregada.data_venda,
                  data_validade: vendaCarregada.data_validade,
                  cliente_id: vendaCarregada.cliente_id,
                  vendedor: vendaCarregada.vendedor,
                  forma_pagamento: vendaCarregada.forma_pagamento,
                  condicao_pagamento: vendaCarregada.condicao_pagamento,
                  numero_parcelas: vendaCarregada.numero_parcelas,
                  desconto: vendaCarregada.desconto,
                  acrescimo: vendaCarregada.acrescimo,
                  frete: vendaCarregada.frete,
                  outras_despesas: vendaCarregada.outras_despesas,
                  observacoes: vendaCarregada.observacoes,
                  observacoes_internas: vendaCarregada.observacoes_internas,
                  itens: vendaCarregada.itens || []
                })
                
                if (vendaCarregada.cliente_nome) {
                  clienteSelecionadoRef.current = true
                  setBuscaCliente(vendaCarregada.cliente_nome)
                }
              }
            } catch (error) {
              console.error('Erro ao carregar venda:', error)
            }
          }, 300)
        } else {
          setToast({ tipo: 'error', mensagem: resultado.mensagem })
        }
      }
    } catch (error) {
      setToast({ tipo: 'error', mensagem: error instanceof Error ? error.message : 'Erro ao processar venda' })
    } finally {
      setCarregando(false)
    }
  }

  const handleAlterarStatus = async (novoStatus: string) => {
    if (!id) return

    try {
      const resultado = await vendasService.atualizar(id, { status: novoStatus as any })
      if (resultado.sucesso) {
        setStatusVenda(novoStatus)
        const mensagens: Record<string, string> = {
          'ORCAMENTO': 'Pedido Reaberto',
          'APROVADO': 'Pedido Fechado',
          'CANCELADO': 'Pedido Cancelado'
        }
        setToast({ tipo: 'success', mensagem: mensagens[novoStatus] || 'Status alterado' })
      } else {
        setToast({ tipo: 'error', mensagem: resultado.mensagem })
      }
    } catch (error) {
      setToast({ tipo: 'error', mensagem: 'Erro ao alterar status' })
    }
  }

  const handleCancelarVenda = async () => {
    if (!id || !confirm('Deseja realmente cancelar esta venda?')) return

    await handleAlterarStatus('CANCELADO')
  }

  const handleExcluir = async () => {
    if (!id || !confirm('Deseja realmente excluir esta venda?')) return

    setCarregando(true)
    try {
      const resultado = await vendasService.deletar(id)
      if (resultado.sucesso) {
        setToast({ tipo: 'success', mensagem: 'Venda excluída com sucesso' })
        setTimeout(() => navigate('/vendas'), 1500)
      } else {
        setToast({ tipo: 'error', mensagem: resultado.mensagem })
      }
    } catch (error) {
      setToast({ tipo: 'error', mensagem: 'Erro ao excluir venda' })
    } finally {
      setCarregando(false)
    }
  }

  const handleEmitirNota = () => {
    if (!id) return
    
    // Navegar para tela de emissão de nota fiscal com dados da venda
    navigate('/notas-fiscais/emitir', { 
      state: { 
        venda: {
          id,
          numero: numeroVenda,
          cliente_nome: formData.cliente_nome,
          cliente_cpf_cnpj: formData.cliente_cpf_cnpj,
          total: subtotal,
          itens: itens,
          data_venda: formData.data_venda
        } 
      } 
    })
  }

  const handleBloquear = async () => {
    if (!id) return

    const motivo = prompt('Motivo do bloqueio (opcional):')
    
    setCarregando(true)
    try {
      const resultado = await vendasService.bloquear(id, motivo || undefined)
      if (resultado.sucesso) {
        setVendaBloqueada(true)
        setToast({ tipo: 'success', mensagem: 'Venda bloqueada com sucesso' })
      } else {
        setToast({ tipo: 'error', mensagem: resultado.mensagem })
      }
    } catch (error) {
      setToast({ tipo: 'error', mensagem: 'Erro ao bloquear venda' })
    } finally {
      setCarregando(false)
    }
  }

  const handleDesbloquear = async () => {
    if (!id) return

    setCarregando(true)
    try {
      const resultado = await vendasService.desbloquear(id)
      if (resultado.sucesso) {
        setVendaBloqueada(false)
        setToast({ tipo: 'success', mensagem: 'Venda desbloqueada com sucesso' })
      } else {
        setToast({ tipo: 'error', mensagem: resultado.mensagem })
      }
    } catch (error) {
      setToast({ tipo: 'error', mensagem: 'Erro ao desbloquear venda' })
    } finally {
      setCarregando(false)
    }
  }

  const handleReabrirPedido = async () => {
    if (!id) return
    
    setCarregando(true)
    try {
      const resultado = await vendasService.reabrirPedido(id)
      if (resultado.sucesso) {
        setToast({ tipo: 'success', mensagem: 'Pedido reaberto com sucesso!' })
        carregarVenda() // Recarregar dados da venda
      } else {
        setToast({ tipo: 'error', mensagem: resultado.mensagem })
      }
    } catch (error) {
      setToast({ tipo: 'error', mensagem: error instanceof Error ? error.message : 'Erro ao reabrir pedido' })
    } finally {
      setCarregando(false)
    }
  }

  const handleConfirmarPedido = async () => {
    if (!id) return
    
    setCarregando(true)
    try {
      const resultado = await vendasService.confirmarPedido(id)
      if (resultado.sucesso) {
        setToast({ tipo: 'success', mensagem: 'Pedido confirmado! Movimentação de estoque efetuada.' })
        carregarVenda() // Recarregar dados da venda
      } else {
        setToast({ tipo: 'error', mensagem: resultado.mensagem })
      }
    } catch (error) {
      setToast({ tipo: 'error', mensagem: error instanceof Error ? error.message : 'Erro ao confirmar pedido' })
    } finally {
      setCarregando(false)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'ORCAMENTO': 'Orçamento',
      'PEDIDO_ABERTO': 'Pedido em Aberto',
      'PEDIDO_FECHADO': 'Pedido Fechado',
      'CANCELADO': 'Cancelado'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'ORCAMENTO': 'bg-gray-100 text-gray-800',
      'PEDIDO_ABERTO': 'bg-yellow-100 text-yellow-800',
      'PEDIDO_FECHADO': 'bg-green-100 text-green-800',
      'CANCELADO': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const subtotal = calcularTotalVenda(formData)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">
                {id ? `Venda #${numeroVenda || id}` : 'Nova Venda'}
              </h1>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {id ? 'Detalhes da venda' : 'Crie orçamentos, pedidos de venda ou vendas diretas'}
            </p>
          </div>
          <button
            onClick={() => navigate('/vendas')}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Voltar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Coluna Principal - Formulário */}
        <div className="col-span-2 space-y-4">
          {/* Card: Dados Gerais */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-base font-medium text-gray-900 mb-3">Dados Gerais</h2>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tipo de Venda *
                </label>
                <select
                  value={formData.tipo_venda}
                  onChange={(e) => setFormData({ ...formData, tipo_venda: e.target.value as any })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                >
                  {TIPO_VENDA_LABELS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Data da Venda *
                </label>
                <DatePicker
                  selected={formData.data_venda ? new Date(formData.data_venda) : null}
                  onChange={(date) => setFormData({ ...formData, data_venda: date ? date.toISOString().split('T')[0] : '' })}
                  placeholder="Selecione a data"
                  required
                />
              </div>

              {/* Campo Validade - Apenas para Orçamentos */}
              {formData.tipo_venda === 'ORCAMENTO' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Validade do Orçamento *
                  </label>
                  <DatePicker
                    selected={formData.data_validade ? new Date(formData.data_validade) : null}
                    onChange={(date) => setFormData({ ...formData, data_validade: date ? date.toISOString().split('T')[0] : '' })}
                    placeholder="Selecione a validade"
                    minDate={formData.data_venda ? new Date(formData.data_venda) : new Date()}
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              {/* Campo Cliente com Autocomplete */}
              <div ref={clienteRef} className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={buscaCliente}
                      onChange={(e) => {
                        setBuscaCliente(e.target.value)
                        if (!e.target.value) {
                          setClienteSelecionado(null)
                          setFormData(prev => ({ ...prev, cliente_id: undefined }))
                        }
                      }}
                      className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open('/cadastro/clientes', '_blank')}
                    className="px-2 py-1.5 bg-gray-800 text-white rounded-md hover:bg-gray-900 flex items-center justify-center"
                    title="Cadastrar novo cliente"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Lista de sugestões de clientes */}
                {mostrarSugestoesClientes && clientesSugeridos.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                    {clientesSugeridos.map((cliente) => (
                      <button
                        key={cliente.id}
                        type="button"
                        onClick={() => selecionarCliente(cliente)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-sm text-gray-900">
                          {cliente.nome_completo || cliente.razao_social}
                        </div>
                        <div className="text-xs text-gray-500">
                          {cliente.cpf || cliente.cnpj}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Mostrar cliente selecionado */}
                {clienteSelecionado && (
                  <div className="mt-1 text-xs text-green-600">
                    ✓ {clienteSelecionado.nome_completo || clienteSelecionado.razao_social}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Vendedor
                </label>
                <input
                  type="text"
                  value={formData.vendedor || ''}
                  onChange={(e) => setFormData({ ...formData, vendedor: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Card: Itens */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-base font-medium text-gray-900 mb-3">Produtos/Itens</h2>

            {/* Formulário de Adicionar Item */}
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Adicionar Item</h3>

              {/* Campo de Busca de Produto com Autocomplete */}
              <div ref={produtoRef} className="mb-3 relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Buscar Produto
                </label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={buscaProduto}
                    onChange={(e) => setBuscaProduto(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    onFocus={() => buscaProduto.length >= 2 && setMostrarSugestoesProdutos(true)}
                  />
                </div>

                {/* Lista de sugestões de produtos */}
                {mostrarSugestoesProdutos && produtosSugeridos.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                    {produtosSugeridos.map((produto) => (
                      <button
                        key={produto.id}
                        type="button"
                        onClick={() => selecionarProduto(produto)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-sm text-gray-900">
                          {produto.nome}
                        </div>
                        <div className="text-xs text-gray-500 flex justify-between">
                          <span>Código: {produto.codigo_interno || produto.codigo_barras || 'N/A'}</span>
                          <span className="font-semibold text-green-600">
                            R$ {Number(produto.preco_venda || 0).toFixed(2)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    value={itemAtual.produto_codigo || ''}
                    onChange={(e) => setItemAtual({ ...itemAtual, produto_codigo: e.target.value || undefined })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-gray-50"
                    readOnly
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={itemAtual.produto_nome || ''}
                    onChange={(e) => setItemAtual({ ...itemAtual, produto_nome: e.target.value || undefined })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Qtd *
                  </label>
                  <input
                    type="number"
                    value={itemAtual.quantidade}
                    onChange={(e) => setItemAtual({ ...itemAtual, quantidade: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Valor Unit. *
                  </label>
                  <input
                    type="number"
                    value={itemAtual.valor_unitario}
                    onChange={(e) => setItemAtual({ ...itemAtual, valor_unitario: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <button
                onClick={adicionarItem}
                className="mt-2 px-3 py-1.5 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-900"
              >
                + Adicionar Item
              </button>
            </div>

            {/* Lista de Itens */}
            {formData.itens.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qtd</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor Unit.</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.itens.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-xs text-gray-900">{item.produto_codigo || '-'}</td>
                        <td className="px-3 py-2 text-xs text-gray-900">{item.produto_nome}</td>
                        <td className="px-3 py-2 text-xs text-gray-900">{item.quantidade}</td>
                        <td className="px-3 py-2 text-xs text-gray-900">R$ {item.valor_unitario.toFixed(2)}</td>
                        <td className="px-3 py-2 text-xs font-semibold text-gray-900">
                          R$ {calcularTotalItem(item).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => removerItem(index)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 py-6">
                Nenhum item adicionado. Use o formulário acima para adicionar produtos.
              </p>
            )}
          </div>

          {/* Card: Pagamento */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-base font-medium text-gray-900 mb-3">Pagamento</h2>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Forma de Pagamento *
                </label>
                <select
                  value={formData.forma_pagamento}
                  onChange={(e) => {
                    const formaSelecionada = formasPagamento.find(f => f.nome === e.target.value)
                    setFormData({ 
                      ...formData, 
                      forma_pagamento: e.target.value as any,
                      // Calcular data de vencimento baseado no prazo da forma de pagamento
                      data_validade: formaSelecionada?.diasPrazo 
                        ? new Date(Date.now() + formaSelecionada.diasPrazo * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                        : formData.data_validade
                    })
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  disabled={carregandoParametros}
                >
                  {formasPagamento.length === 0 ? (
                    <option value="">Nenhuma forma disponível</option>
                  ) : (
                    formasPagamento.map(f => (
                      <option key={f.id} value={f.nome}>
                        {f.nome} {f.diasPrazo > 0 && `(${f.diasPrazo} dias)`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Plano de Parcelamento
                </label>
                <select
                  value={formData.numero_parcelas || 1}
                  onChange={(e) => {
                    const parcelamentoSelecionado = parcelamentos.find(p => p.numeroParcelas === parseInt(e.target.value))
                    setFormData({ 
                      ...formData, 
                      numero_parcelas: parseInt(e.target.value),
                      condicao_pagamento: parseInt(e.target.value) > 1 ? 'PARCELADO' : 'A_VISTA'
                    })
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  disabled={carregandoParametros}
                >
                  <option value={1}>À Vista</option>
                  {parcelamentos.map(p => (
                    <option key={p.id} value={p.numeroParcelas}>
                      {p.descricao}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Data de Vencimento
                </label>
                <DatePicker
                  selectedDate={formData.data_validade ? new Date(formData.data_validade) : null}
                  onDateChange={(date) => setFormData({ ...formData, data_validade: date ? date.toISOString().split('T')[0] : undefined })}
                  placeholder="Selecione a data de vencimento"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={formData.observacoes || ''}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Coluna Lateral - Resumo */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow p-4 sticky top-4">
            <h2 className="text-base font-medium text-gray-900 mb-3">Resumo</h2>

            {/* Status do Pedido */}
            {id && (
              <div className="mb-4 p-3 rounded-lg border-2 border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Status do Pedido</p>
                <div className={`px-3 py-2 text-sm font-semibold rounded-md text-center ${getStatusColor(statusVenda)}`}>
                  {getStatusLabel(statusVenda)}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Total de Itens:</span>
                <span className="font-semibold">{formData.itens.length}</span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Desconto:</span>
                <input
                  type="number"
                  value={formData.desconto || 0}
                  onChange={(e) => setFormData({ ...formData, desconto: parseFloat(e.target.value) })}
                  className="w-20 px-2 py-1 text-xs text-right border border-gray-300 rounded"
                  step="0.01"
                  min="0"
                  disabled={id && statusVenda !== 'ORCAMENTO'}
                />
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Frete:</span>
                <input
                  type="number"
                  value={formData.frete || 0}
                  onChange={(e) => setFormData({ ...formData, frete: parseFloat(e.target.value) })}
                  className="w-20 px-2 py-1 text-xs text-right border border-gray-300 rounded"
                  step="0.01"
                  min="0"
                  disabled={id && statusVenda !== 'ORCAMENTO'}
                />
              </div>

              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-gray-900">
                    R$ {subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {formData.condicao_pagamento === 'PARCELADO' && formData.numero_parcelas && formData.numero_parcelas > 1 && (
                <div className="bg-blue-50 p-2 rounded-md mt-2">
                  <p className="text-xs text-blue-900">
                    <strong>{formData.numero_parcelas}x</strong> de{' '}
                    <strong>R$ {(subtotal / formData.numero_parcelas).toFixed(2)}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <BotoesAcaoVenda
              vendaId={id}
              status={statusVenda}
              bloqueado={vendaBloqueada}
              carregando={carregando}
              onSalvar={handleSubmit}
              onCancelar={handleCancelarVenda}
              onExcluir={handleExcluir}
              onBloquear={handleBloquear}
              onDesbloquear={handleDesbloquear}
              onReabrir={handleReabrirPedido}
              onConfirmar={handleConfirmarPedido}
              onEmitirNota={handleEmitirNota}
            />
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
