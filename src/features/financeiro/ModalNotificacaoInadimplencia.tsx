/**
 * MODAL - NOTIFICAÇÃO EXTRAJUDICIAL DE INADIMPLÊNCIA
 * Suporta: Fundo de Propaganda e Royalties
 */

import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, FileText, Mail, Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { gerarNotificacaoPDF, gerarNotificacaoPDFBase64, type TipoNotificacao, type DadosNotificacao, type ItemDebitoNotificacao } from './notificacaoService'
import { enviarEmailNotificacao, gerarHtmlEmailNotificacao } from './emailService'
import { DatePickerInput } from '../../shared/components/DatePicker'

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface ClienteResumido {
  id: number
  nome: string
  cpf?: string
  cnpj?: string
  rg?: string
  tipo_pessoa: string
  email?: string
  endereco_logradouro?: string
  endereco_numero?: string
  endereco_complemento?: string
  endereco_bairro?: string
  endereco_cidade?: string
  endereco_estado?: string
}

interface Props {
  tipo: TipoNotificacao
  aberto: boolean
  onFechar: () => void
  onSalvo?: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const labelTipo: Record<TipoNotificacao, string> = {
  fundo_propaganda: 'Fundo de Propaganda',
  royalties: 'Royalties',
}

function formatarMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function parseMoeda(s: string): number {
  const limpo = s.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(limpo) || 0
}

interface ItemDebitoForm {
  id: string
  descricao: string
  dataVencimentoISO: string
  valorOriginalStr: string
  multaPct: string
  jurosPct: string
  valorMultaStr: string
  valorJurosStr: string
}

function novoItem(): ItemDebitoForm {
  return {
    id: Math.random().toString(36).slice(2),
    descricao: '',
    dataVencimentoISO: '',
    valorOriginalStr: '',
    multaPct: '2',
    jurosPct: '1',
    valorMultaStr: '',
    valorJurosStr: '',
  }
}

function calcularSubtotal(item: ItemDebitoForm): number {
  const p = (s: string) => parseFloat(s.replace(/[^\d,]/g, '').replace(',', '.')) || 0
  return parseFloat((p(item.valorOriginalStr) + p(item.valorMultaStr) + p(item.valorJurosStr)).toFixed(2))
}

// ── Componente ────────────────────────────────────────────────────────────────

export const ModalNotificacaoInadimplencia: React.FC<Props> = ({ tipo, aberto, onFechar, onSalvo }) => {
  // Busca de cliente
  const [termoBusca, setTermoBusca] = useState('')
  const [resultadosBusca, setResultadosBusca] = useState<ClienteResumido[]>([])
  const [buscando, setBuscando] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteResumido | null>(null)

  // Campos adicionais
  const [territorio, setTerritorio] = useState('')
  const [mesCompetencia, setMesCompetencia] = useState('')
  const [emailDestino, setEmailDestino] = useState('')
  const [enderecoCliente, setEnderecoCliente] = useState('')

  // Campos de qualificação e referência
  const [nacionalidade, setNacionalidade] = useState('brasileiro(a)')
  const [profissao, setProfissao] = useState('')
  const [estadoCivilDoc, setEstadoCivilDoc] = useState('')

  // Itens de débito (múltiplos pagamentos)
  const [itens, setItens] = useState<ItemDebitoForm[]>(() => [novoItem()])

  // Estado da ação
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [notificacaoId, setNotificacaoId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null)

  // ── Cálculos ───────────────────────────────────────────────────────────────
  const valorTotalGeral = parseFloat(
    itens.reduce((s, i) => s + calcularSubtotal(i), 0).toFixed(2)
  )

  const adicionarItem = () => setItens(prev => [...prev, novoItem()])
  const removerItem = (id: string) => setItens(prev => prev.filter(i => i.id !== id))

  const atualizarItem = (id: string, field: keyof ItemDebitoForm, value: string) => {
    setItens(prev => prev.map(item => {
      if (item.id !== id) return item
      const upd = { ...item, [field]: value }
      const orig = parseMoeda(upd.valorOriginalStr)
      if ((field === 'valorOriginalStr' || field === 'multaPct') && orig > 0) {
        const pct = parseFloat(upd.multaPct || '0')
        const v = parseFloat(((orig * pct) / 100).toFixed(2))
        upd.valorMultaStr = isNaN(v) || pct === 0 ? '' : v.toFixed(2).replace('.', ',')
      }
      if (field === 'valorMultaStr' && orig > 0) {
        const multa = parseMoeda(value)
        const pct = parseFloat(((multa / orig) * 100).toFixed(4))
        upd.multaPct = isNaN(pct) || multa === 0 ? '' : String(pct)
      }
      if ((field === 'valorOriginalStr' || field === 'jurosPct') && orig > 0) {
        const pct = parseFloat(upd.jurosPct || '0')
        const v = parseFloat(((orig * pct) / 100).toFixed(2))
        upd.valorJurosStr = isNaN(v) || pct === 0 ? '' : v.toFixed(2).replace('.', ',')
      }
      if (field === 'valorJurosStr' && orig > 0) {
        const juros = parseMoeda(value)
        const pct = parseFloat(((juros / orig) * 100).toFixed(4))
        upd.jurosPct = isNaN(pct) || juros === 0 ? '' : String(pct)
      }
      return upd
    }))
  }

  // ── Busca de clientes (debounce) ───────────────────────────────────────────
  const buscarClientes = useCallback(async (termo: string) => {
    if (termo.length < 2) {
      setResultadosBusca([])
      return
    }
    setBuscando(true)
    try {
      const { data } = await supabase
        .from('clientes')
        .select('id, nome_completo, razao_social, cpf, cnpj, rg, tipo_pessoa, email, enderecos:clientes_enderecos(logradouro, numero, complemento, bairro, cidade, estado)')
        .or(
          `nome_completo.ilike.%${termo}%,razao_social.ilike.%${termo}%,cpf.ilike.%${termo}%,cnpj.ilike.%${termo}%`
        )
        .limit(8)

      const mapeados: ClienteResumido[] = (data || []).map((c: any) => {
        const endereco = (c.enderecos || [])[0] || {}
        return {
          id: c.id,
          nome: c.nome_completo || c.razao_social || '(sem nome)',
          cpf: c.cpf,
          cnpj: c.cnpj,
          rg: c.rg,
          tipo_pessoa: c.tipo_pessoa,
          email: c.email,
          endereco_logradouro: endereco.logradouro,
          endereco_numero: endereco.numero,
          endereco_complemento: endereco.complemento,
          endereco_bairro: endereco.bairro,
          endereco_cidade: endereco.cidade,
          endereco_estado: endereco.estado,
        }
      })
      setResultadosBusca(mapeados)
    } finally {
      setBuscando(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => buscarClientes(termoBusca), 350)
    return () => clearTimeout(timer)
  }, [termoBusca, buscarClientes])

  // ── Reset ao fechar ────────────────────────────────────────────────────────
  const resetar = () => {
    setTermoBusca('')
    setResultadosBusca([])
    setClienteSelecionado(null)
    setTerritorio('')
    setMesCompetencia('')
    setEmailDestino('')
    setEnderecoCliente('')
    setNacionalidade('brasileiro(a)')
    setProfissao('')
    setEstadoCivilDoc('')
    setItens([novoItem()])
    setFeedback(null)
    setNotificacaoId(null)
  }

  const fechar = () => {
    resetar()
    onFechar()
  }

  // ── Seleção de cliente ─────────────────────────────────────────────────────
  const selecionarCliente = (cliente: ClienteResumido) => {
    setClienteSelecionado(cliente)
    setTermoBusca('')
    setResultadosBusca([])
    // Auto-preenche email se disponível
    if (cliente.email && !emailDestino) {
      setEmailDestino(cliente.email)
    }
    // Auto-preenche endereço se disponível
    const partes = [
      cliente.endereco_logradouro,
      cliente.endereco_numero ? `nº ${cliente.endereco_numero}` : null,
      cliente.endereco_complemento,
      cliente.endereco_bairro,
      cliente.endereco_cidade && cliente.endereco_estado ? `${cliente.endereco_cidade}/${cliente.endereco_estado}` : (cliente.endereco_cidade || cliente.endereco_estado),
    ].filter(Boolean)
    if (partes.length > 0) {
      setEnderecoCliente(partes.join(', '))
    }
  }

  // ── Validação ──────────────────────────────────────────────────────────────
  const validar = (): string | null => {
    if (!clienteSelecionado) return 'Selecione um cliente.'
    if (!territorio.trim()) return 'Informe o território da unidade franqueada.'
    if (!mesCompetencia.trim()) return 'Informe o mês de competência.'
    if (!itens.some(i => parseMoeda(i.valorOriginalStr) > 0)) return 'Informe o valor original em ao menos um pagamento.'
    return null
  }

  // ── Montar dados ───────────────────────────────────────────────────────────
  const montarDados = (): DadosNotificacao => {
    const itensFormatados: ItemDebitoNotificacao[] = itens
      .filter(i => parseMoeda(i.valorOriginalStr) > 0)
      .map(i => {
        const orig = parseMoeda(i.valorOriginalStr)
        const multa = parseMoeda(i.valorMultaStr)
        const juros = parseMoeda(i.valorJurosStr)
        return {
          dataVencimento: i.dataVencimentoISO
            ? new Date(i.dataVencimentoISO + 'T12:00:00').toLocaleDateString('pt-BR')
            : undefined,
          referencia: i.descricao || undefined,
          valorOriginal: orig,
          multaPercentual: parseFloat(i.multaPct) || 0,
          valorMulta: multa,
          jurosPercentual: parseFloat(i.jurosPct) || 0,
          valorJuros: juros,
          subtotal: parseFloat((orig + multa + juros).toFixed(2)),
        }
      })
    const totalGeral = parseFloat(itensFormatados.reduce((s, i) => s + i.subtotal, 0).toFixed(2))
    const primeiro = itensFormatados[0]
    return {
      nomeCompleto: clienteSelecionado!.nome,
      cpf: clienteSelecionado!.cpf || clienteSelecionado!.cnpj || '',
      rg: clienteSelecionado!.rg,
      endereco: enderecoCliente || undefined,
      email: emailDestino || undefined,
      nacionalidade: nacionalidade || undefined,
      profissao: profissao || undefined,
      estadoCivilDoc: estadoCivilDoc || undefined,
      territorioUnidade: territorio,
      mesCompetencia,
      dataVencimento: primeiro?.dataVencimento,
      referencia: primeiro?.referencia,
      valorOriginal: itensFormatados.reduce((s, i) => s + i.valorOriginal, 0),
      multaPercentual: 0,
      valorMulta: itensFormatados.reduce((s, i) => s + i.valorMulta, 0),
      jurosPercentual: 0,
      valorJuros: itensFormatados.reduce((s, i) => s + i.valorJuros, 0),
      valorTotal: totalGeral,
      itensDebito: itensFormatados,
      tipo,
    }
  }

  // ── Salvar no banco ────────────────────────────────────────────────────────
  const salvarNoBanco = async (marcarEmailEnviado = false): Promise<string | null> => {
    const err = validar()
    if (err) { setFeedback({ tipo: 'erro', msg: err }); return null }
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado.')
      const { data: usuarioDb } = await supabase.from('usuarios').select('empresa_id').eq('id', user.id).single()
      if (!usuarioDb?.empresa_id) throw new Error('Empresa não encontrada.')

      const dados = montarDados()
      const payload = {
        empresa_id: usuarioDb.empresa_id,
        tipo,
        franqueado_nome: dados.nomeCompleto,
        franqueado_cpf: dados.cpf,
        territorio: dados.territorioUnidade,
        mes_competencia: dados.mesCompetencia,
        valor_total: dados.valorTotal,
        email_destino: dados.email || null,
        status_advertencia: '1a_advertencia',
        email_enviado: marcarEmailEnviado,
        email_enviado_em: marcarEmailEnviado ? new Date().toISOString() : null,
        dados_json: dados,
      }

      if (notificacaoId) {
        const { error } = await supabase
          .from('notificacoes_extrajudiciais')
          .update({ ...payload, atualizado_em: new Date().toISOString() })
          .eq('id', notificacaoId)
        if (error) throw new Error(error.message)
        return notificacaoId
      } else {
        const { data, error } = await supabase
          .from('notificacoes_extrajudiciais')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw new Error(error.message)
        setNotificacaoId(data.id)
        return data.id
      }
    } catch (err) {
      throw err
    }
  }

  const handleSalvar = async () => {
    const err = validar()
    if (err) { setFeedback({ tipo: 'erro', msg: err }); return }
    setSalvando(true)
    setFeedback(null)
    try {
      await salvarNoBanco()
      setFeedback({ tipo: 'sucesso', msg: 'Notificação salva com sucesso!' })
      onSalvo?.()
    } catch (e) {
      setFeedback({ tipo: 'erro', msg: e instanceof Error ? e.message : 'Erro ao salvar.' })
    } finally {
      setSalvando(false)
    }
  }

  // ── Gerar PDF ──────────────────────────────────────────────────────────────
  const handleGerarPDF = () => {
    const err = validar()
    if (err) { setFeedback({ tipo: 'erro', msg: err }); return }
    setGerandoPdf(true)
    setFeedback(null)
    try {
      gerarNotificacaoPDF(montarDados())
      setFeedback({ tipo: 'sucesso', msg: 'PDF gerado e baixado com sucesso!' })
    } catch (e) {
      setFeedback({ tipo: 'erro', msg: 'Erro ao gerar PDF.' })
    } finally {
      setGerandoPdf(false)
    }
  }

  // ── Enviar Email ───────────────────────────────────────────────────────────
  const handleEnviarEmail = async () => {
    const err = validar()
    if (err) { setFeedback({ tipo: 'erro', msg: err }); return }
    if (!emailDestino.trim()) { setFeedback({ tipo: 'erro', msg: 'Informe o e-mail do destinatário.' }); return }

    setEnviandoEmail(true)
    setFeedback(null)
    try {
      const dados = montarDados()
      const { base64: pdfBase64, nomeArquivo: pdfNomeArquivo } = gerarNotificacaoPDFBase64(dados)

      const html = gerarHtmlEmailNotificacao(dados.nomeCompleto, tipo, valorTotalGeral)
      const tipoLabel = labelTipo[tipo]
      const assunto = `Notificação Extrajudicial – ${tipoLabel} – ${dados.nomeCompleto}`

      const resultado = await enviarEmailNotificacao({
        destinatario: emailDestino,
        assunto,
        corpoHtml: html,
        pdfBase64,
        pdfNomeArquivo,
      })

      if (resultado.sucesso) {
        // Atualiza ou salva o registro marcando email_enviado = true
        try {
          if (notificacaoId) {
            await supabase.from('notificacoes_extrajudiciais')
              .update({ email_enviado: true, email_enviado_em: new Date().toISOString() })
              .eq('id', notificacaoId)
          } else {
            await salvarNoBanco(true)
          }
          onSalvo?.()
        } catch (_) { /* silent */ }
        setFeedback({ tipo: 'sucesso', msg: 'E-mail enviado com sucesso!' })
      } else {
        setFeedback({ tipo: 'erro', msg: resultado.erro || 'Falha no envio do e-mail.' })
      }
    } finally {
      setEnviandoEmail(false)
    }
  }

  if (!aberto) return null

  // ── Render ─────────────────────────────────────────────────────────────────
  const ModalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[94vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#C9C4B5]" style={{ backgroundColor: '#394353' }}>
          <div>
            <h2 className="text-base font-semibold text-white">Notificação Extrajudicial</h2>
            <p className="text-xs text-gray-300 mt-0.5">{labelTipo[tipo]} – Primeira Advertência</p>
          </div>
          <button onClick={fechar} className="text-gray-300 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Busca de Cliente */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
              Buscar Franqueado(a)
            </label>
            {clienteSelecionado ? (
              <div className="flex items-center justify-between bg-gray-50 border border-[#C9C4B5] rounded px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{clienteSelecionado.nome}</p>
                  <p className="text-xs text-gray-500">
                    CPF: {clienteSelecionado.cpf || clienteSelecionado.cnpj || '—'}
                  </p>
                </div>
                <button
                  onClick={() => setClienteSelecionado(null)}
                  className="text-xs text-red-500 hover:underline ml-4"
                >
                  Trocar
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nome, CPF ou CNPJ..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
                  />
                  {buscando && (
                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                  )}
                </div>
                {resultadosBusca.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-[#C9C4B5] rounded shadow-lg max-h-48 overflow-y-auto">
                    {resultadosBusca.map((c) => (
                      <li
                        key={c.id}
                        onClick={() => selecionarCliente(c)}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      >
                        <p className="text-sm font-medium text-gray-800">{c.nome}</p>
                        <p className="text-xs text-gray-500">
                          {c.tipo_pessoa === 'FISICA' ? 'CPF' : 'CNPJ'}:{' '}
                          {c.cpf || c.cnpj || '—'}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Território, Mês, Endereço e E-mail — linha única */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                Território da Unidade Franqueada *
              </label>
              <input
                type="text"
                placeholder="Ex: São Paulo/SP – Zona Sul"
                value={territorio}
                onChange={(e) => setTerritorio(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                Mês de Competência *
              </label>
              <input
                type="text"
                placeholder="Ex: Janeiro/2025"
                value={mesCompetencia}
                onChange={(e) => setMesCompetencia(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                Endereço do Franqueado(a)
              </label>
              <input
                type="text"
                placeholder="Rua, nº, Cidade/UF"
                value={enderecoCliente}
                onChange={(e) => setEnderecoCliente(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                E-mail para Envio
              </label>
              <input
                type="email"
                placeholder="email@franqueado.com.br"
                value={emailDestino}
                onChange={(e) => setEmailDestino(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
              />
            </div>
          </div>

          {/* Qualificação para o documento */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                Nacionalidade
              </label>
              <input
                type="text"
                placeholder="brasileiro(a)"
                value={nacionalidade}
                onChange={(e) => setNacionalidade(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                Profissão
              </label>
              <input
                type="text"
                placeholder="empresário(a)"
                value={profissao}
                onChange={(e) => setProfissao(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                Estado Civil (doc.)
              </label>
              <input
                type="text"
                placeholder="casado(a)"
                value={estadoCivilDoc}
                onChange={(e) => setEstadoCivilDoc(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
              />
            </div>
          </div>

          {/* Separador */}
          <hr className="border-[#C9C4B5]" />

          {/* Campos Financeiros - múltiplos pagamentos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Detalhamento do Débito
              </p>
              <button
                type="button"
                onClick={adicionarItem}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white rounded hover:opacity-90 transition"
                style={{ backgroundColor: '#394353' }}
              >
                <Plus size={13} />
                Adicionar Pagamento
              </button>
            </div>

            <div className="space-y-3">
              {itens.map((item, idx) => (
                <div key={item.id} className="border border-[#C9C4B5] rounded p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {itens.length > 1 ? `Pagamento ${idx + 1}` : 'Pagamento'}
                    </span>
                    {itens.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerItem(item.id)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition"
                      >
                        <Trash2 size={13} />
                        Remover
                      </button>
                    )}
                  </div>

                  {/* Linha 1: Referência | Data Vencimento | Valor Original */}
                  <div className="grid grid-cols-6 gap-3">
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                        Referência (tabela)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: TAXA ROYALTIES Jan/2025"
                        value={item.descricao}
                        onChange={(e) => atualizarItem(item.id, 'descricao', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                        Data de Vencimento
                      </label>
                      <DatePickerInput
                        value={item.dataVencimentoISO}
                        onChange={(v) => atualizarItem(item.id, 'dataVencimentoISO', v)}
                        className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                        Valor Original *
                      </label>
                      <input
                        type="text"
                        placeholder="R$ 0,00"
                        value={item.valorOriginalStr}
                        onChange={(e) => atualizarItem(item.id, 'valorOriginalStr', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
                      />
                    </div>
                  </div>

                  {/* Linha 2: Multa(%) | Valor Multa | Juros(%) | Valor Juros | Subtotal */}
                  <div className="grid grid-cols-9 gap-3 items-end">
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                        Multa (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={item.multaPct}
                        onChange={(e) => atualizarItem(item.id, 'multaPct', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                        Valor Multa
                      </label>
                      <input
                        type="text"
                        placeholder="R$ 0,00"
                        value={item.valorMultaStr}
                        onChange={(e) => atualizarItem(item.id, 'valorMultaStr', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                        Juros (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={item.jurosPct}
                        onChange={(e) => atualizarItem(item.id, 'jurosPct', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                        Valor Juros
                      </label>
                      <input
                        type="text"
                        placeholder="R$ 0,00"
                        value={item.valorJurosStr}
                        onChange={(e) => atualizarItem(item.id, 'valorJurosStr', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-1 focus:ring-[#394353]"
                      />
                    </div>
                    <div className="col-span-3 flex items-center justify-between px-3 py-2 bg-gray-50 rounded border border-[#C9C4B5] text-xs font-semibold text-gray-700 h-[38px]">
                      <span>Subtotal</span>
                      <span>{formatarMoeda(calcularSubtotal(item))}</span>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* Valor Total Geral */}
            <div className="mt-3 px-3 py-1.5 rounded flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold">
              <span>Valor Total</span>
              <span className="text-sm">{formatarMoeda(valorTotalGeral)}</span>
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                feedback.tipo === 'sucesso'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {feedback.tipo === 'sucesso' ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {feedback.msg}
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded hover:opacity-90 transition disabled:opacity-50 bg-emerald-600"
            >
              {salvando ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              {notificacaoId ? 'Atualizar' : 'Salvar'}
            </button>

            <button
              onClick={handleGerarPDF}
              disabled={gerandoPdf}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded hover:opacity-90 transition disabled:opacity-50"
              style={{ backgroundColor: '#394353' }}
            >
              {gerandoPdf ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <FileText size={15} />
              )}
              Gerar PDF
            </button>

            <button
              onClick={handleEnviarEmail}
              disabled={enviandoEmail}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded hover:opacity-90 transition disabled:opacity-50 bg-blue-600"
            >
              {enviandoEmail ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Mail size={15} />
              )}
              Enviar por E-mail
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(ModalContent, document.body)
}
