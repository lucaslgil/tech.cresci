// =====================================================
// COMPONENTE - BOTÕES DE AÇÃO DA VENDA
// Barra de botões agrupados para controle de vendas
// Data: 04/12/2025
// =====================================================

interface BotoesAcaoVendaProps {
  vendaId?: string | number
  status: string
  bloqueado?: boolean
  carregando?: boolean
  onSalvar?: () => void
  onCancelar?: () => void
  onExcluir?: () => void
  onBloquear?: () => void
  onDesbloquear?: () => void
  onReabrir?: () => void
  onConfirmar?: () => void
  onEmitirNota?: () => void
  onImprimirPedido?: () => void
}

export function BotoesAcaoVenda({
  vendaId,
  status,
  bloqueado = false,
  carregando = false,
  onSalvar,
  onCancelar,
  onExcluir,
  onBloquear,
  onDesbloquear,
  onReabrir,
  onConfirmar,
  onEmitirNota,
  onImprimirPedido
}: BotoesAcaoVendaProps) {
  
  // Nova venda (criação)
  if (!vendaId) {
    return (
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onSalvar}
          disabled={carregando}
          className="px-8 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm transition-all"
        >
          {carregando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    )
  }

  // Venda existente - TODOS OS BOTÕES SEMPRE VISÍVEIS
  const isPedidoAberto = status === 'PEDIDO_ABERTO'
  const isPedidoFechado = status === 'PEDIDO_FECHADO'

  return (
    <div className="mt-4">
      {/* Indicador de Status */}
      <div className={`rounded-md px-3 py-2 mb-3 ${
        isPedidoAberto ? 'bg-yellow-50 border border-yellow-200' :
        isPedidoFechado ? 'bg-green-50 border border-green-200' :
        'bg-gray-50 border border-gray-200'
      }`}>
        <p className={`text-xs font-semibold ${
          isPedidoAberto ? 'text-yellow-800' :
          isPedidoFechado ? 'text-green-800' :
          'text-gray-800'
        }`}>
          {isPedidoAberto && '📋 Pedido em Aberto'}
          {isPedidoFechado && '✅ Pedido Fechado'}
          {!isPedidoAberto && !isPedidoFechado && `📄 ${status}`}
        </p>
      </div>
      
      {/* Botões de Ação - Organizados em Grid 2 linhas */}
      <div className="space-y-1.5">
        {/* Primeira linha: 4 botões */}
        <div className="grid grid-cols-2 gap-1.5">
          {/* Salvar - SUCCESS */}
          <button
            type="button"
            onClick={onSalvar}
            disabled={carregando || isPedidoFechado}
            className={`px-2 py-1.5 text-white text-xs font-semibold rounded-md hover:opacity-90 disabled:cursor-not-allowed shadow transition-all ${
              isPedidoFechado ? 'bg-gray-300' : 'bg-gradient-to-r from-green-400 to-green-600'
            }`}
            title={isPedidoFechado ? 'Não é possível salvar pedido fechado' : 'Salvar alterações'}
          >
            {carregando ? 'Salvando...' : 'Salvar'}
          </button>

          {/* Confirmar - DARK */}
          <button
            type="button"
            onClick={onConfirmar}
            disabled={!isPedidoAberto || carregando}
            className={`px-2 py-1.5 text-white text-xs font-semibold rounded-md hover:opacity-90 disabled:cursor-not-allowed shadow transition-all ${
              isPedidoAberto ? 'bg-gradient-to-r from-slate-700 to-slate-900' : 'bg-gray-300'
            }`}
            title={isPedidoAberto ? 'Confirmar pedido e movimentar estoque' : 'Disponível apenas para pedidos em aberto'}
          >
            Confirmar Pedido
          </button>

          {/* Reabrir - WARNING */}
          <button
            type="button"
            onClick={onReabrir}
            disabled={!isPedidoFechado || carregando}
            className={`px-2 py-1.5 text-white text-xs font-semibold rounded-md hover:opacity-90 disabled:cursor-not-allowed shadow transition-all ${
              isPedidoFechado ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gray-300'
            }`}
            title={isPedidoFechado ? 'Reabrir pedido e estornar estoque' : 'Disponível apenas para pedidos fechados'}
          >
            Reabrir
          </button>

          {/* Emitir Nota - DARK */}
          <button
            type="button"
            onClick={onEmitirNota}
            disabled={!isPedidoFechado || carregando}
            className={`px-2 py-1.5 text-white text-xs font-semibold rounded-md hover:opacity-90 disabled:cursor-not-allowed shadow transition-all ${
              isPedidoFechado ? 'bg-gradient-to-r from-slate-700 to-slate-900' : 'bg-gray-300'
            }`}
            title={isPedidoFechado ? 'Emitir nota fiscal para este pedido' : 'Disponível apenas para pedidos fechados'}
          >
            Emitir Nota
          </button>
        </div>

        {/* Segunda linha: 3 botões */}
        <div className="grid grid-cols-3 gap-1.5">
          {/* Imprimir - DARK */}
          <button
            type="button"
            onClick={onImprimirPedido}
            disabled={carregando}
            className="px-2 py-1.5 bg-gradient-to-r from-slate-700 to-slate-900 text-white text-xs font-semibold rounded-md hover:opacity-90 disabled:cursor-not-allowed shadow transition-all"
            title="Imprimir pedido em formato A4"
          >
            Imprimir
          </button>

          {/* Cancelar - WARNING */}
          <button
            type="button"
            onClick={onCancelar}
            disabled={isPedidoFechado || carregando}
            className={`px-2 py-1.5 text-white text-xs font-semibold rounded-md hover:opacity-90 disabled:cursor-not-allowed shadow transition-all ${
              isPedidoFechado ? 'bg-gray-300' : 'bg-gradient-to-r from-yellow-400 to-orange-500'
            }`}
            title={isPedidoFechado ? 'Não é possível cancelar pedido fechado' : 'Cancelar esta venda'}
          >
            Cancelar
          </button>

          {/* Excluir - DANGER */}
          <button
            type="button"
            onClick={onExcluir}
            disabled={isPedidoFechado || carregando}
            className={`px-2 py-1.5 text-white text-xs font-semibold rounded-md hover:opacity-90 disabled:cursor-not-allowed shadow transition-all ${
              isPedidoFechado ? 'bg-gray-300' : 'bg-gradient-to-r from-red-400 to-red-600'
            }`}
            title={isPedidoFechado ? 'Não é possível excluir pedido fechado' : 'Excluir venda permanentemente'}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

