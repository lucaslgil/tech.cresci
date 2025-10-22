import React, { useState } from 'react'
import { useAuth } from '../../shared/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { isSupabaseConfigured } from '../../lib/supabase'

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Tech Cresci e Perdi
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Faça login para continuar
            </p>
          </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {!isSupabaseConfigured && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <h4 className="font-bold">⚠️ Configuração Necessária</h4>
              <p className="text-sm mt-1">
                Para usar o sistema, configure as variáveis do Supabase no arquivo .env:
              </p>
              <ul className="text-xs mt-2 list-disc list-inside">
                <li>VITE_SUPABASE_URL</li>
                <li>VITE_SUPABASE_ANON_KEY</li>
              </ul>
              <p className="text-xs mt-2">
                <strong>Por enquanto, você pode explorar o sistema clicando em "Demo" abaixo.</strong>
              </p>
            </div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            
            <div className="text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
                <p className="text-blue-800 font-medium">👤 Login de Teste:</p>
                <p className="text-blue-700">Email: <code>admin@teste.com</code></p>
                <p className="text-blue-700">Senha: <code>123456</code></p>
                <p className="text-xs text-blue-600 mt-1">
                  Ou crie sua conta usando qualquer email válido
                </p>
              </div>
            </div>
            
            {!isSupabaseConfigured && (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="group relative w-full flex justify-center py-3 px-4 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-200"
              >
                🚀 Explorar Sistema (Demo)
              </button>
            )}
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}