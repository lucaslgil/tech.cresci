// =====================================================
// CADASTRO DE PRODUTOS - COMPATÍVEL COM ERP BRASILEIRO
// Listagem e Formulário completo para NF-e/NFC-e/SAT
// Data: 01/12/2025
// =====================================================

import React, { useState, useEffect } from 'react'
import { Toast } from '../../shared/components/Toast'
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Filter,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Upload
} from 'lucide-react'
import type { Produto, ProdutoFormData } from './types'
import {
  buscarProdutosComEstoque,
  criarProduto,
  atualizarProduto,
  excluirProduto,
  buscarCategorias,
  validarNCM,
  validarCFOP,
  validarEAN13,
  validarRegimeTributario,
  calcularMargemLucro,
  calcularPrecoVenda,
  formatarNCM
} from './produtosService'
import { CATEGORIAS_PADRAO } from './types'
import { ModalFormularioProduto } from './ModalFormularioProduto'
import { ModalImportacaoProdutos } from './ModalImportacaoProdutos'

interface ToastMessage {
  message: string
  type: 'success' | 'error' | 'warning'
}

export const CadastroProdutos: React.FC = () => {
  // Estados principais
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProdutos, setLoadingProdutos] = useState(true)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  
  // Estados de modal
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [produtoToDelete, setProdutoToDelete] = useState<Produto | null>(null)
  
  // Estados de filtro e busca
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    categoria: '',
    ativo: 'todos',
    estoqueBaixo: false
  })
  
  // Estados de ordenação
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Produto
    direction: 'asc' | 'desc'
  } | null>(null)
  
  // Categorias disponíveis
  const [categorias, setCategorias] = useState<string[]>(CATEGORIAS_PADRAO)

  // Estado inicial do formulário
  const initialFormData: ProdutoFormData = {
    codigo_interno: '',
    codigo_barras: '',
    nome: '',
    descricao: '',
    categoria: '',
    unidade_medida: 'UN',
    
    // Dados Fiscais
    ncm: '',
    cest: '',
    cfop_entrada: '',
    cfop_saida: '',
    origem_mercadoria: 0,
    
    // ICMS
    cst_icms: '',
    csosn_icms: '',
    aliquota_icms: 0,
    reducao_bc_icms: 0,
    
    // Substituição Tributária
    cst_icms_st: '',
    mva_st: 0,
    aliquota_icms_st: 0,
    reducao_bc_icms_st: 0,
    
    // PIS/COFINS
    cst_pis: '',
    aliquota_pis: 0,
    cst_cofins: '',
    aliquota_cofins: 0,
    
    // IPI
    cst_ipi: '',
    aliquota_ipi: 0,
    enquadramento_ipi: '',
    
    // Regime
    regime_tributario: 'SIMPLES',
    
    // Comercial
    preco_custo: 0,
    preco_venda: 0,
    margem_lucro: 0,
    permite_desconto: true,
    desconto_maximo: 0,
    
    // Estoque
    estoque_atual: 0,
    estoque_minimo: 0,
    estoque_maximo: 0,
    localizacao: '',
    
    // Controles
    controla_lote: false,
    controla_serie: false,
    controla_validade: false,
    dias_validade: undefined,
    
    // Status
    ativo: true,
    observacoes: ''
  }

  const [formData, setFormData] = useState<ProdutoFormData>(initialFormData)
  
  // Estado para abas do formulário
  const [activeTab, setActiveTab] = useState<'geral' | 'fiscal' | 'comercial' | 'estoque'>('geral')

  // Carregar produtos ao montar componente
  useEffect(() => {
    fetchProdutos()
    fetchCategorias()
  }, [])

  // Gerar próximo código interno automático
  const gerarProximoCodigo = async (): Promise<string> => {
    try {
      const { data } = await buscarProdutosComEstoque()
      if (!data || data.length === 0) {
        return '000001'
      }
      
      // Extrair números dos códigos existentes
      const numeros = data
        .map(p => {
          const match = p.codigo_interno.match(/\d+/)
          return match ? parseInt(match[0], 10) : 0
        })
        .filter(n => !isNaN(n))
      
      // Pegar o maior número e incrementar
      const maiorNumero = Math.max(...numeros, 0)
      const proximoNumero = maiorNumero + 1
      
      // Formatar com zeros à esquerda
      return proximoNumero.toString().padStart(6, '0')
    } catch (error) {
      console.error('Erro ao gerar código:', error)
      return '000001'
    }
  }

  // Buscar produtos
  const fetchProdutos = async () => {
    setLoadingProdutos(true)
    try {
      console.log('🔄 Buscando produtos do banco...')
      const { data, error } = await buscarProdutosComEstoque()
      if (error) throw error
      console.log(`📦 ${data?.length || 0} produtos encontrados`)
      setProdutos(data || [])
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
      setToast({ message: 'Erro ao carregar produtos', type: 'error' })
    } finally {
      setLoadingProdutos(false)
    }
  }

  // Buscar categorias
  const fetchCategorias = async () => {
    const { data } = await buscarCategorias()
    if (data && data.length > 0) {
      // Combinar categorias do banco com categorias padrão
      const todasCategorias = [...new Set([...CATEGORIAS_PADRAO, ...data])]
      setCategorias(todasCategorias)
    }
  }

  // Abrir modal para novo produto
  const handleNovoProduto = async () => {
    const proximoCodigo = await gerarProximoCodigo()
    setEditingProduto(null)
    setFormData({
      ...initialFormData,
      codigo_interno: proximoCodigo
    })
    setActiveTab('geral')
    setShowModal(true)
  }

  // Abrir modal para editar produto
  const handleEditarProduto = (produto: Produto) => {
    console.log('🔧 Editando produto:', produto)
    console.log('📦 Estoque do produto:', produto.estoque_atual)
    
    setEditingProduto(produto)
    setFormData({
      codigo_interno: produto.codigo_interno,
      codigo_barras: produto.codigo_barras || '',
      nome: produto.nome,
      descricao: produto.descricao || '',
      categoria: produto.categoria || '',
      unidade_medida: produto.unidade_medida,
      
      ncm: produto.ncm,
      cest: produto.cest || '',
      cfop_entrada: produto.cfop_entrada || '',
      cfop_saida: produto.cfop_saida || '',
      origem_mercadoria: produto.origem_mercadoria || 0,
      
      cst_icms: produto.cst_icms || '',
      csosn_icms: produto.csosn_icms || '',
      aliquota_icms: produto.aliquota_icms || 0,
      reducao_bc_icms: produto.reducao_bc_icms || 0,
      
      cst_icms_st: produto.cst_icms_st || '',
      mva_st: produto.mva_st || 0,
      aliquota_icms_st: produto.aliquota_icms_st || 0,
      reducao_bc_icms_st: produto.reducao_bc_icms_st || 0,
      
      cst_pis: produto.cst_pis || '',
      aliquota_pis: produto.aliquota_pis || 0,
      cst_cofins: produto.cst_cofins || '',
      aliquota_cofins: produto.aliquota_cofins || 0,
      
      cst_ipi: produto.cst_ipi || '',
      aliquota_ipi: produto.aliquota_ipi || 0,
      enquadramento_ipi: produto.enquadramento_ipi || '',
      
      regime_tributario: produto.regime_tributario || 'SIMPLES',
      
      preco_custo: produto.preco_custo || 0,
      preco_venda: produto.preco_venda,
      margem_lucro: produto.margem_lucro || 0,
      permite_desconto: produto.permite_desconto ?? true,
      desconto_maximo: produto.desconto_maximo || 0,
      
      estoque_atual: produto.estoque_atual,
      estoque_minimo: produto.estoque_minimo || 0,
      estoque_maximo: produto.estoque_maximo || 0,
      localizacao: produto.localizacao || '',
      
      controla_lote: produto.controla_lote || false,
      controla_serie: produto.controla_serie || false,
      controla_validade: produto.controla_validade || false,
      dias_validade: produto.dias_validade,
      
      ativo: produto.ativo,
      observacoes: produto.observacoes || ''
    })
    setActiveTab('geral')
    setShowModal(true)
  }

  // Confirmar exclusão
  const handleConfirmDelete = (produto: Produto) => {
    setProdutoToDelete(produto)
    setShowDeleteModal(true)
  }

  // Excluir produto
  const handleDeleteProduto = async () => {
    if (!produtoToDelete) return

    setLoading(true)
    try {
      const { error } = await excluirProduto(produtoToDelete.id)
      if (error) throw error

      setToast({ message: 'Produto excluído com sucesso!', type: 'success' })
      fetchProdutos()
      setShowDeleteModal(false)
      setProdutoToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      setToast({ message: 'Erro ao excluir produto', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Visualizar detalhes
  const handleViewDetails = (produto: Produto) => {
    // Futuramente pode abrir modal de detalhes
    console.log('Visualizar produto:', produto)
  }

  // Importar produtos em lote
  const handleImportProdutos = async (produtos: ProdutoFormData[]) => {
    // Processar apenas o primeiro produto (será chamado várias vezes pelo modal)
    const produto = produtos[0]
    if (!produto) return

    const { data, error } = await criarProduto(produto)
    
    if (error) {
      // Lançar erro para o modal capturar
      const errorMsg = (error as any).message || 'Erro ao salvar produto'
      throw new Error(errorMsg)
    }
    
    return data
  }

  // Salvar produto (criar ou atualizar)
  const handleSaveProduto = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações
    if (!validarFormulario()) return

    setLoading(true)
    try {
      console.log('💾 Salvando produto:', formData)
      console.log('📦 Estoque atual:', formData.estoque_atual)
      
      if (editingProduto) {
        // Atualizar
        console.log('✏️ Atualizando produto ID:', editingProduto.id)
        const { data, error } = await atualizarProduto(editingProduto.id, formData)
        console.log('📥 Resposta da atualização:', { data, error })
        
        if (error) {
          const errorMsg = (error as any).message || 'Erro ao atualizar produto'
          console.error('❌ Erro:', errorMsg, error)
          setToast({ message: errorMsg, type: 'error' })
          return
        }
        setToast({ message: 'Produto atualizado com sucesso!', type: 'success' })
      } else {
        // Criar
        console.log('➕ Criando novo produto')
        const { data, error } = await criarProduto(formData)
        console.log('📥 Resposta da criação:', { data, error })
        
        if (error) {
          const errorMsg = (error as any).message || 'Erro ao criar produto'
          console.error('❌ Erro:', errorMsg, error)
          setToast({ message: errorMsg, type: 'error' })
          return
        }
        setToast({ message: 'Produto cadastrado com sucesso!', type: 'success' })
      }

      console.log('♻️ Recarregando lista de produtos...')
      await fetchProdutos()
      console.log('✅ Lista recarregada')
      setShowModal(false)
      setFormData(initialFormData)
      setEditingProduto(null)
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error)
      setToast({ message: 'Erro inesperado ao salvar produto', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Validar formulário
  const validarFormulario = (): boolean => {
    // Validações obrigatórias
    if (!formData.nome.trim()) {
      setToast({ message: 'Nome do produto é obrigatório', type: 'error' })
      setActiveTab('geral')
      return false
    }

    if (!formData.codigo_interno.trim()) {
      setToast({ message: 'Código interno é obrigatório', type: 'error' })
      setActiveTab('geral')
      return false
    }

    // Validar NCM (8 dígitos) - opcional
    if (formData.ncm && formData.ncm.trim() && !validarNCM(formData.ncm)) {
      setToast({ message: 'NCM deve ter 8 dígitos quando preenchido', type: 'error' })
      setActiveTab('fiscal')
      return false
    }

    // Validar CFOP se informado
    if (formData.cfop_entrada && !validarCFOP(formData.cfop_entrada)) {
      setToast({ message: 'CFOP de entrada inválido (deve ter 4 dígitos)', type: 'error' })
      setActiveTab('fiscal')
      return false
    }

    if (formData.cfop_saida && !validarCFOP(formData.cfop_saida)) {
      setToast({ message: 'CFOP de saída inválido (deve ter 4 dígitos)', type: 'error' })
      setActiveTab('fiscal')
      return false
    }

    // Validar código de barras se informado
    if (formData.codigo_barras && formData.codigo_barras.trim()) {
      if (!validarEAN13(formData.codigo_barras)) {
        setToast({ message: 'Código de barras inválido (deve ser EAN-13 válido)', type: 'error' })
        setActiveTab('geral')
        return false
      }
    }

    // Validar regime tributário x CST/CSOSN
    if (formData.regime_tributario) {
      const validacao = validarRegimeTributario(
        formData.regime_tributario,
        formData.cst_icms,
        formData.csosn_icms
      )
      
      if (!validacao.valido) {
        setToast({ message: validacao.mensagem || 'Erro na validação tributária', type: 'error' })
        setActiveTab('fiscal')
        return false
      }
    }

    // Validar preço
    if (formData.preco_venda < 0) {
      setToast({ message: 'Preço de venda não pode ser negativo', type: 'error' })
      setActiveTab('comercial')
      return false
    }

    // Validar estoque
    if (formData.estoque_atual < 0) {
      setToast({ message: 'Estoque não pode ser negativo', type: 'error' })
      setActiveTab('estoque')
      return false
    }

    return true
  }

  // Atualizar campo do formulário
  const handleInputChange = (field: keyof ProdutoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Cálculos automáticos
    if (field === 'preco_custo' || field === 'preco_venda') {
      const custo = field === 'preco_custo' ? value : formData.preco_custo
      const venda = field === 'preco_venda' ? value : formData.preco_venda
      
      if (custo && venda) {
        const margem = calcularMargemLucro(custo, venda)
        setFormData(prev => ({ ...prev, margem_lucro: Math.round(margem * 100) / 100 }))
      }
    }
    
    if (field === 'margem_lucro' && formData.preco_custo) {
      const precoVenda = calcularPrecoVenda(formData.preco_custo, value)
      setFormData(prev => ({ ...prev, preco_venda: Math.round(precoVenda * 100) / 100 }))
    }
  }

  // Filtrar e ordenar produtos
  const produtosFiltrados = produtos
    .filter(produto => {
      // Filtro de busca
      if (searchTerm) {
        const termo = searchTerm.toLowerCase()
        return (
          produto.nome.toLowerCase().includes(termo) ||
          produto.codigo_interno.toLowerCase().includes(termo) ||
          produto.codigo_barras?.toLowerCase().includes(termo) ||
          produto.ncm.includes(termo) ||
          produto.categoria?.toLowerCase().includes(termo)
        )
      }
      return true
    })
    .filter(produto => {
      // Filtro de categoria
      if (filters.categoria && filters.categoria !== '') {
        return produto.categoria === filters.categoria
      }
      return true
    })
    .filter(produto => {
      // Filtro de status ativo
      if (filters.ativo === 'ativo') return produto.ativo === true
      if (filters.ativo === 'inativo') return produto.ativo === false
      return true
    })
    .filter(produto => {
      // Filtro de estoque baixo
      if (filters.estoqueBaixo) {
        return produto.estoque_atual < (produto.estoque_minimo || 0)
      }
      return true
    })
    .sort((a, b) => {
      if (!sortConfig) return 0
      
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue
      }
      
      return 0
    })

  // Alternar ordenação
  const handleSort = (key: keyof Produto) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  // Função para obter badge de status de estoque
  const getEstoqueBadge = (produto: Produto) => {
    if (produto.estoque_atual <= 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Sem estoque
        </span>
      )
    }
    
    if (produto.estoque_minimo && produto.estoque_atual < produto.estoque_minimo) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Estoque baixo
        </span>
      )
    }
    
    if (produto.estoque_maximo && produto.estoque_atual > produto.estoque_maximo) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Estoque alto
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Normal
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Cabeçalho */}
      <div className="bg-white shadow rounded-lg mb-4">
        <div className="px-4 py-3" style={{borderBottom: '1px solid #C9C4B5'}}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5" style={{color: '#394353'}} />
                Cadastro de Produtos
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                {produtos.length} {produtos.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center justify-center px-4 py-2.5 border shadow-sm text-sm font-semibold rounded-md hover:bg-gray-50"
                style={{borderColor: '#C9C4B5', color: '#394353'}}
              >
                <Upload className="w-4 h-4 sm:mr-2" />
                <span className="sm:inline">Importar</span>
              </button>
              <button
                onClick={handleNovoProduto}
                className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-semibold rounded-md text-white hover:opacity-90"
                style={{backgroundColor: '#394353'}}
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="sm:inline">Adicionar Produto</span>
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="px-4 py-3" style={{borderBottom: '1px solid #C9C4B5'}}>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Campo de busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nome, código, NCM..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-md text-sm"
                  style={{borderColor: '#C9C4B5'}}
                />
              </div>
            </div>
            
            {/* Botão de filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center justify-center px-4 py-2.5 border rounded-md shadow-sm text-sm font-semibold text-white hover:opacity-90"
              style={{backgroundColor: '#394353', borderColor: '#C9C4B5'}}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </button>
          </div>

          {/* Painel de filtros expandível */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white rounded-md border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={filters.categoria}
                  onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="">Todas</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.ativo}
                  onChange={(e) => setFilters({ ...filters, ativo: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="todos">Todos</option>
                  <option value="ativo">Somente Ativos</option>
                  <option value="inativo">Somente Inativos</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.estoqueBaixo}
                    onChange={(e) => setFilters({ ...filters, estoqueBaixo: e.target.checked })}
                    className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 mr-2"
                  />
                  <span className="text-sm text-gray-700">Apenas estoque baixo</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {loadingProdutos ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
            </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filters.categoria || filters.ativo !== 'todos'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece adicionando um novo produto'}
              </p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="text-white" style={{backgroundColor: '#394353'}}>
                <tr>
                  <th
                    onClick={() => handleSort('codigo_interno')}
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90"
                  >
                    <div className="flex items-center gap-1">
                      Código
                      {sortConfig?.key === 'codigo_interno' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('nome')}
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90"
                  >
                    <div className="flex items-center gap-1">
                      Nome
                      {sortConfig?.key === 'nome' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">
                    NCM
                  </th>
                  <th
                    onClick={() => handleSort('preco_venda')}
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90"
                  >
                    <div className="flex items-center gap-1">
                      Preço Venda
                      {sortConfig?.key === 'preco_venda' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('estoque_atual')}
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90"
                  >
                    <div className="flex items-center gap-1">
                      Estoque
                      {sortConfig?.key === 'estoque_atual' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white" style={{borderTop: '1px solid #C9C4B5'}}>
                {produtosFiltrados.map((produto) => (
                  <tr key={produto.id} className="hover:bg-gray-50" style={{borderBottom: '1px solid #C9C4B5'}}>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-900">
                      {produto.codigo_interno}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-900">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{produto.nome}</div>
                        {produto.codigo_barras && (
                          <div className="text-xs text-gray-500 truncate">EAN: {produto.codigo_barras}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-500">
                      {produto.categoria || '-'}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-500 font-mono">
                      {formatarNCM(produto.ncm)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-900 font-medium">
                      R$ {produto.preco_venda.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{produto.estoque_atual}</span>
                        {getEstoqueBadge(produto)}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        produto.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {produto.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-right text-xs font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(produto)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditarProduto(produto)}
                          className="text-slate-600 hover:text-slate-900"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleConfirmDelete(produto)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Cadastro/Edição - CONTINUA NO PRÓXIMO ARQUIVO */}
      {showModal && (
        <ModalFormularioProduto
          editingProduto={editingProduto}
          formData={formData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleInputChange={handleInputChange}
          handleSaveProduto={handleSaveProduto}
          loading={loading}
          onClose={() => {
            setShowModal(false)
            setEditingProduto(null)
            setFormData(initialFormData)
          }}
          categorias={categorias}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && produtoToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Confirmar Exclusão
              </h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                Tem certeza que deseja excluir o produto <strong>{produtoToDelete.nome}</strong>?
              </p>
              <p className="text-sm text-red-600 mt-2">
                Esta ação não poderá ser desfeita.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setProdutoToDelete(null)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteProduto}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação */}
      {showImportModal && (
        <ModalImportacaoProdutos
          onClose={() => setShowImportModal(false)}
          onImport={handleImportProdutos}
          onComplete={() => {
            fetchProdutos()
            setToast({ 
              message: 'Importação concluída! Verifique o resultado acima.', 
              type: 'success' 
            })
          }}
        />
      )}

      {/* Toast de Notificações */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
