// =====================================================
// COMPONENTE - EMITIR NOTA FISCAL
// Tela para emissão de NF-e e NFC-e
// Data: 01/12/2025
// FASE 1: Unidade Emissora + Pré-preenchimento Venda + Motor Fiscal
// =====================================================

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { notasFiscaisService } from './notasFiscaisService'
import { aplicarMotorFiscalNoItem } from './fiscalEngine'
import type { NotaFiscalFormData, NotaFiscalItemFormData } from './types'
import { FINALIDADES_NOTA, MODALIDADES_FRETE, FORMAS_PAGAMENTO, MEIOS_PAGAMENTO } from './types'
import { Toast } from '../../shared/components/Toast'

interface Empresa {
  id: number
  codigo: string
  razao_social: string
  nome_fantasia: string
  cnpj: string
  emite_nfe: boolean
  serie_nfe: number
  ambiente_nfe: string
}

interface Cliente {
  id: number
  codigo: string
  tipo_pessoa: 'FISICA' | 'JURIDICA'
  nome_completo?: string
  cpf?: string
  razao_social?: string
  nome_fantasia?: string
  cnpj?: string
  inscricao_estadual?: string
  email?: string
  telefone?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
}

interface Produto {
  id: string
  codigo_interno: string
  codigo_barras?: string
  nome: string
  descricao?: string
  ncm: string
  cest?: string
  cfop_saida?: string
  unidade_medida: string
  preco_venda: number
  preco_custo?: number
  origem_mercadoria?: number
  cst_icms?: string
  csosn_icms?: string
  aliquota_icms?: number
  cst_pis?: string
  aliquota_pis?: number
  cst_cofins?: string
  aliquota_cofins?: number
  ativo: boolean
}

