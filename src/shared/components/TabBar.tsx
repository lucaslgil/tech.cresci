/**
 * COMPONENTE: BARRA DE ABAS
 * Navegação por abas similar a navegador
 */

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { useTabs } from '../context/TabsContext'
import { usePermissions } from '../hooks/usePermissions'
import { useNavigate } from 'react-router-dom'

// Mapeamento de rotas para permissões
const routePermissions: Record<string, string> = {
  '/cadastro/empresa': 'cadastro_empresa',
  '/cadastro/colaborador': 'cadastro_colaborador',
  '/cadastro/produtos': 'cadastro_produtos',
  '/cadastro/clientes': 'cadastro_clientes',
  '/clientes': 'cadastro_clientes',
  '/inventario/cadastro': 'inventario_itens',
  '/inventario/cadastrar-item': 'inventario_itens',
  '/inventario/relatorio': 'inventario_relatorio',
  '/inventario/linhas-telefonicas': 'inventario_linhas',
  '/notas-fiscais/consultar': 'notas_fiscais_consultar',
  '/notas-fiscais/emitir': 'notas_fiscais_emitir',
  '/notas-fiscais/parametros': 'notas_fiscais_parametros',
  '/vendas': 'vendas_listagem',
  '/vendas/nova': 'vendas_nova',
  '/vendas/relatorios': 'vendas_relatorios',
  '/franquias': 'franquias',
  '/financeiro/contas-pagar': 'financeiro_contas_pagar',
  '/financeiro/contas-receber': 'financeiro_contas_receber',
  '/financeiro/parametros': 'financeiro_parametros',
  '/tarefas': 'tarefas',
  '/configuracoes': 'configuracoes',
  '/documentacao': 'documentacao'
}

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, switchTab, closeTab } = useTabs()
  const { hasPermission, loading } = usePermissions()
  const navigate = useNavigate()

  // Fechar abas não autorizadas quando permissões mudarem
  useEffect(() => {
    if (loading) return

    // Verificar apenas uma vez quando as permissões carregarem
    tabs.forEach(tab => {
      const permission = routePermissions[tab.path]
      if (permission && !hasPermission(permission as any)) {
        closeTab(tab.id)
        // Se era a aba ativa, redirecionar para dashboard
        if (tab.id === activeTabId) {
          navigate('/dashboard')
        }
      }
    })
  }, [loading]) // Removido dependências desnecessárias que causavam loop

  if (tabs.length === 0) return null

  return (
    <div className="bg-[#394353] border-b border-[#C9C4B5] shadow-sm">
      <div className="flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          const permission = routePermissions[tab.path]
          const hasAccess = !permission || hasPermission(permission as any)

          // Não mostrar abas sem permissão
          if (!hasAccess) return null

          return (
            <div
              key={tab.id}
              className={`
                flex items-center gap-2 px-4 py-2.5 border-r border-[#C9C4B5]
                cursor-pointer transition-colors min-w-[180px] max-w-[250px]
                ${isActive 
                  ? 'bg-white text-gray-900' 
                  : 'bg-[#394353] text-white hover:bg-[#4a5463]'
                }
              `}
              onClick={() => {
                if (hasAccess) {
                  switchTab(tab.id)
                } else {
                  navigate('/dashboard')
                }
              }}
            >
              {/* Ícone (se houver) */}
              {tab.icon && (
                <span className={isActive ? 'text-gray-700' : 'text-gray-300'}>
                  {tab.icon}
                </span>
              )}

              {/* Título da aba */}
              <span className="flex-1 text-xs font-medium truncate">
                {tab.title}
              </span>

              {/* Botão fechar */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
                className={`
                  p-0.5 rounded hover:bg-opacity-20 transition-colors
                  ${isActive 
                    ? 'hover:bg-gray-300' 
                    : 'hover:bg-white'
                  }
                `}
                title="Fechar aba"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
