// Componente temporário - Em desenvolvimento
import { useState, useEffect } from 'react'
import { operacoesFiscaisService } from './services'
import type { OperacaoFiscal } from './types'
import { Toast } from '../../shared/components/Toast'

export default function CadastroOperacoesFiscais() {
  const [itens, setItens] = useState<OperacaoFiscal[]>([])
  const [carregando, setCarregando] = useState(true)
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null)

  useEffect(() => {
    carregarItens()
  }, [])

  const carregarItens = async () => {
    setCarregando(true)
    try {
      const dados = await operacoesFiscaisService.listar({})
      setItens(dados)
    } catch (error) {
      setToast({ tipo: 'error', mensagem: 'Erro ao carregar Operações Fiscais' })
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Operações Fiscais</h1>
        <p className="text-slate-600 mt-2">Regras de tributação por tipo de operação</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {carregando ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : itens.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500">Nenhuma operação fiscal cadastrada</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {itens.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium">{item.codigo}</td>
                  <td className="px-6 py-4 text-sm">{item.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.tipo_operacao}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${item.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {toast && <Toast type={toast.tipo} message={toast.mensagem} onClose={() => setToast(null)} />}
    </div>
  )
}
