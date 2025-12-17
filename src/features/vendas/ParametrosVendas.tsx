// =====================================================
// COMPONENTE - PARÂMETROS DE VENDAS
// Gerencia configurações de vendas (logotipo, textos, etc)
// Data: 17/12/2025
// =====================================================

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Upload, X, Eye, EyeOff, Save, AlertCircle, CheckCircle, FileText } from 'lucide-react'

type AbaAtiva = 'layout-pedido'

interface ParametroVenda {
  id: number
  chave: string
  valor: string | null
  tipo: string
  descricao: string | null
}

export function ParametrosVendas() {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('layout-pedido')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('CRESCI E PERDI FRANCHISING')
  const [slogan, setSlogan] = useState('Sistema de Gestão')
  const [mostrarLogo, setMostrarLogo] = useState(true)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null)

  // Carregar parâmetros ao montar
  useEffect(() => {
    carregarParametros()
  }, [])

  // Limpar preview ao desmontar
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const carregarParametros = async () => {
    try {
      setCarregando(true)
      const { data, error } = await supabase
        .from('parametros_vendas')
        .select('*')
        .in('chave', [
          'logo_impressao_vendas',
          'nome_empresa_impressao',
          'slogan_impressao',
          'mostrar_logo_impressao'
        ])

      if (error) throw error

      if (data) {
        // Aplicar valores aos estados
        data.forEach((param: ParametroVenda) => {
          switch (param.chave) {
            case 'logo_impressao_vendas':
              setLogoUrl(param.valor)
              break
            case 'nome_empresa_impressao':
              setNomeEmpresa(param.valor || 'CRESCI E PERDI FRANCHISING')
              break
            case 'slogan_impressao':
              setSlogan(param.valor || 'Sistema de Gestão')
              break
            case 'mostrar_logo_impressao':
              setMostrarLogo(param.valor === 'true')
              break
          }
        })
      }
    } catch (error) {
      console.error('Erro ao carregar parâmetros:', error)
      mostrarMensagem('erro', 'Erro ao carregar parâmetros de vendas')
    } finally {
      setCarregando(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!tiposPermitidos.includes(file.type)) {
        mostrarMensagem('erro', 'Formato de arquivo não suportado. Use JPG, PNG, GIF ou WEBP.')
        return
      }

      // Validar tamanho (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        mostrarMensagem('erro', 'Arquivo muito grande. Tamanho máximo: 2MB')
        return
      }

      setLogoFile(file)
      
      // Criar preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      const newPreviewUrl = URL.createObjectURL(file)
      setPreviewUrl(newPreviewUrl)
    }
  }

  // Remove apenas o preview da imagem nova, não o logo salvo
  const handleRemoverLogo = () => {
    setLogoFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    // Não limpa o logoUrl, pois o logo salvo deve continuar visível
  }

  const uploadLogo = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `logo-vendas-${Date.now()}.${fileExt}`
    const filePath = `logos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('vendas')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) throw uploadError

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('vendas')
      .getPublicUrl(filePath)

    return publicUrl
  }

  // Usa upsert para garantir que o parâmetro seja criado ou atualizado
  const atualizarParametro = async (chave: string, valor: string | null) => {
    const { error } = await supabase
      .from('parametros_vendas')
      .upsert(
        { chave, valor, updated_at: new Date().toISOString() },
        { onConflict: 'chave' }
      )

    if (error) throw error
  }

  const handleSalvar = async () => {
    try {
      setSalvando(true)
      setMensagem(null)

      // Se houver arquivo para upload, fazer upload primeiro
      let novaLogoUrl = logoUrl
      if (logoFile) {
        novaLogoUrl = await uploadLogo(logoFile)
      }

      // Atualizar parâmetros no banco
      await Promise.all([
        atualizarParametro('logo_impressao_vendas', novaLogoUrl),
        atualizarParametro('nome_empresa_impressao', nomeEmpresa),
        atualizarParametro('slogan_impressao', slogan),
        atualizarParametro('mostrar_logo_impressao', mostrarLogo ? 'true' : 'false')
      ])

      // Atualizar estados
      setLogoUrl(novaLogoUrl)
      setLogoFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }

      mostrarMensagem('sucesso', 'Parâmetros salvos com sucesso!')
      
      // Recarregar parâmetros
      await carregarParametros()
    } catch (error) {
      console.error('Erro ao salvar parâmetros:', error)
      mostrarMensagem('erro', 'Erro ao salvar parâmetros de vendas')
    } finally {
      setSalvando(false)
    }
  }

  const mostrarMensagem = (tipo: 'sucesso' | 'erro', texto: string) => {
    setMensagem({ tipo, texto })
    setTimeout(() => setMensagem(null), 5000)
  }

  if (carregando) {
    return (
      <div className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-gray-500">Carregando parâmetros...</div>
        </div>
      </div>
    )
  }

  const abas = [
    {
      id: 'layout-pedido' as AbaAtiva,
      nome: 'Layout Pedido',
      icone: FileText,
      descricao: 'Personalizar impressão de vendas'
    }
  ]

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Cabeçalho */}
      <div className="bg-white shadow rounded-lg mb-4 sm:mb-6">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Parâmetros de Vendas</h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure o logotipo e textos que aparecem na impressão de vendas
          </p>
        </div>

        {/* Abas */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto" aria-label="Tabs">
            {abas.map((aba) => {
              const Icon = aba.icone
              const isActive = abaAtiva === aba.id
              
              return (
                <button
                  key={aba.id}
                  onClick={() => setAbaAtiva(aba.id)}
                  className={`
                    group inline-flex items-center px-4 sm:px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap
                    ${isActive
                      ? 'border-slate-700 text-slate-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${isActive ? 'text-slate-700' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  <div className="text-left">
                    <div>{aba.nome}</div>
                    <div className={`text-xs font-normal ${isActive ? 'text-slate-600' : 'text-gray-400'}`}>
                      {aba.descricao}
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      {abaAtiva === 'layout-pedido' && (
        <div className="space-y-6">
          {/* Mensagem de feedback */}
          {mensagem && (
            <div className={`p-4 rounded-md border ${
              mensagem.tipo === 'sucesso' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {mensagem.tipo === 'sucesso' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{mensagem.texto}</span>
              </div>
            </div>
          )}

          {/* Card de configurações */}
          <div className="bg-white rounded-lg border border-[#C9C4B5] shadow-sm">
            <div className="p-4 border-b border-[#C9C4B5] bg-[#394353]">
              <h2 className="text-sm font-semibold text-white">Configurações de Impressão</h2>
            </div>

            <div className="p-4 space-y-6">
              {/* Logotipo */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">
                    Logotipo
                  </label>
                  <button
                    type="button"
                    onClick={() => setMostrarLogo(!mostrarLogo)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {mostrarLogo ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visível</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Oculto</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="border-2 border-dashed border-[#C9C4B5] rounded-lg p-6">
                  {/* Sempre mostrar o logo salvo se não houver preview */}
                  {(previewUrl || logoUrl) && (
                    <div className="mb-4 flex items-center justify-center">
                      <div className="relative">
                        <img
                          src={previewUrl ? previewUrl : logoUrl || ''}
                          alt="Logo"
                          className="max-h-32 max-w-full object-contain rounded-md border border-gray-200"
                        />
                        {/* Só mostra o botão X se estiver trocando imagem */}
                        {previewUrl && (
                          <button
                            type="button"
                            onClick={handleRemoverLogo}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Upload de arquivo */}
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <div className="text-center">
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <span className="text-sm font-semibold text-[#394353] hover:opacity-80 transition-opacity">
                          Escolher arquivo
                        </span>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG, GIF ou WEBP (máx. 2MB)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nome da Empresa */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#394353] focus:border-transparent"
                  placeholder="Nome da empresa na impressão"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Aparece no cabeçalho da impressão de vendas
                </p>
              </div>

              {/* Slogan */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">
                  Slogan/Subtítulo
                </label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#394353] focus:border-transparent"
                  placeholder="Slogan ou subtítulo"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Texto secundário exibido abaixo do nome da empresa
                </p>
              </div>
            </div>

            {/* Rodapé com botões */}
            <div className="p-4 border-t border-[#C9C4B5] bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={carregarParametros}
                disabled={salvando}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvar}
                disabled={salvando}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#394353] rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {salvando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview da impressão */}
          <div className="bg-white rounded-lg border border-[#C9C4B5] shadow-sm">
            <div className="p-4 border-b border-[#C9C4B5] bg-[#394353]">
              <h2 className="text-sm font-semibold text-white">Preview do Cabeçalho</h2>
            </div>
            <div className="p-6">
              <div className="border-2 border-[#394353] rounded-md p-6 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {mostrarLogo && (previewUrl || logoUrl) && (
                      <img
                        src={previewUrl || logoUrl || ''}
                        alt="Logo Preview"
                        className="max-h-16 max-w-[120px] object-contain"
                      />
                    )}
                    <div>
                      <h1 className="text-xl font-bold text-[#394353]">{nomeEmpresa}</h1>
                      <p className="text-xs text-gray-600 mt-1">{slogan}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Pedido Nº</p>
                    <p className="text-xl font-bold text-[#394353]">#001</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">
                Este é um preview de como o cabeçalho aparecerá na impressão de vendas
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
