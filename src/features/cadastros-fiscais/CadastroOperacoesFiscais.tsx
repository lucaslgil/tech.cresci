import { useState, useEffect } from 'react'
import { operacoesFiscaisService } from './services'
import type { OperacaoFiscal } from './types'
import { Toast } from '../../shared/components/Toast'

export default function CadastroOperacoesFiscais() {
  const [itens, setItens] = useState<OperacaoFiscal[]>([])
  const [carregando, setCarregando] = useState(true)
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [editing, setEditing] = useState<OperacaoFiscal | null>(null)
  const [filtro, setFiltro] = useState('')

  const [form, setForm] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    cfop_dentro_estado: '',
    cfop_fora_estado: '',
    cfop_exterior: '',
    tipo_operacao: 'VENDA',
    finalidade: 'NORMAL',
    natureza_operacao: '',
    calcular_icms: true,
    calcular_ipi: true,
    calcular_pis: true,
    calcular_cofins: true,
    calcular_st: false,
    observacoes: '',
    ativo: true
  })

  useEffect(() => { carregarItens() }, [])

  const carregarItens = async () => {
    setCarregando(true)
    try {
      const dados = await operacoesFiscaisService.listar({ busca: filtro })
      setItens(dados)
    } catch (error) {
      setToast({ tipo: 'error', mensagem: 'Erro ao carregar Operações Fiscais' })
    } finally {
      setCarregando(false)
    }
  }

  const abrirCriar = () => {
    setEditing(null)
    setForm({
      codigo: '', nome: '', descricao: '', cfop_dentro_estado: '', cfop_fora_estado: '', cfop_exterior: '',
      tipo_operacao: 'VENDA', finalidade: 'NORMAL', natureza_operacao: '',
      calcular_icms: true, calcular_ipi: true, calcular_pis: true, calcular_cofins: true, calcular_st: false,
      observacoes: '', ativo: true
    })
    setModalAberto(true)
  }

  const abrirEdicao = (item: OperacaoFiscal) => {
    setEditing(item)
    setForm({ ...item } as any)
    setModalAberto(true)
  }

  const salvar = async () => {
    try {
      if (editing) {
        const res = await operacoesFiscaisService.atualizar(editing.id, form as any)
        if (!res.sucesso) throw new Error(res.mensagem)
        setToast({ tipo: 'success', mensagem: res.mensagem })
      } else {
        const res = await operacoesFiscaisService.criar(form as any)
        if (!res.sucesso) throw new Error(res.mensagem)
        setToast({ tipo: 'success', mensagem: res.mensagem })
      }
      setModalAberto(false)
      carregarItens()
    } catch (error: any) {
      setToast({ tipo: 'error', mensagem: error.message || 'Erro ao salvar' })
    }
  }

  const excluir = async (id: number) => {
    if (!confirm('Confirma exclusão dessa operação fiscal?')) return
    try {
      const res = await operacoesFiscaisService.deletar(id)
      if (!res.sucesso) throw new Error(res.mensagem)
      setToast({ tipo: 'success', mensagem: res.mensagem })
      carregarItens()
    } catch (error: any) {
      setToast({ tipo: 'error', mensagem: error.message || 'Erro ao excluir' })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Operações Fiscais</h1>
          <p className="text-slate-600 mt-1">Configure operações, CFOPs padrão e comportamento fiscal.</p>
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Buscar código ou nome"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md"
          />
          <button onClick={carregarItens} className="px-4 py-2 bg-slate-200 rounded">Pesquisar</button>
          <button onClick={abrirCriar} className="px-4 py-2 bg-blue-600 text-white rounded">Nova Operação</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {carregando ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">CFOP (Dentro/Fora)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {itens.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium">{item.codigo}</td>
                  <td className="px-6 py-4 text-sm">{item.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.tipo_operacao}</td>
                  <td className="px-6 py-4 text-sm">{item.cfop_dentro_estado || '-'} / {item.cfop_fora_estado || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button onClick={() => abrirEdicao(item)} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded">Editar</button>
                      <button onClick={() => excluir(item.id)} className="px-3 py-1 bg-red-100 text-red-800 rounded">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de criação/edição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6">
          <div className="bg-white w-full max-w-3xl rounded shadow p-6">
            <h2 className="text-xl font-semibold mb-4">{editing ? 'Editar Operação' : 'Nova Operação'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Código</label>
                <input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Nome</label>
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-slate-700 mb-1">Descrição</label>
                <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1">Tipo</label>
                <select value={form.tipo_operacao} onChange={(e) => setForm({ ...form, tipo_operacao: e.target.value })} className="w-full px-3 py-2 border rounded">
                  <option value="VENDA">Venda</option>
                  <option value="COMPRA">Compra</option>
                  <option value="DEVOLUCAO_VENDA">Devolução (Venda)</option>
                  <option value="DEVOLUCAO_COMPRA">Devolução (Compra)</option>
                  <option value="TRANSFERENCIA">Transferência</option>
                  <option value="REMESSA">Remessa</option>
                  <option value="RETORNO">Retorno</option>
                  <option value="OUTRAS">Outras</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1">Finalidade</label>
                <select value={form.finalidade} onChange={(e) => setForm({ ...form, finalidade: e.target.value })} className="w-full px-3 py-2 border rounded">
                  <option value="NORMAL">Normal</option>
                  <option value="COMPLEMENTAR">Complementar</option>
                  <option value="AJUSTE">Ajuste</option>
                  <option value="DEVOLUCAO">Devolução</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1">CFOP Dentro do Estado</label>
                <input value={form.cfop_dentro_estado} onChange={(e) => setForm({ ...form, cfop_dentro_estado: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1">CFOP Fora do Estado</label>
                <input value={form.cfop_fora_estado} onChange={(e) => setForm({ ...form, cfop_fora_estado: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>

              <div className="col-span-2">
                <label className="block text-sm text-slate-700 mb-1">Natureza da Operação</label>
                <input value={form.natureza_operacao} onChange={(e) => setForm({ ...form, natureza_operacao: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setModalAberto(false)} className="px-4 py-2 bg-slate-200 rounded">Cancelar</button>
              <button onClick={salvar} className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.tipo} message={toast.mensagem} onClose={() => setToast(null)} />}
    </div>
  )
}
