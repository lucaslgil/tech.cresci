import React, { useState, useEffect } from 'react'
import { Check, Trash2, Save } from 'lucide-react'

interface TemaConfig {
  corFundoMenu: string
  corTextoMenu: string
}

interface Tema {
  nome: string
  id: string
  cores: TemaConfig
  padrao?: boolean
}

const temasPreDefinidos: Tema[] = [
  {
    nome: 'TEMA PRO2',
    id: 'tema-pro2',
    padrao: true,
    cores: {
      corFundoMenu: '#2c3940', // Cor do menu lateral atual
      corTextoMenu: '#f1f5f9'  // Texto claro
    }
  }
]

export const TemaSistema: React.FC = () => {
  const [temaSelecionado, setTemaSelecionado] = useState('tema-pro2')
  const [temasCustomizados, setTemasCustomizados] = useState<Tema[]>([])
  const [todosOsTemas, setTodosOsTemas] = useState<Tema[]>(temasPreDefinidos)
  
  // Cores da personalização
  const [corFundoMenu, setCorFundoMenu] = useState('#2c3940')
  const [corTextoMenu, setCorTextoMenu] = useState('#f1f5f9')
  const [nomeTemaCustomizado, setNomeTemaCustomizado] = useState('')
  const [mostrarModalSalvar, setMostrarModalSalvar] = useState(false)

  useEffect(() => {
    carregarTemasCustomizados()
    carregarTemaAtivo()
  }, [])

  const carregarTemasCustomizados = () => {
    const temasCustomizadosSalvos = localStorage.getItem('temas-menu-customizados')
    if (temasCustomizadosSalvos) {
      try {
        const temas: Tema[] = JSON.parse(temasCustomizadosSalvos)
        setTemasCustomizados(temas)
        setTodosOsTemas([...temasPreDefinidos, ...temas])
      } catch (error) {
        console.error('Erro ao carregar temas customizados:', error)
      }
    }
  }

  const carregarTemaAtivo = () => {
    const temaSalvo = localStorage.getItem('tema-menu-ativo')
    if (temaSalvo) {
      try {
        const tema = JSON.parse(temaSalvo)
        setTemaSelecionado(tema.id)
        aplicarTemaMenu(tema.cores)
      } catch (error) {
        console.error('Erro ao carregar tema ativo:', error)
      }
    }
  }

  const aplicarTema = (temaId: string) => {
    const tema = todosOsTemas.find(t => t.id === temaId)
    if (tema) {
      setTemaSelecionado(temaId)
      setCorFundoMenu(tema.cores.corFundoMenu)
      setCorTextoMenu(tema.cores.corTextoMenu)
      
      // Salvar tema ativo
      localStorage.setItem('tema-menu-ativo', JSON.stringify({
        id: temaId,
        cores: tema.cores
      }))

      // Aplicar no menu
      aplicarTemaMenu(tema.cores)
      
      alert(`✅ Tema "${tema.nome}" aplicado! Recarregue a página para ver as mudanças.`)
      
      // Recarregar página para aplicar
      setTimeout(() => window.location.reload(), 1000)
    }
  }

  const aplicarTemaMenu = (cores: TemaConfig) => {
    const sidebar = document.querySelector('aside')
    if (sidebar) {
      sidebar.style.backgroundColor = cores.corFundoMenu
      sidebar.style.color = cores.corTextoMenu
      
      // Aplicar aos links
      const links = sidebar.querySelectorAll('a, button')
      links.forEach(link => {
        (link as HTMLElement).style.color = cores.corTextoMenu
      })
    }
    
    // Salvar no root para uso futuro
    document.documentElement.style.setProperty('--cor-menu-fundo', cores.corFundoMenu)
    document.documentElement.style.setProperty('--cor-menu-texto', cores.corTextoMenu)
  }

  const salvarTemaCustomizado = () => {
    if (!nomeTemaCustomizado.trim()) {
      alert('Digite um nome para o tema')
      return
    }

    const novoTema: Tema = {
      nome: nomeTemaCustomizado,
      id: `custom-${Date.now()}`,
      cores: {
        corFundoMenu,
        corTextoMenu
      }
    }

    const novosTemasCustomizados = [...temasCustomizados, novoTema]
    setTemasCustomizados(novosTemasCustomizados)
    setTodosOsTemas([...temasPreDefinidos, ...novosTemasCustomizados])
    
    localStorage.setItem('temas-menu-customizados', JSON.stringify(novosTemasCustomizados))
    
    setMostrarModalSalvar(false)
    setNomeTemaCustomizado('')
    alert(`✅ Tema "${novoTema.nome}" salvo com sucesso!`)
  }

  const excluirTema = (temaId: string) => {
    const tema = todosOsTemas.find(t => t.id === temaId)
    
    if (tema?.padrao) {
      alert('❌ Não é possível excluir temas padrão do sistema')
      return
    }

    if (!confirm(`Deseja realmente excluir o tema "${tema?.nome}"?`)) {
      return
    }

    const novosTemasCustomizados = temasCustomizados.filter(t => t.id !== temaId)
    setTemasCustomizados(novosTemasCustomizados)
    setTodosOsTemas([...temasPreDefinidos, ...novosTemasCustomizados])
    
    localStorage.setItem('temas-menu-customizados', JSON.stringify(novosTemasCustomizados))
    
    if (temaSelecionado === temaId) {
      aplicarTema('tema-pro2')
    }
    
    alert('✅ Tema excluído com sucesso!')
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Personalizar Menu Lateral</h2>
          <p className="text-sm text-gray-600 mt-1">
            Escolha um tema pré-definido ou personalize as cores do menu lateral
          </p>
        </div>

        {/* Temas Pré-definidos */}
        <div className="mb-8">
          <h3 className="text-md font-medium text-gray-900 mb-4">Temas Pré-definidos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {todosOsTemas.map((tema) => (
              <div
                key={tema.id}
                className={`relative p-4 border-2 rounded-lg transition-all ${
                  temaSelecionado === tema.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                {/* Botão de excluir */}
                {!tema.padrao && (
                  <button
                    onClick={() => excluirTema(tema.id)}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 rounded-full p-1.5"
                    title="Excluir tema"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                )}
                
                {/* Check de selecionado */}
                {temaSelecionado === tema.id && (
                  <div className="absolute top-2 left-2 bg-blue-600 rounded-full p-1">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                
                {/* Conteúdo clicável */}
                <div onClick={() => aplicarTema(tema.id)} className="cursor-pointer mt-2">
                  <h4 className="font-medium text-gray-900 mb-3 text-sm">{tema.nome}</h4>
                  
                  {/* Preview do menu */}
                  <div 
                    className="h-24 rounded-lg p-3 flex flex-col gap-2"
                    style={{ backgroundColor: tema.cores.corFundoMenu }}
                  >
                    <div 
                      className="text-xs font-medium"
                      style={{ color: tema.cores.corTextoMenu }}
                    >
                      📊 Dashboard
                    </div>
                    <div 
                      className="text-xs opacity-80"
                      style={{ color: tema.cores.corTextoMenu }}
                    >
                      📁 Cadastro
                    </div>
                    <div 
                      className="text-xs opacity-80"
                      style={{ color: tema.cores.corTextoMenu }}
                    >
                      📦 Produtos
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personalizar Cores */}
        <div className="border-t pt-8">
          <h3 className="text-md font-medium text-gray-900 mb-4">Criar Tema Personalizado</h3>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Cor de Fundo do Menu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor de Fundo do Menu
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={corFundoMenu}
                    onChange={(e) => setCorFundoMenu(e.target.value)}
                    className="w-16 h-12 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={corFundoMenu}
                    onChange={(e) => setCorFundoMenu(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono uppercase"
                    placeholder="#1e293b"
                  />
                </div>
              </div>

              {/* Cor do Texto do Menu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor do Texto do Menu
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={corTextoMenu}
                    onChange={(e) => setCorTextoMenu(e.target.value)}
                    className="w-16 h-12 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={corTextoMenu}
                    onChange={(e) => setCorTextoMenu(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono uppercase"
                    placeholder="#f1f5f9"
                  />
                </div>
              </div>
            </div>

            {/* Preview em tempo real */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div 
                className="h-40 rounded-lg p-4 flex flex-col gap-3"
                style={{ backgroundColor: corFundoMenu }}
              >
                <div 
                  className="text-sm font-medium flex items-center gap-2"
                  style={{ color: corTextoMenu }}
                >
                  <span>📊</span> Dashboard
                </div>
                <div 
                  className="text-sm flex items-center gap-2 opacity-80"
                  style={{ color: corTextoMenu }}
                >
                  <span>📁</span> Cadastro
                </div>
                <div 
                  className="text-sm flex items-center gap-2 opacity-80"
                  style={{ color: corTextoMenu }}
                >
                  <span>📦</span> Produtos
                </div>
                <div 
                  className="text-sm flex items-center gap-2 opacity-80"
                  style={{ color: corTextoMenu }}
                >
                  <span>👥</span> Clientes
                </div>
              </div>
            </div>

            {/* Botão Salvar */}
            <div className="flex justify-end">
              <button
                onClick={() => setMostrarModalSalvar(true)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar Tema Personalizado
              </button>
            </div>
          </div>
        </div>

        {/* Dica */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>💡 Dica:</strong> Após aplicar um tema, a página será recarregada automaticamente para aplicar as novas cores no menu lateral.
          </p>
        </div>
      </div>

      {/* Modal Salvar Tema */}
      {mostrarModalSalvar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Salvar Tema Personalizado</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Tema
              </label>
              <input
                type="text"
                value={nomeTemaCustomizado}
                onChange={(e) => setNomeTemaCustomizado(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Ex: Meu Tema Azul"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setMostrarModalSalvar(false)
                  setNomeTemaCustomizado('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={salvarTemaCustomizado}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
