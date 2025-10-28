import React, { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { Search, Edit, Trash2, Plus, Users, Grid3X3, Mail, Phone, FileText, Building, Package } from 'lucide-react'
import { SelectWithManagement } from '../../shared/components/SelectWithManagement'
import VincularItens from './VincularItens'

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
    status: 'Ativo'
  })

  const [setores, setSetores] = useState<string[]>([])
  const [cargos, setCargos] = useState<string[]>([])

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
          created_at,
          empresas:empresa_id (razao_social)
        `)
        .order('nome')

      if (error) throw error
      
      setColaboradores((data || []).map(item => ({
        ...item,
        status: item.status || 'Ativo',
        empresas: Array.isArray(item.empresas) ? item.empresas[0] : item.empresas
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

  // Função para adicionar setor
  const adicionarSetor = async (nomeSetor: string) => {
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

  // Função para remover setor
  const removerSetor = async (nomeSetor: string) => {
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

  // Função para adicionar cargo
  const adicionarCargo = async (nomeCargo: string) => {
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

  // Função para remover cargo
  const removerCargo = async (nomeCargo: string) => {
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
      status: 'Ativo'
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
        status: colaborador.status || 'Ativo'
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!isSupabaseConfigured) {
      setMessage({ 
        type: 'success', 
        text: `Modo Demo: Colaborador ${editingColaborador ? 'atualizado' : 'cadastrado'} com sucesso!` 
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
        const { error } = await supabase
          .from('colaboradores')
          .update(dataToSave)
          .eq('id', editingColaborador.id)

        if (error) throw error
        setMessage({ type: 'success', text: 'Colaborador atualizado com sucesso!' })
      } else {
        const { error } = await supabase
          .from('colaboradores')
          .insert([dataToSave])

        if (error) throw error
        setMessage({ type: 'success', text: 'Colaborador cadastrado com sucesso!' })
      }

      fetchColaboradores()
      closeModal()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar colaborador' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (colaborador: Colaborador) => {
    if (!window.confirm(`Deseja realmente excluir o colaborador ${colaborador.nome}?`)) return

    if (!isSupabaseConfigured) {
      setMessage({ type: 'success', text: 'Modo Demo: Colaborador excluído com sucesso!' })
      return
    }

    try {
      const { error } = await supabase
        .from('colaboradores')
        .delete()
        .eq('id', colaborador.id)

      if (error) throw error
      setMessage({ type: 'success', text: 'Colaborador excluído com sucesso!' })
      fetchColaboradores()
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erro ao excluir colaborador: ' + error.message })
    }
  }

  // Filtrar colaboradores
  const filteredColaboradores = colaboradores.filter(colaborador =>
    colaborador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    colaborador.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    colaborador.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    colaborador.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (colaborador.cpf && colaborador.cpf.includes(searchTerm)) ||
    (colaborador.cnpj && colaborador.cnpj.includes(searchTerm)) ||
    (colaborador.empresas?.razao_social && colaborador.empresas.razao_social.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loadingColaboradores || loadingEmpresas) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            Gestão de Colaboradores
          </h1>
          <p className="text-gray-600 mt-1">{colaboradores.length} colaboradores cadastrados</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Colaborador
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-md mb-6 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-400' 
            : 'bg-red-100 text-red-700 border border-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filtros e visualização */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Pesquisar por nome, email, CPF/CNPJ, setor, cargo ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg ${viewMode === 'cards' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de colaboradores */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Setor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredColaboradores.map((colaborador) => (
                  <tr key={colaborador.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {colaborador.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {colaborador.cpf || colaborador.cnpj || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {colaborador.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {colaborador.telefone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {colaborador.setor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {colaborador.cargo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {colaborador.empresas?.razao_social || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        colaborador.status === 'Ativo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {colaborador.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredColaboradores.map((colaborador) => (
            <div key={colaborador.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{colaborador.nome}</h3>
                  <p className="text-sm text-gray-600">{colaborador.cargo}</p>
                  <p className="text-xs text-gray-500 mt-1">{colaborador.setor}</p>
                </div>
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
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span>{colaborador.cpf || colaborador.cnpj || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{colaborador.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{colaborador.telefone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{colaborador.empresas?.razao_social || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredColaboradores.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum colaborador encontrado</p>
        </div>
      )}

      {/* Modal de cadastro/edição */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingColaborador ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Pessoa *
                  </label>
                  <select
                    name="tipo_pessoa"
                    required
                    value={formData.tipo_pessoa}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="fisica">Pessoa Física</option>
                    <option value="juridica">Pessoa Jurídica</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome {formData.tipo_pessoa === 'juridica' ? 'da Empresa' : 'Completo'} *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    required
                    value={formData.nome}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {formData.tipo_pessoa === 'fisica' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CPF *
                    </label>
                    <input
                      type="text"
                      name="cpf"
                      required
                      maxLength={14}
                      value={formData.cpf}
                      onChange={handleChange}
                      placeholder="000.000.000-00"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CNPJ *
                    </label>
                    <input
                      type="text"
                      name="cnpj"
                      required
                      maxLength={18}
                      value={formData.cnpj}
                      onChange={handleChange}
                      placeholder="00.000.000/0000-00"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    required
                    value={formData.telefone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <SelectWithManagement
                  label="Setor"
                  name="setor"
                  value={formData.setor}
                  options={setores}
                  onAddOption={adicionarSetor}
                  onRemoveOption={removerSetor}
                  onChange={handleChange}
                  placeholder="Selecione o setor"
                  required
                />

                <SelectWithManagement
                  label="Cargo"
                  name="cargo"
                  value={formData.cargo}
                  options={cargos}
                  onAddOption={adicionarCargo}
                  onRemoveOption={removerCargo}
                  onChange={handleChange}
                  placeholder="Selecione o cargo"
                  required
                />

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa *
                  </label>
                  <select
                    name="empresa_id"
                    required
                    value={formData.empresa_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : (editingColaborador ? 'Atualizar' : 'Cadastrar')}
                </button>
              </div>
            </form>
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
    </div>
  )
}