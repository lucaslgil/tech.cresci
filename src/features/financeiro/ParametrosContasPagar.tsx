import React from 'react'

export const ParametrosContasPagar: React.FC = () => {
  return (
    <div className="p-4 sm:p-6">
      <div className="text-center py-12">
        <div className="mb-6">
          <svg 
            className="w-24 h-24 mx-auto text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" 
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Em Desenvolvimento</h3>
        <p className="text-gray-600">Parâmetros de Contas a Pagar em breve</p>
      </div>
    </div>
  )
}
