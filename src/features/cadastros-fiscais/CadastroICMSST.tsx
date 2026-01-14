import { useEffect, useState } from 'react'
import { icmsStService } from './services'
import type { ICMSST, ICMSSTFormData } from './types'
import { Toast } from '../../shared/components/Toast'

export default function CadastroICMSST() {
  const [itens, setItens] = useState<ICMSST[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editing, setEditing] = useState<ICMSST | null>(null)
  const [filtro, setFiltro] = useState('')
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null)

  const [form, setForm] = useState<ICMSSTFormData>({
    uf_origem: 'SP',
    uf_destino: 'RJ',
    ncm: undefined,
    cest: undefined,
    mva: 0,
    aliquota_interna: 0,
    aliquota_fcp: 0,
    modalidade_bc_st: undefined,
    reducao_bc_st: 0,
    observacoes: undefined,
    ativo: true
  })

  useEffect(() => { carregarItens() }, [])

  async function carregarItens() {
    setCarregando(true)
    try {
      const dados = await icmsStService.listar({ busca: filtro })
      setItens(dados)
    } catch (error) {
      setToast({ tipo: 'error', mensagem: 'Erro ao carregar ICMS-ST' })
    } finally {
      setCarregando(false)
    }
  }

  function abrirCriar() {
    setEditing(null)
    setForm({ uf_origem: 'SP', uf_destino: 'RJ', mva: 0, aliquota_interna: 0, aliquota_fcp: 0, reducao_bc_st: 0, ativo: true })
    setModalAberto(true)
  }

  function abrirEdicao(item: ICMSST) {
    setEditing(item)
    setForm({ ...item })
    setModalAberto(true)
  }

  async function salvar() {
    try {
      if (editing) {
        const res = await icmsStService.atualizar(editing.id, form)
        if (!res.sucesso) throw new Error(res.mensagem)
        setToast({ tipo: 'success', mensagem: res.mensagem })
      } else {
        const res = await icmsStService.criar(form)
        if (!res.sucesso) throw new Error(res.mensagem)
        setToast({ tipo: 'success', mensagem: res.mensagem })
      }
      setModalAberto(false)
      carregarItens()
    } catch (error: any) {
      setToast({ tipo: 'error', mensagem: error.message || 'Erro ao salvar' })
    }
  }

  async function excluir(id: number) {
    if (!confirm('Confirma exclusão?')) return
    try {
      const res = await icmsStService.deletar(id)
      if (!res.sucesso) throw new Error(res.mensagem)
      setToast({ tipo: 'success', mensagem: res.mensagem })
      carregarItens()
    } catch (error: any) {
      setToast({ tipo: 'error', mensagem: error.message || 'Erro ao excluir' })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">ICMS-ST por UF</h2>
          <p className="text-slate-600 text-sm">MVA e alíquotas por par UF origem/destino e NCM/CEST.</p>
        </div>
        <div className="flex gap-2">
          <input placeholder="Buscar UF ou NCM" value={filtro} onChange={(e) => setFiltro(e.target.value)} className="px-3 py-2 border rounded" />
          <button onClick={carregarItens} className="px-3 py-2 bg-slate-200 rounded">Pesquisar</button>
          <button onClick={abrirCriar} className="px-3 py-2 bg-blue-600 text-white rounded">Novo</button>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        {carregando ? (
          <div className="p-8 text-center">Carregando...</div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-4 py-2 text-left">Origem</th>
                <th className="px-4 py-2 text-left">Destino</th>
                <th className="px-4 py-2 text-left">NCM</th>
                <th className="px-4 py-2 text-left">MVA (%)</th>
                <th className="px-4 py-2 text-left">Alíquota (%)</th>
                <th className="px-4 py-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {itens.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">{it.uf_origem}</td>
                  <td className="px-4 py-3 text-sm">{it.uf_destino}</td>
                  <td className="px-4 py-3 text-sm">{it.ncm || '-'}</td>
                  <td className="px-4 py-3 text-sm">{it.mva ?? 0}</td>
                  <td className="px-4 py-3 text-sm">{it.aliquota_interna ?? 0}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button onClick={() => abrirEdicao(it)} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Editar</button>
                      <button onClick={() => excluir(it.id)} className="px-2 py-1 bg-red-100 text-red-800 rounded">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded shadow p-6">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Editar ICMS-ST' : 'Novo ICMS-ST'}</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-slate-700 mb-1">UF Origem</label>
                <input value={form.uf_origem} onChange={(e) => setForm({ ...form, uf_origem: e.target.value.toUpperCase() })} className="w-full px-2 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">UF Destino</label>
                <input value={form.uf_destino} onChange={(e) => setForm({ ...form, uf_destino: e.target.value.toUpperCase() })} className="w-full px-2 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">NCM (opcional)</label>
                <input value={form.ncm || ''} onChange={(e) => setForm({ ...form, ncm: e.target.value })} className="w-full px-2 py-2 border rounded" />
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1">MVA (%)</label>
                <input type="number" step="0.01" value={form.mva as any} onChange={(e) => setForm({ ...form, mva: parseFloat(e.target.value || '0') })} className="w-full px-2 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Alíquota Interna (%)</label>
                <input type="number" step="0.01" value={form.aliquota_interna as any} onChange={(e) => setForm({ ...form, aliquota_interna: parseFloat(e.target.value || '0') })} className="w-full px-2 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Alíquota FCP (%)</label>
                <input type="number" step="0.01" value={form.aliquota_fcp as any} onChange={(e) => setForm({ ...form, aliquota_fcp: parseFloat(e.target.value || '0') })} className="w-full px-2 py-2 border rounded" />
              </div>

              <div className="col-span-3">
                <label className="block text-sm text-slate-700 mb-1">Observações</label>
                <input value={form.observacoes || ''} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} className="w-full px-2 py-2 border rounded" />
              </div>

              <div className="col-span-3 flex justify-end gap-2 mt-4">
                <button onClick={() => setModalAberto(false)} className="px-3 py-2 bg-slate-200 rounded">Cancelar</button>
                <button onClick={salvar} className="px-3 py-2 bg-blue-600 text-white rounded">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.tipo} message={toast.mensagem} onClose={() => setToast(null)} />}
    </div>
  )
}
