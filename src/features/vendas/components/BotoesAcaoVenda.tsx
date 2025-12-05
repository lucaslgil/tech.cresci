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
}

export function BotoesAcaoVenda({
  vendaId,
  status,
  carregando = false,
  onSalvar,
  onCancelar,
  onExcluir,
  onReabrir,
  onConfirmar,
  onEmitirNota
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
      <div className={`rounded-md px-4 py-3 mb-3 ${
        isPedidoAberto ? 'bg-yellow-50 border border-yellow-200' :
        isPedidoFechado ? 'bg-green-50 border border-green-200' :
        'bg-gray-50 border border-gray-200'
      }`}>
        <p className={`text-sm font-semibold ${
          isPedidoAberto ? 'text-yellow-800' :
          isPedidoFechado ? 'text-green-800' :
          'text-gray-800'
        }`}>
          {isPedidoAberto && '📋 Pedido em Aberto'}
          {isPedidoFechado && '✅ Pedido Fechado'}
          {!isPedidoAberto && !isPedidoFechado && `📄 ${status}`}
        </p>
        <p className={`text-xs mt-1 ${
          isPedidoAberto ? 'text-yellow-600' :
          isPedidoFechado ? 'text-green-600' :
          'text-gray-600'
        }`}>
          {isPedidoAberto && 'Este pedido aguarda confirmação'}
          {isPedidoFechado && 'Movimentação de estoque efetuada'}
        </p>
      </div>
      
      {/* Botões de Ação - SEMPRE VISÍVEIS */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* Botão Salvar Alterações */}
        <button
          type="button"
          onClick={onSalvar}
          disabled={carregando || isPedidoFechado}
          className="px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm transition-all"
          title={isPedidoFechado ? 'Não é possível salvar pedido fechado' : 'Salvar alterações'}
        >
          {carregando ? 'Salvando...' : 'Salvar Alterações'}
        </button>

        {/* Botão Confirmar Pedido */}
        <button
          type="button"
          onClick={onConfirmar}
          disabled={!isPedidoAberto || carregando}
          style={{ backgroundColor: isPedidoAberto ? '#394353' : '#9ca3af' }}
          className="px-6 py-2.5 text-white text-sm font-semibold rounded-md hover:opacity-90 disabled:cursor-not-allowed shadow-sm transition-all"
          title={isPedidoAberto ? 'Confirmar pedido e movimentar estoque' : 'Disponível apenas para pedidos em aberto'}
        >
          Confirmar Pedido
        </button>

        {/* Botão Reabrir Pedido */}
        <button
          type="button"
          onClick={onReabrir}
          disabled={!isPedidoFechado || carregando}
          className="px-6 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-md hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm transition-all"
          title={isPedidoFechado ? 'Reabrir pedido e estornar estoque' : 'Disponível apenas para pedidos fechados'}
        >
          Reabrir Pedido
        </button>

        {/* Botão Emitir Nota Fiscal */}
        <button
          type="button"
          onClick={onEmitirNota}
          disabled={!isPedidoFechado || carregando}
          style={{ backgroundColor: isPedidoFechado ? '#394353' : '#9ca3af' }}
          className="px-6 py-2.5 text-white text-sm font-semibold rounded-md hover:opacity-90 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-2"
          title={isPedidoFechado ? 'Emitir nota fiscal para este pedido' : 'Disponível apenas para pedidos fechados'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Emitir Nota Fiscal
        </button>
        
        {/* Botão Cancelar Venda */}
        <button
          type="button"
          onClick={onCancelar}
          disabled={isPedidoFechado || carregando}
          className="px-6 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm transition-all"
          title={isPedidoFechado ? 'Não é possível cancelar pedido fechado' : 'Cancelar esta venda'}
        >
          Cancelar Venda
        </button>
        
        {/* Botão Excluir */}
        <button
          type="button"
          onClick={onExcluir}
          disabled={isPedidoFechado || carregando}
          className="px-6 py-2.5 bg-red-700 text-white text-sm font-semibold rounded-md hover:bg-red-800 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm transition-all"
          title={isPedidoFechado ? 'Não é possível excluir pedido fechado' : 'Excluir venda permanentemente'}
        >
          Excluir
        </button>
      </div>
    </div>
  )
}

