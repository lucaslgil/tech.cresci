import React from 'react'
import { Link } from 'react-router-dom'

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">
          Bem-vindo ao Sistema de Inventário e Cadastro
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card Cadastro de Empresa */}
        <Link
          to="/cadastro/empresa"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-slate-300 group"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-slate-100 group-hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors">
                <span className="text-2xl">🏢</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-700">Cadastrar Empresa</h3>
              <p className="text-sm text-slate-500">Adicionar nova empresa ao sistema</p>
            </div>
          </div>
        </Link>

        {/* Card Cadastro de Colaborador */}
        <Link
          to="/cadastro/colaborador"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Cadastrar Colaborador</h3>
              <p className="text-sm text-gray-500">Adicionar novo colaborador</p>
            </div>
          </div>
        </Link>

        {/* Card Cadastro de Item */}
        <Link
          to="/inventario/cadastrar-item"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-purple-500"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Cadastrar Item</h3>
              <p className="text-sm text-gray-500">Adicionar item ao inventário</p>
            </div>
          </div>
        </Link>

        {/* Card Documentação */}
        <Link
          to="/documentacao"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-yellow-500"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Documentação</h3>
              <p className="text-sm text-gray-500">Consultar documentação do sistema</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Informações do Sistema */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Sobre o Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Funcionalidades Principais</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Cadastro de empresas e colaboradores</li>
              <li>• Gerenciamento de inventário</li>
              <li>• Sistema de autenticação seguro</li>
              <li>• Interface responsiva e moderna</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Tecnologias</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• React + TypeScript + Vite</li>
              <li>• TailwindCSS para estilização</li>
              <li>• Supabase para backend</li>
              <li>• React Router para navegação</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}