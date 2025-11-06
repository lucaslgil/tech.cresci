import React, { useState } from 'react'
import { Users, Palette } from 'lucide-react'
import { GerenciarUsuarios } from './GerenciarUsuarios'
import { TemaSistema } from './TemaSistema'

type AbaAtiva = 'usuarios' | 'tema'

export const Configuracoes: React.FC = () => {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('usuarios')

  const abas = [
    {
      id: 'usuarios' as AbaAtiva,
      nome: 'Usuários',
      icone: Users,
      descricao: 'Gerenciar usuários e permissões'
    },
    {
      id: 'tema' as AbaAtiva,
      nome: 'Tema do Sistema',
      icone: Palette,
      descricao: 'Personalizar cores e aparência'
    }
  ]

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Cabeçalho */}
      <div className="bg-white shadow rounded-lg mb-4 sm:mb-6">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie usuários, permissões e personalize o sistema
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
                      ? 'border-slate-700 text-slate-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${isActive ? 'text-slate-700' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  <div className="text-left">
                    <div>{aba.nome}</div>
                    <div className={`text-xs font-normal ${isActive ? 'text-slate-600' : 'text-gray-400'}`}>
                      {aba.descricao}
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      <div className="bg-white shadow rounded-lg">
        {abaAtiva === 'usuarios' && <GerenciarUsuarios />}
        {abaAtiva === 'tema' && <TemaSistema />}
      </div>
    </div>
  )
}
