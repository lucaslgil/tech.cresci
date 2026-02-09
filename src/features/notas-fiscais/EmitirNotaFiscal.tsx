// =====================================================
// COMPONENTE - EMITIR NOTA FISCAL
// Tela para emissão de NF-e e NFC-e
// Data: 23/01/2026
// INTEGRAÇÃO: Nuvem Fiscal API (desde 05/02/2026)
// FASE 1: Unidade Emissora + Pré-preenchimento Venda + Motor Fiscal
// FASE 2: Documentos (XML, Espelho, DANFE)
// =====================================================
//
// 🌐 INTEGRAÇÃO NUVEM FISCAL
// Este componente utiliza a API Nuvem Fiscal para emissão de NF-e
// A transmissão é feita através de NFeService → NuvemFiscalAdapter → API
// Configuração: Ver arquivo .env (VITE_NUVEM_FISCAL_*)
// Documentação: INTEGRACAO_NUVEM_FISCAL.md
// =====================================================

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { notasFiscaisService } from './notasFiscaisService'
import { aplicarMotorFiscalNoItem } from './fiscalEngine'
import { baixarXMLLocal, baixarEspelhoNFe } from './documentosService'
import type { NotaFiscalFormData, NotaFiscalItemFormData } from './types'
import { FINALIDADES_NOTA, MODALIDADES_FRETE, FORMAS_PAGAMENTO, MEIOS_PAGAMENTO } from './types'
import { Toast } from '../../shared/components/Toast'
import type { OperacaoFiscal } from '../cadastros-fiscais/types'
import { criarServicoNFe, type NotaFiscalDados } from '../../services/nfe'

interface Empresa {
  id: number
  codigo: string
  razao_social: string
  nome_fantasia: string
  cnpj: string
  inscricao_estadual?: string
  crt?: string
  regime_tributario?: 'SIMPLES' | 'PRESUMIDO' | 'REAL'
  emite_nfe: boolean
  empresa_padrao_nfe?: boolean
  serie_nfe: number
  ambiente_nfe: string
  estado?: string
  codigo_municipio?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  cep?: string
  telefone?: string
  email?: string
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

interface RascunhoParcial {
  id: number
  numero: number
  serie: number
  tipo_nota: string
  destinatario_nome: string
  valor_total: number
  data_emissao: string
}

export default function EmitirNotaFiscal() {
  const location = useLocation()
  const vendaRecebida = location.state?.venda
  
  // Modo de emissão: null = não escolhido, 'MANUAL' = manual, 'VENDA' = a partir de venda
  const [modoEmissao, setModoEmissao] = useState<'MANUAL' | 'VENDA' | null>(vendaRecebida ? 'VENDA' : null)
  const [vendasPendentes, setVendasPendentes] = useState<any[]>([])
  const [vendaSelecionada, setVendaSelecionada] = useState<any | null>(null)
  const [carregandoVendas, setCarregandoVendas] = useState(false)
  
  const [etapaAtual, setEtapaAtual] = useState(1)
  const [carregando, setCarregando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null)
  
  // Controle de rascunhos pendentes
  const [rascunhosPendentes, setRascunhosPendentes] = useState<RascunhoParcial[]>([])
  const [mostrarAlertaRascunho, setMostrarAlertaRascunho] = useState(false)
  const [notaAtualId, setNotaAtualId] = useState<number | null>(null)
  
  // Lista de empresas emissoras
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(null)
  
  // Lista de clientes
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)

