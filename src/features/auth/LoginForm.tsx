import React, { useState } from 'react'
import { useAuth } from '../../shared/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { isSupabaseConfigured } from '../../lib/supabase'
import girafaImage from '../../assets/images/girafa-crescieperdi.png'
import moonImage from '../../assets/images/moon.png'

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
    <div className="min-h-screen py-16 px-4 relative overflow-hidden bg-black">
      {/* Fundo preto do universo com estrelas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Estrelas do universo */}
        {[...Array(200)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute bg-white rounded-full"
            style={{
              width: `${0.5 + Math.random() * 2.5}px`,
              height: `${0.5 + Math.random() * 2.5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.2 + Math.random() * 0.8,
              animation: `twinkle ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          ></div>
        ))}

        {/* Lua Branca - destaque único */}
        <div 
          className="absolute"
          style={{
            width: '180px',
            height: '180px',
            right: '10%',
            top: '20%',
          }}
        >
          {/* Brilho suave ao redor da Lua */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.15) 40%, transparent 70%)',
              filter: 'blur(20px)',
              transform: 'scale(1.4)',
              animation: 'pulseMoon 8s ease-in-out infinite'
            }}
          ></div>
          
          {/* Lua */}
          <img 
            src={moonImage}
            alt="Lua"
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              opacity: 0.95,
              filter: 'drop-shadow(0 0 60px rgba(255, 255, 255, 0.5)) drop-shadow(0 0 100px rgba(203, 213, 225, 0.3)) brightness(1.4) contrast(1.15)',
            }}
          />
          
          {/* Reflexo de luz solar */}
          <div 
            className="absolute rounded-full pointer-events-none"
            style={{
              top: '15%',
              left: '15%',
              width: '45%',
              height: '45%',
              background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.08) 40%, transparent 60%)',
            }}
          ></div>
        </div>

        {/* Cometas/Asteroides melhorados */}
        {[...Array(5)].map((_, i) => {
          const size = 2 + Math.random() * 3;
          const speed = 6 + i * 3;
          const delay = i * 6;
          const startY = 10 + i * 18;
          
          return (
            <div
              key={`comet-${i}`}
              className="absolute"
              style={{
                left: '-150px',
                top: `${startY}%`,
                animation: `comet ${speed}s linear infinite`,
                animationDelay: `${delay}s`
              }}
            >
              {/* Cabeça do cometa com brilho */}
              <div 
                className="relative"
                style={{
                  width: `${size * 4}px`,
                  height: `${size * 4}px`,
                }}
              >
                {/* Núcleo brilhante */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(34, 211, 238, 0.8) 40%, transparent 70%)',
                    boxShadow: `0 0 ${size * 8}px rgba(34, 211, 238, 0.8), 0 0 ${size * 15}px rgba(34, 211, 238, 0.4)`,
                  }}
                ></div>
                
                {/* Ponto central */}
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                  }}
                ></div>
              </div>
              
              {/* Cauda do cometa - múltiplas camadas */}
              <div className="absolute top-1/2 -translate-y-1/2" style={{ right: `${size * 2}px` }}>
                {/* Cauda principal */}
                <div 
                  className="h-1 bg-gradient-to-r from-cyan-300 via-cyan-500/50 to-transparent"
                  style={{
                    width: `${120 + i * 30}px`,
                    filter: 'blur(1px)',
                    boxShadow: '0 0 10px rgba(34, 211, 238, 0.5)'
                  }}
                ></div>
                
                {/* Cauda secundária (mais larga e difusa) */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-cyan-200/40 via-blue-400/20 to-transparent"
                  style={{
                    width: `${100 + i * 25}px`,
                    filter: 'blur(3px)',
                  }}
                ></div>
                
                {/* Cauda terciária (efeito de dispersão) */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 h-3 bg-gradient-to-r from-white/10 via-cyan-300/10 to-transparent"
                  style={{
                    width: `${80 + i * 20}px`,
                    filter: 'blur(5px)',
                  }}
                ></div>
              </div>
              
              {/* Partículas dispersas atrás */}
              {[...Array(3)].map((_, j) => (
                <div
                  key={`particle-${i}-${j}`}
                  className="absolute bg-cyan-300 rounded-full"
                  style={{
                    width: '1px',
                    height: '1px',
                    right: `${30 + j * 25}px`,
                    top: `${-3 + j * 3}px`,
                    opacity: 0.4 - j * 0.1,
                    boxShadow: '0 0 3px rgba(34, 211, 238, 0.6)'
                  }}
                ></div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Estilos de animação */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes pulseMoon {
          0%, 100% { opacity: 0.5; transform: scale(1.4); }
          50% { opacity: 0.8; transform: scale(1.5); }
        }
        @keyframes comet {
          0% { 
            transform: translate(0, 0) rotate(35deg) scale(0.5);
            opacity: 0;
          }
          5% {
            opacity: 1;
            transform: translate(50px, 50px) rotate(35deg) scale(1);
          }
          85% {
            opacity: 1;
          }
          100% { 
            transform: translate(calc(100vw + 300px), calc(100vh + 300px)) rotate(35deg) scale(1.2);
            opacity: 0;
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
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