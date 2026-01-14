// =====================================================
// TELA: EMISSÃO DE NOTAS FISCAIS
// Sistema de faturamento com Reforma Tributária 2026
// Data: 13/01/2026
// =====================================================

import { useState, useEffect } from 'react'
import { FileText, Plus, Search, Calendar, DollarSign, AlertCircle, CheckCircle, XCircle, Loader } from 'lucide-react'
import { notasFiscaisService, type NotaFiscalFormData, type NotaFiscalItemFormData } from '../fiscal/notasFiscaisService'
import { calculoTributarioService } from '../fiscal/calculoTributarioService'
import { supabase } from '../../lib/supabase'

export default function EmissaoNotasFiscais() {
  // Estados
  const [modoEmissao, setModoEmissao] = useState<'AVULSA' | 'VENDA'>('AVULSA')
  const [tipoNota, setTipoNota] = useState<'NFE' | 'NFCE'>('NFE')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)
  
  // Dados do formulário
  const [formData, setFormData] = useState<NotaFiscalFormData>({
    modo_emissao: 'AVULSA',
    tipo_nota: 'NFE',
    serie: 1,
    natureza_operacao: 'VENDA DE MERCADORIA',
    cfop_predominante: '5102',
    finalidade: '1',
    empresa_id: 1,
    itens: [],
    modalidade_frete: '9', // Sem frete
    forma_pagamento: '0' // À vista
  })
  
  // Itens
  const [itens, setItens] = useState<NotaFiscalItemFormData[]>([])
  
  // Busca de vendas
  const [vendas, setVendas] = useState<any[]>([])
  const [vendaSelecionada, setVendaSelecionada] = useState<any>(null)

  // Buscar vendas disponíveis para faturamento
  useEffect(() => {
    if (modoEmissao === 'VENDA') {
      buscarVendasPendentes()
    }
  }, [modoEmissao])

  async function buscarVendasPendentes() {
    try {
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .is('nota_fiscal_id', null)
        .eq('status', 'PEDIDO_FECHADO')
        .order('numero', { ascending: false })
        .limit(50)

      if (error) throw error
      setVendas(data || [])
    } catch (error) {
      console.error('Erro ao buscar vendas:', error)
    }
  }

  // Adicionar item
  function adicionarItem() {
    const novoItem: NotaFiscalItemFormData = {
      codigo_produto: '',
      descricao: '',
      ncm: '',
      cfop: '5102',
      unidade_comercial: 'UN',
      quantidade_comercial: 1,
      valor_unitario_comercial: 0,
      origem_mercadoria: '0'
    }
    setItens([...itens, novoItem])
  }

  // Remover item
  function removerItem(index: number) {
    setItens(itens.filter((_, i) => i !== index))
  }

  // Atualizar item
  function atualizarItem(index: number, campo: string, valor: any) {
    const novosItens = [...itens]
    novosItens[index] = { ...novosItens[index], [campo]: valor }
    setItens(novosItens)
  }

  // Calcular totais
  function calcularTotais() {
    let totalProdutos = 0
    let totalTributos = 0

    itens.forEach(item => {
      const valorItem = item.quantidade_comercial * item.valor_unitario_comercial
      totalProdutos += valorItem
    })

    const valorFrete = formData.valor_frete || 0
    const valorDesconto = formData.valor_desconto || 0
    const valorOutrasDespesas = formData.valor_outras_despesas || 0
    const valorTotal = totalProdutos + valorFrete + valorOutrasDespesas - valorDesconto

    return {
      totalProdutos,
      totalTributos,
      valorTotal
    }
  }

  // Emitir nota
  async function emitirNota() {
    setLoading(true)
    setMensagem(null)

    try {
      let resultado

      if (modoEmissao === 'AVULSA') {
        // Validar itens
        if (itens.length === 0) {
          throw new Error('Adicione pelo menos um item à nota')
        }

        resultado = await notasFiscaisService.emitirNotaAvulsa({
          ...formData,
          itens
        })
      } else {
        // Emissão via venda
        if (!vendaSelecionada) {
          throw new Error('Selecione uma venda para faturar')
        }

        resultado = await notasFiscaisService.emitirNotaDeVenda(
          vendaSelecionada.id,
          tipoNota,
          formData.serie
        )
      }

      if (resultado.sucesso) {
        setMensagem({ tipo: 'sucesso', texto: resultado.mensagem })
        
        // Limpar formulário
        setItens([])
        setVendaSelecionada(null)
        
        // Recarregar vendas se necessário
        if (modoEmissao === 'VENDA') {
          buscarVendasPendentes()
        }
      } else {
        setMensagem({ tipo: 'erro', texto: resultado.mensagem })
      }
    } catch (error) {
      console.error('Erro ao emitir nota:', error)
      setMensagem({ 
        tipo: 'erro', 
        texto: error instanceof Error ? error.message : 'Erro ao emitir nota fiscal' 
      })
    } finally {
      setLoading(false)
    }
  }

  const totais = calcularTotais()

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Cabeçalho */}
      <div className="bg-white p-3 rounded-lg shadow mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: '#394353' }} />
            <h1 className="text-base font-semibold">Emissão de Notas Fiscais</h1>
          </div>
          <span className="text-xs text-gray-600">
            Sistema com Reforma Tributária 2026 (IBS/CBS)
          </span>
        </div>

        {/* Mensagem */}
        {mensagem && (
          <div className={`p-3 rounded-md flex items-center gap-2 ${
            mensagem.tipo === 'sucesso' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {mensagem.tipo === 'sucesso' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm">{mensagem.texto}</span>
          </div>
        )}
      </div>

      {/* Seleção de Modo de Emissão */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-sm font-semibold mb-3">Modo de Emissão</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setModoEmissao('AVULSA')}
            className={`p-3 rounded-md border-2 transition-all text-sm ${
              modoEmissao === 'AVULSA'
                ? 'border-[#394353] bg-gray-50'
                : 'border-[#C9C4B5] hover:border-gray-400'
            }`}
          >
            <FileText className="w-5 h-5 mx-auto mb-1" />
            <div className="font-semibold">Emissão Avulsa</div>
            <div className="text-xs text-gray-600">Preencher dados manualmente</div>
          </button>

          <button
            onClick={() => setModoEmissao('VENDA')}
            className={`p-3 rounded-md border-2 transition-all text-sm ${
              modoEmissao === 'VENDA'
                ? 'border-[#394353] bg-gray-50'
                : 'border-[#C9C4B5] hover:border-gray-400'
            }`}
          >
            <DollarSign className="w-5 h-5 mx-auto mb-1" />
            <div className="font-semibold">Emissão via Venda</div>
            <div className="text-xs text-gray-600">Faturar pedido existente</div>
          </button>
        </div>
      </div>

      {/* Tipo de Nota */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-sm font-semibold mb-3">Tipo de Documento</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50" style={{ borderColor: '#C9C4B5' }}>
            <input
              type="radio"
              name="tipo_nota"
              value="NFE"
              checked={tipoNota === 'NFE'}
              onChange={(e) => setTipoNota(e.target.value as 'NFE' | 'NFCE')}
              className="w-4 h-4"
            />
            <div>
              <div className="text-sm font-semibold">NF-e (Modelo 55)</div>
              <div className="text-xs text-gray-600">Nota Fiscal Eletrônica</div>
            </div>
          </label>

          <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50" style={{ borderColor: '#C9C4B5' }}>
            <input
              type="radio"
              name="tipo_nota"
              value="NFCE"
              checked={tipoNota === 'NFCE'}
              onChange={(e) => setTipoNota(e.target.value as 'NFE' | 'NFCE')}
              className="w-4 h-4"
            />
            <div>
              <div className="text-sm font-semibold">NFC-e (Modelo 65)</div>
              <div className="text-xs text-gray-600">Nota Fiscal ao Consumidor</div>
            </div>
          </label>
        </div>
      </div>

      {/* Conteúdo baseado no modo */}
      {modoEmissao === 'VENDA' ? (
        <>
          {/* Lista de vendas pendentes */}
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="text-sm font-semibold mb-3">Selecionar Venda para Faturar</h2>
            
            {vendas.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Nenhuma venda pendente de faturamento</p>
              </div>
            ) : (
              <div className="space-y-2">
                {vendas.map((venda) => (
                  <button
                    key={venda.id}
                    onClick={() => setVendaSelecionada(venda)}
                    className={`w-full p-3 border rounded-md text-left transition-all ${
                      vendaSelecionada?.id === venda.id
                        ? 'border-[#394353] bg-gray-50'
                        : 'border-[#C9C4B5] hover:border-gray-400'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-semibold">Venda #{venda.numero}</div>
                        <div className="text-xs text-gray-600">{venda.cliente_nome || 'Sem cliente'}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(venda.data_venda).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.total)}
                        </div>
                        <div className="text-xs text-gray-600">{venda.forma_pagamento}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Formulário de Emissão Avulsa */}
          
          {/* Dados do Destinatário */}
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="text-sm font-semibold mb-3">Dados do Destinatário</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  CPF/CNPJ *
                </label>
                <input
                  type="text"
                  value={formData.destinatario_cpf_cnpj || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_cpf_cnpj: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  style={{ borderColor: '#C9C4B5' }}
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Nome/Razão Social *
                </label>
                <input
                  type="text"
                  value={formData.destinatario_nome || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_nome: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  style={{ borderColor: '#C9C4B5' }}
                  placeholder="Nome do destinatário"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={formData.destinatario_email || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_email: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  style={{ borderColor: '#C9C4B5' }}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.destinatario_telefone || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_telefone: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  style={{ borderColor: '#C9C4B5' }}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>

          {/* Itens da Nota */}
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Itens da Nota Fiscal</h2>
              <button
                onClick={adicionarItem}
                className="px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold shadow-sm"
                style={{ backgroundColor: '#394353', color: 'white' }}
              >
                <Plus className="w-4 h-4" />
                Adicionar Item
              </button>
            </div>

            {itens.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Nenhum item adicionado</p>
                <p className="text-xs mt-1">Clique em "Adicionar Item" para começar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {itens.map((item, index) => (
                  <div key={index} className="border rounded-md p-3" style={{ borderColor: '#C9C4B5' }}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Descrição *
                        </label>
                        <input
                          type="text"
                          value={item.descricao}
                          onChange={(e) => atualizarItem(index, 'descricao', e.target.value)}
                          className="w-full border rounded-md px-2 py-1.5 text-sm"
                          style={{ borderColor: '#C9C4B5' }}
                          placeholder="Descrição do produto"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          NCM *
                        </label>
                        <input
                          type="text"
                          value={item.ncm}
                          onChange={(e) => atualizarItem(index, 'ncm', e.target.value)}
                          className="w-full border rounded-md px-2 py-1.5 text-sm"
                          style={{ borderColor: '#C9C4B5' }}
                          placeholder="00000000"
                          maxLength={8}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          CFOP *
                        </label>
                        <input
                          type="text"
                          value={item.cfop}
                          onChange={(e) => atualizarItem(index, 'cfop', e.target.value)}
                          className="w-full border rounded-md px-2 py-1.5 text-sm"
                          style={{ borderColor: '#C9C4B5' }}
                          placeholder="5102"
                          maxLength={4}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Quantidade *
                        </label>
                        <input
                          type="number"
                          value={item.quantidade_comercial}
                          onChange={(e) => atualizarItem(index, 'quantidade_comercial', parseFloat(e.target.value) || 0)}
                          className="w-full border rounded-md px-2 py-1.5 text-sm"
                          style={{ borderColor: '#C9C4B5' }}
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Valor Unitário *
                        </label>
                        <input
                          type="number"
                          value={item.valor_unitario_comercial}
                          onChange={(e) => atualizarItem(index, 'valor_unitario_comercial', parseFloat(e.target.value) || 0)}
                          className="w-full border rounded-md px-2 py-1.5 text-sm"
                          style={{ borderColor: '#C9C4B5' }}
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Valor Total
                        </label>
                        <input
                          type="text"
                          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            item.quantidade_comercial * item.valor_unitario_comercial
                          )}
                          disabled
                          className="w-full border rounded-md px-2 py-1.5 text-sm bg-gray-50"
                          style={{ borderColor: '#C9C4B5' }}
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={() => removerItem(index)}
                          className="w-full px-3 py-1.5 border rounded-md text-red-600 hover:bg-red-50 text-sm font-semibold"
                          style={{ borderColor: '#C9C4B5' }}
                        >
                          <XCircle className="w-4 h-4 inline mr-1" />
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Valores Adicionais */}
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="text-sm font-semibold mb-3">Valores Adicionais</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Frete
                </label>
                <input
                  type="number"
                  value={formData.valor_frete || 0}
                  onChange={(e) => setFormData({ ...formData, valor_frete: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  style={{ borderColor: '#C9C4B5' }}
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Seguro
                </label>
                <input
                  type="number"
                  value={formData.valor_seguro || 0}
                  onChange={(e) => setFormData({ ...formData, valor_seguro: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  style={{ borderColor: '#C9C4B5' }}
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Desconto
                </label>
                <input
                  type="number"
                  value={formData.valor_desconto || 0}
                  onChange={(e) => setFormData({ ...formData, valor_desconto: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  style={{ borderColor: '#C9C4B5' }}
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Outras Despesas
                </label>
                <input
                  type="number"
                  value={formData.valor_outras_despesas || 0}
                  onChange={(e) => setFormData({ ...formData, valor_outras_despesas: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  style={{ borderColor: '#C9C4B5' }}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Totalizadores */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-sm font-semibold mb-3">Totais da Nota Fiscal</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-md">
            <div className="text-xs text-gray-600 mb-1">Total Produtos</div>
            <div className="text-base font-semibold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totais.totalProdutos)}
            </div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-md">
            <div className="text-xs text-gray-600 mb-1">Total Tributos (Est.)</div>
            <div className="text-base font-semibold text-orange-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totais.totalTributos)}
            </div>
          </div>

          <div className="text-center p-3 rounded-md" style={{ backgroundColor: '#394353', color: 'white' }}>
            <div className="text-xs mb-1 opacity-80">Valor Total da Nota</div>
            <div className="text-lg font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totais.valorTotal)}
            </div>
          </div>
        </div>

        <div className="mt-3 p-3 bg-blue-50 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <strong>Reforma Tributária 2026:</strong> Esta nota será emitida considerando o período de transição.
              O sistema calculará automaticamente ICMS/PIS/COFINS (reduzidos) e IBS/CBS (proporcionais).
            </div>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2.5 border rounded-md text-gray-700 hover:bg-gray-50 text-sm font-semibold"
            style={{ borderColor: '#C9C4B5' }}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            onClick={emitirNota}
            disabled={loading || (modoEmissao === 'AVULSA' && itens.length === 0) || (modoEmissao === 'VENDA' && !vendaSelecionada)}
            className="px-6 py-2.5 rounded-md flex items-center gap-2 text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#394353', color: 'white' }}
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Emitir Nota Fiscal
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
