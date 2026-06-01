// ─────────────────────────────────────────────────────────────────────────────
// SERVICE – GESTÃO DE COBRANÇAS E INADIMPLÊNCIA
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../../../lib/supabase'
import type {
  ClienteCobranca, AcompanhamentoCliente, Interacao, Negociacao,
  NegociacaoParcela, TimelineEvento, ContaReceberResumo,
  StatusOperacional, Canal, EmpresaResponsavel,
  SnapshotFinanceiro, SnapshotTitulo, TituloNegociado,
  ClienteSearchResult, Notificacao, CanalNotificacao,
  AnexoInteracao,
} from './types'
import { calcularFase, calcularNegociacao, REGRAS_PARCELAMENTO } from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

// ── Helpers ──────────────────────────────────────────────────────────────────

const hoje = () => new Date().toISOString().split('T')[0]

function calcularStatusTitulo(conta: { status: string; data_vencimento: string; valor_saldo: number }) {
  if (conta.status === 'QUITADA') return 'QUITADO' as const
  const venc = conta.data_vencimento.split('T')[0]
  const h    = hoje()
  if (venc > h) return 'A_VENCER' as const
  if (venc === h) return 'VENCE_HOJE' as const
  return 'VENCIDO' as const
}

function calcularDiasAtraso(data_vencimento: string): number {
  const venc = new Date(data_vencimento)
  const now  = new Date()
  const diff = Math.floor((now.getTime() - venc.getTime()) / 86_400_000)
  return Math.max(0, diff)
}

function buildSnapshotFinanceiro(contas: ContaReceberResumo[]): SnapshotFinanceiro {
  const vencidas = contas.filter(c => c.status_calculado === 'VENCIDO')
  const diasMax  = Math.max(0, ...vencidas.map(c => c.dias_atraso))
  const titulos: SnapshotTitulo[] = vencidas.map(c => ({
    solutto_id:       c.solutto_id,
    numero_documento: c.numero_documento ?? '',
    valor_saldo:      c.valor_saldo,
    data_vencimento:  c.data_vencimento,
    dias_atraso:      c.dias_atraso,
  }))
  return {
    data_snapshot:      new Date().toISOString(),
    valor_total_vencido: vencidas.reduce((s, c) => s + c.valor_saldo, 0),
    titulos_vencidos:   vencidas.length,
    dias_atraso_max:    diasMax,
    fase_cobranca:      calcularFase(diasMax),
    titulos,
  }
}

// ── Sincronização por cliente (chama Edge Function do Solutto) ───────────────

export async function sincronizarClienteSolutto(
  soluttoClienteId: number,
  clienteId: number,
  empresaId: number,
): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return false

    const resp = await fetch(`${SUPABASE_URL}/functions/v1/solutto-contas-receber`, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ solutto_cliente_id: soluttoClienteId }),
    })

    if (!resp.ok) return false

    const { contas } = await resp.json()
    if (!contas || contas.length === 0) return true

    // Upsert no banco (mesma chave do sync global)
    await supabase.from('contas_receber_solutto').upsert(
      contas.map((c: Record<string, unknown>) => ({
        ...c,
        empresa_id:        empresaId,
        cliente_id:        clienteId,
        solutto_cliente_id: soluttoClienteId,
        sincronizado_em:   new Date().toISOString(),
      })),
      { onConflict: 'empresa_id,solutto_id' },
    )

    // Atualiza timestamp do cliente
    await supabase.from('clientes')
      .update({ solutto_contas_sincronizado_em: new Date().toISOString() })
      .eq('id', clienteId)

    return true
  } catch {
    return false
  }
}

// ── Dashboard: lista de clientes inadimplentes ────────────────────────────────

export async function listarClientesInadimplentes(empresaId: number): Promise<ClienteCobranca[]> {
  const { data, error } = await supabase
    .from('vw_cobranca_clientes')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('dias_atraso_max', { ascending: false })

  if (error) throw error
  return (data ?? []) as ClienteCobranca[]
}

// ── Contas do cliente (com status calculado em tempo real) ────────────────────

export async function listarContasCliente(
  clienteId: number,
  empresaId: number,
): Promise<ContaReceberResumo[]> {
  const { data, error } = await supabase
    .from('contas_receber_solutto')
    .select('id, solutto_id, numero_documento, descricao, data_vencimento, data_pagamento, valor_original, valor_pago, valor_saldo, status')
    .eq('cliente_id', clienteId)
    .eq('empresa_id', empresaId)
    .order('data_vencimento', { ascending: false })

  if (error) throw error

  return (data ?? []).map(c => ({
    ...c,
    dias_atraso:      calcularDiasAtraso(c.data_vencimento),
    status_calculado: calcularStatusTitulo(c),
  }))
}

