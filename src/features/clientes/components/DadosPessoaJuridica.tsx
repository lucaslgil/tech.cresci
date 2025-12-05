/**
 * DADOS PESSOA JURÍDICA - COMPONENTE DE FORMULÁRIO
 */

import { aplicarMascaraCNPJ } from '../utils'
import type { ClienteFormData } from '../types'

interface Props {
  formData: Partial<ClienteFormData>
  onChange: (campo: string, valor: any) => void
  erros: Record<string, string>
  onConsultarCNPJ: () => void
  consultando: boolean
}

export function DadosPessoaJuridica({ formData, onChange, erros, onConsultarCNPJ, consultando }: Props) {
  return (
    <div className="space-y-6">
      {/* Razão Social */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Razão Social <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.razao_social || ''}
          onChange={(e) => onChange('razao_social', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            erros.razao_social ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Razão social da empresa"
        />
        {erros.razao_social && (
          <p className="mt-1 text-sm text-red-600">{erros.razao_social}</p>
        )}
      </div>

      {/* Nome Fantasia */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome Fantasia
        </label>
        <input
          type="text"
          value={formData.nome_fantasia || ''}
          onChange={(e) => onChange('nome_fantasia', e.target.value || undefined)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Nome fantasia (se houver)"
        />
      </div>

      {/* CNPJ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CNPJ <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.cnpj || ''}
            onChange={(e) => onChange('cnpj', aplicarMascaraCNPJ(e.target.value))}
            className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              erros.cnpj ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="00.000.000/0000-00"
            maxLength={18}
          />
          <button
            type="button"
            onClick={onConsultarCNPJ}
            disabled={consultando || !formData.cnpj}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            title={!formData.cnpj ? 'Digite um CNPJ válido primeiro' : 'Buscar dados na Receita Federal'}
          >
            {consultando ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Consultando...
              </span>
            ) : (
              'Consultar Receita'
            )}
          </button>
        </div>
        {erros.cnpj && (
          <p className="mt-1 text-sm text-red-600">{erros.cnpj}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Clique em "Consultar Receita" para preencher automaticamente os dados da empresa ou preencha manualmente
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Inscrição Estadual */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Inscrição Estadual
          </label>
          <input
            type="text"
            value={formData.inscricao_estadual || ''}
            onChange={(e) => onChange('inscricao_estadual', e.target.value || undefined)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              erros.inscricao_estadual ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Digite ou ISENTO"
          />
          {erros.inscricao_estadual && (
            <p className="mt-1 text-sm text-red-600">{erros.inscricao_estadual}</p>
          )}
        </div>

        {/* Inscrição Municipal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Inscrição Municipal
          </label>
          <input
            type="text"
            value={formData.inscricao_municipal || ''}
            onChange={(e) => onChange('inscricao_municipal', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Inscrição Municipal"
          />
        </div>
      </div>

      {/* CNAE Principal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CNAE Principal
        </label>
        <input
          type="text"
          value={formData.cnae_principal || ''}
          onChange={(e) => onChange('cnae_principal', e.target.value || undefined)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="0000-0/00"
        />
        <p className="mt-1 text-xs text-gray-500">
          Código CNAE da atividade principal da empresa
        </p>
      </div>

      {/* Observações */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Observações
        </label>
        <textarea
          value={formData.observacoes || ''}
          onChange={(e) => onChange('observacoes', e.target.value || undefined)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Informações adicionais sobre a empresa..."
        />
      </div>
    </div>
  )
}
