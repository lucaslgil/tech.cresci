import React from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const Layout: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-60 bg-slate-900">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center px-6 h-14 border-b border-slate-800">
            <h1 className="text-white text-sm font-semibold tracking-wide">
              SISTEMA INVENTÁRIO
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            <Link
              to="/dashboard"
              className="w-full flex items-center px-3 py-2 text-sm font-medium rounded transition-colors duration-200 text-slate-400 hover:text-slate-300 hover:bg-slate-800"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              Dashboard
            </Link>

            <Link
              to="/cadastro/empresa"
              className="w-full flex items-center px-3 py-2 text-sm font-medium rounded transition-colors duration-200 text-slate-400 hover:text-slate-300 hover:bg-slate-800"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
              Empresa
            </Link>

            <Link
              to="/cadastro/colaborador"
              className="w-full flex items-center px-3 py-2 text-sm font-medium rounded transition-colors duration-200 text-slate-400 hover:text-slate-300 hover:bg-slate-800"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Colaborador
            </Link>

            <Link
              to="/inventario/cadastrar-item"
              className="w-full flex items-center px-3 py-2 text-sm font-medium rounded transition-colors duration-200 text-slate-400 hover:text-slate-300 hover:bg-slate-800"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              Cadastrar Item
            </Link>

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

          {/* User Info */}
          <div className="border-t border-slate-800 p-3">
            <div className="flex items-center text-slate-400 text-xs mb-3 px-3">
              <div className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center mr-2">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-300 rounded transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
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