// ── Acompanhamento do cliente ─────────────────────────────────────────────────

export async function obterAcompanhamento(
  clienteId: number,
  empresaId: number,
): Promise<AcompanhamentoCliente | null> {
  const { data } = await supabase
    .from('inadimplencia_acompanhamentos')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('empresa_id', empresaId)
    .maybeSingle()
  return data as AcompanhamentoCliente | null
}

// ── Criar ou atualizar acompanhamento após sync/interação ─────────────────────

export async function upsertAcompanhamento(params: {
  clienteId: number
  soluttoClienteId: number | null
  empresaId: number
  contas: ContaReceberResumo[]
  statusOperacional?: StatusOperacional
  proximoAcompanhamento?: string | null
  responsavelId?: string | null
}): Promise<AcompanhamentoCliente> {
  const vencidas   = params.contas.filter(c => c.status_calculado === 'VENCIDO')
  const diasMax    = Math.max(0, ...vencidas.map(c => c.dias_atraso))
  const valorTotal = vencidas.reduce((s, c) => s + c.valor_saldo, 0)
  const fase       = calcularFase(diasMax)

  const payload = {
    empresa_id:             params.empresaId,
    cliente_id:             params.clienteId,
    solutto_cliente_id:     params.soluttoClienteId,
    dias_atraso_max:        diasMax,
    valor_total_vencido:    valorTotal,
    total_titulos_vencidos: vencidas.length,
    fase_cobranca:          fase,
    ...(params.statusOperacional && { status_operacional: params.statusOperacional }),
    ...(params.proximoAcompanhamento !== undefined && { proximo_acompanhamento: params.proximoAcompanhamento }),
    ...(params.responsavelId !== undefined && { responsavel_id: params.responsavelId }),
  }

  const { data, error } = await supabase
    .from('inadimplencia_acompanhamentos')
    .upsert(payload, { onConflict: 'empresa_id,cliente_id' })
    .select()
    .single()

  if (error) throw error
  return data as AcompanhamentoCliente
}

// ── Criar interação (com sync + snapshot + timeline) ─────────────────────────

export interface CriarInteracaoParams {
  empresaId: number
  clienteId: number
  soluttoClienteId: number | null
  canais: Canal[]           // um ou mais canais; o primeiro vira o campo canal (legacy)
  tipoInteracao?: string
  descricao: string
  observacao?: string
  resultado?: string
  statusOperacionalResultante?: StatusOperacional
  proximoAcompanhamento?: string | null
  origem?: Interacao['origem']
  anexos?: AnexoInteracao[]
}

export async function criarInteracao(params: CriarInteracaoParams): Promise<Interacao> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sessão inválida')

  const canalPrimario = params.canais[0]

  // Busca nome do usuário para enriquecer a timeline
  let usuarioNome: string | null = null
  try {
    const { data: u } = await supabase
      .from('usuarios').select('nome').eq('id', session.user.id).single()
    usuarioNome = u?.nome ?? null
  } catch { /* best-effort */ }

  // 1. Sincronizar dados Solutto (se disponível)
  if (params.soluttoClienteId) {
    await sincronizarClienteSolutto(params.soluttoClienteId, params.clienteId, params.empresaId)
  }

  // 2. Carregar contas atualizadas
  const contas = await listarContasCliente(params.clienteId, params.empresaId)

  // 3. Montar snapshot financeiro (imutável)
  const snapshot = buildSnapshotFinanceiro(contas)

  const canaisLabel = params.canais.map(c => canalLabel(c)).join(', ')

  // 4. Criar a interação
  const { data: interacao, error } = await supabase
    .from('inadimplencia_interacoes')
    .insert({
      empresa_id:                    params.empresaId,
      cliente_id:                    params.clienteId,
      solutto_cliente_id:            params.soluttoClienteId,
      usuario_id:                    session.user.id,
      canal:                         canalPrimario,
      canais:                        params.canais,
      tipo_interacao:                params.tipoInteracao ?? null,
      descricao:                     params.descricao,
      observacao:                    params.observacao ?? null,
      resultado:                     params.resultado ?? null,
      status_operacional_resultante: params.statusOperacionalResultante ?? null,
      proximo_acompanhamento:        params.proximoAcompanhamento ?? null,
      origem:                        params.origem ?? 'MANUAL',
      snapshot_financeiro:           snapshot,
      anexos:                        params.anexos ?? [],
    })
    .select()
    .single()

  if (error) throw error

  // 5. Atualizar acompanhamento do cliente
  await upsertAcompanhamento({
    clienteId:            params.clienteId,
    soluttoClienteId:     params.soluttoClienteId,
    empresaId:            params.empresaId,
    contas,
    statusOperacional:    params.statusOperacionalResultante,
    proximoAcompanhamento:params.proximoAcompanhamento,
  })

  // 6. Registrar na timeline
  await registrarEventoTimeline({
    empresaId:       params.empresaId,
    clienteId:       params.clienteId,
    tipoEvento:      'INTERACAO_CRIADA',
    titulo:          `Interação via ${canaisLabel}`,
    descricao:       params.descricao.slice(0, 200),
    dados:           { canais: params.canais, snapshot_financeiro: snapshot, usuario_nome: usuarioNome },
    usuarioId:       session.user.id,
    usuarioNome:     usuarioNome,
    referenciaId:    String(interacao.id),
    referenciaTipo:  'interacao',
    icone:           canalIcone(canalPrimario),
    cor:             'blue',
  })

  // 7. Atualizar ultima_interacao_em no acompanhamento
  await supabase
    .from('inadimplencia_acompanhamentos')
    .update({ ultima_interacao_em: new Date().toISOString() })
    .eq('cliente_id', params.clienteId)
    .eq('empresa_id', params.empresaId)

  return interacao as Interacao
}

