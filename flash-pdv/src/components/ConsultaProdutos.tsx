// =====================================================
// COMPONENTE - CONSULTA DE PRODUTOS
// Tela para consultar catálogo de produtos
// =====================================================

import { useState, useEffect } from 'react'
import { ConfigPDV } from '../types/electron'
import { Produto } from '../services/produtosService'

interface ConsultaProdutosProps {
  config: ConfigPDV
  onVoltar: () => void
}

export default function ConsultaProdutos({ config, onVoltar }: ConsultaProdutosProps) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [sincronizando, setSincronizando] = useState(false)
  const [totalProdutos, setTotalProdutos] = useState(0)

  useEffect(() => {
    carregarProdutos()
  }, [])

  const carregarProdutos = async (termoBusca: string = '') => {
    setLoading(true)
    try {
      let sql = `
        SELECT * FROM produtos 
        WHERE empresa_id = ? AND ativo = 1
      `
      const params: any[] = [config.empresaId]

      if (termoBusca.trim()) {
        sql += ` AND (codigo_interno LIKE ? OR nome LIKE ? OR codigo_barras LIKE ?)`
        const termo = `%${termoBusca}%`
        params.push(termo, termo, termo)
      }

      sql += ` ORDER BY nome LIMIT 100`

      const result = await window.electronAPI.db.query(sql, params)
      setProdutos(result || [])

      // Contar total
      const countResult = await window.electronAPI.db.query(
        'SELECT COUNT(*) as total FROM produtos WHERE empresa_id = ? AND ativo = 1',
        [config.empresaId]
      )
      setTotalProdutos(countResult[0]?.total || 0)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      alert('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const handleBuscar = () => {
    carregarProdutos(busca)
  }

  const handleSincronizar = async () => {
    setSincronizando(true)
    try {
      const result = await window.electronAPI.sync.start()
      if (result.success) {
        alert(result.message)
        await carregarProdutos(busca)
      } else {
        alert(result.message)
      }
    } catch (error: any) {
      alert(`Erro ao sincronizar: ${error.message}`)
    } finally {
      setSincronizando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#394353] text-white shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onVoltar} className="text-white hover:opacity-80">
                ← Voltar
              </button>
              <h1 className="text-xl font-bold">Consulta de Produtos</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSincronizar}
                disabled={sincronizando}
                className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {sincronizando ? '⏳ Sincronizando...' : '🔄 Sincronizar'}
              </button>
              <div className="text-xs bg-white bg-opacity-20 px-3 py-2 rounded">
                📦 {totalProdutos} produtos
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg border border-[#C9C4B5] p-4">
          {/* Busca */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Buscar por código, descrição ou EAN
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                placeholder="Digite para buscar..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#394353] focus:border-transparent"
              />
              <button
                onClick={handleBuscar}
                className="px-4 py-2 bg-[#394353] text-white text-sm font-semibold rounded-lg hover:opacity-90"
              >
                🔍 Buscar
              </button>
              <button
                onClick={() => {
                  setBusca('')
                  carregarProdutos('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Tabela de Produtos */}
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
              Carregando produtos...
            </div>
          ) : produtos.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-600 font-semibold mb-2">Nenhum produto encontrado</p>
              <p className="text-sm text-gray-500">
                {busca
                  ? `Nenhum resultado para "${busca}"`
                  : 'Clique em "🔄 Sincronizar" para baixar produtos da retaguarda'}
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#394353] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Descrição</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">EAN</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">Preço Venda</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">Estoque</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold">Unidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {produtos.map((produto) => (
                      <tr key={produto.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs font-medium">{produto.codigo_interno}</td>
                        <td className="px-4 py-3 text-xs">{produto.nome}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{produto.codigo_barras || '-'}</td>
                        <td className="px-4 py-3 text-xs text-right font-semibold text-green-700">
                          R$ {produto.preco_venda.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-xs text-right">
                          <span
                            className={`px-2 py-1 rounded ${
                              produto.estoque_atual > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {produto.estoque_atual}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-center">{produto.unidade_medida || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  Mostrando {produtos.length} de {totalProdutos} produtos
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
