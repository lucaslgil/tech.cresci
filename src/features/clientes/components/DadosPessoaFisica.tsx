/**
 * DADOS PESSOA FÍSICA - COMPONENTE DE FORMULÁRIO
 */

import { aplicarMascaraCPF } from '../utils'
import type { ClienteFormData } from '../types'
import { DatePicker } from '../../../shared/components/DatePicker'

interface Props {
  formData: Partial<ClienteFormData>
  onChange: (campo: string, valor: any) => void
  erros: Record<string, string>
  onConsultarCPF: () => void
  consultando: boolean
}

export function DadosPessoaFisica({ formData, onChange, erros, onConsultarCPF, consultando }: Props) {
  return (
    <div className="space-y-6">
      {/* Nome Completo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome Completo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.nome_completo || ''}
          onChange={(e) => onChange('nome_completo', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            erros.nome_completo ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Nome completo do cliente"
        />
        {erros.nome_completo && (
          <p className="mt-1 text-sm text-red-600">{erros.nome_completo}</p>
        )}
      </div>

      {/* CPF */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CPF <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.cpf || ''}
            onChange={(e) => onChange('cpf', aplicarMascaraCPF(e.target.value))}
            className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              erros.cpf ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="000.000.000-00"
            maxLength={14}
          />
          <button
            type="button"
            onClick={onConsultarCPF}
            disabled={consultando}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {consultando ? 'Consultando...' : 'Verificar'}
          </button>
        </div>
        {erros.cpf && (
          <p className="mt-1 text-sm text-red-600">{erros.cpf}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* RG */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            RG
          </label>
          <input
            type="text"
            value={formData.rg || ''}
            onChange={(e) => onChange('rg', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="00.000.000-0"
          />
        </div>

        {/* Data de Nascimento */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Data de Nascimento
          </label>
          <DatePicker
            selected={formData.data_nascimento ? new Date(formData.data_nascimento) : null}
            onChange={(date) => onChange('data_nascimento', date ? date.toISOString().split('T')[0] : '')}
            placeholderText="Selecione a data"
            maxDate={new Date()}
            className={erros.data_nascimento ? 'border-red-500' : ''}
          />
          {erros.data_nascimento && (
            <p className="mt-1 text-sm text-red-600">{erros.data_nascimento}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Sexo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sexo
          </label>
          <select
            value={formData.sexo || ''}
            onChange={(e) => onChange('sexo', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecione...</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
            <option value="O">Outro</option>
          </select>
        </div>

        {/* Estado Civil */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado Civil
          </label>
          <select
            value={formData.estado_civil || ''}
            onChange={(e) => onChange('estado_civil', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecione...</option>
            <option value="SOLTEIRO">Solteiro(a)</option>
            <option value="CASADO">Casado(a)</option>
            <option value="DIVORCIADO">Divorciado(a)</option>
            <option value="VIUVO">Viúvo(a)</option>
            <option value="UNIAO_ESTAVEL">União Estável</option>
          </select>
        </div>
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
          placeholder="Informações adicionais sobre o cliente..."
        />
      </div>
    </div>
  )
}
