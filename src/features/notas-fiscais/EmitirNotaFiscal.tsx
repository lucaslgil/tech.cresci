// =====================================================
// COMPONENTE - EMITIR NOTA FISCAL
// Tela para emissão de NF-e e NFC-e
// Data: 01/12/2025
// =====================================================

import { useState } from 'react'
import { notasFiscaisService } from './notasFiscaisService'
import type { NotaFiscalFormData, NotaFiscalItemFormData } from './types'
import { FINALIDADES_NOTA, MODALIDADES_FRETE, FORMAS_PAGAMENTO, MEIOS_PAGAMENTO } from './types'
import { Toast } from '../../shared/components/Toast'

export default function EmitirNotaFiscal() {
  const [etapaAtual, setEtapaAtual] = useState(1)
  const [carregando, setCarregando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null)

  const [formData, setFormData] = useState<NotaFiscalFormData>({
    tipo_nota: 'NFE',
    serie: 1,
    natureza_operacao: 'Venda de mercadoria',
    finalidade: '1',
    modalidade_frete: '9',
    forma_pagamento: '0',
    itens: []
  })

  const [itemAtual, setItemAtual] = useState<NotaFiscalItemFormData>({
    codigo_produto: '',
    descricao: '',
    ncm: '',
    cfop: '5102',
    unidade_comercial: 'UN',
    quantidade_comercial: 1,
    valor_unitario_comercial: 0
  })

  const adicionarItem = () => {
    if (!itemAtual.codigo_produto || !itemAtual.descricao || !itemAtual.ncm) {
      setToast({ tipo: 'error', mensagem: 'Preencha todos os campos obrigatórios do item' })
      return
    }

    setFormData(prev => ({
      ...prev,
      itens: [...prev.itens, itemAtual]
    }))

    setItemAtual({
      codigo_produto: '',
      descricao: '',
      ncm: '',
      cfop: '5102',
      unidade_comercial: 'UN',
      quantidade_comercial: 1,
      valor_unitario_comercial: 0
    })

    setToast({ tipo: 'success', mensagem: 'Item adicionado' })
  }

  const removerItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }))
  }

  const calcularTotalItem = (item: NotaFiscalItemFormData) => {
    return item.quantidade_comercial * item.valor_unitario_comercial - (item.valor_desconto || 0)
  }

  const calcularTotalNota = () => {
    return formData.itens.reduce((sum, item) => sum + calcularTotalItem(item), 0)
  }

  const handleSubmit = async () => {
    if (formData.itens.length === 0) {
      setToast({ tipo: 'error', mensagem: 'Adicione pelo menos um item' })
      return
    }

    if (!formData.destinatario_cpf_cnpj || !formData.destinatario_nome) {
      setToast({ tipo: 'error', mensagem: 'Preencha os dados do destinatário' })
      return
    }

    setCarregando(true)
    try {
      const nota = await notasFiscaisService.criarRascunho(formData)
      const resultado = await notasFiscaisService.emitir(nota.id)

      if (resultado.sucesso) {
        setToast({ tipo: 'success', mensagem: `NF-e autorizada! Chave: ${resultado.chave_acesso}` })
        // Resetar formulário
        setFormData({
          tipo_nota: 'NFE',
          serie: 1,
          natureza_operacao: 'Venda de mercadoria',
          finalidade: '1',
          modalidade_frete: '9',
          forma_pagamento: '0',
          itens: []
        })
        setEtapaAtual(1)
      } else {
        setToast({ tipo: 'error', mensagem: resultado.mensagem })
      }
    } catch (error) {
      setToast({ tipo: 'error', mensagem: error instanceof Error ? error.message : 'Erro ao emitir nota' })
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Emitir Nota Fiscal</h1>
        <p className="text-slate-600 mt-2">
          Emissão de NF-e (modelo 55) e NFC-e (modelo 65)
        </p>
      </div>

      {/* Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Dados Gerais', 'Destinatário', 'Produtos', 'Transporte/Pagamento', 'Revisar'].map((etapa, index) => (
            <div key={etapa} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                index + 1 === etapaAtual
                  ? 'bg-blue-600 text-white'
                  : index + 1 < etapaAtual
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-300 text-slate-600'
              }`}>
                {index + 1}
              </div>
              <span className={`ml-2 text-sm ${
                index + 1 === etapaAtual ? 'text-blue-600 font-semibold' : 'text-slate-600'
              }`}>
                {etapa}
              </span>
              {index < 4 && <div className="w-16 h-0.5 bg-slate-300 mx-4" />}
            </div>
          ))}
        </div>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Etapa 1: Dados Gerais */}
        {etapaAtual === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Dados Gerais da Nota</h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tipo de Nota *
                </label>
                <select
                  value={formData.tipo_nota}
                  onChange={(e) => setFormData({ ...formData, tipo_nota: e.target.value as 'NFE' | 'NFCE' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NFE">NF-e (Modelo 55)</option>
                  <option value="NFCE">NFC-e (Modelo 65)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Série *
                </label>
                <input
                  type="number"
                  value={formData.serie}
                  onChange={(e) => setFormData({ ...formData, serie: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Finalidade *
                </label>
                <select
                  value={formData.finalidade}
                  onChange={(e) => setFormData({ ...formData, finalidade: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  {FINALIDADES_NOTA.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Natureza da Operação *
              </label>
              <input
                type="text"
                value={formData.natureza_operacao}
                onChange={(e) => setFormData({ ...formData, natureza_operacao: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Venda de mercadoria"
              />
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setEtapaAtual(2)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Etapa 2: Destinatário */}
        {etapaAtual === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Dados do Destinatário</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  CPF/CNPJ *
                </label>
                <input
                  type="text"
                  value={formData.destinatario_cpf_cnpj || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_cpf_cnpj: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="00000000000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome/Razão Social *
                </label>
                <input
                  type="text"
                  value={formData.destinatario_nome || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_nome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Inscrição Estadual
                </label>
                <input
                  type="text"
                  value={formData.destinatario_ie || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_ie: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.destinatario_email || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.destinatario_logradouro || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_logradouro: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Rua, Av, etc"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  value={formData.destinatario_numero || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_numero: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={formData.destinatario_bairro || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_bairro: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.destinatario_cidade || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_cidade: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  UF
                </label>
                <input
                  type="text"
                  value={formData.destinatario_uf || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_uf: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  value={formData.destinatario_cep || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_cep: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setEtapaAtual(1)}
                className="px-6 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400"
              >
                Voltar
              </button>
              <button
                onClick={() => setEtapaAtual(3)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Etapa 3: Produtos - continua no próximo arquivo */}
        {etapaAtual === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Produtos/Serviços</h2>
            
            {/* Formulário de Item */}
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
              <h3 className="font-medium text-slate-700 mb-3">Adicionar Item</h3>
              
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={itemAtual.codigo_produto}
                    onChange={(e) => setItemAtual({ ...itemAtual, codigo_produto: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={itemAtual.descricao}
                    onChange={(e) => setItemAtual({ ...itemAtual, descricao: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    NCM *
                  </label>
                  <input
                    type="text"
                    value={itemAtual.ncm}
                    onChange={(e) => setItemAtual({ ...itemAtual, ncm: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    maxLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    CFOP *
                  </label>
                  <input
                    type="text"
                    value={itemAtual.cfop}
                    onChange={(e) => setItemAtual({ ...itemAtual, cfop: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    maxLength={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Unidade *
                  </label>
                  <input
                    type="text"
                    value={itemAtual.unidade_comercial}
                    onChange={(e) => setItemAtual({ ...itemAtual, unidade_comercial: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    value={itemAtual.quantidade_comercial}
                    onChange={(e) => setItemAtual({ ...itemAtual, quantidade_comercial: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Valor Unitário *
                  </label>
                  <input
                    type="number"
                    value={itemAtual.valor_unitario_comercial}
                    onChange={(e) => setItemAtual({ ...itemAtual, valor_unitario_comercial: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={adicionarItem}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Itens */}
            {formData.itens.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-slate-700 mb-3">Itens Adicionados</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Código</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Descrição</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Qtd</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Valor Unit.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {formData.itens.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-slate-900">{item.codigo_produto}</td>
                          <td className="px-4 py-3 text-sm text-slate-900">{item.descricao}</td>
                          <td className="px-4 py-3 text-sm text-slate-900">{item.quantidade_comercial}</td>
                          <td className="px-4 py-3 text-sm text-slate-900">R$ {item.valor_unitario_comercial.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900">R$ {calcularTotalItem(item).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => removerItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50">
                        <td colSpan={4} className="px-4 py-3 text-right font-semibold text-slate-700">Total da Nota:</td>
                        <td className="px-4 py-3 text-lg font-bold text-blue-600">R$ {calcularTotalNota().toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setEtapaAtual(2)}
                className="px-6 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400"
              >
                Voltar
              </button>
              <button
                onClick={() => setEtapaAtual(4)}
                disabled={formData.itens.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Etapa 4: Transporte e Pagamento */}
        {etapaAtual === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Transporte e Pagamento</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Modalidade de Frete
                  </label>
                  <select
                    value={formData.modalidade_frete}
                    onChange={(e) => setFormData({ ...formData, modalidade_frete: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    {MODALIDADES_FRETE.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={formData.forma_pagamento}
                    onChange={(e) => setFormData({ ...formData, forma_pagamento: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    {FORMAS_PAGAMENTO.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Meio de Pagamento
                  </label>
                  <select
                    value={formData.meio_pagamento || ''}
                    onChange={(e) => setFormData({ ...formData, meio_pagamento: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {MEIOS_PAGAMENTO.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Valor Pago
                  </label>
                  <input
                    type="number"
                    value={formData.valor_pago || ''}
                    onChange={(e) => setFormData({ ...formData, valor_pago: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Informações Complementares
                </label>
                <textarea
                  value={formData.informacoes_complementares || ''}
                  onChange={(e) => setFormData({ ...formData, informacoes_complementares: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Informações adicionais para o destinatário..."
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setEtapaAtual(3)}
                className="px-6 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400"
              >
                Voltar
              </button>
              <button
                onClick={() => setEtapaAtual(5)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Revisar
              </button>
            </div>
          </div>
        )}

        {/* Etapa 5: Revisão */}
        {etapaAtual === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Revisão da Nota Fiscal</h2>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-50 p-4 rounded-md">
                <h3 className="font-semibold text-slate-700 mb-2">Dados Gerais</h3>
                <p className="text-sm text-slate-600">Tipo: {formData.tipo_nota === 'NFE' ? 'NF-e' : 'NFC-e'}</p>
                <p className="text-sm text-slate-600">Série: {formData.serie}</p>
                <p className="text-sm text-slate-600">Natureza: {formData.natureza_operacao}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-md">
                <h3 className="font-semibold text-slate-700 mb-2">Destinatário</h3>
                <p className="text-sm text-slate-600">{formData.destinatario_nome}</p>
                <p className="text-sm text-slate-600">CPF/CNPJ: {formData.destinatario_cpf_cnpj}</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Quantidade de Itens:</span> {formData.itens.length}
              </p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                Total: R$ {calcularTotalNota().toFixed(2)}
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setEtapaAtual(4)}
                className="px-6 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400"
              >
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={carregando}
                className="px-8 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {carregando ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Emitindo...
                  </>
                ) : (
                  'Emitir Nota Fiscal'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <Toast
          type={toast.tipo}
          message={toast.mensagem}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
