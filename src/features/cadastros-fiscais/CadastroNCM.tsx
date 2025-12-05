// =====================================================
// COMPONENTE - CADASTRO NCM
// Listagem e gerenciamento de NCM
// Data: 02/12/2025
// =====================================================

import { useState, useEffect } from 'react'
import { ncmService } from './services'
import type { NCM, NCMFormData, NCMFiltros } from './types'
import { Toast } from '../../shared/components/Toast'

export default function CadastroNCM() {
  const [itens, setItens] = useState<NCM[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [itemEdicao, setItemEdicao] = useState<NCM | null>(null)
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null)
  
  const [filtros, setFiltros] = useState<NCMFiltros>({})
  const [formData, setFormData] = useState<NCMFormData>({
    codigo: '',
    descricao: '',
    ativo: true
  })

  useEffect(() => {
    carregarItens()
  }, [])

  const carregarItens = async () => {
    setCarregando(true)
    try {
      const dados = await ncmService.listar(filtros)
      setItens(dados)
    } catch (error) {
      setToast({ tipo: 'error', mensagem: 'Erro ao carregar NCM' })
    } finally {
      setCarregando(false)
    }
  }

  const aplicarFiltros = () => {
    carregarItens()
  }

  const abrirModal = (item?: NCM) => {
    if (item) {
      setItemEdicao(item)
      setFormData({
        codigo: item.codigo,
        descricao: item.descricao,
        unidade_tributaria: item.unidade_tributaria,
        aliquota_nacional_federal: item.aliquota_nacional_federal,
        cest: item.cest,
        ativo: item.ativo
      })
    } else {
      setItemEdicao(null)
      setFormData({ codigo: '', descricao: '', ativo: true })
    }
    setMostrarModal(true)
  }

  const handleSubmit = async () => {
    try {
      const resultado = itemEdicao
        ? await ncmService.atualizar(itemEdicao.id, formData)
        : await ncmService.criar(formData)

      if (resultado.sucesso) {
        setToast({ tipo: 'success', mensagem: resultado.mensagem })
        setMostrarModal(false)
        carregarItens()
      } else {
        setToast({ tipo: 'error', mensagem: resultado.mensagem })
      }
    } catch (error) {
      setToast({ tipo: 'error', mensagem: 'Erro ao salvar NCM' })
    }
  }

  const handleDeletar = async (id: number) => {
    if (!confirm('Deseja realmente excluir este NCM?')) return

    try {
      const resultado = await ncmService.deletar(id)
      if (resultado.sucesso) {
        setToast({ tipo: 'success', mensagem: resultado.mensagem })
        carregarItens()
      } else {
        setToast({ tipo: 'error', mensagem: resultado.mensagem })
      }
    } catch (error) {
      setToast({ tipo: 'error', mensagem: 'Erro ao excluir NCM' })
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">NCM - Nomenclatura Comum do Mercosul</h1>
        <p className="text-sm text-gray-600 mt-1">Gerenciamento de códigos NCM para classificação fiscal de produtos</p>
      </div>

      {/* Filtros e Ações */}
      <div className="bg-white border border-gray-200 rounded p-4 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 flex gap-3">
            <input
              type="text"
              value={filtros.busca || ''}
              onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
              placeholder="Buscar por código ou descrição..."
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            />
            <button
              onClick={aplicarFiltros}
              className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Filtrar
            </button>
          </div>
          <button
            onClick={() => abrirModal()}
            className="px-4 py-1.5 text-sm font-medium text-white bg-gray-800 rounded hover:bg-gray-900 transition-colors"
          >
            + Novo NCM
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        {carregando ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800"></div>
          </div>
        ) : itens.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-500">Nenhum NCM cadastrado</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Código</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Descrição</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">CEST</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Alíquota</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {itens.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.codigo}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.descricao}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.cest || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {item.aliquota_nacional_federal ? `${item.aliquota_nacional_federal}%` : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${item.ativo ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-3">
                    <button onClick={() => abrirModal(item)} className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                      Editar
                    </button>
                    <button onClick={() => handleDeletar(item.id)} className="text-red-600 hover:text-red-800 font-medium transition-colors">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Minimalista */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                {itemEdicao ? 'Editar NCM' : 'Novo NCM'}
              </h2>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Código NCM *</label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="00.000.00"
                    maxLength={10}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">CEST</label>
                  <input
                    type="text"
                    value={formData.cest || ''}
                    onChange={(e) => setFormData({ ...formData, cest: e.target.value })}
                    placeholder="00.000.00"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descrição *</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={2}
                  placeholder="Descrição do produto conforme tabela NCM"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unidade Tributária</label>
                  <input
                    type="text"
                    value={formData.unidade_tributaria || ''}
                    onChange={(e) => setFormData({ ...formData, unidade_tributaria: e.target.value })}
                    placeholder="UN, KG, etc"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Alíquota Nacional (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.aliquota_nacional_federal || ''}
                    onChange={(e) => setFormData({ ...formData, aliquota_nacional_federal: parseFloat(e.target.value) })}
                    placeholder="0"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center pt-1">
                <input
                  type="checkbox"
                  id="ativo-checkbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="ativo-checkbox" className="ml-2 text-sm text-gray-700">Ativo</label>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 rounded-b-lg">
              <button
                onClick={() => setMostrarModal(false)}
                className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-1.5 text-sm font-medium text-white bg-gray-800 rounded hover:bg-gray-900 transition-colors"
              >
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.tipo} message={toast.mensagem} onClose={() => setToast(null)} />}
    </div>
  )
}
