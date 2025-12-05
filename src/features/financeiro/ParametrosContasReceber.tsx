import React, { useState } from 'react'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'

interface FormaPagamento {
  id: string
  nome: string
  ativo: boolean
  diasPrazo: number
}

interface Parcelamento {
  id: string
  descricao: string
  numeroParcelas: number
  intervaloEntreParcelas: number
  ativo: boolean
}

interface ContaBancaria {
  id: string
  banco: string
  agencia: string
  conta: string
  descricao: string
  ativo: boolean
}

export const ParametrosContasReceber: React.FC = () => {
  // Estados para Formas de Pagamento
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([
    { id: '1', nome: 'Dinheiro', ativo: true, diasPrazo: 0 },
    { id: '2', nome: 'PIX', ativo: true, diasPrazo: 0 },
    { id: '3', nome: 'Cartão de Crédito', ativo: true, diasPrazo: 30 },
    { id: '4', nome: 'Cartão de Débito', ativo: true, diasPrazo: 0 },
    { id: '5', nome: 'Boleto Bancário', ativo: true, diasPrazo: 30 },
  ])
  const [modalForma, setModalForma] = useState(false)
  const [formaEditando, setFormaEditando] = useState<FormaPagamento | null>(null)
  const [novaForma, setNovaForma] = useState({ nome: '', diasPrazo: 0, ativo: true })

  // Estados para Parcelamentos
  const [parcelamentos, setParcelamentos] = useState<Parcelamento[]>([
    { id: '1', descricao: '2x sem juros', numeroParcelas: 2, intervaloEntreParcelas: 30, ativo: true },
    { id: '2', descricao: '3x sem juros', numeroParcelas: 3, intervaloEntreParcelas: 30, ativo: true },
    { id: '3', descricao: '6x sem juros', numeroParcelas: 6, intervaloEntreParcelas: 30, ativo: true },
    { id: '4', descricao: '12x sem juros', numeroParcelas: 12, intervaloEntreParcelas: 30, ativo: true },
  ])
  const [modalParcelamento, setModalParcelamento] = useState(false)
  const [parcelamentoEditando, setParcelamentoEditando] = useState<Parcelamento | null>(null)
  const [novoParcelamento, setNovoParcelamento] = useState({ descricao: '', numeroParcelas: 1, intervaloEntreParcelas: 30, ativo: true })

  // Estados para Contas Bancárias
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([
    { id: '1', banco: 'Banco do Brasil', agencia: '1234-5', conta: '12345-6', descricao: 'Conta Principal', ativo: true },
    { id: '2', banco: 'Itaú', agencia: '5678-9', conta: '67890-1', descricao: 'Conta Secundária', ativo: true },
  ])
  const [modalConta, setModalConta] = useState(false)
  const [contaEditando, setContaEditando] = useState<ContaBancaria | null>(null)
  const [novaConta, setNovaConta] = useState({ banco: '', agencia: '', conta: '', descricao: '', ativo: true })

  // Salvar no localStorage quando os dados mudarem
  React.useEffect(() => {
    localStorage.setItem('parametros_formas_pagamento', JSON.stringify(formasPagamento))
  }, [formasPagamento])

  React.useEffect(() => {
    localStorage.setItem('parametros_parcelamentos', JSON.stringify(parcelamentos))
  }, [parcelamentos])

  React.useEffect(() => {
    localStorage.setItem('parametros_contas_bancarias', JSON.stringify(contasBancarias))
  }, [contasBancarias])

  // Funções Formas de Pagamento
  const salvarFormaPagamento = () => {
    if (formaEditando) {
      setFormasPagamento(formasPagamento.map(f => 
        f.id === formaEditando.id ? { ...formaEditando } : f
      ))
      setFormaEditando(null)
    } else {
      const nova: FormaPagamento = {
        id: Date.now().toString(),
        ...novaForma
      }
      setFormasPagamento([...formasPagamento, nova])
      setNovaForma({ nome: '', diasPrazo: 0, ativo: true })
    }
    setModalForma(false)
  }

  const excluirFormaPagamento = (id: string) => {
    if (confirm('Deseja realmente excluir esta forma de pagamento?')) {
      setFormasPagamento(formasPagamento.filter(f => f.id !== id))
    }
  }

  // Funções Parcelamentos
  const salvarParcelamento = () => {
    if (parcelamentoEditando) {
      setParcelamentos(parcelamentos.map(p => 
        p.id === parcelamentoEditando.id ? { ...parcelamentoEditando } : p
      ))
      setParcelamentoEditando(null)
    } else {
      const novo: Parcelamento = {
        id: Date.now().toString(),
        ...novoParcelamento
      }
      setParcelamentos([...parcelamentos, novo])
      setNovoParcelamento({ descricao: '', numeroParcelas: 1, intervaloEntreParcelas: 30, ativo: true })
    }
    setModalParcelamento(false)
  }

  const excluirParcelamento = (id: string) => {
    if (confirm('Deseja realmente excluir este parcelamento?')) {
      setParcelamentos(parcelamentos.filter(p => p.id !== id))
    }
  }

  // Funções Contas Bancárias
  const salvarContaBancaria = () => {
    if (contaEditando) {
      setContasBancarias(contasBancarias.map(c => 
        c.id === contaEditando.id ? { ...contaEditando } : c
      ))
      setContaEditando(null)
    } else {
      const nova: ContaBancaria = {
        id: Date.now().toString(),
        ...novaConta
      }
      setContasBancarias([...contasBancarias, nova])
      setNovaConta({ banco: '', agencia: '', conta: '', descricao: '', ativo: true })
    }
    setModalConta(false)
  }

  const excluirContaBancaria = (id: string) => {
    if (confirm('Deseja realmente excluir esta conta bancária?')) {
      setContasBancarias(contasBancarias.filter(c => c.id !== id))
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Formas de Pagamento */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-base font-semibold" style={{ color: '#394353' }}>Formas de Pagamento</h3>
            <p className="text-xs mt-0.5" style={{ color: '#394353' }}>Configure as formas de pagamento aceitas</p>
          </div>
          <button
            onClick={() => {
              setNovaForma({ nome: '', diasPrazo: 0, ativo: true })
              setFormaEditando(null)
              setModalForma(true)
            }}
            className="px-3 py-1.5 text-white rounded-lg hover:opacity-90 flex items-center gap-1.5 transition-opacity text-sm"
            style={{ backgroundColor: '#394353' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Forma
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg overflow-hidden border" style={{ borderColor: '#C9C4B5' }}>
          <table className="min-w-full divide-y" style={{ borderColor: '#C9C4B5' }}>
            <thead style={{ backgroundColor: '#394353' }}>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">Nome</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">Prazo (dias)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">Status</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-white uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y" style={{ borderColor: '#C9C4B5' }}>
              {formasPagamento.map((forma) => (
                <tr key={forma.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 whitespace-nowrap text-sm font-medium" style={{ color: '#394353' }}>{forma.nome}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-sm" style={{ color: '#394353' }}>{forma.diasPrazo}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${forma.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {forma.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setFormaEditando(forma)
                        setModalForma(true)
                      }}
                      className="hover:opacity-70 transition-opacity"
                      style={{ color: '#394353' }}
                    >
                      <Edit2 className="w-3.5 h-3.5 inline" />
                    </button>
                    <button
                      onClick={() => excluirFormaPagamento(forma.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parcelamentos */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-base font-semibold" style={{ color: '#394353' }}>Planos de Parcelamento</h3>
            <p className="text-xs mt-0.5" style={{ color: '#394353' }}>Defina as opções de parcelamento disponíveis</p>
          </div>
          <button
            onClick={() => {
              setNovoParcelamento({ descricao: '', numeroParcelas: 1, intervaloEntreParcelas: 30, ativo: true })
              setParcelamentoEditando(null)
              setModalParcelamento(true)
            }}
            className="px-3 py-1.5 text-white rounded-lg hover:opacity-90 flex items-center gap-1.5 transition-opacity text-sm"
            style={{ backgroundColor: '#394353' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Parcelamento
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg overflow-hidden border" style={{ borderColor: '#C9C4B5' }}>
          <table className="min-w-full divide-y" style={{ borderColor: '#C9C4B5' }}>
            <thead style={{ backgroundColor: '#394353' }}>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">Descrição</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">Parcelas</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">Intervalo (dias)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">Status</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-white uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y" style={{ borderColor: '#C9C4B5' }}>
              {parcelamentos.map((parc) => (
                <tr key={parc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 whitespace-nowrap text-sm font-medium" style={{ color: '#394353' }}>{parc.descricao}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-sm" style={{ color: '#394353' }}>{parc.numeroParcelas}x</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-sm" style={{ color: '#394353' }}>{parc.intervaloEntreParcelas}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${parc.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {parc.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setParcelamentoEditando(parc)
                        setModalParcelamento(true)
                      }}
                      className="hover:opacity-70 transition-opacity"
                      style={{ color: '#394353' }}
                    >
                      <Edit2 className="w-3.5 h-3.5 inline" />
                    </button>
                    <button
                      onClick={() => excluirParcelamento(parc.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contas Bancárias */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-base font-semibold" style={{ color: '#394353' }}>Contas Bancárias</h3>
            <p className="text-xs mt-0.5" style={{ color: '#394353' }}>Gerencie as contas bancárias para recebimento</p>
          </div>
          <button
            onClick={() => {
              setNovaConta({ banco: '', agencia: '', conta: '', descricao: '', ativo: true })
              setContaEditando(null)
              setModalConta(true)
            }}
            className="px-3 py-1.5 text-white rounded-lg hover:opacity-90 flex items-center gap-1.5 transition-opacity text-sm"
            style={{ backgroundColor: '#394353' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Conta
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg overflow-hidden border" style={{ borderColor: '#C9C4B5' }}>
          <table className="min-w-full divide-y" style={{ borderColor: '#C9C4B5' }}>
            <thead style={{ backgroundColor: '#394353' }}>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">Banco</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">Agência</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">Conta</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">Descrição</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">Status</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-white uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y" style={{ borderColor: '#C9C4B5' }}>
              {contasBancarias.map((conta) => (
                <tr key={conta.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 whitespace-nowrap text-sm font-medium" style={{ color: '#394353' }}>{conta.banco}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-sm" style={{ color: '#394353' }}>{conta.agencia}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-sm" style={{ color: '#394353' }}>{conta.conta}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-sm" style={{ color: '#394353' }}>{conta.descricao}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${conta.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {conta.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setContaEditando(conta)
                        setModalConta(true)
                      }}
                      className="hover:opacity-70 transition-opacity"
                      style={{ color: '#394353' }}
                    >
                      <Edit2 className="w-3.5 h-3.5 inline" />
                    </button>
                    <button
                      onClick={() => excluirContaBancaria(conta.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Forma de Pagamento */}
      {modalForma && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border" style={{ borderColor: '#C9C4B5' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#394353' }}>
              {formaEditando ? 'Editar' : 'Nova'} Forma de Pagamento
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#394353' }}>Nome</label>
                <input
                  type="text"
                  value={formaEditando ? formaEditando.nome : novaForma.nome}
                  onChange={(e) => formaEditando 
                    ? setFormaEditando({...formaEditando, nome: e.target.value})
                    : setNovaForma({...novaForma, nome: e.target.value})
                  }
                  className="w-full border rounded-md px-3 py-2"
                  style={{ borderColor: '#C9C4B5' }}
                  placeholder="Ex: PIX, Dinheiro, Cartão..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#394353' }}>Prazo (dias)</label>
                <input
                  type="number"
                  value={formaEditando ? formaEditando.diasPrazo : novaForma.diasPrazo}
                  onChange={(e) => formaEditando 
                    ? setFormaEditando({...formaEditando, diasPrazo: Number(e.target.value)})
                    : setNovaForma({...novaForma, diasPrazo: Number(e.target.value)})
                  }
                  className="w-full border rounded-md px-3 py-2"
                  style={{ borderColor: '#C9C4B5' }}
                  min="0"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formaEditando ? formaEditando.ativo : novaForma.ativo}
                  onChange={(e) => formaEditando 
                    ? setFormaEditando({...formaEditando, ativo: e.target.checked})
                    : setNovaForma({...novaForma, ativo: e.target.checked})
                  }
                  className="h-4 w-4 rounded"
                />
                <label className="ml-2 text-sm" style={{ color: '#394353' }}>Ativo</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setModalForma(false)
                  setFormaEditando(null)
                }}
                className="px-4 py-2 border rounded-md hover:bg-gray-50 flex items-center gap-2"
                style={{ borderColor: '#C9C4B5', color: '#394353' }}
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={salvarFormaPagamento}
                className="px-4 py-2 text-white rounded-md hover:opacity-90 flex items-center gap-2"
                style={{ backgroundColor: '#394353' }}
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Parcelamento */}
      {modalParcelamento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border" style={{ borderColor: '#C9C4B5' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#394353' }}>
              {parcelamentoEditando ? 'Editar' : 'Novo'} Parcelamento
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#394353' }}>Descrição</label>
                <input
                  type="text"
                  value={parcelamentoEditando ? parcelamentoEditando.descricao : novoParcelamento.descricao}
                  onChange={(e) => parcelamentoEditando 
                    ? setParcelamentoEditando({...parcelamentoEditando, descricao: e.target.value})
                    : setNovoParcelamento({...novoParcelamento, descricao: e.target.value})
                  }
                  className="w-full border rounded-md px-3 py-2"
                  style={{ borderColor: '#C9C4B5' }}
                  placeholder="Ex: 3x sem juros"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#394353' }}>Número de Parcelas</label>
                <input
                  type="number"
                  value={parcelamentoEditando ? parcelamentoEditando.numeroParcelas : novoParcelamento.numeroParcelas}
                  onChange={(e) => parcelamentoEditando 
                    ? setParcelamentoEditando({...parcelamentoEditando, numeroParcelas: Number(e.target.value)})
                    : setNovoParcelamento({...novoParcelamento, numeroParcelas: Number(e.target.value)})
                  }
                  className="w-full border rounded-md px-3 py-2"
                  style={{ borderColor: '#C9C4B5' }}
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#394353' }}>Intervalo entre Parcelas (dias)</label>
                <input
                  type="number"
                  value={parcelamentoEditando ? parcelamentoEditando.intervaloEntreParcelas : novoParcelamento.intervaloEntreParcelas}
                  onChange={(e) => parcelamentoEditando 
                    ? setParcelamentoEditando({...parcelamentoEditando, intervaloEntreParcelas: Number(e.target.value)})
                    : setNovoParcelamento({...novoParcelamento, intervaloEntreParcelas: Number(e.target.value)})
                  }
                  className="w-full border rounded-md px-3 py-2"
                  style={{ borderColor: '#C9C4B5' }}
                  min="1"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={parcelamentoEditando ? parcelamentoEditando.ativo : novoParcelamento.ativo}
                  onChange={(e) => parcelamentoEditando 
                    ? setParcelamentoEditando({...parcelamentoEditando, ativo: e.target.checked})
                    : setNovoParcelamento({...novoParcelamento, ativo: e.target.checked})
                  }
                  className="h-4 w-4 rounded"
                />
                <label className="ml-2 text-sm" style={{ color: '#394353' }}>Ativo</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setModalParcelamento(false)
                  setParcelamentoEditando(null)
                }}
                className="px-4 py-2 border rounded-md hover:bg-gray-50 flex items-center gap-2"
                style={{ borderColor: '#C9C4B5', color: '#394353' }}
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={salvarParcelamento}
                className="px-4 py-2 text-white rounded-md hover:opacity-90 flex items-center gap-2"
                style={{ backgroundColor: '#394353' }}
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conta Bancária */}
      {modalConta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border" style={{ borderColor: '#C9C4B5' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#394353' }}>
              {contaEditando ? 'Editar' : 'Nova'} Conta Bancária
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#394353' }}>Banco</label>
                <input
                  type="text"
                  value={contaEditando ? contaEditando.banco : novaConta.banco}
                  onChange={(e) => contaEditando 
                    ? setContaEditando({...contaEditando, banco: e.target.value})
                    : setNovaConta({...novaConta, banco: e.target.value})
                  }
                  className="w-full border rounded-md px-3 py-2"
                  style={{ borderColor: '#C9C4B5' }}
                  placeholder="Ex: Banco do Brasil"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#394353' }}>Agência</label>
                <input
                  type="text"
                  value={contaEditando ? contaEditando.agencia : novaConta.agencia}
                  onChange={(e) => contaEditando 
                    ? setContaEditando({...contaEditando, agencia: e.target.value})
                    : setNovaConta({...novaConta, agencia: e.target.value})
                  }
                  className="w-full border rounded-md px-3 py-2"
                  style={{ borderColor: '#C9C4B5' }}
                  placeholder="1234-5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#394353' }}>Conta</label>
                <input
                  type="text"
                  value={contaEditando ? contaEditando.conta : novaConta.conta}
                  onChange={(e) => contaEditando 
                    ? setContaEditando({...contaEditando, conta: e.target.value})
                    : setNovaConta({...novaConta, conta: e.target.value})
                  }
                  className="w-full border rounded-md px-3 py-2"
                  style={{ borderColor: '#C9C4B5' }}
                  placeholder="12345-6"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#394353' }}>Descrição</label>
                <input
                  type="text"
                  value={contaEditando ? contaEditando.descricao : novaConta.descricao}
                  onChange={(e) => contaEditando 
                    ? setContaEditando({...contaEditando, descricao: e.target.value})
                    : setNovaConta({...novaConta, descricao: e.target.value})
                  }
                  className="w-full border rounded-md px-3 py-2"
                  style={{ borderColor: '#C9C4B5' }}
                  placeholder="Conta Principal"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={contaEditando ? contaEditando.ativo : novaConta.ativo}
                  onChange={(e) => contaEditando 
                    ? setContaEditando({...contaEditando, ativo: e.target.checked})
                    : setNovaConta({...novaConta, ativo: e.target.checked})
                  }
                  className="h-4 w-4 rounded"
                />
                <label className="ml-2 text-sm" style={{ color: '#394353' }}>Ativo</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setModalConta(false)
                  setContaEditando(null)
                }}
                className="px-4 py-2 border rounded-md hover:bg-gray-50 flex items-center gap-2"
                style={{ borderColor: '#C9C4B5', color: '#394353' }}
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={salvarContaBancaria}
                className="px-4 py-2 text-white rounded-md hover:opacity-90 flex items-center gap-2"
                style={{ backgroundColor: '#394353' }}
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
