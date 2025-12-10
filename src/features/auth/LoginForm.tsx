import React, { useState } from 'react'
import { useAuth } from '../../shared/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { isSupabaseConfigured } from '../../lib/supabase'
import girafaImage from '../../assets/images/girafa-crescieperdi.png'

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
    <div className="min-h-screen py-16 px-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Grid tecnológico animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Linhas de grade horizontal */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`h-line-${i}`}
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"
            style={{
              top: `${i * 5}%`,
              animation: `pulseGrid ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`
            }}
          ></div>
        ))}
        
        {/* Linhas de grade vertical */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`v-line-${i}`}
            className="absolute h-full w-px bg-gradient-to-b from-transparent via-blue-500/20 to-transparent"
            style={{
              left: `${i * 5}%`,
              animation: `pulseGrid ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`
            }}
          ></div>
        ))}

        {/* Partículas flutuantes */}
        {[...Array(30)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 3 === 0 ? 'rgba(34, 211, 238, 0.6)' : i % 3 === 1 ? 'rgba(59, 130, 246, 0.6)' : 'rgba(168, 85, 247, 0.6)',
              boxShadow: `0 0 ${8 + Math.random() * 12}px ${i % 3 === 0 ? 'rgba(34, 211, 238, 0.4)' : i % 3 === 1 ? 'rgba(59, 130, 246, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          ></div>
        ))}

        {/* Círculos concêntricos pulsantes */}
        {[...Array(4)].map((_, i) => (
          <div
            key={`circle-${i}`}
            className="absolute rounded-full border border-cyan-500/20"
            style={{
              width: `${200 + i * 150}px`,
              height: `${200 + i * 150}px`,
              left: '10%',
              top: '30%',
              animation: `expandCircle ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 2}s`
            }}
          ></div>
        ))}

        {/* Ondas digitais */}
        {[...Array(5)].map((_, i) => (
          <div
            key={`wave-${i}`}
            className="absolute w-full h-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"
            style={{
              top: `${20 + i * 15}%`,
              animation: `wave ${6 + i}s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`,
              transform: 'skewY(-2deg)'
            }}
          ></div>
        ))}

        {/* Hexágonos tecnológicos */}
        {[...Array(8)].map((_, i) => {
          const size = 40 + Math.random() * 60;
          return (
            <div
              key={`hex-${i}`}
              className="absolute border-2 border-blue-500/10"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${10 + i * 12}%`,
                top: `${10 + (i % 3) * 25}%`,
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                animation: `rotateHex ${10 + i * 2}s linear infinite`,
                animationDelay: `${i * 0.5}s`
              }}
            ></div>
          );
        })}

        {/* Feixes de luz diagonal */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`beam-${i}`}
            className="absolute h-full w-1 bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent"
            style={{
              left: `${15 + i * 15}%`,
              transform: 'rotate(15deg)',
              animation: `slideBeam ${8 + i * 2}s linear infinite`,
              animationDelay: `${i * 1.5}s`,
              filter: 'blur(2px)'
            }}
          ></div>
        ))}
      </div>

      {/* Estilos de animação */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulseGrid {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        @keyframes expandCircle {
          0% { transform: scale(0.8); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.1; }
          100% { transform: scale(0.8); opacity: 0.3; }
        }
        @keyframes wave {
          0% { transform: translateX(-100%) skewY(-2deg); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateX(100%) skewY(-2deg); opacity: 0; }
        }
        @keyframes rotateHex {
          0% { transform: rotate(0deg); opacity: 0.2; }
          50% { opacity: 0.4; }
          100% { transform: rotate(360deg); opacity: 0.2; }
        }
        @keyframes slideBeam {
          0% { transform: translateY(-100%) rotate(15deg); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(15deg); opacity: 0; }
        }
        @keyframes floatGirafa {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-25px) rotate(2deg); }
        }
        .animate-float {
          animation: floatGirafa 6s ease-in-out infinite;
        }
      `}}>
      </style>

      <div className="max-w-7xl mx-auto relative z-10 px-4">
        {/* Header com Título */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-3 drop-shadow-lg">
            Tech Cresci e Perdi
          </h1>
          <p className="text-lg text-gray-300">
            Sistema de Gestão
          </p>
        </div>

        {/* Container Grid: Girafa + Formulário Centralizado */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          
          {/* Girafa Flutuante à Esquerda */}
          <div className="order-1 lg:col-span-1">
            <div className="relative flex items-center justify-center lg:justify-end">
              {/* Brilho ao redor da girafa */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
              <img 
                src={girafaImage} 
                alt="Girafa Cresci e Perdi" 
                className="relative w-full h-auto object-contain drop-shadow-2xl animate-float"
                style={{ 
                  maxHeight: '500px',
                  filter: 'drop-shadow(0 0 30px rgba(34, 211, 238, 0.4)) drop-shadow(0 0 60px rgba(168, 85, 247, 0.3))'
                }}
              />
            </div>
          </div>
          
          {/* Formulário de Login Centralizado */}
          <div className="order-2 lg:col-span-2">
            <div className="max-w-md mx-auto">
              <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-purple-500/30">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Faça login para continuar
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Acesse sua conta ou explore o sistema em modo demo
                  </p>
                </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {!isSupabaseConfigured && (
                  <div className="bg-yellow-900/40 border border-yellow-500/50 text-yellow-200 px-4 py-3 rounded-lg backdrop-blur-sm">
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
                  <div className="bg-red-900/40 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg backdrop-blur-sm">
                    {error}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="block w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-white placeholder-gray-400"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                      Senha
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="block w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-white placeholder-gray-400"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-500 hover:via-purple-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl shadow-purple-500/50"
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </button>
                  
                  <div className="text-center">
                    <a 
                      href="/nova-solicitacao"
                      className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors underline decoration-cyan-400/50 hover:decoration-cyan-300"
                    >
                      Solicite seu acesso
                    </a>
                  </div>
                  
                  {!isSupabaseConfigured && (
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="w-full flex justify-center py-3 px-4 border-2 border-cyan-500/50 text-sm font-medium rounded-lg text-cyan-300 bg-slate-800/30 hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all backdrop-blur-sm"
                    >
                      🚀 Explorar Sistema (Demo)
                    </button>
                  )}
                </div>
              </form>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}