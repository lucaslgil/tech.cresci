import { useEffect, useState } from 'react'
import { vendasService } from '../vendasService'
import { supabase } from '../../../lib/supabase'
import { buscarContasPorVenda } from '../../financeiro/contasReceberService'
import type { Venda } from '../types'
import { PrintPedidoPortal } from './PrintPedidoPortal'
import PedidoA4 from './PedidoA4'

interface ImpressaoPedidoProps {
  vendaId: string | number
  onClose: () => void
}

interface ParametrosImpressao {
  logoUrl: string | null;
  nomeEmpresa: string;
  slogan: string;
  mostrarLogo: boolean;
}

export function ImpressaoPedido({ vendaId, onClose }: ImpressaoPedidoProps) {
  const [venda, setVenda] = useState<Venda | null>(null)
  const [parametros, setParametros] = useState<ParametrosImpressao>({
    logoUrl: null,
    nomeEmpresa: 'CRESCI E PERDI FRANCHISING',
    slogan: 'Sistema de Gestão',
    mostrarLogo: true
  })
  const [carregando, setCarregando] = useState(true)
  const [contas, setContas] = useState<any[]>([])

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const resultadoVenda = await vendasService.buscarPorId(Number(vendaId))
        if (resultadoVenda) setVenda(resultadoVenda)

        // Carregar contas a receber (formas de pagamento) vinculadas à venda
        try {
          const { data: contasData, error: contasError } = await buscarContasPorVenda(Number(vendaId))
          if (contasError) throw contasError
          setContas(contasData || [])
        } catch (err) {
          console.error('Erro ao carregar contas a receber da venda:', err)
        }

        const { data: parametrosData, error } = await supabase
          .from('parametros_vendas')
          .select('*')
          .in('chave', [
            'logo_impressao_vendas',
            'nome_empresa_impressao',
            'slogan_impressao',
            'mostrar_logo_impressao'
          ])

        if (error) throw error

        if (parametrosData) {
          const params: Partial<ParametrosImpressao> = {}
          parametrosData.forEach((param: any) => {
            switch (param.chave) {
              case 'logo_impressao_vendas': params.logoUrl = param.valor; break
              case 'nome_empresa_impressao': params.nomeEmpresa = param.valor || 'CRESCI E PERDI FRANCHISING'; break
              case 'slogan_impressao': params.slogan = param.valor || 'Sistema de Gestão'; break
              case 'mostrar_logo_impressao': params.mostrarLogo = param.valor === 'true'; break
            }
          })
          setParametros((prev) => ({ ...prev, ...params }))
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [vendaId])

  const handleImprimir = () => window.print()
  const [printing, setPrinting] = useState(false)

  // Mount print portal only when printing is requested
  useEffect(() => {
    if (!printing) return

    const onAfter = () => setPrinting(false)
    // give React time to mount the portal
    const t = setTimeout(() => {
      window.print()
    }, 150)

    window.addEventListener('afterprint', onAfter)
    return () => {
      clearTimeout(t)
      window.removeEventListener('afterprint', onAfter)
    }
  }, [printing])

  const formatarData = (data: string) => new Date(data).toLocaleDateString('pt-BR')
  const formatarMoeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const calcularTotal = () => {
    const subtotal = venda?.itens?.reduce((acc, item) => acc + (item.quantidade * item.valor_unitario), 0) || 0
    const desconto = venda?.desconto || 0
    const frete = venda?.frete || 0
    return subtotal - desconto + frete
  }

  if (carregando) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <p className="text-sm">Carregando pedido...</p>
        </div>
      </div>
    )
  }

  if (!venda) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Visualização de Impressão</h2>
            <div className="flex gap-2">
              <button onClick={() => setPrinting(true)} className="px-4 py-2 bg-[#394353] text-white text-sm font-semibold rounded-md hover:opacity-90 transition-all">🖨️ Imprimir</button>
              <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white text-sm font-semibold rounded-md hover:bg-gray-600 transition-all">Fechar</button>
            </div>
          </div>

          <div id="area-impressao">
            <PedidoA4 venda={venda} parametros={parametros} formatarData={formatarData} formatarMoeda={formatarMoeda} calcularTotal={calcularTotal} contas={contas} />
          </div>
        </div>
      </div>

      <PrintPedidoPortal open={printing} venda={venda} parametros={parametros} formatarData={formatarData} formatarMoeda={formatarMoeda} calcularTotal={calcularTotal} contas={contas} />
    </>
  )
}

