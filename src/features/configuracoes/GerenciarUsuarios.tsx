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
    // Cadastros
    cadastro_empresa: boolean
    cadastro_colaborador: boolean
    cadastro_produtos: boolean
    cadastro_clientes: boolean
    // Inventário
    inventario_itens: boolean
    inventario_relatorio: boolean
    inventario_linhas: boolean
    // Vendas
    vendas_listagem: boolean
    vendas_nova: boolean
    vendas_relatorios: boolean
    vendas_parametros: boolean
    // Notas Fiscais
    notas_fiscais_consultar: boolean
    notas_fiscais_emitir: boolean
    notas_fiscais_parametros: boolean
    // Financeiro
    financeiro_contas_pagar: boolean
    financeiro_contas_receber: boolean
    financeiro_parametros: boolean
    // Outros
    franquias: boolean
    tarefas: boolean
    documentacao: boolean
    configuracoes: boolean
    movimentacoes_caixa_visualizar: boolean
  }
  ativo: boolean
  created_at: string
}

interface Empresa {
  id: number
  codigo: string
  razao_social: string
  nome_fantasia: string
}

export const GerenciarUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresasSelecionadas, setEmpresasSelecionadas] = useState<number[]>([])
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
      // Cadastros
      cadastro_empresa: false,
      cadastro_colaborador: false,
      cadastro_produtos: false,
      cadastro_clientes: false,
      // Inventário
      inventario_itens: false,
      inventario_relatorio: false,
      inventario_linhas: false,
      // Vendas
      vendas_listagem: false,
      vendas_nova: false,
      vendas_relatorios: false,
      vendas_parametros: false,
      // Notas Fiscais
      notas_fiscais_consultar: false,
      notas_fiscais_emitir: false,
      notas_fiscais_parametros: false,
      // Financeiro
      financeiro_contas_pagar: false,
      financeiro_contas_receber: false,
      financeiro_parametros: false,
      // Outros
      franquias: false,
      tarefas: false,
      documentacao: false,
      configuracoes: false
      ,movimentacoes_caixa_visualizar: false
    },
    ativo: true
  })

  useEffect(() => {
    fetchUsuarios()
    fetchEmpresas()
  }, [])

  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, codigo, razao_social, nome_fantasia')
        .order('nome_fantasia')

      if (error) throw error
      setEmpresas(data || [])
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
    }
  }

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

  const openModal = async (usuario?: Usuario) => {
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
      
      // Buscar empresas do usuário
      try {
        const { data, error } = await supabase
          .from('users_empresas')
          .select('empresa_id')
          .eq('user_id', usuario.id)
        
        if (error) throw error
        setEmpresasSelecionadas(data?.map(e => e.empresa_id) || [])
      } catch (error) {
        console.error('Erro ao buscar empresas do usuário:', error)
        setEmpresasSelecionadas([])
      }
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
        // Cadastros
        cadastro_empresa: false,
        cadastro_colaborador: false,
        cadastro_produtos: false,
        cadastro_clientes: false,
        // Inventário
        inventario_itens: false,
        inventario_relatorio: false,
        inventario_linhas: false,
        // Vendas
        vendas_listagem: false,
        vendas_nova: false,
        vendas_relatorios: false,
        vendas_parametros: false,
        // Notas Fiscais
        notas_fiscais_consultar: false,
        notas_fiscais_emitir: false,
        notas_fiscais_parametros: false,
        // Financeiro
        financeiro_contas_pagar: false,
        financeiro_contas_receber: false,
        financeiro_parametros: false,
        // Outros
        franquias: false,
        tarefas: false,
        documentacao: false,
        configuracoes: false,
        movimentacoes_caixa_visualizar: false
      },
      ativo: true
    })
    setEmpresasSelecionadas([])
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

    if (empresasSelecionadas.length === 0) {
      alert('Selecione pelo menos uma empresa para o usuário')
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

        // Atualizar vínculos com empresas
        // 1. Remover vínculos antigos
        await supabase
          .from('users_empresas')
          .delete()
          .eq('user_id', editingId)

        // 2. Inserir novos vínculos
        const vinculos = empresasSelecionadas.map(empresa_id => ({
          user_id: editingId,
          empresa_id
        }))

        const { error: vinculoError } = await supabase
          .from('users_empresas')
          .insert(vinculos)

        if (vinculoError) throw vinculoError

        alert('Usuário atualizado com sucesso!')
      } else {
        // Criar novo usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.senha,
        })

        if (authError) throw authError

        if (authData.user) {
          // Aguardar um pouco para o trigger criar o registro
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Atualizar dados adicionais (o trigger já criou o registro básico)
          const { error: dbError } = await supabase
            .from('usuarios')
            .update({
              nome: formData.nome,
              cargo: formData.cargo,
              telefone: formData.telefone,
              permissoes: formData.permissoes,
              ativo: formData.ativo
            })
            .eq('id', authData.user.id)

          if (dbError) throw dbError

          // Criar vínculos com empresas
          const vinculos = empresasSelecionadas.map(empresa_id => ({
            user_id: authData.user!.id,
            empresa_id
          }))

          const { error: vinculoError } = await supabase
            .from('users_empresas')
            .insert(vinculos)

          if (vinculoError) throw vinculoError
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
    // CADASTROS
    { key: 'cadastro_empresa' as const, label: 'Cadastro de Empresa', grupo: 'Cadastros' },
    { key: 'cadastro_colaborador' as const, label: 'Cadastro de Colaborador', grupo: 'Cadastros' },
    { key: 'cadastro_produtos' as const, label: 'Cadastro de Produtos', grupo: 'Cadastros' },
    { key: 'cadastro_clientes' as const, label: 'Cadastro de Clientes', grupo: 'Cadastros' },
    
    // INVENTÁRIO
    { key: 'inventario_itens' as const, label: 'Inventário - Itens', grupo: 'Inventário' },
    { key: 'inventario_relatorio' as const, label: 'Inventário - Relatórios', grupo: 'Inventário' },
    { key: 'inventario_linhas' as const, label: 'Inventário - Linhas Telefônicas', grupo: 'Inventário' },
    
    // VENDAS
    { key: 'vendas_listagem' as const, label: 'Vendas - Listagem', grupo: 'Vendas' },
    { key: 'vendas_nova' as const, label: 'Vendas - Nova Venda', grupo: 'Vendas' },
    { key: 'vendas_relatorios' as const, label: 'Vendas - Relatórios', grupo: 'Vendas' },
    { key: 'vendas_parametros' as const, label: 'Vendas - Parâmetros de Vendas', grupo: 'Vendas' },
    
    // NOTAS FISCAIS
    { key: 'notas_fiscais_consultar' as const, label: 'Consultar Notas Fiscais', grupo: 'Notas Fiscais' },
    { key: 'notas_fiscais_emitir' as const, label: 'Emitir Nota Fiscal', grupo: 'Notas Fiscais' },
    { key: 'notas_fiscais_parametros' as const, label: 'Parâmetros Fiscais', grupo: 'Notas Fiscais' },
    
    // FINANCEIRO
    { key: 'financeiro_contas_pagar' as const, label: 'Contas a Pagar', grupo: 'Financeiro' },
    { key: 'financeiro_contas_receber' as const, label: 'Contas a Receber', grupo: 'Financeiro' },
    { key: 'financeiro_parametros' as const, label: 'Parâmetros Financeiros', grupo: 'Financeiro' },
    
    // OUTROS
    { key: 'franquias' as const, label: 'Franquias', grupo: 'Outros' },
    { key: 'tarefas' as const, label: 'Tarefas', grupo: 'Outros' },
    { key: 'documentacao' as const, label: 'Documentação', grupo: 'Outros' },
    { key: 'configuracoes' as const, label: 'Configurações do Sistema', grupo: 'Outros' }
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

                {/* Empresas com Acesso */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">
                    Empresas com Acesso <span className="text-red-500">*</span>
                  </h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                    <p className="text-xs text-blue-800">
                      <span className="font-semibold">💡 Dica:</span> Selecione as empresas que o usuário poderá acessar. 
                      Se tiver acesso a múltiplas empresas, o PDV perguntará qual usar no momento do login.
                    </p>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto bg-slate-50 rounded-lg p-4">
                    {empresas.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Nenhuma empresa cadastrada
                      </p>
                    ) : (
                      <>
                        {/* Botões Selecionar Todas / Nenhuma */}
                        <div className="flex gap-2 mb-2 pb-2 border-b border-gray-200">
                          <button
                            type="button"
                            onClick={() => setEmpresasSelecionadas(empresas.map(e => e.id))}
                            className="text-xs px-3 py-1 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors"
                          >
                            Selecionar Todas
                          </button>
                          <button
                            type="button"
                            onClick={() => setEmpresasSelecionadas([])}
                            className="text-xs px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
                          >
                            Desmarcar Todas
                          </button>
                          <span className="text-xs text-gray-600 ml-auto self-center">
                            {empresasSelecionadas.length} de {empresas.length} selecionadas
                          </span>
                        </div>

                        {/* Lista de Empresas */}
                        {empresas.map((empresa) => (
                          <label
                            key={empresa.id}
                            className={`flex items-start p-3 rounded-md cursor-pointer transition-all ${
                              empresasSelecionadas.includes(empresa.id)
                                ? 'bg-slate-100 border-2 border-slate-500'
                                : 'bg-white border-2 border-gray-200 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={empresasSelecionadas.includes(empresa.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEmpresasSelecionadas([...empresasSelecionadas, empresa.id])
                                } else {
                                  setEmpresasSelecionadas(empresasSelecionadas.filter(id => id !== empresa.id))
                                }
                              }}
                              className="w-5 h-5 text-slate-600 focus:ring-slate-500 border-gray-300 rounded mt-0.5"
                            />
                            <div className="ml-3 flex-1">
                              <span className="text-sm font-medium text-gray-900">
                                {empresa.nome_fantasia || empresa.razao_social}
                              </span>
                              <p className="text-xs text-gray-600 mt-0.5">
                                Código: {empresa.codigo}
                              </p>
                            </div>
                          </label>
                        ))}
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {empresasSelecionadas.length === 0 && (
                      <span className="text-red-600 font-medium">
                        ⚠️ Selecione pelo menos uma empresa
                      </span>
                    )}
                    {empresasSelecionadas.length === 1 && (
                      <span className="text-green-600">
                        ✓ Usuário terá acesso apenas à empresa selecionada
                      </span>
                    )}
                    {empresasSelecionadas.length > 1 && empresasSelecionadas.length < empresas.length && (
                      <span className="text-blue-600">
                        ✓ Usuário terá acesso a {empresasSelecionadas.length} empresas. No PDV, deverá escolher uma delas.
                      </span>
                    )}
                    {empresasSelecionadas.length === empresas.length && empresas.length > 1 && (
                      <span className="text-purple-600">
                        ✓ Usuário terá acesso a TODAS as empresas do sistema
                      </span>
                    )}
                  </p>
                </div>

                {/* Permissões */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Permissões de Acesso</h4>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="space-y-4">
                      {/* Agrupar permissões por categoria */}
                      {['Cadastros', 'Inventário', 'Vendas', 'Notas Fiscais', 'Financeiro', 'Outros'].map((grupo) => {
                        const permissoesDoGrupo = permissoesModulos.filter(m => m.grupo === grupo)
                        return (
                          <div key={grupo}>
                            <h5 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                              {grupo}
                            </h5>
                            <div className="space-y-2 ml-1">
                              {permissoesDoGrupo.map((modulo) => (
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
                        )
                      })}
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
