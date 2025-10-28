import React, { useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const Layout: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [cadastroOpen, setCadastroOpen] = useState(false)
  const [inventarioOpen, setInventarioOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-60 bg-slate-900">
        <div className="flex flex-col h-full">
          {/* Header with User */}
          <div className="px-4 py-4 border-b border-slate-800">
            {/* User Profile - Clickable */}
            <Link 
              to="/configuracao"
              className="flex items-center hover:bg-slate-800 p-2 -m-2 rounded-lg transition-colors group"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-slate-600 group-hover:border-slate-500 transition-colors">
                  {user?.email ? (
                    <span className="text-white text-sm font-semibold">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  )}
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate group-hover:text-slate-200">
                  {user?.email?.split('@')[0]}
                </p>
                <p className="text-slate-400 text-xs truncate">
                  {user?.email}
                </p>
              </div>
              <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {/* Dashboard */}
            <Link
              to="/dashboard"
              className="w-full flex items-center px-3 py-2 text-sm font-medium rounded transition-colors duration-200 text-slate-400 hover:text-slate-300 hover:bg-slate-800"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              Dashboard
            </Link>

            {/* Cadastro - Menu com submenu */}
            <div>
              <button
                onClick={() => setCadastroOpen(!cadastroOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded transition-colors duration-200 text-slate-400 hover:text-slate-300 hover:bg-slate-800"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Cadastro
                </div>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${cadastroOpen ? 'rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Submenu CADASTRO */}
              {cadastroOpen && (
                <div className="ml-8 mt-1 space-y-1">
                  <Link
                    to="/cadastro/empresa"
                    className="w-full flex items-center px-3 py-2 text-sm font-medium rounded transition-colors duration-200 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                    </svg>
                    Empresa
                  </Link>

                  <Link
                    to="/cadastro/colaborador"
                    className="w-full flex items-center px-3 py-2 text-sm font-medium rounded transition-colors duration-200 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Colaborador
                  </Link>
                </div>
              )}
            </div>

            {/* Inventário - Menu com submenu */}
            <div>
              <button
                onClick={() => setInventarioOpen(!inventarioOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded transition-colors duration-200 text-slate-400 hover:text-slate-300 hover:bg-slate-800"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Inventário
                </div>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${inventarioOpen ? 'rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Submenu INVENTÁRIO */}
              {inventarioOpen && (
                <div className="ml-8 mt-1 space-y-1">
                  <Link
                    to="/inventario/cadastrar-item"
                    className="w-full flex items-center px-3 py-2 text-sm font-medium rounded transition-colors duration-200 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Cadastrar Item
                  </Link>

                  <Link
                    to="/inventario/linhas-telefonicas"
                    className="w-full flex items-center px-3 py-2 text-sm font-medium rounded transition-colors duration-200 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Linhas Telefônicas
                  </Link>

                  <Link
                    to="/inventario/relatorio"
                    className="w-full flex items-center px-3 py-2 text-sm font-medium rounded transition-colors duration-200 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Relatório
                  </Link>
                </div>
              )}
            </div>

            {/* Documentação */}
            <Link
              to="/documentacao"
              className="w-full flex items-center px-3 py-2 text-sm font-medium rounded transition-colors duration-200 text-slate-400 hover:text-slate-300 hover:bg-slate-800"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Documentação
            </Link>
          </nav>

          {/* Footer - Config and Logout */}
          <div className="border-t border-slate-800 p-3 space-y-2">
            <Link
              to="/configuracao"
              className="w-full flex items-center justify-center px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white rounded transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configurações
            </Link>
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white rounded transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair do Sistema
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}