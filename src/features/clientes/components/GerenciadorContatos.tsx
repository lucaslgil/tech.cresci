/**
 * GERENCIADOR DE CONTATOS - COMPONENTE
 */

import { useState } from 'react'
import {
  TipoContato,
  TipoContatoLabels,
  type ClienteContato,
  type ContatoFormData
} from '../types'
import {
  aplicarMascaraTelefone,
  validarContato
} from '../utils'
import {
  listarContatos,
  criarContato,
  atualizarContato,
  excluirContato,
  definirContatoPrincipal
} from '../services'

interface Props {
  clienteId: string
  contatos: ClienteContato[]
  onAtualizarContatos: (contatos: ClienteContato[]) => void
}

export function GerenciadorContatos({ clienteId, contatos, onAtualizarContatos }: Props) {
  const [modoEdicao, setModoEdicao] = useState(false)
  const [contatoEditando, setContatoEditando] = useState<ClienteContato | null>(null)
  const [formData, setFormData] = useState<Partial<ContatoFormData>>({})
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)

  async function carregarContatos() {
    try {
      const dados = await listarContatos(clienteId)
      onAtualizarContatos(dados)
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
    }
  }

  function abrirFormularioNovo() {
    setFormData({
      tipo: TipoContato.TELEFONE,
      principal: contatos.length === 0,
      recebe_nfe: false,
      recebe_cobranca: false,
      recebe_marketing: false,
      valor: ''
    })
    setContatoEditando(null)
    setModoEdicao(true)
    setErros({})
  }

  function abrirFormularioEdicao(contato: ClienteContato) {
    setFormData(contato)
    setContatoEditando(contato)
    setModoEdicao(true)
    setErros({})
  }

  function fecharFormulario() {
    setModoEdicao(false)
    setContatoEditando(null)
    setFormData({})
    setErros({})
  }

  async function handleSalvar() {
    const resultado = validarContato(formData)
    
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
      if (contatoEditando) {
        await atualizarContato(String(contatoEditando.id), formData as Partial<ClienteContato>)
      } else {
        await criarContato(formData as Partial<ClienteContato>)
      }
      
      await carregarContatos()
      fecharFormulario()
    } catch (error) {
      console.error('Erro ao salvar contato:', error)
      alert('Erro ao salvar contato')
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluir(id: string) {
    if (!confirm('Deseja realmente excluir este contato?')) return

    try {
      await excluirContato(id)
      await carregarContatos()
    } catch (error) {
      console.error('Erro ao excluir contato:', error)
      alert('Erro ao excluir contato')
    }
  }

  async function handleDefinirPrincipal(id: string) {
    try {
      await definirContatoPrincipal(id, clienteId)
      await carregarContatos()
    } catch (error) {
      console.error('Erro ao definir contato principal:', error)
      alert('Erro ao definir contato principal')
    }
  }

  function formatarValorContato(tipo: TipoContato, valor: string): string {
    if (tipo === TipoContato.TELEFONE || tipo === TipoContato.CELULAR || tipo === TipoContato.WHATSAPP) {
      return aplicarMascaraTelefone(valor)
    }
    return valor
  }

  function getIconeContato(tipo: TipoContato): string {
    const icones = {
      [TipoContato.TELEFONE]: '☎️',
      [TipoContato.CELULAR]: '📱',
      [TipoContato.WHATSAPP]: '💬',
      [TipoContato.EMAIL]: '📧',
      [TipoContato.SKYPE]: '💻',
      [TipoContato.OUTROS]: '📋'
    }
    return icones[tipo] || '📋'
  }

  return (
    <div className="space-y-6">
      {/* Lista de Contatos */}
      {!modoEdicao && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Contatos Cadastrados ({contatos.length})
            </h3>
            <button
              onClick={abrirFormularioNovo}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ➕ Novo Contato
            </button>
          </div>

          <div className="grid gap-4">
            {contatos.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-600">Nenhum contato cadastrado</p>
                <button
                  onClick={abrirFormularioNovo}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Adicionar primeiro contato
                </button>
              </div>
            ) : (
              contatos.map((contato) => (
                <div
                  key={contato.id}
                  className={`p-4 border rounded-lg ${
                    contato.principal 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getIconeContato(contato.tipo as TipoContato)}</span>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                          {TipoContatoLabels[contato.tipo as TipoContato]}
                        </span>
                        {contato.principal && (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                            ⭐ Principal
                          </span>
                        )}
                      </div>
                      
                      <p className="font-medium text-gray-900 mb-1">
                        {formatarValorContato(contato.tipo as TipoContato, contato.valor)}
                      </p>
                      
                      {contato.descricao && (
                        <p className="text-sm text-gray-600 mb-2">{contato.descricao}</p>
                      )}

                      <div className="flex gap-3 text-xs">
                        {contato.recebe_nfe && (
                          <span className="text-green-600">✓ NFe</span>
                        )}
                        {contato.recebe_cobranca && (
                          <span className="text-orange-600">✓ Cobrança</span>
                        )}
                        {contato.recebe_marketing && (
                          <span className="text-purple-600">✓ Marketing</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!contato.principal && (
                        <button
                          onClick={() => handleDefinirPrincipal(String(contato.id))}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Definir como principal"
                        >
                          ⭐
                        </button>
                      )}
                      <button
                        onClick={() => abrirFormularioEdicao(contato)}
                        className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleExcluir(String(contato.id))}
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

      {/* Formulário de Contato */}
      {modoEdicao && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            {contatoEditando ? 'Editar Contato' : 'Novo Contato'}
          </h3>

          <div className="space-y-4">
            {/* Tipo e Principal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Contato <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tipo || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as TipoContato }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  {Object.entries(TipoContatoLabels).map(([valor, label]) => (
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
                  <span className="ml-2 text-sm text-gray-700">Contato Principal</span>
                </label>
              </div>
            </div>

            {/* Valor do Contato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.tipo === TipoContato.EMAIL ? 'E-mail' : 
                 formData.tipo === TipoContato.TELEFONE || formData.tipo === TipoContato.CELULAR || formData.tipo === TipoContato.WHATSAPP ? 'Telefone' : 
                 'Valor'} <span className="text-red-500">*</span>
              </label>
              <input
                type={formData.tipo === TipoContato.EMAIL ? 'email' : 'text'}
                value={formData.valor || ''}
                onChange={(e) => {
                  let valor = e.target.value
                  if (formData.tipo === TipoContato.TELEFONE || formData.tipo === TipoContato.CELULAR || formData.tipo === TipoContato.WHATSAPP) {
                    valor = aplicarMascaraTelefone(valor)
                  }
                  setFormData(prev => ({ ...prev, valor }))
                }}
                className={`w-full px-4 py-2 border rounded-lg ${
                  erros.valor ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={
                  formData.tipo === TipoContato.EMAIL ? 'exemplo@email.com' :
                  formData.tipo === TipoContato.TELEFONE || formData.tipo === TipoContato.CELULAR || formData.tipo === TipoContato.WHATSAPP ? '(00) 00000-0000' :
                  'Valor do contato'
                }
              />
              {erros.valor && <p className="mt-1 text-sm text-red-600">{erros.valor}</p>}
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <input
                type="text"
                value={formData.descricao || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value || undefined }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: Telefone comercial, E-mail pessoal, etc."
              />
            </div>

            {/* Opções de Uso */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Utilizar este contato para:
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.recebe_nfe || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, recebe_nfe: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    📄 Envio de NFe (Nota Fiscal Eletrônica)
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.recebe_cobranca || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, recebe_cobranca: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    💰 Cobrança (boletos, duplicatas, etc.)
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.recebe_marketing || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, recebe_marketing: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    📢 Marketing (campanhas, promoções, etc.)
                  </span>
                </label>
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
