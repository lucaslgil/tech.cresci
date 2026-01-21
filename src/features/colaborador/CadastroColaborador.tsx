import React, { useState, useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { Edit, Trash2, Mail, Phone, FileText, Building, Package, Users, UserCheck, UserX } from 'lucide-react'
import VincularItens from './VincularItens'
import * as XLSX from 'xlsx'
import { Toast } from '../../shared/components/Toast'
import { SelectLinhaTelefonica } from '../../shared/components/SelectLinhaTelefonica'


interface Empresa {
  id: string
  razao_social: string
}

interface Colaborador {
  id: string
  tipo_pessoa: 'fisica' | 'juridica'
  nome: string
  cpf: string | null
  cnpj: string | null
  email: string
  telefone: string
  setor: string
  cargo: string
  empresa_id: string
  status: string
  telefone_comercial_id: string | null
  telefone_comercial?: {
    numero_linha: string
    tipo: string
    operadora: string
  }
  created_at: string
  empresas?: { razao_social: string }
}

interface FormData {
  tipo_pessoa: 'fisica' | 'juridica'
  nome: string
  cpf: string
  cnpj: string
  email: string
  telefone: string
  setor: string
  cargo: string
  empresa_id: string
  status: string
  telefone_comercial_id: string | null
}

interface LinhaTelefonica {
  id: string
  numero_linha: string
  tipo: string
  operadora: string
}

export const CadastroColaborador: React.FC = () => {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingEmpresas, setLoadingEmpresas] = useState(true)
  const [loadingColaboradores, setLoadingColaboradores] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const [showVincularItens, setShowVincularItens] = useState(false)
  const [colaboradorParaVincular, setColaboradorParaVincular] = useState<Colaborador | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: number
    errors: string[]
  } | null>(null)
  
  // Estados para linha telefônica selecionada
  const [linhaTelefonicaSelecionada, setLinhaTelefonicaSelecionada] = useState<LinhaTelefonica | null>(null)
  
  // Estados para notificações
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)
  
  // Ref para manter a posição do scroll
  const editingRowRef = useRef<string | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    tipo_pessoa: 'fisica',
    nome: '',
    cpf: '',
    cnpj: '',
    email: '',
    telefone: '',
    setor: '',
    cargo: '',
    empresa_id: '',
    status: 'Ativo',
    telefone_comercial_id: null
  })

  const [setores, setSetores] = useState<string[]>([])
  const [cargos, setCargos] = useState<string[]>([])

  // Estados para filtros
  const [filters, setFilters] = useState({
    setor: '',
    cargo: '',
    status: '',
    empresa_id: ''
  })

  // Função para buscar setores
  const fetchSetores = async () => {
    if (!isSupabaseConfigured) {
      setSetores([
        'Administrativo',
        'Financeiro',
        'Recursos Humanos',
        'Tecnologia da Informação',
        'Vendas',
        'Marketing',
        'Operacional',
        'Produção',
        'Qualidade',
        'Logística',
        'Jurídico',
        'Compras',
        'Controladoria',
        'Diretoria'
      ])
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
      setMessage({ type: 'error', text: 'Erro ao carregar setores: ' + error.message })
      // Fallback para dados demo em caso de erro
      setSetores([
        'Administrativo',
        'Financeiro',
        'Recursos Humanos',
        'Tecnologia da Informação'
      ])
    } finally {
      // Loading concluído
    }
  }

  // Função para buscar cargos
  const fetchCargos = async () => {
    if (!isSupabaseConfigured) {
      setCargos([
        'Assistente Administrativo',
        'Analista Financeiro',
        'Coordenador de RH',
        'Desenvolvedor',
        'Analista de Sistemas',
        'Gerente de TI',
        'Vendedor',
        'Supervisor de Vendas',
        'Analista de Marketing',
        'Coordenador de Marketing'
      ])
      return
    }

    try {
      const { data, error } = await supabase
        .from('cargos')
        .select('nome')
        .eq('ativo', true)
        .order('nome')

      if (error) throw error
      setCargos((data || []).map(item => item.nome))
    } catch (error: any) {
      console.error('Erro ao buscar cargos:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar cargos: ' + error.message })
      // Fallback para dados demo em caso de erro
      setCargos([
        'Assistente Administrativo',
        'Analista Financeiro',
        'Coordenador de RH',
        'Desenvolvedor'
      ])
    } finally {
      // Loading concluído
    }
  }

  // Função para buscar empresas
  const fetchEmpresas = async () => {
    if (!isSupabaseConfigured) {
      setEmpresas([
        { id: '1', razao_social: 'CRESCI E PERDI FRANCHISING LTDA' },
        { id: '2', razao_social: 'Empresa Demo 2' }
      ])
      setLoadingEmpresas(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, razao_social')
        .order('razao_social')

      if (error) throw error
      setEmpresas(data || [])
    } catch (error: any) {
      console.error('Erro ao buscar empresas:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar empresas: ' + error.message })
      // Fallback para dados demo em caso de erro
      setEmpresas([
        { id: '1', razao_social: 'CRESCI E PERDI FRANCHISING LTDA' }
      ])
    } finally {
      setLoadingEmpresas(false)
    }
  }

  // Função para buscar colaboradores
  const fetchColaboradores = async () => {
    if (!isSupabaseConfigured) {
      setColaboradores([
        {
          id: '1',
          tipo_pessoa: 'fisica',
          nome: 'João Silva',
          cpf: '123.456.789-00',
          cnpj: null,
          email: 'joao@empresa.com',
          telefone: '(11) 99999-9999',
          setor: 'Tecnologia da Informação',
          cargo: 'Desenvolvedor',
          empresa_id: '1',
          status: 'Ativo',
          telefone_comercial_id: null,
          created_at: '2024-01-01T00:00:00.000Z',
          empresas: { razao_social: 'CRESCI E PERDI FRANCHISING LTDA' }
        }
      ])
      setLoadingColaboradores(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select(`
          id,
          tipo_pessoa,
          nome,
          cpf,
          cnpj,
          email,
          telefone,
          setor,
          cargo,
          empresa_id,
          status,
          telefone_comercial_id,
          created_at,
          empresas:empresa_id (razao_social),
          telefone_comercial:telefone_comercial_id (numero_linha, tipo, operadora)
        `)
        .order('nome')

      if (error) throw error
      
      setColaboradores((data || []).map(item => ({
        ...item,
        status: item.status || 'Ativo',
        empresas: Array.isArray(item.empresas) ? item.empresas[0] : item.empresas,
        telefone_comercial: Array.isArray(item.telefone_comercial) ? item.telefone_comercial[0] : item.telefone_comercial
      })))
    } catch (error: any) {
      console.error('Erro ao carregar colaboradores:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar colaboradores: ' + error.message })
      // Fallback para dados demo em caso de erro
      setColaboradores([
        {
          id: '1',
          tipo_pessoa: 'fisica',
          nome: 'João Silva (Demo)',
          cpf: '123.456.789-00',
          cnpj: null,
          email: 'joao@demo.com',
          telefone: '(11) 99999-9999',
          setor: 'Tecnologia da Informação',
          cargo: 'Desenvolvedor',
          empresa_id: '1',
          status: 'Ativo',
          telefone_comercial_id: null,
          created_at: '2024-01-01T00:00:00.000Z',
          empresas: { razao_social: 'CRESCI E PERDI FRANCHISING LTDA' }
        }
      ])
    } finally {
      setLoadingColaboradores(false)
    }
  }

  useEffect(() => {
    fetchEmpresas()
    fetchColaboradores()
    fetchSetores()
    fetchCargos()
  }, [])

  // Funções não utilizadas no momento (campos convertidos para input livre)
  // @ts-ignore
  const _adicionarSetor = async (nomeSetor: string) => {
    if (!isSupabaseConfigured) {
      const novosSetores = [...setores, nomeSetor].sort()
      setSetores(novosSetores)
      return
    }

    try {
      const { error } = await supabase
        .from('setores')
        .insert([{ nome: nomeSetor }])

      if (error) throw error
      
      // Recarregar lista de setores
      await fetchSetores()
      setMessage({ type: 'success', text: 'Setor adicionado com sucesso!' })
    } catch (error: any) {
      console.error('Erro ao adicionar setor:', error)
      setMessage({ type: 'error', text: 'Erro ao adicionar setor: ' + error.message })
    }
  }

  // @ts-ignore
  const _removerSetor = async (nomeSetor: string) => {
    if (!isSupabaseConfigured) {
      const novosSetores = setores.filter(setor => setor !== nomeSetor)
      setSetores(novosSetores)
      return
    }

    try {
      const { error } = await supabase
        .from('setores')
        .update({ ativo: false })
        .eq('nome', nomeSetor)

      if (error) throw error
      
      // Recarregar lista de setores
      await fetchSetores()
      setMessage({ type: 'success', text: 'Setor removido com sucesso!' })
    } catch (error: any) {
      console.error('Erro ao remover setor:', error)
      setMessage({ type: 'error', text: 'Erro ao remover setor: ' + error.message })
    }
  }

  // @ts-ignore
  const _adicionarCargo = async (nomeCargo: string) => {
    if (!isSupabaseConfigured) {
      const novosCargos = [...cargos, nomeCargo].sort()
      setCargos(novosCargos)
      return
    }

    try {
      const { error } = await supabase
        .from('cargos')
        .insert([{ nome: nomeCargo }])

      if (error) throw error
      
      // Recarregar lista de cargos
      await fetchCargos()
      setMessage({ type: 'success', text: 'Cargo adicionado com sucesso!' })
    } catch (error: any) {
      console.error('Erro ao adicionar cargo:', error)
      setMessage({ type: 'error', text: 'Erro ao adicionar cargo: ' + error.message })
    }
  }

  // @ts-ignore
  const _removerCargo = async (nomeCargo: string) => {
    if (!isSupabaseConfigured) {
      const novosCargos = cargos.filter(cargo => cargo !== nomeCargo)
      setCargos(novosCargos)
      return
    }

    try {
      const { error } = await supabase
        .from('cargos')
        .update({ ativo: false })
        .eq('nome', nomeCargo)

      if (error) throw error
      
      // Recarregar lista de cargos
      await fetchCargos()
      setMessage({ type: 'success', text: 'Cargo removido com sucesso!' })
    } catch (error: any) {
      console.error('Erro ao remover cargo:', error)
      setMessage({ type: 'error', text: 'Erro ao remover cargo: ' + error.message })
    }
  }

  // Formatação de CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return value
  }

  // Formatação de CNPJ
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return value
  }

  // Formatação de telefone
  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
    }
    return value
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    let formattedValue = value

    if (name === 'cpf') {
      formattedValue = formatCPF(value)
    } else if (name === 'cnpj') {
      formattedValue = formatCNPJ(value)
    } else if (name === 'telefone') {
      formattedValue = formatTelefone(value)
    }

    setFormData({
      ...formData,
      [name]: formattedValue,
    })
  }

  const resetForm = () => {
    setFormData({
      tipo_pessoa: 'fisica',
      nome: '',
      cpf: '',
      cnpj: '',
      email: '',
      telefone: '',
      setor: '',
      cargo: '',
      empresa_id: '',
      status: 'Ativo',
      telefone_comercial_id: null
    })
    setEditingColaborador(null)
  }

  const openModal = (colaborador?: Colaborador) => {
    if (colaborador) {
      setEditingColaborador(colaborador)
      setFormData({
        tipo_pessoa: colaborador.tipo_pessoa,
        nome: colaborador.nome,
        cpf: colaborador.cpf || '',
        cnpj: colaborador.cnpj || '',
        email: colaborador.email,
        telefone: colaborador.telefone,
        setor: colaborador.setor,
        cargo: colaborador.cargo,
        empresa_id: colaborador.empresa_id,
        status: colaborador.status || 'Ativo',
        telefone_comercial_id: colaborador.telefone_comercial_id || null
      })
      
      // Carregar linha telefônica selecionada se houver
      if (colaborador.telefone_comercial_id && colaborador.telefone_comercial) {
        setLinhaTelefonicaSelecionada({
          id: colaborador.telefone_comercial_id,
          numero_linha: colaborador.telefone_comercial.numero_linha,
          tipo: colaborador.telefone_comercial.tipo,
          operadora: colaborador.telefone_comercial.operadora
        })
      } else {
        setLinhaTelefonicaSelecionada(null)
      }
    } else {
      resetForm()
      setLinhaTelefonicaSelecionada(null)
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
    setLinhaTelefonicaSelecionada(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!isSupabaseConfigured) {
      setToast({ 
        message: `Modo Demo: Colaborador ${editingColaborador ? 'atualizado' : 'cadastrado'} com sucesso!`,
        type: 'success'
      })
      setLoading(false)
      closeModal()
      return
    }

    try {
      const dataToSave = {
        ...formData,
        cpf: formData.tipo_pessoa === 'fisica' ? formData.cpf : null,
        cnpj: formData.tipo_pessoa === 'juridica' ? formData.cnpj : null
      }

      if (editingColaborador) {
        // Salvar ID para scroll posterior
        editingRowRef.current = editingColaborador.id
        
        const { error } = await supabase
          .from('colaboradores')
          .update(dataToSave)
          .eq('id', editingColaborador.id)

        if (error) throw error
        setToast({ message: 'Colaborador atualizado com sucesso!', type: 'success' })
      } else {
        const { error } = await supabase
          .from('colaboradores')
          .insert([dataToSave])

        if (error) throw error
        setToast({ message: 'Colaborador cadastrado com sucesso!', type: 'success' })
      }

      await fetchColaboradores()
      closeModal()
      
      // Scroll para a linha editada após atualizar a lista
      if (editingRowRef.current) {
        setTimeout(() => {
          const element = document.getElementById(`colaborador-${editingRowRef.current}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
          editingRowRef.current = null
        }, 100)
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao salvar colaborador', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (colaborador: Colaborador) => {
    if (!window.confirm(`Deseja realmente excluir o colaborador ${colaborador.nome}?`)) return

    if (!isSupabaseConfigured) {
      setToast({ message: 'Modo Demo: Colaborador excluído com sucesso!', type: 'success' })
      return
    }

    try {
      const { error } = await supabase
        .from('colaboradores')
        .delete()
        .eq('id', colaborador.id)

      if (error) throw error
      setToast({ message: 'Colaborador excluído com sucesso!', type: 'success' })
      fetchColaboradores()
    } catch (error: any) {
      setToast({ message: 'Erro ao excluir colaborador: ' + error.message, type: 'error' })
    }
  }

  // Função para baixar modelo Excel
  const handleDownloadTemplate = () => {
    // Criar dados de exemplo
    const templateData = [
      {
        nome: 'João Silva',
        email: 'joao@email.com',
        empresa: empresas[0]?.razao_social || 'Nome da Empresa',
        cpf: '123.456.789-00',
        cnpj: '',
        telefone: '(11) 98765-4321',
        setor: 'Tecnologia da Informação',
        cargo: 'Desenvolvedor',
        status: 'Ativo'
      },
      {
        nome: 'Maria Santos',
        email: 'maria@email.com',
        empresa: empresas[0]?.razao_social || 'Nome da Empresa',
        cpf: '987.654.321-00',
        cnpj: '',
        telefone: '(11) 91234-5678',
        setor: 'Recursos Humanos',
        cargo: 'Analista',
        status: 'Ativo'
      }
    ]

    // Criar workbook e worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Colaboradores')

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 25 }, // nome
      { wch: 30 }, // email
      { wch: 30 }, // empresa
      { wch: 18 }, // cpf
      { wch: 20 }, // cnpj
      { wch: 18 }, // telefone
      { wch: 25 }, // setor
      { wch: 25 }, // cargo
      { wch: 10 }  // status
    ]
    worksheet['!cols'] = colWidths

    // Download do arquivo
    XLSX.writeFile(workbook, 'template_colaboradores.xlsx')
    setMessage({ type: 'success', text: 'Modelo baixado com sucesso! Preencha e importe o arquivo.' })
  }

  // Função para importar colaboradores via Excel
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
        setMessage({ type: 'error', text: 'O arquivo está vazio!' })
        return
      }

      // Validar e processar cada linha
      const colaboradoresParaImportar = []
      const erros: string[] = []

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i]
        const linha = i + 2 // +2 porque começa na linha 2 do Excel (linha 1 é o cabeçalho)

        // Validações básicas
        if (!row.nome && !row.Nome) {
          erros.push(`Linha ${linha}: Nome é obrigatório`)
          continue
        }

        if (!row.email && !row.Email) {
          erros.push(`Linha ${linha}: Email é obrigatório`)
          continue
        }

        if (!row.empresa_id && !row.empresa && !row.Empresa) {
          erros.push(`Linha ${linha}: Empresa é obrigatória`)
          continue
        }

        // Buscar empresa pelo nome se não for ID
        let empresa_id = row.empresa_id || row.Empresa_ID
        if (!empresa_id) {
          const nomeEmpresa = row.empresa || row.Empresa
          const empresaEncontrada = empresas.find(e => 
            e.razao_social.toLowerCase() === nomeEmpresa.toLowerCase()
          )
          if (empresaEncontrada) {
            empresa_id = empresaEncontrada.id
          } else {
            erros.push(`Linha ${linha}: Empresa "${nomeEmpresa}" não encontrada`)
            continue
          }
        }

        // Determinar tipo de pessoa
        const cpf = row.cpf || row.CPF || ''
        const cnpj = row.cnpj || row.CNPJ || ''
        const tipo_pessoa = cnpj ? 'juridica' : 'fisica'

        colaboradoresParaImportar.push({
          tipo_pessoa,
          nome: row.nome || row.Nome,
          cpf: cpf || null,
          cnpj: cnpj || null,
          email: row.email || row.Email,
          telefone: row.telefone || row.Telefone || '',
          setor: row.setor || row.Setor || '',
          cargo: row.cargo || row.Cargo || '',
          empresa_id: empresa_id,
          status: row.status || row.Status || 'Ativo'
        })
      }

      // Verificar se há dados para importar
      if (colaboradoresParaImportar.length === 0) {
        setImportResult({
          success: 0,
          errors: erros
        })
        setShowImportModal(true)
        return
      }

      // Importar colaboradores válidos
      if (!isSupabaseConfigured) {
        setImportResult({
          success: colaboradoresParaImportar.length,
          errors: erros
        })
        setShowImportModal(true)
        return
      }

      const { data: insertedData, error } = await supabase
        .from('colaboradores')
        .insert(colaboradoresParaImportar)
        .select()

      if (error) throw error

      const totalImportados = insertedData?.length || 0
      
      setImportResult({
        success: totalImportados,
        errors: erros
      })
      setShowImportModal(true)
      fetchColaboradores()
    } catch (error: any) {
      console.error('Erro ao importar:', error)
      setMessage({ type: 'error', text: 'Erro ao importar arquivo: ' + error.message })
    } finally {
      setLoading(false)
      // Limpar o input file
      event.target.value = ''
    }
  }

  // Filtrar colaboradores
  const filteredColaboradores = colaboradores.filter(colaborador => {
    const matchSearch = 
      colaborador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colaborador.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colaborador.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colaborador.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (colaborador.cpf && colaborador.cpf.includes(searchTerm)) ||
      (colaborador.cnpj && colaborador.cnpj.includes(searchTerm)) ||
      (colaborador.empresas?.razao_social && colaborador.empresas.razao_social.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchSetor = !filters.setor || colaborador.setor === filters.setor
    const matchCargo = !filters.cargo || colaborador.cargo === filters.cargo
    const matchStatus = !filters.status || colaborador.status === filters.status
    const matchEmpresa = !filters.empresa_id || colaborador.empresa_id === filters.empresa_id

    return matchSearch && matchSetor && matchCargo && matchStatus && matchEmpresa
  })

  // Obter valores únicos para filtros
  const uniqueSetores = Array.from(new Set(colaboradores.map(c => c.setor))).filter(Boolean).sort()
  const uniqueCargos = Array.from(new Set(colaboradores.map(c => c.cargo))).filter(Boolean).sort()
  const uniqueStatus = Array.from(new Set(colaboradores.map(c => c.status))).filter(Boolean).sort()

  if (loadingColaboradores || loadingEmpresas) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Cabeçalho com botões */}
      <div className="bg-white shadow rounded-lg mb-4 sm:mb-6">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestão de Colaboradores</h1>
              <p className="text-xs text-gray-600 mt-1">
                {filteredColaboradores.length} {filteredColaboradores.length === 1 ? 'colaborador cadastrado' : 'colaboradores cadastrados'}
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
                <span className="sm:inline">Adicionar Colaborador</span>
              </button>
            </div>
          </div>
        </div>

        {/* Busca e Toggle de Visualização */}
        <div className="px-4 py-3" style={{borderBottom: '1px solid #C9C4B5'}}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Campo de Busca */}
            <div className="flex-1 relative min-w-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar colaboradores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 text-sm"
                style={{borderColor: '#C9C4B5'}}
              />
            </div>
            
            {/* Toggle de Visualização */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  viewMode === 'list'
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-700 bg-white'
                }`}
                style={viewMode === 'list' ? {backgroundColor: '#394353'} : {border: '1px solid #C9C4B5'}}
              >
                <svg className="w-4 h-4 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  viewMode === 'cards'
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-700 bg-white'
                }`}
                style={viewMode === 'cards' ? {backgroundColor: '#394353'} : {border: '1px solid #C9C4B5'}}
              >
                <svg className="w-4 h-4 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Compacto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Total de Colaboradores */}
        <div className="group bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-blue-100 hover:border-blue-200 overflow-hidden">
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2 shadow-md group-hover:scale-105 transition-transform duration-300">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{filteredColaboradores.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Colaboradores Ativos */}
        <div className="group bg-gradient-to-br from-green-50 to-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-green-100 hover:border-green-200 overflow-hidden">
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0 bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-2 shadow-md group-hover:scale-105 transition-transform duration-300">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Ativos</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {filteredColaboradores.filter(c => c.status === 'Ativo').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Colaboradores Inativos */}
        <div className="group bg-gradient-to-br from-amber-50 to-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-amber-100 hover:border-amber-200 overflow-hidden">
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-2 shadow-md group-hover:scale-105 transition-transform duration-300">
                <UserX className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Inativos</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {filteredColaboradores.filter(c => c.status !== 'Ativo').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-[#C9C4B5] p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
            <label className="block text-xs font-medium text-gray-700 mb-1">Cargo</label>
            <select
              value={filters.cargo}
              onChange={(e) => setFilters({ ...filters, cargo: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
            >
              <option value="">Todos</option>
              {uniqueCargos.map((cargo) => (
                <option key={cargo} value={cargo}>{cargo}</option>
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
            <label className="block text-xs font-medium text-gray-700 mb-1">Empresa</label>
            <select
              value={filters.empresa_id}
              onChange={(e) => setFilters({ ...filters, empresa_id: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
            >
              <option value="">Todas</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>{empresa.razao_social}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mensagem de Feedback */}
      {message && (
        <div className={`rounded-lg p-3 mb-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-2 flex-1 min-w-0">
              <p className="text-xs font-medium break-words">{message.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de colaboradores */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="text-white" style={{backgroundColor: '#394353'}}>
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">Email</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Setor</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider hidden xl:table-cell">Cargo</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider hidden xl:table-cell">Empresa</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white" style={{borderTop: '1px solid #C9C4B5'}}>
                {filteredColaboradores.map((colaborador) => (
                  <tr key={colaborador.id} id={`colaborador-${colaborador.id}`} className="hover:bg-gray-50" style={{borderBottom: '1px solid #C9C4B5'}}>
                    <td className="px-4 py-2.5 text-xs font-medium text-gray-900">
                      <div className="min-w-[120px]">
                        <div className="font-medium">{colaborador.nome}</div>
                        <div className="text-xs text-gray-500 lg:hidden">{colaborador.email}</div>
                        <div className="text-xs text-gray-500 md:hidden mt-1">
                          {colaborador.setor} • {colaborador.cargo}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 hidden lg:table-cell">
                      {colaborador.email}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 hidden md:table-cell">
                      {colaborador.setor}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 hidden xl:table-cell">
                      {colaborador.cargo}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 hidden xl:table-cell">
                      {colaborador.empresas?.razao_social || 'N/A'}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        colaborador.status === 'Ativo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {colaborador.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setColaboradorParaVincular(colaborador)
                            setShowVincularItens(true)
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Vincular Itens e Gerar Termo"
                        >
                          <Package className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal(colaborador)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(colaborador)}
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
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredColaboradores.map((colaborador) => (
            <div key={colaborador.id} id={`colaborador-${colaborador.id}`} className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div className="min-w-0 flex-1 pr-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{colaborador.nome}</h3>
                  <p className="text-sm text-gray-600 truncate">{colaborador.cargo}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">{colaborador.setor}</p>
                </div>
                <div className="flex space-x-1.5 sm:space-x-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setColaboradorParaVincular(colaborador)
                      setShowVincularItens(true)
                    }}
                    className="text-green-600 hover:text-green-900 p-1"
                    title="Vincular Itens e Gerar Termo"
                  >
                    <Package className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openModal(colaborador)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(colaborador)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{colaborador.cpf || colaborador.cnpj || '-'}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{colaborador.email}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{colaborador.telefone}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{colaborador.empresas?.razao_social || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredColaboradores.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500">Nenhum colaborador encontrado</p>
        </div>
      )}

      {/* Modal de cadastro/edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 overflow-y-auto h-full w-full z-50 flex items-start justify-center p-4 sm:pt-10 sm:pb-10">
          <div className="relative w-full max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center rounded-t-lg z-10">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                  {editingColaborador ? 'Editar Colaborador' : 'Novo Colaborador'}
                </h3>
                <button 
                  onClick={closeModal} 
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Content */}
                <div className="px-4 sm:px-6 py-4 sm:py-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Tipo de Pessoa
                      </label>
                      <select
                        name="tipo_pessoa"
                        value={formData.tipo_pessoa}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="fisica">Pessoa Física</option>
                        <option value="juridica">Pessoa Jurídica</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Nome {formData.tipo_pessoa === 'juridica' ? 'da Empresa' : 'Completo'} *
                      </label>
                      <input
                        type="text"
                        name="nome"
                        required
                        value={formData.nome}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {formData.tipo_pessoa === 'fisica' ? (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          CPF
                        </label>
                        <input
                          type="text"
                          name="cpf"
                          maxLength={14}
                          value={formData.cpf}
                          onChange={handleChange}
                          placeholder="000.000.000-00"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          CNPJ
                        </label>
                        <input
                          type="text"
                          name="cnpj"
                          maxLength={18}
                          value={formData.cnpj}
                          onChange={handleChange}
                          placeholder="00.000.000/0000-00"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="email@exemplo.com"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"
                        style={{borderColor: '#C9C4B5'}}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"
                        style={{borderColor: '#C9C4B5'}}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Telefone Comercial
                      </label>
                      <SelectLinhaTelefonica
                        value={formData.telefone_comercial_id}
                        onChange={(value) => setFormData({ ...formData, telefone_comercial_id: value })}
                        linhaSelecionada={linhaTelefonicaSelecionada}
                        onLinhaSelecionadaChange={setLinhaTelefonicaSelecionada}
                      />
                    </div>

                    <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Setor
                  </label>
                  <input
                    type="text"
                    name="setor"
                    value={formData.setor}
                    onChange={handleChange}
                    placeholder="Digite o setor"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"
                    style={{borderColor: '#C9C4B5'}}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Cargo
                  </label>
                  <input
                    type="text"
                    name="cargo"
                    value={formData.cargo}
                    onChange={handleChange}
                    placeholder="Digite o cargo"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"
                    style={{borderColor: '#C9C4B5'}}
                  />
                </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Empresa
                      </label>
                      <select
                        name="empresa_id"
                        value={formData.empresa_id}
                        onChange={handleChange}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"
                        style={{borderColor: '#C9C4B5'}}
                      >
                        <option value="">Selecione a empresa</option>
                        {empresas.map((empresa) => (
                          <option key={empresa.id} value={empresa.id}>
                            {empresa.razao_social}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"
                        style={{borderColor: '#C9C4B5'}}
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 px-4 py-3 flex flex-col sm:flex-row justify-end gap-2 rounded-b-lg z-10" style={{borderTop: '1px solid #C9C4B5'}}>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border rounded-md hover:bg-gray-50 order-2 sm:order-1"
                    style={{borderColor: '#C9C4B5'}}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-semibold text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                    style={{backgroundColor: '#394353'}}
                  >
                    {loading ? 'Salvando...' : (editingColaborador ? 'Atualizar' : 'Cadastrar')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vincular Itens */}
      {showVincularItens && colaboradorParaVincular && (
        <VincularItens
          colaborador={colaboradorParaVincular}
          isOpen={showVincularItens}
          onClose={() => {
            setShowVincularItens(false)
            setColaboradorParaVincular(null)
          }}
          onSuccess={() => {
            fetchColaboradores()
            setMessage({ type: 'success', text: 'Itens vinculados com sucesso!' })
            setTimeout(() => setMessage(null), 3000)
          }}
        />
      )}

      {/* Modal de Resultado da Importação */}
      {showImportModal && importResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base sm:text-xl font-bold text-gray-800 flex items-center gap-2 pr-2">
                {importResult.success > 0 && importResult.errors.length === 0 ? (
                  <>
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">Importação Concluída com Sucesso!</span>
                    <span className="sm:hidden">Sucesso!</span>
                  </>
                ) : importResult.success > 0 ? (
                  <>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="hidden sm:inline">Importação Concluída com Avisos</span>
                    <span className="sm:hidden">Com Avisos</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">Erro na Importação</span>
                    <span className="sm:hidden">Erro</span>
                  </>
                )}
              </h2>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportResult(null)
                }}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 overflow-y-auto flex-1">
              {/* Resumo */}
              <div className="mb-4 sm:mb-6">
                <div className={`p-3 sm:p-4 rounded-lg ${
                  importResult.success > 0 && importResult.errors.length === 0
                    ? 'bg-green-50 border border-green-200'
                    : importResult.success > 0
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Resumo da Importação</h3>
                      <div className="space-y-1 text-xs sm:text-sm">
                        <p className="text-green-700">
                          <span className="font-medium">✓ Importados:</span> {importResult.success}
                        </p>
                        {importResult.errors.length > 0 && (
                          <p className="text-red-700">
                            <span className="font-medium">✗ Erros:</span> {importResult.errors.length}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de Erros */}
              {importResult.errors.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Detalhes dos Erros
                  </h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 max-h-48 sm:max-h-60 overflow-y-auto">
                    <ul className="space-y-1.5 sm:space-y-2">
                      {importResult.errors.map((erro, index) => (
                        <li key={index} className="text-xs sm:text-sm text-red-700 flex items-start gap-1.5 sm:gap-2">
                          <span className="text-red-500 mt-0.5 flex-shrink-0">•</span>
                          <span className="break-words">{erro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3">
                    💡 Corrija os erros e tente importar novamente.
                  </p>
                </div>
              )}

              {/* Mensagem de Sucesso Total */}
              {importResult.success > 0 && importResult.errors.length === 0 && (
                <div className="text-center py-4 sm:py-6">
                  <svg className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm sm:text-lg text-gray-700 px-4">
                    Todos os colaboradores foram importados com sucesso!
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportResult(null)
                }}
                className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
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