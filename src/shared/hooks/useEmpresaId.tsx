import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../context/AuthContext'

/**
 * Hook para obter o empresa_id do usuário logado
 * Útil para incluir em todas as operações que precisam de isolamento multi-tenant
 * 
 * @returns {empresaId: number | null, loading: boolean, error: string | null}
 * 
 * @example
 * const { empresaId, loading } = useEmpresaId()
 * 
 * if (loading) return <div>Carregando...</div>
 * 
 * await supabase.from('clientes').insert({
 *   nome: 'Cliente Teste',
 *   empresa_id: empresaId // ✅ OBRIGATÓRIO
 * })
 */
export const useEmpresaId = () => {
  const { user } = useAuth()
  const [empresaId, setEmpresaId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEmpresaId = async () => {
      if (!user) {
        setEmpresaId(null)
        setLoading(false)
        setError('Usuário não autenticado')
        return
      }

      try {
        setLoading(true)
        setError(null)

        const { data, error: supabaseError } = await supabase
          .from('usuarios')
          .select('empresa_id')
          .eq('id', user.id)
          .single()

        if (supabaseError) {
          console.error('Erro ao buscar empresa_id:', supabaseError)
          setError('Erro ao buscar empresa do usuário')
          setEmpresaId(null)
          return
        }

        if (!data?.empresa_id) {
          console.error('Usuário sem empresa_id configurado')
          setError('Usuário não vinculado a nenhuma empresa')
          setEmpresaId(null)
          return
        }

        setEmpresaId(data.empresa_id)
      } catch (err) {
        console.error('Erro inesperado ao buscar empresa_id:', err)
        setError('Erro inesperado ao buscar empresa')
        setEmpresaId(null)
      } finally {
        setLoading(false)
      }
    }

    fetchEmpresaId()
  }, [user])

  return {
    empresaId,
    loading,
    error,
    /**
     * Retorna o empresaId ou lança erro se não estiver disponível
     * Útil para garantir que empresa_id sempre esteja presente
     */
    requireEmpresaId: (): number => {
      if (loading) throw new Error('Ainda carregando empresa_id')
      if (error) throw new Error(error)
      if (!empresaId) throw new Error('empresa_id não disponível')
      return empresaId
    }
  }
}

/**
 * HOC para injetar empresaId em componentes
 * 
 * @example
 * export default withEmpresaId(MeuComponente)
 * 
 * // No componente:
 * function MeuComponente({ empresaId }) {
 *   const handleSubmit = async () => {
 *     await supabase.from('clientes').insert({
 *       nome: 'Teste',
 *       empresa_id: empresaId // ✅ Já disponível via props
 *     })
 *   }
 * }
 */
export function withEmpresaId<P extends { empresaId?: number }>(
  Component: React.ComponentType<P>
) {
  return function WrappedComponent(props: Omit<P, 'empresaId'>) {
    const { empresaId, loading, error } = useEmpresaId()

    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-slate-600">Carregando...</div>
        </div>
      )
    }

    if (error || !empresaId) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-red-600">
            {error || 'Erro ao carregar dados da empresa'}
          </div>
        </div>
      )
    }

    return <Component {...(props as P)} empresaId={empresaId} />
  }
}
