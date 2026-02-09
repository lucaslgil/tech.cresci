// =====================================================
// SERVIÇO PRINCIPAL NF-e
// Orquestra todo o processo de emissão
// =====================================================

import { supabase } from '../../lib/supabase'
import { NuvemFiscalAdapter } from './nuvemFiscalAdapter'
import type { NotaFiscalDados, RetornoSEFAZ, ConfiguracaoNFe } from './types'

export class NFeService {
  // @ts-ignore - Configuração armazenada para uso futuro
  private _config: ConfiguracaoNFe
  private nuvemFiscal: NuvemFiscalAdapter

  constructor(config: ConfiguracaoNFe) {
    this._config = config
    this.nuvemFiscal = new NuvemFiscalAdapter()
    console.log('✅ NFeService configurado com Nuvem Fiscal')
  }

  /**
   * Emitir nota fiscal completa
   */
  async emitir(dados: NotaFiscalDados): Promise<{ 
    sucesso: boolean
    notaId?: number
    retorno: RetornoSEFAZ 
  }> {
    try {
      console.log('🚀 Iniciando emissão de NF-e via Nuvem Fiscal...', dados)

      // 1. Validar dados
      this.validarDados(dados)

      // 2. Salvar rascunho no banco
      const notaId = await this.salvarRascunho(dados)

      // 3. Enviar para Nuvem Fiscal (que irá gerar XML, assinar e transmitir)
      console.log('📤 Enviando para Nuvem Fiscal...')
      const retorno = await this.nuvemFiscal.emitirNFe(dados)

      // 4. Atualizar nota com retorno
      await this.atualizarNota(notaId, retorno)

      // 5. Se autorizada, baixar XML e salvar
      if (retorno.status === 'AUTORIZADA' && retorno.nuvemFiscalId) {
        try {
          const xml = await this.nuvemFiscal.baixarXML(retorno.nuvemFiscalId)
          await this.salvarXML(notaId, xml, 'ASSINADO')
        } catch (error) {
          console.warn('⚠️ Não foi possível baixar XML:', error)
        }
      }

      console.log('✅ Emissão finalizada:', retorno)

      return {
        sucesso: retorno.status === 'AUTORIZADA',
        notaId,
        retorno
      }
    } catch (error: any) {
      console.error('❌ Erro na emissão:', error)
      throw new Error(`Erro ao emitir nota fiscal: ${error.message}`)
    }
  }

  /**
   * Consultar status de uma nota
   */
  async consultar(nuvemFiscalId: string): Promise<RetornoSEFAZ> {
    return await this.nuvemFiscal.consultarNFe(nuvemFiscalId)
  }

  /**
   * Cancelar nota fiscal
   */
  async cancelar(notaId: number, justificativa: string): Promise<RetornoSEFAZ> {
    try {
      console.log(`🔍 Buscando nota ${notaId} para cancelamento...`)
      
      // Buscar nota
      const { data: nota, error } = await supabase
        .from('notas_fiscais')
        .select('chave_acesso, status, nuvem_fiscal_id')
        .eq('id', notaId)
        .single()

      if (error || !nota) {
        throw new Error('Nota fiscal não encontrada')
      }

      console.log(`📋 Nota encontrada:`, {
        status: nota.status,
        nuvem_fiscal_id: nota.nuvem_fiscal_id,
        chave_acesso: nota.chave_acesso?.substring(0, 10) + '...'
      })

      if (nota.status !== 'AUTORIZADA') {
        throw new Error(`Apenas notas autorizadas podem ser canceladas (Status atual: ${nota.status})`)
      }

      if (!nota.nuvem_fiscal_id) {
        throw new Error('ID da Nuvem Fiscal não encontrado. Esta nota pode ter sido emitida sem integração.')
      }

      if (justificativa.length < 15) {
        throw new Error('Justificativa deve ter no mínimo 15 caracteres')
      }

      console.log(`🚫 Enviando cancelamento para Nuvem Fiscal...`)
      
      // Cancelar na Nuvem Fiscal
      const retorno = await this.nuvemFiscal.cancelarNFe(nota.nuvem_fiscal_id, justificativa)

      console.log(`✅ Retorno do cancelamento:`, retorno)

      // Atualizar nota
      if (retorno.status === 'CANCELADA') {
        console.log(`💾 Atualizando status no banco de dados...`)
        
        await supabase
          .from('notas_fiscais')
          .update({
            status: 'CANCELADA',
            justificativa_cancelamento: justificativa,
            data_cancelamento: new Date().toISOString()
          })
          .eq('id', notaId)

        console.log(`✅ Nota cancelada com sucesso!`)
      }

      return retorno
    } catch (error: any) {
      console.error(`❌ Erro no cancelamento:`, error)
      throw new Error(`Erro ao cancelar nota: ${error.message}`)
    }
  }

