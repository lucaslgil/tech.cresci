import React, { useState, useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import TermoResponsabilidade from './TermoResponsabilidade'
import * as XLSX from 'xlsx'
import { Toast } from '../../shared/components/Toast'


interface Anexo {
  id: string
  nome: string
  tipo: string
  tamanho: number
  url: string
  data_upload: string
  usuario_upload?: string
}

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
  anexos?: Anexo[]
  colaboradores?: {
    nome: string
    cpf?: string
    email?: string
  }
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
  
  // Estados para filtros e ordenação
  const [filters, setFilters] = useState({
    categoria: '',
    setor: '',
    status: '',
    responsavel: ''
  })
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Item | 'responsavel'
    direction: 'asc' | 'desc'
  } | null>(null)
  
  // Estados para notificações
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)
  
  // Ref para manter a posição do scroll
  const editingRowRef = useRef<string | null>(null)
  
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

  // Estados para importação
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])

  // Estados para exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)

  // Estados para termo de responsabilidade  
  const [showTermoModal, setShowTermoModal] = useState(false)
  const [itemParaTermo, setItemParaTermo] = useState<Item | null>(null)

  // Estados para anexos
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [showAnexosModal, setShowAnexosModal] = useState(false)
  const [itemAnexos, setItemAnexos] = useState<Item | null>(null)

  // Estados para redimensionamento de colunas
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem('inventario-column-widths')
    return saved ? JSON.parse(saved) : { codigo: 100, item: 200 }
  })
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  const statusOptions = [
    'Ativo',
    'Inativo',
    'Em Manutenção',
    'Em Uso',
    'Disponível',
    'Descartado',
  ]

  useEffect(() => {
    fetchItens()
  }, [])

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
        .select(`
          *,
          colaboradores:responsavel_id (
            nome,
            cpf,
            email
          )
        `)
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

  // Funções para redimensionamento de colunas
  const handleMouseDown = (e: React.MouseEvent, column: 'codigo' | 'item') => {
    e.preventDefault()
    setIsResizing(column)
    setStartX(e.clientX)
    setStartWidth(columnWidths[column])
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    
    const diff = e.clientX - startX
    const newWidth = Math.max(80, startWidth + diff) // Largura mínima de 80px
    
    setColumnWidths((prev: { codigo: number; item: number }) => {
      const newWidths = {
        ...prev,
        [isResizing]: newWidth
      }
      // Salvar no localStorage
      localStorage.setItem('inventario-column-widths', JSON.stringify(newWidths))
      return newWidths
    })
  }

  const handleMouseUp = () => {
    setIsResizing(null)
  }

  // Adicionar e remover event listeners para o redimensionamento
  useEffect(() => {
    if (isResizing) {
      document.body.classList.add('resizing-column')
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.body.classList.remove('resizing-column')
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, startX, startWidth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!isSupabaseConfigured) {
      setToast({ 
        message: `Modo Demo: Item seria ${editingItem ? 'atualizado' : 'cadastrado'} com sucesso! Configure o Supabase para salvar de verdade.`,
        type: 'success'
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
        // Salvar ID para scroll posterior
        editingRowRef.current = editingItem.id
        
        // Atualizar item existente
        const { error } = await supabase
          .from('itens')
          .update(itemData)
          .eq('id', editingItem.id)

        if (error) throw error
        setToast({ message: 'Item atualizado com sucesso!', type: 'success' })
      } else {
        // Inserir novo item
        const { error } = await supabase
          .from('itens')
          .insert([itemData])

        if (error) throw error
        setToast({ message: 'Item cadastrado com sucesso!', type: 'success' })
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
      
      // Recarregar lista e fechar modal
      await fetchItens()
      setShowModal(false)
      setMessage(null)
      
      // Scroll para a linha editada após atualizar a lista
      if (editingRowRef.current) {
        setTimeout(() => {
          const element = document.getElementById(`item-${editingRowRef.current}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
          editingRowRef.current = null
        }, 100)
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao cadastrar item', type: 'error' })
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

    // Processar itens sequencialmente para evitar códigos duplicados
    for (let index = 0; index < data.length; index++) {
      const row = data[index]
      const lineNumber = index + 2 // +2 porque linha 1 é header e index começa em 0

      // Validar apenas valor numérico
      if (row.valor && isNaN(parseFloat(row.valor.toString().replace(',', '.')))) {
        errors.push(`Linha ${lineNumber}: Campo 'valor' deve ser um número`)
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

      // Criar preview do item
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

  // Função de ordenação
  const handleSort = (key: keyof Item | 'responsavel') => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Aplicar filtros e ordenação
  const filteredItens = itens
    .filter((item) => {
      // Filtro de busca textual
      const matchesSearch = 
        item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fornecedor.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Filtros por categoria, setor, status e responsável
      const matchesCategoria = !filters.categoria || item.categoria === filters.categoria
      const matchesSetor = !filters.setor || item.setor === filters.setor
      const matchesStatus = !filters.status || item.status === filters.status
      const matchesResponsavel = !filters.responsavel || 
        (item.colaboradores?.nome || '').toLowerCase().includes(filters.responsavel.toLowerCase())
      
      return matchesSearch && matchesCategoria && matchesSetor && matchesStatus && matchesResponsavel
    })
    .sort((a, b) => {
      if (!sortConfig) return 0

      let aValue: any
      let bValue: any

      if (sortConfig.key === 'responsavel') {
        aValue = a.colaboradores?.nome || ''
        bValue = b.colaboradores?.nome || ''
      } else {
        aValue = a[sortConfig.key]
        bValue = b[sortConfig.key]
      }

      // Tratamento para valores numéricos
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Tratamento para strings
      const aString = String(aValue).toLowerCase()
      const bString = String(bValue).toLowerCase()

      if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1
      if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

  // Obter valores únicos para os filtros
  const uniqueCategories = [...new Set(itens.map(item => item.categoria))].filter(Boolean).sort()
  const uniqueSetores = [...new Set(itens.map(item => item.setor))].filter(Boolean).sort()
  const uniqueStatus = [...new Set(itens.map(item => item.status))].filter(Boolean).sort()

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

  const confirmDelete = async () => {
    if (!itemToDelete) return

    setLoading(true)

    if (!isSupabaseConfigured) {
      setToast({ 
        message: 'Modo Demo: Item seria excluído com sucesso!',
        type: 'success'
      })
      setShowDeleteModal(false)
      setItemToDelete(null)
      setLoading(false)
      return
    }

    try {
      // Deletar anexos do storage primeiro
      if (itemToDelete.anexos && itemToDelete.anexos.length > 0) {
        for (const anexo of itemToDelete.anexos) {
          const { error: storageError } = await supabase.storage
            .from('inventario-anexos')
            .remove([anexo.url])
          
          if (storageError) {
            console.warn('Erro ao deletar anexo do storage:', storageError)
          }
        }
      }

      // Deletar item do banco
      const { error } = await supabase
        .from('itens')
        .delete()
        .eq('id', itemToDelete.id)

      if (error) throw error

      setToast({ 
        message: 'Item excluído com sucesso!',
        type: 'success'
      })
      
      await fetchItens()
    } catch (error: any) {
      setToast({ 
        message: error.message || 'Erro ao excluir item',
        type: 'error'
      })
    } finally {
      setShowDeleteModal(false)
      setItemToDelete(null)
      setLoading(false)
    }
  }

  // ==========================================
  // FUNÇÕES DE GERENCIAMENTO DE ANEXOS
  // ==========================================

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB

    const validFiles: File[] = []
    const errors: string[] = []

    Array.from(files).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Tipo de arquivo não permitido`)
        return
      }
      if (file.size > maxSize) {
        errors.push(`${file.name}: Arquivo muito grande (máx 10MB)`)
        return
      }
      validFiles.push(file)
    })

    if (errors.length > 0) {
      setToast({ message: errors.join(', '), type: 'error' })
    }

    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async (itemId: string) => {
    if (selectedFiles.length === 0) return

    setUploadingFiles(true)

    try {
      const anexosAtuais = editingItem?.anexos || []
      const novosAnexos: Anexo[] = []

      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${itemId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        // Upload para o Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('inventario-anexos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Erro no upload:', uploadError)
          throw uploadError
        }

        // Adicionar anexo ao array
        novosAnexos.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
          nome: file.name,
          tipo: file.type,
          tamanho: file.size,
          url: fileName,
          data_upload: new Date().toISOString()
        })
      }

      // Atualizar item com novos anexos
      const anexosAtualizados = [...anexosAtuais, ...novosAnexos]

      const { error: updateError } = await supabase
        .from('itens')
        .update({ anexos: anexosAtualizados })
        .eq('id', itemId)

      if (updateError) throw updateError

      setToast({ message: 'Arquivos anexados com sucesso!', type: 'success' })
      setSelectedFiles([])
      await fetchItens()

      return true
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao anexar arquivos', type: 'error' })
      return false
    } finally {
      setUploadingFiles(false)
    }
  }

  const downloadAnexo = async (anexo: Anexo) => {
    try {
      const { data, error } = await supabase.storage
        .from('inventario-anexos')
        .download(anexo.url)

      if (error) throw error

      // Criar URL temporária e fazer download
      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = anexo.nome
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      setToast({ message: 'Erro ao baixar arquivo', type: 'error' })
    }
  }

  const deleteAnexo = async (item: Item, anexo: Anexo) => {
    if (!confirm(`Tem certeza que deseja excluir o anexo "${anexo.nome}"?`)) {
      return
    }

    try {
      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('inventario-anexos')
        .remove([anexo.url])

      if (storageError) throw storageError

      // Atualizar item removendo o anexo
      const anexosAtualizados = (item.anexos || []).filter(a => a.id !== anexo.id)

      const { error: updateError } = await supabase
        .from('itens')
        .update({ anexos: anexosAtualizados })
        .eq('id', item.id)

      if (updateError) throw updateError

      setToast({ message: 'Anexo excluído com sucesso!', type: 'success' })
      await fetchItens()

      // Atualizar modal se estiver aberto
      if (itemAnexos && itemAnexos.id === item.id) {
        setItemAnexos({ ...item, anexos: anexosAtualizados })
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao excluir anexo', type: 'error' })
    }
  }

  const visualizarAnexo = async (anexo: Anexo) => {
    try {
      const { data, error } = await supabase.storage
        .from('inventario-anexos')
        .createSignedUrl(anexo.url, 3600) // URL válida por 1 hora

      if (error) throw error

      // Abrir em nova aba
      window.open(data.signedUrl, '_blank')
    } catch (error: any) {
      setToast({ message: 'Erro ao visualizar arquivo', type: 'error' })
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (tipo: string) => {
    if (tipo === 'application/pdf') {
      return (
        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      )
    } else if (tipo.startsWith('image/')) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      )
    }
    return (
      <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    )
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
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Cabeçalho com informações e botões */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Itens do Inventário</h1>
        <p className="text-sm text-gray-600">
          {filteredItens.length} {filteredItens.length === 1 ? 'item cadastrado' : 'itens cadastrados'}
        </p>
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Item
            </button>
            
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 py-2 text-sm border border-[#C9C4B5] rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Importar
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white rounded-lg border border-[#C9C4B5] p-3 mb-4">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 px-3 py-2 text-sm border border-[#C9C4B5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#394353]"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setViewMode('list')
                localStorage.setItem('inventario-view-mode', 'list')
              }}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => {
                setViewMode('cards')
                localStorage.setItem('inventario-view-mode', 'cards')
              }}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                viewMode === 'cards'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Cards
            </button>
          </div>
        </div>

        {/* Filtros Expandidos */}
        <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
            <select
              value={filters.categoria}
              onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
            >
              <option value="">Todas</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Setor</label>
            <select
              value={filters.setor}
              onChange={(e) => setFilters({ ...filters, setor: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
            >
              <option value="">Todos</option>
              {uniqueSetores.map((setor) => (
                <option key={setor} value={setor}>{setor}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
            >
              <option value="">Todos</option>
              {uniqueStatus.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Responsável</label>
            <input
              type="text"
              placeholder="Nome do responsável..."
              value={filters.responsavel}
              onChange={(e) => setFilters({ ...filters, responsavel: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Conteúdo baseado no modo de visualização */}
      {viewMode === 'list' ? (
        // Visualização em Lista
        <div className="bg-white rounded-lg shadow-sm border border-[#C9C4B5]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y" style={{ borderColor: '#C9C4B5' }}>
              <thead style={{ backgroundColor: '#394353' }}>
                <tr>
                  <th 
                    className="px-4 py-2.5 text-left text-xs font-semibold text-white uppercase tracking-wider hover:opacity-90 select-none relative" 
                    style={{ width: `${columnWidths.codigo}px`, minWidth: '80px' }}
                  >
                  <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('codigo')}>
                    Código
                    {sortConfig?.key === 'codigo' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                  {/* Resize handle */}
                  <div
                    className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 hover:w-1.5 transition-all group"
                    onMouseDown={(e) => handleMouseDown(e, 'codigo')}
                    style={{ 
                      backgroundColor: isResizing === 'codigo' ? '#3b82f6' : 'transparent',
                      width: isResizing === 'codigo' ? '3px' : '4px'
                    }}
                    title="Arraste para redimensionar"
                  >
                    {/* Indicador visual */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5h2v14H8V5zm6 0h2v14h-2V5z"/>
                      </svg>
                    </div>
                  </div>
                </th>
                <th 
                  className="px-4 py-2.5 text-left text-xs font-normal text-white uppercase tracking-wider hover:opacity-90 select-none relative"
                  style={{ width: `${columnWidths.item}px`, minWidth: '120px' }}
                >
                  <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('item')}>
                    Item
                    {sortConfig?.key === 'item' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                  {/* Resize handle */}
                  <div
                    className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 hover:w-1.5 transition-all group"
                    onMouseDown={(e) => handleMouseDown(e, 'item')}
                    style={{ 
                      backgroundColor: isResizing === 'item' ? '#3b82f6' : 'transparent',
                      width: isResizing === 'item' ? '3px' : '4px'
                    }}
                    title="Arraste para redimensionar"
                  >
                    {/* Indicador visual */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5h2v14H8V5zm6 0h2v14h-2V5z"/>
                      </svg>
                    </div>
                  </div>
                </th>
                <th 
                  className="px-4 py-2.5 text-left text-xs font-normal text-white uppercase tracking-wider cursor-pointer hover:opacity-90 select-none hidden md:table-cell"
                  onClick={() => handleSort('categoria')}
                >
                  <div className="flex items-center gap-1">
                    Categoria
                    {sortConfig?.key === 'categoria' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-2.5 text-left text-xs font-normal text-white uppercase tracking-wider cursor-pointer hover:opacity-90 select-none hidden lg:table-cell"
                  onClick={() => handleSort('setor')}
                >
                  <div className="flex items-center gap-1">
                    Setor
                    {sortConfig?.key === 'setor' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-2.5 text-left text-xs font-normal text-white uppercase tracking-wider cursor-pointer hover:opacity-90 select-none hidden xl:table-cell"
                  onClick={() => handleSort('responsavel')}
                >
                  <div className="flex items-center gap-1">
                    Responsável
                    {sortConfig?.key === 'responsavel' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-2.5 text-left text-xs font-normal text-white uppercase tracking-wider cursor-pointer hover:opacity-90 select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {sortConfig?.key === 'status' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-normal text-white uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {filteredItens.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum item encontrado</h3>
                      <p className="mt-1 text-sm text-gray-500">Comece adicionando um novo item ao inventário.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItens.map((item) => (
                  <tr key={item.id} id={`item-${item.id}`} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-3 py-3 text-xs text-gray-900" style={{ width: `${columnWidths.codigo}px` }}>
                      <div className="overflow-hidden text-ellipsis">{item.codigo}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-xs text-gray-900" style={{ width: `${columnWidths.item}px` }}>
                      <div className="overflow-hidden">
                        <div>{item.item || 'Item sem nome'}</div>
                        <div className="text-xs text-gray-500 md:hidden mt-1">
                          {item.categoria || '-'}
                        </div>
                        <div className="text-xs text-gray-500 lg:hidden xl:hidden mt-1">
                          {item.setor} {item.colaboradores?.nome && `• ${item.colaboradores.nome}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-xs text-gray-500 hidden md:table-cell">
                      {item.categoria || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-xs text-gray-500 hidden lg:table-cell">
                      {item.setor}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-xs text-gray-500 hidden xl:table-cell">
                      {item.colaboradores?.nome || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs">
                      <div className="flex space-x-1.5 sm:space-x-2">
                        <button
                          onClick={() => handleTermoResponsabilidade(item)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Emitir Termo de Responsabilidade"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        // Visualização em Cards
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredItens.map((item) => (
            <div key={item.id} id={`item-${item.id}`} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border" style={{ borderColor: '#C9C4B5' }}>
              <div className="p-3">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{item.item}</h3>
                    <p className="text-xs text-gray-600 mt-0.5">{item.codigo}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{item.categoria}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                
                <div className="space-y-1 sm:space-y-1.5 text-xs border-t border-gray-100 pt-2 sm:pt-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-500 min-w-[65px] sm:min-w-[70px] flex-shrink-0">Setor:</span>
                    <span className="text-gray-900 truncate font-medium">{item.setor}</span>
                  </div>
                  {item.colaboradores?.nome && (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-500 min-w-[65px] sm:min-w-[70px] flex-shrink-0">Responsável:</span>
                      <span className="text-gray-900 truncate">{item.colaboradores.nome}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-500 min-w-[65px] sm:min-w-[70px] flex-shrink-0">Valor:</span>
                    <span className="text-gray-900 font-semibold truncate">
                      R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-3 py-2 bg-gray-50 border-t rounded-b-lg flex justify-end gap-1.5" style={{ borderColor: '#C9C4B5' }}>
                <button
                  onClick={() => handleTermoResponsabilidade(item)}
                  className="text-purple-600 hover:text-purple-900 transition-colors"
                  title="Emitir Termo de Responsabilidade"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleEditItem(item)}
                  className="text-blue-600 hover:text-blue-900 transition-colors"
                  title="Editar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteItem(item)}
                  className="text-red-600 hover:text-red-900 transition-colors"
                  title="Excluir"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredItens.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-500">Nenhum item encontrado</p>
        </div>
      )}

      {/* Modal de Cadastro */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div style={{ backgroundColor: '#394353' }} className="sticky top-0 px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">
                  {editingItem ? 'Editar Item' : 'Adicionar Novo Item'}
                </h2>
                <p className="text-xs text-gray-300 mt-0.5">Preencha os dados do item do inventário</p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingItem(null)
                  setMessage(null)
                }}
                className="text-white hover:text-gray-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Código */}
            <div>
              <label htmlFor="codigo" className="block text-xs font-medium text-gray-700 mb-1">
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
                style={{ borderColor: '#C9C4B5' }}
                className="block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#394353] focus:border-transparent"
              />
            </div>

            {/* Item */}
            <div>
              <label htmlFor="item" className="block text-xs font-medium text-gray-700 mb-1">
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
                style={{ borderColor: '#C9C4B5' }}
                className="block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#394353] focus:border-transparent"
              />
            </div>

            {/* Modelo */}
            <div>
              <label htmlFor="modelo" className="block text-xs font-medium text-gray-700 mb-1">
                Modelo
              </label>
              <input
                type="text"
                name="modelo"
                id="modelo"
                value={formData.modelo}
                onChange={handleChange}
                placeholder="Ex: XYZ-2024"
                style={{ borderColor: '#C9C4B5' }}
                className="block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#394353] focus:border-transparent"
              />
            </div>

            {/* Categoria */}
            <div>
              <label htmlFor="categoria" className="block text-xs font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <input
                type="text"
                name="categoria"
                id="categoria"
                value={formData.categoria}
                onChange={handleChange}
                placeholder="Digite a categoria"
                style={{ borderColor: '#C9C4B5' }}
                className="block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#394353] focus:border-transparent"
              />
            </div>

            {/* Número de Série */}
            <div>
              <label htmlFor="numero_serie" className="block text-xs font-medium text-gray-700 mb-1">
                Número de Série
              </label>
              <input
                type="text"
                name="numero_serie"
                id="numero_serie"
                value={formData.numero_serie}
                onChange={handleChange}
                placeholder="Ex: SN123456789"
                style={{ borderColor: '#C9C4B5' }}
                className="block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#394353] focus:border-transparent"
              />
            </div>

            {/* Nota Fiscal */}
            <div>
              <label htmlFor="nota_fiscal" className="block text-xs font-medium text-gray-700 mb-1">
                Nota Fiscal
              </label>
              <input
                type="text"
                name="nota_fiscal"
                id="nota_fiscal"
                value={formData.nota_fiscal}
                onChange={handleChange}
                placeholder="Ex: NF-123456"
                style={{ borderColor: '#C9C4B5' }}
                className="block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#394353] focus:border-transparent"
              />
            </div>

            {/* Fornecedor */}
            <div>
              <label htmlFor="fornecedor" className="block text-xs font-medium text-gray-700 mb-1">
                Fornecedor
              </label>
              <input
                type="text"
                name="fornecedor"
                id="fornecedor"
                value={formData.fornecedor}
                onChange={handleChange}
                placeholder="Nome do fornecedor"
                style={{ borderColor: '#C9C4B5' }}
                className="block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#394353] focus:border-transparent"
              />
            </div>

            {/* Setor */}
            <div>
              <label htmlFor="setor" className="block text-xs font-medium text-gray-700 mb-1">
                Setor *
              </label>
              <input
                type="text"
                name="setor"
                id="setor"
                required
                value={formData.setor}
                onChange={handleChange}
                placeholder="Digite o setor"
                style={{ borderColor: '#C9C4B5' }}
                className="block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#394353] focus:border-transparent"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-xs font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                name="status"
                id="status"
                required
                value={formData.status}
                onChange={handleChange}
                style={{ borderColor: '#C9C4B5' }}
                className="block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#394353] focus:border-transparent"
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
              <label htmlFor="valor" className="block text-xs font-medium text-gray-700 mb-1">
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
                style={{ borderColor: '#C9C4B5' }}
                className="block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#394353] focus:border-transparent"
              />
            </div>
          </div>

              {/* Detalhes - Campo grande separado */}
              <div>
            <label htmlFor="detalhes" className="block text-xs font-medium text-gray-700 mb-1">
              Detalhes
            </label>
            <textarea
              name="detalhes"
              id="detalhes"
              rows={3}
              value={formData.detalhes}
              onChange={handleChange}
              placeholder="Informações adicionais sobre o item..."
              style={{ borderColor: '#C9C4B5' }}
              className="block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#394353] focus:border-transparent"
            />
          </div>

              {/* Seção de Anexos */}
              {editingItem && isSupabaseConfigured && (
                <div className="border-t pt-4" style={{ borderColor: '#C9C4B5' }}>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Anexos (PDF, Imagens)
                  </h3>

                  {/* Arquivos já anexados */}
                  {editingItem.anexos && editingItem.anexos.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {editingItem.anexos.map((anexo) => (
                        <div key={anexo.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border" style={{ borderColor: '#C9C4B5' }}>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {getFileIcon(anexo.tipo)}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{anexo.nome}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(anexo.tamanho)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => visualizarAnexo(anexo)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Visualizar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadAnexo(anexo)}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Baixar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteAnexo(editingItem, anexo)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Excluir"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload de novos arquivos */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                        style={{ borderColor: '#C9C4B5' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Selecionar Arquivos
                      </label>
                      <span className="text-xs text-gray-500">
                        PDF, JPEG, PNG, GIF (máx 10MB cada)
                      </span>
                    </div>

                    {/* Arquivos selecionados para upload */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getFileIcon(file.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(index)}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => uploadFiles(editingItem.id)}
                          disabled={uploadingFiles}
                          className="w-full px-3 py-2 text-xs font-semibold text-white rounded-md disabled:opacity-50"
                          style={{ backgroundColor: '#394353' }}
                        >
                          {uploadingFiles ? 'Enviando...' : `Enviar ${selectedFiles.length} arquivo(s)`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: '#C9C4B5' }}>
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
                  style={{ borderColor: '#C9C4B5' }}
                  className="px-3 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-50 text-sm font-semibold transition-colors"
                >
                  Limpar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ backgroundColor: '#394353' }}
                  className="px-4 py-2 text-white rounded-md hover:opacity-90 text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div style={{ backgroundColor: '#394353' }} className="sticky top-0 px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">Importar Itens</h2>
                <p className="text-xs text-gray-300 mt-0.5">Faça upload de arquivo XLSX ou CSV com os dados dos itens</p>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportFile(null)
                  setImportPreview([])
                  setImportErrors([])
                  setMessage(null)
                }}
                className="text-white hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-4 py-4">
              {/* Mensagem */}
              {message && (
                <div className={`mb-4 p-4 rounded-md ${
                  message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Botão para baixar modelo */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900">Baixe o modelo de importação</h3>
                    <p className="text-xs text-blue-700 mt-1">
                      Arquivo Excel com campos corretos e exemplos
                    </p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    style={{ backgroundColor: '#394353' }}
                    className="px-3 py-2 text-sm font-semibold text-white rounded-md hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Baixar Modelo
                  </button>
                </div>
              </div>

              {/* Upload de arquivo */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione o arquivo para importar
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
                        className="relative cursor-pointer bg-white rounded-md font-medium" style={{ color: '#394353' }}
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
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
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
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{item.codigo}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{item.item}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{item.modelo || '-'}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{item.categoria || '-'}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{item.setor}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{item.status}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
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
                <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: '#C9C4B5' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false)
                      setImportFile(null)
                      setImportPreview([])
                      setImportErrors([])
                      setMessage(null)
                    }}
                    style={{ borderColor: '#C9C4B5' }}
                    className="px-3 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-50 text-sm font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={executeImport}
                    disabled={importLoading || importErrors.length > 0}
                    style={{ backgroundColor: '#394353' }}
                    className="px-4 py-2 text-white rounded-md hover:opacity-90 text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Confirmar Exclusão</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Tem certeza que deseja excluir o item "<span className="font-semibold">{itemToDelete.item}</span>"?
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Esta ação não pode ser desfeita.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={cancelDelete}
                  style={{ borderColor: '#C9C4B5' }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#394353] disabled:opacity-50"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Modal de Anexos */}
      {showAnexosModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50 px-4 py-6">
          <div className="relative top-20 mx-auto p-6 border w-full max-w-2xl shadow-2xl rounded-md bg-white" style={{ borderColor: '#C9C4B5' }}>
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Anexos - {editingItem?.item}
                </h3>
                <button
                  onClick={() => {
                    setShowAnexosModal(false)
                    setSelectedFiles([])
                    setItemAnexos([])
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Lista de Anexos Existentes */}
            {itemAnexos.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Arquivos anexados:</h4>
                <div className="space-y-2">
                  {itemAnexos.map((anexo) => (
                    <div key={anexo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border" style={{ borderColor: '#C9C4B5' }}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {getFileIcon(anexo.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{anexo.nome}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(anexo.tamanho)} • {new Date(anexo.data_upload).toLocaleDateString('pt-BR')}
                            {anexo.usuario_upload && ` • ${anexo.usuario_upload}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2 flex-shrink-0">
                        <button
                          onClick={() => visualizarAnexo(anexo)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Visualizar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => downloadAnexo(anexo)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="Baixar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteAnexo(anexo.id, anexo.url)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Excluir"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload de Novos Arquivos */}
            <div className="border-t border-gray-200 pt-4" style={{ borderColor: '#C9C4B5' }}>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Adicionar novo anexo:</h4>
              
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                className="hidden"
              />
              
              <label
                htmlFor="file-upload"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-md cursor-pointer hover:border-gray-400 transition-colors"
                style={{ borderColor: '#C9C4B5' }}
              >
                <div className="text-center">
                  <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mt-1 text-xs text-gray-600">
                    Clique para selecionar arquivos ou arraste aqui
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, JPEG, PNG, GIF, BMP, WEBP (máx. 10MB)
                  </p>
                </div>
              </label>

              {/* Preview de Arquivos Selecionados */}
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Arquivos selecionados:</p>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-md border border-blue-200">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeSelectedFile(index)}
                        className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => editingItem && uploadFiles(editingItem.id)}
                    disabled={uploadingFiles}
                    className="w-full px-4 py-2 text-sm font-semibold text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#394353' }}
                  >
                    {uploadingFiles ? 'Enviando...' : `Enviar ${selectedFiles.length} arquivo(s)`}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowAnexosModal(false)
                  setSelectedFiles([])
                  setItemAnexos([])
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50"
                style={{ borderColor: '#C9C4B5' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de Notificação */}
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