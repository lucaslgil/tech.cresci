import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface LinhaTelefonica {
  id: string
  responsavel_id: string | null
  responsavel_nome?: string
  numero_linha: string
  tipo: 'eSIM' | 'Chip Físico'
  plano: string
  valor_plano: number
  created_at?: string
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
  
  const [formData, setFormData] = useState<Omit<LinhaTelefonica, 'id' | 'created_at' | 'responsavel_nome'>>({
    responsavel_id: null,
    numero_linha: '',
    tipo: 'Chip Físico',
    plano: '',
    valor_plano: 0
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
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const linhasFormatadas = data?.map((linha: any) => ({
        ...linha,
        responsavel_nome: linha.colaboradores?.nome || 'Sem responsável'
      })) || []

      setLinhas(linhasFormatadas)
    } catch (error) {
      console.error('Erro ao buscar linhas:', error)
      alert('Erro ao carregar linhas telefônicas')
    } finally {
      setLoading(false)
    }
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
        plano: linha.plano,
        valor_plano: linha.valor_plano
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
      plano: '',
      valor_plano: 0
    })
    setSearchResponsavel('')
    setResponsavelSelecionado(null)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!formData.numero_linha.trim()) {
      alert('Número da linha é obrigatório')
      return
    }

    if (!formData.plano.trim()) {
      alert('Plano é obrigatório')
      return
    }

    if (formData.valor_plano < 0) {
      alert('Valor do plano não pode ser negativo')
      return
    }

    try {
      if (editingId) {
        // Atualizar
        const { error } = await supabase
          .from('linhas_telefonicas')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
        alert('Linha telefônica atualizada com sucesso!')
      } else {
        // Criar
        const { error } = await supabase
          .from('linhas_telefonicas')
          .insert([formData])

        if (error) throw error
        alert('Linha telefônica cadastrada com sucesso!')
      }

      setShowModal(false)
      resetForm()
      fetchLinhas()
    } catch (error: any) {
      console.error('Erro ao salvar linha:', error)
      alert(`Erro ao salvar linha telefônica: ${error.message}`)
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
      
      alert('Linha telefônica excluída com sucesso!')
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Linhas Telefônicas</h1>
          <p className="text-gray-600 mt-1">Gerencie as linhas telefônicas da empresa</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Linha
        </button>
      </div>

      {/* Lista de Linhas */}
      {linhas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-lg">Nenhuma linha telefônica cadastrada</p>
          <p className="text-gray-400 text-sm mt-1">Clique em "Nova Linha" para começar</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {linhas.map((linha) => (
                <tr key={linha.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatarNumero(linha.numero_linha)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      linha.tipo === 'eSIM' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {linha.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {linha.responsavel_nome || 'Sem responsável'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {linha.plano}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatarValor(linha.valor_plano)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(linha)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(linha.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                    Tipo <span className="text-red-500">*</span>
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

                {/* Plano */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Plano <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.plano}
                    onChange={(e) => setFormData({ ...formData, plano: e.target.value })}
                    placeholder="Ex: Plano Controle 20GB"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Valor do Plano */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Valor do Plano <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_plano}
                    onChange={(e) => setFormData({ ...formData, valor_plano: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
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
    </div>
  )
}
