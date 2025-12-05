/**
 * GERENCIADOR DE ENDEREÇOS - COMPONENTE
 */

import { useState, useEffect } from 'react'
import {
  TipoEndereco,
  TipoEnderecoLabels,
  EstadosBrasileiros,
  type ClienteEndereco,
  type EnderecoFormData
} from '../types'
import {
  consultarCEP,
  aplicarMascaraCEP,
  validarEndereco
} from '../utils'
import {
  listarEnderecos,
  criarEndereco,
  atualizarEndereco,
  excluirEndereco,
  definirEnderecoPrincipal
} from '../services'

interface Props {
  clienteId: string
  enderecos: ClienteEndereco[]
  onAtualizarEnderecos: (enderecos: ClienteEndereco[]) => void
}

export function GerenciadorEnderecos({ clienteId, enderecos, onAtualizarEnderecos }: Props) {
  const [modoEdicao, setModoEdicao] = useState(false)
  const [enderecoEditando, setEnderecoEditando] = useState<ClienteEndereco | null>(null)
  const [formData, setFormData] = useState<Partial<EnderecoFormData>>({})
  const [erros, setErros] = useState<Record<string, string>>({})
  const [consultandoCEP, setConsultandoCEP] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function carregarEnderecos() {
    try {
      const dados = await listarEnderecos(clienteId)
      onAtualizarEnderecos(dados)
    } catch (error) {
      console.error('Erro ao carregar endereços:', error)
    }
  }

  function abrirFormularioNovo() {
    setFormData({
      cliente_id: clienteId,
      tipo: TipoEndereco.COMERCIAL,
      principal: enderecos.length === 0
    })
    setEnderecoEditando(null)
    setModoEdicao(true)
    setErros({})
  }

  function abrirFormularioEdicao(endereco: ClienteEndereco) {
    setFormData(endereco)
    setEnderecoEditando(endereco)
    setModoEdicao(true)
    setErros({})
  }

  function fecharFormulario() {
    setModoEdicao(false)
    setEnderecoEditando(null)
    setFormData({})
    setErros({})
  }

  async function handleConsultarCEP() {
    const cep = formData.cep
    if (!cep) return

    setConsultandoCEP(true)
    try {
      const dados = await consultarCEP(cep)
      
      if (dados) {
        setFormData(prev => ({
          ...prev,
          logradouro: dados.logradouro,
          bairro: dados.bairro,
          cidade: dados.localidade,
          estado: dados.uf,
          complemento: dados.complemento || prev.complemento
        }))
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao consultar CEP')
    } finally {
      setConsultandoCEP(false)
    }
  }

  async function handleSalvar() {
    const resultado = validarEndereco(formData)
    
    if (!resultado.valid) {
      const novosErros: Record<string, string> = {}
      resultado.errors.forEach(erro => {
        novosErros[erro.field] = erro.message
      })
      setErros(novosErros)
      return
    }

    setSalvando(true)
    try {
      if (enderecoEditando) {
        await atualizarEndereco(enderecoEditando.id, formData as Partial<ClienteEndereco>)
      } else {
        await criarEndereco(formData as Partial<ClienteEndereco>)
      }
      
      await carregarEnderecos()
      fecharFormulario()
    } catch (error) {
      console.error('Erro ao salvar endereço:', error)
      alert('Erro ao salvar endereço')
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluir(id: string) {
    if (!confirm('Deseja realmente excluir este endereço?')) return

    try {
      await excluirEndereco(id)
      await carregarEnderecos()
    } catch (error) {
      console.error('Erro ao excluir endereço:', error)
      alert('Erro ao excluir endereço')
    }
  }

  async function handleDefinirPrincipal(id: string) {
    try {
      await definirEnderecoPrincipal(id, clienteId)
      await carregarEnderecos()
    } catch (error) {
      console.error('Erro ao definir endereço principal:', error)
      alert('Erro ao definir endereço principal')
    }
  }

  return (
    <div className="space-y-6">
      {/* Lista de Endereços */}
      {!modoEdicao && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Endereços Cadastrados ({enderecos.length})
            </h3>
            <button
              onClick={abrirFormularioNovo}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ➕ Novo Endereço
            </button>
          </div>

          <div className="grid gap-4">
            {enderecos.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-600">Nenhum endereço cadastrado</p>
                <button
                  onClick={abrirFormularioNovo}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Adicionar primeiro endereço
                </button>
              </div>
            ) : (
              enderecos.map((endereco) => (
                <div
                  key={endereco.id}
                  className={`p-4 border rounded-lg ${
                    endereco.principal 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                          {TipoEnderecoLabels[endereco.tipo as TipoEndereco]}
                        </span>
                        {endereco.principal && (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                            ⭐ Principal
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-900">
                        {endereco.logradouro}, {endereco.numero}
                        {endereco.complemento && ` - ${endereco.complemento}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {endereco.bairro} - {endereco.cidade}/{endereco.estado}
                      </p>
                      <p className="text-sm text-gray-600">
                        CEP: {endereco.cep}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {!endereco.principal && (
                        <button
                          onClick={() => handleDefinirPrincipal(endereco.id)}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Definir como principal"
                        >
                          ⭐
                        </button>
                      )}
                      <button
                        onClick={() => abrirFormularioEdicao(endereco)}
                        className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleExcluir(endereco.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Formulário de Endereço */}
      {modoEdicao && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            {enderecoEditando ? 'Editar Endereço' : 'Novo Endereço'}
          </h3>

          <div className="space-y-4">
            {/* Tipo e Principal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Endereço
                </label>
                <select
                  value={formData.tipo || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as TipoEndereco }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  {Object.entries(TipoEnderecoLabels).map(([valor, label]) => (
                    <option key={valor} value={valor}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.principal || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, principal: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Endereço Principal</span>
                </label>
              </div>
            </div>

            {/* CEP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CEP <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.cep || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cep: aplicarMascaraCEP(e.target.value) }))}
                  className={`flex-1 px-4 py-2 border rounded-lg ${
                    erros.cep ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="00000-000"
                  maxLength={9}
                />
                <button
                  type="button"
                  onClick={handleConsultarCEP}
                  disabled={consultandoCEP}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  {consultandoCEP ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
              {erros.cep && <p className="mt-1 text-sm text-red-600">{erros.cep}</p>}
            </div>

            {/* Logradouro e Número */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logradouro <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.logradouro || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, logradouro: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    erros.logradouro ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Rua, Avenida, etc."
                />
                {erros.logradouro && <p className="mt-1 text-sm text-red-600">{erros.logradouro}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.numero || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    erros.numero ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="123"
                />
                {erros.numero && <p className="mt-1 text-sm text-red-600">{erros.numero}</p>}
              </div>
            </div>

            {/* Complemento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complemento
              </label>
              <input
                type="text"
                value={formData.complemento || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value || undefined }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Apto, Sala, Bloco, etc."
              />
            </div>

            {/* Bairro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bairro <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bairro || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg ${
                  erros.bairro ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Bairro"
              />
              {erros.bairro && <p className="mt-1 text-sm text-red-600">{erros.bairro}</p>}
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cidade || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    erros.cidade ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Cidade"
                />
                {erros.cidade && <p className="mt-1 text-sm text-red-600">{erros.cidade}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UF <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.estado || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    erros.estado ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">UF</option>
                  {EstadosBrasileiros.map((estado) => (
                    <option key={estado.sigla} value={estado.sigla}>
                      {estado.sigla}
                    </option>
                  ))}
                </select>
                {erros.estado && <p className="mt-1 text-sm text-red-600">{erros.estado}</p>}
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={fecharFormulario}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvar}
                disabled={salvando}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