// ── Criar negociação financeira ───────────────────────────────────────────────

export interface CriarNegociacaoParams {
  empresaId: number
  clienteId: number
  interacaoId?: number
  empresaResponsavel: EmpresaResponsavel
  valorOriginal: number
  percentualMulta: number
  percentualJuros: number
  quantidadeParcelas: number
  dataVencimentoPrimeiraParcela: string
  observacoesFinanceiras?: string
  titulosNegociados?: TituloNegociado[]
  // Quando fornecido, bypassa calcularNegociacao (sem taxa base de 8%)
  valorTotalManual?: number
}

export async function criarNegociacao(params: CriarNegociacaoParams): Promise<Negociacao> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sessão inválida')

  const regra = REGRAS_PARCELAMENTO[params.empresaResponsavel]

  // Valida regra de parcelamento
  if (!regra.permite && params.quantidadeParcelas > 1)
    throw new Error(`${params.empresaResponsavel} não permite parcelamento`)
  if (params.quantidadeParcelas > regra.max_parcelas)
    throw new Error(`Máximo de ${regra.max_parcelas} parcelas para ${params.empresaResponsavel}`)

  const computed = calcularNegociacao({
    valor_original:      params.valorOriginal,
    percentual_multa:    params.percentualMulta,
    percentual_juros:    params.percentualJuros,
    quantidade_parcelas: params.quantidadeParcelas,
    empresa_responsavel: params.empresaResponsavel,
  })
  const valor_total_corrigido = params.valorTotalManual ?? computed.valor_total_corrigido
  const valor_parcela = params.valorTotalManual != null
    ? Math.round(params.valorTotalManual / params.quantidadeParcelas * 100) / 100
    : computed.valor_parcela

  // Snapshot das regras aplicadas
  const snapshotRegras = {
    ...regra,
    versao_regras: '1.0.0',
    data_aplicacao: new Date().toISOString(),
  }

  // Verifica se há negociação ativa anterior (para versionamento)
  const { data: negAnterior } = await supabase
    .from('inadimplencia_negociacoes')
    .select('id, versao')
    .eq('cliente_id', params.clienteId)
    .eq('empresa_id', params.empresaId)
    .eq('empresa_responsavel', params.empresaResponsavel)
    .eq('status_negociacao', 'ATIVA')
    .maybeSingle()

  // Cancela a anterior se existir
  if (negAnterior) {
    await supabase
      .from('inadimplencia_negociacoes')
      .update({ status_negociacao: 'CANCELADA' })
      .eq('id', negAnterior.id)
  }

  // Cria nova negociação
  const { data: neg, error } = await supabase
    .from('inadimplencia_negociacoes')
    .insert({
      empresa_id:                 params.empresaId,
      cliente_id:                 params.clienteId,
      interacao_id:               params.interacaoId ?? null,
      empresa_responsavel:        params.empresaResponsavel,
      valor_original:             params.valorOriginal,
      percentual_multa:           params.percentualMulta,
      percentual_juros:           params.percentualJuros,
      quantidade_parcelas:        params.quantidadeParcelas,
      valor_total_corrigido,
      valor_parcela,
      data_vencimento_negociacao: params.dataVencimentoPrimeiraParcela,
      observacoes_financeiras:    params.observacoesFinanceiras ?? null,
      status_negociacao:          'ATIVA',
      responsavel_id:             session.user.id,
      snapshot_regras:            snapshotRegras,
      versao:                     (negAnterior?.versao ?? 0) + 1,
      negociacao_anterior_id:     negAnterior?.id ?? null,
      titulos_negociados:         params.titulosNegociados ?? [],
    })
    .select()
    .single()

  if (error) throw error

  // Cria parcelas
  const parcelas: Omit<NegociacaoParcela, 'id' | 'created_at'>[] = []
  for (let i = 0; i < params.quantidadeParcelas; i++) {
    const venc = new Date(params.dataVencimentoPrimeiraParcela)
    venc.setMonth(venc.getMonth() + i)
    parcelas.push({
      negociacao_id:   neg.id,
      numero_parcela:  i + 1,
      valor_parcela,
      data_vencimento: venc.toISOString().split('T')[0],
      status:          'PENDENTE',
      data_pagamento:  null,
    })
  }
  await supabase.from('inadimplencia_negociacoes_parcelas').insert(parcelas)

  // Busca nome do responsável para a timeline
  let responsavelNome: string | null = null
  try {
    const { data: u } = await supabase
      .from('usuarios').select('nome').eq('id', session.user.id).single()
    responsavelNome = u?.nome ?? null
  } catch { /* best-effort */ }

  // Registra na timeline
  await registrarEventoTimeline({
    empresaId:      params.empresaId,
    clienteId:      params.clienteId,
    tipoEvento:     'NEGOCIACAO_CRIADA',
    titulo:         `Negociação criada – ${params.empresaResponsavel}`,
    descricao:      `${params.quantidadeParcelas}x de R$ ${valor_parcela.toFixed(2)} (total: R$ ${valor_total_corrigido.toFixed(2)})`,
    dados:          { negociacao_id: neg.id, versao: neg.versao, snapshot_regras: snapshotRegras },
    usuarioId:      session.user.id,
    usuarioNome:    responsavelNome,
    referenciaId:   String(neg.id),
    referenciaTipo: 'negociacao',
    icone:          'file-check',
    cor:            'green',
  })

  // Atualiza status operacional para ACORDO_ATIVO
  await upsertAcompanhamento({
    clienteId:         params.clienteId,
    soluttoClienteId:  null,
    empresaId:         params.empresaId,
    contas:            await listarContasCliente(params.clienteId, params.empresaId),
    statusOperacional: 'ACORDO_ATIVO',
  })

  return { ...neg, parcelas: parcelas as NegociacaoParcela[] } as Negociacao
}

