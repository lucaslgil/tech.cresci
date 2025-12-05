import React, { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const Layout: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [cadastroOpen, setCadastroOpen] = useState(false)
  const [inventarioOpen, setInventarioOpen] = useState(false)
  const [notasFiscaisOpen, setNotasFiscaisOpen] = useState(false)
  const [vendasOpen, setVendasOpen] = useState(false)
  const [franquiasOpen, setFranquiasOpen] = useState(false)
  const [coresMenu, setCoresMenu] = useState({
    fundo: '#1e293b',
    texto: '#f1f5f9'
  })

  // Carregar tema do menu ao montar
  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema-menu-ativo')
    if (temaSalvo) {
      try {
        const tema = JSON.parse(temaSalvo)
        setCoresMenu({
          fundo: tema.cores.corFundoMenu,
          texto: tema.cores.corTextoMenu
        })
      } catch (error) {
        console.error('Erro ao carregar tema do menu:', error)
      }
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <style>{`
        .menu-sidebar { background-color: ${coresMenu.fundo} !important; color: ${coresMenu.texto} !important; }
        .menu-sidebar * { color: ${coresMenu.texto} !important; }
        .menu-sidebar a, .menu-sidebar button { color: ${coresMenu.texto} !important; }
        
        /* Estilo de botão elevado - efeito Bluesoft */
        .menu-item { 
          position: relative;
          transition: all 0.2s ease;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          margin: 4px 0;
        }
        .menu-item:hover {
          background-color: rgba(255, 255, 255, 0.12);
          transform: translateX(2px);
        }
        .menu-item.active {
          background-color: rgba(59, 130, 246, 0.2);
          border-left: 3px solid #3b82f6;
        }
        .submenu-item {
          transition: all 0.2s ease;
          background-color: rgba(0, 0, 0, 0.15);
          margin: 2px 0;
          border-radius: 4px;
        }
        .submenu-item:hover {
          background-color: rgba(255, 255, 255, 0.08);
          transform: translateX(4px);
        }
      `}</style>
      <div className="w-64 flex-shrink-0 menu-sidebar shadow-xl" style={{ backgroundColor: '#2c3940' }}>
        <div className="flex flex-col h-full">
          {/* Header/Logo */}
          <div className="px-4 py-4 border-b border-gray-600">
            <h1 className="text-xl font-bold text-white tracking-wide">CRESCI E PERDI</h1>
            <p className="text-xs text-gray-400 mt-0.5">Sistema de Gestão</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {/* Dashboard */}
            <Link
              to="/dashboard"
              className="menu-item w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:text-white rounded-md"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              <span>Dashboard</span>
              <svg className="w-4 h-4 ml-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Divisor */}
            <div className="border-t border-gray-600 my-2"></div>

            {/* Cadastro - Menu com submenu */}
            <div>
              <button
                onClick={() => setCadastroOpen(!cadastroOpen)}
                className="menu-item w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:text-white rounded-md"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Cadastros</span>
                <svg 
                  className={`w-4 h-4 ml-auto transition-transform ${cadastroOpen ? 'rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Submenu CADASTRO */}
              {cadastroOpen && (
                <div className="mt-1 space-y-0.5 bg-black bg-opacity-20">
                  <Link
                    to="/cadastro/empresa"
                    className="submenu-item w-full flex items-center px-4 py-2.5 pl-12 text-sm text-gray-400 hover:text-white rounded-md"
                  >
                    Empresa
                  </Link>

                  <Link
                    to="/cadastro/colaborador"
                    className="submenu-item w-full flex items-center px-4 py-2.5 pl-12 text-sm text-gray-400 hover:text-white rounded-md"
                  >
                    Colaborador
                  </Link>

                  <Link
                    to="/cadastro/produtos"
                    className="submenu-item w-full flex items-center px-4 py-2.5 pl-12 text-sm text-gray-400 hover:text-white rounded-md"
                  >
                    Produtos
                  </Link>

                  <Link
                    to="/cadastro/clientes"
                    className="submenu-item w-full flex items-center px-4 py-2.5 pl-12 text-sm text-gray-400 hover:text-white rounded-md"
                  >
                    Clientes
                  </Link>
                </div>
              )}
            </div>

            {/* Divisor */}
            <div className="border-t border-gray-600 my-2"></div>

            {/* Vendas - Menu com submenu */}
            <div>
              <button
                onClick={() => setVendasOpen(!vendasOpen)}
                className="menu-item w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:text-white rounded-md"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Vendas</span>
                <svg 
                  className={`w-4 h-4 ml-auto transition-transform ${vendasOpen ? 'rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {vendasOpen && (
                <div className="mt-1 space-y-0.5 bg-black bg-opacity-20">
                  <Link
                    to="/vendas"
                    className="submenu-item w-full flex items-center px-4 py-2.5 pl-12 text-sm text-gray-400 hover:text-white rounded-md"
                  >
                    Listar Vendas
                  </Link>

                  <Link
                    to="/vendas/nova"
                    className="submenu-item w-full flex items-center px-4 py-2.5 pl-12 text-sm text-gray-400 hover:text-white rounded-md"
                  >
                    Nova Venda
                  </Link>
                </div>
              )}
            </div>

            {/* Divisor */}
            <div className="border-t border-gray-600 my-2"></div>

            {/* Inventário - Menu com submenu */}
            <div>
              <button
                onClick={() => setInventarioOpen(!inventarioOpen)}
                className="menu-item w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:text-white rounded-md"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>Inventário</span>
                <svg 
                  className={`w-4 h-4 ml-auto transition-transform ${inventarioOpen ? 'rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {inventarioOpen && (
                <div className="mt-1 space-y-0.5 bg-black bg-opacity-20">
                  <Link
                    to="/inventario/cadastrar-item"
                    className="submenu-item w-full flex items-center px-4 py-2.5 pl-12 text-sm text-gray-400 hover:text-white rounded-md"
                  >
                    Cadastrar Item
                  </Link>

                  <Link
                    to="/inventario/linhas-telefonicas"
                    className="submenu-item w-full flex items-center px-4 py-2.5 pl-12 text-sm text-gray-400 hover:text-white rounded-md"
                  >
                    Linhas Telefônicas
                  </Link>

                  <Link
                    to="/inventario/relatorio"
                    className="submenu-item w-full flex items-center px-4 py-2.5 pl-12 text-sm text-gray-400 hover:text-white rounded-md"
                  >
                    Relatório
                  </Link>
                </div>
              )}
            </div>

            {/* Divisor */}
            <div className="border-t border-gray-600 my-2"></div>

            {/* Notas Fiscais - Menu com submenu */}
            <div>
              <button
                onClick={() => setNotasFiscaisOpen(!notasFiscaisOpen)}
                className="menu-item w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:text-white rounded-md"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Notas Fiscais</span>
                <svg 
                  className={`w-4 h-4 ml-auto transition-transform ${notasFiscaisOpen ? 'rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {notasFiscaisOpen && (
                <div className="mt-1 space-y-0.5 bg-black bg-opacity-20">
                  <Link
                    to="/notas-fiscais/emitir"
                    className="submenu-item w-full flex items-center px-4 py-2.5 pl-12 text-sm text-gray-400 hover:text-white rounded-md"
                  >
                    Emitir Nota Fiscal
                  </Link>

                  <Link
                    to="/notas-fiscais/parametros"
                    className="submenu-item w-full flex items-center px-4 py-2.5 pl-12 text-sm text-gray-400 hover:text-white rounded-md"
                  >
                    Parâmetros Fiscais
                  </Link>
                </div>
              )}
            </div>

            {/* Divisor */}
            <div className="border-t border-gray-600 my-2"></div>

            {/* Franquias - Menu com submenu */}
            <div>
              <button
                onClick={() => setFranquiasOpen(!franquiasOpen)}
                className="menu-item w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:text-white rounded-md"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Franquias</span>
                <svg 
                  className={`w-4 h-4 ml-auto transition-transform ${franquiasOpen ? 'rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {franquiasOpen && (
                <div className="mt-1 space-y-0.5 bg-black bg-opacity-20">
                  <Link
                    to="/franquias"
                    className="submenu-item w-full flex items-center px-4 py-2.5 pl-12 text-sm text-gray-400 hover:text-white rounded-md"
                  >
                    Gerenciador
                  </Link>
                </div>
              )}
            </div>

            {/* Divisor */}
            <div className="border-t border-gray-600 my-2"></div>

            {/* Tarefas */}
            <Link
              to="/tarefas"
              className="menu-item w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:text-white rounded-md"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Tarefas</span>
              <svg className="w-4 h-4 ml-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Divisor */}
            <div className="border-t border-gray-600 my-2"></div>

            {/* Configurações */}
            <Link
              to="/configuracoes"
              className="menu-item w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:text-white rounded-md"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Configurações</span>
              <svg className="w-4 h-4 ml-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Documentação */}
            <Link
              to="/documentacao"
              className="menu-item w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:text-white rounded-md"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Documentação</span>
              <svg className="w-4 h-4 ml-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </nav>

          {/* Footer - User Profile */}
          <div className="border-t border-gray-600 p-3">
            <Link 
              to="/configuracao"
              className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition-colors group"
            >
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-600 group-hover:border-gray-500 transition-colors">
                {user?.email ? (
                  <span className="text-white text-sm font-semibold">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <button
              onClick={handleSignOut}
              className="w-full mt-2 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 bg-gray-50 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}