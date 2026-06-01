/**
 * GERENCIADOR DE IMÓVEIS DO CLIENTE
 *
 * Permite cadastrar múltiplos imóveis com características de cômodos
 * usadas para calcular o valor do serviço de limpeza (diarista/faxineira).
 * Um imóvel deve ser marcado como "padrão" — é o que será usado no cálculo
 * ao buscar uma faxineira.
 */

import { useState, useEffect } from 'react'
import { Home, Plus, Pencil, Trash2, Star, Check, X } from 'lucide-react'
import {
  TipoImovel,
  TipoImovelLabels,
  type ClienteImovel,
  type ImovelFormData,
} from '../types'
import {
  listarImoveis,
  criarImovel,
  atualizarImovel,
  excluirImovel,
  definirImovelPadrao,
} from '../services'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Props {
  clienteId: string
  imoveis: ClienteImovel[]
  onAtualizarImoveis: (imoveis: ClienteImovel[]) => void
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------
const FORM_VAZIO: ImovelFormData = {
  nome: '',
  tipo: TipoImovel.APARTAMENTO,
  padrao: false,
  area_total: undefined,
  qtd_quartos: 0,
  qtd_banheiros: 1,
  qtd_salas: 1,
  qtd_cozinhas: 1,
  qtd_outros_comodos: 0,
  tem_area_servico: false,
  tem_garagem: false,
  tem_varanda: false,
  andar: undefined,
  tem_elevador: false,
  observacoes: '',
}

const inputCls = (erro?: string) =>
  `w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-[#394353] ${
    erro ? 'border-red-400' : 'border-[#C9C4B5]'
  }`

const labelCls = 'block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide'

// ---------------------------------------------------------------------------
// Contador numérico (steppers de quantidade de cômodos)
// ---------------------------------------------------------------------------
function ContadorComodo({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
      <div className="flex items-center border border-[#C9C4B5] rounded overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 transition-colors select-none"
        >
          −
        </button>
        <span className="px-3 py-1 text-sm font-semibold text-gray-800 min-w-[2rem] text-center">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 transition-colors select-none"
        >
          +
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toggle booleano
// ---------------------------------------------------------------------------
function ToggleOpcao({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-3 py-2 rounded border text-xs font-medium transition-colors ${
        checked
          ? 'border-[#394353] text-white'
          : 'border-[#C9C4B5] text-gray-600 bg-white hover:bg-gray-50'
      }`}
      style={checked ? { backgroundColor: '#394353' } : {}}
    >
      {checked ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 opacity-40" />}
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export function GerenciadorImoveis({ clienteId, onAtualizarImoveis }: Props) {
  const [imoveis, setImoveis] = useState<ClienteImovel[]>([])
  const [modoEdicao, setModoEdicao] = useState(false)
  const [imovelEditando, setImovelEditando] = useState<ClienteImovel | null>(null)
  const [formData, setFormData] = useState<ImovelFormData>(FORM_VAZIO)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)

  // ── Carregamento ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (clienteId) carregar()
  }, [clienteId])

  async function carregar() {
    setCarregando(true)
    try {
      const dados = await listarImoveis(clienteId)
      setImoveis(dados)
      onAtualizarImoveis(dados)
    } catch {
      // silencioso — tabela pode não existir ainda
    } finally {
      setCarregando(false)
    }
  }

  // ── Formulário ────────────────────────────────────────────────────────────
  function abrirNovo() {
    setFormData({ ...FORM_VAZIO, padrao: imoveis.length === 0 })
    setImovelEditando(null)
    setErros({})
    setModoEdicao(true)
  }

  function abrirEdicao(imovel: ClienteImovel) {
    setFormData({
      nome: imovel.nome,
      tipo: imovel.tipo,
      padrao: imovel.padrao,
      area_total: imovel.area_total,
      qtd_quartos: imovel.qtd_quartos,
      qtd_banheiros: imovel.qtd_banheiros,
      qtd_salas: imovel.qtd_salas,
      qtd_cozinhas: imovel.qtd_cozinhas,
      qtd_outros_comodos: imovel.qtd_outros_comodos,
      tem_area_servico: imovel.tem_area_servico,
      tem_garagem: imovel.tem_garagem,
      tem_varanda: imovel.tem_varanda,
      andar: imovel.andar,
      tem_elevador: imovel.tem_elevador,
      observacoes: imovel.observacoes ?? '',
    })
    setImovelEditando(imovel)
    setErros({})
    setModoEdicao(true)
  }

  function fechar() {
    setModoEdicao(false)
    setImovelEditando(null)
    setFormData(FORM_VAZIO)
    setErros({})
  }

  function set<K extends keyof ImovelFormData>(field: K, value: ImovelFormData[K]) {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (erros[field as string]) setErros(prev => ({ ...prev, [field]: '' }))
  }

  function validar(): boolean {
    const novos: Record<string, string> = {}
    if (!formData.nome.trim()) novos.nome = 'Nome do imóvel obrigatório'
    const totalComodos =
      formData.qtd_quartos +
      formData.qtd_banheiros +
      formData.qtd_salas +
      formData.qtd_cozinhas
    if (totalComodos === 0) novos.comodos = 'Informe ao menos um cômodo'
    setErros(novos)
    return Object.keys(novos).length === 0
  }

  async function handleSalvar() {
    if (!validar()) return
    setSalvando(true)
    try {
      const payload: Partial<ClienteImovel> = {
        ...formData,
        cliente_id: Number(clienteId),
        area_total: formData.area_total ? Number(formData.area_total) : undefined,
        andar: formData.andar ? Number(formData.andar) : undefined,
      }

      if (imovelEditando) {
        await atualizarImovel(String(imovelEditando.id), payload)
      } else {
        await criarImovel(payload)
      }

      // Se marcado como padrão, garante que só este fica como padrão
      if (formData.padrao) {
        const todos = await listarImoveis(clienteId)
        const novo = imovelEditando
          ? imovelEditando
          : todos[todos.length - 1]
        if (novo) await definirImovelPadrao(clienteId, String(novo.id))
      }

      await carregar()
      fechar()
    } catch {
      alert('Erro ao salvar imóvel. Verifique os dados e tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluir(id: string) {
    if (!confirm('Deseja realmente excluir este imóvel?')) return
    try {
      await excluirImovel(id)
      await carregar()
    } catch {
      alert('Erro ao excluir imóvel.')
    }
  }

  async function handleDefinirPadrao(id: string) {
    try {
      await definirImovelPadrao(clienteId, id)
      await carregar()
    } catch {
      alert('Erro ao definir imóvel padrão.')
    }
  }

  // ── Ícone por tipo ────────────────────────────────────────────────────────
  function iconeImovel(tipo: TipoImovel) {
    const mapa: Record<TipoImovel, string> = {
      APARTAMENTO: '🏢',
      CASA: '🏠',
      COMERCIAL: '🏪',
      OUTRO: '🏗️',
    }
    return mapa[tipo] ?? '🏠'
  }

  // ── Resumo dos cômodos ────────────────────────────────────────────────────
  function resumoComodos(im: ClienteImovel) {
    const partes: string[] = []
    if (im.qtd_quartos) partes.push(`${im.qtd_quartos} quarto${im.qtd_quartos > 1 ? 's' : ''}`)
    if (im.qtd_banheiros) partes.push(`${im.qtd_banheiros} banheiro${im.qtd_banheiros > 1 ? 's' : ''}`)
    if (im.qtd_salas) partes.push(`${im.qtd_salas} sala${im.qtd_salas > 1 ? 's' : ''}`)
    if (im.qtd_cozinhas) partes.push(`${im.qtd_cozinhas} cozinha${im.qtd_cozinhas > 1 ? 's' : ''}`)
    if (im.tem_area_servico) partes.push('área de serviço')
    if (im.tem_garagem) partes.push('garagem')
    if (im.tem_varanda) partes.push('varanda')
    if (im.qtd_outros_comodos) partes.push(`${im.qtd_outros_comodos} outro${im.qtd_outros_comodos > 1 ? 's' : ''}`)
    return partes.join(' · ')
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mt-0.5">
            Cadastre os imóveis do cliente para calcular o valor do serviço de limpeza.
            Marque um imóvel como <strong>padrão</strong> para que ele seja usado automaticamente na busca de faxineira.
          </p>
        </div>
        {!modoEdicao && (
          <button
            type="button"
            onClick={abrirNovo}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded hover:opacity-90 transition-opacity flex-shrink-0"
            style={{ backgroundColor: '#394353' }}
          >
            <Plus className="w-4 h-4" />
            Adicionar Imóvel
          </button>
        )}
      </div>

      {/* Formulário de edição */}
      {modoEdicao && (
        <div className="border border-[#C9C4B5] rounded-lg bg-gray-50">
          {/* Cabeçalho do form */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-t-lg"
            style={{ backgroundColor: '#394353' }}
          >
            <span className="text-sm font-semibold text-white">
              {imovelEditando ? 'Editar Imóvel' : 'Novo Imóvel'}
            </span>
            <button
              type="button"
              onClick={fechar}
              className="text-white opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-5">

            {/* Nome + Tipo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className={labelCls}>
                  Nome do Imóvel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={e => set('nome', e.target.value)}
                  className={inputCls(erros.nome)}
                  placeholder="Ex.: Apartamento Principal, Casa da Praia…"
                />
                {erros.nome && <p className="mt-1 text-xs text-red-500">{erros.nome}</p>}
              </div>

              <div>
                <label className={labelCls}>Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={e => set('tipo', e.target.value as TipoImovel)}
                  className={inputCls()}
                >
                  {Object.entries(TipoImovelLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Área total + Andar + Elevador */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>Área total (m²)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.area_total ?? ''}
                  onChange={e => set('area_total', e.target.value ? Number(e.target.value) : undefined)}
                  className={inputCls()}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelCls}>Andar</label>
                <input
                  type="number"
                  min={0}
                  value={formData.andar ?? ''}
                  onChange={e => set('andar', e.target.value ? Number(e.target.value) : undefined)}
                  className={inputCls()}
                  placeholder="—"
                />
              </div>
              <div className="flex items-end col-span-2 gap-2">
                <ToggleOpcao
                  label="Tem elevador"
                  checked={formData.tem_elevador}
                  onChange={v => set('tem_elevador', v)}
                />
              </div>
            </div>

            {/* Cômodos — steppers */}
            <div>
              <label className={labelCls}>
                Quantidade de Cômodos <span className="text-red-500">*</span>
              </label>
              {erros.comodos && (
                <p className="mb-2 text-xs text-red-500">{erros.comodos}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-white border border-[#C9C4B5] rounded-lg">
                <ContadorComodo
                  label="🛏 Quartos"
                  value={formData.qtd_quartos}
                  onChange={v => set('qtd_quartos', v)}
                />
                <ContadorComodo
                  label="🚿 Banheiros"
                  value={formData.qtd_banheiros}
                  onChange={v => set('qtd_banheiros', v)}
                />
                <ContadorComodo
                  label="🛋 Salas"
                  value={formData.qtd_salas}
                  onChange={v => set('qtd_salas', v)}
                />
                <ContadorComodo
                  label="🍳 Cozinhas"
                  value={formData.qtd_cozinhas}
                  onChange={v => set('qtd_cozinhas', v)}
                />
              </div>
            </div>

            {/* Áreas especiais */}
            <div>
              <label className={labelCls}>Áreas e Espaços Especiais</label>
              <div className="flex flex-wrap gap-2">
                <ToggleOpcao
                  label="🧺 Área de Serviço"
                  checked={formData.tem_area_servico}
                  onChange={v => set('tem_area_servico', v)}
                />
                <ToggleOpcao
                  label="🚗 Garagem"
                  checked={formData.tem_garagem}
                  onChange={v => set('tem_garagem', v)}
                />
                <ToggleOpcao
                  label="🌿 Varanda / Sacada"
                  checked={formData.tem_varanda}
                  onChange={v => set('tem_varanda', v)}
                />
              </div>
            </div>

            {/* Outros cômodos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className={labelCls}>Outros espaços</label>
                <div className="flex items-center border border-[#C9C4B5] rounded overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => set('qtd_outros_comodos', Math.max(0, formData.qtd_outros_comodos - 1))}
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >−</button>
                  <span className="flex-1 text-center text-sm font-semibold text-gray-800">
                    {formData.qtd_outros_comodos}
                  </span>
                  <button
                    type="button"
                    onClick={() => set('qtd_outros_comodos', formData.qtd_outros_comodos + 1)}
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >+</button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Home office, lavabo, etc.</p>
              </div>
            </div>

            {/* Imóvel padrão */}
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <input
                id="padrao-check"
                type="checkbox"
                checked={formData.padrao}
                onChange={e => set('padrao', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-[#394353]"
              />
              <label htmlFor="padrao-check" className="text-sm text-amber-800 select-none cursor-pointer">
                <strong>Marcar como imóvel padrão</strong> — usado automaticamente ao calcular o valor do serviço de limpeza
              </label>
            </div>

            {/* Observações */}
            <div>
              <label className={labelCls}>Observações</label>
              <textarea
                value={formData.observacoes ?? ''}
                onChange={e => set('observacoes', e.target.value)}
                className={`${inputCls()} resize-none`}
                rows={2}
                placeholder="Informações adicionais relevantes para a faxineira…"
              />
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#C9C4B5]">
              <button
                type="button"
                onClick={fechar}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-[#C9C4B5] rounded hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvar}
                disabled={salvando}
                className="px-6 py-2 text-sm font-semibold text-white rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: '#394353' }}
              >
                {salvando ? 'Salvando…' : imovelEditando ? 'Salvar Alterações' : 'Adicionar Imóvel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de imóveis */}
      {carregando ? (
        <div className="py-8 text-center text-sm text-gray-400">Carregando imóveis…</div>
      ) : imoveis.length === 0 ? (
        <div className="py-10 text-center border-2 border-dashed border-[#C9C4B5] rounded-lg">
          <Home className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Nenhum imóvel cadastrado.</p>
          <p className="text-xs text-gray-400 mt-1">
            Adicione pelo menos um imóvel para que o sistema calcule o valor correto do serviço.
          </p>
          {!modoEdicao && (
            <button
              type="button"
              onClick={abrirNovo}
              className="mt-4 px-4 py-2 text-sm font-semibold text-white rounded hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#394353' }}
            >
              + Adicionar Imóvel
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {imoveis.map(im => (
            <div
              key={im.id}
              className={`border rounded-lg p-4 transition-colors ${
                im.padrao
                  ? 'border-[#394353] bg-slate-50'
                  : 'border-[#C9C4B5] bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Informações */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base">{iconeImovel(im.tipo)}</span>
                    <span className="text-sm font-semibold text-gray-900 truncate">{im.nome}</span>
                    <span className="text-xs text-gray-500">{TipoImovelLabels[im.tipo]}</span>
                    {im.padrao && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: '#394353' }}>
                        <Star className="w-3 h-3" />
                        Padrão
                      </span>
                    )}
                  </div>

                  {/* Resumo dos cômodos */}
                  <p className="mt-1 text-xs text-gray-500">{resumoComodos(im)}</p>

                  {/* Área + andar */}
                  <div className="flex gap-3 mt-1">
                    {im.area_total && (
                      <span className="text-xs text-gray-400">{im.area_total} m²</span>
                    )}
                    {im.andar != null && (
                      <span className="text-xs text-gray-400">{im.andar}° andar</span>
                    )}
                    {im.tem_elevador && (
                      <span className="text-xs text-gray-400">com elevador</span>
                    )}
                  </div>

                  {im.observacoes && (
                    <p className="mt-1 text-xs text-gray-400 italic">{im.observacoes}</p>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!im.padrao && (
                    <button
                      type="button"
                      onClick={() => handleDefinirPadrao(String(im.id))}
                      title="Definir como imóvel padrão"
                      className="p-1.5 rounded text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => abrirEdicao(im)}
                    title="Editar imóvel"
                    className="p-1.5 rounded text-gray-400 hover:text-[#394353] hover:bg-gray-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExcluir(String(im.id))}
                    title="Excluir imóvel"
                    className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dica sobre imóvel padrão */}
      {imoveis.length > 1 && !imoveis.some(i => i.padrao) && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">
            ⚠ Nenhum imóvel está marcado como <strong>padrão</strong>. O cálculo do serviço de limpeza não poderá ser realizado automaticamente.
          </p>
        </div>
      )}
    </div>
  )
}