// ── Carregar interações do cliente ────────────────────────────────────────────

export async function listarInteracoes(
  clienteId: number,
  empresaId: number,
): Promise<Interacao[]> {
  const { data, error } = await supabase
    .from('inadimplencia_interacoes')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('empresa_id', empresaId)
    .order('data_interacao', { ascending: false })

  if (error) throw error
  return (data ?? []) as Interacao[]
}

// ── Carregar timeline do cliente ──────────────────────────────────────────────

export async function listarTimeline(
  clienteId: number,
  empresaId: number,
): Promise<TimelineEvento[]> {
  const { data, error } = await supabase
    .from('inadimplencia_timeline')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('empresa_id', empresaId)
    .order('data_evento', { ascending: false })

  if (error) throw error
  const eventos = (data ?? []) as TimelineEvento[]

  // Enriquece com nomes de usuários (tenta dados.usuario_nome primeiro, depois lookup)
  const idsParaBuscar = eventos
    .filter(e => e.usuario_id && !(e.dados as any)?.usuario_nome)
    .map(e => e.usuario_id as string)
  const uniqueIds = [...new Set(idsParaBuscar)]

  let nomeMap: Record<string, string> = {}
  if (uniqueIds.length > 0) {
    try {
      const { data: users } = await supabase
        .from('usuarios').select('id, nome').in('id', uniqueIds)
      nomeMap = Object.fromEntries((users ?? []).map(u => [u.id, u.nome]))
    } catch { /* best-effort */ }
  }

  return eventos.map(e => ({
    ...e,
    usuario_nome:
      (e.dados as any)?.usuario_nome ||
      (e.usuario_id ? nomeMap[e.usuario_id] : undefined) ||
      undefined,
  }))
}

// ── Carregar negociação ativa ─────────────────────────────────────────────────

