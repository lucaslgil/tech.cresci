// =====================================================
// COMPONENTE - REGRAS DE TRIBUTAÇÃO
// Baseado nos prints fornecidos pelo usuário
// Modal único com todas as seções de impostos
// Data: 02/12/2025
// =====================================================

import { useState, useEffect, useRef } from 'react'
import { regrasTributacaoService, type RegraTributacao } from './regrasTributacaoService'
import { ncmService, cfopService, operacoesFiscaisService } from '../cadastros-fiscais/services'
import type { NCM, CFOP, OperacaoFiscal } from '../cadastros-fiscais/types'
import { supabase } from '../../lib/supabase'

// =====================================================
// FUNÇÕES AUXILIARES PARA ALÍQUOTAS
// Aceita vírgula na entrada (padrão BR)
// Converte para ponto no armazenamento (padrão XML NF-e)
// =====================================================

/**
 * Converte número do banco para string com vírgula (apenas para inicialização)
 */
const valorParaString = (valor: number | undefined): string => {
  if (valor === undefined || valor === null || isNaN(valor)) return ''
  return valor.toString().replace('.', ',')
}

/**
 * Converte string com vírgula para número (para salvar no banco)
 */
const stringParaNumero = (valor: string): number | undefined => {
  if (!valor || valor.trim() === '') return undefined
  const valorNormalizado = valor.replace(',', '.')
  const numero = parseFloat(valorNormalizado)
  return isNaN(numero) ? undefined : numero
}

interface Empresa {
  id: number
  codigo: string
  razao_social: string
  nome_fantasia: string
  cnpj: string
}

interface Props {
  empresaId: number
}

