// =====================================================
// PÁGINA COMPLETA: Cadastro / Edição de Unidade
// Rota: /franquias/unidades/nova  (criação)
//       /franquias/unidades/:id   (edição)
// =====================================================

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Save, Building2, Users, MapPin, DollarSign,
  Store, FileText, Plus, Trash2, Edit, Phone, Mail, X,
  ChevronRight, Info, Search, UserCheck,
} from 'lucide-react'
import { Toast } from '../../../shared/components/Toast'
import { useUnidades, type ClienteInfo } from './useUnidades'
import { useParametros } from '../parametros/useParametros'
import {
  INITIAL_FORM, STATUS_LABELS, ETAPA_LABELS, MODELO_LABELS,
  ESTADOS_BR, TIPOS_SOCIO,
  type FormUnidade, type SocioUnidade,
  type StatusUnidade, type ModeloUnidade, type EtapaUnidade,
} from './types'

// ── Utilitários ────────────────────────────────────────────────────────────
const maskCpfCnpj = (v: string) => {
  const d = v.replace(/\D/g, '')
  if (d.length <= 11) return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  return d.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}
const maskCep = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9)
const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, '')
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').slice(0, 15)
}

// ── Sub-componentes de formulário ──────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent bg-white'
const selectCls = 'w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white'

const Field: React.FC<{
  label: string
  required?: boolean
  children: React.ReactNode
  col?: string
}> = ({ label, required, children, col }) => (
  <div className={col}>
    <label className="block text-xs font-medium text-slate-600 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
)

