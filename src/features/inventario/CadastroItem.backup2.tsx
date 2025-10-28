import React, { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { SelectWithManagement } from '../../shared/components/SelectWithManagement'
import { Package, Plus, Search, Edit, Trash2, FileUp, Grid3X3, FileText, Tag, DollarSign, Hash } from 'lucide-react'
import * as XLSX from 'xlsx'

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
}

interface FormData {
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
}

export const CadastroItem: React.FC = () => {
  const [itens, setItens] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingItens, setLoadingItens] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const [showImportModal, setShowImportModal] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    codigo: '',
    item: '',
    modelo: '',
    categoria: '',
    numero_serie: '',
    detalhes: '',
    nota_fiscal: '',
    fornecedor: '',
    setor: '',
    status: 'Disponível',
    valor: 0
  })

  // Estados para categorias e setores dinâmicos (iniciando vazios)
  const [categorias, setCategorias] = useState<string[]>([])
  const [setores, setSetores] = useState<string[]>([])

  // Estados para importação
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])

  // Buscar categorias do banco
  const fetchCategorias = async () => {
    if (!isSupabaseConfigured) {
      setCategorias([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('categorias_itens')
        .select('nome')
        .eq('ativo', true)
        .order('nome')

      if (error) throw error
      setCategorias((data || []).map(item => item.nome))
    } catch (error: any) {
      console.error('Erro ao buscar categorias:', error)
      setCategorias([])
    }
  }

  // Buscar setores do banco
  const fetchSetores = async () => {
    if (!isSupabaseConfigured) {
      setSetores([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('setores')
        .select('nome')
        .eq('ativo', true)
        .order('nome')

      if (error) throw error
      setSetores((data || []).map(item => item.nome))
    } catch (error: any) {
      console.error('Erro ao buscar setores:', error)
      setSetores([
      'TI',
      'RH',
      'Operacional',
      'Comercial',
      'Logística',
      'Outros'
    ]
  })

  const statusOptions = [
    'Ativo',
    'Inativo',
    'Em Manutenção',
    'Em Uso',
    'Disponível',
    'Descartado',
  ]

  // Funções para atualizar categorias e setores
  const updateCategorias = (newCategorias: string[]) => {
    setCategorias(newCategorias)
    localStorage.setItem('categorias-inventario', JSON.stringify(newCategorias))
  }

  const updateSetores = (newSetores: string[]) => {
    setSetores(newSetores)
    localStorage.setItem('setores-inventario', JSON.stringify(newSetores))
  }

  // Funções para redimensionamento de colunas
  const saveColumnWidths = (widths: typeof columnWidths) => {
    localStorage.setItem('inventario-column-widths', JSON.stringify(widths))
  }

  const handleMouseDown = (columnKey: string, e: React.MouseEvent) => {
    e.preventDefault()
    
    const startX = e.pageX
    const startWidth = columnWidths[columnKey as keyof typeof columnWidths]
    
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(50, startWidth + (e.pageX - startX))
      const newWidths = { ...columnWidths, [columnKey]: newWidth }
      setColumnWidths(newWidths)
    }
    
    const handleMouseUp = () => {
      // Salvar as larguras finais quando terminar o drag
      const finalWidths = { ...columnWidths }
      setTimeout(() => {
        saveColumnWidths(finalWidths)
      }, 100) // Pequeno delay para garantir que o estado foi atualizado
      
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  useEffect(() => {
    fetchItens()
  }, [])

  // Salvar larguras das colunas quando mudarem (removido para evitar conflitos durante drag)
  // useEffect(() => {
  //   saveColumnWidths(columnWidths)
  // }, [columnWidths])

  const fetchItens = async () => {
    if (!isSupabaseConfigured) {
      setItens([
        {
          id: '1',
          codigo: 'ITEM-001',
          item: 'Notebook Dell',
          modelo: 'Inspiron 15',
          categoria: 'Eletrônicos',
          numero_serie: 'SN123',
          detalhes: 'Notebook demo',
          nota_fiscal: 'NF-001',
          fornecedor: 'Dell',
          setor: 'TI',
          status: 'Ativo',
          valor: 3500,
          created_at: '2024-01-15',
        },
      ])
      setLoadingItens(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('itens')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setItens(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar itens:', error)
    } finally {
      setLoadingItens(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    })
  }

  const generateCode = async (): Promise<string> => {
    let attempts = 0
    const maxAttempts = 10
    
    while (attempts < maxAttempts) {
      const timestamp = Date.now().toString().slice(-6)
      const random = Math.random().toString(36).substring(2, 6).toUpperCase()
      const codigo = `ITEM-${timestamp}-${random}`
      
      // Verificar se código já existe
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('itens')
            .select('codigo')
            .eq('codigo', codigo)
            .limit(1)
          
          if (error) {
            console.warn('Erro ao verificar código:', error)
            return codigo // Em caso de erro, usar o código mesmo assim
          }
          
          // Se não encontrou nenhum registro, o código é único
          if (!data || data.length === 0) {
            return codigo
          }
        } catch (error) {
          console.warn('Erro na verificação de código:', error)
          return codigo
        }
      } else {
        // No modo demo, verificar apenas nos itens locais
        const exists = itens.some(item => item.codigo === codigo)
        if (!exists) {
          return codigo
        }
      }
      
      attempts++
      // Pequeno delay para garantir timestamp diferente
      await new Promise(resolve => setTimeout(resolve, 1))
    }
    
    // Se não conseguiu gerar código único, usar timestamp mais longo
    const fallbackCode = `ITEM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    console.warn('Usando código fallback:', fallbackCode)
    return fallbackCode
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!isSupabaseConfigured) {
      setMessage({ 
        type: 'success', 
        text: `Modo Demo: Item seria ${editingItem ? 'atualizado' : 'cadastrado'} com sucesso! Configure o Supabase para salvar de verdade.` 
      })
      setLoading(false)
      return
    }

    try {
      const codigo = formData.codigo || await generateCode()
      const itemData = {
        ...formData,
        codigo,
      }

      if (editingItem) {
        // Atualizar item existente
        const { error } = await supabase
          .from('itens')
          .update(itemData)
          .eq('id', editingItem.id)

        if (error) throw error
        setMessage({ type: 'success', text: 'Item atualizado com sucesso!' })
      } else {
        // Inserir novo item
        const { error } = await supabase
          .from('itens')
          .insert([itemData])

        if (error) throw error
        setMessage({ type: 'success', text: 'Item cadastrado com sucesso!' })
      }

      setFormData({
        codigo: '',
        item: '',
        modelo: '',
        categoria: '',
        numero_serie: '',
        detalhes: '',
        nota_fiscal: '',
        fornecedor: '',
        setor: '',
        status: '',
        valor: 0,
      });
      setEditingItem(null); // Limpar estado de edição
      
      // Recarregar lista e fechar modal após 1.5s
      await fetchItens()
      setTimeout(() => {
        setShowModal(false)
        setMessage(null)
      }, 1500)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao cadastrar item' })
    } finally {
      setLoading(false)
    }
  }

  // Funções de importação
  const downloadTemplate = () => {
    const templateData = [
      {
        codigo: 'ITEM-001',
        item: 'Notebook Dell',
        modelo: 'Inspiron 15',
        categoria: 'Eletrônicos',
        numero_serie: 'SN123456789',
        detalhes: 'Notebook para desenvolvimento',
        nota_fiscal: 'NF-001234',
        fornecedor: 'Dell',
        setor: 'TI',
        status: 'Ativo',
        valor: 3500.00
      },
      {
        codigo: 'ITEM-002',
        item: 'Cadeira Ergonômica',
        modelo: 'Executive Pro',
        categoria: 'Mobiliário',
        numero_serie: '',
        detalhes: 'Cadeira com apoio lombar',
        nota_fiscal: 'NF-001235',
        fornecedor: 'Móveis SA',
        setor: 'Administrativo',
        status: 'Ativo',
        valor: 800.00
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo_Itens')

    // Definir larguras das colunas
    const colWidths = [
      { wch: 15 }, // codigo
      { wch: 30 }, // item
      { wch: 20 }, // modelo
      { wch: 20 }, // categoria
      { wch: 20 }, // numero_serie
      { wch: 40 }, // detalhes
      { wch: 15 }, // nota_fiscal
      { wch: 20 }, // fornecedor
      { wch: 15 }, // setor
      { wch: 15 }, // status
      { wch: 12 }  // valor
    ]
    worksheet['!cols'] = colWidths

    XLSX.writeFile(workbook, 'modelo_importacao_itens.xlsx')
  }

  const processImportFile = (file: File) => {
    setImportLoading(true)
    setImportErrors([])
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = e.target?.result
        let jsonData: any[] = []

        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          jsonData = XLSX.utils.sheet_to_json(worksheet)
        } else if (file.name.endsWith('.csv')) {
          const text = data as string
          const lines = text.split('\n')
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
          jsonData = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
              const obj: any = {}
              headers.forEach((header, index) => {
                obj[header] = values[index] || ''
              })
              return obj
            })
        }

        await validateAndPreviewData(jsonData)
      } catch (error: any) {
        setImportErrors(['Erro ao processar arquivo: ' + error.message])
        setImportLoading(false)
      }
    }

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }
  }

  const validateAndPreviewData = async (data: any[]) => {
    const errors: string[] = []
    const preview: Item[] = []
    const usedCodes = new Set<string>() // Para detectar códigos duplicados na planilha
    
    // Arrays temporários para novos setores e categorias
    const newSetores = [...setores]
    const newCategorias = [...categorias]

    // Processar itens sequencialmente para evitar códigos duplicados
    for (let index = 0; index < data.length; index++) {
      const row = data[index]
      const lineNumber = index + 2 // +2 porque linha 1 é header e index começa em 0

      // Validar apenas valor numérico
      if (row.valor && isNaN(parseFloat(row.valor.toString().replace(',', '.')))) {
        errors.push(`Linha ${lineNumber}: Campo 'valor' deve ser um número`)
      }

      // Auto-criar setor se não existir
      if (row.setor && row.setor.toString().trim() !== '' && !newSetores.includes(row.setor)) {
        newSetores.push(row.setor)
      }

      // Auto-criar categoria se não existir
      if (row.categoria && row.categoria.toString().trim() !== '' && !newCategorias.includes(row.categoria)) {
        newCategorias.push(row.categoria)
      }

      // Auto-criar status se não existir (mas manter validação básica)
      if (row.status && row.status.toString().trim() !== '' && !statusOptions.includes(row.status)) {
        // Para status, vamos apenas avisar mas não bloquear
        console.warn(`Status '${row.status}' não existe nos status padrão. Item será importado mesmo assim.`)
      }

      // Gerar código único se necessário
      let codigo = row.codigo || await generateCode()
      
      // Verificar se código já foi usado na planilha
      if (row.codigo && usedCodes.has(row.codigo)) {
        console.warn(`Linha ${lineNumber}: Código '${row.codigo}' está duplicado na planilha, gerando código único automaticamente`)
        codigo = await generateCode() // Gerar um novo código único
      }
      
      usedCodes.add(codigo)

      // Criar preview do item (remover validação obrigatória de 'item')
      const itemData = {
        id: `preview-${index}`,
        codigo,
        item: row.item || '',
        modelo: row.modelo || '',
        categoria: row.categoria || '',
        numero_serie: row.numero_serie || '',
        detalhes: row.detalhes || '',
        nota_fiscal: row.nota_fiscal || '',
        fornecedor: row.fornecedor || '',
        setor: row.setor || '',
        status: row.status || '',
        valor: parseFloat(row.valor?.toString().replace(',', '.') || '0'),
        created_at: new Date().toISOString()
      }
      
      preview.push(itemData)
    }

    // Atualizar arrays de setores e categorias se houver novos
    if (newSetores.length > setores.length) {
      updateSetores(newSetores.sort())
    }
    if (newCategorias.length > categorias.length) {
      updateCategorias(newCategorias.sort())
    }

    setImportErrors(errors)
    setImportPreview(preview)
    setImportLoading(false)
  }

  const executeImport = async () => {
    if (importErrors.length > 0) {
      setMessage({ type: 'error', text: 'Corrija os erros antes de importar' })
      return
    }

    setImportLoading(true)

    if (!isSupabaseConfigured) {
      setMessage({ 
        type: 'success', 
        text: `Modo Demo: ${importPreview.length} itens seriam importados com sucesso! Configure o Supabase para salvar de verdade.` 
      })
      setImportLoading(false)
      setTimeout(() => {
        setShowImportModal(false)
        setImportFile(null)
        setImportPreview([])
        setMessage(null)
      }, 2000)
      return
    }

    try {
      const itemsToInsert = importPreview.map(item => ({
        codigo: item.codigo,
        item: item.item,
        modelo: item.modelo,
        categoria: item.categoria,
        numero_serie: item.numero_serie,
        detalhes: item.detalhes,
        nota_fiscal: item.nota_fiscal,
        fornecedor: item.fornecedor,
        setor: item.setor,
        status: item.status,
        valor: item.valor
      }))

      const { error } = await supabase
        .from('itens')
        .insert(itemsToInsert)

      if (error) {
        throw error
      }

      setMessage({ type: 'success', text: `${importPreview.length} itens importados com sucesso!` })
      
      // Recarregar lista e fechar modal após 1.5s
      await fetchItens()
      setTimeout(() => {
        setShowImportModal(false)
        setImportFile(null)
        setImportPreview([])
        setMessage(null)
      }, 1500)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao importar itens' })
    } finally {
      setImportLoading(false)
    }
  }

  const filteredItens = itens.filter((item) =>
    item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.fornecedor.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Ativo': 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
      'Inativo': 'bg-gradient-to-r from-slate-500 to-slate-600 text-white',
      'Em Manutenção': 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
      'Em Uso': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
      'Disponível': 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
      'Descartado': 'bg-gradient-to-r from-red-500 to-red-600 text-white',
      'Danificado': 'bg-gradient-to-r from-red-600 to-red-700 text-white',
      'Em Avaliação': 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white',
    }
    return colors[status] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
  }

  // Função para editar item
  const handleEditItem = (item: Item) => {
    setEditingItem(item)
    setFormData({
      codigo: item.codigo,
      item: item.item,
      modelo: item.modelo || '',
      categoria: item.categoria || '',
      numero_serie: item.numero_serie || '',
      detalhes: item.detalhes || '',
      nota_fiscal: item.nota_fiscal || '',
      fornecedor: item.fornecedor || '',
      setor: item.setor,
      status: item.status,
      valor: item.valor,
    })
    setShowModal(true)
  }

  // Função para excluir item
  const handleDeleteItem = (item: Item) => {
    setItemToDelete(item)
    setShowDeleteModal(true)
  }

  // Função para confirmar exclusão
  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('itens')
        .delete()
        .eq('id', itemToDelete.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Item excluído com sucesso!' })
      await fetchItens()
      setShowDeleteModal(false)
      setItemToDelete(null)
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao excluir item' })
    } finally {
      setLoading(false)
    }
  }

  // Função para cancelar exclusão
  const cancelDelete = () => {
    setShowDeleteModal(false)
    setItemToDelete(null)
  }

  // Função para abrir termo de responsabilidade
  const handleTermoResponsabilidade = (item: Item) => {
    setItemParaTermo(item)
    setShowTermoModal(true)
  }

  // Função para fechar termo de responsabilidade
  const handleCloseTermoModal = () => {
    setShowTermoModal(false)
    setItemParaTermo(null)
  }

  if (loadingItens) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Cabeçalho com botão Adicionar */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Itens do Inventário</h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredItens.length} {filteredItens.length === 1 ? 'item cadastrado' : 'itens cadastrados'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Importar Itens
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Adicionar Item
              </button>
            </div>
          </div>
        </div>

        {/* Busca e Toggle de Visualização */}
        <div className="px-6 py-5 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between gap-6">
            {/* Campo de Busca */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por código, item, categoria ou fornecedor..."
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
            
            {/* Toggle de Visualização Premium */}
            <div className="flex items-center space-x-3">
              {/* Botão Reset Colunas */}
              {viewMode === 'list' && (
                <>
                  <button
                    onClick={() => {
                      const defaultWidths = {
                        codigo: 80,
                        item: 300,
                        modelo: 120,
                        categoria: 140,
                        setor: 160,
                        status: 120,
                        acoes: 100
                      }
                      setColumnWidths(defaultWidths)
                      saveColumnWidths(defaultWidths)
                    }}
                    className="inline-flex items-center px-3 py-2 text-xs font-medium text-gray-600 hover:text-slate-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    title="Resetar larguras das colunas"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset
                  </button>
                  
                  {/* Dica de redimensionamento */}
                  <div className="inline-flex items-center px-3 py-1 text-xs text-gray-500 bg-gray-50 rounded-lg border">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                    Arraste as bordas das colunas para redimensionar
                  </div>
                </>
              )}
              
              <div className="flex bg-gray-100 rounded-xl p-1.5 shadow-inner">
                <button
                  onClick={() => {
                    setViewMode('list')
                    localStorage.setItem('inventario-view-mode', 'list')
                  }}
                  className={`inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white text-slate-800 shadow-lg transform scale-105 ring-1 ring-slate-200'
                      : 'text-gray-600 hover:text-slate-800 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Lista
                </button>
                <button
                  onClick={() => {
                    setViewMode('cards')
                    localStorage.setItem('inventario-view-mode', 'cards')
                  }}
                  className={`inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    viewMode === 'cards'
                      ? 'bg-white text-slate-800 shadow-lg transform scale-105 ring-1 ring-slate-200'
                      : 'text-gray-600 hover:text-slate-800 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Cards
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo baseado no modo de visualização */}
      {viewMode === 'list' ? (
        /* Visualização em Lista */
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table ref={tableRef} className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th 
                  className="px-1 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 relative select-none"
                  style={{ width: `${columnWidths.codigo}px` }}
                >
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <span>Código</span>
                  </div>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400 hover:w-3 transition-all duration-200 opacity-0 hover:opacity-100"
                    onMouseDown={(e) => handleMouseDown('codigo', e)}
                    title="Arraste para redimensionar coluna"
                  />
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 relative select-none"
                  style={{ width: `${columnWidths.categoria}px` }}
                >
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Categoria</span>
                  </div>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400 hover:w-3 transition-all duration-200 opacity-0 hover:opacity-100"
                    onMouseDown={(e) => handleMouseDown('categoria', e)}
                    title="Arraste para redimensionar coluna"
                  />
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 relative select-none"
                  style={{ width: `${columnWidths.item}px` }}
                >
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span>Item</span>
                  </div>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400 hover:w-3 transition-all duration-200 opacity-0 hover:opacity-100"
                    onMouseDown={(e) => handleMouseDown('item', e)}
                    title="Arraste para redimensionar coluna"
                  />
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 relative select-none"
                  style={{ width: `${columnWidths.modelo}px` }}
                >
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>Modelo</span>
                  </div>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400 hover:w-3 transition-all duration-200 opacity-0 hover:opacity-100"
                    onMouseDown={(e) => handleMouseDown('modelo', e)}
                    title="Arraste para redimensionar coluna"
                  />
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 relative select-none"
                  style={{ width: `${columnWidths.setor}px` }}
                >
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Setor</span>
                  </div>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400 hover:w-3 transition-all duration-200 opacity-0 hover:opacity-100"
                    onMouseDown={(e) => handleMouseDown('setor', e)}
                    title="Arraste para redimensionar coluna"
                  />
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 relative select-none"
                  style={{ width: `${columnWidths.status}px` }}
                >
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Status</span>
                  </div>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400 hover:w-3 transition-all duration-200 opacity-0 hover:opacity-100"
                    onMouseDown={(e) => handleMouseDown('status', e)}
                    title="Arraste para redimensionar coluna"
                  />
                </th>
                <th 
                  className="px-1 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200"
                  style={{ width: `${columnWidths.acoes}px` }}
                >
                  <span>Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItens.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-full p-8">
                        <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">Nenhum item encontrado</h3>
                        <p className="text-gray-600 max-w-md">Comece criando seu primeiro item de inventário para ver seus dados organizados aqui.</p>
                      </div>
                      <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-base font-medium rounded-xl text-white bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transform hover:scale-105 transition-all duration-200"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Criar Primeiro Item
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItens.map((item, index) => (
                  <tr key={item.id} className={`group transition-all duration-200 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-1 py-3 whitespace-nowrap" style={{ width: `${columnWidths.codigo}px` }}>
                      <div className="flex items-center justify-center">
                        <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 group-hover:bg-gray-200 transition-colors duration-200">
                          {item.codigo}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 group-hover:text-gray-900 transition-colors duration-200" style={{ width: `${columnWidths.categoria}px` }}>
                      {item.categoria ? (item.categoria.length > 12 ? `${item.categoria.substring(0, 12)}...` : item.categoria) : <span className="text-gray-400 italic">-</span>}
                    </td>
                    <td className="px-4 py-3" style={{ width: `${columnWidths.item}px` }}>
                      <div className="flex items-center">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-gray-900 group-hover:text-slate-800 transition-colors duration-200 truncate" title={item.item}>
                            {item.item ? (item.item.length > 50 ? `${item.item.substring(0, 50)}...` : item.item) : 'Item sem nome'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 group-hover:text-gray-900 transition-colors duration-200" style={{ width: `${columnWidths.modelo}px` }}>
                      {item.modelo ? (item.modelo.length > 15 ? `${item.modelo.substring(0, 15)}...` : item.modelo) : <span className="text-gray-400 italic">-</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 group-hover:text-gray-900 transition-colors duration-200" style={{ width: `${columnWidths.setor}px` }}>
                      <div className="overflow-hidden" title={item.setor}>
                        <span className="block truncate">{item.setor}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ width: `${columnWidths.status}px` }}>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)} shadow-sm hover:shadow-md transition-shadow duration-200`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-white mr-1 opacity-75"></div>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-1 py-3 whitespace-nowrap text-center" style={{ width: `${columnWidths.acoes}px` }}>
                      <div className="flex items-center justify-center space-x-0.5 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                          className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-all duration-200 transform hover:scale-110" 
                          title="Emitir Termo de Responsabilidade"
                          onClick={() => handleTermoResponsabilidade(item)}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button 
                          className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all duration-200 transform hover:scale-110" 
                          title="Editar"
                          onClick={() => handleEditItem(item)}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button 
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200 transform hover:scale-110" 
                          title="Excluir"
                          onClick={() => handleDeleteItem(item)}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        /* Visualização em Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredItens.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-full p-6 mb-6">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Nenhum item encontrado</h3>
              <p className="text-gray-600 mb-8 max-w-md">Comece criando seu primeiro item de inventário para ver seus dados organizados aqui.</p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-base font-medium rounded-xl text-white bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transform hover:scale-105 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Criar Primeiro Item
              </button>
            </div>
          ) : (
            filteredItens.map((item) => (
              <div key={item.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 overflow-hidden transform hover:-translate-y-1">
                {/* Header do Card */}
                <div className="relative p-6 bg-gradient-to-br from-gray-50 to-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 pr-3">
                      <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2 line-clamp-2" title={item.item}>
                        {item.item || 'Item sem nome'}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          {item.codigo}
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(item.status)} shadow-sm`}>
                      <div className="w-2 h-2 rounded-full bg-current mr-1.5 opacity-75"></div>
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="px-6 pb-6 space-y-4">
                  {item.categoria && (
                    <div className="flex items-center text-sm group/item">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.categoria}</p>
                      </div>
                    </div>
                  )}

                  {item.modelo && (
                    <div className="flex items-center text-sm group/item">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.modelo}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center text-sm group/item">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Setor</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.setor}</p>
                    </div>
                  </div>

                  {item.fornecedor && (
                    <div className="flex items-center text-sm group/item">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.fornecedor}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer do Card */}
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-2xl font-bold text-gray-900">
                        R$ {Math.floor(item.valor).toLocaleString('pt-BR')}
                      </span>
                      <span className="text-sm text-gray-500">
                        ,{(item.valor % 1).toFixed(2).slice(2)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200" 
                        title="Emitir Termo de Responsabilidade"
                        onClick={() => handleTermoResponsabilidade(item)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors duration-200" 
                        title="Editar"
                        onClick={() => handleEditItem(item)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200" 
                        title="Excluir"
                        onClick={() => handleDeleteItem(item)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de Cadastro */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingItem ? 'Editar Item' : 'Adicionar Novo Item'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">Preencha os dados do item do inventário</p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingItem(null)
                  setMessage(null)
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {message && (
                <div className={`p-4 rounded-md ${
                  message.type === 'success' 
                    ? 'bg-green-100 text-green-700 border border-green-400' 
                    : 'bg-red-100 text-red-700 border border-red-400'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Grid principal com 3 colunas */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Código */}
            <div>
              <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">
                Código *
              </label>
              <input
                type="text"
                name="codigo"
                id="codigo"
                required
                value={formData.codigo}
                onChange={handleChange}
                placeholder="Ex: ITEM-001"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
              />
            </div>

            {/* Item */}
            <div>
              <label htmlFor="item" className="block text-sm font-medium text-gray-700">
                Item *
              </label>
              <input
                type="text"
                name="item"
                id="item"
                required
                value={formData.item}
                onChange={handleChange}
                placeholder="Nome do item"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
              />
            </div>

            {/* Modelo */}
            <div>
              <label htmlFor="modelo" className="block text-sm font-medium text-gray-700">
                Modelo
              </label>
              <input
                type="text"
                name="modelo"
                id="modelo"
                value={formData.modelo}
                onChange={handleChange}
                placeholder="Ex: XYZ-2024"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
              />
            </div>

            {/* Categoria */}
            <SelectWithManagement
              label="Categoria"
              name="categoria"
              value={formData.categoria}
              options={categorias}
              onOptionChange={updateCategorias}
              onChange={handleChange}
              placeholder="Selecione uma categoria"
            />

            {/* Número de Série */}
            <div>
              <label htmlFor="numero_serie" className="block text-sm font-medium text-gray-700">
                Número de Série
              </label>
              <input
                type="text"
                name="numero_serie"
                id="numero_serie"
                value={formData.numero_serie}
                onChange={handleChange}
                placeholder="Ex: SN123456789"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
              />
            </div>

            {/* Nota Fiscal */}
            <div>
              <label htmlFor="nota_fiscal" className="block text-sm font-medium text-gray-700">
                Nota Fiscal
              </label>
              <input
                type="text"
                name="nota_fiscal"
                id="nota_fiscal"
                value={formData.nota_fiscal}
                onChange={handleChange}
                placeholder="Ex: NF-123456"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
              />
            </div>

            {/* Fornecedor */}
            <div>
              <label htmlFor="fornecedor" className="block text-sm font-medium text-gray-700">
                Fornecedor
              </label>
              <input
                type="text"
                name="fornecedor"
                id="fornecedor"
                value={formData.fornecedor}
                onChange={handleChange}
                placeholder="Nome do fornecedor"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
              />
            </div>

            {/* Setor */}
            <SelectWithManagement
              label="Setor"
              name="setor"
              value={formData.setor}
              options={setores}
              onOptionChange={updateSetores}
              onChange={handleChange}
              placeholder="Selecione o setor"
              required={true}
            />

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status *
              </label>
              <select
                name="status"
                id="status"
                required
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="">Selecione o status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Valor */}
            <div>
              <label htmlFor="valor" className="block text-sm font-medium text-gray-700">
                Valor (R$) *
              </label>
              <input
                type="number"
                name="valor"
                id="valor"
                required
                min="0"
                step="0.01"
                value={formData.valor}
                onChange={handleChange}
                placeholder="0.00"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
          </div>

              {/* Detalhes - Campo grande separado */}
              <div>
            <label htmlFor="detalhes" className="block text-sm font-medium text-gray-700">
              Detalhes
            </label>
            <textarea
              name="detalhes"
              id="detalhes"
              rows={4}
              value={formData.detalhes}
              onChange={handleChange}
              placeholder="Informações adicionais sobre o item..."
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
            />
          </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      codigo: '',
                      item: '',
                      modelo: '',
                      categoria: '',
                      numero_serie: '',
                      detalhes: '',
                      nota_fiscal: '',
                      fornecedor: '',
                      setor: '',
                      status: '',
                      valor: 0,
                    });
                    setMessage(null)
                  }}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                  Limpar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Salvando...' : (editingItem ? 'Atualizar Item' : 'Cadastrar Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Importar Itens</h2>
                <p className="text-sm text-gray-600 mt-1">Faça upload de arquivo XLSX ou CSV com os dados dos itens</p>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportFile(null)
                  setImportPreview([])
                  setImportErrors([])
                  setMessage(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4">
              {/* Mensagem */}
              {message && (
                <div className={`mb-4 p-4 rounded-md ${
                  message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Botão para baixar modelo */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Primeiro passo: Baixe o modelo</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Baixe o arquivo modelo em Excel com os campos corretos e exemplos de preenchimento
                    </p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Baixar Modelo XLSX
                  </button>
                </div>
              </div>

              {/* Upload de arquivo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Segundo passo: Selecione o arquivo para importar
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-slate-600 hover:text-slate-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-slate-500"
                      >
                        <span>Faça upload de um arquivo</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setImportFile(file)
                              processImportFile(file)
                            }
                          }}
                        />
                      </label>
                      <p className="pl-1">ou arraste e solte</p>
                    </div>
                    <p className="text-xs text-gray-500">XLSX, XLS ou CSV até 10MB</p>
                  </div>
                </div>
                {importFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Arquivo selecionado: <span className="font-medium">{importFile.name}</span>
                  </p>
                )}
              </div>

              {/* Loading de processamento */}
              {importLoading && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Processando arquivo...</span>
                </div>
              )}

              {/* Erros de validação */}
              {importErrors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-sm font-medium text-red-900 mb-2">Erros encontrados:</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {importErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview dos dados */}
              {importPreview.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Preview dos dados ({importPreview.length} itens)
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-60">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {importPreview.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.codigo}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.item}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{item.modelo || '-'}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{item.categoria || '-'}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{item.setor}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{item.status}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de ação */}
              {importPreview.length > 0 && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false)
                      setImportFile(null)
                      setImportPreview([])
                      setImportErrors([])
                      setMessage(null)
                    }}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={executeImport}
                    disabled={importLoading || importErrors.length > 0}
                    className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importLoading ? 'Importando...' : `Importar ${importPreview.length} Itens`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar Exclusão</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Tem certeza que deseja excluir o item "<span className="font-semibold">{itemToDelete.item}</span>"?
                </p>
                <p className="text-xs text-gray-500 mb-6">
                  Esta ação não pode ser desfeita.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Termo de Responsabilidade */}
      {showTermoModal && itemParaTermo && (
        <TermoResponsabilidade
          item={itemParaTermo}
          isOpen={showTermoModal}
          onClose={handleCloseTermoModal}
        />
      )}
    </div>
  )
}