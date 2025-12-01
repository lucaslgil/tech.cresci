import React, { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { Package, AlertTriangle, X, Search } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Toast } from '../../shared/components/Toast'
import type { 
  Produto, 
  Categoria, 
  UnidadeMedida, 
  ProdutoFormData
} from './types'
import {
  ORIGENS_MERCADORIA,
  CST_ICMS_OPTIONS,
  CSOSN_ICMS_OPTIONS,
  CST_PIS_COFINS_OPTIONS,
  CFOP_OPTIONS
} from './types'

export const CadastroProdutos: React.FC = () => {
  // Estados principais
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProdutos, setLoadingProdutos] = useState(true)
  
  // Estados de UI
  const [showModal, setShowModal] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'geral' | 'fiscal' | 'comercial' | 'estoque'>('geral')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)
  
  // Estados de filtros
  const [filterStatus, setFilterStatus] = useState<'all' | 'Ativo' | 'Inativo'>('all')
  const [filterCategoria, setFilterCategoria] = useState<string>('all')
  
  // Estados de importação
  const [showImportModal, setShowImportModal] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: number
    errors: string[]
  } | null>(null)
  
  // Form data inicial
  const initialFormData: ProdutoFormData = {
    nome: '',
    descricao: '',
    codigo_interno: '',
    codigo_barras: '',
    categoria_id: '',
    unidade_medida: 'UN',
    ncm: '',
    cest: '',
    cfop_entrada: '',
    cfop_saida: '',
    origem_mercadoria: '0',
    cst_icms: '',
    csosn_icms: '',
    aliquota_icms: '0',
    reducao_base_icms: '0',
    cst_pis: '',
    aliquota_pis: '0',
    cst_cofins: '',
    aliquota_cofins: '0',
    cst_ipi: '',
    aliquota_ipi: '0',
    codigo_enquadramento_ipi: '999',
    tem_substituicao_tributaria: false,
    mva_st: '0',
    aliquota_icms_st: '0',
    reducao_base_icms_st: '0',
    aliquota_aproximada_tributos: '0',
    informacoes_adicionais_fiscais: '',
    preco_custo: '0',
    preco_venda: '0',
    permite_desconto: true,
    desconto_maximo: '0',
    estoque_atual: '0',
    estoque_minimo: '0',
    estoque_maximo: '0',
    localizacao: '',
    controla_lote: false,
    controla_serie: false,
    controla_validade: false,
    dias_validade: '',
    status: 'Ativo',
    observacoes: ''
  }
  
  const [formData, setFormData] = useState<ProdutoFormData>(initialFormData)
  
  // Buscar categorias
  const fetchCategorias = async () => {
    if (!isSupabaseConfigured) {
      setCategorias([
        { id: '1', nome: 'Eletrônicos', descricao: 'Produtos eletrônicos', created_at: '', updated_at: '' },
        { id: '2', nome: 'Informática', descricao: 'Produtos de informática', created_at: '', updated_at: '' }
      ])
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('categorias_produtos')
        .select('*')
        .order('nome')
      
      if (error) throw error
      setCategorias(data || [])
    } catch (error: any) {
      setToast({ message: 'Erro ao carregar categorias: ' + error.message, type: 'error' })
      setCategorias([])
    }
  }
  
  // Buscar unidades de medida
  const fetchUnidades = async () => {
    if (!isSupabaseConfigured) {
      setUnidades([
        { id: '1', sigla: 'UN', descricao: 'Unidade', created_at: '' },
        { id: '2', sigla: 'CX', descricao: 'Caixa', created_at: '' },
        { id: '3', sigla: 'KG', descricao: 'Quilograma', created_at: '' }
      ])
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('unidades_medida')
        .select('*')
        .order('sigla')
      
      if (error) throw error
      setUnidades(data || [])
    } catch (error: any) {
      setToast({ message: 'Erro ao carregar unidades de medida: ' + error.message, type: 'error' })
      setUnidades([])
    }
  }
  
  // Buscar produtos
  const fetchProdutos = async () => {
    if (!isSupabaseConfigured) {
      setProdutos([])
      setLoadingProdutos(false)
      return
    }
    
    try {
      setLoadingProdutos(true)
      const { data, error } = await supabase
        .from('produtos')
        .select('*, categorias_produtos(nome)')
        .order('nome')
      
      if (error) throw error
      setProdutos(data || [])
    } catch (error: any) {
      setToast({ message: 'Erro ao carregar produtos: ' + error.message, type: 'error' })
      setProdutos([])
    } finally {
      setLoadingProdutos(false)
    }
  }
  
  // Carregar dados ao montar componente
  useEffect(() => {
    fetchCategorias()
    fetchUnidades()
    fetchProdutos()
  }, [])
  
  // Validar formulário
  const NCM_REGEX = /^\d{8}$/
  
  const validateForm = (): boolean => {
    if (!formData.nome.trim()) {
      setToast({ message: 'Nome do produto é obrigatório', type: 'error' })
      return false
    }
    
    if (!formData.codigo_interno.trim()) {
      setToast({ message: 'Código interno é obrigatório', type: 'error' })
      return false
    }
    
    if (!formData.ncm.trim()) {
      setToast({ message: 'NCM é obrigatório', type: 'error' })
      return false
    }
    
    if (formData.ncm.length !== 8 || !NCM_REGEX.test(formData.ncm)) {
      setToast({ message: 'NCM deve conter exatamente 8 dígitos numéricos', type: 'error' })
      return false
    }
    
    const precoVenda = parseFloat(formData.preco_venda)
    const precoCusto = parseFloat(formData.preco_custo)
    
    if (isNaN(precoVenda) || precoVenda < 0) {
      setToast({ message: 'Preço de venda inválido', type: 'error' })
      return false
    }
    
    if (isNaN(precoCusto) || precoCusto < 0) {
      setToast({ message: 'Preço de custo inválido', type: 'error' })
      return false
    }
    
    const estoque = parseInt(formData.estoque_atual)
    if (isNaN(estoque) || estoque < 0) {
      setToast({ message: 'Estoque inválido', type: 'error' })
      return false
    }
    
    return true
  }
  
  // Salvar produto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    if (!isSupabaseConfigured) {
      setToast({ message: 'Supabase não configurado', type: 'error' })
      return
    }
    
    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const produtoData = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
        codigo_interno: formData.codigo_interno.trim(),
        codigo_barras: formData.codigo_barras.trim() || null,
        categoria_id: formData.categoria_id || null,
        unidade_medida: formData.unidade_medida,
        ncm: formData.ncm.trim(),
        cest: formData.cest.trim() || null,
        cfop_entrada: formData.cfop_entrada || null,
        cfop_saida: formData.cfop_saida || null,
        origem_mercadoria: parseInt(formData.origem_mercadoria),
        cst_icms: formData.cst_icms || null,
        csosn_icms: formData.csosn_icms || null,
        aliquota_icms: parseFloat(formData.aliquota_icms),
        reducao_base_icms: parseFloat(formData.reducao_base_icms),
        cst_pis: formData.cst_pis || null,
        aliquota_pis: parseFloat(formData.aliquota_pis),
        cst_cofins: formData.cst_cofins || null,
        aliquota_cofins: parseFloat(formData.aliquota_cofins),
        cst_ipi: formData.cst_ipi || null,
        aliquota_ipi: parseFloat(formData.aliquota_ipi),
        codigo_enquadramento_ipi: formData.codigo_enquadramento_ipi,
        tem_substituicao_tributaria: formData.tem_substituicao_tributaria,
        mva_st: parseFloat(formData.mva_st),
        aliquota_icms_st: parseFloat(formData.aliquota_icms_st),
        reducao_base_icms_st: parseFloat(formData.reducao_base_icms_st),
        aliquota_aproximada_tributos: parseFloat(formData.aliquota_aproximada_tributos),
        informacoes_adicionais_fiscais: formData.informacoes_adicionais_fiscais.trim() || null,
        preco_custo: parseFloat(formData.preco_custo),
        preco_venda: parseFloat(formData.preco_venda),
        permite_desconto: formData.permite_desconto,
        desconto_maximo: parseFloat(formData.desconto_maximo),
        estoque_atual: parseInt(formData.estoque_atual),
        estoque_minimo: parseInt(formData.estoque_minimo),
        estoque_maximo: parseInt(formData.estoque_maximo),
        localizacao: formData.localizacao.trim() || null,
        controla_lote: formData.controla_lote,
        controla_serie: formData.controla_serie,
        controla_validade: formData.controla_validade,
        dias_validade: formData.dias_validade ? parseInt(formData.dias_validade, 10) : null,
        status: formData.status,
        observacoes: formData.observacoes.trim() || null
      }
      
      if (editingProduto) {
        // Atualizar produto existente
        const { error } = await supabase
          .from('produtos')
          .update({ ...produtoData, updated_by: user?.id })
          .eq('id', editingProduto.id)
        
        if (error) throw error
        setToast({ message: 'Produto atualizado com sucesso!', type: 'success' })
      } else {
        // Criar novo produto
        const { error } = await supabase
          .from('produtos')
          .insert({ ...produtoData, created_by: user?.id })
        
        if (error) throw error
        setToast({ message: 'Produto cadastrado com sucesso!', type: 'success' })
      }
      
      // Atualizar lista
      fetchProdutos()
      handleCloseModal()
    } catch (error: any) {
      setToast({ message: 'Erro ao salvar produto: ' + error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }
  
  // Deletar produto
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    if (!isSupabaseConfigured) {
      setToast({ message: 'Supabase não configurado', type: 'error' })
      return
    }
    
    try {
      setLoading(true)
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      setToast({ message: 'Produto excluído com sucesso!', type: 'success' })
      fetchProdutos()
    } catch (error: any) {
      setToast({ message: 'Erro ao excluir produto: ' + error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }
  
  // Abrir modal para edição
  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto)
    setFormData({
      nome: produto.nome,
      descricao: produto.descricao || '',
      codigo_interno: produto.codigo_interno,
      codigo_barras: produto.codigo_barras || '',
      categoria_id: produto.categoria_id || '',
      unidade_medida: produto.unidade_medida,
      ncm: produto.ncm,
      cest: produto.cest || '',
      cfop_entrada: produto.cfop_entrada || '',
      cfop_saida: produto.cfop_saida || '',
      origem_mercadoria: produto.origem_mercadoria.toString(),
      cst_icms: produto.cst_icms || '',
      csosn_icms: produto.csosn_icms || '',
      aliquota_icms: produto.aliquota_icms.toString(),
      reducao_base_icms: produto.reducao_base_icms.toString(),
      cst_pis: produto.cst_pis || '',
      aliquota_pis: produto.aliquota_pis.toString(),
      cst_cofins: produto.cst_cofins || '',
      aliquota_cofins: produto.aliquota_cofins.toString(),
      cst_ipi: produto.cst_ipi || '',
      aliquota_ipi: produto.aliquota_ipi.toString(),
      codigo_enquadramento_ipi: produto.codigo_enquadramento_ipi,
      tem_substituicao_tributaria: produto.tem_substituicao_tributaria,
      mva_st: produto.mva_st.toString(),
      aliquota_icms_st: produto.aliquota_icms_st.toString(),
      reducao_base_icms_st: produto.reducao_base_icms_st.toString(),
      aliquota_aproximada_tributos: produto.aliquota_aproximada_tributos.toString(),
      informacoes_adicionais_fiscais: produto.informacoes_adicionais_fiscais || '',
      preco_custo: produto.preco_custo.toString(),
      preco_venda: produto.preco_venda.toString(),
      permite_desconto: produto.permite_desconto,
      desconto_maximo: produto.desconto_maximo.toString(),
      estoque_atual: produto.estoque_atual.toString(),
      estoque_minimo: produto.estoque_minimo.toString(),
      estoque_maximo: produto.estoque_maximo.toString(),
      localizacao: produto.localizacao || '',
      controla_lote: produto.controla_lote,
      controla_serie: produto.controla_serie,
      controla_validade: produto.controla_validade,
      dias_validade: produto.dias_validade?.toString() || '',
      status: produto.status,
      observacoes: produto.observacoes || ''
    })
    setShowModal(true)
  }
  
  // Fechar modal e resetar form
  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProduto(null)
    setFormData(initialFormData)
    setActiveTab('geral')
  }
  
  // Filtrar produtos
  const filteredProdutos = produtos.filter(produto => {
    const matchSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        produto.codigo_interno.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        produto.ncm.includes(searchTerm)
    
    const matchStatus = filterStatus === 'all' || produto.status === filterStatus
    const matchCategoria = filterCategoria === 'all' || produto.categoria_id === filterCategoria
    
    return matchSearch && matchStatus && matchCategoria
  })
  
  // Gerar template Excel
  const downloadTemplate = () => {
    const template = [
      {
        'Nome *': 'Exemplo Produto',
        'Descrição': 'Descrição do produto',
        'Código Interno *': 'PROD001',
        'Código Barras (EAN)': '7891234567890',
        'Categoria': 'Eletrônicos',
        'Unidade': 'UN',
        'NCM *': '84713012',
        'CEST': '0100100',
        'CFOP Entrada': '1102',
        'CFOP Saída': '5102',
        'Origem': '0',
        'CST ICMS': '00',
        'CSOSN ICMS': '',
        'Alíquota ICMS %': '18',
        'CST PIS': '01',
        'Alíquota PIS %': '1.65',
        'CST COFINS': '01',
        'Alíquota COFINS %': '7.6',
        'Preço Custo': '100.00',
        'Preço Venda': '150.00',
        'Estoque Atual': '10',
        'Estoque Mínimo': '5',
        'Estoque Máximo': '100',
        'Status': 'Ativo'
      }
    ]
    
    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos')
    XLSX.writeFile(wb, 'template_produtos.xlsx')
  }
  
  // Importar Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet)
        
        let success = 0
        const errors: string[] = []
        
        // Preparar dados para inserção em lote
        const produtosToInsert: any[] = []
        
        for (let i = 0; i < (jsonData as any[]).length; i++) {
          const row = (jsonData as any[])[i]
          try {
            // Validações básicas
            if (!row['Nome *'] || !row['Código Interno *'] || !row['NCM *']) {
              errors.push(`Linha ${i + 2}: Campos obrigatórios faltando`)
              continue
            }
            
            // Buscar categoria
            let categoria_id = null
            if (row['Categoria']) {
              const categoria = categorias.find(c => c.nome === row['Categoria'])
              if (categoria) categoria_id = categoria.id
            }
            
            produtosToInsert.push({
              nome: row['Nome *'],
              descricao: row['Descrição'] || null,
              codigo_interno: row['Código Interno *'],
              codigo_barras: row['Código Barras (EAN)'] || null,
              categoria_id,
              unidade_medida: row['Unidade'] || 'UN',
              ncm: row['NCM *'],
              cest: row['CEST'] || null,
              cfop_entrada: row['CFOP Entrada'] || null,
              cfop_saida: row['CFOP Saída'] || null,
              origem_mercadoria: parseInt(row['Origem'] || '0', 10),
              cst_icms: row['CST ICMS'] || null,
              csosn_icms: row['CSOSN ICMS'] || null,
              aliquota_icms: parseFloat(row['Alíquota ICMS %'] || '0'),
              cst_pis: row['CST PIS'] || null,
              aliquota_pis: parseFloat(row['Alíquota PIS %'] || '0'),
              cst_cofins: row['CST COFINS'] || null,
              aliquota_cofins: parseFloat(row['Alíquota COFINS %'] || '0'),
              preco_custo: parseFloat(row['Preço Custo'] || '0'),
              preco_venda: parseFloat(row['Preço Venda'] || '0'),
              estoque_atual: parseInt(row['Estoque Atual'] || '0', 10),
              estoque_minimo: parseInt(row['Estoque Mínimo'] || '0', 10),
              estoque_maximo: parseInt(row['Estoque Máximo'] || '0', 10),
              status: row['Status'] === 'Inativo' ? 'Inativo' : 'Ativo'
            })
          } catch (error: any) {
            errors.push(`Linha ${i + 2}: ${error.message}`)
          }
        }
        
        // Inserir em lote
        if (produtosToInsert.length > 0) {
          try {
            const { data, error } = await supabase
              .from('produtos')
              .insert(produtosToInsert)
              .select()
            
            if (error) throw error
            success = data?.length || 0
          } catch (error: any) {
            errors.push(`Erro ao inserir produtos: ${error.message}`)
          }
        }
        
        setImportResult({ success, errors })
        setShowImportModal(true)
        fetchProdutos()
      } catch (error: any) {
        setToast({ message: 'Erro ao processar arquivo: ' + error.message, type: 'error' })
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Cabeçalho */}
      <div className="bg-white shadow rounded-lg mb-4 sm:mb-6">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Produtos
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredProdutos.length} {filteredProdutos.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-slate-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Baixar Modelo</span>
                <span className="sm:hidden">Modelo</span>
              </button>
              
              <label className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-slate-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 cursor-pointer">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span className="hidden sm:inline">Importar Excel</span>
                <span className="sm:hidden">Importar</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                  disabled={loading}
                />
              </label>
              
              <button
                onClick={() => {
                  setEditingProduto(null)
                  setFormData(initialFormData)
                  setShowModal(true)
                }}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Adicionar Produto</span>
                <span className="sm:hidden">Adicionar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filtros e Busca */}
      <div className="bg-white shadow rounded-lg mb-4 sm:mb-6 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, código ou NCM..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="all">Todos</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="all">Todas</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Tabela de Produtos */}
      {loadingProdutos ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando produtos...</p>
        </div>
      ) : filteredProdutos.length === 0 ? (
        <div className="bg-white shadow rounded-lg">
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              Nenhum produto cadastrado
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Clique em "Adicionar Produto" para começar
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    NCM
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Preço Venda
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProdutos.map((produto) => (
                  <tr key={produto.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {produto.codigo_interno}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{produto.nome}</div>
                      <div className="text-sm text-gray-500">{produto.unidade_medida}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {produto.categorias_produtos?.nome || '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {produto.ncm}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {produto.preco_venda.toFixed(2)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">{produto.estoque_atual}</span>
                        {produto.estoque_atual < produto.estoque_minimo && (
                          <span title="Estoque baixo">
                            <AlertTriangle className="w-4 h-4 ml-2 text-red-500" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        produto.status === 'Ativo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {produto.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleEdit(produto)}
                        className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(produto.id)}
                        className="text-red-600 hover:text-red-900 font-medium transition-colors"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50 rounded-t-lg flex-shrink-0">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                {editingProduto ? 'Editar Produto' : 'Adicionar Produto'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 px-4 sm:px-6 flex-shrink-0">
              <div className="flex space-x-4 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('geral')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'geral'
                      ? 'border-slate-700 text-slate-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Dados Gerais
                </button>
                <button
                  onClick={() => setActiveTab('fiscal')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'fiscal'
                      ? 'border-slate-700 text-slate-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Dados Fiscais
                </button>
                <button
                  onClick={() => setActiveTab('comercial')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'comercial'
                      ? 'border-slate-700 text-slate-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Dados Comerciais
                </button>
                <button
                  onClick={() => setActiveTab('estoque')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'estoque'
                      ? 'border-slate-700 text-slate-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Estoque
                </button>
              </div>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              {/* Tab: Dados Gerais */}
              {activeTab === 'geral' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Produto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código Interno <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.codigo_interno}
                      onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código de Barras (EAN)
                    </label>
                    <input
                      type="text"
                      value={formData.codigo_barras}
                      onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria
                    </label>
                    <select
                      value={formData.categoria_id}
                      onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Selecione...</option>
                      {categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nome}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidade de Medida
                    </label>
                    <select
                      value={formData.unidade_medida}
                      onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      {unidades.map(un => (
                        <option key={un.id} value={un.sigla}>{un.sigla} - {un.descricao}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Tab: Dados Fiscais */}
              {activeTab === 'fiscal' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NCM <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.ncm}
                      onChange={(e) => setFormData({ ...formData, ncm: e.target.value.replace(/\D/g, '') })}
                      maxLength={8}
                      placeholder="12345678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">8 dígitos numéricos</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEST
                    </label>
                    <input
                      type="text"
                      value={formData.cest}
                      onChange={(e) => setFormData({ ...formData, cest: e.target.value.replace(/\D/g, '') })}
                      maxLength={7}
                      placeholder="0100100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CFOP Entrada
                    </label>
                    <select
                      value={formData.cfop_entrada}
                      onChange={(e) => setFormData({ ...formData, cfop_entrada: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Selecione...</option>
                      {CFOP_OPTIONS.filter(c => c.value.startsWith('1')).map(cfop => (
                        <option key={cfop.value} value={cfop.value}>{cfop.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CFOP Saída
                    </label>
                    <select
                      value={formData.cfop_saida}
                      onChange={(e) => setFormData({ ...formData, cfop_saida: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Selecione...</option>
                      {CFOP_OPTIONS.filter(c => c.value.startsWith('5')).map(cfop => (
                        <option key={cfop.value} value={cfop.value}>{cfop.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Origem da Mercadoria
                    </label>
                    <select
                      value={formData.origem_mercadoria}
                      onChange={(e) => setFormData({ ...formData, origem_mercadoria: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      {ORIGENS_MERCADORIA.map(origem => (
                        <option key={origem.value} value={origem.value}>{origem.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CST ICMS (Regime Normal)
                    </label>
                    <select
                      value={formData.cst_icms}
                      onChange={(e) => setFormData({ ...formData, cst_icms: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Selecione...</option>
                      {CST_ICMS_OPTIONS.map(cst => (
                        <option key={cst.value} value={cst.value}>{cst.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CSOSN ICMS (Simples Nacional)
                    </label>
                    <select
                      value={formData.csosn_icms}
                      onChange={(e) => setFormData({ ...formData, csosn_icms: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Selecione...</option>
                      {CSOSN_ICMS_OPTIONS.map(csosn => (
                        <option key={csosn.value} value={csosn.value}>{csosn.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alíquota ICMS (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.aliquota_icms}
                      onChange={(e) => setFormData({ ...formData, aliquota_icms: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CST PIS
                    </label>
                    <select
                      value={formData.cst_pis}
                      onChange={(e) => setFormData({ ...formData, cst_pis: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Selecione...</option>
                      {CST_PIS_COFINS_OPTIONS.map(cst => (
                        <option key={cst.value} value={cst.value}>{cst.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alíquota PIS (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.aliquota_pis}
                      onChange={(e) => setFormData({ ...formData, aliquota_pis: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CST COFINS
                    </label>
                    <select
                      value={formData.cst_cofins}
                      onChange={(e) => setFormData({ ...formData, cst_cofins: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Selecione...</option>
                      {CST_PIS_COFINS_OPTIONS.map(cst => (
                        <option key={cst.value} value={cst.value}>{cst.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alíquota COFINS (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.aliquota_cofins}
                      onChange={(e) => setFormData({ ...formData, aliquota_cofins: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.tem_substituicao_tributaria}
                        onChange={(e) => setFormData({ ...formData, tem_substituicao_tributaria: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Produto sujeito a Substituição Tributária (ST)
                      </span>
                    </label>
                  </div>
                  
                  {formData.tem_substituicao_tributaria && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          MVA ST (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.mva_st}
                          onChange={(e) => setFormData({ ...formData, mva_st: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alíquota ICMS ST (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={formData.aliquota_icms_st}
                          onChange={(e) => setFormData({ ...formData, aliquota_icms_st: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tab: Dados Comerciais */}
              {activeTab === 'comercial' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço de Custo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.preco_custo}
                      onChange={(e) => setFormData({ ...formData, preco_custo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço de Venda (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.preco_venda}
                      onChange={(e) => setFormData({ ...formData, preco_venda: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.permite_desconto}
                        onChange={(e) => setFormData({ ...formData, permite_desconto: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Permite desconto
                      </span>
                    </label>
                  </div>
                  
                  {formData.permite_desconto && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Desconto Máximo (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.desconto_maximo}
                        onChange={(e) => setFormData({ ...formData, desconto_maximo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                  )}
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações
                    </label>
                    <textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                </div>
              )}

              {/* Tab: Estoque */}
              {activeTab === 'estoque' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque Atual
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.estoque_atual}
                      onChange={(e) => setFormData({ ...formData, estoque_atual: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque Mínimo
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.estoque_minimo}
                      onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque Máximo
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.estoque_maximo}
                      onChange={(e) => setFormData({ ...formData, estoque_maximo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Localização no Estoque
                    </label>
                    <input
                      type="text"
                      value={formData.localizacao}
                      onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                      placeholder="Ex: Corredor A, Prateleira 3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.controla_lote}
                        onChange={(e) => setFormData({ ...formData, controla_lote: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Controlar por lote
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.controla_serie}
                        onChange={(e) => setFormData({ ...formData, controla_serie: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Controlar por número de série
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.controla_validade}
                        onChange={(e) => setFormData({ ...formData, controla_validade: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Controlar validade
                      </span>
                    </label>
                  </div>
                  
                  {formData.controla_validade && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dias de Validade
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.dias_validade}
                        onChange={(e) => setFormData({ ...formData, dias_validade: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg flex-shrink-0">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : editingProduto ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Resultado de Importação */}
      {showImportModal && importResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                Resultado da Importação
              </h2>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportResult(null)
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1">
              {/* Cards de Estatísticas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-xs sm:text-sm text-green-700 mb-1 font-medium">
                    Importados com Sucesso
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-green-900">
                    {importResult.success}
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-xs sm:text-sm text-red-700 mb-1 font-medium">
                    Erros Encontrados
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-red-900">
                    {importResult.errors.length}
                  </div>
                </div>
              </div>

              {/* Lista de Erros */}
              {importResult.errors.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Erros:</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <ul className="list-disc list-inside space-y-1">
                      {importResult.errors.map((error, index) => (
                        <li key={index} className="text-sm text-red-800">{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-gray-200 flex justify-end rounded-b-lg">
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportResult(null)
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-800 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
