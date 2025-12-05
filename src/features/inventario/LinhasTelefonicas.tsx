import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import { Edit, Trash2, Phone, CheckCircle, XCircle, DollarSign, ArrowUpDown, ArrowUp, ArrowDown, History } from 'lucide-react'
import { Toast } from '../../shared/components/Toast'
import { SelectAparelho } from '../../shared/components/SelectAparelho'




interface LinhaTelefonica {
  id: string
  responsavel_id: string | null
  responsavel_nome?: string
  numero_linha: string
  tipo: 'eSIM' | 'Chip Físico'
  operadora: string
  usuario_setor: string | null
  plano: string
  valor_plano: number
  status: 'Ativa' | 'Inativa'
  aparelho_id: string | null
  aparelho_nome?: string
  created_at?: string
}

interface HistoricoLinha {
  id: string
  linha_id: string
  campo_alterado: 'responsavel' | 'usuario_setor'
  valor_anterior: string | null
  valor_novo: string | null
  usuario_id: string | null
  data_alteracao: string
}

interface Colaborador {
  id: string
  nome: string
}

export const LinhasTelefonicas: React.FC = () => {
  const [linhas, setLinhas] = useState<LinhaTelefonica[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Estados para busca de responsável
  const [searchResponsavel, setSearchResponsavel] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [responsavelSelecionado, setResponsavelSelecionado] = useState<Colaborador | null>(null)
  
  // Estados para busca de aparelho
  const [aparelhoSelecionado, setAparelhoSelecionado] = useState<{ id: string; codigo: string; item: string; modelo: string } | null>(null)
  
  // Estados para importação de Excel
  const [showImportModal, setShowImportModal] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] }>({ success: 0, errors: [] })
  
  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState<'Todos' | 'eSIM' | 'Chip Físico'>('Todos')
  const [filterOperadora, setFilterOperadora] = useState<string>('Todas')
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'Ativa' | 'Inativa'>('Todos')
  
  // Estados para histórico
  const [showHistoricoModal, setShowHistoricoModal] = useState(false)
  const [historicoAtual, setHistoricoAtual] = useState<HistoricoLinha[]>([])
  const [linhaHistorico, setLinhaHistorico] = useState<LinhaTelefonica | null>(null)
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  
  // Estados para ordenação
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // Estados para notificações
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)
  
  // Ref para manter a posição do scroll
  const editingRowRef = useRef<string | null>(null)
  
  const [formData, setFormData] = useState<Omit<LinhaTelefonica, 'id' | 'created_at' | 'responsavel_nome' | 'aparelho_nome'>>({
    responsavel_id: null,
    numero_linha: '',
    tipo: 'Chip Físico',
    operadora: '',
    usuario_setor: null,
    plano: '',
    valor_plano: 0,
    status: 'Ativa',
    aparelho_id: null
  })

  useEffect(() => {
    fetchLinhas()
    fetchColaboradores()
  }, [])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.relative')) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // Obter lista única de operadoras
  const operadorasUnicas = ['Todas', ...Array.from(new Set(linhas.map(l => l.operadora).filter(Boolean)))]

  // Função de filtragem
  const linhasFiltradas = linhas.filter(linha => {
    // Filtro de busca (busca em múltiplos campos)
    const searchLower = searchTerm.toLowerCase()
    const matchSearch = searchTerm === '' || 
      linha.numero_linha.toLowerCase().includes(searchLower) ||
      linha.operadora.toLowerCase().includes(searchLower) ||
      linha.plano.toLowerCase().includes(searchLower) ||
      (linha.usuario_setor && linha.usuario_setor.toLowerCase().includes(searchLower)) ||
      (linha.responsavel_nome && linha.responsavel_nome.toLowerCase().includes(searchLower))

    // Filtro de tipo
    const matchTipo = filterTipo === 'Todos' || linha.tipo === filterTipo

    // Filtro de operadora
    const matchOperadora = filterOperadora === 'Todas' || linha.operadora === filterOperadora

    // Filtro de status
    const matchStatus = filterStatus === 'Todos' || linha.status === filterStatus

    return matchSearch && matchTipo && matchOperadora && matchStatus
  })

  // Função de ordenação
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Se já está ordenando por essa coluna, inverte a direção
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Nova coluna, ordena ascendente
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Aplicar ordenação
  const linhasOrdenadas = [...linhasFiltradas].sort((a, b) => {
    if (!sortColumn) return 0

    let aValue: any = a[sortColumn as keyof LinhaTelefonica]
    let bValue: any = b[sortColumn as keyof LinhaTelefonica]

    // Tratamento especial para campos que podem ser null
    if (aValue === null || aValue === undefined) aValue = ''
    if (bValue === null || bValue === undefined) bValue = ''

    // Comparação para números
    if (sortColumn === 'valor_plano') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }

    // Comparação para strings
    const comparison = String(aValue).localeCompare(String(bValue), 'pt-BR')
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Cálculos para o dashboard
  const totalLinhas = linhas.length
  const linhasAtivas = linhas.filter(l => l.status === 'Ativa').length
  const linhasInativas = linhas.filter(l => l.status === 'Inativa').length
  const valorTotal = linhas.reduce((sum, l) => sum + l.valor_plano, 0)

  const fetchLinhas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('linhas_telefonicas')
        .select(`
          *,
          colaboradores:responsavel_id (
            id,
            nome
          ),
          itens:aparelho_id (
            id,
            codigo,
            item,
            modelo
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const linhasFormatadas = data?.map((linha: any) => ({
        ...linha,
        responsavel_nome: linha.colaboradores?.nome || '',
        aparelho_nome: linha.itens 
          ? `${linha.itens.codigo} - ${linha.itens.item}${linha.itens.modelo ? ` (${linha.itens.modelo})` : ''}`
          : ''
      })) || []

      setLinhas(linhasFormatadas)
    } catch (error) {
      console.error('Erro ao buscar linhas:', error)
      alert('Erro ao carregar linhas telefônicas')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistorico = async (linhaId: string) => {
    try {
      setLoadingHistorico(true)
      const { data, error } = await supabase
        .from('historico_linhas_telefonicas')
        .select('*')
        .eq('linha_id', linhaId)
        .order('data_alteracao', { ascending: false })

      if (error) throw error
      setHistoricoAtual(data || [])
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
      setToast({ message: 'Erro ao carregar histórico', type: 'error' })
    } finally {
      setLoadingHistorico(false)
    }
  }

  const abrirHistorico = async (linha: LinhaTelefonica) => {
    setLinhaHistorico(linha)
    setShowHistoricoModal(true)
    await fetchHistorico(linha.id)
  }

  const fetchColaboradores = async () => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('id, nome')
        .eq('status', 'Ativo')
        .order('nome')

      if (error) throw error
      setColaboradores(data || [])
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error)
    }
  }

  const openModal = (linha?: LinhaTelefonica) => {
    if (linha) {
      setEditingId(linha.id)
      setFormData({
        responsavel_id: linha.responsavel_id,
        numero_linha: linha.numero_linha,
        tipo: linha.tipo,
        operadora: linha.operadora,
        usuario_setor: linha.usuario_setor,
        plano: linha.plano,
        valor_plano: linha.valor_plano,
        status: linha.status,
        aparelho_id: linha.aparelho_id
      })
      // Buscar o nome do responsável se houver
      if (linha.responsavel_id) {
        const resp = colaboradores.find(c => c.id === linha.responsavel_id)
        if (resp) {
          setResponsavelSelecionado(resp)
          setSearchResponsavel(resp.nome)
        }
      } else {
        setResponsavelSelecionado(null)
        setSearchResponsavel('')
      }
      // Configurar aparelho selecionado se houver (buscar da linha que vem com dados do join)
      if (linha.aparelho_id && (linha as any).itens) {
        const aparelhoData = (linha as any).itens
        setAparelhoSelecionado({
          id: aparelhoData.id,
          codigo: aparelhoData.codigo,
          item: aparelhoData.item,
          modelo: aparelhoData.modelo
        })
      } else {
        setAparelhoSelecionado(null)
      }
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      responsavel_id: null,
      numero_linha: '',
      tipo: 'Chip Físico',
      operadora: '',
      usuario_setor: null,
      plano: '',
      valor_plano: 0,
      status: 'Ativa',
      aparelho_id: null
    })
    setSearchResponsavel('')
    setResponsavelSelecionado(null)
    setAparelhoSelecionado(null)
    setShowDropdown(false)
  }

  // Funções para busca de responsável
  const handleSearchResponsavel = (value: string) => {
    setSearchResponsavel(value)
    setShowDropdown(true)
    
    // Se limpar o campo, remove a seleção
    if (!value) {
      setResponsavelSelecionado(null)
      setFormData({ ...formData, responsavel_id: null })
    }
  }

  const handleSelectResponsavel = (colaborador: Colaborador) => {
    setResponsavelSelecionado(colaborador)
    setSearchResponsavel(colaborador.nome)
    setFormData({ ...formData, responsavel_id: colaborador.id })
    setShowDropdown(false)
  }

  const handleClearResponsavel = () => {
    setSearchResponsavel('')
    setResponsavelSelecionado(null)
    setFormData({ ...formData, responsavel_id: null })
    setShowDropdown(false)
  }

  // Filtrar colaboradores baseado na busca
  const colaboradoresFiltrados = colaboradores.filter(colab =>
    colab.nome.toLowerCase().includes(searchResponsavel.toLowerCase())
  )

  // Função para registrar alterações no histórico
  const registrarHistorico = async (
    linhaId: string,
    campo: 'responsavel' | 'usuario_setor',
    valorAnterior: string | null,
    valorNovo: string | null
  ) => {
    try {
      // Obter o ID do usuário autenticado
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase
        .from('historico_linhas_telefonicas')
        .insert([{
          linha_id: linhaId,
          campo_alterado: campo,
          valor_anterior: valorAnterior,
          valor_novo: valorNovo,
          usuario_id: user?.id || null
        }])
    } catch (error) {
      console.error('Erro ao registrar histórico:', error)
      // Não lança erro para não interromper o fluxo principal
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!formData.numero_linha.trim()) {
      setToast({ message: 'Número da linha é obrigatório', type: 'warning' })
      return
    }

    if (!formData.operadora.trim()) {
      setToast({ message: 'Operadora é obrigatória', type: 'warning' })
      return
    }

    if (!formData.plano.trim()) {
      setToast({ message: 'Plano é obrigatório', type: 'warning' })
      return
    }

    if (formData.valor_plano < 0) {
      setToast({ message: 'Valor do plano não pode ser negativo', type: 'warning' })
      return
    }

    try {
      if (editingId) {
        // Buscar dados anteriores para comparação
        const linhaAnterior = linhas.find(l => l.id === editingId)
        
        // Salvar ID para scroll posterior
        editingRowRef.current = editingId
        
        // Atualizar
        const { error } = await supabase
          .from('linhas_telefonicas')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
        
        // Registrar histórico se houve mudança no responsável
        if (linhaAnterior && linhaAnterior.responsavel_id !== formData.responsavel_id) {
          const nomeAnterior = linhaAnterior.responsavel_nome || null
          const nomeNovo = colaboradores.find(c => c.id === formData.responsavel_id)?.nome || null
          await registrarHistorico(editingId, 'responsavel', nomeAnterior, nomeNovo)
        }
        
        // Registrar histórico se houve mudança no usuário/setor
        if (linhaAnterior && linhaAnterior.usuario_setor !== formData.usuario_setor) {
          await registrarHistorico(
            editingId, 
            'usuario_setor', 
            linhaAnterior.usuario_setor, 
            formData.usuario_setor
          )
        }
        
        setToast({ message: 'Linha telefônica atualizada com sucesso!', type: 'success' })
      } else {
        // Criar
        const { error } = await supabase
          .from('linhas_telefonicas')
          .insert([formData])

        if (error) throw error
        setToast({ message: 'Linha telefônica cadastrada com sucesso!', type: 'success' })
      }

      setShowModal(false)
      resetForm()
      await fetchLinhas()
      
      // Scroll para a linha editada após atualizar a lista
      if (editingRowRef.current) {
        setTimeout(() => {
          const element = document.getElementById(`linha-${editingRowRef.current}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
          editingRowRef.current = null
        }, 100)
      }
    } catch (error: any) {
      console.error('Erro ao salvar linha:', error)
      setToast({ message: `Erro ao salvar linha telefônica: ${error.message}`, type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta linha telefônica?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('linhas_telefonicas')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setToast({ message: 'Linha telefônica excluída com sucesso!', type: 'success' })
      fetchLinhas()
    } catch (error: any) {
      console.error('Erro ao excluir linha:', error)
      alert(`Erro ao excluir linha telefônica: ${error.message}`)
    }
  }

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarNumero = (numero: string) => {
    // Remove caracteres não numéricos
    const apenasNumeros = numero.replace(/\D/g, '')
    
    // Formata: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (apenasNumeros.length === 11) {
      return apenasNumeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    } else if (apenasNumeros.length === 10) {
      return apenasNumeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return numero
  }

  // Função para baixar template de importação
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Número da Linha': '(11) 98765-4321',
        'Tipo': 'Chip Físico',
        'Operadora': 'Vivo',
        'Usuário/Setor': 'TI - Suporte',
        'Plano': 'Plano Controle 20GB',
        'Valor do Plano': 79.90,
        'Status': 'Ativa',
        'Responsável': colaboradores[0]?.nome || 'Nome do Colaborador'
      },
      {
        'Número da Linha': '(11) 91234-5678',
        'Tipo': 'eSIM',
        'Operadora': 'Claro',
        'Usuário/Setor': 'Vendas',
        'Plano': 'Plano Pós 30GB',
        'Valor do Plano': 99.90,
        'Status': 'Ativa',
        'Responsável': ''
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Linhas Telefônicas')

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 20 }, // Número da Linha
      { wch: 15 }, // Tipo
      { wch: 20 }, // Operadora
      { wch: 25 }, // Usuário/Setor
      { wch: 25 }, // Plano
      { wch: 18 }, // Valor do Plano
      { wch: 15 }, // Status
      { wch: 30 }  // Responsável
    ]
    worksheet['!cols'] = colWidths

    XLSX.writeFile(workbook, 'template_linhas_telefonicas.xlsx')
    alert('Modelo baixado com sucesso! Preencha e importe o arquivo.')
  }

  // Função para importar linhas via Excel
  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

      if (jsonData.length === 0) {
        alert('O arquivo está vazio!')
        setLoading(false)
        return
      }

      const linhasParaImportar = []
      const erros: string[] = []

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i]
        const linha = i + 2 // +2 porque começa na linha 2 do Excel (linha 1 é cabeçalho)

        // Validações básicas
        const numeroLinha = row['Número da Linha'] || row['numero_linha'] || row['Numero da Linha']
        if (!numeroLinha) {
          erros.push(`Linha ${linha}: Número da Linha é obrigatório`)
          continue
        }

        const tipo = row['Tipo'] || row['tipo'] || 'Chip Físico' // Default se não informado
        if (tipo && tipo !== 'Chip Físico' && tipo !== 'eSIM') {
          erros.push(`Linha ${linha}: Tipo deve ser "Chip Físico" ou "eSIM"`)
          continue
        }

        const operadora = row['Operadora'] || row['operadora'] || ''

        // Usuário/Setor é opcional, mas limitado a 50 caracteres
        let usuarioSetor = row['Usuário/Setor'] || row['usuario_setor'] || row['Usuario/Setor'] || null
        if (usuarioSetor && usuarioSetor.length > 50) {
          erros.push(`Linha ${linha}: Usuário/Setor não pode ter mais de 50 caracteres`)
          continue
        }

        const plano = row['Plano'] || row['plano'] || ''

        const valorPlano = parseFloat(row['Valor do Plano'] || row['valor_plano'] || row['Valor do Plano'] || 0)
        if (valorPlano < 0) {
          erros.push(`Linha ${linha}: Valor do Plano não pode ser negativo`)
          continue
        }

        // Status (padrão: Ativa)
        const status = row['Status'] || row['status'] || 'Ativa'
        if (status !== 'Ativa' && status !== 'Inativa') {
          erros.push(`Linha ${linha}: Status deve ser "Ativa" ou "Inativa"`)
          continue
        }

        // Buscar responsável pelo nome (opcional)
        let responsavel_id = null
        const nomeResponsavel = row['Responsável'] || row['responsavel'] || row['Responsavel']
        if (nomeResponsavel) {
          const responsavelEncontrado = colaboradores.find(c => 
            c.nome.toLowerCase() === nomeResponsavel.toLowerCase()
          )
          if (responsavelEncontrado) {
            responsavel_id = responsavelEncontrado.id
          } else {
            erros.push(`Linha ${linha}: Responsável "${nomeResponsavel}" não encontrado`)
          }
        }

        linhasParaImportar.push({
          numero_linha: numeroLinha,
          tipo: tipo as 'eSIM' | 'Chip Físico',
          operadora: operadora,
          usuario_setor: usuarioSetor,
          plano: plano,
          valor_plano: valorPlano,
          status: status as 'Ativa' | 'Inativa',
          responsavel_id: responsavel_id
        })
      }

      // Verificar se há dados para importar
      if (linhasParaImportar.length === 0) {
        setImportResult({
          success: 0,
          errors: erros
        })
        setShowImportModal(true)
        setLoading(false)
        return
      }

      // Importar linhas válidas
      const { data: insertedData, error } = await supabase
        .from('linhas_telefonicas')
        .insert(linhasParaImportar)
        .select()

      if (error) throw error

      const totalImportados = insertedData?.length || 0
      
      setImportResult({
        success: totalImportados,
        errors: erros
      })
      setShowImportModal(true)
      fetchLinhas()
    } catch (error: any) {
      console.error('Erro ao importar:', error)
      alert('Erro ao importar arquivo: ' + error.message)
    } finally {
      setLoading(false)
      // Limpar o input file
      event.target.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Cabeçalho com botões */}
      <div className="bg-white shadow rounded-lg mb-4">
        <div className="px-4 py-3" style={{borderBottom: '1px solid #C9C4B5'}}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-base font-semibold text-gray-900">Linhas Telefônicas</h1>
              <p className="text-xs text-gray-600 mt-1">
                {linhas.length} {linhas.length === 1 ? 'linha cadastrada' : 'linhas cadastradas'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center justify-center px-4 py-2.5 border shadow-sm text-sm font-semibold rounded-md text-white hover:opacity-90"
                style={{backgroundColor: '#394353', borderColor: '#C9C4B5'}}
              >
                <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="sm:inline">Baixar Modelo</span>
              </button>
              <label className="inline-flex items-center justify-center px-4 py-2.5 border shadow-sm text-sm font-semibold rounded-md text-white hover:opacity-90 cursor-pointer" style={{backgroundColor: '#394353', borderColor: '#C9C4B5'}}>
                <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span className="sm:inline">Importar Excel</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                  disabled={loading}
                />
              </label>
              <button
                onClick={() => openModal()}
                className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-semibold rounded-md text-white hover:opacity-90"
                style={{backgroundColor: '#394353'}}
              >
                <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="sm:inline">Adicionar Linha</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Minimalista */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* Total de Linhas */}
        <div className="bg-white shadow rounded-lg p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md p-2" style={{backgroundColor: 'rgba(57, 67, 83, 0.1)'}}>
              <Phone className="h-5 w-5" style={{color: '#394353'}} />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total de Linhas</p>
              <p className="text-xl font-bold text-gray-900">{totalLinhas}</p>
            </div>
          </div>
        </div>

        {/* Linhas Ativas */}
        <div className="bg-white shadow rounded-lg p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Linhas Ativas</p>
              <p className="text-xl font-bold text-green-600">{linhasAtivas}</p>
            </div>
          </div>
        </div>

        {/* Linhas Inativas */}
        <div className="bg-white shadow rounded-lg p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-md p-2">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Linhas Inativas</p>
              <p className="text-xl font-bold text-red-600">{linhasInativas}</p>
            </div>
          </div>
        </div>

        {/* Valor Total Mensal */}
        <div className="bg-white shadow rounded-lg p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</p>
              <p className="text-xl font-bold text-blue-600">
                {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white shadow rounded-lg mb-4 p-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Campo de Busca */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número, operadora, plano..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          {/* Filtro por Tipo */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as 'Todos' | 'eSIM' | 'Chip Físico')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="Todos">Todos</option>
              <option value="eSIM">eSIM</option>
              <option value="Chip Físico">Chip Físico</option>
            </select>
          </div>

          {/* Filtro por Operadora */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Operadora
            </label>
            <select
              value={filterOperadora}
              onChange={(e) => setFilterOperadora(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              {operadorasUnicas.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Status */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'Todos' | 'Ativa' | 'Inativa')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="Todos">Todos</option>
              <option value="Ativa">Ativa</option>
              <option value="Inativa">Inativa</option>
            </select>
          </div>
        </div>

        {/* Indicador de resultados filtrados */}
        {(searchTerm || filterTipo !== 'Todos' || filterOperadora !== 'Todas' || filterStatus !== 'Todos') && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Exibindo {linhasFiltradas.length} de {linhas.length} linhas
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterTipo('Todos')
                setFilterOperadora('Todas')
                setFilterStatus('Todos')
              }}
              className="text-sm text-slate-600 hover:text-slate-800 underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Lista de Linhas */}
      {linhasFiltradas.length === 0 ? (
        <div className="bg-white shadow rounded-lg">
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-lg font-medium">
              {linhas.length === 0 ? 'Nenhuma linha telefônica cadastrada' : 'Nenhum resultado encontrado'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {linhas.length === 0 ? 'Clique em "Adicionar Linha" para começar' : 'Tente ajustar os filtros de busca'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Tabela para Desktop */}
          <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="text-white" style={{backgroundColor: '#394353'}}>
                <tr>
                  <th 
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90"
                    onClick={() => handleSort('numero_linha')}
                  >
                    <div className="flex items-center gap-1">
                      Número
                      {sortColumn === 'numero_linha' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                      {sortColumn !== 'numero_linha' && <ArrowUpDown className="w-4 h-4 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="hidden lg:table-cell px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90"
                    onClick={() => handleSort('tipo')}
                  >
                    <div className="flex items-center gap-1">
                      Tipo
                      {sortColumn === 'tipo' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                      {sortColumn !== 'tipo' && <ArrowUpDown className="w-4 h-4 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90"
                    onClick={() => handleSort('operadora')}
                  >
                    <div className="flex items-center gap-1">
                      Operadora
                      {sortColumn === 'operadora' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                      {sortColumn !== 'operadora' && <ArrowUpDown className="w-4 h-4 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="hidden xl:table-cell px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90"
                    onClick={() => handleSort('usuario_setor')}
                  >
                    <div className="flex items-center gap-1">
                      Usuário/Setor
                      {sortColumn === 'usuario_setor' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                      {sortColumn !== 'usuario_setor' && <ArrowUpDown className="w-4 h-4 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="px-2 md:px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('responsavel_nome')}
                  >
                    <div className="flex items-center gap-1">
                      Responsável
                      {sortColumn === 'responsavel_nome' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                      {sortColumn !== 'responsavel_nome' && <ArrowUpDown className="w-4 h-4 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('plano')}
                  >
                    <div className="flex items-center gap-1">
                      Plano
                      {sortColumn === 'plano' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                      {sortColumn !== 'plano' && <ArrowUpDown className="w-4 h-4 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="px-2 md:px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('valor_plano')}
                  >
                    <div className="flex items-center gap-1">
                      Valor
                      {sortColumn === 'valor_plano' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                      {sortColumn !== 'valor_plano' && <ArrowUpDown className="w-4 h-4 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="px-2 md:px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortColumn === 'status' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                      {sortColumn !== 'status' && <ArrowUpDown className="w-4 h-4 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="hidden xl:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('aparelho_nome')}
                  >
                    <div className="flex items-center gap-1">
                      Aparelho
                      {sortColumn === 'aparelho_nome' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                      {sortColumn !== 'aparelho_nome' && <ArrowUpDown className="w-4 h-4 opacity-30" />}
                    </div>
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white" style={{borderTop: '1px solid #C9C4B5'}}>
                {linhasOrdenadas.map((linha) => (
                  <tr key={linha.id} id={`linha-${linha.id}`} className="hover:bg-gray-50" style={{borderBottom: '1px solid #C9C4B5'}}>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-900">
                      {formatarNumero(linha.numero_linha)}
                    </td>
                    <td className="hidden lg:table-cell px-2 md:px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        linha.tipo === 'eSIM' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {linha.tipo}
                      </span>
                    </td>
                    <td className="px-2 md:px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {linha.operadora}
                    </td>
                    <td className="hidden xl:table-cell px-2 md:px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {linha.usuario_setor || (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-2 md:px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {linha.responsavel_nome || ''}
                    </td>
                    <td className="hidden lg:table-cell px-2 md:px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {linha.plano}
                    </td>
                    <td className="px-2 md:px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatarValor(linha.valor_plano)}
                    </td>
                    <td className="px-2 md:px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        linha.status === 'Ativa' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {linha.status}
                      </span>
                    </td>
                    <td className="hidden xl:table-cell px-2 md:px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={linha.aparelho_nome || ''}>
                      {linha.aparelho_nome || (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-2 md:px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-1">
                        <button
                          onClick={() => abrirHistorico(linha)}
                          className="text-slate-600 hover:text-slate-900 p-1"
                          title="Ver Histórico"
                        >
                          <History className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openModal(linha)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(linha.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards para Mobile/Tablet */}
          <div className="md:hidden space-y-4">
            {linhasOrdenadas.map((linha) => (
              <div key={linha.id} className="bg-white shadow rounded-lg p-4">
                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{formatarNumero(linha.numero_linha)}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        linha.tipo === 'eSIM' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {linha.tipo}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        linha.status === 'Ativa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {linha.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirHistorico(linha)}
                      className="text-slate-600 hover:text-slate-900 p-1"
                      title="Ver Histórico"
                    >
                      <History className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openModal(linha)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Editar"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(linha.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Informações do Card */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Operadora:</span>
                    <span className="font-medium text-gray-900">{linha.operadora}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Plano:</span>
                    <span className="font-medium text-gray-900">{linha.plano}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Valor:</span>
                    <span className="font-semibold text-gray-900">{formatarValor(linha.valor_plano)}</span>
                  </div>
                  {linha.usuario_setor && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Usuário/Setor:</span>
                      <span className="font-medium text-gray-900">{linha.usuario_setor}</span>
                    </div>
                  )}
                  {linha.responsavel_nome && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Responsável:</span>
                      <span className="font-medium text-gray-900">{linha.responsavel_nome}</span>
                    </div>
                  )}
                  {linha.aparelho_nome && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Aparelho:</span>
                      <span className="font-medium text-gray-900 truncate ml-2">{linha.aparelho_nome}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-lg z-10">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingId ? 'Editar Linha Telefônica' : 'Nova Linha Telefônica'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Responsável - Campo de busca */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Responsável
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchResponsavel}
                      onChange={(e) => handleSearchResponsavel(e.target.value)}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Buscar colaborador..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
                    />
                    {responsavelSelecionado && (
                      <button
                        type="button"
                        onClick={handleClearResponsavel}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Dropdown de resultados */}
                  {showDropdown && searchResponsavel && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {colaboradoresFiltrados.length > 0 ? (
                        colaboradoresFiltrados.map((colab) => (
                          <button
                            key={colab.id}
                            type="button"
                            onClick={() => handleSelectResponsavel(colab)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                          >
                            {colab.nome}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          Nenhum colaborador encontrado
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Número da Linha */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Número da Linha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.numero_linha}
                    onChange={(e) => setFormData({ ...formData, numero_linha: e.target.value })}
                    placeholder="(XX) XXXXX-XXXX"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Tipo - Radio buttons estilizados como checkboxes */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Tipo
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="tipo"
                        value="Chip Físico"
                        checked={formData.tipo === 'Chip Físico'}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'eSIM' | 'Chip Físico' })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Chip Físico</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="tipo"
                        value="eSIM"
                        checked={formData.tipo === 'eSIM'}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'eSIM' | 'Chip Físico' })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">eSIM</span>
                    </label>
                  </div>
                </div>

                {/* Operadora */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Operadora
                  </label>
                  <input
                    type="text"
                    value={formData.operadora}
                    onChange={(e) => setFormData({ ...formData, operadora: e.target.value })}
                    placeholder="Ex: Vivo, Claro, Tim, Oi"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Usuário/Setor */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Usuário/Setor
                  </label>
                  <input
                    type="text"
                    value={formData.usuario_setor || ''}
                    onChange={(e) => setFormData({ ...formData, usuario_setor: e.target.value || null })}
                    placeholder="Ex: TI - Suporte, Vendas, Marketing"
                    maxLength={50}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Máximo 50 caracteres</p>
                </div>

                {/* Plano */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Plano
                  </label>
                  <input
                    type="text"
                    value={formData.plano}
                    onChange={(e) => setFormData({ ...formData, plano: e.target.value })}
                    placeholder="Ex: Plano Controle 20GB"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Valor do Plano */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Valor do Plano
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_plano}
                    onChange={(e) => setFormData({ ...formData, valor_plano: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Ativa' | 'Inativa' })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Ativa">Ativa</option>
                    <option value="Inativa">Inativa</option>
                  </select>
                </div>

                {/* Aparelho Vinculado */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Aparelho Vinculado
                  </label>
                  <SelectAparelho
                    value={formData.aparelho_id}
                    onChange={(value) => setFormData({ ...formData, aparelho_id: value })}
                    aparelhoSelecionado={aparelhoSelecionado}
                    onAparelhoSelecionadoChange={setAparelhoSelecionado}
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 rounded-b-lg">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {editingId ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resultado da Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                Resultado da Importação
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1">
              {/* Estatísticas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-xs sm:text-sm text-green-700 mb-1 font-medium">Importadas com Sucesso</div>
                  <div className="text-2xl sm:text-3xl font-bold text-green-900">{importResult.success}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-xs sm:text-sm text-red-700 mb-1 font-medium">Erros Encontrados</div>
                  <div className="text-2xl sm:text-3xl font-bold text-red-900">{importResult.errors.length}</div>
                </div>
              </div>

              {/* Lista de Erros */}
              {importResult.errors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Detalhes dos Erros:</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {importResult.errors.map((erro, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs sm:text-sm text-red-800">
                        {erro}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensagem de Sucesso Total */}
              {importResult.errors.length === 0 && importResult.success > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-green-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-800 font-semibold text-sm sm:text-base">
                    Todas as linhas foram importadas com sucesso!
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-gray-200 flex justify-end rounded-b-lg">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Histórico */}
      {showHistoricoModal && linhaHistorico && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Histórico de Alterações</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Linha: <span className="font-medium">{linhaHistorico.numero_linha}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowHistoricoModal(false)
                    setLinhaHistorico(null)
                    setHistoricoAtual([])
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {loadingHistorico ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Carregando histórico...</p>
                </div>
              ) : historicoAtual.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">Nenhuma alteração registrada</p>
                  <p className="text-gray-400 text-sm mt-2">
                    As alterações nos campos "Responsável" e "Usuário/Setor" serão registradas aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historicoAtual.map((registro, index) => (
                    <div
                      key={registro.id}
                      className={`border-l-4 ${
                        registro.campo_alterado === 'responsavel' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-purple-500 bg-purple-50'
                      } p-4 rounded-r-lg`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              registro.campo_alterado === 'responsavel'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {registro.campo_alterado === 'responsavel' ? 'Responsável' : 'Usuário/Setor'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(registro.data_alteracao).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-gray-600">De:</span>{' '}
                              <span className="font-medium text-gray-900">
                                {registro.valor_anterior || <span className="italic text-gray-400">(vazio)</span>}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600">Para:</span>{' '}
                              <span className="font-medium text-gray-900">
                                {registro.valor_novo || <span className="italic text-gray-400">(vazio)</span>}
                              </span>
                            </div>
                          </div>
                        </div>
                        {index === 0 && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            Mais recente
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowHistoricoModal(false)
                  setLinhaHistorico(null)
                  setHistoricoAtual([])
                }}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-800 transition-colors"
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
