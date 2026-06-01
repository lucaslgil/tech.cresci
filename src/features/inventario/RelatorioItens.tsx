import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Package, Phone, DollarSign, Search,
  RefreshCw, Printer, Clock, Laptop, ArrowRight, Calendar,
  Users, TrendingUp, CheckSquare, Eye, History,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ColaboradorBasico {
  id: number
  nome: string
  setor?: string
  cargo?: string
}

interface ItemInventario {
  id: string
  codigo: string
  item: string
  modelo: string | null
  categoria: string | null
  numero_serie: string | null
  setor: string | null
  status: string | null
  valor: number | null
  responsavel_id: number | null
  colaborador: ColaboradorBasico | null
  created_at: string
}

interface LinhaFone {
  id: number
  numero_linha: string
  tipo: string
  operadora: string | null
  plano: string | null
  valor_plano: number | null
  status: string
  usuario_setor: string | null
  responsavel_id: number | null
  colaborador: ColaboradorBasico | null
  aparelho: { codigo: string; item: string; modelo: string | null } | null
  created_at: string
}

interface HistoricoUnificado {
  key: string
  tipo: 'equipamento' | 'linha'
  titulo: string
  subtitulo: string
  campo_alterado: string
  valor_anterior: string | null
  valor_novo: string | null
  data_alteracao: string
  usuario_nome?: string | null
  item_id?: string   // UUID do item; presente apenas para tipo 'equipamento'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const R$ = (v: number | null | undefined) =>
  v == null
    ? '-'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const dtBR = (s: string) =>
  new Date(s).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const fone = (p: string) => {
  const d = p.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return p
}

const mesLabel = (mesRef: string) => {
  if (!mesRef) return ''
  const [y, m] = mesRef.split('-')
  return new Date(+y, +m - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
}

const esc = (s: string | null | undefined) =>
  (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const STATUS_CLS: Record<string, string> = {
  'Ativo':         'bg-green-100 text-green-800',
  'Ativa':         'bg-green-100 text-green-800',
  'Inativo':       'bg-gray-100 text-gray-600',
  'Inativa':       'bg-gray-100 text-gray-600',
  'Em manutenção': 'bg-yellow-100 text-yellow-800',
  'Em Manutenção': 'bg-yellow-100 text-yellow-800',
  'Extraviado':    'bg-red-100 text-red-800',
  'Baixado':       'bg-gray-100 text-gray-500',
  'Em estoque':    'bg-blue-100 text-blue-800',
  'Em Uso':        'bg-blue-100 text-blue-800',
  'Disponível':    'bg-purple-100 text-purple-800',
  'Descartado':    'bg-red-100 text-red-700',
}

const Badge = ({ status }: { status: string | null }) => {
  if (!status) return <span className="text-gray-400 text-xs">-</span>
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_CLS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

type TabKey = 'overview' | 'conference' | 'history'

// ─── Component ───────────────────────────────────────────────────────────────

export const RelatorioItens: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('overview')
  const [items, setItems] = useState<ItemInventario[]>([])
  const [linhas, setLinhas] = useState<LinhaFone[]>([])
  const [historico, setHistorico] = useState<HistoricoUnificado[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // ── Overview filters
  const [searchItems, setSearchItems] = useState('')
  const [fSetor, setFSetor] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [searchLinhas, setSearchLinhas] = useState('')
  const [fLinhaStatus, setFLinhaStatus] = useState('')

  // ── Conference
  const [mesRef, setMesRef] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [rSetor,        setRSetor]        = useState('')
  const [rStatus,       setRStatus]       = useState('')
  const [rResponsavel,  setRResponsavel]  = useState<'todos' | 'com' | 'sem'>('todos')
  const [rCategorias,   setRCategorias]   = useState<Set<string>>(new Set())

  // ── History filters
  const [hTipo, setHTipo] = useState<'todos' | 'equipamento' | 'linha'>('todos')
  const [hSearch, setHSearch] = useState('')
  const [hFrom, setHFrom] = useState('')
  const [hTo, setHTo] = useState('')

  // ─── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setRefreshing(true)
    try {
      const [{ data: iData }, { data: lData }, histLinhasRes, histItemsRes] = await Promise.all([
        // Items
        supabase
          .from('itens')
          .select('id, codigo, item, modelo, categoria, numero_serie, setor, status, valor, responsavel_id, created_at, colaborador:responsavel_id(id, nome, setor, cargo)')
          .order('setor', { ascending: true })
          .order('item', { ascending: true }),

        // Linhas
        supabase
          .from('linhas_telefonicas')
          .select('id, numero_linha, tipo, operadora, plano, valor_plano, status, usuario_setor, responsavel_id, created_at, colaborador:responsavel_id(id, nome), aparelho:aparelho_id(codigo, item, modelo)')
          .order('status', { ascending: false })
          .order('numero_linha', { ascending: true }),

        // Histórico de linhas
        supabase
          .from('historico_linhas_telefonicas')
          .select('id, campo_alterado, valor_anterior, valor_novo, data_alteracao, usuario_id, linha:linha_id(id, numero_linha, operadora)')
          .order('data_alteracao', { ascending: false })
          .limit(500),

        // Histórico de itens (pode não existir ainda)
        supabase
          .from('historico_itens')
          .select('id, item_id, campo_alterado, valor_anterior, valor_novo, data_alteracao, usuario_id, item:item_id(id, codigo, item, modelo)')
          .order('data_alteracao', { ascending: true })   // ASC para facilitar snapshot por mês
          .limit(5000),
      ])

      setItems((iData as unknown as ItemInventario[]) ?? [])
      setLinhas((lData as unknown as LinhaFone[]) ?? [])

      // Resolve nomes dos usuários responsáveis pelas alterações
      const allHistRows = [...(histItemsRes.data ?? []), ...(histLinhasRes.data ?? [])]
      const uniqueUserIds = [...new Set(allHistRows.map((h: any) => h.usuario_id).filter(Boolean))]
      let nomeMap: Record<string, string> = {}
      if (uniqueUserIds.length > 0) {
        const { data: usuariosData } = await supabase
          .from('usuarios')
          .select('id, nome')
          .in('id', uniqueUserIds)
        ;(usuariosData ?? []).forEach((u: any) => { nomeMap[u.id] = u.nome })
      }

      const combinado: HistoricoUnificado[] = []

      ;(histItemsRes.data ?? []).forEach((h: any) => {
        combinado.push({
          key: `item-${h.id}`,
          tipo: 'equipamento',
          titulo: h.item ? `${h.item.item ?? ''}${h.item.modelo ? ` ${h.item.modelo}` : ''}` : '(equipamento removido)',
          subtitulo: h.item?.codigo ?? '',
          campo_alterado: h.campo_alterado,
          valor_anterior: h.valor_anterior,
          valor_novo: h.valor_novo,
          data_alteracao: h.data_alteracao,
          usuario_nome: h.usuario_id ? (nomeMap[h.usuario_id] ?? null) : null,
          item_id: h.item_id ?? undefined,
        })
      })

      ;(histLinhasRes.data ?? []).forEach((h: any) => {
        if (h.campo_alterado !== 'responsavel') return
        combinado.push({
          key: `linha-${h.id}`,
          tipo: 'linha',
          titulo: h.linha ? fone(h.linha.numero_linha ?? '') : '(linha removida)',
          subtitulo: h.linha?.operadora ?? '',
          campo_alterado: h.campo_alterado,
          valor_anterior: h.valor_anterior,
          valor_novo: h.valor_novo,
          data_alteracao: h.data_alteracao,
          usuario_nome: h.usuario_id ? (nomeMap[h.usuario_id] ?? null) : null,
        })
      })

      combinado.sort((a, b) => new Date(b.data_alteracao).getTime() - new Date(a.data_alteracao).getTime())
      setHistorico(combinado)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ─── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    totalItems: items.length,
    itemsComResp: items.filter(i => i.colaborador).length,
    itemsSemResp: items.filter(i => !i.colaborador).length,
    valorTotal: items.reduce((s, i) => s + (i.valor ?? 0), 0),
    totalLinhas: linhas.length,
    linhasAtivas: linhas.filter(l => l.status === 'Ativa').length,
    linhasInativas: linhas.filter(l => l.status === 'Inativa').length,
    custoMensal: linhas.reduce((s, l) => s + (l.valor_plano ?? 0), 0),
  }), [items, linhas])

  // ─── Filtered data ─────────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    const q = searchItems.toLowerCase()
    return items.filter(i => {
      const matchQ = !q
        || (i.item ?? '').toLowerCase().includes(q)
        || (i.codigo ?? '').toLowerCase().includes(q)
        || (i.modelo ?? '').toLowerCase().includes(q)
        || (i.colaborador?.nome ?? '').toLowerCase().includes(q)
        || (i.numero_serie ?? '').toLowerCase().includes(q)
      const matchSetor = !fSetor || i.setor === fSetor
      const matchStatus = !fStatus || i.status === fStatus
      return matchQ && matchSetor && matchStatus
    })
  }, [items, searchItems, fSetor, fStatus])

