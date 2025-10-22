import React, { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { Search, Filter, Download, Package, Users, DollarSign, AlertCircle } from 'lucide-react'

interface Item {
  id: string
  codigo: string
  item: string
  modelo: string
  categoria: string
  numero_serie: string
  detalhes: string
  nota_fiscal: string
  fornecedor: string
  setor: string
  status: string
  valor: number
  created_at: string
  responsavel_id?: string | null
  colaborador?: {
    nome: string
    cpf: string
    email: string
    telefone: string
    cargo: string
    setor: string
  } | null
  empresa?: {
    razao_social: string
  } | null
}

export const RelatorioItens: React.FC = () => {
  const [itens, setItens] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSetores, setFilterSetores] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string[]>([])
  const [filterCategorias, setFilterCategorias] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const setores = [
    'Administrativo',
    'Financeiro',
    'TI',
    'RH',
    'Operacional',
    'Comercial',
    'Logística',
    'Outros',
  ]

  const statusOptions = [
    'Ativo',
    'Inativo',
    'Em Manutenção',
    'Em Uso',
    'Disponível',
    'Descartado',
  ]

  // Buscar categorias do localStorage (mesma fonte do CadastroItem)
  const categorias = (() => {
    const saved = localStorage.getItem('categorias-inventario')
    return saved ? JSON.parse(saved) : [
      'Eletrônicos',
      'Mobiliário',
      'Equipamentos',
      'Veículos',
      'Ferramentas',
      'Material de Escritório',
      'Informática',
      'Outros'
    ]
  })()

  useEffect(() => {
    fetchItens()
  }, [])

  const fetchItens = async () => {
    if (!isSupabaseConfigured) {
      // Mock data para modo demo
      setItens([
        {
          id: '1',
          codigo: 'ITEM-001',
          item: 'Notebook Dell Inspiron',
          modelo: 'Inspiron 15 3000',
          categoria: 'Informática',
          numero_serie: 'SN123456789',
          detalhes: 'Notebook para uso administrativo',
          nota_fiscal: 'NF-12345',
          fornecedor: 'Dell Inc.',
          setor: 'TI',
          status: 'Em Uso',
          valor: 3500.00,
          created_at: '2024-01-15',
          responsavel_id: '1',
          colaborador: {
            nome: 'João Silva',
            cpf: '123.456.789-00',
            email: 'joao@crescieperdi.com.br',
            telefone: '(19) 99999-9999',
            cargo: 'Desenvolvedor',
            setor: 'TI'
          },
          empresa: {
            razao_social: 'CRESCI E PERDI FRANCHISING LTDA'
          }
        },
        {
          id: '2',
          codigo: 'ITEM-002',
          item: 'Cadeira Ergonômica',
          modelo: 'Presidente Plus',
          categoria: 'Mobiliário',
          numero_serie: '',
          detalhes: 'Cadeira com ajuste de altura',
          nota_fiscal: 'NF-12346',
          fornecedor: 'Moveis Office',
          setor: 'Administrativo',
          status: 'Disponível',
          valor: 850.00,
          created_at: '2024-01-20',
          responsavel_id: null,
          colaborador: null,
          empresa: {
            razao_social: 'CRESCI E PERDI FRANCHISING LTDA'
          }
        },
        {
          id: '3',
          codigo: 'ITEM-003',
          item: 'Monitor LG 24"',
          modelo: 'LG 24MK430H',
          categoria: 'Eletrônicos',
          numero_serie: 'SN987654321',
          detalhes: 'Monitor Full HD IPS',
          nota_fiscal: 'NF-12347',
          fornecedor: 'LG Electronics',
          setor: 'TI',
          status: 'Ativo',
          valor: 650.00,
          created_at: '2024-02-01',
          responsavel_id: '2',
          colaborador: {
            nome: 'Maria Santos',
            cpf: '987.654.321-00',
            email: 'maria@crescieperdi.com.br',
            telefone: '(19) 88888-8888',
            cargo: 'Analista de Sistemas',
            setor: 'TI'
          },
          empresa: {
            razao_social: 'CRESCI E PERDI FRANCHISING LTDA'
          }
        },
      ])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('itens')
        .select(`
          *,
          colaborador:responsavel_id (
            nome,
            cpf,
            email,
            telefone,
            cargo,
            setor,
            empresas:empresa_id (
              razao_social
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Processar dados para estrutura correta
      const itensProcessados = (data || []).map(item => ({
        ...item,
        colaborador: item.colaborador ? {
          nome: item.colaborador.nome,
          cpf: item.colaborador.cpf,
          email: item.colaborador.email,
          telefone: item.colaborador.telefone,
          cargo: item.colaborador.cargo,
          setor: item.colaborador.setor
        } : null,
        empresa: item.colaborador?.empresas ? {
          razao_social: Array.isArray(item.colaborador.empresas) 
            ? item.colaborador.empresas[0]?.razao_social 
            : item.colaborador.empresas.razao_social
        } : null
      }))
      
      setItens(itensProcessados)
    } catch (error: any) {
      console.error('Erro ao carregar itens:', error)
      // Fallback para dados demo em caso de erro
      setItens([
        {
          id: '1',
          codigo: 'DEMO-001',
          item: 'Item Demo',
          modelo: 'Modelo Demo',
          categoria: 'Outros',
          numero_serie: 'SN-DEMO',
          detalhes: 'Item de demonstração',
          nota_fiscal: 'NF-DEMO',
          fornecedor: 'Fornecedor Demo',
          setor: 'TI',
          status: 'Disponível',
          valor: 1000.00,
          created_at: '2024-01-01',
          responsavel_id: null,
          colaborador: null,
          empresa: { razao_social: 'CRESCI E PERDI FRANCHISING LTDA' }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredItens = itens.filter((item) => {
    const matchSearch = 
      item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.colaborador?.nome.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (item.colaborador?.cpf.includes(searchTerm) || false) ||
      (item.colaborador?.cargo.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    
    const matchSetor = filterSetores.length === 0 || filterSetores.includes(item.setor)
    const matchStatus = filterStatus.length === 0 || filterStatus.includes(item.status)
    const matchCategoria = filterCategorias.length === 0 || filterCategorias.includes(item.categoria)

    return matchSearch && matchSetor && matchStatus && matchCategoria
  })

  const totalValor = filteredItens.reduce((sum, item) => sum + item.valor, 0)

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Ativo': 'bg-green-100 text-green-800',
      'Inativo': 'bg-gray-100 text-gray-800',
      'Em Manutenção': 'bg-yellow-100 text-yellow-800',
      'Em Uso': 'bg-blue-100 text-blue-800',
      'Disponível': 'bg-purple-100 text-purple-800',
      'Descartado': 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const exportToCSV = () => {
    const headers = ['Código', 'Item', 'Modelo', 'N° Série', 'Fornecedor', 'Setor', 'Status', 'Valor']
    const rows = filteredItens.map(item => [
      item.codigo,
      item.item,
      item.modelo,
      item.numero_serie,
      item.fornecedor,
      item.setor,
      item.status,
      item.valor.toFixed(2),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_itens_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Cabeçalho com botões */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Relatório de Inventário</h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredItens.length} {filteredItens.length === 1 ? 'item encontrado' : 'itens encontrados'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 ${
                  showFilters ? 'ring-2 ring-slate-500' : ''
                }`}
              >
                <Filter className="h-5 w-5 mr-2" />
                Filtros
              </button>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                <Download className="h-5 w-5 mr-2" />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="px-6 py-5 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between gap-6">
            {/* Campo de Busca */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por código, item, fornecedor, responsável, CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filtros Expansíveis com Checkboxes */}
        {showFilters && (
          <div className="px-6 py-5 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Filtro de Setores */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Setores ({filterSetores.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                  {setores.map((setor) => (
                    <label key={setor} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={filterSetores.includes(setor)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilterSetores([...filterSetores, setor])
                          } else {
                            setFilterSetores(filterSetores.filter(s => s !== setor))
                          }
                        }}
                        className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
                      />
                      <span className="text-sm text-gray-700">{setor}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filtro de Categorias */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Categorias ({filterCategorias.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                  {categorias.map((categoria: string) => (
                    <label key={categoria} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={filterCategorias.includes(categoria)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilterCategorias([...filterCategorias, categoria])
                          } else {
                            setFilterCategorias(filterCategorias.filter(c => c !== categoria))
                          }
                        }}
                        className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
                      />
                      <span className="text-sm text-gray-700">{categoria}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filtro de Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Status ({filterStatus.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                  {statusOptions.map((status) => (
                    <label key={status} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={filterStatus.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilterStatus([...filterStatus, status])
                          } else {
                            setFilterStatus(filterStatus.filter(s => s !== status))
                          }
                        }}
                        className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
                      />
                      <span className="text-sm text-gray-700">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Botão Limpar Filtros */}
              <div className="flex flex-col justify-end">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterSetores([])
                    setFilterCategorias([])
                    setFilterStatus([])
                  }}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Limpar Filtros
                </button>
                
                {/* Indicador de filtros ativos */}
                {(filterSetores.length > 0 || filterCategorias.length > 0 || filterStatus.length > 0) && (
                  <div className="mt-3 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {filterSetores.length + filterCategorias.length + filterStatus.length} filtro(s) ativo(s)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estatísticas Cards - Estilo Moderno */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="group bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-blue-100 hover:border-blue-200 overflow-hidden transform hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Package className="h-7 w-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total de Itens</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{filteredItens.length}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-100">
              <p className="text-xs font-medium text-gray-600">Patrimônio registrado</p>
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-green-100 hover:border-green-200 overflow-hidden transform hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0 bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-green-100">
              <p className="text-xs font-medium text-gray-600">Valor do patrimônio</p>
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-purple-50 to-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-purple-100 hover:border-purple-200 overflow-hidden transform hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Com Responsável</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {filteredItens.filter(item => item.colaborador).length}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-purple-100">
              <p className="text-xs font-medium text-gray-600">
                {filteredItens.length > 0 
                  ? `${Math.round((filteredItens.filter(item => item.colaborador).length / filteredItens.length) * 100)}% atribuídos`
                  : '0% atribuídos'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-amber-50 to-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-amber-100 hover:border-amber-200 overflow-hidden transform hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="h-7 w-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Sem Responsável</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {filteredItens.filter(item => !item.colaborador).length}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-amber-100">
              <p className="text-xs font-medium text-gray-600">
                {filteredItens.length > 0 
                  ? `${Math.round((filteredItens.filter(item => !item.colaborador).length / filteredItens.length) * 100)}% pendentes`
                  : '0% pendentes'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      {loading ? (
        <div className="bg-white shadow-lg rounded-2xl">
          <div className="px-6 py-20 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-600"></div>
              <p className="text-sm font-medium text-gray-600">Carregando itens...</p>
            </div>
          </div>
        </div>
      ) : filteredItens.length === 0 ? (
        <div className="bg-white shadow-lg rounded-2xl">
          <div className="px-6 py-20 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-full p-8">
                <Package className="mx-auto h-12 w-12 text-slate-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">Nenhum item encontrado</h3>
                <p className="text-gray-600 max-w-md">
                  Tente ajustar os filtros ou cadastre novos itens no inventário.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Visualização Desktop - Tabela */}
          <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <span>Item / Código</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Responsável</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>Setor</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Status</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Valor</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredItens.map((item, index) => (
                    <tr key={item.id} className={`hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-semibold text-gray-900">{item.item}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                            {item.codigo}
                          </span>
                          {item.modelo && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span>{item.modelo}</span>
                            </>
                          )}
                        </div>
                        {item.numero_serie && (
                          <div className="text-xs text-gray-400 mt-1">
                            S/N: {item.numero_serie}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {item.colaborador ? (
                          <div>
                            <div className="font-medium text-gray-900">{item.colaborador.nome}</div>
                            <div className="text-xs text-gray-500 mt-1">{item.colaborador.cargo}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {item.colaborador.cpf}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 italic">
                            Sem responsável
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                          {item.setor}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 inline-flex items-center text-xs leading-5 font-semibold rounded-lg shadow-sm ${getStatusColor(item.status)}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></div>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visualização Mobile - Cards */}
          <div className="md:hidden space-y-4">
            {filteredItens.map((item) => (
              <div key={item.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 overflow-hidden transform hover:-translate-y-1">
                {/* Header do Card */}
                <div className="relative p-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 pr-3">
                      <h3 className="text-base font-bold text-gray-900 leading-tight">{item.item}</h3>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                          {item.codigo}
                        </span>
                        {item.modelo && (
                          <span className="text-xs text-gray-500">{item.modelo}</span>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shadow-sm ${getStatusColor(item.status)}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></div>
                      {item.status}
                    </span>
                  </div>
                  {item.numero_serie && (
                    <div className="text-xs text-gray-400 mt-2">
                      S/N: {item.numero_serie}
                    </div>
                  )}
                </div>

                {/* Conteúdo do Card */}
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex items-center text-sm">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Responsável</p>
                      {item.colaborador ? (
                        <div>
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.colaborador.nome}</p>
                          <p className="text-xs text-gray-500">{item.colaborador.cargo}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Sem responsável</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center text-sm">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Setor</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.setor}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center text-sm">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</p>
                        <p className="text-lg font-bold text-gray-900">
                          R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
