/**
 * DADOS FISCAIS - COMPONENTE DE FORMULÁRIO
 */

import {
  RegimeTributario,
  ContribuinteICMS,
  RegimeTributarioLabels,
  ContribuinteICMSLabels,
  type ClienteFormData
} from '../types'

interface Props {
  formData: Partial<ClienteFormData>
  onChange: (campo: string, valor: any) => void
  erros: Record<string, string>
}

export function DadosFiscais({ formData, onChange, erros }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          ℹ️ <strong>Informações Fiscais:</strong> Esses dados são utilizados para emissão de notas fiscais e cálculo de impostos.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Regime Tributário */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Regime Tributário
          </label>
          <select
            value={formData.regime_tributario || ''}
            onChange={(e) => onChange('regime_tributario', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecione...</option>
            {Object.entries(RegimeTributarioLabels).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Contribuinte ICMS */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contribuinte ICMS
          </label>
          <select
            value={formData.contribuinte_icms || ''}
            onChange={(e) => onChange('contribuinte_icms', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecione...</option>
            {Object.entries(ContribuinteICMSLabels).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Suframa */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Inscrição SUFRAMA
        </label>
        <input
          type="text"
          value={formData.inscricao_suframa || ''}
          onChange={(e) => onChange('inscricao_suframa', e.target.value || undefined)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Apenas para empresas da Zona Franca"
        />
        <p className="mt-1 text-xs text-gray-500">
          Válido apenas para empresas localizadas na Zona Franca de Manaus
        </p>
      </div>

      {/* Opções de NFe */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Configurações de Nota Fiscal Eletrônica</h3>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.consumidor_final || false}
              onChange={(e) => onChange('consumidor_final', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Consumidor Final (não contribuinte de ICMS)
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.simples_nacional || false}
              onChange={(e) => onChange('simples_nacional', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Optante pelo Simples Nacional
            </span>
          </label>
        </div>
      </div>

      {/* Observações Fiscais */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Observações Fiscais
        </label>
        <textarea
          value={formData.observacoes_fiscais || ''}
          onChange={(e) => onChange('observacoes_fiscais', e.target.value || undefined)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Informações fiscais adicionais que devem constar nas notas fiscais..."
        />
      </div>
    </div>
  )
}