  // Lista de produtos
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)

  // Lista de operações fiscais
  const [operacoesFiscais, setOperacoesFiscais] = useState<OperacaoFiscal[]>([])
  const [operacaoSelecionada, setOperacaoSelecionada] = useState<OperacaoFiscal | null>(null)

  // Controle de numeração
  const [proximoNumero, setProximoNumero] = useState<number | null>(null)

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

  /**
   * Carregar dados de edição do sessionStorage (quando vem de nota rejeitada)
   */
  const carregarDadosEdicao = () => {
    try {
      const dadosEdicaoStr = sessionStorage.getItem('nfe_edicao')
      
      if (!dadosEdicaoStr) {
        console.log('ℹ️ Nenhum dado de edição encontrado no sessionStorage')
        return
      }

      console.log('📝 Carregando dados de edição do sessionStorage...')
      const dadosEdicao = JSON.parse(dadosEdicaoStr)
      
      console.log('✅ Dados de edição recuperados:', dadosEdicao)

      // Preencher dados do formulário com informações do destinatário
      setFormData(prev => ({
        ...prev,
        empresa_id: dadosEdicao.empresaId,
        tipo_nota: 'NFE',
        serie: dadosEdicao.serie || 1,
        numero: dadosEdicao.numeroNota,
        natureza_operacao: dadosEdicao.destinatario.natureza_operacao || 'Venda de mercadoria',
        finalidade: '1', // Normal
        modalidade_frete: dadosEdicao.destinatario.modalidade_frete || '9',
        forma_pagamento: dadosEdicao.destinatario.forma_pagamento || '0',
        destinatario_cpf_cnpj: dadosEdicao.destinatario.cpf_cnpj || '',
        destinatario_nome: dadosEdicao.destinatario.nome || '',
        destinatario_ie: dadosEdicao.destinatario.ie || '',
        destinatario_email: dadosEdicao.destinatario.email || '',
        destinatario_telefone: dadosEdicao.destinatario.telefone || '',
        destinatario_logradouro: dadosEdicao.destinatario.logradouro || '',
        destinatario_numero: dadosEdicao.destinatario.numero || '',
        destinatario_complemento: dadosEdicao.destinatario.complemento || '',
        destinatario_bairro: dadosEdicao.destinatario.bairro || '',
        destinatario_cidade: dadosEdicao.destinatario.cidade || '',
        destinatario_uf: dadosEdicao.destinatario.uf || '',
        destinatario_cep: dadosEdicao.destinatario.cep || '',
        destinatario_codigo_municipio: dadosEdicao.destinatario.codigo_municipio || '',
        itens: dadosEdicao.itens || []
      }))

      // Buscar e selecionar o cliente correspondente
      if (dadosEdicao.clienteId) {
        supabase
          .from('clientes')
          .select('*')
          .eq('id', dadosEdicao.clienteId)
          .single()
          .then(({ data }) => {
            if (data) {
              setClienteSelecionado(data)
              console.log('✅ Cliente selecionado:', data)
            }
          })
      }

      // Mostrar toast informativo
      setToast({
        tipo: 'success',
        mensagem: `Editando Nota #${dadosEdicao.numeroNota} - Rejeitada: ${dadosEdicao.mensagemRejeicao || 'Motivo não especificado'}`
      })

      // Limpar sessionStorage após carregar
      sessionStorage.removeItem('nfe_edicao')
      console.log('🧹 SessionStorage limpo após carregar dados')

    } catch (error) {
      console.error('❌ Erro ao carregar dados de edição:', error)
      setToast({
        tipo: 'error',
        mensagem: 'Erro ao carregar dados da nota rejeitada'
      })
      // Limpar sessionStorage mesmo em caso de erro
      sessionStorage.removeItem('nfe_edicao')
    }
  }
  
  // Carregar próximo número quando empresa ou tipo de nota mudar
  useEffect(() => {
    if (formData.empresa_id && formData.tipo_nota && formData.serie) {
      carregarProximoNumero()
    }
  }, [formData.empresa_id, formData.tipo_nota, formData.serie])

  // Carregar empresas emissoras e clientes ao montar
  useEffect(() => {
    carregarEmpresasEmissoras()
    carregarClientes()
    carregarProdutos()
    carregarOperacoesFiscais()
    verificarRascunhosPendentes()
    
    // Verificar se está editando uma nota rejeitada
    carregarDadosEdicao()
  }, [])

  // Recalcular CFOP quando UF do cliente mudar
  useEffect(() => {
    if (operacaoSelecionada && formData.destinatario_uf && empresaSelecionada) {
      console.log('🔄 UF do cliente alterada, recalculando CFOP...')
      selecionarCFOPAutomatico(operacaoSelecionada)
    }
  }, [formData.destinatario_uf])

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

  const carregarProximoNumero = async () => {
    try {
      console.log('🔢 Buscando próximo número...')
      
      // Buscar último número da tabela de numeração
      const { data, error } = await supabase
        .from('notas_fiscais_numeracao')
        .select('ultimo_numero')
        .eq('tipo_nota', formData.tipo_nota)
        .eq('serie', formData.serie)
        .eq('ambiente', 'HOMOLOGACAO')
        .maybeSingle()

      if (error || !data) {
        console.warn('⚠️ Registro de numeração não encontrado, usando número 1')
        setProximoNumero(1)
        return
      }

      // Próximo número = último + 1
      const proximo = data.ultimo_numero + 1
      setProximoNumero(proximo)
      console.log(`✅ Último número usado: ${data.ultimo_numero}, Próximo: ${proximo}`)
    } catch (error) {
      console.error('❌ Erro ao carregar próximo número:', error)
      setProximoNumero(1)
    }
  }

  const incrementarNumeroNoBanco = async () => {
    try {
      console.log('➕ Incrementando número no banco...')
      
      const { error } = await supabase
        .from('notas_fiscais_numeracao')
        .update({ 
          ultimo_numero: proximoNumero,
          updated_at: new Date().toISOString()
        })
        .eq('tipo_nota', formData.tipo_nota)
        .eq('serie', formData.serie)
        .eq('ambiente', 'HOMOLOGACAO')

      if (error) {
        console.error('❌ Erro ao incrementar número:', error)
        throw error
      }

      console.log(`✅ Número incrementado para ${proximoNumero} no banco`)
    } catch (error) {
      console.error('❌ Erro ao incrementar numeração:', error)
      throw error
    }
  }

  const buscarVendasPendentes = async () => {
    try {
      setCarregandoVendas(true)
      console.log('🔄 Buscando vendas pendentes de faturamento...')
      
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          *,
          cliente:clientes(id, nome_completo, razao_social, cpf, cnpj)
        `)
        .is('nota_fiscal_id', null)
        .eq('status', 'PEDIDO_FECHADO')
        .order('numero', { ascending: false })
        .limit(100)

      if (error) {
        console.error('❌ Erro ao buscar vendas:', error)
        throw error
      }

      console.log(`✅ Vendas pendentes encontradas: ${data?.length || 0}`)
      setVendasPendentes(data || [])
    } catch (error) {
      console.error('❌ Erro ao buscar vendas:', error)
      setToast({ tipo: 'error', mensagem: 'Erro ao buscar vendas pendentes' })
    } finally {
      setCarregandoVendas(false)
    }
  }

  const carregarEmpresasEmissoras = async () => {
    try {
      console.log('🔄 Carregando empresas emissoras...')
      
      const { data, error } = await supabase
        .from('empresas')
        .select('*, certificado_digital, certificado_senha, certificado_validade')
        .eq('ativo', true)
        .eq('emite_nfe', true)
        .order('empresa_padrao_nfe', { ascending: false })
        .order('razao_social')

      if (error) {
        console.error('❌ Erro ao carregar empresas:', error)
        console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2))
        throw error
      }
      
      console.log('✅ Empresas carregadas:', data)
      console.log(`📊 Total: ${data?.length || 0} empresas`)
      
      setEmpresas(data || [])
      
      // Buscar empresa padrão primeiro
      const empresaPadrao = data?.find(e => e.empresa_padrao_nfe === true)
      
      if (empresaPadrao) {
        console.log('🎯 Empresa padrão encontrada:', empresaPadrao.nome_fantasia)
        console.log('📋 Dados completos da empresa:', {
          id: empresaPadrao.id,
          razao_social: empresaPadrao.razao_social,
          cnpj: empresaPadrao.cnpj,
          cidade: empresaPadrao.cidade,
          estado: empresaPadrao.estado,
          codigo_municipio: empresaPadrao.codigo_municipio,
          inscricao_estadual: empresaPadrao.inscricao_estadual,
          crt: empresaPadrao.crt,
          tem_certificado: !!(empresaPadrao as any).certificado_digital
        })
        setEmpresaSelecionada(empresaPadrao)
        setFormData(prev => ({ ...prev, empresa_id: empresaPadrao.id, serie: empresaPadrao.serie_nfe || 1 }))
      } else if (data && data.length === 1) {
        // Se houver apenas uma empresa, selecionar automaticamente
        console.log('🎯 Selecionando única empresa automaticamente')
        console.log('📋 Dados completos da empresa:', {
          id: data[0].id,
          razao_social: data[0].razao_social,
          cnpj: data[0].cnpj,
          cidade: data[0].cidade,
          estado: data[0].estado,
          codigo_municipio: data[0].codigo_municipio,
          inscricao_estadual: data[0].inscricao_estadual,
          crt: data[0].crt
        })
        setEmpresaSelecionada(data[0])
        setFormData(prev => ({ ...prev, empresa_id: data[0].id, serie: data[0].serie_nfe || 1 }))
      } else if (!data || data.length === 0) {
        console.warn('⚠️ Nenhuma empresa configurada para emitir NF-e!')
        setToast({ 
          tipo: 'error', 
          mensagem: 'Nenhuma empresa configurada para emitir NF-e. Configure uma empresa em Cadastros > Empresa.' 
        })
      } else {
        console.log(`ℹ️ ${data.length} empresas disponíveis. Defina uma empresa padrão em Cadastros > Empresa.`)
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

  const carregarOperacoesFiscais = async () => {
    try {
      const { data, error } = await supabase
        .from('operacoes_fiscais')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (error) throw error
      
      console.log(`✅ Operações fiscais carregadas: ${data?.length || 0}`)
      setOperacoesFiscais(data || [])
      
      // Auto-selecionar operação padrão
      const operacaoPadrao = data?.find(op => op.operacao_padrao === true)
      if (operacaoPadrao) {
        console.log(`✅ Operação padrão encontrada: ${operacaoPadrao.codigo} - ${operacaoPadrao.nome}`)
        setOperacaoSelecionada(operacaoPadrao)
        setFormData(prev => ({ 
          ...prev, 
          natureza_operacao: operacaoPadrao.natureza_operacao 
        }))
        
        // Selecionar CFOP automaticamente
        selecionarCFOPAutomatico(operacaoPadrao)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar operações fiscais:', error)
      setToast({ tipo: 'error', mensagem: 'Erro ao carregar operações fiscais' })
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

      console.log('📍 Endereço principal do cliente:', endereco)
      console.log('🏘️ Código do município no endereço:', endereco?.codigo_municipio)

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
        destinatario_cep: endereco?.cep || '',
        destinatario_codigo_municipio: endereco?.codigo_municipio || ''
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
      console.log('📋 Empresa ID da venda:', vendaCompleta.empresa_id)

      const cliente = vendaCompleta.cliente
      
      if (!cliente) {
        throw new Error('Cliente não encontrado na venda')
      }
      
      // Buscar endereço e contatos do cliente (para UF e comunicação)
      const { data: endereco } = await supabase
        .from('clientes_enderecos')
        .select('*')
        .eq('cliente_id', cliente.id)
        .eq('principal', true)
        .maybeSingle()

      const { data: contatos } = await supabase
        .from('clientes_contatos')
        .select('*')
        .eq('cliente_id', cliente.id)
        .eq('principal', true)

      const email = contatos?.find(c => c.tipo === 'EMAIL')?.valor || ''
      const telefone = contatos?.find(c => c.tipo === 'TELEFONE' || c.tipo === 'CELULAR')?.valor || ''

      const destinatarioCpfCnpj = cliente.tipo_pessoa === 'FISICA'
        ? cliente.cpf
        : cliente.cnpj

      const destinatarioNome = cliente.tipo_pessoa === 'FISICA'
        ? cliente.nome_completo
        : (cliente.razao_social || cliente.nome_fantasia)

      // Selecionar empresa da venda ANTES de calcular impostos
      let empresaVenda = empresas.find(e => e.id === vendaCompleta.empresa_id)
      
      // Se não houver empresa na venda, usar a empresa padrão
      if (!empresaVenda) {
        console.warn('⚠️ Venda sem empresa_id! Buscando empresa padrão...')
        empresaVenda = empresas.find(e => e.empresa_padrao_nfe === true) || empresas[0]
        
        if (!empresaVenda) {
          setToast({ tipo: 'error', mensagem: '❌ Nenhuma empresa emissora disponível! Configure uma empresa para emitir NF-e.' })
          throw new Error('Nenhuma empresa emissora disponível')
        }
        
        console.log('✅ Usando empresa padrão:', empresaVenda.nome_fantasia)
      } else {
        console.log('✅ Empresa da venda encontrada:', empresaVenda.nome_fantasia)
      }
      
      setEmpresaSelecionada(empresaVenda)

      const ufOrigem = empresaVenda?.estado || 'SP'
      const ufDestino = endereco?.estado || cliente.estado || cliente.uf || ufOrigem

      console.log(`📍 UF Origem: ${ufOrigem}, UF Destino: ${ufDestino}`)

      // Converter itens da venda para itens da nota fiscal
      const itensNota: NotaFiscalItemFormData[] = await Promise.all(
        (vendaCompleta.vendas_itens || []).map(async (itemVenda: any) => {
          // Buscar dados do produto para pegar NCM e código interno
          let produto: any = null

          if (itemVenda.produto_id) {
            const { data } = await supabase
              .from('produtos')
              .select('id, ncm, cfop_saida, cfop_venda_dentro_estado, cfop_venda_fora_estado, codigo_interno, cest, unidade_medida, regra_tributacao_id')
              .eq('id', itemVenda.produto_id)
              .maybeSingle()

            produto = data || null
          }

          if (!produto && itemVenda.produto_codigo) {
            const { data } = await supabase
              .from('produtos')
              .select('id, ncm, cfop_saida, cfop_venda_dentro_estado, cfop_venda_fora_estado, codigo_interno, cest, unidade_medida, regra_tributacao_id')
              .eq('codigo_interno', itemVenda.produto_codigo)
              .maybeSingle()

            produto = data || null
          }

          if (!produto && itemVenda.produto_nome) {
            const { data } = await supabase
              .from('produtos')
              .select('id, ncm, cfop_saida, cfop_venda_dentro_estado, cfop_venda_fora_estado, codigo_interno, cest, unidade_medida, regra_tributacao_id')
              .ilike('nome', itemVenda.produto_nome)
              .limit(1)
              .maybeSingle()

            produto = data || null
          }

          const cfopProduto = ufOrigem === ufDestino
            ? produto?.cfop_venda_dentro_estado
            : produto?.cfop_venda_fora_estado

          const itemBase: NotaFiscalItemFormData = {
            codigo_produto: produto?.codigo_interno || itemVenda.produto_codigo || String(itemVenda.produto_id),
            descricao: itemVenda.produto_nome || itemVenda.descricao,
            ncm: produto?.ncm || '00000000',
            cest: produto?.cest,
            cfop: cfopProduto || produto?.cfop_saida || '5102',
            unidade_comercial: produto?.unidade_medida || 'UN',
            quantidade_comercial: itemVenda.quantidade,
            valor_unitario_comercial: itemVenda.valor_unitario,
            valor_desconto: itemVenda.desconto_valor || 0,
            regra_tributacao_id: produto?.regra_tributacao_id
          }

          // Aplicar motor fiscal automaticamente com dados da empresa
          console.log(`\n💰 ============ CALCULANDO IMPOSTOS VENDA ============`)
          console.log(`📦 Item: ${itemBase.descricao}`)
          console.log(`   - Código: ${itemBase.codigo_produto}`)
          console.log(`   - NCM: ${itemBase.ncm}`)
          console.log(`   - CFOP: ${itemBase.cfop}`)
          console.log(`   - Quantidade: ${itemBase.quantidade_comercial || 0}`)
          console.log(`   - Valor Unitário: R$ ${itemBase.valor_unitario_comercial || 0}`)
          console.log(`   - Valor Total: R$ ${((itemBase.quantidade_comercial || 0) * (itemBase.valor_unitario_comercial || 0)).toFixed(2)}`)
          console.log(`🏢 Dados da Empresa:`)
          console.log(`   - Empresa ID: ${empresaVenda.id}`)
          console.log(`   - Empresa: ${empresaVenda?.razao_social || 'NÃO ENCONTRADA'}`)
          console.log(`   - Regime: ${empresaVenda?.regime_tributario || 'SIMPLES'}`)
          console.log(`📍 UFs:`)
          console.log(`   - Origem: ${ufOrigem}`)
          console.log(`   - Destino: ${ufDestino}`)
          console.log(`   - Operação: ${ufOrigem === ufDestino ? 'DENTRO DO ESTADO' : 'FORA DO ESTADO'}`)

          try {
            const tributosCalculados = await aplicarMotorFiscalNoItem(itemBase, {
              empresaId: empresaVenda.id,
              tipoDocumento: 'NFE',
              tipoOperacao: 'SAIDA',
              ufOrigem,
              ufDestino,
              regimeEmitente: empresaVenda?.regime_tributario || 'SIMPLES',
              cfop: itemBase.cfop
            })

            console.log(`✅ IMPOSTOS CALCULADOS:`)
            console.log(`   - ICMS Valor: R$ ${tributosCalculados.valor_icms || 0}`)
            console.log(`   - PIS Valor: R$ ${tributosCalculados.valor_pis || 0}`)
            console.log(`   - COFINS Valor: R$ ${tributosCalculados.valor_cofins || 0}`)
            console.log(`====================================================\n`)

            // 🚫 VALIDAÇÃO: Verificar se há erro de regra não cadastrada
            if (tributosCalculados.mensagens_fiscais && tributosCalculados.mensagens_fiscais.length > 0) {
              const temErroSemRegra = tributosCalculados.mensagens_fiscais.some(msg => 
                msg.includes('SEM REGRA DE TRIBUTAÇÃO')
              )
              
              if (temErroSemRegra) {
                console.error(`🚫 ITEM REJEITADO: "${itemBase.descricao}" - SEM REGRA DE TRIBUTAÇÃO`)
                throw new Error(
                  `Produto "${itemBase.descricao}" (NCM: ${itemBase.ncm}) não possui regra de tributação cadastrada. ` +
                  `Cadastre a regra em Parâmetros Fiscais > Regras de Tributação antes de emitir a nota.`
                )
              }
            }

            // Calcular valor total do item
            const valor_bruto = (itemBase.quantidade_comercial || 0) * (itemBase.valor_unitario_comercial || 0)
            const valor_total = valor_bruto - (itemBase.valor_desconto || 0) + 
                               (itemBase.valor_frete || 0) + 
                               (itemBase.valor_seguro || 0) + 
                               (itemBase.valor_outras_despesas || 0)
            
            const itemComImpostos = {
              ...itemBase,
              ...tributosCalculados,
              valor_total
            }

            console.log(`📋 Item completo retornado:`, itemComImpostos)

            return itemComImpostos
          } catch (error) {
            console.error(`❌ ERRO AO CALCULAR TRIBUTOS DO ITEM "${itemBase.descricao}":`, error)
            console.error(`Detalhes:`, error instanceof Error ? error.message : error)
            
            // Se o erro for por falta de regra, propagar o erro para bloquear a emissão
            if (error instanceof Error && error.message.includes('não possui regra de tributação')) {
              throw error
            }
            
            console.log(`⚠️ Retornando item SEM impostos`)
            return itemBase
          }
        })
      )

      console.log(`📋 Total de itens processados: ${itensNota.length}`)
      console.log('🧾 Itens com impostos:', itensNota)

      // Atualizar formData com TODOS os dados de uma vez
      setFormData({
        ...formData,
        empresa_id: empresaVenda.id,
        destinatario_cpf_cnpj: destinatarioCpfCnpj,
        destinatario_nome: destinatarioNome,
        destinatario_ie: cliente.inscricao_estadual || '',
        destinatario_email: email,
        destinatario_telefone: telefone,
        destinatario_logradouro: endereco?.logradouro || '',
        destinatario_numero: endereco?.numero || '',
        destinatario_complemento: endereco?.complemento || '',
        destinatario_bairro: endereco?.bairro || '',
        destinatario_cidade: endereco?.cidade || '',
        destinatario_uf: ufDestino,
        destinatario_cep: endereco?.cep || '',
        destinatario_codigo_municipio: endereco?.codigo_municipio || '',
        forma_pagamento: vendaCompleta.forma_pagamento || '0',
        meio_pagamento: vendaCompleta.condicao_pagamento === 'A_VISTA' ? '01' : '15',
        itens: itensNota
      })

      setToast({ tipo: 'success', mensagem: `✅ Dados da venda carregados! ${itensNota.length} itens importados com impostos calculados.` })
      setEtapaAtual(3) // Pular para etapa de produtos, pois já tem tudo preenchido
    } catch (error) {
      console.error('Erro ao preencher dados da venda:', error)
      setToast({ tipo: 'error', mensagem: 'Erro ao carregar dados da venda' })
    } finally {
      setCarregando(false)
    }
  }

  /**
   * Verificar se existem rascunhos pendentes não transmitidos
   */
  const verificarRascunhosPendentes = async () => {
    try {
      console.log('🔍 Verificando rascunhos pendentes...')
      
      const { data: rascunhos, error } = await supabase
        .from('notas_fiscais')
        .select('id, numero, serie, tipo_nota, destinatario_nome, valor_total, data_emissao')
        .eq('status', 'RASCUNHO')
        .order('numero', { ascending: true })
        .limit(10)

      if (error) {
        console.error('❌ Erro ao buscar rascunhos:', error)
        return
      }

      if (rascunhos && rascunhos.length > 0) {
        console.log(`⚠️ Encontrados ${rascunhos.length} rascunho(s) pendente(s)`)
        setRascunhosPendentes(rascunhos)
        setMostrarAlertaRascunho(true)
      } else {
        console.log('✅ Nenhum rascunho pendente')
      }
    } catch (error) {
      console.error('❌ Erro ao verificar rascunhos:', error)
    }
  }

  /**
   * Excluir rascunho
   */
  const excluirRascunho = async (id: number) => {
    try {
      setCarregando(true)
      
      // Verificar se pode excluir
      const validacao = await notasFiscaisService.podeExcluirNota(id)
      
      if (!validacao.pode) {
        setToast({ 
          tipo: 'error', 
          mensagem: `❌ ${validacao.motivo}` 
        })
        return
      }
      
      // Confirmar exclusão
      if (!confirm('⚠️ Deseja realmente excluir este rascunho?\n\nEsta ação não pode ser desfeita e irá liberar o número da nota.')) {
        return
      }
      
      await notasFiscaisService.deletar(id)
      setToast({ tipo: 'success', mensagem: '✅ Rascunho excluído com sucesso!' })
      
      // Se for a nota atual sendo editada, limpar o formulário
      if (notaAtualId === id) {
        setNotaAtualId(null)
        window.location.reload() // Recarregar para limpar tudo
      } else {
        // Atualizar lista de rascunhos pendentes
        verificarRascunhosPendentes()
      }
    } catch (error) {
      console.error('❌ Erro ao excluir rascunho:', error)
      setToast({ 
        tipo: 'error', 
        mensagem: error instanceof Error ? error.message : 'Erro ao excluir rascunho' 
      })
    } finally {
      setCarregando(false)
    }
  }

  /**
   * Seleciona o CFOP automaticamente baseado na comparação de UF
   * - Mesma UF: usa cfop_dentro_estado (5xxx ou 1xxx)
   * - UF diferente: usa cfop_fora_estado (6xxx ou 2xxx)
   * - Exterior: usa cfop_exterior (7xxx ou 3xxx) se disponível
   */
  const selecionarCFOPAutomatico = (operacao: OperacaoFiscal) => {
    const ufEmpresa = empresaSelecionada?.estado?.toUpperCase()
    const ufCliente = formData.destinatario_uf?.toUpperCase()
    
    if (!ufEmpresa) {
      console.warn('⚠️ UF da empresa não definida')
      return
    }

    let cfopSelecionado = ''
    let origem = ''

    // Comparar UF e escolher CFOP
    if (ufCliente === ufEmpresa) {
      cfopSelecionado = operacao.cfop_dentro_estado || ''
      origem = 'dentro do estado'
    } else if (ufCliente && ufCliente.length === 2) {
      cfopSelecionado = operacao.cfop_fora_estado || ''
      origem = 'fora do estado'
    } else if (operacao.cfop_exterior) {
      cfopSelecionado = operacao.cfop_exterior
      origem = 'exterior'
    } else {
      cfopSelecionado = operacao.cfop_dentro_estado || ''
      origem = 'padrão (dentro do estado)'
    }

    console.log(`🔍 CFOP Automático:`)
    console.log(`   Empresa: ${ufEmpresa}`)
    console.log(`   Cliente: ${ufCliente || 'não informado'}`)
    console.log(`   CFOP Escolhido: ${cfopSelecionado} (${origem})`)

    // Atualizar CFOP em todos os itens
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.map(item => ({
        ...item,
        cfop: cfopSelecionado
      }))
    }))

    // Atualizar CFOP padrão para novos itens
    setItemAtual(prev => ({
      ...prev,
      cfop: cfopSelecionado
    }))
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

    if (!empresaSelecionada) {
      setToast({ tipo: 'error', mensagem: '⚠️ Empresa emissora não está selecionada. Selecione a empresa na etapa 1.' })
      return
    }

    // Aplicar motor fiscal ao item antes de adicionar
    try {
      setCarregando(true)
      
      const ufOrigem = empresaSelecionada.estado || 'SP'
      const ufDestino = formData.destinatario_uf || empresaSelecionada.estado || 'SP'
      
      console.log('📋 ADICIONANDO ITEM MANUAL - Dados para cálculo:')
      console.log('   - Item:', itemAtual.descricao)
      console.log('   - Empresa ID:', formData.empresa_id)
      console.log('   - Empresa:', empresaSelecionada.razao_social)
      console.log('   - Regime:', empresaSelecionada.regime_tributario || 'SIMPLES')
      console.log('   - UF Origem:', ufOrigem)
      console.log('   - UF Destino:', ufDestino)
      console.log('   - CFOP:', itemAtual.cfop)
      console.log('   - NCM:', itemAtual.ncm)
      console.log('   - Valor:', itemAtual.valor_unitario_comercial)
      console.log('   - Quantidade:', itemAtual.quantidade_comercial)
      
      const tributosCalculados = await aplicarMotorFiscalNoItem(itemAtual, {
        empresaId: formData.empresa_id,
        tipoDocumento: 'NFE',
        tipoOperacao: 'SAIDA',
        ufOrigem,
        ufDestino,
        regimeEmitente: empresaSelecionada.regime_tributario || 'SIMPLES',
        cfop: itemAtual.cfop
      })

      console.log('💰 Impostos calculados:', tributosCalculados)

      // 🚫 VALIDAÇÃO: Bloquear item sem regra de tributação
      if (tributosCalculados.mensagens_fiscais && tributosCalculados.mensagens_fiscais.length > 0) {
        const temErroSemRegra = tributosCalculados.mensagens_fiscais.some(msg => 
          msg.includes('SEM REGRA DE TRIBUTAÇÃO')
        )
        
        if (temErroSemRegra) {
          setToast({ 
            tipo: 'error', 
            mensagem: `❌ PRODUTO SEM REGRA DE TRIBUTAÇÃO!\n\n` +
              `O produto "${itemAtual.descricao}" (NCM: ${itemAtual.ncm}) não possui uma regra de tributação cadastrada.\n\n` +
              `Acesse: Parâmetros Fiscais > Regras de Tributação e cadastre uma regra para este NCM antes de incluir o produto na nota.`
          })
          return
        }
      }

      // Calcular valor total do item
      const valor_bruto = (itemAtual.quantidade_comercial || 0) * (itemAtual.valor_unitario_comercial || 0)
      const valor_total = valor_bruto - (itemAtual.valor_desconto || 0) + 
                         (itemAtual.valor_frete || 0) + 
                         (itemAtual.valor_seguro || 0) + 
                         (itemAtual.valor_outras_despesas || 0)
      
      const itemComImpostos = {
        ...itemAtual,
        ...tributosCalculados,
        valor_total
      }
      
      console.log('✅ Item final com impostos:', itemComImpostos)

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

      setToast({ tipo: 'success', mensagem: '✅ Item adicionado com impostos calculados' })
    } catch (error) {
      console.error('❌ ERRO AO CALCULAR TRIBUTOS:', error)
      console.error('Detalhes do erro:', error instanceof Error ? error.message : error)
      setToast({ tipo: 'error', mensagem: `❌ Erro ao calcular impostos: ${error instanceof Error ? error.message : 'Erro desconhecido'}` })
      
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
    const qtd = item.quantidade_comercial || 0
    const vlr = item.valor_unitario_comercial || 0
    return qtd * vlr - (item.valor_desconto || 0)
  }

  const calcularTotalNota = () => {
    return formData.itens.reduce((sum, item) => sum + calcularTotalItem(item), 0)
  }

  // Função normalizarCertificado removida - certificado agora é processado no backend via Edge Function

  const handleSalvarRascunho = async () => {
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
      let nota
      
      // Se já existe uma nota salva (notaAtualId), ATUALIZAR ao invés de criar nova
      if (notaAtualId) {
        console.log('📝 Atualizando rascunho existente, ID:', notaAtualId)
        
        // Recalcular totais
        const totais = {
          valor_produtos: formData.itens.reduce((sum, item) => 
            sum + ((item.quantidade_comercial || 0) * (item.valor_unitario_comercial || 0)), 0),
          valor_icms: formData.itens.reduce((sum, item) => sum + (item.valor_icms || 0), 0),
          valor_icms_st: formData.itens.reduce((sum, item) => sum + (item.valor_icms_st || 0), 0),
          valor_pis: formData.itens.reduce((sum, item) => sum + (item.valor_pis || 0), 0),
          valor_cofins: formData.itens.reduce((sum, item) => sum + (item.valor_cofins || 0), 0),
          valor_ipi: formData.itens.reduce((sum, item) => sum + (item.valor_ipi || 0), 0),
        }
        
        const valorTotal = totais.valor_produtos + totais.valor_icms_st + totais.valor_ipi
        
        // Atualizar nota principal
        nota = await notasFiscaisService.atualizar(notaAtualId, {
          natureza_operacao: formData.natureza_operacao,
          destinatario_cpf_cnpj: formData.destinatario_cpf_cnpj,
          destinatario_nome: formData.destinatario_nome,
          destinatario_ie: formData.destinatario_ie,
          destinatario_email: formData.destinatario_email,
          destinatario_logradouro: formData.destinatario_logradouro,
          destinatario_numero: formData.destinatario_numero,
          destinatario_bairro: formData.destinatario_bairro,
          destinatario_cidade: formData.destinatario_cidade,
          destinatario_uf: formData.destinatario_uf,
          destinatario_cep: formData.destinatario_cep,
          modalidade_frete: formData.modalidade_frete,
          forma_pagamento: formData.forma_pagamento,
          meio_pagamento: formData.meio_pagamento,
          valor_pago: formData.valor_pago,
          informacoes_complementares: formData.informacoes_complementares,
          ...totais,
          valor_total: valorTotal
        } as any)
        
        // Deletar itens antigos e inserir novos
        await supabase
          .from('notas_fiscais_itens')
          .delete()
          .eq('nota_fiscal_id', notaAtualId)
        
        // Inserir novos itens
        const itensParaInserir = formData.itens.map((item, index) => ({
          nota_fiscal_id: notaAtualId,
          numero_item: index + 1,
          produto_id: item.produto_id,
          codigo_produto: item.codigo_produto,
          descricao: item.descricao,
          ncm: item.ncm,
          cfop: item.cfop,
          unidade_comercial: item.unidade_comercial,
          quantidade_comercial: item.quantidade_comercial || 0,
          valor_unitario_comercial: item.valor_unitario_comercial || 0,
          valor_bruto: (item.quantidade_comercial || 0) * (item.valor_unitario_comercial || 0),
          valor_desconto: item.valor_desconto || 0,
          valor_total: ((item.quantidade_comercial || 0) * (item.valor_unitario_comercial || 0)) - (item.valor_desconto || 0),
          origem_mercadoria: item.origem_mercadoria || '0',
          cst_icms: item.cst_icms,
          csosn_icms: item.csosn_icms,
          base_calculo_icms: item.base_calculo_icms || 0,
          aliquota_icms: item.aliquota_icms || 0,
          valor_icms: item.valor_icms || 0,
          base_calculo_icms_st: item.base_calculo_icms_st || 0,
          valor_icms_st: item.valor_icms_st || 0,
          base_calculo_pis: item.base_calculo_pis || 0,
          aliquota_pis: item.aliquota_pis || 0,
          valor_pis: item.valor_pis || 0,
          base_calculo_cofins: item.base_calculo_cofins || 0,
          aliquota_cofins: item.aliquota_cofins || 0,
          valor_cofins: item.valor_cofins || 0,
          valor_ipi: item.valor_ipi || 0
        }))
        
        await supabase
          .from('notas_fiscais_itens')
          .insert(itensParaInserir)
        
        setToast({ 
          tipo: 'success', 
          mensagem: `✅ Rascunho atualizado! Número mantido: ${nota.numero}/${nota.serie}` 
        })
      } else {
        // Criar NOVA nota com NOVO número reservado
        console.log('🆕 Criando novo rascunho com número reservado')
        nota = await notasFiscaisService.criarRascunho(formData)
        setNotaAtualId(nota.id)
        
        setToast({ 
          tipo: 'success', 
          mensagem: `✅ Rascunho salvo! Número reservado: ${nota.numero}/${nota.serie}` 
        })
      }
      
      console.log('✅ Rascunho processado com ID:', nota.id, 'Número:', nota.numero)
      
      // NÃO resetar formulário - manter os dados para permitir edição/transmissão
    } catch (error) {
      setToast({ tipo: 'error', mensagem: error instanceof Error ? error.message : 'Erro ao salvar rascunho' })
    } finally {
      setCarregando(false)
    }
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

    if (!empresaSelecionada) {
      setToast({ tipo: 'error', mensagem: 'Selecione a empresa emissora' })
      return
    }

    setCarregando(true)
    try {
      // Configurar serviço NF-e (via Nuvem Fiscal - simplificado)
      const ambiente = (empresaSelecionada.ambiente_nfe || 'HOMOLOGACAO') as 'PRODUCAO' | 'HOMOLOGACAO'
      
      // Nuvem Fiscal gerencia certificados, assinatura e transmissão
      // Configuração feita via variáveis de ambiente (VITE_NUVEM_FISCAL_*)
      const nfeService = criarServicoNFe({
        ambiente
      })

      // Montar dados da nota no formato esperado
      const dadosNota: NotaFiscalDados = {
        empresa_id: empresaSelecionada.id,
        numero: proximoNumero!,
        serie: formData.serie,
        tipo_nota: formData.tipo_nota,
        modelo: formData.tipo_nota === 'NFE' ? '55' : '65',
        tipo_emissao: 'NORMAL',
        ambiente,
        finalidade: formData.finalidade === '1' ? 'NORMAL' : 
                    formData.finalidade === '2' ? 'COMPLEMENTAR' :
                    formData.finalidade === '3' ? 'AJUSTE' : 'DEVOLUCAO',
        natureza_operacao: operacaoSelecionada?.descricao || 'VENDA',
        
        emitente: {
          cnpj: empresaSelecionada.cnpj,
          razao_social: empresaSelecionada.razao_social,
          nome_fantasia: empresaSelecionada.nome_fantasia,
          inscricao_estadual: empresaSelecionada.inscricao_estadual || '',
          regime_tributario: empresaSelecionada.regime_tributario || 'SIMPLES',
          crt: (empresaSelecionada.crt || '1') as '1' | '2' | '3',
          logradouro: empresaSelecionada.logradouro || '',
          numero: empresaSelecionada.numero || 'SN',
          complemento: empresaSelecionada.complemento,
          bairro: empresaSelecionada.bairro || '',
          cidade: empresaSelecionada.cidade || '',
          uf: empresaSelecionada.estado || 'SP',
          cep: empresaSelecionada.cep || '',
          codigo_municipio: String(empresaSelecionada.codigo_municipio || '').replace(/\D/g, '') || '',
          telefone: empresaSelecionada.telefone,
          email: empresaSelecionada.email,
          // Certificado digital para configuração automática
          // certificado_digital: (empresaSelecionada as any).certificado_digital,
          // certificado_senha: (empresaSelecionada as any).certificado_senha
        },
        
        destinatario: {
          tipo_pessoa: formData.destinatario_tipo || 'FISICA',
          cpf_cnpj: formData.destinatario_cpf_cnpj,
          nome_razao: formData.destinatario_nome,
          inscricao_estadual: formData.destinatario_ie,
          indicador_ie: formData.destinatario_indicador_ie || 'NAO_CONTRIBUINTE',
          logradouro: formData.destinatario_logradouro || '',
          numero: formData.destinatario_numero || 'SN',
          complemento: formData.destinatario_complemento,
          bairro: formData.destinatario_bairro || '',
          cidade: formData.destinatario_cidade || '',
          uf: formData.destinatario_uf || 'SP',
          cep: formData.destinatario_cep || '',
          codigo_municipio: String(formData.destinatario_codigo_municipio || '').replace(/\D/g, '') || '',
          telefone: formData.destinatario_telefone,
          email: formData.destinatario_email
        },
        
        itens: formData.itens.map((item, index) => ({
          numero_item: index + 1,
          codigo_produto: item.produto_codigo || item.codigo_produto || '',
          descricao: item.produto_descricao || item.descricao || '',
          ncm: item.ncm,
          cfop: item.cfop,
          unidade: item.unidade || item.unidade_comercial || 'UN',
          quantidade: Number(item.quantidade || item.quantidade_comercial || 0),
          valor_unitario: Number(item.valor_unitario || item.valor_unitario_comercial || 0),
          valor_total: Number(item.valor_total || 0),
          valor_desconto: Number(item.valor_desconto || 0),
          impostos: {
            icms: {
              origem: (item.icms_origem || '0') as '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8',
              cst: item.icms_cst || '00',
              base_calculo: Number(item.icms_base_calculo || 0),
              aliquota: Number(item.icms_aliquota || 0),
              valor: Number(item.icms_valor || 0)
            },
            pis: {
              cst: item.pis_cst || '01',
              base_calculo: Number(item.pis_base_calculo || 0),
              aliquota: Number(item.pis_aliquota || 0),
              valor: Number(item.pis_valor || 0)
            },
            cofins: {
              cst: item.cofins_cst || '01',
              base_calculo: Number(item.cofins_base_calculo || 0),
              aliquota: Number(item.cofins_aliquota || 0),
              valor: Number(item.cofins_valor || 0)
            },
            cbs: item.cbs_aliquota ? {
              aliquota: Number(item.cbs_aliquota),
              valor: Number(item.cbs_valor || 0)
            } : undefined,
            ibs: item.ibs_aliquota ? {
              aliquota: Number(item.ibs_aliquota),
              valor: Number(item.ibs_valor || 0)
            } : undefined
          },
          valor_total_tributos: item.valor_total_tributos
        })),
        
        totais: {
          valor_produtos: formData.itens.reduce((sum, item) => sum + (item.valor_total || 0), 0),
          valor_frete: formData.valor_frete || 0,
          valor_seguro: formData.valor_seguro || 0,
          valor_desconto: formData.valor_desconto || 0,
          valor_outras_despesas: formData.valor_outras_despesas || 0,
          valor_total_tributos: formData.itens.reduce((sum, item) => sum + (item.valor_total_tributos || 0), 0),
          valor_total: formData.itens.reduce((sum, item) => sum + (item.valor_total || 0), 0) + 
                      (formData.valor_frete || 0) + 
                      (formData.valor_seguro || 0) - 
                      (formData.valor_desconto || 0) + 
                      (formData.valor_outras_despesas || 0),
          base_calculo_icms: formData.itens.reduce((sum, item) => sum + (item.icms_base_calculo || 0), 0),
          valor_icms: formData.itens.reduce((sum, item) => sum + (item.icms_valor || 0), 0),
          valor_icms_desonerado: 0,
          base_calculo_icms_st: 0,
          valor_icms_st: 0,
          valor_pis: formData.itens.reduce((sum, item) => sum + (item.pis_valor || 0), 0),
          valor_cofins: formData.itens.reduce((sum, item) => sum + (item.cofins_valor || 0), 0),
          valor_ipi: 0,
          valor_cbs: formData.itens.reduce((sum, item) => sum + (item.cbs_valor || 0), 0),
          valor_ibs: formData.itens.reduce((sum, item) => sum + (item.ibs_valor || 0), 0)
        },
        
        transporte: {
          modalidade: formData.modalidade_frete === '0' ? 'EMITENTE' :
                     formData.modalidade_frete === '1' ? 'DESTINATARIO' :
                     formData.modalidade_frete === '2' ? 'TERCEIROS' :
                     formData.modalidade_frete === '3' ? 'PROPRIO' : 'SEM_FRETE'
        },
        
        pagamento: formData.forma_pagamento && formData.valor_pago ? {
          forma_pagamento: formData.meio_pagamento === '01' ? 'DINHEIRO' :
                          formData.meio_pagamento === '02' ? 'CHEQUE' :
                          formData.meio_pagamento === '03' ? 'CARTAO_CREDITO' :
                          formData.meio_pagamento === '04' ? 'CARTAO_DEBITO' :
                          formData.meio_pagamento === '17' ? 'PIX' :
                          formData.meio_pagamento === '15' ? 'BOLETO' : 'OUTROS',
          valor_pago: Number(formData.valor_pago || 0)
        } : undefined,
        
        informacoes_complementares: formData.informacoes_complementares,
        informacoes_fisco: formData.informacoes_fisco
      }

      // Emitir nota
      setToast({ tipo: 'success', mensagem: '📤 Enviando nota para SEFAZ...' })
      const resultado = await nfeService.emitir(dadosNota)

      // SEMPRE incrementar número no banco após emissão (sucesso ou rejeição)
      // Isso garante que o número seja consumido mesmo se a nota for rejeitada
      await incrementarNumeroNoBanco()
      
      // Recarregar próximo número para exibir
      await carregarProximoNumero()

      if (resultado.sucesso) {
        setToast({ 
          tipo: 'success', 
          mensagem: `✅ NF-e autorizada com sucesso!\nChave: ${resultado.retorno.chaveAcesso?.substring(0, 10)}...` 
        })
        
        // Resetar formulário
        setFormData({
          tipo_nota: 'NFE',
          serie: 1,
          natureza_operacao: '',
          finalidade: '1',
          modalidade_frete: '9',
          forma_pagamento: '0',
          itens: [],
          empresa_id: empresaSelecionada?.id
        })
        setEtapaAtual(1)
      } else {
        const errosDetalhados = resultado.retorno.erros?.map(e => `• ${e.codigo}: ${e.mensagem}`).join('\n') || ''
        setToast({ 
          tipo: 'error', 
          mensagem: `❌ Erro na emissão:\n${resultado.retorno.mensagem}\n${errosDetalhados}` 
        })
      }
    } catch (error: any) {
      console.error('Erro ao emitir nota:', error)
      setToast({ 
        tipo: 'error', 
        mensagem: `Erro ao emitir nota: ${error.message || 'Erro desconhecido'}` 
      })
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white p-3 rounded-lg shadow mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" style={{ color: '#394353' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h1 className="text-base font-semibold">Emitir Nota Fiscal</h1>
              <p className="text-xs text-gray-600">Emissão de NF-e (modelo 55) e NFC-e (modelo 65)</p>
            </div>
          </div>
          {modoEmissao && (
            <button
              onClick={() => {
                setModoEmissao(null)
                setVendaSelecionada(null)
                setEtapaAtual(1)
              }}
              className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-800 border rounded-md"
              style={{ borderColor: '#C9C4B5' }}
            >
              ← Voltar à seleção
            </button>
          )}
        </div>
      </div>

      {/* Alerta de Rascunhos Pendentes */}
      {mostrarAlertaRascunho && rascunhosPendentes.length > 0 && (
        <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-lg shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-xs font-medium text-yellow-800">
                ⚠️ Atenção: Existem {rascunhosPendentes.length} nota(s) fiscal(is) salva(s) e não transmitida(s)
              </h3>
              <div className="mt-2 text-xs text-yellow-700">
                <p className="mb-2">
                  <strong>IMPORTANTE:</strong> Ao iniciar uma nova emissão sem transmitir as notas salvas, você irá <strong>pular a sequência numérica</strong>, o que é <strong>proibido pela SEFAZ</strong> e pode gerar autuação fiscal.
                </p>
                <p className="mb-2 font-semibold">
                  Recomendamos transmitir ou excluir as notas pendentes antes de continuar:
                </p>
                <div className="bg-white rounded-md p-2 space-y-2 max-h-40 overflow-y-auto">
                  {rascunhosPendentes.map((rascunho) => (
                    <div key={rascunho.id} className="flex items-center justify-between border-b border-gray-200 pb-2 last:border-0">
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900 text-xs">NF-e #{rascunho.numero}/{rascunho.serie}</span>
                        <span className="text-gray-600 ml-2 text-xs">-</span>
                        <span className="text-gray-700 ml-2 text-xs">{rascunho.destinatario_nome}</span>
                        <span className="text-gray-500 ml-2 text-xs">
                          (R$ {rascunho.valor_total?.toFixed(2) || '0.00'})
                        </span>
                      </div>
                      <button
                        onClick={() => excluirRascunho(Number(rascunho.id))}
                        className="ml-4 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setMostrarAlertaRascunho(false)}
                  className="px-3 py-1.5 text-xs font-medium text-yellow-800 bg-yellow-100 hover:bg-yellow-200 rounded-md transition-colors"
                >
                  Entendi, continuar mesmo assim
                </button>
                <button
                  onClick={() => window.location.href = '/notas-fiscais/consultar'}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors"
                >
                  Ir para Consultar Notas
                </button>
              </div>
            </div>
            <button
              onClick={() => setMostrarAlertaRascunho(false)}
              className="flex-shrink-0 ml-4 text-yellow-400 hover:text-yellow-600"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>
      )}

      {/* Tela de Seleção de Modo de Emissão */}
      {!modoEmissao && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#394353' }}>Como deseja emitir a nota fiscal?</h2>
          <p className="text-xs text-gray-600 mb-4">Escolha uma das opções abaixo para continuar:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Emissão Manual */}
            <button
              onClick={() => setModoEmissao('MANUAL')}
              className="border rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              style={{ borderColor: '#C9C4B5' }}
            >
              <div className="flex items-start gap-3">
                <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold mb-1 group-hover:text-blue-600" style={{ color: '#394353' }}>Emissão Manual</h3>
                  <p className="text-xs text-gray-600">Preencher todos os dados da nota fiscal manualmente (cliente, produtos, valores, etc.)</p>
                </div>
              </div>
            </button>

            {/* Emissão a partir de Venda */}
            <button
              onClick={() => {
                setModoEmissao('VENDA')
                buscarVendasPendentes()
              }}
              className="border rounded-lg p-4 hover:border-green-500 hover:bg-green-50 transition-all text-left group"
              style={{ borderColor: '#C9C4B5' }}
            >
              <div className="flex items-start gap-3">
                <svg className="w-8 h-8 text-gray-400 group-hover:text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold mb-1 group-hover:text-green-600" style={{ color: '#394353' }}>A partir de uma Venda</h3>
                  <p className="text-xs text-gray-600">Selecionar uma venda existente e gerar a nota fiscal automaticamente com os dados já preenchidos</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Listagem de Vendas Pendentes */}
      {modoEmissao === 'VENDA' && !vendaSelecionada && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: '#394353' }}>Selecione uma Venda</h2>
              <p className="text-xs text-gray-600">Vendas finalizadas aguardando emissão de nota fiscal</p>
            </div>
            <button
              onClick={buscarVendasPendentes}
              disabled={carregandoVendas}
              className="text-xs px-3 py-1.5 rounded-md hover:opacity-90 transition-all flex items-center gap-2"
              style={{ backgroundColor: '#394353', color: 'white' }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Atualizar
            </button>
          </div>

          {carregandoVendas ? (
            <div className="text-center py-8">
              <svg className="animate-spin h-8 w-8 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-xs text-gray-500 mt-2">Carregando vendas...</p>
            </div>
          ) : vendasPendentes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xs">Nenhuma venda pendente de faturamento</p>
              <p className="text-xs text-gray-400 mt-1">As vendas devem estar com status "Pedido Fechado" para aparecer aqui</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {vendasPendentes.map((venda) => {
                const nomeCliente = venda.cliente?.razao_social || venda.cliente?.nome_completo || venda.cliente_nome || 'Cliente não identificado'
                return (
                  <button
                    key={venda.id}
                    onClick={() => {
                      setVendaSelecionada(venda)
                      preencherDadosVenda(venda)
                    }}
                    className="w-full border rounded-lg p-3 hover:border-green-500 hover:bg-green-50 transition-all text-left"
                    style={{ borderColor: '#C9C4B5' }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold" style={{ color: '#394353' }}>Venda #{venda.numero}</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                            {venda.tipo_venda === 'PEDIDO' ? 'Pedido' : venda.tipo_venda === 'VENDA_DIRETA' ? 'Venda Direta' : 'Orçamento'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 mb-1">
                          <strong>Cliente:</strong> {nomeCliente}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span>📅 {new Date(venda.data_venda).toLocaleDateString('pt-BR')}</span>
                          <span>💰 R$ {(venda.total || 0).toFixed(2)}</span>
                          {venda.forma_pagamento && (
                            <span>💳 {venda.forma_pagamento === 'DINHEIRO' ? 'Dinheiro' : venda.forma_pagamento === 'CARTAO_CREDITO' ? 'Cartão Crédito' : venda.forma_pagamento === 'CARTAO_DEBITO' ? 'Cartão Débito' : venda.forma_pagamento === 'PIX' ? 'PIX' : venda.forma_pagamento}</span>
                          )}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Indicador de etapa somente para revisar */}
      {modoEmissao && (modoEmissao === 'MANUAL' || vendaSelecionada) && etapaAtual === 5 && (
        <div className="mb-3 bg-white p-3 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-xs">
              5
            </div>
            <span className="text-sm text-blue-600 font-semibold">Etapa 5: Revisar e Transmitir</span>
          </div>
        </div>
      )}

      {/* Formulário - Todas as etapas em uma tela (exceto revisar) */}
      {modoEmissao && (modoEmissao === 'MANUAL' || vendaSelecionada) && etapaAtual !== 5 && (
      <div className="bg-white rounded-lg shadow p-3">
        {/* Layout em grid - todas as seções visíveis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          
          {/* SEÇÃO 1: Dados Gerais */}
          <div className="border rounded-lg p-3" style={{ borderColor: '#C9C4B5' }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: '#394353' }}>1. Dados Gerais</h2>
            
            {/* Unidade Emissora */}
            <div className="border rounded-lg p-2 mb-2" style={{ backgroundColor: '#EFF6FF', borderColor: '#C9C4B5' }}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                🏢 Unidade Emissora *
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
                className="w-full px-2 py-1 border rounded-md focus:ring-2 focus:border-transparent text-xs bg-white"
                style={{ borderColor: '#C9C4B5' }}
                required
              >
                <option value="">Selecione...</option>
                {empresas.map(empresa => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nome_fantasia || empresa.razao_social} - Série: {empresa.serie_nfe}
                  </option>
                ))}
              </select>
              {empresaSelecionada && (
                <div className="mt-1 text-xs text-slate-600">
                  <p>{empresaSelecionada.cnpj} - {empresaSelecionada.ambiente_nfe === 'PRODUCAO' ? '🟢 Produção' : '🟡 Homologação'}</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tipo *
                </label>
                <select
                  value={formData.tipo_nota}
                  onChange={(e) => setFormData({ ...formData, tipo_nota: e.target.value as 'NFE' | 'NFCE' })}
                  className="w-full px-2 py-1 border rounded-md text-xs"
                  style={{ borderColor: '#C9C4B5' }}
                >
                  <option value="NFE">NF-e</option>
                  <option value="NFCE">NFC-e</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Série *
                </label>
                <input
                  type="number"
                  value={formData.serie}
                  onChange={(e) => setFormData({ ...formData, serie: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 border rounded-md text-xs"
                  style={{ borderColor: '#C9C4B5' }}
                  min="1"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Finalidade *
                </label>
                <select
                  value={formData.finalidade}
                  onChange={(e) => setFormData({ ...formData, finalidade: e.target.value as any })}
                  className="w-full px-2 py-1 border rounded-md text-xs"
                  style={{ borderColor: '#C9C4B5' }}
                >
                  {FINALIDADES_NOTA.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Operação Fiscal / Natureza *
              </label>
              <select
                value={operacaoSelecionada?.id || ''}
                onChange={(e) => {
                  const operacao = operacoesFiscais.find(op => op.id === Number(e.target.value))
                  setOperacaoSelecionada(operacao || null)
                  
                  if (operacao) {
                    setFormData(prev => ({ ...prev, natureza_operacao: operacao.natureza_operacao }))
                    selecionarCFOPAutomatico(operacao)
                  }
                }}
                className="w-full px-2 py-1 border rounded-md text-xs"
                style={{ borderColor: '#C9C4B5' }}
              >
                <option value="">Selecione...</option>
                {operacoesFiscais.map(operacao => (
                  <option key={operacao.id} value={operacao.id}>
                    {operacao.codigo} - {operacao.nome}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                📝 {formData.natureza_operacao || 'Selecione uma operação'}
              </p>
            </div>

            {proximoNumero !== null && formData.empresa_id && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Próxima Nota
                </label>
                <input
                  type="text"
                  value={String(proximoNumero).padStart(6, '0')}
                  disabled
                  className="w-full px-2 py-1 border rounded-md bg-slate-100 text-slate-700 font-semibold text-xs"
                  style={{ borderColor: '#C9C4B5' }}
                />
              </div>
            )}
          </div>

          {/* SEÇÃO 2: Destinatário */}
          <div className="border rounded-lg p-3" style={{ borderColor: '#C9C4B5' }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: '#394353' }}>2. Destinatário</h2>
            
            {/* Campo de busca de cliente */}
            <div className="bg-blue-50 border rounded-lg p-2 mb-2" style={{ borderColor: '#C9C4B5' }}>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                🔍 Buscar Cliente
              </label>
              <select
                value={clienteSelecionado?.id || ''}
                onChange={(e) => {
                  const cliente = clientes.find(c => c.id === Number(e.target.value))
                  if (cliente) preencherDadosCliente(cliente)
                }}
                className="w-full px-2 py-1 border rounded-md text-xs"
                style={{ borderColor: '#C9C4B5' }}
              >
                <option value="">Selecione...</option>
                {clientes.map(cliente => {
                  const nome = cliente.tipo_pessoa === 'FISICA' 
                    ? cliente.nome_completo 
                    : (cliente.razao_social || cliente.nome_fantasia)
                  return (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.codigo} - {nome}
                    </option>
                  )
                })}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  CPF/CNPJ *
                </label>
                <input
                  type="text"
                  value={formData.destinatario_cpf_cnpj || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_cpf_cnpj: e.target.value })}
                  className="w-full px-2 py-1 border rounded-md text-xs"
                  style={{ borderColor: '#C9C4B5' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome/Razão *
                </label>
                <input
                  type="text"
                  value={formData.destinatario_nome || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_nome: e.target.value })}
                  className="w-full px-2 py-1 border rounded-md text-xs"
                  style={{ borderColor: '#C9C4B5' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.destinatario_logradouro || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_logradouro: e.target.value })}
                  className="w-full px-2 py-1 border rounded-md text-xs"
                  style={{ borderColor: '#C9C4B5' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    value={formData.destinatario_numero || ''}
                    onChange={(e) => setFormData({ ...formData, destinatario_numero: e.target.value })}
                    className="w-full px-2 py-1 border rounded-md text-xs"
                    style={{ borderColor: '#C9C4B5' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={formData.destinatario_bairro || ''}
                    onChange={(e) => setFormData({ ...formData, destinatario_bairro: e.target.value })}
                    className="w-full px-2 py-1 border rounded-md text-xs"
                    style={{ borderColor: '#C9C4B5' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.destinatario_cidade || ''}
                    onChange={(e) => setFormData({ ...formData, destinatario_cidade: e.target.value })}
                    className="w-full px-2 py-1 border rounded-md text-xs"
                    style={{ borderColor: '#C9C4B5' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    UF
                  </label>
                  <input
                    type="text"
                    value={formData.destinatario_uf || ''}
                    onChange={(e) => setFormData({ ...formData, destinatario_uf: e.target.value.toUpperCase() })}
                    className="w-full px-2 py-1 border rounded-md text-xs"
                    style={{ borderColor: '#C9C4B5' }}
                    maxLength={2}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={formData.destinatario_cep || ''}
                    onChange={(e) => setFormData({ ...formData, destinatario_cep: e.target.value })}
                    className="w-full px-2 py-1 border rounded-md text-xs"
                    style={{ borderColor: '#C9C4B5' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.destinatario_email || ''}
                  onChange={(e) => setFormData({ ...formData, destinatario_email: e.target.value })}
                  className="w-full px-2 py-1 border rounded-md text-xs"
                  style={{ borderColor: '#C9C4B5' }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* SEÇÃO 3: Produtos (largura completa) */}
        <div className="border rounded-lg p-3 mt-3" style={{ borderColor: '#C9C4B5' }}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: '#394353' }}>3. Produtos/Serviços</h2>
            
            {/* Buscar Produto do Cadastro */}
            <div className="bg-blue-50 p-2 rounded-md border" style={{ borderColor: '#C9C4B5' }}>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                🔍 Produto
              </label>
              <select
                value={produtoSelecionado?.id || ''}
                onChange={(e) => {
                  const produto = produtos.find(p => p.id === e.target.value)
                  if (produto) {
                    preencherDadosProduto(produto)
                  }
                }}
                className="w-full px-2 py-1 text-xs border rounded-md"
                style={{ borderColor: '#C9C4B5' }}
              >
                <option value="">Buscar produto cadastrado...</option>
                {produtos.map(produto => (
                  <option key={produto.id} value={produto.id}>
                    {produto.codigo_interno} - {produto.nome}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Formulário de Item */}
            <div className="bg-slate-50 p-2 rounded-md border mt-2" style={{ borderColor: '#C9C4B5' }}>
              <h3 className="text-xs font-semibold text-slate-700 mb-1">Adicionar Item</h3>
              
              <div className="grid grid-cols-7 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={itemAtual.codigo_produto}
                    onChange={(e) => setItemAtual({ ...itemAtual, codigo_produto: e.target.value })}
                    className="w-full px-2 py-1 text-xs border rounded-md"
                    style={{ borderColor: '#C9C4B5' }}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={itemAtual.descricao}
                    onChange={(e) => setItemAtual({ ...itemAtual, descricao: e.target.value })}
                    className="w-full px-2 py-1 text-xs border rounded-md"
                    style={{ borderColor: '#C9C4B5' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    NCM *
                  </label>
                  <input
                    type="text"
                    value={itemAtual.ncm}
                    onChange={(e) => setItemAtual({ ...itemAtual, ncm: e.target.value })}
                    className="w-full px-2 py-1 text-xs border rounded-md"
                    style={{ borderColor: '#C9C4B5' }}
                    maxLength={8}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    CFOP *
                  </label>
                  <input
                    type="text"
                    value={itemAtual.cfop}
                    onChange={(e) => setItemAtual({ ...itemAtual, cfop: e.target.value })}
                    className="w-full px-2 py-1 text-xs border rounded-md"
                    style={{ borderColor: '#C9C4B5' }}
                    maxLength={4}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Qtd *
                  </label>
                  <input
                    type="number"
                    value={itemAtual.quantidade_comercial}
                    onChange={(e) => setItemAtual({ ...itemAtual, quantidade_comercial: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1 text-xs border rounded-md"
                    style={{ borderColor: '#C9C4B5' }}
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Vlr Unit *
                  </label>
                  <input
                    type="number"
                    value={itemAtual.valor_unitario_comercial}
                    onChange={(e) => setItemAtual({ ...itemAtual, valor_unitario_comercial: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1 text-xs border rounded-md"
                    style={{ borderColor: '#C9C4B5' }}
                    step="0.01"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={adicionarItem}
                    className="w-full px-2 py-1 text-xs font-semibold bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Itens - Formato ERP */}
            {formData.itens.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-slate-700 mb-3">Itens Adicionados ({formData.itens.length})</h3>
                
                <div className="overflow-x-auto border border-[#C9C4B5] rounded">
                  <table className="min-w-full divide-y divide-[#C9C4B5]">
                    <thead className="bg-[#394353]">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase">#</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase">Código</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase min-w-[200px]">Descrição</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase">NCM</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase">CFOP</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">Qtd</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase">UN</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">Vlr. Unit.</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">Vlr. Total</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-white uppercase">CST ICMS</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">BC ICMS</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">Aliq. ICMS</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">Vlr. ICMS</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">BC ICMS-ST</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">Vlr. ICMS-ST</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">Vlr. IPI</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">Vlr. PIS</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">Vlr. COFINS</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-white uppercase w-[80px]">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {formData.itens.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-xs text-slate-900 font-medium">{index + 1}</td>
                          <td className="px-3 py-2 text-xs text-slate-900">{item.codigo_produto}</td>
                          <td className="px-3 py-2 text-xs text-slate-900">{item.descricao}</td>
                          <td className="px-3 py-2 text-xs text-slate-600">{item.ncm}</td>
                          <td className="px-3 py-2 text-xs text-slate-600">{item.cfop}</td>
                          <td className="px-3 py-2 text-xs text-slate-900 text-right">{(item.quantidade_comercial || 0).toFixed(2)}</td>
                          <td className="px-3 py-2 text-xs text-slate-600">{item.unidade_comercial}</td>
                          <td className="px-3 py-2 text-xs text-slate-900 text-right">R$ {(item.valor_unitario_comercial || 0).toFixed(2)}</td>
                          <td className="px-3 py-2 text-xs text-slate-900 font-semibold text-right">
                            R$ {calcularTotalItem(item).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-600 text-center">
                            {item.csosn_icms || item.cst_icms || '-'}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-900 text-right">
                            {item.base_calculo_icms ? `R$ ${item.base_calculo_icms.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-900 text-right">
                            {item.aliquota_icms ? `${item.aliquota_icms.toFixed(2)}%` : '-'}
                          </td>
                          <td className="px-3 py-2 text-xs text-amber-700 font-semibold text-right">
                            {item.valor_icms ? `R$ ${item.valor_icms.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-900 text-right">
                            {item.base_calculo_icms_st && item.base_calculo_icms_st > 0 ? `R$ ${item.base_calculo_icms_st.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-3 py-2 text-xs text-orange-700 font-semibold text-right">
                            {item.valor_icms_st && item.valor_icms_st > 0 ? `R$ ${item.valor_icms_st.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-3 py-2 text-xs text-purple-700 font-semibold text-right">
                            {item.valor_ipi && item.valor_ipi > 0 ? `R$ ${item.valor_ipi.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-3 py-2 text-xs text-green-700 font-semibold text-right">
                            {item.valor_pis ? `R$ ${item.valor_pis.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-3 py-2 text-xs text-blue-700 font-semibold text-right">
                            {item.valor_cofins ? `R$ ${item.valor_cofins.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => removerItem(index)}
                              className="text-xs text-red-600 hover:text-red-800 font-semibold"
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#394353]">
                      <tr>
                        <td colSpan={8} className="px-3 py-3 text-right text-sm font-bold text-white">
                          Total da Nota:
                        </td>
                        <td className="px-3 py-3 text-right text-base font-bold text-white">
                          R$ {calcularTotalNota().toFixed(2)}
                        </td>
                        <td colSpan={3} className="px-3 py-3 text-right text-xs font-semibold text-white">
                          Total ICMS:
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-bold text-amber-300">
                          R$ {formData.itens.reduce((acc, item) => acc + (item.valor_icms || 0), 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-right text-xs font-semibold text-white">
                          Total ST:
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-bold text-orange-300">
                          R$ {formData.itens.reduce((acc, item) => acc + (item.valor_icms_st || 0), 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-bold text-purple-300">
                          R$ {formData.itens.reduce((acc, item) => acc + (item.valor_ipi || 0), 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-bold text-green-300">
                          R$ {formData.itens.reduce((acc, item) => acc + (item.valor_pis || 0), 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-bold text-blue-300">
                          R$ {formData.itens.reduce((acc, item) => acc + (item.valor_cofins || 0), 0).toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 4: Transporte e Pagamento (largura completa) */}
          <div className="border rounded-lg p-3 mt-3" style={{ borderColor: '#C9C4B5' }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: '#394353' }}>4. Transporte e Pagamento</h2>
          
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Modalidade Frete
              </label>
              <select
                value={formData.modalidade_frete}
                onChange={(e) => setFormData({ ...formData, modalidade_frete: e.target.value as any })}
                className="w-full px-2 py-1 border rounded-md text-xs"
                style={{ borderColor: '#C9C4B5' }}
              >
                {MODALIDADES_FRETE.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Forma Pagamento
              </label>
              <select
                value={formData.forma_pagamento}
                onChange={(e) => setFormData({ ...formData, forma_pagamento: e.target.value as any })}
                className="w-full px-2 py-1 border rounded-md text-xs"
                style={{ borderColor: '#C9C4B5' }}
              >
                {FORMAS_PAGAMENTO.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Meio Pagamento
              </label>
              <select
                value={formData.meio_pagamento || ''}
                onChange={(e) => setFormData({ ...formData, meio_pagamento: e.target.value })}
                className="w-full px-2 py-1 border rounded-md text-xs"
                style={{ borderColor: '#C9C4B5' }}
              >
                <option value="">Selecione...</option>
                {MEIOS_PAGAMENTO.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Valor Pago
              </label>
              <input
                type="number"
                value={formData.valor_pago || ''}
                onChange={(e) => setFormData({ ...formData, valor_pago: parseFloat(e.target.value) })}
                className="w-full px-2 py-1 border rounded-md text-xs"
                style={{ borderColor: '#C9C4B5' }}
                step="0.01"
              />
            </div>
          </div>

          <div className="mt-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Informações Complementares
            </label>
            <textarea
              value={formData.informacoes_complementares || ''}
              onChange={(e) => setFormData({ ...formData, informacoes_complementares: e.target.value })}
              className="w-full px-2 py-1 border rounded-md text-xs"
              style={{ borderColor: '#C9C4B5' }}
              rows={2}
              placeholder="Informações adicionais..."
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-between mt-3 pt-3 border-t" style={{ borderColor: '#C9C4B5' }}>
          <button
            onClick={handleSalvarRascunho}
            disabled={carregando}
            className="px-4 py-2 text-sm font-semibold rounded-md hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: '#394353', color: 'white' }}
          >
            {carregando ? 'Salvando...' : '💾 Salvar Rascunho'}
          </button>
          <button
            onClick={() => setEtapaAtual(5)}
            disabled={formData.itens.length === 0}
            className="px-6 py-2 text-sm font-semibold bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-slate-300 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Revisar e Transmitir
          </button>
        </div>
      </div>
      )}

      {/* Etapa 5: Revisão */}
      {modoEmissao && (modoEmissao === 'MANUAL' || vendaSelecionada) && etapaAtual === 5 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="space-y-6">
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#394353' }}>Revisão da Nota Fiscal</h2>

            <div className="grid grid-cols-2 gap-4">
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
              <p className="text-xl font-bold mt-2" style={{ color: '#394353' }}>
                Total: R$ {calcularTotalNota().toFixed(2)}
              </p>
            </div>

            {/* SEÇÃO DE DOCUMENTOS */}
            <div className="border border-[#C9C4B5] rounded-md p-4 bg-white">
              <h3 className="text-base font-semibold text-slate-800 mb-3">📄 Documentos</h3>
              <p className="text-sm text-slate-600 mb-4">
                Antes de transmitir, você pode conferir os documentos gerados:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Baixar XML (Pré-visualização) */}
                <button
                  onClick={() => baixarXMLLocal(formData)}
                  className="flex items-center gap-3 p-3 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors text-left"
                >
                  <svg className="w-10 h-10 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">Baixar XML</p>
                    <p className="text-xs text-slate-500">Arquivo XML para validação técnica</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>

                {/* Baixar Espelho (SEM validade fiscal) */}
                <button
                  onClick={() => baixarEspelhoNFe(formData)}
                  className="flex items-center gap-3 p-3 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors text-left"
                >
                  <svg className="w-10 h-10 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">Baixar Espelho</p>
                    <p className="text-xs text-slate-500">PDF para conferência (SEM validade fiscal)</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>

              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Atenção</p>
                    <p className="text-xs text-amber-800">Estes documentos são apenas para conferência. Após a autorização da SEFAZ, a DANFE oficial será disponibilizada.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setEtapaAtual(1)}
                  className="px-4 py-2 bg-slate-300 text-slate-700 text-sm rounded-md hover:bg-slate-400"
                >
                  ← Voltar ao Formulário
                </button>
                
                {/* Botão Excluir - só aparece se for um rascunho já salvo */}
                {notaAtualId && (
                  <button
                    onClick={() => excluirRascunho(notaAtualId)}
                    disabled={carregando}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Excluir este rascunho (só permitido se não houver notas posteriores autorizadas)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Excluir Nota
                  </button>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleSalvarRascunho}
                  disabled={carregando}
                  className="px-6 py-2 bg-[#394353] text-white text-sm font-semibold rounded-md hover:opacity-90 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Salvar rascunho e reservar o número da nota para concluir depois"
                >
                  {carregando ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Salvar Rascunho
                    </>
                  )}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={carregando}
                  className="px-8 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {carregando ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Transmitindo...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Transmitir para SEFAZ
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

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
