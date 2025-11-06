import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Edit, Trash2, UserPlus, Eye, EyeOff } from 'lucide-react'

interface Usuario {
  id: string
  email: string
  nome: string
  cargo: string
  telefone: string
  foto_perfil: string | null
  permissoes: {
    cadastro_empresa: boolean
    cadastro_colaborador: boolean
    inventario_item: boolean
    inventario_relatorio: boolean
    inventario_linhas: boolean
    configuracoes: boolean
  }
  ativo: boolean
  created_at: string
}

export const GerenciarUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    senha: '',
    nome: '',
    cargo: '',
    telefone: '',
    permissoes: {
      cadastro_empresa: false,
      cadastro_colaborador: false,
      inventario_item: false,
      inventario_relatorio: false,
      inventario_linhas: false,
      configuracoes: false
    },
    ativo: true
  })

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsuarios(data || [])
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      alert('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditingId(usuario.id)
      setFormData({
        email: usuario.email,
        senha: '',
        nome: usuario.nome,
        cargo: usuario.cargo,
        telefone: usuario.telefone,
        permissoes: usuario.permissoes,
        ativo: usuario.ativo
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      email: '',
      senha: '',
      nome: '',
      cargo: '',
      telefone: '',
      permissoes: {
        cadastro_empresa: false,
        cadastro_colaborador: false,
        inventario_item: false,
        inventario_relatorio: false,
        inventario_linhas: false,
        configuracoes: false
      },
      ativo: true
    })
    setShowPassword(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email.trim()) {
      alert('E-mail é obrigatório')
      return
    }

    if (!editingId && !formData.senha) {
      alert('Senha é obrigatória para novos usuários')
      return
    }

    try {
      if (editingId) {
        // Atualizar usuário existente
        const updateData: any = {
          nome: formData.nome,
          cargo: formData.cargo,
          telefone: formData.telefone,
          permissoes: formData.permissoes,
          ativo: formData.ativo
        }

        const { error } = await supabase
          .from('usuarios')
          .update(updateData)
          .eq('id', editingId)

        if (error) throw error
        alert('Usuário atualizado com sucesso!')
      } else {
        // Criar novo usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.senha,
        })

        if (authError) throw authError

        if (authData.user) {
          // Inserir dados adicionais na tabela usuarios
          const { error: dbError } = await supabase
            .from('usuarios')
            .insert([{
              id: authData.user.id,
              email: formData.email,
              nome: formData.nome,
              cargo: formData.cargo,
              telefone: formData.telefone,
              permissoes: formData.permissoes,
              ativo: formData.ativo
            }])

          if (dbError) throw dbError
        }

        alert('Usuário criado com sucesso! Um e-mail de confirmação foi enviado.')
      }

      setShowModal(false)
      resetForm()
      fetchUsuarios()
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error)
      alert(`Erro ao salvar usuário: ${error.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja desativar este usuário?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: false })
        .eq('id', id)

      if (error) throw error
      alert('Usuário desativado com sucesso!')
      fetchUsuarios()
    } catch (error: any) {
      console.error('Erro ao desativar usuário:', error)
      alert(`Erro ao desativar usuário: ${error.message}`)
    }
  }

  const handleTogglePermissao = (permissao: keyof typeof formData.permissoes) => {
    setFormData({
      ...formData,
      permissoes: {
        ...formData.permissoes,
        [permissao]: !formData.permissoes[permissao]
      }
    })
  }

  const permissoesModulos = [
    { key: 'cadastro_empresa' as const, label: 'Cadastro de Empresa' },
    { key: 'cadastro_colaborador' as const, label: 'Cadastro de Colaborador' },
    { key: 'inventario_item' as const, label: 'Inventário - Itens' },
    { key: 'inventario_relatorio' as const, label: 'Inventário - Relatórios' },
    { key: 'inventario_linhas' as const, label: 'Inventário - Linhas Telefônicas' },
    { key: 'configuracoes' as const, label: 'Configurações do Sistema' }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Cabeçalho com botão */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Gerenciar Usuários</h2>
          <p className="text-sm text-gray-600 mt-1">
            {usuarios.filter(u => u.ativo).length} usuários ativos
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Novo Usuário
        </button>
      </div>

      {/* Tabela de Usuários */}
      {usuarios.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg font-medium">Nenhum usuário cadastrado</p>
          <p className="text-gray-400 text-sm mt-1">Clique em "Novo Usuário" para começar</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  E-mail
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {usuario.foto_perfil ? (
                          <img className="h-10 w-10 rounded-full object-cover" src={usuario.foto_perfil} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="text-slate-600 font-medium text-sm">
                              {usuario.nome?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{usuario.nome || 'Sem nome'}</div>
                        <div className="text-sm text-gray-500">{usuario.telefone || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {usuario.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {usuario.cargo || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      usuario.ativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openModal(usuario)}
                        className="text-slate-600 hover:text-slate-900"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      {usuario.ativo && (
                        <button
                          onClick={() => handleDelete(usuario.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Desativar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-gray-200 sticky top-0 rounded-t-lg">
              <h3 className="text-lg font-medium text-gray-900">
                {editingId ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados Básicos */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Dados do Usuário</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        E-mail <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!!editingId}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-gray-100"
                        required
                      />
                    </div>

                    {!editingId && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Senha <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.senha}
                            onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Cargo
                      </label>
                      <input
                        type="text"
                        value={formData.cargo}
                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                        placeholder="Ex: Administrador, Gerente"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Telefone
                      </label>
                      <input
                        type="text"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="(XX) XXXXX-XXXX"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Status
                      </label>
                      <select
                        value={formData.ativo ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, ativo: e.target.value === 'true' })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
                      >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Permissões */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Permissões de Acesso</h4>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {permissoesModulos.map((modulo) => (
                        <label key={modulo.key} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.permissoes[modulo.key]}
                            onChange={() => handleTogglePermissao(modulo.key)}
                            className="w-4 h-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                          />
                          <span className="ml-3 text-sm text-gray-700">{modulo.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Selecione os módulos que o usuário terá permissão para acessar
                  </p>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 rounded-b-lg">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                {editingId ? 'Atualizar' : 'Criar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
