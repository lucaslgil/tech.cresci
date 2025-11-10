import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'
import girafaImage from '../../assets/images/girafa-crescieperdi.png'

export const NovaSolicitacao: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    solicitante: '',
    email_solicitante: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.titulo.trim()) {
      setError('Título é obrigatório')
      return
    }

    if (!formData.solicitante.trim()) {
      setError('Nome é obrigatório')
      return
    }

    if (!formData.email_solicitante.trim()) {
      setError('Email é obrigatório')
      return
    }

    try {
      setLoading(true)

      const { error: insertError } = await supabase
        .from('tarefas')
        .insert({
          titulo: formData.titulo,
          descricao: formData.descricao,
          solicitante: formData.solicitante,
          email_solicitante: formData.email_solicitante,
          categoria: 'Suporte de TI',
          prioridade: 'Média',
          status: 'Aberto'
        })

      if (insertError) throw insertError

      setShowSuccess(true)
      
      // Resetar formulário
      setFormData({
        titulo: '',
        descricao: '',
        solicitante: '',
        email_solicitante: ''
      })
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error)
      setError('Erro ao enviar solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Elementos animados de fundo - simplificados */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative z-10 border border-white/20">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full shadow-lg shadow-green-500/50">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Solicitação Enviada!
          </h2>
          <p className="text-gray-600 mb-6">
            Sua solicitação foi registrada com sucesso. Em breve entraremos em contato.
          </p>
          <button
            onClick={() => {
              setShowSuccess(false)
              setFormData({
                titulo: '',
                descricao: '',
                solicitante: '',
                email_solicitante: ''
              })
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-lg shadow-blue-500/30"
          >
            Enviar Nova Solicitação
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-12 px-4 relative overflow-hidden">
      {/* Elementos tecnológicos animados no fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Círculos animados */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Grid tecnológico */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }}></div>
        
        {/* Partículas flutuantes */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.3 + Math.random() * 0.5
            }}
          ></div>
        ))}
        
        {/* Linhas de código simuladas */}
        {[...Array(5)].map((_, i) => (
          <div
            key={`line-${i}`}
            className="absolute h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"
            style={{
              width: `${200 + Math.random() * 300}px`,
              left: `${Math.random() * 100}%`,
              top: `${20 + i * 20}%`,
              animation: `slideRight ${10 + Math.random() * 10}s linear infinite`,
              animationDelay: `${i * 2}s`
            }}
          ></div>
        ))}
        
        {/* Hexágonos decorativos */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`hex-${i}`}
            className="absolute border border-blue-500/20"
            style={{
              width: '40px',
              height: '40px',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: 'rotate(45deg)',
              animation: `spin ${20 + Math.random() * 20}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          ></div>
        ))}
      </div>

      {/* Estilos de animação */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-40px) translateX(-10px); }
          75% { transform: translateY(-20px) translateX(5px); }
        }
        @keyframes slideRight {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(100vw); opacity: 0; }
        }
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-float {
          animation: floatGirafa 3s ease-in-out infinite;
        }
        @keyframes floatGirafa {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .delay-500 { animation-delay: 0.5s; }
        .delay-1000 { animation-delay: 1s; }
      `}}>
      </style>

      <div className="max-w-7xl mx-auto relative z-10 px-4">
        {/* Header com Título */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 drop-shadow-lg">
            Central de Solicitações
          </h1>
          <p className="text-lg text-blue-100 mb-2">
            Preencha o formulário abaixo para registrar sua solicitação
          </p>
          <p className="text-sm text-blue-200">
            ✓ Rápido e Fácil • ✓ Acompanhamento em Tempo Real • ✓ Resposta Garantida
          </p>
        </div>

        {/* Container Grid: Formulário + Girafa */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Formulário */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20 order-2 lg:order-1">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título da Solicitação *
              </label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Problema com impressora"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição Detalhada *
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva sua solicitação com o máximo de detalhes possível..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Grid de 2 colunas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  value={formData.solicitante}
                  onChange={(e) => setFormData({ ...formData, solicitante: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seu Email *
                </label>
                <input
                  type="email"
                  value={formData.email_solicitante}
                  onChange={(e) => setFormData({ ...formData, email_solicitante: e.target.value })}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Informação */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Importante:</strong> Após enviar, você receberá um email de confirmação e 
                nossa equipe entrará em contato o mais breve possível.
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    titulo: '',
                    descricao: '',
                    solicitante: '',
                    email_solicitante: ''
                  })
                  setError(null)
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
              >
                Limpar Formulário
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar Solicitação
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

          {/* Girafa Lateral */}
          <div className="hidden lg:flex items-center justify-center order-1 lg:order-2">
            <img 
              src={girafaImage} 
              alt="Girafa Cresci e Perdi" 
              className="w-full max-w-md object-contain drop-shadow-2xl animate-float"
              style={{
                filter: 'drop-shadow(0 20px 60px rgba(0, 0, 0, 0.4))'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-blue-200">
          <p>
            Precisa de ajuda? Entre em contato: <a href="mailto:suporte.ti@crescieperdi.com.br" className="text-cyan-300 hover:text-cyan-200 hover:underline font-medium">suporte.ti@crescieperdi.com.br</a>
          </p>
        </div>
      </div>
    </div>
  )
}