export async function obterNegociacaoAtiva(
  clienteId: number,
  empresaId: number,
): Promise<Negociacao | null> {
  const { data } = await supabase
    .from('inadimplencia_negociacoes')
    .select(`*, parcelas:inadimplencia_negociacoes_parcelas(*)`)
    .eq('cliente_id', clienteId)
    .eq('empresa_id', empresaId)
    .eq('status_negociacao', 'ATIVA')
    .order('versao', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data as Negociacao | null
}

// ── Registrar evento na timeline ──────────────────────────────────────────────

export async function registrarEventoTimeline(params: {
  empresaId: number
  clienteId: number
  tipoEvento: string
  titulo: string
  descricao?: string
  dados?: Record<string, unknown>
  usuarioId?: string | null
  usuarioNome?: string | null
  referenciaId?: string
  referenciaTipo?: string
  icone?: string
  cor?: string
}): Promise<void> {
  await supabase.from('inadimplencia_timeline').insert({
    empresa_id:      params.empresaId,
    cliente_id:      params.clienteId,
    tipo_evento:     params.tipoEvento,
    titulo:          params.titulo,
    descricao:       params.descricao ?? null,
    dados:           { ...(params.dados ?? {}), usuario_nome: params.usuarioNome ?? null },
    usuario_id:      params.usuarioId ?? null,
    referencia_id:   params.referenciaId ?? null,
    referencia_tipo: params.referenciaTipo ?? null,
    icone:           params.icone ?? 'circle',
    cor:             params.cor ?? 'gray',
    data_evento:     new Date().toISOString(),
  })
}

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICAÇÕES DE COBRANÇA
// ══════════════════════════════════════════════════════════════════════════════

// ── Buscar clientes cadastrados (base completa, para autocomplete do modal) ───
// Pesquisa diretamente na tabela clientes — não apenas nos já sincronizados.
// Filtra apenas quem tem solutto_cliente_id (necessário para consultar o WS).

export async function buscarClientesSolutto(
  query: string,
  _empresaId: number,
): Promise<ClienteSearchResult[]> {
  if (!query.trim()) return []

  const q = `%${query.trim()}%`

  const { data, error } = await supabase
    .from('clientes')
    .select('id, solutto_cliente_id, tipo_pessoa, nome_completo, razao_social, nome_fantasia, cpf, cnpj')
    .or(`razao_social.ilike.${q},nome_fantasia.ilike.${q},nome_completo.ilike.${q},cnpj.ilike.${q},cpf.ilike.${q}`)
    .not('solutto_cliente_id', 'is', null)
    .limit(10)

  if (error) throw error

  return (data ?? []).map(c => {
    const isPJ = c.tipo_pessoa === 'JURIDICA'
    const nome = isPJ ? (c.razao_social || c.nome_fantasia || '') : (c.nome_completo || '')
    const doc  = isPJ ? c.cnpj : c.cpf
    return {
      solutto_cliente_id: c.solutto_cliente_id as number,
      cliente_id:         c.id as number,
      cliente_nome:       nome,
      cliente_cpf_cnpj:   doc || null,
    }
  })
}

// ── Sincronizar e listar contas VENCIDAS de um cliente específico ─────────────
// Consulta o Solutto em tempo real (LIVE) para garantir dados atualizados.
// Salva no banco como cache append-only (mesmo padrão do sync global).
// Filtra client-side: apenas títulos não pagos com vencimento passado.

export async function sincronizarEListarContasVencidas(
  soluttoClienteId: number,
  clienteId: number | null,
  empresaId: number,
  clienteNome: string = '',
  clienteCpfCnpj: string | null = null,
): Promise<ContaReceberResumo[]> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const hoje = new Date().toISOString().split('T')[0]
  const agora = new Date().toISOString()

  // 1. Consulta LIVE ao Solutto via Edge Function
  let contasBrutas: Record<string, unknown>[] = []
  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/solutto-contas-receber`, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ solutto_cliente_id: soluttoClienteId }),
    })
    if (resp.ok) {
      const json = await resp.json()
      contasBrutas = json.contas ?? []
    }
  } catch { /* fallback para banco abaixo */ }

  // 2. Se obteve dados do Solutto, persiste no banco (status normalizado, append-only)
  if (contasBrutas.length > 0) {
    const payloads = contasBrutas
      .filter(c => c.solutto_id && c.data_vencimento)
      .map(c => {
        const quitada       = String(c.status) === '1'
        const dataPag       = (c.data_pagamento as string) || null
        const valorOriginal = Number(c.valor_original ?? 0)
        // No Solutto, valor_recebido = valor do boleto (face value), não o pago.
        // Calculamos o saldo real: se quitada=0 e valor_saldo=0, usa valor_original.
        const valorSaldo    = quitada ? 0 : (Number(c.valor_saldo ?? 0) || valorOriginal)
        const status        = quitada
          ? 'QUITADA'
          : (dataPag && valorSaldo <= 0 ? 'QUITADA'
          : (dataPag && valorSaldo > 0  ? 'PARCIAL'
          : 'ABERTO'))
        return {
          empresa_id:           empresaId,
          cliente_id:           clienteId,
          solutto_cliente_id:   soluttoClienteId,
          solutto_id:           Number(c.solutto_id),
          cliente_nome:         clienteNome,
          cliente_cpf_cnpj:     clienteCpfCnpj,
          numero_documento:     (c.numero_documento as string) || null,
          descricao:            (c.descricao as string) || `Conta #${c.solutto_id}`,
          data_emissao:         (c.data_emissao as string) || null,
          data_vencimento:      c.data_vencimento as string,
          data_pagamento:       dataPag,
          valor_original:       valorOriginal,
          valor_pago:           Number(c.valor_pago ?? 0),
          valor_saldo:          valorSaldo,
          forma_pagamento:      (c.forma_pagamento as string) || null,
          observacoes:          (c.observacoes as string) || null,
          status,
          sincronizado_em:      agora,
          solutto_dados_extras: (c.dados_extras as Record<string, unknown>) ?? null,
        }
      })

    if (payloads.length > 0) {
      try {
        await supabase
          .from('contas_receber_solutto')
          .upsert(payloads, { onConflict: 'empresa_id,solutto_id', ignoreDuplicates: true })
      } catch { /* best-effort, não bloqueia o fluxo */ }
    }

    // 3. Filtra para exibição: vencidas e não pagas (usando dados LIVE)
    //
    // ATENÇÃO: no Solutto, `valor_recebido` é o valor do boleto emitido
    // (face value), não o valor efetivamente recebido. Por isso
    // `valor_saldo = valor - valor_recebido` pode ser 0 mesmo com quitada=0.
    // O único indicador confiável de pagamento é quitada (0=aberto, 1=pago).
    return contasBrutas
      .filter(c => {
        if (!c.data_vencimento) return false
        if (String(c.status) === '1') return false   // quitada=1 → pago
        const venc = (c.data_vencimento as string).split('T')[0]
        return venc < hoje
      })
      .map(c => {
        // Saldo devedor real: usa valor_original quando valor_saldo=0 mas não pago
        const valorOriginal = Number(c.valor_original ?? 0)
        const valorSaldo    = Number(c.valor_saldo ?? 0)
        const saldoReal     = valorSaldo > 0 ? valorSaldo : valorOriginal
        return {
          id:               Number(c.solutto_id),
          solutto_id:       Number(c.solutto_id),
          numero_documento: (c.numero_documento as string) || null,
          descricao:        (c.descricao as string) || null,
          data_vencimento:  c.data_vencimento as string,
          data_pagamento:   (c.data_pagamento as string) || null,
          valor_original:   valorOriginal,
          valor_pago:       Number(c.valor_pago ?? 0),
          valor_saldo:      saldoReal,
          status:           'ABERTO',
          dias_atraso:      calcularDiasAtraso(c.data_vencimento as string),
          status_calculado: 'VENCIDO' as const,
        }
      })
      .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))
  }

  // 4. Fallback: banco local (dados podem estar desatualizados)
  const { data: dbData } = await supabase
    .from('contas_receber_solutto')
    .select('id, solutto_id, numero_documento, descricao, data_vencimento, data_pagamento, valor_original, valor_pago, valor_saldo, status')
    .eq('empresa_id', empresaId)
    .eq('solutto_cliente_id', soluttoClienteId)
    .neq('status', 'QUITADA')
    .lt('data_vencimento', hoje)
    .gt('valor_saldo', 0)
    .order('data_vencimento', { ascending: true })

  return (dbData ?? []).map(c => ({
    ...c,
    dias_atraso:      calcularDiasAtraso(c.data_vencimento),
    status_calculado: 'VENCIDO' as const,
  }))
}

