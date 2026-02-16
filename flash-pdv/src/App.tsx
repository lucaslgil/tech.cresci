import { useState, useEffect } from 'react'
import ConfiguracaoInicial from './components/ConfiguracaoInicial'
import VendaPDV from './components/VendaPDV'
import HistoricoVendas from './components/HistoricoVendas'
import ConsultaProdutos from './components/ConsultaProdutos'
import { ConfigPDV } from './types/electron'

type TelaPDV = 'dashboard' | 'nova-venda' | 'historico-vendas' | 'consulta-produtos'

function App() {
  const [configurado, setConfigurado] = useState(false)
  const [config, setConfig] = useState<ConfigPDV | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [version, setVersion] = useState<string>('')
  const [telaAtual, setTelaAtual] = useState<TelaPDV>('dashboard')

  // Verificar se já existe configuração
  useEffect(() => {
    verificarConfiguracao()
  }, [])

  const verificarConfiguracao = async () => {
    try {
      const result = await window.electronAPI.db.query(
        `SELECT value FROM config WHERE key = ?`,
        ['pdv_config']
      )

      if (result && result.length > 0) {
        const savedConfig = JSON.parse(result[0].value)
        setConfig(savedConfig)
        setConfigurado(true)
      }
    } catch (error) {
      console.error('Erro ao verificar configuração:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfigSalva = (novaConfig: ConfigPDV) => {
    setConfig(novaConfig)
    setConfigurado(true)
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await window.electronAPI.sync.start()
      alert(result.message)
    } catch (error) {
      alert('Erro ao sincronizar: ' + error)
    } finally {
      setSyncing(false)
    }
  }

  const loadVersion = async () => {
    const v = await window.electronAPI.app.getVersion()
    setVersion(v)
  }

  const abrirConfiguracao = () => {
    setConfigurado(false)
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-gray-600">Carregando FLASH PDV...</p>
        </div>
      </div>
    )
  }

  // Se não está configurado, mostrar tela de configuração
  if (!configurado) {
    return <ConfiguracaoInicial onConfigSalva={handleConfigSalva} />
  }

  // Verificar se config existe antes de renderizar telas
  if (!config) {
    return null
  }

  // Renderizar telas específicas
  if (telaAtual === 'nova-venda') {
    return <VendaPDV config={config} onVoltar={() => setTelaAtual('dashboard')} />
  }

  if (telaAtual === 'historico-vendas') {
    return <HistoricoVendas config={config} onVoltar={() => setTelaAtual('dashboard')} />
  }

  if (telaAtual === 'consulta-produtos') {
    return <ConsultaProdutos config={config} onVoltar={() => setTelaAtual('dashboard')} />
  }

  // Dashboard principal
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-flash-dark text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">FLASH PDV</h1>
              <p className="text-sm text-gray-300">
                {config?.empresaNome} • {config?.usuarioNome}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2 bg-white text-flash-dark rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50"
              >
                {syncing ? 'Sincronizando...' : '🔄 Sincronizar'}
              </button>
              
              <button
                onClick={loadVersion}
                className="px-3 py-2 bg-flash-dark border border-flash-light rounded-lg text-xs"
              >
                ℹ️ Info
              </button>

              {config?.permissaoMaster && (
                <button
                  onClick={abrirConfiguracao}
                  className="px-3 py-2 bg-flash-dark border border-flash-light rounded-lg text-xs"
                  title="Reconfigurar PDV (Apenas Master)"
                >
                  ⚙️
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card: Nova Venda */}
          <div 
            onClick={() => setTelaAtual('nova-venda')}
            className="bg-white rounded-lg shadow-md p-6 border-2 border-flash-light hover:border-flash-dark cursor-pointer transition-all"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">🛒</div>
              <h2 className="text-xl font-bold text-flash-dark mb-2">Nova Venda</h2>
              <p className="text-sm text-gray-600">Iniciar novo atendimento</p>
            </div>
          </div>

          {/* Card: Histórico */}
          <div 
            onClick={() => setTelaAtual('historico-vendas')}
            className="bg-white rounded-lg shadow-md p-6 border-2 border-flash-light hover:border-flash-dark cursor-pointer transition-all"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-xl font-bold text-flash-dark mb-2">Histórico</h2>
              <p className="text-sm text-gray-600">Vendas realizadas</p>
            </div>
          </div>

          {/* Card: Produtos */}
          <div 
            onClick={() => setTelaAtual('consulta-produtos')}
            className="bg-white rounded-lg shadow-md p-6 border-2 border-flash-light hover:border-flash-dark cursor-pointer transition-all"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">📦</div>
              <h2 className="text-xl font-bold text-flash-dark mb-2">Produtos</h2>
              <p className="text-sm text-gray-600">Consultar catálogo</p>
            </div>
          </div>
        </div>

        {/* Status */}
        {version && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Versão: {version}
          </div>
        )}

        {/* Avisos */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="font-semibold text-flash-dark mb-1">Sistema Offline</h3>
              <p className="text-sm text-gray-700">
                O FLASH PDV funciona 100% offline. Sincronize periodicamente para enviar vendas 
                à retaguarda e atualizar produtos/clientes.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