  const filteredLinhas = useMemo(() => {
    const q = searchLinhas.toLowerCase()
    return linhas.filter(l => {
      const matchQ = !q
        || l.numero_linha.toLowerCase().includes(q)
        || (l.operadora ?? '').toLowerCase().includes(q)
        || (l.colaborador?.nome ?? '').toLowerCase().includes(q)
        || (l.usuario_setor ?? '').toLowerCase().includes(q)
        || (l.aparelho?.codigo ?? '').toLowerCase().includes(q)
      const matchStatus = !fLinhaStatus || l.status === fLinhaStatus
      return matchQ && matchStatus
    })
  }, [linhas, searchLinhas, fLinhaStatus])

  const filteredHistorico = useMemo(() => {
    const q = hSearch.toLowerCase()
    return historico.filter(h => {
      const matchTipo = hTipo === 'todos' || h.tipo === hTipo
      const matchQ = !q
        || h.titulo.toLowerCase().includes(q)
        || h.subtitulo.toLowerCase().includes(q)
        || (h.valor_anterior ?? '').toLowerCase().includes(q)
        || (h.valor_novo ?? '').toLowerCase().includes(q)
      const matchFrom = !hFrom || h.data_alteracao >= hFrom
      const matchTo = !hTo || h.data_alteracao <= hTo + 'T23:59:59'
      return matchTipo && matchQ && matchFrom && matchTo
    })
  }, [historico, hTipo, hSearch, hFrom, hTo])

