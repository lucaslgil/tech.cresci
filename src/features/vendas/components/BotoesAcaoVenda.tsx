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
      
      {/* Botões de Ação - Organizados em Grid */}
      <div className="space-y-2">
        {/* Linha 1: Ações Principais */}
        <button
          type="button"
          onClick={onSalvar}
          disabled={carregando || isPedidoFechado}
          className="w-full px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm transition-all"
          title={isPedidoFechado ? 'Não é possível salvar pedido fechado' : 'Salvar alterações'}
        >
          {carregando ? 'Salvando...' : 'Salvar Alterações'}
        </button>

        <button
          type="button"
          onClick={onConfirmar}
          disabled={!isPedidoAberto || carregando}
          style={{ backgroundColor: isPedidoAberto ? '#394353' : '#9ca3af' }}
          className="w-full px-3 py-2 text-white text-xs font-semibold rounded-md hover:opacity-90 disabled:cursor-not-allowed shadow-sm transition-all"
          title={isPedidoAberto ? 'Confirmar pedido e movimentar estoque' : 'Disponível apenas para pedidos em aberto'}
        >
          Confirmar Pedido
        </button>

        <button
          type="button"
          onClick={onReabrir}
          disabled={!isPedidoFechado || carregando}
          className="w-full px-3 py-2 bg-orange-500 text-white text-xs font-semibold rounded-md hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm transition-all"
          title={isPedidoFechado ? 'Reabrir pedido e estornar estoque' : 'Disponível apenas para pedidos fechados'}
        >
          Reabrir Pedido
        </button>

        {/* Linha 2: Documentos */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onEmitirNota}
            disabled={!isPedidoFechado || carregando}
            style={{ backgroundColor: isPedidoFechado ? '#394353' : '#9ca3af' }}
            className="px-2 py-2 text-white text-xs font-semibold rounded-md hover:opacity-90 disabled:cursor-not-allowed shadow-sm transition-all flex items-center justify-center gap-1"
            title={isPedidoFechado ? 'Emitir nota fiscal para este pedido' : 'Disponível apenas para pedidos fechados'}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Emitir</span> Nota
          </button>

          <button
            type="button"
            onClick={onImprimirPedido}
            disabled={carregando}
            style={{ backgroundColor: '#394353' }}
            className="px-2 py-2 text-white text-xs font-semibold rounded-md hover:opacity-90 disabled:cursor-not-allowed shadow-sm transition-all flex items-center justify-center gap-1"
            title="Imprimir pedido em formato A4"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </button>
        </div>
        
        {/* Linha 3: Ações Destrutivas */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={isPedidoFechado || carregando}
            className="px-2 py-2 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm transition-all"
            title={isPedidoFechado ? 'Não é possível cancelar pedido fechado' : 'Cancelar esta venda'}
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={onExcluir}
            disabled={isPedidoFechado || carregando}
            className="px-2 py-2 bg-red-700 text-white text-xs font-semibold rounded-md hover:bg-red-800 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm transition-all"
            title={isPedidoFechado ? 'Não é possível excluir pedido fechado' : 'Excluir venda permanentemente'}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

