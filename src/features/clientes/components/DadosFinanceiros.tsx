/**
 * DADOS FINANCEIROS - COMPONENTE DE FORMULÁRIO
 */

import type { ClienteFormData, CondicaoPagamento, TabelaPreco } from '../types'

interface Props {
  formData: Partial<ClienteFormData>
  onChange: (campo: string, valor: any) => void
  erros: Record<string, string>
  condicoesPagamento: CondicaoPagamento[]
  tabelasPreco: TabelaPreco[]
}

export function DadosFinanceiros({ 
  formData, 
  onChange, 
  erros, 
  condicoesPagamento, 
  tabelasPreco 
}: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-green-800">
          💰 <strong>Dados Financeiros:</strong> Configure limites de crédito, condições de pagamento e tabela de preços para este cliente.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Condição de Pagamento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condição de Pagamento Padrão
          </label>
          <select
            value={formData.condicao_pagamento_id || ''}
            onChange={(e) => onChange('condicao_pagamento_id', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecione...</option>
            {condicoesPagamento.map((cond) => (
              <option key={cond.id} value={cond.id}>
                {cond.descricao}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Condição padrão que será usada nas vendas para este cliente
          </p>
        </div>

        {/* Tabela de Preço */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tabela de Preço
          </label>
          <select
            value={formData.tabela_preco_id || ''}
            onChange={(e) => onChange('tabela_preco_id', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecione...</option>
            {tabelasPreco.map((tabela) => (
              <option key={tabela.id} value={tabela.id}>
                {tabela.descricao}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Tabela de preços específica para este cliente
          </p>
        </div>
      </div>

      {/* Limite de Crédito */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Limite de Crédito (R$)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.limite_credito || ''}
          onChange={(e) => onChange('limite_credito', e.target.value ? parseFloat(e.target.value) : undefined)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="0,00"
        />
        <p className="mt-1 text-xs text-gray-500">
          Limite máximo de crédito permitido para o cliente
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-800">
          ℹ️ <strong>Observação:</strong> Funcionalidades de bloqueio de crédito e vendedor responsável serão implementadas em módulos futuros.
        </p>
      </div>
    </div>
  )
}
