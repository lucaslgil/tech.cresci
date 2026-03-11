import React, { useState } from 'react'
import { ModalNotificacaoInadimplencia } from './ModalNotificacaoInadimplencia'
import { DashboardInadimplencia } from './DashboardInadimplencia'
import type { TipoNotificacao } from './notificacaoService'

export const ControleInadimplencia: React.FC = () => {
  const [modalAberto, setModalAberto] = useState(false)
  const [tipoNotificacao, setTipoNotificacao] = useState<TipoNotificacao>('fundo_propaganda')
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0)

  const abrirModal = (tipo: TipoNotificacao) => {
    setTipoNotificacao(tipo)
    setModalAberto(true)
  }

  const handleSalvo = () => {
    setDashboardRefreshKey(k => k + 1)
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Controle Inadimplência</h1>
          <p className="text-sm text-gray-600 mt-1">Painel inicial — ações rápidas de inadimplência.</p>
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            className="text-left p-4 bg-white rounded-lg border border-[#C9C4B5] hover:shadow-md hover:border-[#394353] transition-all"
            onClick={() => abrirModal('fundo_propaganda')}
          >
            <div className="text-sm font-semibold text-gray-800">+ Notificação — Fundo de Propaganda</div>
            <div className="text-xs text-gray-500 mt-0.5">Emitir 1ª Advertência por inadimplência de Fundo de Propaganda</div>
          </button>

          <button
            className="text-left p-4 bg-white rounded-lg border border-[#C9C4B5] hover:shadow-md hover:border-[#394353] transition-all"
            onClick={() => abrirModal('royalties')}
          >
            <div className="text-sm font-semibold text-gray-800">+ Notificação — Royalties</div>
            <div className="text-xs text-gray-500 mt-0.5">Emitir 1ª Advertência por inadimplência de Royalties</div>
          </button>

          <button
            className="text-left p-4 bg-white rounded-lg border border-gray-200 opacity-50 cursor-not-allowed"
            disabled
          >
            <div className="text-sm font-semibold text-gray-800">+ Notificação — Taxa de Franquia</div>
            <div className="text-xs text-gray-500 mt-0.5">Em breve</div>
          </button>
        </div>

        {/* Dashboard de notificações */}
        <DashboardInadimplencia refreshKey={dashboardRefreshKey} />
      </div>

      <ModalNotificacaoInadimplencia
        tipo={tipoNotificacao}
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvo={handleSalvo}
      />
    </div>
  )
}

export default ControleInadimplencia
