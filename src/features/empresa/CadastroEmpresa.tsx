import React, { useState, useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { Search, Edit, Trash2, Plus, Users, Building, Grid3X3, Mail, Phone, MapPin, FileText } from 'lucide-react'
import { Toast } from '../../shared/components/Toast'


interface Empresa {
  id: number
  codigo: string
  razao_social: string
  nome_fantasia: string
  cnpj: string
  email: string
  telefone: string
  cep: string
  endereco: string
  numero: string
  cidade: string
  estado: string
  observacoes?: string
  created_at?: string
}

interface EnderecoViaCep {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export const CadastroEmpresa: React.FC = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCep, setLoadingCep] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const [showModal, setShowModal] = useState(false)
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Estados para notificações
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)
  
  // Ref para manter a posição do scroll
  const editingRowRef = useRef<string | null>(null)
  
  const [formData, setFormData] = useState({
    codigo: '',
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    email: '',
    telefone: '',
    cep: '',
    endereco: '',
    numero: '',
    cidade: '',
    estado: '',
    observacoes: ''
  })

  // Buscar empresas
  const fetchEmpresas = async () => {
    if (!isSupabaseConfigured) {
      setEmpresas([
        {
          id: 1,
          codigo: 'EMP001',
          razao_social: 'CRESCI E PERDI FRANCHISING LTDA',
          nome_fantasia: 'Cresci e Perdi',
          cnpj: '27.767.670/0001-94',
          email: 'contato@crescieperdi.com.br',
          telefone: '(19) 3608-1234',
          cep: '13720-000',
          endereco: 'Rua das Flores',
          numero: '123',
          cidade: 'São José do Rio Pardo',
          estado: 'SP',
          observacoes: 'Empresa matriz'
        }
      ])
      return
    }

    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('codigo')

      if (error) throw error
      setEmpresas(data || [])
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erro ao carregar empresas: ' + error.message })
    }
  }

  useEffect(() => {
    fetchEmpresas()
  }, [])

  // Formatação de CNPJ
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return value
  }

  // Formatação de CEP
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
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

  // Buscar CEP via API dos Correios
  const buscarCEP = async (cep: string) => {
    const cepNumbers = cep.replace(/\D/g, '')
    if (cepNumbers.length !== 8) return

    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`)
      const data: EnderecoViaCep = await response.json()
      
      if (data.erro) {
        setMessage({ type: 'error', text: 'CEP não encontrado' })
        return
      }

      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro,
        cidade: data.localidade,
        estado: data.uf
      }))
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao buscar CEP' })
    } finally {
      setLoadingCep(false)
    }
  }

  // Gerar próximo código
  const gerarProximoCodigo = () => {
    if (empresas.length === 0) return 'EMP001'
    
    const ultimoCodigo = empresas
      .map(emp => parseInt(emp.codigo.replace('EMP', '')))
      .sort((a, b) => b - a)[0]
    
    return `EMP${String(ultimoCodigo + 1).padStart(3, '0')}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    let formattedValue = value

    if (name === 'cnpj') {
      formattedValue = formatCNPJ(value)
    } else if (name === 'cep') {
      formattedValue = formatCEP(value)
      if (formattedValue.replace(/\D/g, '').length === 8) {
        buscarCEP(formattedValue)
      }
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
      codigo: '',
      razao_social: '',
      nome_fantasia: '',
      cnpj: '',
      email: '',
      telefone: '',
      cep: '',
      endereco: '',
      numero: '',
      cidade: '',
      estado: '',
      observacoes: ''
    })
    setEditingEmpresa(null)
  }

  const openModal = (empresa?: Empresa) => {
    if (empresa) {
      setEditingEmpresa(empresa)
      setFormData({
        codigo: empresa.codigo,
        razao_social: empresa.razao_social,
        nome_fantasia: empresa.nome_fantasia,
        cnpj: empresa.cnpj,
        email: empresa.email,
        telefone: empresa.telefone,
        cep: empresa.cep,
        endereco: empresa.endereco,
        numero: empresa.numero,
        cidade: empresa.cidade,
        estado: empresa.estado,
        observacoes: empresa.observacoes || ''
      })
    } else {
      resetForm()
      setFormData(prev => ({ ...prev, codigo: gerarProximoCodigo() }))
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
      setToast({ 
        message: `Modo Demo: Empresa ${editingEmpresa ? 'atualizada' : 'cadastrada'} com sucesso!`,
        type: 'success'
      })
      setLoading(false)
      closeModal()
      return
    }

    try {
      if (editingEmpresa) {
        // Salvar ID para scroll posterior
        editingRowRef.current = String(editingEmpresa.id)
        
        const { error } = await supabase
          .from('empresas')
          .update(formData)
          .eq('id', editingEmpresa.id)

        if (error) throw error
        setToast({ message: 'Empresa atualizada com sucesso!', type: 'success' })
      } else {
        const { error } = await supabase
          .from('empresas')
          .insert([formData])

        if (error) throw error
        setToast({ message: 'Empresa cadastrada com sucesso!', type: 'success' })
      }

      await fetchEmpresas()
      closeModal()
      
      // Scroll para a linha editada após atualizar a lista
      if (editingRowRef.current) {
        setTimeout(() => {
          const element = document.getElementById(`empresa-${editingRowRef.current}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
          editingRowRef.current = null
        }, 100)
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao salvar empresa', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (empresa: Empresa) => {
    if (!window.confirm(`Deseja realmente excluir a empresa ${empresa.razao_social}?`)) return

    if (!isSupabaseConfigured) {
      setToast({ message: 'Modo Demo: Empresa excluída com sucesso!', type: 'success' })
      return
    }

    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', empresa.id)

      if (error) throw error
      setToast({ message: 'Empresa excluída com sucesso!', type: 'success' })
      fetchEmpresas()
    } catch (error: any) {
      setToast({ message: 'Erro ao excluir empresa: ' + error.message, type: 'error' })
    }
  }

  // Filtrar empresas
  const filteredEmpresas = empresas.filter(empresa =>
    empresa.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empresa.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empresa.cnpj.includes(searchTerm) ||
    empresa.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Building className="w-5 h-5" style={{ color: '#394353' }} />
            Gerenciamento de Empresas
          </h1>
          <p className="text-xs text-gray-600 mt-1">Cadastre e gerencie empresas do sistema</p>
        </div>
        <button
          onClick={() => openModal()}
          style={{ backgroundColor: '#394353' }}
          className="hover:opacity-90 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-all text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-md mb-4 text-sm ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-400' 
            : 'bg-red-100 text-red-700 border border-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filtros e visualização */}
      <div className="bg-white p-3 rounded-lg shadow mb-4" style={{ borderColor: '#C9C4B5' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por razão social, nome fantasia, CNPJ ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-2 focus:border-transparent text-sm"
              style={{ borderColor: '#C9C4B5', focusRingColor: '#394353' }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              style={viewMode === 'list' ? { backgroundColor: '#394353' } : {}}
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-md ${viewMode === 'cards' ? 'text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              style={viewMode === 'cards' ? { backgroundColor: '#394353' } : {}}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de empresas */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y" style={{ borderColor: '#C9C4B5' }}>
              <thead style={{ backgroundColor: '#394353' }}>
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Código</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Razão Social</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Nome Fantasia</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-white uppercase tracking-wider">CNPJ</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Contato</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y" style={{ borderColor: '#C9C4B5' }}>
                {filteredEmpresas.map((empresa) => (
                  <tr key={empresa.id} id={`empresa-${empresa.id}`} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-900">
                      {empresa.codigo}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-900">
                      {empresa.razao_social}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-500">
                      {empresa.nome_fantasia}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-500">
                      {empresa.cnpj}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-500">
                      <div>{empresa.email}</div>
                      <div>{empresa.telefone}</div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(empresa)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(empresa)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmpresas.map((empresa) => (
            <div key={empresa.id} id={`empresa-${empresa.id}`} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow" style={{ borderColor: '#C9C4B5' }}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{empresa.razao_social}</h3>
                  <p className="text-xs text-gray-600">{empresa.nome_fantasia}</p>
                  <p className="text-xs text-gray-500 mt-1">Código: {empresa.codigo}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openModal(empresa)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(empresa)}
                    className="text-red-600 hover:text-red-900"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  <span>CNPJ: {empresa.cnpj}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{empresa.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{empresa.telefone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{empresa.cidade}, {empresa.estado}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredEmpresas.length === 0 && (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Nenhuma empresa encontrada</p>
        </div>
      )}

      {/* Modal de cadastro/edição */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottomWidth: '2px', borderBottomColor: '#C9C4B5' }}>
              <h3 className="text-base font-bold text-gray-900">
                {editingEmpresa ? 'Editar Empresa' : 'Nova Empresa'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    name="codigo"
                    required
                    value={formData.codigo}
                    onChange={handleChange}
                    disabled={!!editingEmpresa}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-100 text-sm"
                    style={{ borderColor: '#C9C4B5' }}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Razão Social *
                  </label>
                  <input
                    type="text"
                    name="razao_social"
                    required
                    value={formData.razao_social}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{ borderColor: '#C9C4B5' }}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    name="nome_fantasia"
                    value={formData.nome_fantasia}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{ borderColor: '#C9C4B5' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
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
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{ borderColor: '#C9C4B5' }}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{ borderColor: '#C9C4B5' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    required
                    value={formData.telefone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{ borderColor: '#C9C4B5' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    CEP *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="cep"
                      required
                      maxLength={9}
                      value={formData.cep}
                      onChange={handleChange}
                      placeholder="00000-000"
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                      style={{ borderColor: '#C9C4B5' }}
                    />
                    {loadingCep && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#394353' }}></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Endereço *
                  </label>
                  <input
                    type="text"
                    name="endereco"
                    required
                    value={formData.endereco}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{ borderColor: '#C9C4B5' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    name="numero"
                    required
                    value={formData.numero}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{ borderColor: '#C9C4B5' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    name="cidade"
                    required
                    value={formData.cidade}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{ borderColor: '#C9C4B5' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Estado *
                  </label>
                  <input
                    type="text"
                    name="estado"
                    required
                    maxLength={2}
                    value={formData.estado}
                    onChange={handleChange}
                    placeholder="SP"
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{ borderColor: '#C9C4B5' }}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    name="observacoes"
                    rows={3}
                    value={formData.observacoes}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{ borderColor: '#C9C4B5' }}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3" style={{ borderTopWidth: '2px', borderTopColor: '#C9C4B5' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2.5 border rounded-md text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-all"
                  style={{ borderColor: '#C9C4B5' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ backgroundColor: '#394353' }}
                  className="px-6 py-2.5 text-white rounded-md hover:opacity-90 disabled:opacity-50 text-sm font-semibold transition-all shadow-sm"
                >
                  {loading ? 'Salvando...' : (editingEmpresa ? 'Atualizar' : 'Cadastrar')}
                </button>
              </div>
            </form>
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