import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Edit, Trash2, CheckCircle, Clock, AlertCircle, LayoutList, LayoutGrid, Plus, UserPlus } from 'lucide-react'
import { Toast } from '../../shared/components/Toast'

interface Tarefa {
  id: string
  titulo: string
  descricao: string | null
  solicitante: string
  email_solicitante: string | null
  categoria: string | null
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Urgente'
  status: 'Aberto' | 'Em Andamento' | 'Aguardando' | 'Concluído' | 'Cancelado'
  responsavel_id: string | null
  responsavel_nome?: string
  data_abertura: string
  data_conclusao: string | null
  observacoes: string | null
  created_at: string
}

interface Colaborador {
  id: string
  nome: string
}

export const GerenciamentoTarefas: React.FC = () => {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  
  // Estados para toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)
  const editingRowRef = useRef<string | null>(null)

  // Estados para filtros
  const [filterStatus, setFilterStatus] = useState<string>('Todos')
  const [filterPrioridade, setFilterPrioridade] = useState<string>('Todas')
  const [filterCategoria, setFilterCategoria] = useState<string>('Todas')
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    solicitante: '',
    email_solicitante: '',
    categoria: '',
    prioridade: 'Média' as 'Baixa' | 'Média' | 'Alta' | 'Urgente',
    status: 'Aberto' as 'Aberto' | 'Em Andamento' | 'Aguardando' | 'Concluído' | 'Cancelado',
    responsavel_id: null as string | null,
    observacoes: ''
  })

  useEffect(() => {
    fetchTarefas()
    fetchColaboradores()
  }, [])

  const fetchTarefas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tarefas')
        .select(`
          *,
          colaboradores:responsavel_id (
            id,
            nome
          )
        `)
        .order('data_abertura', { ascending: false })

      if (error) throw error

      const tarefasFormatadas = data?.map((tarefa: any) => ({
        ...tarefa,
        responsavel_nome: tarefa.colaboradores?.nome || ''
      })) || []

      setTarefas(tarefasFormatadas)
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
      setToast({ message: 'Erro ao carregar tarefas', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const fetchColaboradores = async () => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('id, nome')
        .order('nome')

      if (error) throw error
      setColaboradores(data || [])
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.titulo.trim()) {
      setToast({ message: 'Título é obrigatório', type: 'warning' })
      return
    }

    if (!formData.solicitante.trim()) {
      setToast({ message: 'Solicitante é obrigatório', type: 'warning' })
      return
    }

    try {
      setLoading(true)

      const dataToSave = {
        ...formData,
        data_conclusao: formData.status === 'Concluído' ? new Date().toISOString() : null
      }

      if (editingId) {
        editingRowRef.current = editingId
        
        const { error } = await supabase
          .from('tarefas')
          .update(dataToSave)
          .eq('id', editingId)

        if (error) throw error
        setToast({ message: 'Tarefa atualizada com sucesso!', type: 'success' })
      } else {
        const { error } = await supabase
          .from('tarefas')
          .insert([dataToSave])

        if (error) throw error
        setToast({ message: 'Tarefa criada com sucesso!', type: 'success' })
      }

      await fetchTarefas()
      setShowModal(false)
      resetForm()

      // Scroll para a linha editada
      if (editingRowRef.current) {
        setTimeout(() => {
          const element = document.getElementById(`tarefa-${editingRowRef.current}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
          editingRowRef.current = null
        }, 100)
      }
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error)
      setToast({ message: 'Erro ao salvar tarefa', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('tarefas')
        .delete()
        .eq('id', id)

      if (error) throw error

      setToast({ message: 'Tarefa excluída com sucesso!', type: 'success' })
      await fetchTarefas()
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
      setToast({ message: 'Erro ao excluir tarefa', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const openModal = (tarefa?: Tarefa) => {
    if (tarefa) {
      setEditingId(tarefa.id)
      setFormData({
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || '',
        solicitante: tarefa.solicitante,
        email_solicitante: tarefa.email_solicitante || '',
        categoria: tarefa.categoria || '',
        prioridade: tarefa.prioridade,
        status: tarefa.status,
        responsavel_id: tarefa.responsavel_id,
        observacoes: tarefa.observacoes || ''
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      titulo: '',
      descricao: '',
      solicitante: '',
      email_solicitante: '',
      categoria: '',
      prioridade: 'Média',
      status: 'Aberto',
      responsavel_id: null,
      observacoes: ''
    })
  }

  // Filtrar tarefas
  const tarefasFiltradas = tarefas.filter(tarefa => {
    const matchSearch = searchTerm === '' || 
      tarefa.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tarefa.solicitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tarefa.descricao && tarefa.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchStatus = filterStatus === 'Todos' || tarefa.status === filterStatus
    const matchPrioridade = filterPrioridade === 'Todas' || tarefa.prioridade === filterPrioridade
    const matchCategoria = filterCategoria === 'Todas' || tarefa.categoria === filterCategoria

    return matchSearch && matchStatus && matchPrioridade && matchCategoria
  })

  // Métricas do dashboard
  const totalTarefas = tarefas.length
  const tarefasAbertas = tarefas.filter(t => t.status === 'Aberto').length
  const tarefasEmAndamento = tarefas.filter(t => t.status === 'Em Andamento').length
  const tarefasConcluidas = tarefas.filter(t => t.status === 'Concluído').length

  // Agrupar tarefas por status para Kanban
  const tarefasPorStatus = {
    'Aberto': tarefasFiltradas.filter(t => t.status === 'Aberto'),
    'Em Andamento': tarefasFiltradas.filter(t => t.status === 'Em Andamento'),
    'Concluído': tarefasFiltradas.filter(t => t.status === 'Concluído')
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'Urgente': return 'bg-red-100 text-red-800'
      case 'Alta': return 'bg-orange-100 text-orange-800'
      case 'Média': return 'bg-yellow-100 text-yellow-800'
      case 'Baixa': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aberto': return 'bg-blue-100 text-blue-800'
      case 'Em Andamento': return 'bg-purple-100 text-purple-800'
      case 'Aguardando': return 'bg-yellow-100 text-yellow-800'
      case 'Concluído': return 'bg-green-100 text-green-800'
      case 'Cancelado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const categorias = Array.from(new Set(tarefas.map(t => t.categoria).filter(Boolean))) as string[]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Tarefas</h1>
        <p className="text-sm text-gray-600 mt-1">Gerencie todos os chamados e atendimentos</p>
      </div>

      {/* Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-slate-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Tarefas</p>
              <p className="text-3xl font-bold text-slate-700 mt-2">{totalTarefas}</p>
            </div>
            <LayoutList className="w-10 h-10 text-slate-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Abertas</p>
              <p className="text-3xl font-bold text-blue-700 mt-2">{tarefasAbertas}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Em Andamento</p>
              <p className="text-3xl font-bold text-purple-700 mt-2">{tarefasEmAndamento}</p>
            </div>
            <Clock className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Concluídas</p>
              <p className="text-3xl font-bold text-green-700 mt-2">{tarefasConcluidas}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todos Status</option>
              <option value="Aberto">Aberto</option>
              <option value="Em Andamento">Em Andamento</option>
              <option value="Aguardando">Aguardando</option>
              <option value="Concluído">Concluído</option>
              <option value="Cancelado">Cancelado</option>
            </select>

            <select
              value={filterPrioridade}
              onChange={(e) => setFilterPrioridade(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todas">Todas Prioridades</option>
              <option value="Urgente">Urgente</option>
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
            </select>

            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todas">Todas Categorias</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'kanban' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => window.open('/nova-solicitacao', '_blank')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
              title="Abrir formulário público em nova aba"
            >
              <UserPlus className="w-4 h-4" />
              Nova Solicitação
            </button>

            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nova Tarefa
            </button>
          </div>
        </div>
      </div>

      {/* Visualização em Lista */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Solicitante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Prioridade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Responsável</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Data Abertura</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tarefasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma tarefa encontrada
                    </td>
                  </tr>
                ) : (
                  tarefasFiltradas.map((tarefa) => (
                    <tr key={tarefa.id} id={`tarefa-${tarefa.id}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{tarefa.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="font-medium">{tarefa.titulo}</div>
                        {tarefa.descricao && (
                          <div className="text-xs text-gray-500 truncate">{tarefa.descricao}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {tarefa.solicitante}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {tarefa.categoria || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPrioridadeColor(tarefa.prioridade)}`}>
                          {tarefa.prioridade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tarefa.status)}`}>
                          {tarefa.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {tarefa.responsavel_nome || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatData(tarefa.data_abertura)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => openModal(tarefa)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tarefa.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}

      {/* Visualização Kanban */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(tarefasPorStatus).map(([status, tarefasStatus]) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{status}</h3>
                <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                  {tarefasStatus.length}
                </span>
              </div>
              <div className="space-y-3">
                {tarefasStatus.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-8">
                    Nenhuma tarefa
                  </div>
                ) : (
                  tarefasStatus.map((tarefa) => (
                    <div
                      key={tarefa.id}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4"
                      style={{
                        borderLeftColor: 
                          tarefa.prioridade === 'Urgente' ? '#ef4444' :
                          tarefa.prioridade === 'Alta' ? '#f97316' :
                          tarefa.prioridade === 'Média' ? '#eab308' : '#22c55e'
                      }}
                      onClick={() => openModal(tarefa)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm text-gray-900">{tarefa.titulo}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPrioridadeColor(tarefa.prioridade)}`}>
                          {tarefa.prioridade}
                        </span>
                      </div>
                      {tarefa.descricao && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{tarefa.descricao}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{tarefa.solicitante}</span>
                        <span>{formatData(tarefa.data_abertura)}</span>
                      </div>
                      {tarefa.responsavel_nome && (
                        <div className="mt-2 text-xs text-gray-600">
                          👤 {tarefa.responsavel_nome}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edição/Criação */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Solicitante *
                  </label>
                  <input
                    type="text"
                    value={formData.solicitante}
                    onChange={(e) => setFormData({ ...formData, solicitante: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email do Solicitante
                  </label>
                  <input
                    type="email"
                    value={formData.email_solicitante}
                    onChange={(e) => setFormData({ ...formData, email_solicitante: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ex: TI, RH, Manutenção"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade *
                  </label>
                  <select
                    value={formData.prioridade}
                    onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Aberto">Aberto</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Aguardando">Aguardando</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Responsável
                  </label>
                  <select
                    value={formData.responsavel_id || ''}
                    onChange={(e) => setFormData({ ...formData, responsavel_id: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sem responsável</option>
                    {colaboradores.map((colab) => (
                      <option key={colab.id} value={colab.id}>
                        {colab.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
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
