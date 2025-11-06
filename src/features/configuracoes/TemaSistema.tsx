import React, { useState, useEffect } from 'react'
import { Check, RefreshCw, Download, Upload } from 'lucide-react'

interface TemaConfig {
  primaria: string
  secundaria: string
  destaque: string
  fundo: string
  texto: string
  borda: string
}

const temasPreDefinidos = [
  {
    nome: 'Slate (Padrão)',
    id: 'slate',
    cores: {
      primaria: '#334155', // slate-700
      secundaria: '#1e293b', // slate-800
      destaque: '#0ea5e9', // sky-500
      fundo: '#f8fafc', // slate-50
      texto: '#1e293b', // slate-800
      borda: '#cbd5e1' // slate-300
    }
  },
  {
    nome: 'Azul Profissional',
    id: 'blue',
    cores: {
      primaria: '#1e40af', // blue-800
      secundaria: '#1e3a8a', // blue-900
      destaque: '#3b82f6', // blue-500
      fundo: '#eff6ff', // blue-50
      texto: '#1e293b',
      borda: '#93c5fd' // blue-300
    }
  },
  {
    nome: 'Verde Corporativo',
    id: 'green',
    cores: {
      primaria: '#047857', // emerald-700
      secundaria: '#065f46', // emerald-800
      destaque: '#10b981', // emerald-500
      fundo: '#ecfdf5', // emerald-50
      texto: '#1e293b',
      borda: '#6ee7b7' // emerald-300
    }
  },
  {
    nome: 'Roxo Moderno',
    id: 'purple',
    cores: {
      primaria: '#7c3aed', // violet-600
      secundaria: '#6d28d9', // violet-700
      destaque: '#a78bfa', // violet-400
      fundo: '#f5f3ff', // violet-50
      texto: '#1e293b',
      borda: '#c4b5fd' // violet-300
    }
  },
  {
    nome: 'Laranja Energético',
    id: 'orange',
    cores: {
      primaria: '#ea580c', // orange-600
      secundaria: '#c2410c', // orange-700
      destaque: '#f97316', // orange-500
      fundo: '#fff7ed', // orange-50
      texto: '#1e293b',
      borda: '#fdba74' // orange-300
    }
  },
  {
    nome: 'Modo Escuro',
    id: 'dark',
    cores: {
      primaria: '#374151', // gray-700
      secundaria: '#1f2937', // gray-800
      destaque: '#60a5fa', // blue-400
      fundo: '#111827', // gray-900
      texto: '#f9fafb', // gray-50
      borda: '#4b5563' // gray-600
    }
  }
]

