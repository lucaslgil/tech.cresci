// =====================================================
// EDGE FUNCTION - EMITIR NFE
// Processa emissão de NF-e com assinatura digital
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { gerarXMLNFe } from './xmlGenerator.ts'
import { assinarXML, validarCertificado } from './assinatura.ts'
import { enviarNFeSEFAZ } from './soapClient.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Autenticar usuário
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extrair dados da requisição
    const { notaId, config } = await req.json()

    if (!notaId) {
      return new Response(
        JSON.stringify({ error: 'ID da nota é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar nota no banco
    const { data: nota, error: notaError } = await supabase
      .from('notas_fiscais')
      .select('*')
      .eq('id', notaId)
      .single()

    if (notaError || !nota) {
      console.error('❌ Erro ao buscar nota:', notaError)
      return new Response(
        JSON.stringify({ error: 'Nota não encontrada', details: notaError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', nota.empresa_id)
      .single()

    if (empresaError || !empresa) {
      console.error('❌ Erro ao buscar empresa:', empresaError)
      return new Response(
        JSON.stringify({ error: 'Empresa não encontrada', details: empresaError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar certificado
    if (!empresa.certificado_digital || !empresa.certificado_senha) {
      return new Response(
        JSON.stringify({ error: 'Certificado digital não configurado para esta empresa' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar itens da nota
    const { data: itens, error: itensError } = await supabase
      .from('notas_fiscais_itens')
      .select('*')
      .eq('nota_fiscal_id', notaId)
      .order('numero_item')

    if (itensError) {
      throw new Error(`Erro ao buscar itens: ${itensError.message}`)
    }

    // Determinar modo de operação
    const usarAPI = config?.provider && config.provider !== 'DIRETO'
    
    if (usarAPI) {
      // MODO PAGO: Usar API intermediária (Focus NFe, etc)
      return await emitirViaAPI(nota, empresa, itens, config, supabase)
    } else {
      // MODO GRATUITO: Comunicação direta com SEFAZ (SOAP)
      return await emitirDiretoSEFAZ(nota, empresa, itens, config, supabase)
    }

  } catch (error: any) {
    console.error('Erro na edge function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar requisição',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Emitir via API paga (Focus NFe, Nuvem Fiscal, etc)
 */
async function emitirViaAPI(nota: any, empresa: any, itens: any[], config: any, supabase: any) {
  const { provider, token, ambiente } = config

  if (provider === 'NUVEMFISCAL') {
    // ========================================
    // NUVEM FISCAL - 100 NFe/mês GRÁTIS
    // ========================================
    const baseURL = 'https://api.nuvemfiscal.com.br'
    const ambienteNF = ambiente === 'PRODUCAO' ? 1 : 2
    
    console.log('📤 Emitindo via Nuvem Fiscal...')
    
    const payload = {
      ambiente: ambienteNF,
      natureza_operacao: nota.natureza_operacao,
      tipo_operacao: 1, // Saída
      finalidade_emissao: 1, // Normal
      
      // Emitente
      emitente: {
        cpf_cnpj: empresa.cnpj?.replace(/\D/g, ''),
        inscricao_estadual: empresa.inscricao_estadual,
        nome: empresa.razao_social,
        nome_fantasia: empresa.nome_fantasia,
        regime_tributario: empresa.regime_tributario === 'SIMPLES' ? 1 : 3,
        endereco: {
          logradouro: empresa.logradouro,
          numero: empresa.numero,
          bairro: empresa.bairro,
          codigo_municipio: empresa.codigo_municipio,
          nome_municipio: empresa.cidade,
          uf: empresa.uf,
          cep: empresa.cep?.replace(/\D/g, '')
        }
      },
      
      // Destinatário
      destinatario: {
        cpf_cnpj: nota.destinatario_cpf_cnpj,
        nome: nota.destinatario_nome,
        indicador_inscricao_estadual: nota.destinatario_indicador_ie === 'NAO_CONTRIBUINTE' ? 9 : 1,
        inscricao_estadual: nota.destinatario_ie,
        endereco: {
          logradouro: nota.destinatario_logradouro,
          numero: nota.destinatario_numero,
          bairro: nota.destinatario_bairro,
          codigo_municipio: nota.destinatario_codigo_municipio,
          nome_municipio: nota.destinatario_cidade,
          uf: nota.destinatario_uf,
          cep: nota.destinatario_cep?.replace(/\D/g, '')
        }
      },
      
      // Itens
      itens: itens.map((item, index) => ({
        numero_item: index + 1,
        codigo_produto: item.codigo_produto,
        descricao: item.descricao,
        ncm: item.ncm,
        cfop: item.cfop,
        unidade_comercial: item.unidade_comercial,
        quantidade_comercial: parseFloat(item.quantidade_comercial),
        valor_unitario_comercial: parseFloat(item.valor_unitario_comercial),
        valor_bruto: parseFloat(item.valor_bruto),
        unidade_tributavel: item.unidade_tributavel,
        quantidade_tributavel: parseFloat(item.quantidade_tributavel),
        valor_unitario_tributavel: parseFloat(item.valor_unitario_tributavel),
        valor_desconto: parseFloat(item.valor_desconto || 0),
        
        // Impostos
        icms: {
          origem: parseInt(item.origem_mercadoria),
          situacao_tributaria: item.cst_icms || item.csosn_icms,
          base_calculo: parseFloat(item.base_calculo_icms || 0),
          aliquota: parseFloat(item.aliquota_icms || 0),
          valor: parseFloat(item.valor_icms || 0)
        },
        pis: {
          situacao_tributaria: item.cst_pis,
          base_calculo: parseFloat(item.base_calculo_pis || 0),
          aliquota_percentual: parseFloat(item.aliquota_pis || 0),
          valor: parseFloat(item.valor_pis || 0)
        },
        cofins: {
          situacao_tributaria: item.cst_cofins,
          base_calculo: parseFloat(item.base_calculo_cofins || 0),
          aliquota_percentual: parseFloat(item.aliquota_cofins || 0),
          valor: parseFloat(item.valor_cofins || 0)
        }
      })),
      
      // Totais
      total: {
        valor_produtos: parseFloat(nota.valor_produtos),
        valor_desconto: parseFloat(nota.valor_desconto || 0),
        valor_total: parseFloat(nota.valor_total),
        icms_base_calculo: parseFloat(nota.base_calculo_icms || 0),
        icms_valor_total: parseFloat(nota.valor_icms || 0),
        pis_valor_total: parseFloat(nota.valor_pis || 0),
        cofins_valor_total: parseFloat(nota.valor_cofins || 0)
      },
      
      // Transporte
      transporte: {
        modalidade_frete: parseInt(nota.modalidade_frete)
      },
      
      // Pagamento
      pagamento: {
        formas_pagamento: [{
          meio_pagamento: nota.forma_pagamento,
          valor: parseFloat(nota.valor_total)
        }]
      },
      
      // Informações adicionais
      informacoes_adicionais_contribuinte: nota.informacoes_complementares
    }
    
    const response = await fetch(`${baseURL}/nfe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Erro Nuvem Fiscal:', error)
      throw new Error(error.mensagem || 'Erro ao emitir nota')
    }
    
    const result = await response.json()
    console.log('✅ Resposta Nuvem Fiscal:', result.status)
    
    // Atualizar nota no banco
    await supabase
      .from('notas_fiscais')
      .update({
        status: result.status === 'autorizado' ? 'AUTORIZADA' : 'PROCESSANDO',
        chave_acesso: result.chave_acesso,
        protocolo_autorizacao: result.protocolo,
        xml_autorizado: result.xml,
        mensagem_sefaz: result.motivo_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', nota.id)
    
    return new Response(
      JSON.stringify({
        sucesso: result.status === 'autorizado',
        status: result.status === 'autorizado' ? 'AUTORIZADA' : 'PROCESSANDO',
        mensagem: result.motivo_status,
        chave_acesso: result.chave_acesso,
        protocolo: result.protocolo,
        xml_autorizado: result.xml,
        data_autorizacao: result.data_autorizacao
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } else if (provider === 'FOCUS') {
    const baseURL = ambiente === 'PRODUCAO' 
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br'

    // Montar payload Focus NFe
    const payload = {
      natureza_operacao: nota.natureza_operacao,
      tipo_documento: "1", // NF-e
      finalidade_emissao: "1", // Normal
      cnpj_emitente: empresa.cnpj,
      nome_emitente: empresa.razao_social,
      nome_fantasia_emitente: empresa.nome_fantasia,
      // ... resto dos dados
      itens: itens.map(item => ({
        numero_item: item.numero_item,
        codigo_produto: item.codigo_produto,
        descricao: item.descricao,
        ncm: item.ncm,
        cfop: item.cfop,
        unidade_comercial: item.unidade,
        quantidade_comercial: item.quantidade,
        valor_unitario_comercial: item.valor_unitario,
        valor_total: item.valor_total,
        // ... impostos
      }))
    }

    const response = await fetch(`${baseURL}/v2/nfe?ref=${nota.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(token + ':')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()

    // Atualizar nota no banco
    await supabase
      .from('notas_fiscais')
      .update({
        status: result.status === 'autorizado' ? 'AUTORIZADA' : 'ERRO',
        chave_acesso: result.chave_nfe,
        protocolo_autorizacao: result.numero_protocolo,
        xml_assinado: result.caminho_xml_nota_fiscal,
        mensagem_sefaz: result.mensagem_sefaz,
        updated_at: new Date().toISOString()
      })
      .eq('id', nota.id)

    return new Response(
      JSON.stringify({
        sucesso: result.status === 'autorizado',
        status: result.status,
        chave_acesso: result.chave_nfe,
        protocolo: result.numero_protocolo,
        mensagem: result.mensagem_sefaz
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  throw new Error(`Provider ${provider} não implementado`)
}

/**
 * Emitir direto na SEFAZ (modo gratuito - SOAP)
 */
async function emitirDiretoSEFAZ(nota: any, empresa: any, itens: any[], config: any, supabase: any) {
  try {
    console.log('🆓 Modo GRATUITO: Comunicação direta com SEFAZ')
    
    // 1. Converter certificado (JSONB vira objeto com keys numéricas)
    if (!empresa.certificado_digital) {
      throw new Error('Certificado digital não configurado. Configure em Parâmetros Fiscais.')
    }
    
    const cert = empresa.certificado_digital as any
    
    // Supabase JSONB retorna como objeto {0: 77, 1: 73, ...} - converter para array
    const certArray = Object.values(cert) as number[]
    const certificadoBuffer = new Uint8Array(certArray)
    
    console.log('✅ Certificado carregado:', certificadoBuffer.length, 'bytes')
    
    console.log('📜 Certificado carregado:', certificadoBuffer.length, 'bytes')
    const senha = empresa.certificado_senha
    
    const validacao = await validarCertificado(certificadoBuffer, senha)
    if (!validacao.valido) {
      throw new Error(`Certificado inválido: ${validacao.mensagem}`)
    }
    
    console.log('✅ Certificado válido até:', validacao.dataValidade)
    
    // 2. Gerar XML da NFe
    console.log('📄 Gerando XML...')
    const xmlNFe = gerarXMLNFe({
      nota,
      itens,
      empresa: empresa,
      config
    })
    
    // Salvar XML não assinado
    await supabase
      .from('notas_fiscais')
      .update({ xml_gerado: xmlNFe })
      .eq('id', nota.id)
    
    // 3. Assinar XML
    console.log('🔏 Assinando XML...')
    const xmlAssinado = await assinarXML(xmlNFe, certificadoBuffer, senha)
    
    // Salvar XML assinado
    await supabase
      .from('notas_fiscais')
      .update({ xml_assinado: xmlAssinado })
      .eq('id', nota.id)
    
    // 4. Enviar para SEFAZ via SOAP
    console.log('📤 Enviando para SEFAZ...')
    const resultado = await enviarNFeSEFAZ(
      xmlAssinado,
      config.ambiente,
      empresa.estado || 'SP'
    )
    
    // 5. Atualizar nota no banco
    await supabase
      .from('notas_fiscais')
      .update({
        status: resultado.status,
        chave_acesso: resultado.chave_acesso,
        protocolo_autorizacao: resultado.protocolo,
        mensagem_sefaz: resultado.mensagem,
        xml_autorizado: resultado.xml_autorizado,
        data_autorizacao: resultado.data_autorizacao,
        updated_at: new Date().toISOString()
      })
      .eq('id', nota.id)
    
    console.log(`✅ Resultado: ${resultado.status} - ${resultado.mensagem}`)
    
    return new Response(
      JSON.stringify({
        sucesso: resultado.sucesso,
        status: resultado.status,
        chave_acesso: resultado.chave_acesso,
        protocolo: resultado.protocolo,
        mensagem: resultado.mensagem,
        data_autorizacao: resultado.data_autorizacao
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('❌ Erro no modo direto:', error)
    
    // Atualizar nota com erro
    await supabase
      .from('notas_fiscais')
      .update({
        status: 'ERRO',
        mensagem_sefaz: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', nota.id)
    
    return new Response(
      JSON.stringify({
        sucesso: false,
        status: 'ERRO',
        mensagem: error.message,
        detalhes: 'Modo direto ainda em desenvolvimento. Recomendamos usar Focus NFe por enquanto.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}