  /**
   * Validar dados antes do envio
   */
  private validarDados(dados: NotaFiscalDados): void {
    // Validar emitente
    if (!dados.emitente.cnpj || dados.emitente.cnpj.length < 14) {
      throw new Error('CNPJ do emitente inválido')
    }

    // IE do emitente é obrigatória em produção
    if (!dados.emitente.inscricao_estadual && dados.ambiente === 'PRODUCAO') {
      throw new Error('Inscrição Estadual do emitente obrigatória')
    }

    // Validar destinatário
    if (!dados.destinatario.cpf_cnpj) {
      throw new Error('CPF/CNPJ do destinatário obrigatório')
    }

    // Validação de IE do destinatário:
    // - Não é obrigatória para PF (CPF) ou clientes isentos
    // - Para PJ contribuinte, deve ser numérica
    // - "ISENTO" é aceito para não contribuintes
    const cpfCnpj = dados.destinatario.cpf_cnpj.replace(/\D/g, '')
    const isPessoaFisica = cpfCnpj.length === 11
    const ieDestinatario = dados.destinatario.inscricao_estadual?.trim().toUpperCase()
    
    if (!isPessoaFisica && ieDestinatario && ieDestinatario !== 'ISENTO') {
      // PJ com IE informada (que não seja ISENTO) deve ser numérica
      if (!/^\d+$/.test(ieDestinatario)) {
        throw new Error('Inscrição Estadual do destinatário deve ser numérica ou ISENTO')
      }
    }

    // Validar itens
    if (!dados.itens || dados.itens.length === 0) {
      throw new Error('Nota fiscal deve ter pelo menos um item')
    }

    dados.itens.forEach((item, index) => {
      if (!item.codigo_produto) {
        throw new Error(`Item ${index + 1}: código do produto obrigatório`)
      }
      if (!item.descricao) {
        throw new Error(`Item ${index + 1}: descrição obrigatória`)
      }
      if (!item.ncm || item.ncm.length < 8) {
        throw new Error(`Item ${index + 1}: NCM inválido`)
      }
      if (!item.cfop) {
        throw new Error(`Item ${index + 1}: CFOP obrigatório`)
      }
      if (item.quantidade <= 0) {
        throw new Error(`Item ${index + 1}: quantidade deve ser maior que zero`)
      }
      if (item.valor_unitario <= 0) {
        throw new Error(`Item ${index + 1}: valor unitário deve ser maior que zero`)
      }
    })

    // Validar totais
    if (dados.totais.valor_total <= 0) {
      throw new Error('Valor total deve ser maior que zero')
    }
  }

