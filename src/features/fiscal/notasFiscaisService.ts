// =====================================================
// SERVIÇO DE EMISSÃO DE NOTAS FISCAIS
// Integração com vendas e cálculo tributário
// Data: 13/01/2026
// =====================================================

import { supabase } from '../../lib/supabase'
import { calculoTributarioService, type DadosCalculoTributario } from './calculoTributarioService'

/**
 * TIPOS
 */

export interface NotaFiscalFormData {
  // Tipo de emissão
  modo_emissao: 'AVULSA' | 'VENDA' // Emissão avulsa ou a partir de uma venda
  
  // Se vier de venda
  venda_id?: number
  
  // Tipo de nota
  tipo_nota: 'NFE' | 'NFCE'
  numero?: number
  serie: number
  
  // Natureza e finalidade
  natureza_operacao: string
  cfop_predominante: string
  finalidade: '1' | '2' | '3' | '4' // 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
  
  // Empresa emissora
  empresa_id: number
  
  // Destinatário
  cliente_id?: number
  destinatario_cpf_cnpj?: string
  destinatario_nome?: string
  destinatario_ie?: string
  destinatario_email?: string
  destinatario_telefone?: string
  
  // Endereço destinatário
  destinatario_logradouro?: string
  destinatario_numero?: string
  destinatario_complemento?: string
  destinatario_bairro?: string
  destinatario_cidade?: string
  destinatario_uf?: string
  destinatario_cep?: string
  destinatario_codigo_municipio?: string
  
  // Itens
  itens: NotaFiscalItemFormData[]
  
  // Totais (calculados automaticamente)
  valor_frete?: number
  valor_seguro?: number
  valor_desconto?: number
  valor_outras_despesas?: number
  
  // Transporte
  modalidade_frete?: '0' | '1' | '2' | '3' | '4' | '9'
  transportadora_cpf_cnpj?: string
  transportadora_nome?: string
  
  // Pagamento
  forma_pagamento?: '0' | '1' // 0=À vista, 1=A prazo
  meio_pagamento?: string
  valor_pago?: number
  
  // Observações
  informacoes_complementares?: string
  informacoes_fisco?: string
}

export interface NotaFiscalItemFormData {
  produto_id?: string
  codigo_produto: string
  codigo_barras?: string
  descricao: string
  ncm: string
  cest?: string
  cfop: string
  unidade_comercial: string
  quantidade_comercial: number
  valor_unitario_comercial: number
  valor_desconto?: number
  valor_frete?: number
  
  // Tributação (será calculada automaticamente)
  origem_mercadoria: string
}

export interface ResultadoEmissaoNota {
  sucesso: boolean
  mensagem: string
  nota_fiscal_id?: number
  chave_acesso?: string
  protocolo?: string
  xml?: string
  erros?: string[]
}

/**
 * SERVIÇO DE EMISSÃO DE NOTAS FISCAIS
 */
