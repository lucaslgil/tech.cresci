import React from 'react'
import { Link } from 'react-router-dom'

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">
          Bem-vindo ao Sistema de Inventário e Cadastro
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Card Cadastro de Empresa */}
        <Link
          to="/cadastro/empresa"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-slate-300 group"
        >
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-slate-100 group-hover:bg-slate-200 rounded-lg flex items-center justify-center mb-4 transition-colors">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-700 mb-2">Empresa</h3>
            <p className="text-sm text-slate-500">Cadastrar nova empresa</p>
          </div>
        </Link>

        {/* Card Cadastro de Colaborador */}
        <Link
          to="/cadastro/colaborador"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-slate-300 group"
        >
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-slate-100 group-hover:bg-slate-200 rounded-lg flex items-center justify-center mb-4 transition-colors">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-700 mb-2">Colaborador</h3>
            <p className="text-sm text-slate-500">Cadastrar colaborador</p>
          </div>
        </Link>

        {/* Card Cadastro de Item */}
        <Link
          to="/inventario/cadastrar-item"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-slate-300 group"
        >
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-slate-100 group-hover:bg-slate-200 rounded-lg flex items-center justify-center mb-4 transition-colors">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-700 mb-2">Inventário</h3>
            <p className="text-sm text-slate-500">Cadastrar novo item</p>
          </div>
        </Link>

        {/* Card Documentação */}
        <Link
          to="/documentacao"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-slate-300 group"
        >
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-slate-100 group-hover:bg-slate-200 rounded-lg flex items-center justify-center mb-4 transition-colors">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-700 mb-2">Documentação</h3>
            <p className="text-sm text-slate-500">Consultar docs</p>
          </div>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Empresas</p>
              <p className="text-3xl font-bold text-slate-900">0</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🏢</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Colaboradores</p>
              <p className="text-3xl font-bold text-slate-900">0</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">👥</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Itens</p>
              <p className="text-3xl font-bold text-slate-900">0</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📦</span>
            </div>
          </div>
        </div>
      </div>

      {/* Informações do Sistema */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Sobre o Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Funcionalidades Principais
            </h3>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-3"></span>
                Cadastro de empresas e colaboradores
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-3"></span>
                Gerenciamento de inventário
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-3"></span>
                Sistema de autenticação seguro
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-3"></span>
                Interface responsiva e moderna
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Tecnologias
            </h3>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-3"></span>
                React + TypeScript + Vite
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-3"></span>
                TailwindCSS para estilização
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-3"></span>
                Supabase para backend
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-3"></span>
                React Router para navegação
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}