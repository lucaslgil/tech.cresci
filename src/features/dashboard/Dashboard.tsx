import React from 'react'
import { Link } from 'react-router-dom'

export const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Total de Vendas', value: '0', icon: '💰', color: 'from-blue-500 to-blue-600' },
    { label: 'Itens em Estoque', value: '0', icon: '📦', color: 'from-purple-500 to-purple-600' },
    { label: 'Colaboradores', value: '0', icon: '👥', color: 'from-green-500 to-green-600' },
    { label: 'Empresas', value: '0', icon: '🏢', color: 'from-orange-500 to-orange-600' },
  ]

  const quickActions = [
    { 
      title: 'Nova Venda', 
      description: 'Registrar nova venda',
      icon: '🛒',
      link: '/vendas/nova',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
    },
    { 
      title: 'Cadastrar Item', 
      description: 'Adicionar item ao inventário',
      icon: '📦',
      link: '/inventario/cadastrar-item',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
    },
    { 
      title: 'Novo Colaborador', 
      description: 'Adicionar colaborador',
      icon: '👤',
      link: '/cadastro/colaborador',
      color: 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
    },
    { 
      title: 'Nova Empresa', 
      description: 'Cadastrar empresa',
      icon: '🏢',
      link: '/cadastro/empresa',
      color: 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
    },
  ]

  const recentModules = [
    { name: 'Vendas', icon: '🛒', link: '/vendas', description: 'Gerenciar vendas' },
    { name: 'Inventário', icon: '📋', link: '/inventario/relatorio', description: 'Ver relatórios' },
    { name: 'Notas Fiscais', icon: '📄', link: '/notas-fiscais/emitir', description: 'Emitir NF-e' },
    { name: 'Financeiro', icon: '💰', link: '/financeiro/contas-receber', description: 'Contas a receber' },
    { name: 'Tarefas', icon: '✓', link: '/tarefas', description: 'Gerenciar tarefas' },
    { name: 'Configurações', icon: '⚙️', link: '/configuracoes', description: 'Configurar sistema' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Visão geral do sistema - Bem-vindo de volta!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center text-xl shadow-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-3">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className={`${action.color} rounded-xl p-4 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300`}
            >
              <div className="text-2xl mb-2">{action.icon}</div>
              <h3 className="text-sm font-bold mb-0.5">{action.title}</h3>
              <p className="text-xs text-white/90">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">Módulos do Sistema</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentModules.map((module, index) => (
            <Link
              key={index}
              to={module.link}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all duration-300 group"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                  {module.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5 group-hover:text-blue-600 transition-colors">
                    {module.name}
                  </h3>
                  <p className="text-xs text-gray-600">{module.description}</p>
                </div>
                <svg 
                  className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* System Info Footer */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Sistema de Gestão CRESCI E PERDI</h3>
            <p className="text-xs text-gray-700 leading-relaxed">
              Plataforma completa para gestão empresarial com módulos de vendas, inventário, notas fiscais, 
              financeiro e muito mais. Desenvolvido com as melhores tecnologias para garantir performance e segurança.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}