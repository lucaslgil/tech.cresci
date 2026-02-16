import React, { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { useEmpresaId } from '../../shared/hooks/useEmpresaId'
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
  // Logo da empresa (preview e salvamento em localStorage)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const { empresaId, loading: loadingEmpresa } = useEmpresaId()
  const [salvando, setSalvando] = useState(false)
  const [logoBg, setLogoBg] = useState<string>('#2c3940')
  const [nomeTemaCustomizado, setNomeTemaCustomizado] = useState('')
  const [mostrarModalSalvar, setMostrarModalSalvar] = useState(false)

  useEffect(() => {
    carregarTemasCustomizados()
    carregarTemaAtivo()
    // carregar logo salvo e cor de fundo
    const logoSalvo = localStorage.getItem('empresa-logo')
    if (logoSalvo) setLogoPreview(logoSalvo)
    const bgSalvo = localStorage.getItem('empresa-logo-bg')
    if (bgSalvo) setLogoBg(bgSalvo)
  }, [])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
  }

  // Process image to fit target dimensions and apply background color
  const processImageFile = (file: File, targetW = 320, targetH = 160, bg = '#ffffff') => {
    return new Promise<{ dataUrl: string; blob: Blob }>((resolve, reject) => {
      const img = new Image()
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = targetW
          canvas.height = targetH
          const ctx = canvas.getContext('2d')!

          // Fill background
          ctx.fillStyle = bg || 'transparent'
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Compute scaled size preserving aspect
          const ratio = Math.min(canvas.width / img.width, canvas.height / img.height)
          const drawW = img.width * ratio
          const drawH = img.height * ratio
          const offsetX = (canvas.width - drawW) / 2
          const offsetY = (canvas.height - drawH) / 2

          ctx.drawImage(img, offsetX, offsetY, drawW, drawH)

          const dataUrl = canvas.toDataURL('image/png')
          const blob = await (await fetch(dataUrl)).blob()
          resolve({ dataUrl, blob })
        } catch (err) {
          reject(err)
        }
      }
      img.onerror = () => reject(new Error('Erro ao carregar imagem'))
      img.src = URL.createObjectURL(file)
    })
  }

  // Re-generate preview when file or background changes so preview matches final crop
  useEffect(() => {
    let mounted = true
    const doProcess = async () => {
      if (!logoFile) return
      try {
        const { dataUrl } = await processImageFile(logoFile, 320, 160, logoBg)
        if (mounted) setLogoPreview(dataUrl)
      } catch (err) {
        console.error('Erro ao processar preview da logo:', err)
      }
    }
    doProcess()
    return () => { mounted = false }
  }, [logoFile, logoBg])

  const salvarLogo = async () => {
    if (!logoPreview) {
      alert('Selecione uma imagem antes de salvar')
      return
    }

    // If Supabase configured and user has empresaId and a file, upload to storage and save URL via RPC
    if (isSupabaseConfigured && empresaId && logoFile) {
      try {
        setSalvando(true)
        const bucket = 'empresa-logos'
        // Process image to standard size before upload
        const processed = await processImageFile(logoFile, 320, 160, logoBg)
        const blob = processed.blob
        const fileName = `logo-${Date.now()}.png`
        const path = `${empresaId}/${fileName}`

        const fileToUpload = new File([blob], fileName, { type: 'image/png' })

        // Upload (upsert true to replace)
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, fileToUpload, { upsert: true })

        if (uploadError) {
          console.error('Erro ao enviar arquivo para Storage:', uploadError)
          throw uploadError
        }

        // Get public URL
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path)
        const publicUrl = publicData.publicUrl

        // Call RPC to save logo url and bg
        const rpcRes = await supabase.rpc('rpc_set_empresa_logo', {
          p_empresa_id: empresaId,
          p_logo_url: publicUrl,
          p_logo_bg: logoBg
        })
        if (rpcRes.error) {
          console.error('Erro ao chamar RPC:', rpcRes.error)
          throw rpcRes.error
        }

        alert('✅ Logo enviada e salva com sucesso! A página será recarregada.')
        setTimeout(() => window.location.reload(), 800)
      } catch (err) {
        console.error('Erro ao salvar logo no Supabase:', err)
        alert('Erro ao salvar logo no Supabase. Verifique o console.')
      } finally {
        setSalvando(false)
      }

      return
    }

    // Fallback: salvar no localStorage (sem backend)
    try {
      // If we have a processed preview prefer that (logoPreview is kept in sync)
      localStorage.setItem('empresa-logo', logoPreview || '')
      localStorage.setItem('empresa-logo-bg', logoBg)
      alert('✅ Logo e cor de fundo salvas localmente! A página será recarregada para aplicar as mudanças.')
      setTimeout(() => window.location.reload(), 800)
    } catch (error) {
      console.error('Erro ao salvar logo:', error)
      alert('Erro ao salvar a logo')
    }
  }

  const removerLogo = () => {
    if (!confirm('Deseja remover a logo atual da empresa?')) return
    localStorage.removeItem('empresa-logo')
    localStorage.removeItem('empresa-logo-bg')
    setLogoPreview(null)
    setLogoBg('#2c3940')
    alert('✅ Logo removida. A página será recarregada.')
    setTimeout(() => window.location.reload(), 600)
  }

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

        {/* Logo da Empresa */}
        <div className="mb-8 bg-white rounded-lg shadow p-4">
          <h3 className="text-md font-medium text-gray-900 mb-3">Logo da Empresa</h3>
          <p className="text-sm text-gray-600 mb-3">Adicione a logo da empresa para que seja exibida no canto superior do menu lateral.</p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-40 h-20 rounded flex items-center justify-center overflow-hidden border border-gray-200" style={{ backgroundColor: logoBg }}>
              {logoPreview ? (
                <img src={logoPreview} alt="Preview Logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-sm text-gray-200">Sem logo</span>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-2 w-full">
              <input type="file" accept="image/*" onChange={handleLogoChange} className="text-sm" />

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Cor de fundo para logomarca</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={logoBg} onChange={(e) => setLogoBg(e.target.value)} className="w-12 h-10 p-0 border-0" />
                    <input type="text" value={logoBg} onChange={(e) => setLogoBg(e.target.value)} className="flex-1 border border-gray-300 rounded-md px-2 py-2 text-sm font-mono uppercase" />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={salvarLogo}
                    disabled={salvando || loadingEmpresa}
                    className={`px-3 py-2 rounded-md text-sm flex items-center gap-2 ${salvando || loadingEmpresa ? 'bg-blue-300 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {salvando ? 'Salvando...' : 'Salvar Logo'}
                  </button>
                  <button
                    onClick={removerLogo}
                    disabled={salvando}
                    className={`px-3 py-2 rounded-md text-sm flex items-center gap-2 ${salvando ? 'bg-red-300 text-white cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                  >
                    Remover Logo
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-2">Recomenda-se PNG com fundo transparente; use a cor de fundo para que a logo fique bem enquadrada no menu.</p>
            </div>
          </div>
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
