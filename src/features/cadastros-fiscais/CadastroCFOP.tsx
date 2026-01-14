// Componente temporário - Em desenvolvimento
import { useState, useEffect } from 'react'
import { cfopService } from './services'
import type { CFOP } from './types'
import { Toast } from '../../shared/components/Toast'

export default function CadastroCFOP() {
  const [itens, setItens] = useState<CFOP[]>([])
  const [carregando, setCarregando] = useState(true)
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [novoCfop, setNovoCfop] = useState<Partial<CFOP>>({ codigo: '', descricao: '', aplicacao: '', tipo_operacao: 'SAIDA', ativo: true })
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    carregarItens()
  }, [])

  const carregarItens = async () => {
    setCarregando(true)
    try {
      const dados = await cfopService.listar({})
      setItens(dados)
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : JSON.stringify(error)
      setToast({ tipo: 'error', mensagem: `Erro ao carregar CFOP: ${mensagem}. Verifique a conexão e permissões.` })
    } finally {
      setCarregando(false)
    }
  }

  const criarItem = async () => {
    setCarregando(true)
    try {
      const payload = {
        codigo: (novoCfop.codigo || '').toString().replace(/\./g, '').replace(/[^0-9]/g, ''),
        descricao: (novoCfop.descricao || '').toString(),
        aplicacao: (novoCfop.aplicacao || '').toString(),
        tipo_operacao: (novoCfop.tipo_operacao as string) || 'SAIDA',
        ativo: novoCfop.ativo ?? true
      }

      const res = await cfopService.criar(payload as any)
      if (!res.sucesso) throw new Error(res.mensagem)
      setToast({ tipo: 'success', mensagem: res.mensagem })
      setShowCreateModal(false)
      setNovoCfop({ codigo: '', descricao: '', aplicacao: '', tipo_operacao: 'SAIDA', ativo: true })
      await carregarItens()
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : JSON.stringify(error)
      setToast({ tipo: 'error', mensagem: `Erro ao cadastrar CFOP: ${mensagem}` })
    } finally {
      setCarregando(false)
    }
  }

  const iniciarEdicao = (item: CFOP) => {
    setEditingId(item.id || null)
    setNovoCfop({ codigo: item.codigo, descricao: item.descricao, aplicacao: item.aplicacao, tipo_operacao: item.tipo_operacao, ativo: item.ativo })
    setShowCreateModal(true)
  }

  const atualizarItem = async () => {
    if (!editingId) return
    setCarregando(true)
    try {
      const payload = {
        codigo: (novoCfop.codigo || '').toString().replace(/\./g, '').replace(/[^0-9]/g, ''),
        descricao: (novoCfop.descricao || '').toString(),
        aplicacao: (novoCfop.aplicacao || '').toString(),
        tipo_operacao: (novoCfop.tipo_operacao as string) || 'SAIDA',
        ativo: novoCfop.ativo ?? true
      }

      const res = await cfopService.atualizar(editingId, payload as any)
      if (!res.sucesso) throw new Error(res.mensagem)
      setToast({ tipo: 'success', mensagem: res.mensagem })
      setShowCreateModal(false)
      setEditingId(null)
      setNovoCfop({ codigo: '', descricao: '', aplicacao: '', tipo_operacao: 'SAIDA', ativo: true })
      await carregarItens()
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : JSON.stringify(error)
      setToast({ tipo: 'error', mensagem: `Erro ao atualizar CFOP: ${mensagem}` })
    } finally {
      setCarregando(false)
    }
  }

  const excluirItem = async (id?: number) => {
    if (!id) return
    const confirmou = window.confirm('Confirma exclusão deste CFOP? Esta ação não pode ser desfeita.')
    if (!confirmou) return
    setCarregando(true)
    try {
      const res = await cfopService.deletar(id)
      if (!res.sucesso) throw new Error(res.mensagem)
      setToast({ tipo: 'success', mensagem: res.mensagem })
      await carregarItens()
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : JSON.stringify(error)
      setToast({ tipo: 'error', mensagem: `Erro ao excluir CFOP: ${mensagem}` })
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">CFOP - Código Fiscal de Operações</h1>
          <p className="text-slate-600 mt-2">Gerenciamento de códigos CFOP para operações fiscais</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-slate-700 text-white rounded-md hover:opacity-90 text-sm font-semibold"
          >
            Adicionar CFOP
          </button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {itens.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium">{item.codigo}</td>
                  <td className="px-6 py-4 text-sm">{item.descricao}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.tipo_operacao}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${item.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={() => iniciarEdicao(item)} className="text-sm px-3 py-1 mr-2 border rounded text-slate-700">Editar</button>
                    <button onClick={() => excluirItem(item.id)} className="text-sm px-3 py-1 border rounded text-red-600">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {toast && <Toast type={toast.tipo} message={toast.mensagem} onClose={() => setToast(null)} />}

      {/* Modal de criação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold">{editingId ? 'Editar CFOP' : 'Adicionar CFOP'}</h2>
                <button onClick={() => { setShowCreateModal(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600">×</button>
              </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
                  <input value={novoCfop.codigo} onChange={(e) => setNovoCfop({ ...novoCfop, codigo: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Operação</label>
                  <select value={novoCfop.tipo_operacao} onChange={(e) => setNovoCfop({ ...novoCfop, tipo_operacao: e.target.value as any })} className="w-full px-3 py-2 border border-slate-300 rounded-md">
                    <option value="SAIDA">SAIDA</option>
                    <option value="ENTRADA">ENTRADA</option>
                    <option value="ENTRADA_IMPORTACAO">ENTRADA_IMPORTACAO</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                  <input value={novoCfop.descricao} onChange={(e) => setNovoCfop({ ...novoCfop, descricao: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Aplicação</label>
                  <input value={novoCfop.aplicacao} onChange={(e) => setNovoCfop({ ...novoCfop, aplicacao: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={novoCfop.ativo} onChange={(e) => setNovoCfop({ ...novoCfop, ativo: e.target.checked })} />
                  <label className="text-sm text-slate-700">Ativo</label>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={() => { setShowCreateModal(false); setEditingId(null); }} className="px-4 py-2 mr-2 border rounded-md">Cancelar</button>
                {editingId ? (
                  <button onClick={atualizarItem} className="px-4 py-2 bg-slate-700 text-white rounded-md">Salvar</button>
                ) : (
                  <button onClick={criarItem} className="px-4 py-2 bg-slate-700 text-white rounded-md">Criar CFOP</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