  const setores = useMemo(
    () => [...new Set(items.map(i => i.setor).filter(Boolean))].sort() as string[],
    [items],
  )

  const statusItens = useMemo(
    () => [...new Set(items.map(i => i.status).filter(Boolean))].sort() as string[],
    [items],
  )

  const categorias = useMemo(
    () => [...new Set(items.map(i => i.categoria).filter(Boolean))].sort() as string[],
    [items],
  )

  const toggleCategoria = (cat: string) =>
    setRCategorias(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })

  // ─── Snapshot histórico por item ───────────────────────────────────────────
  // Mapa: item_id → lista de alterações ordenadas por data ASC
  const itemHistMap = useMemo(() => {
    const map: Record<string, HistoricoUnificado[]> = {}
    historico.forEach(h => {
      if (h.tipo !== 'equipamento' || !h.item_id) return
      if (!map[h.item_id]) map[h.item_id] = []
      map[h.item_id].push(h)
    })
    // Garante ordem ASC dentro de cada item
    Object.values(map).forEach(arr =>
      arr.sort((a, b) => new Date(a.data_alteracao).getTime() - new Date(b.data_alteracao).getTime())
    )
    return map
  }, [historico])

  // Retorna o nome do responsável que o item tinha no fim do mês de referência
  const responsavelEmMes = useCallback((item: ItemInventario, endOfMonth: Date): string | null => {
    const hist = itemHistMap[item.id] ?? []
    // Primeira alteração registrada APÓS o fim do mês
    const firstAfter = hist.find(h => new Date(h.data_alteracao) > endOfMonth)
    if (firstAfter) return firstAfter.valor_anterior   // estado ANTES dessa troca = estado no mês
    return item.colaborador?.nome ?? null              // sem trocas depois = estado atual já era o estado no mês
  }, [itemHistMap])

  // Data final do mês de referência (23:59:59 do último dia)
  const mesRefEndOfMonth = useMemo(() => {
    const [y, m] = mesRef.split('-').map(Number)
    return new Date(y, m, 0, 23, 59, 59)   // new Date(y, m, 0) = último dia do mês anterior ao mês m+1 = último dia do mês m
  }, [mesRef])

  // ─── Items filtrados para o relatório (conferência) ───────────────────────

  const itemsRelatorio = useMemo(() => items.filter(i => {
    if (rSetor && i.setor !== rSetor) return false
    if (rStatus && i.status !== rStatus) return false
    const respNome = responsavelEmMes(i, mesRefEndOfMonth)
    if (rResponsavel === 'com' && !respNome) return false
    if (rResponsavel === 'sem' && respNome) return false
    if (rCategorias.size > 0 && !rCategorias.has(i.categoria ?? '')) return false
    return true
  }), [items, rSetor, rStatus, rResponsavel, rCategorias, responsavelEmMes, mesRefEndOfMonth])

  const itemsPorSetor = useMemo(() => {
    const sorted = [...itemsRelatorio].sort((a, b) => {
      const sa = a.setor ?? 'Sem Setor'
      const sb = b.setor ?? 'Sem Setor'
      if (sa !== sb) return sa.localeCompare(sb)
      return (a.codigo ?? '').localeCompare(b.codigo ?? '')
    })
    const grupos: Record<string, ItemInventario[]> = {}
    sorted.forEach(i => {
      const s = i.setor ?? 'Sem Setor'
      if (!grupos[s]) grupos[s] = []
      grupos[s].push(i)
    })
    return grupos
  }, [itemsRelatorio])

  // ─── Print ─────────────────────────────────────────────────────────────────

  const handlePrint = () => {
    const hoje = new Date().toLocaleDateString('pt-BR')
    const periodo = mesLabel(mesRef)

    const comResp  = itemsRelatorio.filter(i => !!responsavelEmMes(i, mesRefEndOfMonth)).length
    const semResp  = itemsRelatorio.filter(i => !responsavelEmMes(i, mesRefEndOfMonth)).length
    const valorTot = itemsRelatorio.reduce((s, i) => s + (i.valor ?? 0), 0)

    const filtrosAtivos = [
      rSetor       ? `Setor: ${rSetor}` : '',
      rStatus      ? `Status: ${rStatus}` : '',
      rResponsavel === 'com' ? 'Somente com responsável' : rResponsavel === 'sem' ? 'Somente sem responsável' : '',
      rCategorias.size > 0 ? `Categorias: ${[...rCategorias].join(', ')}` : '',
    ].filter(Boolean).join(' · ')

    let rowNum = 0
    const itemRows = Object.entries(itemsPorSetor).map(([setor, sitems]) => `
      <tr style="background:#e8e8e8">
        <td colspan="9" style="padding:3px 6px;font-weight:700;font-size:9px">
          ▸ ${esc(setor)} &nbsp;(${sitems.length} item${sitems.length !== 1 ? 's' : ''})
        </td>
      </tr>
      ${sitems.map(i => {
        rowNum++
        const respNome = responsavelEmMes(i, mesRefEndOfMonth)
        return `<tr>
          <td>${rowNum}</td>
          <td>${esc(i.codigo)}</td>
          <td>${esc(i.item)}</td>
          <td>${esc(i.modelo)}</td>
          <td>${esc(i.numero_serie)}</td>
          <td>${respNome ? esc(respNome) : '<span style="color:#c00">Sem responsável</span>'}</td>
          <td>${esc(i.colaborador?.cargo)}</td>
          <td>${esc(i.status)}</td>
          <td style="text-align:center"><span style="display:inline-block;width:14px;height:14px;border:1px solid #000"></span></td>
        </tr>`
      }).join('')}
    `).join('')

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>Conferência de Inventário – ${periodo}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:10px;color:#000}
  @page{margin:1.5cm;size:A4 landscape}
  .header{text-align:center;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #000}
  .header h1{font-size:15px;font-weight:700}
  .header h2{font-size:12px;margin-top:4px}
  .header p{font-size:9px;margin-top:4px;color:#555}
  .filtros{font-size:8px;margin-top:3px;color:#777;font-style:italic}
  .section{margin-top:14px}
  .section-title{font-size:11px;font-weight:700;background:#ddd;padding:4px 8px;border:1px solid #aaa;margin-bottom:4px}
  table{width:100%;border-collapse:collapse}
  th{background:#ccc;font-weight:700;text-align:left;padding:4px 5px;border:1px solid #999;font-size:9px}
  td{padding:3px 5px;border:1px solid #ccc;font-size:9px;vertical-align:top}
  tr:nth-child(even){background:#f9f9f9}
  .footer{margin-top:20px;padding-top:12px;border-top:1px solid #000}
  .sig-row{display:flex;gap:30px;margin-top:16px}
  .sig{flex:1;border-bottom:1px solid #000;padding-bottom:2px}
  .sig-label{font-size:8px;color:#555;margin-top:3px}
  .totals-bar{display:flex;gap:20px;font-size:9px;color:#444;margin-bottom:8px}
  .totals-bar span{background:#f0f0f0;border:1px solid #ccc;padding:2px 6px;border-radius:3px}
</style></head><body>
<div class="header">
  <h1>CRESCI &amp; PERDI — RELATÓRIO DE CONFERÊNCIA DE INVENTÁRIO</h1>
  <h2>Período de Referência: ${periodo}</h2>
  <p>Data de impressão: ${hoje} &nbsp;|&nbsp; Total de equipamentos: ${itemsRelatorio.length}</p>
  ${filtrosAtivos ? `<p class="filtros">Filtros aplicados: ${esc(filtrosAtivos)}</p>` : ''}
</div>

<div class="section">
  <div class="section-title">EQUIPAMENTOS</div>
  <div class="totals-bar">
    <span>Total: ${itemsRelatorio.length}</span>
    <span>Com responsável: ${comResp}</span>
    <span style="color:${semResp > 0 ? '#c00' : 'inherit'}">Sem responsável: ${semResp}</span>
    <span>Valor total: ${R$(valorTot)}</span>
  </div>
  <table>
    <thead><tr>
      <th style="width:28px">#</th>
      <th style="width:75px">Código</th>
      <th style="width:135px">Equipamento</th>
      <th style="width:110px">Modelo</th>
      <th style="width:95px">N° Série</th>
      <th style="width:130px">Responsável</th>
      <th style="width:100px">Cargo</th>
      <th style="width:75px">Status</th>
      <th style="width:32px">Conf.</th>
    </tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
</div>

<div class="footer">
  <div class="sig-row">
    <div><div class="sig"></div><div class="sig-label">Nome / Assinatura do responsável pela conferência</div></div>
    <div style="max-width:180px"><div class="sig"></div><div class="sig-label">Data: ___/___/______</div></div>
    <div style="max-width:180px"><div class="sig"></div><div class="sig-label">Cargo</div></div>
  </div>
  <p style="margin-top:14px;font-size:8px;color:#888">
    Documento gerado em ${hoje} pelo sistema de gestão Cresci &amp; Perdi.
    Este relatório é sigiloso e de uso interno.
  </p>
</div>

<script>window.onload=()=>{window.print();}</script>
</body></html>`

    const w = window.open('', '_blank', 'width=1100,height=800')
    if (w) { w.document.write(html); w.document.close() }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório de Inventário</h1>
          <p className="text-sm text-gray-500 mt-1">
            Controle completo de equipamentos e linhas telefônicas
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Equipamentos */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-100 rounded-xl p-2.5">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.totalItems}</span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Equipamentos</p>
          <div className="flex gap-3 mt-2 text-xs text-gray-500">
            <span className="text-green-700">✓ {stats.itemsComResp} com resp.</span>
            {stats.itemsSemResp > 0 && (
              <span className="text-amber-700">⚠ {stats.itemsSemResp} sem resp.</span>
            )}
          </div>
        </div>

        {/* Linhas */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-100 rounded-xl p-2.5">
              <Phone className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.totalLinhas}</span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Linhas Telefônicas</p>
          <div className="flex gap-3 mt-2 text-xs text-gray-500">
            <span className="text-green-700">● {stats.linhasAtivas} ativas</span>
            <span className="text-gray-500">● {stats.linhasInativas} inativas</span>
          </div>
        </div>

        {/* Valor inventário */}
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-100 rounded-xl p-2.5">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-xl font-bold text-gray-900">{R$(stats.valorTotal)}</span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor do Inventário</p>
          <p className="text-xs text-gray-400 mt-2">Soma dos equipamentos cadastrados</p>
        </div>

        {/* Custo mensal linhas */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-orange-100 rounded-xl p-2.5">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
            <span className="text-xl font-bold text-gray-900">{R$(stats.custoMensal)}</span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Custo Mensal</p>
          <p className="text-xs text-gray-400 mt-2">Soma dos planos de telefonia</p>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-100">
          {([
            { key: 'overview',    label: 'Visão Geral',         icon: Eye },
            { key: 'conference',  label: 'Conferência Mensal',   icon: CheckSquare },
            { key: 'history',     label: 'Histórico de Vinculações', icon: History },
          ] as { key: TabKey; label: string; icon: React.ElementType }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-slate-700 text-slate-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════
            TAB 1 – VISÃO GERAL
            ════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div className="p-5 space-y-8">

            {/* Equipamentos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <Laptop className="h-5 w-5 text-blue-500" />
                  Equipamentos
                  <span className="text-xs text-gray-400 font-normal">({filteredItems.length} de {items.length})</span>
                </h2>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={searchItems}
                    onChange={e => setSearchItems(e.target.value)}
                    placeholder="Buscar equipamento..."
                    className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
                <select
                  value={fSetor}
                  onChange={e => setFSetor(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">Todos os setores</option>
                  {setores.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={fStatus}
                  onChange={e => setFStatus(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">Todos os status</option>
                  {statusItens.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {(searchItems || fSetor || fStatus) && (
                  <button
                    onClick={() => { setSearchItems(''); setFSetor(''); setFStatus('') }}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {filteredItems.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">Nenhum equipamento encontrado</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Código', 'Equipamento / Modelo', 'Setor', 'Responsável', 'Status', 'Valor'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredItems.map((i, idx) => (
                        <tr key={i.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{i.codigo}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{i.item}</div>
                            {i.modelo && <div className="text-xs text-gray-400">{i.modelo}</div>}
                            {i.numero_serie && <div className="text-xs text-gray-400">S/N: {i.numero_serie}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{i.setor ?? '-'}</span>
                          </td>
                          <td className="px-4 py-3">
                            {i.colaborador ? (
                              <div>
                                <div className="font-medium text-gray-800">{i.colaborador.nome}</div>
                                {i.colaborador.cargo && <div className="text-xs text-gray-400">{i.colaborador.cargo}</div>}
                              </div>
                            ) : (
                              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Sem responsável
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3"><Badge status={i.status} /></td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{R$(i.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Linhas Telefônicas */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-purple-500" />
                  Linhas Telefônicas
                  <span className="text-xs text-gray-400 font-normal">({filteredLinhas.length} de {linhas.length})</span>
                </h2>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={searchLinhas}
                    onChange={e => setSearchLinhas(e.target.value)}
                    placeholder="Buscar linha..."
                    className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
                <select
                  value={fLinhaStatus}
                  onChange={e => setFLinhaStatus(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">Todos os status</option>
                  <option value="Ativa">Ativa</option>
                  <option value="Inativa">Inativa</option>
                </select>
                {(searchLinhas || fLinhaStatus) && (
                  <button
                    onClick={() => { setSearchLinhas(''); setFLinhaStatus('') }}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {filteredLinhas.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">Nenhuma linha encontrada</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Número', 'Tipo / Operadora', 'Plano', 'Responsável', 'Usuário / Setor', 'Aparelho', 'Status', 'Custo'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredLinhas.map((l, idx) => (
                        <tr key={l.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                          <td className="px-4 py-3 font-mono font-medium">{fone(l.numero_linha)}</td>
                          <td className="px-4 py-3">
                            <div className="text-xs font-medium">{l.tipo}</div>
                            <div className="text-xs text-gray-400">{l.operadora ?? '-'}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-700">{l.plano ?? '-'}</td>
                          <td className="px-4 py-3">
                            {l.colaborador ? (
                              <span className="font-medium text-gray-800">{l.colaborador.nome}</span>
                            ) : (
                              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Sem responsável
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">{l.usuario_setor ?? '-'}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {l.aparelho ? `${l.aparelho.codigo} – ${l.aparelho.item}` : '-'}
                          </td>
                          <td className="px-4 py-3"><Badge status={l.status} /></td>
                          <td className="px-4 py-3 font-semibold">{R$(l.valor_plano)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB 2 – CONFERÊNCIA MENSAL
            ════════════════════════════════════════ */}
        {tab === 'conference' && (
          <div className="p-5">
            {/* Controls row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <label className="text-xs text-gray-500 font-medium">Mês de referência</label>
                  <input
                    type="month"
                    value={mesRef}
                    onChange={e => setMesRef(e.target.value)}
                    className="block text-sm border border-gray-200 rounded-lg px-3 py-1.5 mt-0.5 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
                {mesRef && (
                  <div className="text-base font-semibold text-gray-700 capitalize mt-4">
                    {mesLabel(mesRef)}
                  </div>
                )}
              </div>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-700 hover:bg-slate-800 rounded-xl shadow"
              >
                <Printer className="h-4 w-4" />
                Imprimir Relatório
              </button>
            </div>

            {/* Filter panel */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtros do Relatório</p>
                <div className="flex items-center gap-3">
                  {(rSetor || rStatus || rResponsavel !== 'todos' || rCategorias.size > 0) && (
                    <button
                      onClick={() => { setRSetor(''); setRStatus(''); setRResponsavel('todos'); setRCategorias(new Set()) }}
                      className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg"
                    >
                      Limpar filtros
                    </button>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Serão impressos:</span>
                    <span className="font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                      {itemsRelatorio.length} equipamento{itemsRelatorio.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dropdowns row */}
              <div className="flex flex-wrap gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Setor</label>
                  <select
                    value={rSetor}
                    onChange={e => setRSetor(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400 min-w-[180px]"
                  >
                    <option value="">Todos os setores</option>
                    {setores.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Status</label>
                  <select
                    value={rStatus}
                    onChange={e => setRStatus(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="">Todos os status</option>
                    {statusItens.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Responsável</label>
                  <select
                    value={rResponsavel}
                    onChange={e => setRResponsavel(e.target.value as 'todos' | 'com' | 'sem')}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="todos">Todos</option>
                    <option value="com">Com responsável</option>
                    <option value="sem">Sem responsável</option>
                  </select>
                </div>
              </div>

              {/* Categorias checkboxes */}
              {categorias.length > 0 && (
                <div>
                  <label className="block text-xs text-gray-500 mb-2">
                    Categorias
                    {rCategorias.size > 0 && (
                      <span className="ml-2 text-slate-600 font-medium">({rCategorias.size} selecionada{rCategorias.size !== 1 ? 's' : ''})</span>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categorias.map(cat => {
                      const checked = rCategorias.has(cat)
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategoria(cat)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            checked
                              ? 'bg-slate-700 text-white border-slate-700'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-slate-400 hover:text-slate-700'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                            checked ? 'bg-white border-white' : 'border-gray-400'
                          }`}>
                            {checked && (
                              <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1.5 5l2.5 2.5 4.5-4" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </span>
                          {cat}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="border border-dashed border-gray-300 rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-400 mb-4 text-center">
                Pré-visualização do conteúdo que será impresso
              </p>

              {/* Info bar */}
              <div className="flex flex-wrap gap-3 mb-4 text-xs">
                <span className="bg-white border border-gray-200 rounded px-3 py-1 text-gray-600">
                  <strong>{itemsRelatorio.length}</strong> equipamentos
                </span>
                <span className="bg-white border border-gray-200 rounded px-3 py-1 text-gray-600">
                  <strong>{itemsRelatorio.filter(i => !!responsavelEmMes(i, mesRefEndOfMonth)).length}</strong> com responsável
                </span>
                {itemsRelatorio.filter(i => !responsavelEmMes(i, mesRefEndOfMonth)).length > 0 && (
                  <span className="bg-amber-50 border border-amber-200 rounded px-3 py-1 text-amber-700">
                    <strong>{itemsRelatorio.filter(i => !responsavelEmMes(i, mesRefEndOfMonth)).length}</strong> sem responsável
                  </span>
                )}
              </div>

              {/* Equipamentos preview */}
              <div className="mb-5">
                <div className="text-xs font-bold bg-gray-200 px-3 py-1.5 rounded-t border border-gray-300">
                  EQUIPAMENTOS ({itemsRelatorio.length} itens)
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-b bg-white">
                  <table className="min-w-full text-xs divide-y divide-gray-100">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-2 text-left font-semibold text-gray-600">#</th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-600">Código</th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-600">Equipamento</th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-600">Setor</th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-600">Responsável</th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-600">Status</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-600">Conf.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(itemsPorSetor).flatMap(([setor, sItems]) => [
                        <tr key={`setor-${setor}`} className="bg-gray-100">
                          <td colSpan={7} className="px-3 py-1 text-xs font-bold text-gray-700">
                            ▸ {setor} ({sItems.length})
                          </td>
                        </tr>,
                        ...sItems.map((i, idx) => {
                          const respNome = responsavelEmMes(i, mesRefEndOfMonth)
                          return (
                          <tr key={i.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-2 py-1.5 text-gray-400">{idx + 1}</td>
                            <td className="px-2 py-1.5 font-mono">{i.codigo}</td>
                            <td className="px-2 py-1.5">{i.item}</td>
                            <td className="px-2 py-1.5">{i.setor ?? '-'}</td>
                            <td className="px-2 py-1.5">
                              {respNome ?? (
                                <span className="text-amber-600">Sem responsável</span>
                              )}
                            </td>
                            <td className="px-2 py-1.5"><Badge status={i.status} /></td>
                            <td className="px-2 py-1.5 text-center">
                              <span className="inline-block w-4 h-4 border border-gray-400 rounded-sm" />
                            </td>
                          </tr>
                          )
                        }),
                      ])}
                    </tbody>
                  </table>
                </div>
              </div>


              {/* Signature area preview */}
              <div className="mt-5 pt-4 border-t border-gray-300 flex gap-6 text-xs text-gray-500">
                <div className="flex-1">
                  <div className="border-b border-gray-400 h-6" />
                  <div className="mt-1">Nome / Assinatura do responsável pela conferência</div>
                </div>
                <div className="w-40">
                  <div className="border-b border-gray-400 h-6" />
                  <div className="mt-1">Data: ___/___/______</div>
                </div>
                <div className="w-40">
                  <div className="border-b border-gray-400 h-6" />
                  <div className="mt-1">Cargo</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB 3 – HISTÓRICO DE VINCULAÇÕES
            ════════════════════════════════════════ */}
        {tab === 'history' && (
          <div className="p-5">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-5">
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {([
                  { v: 'todos',       label: 'Todos' },
                  { v: 'equipamento', label: 'Equipamentos' },
                  { v: 'linha',       label: 'Linhas' },
                ] as { v: typeof hTipo; label: string }[]).map(o => (
                  <button
                    key={o.v}
                    onClick={() => setHTipo(o.v)}
                    className={`px-4 py-2 text-xs font-medium transition-colors ${
                      hTipo === o.v
                        ? 'bg-slate-700 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={hSearch}
                  onChange={e => setHSearch(e.target.value)}
                  placeholder="Buscar por colaborador ou item..."
                  className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-500">De</label>
                <input
                  type="date"
                  value={hFrom}
                  onChange={e => setHFrom(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-500">até</label>
                <input
                  type="date"
                  value={hTo}
                  onChange={e => setHTo(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {(hSearch || hFrom || hTo || hTipo !== 'todos') && (
                <button
                  onClick={() => { setHSearch(''); setHFrom(''); setHTo(''); setHTipo('todos') }}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2"
                >
                  Limpar
                </button>
              )}

              <span className="ml-auto text-xs text-gray-400 self-center">
                {filteredHistorico.length} registro{filteredHistorico.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filteredHistorico.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="mx-auto h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Nenhum histórico encontrado</p>
                {historico.length === 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    O histórico registrará automaticamente toda troca de responsável a partir de agora.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHistorico.map(h => (
                  <div key={h.key} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                      h.tipo === 'equipamento' ? 'bg-blue-50' : 'bg-purple-50'
                    }`}>
                      {h.tipo === 'equipamento'
                        ? <Laptop className="h-4 w-4 text-blue-500" />
                        : <Phone className="h-4 w-4 text-purple-500" />
                      }
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium mr-2 ${
                            h.tipo === 'equipamento'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}>
                            {h.tipo === 'equipamento' ? 'Equipamento' : 'Linha'}
                          </span>
                          <span className="font-medium text-gray-900 text-sm">{h.titulo}</span>
                          {h.subtitulo && (
                            <span className="ml-2 text-xs text-gray-400 font-mono">{h.subtitulo}</span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {dtBR(h.data_alteracao)}
                          </span>
                          {h.usuario_nome && (
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              por <span className="font-medium">{h.usuario_nome}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Change description */}
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <Users className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                        {h.valor_anterior ? (
                          <span className="text-gray-500 line-through text-xs">{h.valor_anterior}</span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">sem responsável</span>
                        )}
                        <ArrowRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        {h.valor_novo ? (
                          <span className="text-green-700 font-medium text-xs">{h.valor_novo}</span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">sem responsável</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
