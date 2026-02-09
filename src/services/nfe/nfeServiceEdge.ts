// =====================================================
// SERVIÇO NF-e - EDGE FUNCTION
// Versão que usa Supabase Edge Functions (backend)
// =====================================================

import { supabase } from '../../lib/supabase'
import type { NotaFiscalDados, RetornoSEFAZ, ConfiguracaoNFe } from './types'

export class NFeServiceEdge {
  private config: ConfiguracaoNFe

  constructor(config: ConfiguracaoNFe) {
    this.config = config
  }

  /**
   * Emitir nota fiscal via Edge Function
   */
  async emitir(dados: NotaFiscalDados): Promise<{ 
    sucesso: boolean
    notaId?: number
    retorno: RetornoSEFAZ 
  }> {
    try {
      console.log('🚀 Iniciando emissão de NF-e via Edge Function...', dados)

      // 1. Validar dados básicos
      this.validarDados(dados)

      // 2. Salvar rascunho no banco
      const notaId = await this.salvarRascunho(dados)

      // 3. Chamar Edge Function para processar emissão
      console.log('📤 Enviando para Edge Function...')
      console.log('🔗 URL:', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/emitir-nfe`)
      console.log('📋 Nota ID:', notaId)
      
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/emitir-nfe`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            notaId,
            config: {
              ambiente: this.config.ambiente,
              provider: this.config.api_intermediaria?.provider || 'FOCUS',
              token: this.config.api_intermediaria?.token,
              csc_id: this.config.csc?.id,
              csc_codigo: this.config.csc?.codigo
            }
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Resposta da Edge Function:', response.status, error)
        throw new Error(error.error || error.details || 'Erro ao emitir nota')
      }

      const resultado = await response.json()

      return {
        sucesso: resultado.sucesso,
        notaId,
        retorno: {
          status: resultado.sucesso ? 'AUTORIZADA' : 'ERRO',
          mensagem: resultado.mensagem || 'Processado',
          chaveAcesso: resultado.chave_acesso,
          numeroProtocolo: resultado.protocolo,
          dataHoraAutorizacao: resultado.data_autorizacao,
          xml_autorizado: resultado.xml_autorizado
        }
      }
    } catch (error: any) {
      console.error('❌ Erro na emissão:', error)
      
      return {
        sucesso: false,
        retorno: {
          status: 'ERRO',
          mensagem: error.message || 'Erro ao emitir nota fiscal',
          erros: [{
            codigo: 'ERRO_GERAL',
            mensagem: error.message
          }]
        }
      }
    }
  }

  /**
   * Validar dados obrigatórios
   */
  private validarDados(dados: NotaFiscalDados): void {
    if (!dados.empresa_id) throw new Error('Empresa não informada')
    if (!dados.numero) throw new Error('Número da nota não informado')
    if (!dados.serie) throw new Error('Série não informada')
    if (!dados.itens || dados.itens.length === 0) {
      throw new Error('A nota precisa ter pelo menos 1 item')
    }

    // Validar destinatário
    if (!dados.destinatario?.cpf_cnpj) {
      throw new Error('CPF/CNPJ do destinatário é obrigatório')
    }
    if (!dados.destinatario?.nome_razao) {
      throw new Error('Nome/Razão Social do destinatário é obrigatório')
    }

    // Validar itens
    dados.itens.forEach((item, index) => {
      if (!item.codigo_produto) {
        throw new Error(`Item ${index + 1}: Código do produto é obrigatório`)
      }
      if (!item.descricao) {
        throw new Error(`Item ${index + 1}: Descrição é obrigatória`)
      }
      if (!item.ncm || item.ncm.length !== 8) {
        throw new Error(`Item ${index + 1}: NCM inválido (deve ter 8 dígitos)`)
      }
      if (!item.cfop) {
        throw new Error(`Item ${index + 1}: CFOP é obrigatório`)
      }
      if (!item.quantidade || item.quantidade <= 0) {
        throw new Error(`Item ${index + 1}: Quantidade inválida`)
      }
      if (!item.valor_unitario || item.valor_unitario <= 0) {
        throw new Error(`Item ${index + 1}: Valor unitário inválido`)
      }
    })
  }

