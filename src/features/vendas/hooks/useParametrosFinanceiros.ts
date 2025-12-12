import { useState, useEffect } from 'react'

interface FormaPagamento {
  id: string
  nome: string
  ativo: boolean
  diasPrazo: number
  tipoRecebimento?: 'DINHEIRO' | 'TRANSFERENCIA' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'BOLETO' | 'PIX' | 'CHEQUE' | 'OUTROS'
  permiteParcelamento?: boolean
  taxaJuros?: number
  descontoAVista?: number
  geraFinanceiro?: boolean
}

interface Parcelamento {
  id: string
  descricao: string
  numeroParcelas: number
  intervaloEntreParcelas: number
  ativo: boolean
  taxaJuros?: number
  primeiroVencimento?: number
}

interface ContaBancaria {
  id: string
  banco: string
  agencia: string
  conta: string
  descricao: string
  ativo: boolean
  codigoBanco?: string
  tipoConta?: 'CORRENTE' | 'POUPANCA' | 'PAGAMENTO'
  saldoInicial?: number
}

export const useParametrosFinanceiros = () => {
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([])
  const [parcelamentos, setParcelamentos] = useState<Parcelamento[]>([])
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    carregarParametros()
  }, [])

  const carregarParametros = () => {
    // Buscar do localStorage (simulando até integrar com Supabase)
    const formasString = localStorage.getItem('parametros_formas_pagamento')
    const parcelamentosString = localStorage.getItem('parametros_parcelamentos')
    const contasString = localStorage.getItem('parametros_contas_bancarias')

    if (formasString) {
      setFormasPagamento(JSON.parse(formasString).filter((f: FormaPagamento) => f.ativo))
    } else {
      // Dados padrão caso não existam
      setFormasPagamento([
        { id: '1', nome: 'Dinheiro', ativo: true, diasPrazo: 0, tipoRecebimento: 'DINHEIRO', permiteParcelamento: false, geraFinanceiro: true },
        { id: '2', nome: 'PIX', ativo: true, diasPrazo: 0, tipoRecebimento: 'PIX', permiteParcelamento: false, geraFinanceiro: true },
        { id: '3', nome: 'Cartão de Crédito', ativo: true, diasPrazo: 0, tipoRecebimento: 'CARTAO_CREDITO', permiteParcelamento: true, geraFinanceiro: true },
        { id: '4', nome: 'Cartão de Débito', ativo: true, diasPrazo: 0, tipoRecebimento: 'CARTAO_DEBITO', permiteParcelamento: false, geraFinanceiro: true },
        { id: '5', nome: 'Boleto Bancário', ativo: true, diasPrazo: 30, tipoRecebimento: 'BOLETO', permiteParcelamento: false, geraFinanceiro: true },
      ])
    }

    if (parcelamentosString) {
      setParcelamentos(JSON.parse(parcelamentosString).filter((p: Parcelamento) => p.ativo))
    } else {
      // Dados padrão
      setParcelamentos([
        { id: '1', descricao: '2x sem juros', numeroParcelas: 2, intervaloEntreParcelas: 30, ativo: true },
        { id: '2', descricao: '3x sem juros', numeroParcelas: 3, intervaloEntreParcelas: 30, ativo: true },
        { id: '3', descricao: '6x sem juros', numeroParcelas: 6, intervaloEntreParcelas: 30, ativo: true },
        { id: '4', descricao: '12x sem juros', numeroParcelas: 12, intervaloEntreParcelas: 30, ativo: true },
      ])
    }

    if (contasString) {
      setContasBancarias(JSON.parse(contasString).filter((c: ContaBancaria) => c.ativo))
    }

    setCarregando(false)
  }

  return {
    formasPagamento,
    parcelamentos,
    contasBancarias,
    carregando
  }
}
