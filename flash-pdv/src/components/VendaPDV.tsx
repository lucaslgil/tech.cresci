// =====================================================
// COMPONENTE - TELA DE VENDAS PDV
// Interface principal para realização de vendas
// =====================================================

import { useState, useEffect, useRef } from 'react'
import { ConfigPDV } from '../types/electron'
import { ProdutosService, Produto } from '../services/produtosService'
import { VendasService, VendaItem, VendaPagamento } from '../services/vendasService'
import { MovimentacoesCaixaService, type StatusCaixa } from '../services/movimentacoesCaixaService'

interface VendaPDVProps {
  config: ConfigPDV
  onVoltar: () => void
}

export default function VendaPDV({ config, onVoltar }: VendaPDVProps) {
  // Services
  const produtosService = new ProdutosService(config)
  const vendasService = new VendasService(config)

  // Estados principais
  const [itens, setItens] = useState<VendaItem[]>([])
  const [buscaProduto, setBuscaProduto] = useState('')
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [clienteNome, setClienteNome] = useState('')
  const [clienteCpf, setClienteCpf] = useState('')
  const [observacoes, setObservacoes] = useState('')
  
  // Estados de controle
  const [loading, setLoading] = useState(false)
  const [buscandoProduto, setBuscandoProduto] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null)
  const [mostrarPagamento, setMostrarPagamento] = useState(false)
  const [pagamentos, setPagamentos] = useState<VendaPagamento[]>([])
  const [formasPagamento, setFormasPagamento] = useState<Array<{ id?: number; codigo?: string; nome: string }>>([])
  
  // Estados para atalhos F1, F2, F4
  const [mostrarCaixa, setMostrarCaixa] = useState(false)
  const [mostrarBuscaCliente, setMostrarBuscaCliente] = useState(false)
  const [mostrarBuscaProduto, setMostrarBuscaProduto] = useState(false)
  const [statusCaixa, setStatusCaixa] = useState<{ aberto: boolean; saldo: number } | null>(null)
  
  // Estados para sincronização
  const [totalProdutos, setTotalProdutos] = useState(0)
  const [sincronizando, setSincronizando] = useState(false)
  
  const inputBuscaRef = useRef<HTMLInputElement>(null)
  const [sugestoes, setSugestoes] = useState<Produto[]>([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const sugestaoIndex = useRef(-1)

  // Auto focus no input de busca
  useEffect(() => {
    inputBuscaRef.current?.focus()
  }, [])

  // Verificar produtos disponíveis ao carregar
  useEffect(() => {
    verificarProdutosDisponiveis()
  }, [])

  const verificarProdutosDisponiveis = async () => {
    try {
      const result = await window.electronAPI.db.query(
        'SELECT COUNT(*) as total FROM produtos WHERE empresa_id = ? AND ativo = 1',
        [config.empresaId]
      )
      const total = result[0]?.total || 0
      setTotalProdutos(total)
      
      // Se não houver produtos, oferecer sincronização
      if (total === 0) {
        const resposta = confirm(
          '⚠️ Nenhum produto encontrado no PDV.\n\n' +
          'Deseja sincronizar produtos da retaguarda agora?'
        )
        if (resposta) {
          await sincronizarDados()
        }
      }
    } catch (error) {
      console.error('Erro ao verificar produtos:', error)
    }
  }

  const sincronizarDados = async () => {
    setSincronizando(true)
    try {
      const result = await window.electronAPI.sync.start()
      if (result.success) {
        setToast({ tipo: 'success', mensagem: result.message })
        // Atualizar contador de produtos
        await verificarProdutosDisponiveis()
        // Atualizar formas de pagamento após sync
        await carregarFormasPagamento()
      } else {
        setToast({ tipo: 'error', mensagem: result.message })
      }
    } catch (error: any) {
      setToast({ tipo: 'error', mensagem: `Erro ao sincronizar: ${error.message}` })
    } finally {
      setSincronizando(false)
    }
  }

  // Carregar formas de pagamento do banco local
  const carregarFormasPagamento = async () => {
    try {
      const rows = await window.electronAPI.db.query(
        'SELECT id, codigo, nome FROM formas_pagamento WHERE empresa_id = ? AND ativo = 1 ORDER BY nome',
        [config.empresaId]
      )
      if (Array.isArray(rows)) {
        setFormasPagamento(rows.map((r: any) => ({ id: r.id, codigo: r.codigo, nome: r.nome })))
      }
    } catch (error) {
      console.error('Erro ao carregar formas de pagamento:', error)
      // Fallback: usar conjunto padrão se a tabela não existir ou houver erro
      setFormasPagamento([
        { codigo: 'DINHEIRO', nome: 'Dinheiro' },
        { codigo: 'PIX', nome: 'PIX' },
        { codigo: 'CREDITO', nome: 'Cartão Crédito' },
        { codigo: 'DEBITO', nome: 'Cartão Débito' }
      ])
    }
  }

  // Limpar toast após 3 segundos
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Carregar formas de pagamento ao montar
  useEffect(() => {
    carregarFormasPagamento()
  }, [])

  // Atalhos de teclado: F1, F2, F4
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault()
        setMostrarCaixa(true)
      } else if (e.key === 'F2') {
        e.preventDefault()
        setMostrarBuscaCliente(true)
      } else if (e.key === 'F3') {
        e.preventDefault()
        setMostrarPagamento(true)
      } else if (e.key === 'F4') {
        e.preventDefault()
        setMostrarBuscaProduto(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Busca dinâmica de sugestões
  useEffect(() => {
    if (!buscaProduto.trim()) {
      setSugestoes([])
      setMostrarSugestoes(false)
      return
    }
    const timeout = setTimeout(async () => {
      const lista = await produtosService.listar({ busca: buscaProduto })
      setSugestoes(lista)
      setMostrarSugestoes(true)
    }, 250)
    return () => clearTimeout(timeout)
  }, [buscaProduto])

  // Selecionar sugestão pelo teclado
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!mostrarSugestoes || sugestoes.length === 0) return
    if (e.key === 'ArrowDown') {
      sugestaoIndex.current = Math.min(sugestoes.length - 1, sugestaoIndex.current + 1)
      setBuscaProduto(sugestoes[sugestaoIndex.current]?.nome || buscaProduto)
      e.preventDefault()
    } else if (e.key === 'ArrowUp') {
      sugestaoIndex.current = Math.max(0, sugestaoIndex.current - 1)
      setBuscaProduto(sugestoes[sugestaoIndex.current]?.nome || buscaProduto)
      e.preventDefault()
    } else if (e.key === 'Enter') {
      if (sugestoes[sugestaoIndex.current]) {
        selecionarSugestao(sugestoes[sugestaoIndex.current])
        e.preventDefault()
      } else {
        buscarProduto(buscaProduto)
      }
    } else if (e.key === 'Escape') {
      setMostrarSugestoes(false)
    }
  }

  const selecionarSugestao = (produto: Produto) => {
    setProdutoSelecionado(produto)
    setQuantidade(1)
    setSugestoes([])
    setMostrarSugestoes(false)
    setBuscaProduto('')
  }

  // Buscar produto (por código ou EAN)
  const buscarProduto = async (busca: string) => {
    if (!busca.trim()) return

    setBuscandoProduto(true)
    try {
      let produto: Produto | null = null

      // Tentar buscar por código
      produto = await produtosService.buscarPorCodigo(busca)

      // Se não encontrou, tentar por EAN
      if (!produto) {
        produto = await produtosService.buscarPorEan(busca)
      }

      if (produto) {
        setProdutoSelecionado(produto)
        setQuantidade(1)
      } else {
        setToast({ tipo: 'error', mensagem: 'Produto não encontrado' })
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error)
      setToast({ tipo: 'error', mensagem: 'Erro ao buscar produto' })
    } finally {
      setBuscandoProduto(false)
      setBuscaProduto('')
    }
  }

  // Adicionar item ao carrinho
  const adicionarItem = () => {
    if (!produtoSelecionado) return

    const novoItem: VendaItem = {
      produto_id: produtoSelecionado.id,
      produto_codigo: produtoSelecionado.codigo_interno,
      produto_descricao: produtoSelecionado.nome,
      quantidade,
      preco_unitario: produtoSelecionado.preco_venda,
      desconto: 0,
      acrescimo: 0,
      valor_total: quantidade * produtoSelecionado.preco_venda,
      numero_item: itens.length + 1
    }

    setItens([...itens, novoItem])
    setProdutoSelecionado(null)
    setQuantidade(1)
    inputBuscaRef.current?.focus()
  }

  // Remover item
  const removerItem = (index: number) => {
    const novosItens = itens.filter((_, i) => i !== index)
    // Reajustar número dos itens
    const itensReajustados = novosItens.map((item, i) => ({
      ...item,
      numero_item: i + 1
    }))
    setItens(itensReajustados)
  }

  // Calcular totais
  const calcularTotais = () => {
    const subtotal = itens.reduce((sum, item) => sum + item.valor_total, 0)
    return { subtotal, total: subtotal }
  }

  const { subtotal, total } = calcularTotais()

  const totalPago = pagamentos.reduce((sum, pag) => sum + pag.valor, 0)
  const restantePagamento = total - totalPago

  // Abrir modal de pagamento
  const abrirPagamento = () => {
    if (itens.length === 0) {
      setToast({ tipo: 'error', mensagem: 'Adicione itens antes de finalizar' })
      return
    }
    setMostrarPagamento(true)
  }

  // Adicionar forma de pagamento
  const adicionarPagamento = (forma: string, valor: number) => {
    const novoPagamento: VendaPagamento = {
      forma_pagamento: forma,
      valor,
      numero_parcela: pagamentos.length + 1
    }
    setPagamentos([...pagamentos, novoPagamento])
  }

  // Remover pagamento
  const removerPagamento = (index: number) => {
    const novosPagamentos = pagamentos.filter((_, i) => i !== index)
    const pagamentosReajustados = novosPagamentos.map((pag, i) => ({
      ...pag,
      numero_parcela: i + 1
    }))
    setPagamentos(pagamentosReajustados)
  }

  // Finalizar venda
  const finalizarVenda = async () => {
    if (itens.length === 0) {
      setToast({ tipo: 'error', mensagem: 'Adicione itens à venda' })
      return
    }

    const totalPagamentos = pagamentos.reduce((sum, pag) => sum + pag.valor, 0)
    if (Math.abs(totalPagamentos - total) > 0.01) {
      setToast({ tipo: 'error', mensagem: 'O valor dos pagamentos não corresponde ao total' })
      return
    }

    setLoading(true)
    try {
      await vendasService.criar({
        cliente_nome: clienteNome || undefined,
        cliente_cpf: clienteCpf || undefined,
        tipo_venda: 'VENDA',
        observacoes: observacoes || undefined,
        itens,
        pagamentos
      })

      setToast({ tipo: 'success', mensagem: 'Venda registrada com sucesso!' })
      
      // Limpar formulário após 1 segundo
      setTimeout(() => {
        setItens([])
        setPagamentos([])
        setClienteNome('')
        setClienteCpf('')
        setObservacoes('')
        setMostrarPagamento(false)
      }, 1000)
    } catch (error) {
      console.error('Erro ao criar venda:', error)
      setToast({ tipo: 'error', mensagem: 'Erro ao registrar venda' })
    } finally {
      setLoading(false)
    }
  }

  // Cancelar venda atual
  const cancelarVenda = () => {
    if (confirm('Deseja cancelar a venda atual?')) {
      setItens([])
      setPagamentos([])
      setClienteNome('')
      setClienteCpf('')
      setObservacoes('')
      setProdutoSelecionado(null)
      setMostrarPagamento(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#394353] text-white shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onVoltar}
                className="text-white hover:opacity-80"
              >
                ← Voltar
              </button>
              <h1 className="text-xl font-bold">Nova Venda</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMostrarCaixa(true)}
                className="px-3 py-1 bg-white bg-opacity-20 text-white text-xs font-semibold rounded hover:bg-opacity-30"
                title="Atalho: F1"
              >
                F1 - Caixa
              </button>
              <button
                onClick={() => setMostrarBuscaCliente(true)}
                className="px-3 py-1 bg-white bg-opacity-20 text-white text-xs font-semibold rounded hover:bg-opacity-30"
                title="Atalho: F2"
              >
                F2 - Cliente
              </button>
              <button
                onClick={() => setMostrarPagamento(true)}
                className="px-3 py-1 bg-white bg-opacity-20 text-white text-xs font-semibold rounded hover:bg-opacity-30"
                title="Atalho: F3"
              >
                F3 - Pagamento
              </button>
              <button
                onClick={() => setMostrarBuscaProduto(true)}
                className="px-3 py-1 bg-white bg-opacity-20 text-white text-xs font-semibold rounded hover:bg-opacity-30"
                title="Atalho: F4"
              >
                F4 - Produtos
              </button>
              
              <div className="border-l border-white border-opacity-30 pl-3 ml-2">
                <button
                  onClick={sincronizarDados}
                  disabled={sincronizando}
                  className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 disabled:opacity-50"
                  title="Sincronizar produtos e clientes"
                >
                  {sincronizando ? '⏳ Sincronizando...' : '🔄 Sincronizar'}
                </button>
              </div>
              
              <div className="text-xs ml-2 bg-white bg-opacity-20 px-3 py-1 rounded" title="Produtos disponíveis">
                📦 {totalProdutos} {totalProdutos === 1 ? 'produto' : 'produtos'}
              </div>
              
              <div className="text-sm ml-2 border-l border-white border-opacity-30 pl-4">
                {config.empresaNome} • {config.usuarioNome}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div 
          className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            toast.tipo === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white font-semibold`}
        >
          {toast.mensagem}
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Coluna Esquerda - Busca e Itens */}
          <div className="lg:col-span-2 space-y-4">
            {/* Busca de Produto */}
            <div className="bg-white rounded-xl border-2 border-[#C9C4B5] shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🔍</span>
                <label className="text-base font-bold text-gray-800">
                  Buscar Produto
                </label>
              </div>
              <div className="flex gap-3 relative">
                <input
                  ref={inputBuscaRef}
                  type="text"
                  value={buscaProduto}
                  onChange={(e) => {
                    setBuscaProduto(e.target.value)
                    sugestaoIndex.current = -1
                  }}
                  onKeyDown={handleInputKeyDown}
                  onFocus={() => buscaProduto && setMostrarSugestoes(true)}
                  onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)}
                  placeholder="Digite o código ou passe o código de barras..."
                  className="flex-1 px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  disabled={buscandoProduto}
                />
                <button
                  onClick={() => buscarProduto(buscaProduto)}
                  disabled={buscandoProduto}
                  className="px-6 py-3 bg-[#394353] text-white text-base font-bold rounded-lg hover:bg-[#2d3543] disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
                >
                  {buscandoProduto ? '⏳' : '🔍 Buscar'}
                </button>
              </div>
            </div>

            {/* Produto Selecionado */}
            {produtoSelecionado && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-5 shadow-md">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded">
                        {produtoSelecionado.codigo_interno}
                      </span>
                      <h3 className="font-bold text-lg text-gray-900">
                        {produtoSelecionado.nome}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        💰 R$ {produtoSelecionado.preco_venda.toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1 text-gray-600">
                        📦 Estoque: {produtoSelecionado.estoque_atual}
                      </span>
                      {produtoSelecionado.codigo_barras && (
                        <span className="flex items-center gap-1 text-gray-500 text-xs">
                          🏷️ {produtoSelecionado.codigo_barras}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-sm">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Quantidade</label>
                      <input
                        type="number"
                        min="1"
                        value={quantidade}
                        onChange={(e) => setQuantidade(Number(e.target.value))}
                        className="w-24 px-3 py-2 text-base font-bold text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={adicionarItem}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold rounded-lg hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      ✓ Adicionar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Itens */}
            <div className="bg-white rounded-xl border-2 border-[#C9C4B5] shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-[#394353] to-[#4a5568] text-white px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛒</span>
                    <h2 className="text-lg font-bold">
                      Itens da Venda
                    </h2>
                  </div>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-bold">
                    {itens.length} {itens.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
                {itens.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-6xl mb-3">📦</div>
                    <p className="text-gray-400 font-medium">Nenhum item adicionado</p>
                    <p className="text-xs text-gray-400 mt-1">Busque produtos para adicionar à venda</p>
                  </div>
                ) : (
                  itens.map((item, index) => (
                    <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-xs font-bold text-gray-400 w-6">#{item.numero_item}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-base text-gray-900">{item.produto_descricao}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Cód: {item.produto_codigo} • {item.quantidade} x R$ {item.preco_unitario.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-lg text-emerald-700">
                          R$ {item.valor_total.toFixed(2)}
                        </p>
                        <button
                          onClick={() => removerItem(index)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-600 hover:text-white text-xs font-semibold rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          🗑️ Remover
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Coluna Direita - Resumo */}
          <div className="space-y-4">
            {/* Cliente */}
            <div className="bg-white rounded-xl border-2 border-[#C9C4B5] shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">👤</span>
                <h3 className="text-base font-bold text-gray-800">Cliente</h3>
                <span className="text-xs text-gray-500">(Opcional)</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nome</label>
                  <input
                    type="text"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">CPF/CNPJ</label>
                  <input
                    type="text"
                    value={clienteCpf}
                    onChange={(e) => setClienteCpf(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
            </div>

            {/* Totais */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-300 shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">💰</span>
                <h3 className="text-base font-bold text-gray-800">Resumo</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">Itens:</span>
                  <span className="font-semibold text-gray-900">{itens.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">Subtotal:</span>
                  <span className="font-semibold text-gray-900">R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="border-t-2 border-dashed border-gray-300 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                    <span className="text-2xl font-black text-emerald-700">R$ {total.toFixed(2)}</span>
                  </div>
                </div>
                {pagamentos.length > 0 && (
                  <div className="mt-3 bg-white border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Pagamentos</span>
                      <span className="text-sm font-semibold text-gray-900">R$ {totalPago.toFixed(2)}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {pagamentos.map((pag, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-gray-600">{pag.forma_pagamento} • Parcela {pag.numero_parcela}</span>
                          <span className="font-semibold">R$ {pag.valor.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t mt-2 flex justify-between">
                        <span className="text-sm font-medium">Restante</span>
                        <span className={restantePagamento > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>R$ {restantePagamento.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-3">
              <button
                onClick={abrirPagamento}
                disabled={itens.length === 0}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-lg font-black rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-95"
              >
                ✓ FINALIZAR VENDA
              </button>
              <button
                onClick={cancelarVenda}
                disabled={itens.length === 0}
                className="w-full px-4 py-2.5 border-2 border-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50 transition-all"
              >
                ✕ Cancelar Venda
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Pagamento */}
      {mostrarPagamento && (
        <ModalPagamento
          total={total}
          pagamentos={pagamentos}
          formasPagamento={formasPagamento}
          onAdicionarPagamento={adicionarPagamento}
          onRemoverPagamento={removerPagamento}
          onFinalizar={finalizarVenda}
          onFechar={() => setMostrarPagamento(false)}
          loading={loading}
        />
      )}

      {/* Modal: Abrir/Fechar Caixa (F1) */}
      {mostrarCaixa && (
        <ModalCaixa
          config={config}
          onFechar={() => setMostrarCaixa(false)}
          onSucesso={() => {
            setMostrarCaixa(false)
            setToast({ tipo: 'success', mensagem: 'Operação de caixa realizada!' })
          }}
        />
      )}

      {/* Modal: Buscar Cliente (F2) */}
      {mostrarBuscaCliente && (
        <ModalBuscaCliente
          config={config}
          onSelecionar={(cliente) => {
            setClienteNome(cliente.nome)
            setClienteCpf(cliente.cpf || '')
            setMostrarBuscaCliente(false)
            setToast({ tipo: 'success', mensagem: 'Cliente selecionado!' })
          }}
          onFechar={() => setMostrarBuscaCliente(false)}
        />
      )}

      {/* Modal: Buscar Produtos (F4) */}
      {mostrarBuscaProduto && (
        <ModalBuscaProdutos
          config={config}
          onSelecionar={(produto) => {
            setProdutoSelecionado(produto)
            setQuantidade(1)
            setMostrarBuscaProduto(false)
          }}
          onFechar={() => setMostrarBuscaProduto(false)}
        />
      )}
    </div>
  )
}

// Modal de Pagamento
interface ModalPagamentoProps {
  total: number
  pagamentos: VendaPagamento[]
  formasPagamento: Array<{ id?: number; codigo?: string; nome: string }>
  onAdicionarPagamento: (forma: string, valor: number) => void
  onRemoverPagamento: (index: number) => void
  onFinalizar: () => void
  onFechar: () => void
  loading: boolean
}

function ModalPagamento({
  total,
  pagamentos,
  formasPagamento,
  onAdicionarPagamento,
  onRemoverPagamento,
  onFinalizar,
  onFechar,
  loading
}: ModalPagamentoProps) {
  const [formaPagamento, setFormaPagamento] = useState('DINHEIRO')
  const [valorPagamento, setValorPagamento] = useState(total)

  const totalPago = pagamentos.reduce((sum, pag) => sum + pag.valor, 0)
  const restante = total - totalPago
  const troco = totalPago > total ? totalPago - total : 0

  const adicionarPagamentoInterno = () => {
    if (valorPagamento <= 0) return
    onAdicionarPagamento(formaPagamento, valorPagamento)
    setValorPagamento(Math.max(0, restante - valorPagamento))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#394353] text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold">Pagamento</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Resumo */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total da Venda:</span>
              <span className="font-semibold">R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Pago:</span>
              <span className="font-semibold">R$ {totalPago.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t">
              <span>Restante:</span>
              <span className={restante > 0 ? 'text-red-600' : 'text-green-600'}>
                R$ {restante.toFixed(2)}
              </span>
            </div>
            {troco > 0 && (
              <div className="flex justify-between text-lg font-bold text-green-600 pt-2 border-t">
                <span>Troco:</span>
                <span>R$ {troco.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Adicionar Pagamento */}
          <div className="border border-[#C9C4B5] rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Adicionar Forma de Pagamento</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Forma</label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                >
                  {formasPagamento.length > 0 ? (
                    formasPagamento.map((f) => (
                      <option key={f.id || f.codigo} value={f.codigo || f.nome}>
                        {f.nome}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="DINHEIRO">Dinheiro</option>
                      <option value="DEBITO">Cartão Débito</option>
                      <option value="CREDITO">Cartão Crédito</option>
                      <option value="PIX">PIX</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Valor</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={valorPagamento}
                    onChange={(e) => setValorPagamento(Number(e.target.value))}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={adicionarPagamentoInterno}
                    className="px-3 py-2 bg-[#394353] text-white text-sm font-semibold rounded-lg hover:opacity-90"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Pagamentos */}
          {pagamentos.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Formas de Pagamento Adicionadas</h3>
              <div className="space-y-2">
                {pagamentos.map((pag, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{pag.forma_pagamento}</p>
                      <p className="text-xs text-gray-600">
                        Parcela {pag.numero_parcela}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">R$ {pag.valor.toFixed(2)}</span>
                      <button
                        onClick={() => onRemoverPagamento(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex gap-3">
          <button
            onClick={onFechar}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onFinalizar}
            disabled={loading || restante !== 0}
            className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Finalizando...' : 'CONFIRMAR VENDA'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ===================================================== 
// MODAL: ABRIR/FECHAR CAIXA (F1)
// =====================================================
interface ModalCaixaProps {
  config: ConfigPDV
  onFechar: () => void
  onSucesso: () => void
}

function ModalCaixa({ config, onFechar, onSucesso }: ModalCaixaProps) {
  const [statusCaixa, setStatusCaixa] = useState<StatusCaixa | null>(null)
  const [operacao, setOperacao] = useState<'abrir' | 'fechar'>('abrir')
  const [valor, setValor] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  // Carregar status do caixa ao abrir modal
  useEffect(() => {
    carregarStatusCaixa()
  }, [])

  const carregarStatusCaixa = async () => {
    try {
      setCarregando(true)
      const status = await MovimentacoesCaixaService.statusCaixa(config)
      setStatusCaixa(status)
      
      // Definir operação padrão baseado no status
      if (status.caixaAberto) {
        setOperacao('fechar')
        // Sugerir valor atual como valor de fechamento
        setValor(status.saldoAtual.toFixed(2))
      } else {
        setOperacao('abrir')
        setValor('0.00')
      }
    } catch (error) {
      console.error('Erro ao carregar status do caixa:', error)
      setErro('Erro ao carregar informações do caixa')
    } finally {
      setCarregando(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!valor || parseFloat(valor) < 0) {
      setErro('Valor inválido')
      return
    }

    setSalvando(true)
    setErro('')

    try {
      const valorNumerico = parseFloat(valor)
      const usuarioNome = config.usuarioNome || 'Operador PDV'

      if (operacao === 'abrir') {
        await MovimentacoesCaixaService.abrirCaixa(
          config,
          valorNumerico,
          usuarioNome,
          observacoes || undefined
        )
        console.log('✅ Caixa aberto com sucesso')
      } else {
        await MovimentacoesCaixaService.fecharCaixa(
          config,
          valorNumerico,
          usuarioNome,
          observacoes || undefined
        )
        console.log('✅ Caixa fechado com sucesso')
      }
      
      onSucesso()
      onFechar()
    } catch (error: any) {
      console.error('Erro na operação de caixa:', error)
      setErro(error.message || 'Erro ao processar operação')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#394353] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando informações do caixa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="bg-[#394353] text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-xl font-bold">🔐 Controle de Caixa (F1)</h2>
          <button 
            onClick={onFechar} 
            className="text-white hover:opacity-80 text-2xl leading-none"
            disabled={salvando}
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Status do Caixa */}
          {statusCaixa && (
            <div className={`mb-6 p-4 rounded-lg ${statusCaixa.caixaAberto ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">Status do Caixa</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusCaixa.caixaAberto ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                  {statusCaixa.caixaAberto ? '🟢 ABERTO' : '🔴 FECHADO'}
                </span>
              </div>
              
              {statusCaixa.caixaAberto && (
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div>
                    <span className="text-gray-600">Caixa #</span>
                    <span className="ml-2 font-semibold text-gray-800">{statusCaixa.caixaNumero}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Abertura</span>
                    <span className="ml-2 font-semibold text-gray-800">R$ {statusCaixa.valorAbertura?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Entradas</span>
                    <span className="ml-2 font-semibold text-green-600">+ R$ {statusCaixa.totalEntradas.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Saídas</span>
                    <span className="ml-2 font-semibold text-red-600">- R$ {statusCaixa.totalSaidas.toFixed(2)}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-green-200">
                    <span className="text-gray-600">Saldo Atual</span>
                    <span className="ml-2 font-bold text-lg text-gray-800">R$ {statusCaixa.saldoAtual.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Seleção de Operação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Operação</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOperacao('abrir')
                    setValor('0.00')
                  }}
                  disabled={statusCaixa?.caixaAberto || salvando}
                  className={`px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${
                    operacao === 'abrir'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  🟢 Abrir Caixa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOperacao('fechar')
                    if (statusCaixa) {
                      setValor(statusCaixa.saldoAtual.toFixed(2))
                    }
                  }}
                  disabled={!statusCaixa?.caixaAberto || salvando}
                  className={`px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${
                    operacao === 'fechar'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  🔴 Fechar Caixa
                </button>
              </div>
            </div>

            {/* Campo Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor {operacao === 'abrir' ? 'Inicial' : 'Final'} (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
                autoFocus
                disabled={salvando}
                className="w-full px-4 py-3 text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#394353] focus:border-transparent disabled:bg-gray-100"
                placeholder="0.00"
              />
              {operacao === 'fechar' && statusCaixa && (
                <div className="mt-2 text-sm">
                  {parseFloat(valor) !== statusCaixa.saldoAtual && (
                    <div className={`p-2 rounded ${parseFloat(valor) > statusCaixa.saldoAtual ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                      <strong>Diferença:</strong> R$ {(parseFloat(valor) - statusCaixa.saldoAtual).toFixed(2)}
                      {parseFloat(valor) > statusCaixa.saldoAtual ? ' (Sobra)' : ' (Falta)'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Campo Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                disabled={salvando}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#394353] focus:border-transparent disabled:bg-gray-100"
                placeholder="Informações adicionais (opcional)"
              />
            </div>

            {/* Mensagem de Erro */}
            {erro && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                ⚠️ {erro}
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onFechar}
                disabled={salvando}
                className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar (ESC)
              </button>
              <button
                type="submit"
                disabled={salvando}
                className={`flex-1 px-4 py-3 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  operacao === 'abrir'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {salvando ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processando...
                  </span>
                ) : (
                  `${operacao === 'abrir' ? 'Abrir' : 'Fechar'} Caixa`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// MODAL: BUSCAR CLIENTE (F2)
// =====================================================
interface ModalBuscaClienteProps {
  config: ConfigPDV
  onSelecionar: (cliente: { id: number; nome: string; cpf?: string }) => void
  onFechar: () => void
}

function ModalBuscaCliente({ config, onSelecionar, onFechar }: ModalBuscaClienteProps) {
  const [busca, setBusca] = useState('')
  const [clientes, setClientes] = useState<any[]>([])
  const [buscando, setBuscando] = useState(false)

  const buscarClientes = async () => {
    if (!busca.trim()) return

    setBuscando(true)
    try {
      const result = await window.electronAPI.db.query(
        `SELECT id, nome_completo as nome, cpf FROM clientes 
         WHERE empresa_id = ? 
           AND (nome_completo LIKE ? OR cpf LIKE ?)
         LIMIT 20`,
        [config.empresaId, `%${busca}%`, `%${busca}%`]
      )
      setClientes(result || [])
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="bg-[#394353] text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-xl font-bold">👤 Buscar Cliente (F2)</h2>
          <button onClick={onFechar} className="text-white hover:opacity-80 text-2xl">
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarClientes()}
              placeholder="Digite nome ou CPF do cliente..."
              autoFocus
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
            />
            <button
              onClick={buscarClientes}
              disabled={buscando}
              className="px-4 py-2 bg-[#394353] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {buscando ? '...' : 'Buscar'}
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            {clientes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {busca ? 'Nenhum cliente encontrado' : 'Digite algo para buscar'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {clientes.map((cliente) => (
                  <button
                    key={cliente.id}
                    onClick={() => onSelecionar(cliente)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-semibold text-sm text-gray-900">{cliente.nome}</p>
                    <p className="text-xs text-gray-600">{cliente.cpf || 'CPF não informado'}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t px-6 py-4">
          <button
            onClick={onFechar}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// MODAL: BUSCAR PRODUTOS (F4)
// =====================================================
interface ModalBuscaProdutosProps {
  config: ConfigPDV
  onSelecionar: (produto: Produto) => void
  onFechar: () => void
}

function ModalBuscaProdutos({ config, onSelecionar, onFechar }: ModalBuscaProdutosProps) {
  const [busca, setBusca] = useState('')
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [buscando, setBuscando] = useState(false)

  // Carregar produtos automaticamente ao abrir o modal
  useEffect(() => {
    carregarProdutosIniciais()
  }, [])

  const carregarProdutosIniciais = async () => {
    setBuscando(true)
    try {
      const result = await window.electronAPI.db.query(
        `SELECT * FROM produtos 
         WHERE empresa_id = ? 
           AND ativo = 1
         ORDER BY nome
         LIMIT 50`,
        [config.empresaId]
      )
      setProdutos(result || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setBuscando(false)
    }
  }

  const buscarProdutos = async () => {
    if (!busca.trim()) {
      carregarProdutosIniciais()
      return
    }

    setBuscando(true)
    try {
      const result = await window.electronAPI.db.query(
        `SELECT * FROM produtos 
         WHERE empresa_id = ? 
           AND ativo = 1
           AND (codigo_interno LIKE ? OR nome LIKE ? OR codigo_barras LIKE ?)
         LIMIT 50`,
        [config.empresaId, `%${busca}%`, `%${busca}%`, `%${busca}%`]
      )
      setProdutos(result || [])
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="bg-[#394353] text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-xl font-bold">📦 Buscar Produtos (F4)</h2>
          <button onClick={onFechar} className="text-white hover:opacity-80 text-2xl">
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarProdutos()}
              placeholder="Digite código, descrição ou EAN..."
              autoFocus
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
            />
            <button
              onClick={buscarProdutos}
              disabled={buscando}
              className="px-4 py-2 bg-[#394353] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {buscando ? '...' : 'Buscar'}
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            {buscando ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
                Carregando produtos...
              </div>
            ) : produtos.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">📦</div>
                {busca ? (
                  <p className="text-gray-600">Nenhum produto encontrado para "{busca}"</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-600 font-semibold">Nenhum produto disponível</p>
                    <p className="text-sm text-gray-500">
                      Clique no botão "🔄 Sincronizar" no topo da tela<br />
                      para baixar produtos da retaguarda
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Código</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Descrição</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Preço</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Estoque</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {produtos.map((produto) => (
                    <tr key={produto.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs">{produto.codigo_interno}</td>
                      <td className="px-4 py-3 text-xs">{produto.nome}</td>
                      <td className="px-4 py-3 text-xs text-right font-semibold">
                        R$ {produto.preco_venda.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-xs text-right">{produto.estoque_atual}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onSelecionar(produto)}
                          className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700"
                        >
                          Selecionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="border-t px-6 py-4">
          <button
            onClick={onFechar}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
