// =====================================================
// MÓDULO: UNIDADES FRANQUEADAS — Listagem
// Rota: /franquias/unidades
// =====================================================

import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Edit, Trash2, X,
  Building2, AlertCircle, CheckCircle, XCircle, Clock,
  Eye, RefreshCw, Upload,
} from 'lucide-react'
import { Toast } from '../../../shared/components/Toast'
import { useUnidades } from './useUnidades'
import {
  STATUS_LABELS, STATUS_COLORS, MODELO_LABELS, ESTADOS_BR,
  type StatusUnidade, type ModeloUnidade,
} from './types'
import { ModalImportacaoUnidades } from './ModalImportacaoUnidades'

// ── Badge de status ─────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: StatusUnidade }> = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
    {STATUS_LABELS[status]}
  </span>
)

const selectCls =
  'w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white'

// ── Componente principal ────────────────────────────────────────────────────
export const ListagemUnidades: React.FC = () => {
  const navigate = useNavigate()
  const { unidades, loading, error, fetchUnidades, excluirUnidade } = useUnidades()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterModelo, setFilterModelo] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)
  const [showImport, setShowImport] = useState(false)

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Lista filtrada ────────────────────────────────────────────────────
  const filteredUnidades = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return unidades.filter(u => {
      const matchSearch =
        !term ||
        u.nome_unidade.toLowerCase().includes(term) ||
        u.codigo_unidade.toLowerCase().includes(term) ||
        u.nome_franqueado.toLowerCase().includes(term) ||
        (u.cidade || '').toLowerCase().includes(term)
      const matchStatus = !filterStatus || u.status === filterStatus
      const matchEstado = !filterEstado || u.estado === filterEstado
      const matchModelo = !filterModelo || u.modelo_unidade === filterModelo
      return matchSearch && matchStatus && matchEstado && matchModelo
    })
  }, [unidades, searchTerm, filterStatus, filterEstado, filterModelo])

  // ── Estatísticas ──────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: unidades.length,
    ativas: unidades.filter(u => u.status === 'ativa').length,
    implantacao: unidades.filter(u => u.status === 'implantacao').length,
    suspensas: unidades.filter(u => u.status === 'suspensa').length,
  }), [unidades])

  // ── Exclusão ──────────────────────────────────────────────────────────
  const handleExcluir = async (id: string) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return }
    setDeletingId(id)
    setConfirmDelete(null)
    try {
      await excluirUnidade(id)
      showToast('Unidade excluída com sucesso!')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao excluir', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showImport && (
        <ModalImportacaoUnidades
          onClose={() => setShowImport(false)}
          onComplete={() => { fetchUnidades(); showToast('Importação concluída com sucesso!') }}
        />
      )}

      {/* ── Cabeçalho ── */}
      <div className="bg-white border-b border-slate-200 rounded-t-lg px-4 py-4 mb-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-800 flex items-center gap-2 truncate">
              <Building2 className="w-5 h-5 text-slate-600 flex-shrink-0" />
              Unidades Franqueadas
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {unidades.length} unidade{unidades.length !== 1 ? 's' : ''} cadastrada{unidades.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={fetchUnidades}
              className="p-2 border border-slate-300 bg-white hover:bg-slate-50 rounded-md text-slate-600 transition"
              title="Recarregar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-semibold hover:opacity-90 transition"
              style={{ borderColor: '#394353', color: '#394353', backgroundColor: 'white' }}
            >
              <Upload className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Importar</span>
            </button>
            <button
              onClick={() => navigate('/franquias/unidades/nova')}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-md text-sm font-semibold hover:opacity-90 transition"
              style={{ backgroundColor: '#394353' }}
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Nova Unidade</span>
              <span className="sm:hidden">Nova</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Cards de resumo ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total', value: stats.total, icon: <Building2 className="w-5 h-5" />, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Ativas', value: stats.ativas, icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Implantação', value: stats.implantacao, icon: <Clock className="w-5 h-5" />, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Suspensas', value: stats.suspensas, icon: <XCircle className="w-5 h-5" />, color: 'text-red-500', bg: 'bg-red-50' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-lg p-3 border border-slate-100`}>
            <div className={`${card.color} mb-1`}>{card.icon}</div>
            <div className="text-2xl font-bold text-slate-800">{card.value}</div>
            <div className="text-xs text-slate-500">{card.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 mb-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, código, franqueado, cidade..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`${selectCls} sm:w-40`}>
            <option value="">Todos os status</option>
            {(Object.keys(STATUS_LABELS) as StatusUnidade[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className={`${selectCls} sm:w-28`}>
            <option value="">UF</option>
            {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
          <select value={filterModelo} onChange={e => setFilterModelo(e.target.value)} className={`${selectCls} sm:w-40`}>
            <option value="">Todos os modelos</option>
            {(Object.keys(MODELO_LABELS) as ModeloUnidade[]).map(m => (
              <option key={m} value={m}>{MODELO_LABELS[m]}</option>
            ))}
          </select>
          {(searchTerm || filterStatus || filterEstado || filterModelo) && (
            <button
              onClick={() => { setSearchTerm(''); setFilterStatus(''); setFilterEstado(''); setFilterModelo('') }}
              className="flex items-center gap-1 px-3 py-2 text-xs text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 transition"
            >
              <X className="w-3 h-3" /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* ── Tabela ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Carregando unidades...
          </div>
        ) : filteredUnidades.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">
              {unidades.length === 0 ? 'Nenhuma unidade cadastrada' : 'Nenhuma unidade encontrada com esses filtros'}
            </p>
            {unidades.length === 0 && (
              <button
                onClick={() => navigate('/franquias/unidades/nova')}
                className="mt-3 text-sm text-slate-600 underline hover:text-slate-800"
              >
                Cadastrar primeira unidade
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr style={{ backgroundColor: '#394353' }}>
                  {['Código', 'Nome da Unidade', 'Status', 'Franqueado', 'Cidade / UF', 'Modelo', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUnidades.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-slate-600 whitespace-nowrap">
                      {u.codigo_unidade}
                    </td>
                    <td className="px-4 py-3 min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                        {u.nome_unidade}
                      </div>
                      {u.nome_fantasia && (
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{u.nome_fantasia}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 truncate max-w-[150px] whitespace-nowrap">
                      {u.nome_franqueado}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {u.cidade && u.estado ? `${u.cidade} / ${u.estado}` : u.cidade || u.estado || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {u.modelo_unidade ? MODELO_LABELS[u.modelo_unidade] : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/franquias/unidades/${u.id}`)}
                          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/franquias/unidades/${u.id}`)}
                          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {confirmDelete === u.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleExcluir(u.id)}
                              disabled={deletingId === u.id}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
                            >
                              {deletingId === u.id ? '...' : 'Confirmar'}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleExcluir(u.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredUnidades.length > 0 && (
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
            Exibindo {filteredUnidades.length} de {unidades.length} unidade{unidades.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}

export default ListagemUnidades
