import { useState } from 'react'
import { useAuth } from '../../shared/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { isSupabaseConfigured } from '../../lib/supabase'

export const LoginForm = () => {
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '48px 16px' }}>
      <div style={{ maxWidth: '448px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            Sistema de Inventário
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Faça login em sua conta
          </p>
        </div>

        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {!isSupabaseConfigured && (
              <div style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e', padding: '16px', borderRadius: '6px' }}>
                <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>⚠️ Configuração Necessária</h4>
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                  Para usar o sistema, configure as variáveis do Supabase no arquivo .env
                </p>
                <ul style={{ fontSize: '12px', marginBottom: '8px', paddingLeft: '16px' }}>
                  <li>VITE_SUPABASE_URL</li>
                  <li>VITE_SUPABASE_ANON_KEY</li>
                </ul>
                <p style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  Por enquanto, você pode explorar o sistema clicando em "Demo" abaixo.
                </p>
              </div>
            )}

            {error && (
              <div style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444', color: '#dc2626', padding: '12px', borderRadius: '6px' }}>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px', 
                  fontSize: '14px',
                  outline: 'none'
                }}
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px', 
                  fontSize: '14px',
                  outline: 'none'
                }}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: loading ? '#9ca3af' : '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ backgroundColor: '#dbeafe', border: '1px solid #3b82f6', borderRadius: '6px', padding: '12px', fontSize: '14px' }}>
                  <p style={{ color: '#1d4ed8', fontWeight: '500', marginBottom: '4px' }}>👤 Login de Teste:</p>
                  <p style={{ color: '#1e40af' }}>Email: <code>admin@teste.com</code></p>
                  <p style={{ color: '#1e40af' }}>Senha: <code>123456</code></p>
                  <p style={{ fontSize: '12px', color: '#1e40af', marginTop: '4px' }}>
                    Ou crie sua conta usando qualquer email válido
                  </p>
                </div>
              </div>
              
              {!isSupabaseConfigured && (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: 'white',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
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