  /**
   * Salvar rascunho no banco de dados
   */
  private async salvarRascunho(dados: NotaFiscalDados): Promise<number> {
    const dadosParaInserir = {
        empresa_id: dados.empresa_id,
        numero: parseInt(String(dados.numero || 0)),
        serie: parseInt(String(dados.serie || 1)),
        tipo_nota: dados.tipo_nota,
        modelo: dados.modelo,
        ambiente: dados.ambiente === 'HOMOLOGACAO' ? 2 : 1,
        status: 'RASCUNHO',
        
        // Natureza da operação
        natureza_operacao: dados.natureza_operacao || 'VENDA',
        cfop_predominante: dados.itens[0]?.cfop || '5102',
        finalidade: dados.finalidade === 'NORMAL' ? '1' : 
                    dados.finalidade === 'COMPLEMENTAR' ? '2' :
                    dados.finalidade === 'AJUSTE' ? '3' : '4',
        
        // Destinatário
        // Determinar tipo: 'F' (CPF/Física) ou 'J' (CNPJ/Jurídica)
        destinatario_tipo: dados.destinatario.cpf_cnpj.replace(/\D/g, '').length === 11 ? 'F' : 'J',
        destinatario_cpf_cnpj: dados.destinatario.cpf_cnpj?.replace(/\D/g, '') || '',
        destinatario_nome: dados.destinatario.nome_razao,
        destinatario_ie: dados.destinatario.inscricao_estadual?.replace(/\D/g, '') || '',
        destinatario_logradouro: dados.destinatario.logradouro,
        destinatario_numero: dados.destinatario.numero,
        destinatario_complemento: dados.destinatario.complemento,
        destinatario_bairro: dados.destinatario.bairro,
        destinatario_cidade: dados.destinatario.cidade,
        destinatario_uf: dados.destinatario.uf,
        destinatario_cep: dados.destinatario.cep?.replace(/\D/g, '') || '',
        destinatario_codigo_municipio: dados.destinatario.codigo_municipio?.replace(/\D/g, '') || '',
        destinatario_email: dados.destinatario.email,
        
        // Totais
        valor_produtos: parseFloat(String(dados.totais.valor_produtos || 0)),
        valor_frete: parseFloat(String(dados.totais.valor_frete || 0)),
        valor_seguro: parseFloat(String(dados.totais.valor_seguro || 0)),
        valor_desconto: parseFloat(String(dados.totais.valor_desconto || 0)),
        valor_outras_despesas: parseFloat(String(dados.totais.valor_outras_despesas || 0)),
        valor_total: parseFloat(String(dados.totais.valor_total || 0)),
        
        base_calculo_icms: parseFloat(String(dados.totais.base_calculo_icms || 0)),
        valor_icms: parseFloat(String(dados.totais.valor_icms || 0)),
        base_calculo_icms_st: parseFloat(String(dados.totais.base_calculo_icms_st || 0)),
        valor_icms_st: parseFloat(String(dados.totais.valor_icms_st || 0)),
        valor_pis: parseFloat(String(dados.totais.valor_pis || 0)),
        valor_cofins: parseFloat(String(dados.totais.valor_cofins || 0)),
        valor_ipi: parseFloat(String(dados.totais.valor_ipi || 0)),
        
        // Informações adicionais
        informacoes_complementares: dados.informacoes_complementares,
        informacoes_fisco: dados.informacoes_fisco,
        
        data_emissao: new Date().toISOString()
      }
    
    // Log para debug
    console.log('🔍 Dados para inserir:', JSON.stringify(dadosParaInserir, null, 2))
    console.log('📏 Tamanhos dos campos string:', Object.entries(dadosParaInserir)
      .filter(([_k, v]) => typeof v === 'string')
      .map(([k, v]) => `${k}: ${(v as string).length} chars`)
      .join('\n'))
    
    const { data, error } = await supabase
      .from('notas_fiscais')
      .insert(dadosParaInserir)
      .select('id')
      .single()

    if (error) {
      console.error('Erro ao salvar rascunho:', error)
      console.error('Código:', error.code)
      console.error('Mensagem:', error.message)
      console.error('Detalhes:', error.details)
      console.error('Hint:', error.hint)
      throw new Error(`Erro ao salvar nota no banco de dados: ${error.message}`)
    }

    // Salvar itens
    const itensParaSalvar = dados.itens.map(item => ({
      nota_fiscal_id: data.id,
      numero_item: parseInt(String(item.numero_item || 1)),
      codigo_produto: item.codigo_produto,
      descricao: item.descricao,
      ncm: item.ncm,
      cfop: item.cfop,
      unidade_comercial: item.unidade,
      quantidade_comercial: parseFloat(String(item.quantidade || 0)),
      valor_unitario_comercial: parseFloat(String(item.valor_unitario || 0)),
      valor_bruto: parseFloat(String(item.valor_total || 0)),
      valor_desconto: parseFloat(String(item.valor_desconto || 0)),
      valor_total: parseFloat(String(item.valor_total || 0)),
      unidade_tributavel: item.unidade,
      quantidade_tributavel: parseFloat(String(item.quantidade || 0)),
      valor_unitario_tributavel: parseFloat(String(item.valor_unitario || 0)),
      
      // ICMS
      origem_mercadoria: item.impostos.icms.origem,
      cst_icms: item.impostos.icms.cst,
      base_calculo_icms: parseFloat(String(item.impostos.icms.base_calculo || 0)),
      aliquota_icms: parseFloat(String(item.impostos.icms.aliquota || 0)),
      valor_icms: parseFloat(String(item.impostos.icms.valor || 0)),
      
      // PIS
      cst_pis: item.impostos.pis.cst,
      base_calculo_pis: parseFloat(String(item.impostos.pis.base_calculo || 0)),
      aliquota_pis: parseFloat(String(item.impostos.pis.aliquota || 0)),
      valor_pis: parseFloat(String(item.impostos.pis.valor || 0)),
      
      // COFINS
      cst_cofins: item.impostos.cofins.cst,
      base_calculo_cofins: parseFloat(String(item.impostos.cofins.base_calculo || 0)),
      aliquota_cofins: parseFloat(String(item.impostos.cofins.aliquota || 0)),
      valor_cofins: parseFloat(String(item.impostos.cofins.valor || 0))
    }))

    console.log('💾 Salvando', itensParaSalvar.length, 'itens...')
    console.log('📦 Itens:', JSON.stringify(itensParaSalvar, null, 2))
    
    const { error: itensError } = await supabase.from('notas_fiscais_itens').insert(itensParaSalvar)
    
    if (itensError) {
      console.error('❌ Erro ao salvar itens:', itensError)
      throw new Error(`Erro ao salvar itens: ${itensError.message}`)
    }
    
    console.log('✅ Itens salvos com sucesso')

    return data.id
  }

