// =====================================================
// SERVICES - NOTAS FISCAIS
// Serviços para emissão, consulta e gerenciamento de NF-e/NFC-e
// Data: 01/12/2025
// Atualização: 06/02/2026 - Cancelamento via Nuvem Fiscal
// =====================================================

import { supabase } from '../../lib/supabase'
import { aplicarMotorFiscalNoItem } from './fiscalEngine'
import { nfeService } from '../../services/nfe/nfeService'
import type { 
  NotaFiscal, 
  NotaFiscalFormData, 
  NotaFiscalItem,
  RetornoSEFAZ 
} from './types'

/**
 * CRUD de Notas Fiscais
 */
export const notasFiscaisService = {
  /**
   * Listar notas fiscais
   */
  async listar(filtros?: {
    tipo?: 'NFE' | 'NFCE'
    status?: string
    dataInicio?: string
    dataFim?: string
    cliente?: string
  }) {
    let query = supabase
      .from('notas_fiscais')
      .select('*, notas_fiscais_itens(count)')
      .order('data_emissao', { ascending: false })

    if (filtros?.tipo) {
      query = query.eq('tipo_nota', filtros.tipo)
    }

    if (filtros?.status) {
      query = query.eq('status', filtros.status)
    }

    if (filtros?.dataInicio) {
      query = query.gte('data_emissao', filtros.dataInicio)
    }

    if (filtros?.dataFim) {
      query = query.lte('data_emissao', filtros.dataFim)
    }

    if (filtros?.cliente) {
      query = query.ilike('destinatario_nome', `%${filtros.cliente}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data as NotaFiscal[]
  },

  /**
   * Buscar nota fiscal por ID
   */
  async buscarPorId(id: string | number) {
    const { data, error } = await supabase
      .from('notas_fiscais')
      .select('*, notas_fiscais_itens(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as NotaFiscal & { notas_fiscais_itens: NotaFiscalItem[] }
  },

  /**
   * Buscar por chave de acesso
   */
  async buscarPorChave(chaveAcesso: string) {
    const { data, error } = await supabase
      .from('notas_fiscais')
      .select('*, notas_fiscais_itens(*)')
      .eq('chave_acesso', chaveAcesso)
      .single()

    if (error) throw error
    return data as NotaFiscal & { notas_fiscais_itens: NotaFiscalItem[] }
  },

  /**
   * Criar rascunho de nota fiscal
   */
  async criarRascunho(dados: NotaFiscalFormData) {
    // 1. Obter próximo número
    const proximo = await this.obterProximoNumero(dados.tipo_nota, dados.serie)

    // 2. Calcular totais dos itens
    const totais = calcularTotaisNota(dados.itens)

    // 3. Criar nota
    const { data: nota, error: erroNota } = await supabase
      .from('notas_fiscais')
      .insert({
        tipo_nota: dados.tipo_nota,
        numero: proximo,
        serie: dados.serie,
        empresa_id: dados.empresa_id,
        natureza_operacao: dados.natureza_operacao,
        cfop_predominante: dados.itens[0]?.cfop || '5102',
        finalidade: dados.finalidade,
        cliente_id: dados.cliente_id,
        destinatario_cpf_cnpj: dados.destinatario_cpf_cnpj,
        destinatario_nome: dados.destinatario_nome,
        destinatario_ie: dados.destinatario_ie,
        destinatario_email: dados.destinatario_email,
        destinatario_telefone: dados.destinatario_telefone,
        destinatario_logradouro: dados.destinatario_logradouro,
        destinatario_numero: dados.destinatario_numero,
        destinatario_complemento: dados.destinatario_complemento,
        destinatario_bairro: dados.destinatario_bairro,
        destinatario_cidade: dados.destinatario_cidade,
        destinatario_uf: dados.destinatario_uf,
        destinatario_cep: dados.destinatario_cep,
        ...totais,
        modalidade_frete: dados.modalidade_frete,
        forma_pagamento: dados.forma_pagamento,
        meio_pagamento: dados.meio_pagamento,
        valor_pago: dados.valor_pago,
        informacoes_complementares: dados.informacoes_complementares,
        informacoes_fisco: dados.informacoes_fisco,
        status: 'RASCUNHO'
      })
      .select()
      .single()

    if (erroNota) {
      console.error('❌ Erro ao criar nota fiscal:', erroNota)
      console.error('Detalhes do erro:', JSON.stringify(erroNota, null, 2))
      console.error('Dados enviados:', {
        tipo_nota: dados.tipo_nota,
        numero: proximo,
        serie: dados.serie,
        empresa_id: dados.empresa_id,
        natureza_operacao: dados.natureza_operacao,
        cfop_predominante: dados.itens[0]?.cfop || '5102',
        finalidade: dados.finalidade
      })
      throw new Error(erroNota.message || 'Erro ao criar rascunho de nota fiscal')
    }

    // 4. Inserir itens
    // Antes de inserir, aplicar motor fiscal para preencher campos de impostos
    const itensComImpostos = await Promise.all(dados.itens.map(async (item) => {
      const impostos = await aplicarMotorFiscalNoItem(item, {
        empresaId: dados.empresa_id ? Number(dados.empresa_id) : 1,
        tipoOperacao: dados.natureza_operacao || 'VENDA',
        tipoDocumento: 'NFE',
        ufOrigem: 'SP',
        ufDestino: dados.destinatario_uf || 'SP'
      })

      return { ...item, ...impostos }
    }))

    const itensParaInserir = itensComImpostos.map((item, index) => ({
      nota_fiscal_id: nota.id,
      numero_item: index + 1,
      produto_id: item.produto_id,
      codigo_produto: item.codigo_produto,
      descricao: item.descricao,
      ncm: item.ncm,
      cfop: item.cfop,
      unidade_comercial: item.unidade_comercial,
      quantidade_comercial: item.quantidade_comercial,
      valor_unitario_comercial: item.valor_unitario_comercial,
      valor_bruto: item.quantidade_comercial * item.valor_unitario_comercial,
      valor_desconto: item.valor_desconto || 0,
      valor_total: (item.quantidade_comercial * item.valor_unitario_comercial) - (item.valor_desconto || 0),
      unidade_tributavel: item.unidade_comercial,
      quantidade_tributavel: item.quantidade_comercial,
      valor_unitario_tributavel: item.valor_unitario_comercial,
      origem_mercadoria: item.origem_mercadoria || '0',
      cst_icms: (item as any).cst_icms,
      csosn_icms: (item as any).csosn_icms,
      modalidade_bc_icms: (item as any).modalidade_bc_icms,
      reducao_bc_icms: (item as any).reducao_bc_icms || 0,
      base_calculo_icms: (item as any).base_calculo_icms || 0,
      aliquota_icms: (item as any).aliquota_icms || 0,
      valor_icms: (item as any).valor_icms || 0,
      modalidade_bc_icms_st: (item as any).modalidade_bc_icms_st,
      mva_st: (item as any).mva_st || 0,
      reducao_bc_icms_st: (item as any).reducao_bc_icms_st || 0,
      base_calculo_icms_st: (item as any).base_calculo_icms_st || 0,
      aliquota_icms_st: (item as any).aliquota_icms_st || 0,
      valor_icms_st: (item as any).valor_icms_st || 0,
      base_calculo_pis: (item as any).base_calculo_pis || 0,
      aliquota_pis: (item as any).aliquota_pis || 0,
      valor_pis: (item as any).valor_pis || 0,
      base_calculo_cofins: (item as any).base_calculo_cofins || 0,
      aliquota_cofins: (item as any).aliquota_cofins || 0,
      valor_cofins: (item as any).valor_cofins || 0,
      base_calculo_ipi: (item as any).base_calculo_ipi || 0,
      aliquota_ipi: (item as any).aliquota_ipi || 0,
      valor_ipi: (item as any).valor_ipi || 0
    }))

    const { error: erroItens } = await supabase
      .from('notas_fiscais_itens')
      .insert(itensParaInserir)

    if (erroItens) throw erroItens

    return nota
  },

  /**
   * Atualizar nota fiscal (apenas rascunho)
   */
  async atualizar(id: string | number, dados: Partial<NotaFiscal>) {
    const { data, error } = await supabase
      .from('notas_fiscais')
      .update(dados)
      .eq('id', id)
      .eq('status', 'RASCUNHO')
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Verificar se pode excluir uma nota fiscal
   * Não permite exclusão se houver notas posteriores AUTORIZADAS na mesma série
   */
  async podeExcluirNota(id: string | number): Promise<{ pode: boolean; motivo?: string }> {
    try {
      // 1. Buscar a nota que se deseja excluir
      const { data: nota, error: erroNota } = await supabase
        .from('notas_fiscais')
        .select('numero, serie, tipo_nota, status')
        .eq('id', id)
        .single()

      if (erroNota || !nota) {
        return { pode: false, motivo: 'Nota fiscal não encontrada' }
      }

      // 2. Verificar se a nota já foi autorizada
      if (nota.status === 'AUTORIZADA') {
        return { pode: false, motivo: 'Não é possível excluir uma nota fiscal já autorizada pela SEFAZ' }
      }

      // 3. Verificar se existem notas posteriores AUTORIZADAS na mesma série e tipo
      const { data: notasPosteriores, error: erroPosteriores } = await supabase
        .from('notas_fiscais')
        .select('numero, status')
        .eq('tipo_nota', nota.tipo_nota)
        .eq('serie', nota.serie)
        .gt('numero', nota.numero)
        .eq('status', 'AUTORIZADA')
        .order('numero', { ascending: true })
        .limit(1)

      if (erroPosteriores) {
        throw erroPosteriores
      }

      // 4. Se existirem notas posteriores autorizadas, não pode excluir
      if (notasPosteriores && notasPosteriores.length > 0) {
        return {
          pode: false,
          motivo: `Não é possível excluir esta nota pois existe a nota nº ${notasPosteriores[0].numero} já autorizada pela SEFAZ. Excluir esta nota geraria uma quebra na sequência numérica.`
        }
      }

      return { pode: true }
    } catch (error) {
      console.error('Erro ao verificar se pode excluir nota:', error)
      return { pode: false, motivo: 'Erro ao verificar possibilidade de exclusão' }
    }
  },

  /**
   * Deletar nota fiscal (apenas rascunho sem notas posteriores autorizadas)
   */
  async deletar(id: string | number) {
    // Validar se pode excluir
    const validacao = await this.podeExcluirNota(id)
    if (!validacao.pode) {
      throw new Error(validacao.motivo || 'Não é possível excluir esta nota')
    }

    // Excluir nota
    const { error } = await supabase
      .from('notas_fiscais')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Obter próximo número disponível
   */
  async obterProximoNumero(tipoNota: 'NFE' | 'NFCE', serie: number) {
    const { data, error } = await supabase
      .rpc('get_proximo_numero_nota', {
        p_tipo_nota: tipoNota,
        p_serie: serie,
        p_ambiente: 'HOMOLOGACAO' // TODO: Buscar dos parâmetros
      })

    if (error) throw error
    return data as number
  },

  /**
   * Gerar chave de acesso
   */
  async gerarChaveAcesso(nota: NotaFiscal) {
    // TODO: Buscar UF e CNPJ dos parâmetros fiscais
    const codigoNumerico = Math.floor(Math.random() * 100000000).toString().padStart(8, '0')

    const { data, error } = await supabase
      .rpc('gerar_chave_acesso_nfe', {
        p_uf: 'SP',
        p_data_emissao: nota.data_emissao,
        p_cnpj: '12345678000195', // TODO: Buscar dos parâmetros
        p_modelo: nota.tipo_nota === 'NFE' ? '55' : '65',
        p_serie: nota.serie,
        p_numero: nota.numero,
        p_tipo_emissao: '1',
        p_codigo_numerico: codigoNumerico
      })

    if (error) throw error
    return data as string
  },

  /**
   * Processar e enviar nota para SEFAZ
   */
  async emitir(id: string | number): Promise<RetornoSEFAZ> {
    try {
      // 1. Buscar nota
      const nota = await this.buscarPorId(id)

      if (nota.status !== 'RASCUNHO') {
        throw new Error('Apenas notas em rascunho podem ser emitidas')
      }

      // 2. Validar dados
      validarNotaFiscal(nota)

      // 3. Gerar chave de acesso
      const chaveAcesso = await this.gerarChaveAcesso(nota)

      // 4. Atualizar nota com chave
      await supabase
        .from('notas_fiscais')
        .update({
          chave_acesso: chaveAcesso,
          status: 'PROCESSANDO'
        })
        .eq('id', id)

      // 5. Gerar XML
      const xml = gerarXMLNFe(nota, nota.notas_fiscais_itens)

      // 6. Assinar XML (TODO: Implementar assinatura digital)
      const xmlAssinado = xml

      // 7. Enviar para SEFAZ (TODO: Implementar integração)
      // Por enquanto, simular aprovação em homologação
      const retorno: RetornoSEFAZ = {
        sucesso: true,
        codigo: '100',
        mensagem: 'Autorizado o uso da NF-e',
        chave_acesso: chaveAcesso,
        protocolo: '999999999999999',
        data_autorizacao: new Date().toISOString()
      }

      // 8. Atualizar status
      await supabase
        .from('notas_fiscais')
        .update({
          status: 'AUTORIZADA',
          xml_enviado: xmlAssinado,
          xml_autorizado: xmlAssinado,
          protocolo_autorizacao: retorno.protocolo,
          data_autorizacao: retorno.data_autorizacao,
          status_sefaz: retorno.mensagem,
          codigo_status_sefaz: retorno.codigo
        })
        .eq('id', id)

      return retorno
    } catch (error) {
      // Atualizar status para rejeitada em caso de erro
      await supabase
        .from('notas_fiscais')
        .update({
          status: 'REJEITADA',
          motivo_status: error instanceof Error ? error.message : 'Erro desconhecido'
        })
        .eq('id', id)

      throw error
    }
  },

  /**
   * Cancelar nota fiscal autorizada
   * Envia evento de cancelamento para SEFAZ via Nuvem Fiscal
   */
  async cancelar(id: string | number, justificativa: string) {
    try {
      // 1. Buscar nota completa
      const nota = await this.buscarPorId(id)

      // 2. Validações
      if (nota.status !== 'AUTORIZADA') {
        throw new Error('Apenas notas autorizadas podem ser canceladas')
      }

      if (nota.status === 'CANCELADA') {
        throw new Error('Esta nota já foi cancelada')
      }

      if (!nota.chave_acesso) {
        throw new Error('Nota sem chave de acesso. Não pode ser cancelada')
      }

      if (!justificativa || justificativa.trim().length < 15) {
        throw new Error('Justificativa de cancelamento deve ter no mínimo 15 caracteres')
      }

      // 3. Validar prazo de cancelamento (24h após autorização)
      if (nota.data_autorizacao) {
        const dataAutorizacao = new Date(nota.data_autorizacao)
        const agora = new Date()
        const diferencaHoras = (agora.getTime() - dataAutorizacao.getTime()) / (1000 * 60 * 60)
        
        // SEFAZ permite cancelamento em até 168 horas (7 dias) 
        // mas o ideal é avisar se passou de 24h
        if (diferencaHoras > 168) {
          throw new Error('Prazo de cancelamento expirado. Notas fiscais só podem ser canceladas em até 7 dias após autorização')
        }
      }

      // 4. Enviar evento de cancelamento para SEFAZ via Nuvem Fiscal
      const idNum = typeof id === 'number' ? id : Number(id)
      const retorno = await nfeService.cancelar(idNum, justificativa)

      // 5. Atualizar status no banco
      if (retorno.status === 'CANCELADA') {
        await supabase
          .from('notas_fiscais')
          .update({
            status: 'CANCELADA',
            data_cancelamento: new Date().toISOString(),
            justificativa_cancelamento: justificativa,
            protocolo_evento_cancelamento: retorno.numeroProtocolo || retorno.codigo
          })
          .eq('id', id)

        // 6. Registrar evento na tabela de eventos
        await supabase
          .from('notas_fiscais_eventos')
          .insert({
            nota_fiscal_id: id,
            tipo_evento: 'CANCELAMENTO',
            sequencia_evento: 1,
            chave_acesso: nota.chave_acesso,
            descricao_evento: justificativa,
            protocolo: retorno.numeroProtocolo || retorno.codigo,
            status: 'REGISTRADO',
            codigo_status: retorno.codigo,
            motivo: retorno.mensagem
          })

        return {
          sucesso: true,
          status: 'CANCELADA',
          mensagem: 'Nota fiscal cancelada com sucesso na SEFAZ',
          protocolo: retorno.numeroProtocolo || retorno.codigo
        }
      } else {
        // Cancelamento rejeitado pela SEFAZ
        await supabase
          .from('notas_fiscais_eventos')
          .insert({
            nota_fiscal_id: id,
            tipo_evento: 'CANCELAMENTO',
            sequencia_evento: 1,
            chave_acesso: nota.chave_acesso,
            descricao_evento: justificativa,
            status: 'REJEITADO',
            codigo_status: retorno.codigo,
            motivo: retorno.mensagem
          })

        throw new Error(`SEFAZ rejeitou o cancelamento: ${retorno.mensagem}`)
      }
    } catch (error: any) {
      console.error('Erro ao cancelar nota fiscal:', error)
      throw new Error(error.message || 'Erro ao cancelar nota fiscal')
    }
  },

  /**
   * Consultar status atual da nota na SEFAZ
   * Atualiza status local com base na consulta
   */
  async consultarStatusSEFAZ(id: string | number) {
    try {
      console.log(`🔍 Consultando status da nota ${id} na SEFAZ...`)
      
      // 1. Buscar nota
      const { data: nota, error } = await supabase
        .from('notas_fiscais')
        .select('nuvem_fiscal_id, chave_acesso, status')
        .eq('id', id)
        .single()

      if (error || !nota) {
        throw new Error('Nota fiscal não encontrada')
      }

      console.log(`📋 Status atual no banco: ${nota.status}`)

      if (!nota.nuvem_fiscal_id) {
        throw new Error('ID da Nuvem Fiscal não encontrado. Esta nota pode ter sido emitida sem integração.')
      }

      // 2. Consultar na Nuvem Fiscal (que consulta na SEFAZ)
      console.log(`🌐 Consultando Nuvem Fiscal ID: ${nota.nuvem_fiscal_id}`)
      const retorno = await nfeService.consultar(nota.nuvem_fiscal_id)

      console.log(`✅ Status retornado da SEFAZ: ${retorno.status}`)
      console.log(`📊 Detalhes:`, retorno)

      // 3. Atualizar status local se diferente
      if (retorno.status !== nota.status) {
        console.log(`🔄 Status diferente! Atualizando ${nota.status} → ${retorno.status}`)
        
        const update: any = {
          status: retorno.status,
          codigo_status_sefaz: retorno.codigo,
          motivo_status: retorno.mensagem
        }

        if (retorno.status === 'CANCELADA') {
          update.data_cancelamento = retorno.dataHoraAutorizacao || new Date().toISOString()
          console.log(`📅 Adicionando data de cancelamento: ${update.data_cancelamento}`)
        }

        const { error: updateError } = await supabase
          .from('notas_fiscais')
          .update(update)
          .eq('id', id)

        if (updateError) {
          console.error('❌ Erro ao atualizar status no banco:', updateError)
          throw updateError
        }

        console.log(`✅ Status atualizado no banco com sucesso!`)

        return {
          sucesso: true,
          statusAnterior: nota.status,
          statusAtual: retorno.status,
          mensagem: `Status atualizado: ${nota.status} → ${retorno.status}`,
          detalhes: retorno,
          atualizado: true
        }
      }

      console.log(`ℹ️ Status já está sincronizado: ${retorno.status}`)

      return {
        sucesso: true,
        statusAtual: retorno.status,
        mensagem: `Status confirmado: ${retorno.status}`,
        detalhes: retorno,
        atualizado: false
      }
    } catch (error: any) {
      console.error('❌ Erro ao consultar status:', error)
      throw new Error(error.message || 'Erro ao consultar status na SEFAZ')
    }
  },

  /**
   * Excluir nota fiscal (apenas rascunhos)
   */
  async excluir(id: string | number) {
    const idNum = typeof id === 'number' ? id : Number(id)
    // Verificar se é rascunho
    const { data: nota, error: erroConsulta } = await supabase
      .from('notas_fiscais')
      .select('status')
      .eq('id', idNum)
      .single()

    if (erroConsulta) throw erroConsulta
    
    if (nota.status !== 'RASCUNHO') {
      throw new Error('Apenas notas em rascunho podem ser excluídas')
    }

    // Excluir (cascade vai excluir os itens automaticamente)
    const { data: deletado, error } = await supabase
      .from('notas_fiscais')
      .delete()
      .eq('id', idNum)
      .select('id')

    if (error) throw error
    if (!deletado || deletado.length === 0) {
      throw new Error('Sem permissão para excluir esta nota fiscal')
    }
  }
}

/**
 * FUNÇÕES AUXILIARES
 */

function calcularTotaisNota(itens: NotaFiscalFormData['itens']) {
  const valor_produtos = itens.reduce((sum, item) => 
    sum + (item.quantidade_comercial * item.valor_unitario_comercial), 0
  )
  const valor_desconto = itens.reduce((sum, item) => 
    sum + (item.valor_desconto || 0), 0
  )

  return {
    valor_produtos,
    valor_frete: 0,
    valor_seguro: 0,
    valor_desconto,
    valor_outras_despesas: 0,
    valor_total: valor_produtos - valor_desconto,
    base_calculo_icms: 0,
    valor_icms: 0,
    base_calculo_icms_st: 0,
    valor_icms_st: 0,
    valor_ipi: 0,
    valor_pis: 0,
    valor_cofins: 0,
    valor_aproximado_tributos: 0
  }
}

function validarNotaFiscal(nota: NotaFiscal & { notas_fiscais_itens: NotaFiscalItem[] }) {
  if (!nota.destinatario_cpf_cnpj) {
    throw new Error('CPF/CNPJ do destinatário é obrigatório')
  }

  if (!nota.destinatario_nome) {
    throw new Error('Nome do destinatário é obrigatório')
  }

  if (!nota.notas_fiscais_itens || nota.notas_fiscais_itens.length === 0) {
    throw new Error('A nota deve ter pelo menos um item')
  }

  if (nota.valor_total <= 0) {
    throw new Error('Valor total deve ser maior que zero')
  }
}

function gerarXMLNFe(nota: NotaFiscal, itens: NotaFiscalItem[]): string {
  // TODO: Implementar geração completa do XML conforme layout da NF-e
  // Por enquanto, retornar XML simplificado para testes

  return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00">
  <NFe>
    <infNFe Id="NFe${nota.chave_acesso}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>${Math.floor(Math.random() * 100000000)}</cNF>
        <natOp>${nota.natureza_operacao}</natOp>
        <mod>${nota.tipo_nota === 'NFE' ? '55' : '65'}</mod>
        <serie>${nota.serie}</serie>
        <nNF>${nota.numero}</nNF>
        <dhEmi>${nota.data_emissao}</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <tpEmis>1</tpEmis>
        <finNFe>${nota.finalidade}</finNFe>
      </ide>
      <emit>
        <CNPJ>12345678000195</CNPJ>
        <xNome>EMPRESA TESTE LTDA</xNome>
      </emit>
      <dest>
        <CNPJ>${nota.destinatario_cpf_cnpj}</CNPJ>
        <xNome>${nota.destinatario_nome}</xNome>
      </dest>
      <det nItem="1">
        ${itens.map(item => `
        <prod>
          <cProd>${item.codigo_produto}</cProd>
          <xProd>${item.descricao}</xProd>
          <NCM>${item.ncm}</NCM>
          <CFOP>${item.cfop}</CFOP>
          <uCom>${item.unidade_comercial}</uCom>
          <qCom>${item.quantidade_comercial}</qCom>
          <vUnCom>${item.valor_unitario_comercial}</vUnCom>
          <vProd>${item.valor_total}</vProd>
        </prod>
        `).join('')}
      </det>
      <total>
        <ICMSTot>
          <vBC>0.00</vBC>
          <vICMS>0.00</vICMS>
          <vNF>${nota.valor_total}</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
 </nfeProc>`
}

export default notasFiscaisService