// ── Criar notificação de cobrança ─────────────────────────────────────────────

export interface CriarNotificacaoParams {
  empresaId: number
  soluttoClienteId: number
  clienteId: number | null
  clienteNome: string
  clienteCpfCnpj: string | null
  titulos: Array<{
    solutto_id: number
    numero_documento: string | null
    valor_original: number
    vencimento_original: string
    valor_saldo_original: number
    dias_atraso_original: number
    valor_atual: number
    percentual_multa: number
    percentual_juros: number
    valor_total_calculado: number
  }>
  canais_enviados: CanalNotificacao[]
  observacoes?: string
  // Taxas globais para gerar o registro de negociação vinculado
  multaGlobal?: number
  taxaMensalGlobal?: number
}

export async function criarNotificacao(params: CriarNotificacaoParams): Promise<Notificacao> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sessão inválida')

  let usuarioNome: string | null = null
  try {
    const { data: u } = await supabase
      .from('usuarios').select('nome').eq('id', session.user.id).single()
    usuarioNome = u?.nome ?? null
  } catch { /* best-effort */ }

  const { data: notif, error } = await supabase
    .from('inadimplencia_notificacoes')
    .insert({
      empresa_id:         params.empresaId,
      solutto_cliente_id: params.soluttoClienteId,
      cliente_id:         params.clienteId,
      cliente_nome:       params.clienteNome,
      cliente_cpf_cnpj:   params.clienteCpfCnpj,
      usuario_id:         session.user.id,
      canais_enviados:    params.canais_enviados,
      observacoes:        params.observacoes?.trim() || null,
      status:             'REGISTRADA',
    })
    .select()
    .single()

  if (error) throw error

  // Insere os títulos vinculados
  if (params.titulos.length > 0) {
    const { error: errTitulos } = await supabase
      .from('inadimplencia_notificacoes_titulos')
      .insert(
        params.titulos.map(t => ({
          notificacao_id:       notif.id,
          solutto_id:           t.solutto_id,
          numero_documento:     t.numero_documento,
          valor_original:       t.valor_original,
          vencimento_original:  t.vencimento_original,
          valor_saldo_original: t.valor_saldo_original,
          dias_atraso_original: t.dias_atraso_original,
          valor_atual:          t.valor_atual,
          percentual_multa:     t.percentual_multa,
          percentual_juros:     t.percentual_juros,
          valor_total_calculado: t.valor_total_calculado,
        }))
      )
    if (errTitulos) throw errTitulos
  }

  // Registra evento na timeline do cliente (se mapeado)
  if (params.clienteId) {
    await registrarEventoTimeline({
      empresaId:      params.empresaId,
      clienteId:      params.clienteId,
      tipoEvento:     'NOTIFICACAO_ENVIADA',
      titulo:         `Notificação registrada — ${params.canais_enviados.length} canal(is)`,
      descricao:      `${params.titulos.length} título(s) | ${params.canais_enviados.join(', ')}`,
      dados:          { notificacao_id: notif.id, canais: params.canais_enviados },
      usuarioId:      session.user.id,
      usuarioNome,
      referenciaId:   String(notif.id),
      referenciaTipo: 'notificacao',
      icone:          'bell',
      cor:            'orange',
    })
  }

  // Cria registro de negociação vinculado (quando clienteId disponível)
  if (params.clienteId && params.titulos.length > 0) {
    try {
      const valorOriginal = params.titulos.reduce((s, t) => s + t.valor_saldo_original, 0)
      const valorTotal    = Math.round(params.titulos.reduce((s, t) => s + t.valor_total_calculado, 0) * 100) / 100
      const multaPerc     = params.multaGlobal ?? params.titulos[0]?.percentual_multa ?? 0
      const jurosPerc     = params.taxaMensalGlobal ?? params.titulos[0]?.percentual_juros ?? 0
      const dVenc = new Date(); dVenc.setDate(dVenc.getDate() + 30)

      // Cancela ATIVA anterior de FRANCHISING
      const { data: anterior } = await supabase
        .from('inadimplencia_negociacoes')
        .select('id, versao')
        .eq('cliente_id', params.clienteId)
        .eq('empresa_id', params.empresaId)
        .eq('empresa_responsavel', 'FRANCHISING')
        .eq('status_negociacao', 'ATIVA')
        .maybeSingle()

      if (anterior) {
        await supabase.from('inadimplencia_negociacoes')
          .update({ status_negociacao: 'CANCELADA' })
          .eq('id', anterior.id)
      }

      const { data: neg } = await supabase.from('inadimplencia_negociacoes').insert({
        empresa_id:                 params.empresaId,
        cliente_id:                 params.clienteId,
        empresa_responsavel:        'FRANCHISING',
        valor_original:             Math.round(valorOriginal * 100) / 100,
        percentual_multa:           multaPerc,
        percentual_juros:           jurosPerc,
        quantidade_parcelas:        1,
        valor_total_corrigido:      valorTotal,
        valor_parcela:              valorTotal,
        data_vencimento_negociacao: dVenc.toISOString().split('T')[0],
        status_negociacao:          'ATIVA',
        responsavel_id:             session.user.id,
        snapshot_regras:            { ...REGRAS_PARCELAMENTO['FRANCHISING'], origem: 'NOTIFICACAO', data_aplicacao: new Date().toISOString() },
        versao:                     (anterior?.versao ?? 0) + 1,
        negociacao_anterior_id:     anterior?.id ?? null,
        titulos_negociados:         params.titulos.map(t => ({
          solutto_id:       t.solutto_id,
          numero_documento: t.numero_documento,
          valor_original:   t.valor_original,
          valor_saldo:      t.valor_saldo_original,
          dias_atraso:      t.dias_atraso_original,
          data_vencimento:  t.vencimento_original,
        })),
      }).select().single()

      if (neg) {
        await supabase.from('inadimplencia_negociacoes_parcelas').insert({
          negociacao_id:   neg.id,
          numero_parcela:  1,
          valor_parcela:   valorTotal,
          data_vencimento: dVenc.toISOString().split('T')[0],
          status:          'PENDENTE',
          data_pagamento:  null,
        })
        await registrarEventoTimeline({
          empresaId:      params.empresaId,
          clienteId:      params.clienteId,
          tipoEvento:     'NEGOCIACAO_CRIADA',
          titulo:         'Negociação gerada via Notificação',
          descricao:      `Total: R$ ${valorTotal.toFixed(2)} — ${params.titulos.length} título(s)`,
          dados:          { negociacao_id: neg.id, notificacao_id: notif.id },
          usuarioId:      session.user.id,
          usuarioNome,
          referenciaId:   String(neg.id),
          referenciaTipo: 'negociacao',
          icone:          'file-check',
          cor:            'green',
        })
      }
    } catch { /* best-effort — não falha a notificação */ }
  }

  return notif as Notificacao
}

