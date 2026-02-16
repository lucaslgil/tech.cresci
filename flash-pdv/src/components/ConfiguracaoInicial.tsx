import { useState, useEffect } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { ConfigPDV } from '../types/electron'

interface ConfiguracaoInicialProps {
  onConfigSalva: (config: ConfigPDV) => void
}

interface Empresa {
  empresa_id: number  // Retornado por get_user_empresas()
  codigo: string
  razao_social: string
  nome_fantasia: string
  cnpj: string
}

interface Usuario {
  id: string
  email: string
  nome: string
  cargo: string
  empresa_id: number
}

export default function ConfiguracaoInicial({ onConfigSalva }: ConfiguracaoInicialProps) {
  const [step, setStep] = useState(1)
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseKey, setSupabaseKey] = useState('')
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null)
  
  const [empresasDisponiveis, setEmpresasDisponiveis] = useState<Empresa[]>([])
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [apiReady, setApiReady] = useState(false)

  // Aguardar electronAPI estar disponível
  useEffect(() => {
    const checkAPI = () => {
      const isAvailable = typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined'
      console.log('🔍 Verificando electronAPI:', {
        isAvailable,
        window: typeof window !== 'undefined',
        electronAPI: window.electronAPI
      })
      setApiReady(isAvailable)
      
      if (!isAvailable) {
        setTimeout(checkAPI, 100)
      }
    }
    
    checkAPI()
  }, [])

  // ==============================================
  // STEP 1: CONEXÃO SUPABASE
  // ==============================================

  const testarConexao = async () => {
    setLoading(true)
    setErro('')

    try {
      // Validações
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Preencha URL e Chave de API')
      }

      if (!supabaseUrl.includes('.supabase.co')) {
        throw new Error('URL inválida. Deve ser: https://xxx.supabase.co')
      }

      if (supabaseKey.toLowerCase().includes('service_role')) {
        throw new Error('⚠️ ERRO DE SEGURANÇA: Use apenas ANON PUBLIC KEY, nunca Service Role Key!')
      }

      // Criar cliente Supabase
      const client = createClient(supabaseUrl, supabaseKey)
      
      // Teste simples de conexão
      const { error } = await client.auth.getSession()
      
      if (error) {
        throw new Error('Erro ao conectar: ' + error.message)
      }

      setSupabase(client)
      alert('✅ Conexão estabelecida com sucesso!')
      setStep(2)
    } catch (error: any) {
      const msg = error.message || 'Erro ao conectar com a retaguarda'
      setErro(msg)
      console.error('Erro de conexão:', error)
    } finally {
      setLoading(false)
    }
  }

  // ==============================================
  // STEP 2: LOGIN
  // ==============================================

  const fazerLogin = async () => {
    if (!supabase) return
    
    setLoading(true)
    setErro('')

    try {
      // Validações
      if (!email || !senha) {
        throw new Error('Preencha email e senha')
      }

      // Fazer login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      })

      if (authError) {
        throw new Error('Login falhou: ' + authError.message)
      }

      if (!authData.user) {
        throw new Error('Usuário não encontrado')
      }

      console.log('✅ Login realizado:', authData.user.email)

      // Buscar dados do usuário na tabela usuarios
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id, email, nome, cargo, empresa_id')
        .eq('id', authData.user.id)
        .single()

      if (userError) {
        throw new Error('Erro ao buscar dados do usuário: ' + userError.message)
      }

      if (!userData) {
        throw new Error('Usuário não encontrado na tabela usuarios')
      }

      console.log('✅ Dados do usuário:', userData)
      setUsuarioLogado(userData)

      // Buscar empresas que o usuário tem acesso via users_empresas
      const { data: empresas, error: empresasError } = await supabase
        .rpc('get_user_empresas')

      if (empresasError) {
        throw new Error('Erro ao buscar empresas: ' + empresasError.message)
      }

      if (!empresas || empresas.length === 0) {
        throw new Error('Usuário não tem acesso a nenhuma empresa. Entre em contato com o administrador.')
      }

      console.log('✅ Empresas encontradas:', empresas.length)
      setEmpresasDisponiveis(empresas)

      // Se usuário tem acesso a apenas 1 empresa, seleciona automaticamente
      if (empresas.length === 1) {
        setEmpresaSelecionada(empresas[0])
        console.log('✅ Apenas 1 empresa disponível, selecionada automaticamente')
      }

      setStep(3)
    } catch (error: any) {
      const msg = error.message || 'Erro ao fazer login'
      setErro(msg)
      console.error('Erro de login:', error)
    } finally {
      setLoading(false)
    }
  }

  // ==============================================
  // STEP 3: SELEÇÃO DE EMPRESA
  // ==============================================

  const finalizarConfiguracao = async () => {
    if (!usuarioLogado || !empresaSelecionada) return
    
    setLoading(true)
    setErro('')

    try {
      if (!apiReady) {
        throw new Error('Aguardando API do Electron... Tente novamente em instantes.')
      }

      // Verificar se usuário pode trocar empresa
      // Usuário é master se: cargo contém "Admin" ou "Master" OU não tem empresa_id específica
      const permissaoMaster = 
        usuarioLogado.cargo?.toLowerCase().includes('admin') ||
        usuarioLogado.cargo?.toLowerCase().includes('master') ||
        !usuarioLogado.empresa_id

      const config: ConfigPDV = {
        supabaseUrl,
        supabaseKey,
        empresaId: empresaSelecionada.empresa_id,
        empresaNome: empresaSelecionada.nome_fantasia || empresaSelecionada.razao_social,
        usuarioId: usuarioLogado.id,
        usuarioEmail: usuarioLogado.email,
        usuarioNome: usuarioLogado.nome,
        usuarioCargo: usuarioLogado.cargo,
        permissaoMaster
      }

      console.log('💾 Salvando configuração:', config)

      // Salvar configuração no SQLite local
      await window.electronAPI.db.execute(
        `INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)`,
        ['pdv_config', JSON.stringify(config)]
      )

      console.log('✅ Configuração salva com sucesso!')

      onConfigSalva(config)
    } catch (error: any) {
      console.error('❌ Erro ao salvar configuração:', error)
      setErro(error.message || 'Erro ao salvar configuração')
    } finally {
      setLoading(false)
    }
  }

  // ==============================================
  // RENDERIZAÇÃO
  // ==============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-flash-dark text-white px-6 py-3 rounded-lg mb-4">
            <h1 className="text-2xl font-bold">FLASH PDV</h1>
          </div>
          <p className="text-gray-600 text-sm">Configuração Inicial - Primeira Execução</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= 1 ? 'bg-flash-dark text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <div className={`w-12 h-1 ${step >= 2 ? 'bg-flash-dark' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= 2 ? 'bg-flash-dark text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
            <div className={`w-12 h-1 ${step >= 3 ? 'bg-flash-dark' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= 3 ? 'bg-flash-dark text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* STEP 1: CONEXÃO */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-flash-dark mb-4">
              🔗 Conectar com Retaguarda
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Configure a conexão com o sistema web principal
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  URL do Supabase *
                </label>
                <input
                  type="url"
                  value={supabaseUrl}
                  onChange={(e) => {
                    setSupabaseUrl(e.target.value)
                    setErro('')
                  }}
                  placeholder="https://alylochrrlvgcvjdmkmum.supabase.co"
                  className="w-full px-3 py-2 text-sm border border-flash-light rounded-md focus:ring-2 focus:ring-flash-dark focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supabase → Settings → API → Project URL
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  🔑 Chave de API (APENAS Anon Public Key) *
                </label>
                <textarea
                  value={supabaseKey}
                  onChange={(e) => {
                    setSupabaseKey(e.target.value)
                    setErro('')
                  }}
                  placeholder="eyJhbGc..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-flash-light rounded-md focus:ring-2 focus:ring-flash-dark focus:border-transparent font-mono"
                />
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-gray-500">
                    Supabase → Settings → API → Project API keys → anon public
                  </p>
                  <p className="text-xs text-orange-600 font-semibold">
                    ⚠️ NUNCA use Service Role Key em aplicativos cliente!
                  </p>
                </div>
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-700">❌ {erro}</p>
                </div>
              )}

              <button
                onClick={testarConexao}
                disabled={loading || !supabaseUrl || !supabaseKey}
                className="w-full bg-flash-dark text-white px-4 py-3 rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? '🔄 Testando conexão...' : '🚀 Testar e Continuar'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: LOGIN */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-flash-dark mb-4">
              🔐 Fazer Login
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Entre com suas credenciais da retaguarda
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErro('')
                  }}
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2 text-sm border border-flash-light rounded-md focus:ring-2 focus:ring-flash-dark focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && fazerLogin()}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Senha *
                </label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value)
                    setErro('')
                  }}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm border border-flash-light rounded-md focus:ring-2 focus:ring-flash-dark focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && fazerLogin()}
                />
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-700">❌ {erro}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border-2 border-flash-dark text-flash-dark px-4 py-3 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-all"
                >
                  ← Voltar
                </button>
                <button
                  onClick={fazerLogin}
                  disabled={loading || !email || !senha}
                  className="flex-1 bg-flash-dark text-white px-4 py-3 rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? '🔄 Entrando...' : '✅ Fazer Login'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SELEÇÃO DE EMPRESA */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-flash-dark mb-4">
              🏢 Selecionar Empresa
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Escolha qual empresa este PDV irá representar
            </p>

            {/* Informações do usuário logado */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-blue-800 mb-1">
                👤 Operador: {usuarioLogado?.nome}
              </p>
              <p className="text-xs text-blue-700">
                📧 {usuarioLogado?.email} • 💼 {usuarioLogado?.cargo}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                🏢 Você tem acesso a {empresasDisponiveis.length} empresa{empresasDisponiveis.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {empresasDisponiveis.map((empresa) => (
                <button
                  key={empresa.empresa_id}
                  onClick={() => setEmpresaSelecionada(empresa)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    empresaSelecionada?.empresa_id === empresa.empresa_id
                      ? 'border-flash-dark bg-flash-dark/5'
                      : 'border-gray-200 hover:border-flash-light'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-800">
                        {empresa.nome_fantasia}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {empresa.razao_social !== empresa.nome_fantasia && `${empresa.razao_social} • `}
                        CNPJ: {empresa.cnpj}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Código: {empresa.codigo}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      empresaSelecionada?.empresa_id === empresa.empresa_id
                        ? 'border-flash-dark bg-flash-dark'
                        : 'border-gray-300'
                    }`}>
                      {empresaSelecionada?.empresa_id === empresa.empresa_id && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Aviso sobre permissão master */}
            {usuarioLogado && (
              <div className={`border rounded-lg p-3 mb-4 ${
                usuarioLogado.cargo?.toLowerCase().includes('admin') || 
                usuarioLogado.cargo?.toLowerCase().includes('master') || 
                !usuarioLogado.empresa_id
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                {(usuarioLogado.cargo?.toLowerCase().includes('admin') || 
                  usuarioLogado.cargo?.toLowerCase().includes('master') || 
                  !usuarioLogado.empresa_id) ? (
                  <p className="text-xs text-green-800">
                    <span className="font-semibold">🔓 Permissão Master:</span> Você poderá trocar a empresa vinculada ao PDV posteriormente.
                  </p>
                ) : (
                  <p className="text-xs text-yellow-800">
                    <span className="font-semibold">🔒 Permissão Restrita:</span> A empresa selecionada ficará permanentemente vinculada a este PDV. Apenas usuários Master podem alterá-la.
                  </p>
                )}
              </div>
            )}

            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-700">❌ {erro}</p>
              </div>
            )}

            {!apiReady && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <p className="text-sm text-yellow-700">⏳ Carregando sistema... aguarde</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border-2 border-flash-dark text-flash-dark px-4 py-3 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-all"
              >
                ← Voltar
              </button>
              <button
                onClick={finalizarConfiguracao}
                disabled={!apiReady || loading || !empresaSelecionada}
                className="flex-1 bg-flash-dark text-white px-4 py-3 rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {!apiReady ? '⏳ Carregando...' : loading ? '💾 Salvando...' : '✅ Finalizar Configuração'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            💡 Configuração segura com autenticação real e isolamento multi-tenant
          </p>
        </div>
      </div>
    </div>
  )
}
