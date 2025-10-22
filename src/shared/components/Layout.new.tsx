import React, { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const Layout: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const menuItems = [
    { 
      title: 'Dashboard',
      icon: '📊',
      path: '/dashboard'
    },
    { 
      title: 'CADASTRO',
      isSection: true,
      items: [
        { name: 'Empresa', path: '/cadastro/empresa', icon: '🏢' },
        { name: 'Colaborador', path: '/cadastro/colaborador', icon: '👥' }
      ]
    },
    {
      title: 'INVENTÁRIO',
      isSection: true,
      items: [
        { name: 'Cadastrar Item', path: '/inventario/cadastrar-item', icon: '📦' }
      ]
    },
    {
      title: 'Documentação',
      icon: '📚',
      path: '/documentacao'
    }
  ]

  const isActiveLink = (path: string) => {
    return location.pathname === path
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-center h-16 bg-slate-900 border-b border-slate-700">
            <h1 className="text-white text-lg font-bold">
              Sistema Inventário
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item, index) => {
              if (item.isSection) {
                return (
                  <div key={index} className="mt-6 first:mt-0">
                    {/* Section Title */}
                    <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      {item.title}
                    </h3>
                    {/* Section Items */}
                    <div className="space-y-1">
                      {item.items?.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          to={subItem.path}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                            isActiveLink(subItem.path)
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <span className="mr-3 text-base">{subItem.icon}</span>
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              } else {
                return (
                  <Link
                    key={index}
                    to={item.path!}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActiveLink(item.path!)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="mr-3 text-base">{item.icon}</span>
                    {item.title}
                  </Link>
                )
              }
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-slate-700 p-4">
            <div className="flex items-center text-slate-300 text-sm mb-3">
              <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-semibold">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors duration-200"
            >
              <span className="mr-3">🚪</span>
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top bar for mobile */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              className="text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-slate-900">Sistema Inventário</h1>
            <div className="w-6 h-6" /> {/* Spacer */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}