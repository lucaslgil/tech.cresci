/**
 * LISTAGEM DE CLIENTES - COMPONENTE
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TipoPessoa,
  StatusCliente,
  StatusClienteLabels,
  type Cliente,
  type ClienteFiltros
} from './types'
import {
  listarClientes,
  buscarEstatisticas,
  bloquearCliente
} from './services'
import { formatarCPF, formatarCNPJ, formatarData } from './utils'

export function ListagemClientes() {
  const navigate = useNavigate()
  
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filtros, setFiltros] = useState<ClienteFiltros>({
    limite: 20,
    offset: 0,
    ordenar_por: 'codigo',
    ordem_direcao: 'desc'
  })
  const [total, setTotal] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [estatisticas, setEstatisticas] = useState<any>(null)

  useEffect(() => {
    carregarClientes()
    carregarEstatisticas()
  }, [filtros])

  async function carregarClientes() {
    setCarregando(true)
    try {
      const { data, total: totalRegistros } = await listarClientes(filtros)
      setClientes(data)
      setTotal(totalRegistros)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setCarregando(false)
    }
  }

  async function carregarEstatisticas() {
    try {
      const stats = await buscarEstatisticas()
      setEstatisticas(stats)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  function handleNovo() {
    navigate('/cadastro/clientes/novo')
  }

  function handleEditar(id: number | string) {
    navigate(`/cadastro/clientes/${id}`)
  }

  function handleBusca(termo: string) {
    setFiltros(prev => ({ ...prev, busca: termo, offset: 0 }))
  }

  function handleFiltroTipo(tipo: TipoPessoa | '') {
    setFiltros(prev => ({ ...prev, tipo_pessoa: tipo || undefined, offset: 0 }))
  }

  function handleFiltroStatus(status: StatusCliente | '') {
    setFiltros(prev => ({ ...prev, status: status || undefined, offset: 0 }))
  }

  async function handleBloquear(id: number | string, bloqueado: boolean) {
    try {
      await bloquearCliente(String(id), bloqueado, bloqueado ? 'Bloqueado manualmente' : undefined, bloqueado ? 'OUTROS' : undefined)
      await carregarClientes()
      await carregarEstatisticas()
    } catch (error) {
      console.error('Erro ao bloquear/desbloquear cliente:', error)
      alert('Erro ao alterar bloqueio do cliente')
    }
  }

  function getNomeCliente(cliente: Cliente): string {
    if (cliente.tipo_pessoa === 'FISICA') {
      return cliente.nome_completo || 'Sem nome'
    } else {
      return cliente.razao_social || cliente.nome_fantasia || 'Sem razão social'
    }
  }

  function getDocumento(cliente: Cliente): string {
    if (cliente.tipo_pessoa === 'FISICA' && cliente.cpf) {
      return formatarCPF(cliente.cpf)
    } else if (cliente.tipo_pessoa === 'JURIDICA' && cliente.cnpj) {
      return formatarCNPJ(cliente.cnpj)
    }
    return 'Sem documento'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-base font-semibold text-gray-900">Clientes</h1>
              <p className="text-xs text-gray-600 mt-1">
                Gerencie o cadastro de clientes do sistema
              </p>
            </div>
            <button
              onClick={handleNovo}
              className="px-6 py-2.5 text-white rounded-lg hover:opacity-90 font-semibold text-sm"
              style={{backgroundColor: '#394353'}}
            >
              ➕ Novo Cliente
            </button>
          </div>

          {/* Estatísticas */}
          {estatisticas && (
            <div className="grid grid-cols-4 gap-3">
              <div className="border rounded-lg p-3" style={{backgroundColor: 'rgba(57, 67, 83, 0.05)', borderColor: '#C9C4B5'}}>
                <p className="text-xs mb-1" style={{color: '#394353'}}>Total de Clientes</p>
                <p className="text-xl font-bold" style={{color: '#394353'}}>{estatisticas.total}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-600 mb-1">Ativos</p>
                <p className="text-xl font-bold text-green-900">{estatisticas.ativos}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-xs text-orange-600 mb-1">Pessoa Física</p>
                <p className="text-xl font-bold text-orange-900">{estatisticas.pessoaFisica}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs text-purple-600 mb-1">Pessoa Jurídica</p>
                <p className="text-xl font-bold text-purple-900">{estatisticas.pessoaJuridica}</p>
              </div>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Nome, CPF, CNPJ, código..."
                onChange={(e) => handleBusca(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm"
                style={{borderColor: '#C9C4B5'}}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Tipo de Pessoa
              </label>
              <select
                onChange={(e) => handleFiltroTipo(e.target.value as TipoPessoa | '')}
                className="w-full px-4 py-2 border rounded-lg text-sm"
                style={{borderColor: '#C9C4B5'}}
              >
                <option value="">Todos</option>
                <option value={TipoPessoa.FISICA}>Pessoa Física</option>
                <option value={TipoPessoa.JURIDICA}>Pessoa Jurídica</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select
                onChange={(e) => handleFiltroStatus(e.target.value as StatusCliente | '')}
                className="w-full px-4 py-2 border rounded-lg text-sm"
                style={{borderColor: '#C9C4B5'}}
              >
                <option value="">Todos</option>
                {Object.entries(StatusClienteLabels).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-white" style={{backgroundColor: '#394353'}}>
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">
                    Nome/Razão Social
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">
                    Cadastro
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white" style={{borderTop: '1px solid #C9C4B5'}}>
                {carregando ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : clientes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Nenhum cliente encontrado
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      style={{borderBottom: '1px solid #C9C4B5'}}
                      onClick={() => handleEditar(cliente.id)}
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="text-xs font-medium text-gray-900">
                          {cliente.codigo}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-xs font-medium text-gray-900">
                          {getNomeCliente(cliente)}
                        </div>
                        {cliente.tipo_pessoa === 'JURIDICA' && cliente.nome_fantasia && (
                          <div className="text-xs text-gray-500">
                            {cliente.nome_fantasia}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="text-xs text-gray-900">
                          {getDocumento(cliente)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          cliente.tipo_pessoa === 'FISICA'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {cliente.tipo_pessoa === 'FISICA' ? '👤 PF' : '🏢 PJ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded inline-block ${
                            cliente.status === 'ATIVO'
                              ? 'bg-green-100 text-green-800'
                              : cliente.status === 'INATIVO'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {StatusClienteLabels[cliente.status as StatusCliente]}
                          </span>
                          {cliente.bloqueio && (
                            <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800 inline-block">
                              🔒 Bloqueado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatarData(cliente.created_at)}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-right text-xs font-medium">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleBloquear(cliente.id, !cliente.bloqueio)}
                            className={`px-3 py-1 rounded text-sm ${
                              cliente.bloqueio
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                            title={cliente.bloqueio ? 'Desbloquear' : 'Bloquear'}
                          >
                            {cliente.bloqueio ? '🔓' : '🔒'}
                          </button>
                          <button
                            onClick={() => handleEditar(cliente.id)}
                            className="px-3 py-1 rounded text-sm hover:opacity-90"
                            style={{color: '#394353', backgroundColor: 'rgba(57, 67, 83, 0.1)'}}
                          >
                            ✏️ Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {total > (filtros.limite || 20) && (
            <div className="px-4 py-3 flex items-center justify-between" style={{backgroundColor: '#F9FAFB', borderTop: '1px solid #C9C4B5'}}>
              <div className="text-xs text-gray-700">
                Mostrando {filtros.offset! + 1} a {Math.min(filtros.offset! + (filtros.limite || 20), total)} de {total} resultados
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFiltros(prev => ({ ...prev, offset: Math.max(0, prev.offset! - (prev.limite || 20)) }))}
                  disabled={filtros.offset === 0}
                  className="px-4 py-2 border rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{borderColor: '#C9C4B5'}}
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setFiltros(prev => ({ ...prev, offset: prev.offset! + (prev.limite || 20) }))}
                  disabled={filtros.offset! + (filtros.limite || 20) >= total}
                  className="px-4 py-2 border rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{borderColor: '#C9C4B5'}}
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