export default function EmitirNotaFiscal() {
  const location = useLocation()
  const vendaRecebida = location.state?.venda
  
  const [etapaAtual, setEtapaAtual] = useState(1)
  const [carregando, setCarregando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null)
  
  // Lista de empresas emissoras
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(null)
  
  // Lista de clientes
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)

  // Lista de produtos
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)

  const [formData, setFormData] = useState<NotaFiscalFormData>({
    tipo_nota: 'NFE',
    serie: 1,
    natureza_operacao: 'Venda de mercadoria',
    finalidade: '1',
    modalidade_frete: '9',
    forma_pagamento: '0',
    itens: [],
    empresa_id: undefined
  })

  const [itemAtual, setItemAtual] = useState<NotaFiscalItemFormData>({
    codigo_produto: '',
    descricao: '',
    ncm: '',
    cfop: '5102',
    unidade_comercial: 'UN',
    quantidade_comercial: 1,
    valor_unitario_comercial: 0
  })
  
  // Carregar empresas emissoras e clientes ao montar
  useEffect(() => {
    carregarEmpresasEmissoras()
    carregarClientes()
    carregarProdutos()
  }, [])

  // Pré-preencher dados quando vem de uma venda
  useEffect(() => {
    console.log('🔍 Verificando venda recebida:', vendaRecebida)
    console.log('🏢 Empresas carregadas:', empresas.length)
    
    if (vendaRecebida && empresas.length > 0) {
      console.log('✅ Iniciando preenchimento automático...')
      preencherDadosVenda(vendaRecebida)
    } else if (vendaRecebida && empresas.length === 0) {
      console.log('⏳ Aguardando carregamento das empresas...')
    }
  }, [vendaRecebida, empresas])

  const carregarEmpresasEmissoras = async () => {
    try {
      console.log('🔄 Carregando empresas emissoras...')
      
      const { data, error } = await supabase
        .from('empresas')
        .select('id, codigo, razao_social, nome_fantasia, cnpj, emite_nfe, serie_nfe, ambiente_nfe')
        .eq('ativo', true)
        .eq('emite_nfe', true)
        .order('razao_social')

      if (error) {
        console.error('❌ Erro ao carregar empresas:', error)
        throw error
      }
      
      console.log('✅ Empresas carregadas:', data)
      console.log(`📊 Total: ${data?.length || 0} empresas`)
      
      setEmpresas(data || [])
      
      // Selecionar primeira empresa automaticamente se houver apenas uma
      if (data && data.length === 1) {
        console.log('🎯 Selecionando única empresa automaticamente')
        setEmpresaSelecionada(data[0])
        setFormData(prev => ({ ...prev, empresa_id: data[0].id, serie: data[0].serie_nfe || 1 }))
      } else if (!data || data.length === 0) {
        console.warn('⚠️ Nenhuma empresa configurada para emitir NF-e!')
        setToast({ 
          tipo: 'error', 
          mensagem: 'Nenhuma empresa configurada para emitir NF-e. Configure uma empresa em Cadastros > Empresa.' 
        })
      }
    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error)
      setToast({ tipo: 'error', mensagem: 'Erro ao carregar empresas emissoras' })
    }
  }

  const carregarClientes = async () => {
    try {
      console.log('🔄 Carregando clientes...')
      
      const { data, error } = await supabase
        .from('clientes')
        .select(`
          id, codigo, tipo_pessoa, 
          nome_completo, cpf, 
          razao_social, nome_fantasia, cnpj,
          inscricao_estadual
        `)
        .eq('status', 'ATIVO')
        .order('codigo')

      if (error) {
        console.error('❌ Erro ao carregar clientes:', error)
        throw error
      }
      
      console.log(`✅ Clientes carregados: ${data?.length || 0}`)
      setClientes(data || [])
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error)
      setToast({ tipo: 'error', mensagem: 'Erro ao carregar clientes' })
    }
  }

  const preencherDadosCliente = async (cliente: Cliente) => {
    try {
      console.log('📝 Preenchendo dados do cliente:', cliente)
      
      // Buscar endereço principal do cliente
      const { data: endereco, error } = await supabase
        .from('clientes_enderecos')
        .select('*')
        .eq('cliente_id', cliente.id)
        .eq('principal', true)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar endereço:', error)
      }

      // Buscar email e telefone
      const { data: contatos } = await supabase
        .from('clientes_contatos')
        .select('*')
        .eq('cliente_id', cliente.id)
        .eq('principal', true)

      const email = contatos?.find(c => c.tipo === 'EMAIL')?.valor || ''
      const telefone = contatos?.find(c => c.tipo === 'TELEFONE' || c.tipo === 'CELULAR')?.valor || ''

      setFormData(prev => ({
        ...prev,
        destinatario_cpf_cnpj: cliente.tipo_pessoa === 'FISICA' ? cliente.cpf : cliente.cnpj,
        destinatario_nome: cliente.tipo_pessoa === 'FISICA' ? cliente.nome_completo : (cliente.razao_social || cliente.nome_fantasia),
        destinatario_ie: cliente.inscricao_estadual || '',
        destinatario_email: email,
        destinatario_telefone: telefone,
        destinatario_logradouro: endereco?.logradouro || '',
        destinatario_numero: endereco?.numero || '',
        destinatario_complemento: endereco?.complemento || '',
        destinatario_bairro: endereco?.bairro || '',
        destinatario_cidade: endereco?.cidade || '',
        destinatario_uf: endereco?.estado || '',
        destinatario_cep: endereco?.cep || ''
      }))

      setClienteSelecionado(cliente)
      console.log('✅ Dados do cliente preenchidos com sucesso')
    } catch (error) {
      console.error('❌ Erro ao preencher dados do cliente:', error)
      setToast({ tipo: 'error', mensagem: 'Erro ao carregar dados do cliente' })
    }
  }

  /**
   * Carregar produtos ativos do sistema
   */
  const carregarProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, codigo_interno, codigo_barras, nome, descricao, ncm, cest, cfop_saida, unidade_medida, preco_venda, origem_mercadoria, cst_icms, csosn_icms, aliquota_icms, cst_pis, aliquota_pis, cst_cofins, aliquota_cofins, ativo')
        .eq('ativo', true)
        .order('nome')

      if (error) {
        console.error('Erro ao carregar produtos:', error)
        return
      }

      console.log('✅ Produtos carregados:', data?.length)
      setProdutos(data || [])
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error)
    }
  }

  /**
   * Preencher dados do produto selecionado no itemAtual
   */
  const preencherDadosProduto = (produto: Produto) => {
    console.log('📦 Preenchendo dados do produto:', produto)
    
    setItemAtual({
      codigo_produto: produto.codigo_interno,
      descricao: produto.nome,
      ncm: produto.ncm,
      cfop: produto.cfop_saida || '5102',
      unidade_comercial: produto.unidade_medida || 'UN',
      quantidade_comercial: 1,
      valor_unitario_comercial: produto.preco_venda || 0
    })

    setProdutoSelecionado(produto)
    console.log('✅ Dados do produto preenchidos')
  }

  const preencherDadosVenda = async (venda: any) => {
    try {
      setCarregando(true)
      
      console.log('📦 Venda recebida:', venda)
      
      // Buscar dados completos da venda com cliente e itens
      const { data: vendaCompleta, error } = await supabase
        .from('vendas')
        .select(`
          *,
          cliente:clientes(*),
          vendas_itens(*)
        `)
        .eq('id', venda.id)
        .single()

      if (error) {
        console.error('❌ Erro ao buscar venda:', error)
        throw error
      }

      console.log('✅ Venda completa carregada:', vendaCompleta)

      const cliente = vendaCompleta.cliente
      
      if (!cliente) {
        throw new Error('Cliente não encontrado na venda')
      }
      
      // Preencher destinatário
      setFormData(prev => ({
        ...prev,
        empresa_id: vendaCompleta.empresa_id,
        destinatario_cpf_cnpj: cliente.cpf_cnpj,
        destinatario_nome: cliente.razao_social || cliente.nome,
        destinatario_ie: cliente.inscricao_estadual,
        destinatario_email: cliente.email,
        destinatario_telefone: cliente.telefone,
        destinatario_logradouro: cliente.endereco,
        destinatario_numero: cliente.numero,
        destinatario_complemento: cliente.complemento,
        destinatario_bairro: cliente.bairro,
        destinatario_cidade: cliente.cidade,
        destinatario_uf: cliente.estado,
        destinatario_cep: cliente.cep,
        forma_pagamento: vendaCompleta.forma_pagamento || '0',
        meio_pagamento: vendaCompleta.condicao_pagamento === 'A_VISTA' ? '01' : '15'
      }))

      // Converter itens da venda para itens da nota fiscal
      const itensNota: NotaFiscalItemFormData[] = await Promise.all(
        (vendaCompleta.vendas_itens || []).map(async (itemVenda: any) => {
          // Buscar dados do produto para pegar NCM
          const { data: produto } = await supabase
            .from('produtos')
            .select('ncm, cfop_padrao')
            .eq('id', itemVenda.produto_id)
            .single()

          const itemBase: NotaFiscalItemFormData = {
            codigo_produto: itemVenda.codigo_produto || String(itemVenda.produto_id),
            descricao: itemVenda.descricao,
            ncm: produto?.ncm || '00000000',
            cfop: produto?.cfop_padrao || '5102',
            unidade_comercial: itemVenda.unidade || 'UN',
            quantidade_comercial: itemVenda.quantidade,
            valor_unitario_comercial: itemVenda.valor_unitario,
            valor_desconto: itemVenda.desconto || 0
          }

          // Aplicar motor fiscal automaticamente
          try {
            const tributosCalculados = await aplicarMotorFiscalNoItem(itemBase, {
              empresaId: vendaCompleta.empresa_id,
              tipoDocumento: 'NFE',
              tipoOperacao: 'SAIDA',
              ufOrigem: 'SP', // TODO: Pegar da empresa
              ufDestino: cliente.estado
            })

            return {
              ...itemBase,
              ...tributosCalculados
            }
          } catch (error) {
            console.error('Erro ao calcular tributos:', error)
            return itemBase
          }
        })
      )

      setFormData(prev => ({ ...prev, itens: itensNota }))
      
      console.log('📝 FormData atualizado:', formData)
      console.log(`🛒 ${itensNota.length} itens adicionados`)
      
      // Selecionar empresa da venda
      const empresaVenda = empresas.find(e => e.id === vendaCompleta.empresa_id)
      if (empresaVenda) {
        setEmpresaSelecionada(empresaVenda)
        console.log('🏢 Empresa selecionada:', empresaVenda.nome_fantasia)
      } else {
        console.warn('⚠️ Empresa da venda não encontrada na lista de emissoras')
      }

      setToast({ tipo: 'success', mensagem: `Dados da venda carregados! ${itensNota.length} itens importados.` })
      setEtapaAtual(3) // Pular para etapa de produtos, pois já tem tudo preenchido
    } catch (error) {
      console.error('Erro ao preencher dados da venda:', error)
      setToast({ tipo: 'error', mensagem: 'Erro ao carregar dados da venda' })
    } finally {
      setCarregando(false)
    }
  }

  const adicionarItem = async () => {
    if (!itemAtual.codigo_produto || !itemAtual.descricao || !itemAtual.ncm) {
      setToast({ tipo: 'error', mensagem: 'Preencha todos os campos obrigatórios do item' })
      return
    }

    if (!formData.empresa_id) {
      setToast({ tipo: 'error', mensagem: 'Selecione a empresa emissora primeiro' })
      return
    }

    // Aplicar motor fiscal ao item antes de adicionar
    try {
      setCarregando(true)
      
      const tributosCalculados = await aplicarMotorFiscalNoItem(itemAtual, {
        empresaId: formData.empresa_id,
        tipoDocumento: 'NFE',
        tipoOperacao: 'SAIDA',
        ufOrigem: 'SP', // TODO: Pegar da empresa selecionada
        ufDestino: formData.destinatario_uf || 'SP'
      })

      const itemComImpostos = {
        ...itemAtual,
        ...tributosCalculados
      }

      setFormData(prev => ({
        ...prev,
        itens: [...prev.itens, itemComImpostos]
      }))

      setItemAtual({
        codigo_produto: '',
        descricao: '',
        ncm: '',
        cfop: '5102',
        unidade_comercial: 'UN',
        quantidade_comercial: 1,
        valor_unitario_comercial: 0
      })

      setToast({ tipo: 'success', mensagem: 'Item adicionado com impostos calculados' })
    } catch (error) {
      console.error('Erro ao calcular tributos:', error)
      setToast({ tipo: 'error', mensagem: 'Erro ao calcular impostos. Item adicionado sem tributos.' })
      
      // Adicionar item mesmo sem tributos em caso de erro
      setFormData(prev => ({
        ...prev,
        itens: [...prev.itens, itemAtual]
      }))
      
      setItemAtual({
        codigo_produto: '',
        descricao: '',
        ncm: '',
        cfop: '5102',
        unidade_comercial: 'UN',
        quantidade_comercial: 1,
        valor_unitario_comercial: 0
      })
    } finally {
      setCarregando(false)
    }
  }

  const removerItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }))
  }

  const calcularTotalItem = (item: NotaFiscalItemFormData) => {
    return item.quantidade_comercial * item.valor_unitario_comercial - (item.valor_desconto || 0)
  }

  const calcularTotalNota = () => {
    return formData.itens.reduce((sum, item) => sum + calcularTotalItem(item), 0)
  }

  const validarEtapa1 = () => {
    if (!formData.empresa_id) {
      setToast({ tipo: 'error', mensagem: 'Selecione a empresa emissora' })
      return false
    }
    if (!formData.natureza_operacao) {
      setToast({ tipo: 'error', mensagem: 'Informe a natureza da operação' })
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (formData.itens.length === 0) {
      setToast({ tipo: 'error', mensagem: 'Adicione pelo menos um item' })
      return
    }

    if (!formData.destinatario_cpf_cnpj || !formData.destinatario_nome) {
      setToast({ tipo: 'error', mensagem: 'Preencha os dados do destinatário' })
      return
    }

    setCarregando(true)
    try {
      const nota = await notasFiscaisService.criarRascunho(formData)
      const resultado = await notasFiscaisService.emitir(nota.id)

      if (resultado.sucesso) {
        setToast({ tipo: 'success', mensagem: `NF-e autorizada! Chave: ${resultado.chave_acesso}` })
        // Resetar formulário
        setFormData({
          tipo_nota: 'NFE',
          serie: 1,
          natureza_operacao: 'Venda de mercadoria',
          finalidade: '1',
          modalidade_frete: '9',
          forma_pagamento: '0',
          itens: []
        })
        setEtapaAtual(1)
      } else {
        setToast({ tipo: 'error', mensagem: resultado.mensagem })
      }
    } catch (error) {
      setToast({ tipo: 'error', mensagem: error instanceof Error ? error.message : 'Erro ao emitir nota' })
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Emitir Nota Fiscal</h1>
        <p className="text-slate-600 mt-2">
          Emissão de NF-e (modelo 55) e NFC-e (modelo 65)
        </p>
      </div>

      {/* Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Dados Gerais', 'Destinatário', 'Produtos', 'Transporte/Pagamento', 'Revisar'].map((etapa, index) => (
            <div key={etapa} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                index + 1 === etapaAtual
                  ? 'bg-blue-600 text-white'
                  : index + 1 < etapaAtual
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-300 text-slate-600'
              }`}>
                {index + 1}
              </div>
              <span className={`ml-2 text-sm ${
                index + 1 === etapaAtual ? 'text-blue-600 font-semibold' : 'text-slate-600'
              }`}>
                {etapa}
              </span>
              {index < 4 && <div className="w-16 h-0.5 bg-slate-300 mx-4" />}
            </div>
          ))}
        </div>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Etapa 1: Dados Gerais */}
        {etapaAtual === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Dados Gerais da Nota</h2>
            
            {/* Unidade Emissora */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                🏢 Unidade Emissora * <span className="text-xs text-slate-500">(Empresa que emitirá a NF-e)</span>
              </label>
              <select
                value={empresaSelecionada?.id || ''}
                onChange={(e) => {
                  const empresa = empresas.find(emp => emp.id === parseInt(e.target.value))
                  setEmpresaSelecionada(empresa || null)
                  setFormData({ 
                    ...formData, 
                    empresa_id: empresa?.id,
                    serie: empresa?.serie_nfe || 1
                  })
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                <option value="">Selecione a empresa emissora</option>
                {empresas.map(empresa => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nome_fantasia || empresa.razao_social} - {empresa.cnpj} (Série: {empresa.serie_nfe})
                  </option>
                ))}
              </select>
              {empresaSelecionada && (
                <div className="mt-2 text-xs text-slate-600">
                  <p><strong>Razão Social:</strong> {empresaSelecionada.razao_social}</p>
                  <p><strong>CNPJ:</strong> {empresaSelecionada.cnpj}</p>
                  <p><strong>Ambiente:</strong> {empresaSelecionada.ambiente_nfe === 'PRODUCAO' ? '🟢 Produção' : '🟡 Homologação'}</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tipo de Nota *
                </label>
                <select
                  value={formData.tipo_nota}
                  onChange={(e) => setFormData({ ...formData, tipo_nota: e.target.value as 'NFE' | 'NFCE' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NFE">NF-e (Modelo 55)</option>
                  <option value="NFCE">NFC-e (Modelo 65)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Série *
                </label>
                <input
                  type="number"
                  value={formData.serie}
                  onChange={(e) => setFormData({ ...formData, serie: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Finalidade *
                </label>
                <select
                  value={formData.finalidade}
                  onChange={(e) => setFormData({ ...formData, finalidade: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  {FINALIDADES_NOTA.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Natureza da Operação *
              </label>
              <input
                type="text"
                value={formData.natureza_operacao}
                onChange={(e) => setFormData({ ...formData, natureza_operacao: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Venda de mercadoria"
              />
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  if (validarEtapa1()) {
                    setEtapaAtual(2)
                  }
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Etapa 2: Destinatário */}
        {etapaAtual === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Dados do Destinatário</h2>
            
            {/* Campo de busca de cliente */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                🔍 Buscar Cliente Cadastrado
              </label>
              <select
                value={clienteSelecionado?.id || ''}
                onChange={(e) => {
                  const cliente = clientes.find(c => c.id === Number(e.target.value))
                  if (cliente) preencherDadosCliente(cliente)
                }}
                className="w-full px-3 py-2 border border-[#C9C4B5] rounded-md focus:ring-2 focus:ring-[#394353] text-sm"
              >
                <option value="">Selecione um cliente cadastrado...</option>
                {clientes.map(cliente => {
                  const nome = cliente.tipo_pessoa === 'FISICA' 
                    ? cliente.nome_completo 
                    : (cliente.razao_social || cliente.nome_fantasia)
                  const doc = cliente.tipo_pessoa === 'FISICA' 
                    ? cliente.cpf 
                    : cliente.cnpj
                  return (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.codigo} - {nome} {doc ? `(${doc})` : ''}
                    </option>
                  )
                })}
              </select>
              <p className="text-xs text-slate-600 mt-2">
                💡 Selecione um cliente para preencher automaticamente os dados abaixo
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  CPF/CNPJ *
                </label>
                <input
                  type="text"
                  value={formData.destinatario_cpf_cnpj || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_cpf_cnpj: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="00000000000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome/Razão Social *
                </label>
                <input
                  type="text"
                  value={formData.destinatario_nome || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_nome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Inscrição Estadual
                </label>
                <input
                  type="text"
                  value={formData.destinatario_ie || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_ie: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.destinatario_email || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.destinatario_logradouro || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_logradouro: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Rua, Av, etc"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  value={formData.destinatario_numero || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_numero: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={formData.destinatario_bairro || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_bairro: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.destinatario_cidade || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_cidade: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  UF
                </label>
                <input
                  type="text"
                  value={formData.destinatario_uf || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_uf: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  value={formData.destinatario_cep || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_cep: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setEtapaAtual(1)}
                className="px-6 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400"
              >
                Voltar
              </button>
              <button
                onClick={() => setEtapaAtual(3)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Etapa 3: Produtos - continua no próximo arquivo */}
        {etapaAtual === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Produtos/Serviços</h2>
            
            {/* Buscar Produto do Cadastro */}
            <div className="bg-blue-50 p-4 rounded-md border-2 border-blue-200">
              <h3 className="font-medium text-blue-900 mb-3">🔍 Buscar Produto do Cadastro</h3>
              <p className="text-sm text-blue-700 mb-3">
                Selecione um produto já cadastrado no sistema para preencher automaticamente os dados.
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Produto
                  </label>
                  <select
                    value={produtoSelecionado?.id || ''}
                    onChange={(e) => {
                      const produto = produtos.find(p => p.id === e.target.value)
                      if (produto) {
                        preencherDadosProduto(produto)
                      }
                    }}
                    className="w-full px-3 py-2 border-2 border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Selecione um produto...</option>
                    {produtos.map(produto => (
                      <option key={produto.id} value={produto.id}>
                        {produto.codigo_interno} - {produto.nome} (NCM: {produto.ncm})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-600 mt-1">
                    Total: {produtos.length} produto(s) ativo(s) disponível(is)
                  </p>
                </div>
              </div>
            </div>
            
            {/* Formulário de Item */}
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
              <h3 className="font-medium text-slate-700 mb-3">Adicionar Item</h3>
              
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={itemAtual.codigo_produto}
                    onChange={(e) => setItemAtual({ ...itemAtual, codigo_produto: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={itemAtual.descricao}
                    onChange={(e) => setItemAtual({ ...itemAtual, descricao: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    NCM *
                  </label>
                  <input
                    type="text"
                    value={itemAtual.ncm}
                    onChange={(e) => setItemAtual({ ...itemAtual, ncm: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    maxLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    CFOP *
                  </label>
                  <input
                    type="text"
                    value={itemAtual.cfop}
                    onChange={(e) => setItemAtual({ ...itemAtual, cfop: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    maxLength={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Unidade *
                  </label>
                  <input
                    type="text"
                    value={itemAtual.unidade_comercial}
                    onChange={(e) => setItemAtual({ ...itemAtual, unidade_comercial: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    value={itemAtual.quantidade_comercial}
                    onChange={(e) => setItemAtual({ ...itemAtual, quantidade_comercial: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Valor Unitário *
                  </label>
                  <input
                    type="number"
                    value={itemAtual.valor_unitario_comercial}
                    onChange={(e) => setItemAtual({ ...itemAtual, valor_unitario_comercial: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={adicionarItem}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Itens */}
            {formData.itens.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-slate-700 mb-3">Itens Adicionados</h3>
                <div className="space-y-4">
                  {formData.itens.map((item, index) => (
                    <div key={index} className="border border-slate-300 rounded-lg overflow-hidden bg-white">
                      {/* Cabeçalho do Item */}
                      <div className="bg-[#394353] text-white p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-base">Item {index + 1}</span>
                            <span className="text-sm opacity-90">|</span>
                            <span className="text-sm font-medium">{item.codigo_produto}</span>
                            <span className="text-sm opacity-90">-</span>
                            <span className="text-sm">{item.descricao}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs opacity-90">
                            <span>NCM: {item.ncm}</span>
                            {item.cest && <span>CEST: {item.cest}</span>}
                            <span>CFOP: {item.cfop}</span>
                            <span>Origem: {item.origem_mercadoria}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removerItem(index)}
                          className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold transition-colors"
                        >
                          Remover
                        </button>
                      </div>

                      {/* Corpo - Informações Detalhadas */}
                      <div className="p-4">
                        {/* Linha 1: Valores Comerciais */}
                        <div className="grid grid-cols-6 gap-4 pb-3 border-b border-slate-200">
                          <div>
                            <label className="text-xs font-medium text-slate-500 uppercase">Quantidade</label>
                            <p className="text-sm font-semibold text-slate-900 mt-1">
                              {item.quantidade_comercial.toFixed(2)} {item.unidade_comercial}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 uppercase">Valor Unitário</label>
                            <p className="text-sm font-semibold text-slate-900 mt-1">
                              R$ {item.valor_unitario_comercial.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 uppercase">Valor Bruto</label>
                            <p className="text-sm font-semibold text-slate-900 mt-1">
                              R$ {(item.quantidade_comercial * item.valor_unitario_comercial).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 uppercase">Desconto</label>
                            <p className="text-sm font-semibold text-red-600 mt-1">
                              {item.valor_desconto ? `- R$ ${item.valor_desconto.toFixed(2)}` : 'R$ 0,00'}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 uppercase">Outras Despesas</label>
                            <p className="text-sm font-semibold text-slate-900 mt-1">
                              {item.valor_outras_despesas ? `R$ ${item.valor_outras_despesas.toFixed(2)}` : 'R$ 0,00'}
                            </p>
                          </div>
                          <div className="bg-blue-50 p-2 rounded">
                            <label className="text-xs font-bold text-blue-900 uppercase">Total do Item</label>
                            <p className="text-base font-bold text-blue-900 mt-1">
                              R$ {calcularTotalItem(item).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Linha 2: Tributos Calculados */}
                        <div className="mt-3">
                          <h4 className="text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-2">
                            <span className="w-1 h-4 bg-blue-600 rounded"></span>
                            Tributos Calculados pelo Motor Fiscal
                          </h4>
                          
                          <div className="grid grid-cols-4 gap-3">
                            {/* ICMS */}
                            <div className="bg-amber-50 border border-amber-200 rounded p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                  ICMS
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-amber-900">
                                    {item.csosn_icms ? `CSOSN: ${item.csosn_icms}` : item.cst_icms ? `CST: ${item.cst_icms}` : 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-600">Base Cálculo:</span>
                                  <span className="font-semibold text-slate-900">R$ {(item.base_calculo_icms || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-600">Alíquota:</span>
                                  <span className="font-semibold text-slate-900">{(item.aliquota_icms || 0).toFixed(2)}%</span>
                                </div>
                                <div className="flex justify-between text-xs pt-1 border-t border-amber-300">
                                  <span className="font-bold text-amber-900">Valor ICMS:</span>
                                  <span className="font-bold text-amber-900">R$ {(item.valor_icms || 0).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            {/* PIS */}
                            <div className="bg-green-50 border border-green-200 rounded p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                  PIS
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-green-900">
                                    {item.cst_pis ? `CST: ${item.cst_pis}` : 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-600">Base Cálculo:</span>
                                  <span className="font-semibold text-slate-900">R$ {(item.base_calculo_pis || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-600">Alíquota:</span>
                                  <span className="font-semibold text-slate-900">{(item.aliquota_pis || 0).toFixed(2)}%</span>
                                </div>
                                <div className="flex justify-between text-xs pt-1 border-t border-green-300">
                                  <span className="font-bold text-green-900">Valor PIS:</span>
                                  <span className="font-bold text-green-900">R$ {(item.valor_pis || 0).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            {/* COFINS */}
                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                  COFINS
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-blue-900">
                                    {item.cst_cofins ? `CST: ${item.cst_cofins}` : 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-600">Base Cálculo:</span>
                                  <span className="font-semibold text-slate-900">R$ {(item.base_calculo_cofins || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-600">Alíquota:</span>
                                  <span className="font-semibold text-slate-900">{(item.aliquota_cofins || 0).toFixed(2)}%</span>
                                </div>
                                <div className="flex justify-between text-xs pt-1 border-t border-blue-300">
                                  <span className="font-bold text-blue-900">Valor COFINS:</span>
                                  <span className="font-bold text-blue-900">R$ {(item.valor_cofins || 0).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            {/* IPI */}
                            <div className="bg-purple-50 border border-purple-200 rounded p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                  IPI
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-purple-900">
                                    {item.cst_ipi ? `CST: ${item.cst_ipi}` : 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-600">Base Cálculo:</span>
                                  <span className="font-semibold text-slate-900">R$ {(item.base_calculo_ipi || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-600">Alíquota:</span>
                                  <span className="font-semibold text-slate-900">{(item.aliquota_ipi || 0).toFixed(2)}%</span>
                                </div>
                                <div className="flex justify-between text-xs pt-1 border-t border-purple-300">
                                  <span className="font-bold text-purple-900">Valor IPI:</span>
                                  <span className="font-bold text-purple-900">R$ {(item.valor_ipi || 0).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Linha 3: ICMS-ST e Reforma Tributária (IBS/CBS) */}
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            {/* ICMS-ST */}
                            {(item.valor_icms_st && item.valor_icms_st > 0) && (
                              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
                                    ST
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-orange-900">ICMS - Substituição Tributária</p>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-600">Base Cálculo ST:</span>
                                    <span className="font-semibold text-slate-900">R$ {(item.base_calculo_icms_st || 0).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-600">Alíquota ST:</span>
                                    <span className="font-semibold text-slate-900">{(item.aliquota_icms_st || 0).toFixed(2)}%</span>
                                  </div>
                                  {item.mva_st && (
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-600">MVA:</span>
                                      <span className="font-semibold text-slate-900">{item.mva_st.toFixed(2)}%</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-xs pt-1 border-t border-orange-300">
                                    <span className="font-bold text-orange-900">Valor ICMS-ST:</span>
                                    <span className="font-bold text-orange-900">R$ {item.valor_icms_st.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* IBS/CBS - Reforma Tributária */}
                            <div className="bg-indigo-50 border-2 border-indigo-300 rounded p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-10 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded flex items-center justify-center text-white font-bold text-[9px]">
                                  IBS/CBS
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-indigo-900">Reforma Tributária 2026</p>
                                  <p className="text-[10px] text-indigo-700">Lei Complementar 214/2026</p>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs bg-white rounded px-2 py-1">
                                  <span className="text-indigo-700 font-medium">IBS (Estadual/Municipal):</span>
                                  <span className="font-bold text-indigo-900">27%</span>
                                </div>
                                <div className="flex justify-between text-xs bg-white rounded px-2 py-1">
                                  <span className="text-purple-700 font-medium">CBS (Federal):</span>
                                  <span className="font-bold text-purple-900">12%</span>
                                </div>
                                <div className="flex justify-between text-xs pt-1 border-t-2 border-indigo-400 mt-1">
                                  <span className="font-bold text-indigo-900">Alíquota Total:</span>
                                  <span className="font-bold text-indigo-900 text-sm">39%</span>
                                </div>
                                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded px-2 py-1 mt-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="font-bold text-slate-700">Valor Estimado:</span>
                                    <span className="font-bold text-indigo-900">
                                      R$ {((item.quantidade_comercial * item.valor_unitario_comercial) * 0.39).toFixed(2)}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-slate-600 mt-1">
                                    * Valor estimado considerando alíquota padrão
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Total de Tributos */}
                          <div className="mt-3 bg-gradient-to-r from-slate-700 to-slate-800 rounded p-3">
                            <div className="flex justify-between items-center text-white">
                              <div>
                                <p className="text-xs font-medium opacity-90">Total de Tributos Calculados (sem IBS/CBS)</p>
                                <p className="text-[10px] opacity-75 mt-0.5">ICMS + PIS + COFINS + IPI + ICMS-ST</p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold">
                                  R$ {(
                                    (item.valor_icms || 0) + 
                                    (item.valor_pis || 0) + 
                                    (item.valor_cofins || 0) + 
                                    (item.valor_ipi || 0) + 
                                    (item.valor_icms_st || 0)
                                  ).toFixed(2)}
                                </p>
                                <p className="text-xs opacity-90 mt-1">
                                  Carga Tributária: {(
                                    ((item.valor_icms || 0) + 
                                    (item.valor_pis || 0) + 
                                    (item.valor_cofins || 0) + 
                                    (item.valor_ipi || 0) + 
                                    (item.valor_icms_st || 0)) / 
                                    (item.quantidade_comercial * item.valor_unitario_comercial) * 100
                                  ).toFixed(2)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Geral da Nota */}
                <div className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4">
                  <div className="flex justify-between items-center text-white">
                    <div>
                      <p className="text-sm font-medium opacity-90">Total da Nota Fiscal</p>
                      <p className="text-xs opacity-75 mt-0.5">{formData.itens.length} item(ns) adicionado(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">R$ {calcularTotalNota().toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setEtapaAtual(2)}
                className="px-6 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400"
              >
                Voltar
              </button>
              <button
                onClick={() => setEtapaAtual(4)}
                disabled={formData.itens.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Etapa 4: Transporte e Pagamento */}
        {etapaAtual === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Transporte e Pagamento</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Modalidade de Frete
                  </label>
                  <select
                    value={formData.modalidade_frete}
                    onChange={(e) => setFormData({ ...formData, modalidade_frete: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    {MODALIDADES_FRETE.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={formData.forma_pagamento}
                    onChange={(e) => setFormData({ ...formData, forma_pagamento: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    {FORMAS_PAGAMENTO.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Meio de Pagamento
                  </label>
                  <select
                    value={formData.meio_pagamento || ''}
                    onChange={(e) => setFormData({ ...formData, meio_pagamento: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {MEIOS_PAGAMENTO.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Valor Pago
                  </label>
                  <input
                    type="number"
                    value={formData.valor_pago || ''}
                    onChange={(e) => setFormData({ ...formData, valor_pago: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Informações Complementares
                </label>
                <textarea
                  value={formData.informacoes_complementares || ''}
                  onChange={(e) => setFormData({ ...formData, informacoes_complementares: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Informações adicionais para o destinatário..."
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setEtapaAtual(3)}
                className="px-6 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400"
              >
                Voltar
              </button>
              <button
                onClick={() => setEtapaAtual(5)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Revisar
              </button>
            </div>
          </div>
        )}

        {/* Etapa 5: Revisão */}
        {etapaAtual === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Revisão da Nota Fiscal</h2>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-50 p-4 rounded-md">
                <h3 className="font-semibold text-slate-700 mb-2">Dados Gerais</h3>
                <p className="text-sm text-slate-600">Tipo: {formData.tipo_nota === 'NFE' ? 'NF-e' : 'NFC-e'}</p>
                <p className="text-sm text-slate-600">Série: {formData.serie}</p>
                <p className="text-sm text-slate-600">Natureza: {formData.natureza_operacao}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-md">
                <h3 className="font-semibold text-slate-700 mb-2">Destinatário</h3>
                <p className="text-sm text-slate-600">{formData.destinatario_nome}</p>
                <p className="text-sm text-slate-600">CPF/CNPJ: {formData.destinatario_cpf_cnpj}</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Quantidade de Itens:</span> {formData.itens.length}
              </p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                Total: R$ {calcularTotalNota().toFixed(2)}
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setEtapaAtual(4)}
                className="px-6 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400"
              >
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={carregando}
                className="px-8 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {carregando ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Emitindo...
                  </>
                ) : (
                  'Emitir Nota Fiscal'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <Toast
          type={toast.tipo}
          message={toast.mensagem}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