export const TemaSistema: React.FC = () => {
  const [temaSelecionado, setTemaSelecionado] = useState('slate')
  const [coresCustomizadas, setCoresCustomizadas] = useState<TemaConfig>(temasPreDefinidos[0].cores)
  const [modoCustomizado, setModoCustomizado] = useState(false)

  useEffect(() => {
    // Carregar tema salvo do localStorage
    const temaSalvo = localStorage.getItem('tema-sistema')
    if (temaSalvo) {
      try {
        const tema = JSON.parse(temaSalvo)
        setTemaSelecionado(tema.id)
        if (tema.customizado) {
          setCoresCustomizadas(tema.cores)
          setModoCustomizado(true)
        }
      } catch (error) {
        console.error('Erro ao carregar tema:', error)
      }
    }
  }, [])

  const aplicarTema = (temaId: string) => {
    const tema = temasPreDefinidos.find(t => t.id === temaId)
    if (tema) {
      setTemaSelecionado(temaId)
      setCoresCustomizadas(tema.cores)
      setModoCustomizado(false)
      
      // Salvar no localStorage
      localStorage.setItem('tema-sistema', JSON.stringify({
        id: temaId,
        cores: tema.cores,
        customizado: false
      }))

      // Aplicar cores no CSS
      aplicarCoresCSS(tema.cores)
      
      alert('Tema aplicado com sucesso!')
    }
  }

  const aplicarCoresCustomizadas = () => {
    setModoCustomizado(true)
    setTemaSelecionado('custom')
    
    // Salvar no localStorage
    localStorage.setItem('tema-sistema', JSON.stringify({
      id: 'custom',
      cores: coresCustomizadas,
      customizado: true
    }))

    // Aplicar cores no CSS
    aplicarCoresCSS(coresCustomizadas)
    
    alert('Cores personalizadas aplicadas com sucesso!')
  }

  const aplicarCoresCSS = (cores: TemaConfig) => {
    // Aplicar CSS customizado (isso é uma demonstração - em produção usaria CSS variables)
    const root = document.documentElement
    root.style.setProperty('--cor-primaria', cores.primaria)
    root.style.setProperty('--cor-secundaria', cores.secundaria)
    root.style.setProperty('--cor-destaque', cores.destaque)
    root.style.setProperty('--cor-fundo', cores.fundo)
    root.style.setProperty('--cor-texto', cores.texto)
    root.style.setProperty('--cor-borda', cores.borda)
  }

  const resetarTema = () => {
    if (confirm('Deseja restaurar o tema padrão?')) {
      aplicarTema('slate')
    }
  }

  const exportarTema = () => {
    const temaExportar = {
      id: temaSelecionado,
      cores: coresCustomizadas,
      customizado: modoCustomizado
    }
    
    const dataStr = JSON.stringify(temaExportar, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'tema-sistema.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const importarTema = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const tema = JSON.parse(event.target?.result as string)
          setCoresCustomizadas(tema.cores)
          setTemaSelecionado(tema.id)
          setModoCustomizado(tema.customizado)
          aplicarCoresCSS(tema.cores)
          alert('Tema importado com sucesso!')
        } catch (error) {
          alert('Erro ao importar tema. Verifique o arquivo.')
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Personalizar Tema</h2>
          <p className="text-sm text-gray-600 mt-1">
            Escolha um tema pré-definido ou personalize as cores do sistema
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={resetarTema}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Restaurar Padrão
          </button>
          <button
            onClick={exportarTema}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Tema
          </button>
          <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Importar Tema
            <input
              type="file"
              accept=".json"
              onChange={importarTema}
              className="hidden"
            />
          </label>
        </div>

        {/* Temas Pré-definidos */}
        <div className="mb-8">
          <h3 className="text-md font-medium text-gray-900 mb-4">Temas Pré-definidos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {temasPreDefinidos.map((tema) => (
              <div
                key={tema.id}
                onClick={() => aplicarTema(tema.id)}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  temaSelecionado === tema.id && !modoCustomizado
                    ? 'border-slate-700 bg-slate-50'
                    : 'border-gray-200 hover:border-slate-400'
                }`}
              >
                {temaSelecionado === tema.id && !modoCustomizado && (
                  <div className="absolute top-2 right-2 bg-slate-700 rounded-full p-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <h4 className="font-medium text-gray-900 mb-3">{tema.nome}</h4>
                
                <div className="grid grid-cols-6 gap-2">
                  <div
                    className="h-8 rounded border border-gray-200"
                    style={{ backgroundColor: tema.cores.primaria }}
                    title="Primária"
                  />
                  <div
                    className="h-8 rounded border border-gray-200"
                    style={{ backgroundColor: tema.cores.secundaria }}
                    title="Secundária"
                  />
                  <div
                    className="h-8 rounded border border-gray-200"
                    style={{ backgroundColor: tema.cores.destaque }}
                    title="Destaque"
                  />
                  <div
                    className="h-8 rounded border border-gray-200"
                    style={{ backgroundColor: tema.cores.fundo }}
                    title="Fundo"
                  />
                  <div
                    className="h-8 rounded border border-gray-200"
                    style={{ backgroundColor: tema.cores.texto }}
                    title="Texto"
                  />
                  <div
                    className="h-8 rounded border border-gray-200"
                    style={{ backgroundColor: tema.cores.borda }}
                    title="Borda"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personalização de Cores */}
        <div className="border-t pt-8">
          <h3 className="text-md font-medium text-gray-900 mb-4">Personalizar Cores</h3>
          <div className="bg-slate-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor Primária
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={coresCustomizadas.primaria}
                    onChange={(e) => setCoresCustomizadas({ ...coresCustomizadas, primaria: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={coresCustomizadas.primaria}
                    onChange={(e) => setCoresCustomizadas({ ...coresCustomizadas, primaria: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor Secundária
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={coresCustomizadas.secundaria}
                    onChange={(e) => setCoresCustomizadas({ ...coresCustomizadas, secundaria: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={coresCustomizadas.secundaria}
                    onChange={(e) => setCoresCustomizadas({ ...coresCustomizadas, secundaria: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor de Destaque
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={coresCustomizadas.destaque}
                    onChange={(e) => setCoresCustomizadas({ ...coresCustomizadas, destaque: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={coresCustomizadas.destaque}
                    onChange={(e) => setCoresCustomizadas({ ...coresCustomizadas, destaque: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor de Fundo
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={coresCustomizadas.fundo}
                    onChange={(e) => setCoresCustomizadas({ ...coresCustomizadas, fundo: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={coresCustomizadas.fundo}
                    onChange={(e) => setCoresCustomizadas({ ...coresCustomizadas, fundo: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor do Texto
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={coresCustomizadas.texto}
                    onChange={(e) => setCoresCustomizadas({ ...coresCustomizadas, texto: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={coresCustomizadas.texto}
                    onChange={(e) => setCoresCustomizadas({ ...coresCustomizadas, texto: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor da Borda
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={coresCustomizadas.borda}
                    onChange={(e) => setCoresCustomizadas({ ...coresCustomizadas, borda: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={coresCustomizadas.borda}
                    onChange={(e) => setCoresCustomizadas({ ...coresCustomizadas, borda: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={aplicarCoresCustomizadas}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Aplicar Cores Personalizadas
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-8 border-t pt-8">
          <h3 className="text-md font-medium text-gray-900 mb-4">Preview</h3>
          <div className="border rounded-lg p-6" style={{ backgroundColor: coresCustomizadas.fundo }}>
            <div className="space-y-4">
              <button
                className="px-4 py-2 rounded-md text-white font-medium"
                style={{ backgroundColor: coresCustomizadas.primaria }}
              >
                Botão Primário
              </button>
              <button
                className="px-4 py-2 rounded-md text-white font-medium ml-3"
                style={{ backgroundColor: coresCustomizadas.secundaria }}
              >
                Botão Secundário
              </button>
              <button
                className="px-4 py-2 rounded-md text-white font-medium ml-3"
                style={{ backgroundColor: coresCustomizadas.destaque }}
              >
                Botão Destaque
              </button>
              
              <div className="mt-4">
                <p style={{ color: coresCustomizadas.texto }}>
                  Este é um exemplo de texto com a cor selecionada.
                </p>
                <div
                  className="mt-4 p-4 rounded"
                  style={{ borderColor: coresCustomizadas.borda, borderWidth: '1px' }}
                >
                  Exemplo de borda
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
