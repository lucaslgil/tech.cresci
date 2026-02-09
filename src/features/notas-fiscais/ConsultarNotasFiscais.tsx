// =====================================================
// CONSULTAR NOTAS FISCAIS - LISTAGEM COMPLETA
// Dashboard dinâmico + Filtros + Exportação
// Data: 26/01/2026
// =====================================================

import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  Filter, 
  Download, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Ban,
  Eye,
  Printer,
  Mail,
  TrendingUp,
  DollarSign,
  FileCheck,
  FileX,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  FileCode,
  File
} from 'lucide-react'
import { Toast } from '../../shared/components/Toast'
import type { NotaFiscal } from './types'
import { notasFiscaisService } from './notasFiscaisService'
import { NuvemFiscalClient } from '../../services/nfe/nuvemFiscalClient'
import ModalEditarNota from './ModalEditarNota'
import * as XLSX from 'xlsx'

interface ToastMessage {
  message: string
  type: 'success' | 'error' | 'warning'
}

interface DashboardData {
  total: number
  autorizadas: number
  canceladas: number
  rascunhos: number
  valorTotal: number
  valorMes: number
}

interface Filters {
  periodo: 'hoje' | '7dias' | '30dias' | '90dias' | 'custom'
  dataInicio: string
  dataFim: string
  status: string
  tipoNota: string
  cliente: string
  numero: string
}