  /**
   * Salvar rascunho da nota no banco
   */
  private async salvarRascunho(dados: NotaFiscalDados): Promise<number> {
    // Calcular CFOP predominante (o mais comum nos itens)
    const cfopCounts = dados.itens.reduce((acc, item) => {
      acc[item.cfop] = (acc[item.cfop] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const cfopPredominante = Object.entries(cfopCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '5102'
    
    const { data, error } = await supabase
      .from('notas_fiscais')
      .insert({
        empresa_id: dados.empresa_id,
        tipo_nota: dados.tipo_nota,
        modelo: dados.modelo,
        serie: dados.serie,
        numero: dados.numero,
        natureza_operacao: dados.natureza_operacao,
        cfop_predominante: cfopPredominante,
        finalidade: dados.finalidade === 'NORMAL' ? '1' : 
                    dados.finalidade === 'COMPLEMENTAR' ? '2' : 
                    dados.finalidade === 'AJUSTE' ? '3' : '4',
        tipo_emissao: dados.tipo_emissao === 'NORMAL' ? '1' : 
                      dados.tipo_emissao === 'CONTINGENCIA' ? '9' : '1',
        ambiente: dados.ambiente === 'PRODUCAO' ? 1 : 2,
        
        // Destinatário
        destinatario_tipo: dados.destinatario.tipo_pessoa === 'FISICA' ? 'F' : 'J',
        destinatario_cpf_cnpj: dados.destinatario.cpf_cnpj?.replace(/\D/g, ''),
        destinatario_nome: dados.destinatario.nome_razao,
        destinatario_ie: dados.destinatario.inscricao_estadual,
        destinatario_indicador_ie: dados.destinatario.indicador_ie,
        destinatario_logradouro: dados.destinatario.logradouro,
        destinatario_numero: dados.destinatario.numero,
        destinatario_complemento: dados.destinatario.complemento,
        destinatario_bairro: dados.destinatario.bairro,
        destinatario_cidade: dados.destinatario.cidade,
        destinatario_uf: dados.destinatario.uf,
        destinatario_cep: dados.destinatario.cep?.replace(/\D/g, ''),
        destinatario_codigo_municipio: dados.destinatario.codigo_municipio,
        destinatario_telefone: dados.destinatario.telefone?.replace(/\D/g, ''),
        destinatario_email: dados.destinatario.email,
        
        // Totais
        valor_produtos: dados.totais.valor_produtos,
        valor_frete: dados.totais.valor_frete,
        valor_seguro: dados.totais.valor_seguro,
        valor_desconto: dados.totais.valor_desconto,
        valor_outras_despesas: dados.totais.valor_outras_despesas,
        valor_total: dados.totais.valor_total,
        valor_total_tributos: dados.totais.valor_total_tributos,
        base_calculo_icms: dados.totais.base_calculo_icms,
        valor_icms: dados.totais.valor_icms,
        valor_pis: dados.totais.valor_pis,
        valor_cofins: dados.totais.valor_cofins,
        
        // Informações adicionais
        modalidade_frete: dados.transporte?.modalidade === 'EMITENTE' ? '0' :
                          dados.transporte?.modalidade === 'DESTINATARIO' ? '1' : '9',
        forma_pagamento: dados.pagamento?.forma_pagamento === 'DINHEIRO' ? '01' : 
                         dados.pagamento?.forma_pagamento === 'PIX' ? '17' : '99',
        valor_pago: dados.pagamento?.valor_pago,
        informacoes_complementares: dados.informacoes_complementares,
        informacoes_fisco: dados.informacoes_fisco,
        
        status: 'RASCUNHO'
      })
      .select('id')
      .single()

    if (error) throw new Error(`Erro ao salvar rascunho: ${error.message}`)
    if (!data) throw new Error('Erro ao criar nota fiscal')

    // Salvar itens
    const itensParaInserir = dados.itens.map(item => ({
      nota_fiscal_id: data.id,
      numero_item: item.numero_item,
      codigo_produto: item.codigo_produto,
      descricao: item.descricao,
      ncm: item.ncm,
      cfop: item.cfop,
      
      // Unidades comercial e tributável (mesmos valores)
      unidade_comercial: item.unidade,
      quantidade_comercial: item.quantidade,
      valor_unitario_comercial: item.valor_unitario,
      unidade_tributavel: item.unidade,
      quantidade_tributavel: item.quantidade,
      valor_unitario_tributavel: item.valor_unitario,
      
      valor_bruto: item.valor_total,
      valor_total: item.valor_total,
      valor_desconto: item.valor_desconto || 0,
      
      // Impostos
      origem_mercadoria: item.impostos.icms.origem,
      icms_origem: item.impostos.icms.origem,
      icms_cst: item.impostos.icms.cst,
      icms_base_calculo: item.impostos.icms.base_calculo,
      icms_aliquota: item.impostos.icms.aliquota,
      icms_valor: item.impostos.icms.valor,
      base_calculo_icms: item.impostos.icms.base_calculo,
      aliquota_icms: item.impostos.icms.aliquota,
      valor_icms: item.impostos.icms.valor,
      
      pis_cst: item.impostos.pis.cst,
      pis_base_calculo: item.impostos.pis.base_calculo,
      pis_aliquota: item.impostos.pis.aliquota,
      pis_valor: item.impostos.pis.valor,
      base_calculo_pis: item.impostos.pis.base_calculo,
      aliquota_pis: item.impostos.pis.aliquota,
      valor_pis: item.impostos.pis.valor,
      
      cofins_cst: item.impostos.cofins.cst,
      cofins_base_calculo: item.impostos.cofins.base_calculo,
      cofins_aliquota: item.impostos.cofins.aliquota,
      cofins_valor: item.impostos.cofins.valor,
      base_calculo_cofins: item.impostos.cofins.base_calculo,
      aliquota_cofins: item.impostos.cofins.aliquota,
      valor_cofins: item.impostos.cofins.valor,
      
      aliquota_cbs: item.impostos.cbs?.aliquota || 0,
      valor_cbs: item.impostos.cbs?.valor || 0,
      base_calculo_cbs: 0, // CBS não tem base de cálculo separada
      
      aliquota_ibs: item.impostos.ibs?.aliquota || 0,
      valor_ibs: item.impostos.ibs?.valor || 0,
      base_calculo_ibs: 0, // IBS não tem base de cálculo separada
      
      valor_total_tributos: item.valor_total_tributos || 0
    }))

    const { error: itensError } = await supabase
      .from('notas_fiscais_itens')
      .insert(itensParaInserir)

    if (itensError) {
      // Rollback: deletar nota
      await supabase.from('notas_fiscais').delete().eq('id', data.id)
      throw new Error(`Erro ao salvar itens: ${itensError.message}`)
    }

    return data.id
  }
}

/**
 * Factory para criar o serviço
 */
export const criarServicoNFeEdge = (config: ConfiguracaoNFe) => {
  return new NFeServiceEdge(config)
}
