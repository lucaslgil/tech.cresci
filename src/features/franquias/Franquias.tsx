// =====================================================
// PÁGINA - GERENCIADOR DE FRANQUIAS
// Em Manutenção
// Data: 03/12/2025
// =====================================================

export default function Franquias() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Card de Manutenção */}
        <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12 text-center">
          {/* Ícone */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-12 h-12 text-blue-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                />
              </svg>
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Gerenciador de Franquias
          </h1>

          {/* Mensagem */}
          <div className="mb-8">
            <p className="text-lg text-gray-600 mb-2">
              🚧 Em Manutenção
            </p>
            <p className="text-base text-gray-500">
              Chegaremos em breve com novidades!
            </p>
          </div>

          {/* Detalhes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-blue-900 mb-3">
              📋 Funcionalidades Planejadas
            </h2>
            <ul className="text-left text-sm text-blue-800 space-y-2">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Cadastro e gestão de franquias</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Controle de royalties e taxas</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Relatórios de desempenho por unidade</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Dashboard consolidado de todas as franquias</span>
              </li>
            </ul>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span>Módulo em desenvolvimento</span>
          </div>
        </div>

        {/* Informação adicional */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Tem alguma sugestão para este módulo?{' '}
            <a href="mailto:suporte@exemplo.com" className="text-blue-600 hover:text-blue-700 font-medium">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
