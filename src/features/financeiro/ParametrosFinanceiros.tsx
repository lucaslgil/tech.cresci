import React, { useState } from 'react'
import { DollarSign, CreditCard } from 'lucide-react'
import { ParametrosContasReceber } from './ParametrosContasReceber'
import { ParametrosContasPagar } from './ParametrosContasPagar'

type AbaAtiva = 'contas-receber' | 'contas-pagar'

export const ParametrosFinanceiros: React.FC = () => {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('contas-receber')

  const abas = [
    {
      id: 'contas-receber' as AbaAtiva,
      nome: 'Contas a Receber',
      icone: DollarSign,
      descricao: 'Configurar parâmetros de contas a receber'
    },
    {
      id: 'contas-pagar' as AbaAtiva,
      nome: 'Contas a Pagar',
      icone: CreditCard,
      descricao: 'Configurar parâmetros de contas a pagar'
    }
  ]

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Cabeçalho */}
      <div className="bg-white shadow rounded-lg mb-4 sm:mb-6">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Parâmetros Financeiros</h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure formas de pagamento, parcelamentos e outros parâmetros financeiros
          </p>
        </div>

        {/* Abas */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto" aria-label="Tabs">
            {abas.map((aba) => {
              const Icon = aba.icone
              const isActive = abaAtiva === aba.id
              
              return (
                <button
                  key={aba.id}
                  onClick={() => setAbaAtiva(aba.id)}
                  className={`
                    group inline-flex items-center px-4 sm:px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {aba.nome}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      <div className="bg-white shadow rounded-lg">
        {abaAtiva === 'contas-receber' && <ParametrosContasReceber />}
        {abaAtiva === 'contas-pagar' && <ParametrosContasPagar />}
      </div>
    </div>
  )
}