  /**
   * Salvar XML
   */
  private async salvarXML(notaId: number, xml: string, tipo: string): Promise<void> {
    await supabase.from('notas_fiscais_xmls').insert({
      nota_fiscal_id: notaId,
      tipo_xml: tipo,
      conteudo: xml,
      data_geracao: new Date().toISOString()
    })
  }

  /**
   * Atualizar nota com retorno da SEFAZ/Nuvem Fiscal
   */
  private async atualizarNota(notaId: number, retorno: RetornoSEFAZ): Promise<void> {
    const update: any = {
      status: retorno.status,
      motivo_status: retorno.mensagem || null,
      codigo_status_sefaz: retorno.codigo ? String(retorno.codigo) : null
    }

    if (retorno.status === 'AUTORIZADA') {
      update.chave_acesso = retorno.chaveAcesso || null
      update.protocolo_autorizacao = retorno.numeroProtocolo || null
      update.data_autorizacao = retorno.dataHoraAutorizacao || null
      
      // Armazenar ID da Nuvem Fiscal para referências futuras
      if (retorno.nuvemFiscalId) {
        update.nuvem_fiscal_id = retorno.nuvemFiscalId
      }
    }

    // Se rejeitada, garantir que os dados de rejeição estão corretos
    if (retorno.status === 'REJEITADA') {
      update.codigo_status_sefaz = retorno.codigo ? String(retorno.codigo) : null
      update.motivo_status = retorno.mensagem || null
    }

    console.log('📝 Atualizando nota no banco:', update)

    const { error } = await supabase
      .from('notas_fiscais')
      .update(update)
      .eq('id', notaId)

    if (error) {
      console.error('❌ Erro ao atualizar nota no banco:', error)
      throw new Error(`Erro ao atualizar nota: ${error.message}`)
    }
  }
}

// Exportar instância configurável
export const criarServicoNFe = (config: ConfiguracaoNFe) => {
  return new NFeService(config)
}

// Instância padrão para uso direto
export const nfeService = new NFeService({
  ambiente: 'HOMOLOGACAO'
})