// ── Componente principal ───────────────────────────────────────────────────
export const CadastroUnidade: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const {
    criarUnidade,
    atualizarUnidade,
    fetchUnidadeById,
    fetchSocios,
    salvarSocio,
    excluirSocio,
    searchClientes,
    searchClientesPF,
    fetchClienteById,
  } = useUnidades()

  const { getByTipo } = useParametros()

  // ── Estado do formulário ──────────────────────────────────────────────
  const [formData, setFormData] = useState<FormUnidade>(INITIAL_FORM)
  const [activeTab, setActiveTab] = useState(0)
  const [loadingUnidade, setLoadingUnidade] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [nomeUnidade, setNomeUnidade] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)

  // ── Estado de sócios ──────────────────────────────────────────────────
  const [socios, setSocios] = useState<SocioUnidade[]>([])
  const [loadingSocios, setLoadingSocios] = useState(false)
  const [showSocioForm, setShowSocioForm] = useState(false)
  const [editingSocio, setEditingSocio] = useState<Partial<SocioUnidade> | null>(null)
  const [savingSocio, setSavingSocio] = useState(false)
  const [confirmDeleteSocio, setConfirmDeleteSocio] = useState<string | null>(null)

  // ── Estado do cliente vinculado ───────────────────────────────────────────
  const [clienteVinculado, setClienteVinculado] = useState<ClienteInfo | null>(null)
  const [clienteBusca, setClienteBusca] = useState('')
  const [clienteResultados, setClienteResultados] = useState<ClienteInfo[]>([])
  const [clienteBuscando, setClienteBuscando] = useState(false)
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [showClienteModal, setShowClienteModal] = useState(false)
  const clienteDropdownRef = useRef<HTMLDivElement>(null)

  // ── Estado do franqueado vinculado ───────────────────────────────────────
  const [franqueadoVinculado, setFranqueadoVinculado] = useState<ClienteInfo | null>(null)
  const [franqueadoBusca, setFranqueadoBusca] = useState('')
  const [franqueadoResultados, setFranqueadoResultados] = useState<ClienteInfo[]>([])
  const [franqueadoBuscando, setFranqueadoBuscando] = useState(false)
  const [showFranqueadoDropdown, setShowFranqueadoDropdown] = useState(false)
  const [showFranqueadoModal, setShowFranqueadoModal] = useState(false)
  const franqueadoDropdownRef = useRef<HTMLDivElement>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Busca unidade ao editar ───────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoadingUnidade(true)
      const u = await fetchUnidadeById(id)
      if (!u) {
        showToast('Unidade não encontrada', 'error')
        navigate('/franquias/unidades')
        return
      }
      setNomeUnidade(u.nome_unidade)
      setFormData({
        codigo_unidade: u.codigo_unidade,
        nome_unidade: u.nome_unidade,
        nome_fantasia: u.nome_fantasia || '',
        status: u.status,
        data_abertura: u.data_abertura || '',
        data_assinatura_contrato: u.data_assinatura_contrato || '',
        nome_franqueado: u.nome_franqueado,
        cpf_cnpj_franqueado: u.cpf_cnpj_franqueado || '',
        email_franqueado: u.email_franqueado || '',
        telefone_franqueado: u.telefone_franqueado || '',
        cep: u.cep || '',
        rua: u.rua || '',
        numero: u.numero || '',
        complemento: u.complemento || '',
        bairro: u.bairro || '',
        cidade: u.cidade || '',
        estado: u.estado || '',
        pais: u.pais || 'Brasil',
        latitude: u.latitude?.toString() || '',
        longitude: u.longitude?.toString() || '',
        tipo_contrato: u.tipo_contrato || '',
        prazo_contrato_meses: u.prazo_contrato_meses?.toString() || '',
        data_inicio_contrato: u.data_inicio_contrato || '',
        data_termino_contrato: u.data_termino_contrato || '',
        taxa_franquia: u.taxa_franquia?.toString() || '',
        royalties_percentual: u.royalties_percentual?.toString() || '',
        fundo_marketing_percentual: u.fundo_marketing_percentual?.toString() || '',
        taxa_tecnologica: u.taxa_tecnologica?.toString() || '',
        modelo_unidade: (u.modelo_unidade as ModeloUnidade | '') || '',
        tamanho_loja_m2: u.tamanho_loja_m2?.toString() || '',
        capacidade_operacional: u.capacidade_operacional?.toString() || '',
        horario_funcionamento: (u.horario_funcionamento as Record<string, string>)?.descricao || '',
        etapa_atual: u.etapa_atual,
        faturamento_meta_mensal: u.faturamento_meta_mensal?.toString() || '',
        cliente_id: u.cliente_id ?? null,
        franqueado_id: u.franqueado_id ?? null,
      })
      // Carrega cliente vinculado se existir
      if (u.cliente_id) {
        const c = await fetchClienteById(u.cliente_id)
        if (c) setClienteVinculado(c)
      }
      // Carrega franqueado vinculado se existir
      if (u.franqueado_id) {
        const f = await fetchClienteById(u.franqueado_id)
        if (f) setFranqueadoVinculado(f)
      }
      setLoadingUnidade(false)
      // Carrega sócios
      setLoadingSocios(true)
      try {
        setSocios(await fetchSocios(id))
      } finally {
        setLoadingSocios(false)
      }
    }
    load()
  }, [id])

  // ── Handlers do cliente vinculado ─────────────────────────────────────────
  const handleBuscarCliente = useCallback(async (term: string) => {
    setClienteBusca(term)
    if (term.length < 2) {
      setClienteResultados([])
      setShowClienteDropdown(false)
      return
    }
    setClienteBuscando(true)
    try {
      const results = await searchClientes(term)
      setClienteResultados(results)
      setShowClienteDropdown(results.length > 0)
    } finally {
      setClienteBuscando(false)
    }
  }, [searchClientes])

  const handleSelecionarCliente = (c: ClienteInfo) => {
    setClienteVinculado(c)
    setFormData(prev => ({ ...prev, cliente_id: c.id }))
    setClienteBusca('')
    setClienteResultados([])
    setShowClienteDropdown(false)
  }

  const handleLimparCliente = () => {
    setClienteVinculado(null)
    setFormData(prev => ({ ...prev, cliente_id: null }))
  }

  // ── Handlers do franqueado vinculado ──────────────────────────────────────
  const handleBuscarFranqueado = useCallback(async (term: string) => {
    setFranqueadoBusca(term)
    if (term.length < 2) {
      setFranqueadoResultados([])
      setShowFranqueadoDropdown(false)
      return
    }
    setFranqueadoBuscando(true)
    try {
      const results = await searchClientesPF(term)
      setFranqueadoResultados(results)
      setShowFranqueadoDropdown(results.length > 0)
    } finally {
      setFranqueadoBuscando(false)
    }
  }, [searchClientesPF])

  const handleSelecionarFranqueado = (c: ClienteInfo) => {
    setFranqueadoVinculado(c)
    setFormData(prev => ({
      ...prev,
      franqueado_id: c.id,
      nome_franqueado: c.nome_completo || prev.nome_franqueado,
      cpf_cnpj_franqueado: c.cpf || prev.cpf_cnpj_franqueado,
      email_franqueado: c.email || prev.email_franqueado,
      telefone_franqueado: c.telefone || prev.telefone_franqueado,
    }))
    setFranqueadoBusca('')
    setFranqueadoResultados([])
    setShowFranqueadoDropdown(false)
  }

  const handleLimparFranqueado = () => {
    setFranqueadoVinculado(null)
    setFormData(prev => ({ ...prev, franqueado_id: null }))
  }

  // ── Busca CEP ─────────────────────────────────────────────────────────
  const buscarCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          rua: data.logradouro || prev.rua,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }))
      }
    } catch { /* ignorar */ }
  }

  // ── Handlers do formulário ────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    let v = value
    if (name === 'cpf_cnpj_franqueado') v = maskCpfCnpj(value)
    if (name === 'cep') v = maskCep(value)
    if (name === 'telefone_franqueado') v = maskPhone(value)
    setFormData(prev => ({ ...prev, [name]: v }))
  }

  const validar = (): string | null => {
    if (!formData.codigo_unidade.trim()) return 'Código da unidade é obrigatório'
    if (!formData.nome_unidade.trim()) return 'Nome da unidade é obrigatório'
    if (!formData.nome_franqueado.trim()) return 'Nome do franqueado é obrigatório'
    return null
  }

  const handleSalvar = async () => {
    const erro = validar()
    if (erro) { showToast(erro, 'error'); return }
    setSaving(true)
    try {
      if (isEdit && id) {
        await atualizarUnidade(id, formData)
        showToast('Unidade atualizada com sucesso!')
        setNomeUnidade(formData.nome_unidade)
      } else {
        const nova = await criarUnidade(formData)
        showToast('Unidade cadastrada com sucesso!')
        // Redireciona para a página de edição da nova unidade
        navigate(`/franquias/unidades/${nova.id}`, { replace: true })
        return
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar'
      showToast(msg.includes('unq_codigo') ? 'Código já existe nesta empresa' : msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Handlers de sócios ────────────────────────────────────────────────
  const handleSalvarSocio = async () => {
    if (!editingSocio?.nome?.trim()) { showToast('Nome do sócio é obrigatório', 'error'); return }
    if (!id) return
    setSavingSocio(true)
    try {
      await salvarSocio(editingSocio, id)
      setSocios(await fetchSocios(id))
      setShowSocioForm(false)
      setEditingSocio(null)
      showToast(editingSocio.id ? 'Sócio atualizado!' : 'Sócio adicionado!')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar sócio', 'error')
    } finally {
      setSavingSocio(false)
    }
  }

  const handleExcluirSocio = async (socioId: string) => {
    if (!id) return
    try {
      await excluirSocio(socioId)
      setSocios(await fetchSocios(id))
      setConfirmDeleteSocio(null)
      showToast('Sócio removido!')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao remover sócio', 'error')
    }
  }

  // ── Tabs de navegação ─────────────────────────────────────────────────
  const tabs = [
    { icon: <FileText className="w-4 h-4" />, label: 'Identificação' },
    { icon: <Users className="w-4 h-4" />, label: 'Franqueado' },
    { icon: <MapPin className="w-4 h-4" />, label: 'Endereço' },
    { icon: <DollarSign className="w-4 h-4" />, label: 'Contrato' },
    { icon: <Store className="w-4 h-4" />, label: 'Operacional' },
    ...(isEdit ? [{ icon: <Users className="w-4 h-4" />, label: 'Sócios' }] : []),
  ]

  // ── Loading state ─────────────────────────────────────────────────────
  if (loadingUnidade) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm gap-2">
        <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        Carregando unidade...
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Modal: Dados do Cliente Vinculado ─────────────────────────── */}
      {showClienteModal && clienteVinculado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowClienteModal(false) }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: '#394353' }}>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Dados do Cliente Vinculado
              </h3>
              <button
                onClick={() => setShowClienteModal(false)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {/* Avatar + nome principal */}
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                  style={{ backgroundColor: '#394353' }}
                >
                  {(clienteVinculado.nome_completo || clienteVinculado.razao_social || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-slate-800 truncate">
                    {clienteVinculado.nome_completo || clienteVinculado.razao_social}
                  </p>
                  {clienteVinculado.nome_fantasia && (
                    <p className="text-xs text-slate-500 truncate">{clienteVinculado.nome_fantasia}</p>
                  )}
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    clienteVinculado.status === 'ATIVO' ? 'bg-green-100 text-green-700' :
                    clienteVinculado.status === 'BLOQUEADO' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {clienteVinculado.status}
                  </span>
                </div>
              </div>

              {/* Dados em lista */}
              <dl className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-xs text-slate-500 flex-shrink-0">Código</dt>
                  <dd className="text-xs font-semibold text-slate-700 font-mono">{clienteVinculado.codigo}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-xs text-slate-500 flex-shrink-0">Tipo</dt>
                  <dd className="text-xs font-semibold text-slate-700">
                    {clienteVinculado.tipo_pessoa === 'FISICA' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                  </dd>
                </div>
                {(clienteVinculado.cpf || clienteVinculado.cnpj) && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-xs text-slate-500 flex-shrink-0">
                      {clienteVinculado.tipo_pessoa === 'FISICA' ? 'CPF' : 'CNPJ'}
                    </dt>
                    <dd className="text-xs font-semibold text-slate-700 font-mono">
                      {clienteVinculado.cpf || clienteVinculado.cnpj}
                    </dd>
                  </div>
                )}
                {clienteVinculado.email && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-xs text-slate-500 flex-shrink-0 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> E-mail
                    </dt>
                    <dd className="text-xs font-semibold text-slate-700 truncate max-w-[220px]">
                      {clienteVinculado.email}
                    </dd>
                  </div>
                )}
                {clienteVinculado.telefone && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-xs text-slate-500 flex-shrink-0 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Telefone
                    </dt>
                    <dd className="text-xs font-semibold text-slate-700">{clienteVinculado.telefone}</dd>
                  </div>
                )}
                {clienteVinculado.limite_credito != null && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-xs text-slate-500 flex-shrink-0">Limite de Crédito</dt>
                    <dd className="text-xs font-semibold text-slate-700">
                      {clienteVinculado.limite_credito.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowClienteModal(false)}
                  className="w-full py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Dados do Franqueado Vinculado ─────────────────────────── */}
      {showFranqueadoModal && franqueadoVinculado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowFranqueadoModal(false) }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: '#394353' }}>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Dados do Franqueado
              </h3>
              <button
                onClick={() => setShowFranqueadoModal(false)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                  style={{ backgroundColor: '#394353' }}
                >
                  {(franqueadoVinculado.nome_completo || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-slate-800 truncate">
                    {franqueadoVinculado.nome_completo}
                  </p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    franqueadoVinculado.status === 'ATIVO' ? 'bg-green-100 text-green-700' :
                    franqueadoVinculado.status === 'BLOQUEADO' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {franqueadoVinculado.status}
                  </span>
                </div>
              </div>
              <dl className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-xs text-slate-500 flex-shrink-0">Código</dt>
                  <dd className="text-xs font-semibold text-slate-700 font-mono">{franqueadoVinculado.codigo}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-xs text-slate-500 flex-shrink-0">Tipo</dt>
                  <dd className="text-xs font-semibold text-slate-700">Pessoa Física</dd>
                </div>
                {franqueadoVinculado.cpf && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-xs text-slate-500 flex-shrink-0">CPF</dt>
                    <dd className="text-xs font-semibold text-slate-700 font-mono">{franqueadoVinculado.cpf}</dd>
                  </div>
                )}
                {franqueadoVinculado.email && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-xs text-slate-500 flex-shrink-0 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> E-mail
                    </dt>
                    <dd className="text-xs font-semibold text-slate-700 truncate max-w-[220px]">
                      {franqueadoVinculado.email}
                    </dd>
                  </div>
                )}
                {franqueadoVinculado.telefone && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-xs text-slate-500 flex-shrink-0 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Telefone
                    </dt>
                    <dd className="text-xs font-semibold text-slate-700">{franqueadoVinculado.telefone}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowFranqueadoModal(false)}
                  className="w-full py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cabeçalho com breadcrumb ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/franquias/unidades"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Unidades</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-base font-bold text-slate-800 truncate">
                  {isEdit ? (nomeUnidade || 'Editar Unidade') : 'Nova Unidade'}
                </h1>
                {isEdit && formData.codigo_unidade && (
                  <p className="text-xs text-slate-400 font-mono">{formData.codigo_unidade}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/franquias/unidades"
              className="px-4 py-2 text-sm border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSalvar}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition"
              style={{ backgroundColor: '#394353' }}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </div>

        {/* Tabs de navegação */}
        <div className="flex border-t border-slate-100 overflow-x-auto">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                activeTab === idx
                  ? 'border-slate-700 text-slate-800 bg-slate-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Conteúdo da aba ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="p-5 sm:p-6">

          {/* ── Tab 0: Identificação ── */}
          {activeTab === 0 && (
            <div>
              <SectionTitle>Informações básicas da unidade</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Código da Unidade" required>
                  <input name="codigo_unidade" value={formData.codigo_unidade} onChange={handleChange}
                    placeholder="Ex: FRA001" className={inputCls} maxLength={30} />
                </Field>
                <Field label="Status">
                  <select name="status" value={formData.status} onChange={handleChange} className={selectCls}>
                    {getByTipo('status').length > 0
                      ? getByTipo('status').map(p => (
                          <option key={p.id} value={p.label}>{p.label}</option>
                        ))
                      : (Object.keys(STATUS_LABELS) as StatusUnidade[]).map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))
                    }
                  </select>
                </Field>
                <Field label="Etapa Atual">
                  <select name="etapa_atual" value={formData.etapa_atual} onChange={handleChange} className={selectCls}>
                    {getByTipo('etapa').length > 0
                      ? getByTipo('etapa').map(p => (
                          <option key={p.id} value={p.label}>{p.label}</option>
                        ))
                      : (Object.keys(ETAPA_LABELS) as EtapaUnidade[]).map(e => (
                          <option key={e} value={e}>{ETAPA_LABELS[e]}</option>
                        ))
                    }
                  </select>
                </Field>
                <Field label="Nome da Unidade" required col="sm:col-span-2">
                  <input name="nome_unidade" value={formData.nome_unidade} onChange={handleChange}
                    placeholder="Nome oficial da unidade" className={inputCls} maxLength={200} />
                </Field>
                <Field label="Nome Fantasia">
                  <input name="nome_fantasia" value={formData.nome_fantasia} onChange={handleChange}
                    placeholder="Nome de exibição (opcional)" className={inputCls} maxLength={200} />
                </Field>
                <Field label="Data de Abertura">
                  <input type="date" name="data_abertura" value={formData.data_abertura} onChange={handleChange} className={inputCls} />
                </Field>
                <Field label="Data de Assinatura do Contrato">
                  <input type="date" name="data_assinatura_contrato" value={formData.data_assinatura_contrato} onChange={handleChange} className={inputCls} />
                </Field>
              </div>

              {/* ── Cliente Vinculado ─────────────────────────────────── */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  Cliente Vinculado
                </p>

                {clienteVinculado ? (
                  /* Cliente selecionado — exibe o cartão */
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div
                      className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: '#394353' }}
                    >
                      {(clienteVinculado.nome_completo || clienteVinculado.razao_social || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {clienteVinculado.nome_completo || clienteVinculado.razao_social}
                      </p>
                      <p className="text-xs text-slate-500">
                        {clienteVinculado.tipo_pessoa === 'FISICA' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                        {(clienteVinculado.cpf || clienteVinculado.cnpj) && ` · ${clienteVinculado.cpf || clienteVinculado.cnpj}`}
                        {` · Cód. ${clienteVinculado.codigo}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowClienteModal(true)}
                        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
                        title="Ver dados do cliente"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleLimparCliente}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Remover vínculo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Campo de busca */
                  <div className="relative" ref={clienteDropdownRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      {clienteBuscando && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                      )}
                      <input
                        type="text"
                        value={clienteBusca}
                        onChange={e => handleBuscarCliente(e.target.value)}
                        onFocus={() => clienteResultados.length > 0 && setShowClienteDropdown(true)}
                        onBlur={() => setTimeout(() => setShowClienteDropdown(false), 180)}
                        placeholder="Buscar cliente por nome, CPF ou CNPJ..."
                        className={`${inputCls} pl-9`}
                      />
                    </div>
                    {showClienteDropdown && clienteResultados.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                        {clienteResultados.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={() => handleSelecionarCliente(c)}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 transition border-b border-slate-100 last:border-0"
                          >
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {c.nome_completo || c.razao_social}
                            </p>
                            <p className="text-xs text-slate-500">
                              {c.tipo_pessoa === 'FISICA' ? 'PF' : 'PJ'} · {c.cpf || c.cnpj || '—'} · Cód. {c.codigo}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                    {clienteBusca.length >= 2 && !clienteBuscando && clienteResultados.length === 0 && (
                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                        <Search className="w-3 h-3" /> Nenhum cliente encontrado para &quot;{clienteBusca}&quot;
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab 1: Franqueado ── */}
          {activeTab === 1 && (
            <div>
              <SectionTitle>Dados do franqueado responsável pela unidade</SectionTitle>

              {/* ── Franqueado Vinculado (Pessoa Física) ─────────────── */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  Franqueado Vinculado
                  <span className="text-xs font-normal text-slate-400 ml-1">(somente Pessoa Física)</span>
                </p>

                {franqueadoVinculado ? (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div
                      className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: '#394353' }}
                    >
                      {(franqueadoVinculado.nome_completo || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {franqueadoVinculado.nome_completo}
                      </p>
                      <p className="text-xs text-slate-500">
                        Pessoa Física
                        {franqueadoVinculado.cpf && ` · ${franqueadoVinculado.cpf}`}
                        {` · Cód. ${franqueadoVinculado.codigo}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowFranqueadoModal(true)}
                        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
                        title="Ver dados do franqueado"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleLimparFranqueado}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Remover vínculo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative" ref={franqueadoDropdownRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      {franqueadoBuscando && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                      )}
                      <input
                        type="text"
                        value={franqueadoBusca}
                        onChange={e => handleBuscarFranqueado(e.target.value)}
                        onFocus={() => franqueadoResultados.length > 0 && setShowFranqueadoDropdown(true)}
                        onBlur={() => setTimeout(() => setShowFranqueadoDropdown(false), 180)}
                        placeholder="Buscar pessoa física por nome ou CPF..."
                        className={`${inputCls} pl-9`}
                      />
                    </div>
                    {showFranqueadoDropdown && franqueadoResultados.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                        {franqueadoResultados.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={() => handleSelecionarFranqueado(c)}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 transition border-b border-slate-100 last:border-0"
                          >
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {c.nome_completo}
                            </p>
                            <p className="text-xs text-slate-500">
                              PF · {c.cpf || '—'} · Cód. {c.codigo}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                    {franqueadoBusca.length >= 2 && !franqueadoBuscando && franqueadoResultados.length === 0 && (
                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                        <Search className="w-3 h-3" /> Nenhuma pessoa física encontrada para &quot;{franqueadoBusca}&quot;
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Campos complementares do franqueado */}
              <div className="pt-5 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-3">Dados complementares</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="Nome do Franqueado" required col="sm:col-span-2 lg:col-span-3">
                    <input name="nome_franqueado" value={formData.nome_franqueado} onChange={handleChange}
                      placeholder="Nome completo" className={inputCls} maxLength={200} />
                  </Field>
                  <Field label="CPF">
                    <input name="cpf_cnpj_franqueado" value={formData.cpf_cnpj_franqueado} onChange={handleChange}
                      placeholder="000.000.000-00" className={inputCls} maxLength={18} />
                  </Field>
                  <Field label="Telefone">
                    <input name="telefone_franqueado" value={formData.telefone_franqueado} onChange={handleChange}
                      placeholder="(00) 00000-0000" className={inputCls} maxLength={15} />
                  </Field>
                  <Field label="E-mail">
                    <input type="email" name="email_franqueado" value={formData.email_franqueado} onChange={handleChange}
                      placeholder="franqueado@email.com" className={inputCls} maxLength={200} />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 2: Endereço ── */}
          {activeTab === 2 && (
            <div>
              <SectionTitle>Localização física da unidade</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="CEP">
                  <input
                    name="cep"
                    value={formData.cep}
                    onChange={e => {
                      handleChange(e)
                      if (e.target.value.replace(/\D/g, '').length === 8) buscarCep(e.target.value)
                    }}
                    placeholder="00000-000"
                    className={inputCls}
                    maxLength={9}
                  />
                </Field>
                <Field label="Estado">
                  <select name="estado" value={formData.estado} onChange={handleChange} className={selectCls}>
                    <option value="">Selecionar UF</option>
                    {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </Field>
                <Field label="Cidade" col="sm:col-span-2">
                  <input name="cidade" value={formData.cidade} onChange={handleChange}
                    placeholder="Cidade" className={inputCls} maxLength={150} />
                </Field>
                <Field label="Rua / Logradouro" col="sm:col-span-2 lg:col-span-3">
                  <input name="rua" value={formData.rua} onChange={handleChange}
                    placeholder="Ex: Avenida Paulista" className={inputCls} maxLength={300} />
                </Field>
                <Field label="Número">
                  <input name="numero" value={formData.numero} onChange={handleChange}
                    placeholder="100" className={inputCls} maxLength={20} />
                </Field>
                <Field label="Complemento" col="sm:col-span-2">
                  <input name="complemento" value={formData.complemento} onChange={handleChange}
                    placeholder="Sala, andar, etc." className={inputCls} maxLength={100} />
                </Field>
                <Field label="Bairro" col="sm:col-span-2">
                  <input name="bairro" value={formData.bairro} onChange={handleChange}
                    placeholder="Bairro" className={inputCls} maxLength={150} />
                </Field>
                <Field label="País">
                  <input name="pais" value={formData.pais} onChange={handleChange}
                    placeholder="Brasil" className={inputCls} maxLength={50} />
                </Field>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-3">Coordenadas geográficas (opcional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-sm">
                  <Field label="Latitude">
                    <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange}
                      placeholder="-23.561414" className={inputCls} />
                  </Field>
                  <Field label="Longitude">
                    <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange}
                      placeholder="-46.655884" className={inputCls} />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 3: Contrato ── */}
          {activeTab === 3 && (
            <div>
              <SectionTitle>Dados contratuais e taxas</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="Tipo de Contrato" col="sm:col-span-2">
                  {getByTipo('tipo_contrato').length > 0 ? (
                    <select name="tipo_contrato" value={formData.tipo_contrato} onChange={handleChange} className={selectCls}>
                      <option value="">Selecionar tipo</option>
                      {getByTipo('tipo_contrato').map(p => (
                        <option key={p.id} value={p.label}>{p.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input name="tipo_contrato" value={formData.tipo_contrato} onChange={handleChange}
                      placeholder="Ex: Franquia padrão, master, etc." className={inputCls} maxLength={100} />
                  )}
                </Field>
                <Field label="Prazo (meses)">
                  <input type="number" name="prazo_contrato_meses" value={formData.prazo_contrato_meses} onChange={handleChange}
                    placeholder="60" className={inputCls} min={1} />
                </Field>
                <Field label="Data de Início">
                  <input type="date" name="data_inicio_contrato" value={formData.data_inicio_contrato} onChange={handleChange} className={inputCls} />
                </Field>
                <Field label="Data de Término">
                  <input type="date" name="data_termino_contrato" value={formData.data_termino_contrato} onChange={handleChange} className={inputCls} />
                </Field>
                <Field label="Taxa de Franquia (R$)">
                  <input type="number" step="0.01" name="taxa_franquia" value={formData.taxa_franquia} onChange={handleChange}
                    placeholder="0,00" className={inputCls} min={0} />
                </Field>
              </div>

              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-3">Taxas recorrentes</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Field label="Royalties (%)">
                    <input type="number" step="0.01" name="royalties_percentual" value={formData.royalties_percentual} onChange={handleChange}
                      placeholder="5,00" className={inputCls} min={0} max={100} />
                  </Field>
                  <Field label="Fundo de Marketing (%)">
                    <input type="number" step="0.01" name="fundo_marketing_percentual" value={formData.fundo_marketing_percentual} onChange={handleChange}
                      placeholder="2,00" className={inputCls} min={0} max={100} />
                  </Field>
                  <Field label="Taxa Tecnológica (%)">
                    <input type="number" step="0.01" name="taxa_tecnologica" value={formData.taxa_tecnologica} onChange={handleChange}
                      placeholder="1,50" className={inputCls} min={0} max={100} />
                  </Field>
                  <Field label="Meta de Faturamento Mensal (R$)">
                    <input type="number" step="0.01" name="faturamento_meta_mensal" value={formData.faturamento_meta_mensal} onChange={handleChange}
                      placeholder="50.000,00" className={inputCls} min={0} />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 4: Operacional ── */}
          {activeTab === 4 && (
            <div>
              <SectionTitle>Estrutura e funcionamento da unidade</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Modelo da Unidade">
                  <select name="modelo_unidade" value={formData.modelo_unidade} onChange={handleChange} className={selectCls}>
                    <option value="">Selecionar modelo</option>
                    {getByTipo('modalidade').length > 0
                      ? getByTipo('modalidade').map(p => (
                          <option key={p.id} value={p.label}>{p.label}</option>
                        ))
                      : (Object.keys(MODELO_LABELS) as ModeloUnidade[]).map(m => (
                          <option key={m} value={m}>{MODELO_LABELS[m]}</option>
                        ))
                    }
                  </select>
                </Field>
                <Field label="Tamanho da Loja (m²)">
                  <input type="number" step="0.01" name="tamanho_loja_m2" value={formData.tamanho_loja_m2} onChange={handleChange}
                    placeholder="Ex: 80" className={inputCls} min={0} />
                </Field>
                <Field label="Capacidade Operacional">
                  <input type="number" name="capacidade_operacional" value={formData.capacidade_operacional} onChange={handleChange}
                    placeholder="Nº de colaboradores" className={inputCls} min={0} />
                </Field>
                <Field label="Horário de Funcionamento" col="lg:col-span-3">
                  <textarea
                    name="horario_funcionamento"
                    value={formData.horario_funcionamento}
                    onChange={handleChange}
                    placeholder="Ex: Seg-Sex: 08h às 18h | Sáb: 09h às 13h | Dom: Fechado"
                    className={`${inputCls} h-24 resize-none`}
                    maxLength={500}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* ── Tab 5: Sócios (apenas edição) ── */}
          {activeTab === 5 && isEdit && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Sócios da Unidade</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{socios.length} sócio{socios.length !== 1 ? 's' : ''} cadastrado{socios.length !== 1 ? 's' : ''}</p>
                </div>
                {!showSocioForm && (
                  <button
                    onClick={() => { setShowSocioForm(true); setEditingSocio({ tipo_socio: 'socio' }) }}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg font-semibold hover:opacity-90 transition"
                    style={{ backgroundColor: '#394353' }}
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Sócio
                  </button>
                )}
              </div>

              {/* Formulário inline de sócio */}
              {showSocioForm && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 mb-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-slate-700">
                      {editingSocio?.id ? 'Editar Sócio' : 'Novo Sócio'}
                    </h4>
                    <button
                      onClick={() => { setShowSocioForm(false); setEditingSocio(null) }}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome <span className="text-red-500">*</span></label>
                      <input value={editingSocio?.nome || ''} onChange={e => setEditingSocio(p => ({ ...p, nome: e.target.value }))}
                        className={inputCls} placeholder="Nome do sócio" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo</label>
                      <select value={editingSocio?.tipo_socio || 'socio'} onChange={e => setEditingSocio(p => ({ ...p, tipo_socio: e.target.value as never }))} className={selectCls}>
                        {TIPOS_SOCIO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">CPF / CNPJ</label>
                      <input value={maskCpfCnpj(editingSocio?.cpf_cnpj || '')} onChange={e => setEditingSocio(p => ({ ...p, cpf_cnpj: e.target.value }))}
                        className={inputCls} placeholder="000.000.000-00" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">E-mail</label>
                      <input type="email" value={editingSocio?.email || ''} onChange={e => setEditingSocio(p => ({ ...p, email: e.target.value }))}
                        className={inputCls} placeholder="socio@email.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Telefone</label>
                      <input value={maskPhone(editingSocio?.telefone || '')} onChange={e => setEditingSocio(p => ({ ...p, telefone: e.target.value }))}
                        className={inputCls} placeholder="(00) 00000-0000" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Participação (%)</label>
                      <input type="number" step="0.01" min={0} max={100}
                        value={editingSocio?.percentual_participacao || ''}
                        onChange={e => setEditingSocio(p => ({ ...p, percentual_participacao: parseFloat(e.target.value) || undefined }))}
                        className={inputCls} placeholder="0,00" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button onClick={handleSalvarSocio} disabled={savingSocio}
                      className="px-5 py-2 text-sm text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
                      style={{ backgroundColor: '#394353' }}>
                      {savingSocio ? 'Salvando...' : 'Salvar Sócio'}
                    </button>
                    <button onClick={() => { setShowSocioForm(false); setEditingSocio(null) }}
                      className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de sócios */}
              {loadingSocios ? (
                <div className="text-center py-8 text-slate-400 text-sm">Carregando sócios...</div>
              ) : socios.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-medium">Nenhum sócio cadastrado</p>
                  <button
                    onClick={() => { setShowSocioForm(true); setEditingSocio({ tipo_socio: 'socio' }) }}
                    className="mt-3 text-sm text-slate-600 underline hover:text-slate-800"
                  >
                    Adicionar primeiro sócio
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {socios.map(s => (
                    <div key={s.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{s.nome}</p>
                          {s.tipo_socio && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                              {TIPOS_SOCIO.find(t => t.value === s.tipo_socio)?.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => { setEditingSocio(s); setShowSocioForm(true) }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {confirmDeleteSocio === s.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleExcluirSocio(s.id)}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">
                                Ok
                              </button>
                              <button onClick={() => setConfirmDeleteSocio(null)}
                                className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded">
                                Não
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteSocio(s.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        {s.percentual_participacao != null && (
                          <p className="text-xs text-slate-500">{s.percentual_participacao.toFixed(2).replace('.', ',')}% de participação</p>
                        )}
                        {s.cpf_cnpj && <p className="text-xs text-slate-500">{s.cpf_cnpj}</p>}
                        {s.email && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 flex-shrink-0" />{s.email}
                          </p>
                        )}
                        {s.telefone && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 flex-shrink-0" />{s.telefone}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Navegação entre tabs ── */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">
          <button
            onClick={() => setActiveTab(t => Math.max(0, t - 1))}
            disabled={activeTab === 0}
            className="px-4 py-2 text-sm border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          <span className="text-xs text-slate-400">
            {activeTab + 1} / {tabs.length}
          </span>
          {activeTab < tabs.length - 1 ? (
            <button
              onClick={() => setActiveTab(t => Math.min(tabs.length - 1, t + 1))}
              className="px-4 py-2 text-sm border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Próximo →
            </button>
          ) : (
            <button
              onClick={handleSalvar}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition"
              style={{ backgroundColor: '#394353' }}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Cadastrar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-componente auxiliar ────────────────────────────────────────────────
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs font-medium text-slate-500 mb-4 pb-2 border-b border-slate-100">{children}</p>
)

export default CadastroUnidade
