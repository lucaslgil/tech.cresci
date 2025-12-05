// =====================================================
// MODAL DE FORMULÁRIO DE PRODUTO
// Formulário completo com abas para dados fiscais
// Data: 01/12/2025
// =====================================================

import React, { useState, useEffect, useRef } from 'react'
import { X, Search } from 'lucide-react'
import type { Produto, ProdutoFormData } from './types'
import {
  UNIDADES_MEDIDA,
  ORIGENS_MERCADORIA
} from './types'
import { ncmService } from '../cadastros-fiscais/services'
import type { NCM } from '../cadastros-fiscais/types'

interface ModalFormularioProdutoProps {
  editingProduto: Produto | null
  formData: ProdutoFormData
  activeTab: 'geral' | 'fiscal' | 'comercial' | 'estoque'
  setActiveTab: (tab: 'geral' | 'fiscal' | 'comercial' | 'estoque') => void
  handleInputChange: (field: keyof ProdutoFormData, value: any) => void
  handleSaveProduto: (e: React.FormEvent) => void
  loading: boolean
  onClose: () => void
  categorias: string[]
}

export const ModalFormularioProduto: React.FC<ModalFormularioProdutoProps> = ({
  editingProduto,
  formData,
  activeTab,
  setActiveTab,
  handleInputChange,
  handleSaveProduto,
  loading,
  onClose,
  categorias
}) => {
  const [ncmList, setNcmList] = useState<NCM[]>([])
  const [filteredNcms, setFilteredNcms] = useState<NCM[]>([])
  const [ncmBusca, setNcmBusca] = useState('')
  const [showNcmDropdown, setShowNcmDropdown] = useState(false)
  const ncmInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Carregar todos os NCMs ativos
  useEffect(() => {
    const carregarNcms = async () => {
      try {
        const ncms = await ncmService.listar({ ativo: true })
        setNcmList(ncms)
      } catch (error) {
        console.error('Erro ao carregar NCMs:', error)
      }
    }
    carregarNcms()
  }, [])

  // Filtrar NCMs conforme o usuário digita
  useEffect(() => {
    if (ncmBusca.trim().length === 0) {
      setFilteredNcms(ncmList.slice(0, 10)) // Mostrar primeiros 10 quando vazio
    } else {
      const busca = ncmBusca.toLowerCase()
      const filtered = ncmList.filter(ncm => 
        ncm.codigo.toLowerCase().includes(busca) ||
        ncm.descricao.toLowerCase().includes(busca)
      ).slice(0, 20) // Limitar a 20 resultados
      setFilteredNcms(filtered)
    }
  }, [ncmBusca, ncmList])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          ncmInputRef.current && !ncmInputRef.current.contains(event.target as Node)) {
        setShowNcmDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Selecionar NCM da lista
  const selecionarNcm = (ncm: NCM) => {
    handleInputChange('ncm', ncm.codigo)
    setNcmBusca(`${ncm.codigo} - ${ncm.descricao}`)
    setShowNcmDropdown(false)
  }

  // Atualizar campo de busca quando formData.ncm mudar
  useEffect(() => {
    if (formData.ncm && ncmList.length > 0) {
      const ncmEncontrado = ncmList.find(n => n.codigo === formData.ncm)
      if (ncmEncontrado) {
        setNcmBusca(`${ncmEncontrado.codigo} - ${ncmEncontrado.descricao}`)
      }
    } else if (!formData.ncm) {
      setNcmBusca('')
    }
  }, [formData.ncm, ncmList])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingProduto ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('geral')}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                activeTab === 'geral'
                  ? 'bg-slate-700 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dados Gerais
            </button>
            <button
              onClick={() => setActiveTab('fiscal')}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                activeTab === 'fiscal'
                  ? 'bg-slate-700 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dados Fiscais
            </button>
            <button
              onClick={() => setActiveTab('comercial')}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                activeTab === 'comercial'
                  ? 'bg-slate-700 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dados Comerciais
            </button>
            <button
              onClick={() => setActiveTab('estoque')}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                activeTab === 'estoque'
                  ? 'bg-slate-700 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Estoque
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveProduto}>
          <div className="px-6 py-4 max-h-[calc(100vh-250px)] overflow-y-auto">
            {/* ABA: DADOS GERAIS */}
            {activeTab === 'geral' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código Interno <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.codigo_interno}
                      onChange={(e) => handleInputChange('codigo_interno', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
                      placeholder="Ex: PROD-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código de Barras (EAN)
                    </label>
                    <input
                      type="text"
                      value={formData.codigo_barras}
                      onChange={(e) => handleInputChange('codigo_barras', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
                      placeholder="Ex: 7891234567890"
                      maxLength={13}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Produto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
                    placeholder="Ex: Mouse Óptico USB"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => handleInputChange('descricao', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
                    placeholder="Descrição detalhada do produto"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria
                    </label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => handleInputChange('categoria', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidade de Medida <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.unidade_medida}
                      onChange={(e) => handleInputChange('unidade_medida', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
                    >
                      {UNIDADES_MEDIDA.map(un => (
                        <option key={un.value} value={un.value}>{un.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) => handleInputChange('ativo', e.target.checked)}
                      className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 mr-2"
                    />
                    <span className="text-sm text-gray-700">Produto ativo</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
                    placeholder="Observações adicionais"
                  />
                </div>
              </div>
            )}

            {/* ABA: DADOS FISCAIS */}
            {activeTab === 'fiscal' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Importante:</strong> Preencha os dados fiscais conforme a legislação vigente.
                    Estes dados serão utilizados na emissão de NF-e, NFC-e e outros documentos fiscais.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NCM
                    </label>
                    <div className="relative">
                      <input
                        ref={ncmInputRef}
                        type="text"
                        value={ncmBusca}
                        onChange={(e) => {
                          setNcmBusca(e.target.value)
                          setShowNcmDropdown(true)
                          if (!e.target.value.trim()) {
                            handleInputChange('ncm', '')
                          }
                        }}
                        onFocus={() => setShowNcmDropdown(true)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 focus:ring-slate-500 focus:border-slate-500 text-sm"
                        placeholder="Digite para buscar NCM..."
                      />
                      <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                    
                    {/* Dropdown de resultados */}
                    {showNcmDropdown && filteredNcms.length > 0 && (
                      <div
                        ref={dropdownRef}
                        className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                      >
                        {filteredNcms.map((ncm) => (
                          <button
                            key={ncm.id}
                            type="button"
                            onClick={() => selecionarNcm(ncm)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-gray-100 last:border-0 transition-colors"
                          >
                            <div className="font-medium text-sm text-gray-900">{ncm.codigo}</div>
                            <div className="text-xs text-gray-600 truncate">{ncm.descricao}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-1">
                      {ncmList.length} NCMs cadastrados • Cadastre em Parâmetros Fiscais → Cadastros Auxiliares
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEST
                    </label>
                    <input
                      type="text"
                      value={formData.cest}
                      onChange={(e) => handleInputChange('cest', e.target.value.replace(/\D/g, ''))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500 font-mono"
                      placeholder="1234567"
                      maxLength={7}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Origem da Mercadoria
                    </label>
                    <select
                      value={formData.origem_mercadoria}
                      onChange={(e) => handleInputChange('origem_mercadoria', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                    >
                      {ORIGENS_MERCADORIA.map(origem => (
                        <option key={origem.value} value={origem.value}>{origem.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ABA: DADOS COMERCIAIS */}
            {activeTab === 'comercial' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço de Custo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.preco_custo}
                      onChange={(e) => handleInputChange('preco_custo', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço de Venda (R$) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.preco_venda}
                      onChange={(e) => handleInputChange('preco_venda', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Margem de Lucro (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.margem_lucro}
                      onChange={(e) => handleInputChange('margem_lucro', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500 bg-gray-50"
                      readOnly={(formData.preco_custo || 0) > 0}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {(formData.preco_custo || 0) > 0 ? 'Calculado automaticamente' : 'Informe custo e venda'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.permite_desconto}
                        onChange={(e) => handleInputChange('permite_desconto', e.target.checked)}
                        className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 mr-2"
                      />
                      <span className="text-sm text-gray-700">Permite desconto</span>
                    </label>
                  </div>

                  {formData.permite_desconto && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Desconto Máximo (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.desconto_maximo}
                        onChange={(e) => handleInputChange('desconto_maximo', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                  )}
                </div>

                {/* Resumo Comercial */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h4 className="font-medium text-gray-900 mb-3">Resumo</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Custo:</span>
                      <span className="ml-2 font-medium">R$ {formData.preco_custo?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Venda:</span>
                      <span className="ml-2 font-medium text-green-600">R$ {formData.preco_venda?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Margem:</span>
                      <span className="ml-2 font-medium">{formData.margem_lucro?.toFixed(2) || '0.00'}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Lucro:</span>
                      <span className="ml-2 font-medium">
                        R$ {((formData.preco_venda || 0) - (formData.preco_custo || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA: ESTOQUE */}
            {activeTab === 'estoque' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque Atual <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      required
                      value={formData.estoque_atual}
                      onChange={(e) => handleInputChange('estoque_atual', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque Mínimo
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.estoque_minimo}
                      onChange={(e) => handleInputChange('estoque_minimo', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque Máximo
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.estoque_maximo}
                      onChange={(e) => handleInputChange('estoque_maximo', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Localização
                  </label>
                  <input
                    type="text"
                    value={formData.localizacao}
                    onChange={(e) => handleInputChange('localizacao', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
                    placeholder="Ex: Prateleira A1, Sala 3"
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Controles de Rastreabilidade</h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.controla_lote}
                        onChange={(e) => handleInputChange('controla_lote', e.target.checked)}
                        className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 mr-2"
                      />
                      <span className="text-sm text-gray-700">Controlar por lote</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.controla_serie}
                        onChange={(e) => handleInputChange('controla_serie', e.target.checked)}
                        className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 mr-2"
                      />
                      <span className="text-sm text-gray-700">Controlar por número de série</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.controla_validade}
                        onChange={(e) => handleInputChange('controla_validade', e.target.checked)}
                        className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 mr-2"
                      />
                      <span className="text-sm text-gray-700">Controlar validade</span>
                    </label>

                    {formData.controla_validade && (
                      <div className="ml-6 mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dias de Validade Padrão
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.dias_validade || ''}
                          onChange={(e) => handleInputChange('dias_validade', parseInt(e.target.value) || undefined)}
                          className="w-full max-w-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
                          placeholder="Ex: 365"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : editingProduto ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