// ── Atualizar negociação existente ───────────────────────────────────────────

export async function atualizarNegociacao(
  id: number,
  updates: {
    empresa_responsavel?: EmpresaResponsavel
    percentual_multa?: number
    percentual_juros?: number
    quantidade_parcelas?: number
    valor_total_corrigido?: number
    valor_parcela?: number
    data_vencimento_negociacao?: string
    observacoes_financeiras?: string | null
    status_negociacao?: Negociacao['status_negociacao']
  },
): Promise<void> {
  const { error } = await supabase
    .from('inadimplencia_negociacoes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ── Atualizar notificação existente ──────────────────────────────────────────

export async function deletarNotificacao(id: number): Promise<void> {
  // Títulos são deletados automaticamente pelo ON DELETE CASCADE
  const { error } = await supabase
    .from('inadimplencia_notificacoes')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function atualizarNotificacao(
  id: number,
  updates: Partial<Pick<Notificacao, 'canais_enviados' | 'observacoes' | 'status'>>,
): Promise<void> {
  const { error } = await supabase
    .from('inadimplencia_notificacoes')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

// ── Listar notificações de cobrança ───────────────────────────────────────────

export async function listarNotificacoes(empresaId: number): Promise<Notificacao[]> {
  const { data, error } = await supabase
    .from('inadimplencia_notificacoes')
    .select('*, titulos:inadimplencia_notificacoes_titulos(*)')
    .eq('empresa_id', empresaId)
    .order('data_notificacao', { ascending: false })
    .limit(300)

  // Tabela ainda não criada (SQL pendente) → retorna lista vazia sem quebrar
  if (error) return []
  return (data ?? []) as Notificacao[]
}

// ── Upload de anexos para interações ─────────────────────────────────────────

export async function uploadAnexoInteracao(
  file: File,
  empresaId: number,
  clienteId: number,
): Promise<AnexoInteracao> {
  const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const rand = Math.random().toString(36).slice(2, 8)
  const path = `${empresaId}/${clienteId}/${Date.now()}-${rand}.${ext}`

  const { error } = await supabase.storage
    .from('inadimplencia-anexos')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw new Error(`Upload falhou: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from('inadimplencia-anexos')
    .getPublicUrl(path)

  return { nome: file.name, url: publicUrl, tipo: file.type, tamanho: file.size }
}

// ── Helpers internos ──────────────────────────────────────────────────────────

function canalLabel(canal: Canal): string {
  const m: Record<Canal, string> = {
    WHATSAPP: 'WhatsApp', EMAIL: 'E-mail', LIGACAO: 'Ligação',
    REUNIAO: 'Reunião', JURIDICO: 'Jurídico', OBSERVACAO: 'Observação',
  }
  return m[canal] ?? canal
}

function canalIcone(canal: Canal): string {
  const m: Record<Canal, string> = {
    WHATSAPP: 'message-circle', EMAIL: 'mail', LIGACAO: 'phone',
    REUNIAO: 'users', JURIDICO: 'briefcase', OBSERVACAO: 'file-text',
  }
  return m[canal] ?? 'circle'
}
