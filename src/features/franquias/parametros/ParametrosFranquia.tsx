// =====================================================
// PÁGINA: Parâmetros Franquia
// Rota: /franquias/parametros
// Permite criar/editar/excluir parâmetros configuráveis
// do módulo de franquias: status, etapa, modalidade,
// tipo de contrato.
// =====================================================

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, X, Save, Settings2 } from 'lucide-react'
import { Toast } from '../../../shared/components/Toast'
import { useParametros } from './useParametros'
import {
  TIPO_PARAMETRO_LABELS, INITIAL_FORM_PARAMETRO,
  type TipoParametro, type ParametroFranquia, type FormParametro,
} from './types'

// ── Constantes ─────────────────────────────────────────────────────────────
const TIPOS: TipoParametro[] = ['status', 'etapa', 'modalidade', 'tipo_contrato']

const COR_PRESETS = [
  '#4ade80', '#facc15', '#f87171', '#60a5fa', '#c084fc',
  '#fb923c', '#34d399', '#94a3b8', '#f472b6', '#a3e635',
]

// ── Estilos locais ──────────────────────────────────────────────────────────
const inputCls =
  'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#394353] focus:border-transparent'
const selectCls = inputCls

// ── Componente principal ────────────────────────────────────────────────────
export const ParametrosFranquia: React.FC = () => {
  const {
    parametros, loading, error, saving,
    fetchParametros, createParametro, updateParametro, deleteParametro,
  } = useParametros()

  // ── Estado do modal de add/edit ──────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormParametro>(INITIAL_FORM_PARAMETRO)

  // ── Toast ────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Confirmação de exclusão ──────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState<ParametroFranquia | null>(null)

  // ── Handlers ────────────────────────────────────────────────────────────
  const openAdd = (tipo: TipoParametro) => {
    setEditId(null)
    setForm({ ...INITIAL_FORM_PARAMETRO, tipo })
    setModalOpen(true)
  }

  const openEdit = (p: ParametroFranquia) => {
    setEditId(p.id)
    setForm({
      tipo: p.tipo,
      label: p.label,
      cor: p.cor ?? '',
      ordem: String(p.ordem),
      ativo: p.ativo,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSave = async () => {
    if (!form.label.trim()) {
      showToast('Informe o nome do parâmetro.', 'error')
      return
    }
    const ok = editId
      ? await updateParametro(editId, form)
      : await createParametro(form)

    if (ok) {
      showToast(editId ? 'Parâmetro atualizado.' : 'Parâmetro criado.')
      closeModal()
    } else {
      showToast('Erro ao salvar parâmetro.', 'error')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    const ok = await deleteParametro(confirmDelete.id)
    if (ok) {
      showToast('Parâmetro excluído.')
    } else {
      showToast('Erro ao excluir parâmetro.', 'error')
    }
    setConfirmDelete(null)
  }

  // ── Parâmetros por tipo ─────────────────────────────────────────────────
  const byTipo = (tipo: TipoParametro): ParametroFranquia[] =>
    parametros.filter(p => p.tipo === tipo).sort((a, b) => a.ordem - b.ordem || a.label.localeCompare(b.label))

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Cabeçalho ── */}
      <div className="bg-white rounded-lg shadow mb-4 p-4">
        <div className="flex items-center gap-3">
          <Link
            to="/franquias/unidades"
            className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-gray-400" />
            <div>
              <h1 className="text-base font-semibold text-gray-900">Parâmetros Franquia</h1>
              <p className="text-xs text-gray-500">
                Gerencie os valores configuráveis usados no cadastro de unidades
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Conteúdo ── */}
      {loading ? (
        <div className="flex justify-center items-center py-16 text-sm text-gray-400">
          Carregando parâmetros...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error} —{' '}
          <button onClick={fetchParametros} className="underline">tentar novamente</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TIPOS.map(tipo => {
            const itens = byTipo(tipo)
            return (
              <div key={tipo} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Card header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ backgroundColor: '#394353' }}
                >
                  <span className="text-sm font-semibold text-white">
                    {TIPO_PARAMETRO_LABELS[tipo]}
                  </span>
                  <button
                    onClick={() => openAdd(tipo)}
                    className="flex items-center gap-1 text-xs text-white hover:opacity-80 transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Novo
                  </button>
                </div>

                {/* Tabela */}
                {itens.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-gray-400">
                    Nenhum parâmetro cadastrado ainda. Clique em "Novo" para adicionar.
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-4 py-2 text-gray-500 font-medium">Nome</th>
                        <th className="text-center px-2 py-2 text-gray-500 font-medium">Cor</th>
                        <th className="text-center px-2 py-2 text-gray-500 font-medium">Ordem</th>
                        <th className="text-center px-2 py-2 text-gray-500 font-medium">Status</th>
                        <th className="px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map(p => (
                        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-800 font-medium">{p.label}</td>
                          <td className="px-2 py-2 text-center">
                            {p.cor ? (
                              <span
                                className="inline-block w-5 h-5 rounded-full border border-gray-200"
                                style={{ backgroundColor: p.cor }}
                                title={p.cor}
                              />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center text-gray-500">{p.ordem}</td>
                          <td className="px-2 py-2 text-center">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                p.ativo
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {p.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEdit(p)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDelete(p)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal Adicionar / Editar ───────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Cabeçalho modal */}
            <div
              className="flex items-center justify-between px-5 py-3 rounded-t-lg"
              style={{ backgroundColor: '#394353' }}
            >
              <h2 className="text-sm font-semibold text-white">
                {editId ? 'Editar Parâmetro' : 'Novo Parâmetro'}
                {' — '}
                {TIPO_PARAMETRO_LABELS[form.tipo]}
              </h2>
              <button onClick={closeModal} className="text-white hover:opacity-70 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corpo modal */}
            <div className="p-5 space-y-4">
              {/* Tipo do parâmetro (readonly ao editar) */}
              {!editId && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="tipo"
                    value={form.tipo}
                    onChange={handleChange}
                    className={selectCls}
                    style={{ borderColor: '#C9C4B5' }}
                  >
                    {TIPOS.map(t => (
                      <option key={t} value={t}>{TIPO_PARAMETRO_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  name="label"
                  value={form.label}
                  onChange={handleChange}
                  placeholder="Ex: Ativa, Em implantação, Franquia Master..."
                  className={inputCls}
                  style={{ borderColor: '#C9C4B5' }}
                  maxLength={200}
                  autoFocus
                />
              </div>

              {/* Cor */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cor (opcional)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COR_PRESETS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, cor: c }))}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        form.cor === c ? 'border-gray-700 scale-110' : 'border-transparent hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                  {form.cor && (
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, cor: '' }))}
                      className="text-xs text-gray-400 hover:text-red-500 ml-1"
                      title="Remover cor"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  name="cor"
                  value={form.cor}
                  onChange={handleChange}
                  placeholder="#394353"
                  className={`${inputCls} mt-2`}
                  style={{ borderColor: '#C9C4B5' }}
                  maxLength={7}
                />
              </div>

              {/* Ordem + Ativo */}
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Ordem de exibição
                  </label>
                  <input
                    type="number"
                    name="ordem"
                    value={form.ordem}
                    onChange={handleChange}
                    min={0}
                    className={inputCls}
                    style={{ borderColor: '#C9C4B5' }}
                  />
                </div>
                <label className="flex items-center gap-2 pb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="ativo"
                    checked={form.ativo}
                    onChange={handleChange}
                    className="w-4 h-4 accent-[#394353]"
                  />
                  <span className="text-xs font-medium text-gray-700">Ativo</span>
                </label>
              </div>
            </div>

            {/* Rodapé modal */}
            <div className="px-5 pb-5 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-all"
                style={{ borderColor: '#C9C4B5' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ backgroundColor: '#394353' }}
                className="flex items-center gap-2 px-5 py-2 rounded-md text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Confirmação de Exclusão ─────────────────────────────────── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null) }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Excluir parâmetro?</h3>
            <p className="text-sm text-gray-600 mb-5">
              Tem certeza que deseja excluir{' '}
              <strong>{confirmDelete.label}</strong>?{' '}
              Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 text-sm font-semibold"
                style={{ borderColor: '#C9C4B5' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
