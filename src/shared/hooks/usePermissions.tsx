import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Permissoes {
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
}

const permissoesDefault: Permissoes = {
  cadastro_empresa: false,
  cadastro_colaborador: false,
  cadastro_produtos: false,
  cadastro_clientes: false,
  inventario_itens: false,
  inventario_relatorio: false,
  inventario_linhas: false,
  vendas_listagem: false,
  vendas_nova: false,
  vendas_relatorios: false,
  vendas_parametros: false,
  notas_fiscais_consultar: false,
  notas_fiscais_emitir: false,
  notas_fiscais_parametros: false,
  financeiro_contas_pagar: false,
  financeiro_contas_receber: false,
  financeiro_parametros: false,
  franquias: false,
  tarefas: false,
  documentacao: false,
  configuracoes: false
}

export const usePermissions = () => {
  const { user } = useAuth()
  const [permissoes, setPermissoes] = useState<Permissoes>(permissoesDefault)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPermissoes = async () => {
      if (!user) {
        setPermissoes(permissoesDefault)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('permissoes')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Erro ao buscar permissões:', error)
          // Em caso de erro, usar permissões padrão (sem acesso)
          setPermissoes(permissoesDefault)
          setLoading(false)
          return
        }

        if (data?.permissoes) {
          // Permissões carregadas com sucesso
          setPermissoes({ ...permissoesDefault, ...data.permissoes })
        } else {
          // Usuário sem permissões configuradas - usando padrão
          setPermissoes(permissoesDefault)
        }
      } catch (error) {
        console.error('Erro ao buscar permissões:', error)
        // Em caso de erro, usar permissões padrão (sem acesso)
        setPermissoes(permissoesDefault)
      } finally {
        setLoading(false)
      }
    }

    fetchPermissoes()
  }, [user])

  const hasPermission = (permissao: keyof Permissoes): boolean => {
    return permissoes[permissao] === true
  }

  const hasAnyPermission = (permissoesList: Array<keyof Permissoes>): boolean => {
    return permissoesList.some(p => permissoes[p] === true)
  }

  const hasAllPermissions = (permissoesList: Array<keyof Permissoes>): boolean => {
    return permissoesList.every(p => permissoes[p] === true)
  }

  return {
    permissoes,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  }
}