export const notasFiscaisService = {
  /**
   * EMISSÃO AVULSA - Usuário preenche tudo manualmente
   */
  async emitirNotaAvulsa(formData: NotaFiscalFormData): Promise<ResultadoEmissaoNota> {
    try {
      // 1. Validar dados da nota
      const validacao = await this.validarNotaFiscal(formData)
      if (!validacao.valido) {
        return {
          sucesso: false,
          mensagem: 'Dados inválidos para emissão',
          erros: validacao.erros
        }
      }

      // 2. Buscar dados da empresa emissora
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', formData.empresa_id)
        .single()

      if (empresaError || !empresa) {
        return {
          sucesso: false,
          mensagem: 'Empresa emissora não encontrada',
          erros: [empresaError?.message || 'Empresa não encontrada']
        }
      }

      // 3. Obter próximo número da nota
      const { data: proximoNumero, error: numeroError } = await supabase
        .rpc('obter_proximo_numero_nota_fiscal', {
          p_tipo_nota: formData.tipo_nota,
          p_serie: formData.serie
        })

      if (numeroError) throw numeroError

      // 4. Calcular tributação de todos os itens
      const anoAtual = new Date().getFullYear()
      const itensCalculados = []
      
      let totalProdutos = 0
      let totalICMS = 0
      let totalPIS = 0
      let totalCOFINS = 0
      let totalIBS = 0
      let totalCBS = 0

      for (const item of formData.itens) {
        const valorTotal = item.quantidade_comercial * item.valor_unitario_comercial
        totalProdutos += valorTotal

        // Calcular tributação do item
        const dadosCalculo: DadosCalculoTributario = {
          ncm: item.ncm,
          cest: item.cest,
          valorUnitario: item.valor_unitario_comercial,
          quantidade: item.quantidade_comercial,
          valorTotal: valorTotal,
          cfop: item.cfop,
          ufOrigem: empresa.uf || 'SP',
          ufDestino: formData.destinatario_uf || 'SP',
          tipoOperacao: 'SAIDA',
          finalidadeNota: formData.finalidade,
          anoOperacao: anoAtual,
          regimeTributario: empresa.regime_tributario || 'SIMPLES'
        }

        const tributacao = await calculoTributarioService.calcularTributacaoItem(dadosCalculo)

        // Somar tributos
        totalICMS += tributacao.sistemaAntigo.icms.valor
        totalPIS += tributacao.sistemaAntigo.pis.valor
        totalCOFINS += tributacao.sistemaAntigo.cofins.valor
        totalIBS += tributacao.sistemaNovo.ibs.valor
        totalCBS += tributacao.sistemaNovo.cbs.valor

        itensCalculados.push({
          ...item,
          tributacao,
          valor_bruto: valorTotal,
          valor_total: valorTotal - (item.valor_desconto || 0)
        })
      }

      // 5. Calcular totais da nota
      const valorTotal = totalProdutos + 
        (formData.valor_frete || 0) + 
        (formData.valor_seguro || 0) + 
        (formData.valor_outras_despesas || 0) - 
        (formData.valor_desconto || 0)

      // 6. Inserir cabeçalho da nota
      const { data: notaFiscal, error: notaError } = await supabase
        .from('notas_fiscais')
        .insert({
          tipo_nota: formData.tipo_nota,
          numero: proximoNumero,
          serie: formData.serie,
          data_emissao: new Date().toISOString(),
          natureza_operacao: formData.natureza_operacao,
          cfop_predominante: formData.cfop_predominante,
          finalidade: formData.finalidade,
          
          // Destinatário
          cliente_id: formData.cliente_id,
          destinatario_tipo: 'CLIENTE',
          destinatario_cpf_cnpj: formData.destinatario_cpf_cnpj,
          destinatario_nome: formData.destinatario_nome,
          destinatario_ie: formData.destinatario_ie,
          destinatario_email: formData.destinatario_email,
          destinatario_telefone: formData.destinatario_telefone,
          destinatario_logradouro: formData.destinatario_logradouro,
          destinatario_numero: formData.destinatario_numero,
          destinatario_complemento: formData.destinatario_complemento,
          destinatario_bairro: formData.destinatario_bairro,
          destinatario_cidade: formData.destinatario_cidade,
          destinatario_uf: formData.destinatario_uf,
          destinatario_cep: formData.destinatario_cep,
          destinatario_codigo_municipio: formData.destinatario_codigo_municipio,
          
          // Totais
          valor_produtos: totalProdutos,
          valor_frete: formData.valor_frete || 0,
          valor_seguro: formData.valor_seguro || 0,
          valor_desconto: formData.valor_desconto || 0,
          valor_outras_despesas: formData.valor_outras_despesas || 0,
          valor_total: valorTotal,
          
          // Impostos - Sistema Antigo
          base_calculo_icms: totalProdutos,
          valor_icms: totalICMS,
          valor_pis: totalPIS,
          valor_cofins: totalCOFINS,
          
          // Impostos - Sistema Novo (Reforma 2026)
          base_calculo_ibs: totalProdutos,
          valor_ibs: totalIBS,
          base_calculo_cbs: totalProdutos,
          valor_cbs: totalCBS,
          regime_tributario_nota: 'TRANSICAO',
          ano_competencia: anoAtual,
          
          // Transporte
          modalidade_frete: formData.modalidade_frete,
          transportadora_cpf_cnpj: formData.transportadora_cpf_cnpj,
          transportadora_nome: formData.transportadora_nome,
          
          // Pagamento
          forma_pagamento: formData.forma_pagamento,
          meio_pagamento: formData.meio_pagamento,
          valor_pago: formData.valor_pago,
          
          // Observações
          informacoes_complementares: formData.informacoes_complementares,
          informacoes_fisco: formData.informacoes_fisco,
          
          // Status
          status: 'RASCUNHO',
          
          // Auditoria
          usuario_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (notaError) throw notaError

      // 7. Inserir itens da nota
      for (let i = 0; i < itensCalculados.length; i++) {
        const item = itensCalculados[i]
        const trib = item.tributacao

        const { error: itemError } = await supabase
          .from('notas_fiscais_itens')
          .insert({
            nota_fiscal_id: notaFiscal.id,
            numero_item: i + 1,
            produto_id: item.produto_id,
            codigo_produto: item.codigo_produto,
            codigo_barras: item.codigo_barras,
            descricao: item.descricao,
            ncm: item.ncm,
            cest: item.cest,
            cfop: item.cfop,
            unidade_comercial: item.unidade_comercial,
            quantidade_comercial: item.quantidade_comercial,
            valor_unitario_comercial: item.valor_unitario_comercial,
            valor_bruto: item.valor_bruto,
            valor_desconto: item.valor_desconto || 0,
            valor_frete: item.valor_frete || 0,
            valor_total: item.valor_total,
            unidade_tributavel: item.unidade_comercial,
            quantidade_tributavel: item.quantidade_comercial,
            valor_unitario_tributavel: item.valor_unitario_comercial,
            origem_mercadoria: item.origem_mercadoria,
            
            // ICMS
            cst_icms: trib.sistemaAntigo.icms.cst,
            csosn_icms: trib.sistemaAntigo.icms.csosn,
            base_calculo_icms: trib.sistemaAntigo.icms.baseCalculo,
            aliquota_icms: trib.sistemaAntigo.icms.aliquota,
            valor_icms: trib.sistemaAntigo.icms.valor,
            
            // PIS
            cst_pis: trib.sistemaAntigo.pis.cst,
            base_calculo_pis: trib.sistemaAntigo.pis.baseCalculo,
            aliquota_pis: trib.sistemaAntigo.pis.aliquota,
            valor_pis: trib.sistemaAntigo.pis.valor,
            
            // COFINS
            cst_cofins: trib.sistemaAntigo.cofins.cst,
            base_calculo_cofins: trib.sistemaAntigo.cofins.baseCalculo,
            aliquota_cofins: trib.sistemaAntigo.cofins.aliquota,
            valor_cofins: trib.sistemaAntigo.cofins.valor,
            
            // IBS/CBS (Reforma 2026)
            cst_ibs: trib.sistemaNovo.ibs.cst,
            base_calculo_ibs: trib.sistemaNovo.ibs.baseCalculo,
            aliquota_ibs: trib.sistemaNovo.ibs.aliquota,
            valor_ibs: trib.sistemaNovo.ibs.valor,
            credito_ibs: trib.sistemaNovo.ibs.creditoApropriado,
            
            cst_cbs: trib.sistemaNovo.cbs.cst,
            base_calculo_cbs: trib.sistemaNovo.cbs.baseCalculo,
            aliquota_cbs: trib.sistemaNovo.cbs.aliquota,
            valor_cbs: trib.sistemaNovo.cbs.valor,
            credito_cbs: trib.sistemaNovo.cbs.creditoApropriado
          })

        if (itemError) throw itemError
      }

      // 8. TODO: Gerar chave de acesso
      // const chaveAcesso = await this.gerarChaveAcesso(notaFiscal)

      // 9. TODO: Enviar para SEFAZ (integração futura)
      // const resultado = await this.enviarParaSEFAZ(notaFiscal, chaveAcesso)

      return {
        sucesso: true,
        mensagem: `Nota Fiscal ${formData.tipo_nota} #${proximoNumero} criada com sucesso!`,
        nota_fiscal_id: notaFiscal.id
      }
    } catch (error) {
      console.error('Erro ao emitir nota avulsa:', error)
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : 'Erro ao emitir nota fiscal',
        erros: [error instanceof Error ? error.message : 'Erro desconhecido']
      }
    }
  },

  /**
   * EMISSÃO VIA VENDA - Busca dados da venda e converte em nota
   */
  async emitirNotaDeVenda(vendaId: number, tipoNota: 'NFE' | 'NFCE', serie: number): Promise<ResultadoEmissaoNota> {
    try {
      // 1. Buscar venda completa
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .select(`
          *,
          vendas_itens (*)
        `)
        .eq('id', vendaId)
        .single()

      if (vendaError || !venda) {
        return {
          sucesso: false,
          mensagem: 'Venda não encontrada',
          erros: [vendaError?.message || 'Venda não encontrada']
        }
      }

      // 2. Verificar se venda já tem nota fiscal vinculada
      if (venda.nota_fiscal_id) {
        return {
          sucesso: false,
          mensagem: 'Esta venda já possui nota fiscal vinculada',
          erros: ['Venda já faturada']
        }
      }

      // 3. Buscar dados do cliente
      let dadosCliente = null
      if (venda.cliente_id) {
        const { data: cliente } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', venda.cliente_id)
          .single()

        dadosCliente = cliente
      }

      // 4. Montar dados da nota a partir da venda
      const formDataNota: NotaFiscalFormData = {
        modo_emissao: 'VENDA',
        venda_id: venda.id,
        tipo_nota: tipoNota,
        serie: serie,
        natureza_operacao: 'VENDA DE MERCADORIA',
        cfop_predominante: '5102', // Venda de mercadoria
        finalidade: '1', // Normal
        empresa_id: venda.empresa_id || 1,
        
        // Destinatário (do cliente ou da venda)
        cliente_id: venda.cliente_id,
        destinatario_cpf_cnpj: venda.cliente_cpf_cnpj || dadosCliente?.cpf || dadosCliente?.cnpj,
        destinatario_nome: venda.cliente_nome || dadosCliente?.nome_completo || dadosCliente?.razao_social,
        destinatario_ie: dadosCliente?.inscricao_estadual,
        destinatario_email: dadosCliente?.email,
        destinatario_telefone: dadosCliente?.telefone,
        destinatario_logradouro: dadosCliente?.logradouro,
        destinatario_numero: dadosCliente?.numero,
        destinatario_complemento: dadosCliente?.complemento,
        destinatario_bairro: dadosCliente?.bairro,
        destinatario_cidade: dadosCliente?.cidade,
        destinatario_uf: dadosCliente?.uf,
        destinatario_cep: dadosCliente?.cep,
        
        // Valores da venda
        valor_frete: venda.frete || 0,
        valor_desconto: venda.desconto || 0,
        valor_outras_despesas: venda.outras_despesas || 0,
        
        // Itens - converter itens da venda
        itens: (venda.vendas_itens || []).map((item: any) => ({
          produto_id: item.produto_id,
          codigo_produto: item.produto_codigo,
          descricao: item.produto_nome,
          ncm: '00000000', // TODO: Buscar NCM do produto
          cfop: '5102',
          unidade_comercial: 'UN',
          quantidade_comercial: item.quantidade,
          valor_unitario_comercial: item.valor_unitario,
          origem_mercadoria: '0' // 0-Nacional
        })),
        
        // Pagamento
        forma_pagamento: venda.condicao_pagamento === 'A_VISTA' ? '0' : '1',
        
        // Observações
        informacoes_complementares: venda.observacoes || undefined
      }

      // 5. Emitir nota usando fluxo de emissão avulsa
      const resultado = await this.emitirNotaAvulsa(formDataNota)

      // 6. Se sucesso, vincular nota à venda
      if (resultado.sucesso && resultado.nota_fiscal_id) {
        await supabase
          .from('vendas')
          .update({
            nota_fiscal_id: resultado.nota_fiscal_id,
            status: 'FATURADO'
          })
          .eq('id', vendaId)
      }

      return resultado
    } catch (error) {
      console.error('Erro ao emitir nota de venda:', error)
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : 'Erro ao emitir nota de venda',
        erros: [error instanceof Error ? error.message : 'Erro desconhecido']
      }
    }
  },

  /**
   * Validar dados da nota fiscal antes da emissão
   */
  async validarNotaFiscal(formData: NotaFiscalFormData): Promise<{ valido: boolean; erros: string[] }> {
    const erros: string[] = []

    // Validar campos obrigatórios
    if (!formData.tipo_nota) erros.push('Tipo de nota é obrigatório')
    if (!formData.serie) erros.push('Série da nota é obrigatória')
    if (!formData.natureza_operacao) erros.push('Natureza da operação é obrigatória')
    if (!formData.cfop_predominante) erros.push('CFOP é obrigatório')
    if (!formData.finalidade) erros.push('Finalidade é obrigatória')
    if (!formData.destinatario_cpf_cnpj) erros.push('CPF/CNPJ do destinatário é obrigatório')
    if (!formData.destinatario_nome) erros.push('Nome do destinatário é obrigatório')

    // Validar itens
    if (!formData.itens || formData.itens.length === 0) {
      erros.push('Nota fiscal deve ter pelo menos um item')
    } else {
      formData.itens.forEach((item, index) => {
        if (!item.descricao) erros.push(`Item ${index + 1}: Descrição é obrigatória`)
        if (!item.ncm || item.ncm.length !== 8) erros.push(`Item ${index + 1}: NCM inválido`)
        if (!item.cfop) erros.push(`Item ${index + 1}: CFOP é obrigatório`)
        if (item.quantidade_comercial <= 0) erros.push(`Item ${index + 1}: Quantidade deve ser maior que zero`)
        if (item.valor_unitario_comercial <= 0) erros.push(`Item ${index + 1}: Valor unitário deve ser maior que zero`)
      })
    }

    return {
      valido: erros.length === 0,
      erros
    }
  },

  /**
   * Listar notas fiscais com filtros
   */
  async listar(filtros?: {
    tipo_nota?: 'NFE' | 'NFCE'
    status?: string
    data_inicio?: string
    data_fim?: string
    cliente_id?: number
  }) {
    let query = supabase
      .from('notas_fiscais')
      .select('*')
      .order('data_emissao', { ascending: false })

    if (filtros?.tipo_nota) query = query.eq('tipo_nota', filtros.tipo_nota)
    if (filtros?.status) query = query.eq('status', filtros.status)
    if (filtros?.cliente_id) query = query.eq('cliente_id', filtros.cliente_id)
    if (filtros?.data_inicio) query = query.gte('data_emissao', filtros.data_inicio)
    if (filtros?.data_fim) query = query.lte('data_emissao', filtros.data_fim)

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  /**
   * Buscar nota por ID
   */
  async buscarPorId(id: number) {
    const { data, error } = await supabase
      .from('notas_fiscais')
      .select(`
        *,
        notas_fiscais_itens (*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Cancelar nota fiscal
   */
  async cancelar(notaFiscalId: number, motivo: string): Promise<ResultadoEmissaoNota> {
    try {
      // TODO: Implementar envio de evento de cancelamento para SEFAZ

      const { error } = await supabase
        .from('notas_fiscais')
        .update({
          status: 'CANCELADA',
          data_cancelamento: new Date().toISOString(),
          motivo_cancelamento: motivo
        })
        .eq('id', notaFiscalId)

      if (error) throw error

      return {
        sucesso: true,
        mensagem: 'Nota fiscal cancelada com sucesso'
      }
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : 'Erro ao cancelar nota',
        erros: [error instanceof Error ? error.message : 'Erro desconhecido']
      }
    }
  }
}