// Status possíveis com cores e ícones
const STATUS_CONFIG = {
  AUTORIZADA: {
    label: 'Autorizada',
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200'
  },
  CANCELADA: {
    label: 'Cancelada',
    icon: Ban,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200'
  },
  RASCUNHO: {
    label: 'Rascunho',
    icon: Clock,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200'
  },
  PROCESSANDO: {
    label: 'Processando',
    icon: RefreshCw,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  REJEITADA: {
    label: 'Rejeitada',
    icon: XCircle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200'
  },
  DENEGADA: {
    label: 'Denegada',
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200'
  },
  INUTILIZADA: {
    label: 'Inutilizada',
    icon: Ban,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200'
  }
} as const

export const ConsultarNotasFiscais: React.FC = () => {
  // Estados principais
  const [notas, setNotas] = useState<NotaFiscal[]>([])
  const [notasFiltradas, setNotasFiltradas] = useState<NotaFiscal[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  
  // Dashboard
  const [dashboard, setDashboard] = useState<DashboardData>({
    total: 0,
    autorizadas: 0,
    canceladas: 0,
    rascunhos: 0,
    valorTotal: 0,
    valorMes: 0
  })
  
  // Filtros
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    periodo: '30dias',
    dataInicio: '',
    dataFim: '',
    status: '',
    tipoNota: '',
    cliente: '',
    numero: ''
  })
  
  // Ordenação
  const [sortConfig, setSortConfig] = useState<{
    key: keyof NotaFiscal
    direction: 'asc' | 'desc'
  }>({ key: 'data_emissao', direction: 'desc' })
  
  // Modal de detalhes
  const [notaSelecionada, setNotaSelecionada] = useState<NotaFiscal | null>(null)
  const [modalEditarAberto, setModalEditarAberto] = useState(false)
  const [notaIdEditar, setNotaIdEditar] = useState<number | null>(null)
  const [showDetalhes, setShowDetalhes] = useState(false)

  // Carregar notas ao montar
  useEffect(() => {
    fetchNotas()
  }, [])

  // Aplicar filtros quando notas ou filtros mudarem
  useEffect(() => {
    aplicarFiltros()
  }, [notas, filters])

  // Atualizar dashboard quando notas filtradas mudarem
  useEffect(() => {
    calcularDashboard()
  }, [notasFiltradas])

  // Buscar notas do banco
  const fetchNotas = async () => {
    setLoading(true)
    try {
      const data = await notasFiscaisService.listar()
      setNotas(data || [])
    } catch (error) {
      console.error('Erro ao buscar notas:', error)
      setToast({ message: 'Erro ao carregar notas fiscais', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Aplicar filtros
  const aplicarFiltros = () => {
    let resultado = [...notas]

    // Filtro de período
    if (filters.periodo !== 'custom') {
      const hoje = new Date()
      const dataLimite = new Date()
      
      switch (filters.periodo) {
        case 'hoje':
          dataLimite.setHours(0, 0, 0, 0)
          break
        case '7dias':
          dataLimite.setDate(hoje.getDate() - 7)
          break
        case '30dias':
          dataLimite.setDate(hoje.getDate() - 30)
          break
        case '90dias':
          dataLimite.setDate(hoje.getDate() - 90)
          break
      }
      
      resultado = resultado.filter(nota => 
        new Date(nota.data_emissao) >= dataLimite
      )
    } else {
      // Filtro de data customizado
      if (filters.dataInicio) {
        resultado = resultado.filter(nota => 
          new Date(nota.data_emissao) >= new Date(filters.dataInicio)
        )
      }
      if (filters.dataFim) {
        resultado = resultado.filter(nota => 
          new Date(nota.data_emissao) <= new Date(filters.dataFim)
        )
      }
    }

    // Filtro de status
    if (filters.status) {
      resultado = resultado.filter(nota => nota.status === filters.status)
    }

    // Filtro de tipo
    if (filters.tipoNota) {
      resultado = resultado.filter(nota => nota.tipo_nota === filters.tipoNota)
    }

    // Filtro de cliente
    if (filters.cliente) {
      const clienteBusca = filters.cliente.toLowerCase()
      resultado = resultado.filter(nota => 
        nota.destinatario_nome?.toLowerCase().includes(clienteBusca) ||
        nota.destinatario_cpf_cnpj?.includes(clienteBusca)
      )
    }

    // Filtro de número
    if (filters.numero) {
      resultado = resultado.filter(nota => 
        nota.numero.toString().includes(filters.numero)
      )
    }

    // Aplicar ordenação
    resultado.sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue
      }
      
      return 0
    })

    setNotasFiltradas(resultado)
  }

  // Calcular dashboard
  const calcularDashboard = () => {
    const total = notasFiltradas.length
    const autorizadas = notasFiltradas.filter(n => n.status === 'AUTORIZADA').length
    const canceladas = notasFiltradas.filter(n => n.status === 'CANCELADA').length
    const rascunhos = notasFiltradas.filter(n => n.status === 'RASCUNHO').length
    
    const valorTotal = notasFiltradas
      .filter(n => n.status === 'AUTORIZADA')
      .reduce((acc, n) => acc + (n.valor_total || 0), 0)
    
    // Valor do mês atual
    const mesAtual = new Date().getMonth()
    const anoAtual = new Date().getFullYear()
    const valorMes = notasFiltradas
      .filter(n => {
        const data = new Date(n.data_emissao)
        return n.status === 'AUTORIZADA' && 
               data.getMonth() === mesAtual && 
               data.getFullYear() === anoAtual
      })
      .reduce((acc, n) => acc + (n.valor_total || 0), 0)

    setDashboard({
      total,
      autorizadas,
      canceladas,
      rascunhos,
      valorTotal,
      valorMes
    })
  }

  // Limpar filtros
  const limparFiltros = () => {
    setFilters({
      periodo: '30dias',
      dataInicio: '',
      dataFim: '',
      status: '',
      tipoNota: '',
      cliente: '',
      numero: ''
    })
  }

  // Exportar para Excel
  const exportarExcel = () => {
    const dadosExportar = notasFiltradas.map(nota => ({
      Número: nota.numero,
      Série: nota.serie,
      Tipo: nota.tipo_nota,
      'Data Emissão': new Date(nota.data_emissao).toLocaleDateString('pt-BR'),
      Cliente: nota.destinatario_nome || '-',
      'CPF/CNPJ': nota.destinatario_cpf_cnpj || '-',
      'Valor Total': nota.valor_total,
      Status: nota.status,
      'Chave de Acesso': nota.chave_acesso || '-'
    }))

    const ws = XLSX.utils.json_to_sheet(dadosExportar)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Notas Fiscais')
    
    const dataAtual = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `notas_fiscais_${dataAtual}.xlsx`)
    
    setToast({ message: 'Relatório exportado com sucesso!', type: 'success' })
  }

  // Renderizar badge de status
  const renderStatusBadge = (status: NotaFiscal['status']) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.RASCUNHO
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} border ${config.border}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    )
  }

  // Alternar ordenação
  const handleSort = (key: keyof NotaFiscal) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Visualizar detalhes
  const handleVisualizarDetalhes = (nota: NotaFiscal) => {
    setNotaSelecionada(nota)
    setShowDetalhes(true)
  }

  // Excluir nota
  const handleExcluir = async (notaId: string | number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      await notasFiscaisService.excluir(notaId)
      setToast({ type: 'success', message: 'Nota fiscal excluída com sucesso!' })
      fetchNotas() // Recarregar lista
    } catch (error) {
      console.error('Erro ao excluir:', error)
      setToast({ type: 'error', message: 'Erro ao excluir nota fiscal' })
    }
  }

  // Editar nota fiscal (abre modal)
  const handleEditarNota = (nota: NotaFiscal) => {
    setNotaIdEditar(typeof nota.id === 'number' ? nota.id : parseInt(nota.id.toString()))
    setModalEditarAberto(true)
  }

  const handleFecharModalEditar = () => {
    setModalEditarAberto(false)
    setNotaIdEditar(null)
  }

  const handleSucessoEdicao = () => {
    fetchNotas() // Recarregar lista
    setToast({ type: 'success', message: '✅ Nota fiscal atualizada com sucesso!' })
  }

  // Baixar XML da nota fiscal
  const handleBaixarXML = async (nota: NotaFiscal) => {
    if (!nota.nuvem_fiscal_id) {
      setToast({ type: 'error', message: '❌ Nota não possui ID da Nuvem Fiscal' })
      return
    }

    try {
      // Usar credenciais do ambiente (.env)
      const clientId = import.meta.env.VITE_NUVEM_FISCAL_CLIENT_ID
      const clientSecret = import.meta.env.VITE_NUVEM_FISCAL_CLIENT_SECRET
      const ambiente = (import.meta.env.VITE_NUVEM_FISCAL_AMBIENTE || 'SANDBOX') as 'SANDBOX' | 'PRODUCAO'

      if (!clientId || !clientSecret) {
        setToast({ type: 'error', message: '❌ Credenciais Nuvem Fiscal não configuradas no sistema' })
        return
      }

      // Criar cliente Nuvem Fiscal
      const client = new NuvemFiscalClient({
        clientId,
        clientSecret,
        ambiente
      })

      // Baixar XML
      const xml = await client.baixarXML(nota.nuvem_fiscal_id)

      // Criar blob e trigger download
      const blob = new Blob([xml], { type: 'application/xml' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `NFe_${nota.numero}.xml`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setToast({ type: 'success', message: '✅ XML baixado com sucesso!' })
    } catch (error: any) {
      console.error('Erro ao baixar XML:', error)
      setToast({ type: 'error', message: error.message || '❌ Erro ao baixar XML' })
    }
  }

  // Baixar DANFE (PDF) da nota fiscal
  const handleBaixarDANFE = async (nota: NotaFiscal) => {
    if (!nota.nuvem_fiscal_id) {
      setToast({ type: 'error', message: '❌ Nota não possui ID da Nuvem Fiscal' })
      return
    }

    try {
      // Usar credenciais do ambiente (.env)
      const clientId = import.meta.env.VITE_NUVEM_FISCAL_CLIENT_ID
      const clientSecret = import.meta.env.VITE_NUVEM_FISCAL_CLIENT_SECRET
      const ambiente = (import.meta.env.VITE_NUVEM_FISCAL_AMBIENTE || 'SANDBOX') as 'SANDBOX' | 'PRODUCAO'

      if (!clientId || !clientSecret) {
        setToast({ type: 'error', message: '❌ Credenciais Nuvem Fiscal não configuradas no sistema' })
        return
      }

      // Criar cliente Nuvem Fiscal
      const client = new NuvemFiscalClient({
        clientId,
        clientSecret,
        ambiente
      })

      // Baixar PDF
      const blob = await client.baixarPDF(nota.nuvem_fiscal_id)

      // Trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `DANFE_${nota.numero}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setToast({ type: 'success', message: '✅ DANFE baixado com sucesso!' })
    } catch (error: any) {
      console.error('Erro ao baixar DANFE:', error)
      setToast({ type: 'error', message: error.message || '❌ Erro ao baixar DANFE' })
    }
  }

  // Cancelar nota autorizada (removido - agora é feito pelo modal)

  // Inutilizar numeração
  const handleInutilizar = async () => {
    const empresaId = prompt('ID da Empresa:')
    if (!empresaId) return

    const serie = prompt('Série da nota (ex: 1):')
    if (!serie) return

    const numeroInicial = prompt('Número inicial a inutilizar:')
    if (!numeroInicial) return

    const numeroFinal = prompt('Número final a inutilizar:')
    if (!numeroFinal) return

    const justificativa = prompt('Justificativa para inutilização (mínimo 15 caracteres):')
    if (!justificativa) return

    if (justificativa.length < 15) {
      setToast({ type: 'error', message: 'Justificativa deve ter no mínimo 15 caracteres' })
      return
    }

    if (parseInt(numeroInicial) > parseInt(numeroFinal)) {
      setToast({ type: 'error', message: 'Número inicial deve ser menor ou igual ao número final' })
      return
    }

    if (!window.confirm(`Confirma inutilização da numeração ${numeroInicial} a ${numeroFinal} da série ${serie}?`)) {
      return
    }

    try {
      // TODO: Implementar chamada à API Nuvem Fiscal para inutilização
      setToast({ type: 'warning', message: 'Funcionalidade de inutilização em desenvolvimento' })
      
      // EXEMPLO de como será:
      // const resultado = await nfeService.inutilizar({
      //   empresaId: parseInt(empresaId),
      //   serie,
      //   numeroInicial: parseInt(numeroInicial),
      //   numeroFinal: parseInt(numeroFinal),
      //   justificativa
      // })
      // if (resultado.status === 'INUTILIZADA') {
      //   setToast({ type: 'success', message: 'Numeração inutilizada com sucesso!' })
      // } else {
      //   setToast({ type: 'error', message: `Erro: ${resultado.mensagem}` })
      // }
    } catch (error) {
      console.error('Erro ao inutilizar:', error)
      setToast({ type: 'error', message: 'Erro ao inutilizar numeração' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Cabeçalho */}
      <div className="bg-white shadow rounded-lg mb-4">
        <div className="px-4 py-3" style={{borderBottom: '1px solid #C9C4B5'}}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" style={{color: '#394353'}} />
                Consultar Notas Fiscais
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                Visualize e gerencie todas as notas fiscais emitidas
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center justify-center px-4 py-2.5 border shadow-sm text-sm font-semibold rounded-md hover:bg-gray-50"
                style={{borderColor: '#C9C4B5', color: '#394353'}}
              >
                <Filter className="w-4 h-4 sm:mr-2" />
                <span className="sm:inline">Filtros</span>
              </button>
              
              <button
                onClick={exportarExcel}
                className="inline-flex items-center justify-center px-4 py-2.5 border shadow-sm text-sm font-semibold rounded-md hover:bg-gray-50"
                style={{borderColor: '#C9C4B5', color: '#394353'}}
              >
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="sm:inline">Exportar</span>
              </button>
              
              <button
                onClick={fetchNotas}
                className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-semibold rounded-md text-white hover:opacity-90"
                style={{backgroundColor: '#394353'}}
              >
                <RefreshCw className="w-4 h-4 sm:mr-2" />
                <span className="sm:inline">Atualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard - Cards de Resumo */}
        <div className="p-4" style={{borderBottom: '1px solid #C9C4B5'}}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total de Notas */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border" style={{borderColor: '#C9C4B5'}}>
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">{dashboard.total}</p>
              <p className="text-xs text-blue-700 font-medium">Total de Notas</p>
            </div>

            {/* Autorizadas */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border" style={{borderColor: '#C9C4B5'}}>
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <FileCheck className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">{dashboard.autorizadas}</p>
              <p className="text-xs text-green-700 font-medium">Autorizadas</p>
            </div>

            {/* Canceladas */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 border" style={{borderColor: '#C9C4B5'}}>
              <div className="flex items-center justify-between mb-2">
                <Ban className="w-5 h-5 text-red-600" />
                <FileX className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-900">{dashboard.canceladas}</p>
              <p className="text-xs text-red-700 font-medium">Canceladas</p>
            </div>

            {/* Rascunhos */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border" style={{borderColor: '#C9C4B5'}}>
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{dashboard.rascunhos}</p>
              <p className="text-xs text-gray-700 font-medium">Rascunhos</p>
            </div>

            {/* Valor Total */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border" style={{borderColor: '#C9C4B5'}}>
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-xl font-bold text-purple-900">
                {dashboard.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-purple-700 font-medium">Valor Total</p>
            </div>

            {/* Valor do Mês */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 border" style={{borderColor: '#C9C4B5'}}>
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-xl font-bold text-amber-900">
                {dashboard.valorMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-amber-700 font-medium">Mês Atual</p>
            </div>
          </div>
        </div>

        {/* Filtros Avançados */}
        {showFilters && (
          <div className="p-4 bg-gray-50" style={{borderBottom: '1px solid #C9C4B5'}}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Período */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Período
                </label>
                <select
                  value={filters.periodo}
                  onChange={(e) => setFilters(prev => ({ ...prev, periodo: e.target.value as any }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-opacity-50"
                  style={{borderColor: '#C9C4B5'}}
                >
                  <option value="hoje">Hoje</option>
                  <option value="7dias">Últimos 7 dias</option>
                  <option value="30dias">Últimos 30 dias</option>
                  <option value="90dias">Últimos 90 dias</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              {/* Data Início (se período custom) */}
              {filters.periodo === 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={filters.dataInicio}
                    onChange={(e) => setFilters(prev => ({ ...prev, dataInicio: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    style={{borderColor: '#C9C4B5'}}
                  />
                </div>
              )}

              {/* Data Fim (se período custom) */}
              {filters.periodo === 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={filters.dataFim}
                    onChange={(e) => setFilters(prev => ({ ...prev, dataFim: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    style={{borderColor: '#C9C4B5'}}
                  />
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  style={{borderColor: '#C9C4B5'}}
                >
                  <option value="">Todos</option>
                  <option value="AUTORIZADA">Autorizada</option>
                  <option value="CANCELADA">Cancelada</option>
                  <option value="RASCUNHO">Rascunho</option>
                  <option value="PROCESSANDO">Processando</option>
                  <option value="REJEITADA">Rejeitada</option>
                  <option value="DENEGADA">Denegada</option>
                </select>
              </div>

              {/* Tipo de Nota */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tipo de Nota
                </label>
                <select
                  value={filters.tipoNota}
                  onChange={(e) => setFilters(prev => ({ ...prev, tipoNota: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  style={{borderColor: '#C9C4B5'}}
                >
                  <option value="">Todos</option>
                  <option value="NFE">NF-e (Modelo 55)</option>
                  <option value="NFCE">NFC-e (Modelo 65)</option>
                </select>
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <input
                  type="text"
                  value={filters.cliente}
                  onChange={(e) => setFilters(prev => ({ ...prev, cliente: e.target.value }))}
                  placeholder="Nome ou CPF/CNPJ"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  style={{borderColor: '#C9C4B5'}}
                />
              </div>

              {/* Número */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  value={filters.numero}
                  onChange={(e) => setFilters(prev => ({ ...prev, numero: e.target.value }))}
                  placeholder="Nº da Nota"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  style={{borderColor: '#C9C4B5'}}
                />
              </div>
            </div>

            {/* Botões de ação dos filtros */}
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={limparFiltros}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Limpar Filtros
              </button>
              <button
                onClick={handleInutilizar}
                className="px-4 py-2 text-sm font-semibold rounded-md hover:opacity-90 bg-orange-600 text-white flex items-center gap-2"
                title="Inutilizar Numeração"
              >
                <Ban className="w-4 h-4" />
                Inutilizar Numeração
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Notas */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin" style={{color: '#394353'}} />
              <span className="ml-3 text-sm text-gray-600">Carregando notas fiscais...</span>
            </div>
          ) : notasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileX className="w-16 h-16 text-gray-300 mb-3" />
              <p className="text-sm text-gray-600">Nenhuma nota fiscal encontrada</p>
              <p className="text-xs text-gray-500 mt-1">Tente ajustar os filtros ou emitir uma nova nota</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead style={{backgroundColor: '#394353'}}>
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-opacity-90"
                    onClick={() => handleSort('numero')}
                  >
                    <div className="flex items-center gap-1">
                      Número
                      {sortConfig.key === 'numero' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Tipo
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-opacity-90"
                    onClick={() => handleSort('data_emissao')}
                  >
                    <div className="flex items-center gap-1">
                      Data Emissão
                      {sortConfig.key === 'data_emissao' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Cliente
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-opacity-90"
                    onClick={() => handleSort('valor_total')}
                  >
                    <div className="flex items-center gap-1">
                      Valor Total
                      {sortConfig.key === 'valor_total' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                    Documentos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notasFiltradas.map((nota) => (
                  <tr key={nota.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {nota.numero.toString().padStart(9, '0')}
                      </div>
                      <div className="text-xs text-gray-500">Série: {nota.serie}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        nota.tipo_nota === 'NFE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {nota.tipo_nota === 'NFE' ? 'NF-e' : 'NFC-e'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {new Date(nota.data_emissao).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(nota.data_emissao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-gray-900 max-w-xs truncate">
                        {nota.destinatario_nome || '-'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {nota.destinatario_cpf_cnpj || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs font-semibold text-gray-900">
                        {nota.valor_total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {renderStatusBadge(nota.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {(nota.status === 'AUTORIZADA' || nota.status === 'CANCELADA') && nota.nuvem_fiscal_id ? (
                          <>
                            <button
                              onClick={() => handleBaixarXML(nota)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Baixar XML"
                            >
                              <FileCode className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleBaixarDANFE(nota)}
                              className="text-red-600 hover:text-red-900"
                              title="Baixar DANFE (PDF)"
                            >
                              <File className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleVisualizarDetalhes(nota)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {/* Editar nota (rejeitada, rascunho ou autorizada) */}
                        {(nota.status === 'REJEITADA' || nota.status === 'RASCUNHO' || nota.status === 'AUTORIZADA') && (
                          <button
                            onClick={() => handleEditarNota(nota)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar Nota"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => window.open(`/notas-fiscais/${nota.id}/imprimir`, '_blank')}
                          className="text-gray-600 hover:text-gray-900"
                          title="Imprimir"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {/* enviar email */}}
                          className="text-green-600 hover:text-green-900"
                          title="Enviar por Email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        
                        {nota.status === 'RASCUNHO' && (
                          <button
                            onClick={() => handleExcluir(nota.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Detalhes (simplificado) */}
      {showDetalhes && notaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b" style={{borderColor: '#C9C4B5'}}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  Detalhes da Nota Fiscal #{notaSelecionada.numero}
                </h2>
                <button
                  onClick={() => setShowDetalhes(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <div className="mt-1">{renderStatusBadge(notaSelecionada.status)}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Tipo</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {notaSelecionada.tipo_nota === 'NFE' ? 'NF-e (Modelo 55)' : 'NFC-e (Modelo 65)'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Data de Emissão</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {new Date(notaSelecionada.data_emissao).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Valor Total</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {notaSelecionada.valor_total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500">Cliente</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {notaSelecionada.destinatario_nome || '-'}
                  </p>
                  <p className="text-xs text-gray-500">{notaSelecionada.destinatario_cpf_cnpj || '-'}</p>
                </div>
                {notaSelecionada.chave_acesso && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500">Chave de Acesso</label>
                    <p className="text-xs font-mono text-gray-900 mt-1 break-all">
                      {notaSelecionada.chave_acesso}
                    </p>
                  </div>
                )}
                
                {/* Informações de rejeição */}
                {notaSelecionada.status === 'REJEITADA' && notaSelecionada.motivo_status && (
                  <div className="col-span-2">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-red-900 mb-1">
                            Rejeição #{notaSelecionada.codigo_status_sefaz}
                          </h4>
                          <p className="text-sm text-red-800">
                            {notaSelecionada.motivo_status}
                          </p>
                          <div className="mt-3">
                            <button
                              onClick={() => {
                                setShowDetalhes(false)
                                handleEditarNota(notaSelecionada)
                              }}
                              className="px-4 py-2 text-sm font-semibold rounded-md hover:opacity-90 flex items-center gap-2"
                              style={{ backgroundColor: '#394353', color: 'white' }}
                            >
                              <Eye className="w-4 h-4" />
                              Visualizar/Editar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-between gap-3" style={{borderColor: '#C9C4B5'}}>
              <div className="flex gap-2">
                {/* Botão de editar para notas rejeitadas */}
                {notaSelecionada.status === 'REJEITADA' && (
                  <button
                    onClick={() => {
                      setShowDetalhes(false)
                      handleEditarNota(notaSelecionada)
                    }}
                    className="px-4 py-2 text-sm font-semibold rounded-md hover:opacity-90"
                    style={{ backgroundColor: '#394353', color: 'white' }}
                  >
                    <Eye className="w-4 h-4 inline mr-2" />
                    Visualizar/Editar
                  </button>
                )}
                
                {/* Botão para abrir modal de notas autorizadas (com cancelamento) */}
                {notaSelecionada.status === 'AUTORIZADA' && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetalhes(false)
                        handleEditarNota(notaSelecionada)
                      }}
                      className="px-4 py-2 text-sm font-semibold rounded-md hover:opacity-90"
                      style={{ backgroundColor: '#394353', color: 'white' }}
                    >
                      <Eye className="w-4 h-4 inline mr-2" />
                      Visualizar/Cancelar
                    </button>
                    <button
                      onClick={() => window.open(`/notas-fiscais/${notaSelecionada.id}/imprimir`, '_blank')}
                      className="px-4 py-2 text-sm font-semibold rounded-md hover:opacity-90 bg-gray-600 text-white"
                    >
                      <Printer className="w-4 h-4 inline mr-2" />
                      Imprimir
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setShowDetalhes(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal de Edição */}
      {modalEditarAberto && notaIdEditar && (
        <ModalEditarNota
          notaId={notaIdEditar}
          onClose={handleFecharModalEditar}
          onSucesso={handleSucessoEdicao}
        />
      )}
    </div>
  )
}
