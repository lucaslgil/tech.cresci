/**
 * ENDEREÇO DO CLIENTE – Formulário único sempre visível
 * Carrega o endereço principal existente; cria se não houver.
 */

import { useState, useEffect } from 'react'
import {
  TipoEndereco,
  TipoEnderecoLabels,
  EstadosBrasileiros,
  type ClienteEndereco,
  type EnderecoFormData
} from '../types'
import { consultarCEP, aplicarMascaraCEP } from '../utils'
import { listarEnderecos, criarEndereco, atualizarEndereco } from '../services'
import { supabase } from '../../../lib/supabase'

interface Props {
  clienteId: string
  enderecos: ClienteEndereco[]
  onAtualizarEnderecos: (enderecos: ClienteEndereco[]) => void
}

const VAZIO: Partial<EnderecoFormData> = {
  tipo: TipoEndereco.COMERCIAL,
  principal: true,
  pais: 'Brasil',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  codigo_municipio: '',
}

function formatarCepExibicao(cep: string): string {
  const digits = (cep || '').replace(/\D/g, '')
  if (digits.length === 8) return `${digits.slice(0, 5)}-${digits.slice(5)}`
  return cep
}

export function GerenciadorEnderecos({ clienteId, onAtualizarEnderecos }: Props) {
  const [formData, setFormData] = useState<Partial<EnderecoFormData>>(VAZIO)
  const [enderecoId, setEnderecoId] = useState<number | null>(null)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [consultandoCEP, setConsultandoCEP] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [feedbackSalvo, setFeedbackSalvo] = useState(false)

  useEffect(() => {
    if (clienteId) carregar()
  }, [clienteId])

  async function carregar() {
    try {
      const lista = await listarEnderecos(clienteId)
      onAtualizarEnderecos(lista)
      const principal = lista.find(e => e.principal) ?? lista[0] ?? null
      if (principal) {
        setEnderecoId(principal.id)
        setFormData({
          tipo: principal.tipo as TipoEndereco,
          principal: true,
          pais: principal.pais || 'Brasil',
          cep: formatarCepExibicao(principal.cep || ''),
          logradouro: principal.logradouro || '',
          numero: principal.numero || '',
          complemento: principal.complemento || '',
          bairro: principal.bairro || '',
          cidade: principal.cidade || '',
          estado: principal.estado || '',
          codigo_municipio: principal.codigo_municipio || '',
        })
      } else {
        setEnderecoId(null)
        setFormData(VAZIO)
      }
    } catch (error) {
      console.error('Erro ao carregar endereço:', error)
    }
  }

  async function handleConsultarCEP() {
    const cep = formData.cep
    if (!cep) return
    setConsultandoCEP(true)
    setErros(prev => ({ ...prev, cep: '' }))
    try {
      const dados = await consultarCEP(cep)
      if (dados) {
        setFormData(prev => ({
          ...prev,
          logradouro: dados.logradouro || prev.logradouro,
          bairro: dados.bairro || prev.bairro,
          cidade: dados.localidade || prev.cidade,
          estado: dados.uf || prev.estado,
          codigo_municipio: dados.ibge || prev.codigo_municipio || '',
          complemento: dados.complemento || prev.complemento,
        }))
      } else {
        setErros(prev => ({ ...prev, cep: 'CEP não encontrado' }))
      }
    } catch (error: any) {
      setErros(prev => ({ ...prev, cep: error.message || 'Erro ao consultar CEP' }))
    } finally {
      setConsultandoCEP(false)
    }
  }

  function validar(): boolean {
    const novosErros: Record<string, string> = {}
    if (!formData.cep?.trim()) novosErros.cep = 'CEP obrigatório'
    if (!formData.logradouro?.trim()) novosErros.logradouro = 'Logradouro obrigatório'
    if (!formData.numero?.trim()) novosErros.numero = 'Número obrigatório'
    if (!formData.bairro?.trim()) novosErros.bairro = 'Bairro obrigatório'
    if (!formData.cidade?.trim()) novosErros.cidade = 'Cidade obrigatória'
    if (!formData.estado?.trim()) novosErros.estado = 'UF obrigatória'
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function handleSalvar() {
    if (!validar()) return
    setSalvando(true)
    try {
      const payload = {
        ...formData,
        cliente_id: Number(clienteId),
        principal: true,
        pais: 'Brasil',
        cep: (formData.cep || '').replace(/\D/g, ''),
      } as Partial<ClienteEndereco>

      if (enderecoId) {
        await atualizarEndereco(String(enderecoId), payload)
      } else {
        const novo = await criarEndereco(payload)
        setEnderecoId(novo.id)
      }

      // Garante registros extras não ficam como principal
      await supabase
        .from('clientes_enderecos')
        .update({ principal: false })
        .eq('cliente_id', clienteId)
        .neq('id', enderecoId ?? 0)

      await carregar()
      setFeedbackSalvo(true)
      setTimeout(() => setFeedbackSalvo(false), 3000)
    } catch (error) {
      console.error('Erro ao salvar endereço:', error)
      alert('Erro ao salvar endereço. Verifique os dados e tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  function campo(field: keyof EnderecoFormData, valor: string) {
    setFormData(prev => ({ ...prev, [field]: valor }))
    if (erros[field as string]) setErros(prev => ({ ...prev, [field]: '' }))
  }

  const inputCls = (field: string) =>
    `w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-[#394353] ${
      erros[field] ? 'border-red-400' : 'border-[#C9C4B5]'
    }`

  return (
    <div className="space-y-4">

      {/* Tipo de Endereço */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
            Tipo de Endereço
          </label>
          <select
            value={formData.tipo || TipoEndereco.COMERCIAL}
            onChange={e => campo('tipo', e.target.value as TipoEndereco)}
            className={inputCls('tipo')}
          >
            {Object.entries(TipoEnderecoLabels).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
            <input type="checkbox" checked readOnly className="w-4 h-4 rounded border-gray-300" />
            Endereço Principal
          </label>
        </div>
      </div>

      {/* CEP */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
          CEP <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.cep || ''}
            onChange={e => campo('cep', aplicarMascaraCEP(e.target.value))}
            onKeyDown={e => e.key === 'Enter' && handleConsultarCEP()}
            className={`flex-1 ${inputCls('cep')}`}
            placeholder="00000-000"
            maxLength={9}
          />
          <button
            type="button"
            onClick={handleConsultarCEP}
            disabled={consultandoCEP}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 border border-[#C9C4B5] rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {consultandoCEP ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {erros.cep && <p className="mt-1 text-xs text-red-500">{erros.cep}</p>}
      </div>

      {/* Logradouro + Número */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
            Logradouro <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.logradouro || ''}
            onChange={e => campo('logradouro', e.target.value)}
            className={inputCls('logradouro')}
            placeholder="Rua, Avenida, etc."
          />
          {erros.logradouro && <p className="mt-1 text-xs text-red-500">{erros.logradouro}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
            Número <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.numero || ''}
            onChange={e => campo('numero', e.target.value)}
            className={inputCls('numero')}
            placeholder="123"
          />
          {erros.numero && <p className="mt-1 text-xs text-red-500">{erros.numero}</p>}
        </div>
      </div>

      {/* Complemento */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
          Complemento
        </label>
        <input
          type="text"
          value={formData.complemento || ''}
          onChange={e => campo('complemento', e.target.value)}
          className={inputCls('complemento')}
          placeholder="Apto, Sala, Bloco, etc."
        />
      </div>

      {/* Bairro */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
          Bairro <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.bairro || ''}
          onChange={e => campo('bairro', e.target.value)}
          className={inputCls('bairro')}
          placeholder="Bairro"
        />
        {erros.bairro && <p className="mt-1 text-xs text-red-500">{erros.bairro}</p>}
      </div>

      {/* Cidade + UF */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
            Cidade <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.cidade || ''}
            onChange={e => campo('cidade', e.target.value)}
            className={inputCls('cidade')}
            placeholder="Cidade"
          />
          {erros.cidade && <p className="mt-1 text-xs text-red-500">{erros.cidade}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
            UF <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.estado || ''}
            onChange={e => campo('estado', e.target.value)}
            className={inputCls('estado')}
          >
            <option value="">UF</option>
            {EstadosBrasileiros.map(est => (
              <option key={est.sigla} value={est.sigla}>{est.sigla}</option>
            ))}
          </select>
          {erros.estado && <p className="mt-1 text-xs text-red-500">{erros.estado}</p>}
        </div>
      </div>

      {/* Código IBGE */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
          Código IBGE do Município (NF-e)
        </label>
        <input
          type="text"
          value={formData.codigo_municipio || ''}
          readOnly
          className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded bg-gray-50 text-gray-500"
          placeholder="Preenchido automaticamente ao buscar o CEP"
        />
        {!formData.codigo_municipio && formData.cidade && (
          <p className="mt-1 text-xs text-amber-600">
            ⚠ Busque o CEP para preencher o código IBGE automaticamente
          </p>
        )}
        {formData.codigo_municipio && (
          <p className="mt-1 text-xs text-green-600">✓ Código IBGE preenchido – obrigatório para NF-e</p>
        )}
      </div>

      {/* Botão Salvar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#C9C4B5]">
        {feedbackSalvo && (
          <span className="text-sm text-green-600 font-medium">✓ Endereço salvo com sucesso!</span>
        )}
        <button
          type="button"
          onClick={handleSalvar}
          disabled={salvando}
          className="px-6 py-2 text-sm font-semibold text-white rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: '#394353' }}
        >
          {salvando ? 'Salvando...' : enderecoId ? 'Salvar Alterações' : 'Salvar Endereço'}
        </button>
      </div>
    </div>
  )
}