export default function RegrasTributacao({ empresaId }: Props) {
  const [regras, setRegras] = useState<RegraTributacao[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [regraSelecionada, setRegraSelecionada] = useState<RegraTributacao | null>(null)
  const [toastMsg, setToastMsg] = useState<{ tipo: 'success' | 'error'; msg: string } | null>(null)

  // Cadastros auxiliares
  const [ncmList, setNcmList] = useState<NCM[]>([])
  const [operacoesFiscais, setOperacoesFiscais] = useState<OperacaoFiscal[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loadingAuxiliares, setLoadingAuxiliares] = useState(false)
  // Autocomplete CFOP (pesquisa reduzida)
  const [saidaSearch, setSaidaSearch] = useState('')
  const [entradaSearch, setEntradaSearch] = useState('')
  const [saidaResults, setSaidaResults] = useState<CFOP[]>([])
  const [entradaResults, setEntradaResults] = useState<CFOP[]>([])
  const [showSaidaDropdown, setShowSaidaDropdown] = useState(false)
  const [showEntradaDropdown, setShowEntradaDropdown] = useState(false)
  const saidaDebounce = useRef<number | null>(null)
  const entradaDebounce = useRef<number | null>(null)

  const [formData, setFormData] = useState<RegraTributacao>({
    nome: '',
    empresa_id: empresaId
  })

  // Estados temporários para campos de alíquota (como string para permitir digitação com vírgula)
  const [valoresTemp, setValoresTemp] = useState<Record<string, string>>({})

  // Handler para campos de alíquota - permite digitação livre com vírgula
  const handleAliquotaChange = (campo: string, valor: string) => {
    // Permite apenas números, vírgula e ponto
    const valorLimpo = valor.replace(/[^\d,\.]/g, '')
    
    // Bloqueia mais de um separador
    const separadores = (valorLimpo.match(/[,\.]/g) || []).length
    if (separadores > 1) return
    
    // Bloqueia mais de 4 casas decimais
    const partes = valorLimpo.split(/[,\.]/)
    if (partes.length === 2 && partes[1].length > 4) return
    
    // Atualiza valor temporário (string)
    setValoresTemp(prev => ({ ...prev, [campo]: valorLimpo }))
    
    // Atualiza formData (número)
    setFormData(prev => ({  
      ...prev,
      [campo]: stringParaNumero(valorLimpo)
    }))
  }

  useEffect(() => {
    carregarRegras()
    carregarCadastrosAuxiliares()
  }, [empresaId])

  const carregarRegras = async () => {
    setLoading(true)
    const { data, error } = await regrasTributacaoService.listar(empresaId)
    
    if (error) {
      setToastMsg({ tipo: 'error', msg: 'Erro ao carregar regras de tributação' })
      console.error(error)
    } else {
      setRegras(data || [])
    }
    
    setLoading(false)
  }

  const carregarCadastrosAuxiliares = async () => {
    setLoadingAuxiliares(true)
    try {
      // Carregar NCMs ativos
      const ncms = await ncmService.listar({ ativo: true })
      setNcmList(ncms)

      // Carregar CFOPs ativos
      // const cfops = await cfopService.listar({ ativo: true })
      // Removido temporariamente

      // Carregar Operações Fiscais ativas
      const operacoes = await operacoesFiscaisService.listar({ ativo: true })

      // Carregar Empresas ativas
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresas')
        .select('id, codigo, razao_social, nome_fantasia, cnpj')
        .eq('ativo', true)
        .order('razao_social')

      if (empresasError) {
        console.error('Erro ao carregar empresas:', empresasError)
      } else {
        setEmpresas(empresasData || [])
      }
      setOperacoesFiscais(operacoes)
    } catch (error) {
      console.error('Erro ao carregar cadastros auxiliares:', error)
    } finally {
      setLoadingAuxiliares(false)
    }
  }

  const searchCfop = async (term: string, tipoPrefix: '5' | '6') => {
    try {
      if (!term) {
        // show top results filtered by prefix
        const list = await cfopService.listar({ ativo: true })
        return list.filter(c => c.codigo.startsWith(tipoPrefix))
      }
      const list = await cfopService.listar({ busca: term, ativo: true })
      return list.filter(c => c.codigo.startsWith(tipoPrefix))
    } catch (error) {
      return []
    }
  }

  const handleSaidaInput = (val: string) => {
    setSaidaSearch(val)
    setShowSaidaDropdown(true)
    if (saidaDebounce.current) clearTimeout(saidaDebounce.current)
    saidaDebounce.current = window.setTimeout(async () => {
      const res = await searchCfop(val, '5')
      setSaidaResults(res.slice(0, 8))
    }, 250)
  }

  const handleEntradaInput = (val: string) => {
    setEntradaSearch(val)
    setShowEntradaDropdown(true)
    if (entradaDebounce.current) clearTimeout(entradaDebounce.current)
    entradaDebounce.current = window.setTimeout(async () => {
      const res = await searchCfop(val, '6')
      setEntradaResults(res.slice(0, 8))
    }, 250)
  }

  const selectSaida = (cfop: CFOP) => {
    setFormData({ ...formData, cfop_saida: cfop.codigo })
    setSaidaSearch(`${cfop.codigo} - ${cfop.descricao}`)
    setShowSaidaDropdown(false)
  }

  const selectEntrada = (cfop: CFOP) => {
    setFormData({ ...formData, cfop_entrada: cfop.codigo })
    setEntradaSearch(`${cfop.codigo} - ${cfop.descricao}`)
    setShowEntradaDropdown(false)
  }

  const abrirModalNovo = () => {
    setRegraSelecionada(null)
    setFormData({
      nome: '',
      empresa_id: empresaId,
      origem_mercadoria: '0'
    })
    setValoresTemp({}) // Limpar valores temporários
    setSaidaSearch('')
    setEntradaSearch('')
    setModalAberto(true)
  }

  const abrirModalEditar = (regra: RegraTributacao) => {
    setRegraSelecionada(regra)
    setFormData(regra)
    
    // Inicializar valores temporários com os valores existentes
    setValoresTemp({
      aliquota_icms: valorParaString(regra.aliquota_icms),
      reducao_bc_icms: valorParaString(regra.reducao_bc_icms),
      aliquota_icms_proprio: valorParaString(regra.aliquota_icms_proprio),
      aliquota_fcp: valorParaString(regra.aliquota_fcp),
      reducao_bc_icms_proprio: valorParaString(regra.reducao_bc_icms_proprio),
      mva_st: valorParaString(regra.mva_st),
      aliquota_icms_st: valorParaString(regra.aliquota_icms_st),
      aliquota_fcp_st: valorParaString(regra.aliquota_fcp_st),
      reducao_bc_st: valorParaString(regra.reducao_bc_st),
      aliquota_pis: valorParaString(regra.aliquota_pis),
      aliquota_cofins: valorParaString(regra.aliquota_cofins),
      aliquota_ipi: valorParaString(regra.aliquota_ipi),
      reducao_bc_ipi: valorParaString(regra.reducao_bc_ipi),
      aliquota_ibs: valorParaString(regra.aliquota_ibs),
      aliquota_cbs: valorParaString(regra.aliquota_cbs),
    })
    
    setSaidaSearch(regra.cfop_saida ? `${regra.cfop_saida}` : '')
    setEntradaSearch(regra.cfop_entrada ? `${regra.cfop_entrada}` : '')
    setModalAberto(true)
  }

  const salvarRegra = async () => {
    if (!formData.nome) {
      setToastMsg({ tipo: 'error', msg: 'O nome da regra é obrigatório' })
      return
    }

    try {
      if (regraSelecionada?.id) {
        const { error } = await regrasTributacaoService.atualizar(regraSelecionada.id, formData)
        
        if (error) {
          setToastMsg({ tipo: 'error', msg: 'Erro ao atualizar regra' })
          console.error(error)
          return
        }
        
        setToastMsg({ tipo: 'success', msg: 'Regra atualizada com sucesso!' })
      } else {
        const { error } = await regrasTributacaoService.criar(formData)
        
        if (error) {
          setToastMsg({ tipo: 'error', msg: 'Erro ao criar regra' })
          console.error(error)
          return
        }
        
        setToastMsg({ tipo: 'success', msg: 'Regra criada com sucesso!' })
      }

      setModalAberto(false)
      carregarRegras()
    } catch (error) {
      setToastMsg({ tipo: 'error', msg: 'Erro ao salvar regra' })
      console.error(error)
    }
  }

  const deletarRegra = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta regra?')) {
      return
    }

    const { error } = await regrasTributacaoService.deletar(id)
    
    if (error) {
      setToastMsg({ tipo: 'error', msg: 'Erro ao excluir regra' })
      console.error(error)
      return
    }

    setToastMsg({ tipo: 'success', msg: 'Regra excluída com sucesso!' })
    carregarRegras()
  }

  if (loading) {
    return <div className="text-center py-8">Carregando regras...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Regras de Tributação</h2>
          <p className="text-sm text-slate-600 mt-1">
            Configure as regras tributárias por NCM, categoria ou operação fiscal
          </p>
        </div>
        <button
          onClick={abrirModalNovo}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Regra
        </button>
      </div>

      {/* Listagem de Regras */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {regras.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-lg mb-2">Nenhuma regra cadastrada</p>
            <p className="text-sm">Clique em "Nova Regra" para criar a primeira regra de tributação</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">NCM</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">CFOP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">ICMS</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">PIS</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">COFINS</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {regras.map((regra) => (
                <tr key={regra.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{regra.ncm || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{regra.nome}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{regra.cfop_saida || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {regra.csosn_icms && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        CSOSN {regra.csosn_icms}
                      </span>
                    )}
                    {regra.cst_icms && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        CST {regra.cst_icms}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {regra.cst_pis && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {regra.cst_pis}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {regra.cst_cofins && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {regra.cst_cofins}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => abrirModalEditar(regra)}
                      className="text-blue-600 hover:text-blue-800 mr-3 text-sm font-medium"
                    >
                      Detalhes / Alterações
                    </button>
                    <button 
                      onClick={() => regra.id && deletarRegra(regra.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">Como funcionam as Regras de Tributação</h3>
        <p className="text-sm text-yellow-800">
          As regras de tributação definem automaticamente os impostos para produtos com o NCM especificado.
          Você pode criar regras por NCM, categoria de produto ou operação fiscal (CFOP).
          Estas configurações serão aplicadas automaticamente na emissão de notas fiscais.
        </p>
      </div>

      {/* Modal - Baseado nos prints */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-6xl my-8 max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800">
                Alteração de impostos
              </h2>
              <button
                onClick={() => setModalAberto(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Dados Principais - Conforme print */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Operação Fiscal
                  </label>
                  <select 
                    value={formData.operacao_fiscal || ''}
                    onChange={(e) => setFormData({ ...formData, operacao_fiscal: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                    disabled={loadingAuxiliares}
                  >
                    <option value="">{loadingAuxiliares ? 'Carregando...' : 'Selecione uma operação fiscal'}</option>
                    {operacoesFiscais.map((op) => (
                      <option key={op.id} value={op.codigo}>
                        {op.codigo} - {op.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Unidade emissora <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={formData.unidade_emissora || ''}
                    onChange={(e) => setFormData({ ...formData, unidade_emissora: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                    disabled={loadingAuxiliares}
                    required
                  >
                    <option value="">{loadingAuxiliares ? 'Carregando empresas...' : 'Selecione a empresa emissora'}</option>
                    {empresas.map((empresa) => (
                      <option key={empresa.id} value={empresa.id.toString()}>
                        {empresa.nome_fantasia || empresa.razao_social} - {empresa.cnpj}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Empresa que emitirá a NF-e desta regra
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tipo de contribuinte
                  </label>
                  <select 
                    value={formData.tipo_contribuinte || ''}
                    onChange={(e) => setFormData({ ...formData, tipo_contribuinte: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                  >
                    <option>Contribuinte - RJ</option>
                    <option>Contribuinte - SP</option>
                    <option>Não Contribuinte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Origem da Mercadoria
                  </label>
                  <select 
                    value={formData.origem_mercadoria || '0'}
                    onChange={(e) => setFormData({ ...formData, origem_mercadoria: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                  >
                    <option value="0">Nacional</option>
                    <option value="1">Estrangeira - Importação direta</option>
                    <option value="2">Estrangeira - Adquirida no mercado interno</option>
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    CFOP dentro da mesma UF da Unidade emissora da NF
                  </label>
                  <input
                    type="text"
                    value={saidaSearch || formData.cfop_saida || ''}
                    onChange={(e) => handleSaidaInput(e.target.value)}
                    onFocus={async () => {
                      setShowSaidaDropdown(true)
                      const res = await searchCfop(saidaSearch, '5')
                      setSaidaResults(res.slice(0, 8))
                    }}
                    onBlur={() => setTimeout(() => setShowSaidaDropdown(false), 150)}
                    placeholder={loadingAuxiliares ? 'Carregando...' : 'Digite código ou descrição e selecione'}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                    disabled={loadingAuxiliares}
                  />
                  {showSaidaDropdown && saidaResults.length > 0 && (
                    <ul className="absolute z-50 mt-1 left-0 right-0 bg-white border border-slate-200 rounded shadow max-h-52 overflow-auto text-sm">
                      {saidaResults.map((c) => (
                        <li key={c.id} className="px-3 py-2 hover:bg-slate-50 cursor-pointer" onMouseDown={(e) => { e.preventDefault(); selectSaida(c); }}>
                          <strong className="font-mono mr-2">{c.codigo}</strong>
                          <span className="text-slate-700">{c.descricao}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    CFOP fora da UF da Unidade emissora da NF
                  </label>
                  <input
                    type="text"
                    value={entradaSearch || formData.cfop_entrada || ''}
                    onChange={(e) => handleEntradaInput(e.target.value)}
                    onFocus={async () => {
                      setShowEntradaDropdown(true)
                      const res = await searchCfop(entradaSearch, '6')
                      setEntradaResults(res.slice(0, 8))
                    }}
                    onBlur={() => setTimeout(() => setShowEntradaDropdown(false), 150)}
                    placeholder={loadingAuxiliares ? 'Carregando...' : 'Digite código ou descrição e selecione'}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                    disabled={loadingAuxiliares}
                  />
                  {showEntradaDropdown && entradaResults.length > 0 && (
                    <ul className="absolute z-50 mt-1 left-0 right-0 bg-white border border-slate-200 rounded shadow max-h-52 overflow-auto text-sm">
                      {entradaResults.map((c) => (
                        <li key={c.id} className="px-3 py-2 hover:bg-slate-50 cursor-pointer" onMouseDown={(e) => { e.preventDefault(); selectEntrada(c); }}>
                          <strong className="font-mono mr-2">{c.codigo}</strong>
                          <span className="text-slate-700">{c.descricao}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    NFS-e → Código de Tributação do Município
                  </label>
                  <input 
                    type="text"
                    value={formData.codigo_tributacao_municipio || ''}
                    onChange={(e) => setFormData({ ...formData, codigo_tributacao_municipio: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    NFS-e → Item Lista Serviço
                  </label>
                  <input 
                    type="text"
                    value={formData.item_lista_servico || ''}
                    onChange={(e) => setFormData({ ...formData, item_lista_servico: e.target.value })}
                    placeholder="Código Item Lista Serviço"
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm" 
                  />
                </div>
              </div>
            </div>

            {/* Conteúdo Scrollável */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* IMPORTANTE - Conforme print */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  <strong>Importante:</strong> Preencha os dados fiscais conforme a legislação vigente. 
                  Estes dados serão utilizados na emissão de NF-e, NFC-e e outros documentos fiscais.
                </p>
              </div>

              {/* NCM e CEST */}
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      NCM *
                    </label>
                    <select
                      value={formData.ncm || ''}
                      onChange={(e) => setFormData({ ...formData, ncm: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                      disabled={loadingAuxiliares}
                    >
                      <option value="">{loadingAuxiliares ? 'Carregando...' : 'Selecione um NCM'}</option>
                      {ncmList.map((ncm) => (
                        <option key={ncm.id} value={ncm.codigo}>
                          {ncm.codigo} - {ncm.descricao}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Selecione o NCM da lista de cadastros</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      CEST
                    </label>
                    <input
                      type="text"
                      value={formData.cest || ''}
                      onChange={(e) => setFormData({ ...formData, cest: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                      placeholder="7 dígitos"
                      maxLength={7}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nome da Regra *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                      placeholder="Ex: FCP - Todos os itens com esse NCM"
                    />
                  </div>
                </div>
              </div>

              {/* ICMS - Conforme print */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3 text-sm">ICMS</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      CSOSN (Simples Nacional)
                    </label>
                    <select
                      value={formData.csosn_icms || ''}
                      onChange={(e) => setFormData({ ...formData, csosn_icms: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white"
                    >
                      <option value="">Selecione</option>
                      <option value="101">101 - Tributada pelo Simples Nacional com permissão de crédito</option>
                      <option value="102">102 - Tributada pelo Simples Nacional sem permissão de crédito</option>
                      <option value="103">103 - Isenção do ICMS no Simples Nacional para faixa de receita bruta</option>
                      <option value="201">201 - Tributada pelo Simples Nacional com permissão de crédito e com cobrança do ICMS por substituição tributária</option>
                      <option value="300">300 - Imune</option>
                      <option value="400">400 - Não tributada pelo Simples Nacional</option>
                      <option value="500">500 - ICMS cobrado anteriormente por substituição tributária</option>
                      <option value="900">900 - Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Alíquota ICMS (%)
                    </label>
                    <input
                      type="text"
                      value={valoresTemp.aliquota_icms || ''}
                      onChange={(e) => handleAliquotaChange('aliquota_icms', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="0 ou 0,00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Redução BC ICMS (%)
                    </label>
                    <input
                      type="text"
                      value={valoresTemp.reducao_bc_icms || ''}
                      onChange={(e) => handleAliquotaChange('reducao_bc_icms', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="0 ou 0,00"
                    />
                  </div>
                </div>
              </div>

              {/* ICMS Operação Própria - Conforme print */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-900 mb-3 text-sm">ICMS Operação Própria</h3>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Alíquota ICMS (%)
                    </label>
                    <input
                      type="text"
                      value={valoresTemp.aliquota_icms_proprio || ''}
                      onChange={(e) => handleAliquotaChange('aliquota_icms_proprio', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="0 ou 0,00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Alíquota FCP (%)
                    </label>
                    <input
                      type="text"
                      value={valoresTemp.aliquota_fcp || ''}
                      onChange={(e) => handleAliquotaChange('aliquota_fcp', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Modalidade Base de Cálculo
                    </label>
                    <select 
                      value={formData.modalidade_bc_icms || ''}
                      onChange={(e) => setFormData({ ...formData, modalidade_bc_icms: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white"
                    >
                      <option value="3">3 - Valor da Operação</option>
                      <option value="0">0 - Margem Valor Agregado (%)</option>
                      <option value="1">1 - Pauta (Valor)</option>
                      <option value="2">2 - Preço Tabelado Máx. (valor)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Redução de Base de Cálculo (%)
                    </label>
                    <input
                      type="text"
                      value={valoresTemp.reducao_bc_icms_proprio || ''}
                      onChange={(e) => handleAliquotaChange('reducao_bc_icms_proprio', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="flex items-center text-sm">
                    <input 
                      type="checkbox"
                      checked={formData.incide_icms_ipi || false}
                      onChange={(e) => setFormData({ ...formData, incide_icms_ipi: e.target.checked })}
                      className="mr-2" 
                    />
                    <span className="text-slate-700">Incide ICMS sobre o valor do produto somado ao IPI</span>
                  </label>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mensagem NF
                  </label>
                  <input
                    type="text"
                    value={formData.mensagem_nf_icms || ''}
                    onChange={(e) => setFormData({ ...formData, mensagem_nf_icms: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                    placeholder="Mensagem adicional para a nota fiscal"
                  />
                </div>
              </div>

              {/* ICMS ST - Conforme print */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-3 text-sm">ICMS Substituição Tributária (ST)</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      CST ICMS ST
                    </label>
                    <input
                      type="text"
                      value={formData.cst_icms_st || ''}
                      onChange={(e) => setFormData({ ...formData, cst_icms_st: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="Ex: 10, 30, 60, 70"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      MVA (%)
                    </label>
                    <input
                      type="text"
                      value={valoresTemp.mva_st || ''}
                      onChange={(e) => handleAliquotaChange('mva_st', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="0 ou 0,00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Alíquota ST (%)
                    </label>
                    <input
                      type="text"
                      value={valoresTemp.aliquota_icms_st || ''}
                      onChange={(e) => handleAliquotaChange('aliquota_icms_st', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Alíquota FCP ST (%)
                    </label>
                    <input
                      type="text"
                      value={valoresTemp.aliquota_fcp_st || ''}
                      onChange={(e) => handleAliquotaChange('aliquota_fcp_st', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Modalidade Base de Cálculo ST
                    </label>
                    <select 
                      value={formData.modalidade_bc_st || ''}
                      onChange={(e) => setFormData({ ...formData, modalidade_bc_st: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white"
                    >
                      <option value="4">4 - Margem Valor Agregado (%)</option>
                      <option value="0">0 - Preço tabelado ou máximo sugerido</option>
                      <option value="1">1 - Lista Negativa (valor)</option>
                      <option value="2">2 - Lista Positiva (valor)</option>
                      <option value="3">3 - Lista Neutra (valor)</option>
                      <option value="5">5 - Pauta (valor)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Redução BC ICMS ST (%)
                    </label>
                    <input
                      type="text"
                      value={valoresTemp.reducao_bc_st || ''}
                      onChange={(e) => handleAliquotaChange('reducao_bc_st', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* PIS - Conforme print */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-3 text-sm">PIS: 01 - Operação Tributável</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      CST PIS
                    </label>
                    <select
                      value={formData.cst_pis || ''}
                      onChange={(e) => setFormData({ ...formData, cst_pis: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white"
                    >
                      <option value="">Selecione</option>
                      <option value="01">01 - Operação Tributável (base de cálculo = valor da operação)</option>
                      <option value="02">02 - Operação Tributável (base de cálculo = valor da operação × alíquota por unidade)</option>
                      <option value="04">04 - Operação Tributável (tributação monofásica)</option>
                      <option value="06">06 - Operação Tributável (alíquota zero)</option>
                      <option value="07">07 - Operação Isenta da Contribuição</option>
                      <option value="08">08 - Operação Sem Incidência da Contribuição</option>
                      <option value="09">09 - Operação com Suspensão da Contribuição</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Alíquota PIS (%)
                    </label>
                    <input
                      type="text"
                      value={valoresTemp.aliquota_pis || ''}
                      onChange={(e) => handleAliquotaChange('aliquota_pis', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="0,65"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mensagem NF
                    </label>
                    <input
                      type="text"
                      value={formData.mensagem_nf_pis || ''}
                      onChange={(e) => setFormData({ ...formData, mensagem_nf_pis: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center text-sm">
                      <input 
                        type="checkbox"
                        checked={formData.icms_nao_incide_pis || false}
                        onChange={(e) => setFormData({ ...formData, icms_nao_incide_pis: e.target.checked })}
                        className="mr-2" 
                      />
                      <span className="text-slate-700">ICMS NÃO INCIDE SOBRE O VALOR DO PIS</span>
                    </label>
                    <p className="text-xs text-slate-500 mt-1 ml-6">
                      Atenção: utilize essa opção somente em casos específicos orientado por um profissional
                    </p>
                  </div>
                </div>
              </div>

              {/* COFINS - Conforme print */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-3 text-sm">COFINS: 01 - Operação Tributável</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      CST COFINS
                    </label>
                    <select
                      value={formData.cst_cofins || ''}
                      onChange={(e) => setFormData({ ...formData, cst_cofins: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white"
                    >
                      <option value="">Selecione</option>
                      <option value="01">01 - Operação Tributável (base de cálculo = valor da operação)</option>
                      <option value="02">02 - Operação Tributável (base de cálculo = valor da operação × alíquota por unidade)</option>
                      <option value="04">04 - Operação Tributável (tributação monofásica)</option>
                      <option value="06">06 - Operação Tributável (alíquota zero)</option>
                      <option value="07">07 - Operação Isenta da Contribuição</option>
                      <option value="08">08 - Operação Sem Incidência da Contribuição</option>
                      <option value="09">09 - Operação com Suspensão da Contribuição</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Alíquota COFINS (%)
                    </label>
                    <input
                      type="text"
                      value={valoresTemp.aliquota_cofins || ''}
                      onChange={(e) => handleAliquotaChange('aliquota_cofins', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="3,00"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mensagem NF
                    </label>
                    <input
                      type="text"
                      value={formData.mensagem_nf_cofins || ''}
                      onChange={(e) => setFormData({ ...formData, mensagem_nf_cofins: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center text-sm">
                      <input 
                        type="checkbox"
                        checked={formData.icms_nao_incide_cofins || false}
                        onChange={(e) => setFormData({ ...formData, icms_nao_incide_cofins: e.target.checked })}
                        className="mr-2" 
                      />
                      <span className="text-slate-700">ICMS NÃO INCIDE SOBRE O VALOR DO COFINS</span>
                    </label>
                    <p className="text-xs text-slate-500 mt-1 ml-6">
                      Atenção: utilize essa opção somente em casos específicos orientado por um profissional
                    </p>
                  </div>
                </div>
              </div>

              {/* IPI - Conforme print */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-3 text-sm">IPI: 99 - Outras saídas</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      CST IPI
                    </label>
                    <input
                      type="text"
                      value={formData.cst_ipi || ''}
                      onChange={(e) => setFormData({ ...formData, cst_ipi: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="99"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Alíquota IPI (%)
                    </label>
                    <input
                      type="text"
                      value={valoresTemp.aliquota_ipi || ''}
                      onChange={(e) => handleAliquotaChange('aliquota_ipi', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="0,0000"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Redução de Base (%)
                    </label>
                    <input
                      type="text"
                      value={valoresTemp.reducao_bc_ipi || ''}
                      onChange={(e) => handleAliquotaChange('reducao_bc_ipi', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="0,0000"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mensagem NF
                    </label>
                    <input
                      type="text"
                      value={formData.mensagem_nf_ipi || ''}
                      onChange={(e) => setFormData({ ...formData, mensagem_nf_ipi: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Outras Retenções - Conforme print */}
              <div className="space-y-3">
                {/* CSLL */}
                <div className="bg-slate-50 border border-slate-200 rounded p-3">
                  <h4 className="font-semibold text-slate-900 mb-2 text-sm">CSLL: * Não Incide *</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Alíquota (%)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={formData.aliquota_csll || ''}
                        onChange={(e) => setFormData({ ...formData, aliquota_csll: parseFloat(e.target.value) || undefined })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm" 
                        placeholder="0" 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Mensagem NF</label>
                      <input 
                        type="text"
                        value={formData.mensagem_nf_csll || ''}
                        onChange={(e) => setFormData({ ...formData, mensagem_nf_csll: e.target.value })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm" 
                      />
                    </div>
                  </div>
                </div>

                {/* IR */}
                <div className="bg-slate-50 border border-slate-200 rounded p-3">
                  <h4 className="font-semibold text-slate-900 mb-2 text-sm">IR: * Não Incide *</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Alíquota (%)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={formData.aliquota_ir || ''}
                        onChange={(e) => setFormData({ ...formData, aliquota_ir: parseFloat(e.target.value) || undefined })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm" 
                        placeholder="0" 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Mensagem NF</label>
                      <input 
                        type="text"
                        value={formData.mensagem_nf_ir || ''}
                        onChange={(e) => setFormData({ ...formData, mensagem_nf_ir: e.target.value })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm" 
                      />
                    </div>
                  </div>
                </div>

                {/* INSS */}
                <div className="bg-slate-50 border border-slate-200 rounded p-3">
                  <h4 className="font-semibold text-slate-900 mb-2 text-sm">INSS: * Não Incide *</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Alíquota (%)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={formData.aliquota_inss || ''}
                        onChange={(e) => setFormData({ ...formData, aliquota_inss: parseFloat(e.target.value) || undefined })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm" 
                        placeholder="0" 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Mensagem NF</label>
                      <input 
                        type="text"
                        value={formData.mensagem_nf_inss || ''}
                        onChange={(e) => setFormData({ ...formData, mensagem_nf_inss: e.target.value })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Reforma Tributária 2026 - IBS e CBS */}
              <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-2xl">🆕</span>
                  <div>
                    <h3 className="font-semibold text-blue-900 text-sm">Reforma Tributária 2026 - IBS e CBS</h3>
                    <p className="text-xs text-blue-700 mt-1">
                      Novos impostos federais que substituirão ICMS/ISS/PIS/COFINS gradualmente entre 2026-2033.
                      Configure alíquotas diferenciadas por NCM/CFOP conforme legislação.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Alíquota IBS (%)
                    </label>
                    <input
                      type="text"
                      value={valoresTemp.aliquota_ibs || ''}
                      onChange={(e) => handleAliquotaChange('aliquota_ibs', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="27,00 (padrão)"
                    />
                    <p className="text-xs text-slate-500 mt-1">Padrão: 27% | Cesta básica: 0%</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Alíquota CBS (%)
                    </label>
                    <input
                      type="text"
                      value={valoresTemp.aliquota_cbs || ''}
                      onChange={(e) => handleAliquotaChange('aliquota_cbs', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="12,00 (padrão)"
                    />
                    <p className="text-xs text-slate-500 mt-1">Padrão: 12% | Cesta básica: 0%</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Ano de Vigência
                    </label>
                    <input
                      type="number"
                      value={formData.ano_vigencia || 2026}
                      onChange={(e) => setFormData({ ...formData, ano_vigencia: parseInt(e.target.value) || undefined })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="2026"
                    />
                    <p className="text-xs text-slate-500 mt-1">Ano inicial da regra</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      CST IBS
                    </label>
                    <select
                      value={formData.cst_ibs || '00'}
                      onChange={(e) => setFormData({ ...formData, cst_ibs: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white"
                    >
                      <option value="00">00 - Tributado Integralmente</option>
                      <option value="10">10 - Tributado com Redução de BC</option>
                      <option value="20">20 - Tributado com Diferimento</option>
                      <option value="30">30 - Isento</option>
                      <option value="40">40 - Não Tributado</option>
                      <option value="41">41 - Suspenso</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      CST CBS
                    </label>
                    <select
                      value={formData.cst_cbs || '00'}
                      onChange={(e) => setFormData({ ...formData, cst_cbs: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white"
                    >
                      <option value="00">00 - Tributado Integralmente</option>
                      <option value="10">10 - Tributado com Redução de BC</option>
                      <option value="20">20 - Tributado com Diferimento</option>
                      <option value="30">30 - Isento</option>
                      <option value="40">40 - Não Tributado</option>
                      <option value="41">41 - Suspenso</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Redução BC IBS (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.reducao_base_ibs || ''}
                      onChange={(e) => setFormData({ ...formData, reducao_base_ibs: parseFloat(e.target.value) || undefined })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Redução BC CBS (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.reducao_base_cbs || ''}
                      onChange={(e) => setFormData({ ...formData, reducao_base_cbs: parseFloat(e.target.value) || undefined })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Diferimento IBS (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.percentual_diferimento_ibs || ''}
                      onChange={(e) => setFormData({ ...formData, percentual_diferimento_ibs: parseFloat(e.target.value) || undefined })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Diferimento CBS (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.percentual_diferimento_cbs || ''}
                      onChange={(e) => setFormData({ ...formData, percentual_diferimento_cbs: parseFloat(e.target.value) || undefined })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="flex items-center text-sm">
                      <input 
                        type="checkbox"
                        checked={formData.base_calculo_ibs_diferenciada || false}
                        onChange={(e) => setFormData({ ...formData, base_calculo_ibs_diferenciada: e.target.checked })}
                        className="mr-2" 
                      />
                      <span className="text-slate-700">Base de Cálculo IBS Diferenciada</span>
                    </label>
                    <p className="text-xs text-slate-500 ml-6 mt-1">
                      Marque se a BC não for o valor da operação
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center text-sm">
                      <input 
                        type="checkbox"
                        checked={formData.base_calculo_cbs_diferenciada || false}
                        onChange={(e) => setFormData({ ...formData, base_calculo_cbs_diferenciada: e.target.checked })}
                        className="mr-2" 
                      />
                      <span className="text-slate-700">Base de Cálculo CBS Diferenciada</span>
                    </label>
                    <p className="text-xs text-slate-500 ml-6 mt-1">
                      Marque se a BC não for o valor da operação
                    </p>
                  </div>
                </div>

                <div className="bg-blue-100 rounded p-3 mt-3">
                  <p className="text-xs text-blue-800">
                    <strong>💡 Dica:</strong> Se não informar alíquotas, o sistema buscará automaticamente por NCM na tabela 
                    <code className="bg-blue-200 px-1 rounded mx-1">reforma_aliquotas_ncm</code>. 
                    Padrões: IBS 27%, CBS 12%. Produtos cesta básica: 0%. Medicamentos: redução 60%.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Modal - Conforme print */}
            <div className="flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50">
              <div>
                {regraSelecionada?.id && (
                  <button
                    onClick={() => {
                      if (regraSelecionada.id && confirm('Tem certeza que deseja excluir esta regra?')) {
                        deletarRegra(regraSelecionada.id)
                        setModalAberto(false)
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Excluir
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 bg-slate-300 text-slate-700 rounded hover:bg-slate-400 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarRegra}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast simples */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`${toastMsg.tipo === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg shadow-lg p-4 min-w-[300px]`}>
            <p className={`${toastMsg.tipo === 'success' ? 'text-green-800' : 'text-red-800'} text-sm`}>
              {toastMsg.msg}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
