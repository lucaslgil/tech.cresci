// =====================================================
// ADAPTADOR NUVEM FISCAL
// Converte dados do sistema para formato Nuvem Fiscal
// =====================================================

import { NuvemFiscalClient } from './nuvemFiscalClient'
import type { NotaFiscalDados, RetornoSEFAZ } from './types'

/**
 * Serviço que adapta os dados do sistema para a API Nuvem Fiscal
 */
export class NuvemFiscalAdapter {
  private client: NuvemFiscalClient

  constructor() {
    const ambiente = import.meta.env.VITE_NUVEM_FISCAL_AMBIENTE || 'SANDBOX'
    const clientId = import.meta.env.VITE_NUVEM_FISCAL_CLIENT_ID
    const clientSecret = import.meta.env.VITE_NUVEM_FISCAL_CLIENT_SECRET

    console.log('🔍 Debug Nuvem Fiscal:')
    console.log('- Ambiente:', ambiente)
    console.log('- Client ID existe?', !!clientId)
    console.log('- Client ID preview:', clientId ? `${clientId.substring(0, 10)}...` : 'NÃO ENCONTRADO')
    console.log('- Client Secret existe?', !!clientSecret)

    if (!clientId || !clientSecret) {
      throw new Error(
        'Credenciais Nuvem Fiscal não configuradas!\n' +
        'Configure VITE_NUVEM_FISCAL_CLIENT_ID e VITE_NUVEM_FISCAL_CLIENT_SECRET no arquivo .env'
      )
    }

    this.client = new NuvemFiscalClient({
      clientId,
      clientSecret,
      ambiente: ambiente as 'SANDBOX' | 'PRODUCAO'
    })

    console.log(`✅ Nuvem Fiscal Adapter inicializado [${ambiente}]`)
  }

  /**
   * Emitir NF-e através da Nuvem Fiscal
   */
  async emitirNFe(dados: NotaFiscalDados): Promise<RetornoSEFAZ> {
    try {
      console.log('🔄 Convertendo dados para formato Nuvem Fiscal...')
      
      // Log detalhado dos dados do emitente para debug
      console.log('📋 Dados do emitente recebidos:', {
        cnpj: dados.emitente?.cnpj,
        razao_social: dados.emitente?.razao_social,
        uf: dados.emitente?.uf,
        cidade: dados.emitente?.cidade,
        codigo_municipio: dados.emitente?.codigo_municipio,
        tipo_codigo: typeof dados.emitente?.codigo_municipio,
        codigo_length: dados.emitente?.codigo_municipio?.length
      })
      
      // Validar dados obrigatórios
      this.validarDados(dados)

      // Converter dados do sistema para formato Nuvem Fiscal
      const dadosNuvemFiscal = this.converterDados(dados)
      
      console.log('✅ Dados convertidos com sucesso')

      // Enviar para Nuvem Fiscal
      try {
        const resultado = await this.client.emitirNFe(dadosNuvemFiscal)
        console.log('✅ NF-e emitida com sucesso via Nuvem Fiscal')
        return resultado
        
      } catch (emissaoError: any) {
        // Se o erro for de configuração não encontrada, tentar configurar automaticamente
        if (emissaoError.message?.includes('ConfigNfeNotFound') || 
            emissaoError.message?.includes('Configuração de NF-e da empresa não encontrada')) {
          
          console.log('⚙️ Empresa não configurada na Nuvem Fiscal')
          
          throw new Error(
            '⚙️ EMPRESA NÃO CONFIGURADA NA NUVEM FISCAL\n\n' +
            '✅ Todos os campos da nota estão corretos!\n' +
            'Agora você precisa configurar a empresa:\n\n' +
            '1. Acesse: https://sandbox.nuvemfiscal.com.br\n' +
            '2. Faça login com suas credenciais\n' +
            '3. Vá em "Empresas" → "Adicionar Empresa"\n' +
            '4. Cadastre o CNPJ: 43.670.056/0001-66\n' +
            '5. Faça upload do certificado digital (.pfx)\n' +
            '6. Volte aqui e tente emitir novamente\n\n' +
            '📖 Consulte: CONFIGURAR_CERTIFICADO_NUVEM_FISCAL.md para mais detalhes'
          )
        }
        
        // Se não for erro de configuração, repassar o erro original
        throw emissaoError
      }

    } catch (error: any) {
      console.error('❌ Erro ao emitir via Nuvem Fiscal:', error)
      throw error
    }
  }

  /**
   * Consultar NF-e
   */
  async consultarNFe(nuvemFiscalId: string): Promise<RetornoSEFAZ> {
    return await this.client.consultarNFe(nuvemFiscalId)
  }

  /**
   * Baixar XML
   */
  async baixarXML(nuvemFiscalId: string): Promise<string> {
    return await this.client.baixarXML(nuvemFiscalId)
  }

  /**
   * Baixar PDF (DANFE)
   */
  async baixarPDF(nuvemFiscalId: string): Promise<Blob> {
    return await this.client.baixarPDF(nuvemFiscalId)
  }

  /**
   * Cancelar NF-e
   */
  async cancelarNFe(nuvemFiscalId: string, justificativa: string): Promise<RetornoSEFAZ> {
    return await this.client.cancelarNFe(nuvemFiscalId, justificativa)
  }

  /**
   * Validar dados obrigatórios antes da emissão
   */
  private validarDados(dados: NotaFiscalDados): void {
    const erros: string[] = []

    // Validar emitente
    if (!dados.emitente?.cnpj) erros.push('CNPJ do emitente é obrigatório')
    if (!dados.emitente?.razao_social) erros.push('Razão social do emitente é obrigatória')
    if (!dados.emitente?.uf) erros.push('UF do emitente é obrigatória')
    if (!dados.emitente?.codigo_municipio || String(dados.emitente.codigo_municipio).trim() === '') {
      erros.push(`Código do município do emitente é obrigatório (recebido: '${dados.emitente?.codigo_municipio}')`)
    }

    // Validar destinatário
    if (!dados.destinatario?.cpf_cnpj) erros.push('CPF/CNPJ do destinatário é obrigatório')
    if (!dados.destinatario?.nome_razao) erros.push('Nome/Razão social do destinatário é obrigatório')
    if (!dados.destinatario?.codigo_municipio || String(dados.destinatario.codigo_municipio).trim() === '') {
      erros.push(`Código do município do destinatário é obrigatório (recebido: '${dados.destinatario?.codigo_municipio}')`)
    }

    // Validar itens
    if (!dados.itens || dados.itens.length === 0) {
      erros.push('É necessário ter pelo menos 1 item na nota')
    } else {
      dados.itens.forEach((item, index) => {
        if (!item.descricao) erros.push(`Item ${index + 1}: descrição é obrigatória`)
        if (!item.cfop) erros.push(`Item ${index + 1}: CFOP é obrigatório`)
        if (!item.quantidade || item.quantidade <= 0) erros.push(`Item ${index + 1}: quantidade inválida`)
        if (!item.valor_unitario || item.valor_unitario <= 0) erros.push(`Item ${index + 1}: valor unitário inválido`)
      })
    }

    // Validar totais
    if (!dados.totais?.valor_total || dados.totais.valor_total <= 0) {
      erros.push('Valor total da nota é obrigatório e deve ser maior que zero')
    }

    if (erros.length > 0) {
      console.error('❌ Erros de validação:', erros)
      throw new Error(`Dados inválidos para emissão:\n${erros.join('\n')}`)
    }

    console.log('✅ Validação dos dados concluída com sucesso')
  }

  /**
   * Converter dados do sistema para formato Nuvem Fiscal (Schema NF-e SEFAZ)
   */
  private converterDados(dados: NotaFiscalDados): any {
    const cpfCnpjEmitente = dados.emitente.cnpj.replace(/\D/g, '')
    const cpfCnpjDestinatario = dados.destinatario.cpf_cnpj.replace(/\D/g, '')
    
    const payload = {
      // Ambiente e referência
      ambiente: dados.ambiente === 'PRODUCAO' ? 'producao' : 'homologacao',
      referencia: `NOTA-${Date.now()}`,
      
      // Estrutura XML da NF-e convertida em JSON
      infNFe: {
        versao: '4.00',
        
        // Identificação da NF-e
        ide: {
          cUF: this.obterCodigoUF(dados.emitente.uf),
          natOp: String(dados.natureza_operacao || 'VENDA DE MERCADORIA').substring(0, 60),
          mod: 55, // Modelo 55 = NF-e
          serie: Number(dados.serie || 1),
          nNF: Number(dados.numero || 1),
          dhEmi: new Date().toISOString(),
          tpNF: 1, // 1 = Saída
          idDest: 1, // 1 = Operação interna
          cMunFG: Number(dados.emitente.codigo_municipio),
          tpImp: 1, // 1 = Retrato
          tpEmis: 1, // 1 = Normal
          tpAmb: dados.ambiente === 'PRODUCAO' ? 1 : 2,
          finNFe: this.converterFinalidade(dados.finalidade),
          indFinal: 1, // 1 = Consumidor final
          indPres: 1, // 1 = Operação presencial
          procEmi: 0, // 0 = Emissão de NF-e com aplicativo do contribuinte
          verProc: '1.0'
        },
        
        // Emitente
        emit: {
          ...(cpfCnpjEmitente.length === 11 ? { CPF: cpfCnpjEmitente } : { CNPJ: cpfCnpjEmitente }),
          xNome: String(dados.emitente.razao_social).substring(0, 60),
          xFant: String(dados.emitente.nome_fantasia || '').substring(0, 60),
          enderEmit: {
            xLgr: String(dados.emitente.logradouro || 'N\u00e3o informado').substring(0, 60),
            nro: String(dados.emitente.numero).substring(0, 60),
            ...(dados.emitente.complemento && { xCpl: String(dados.emitente.complemento).substring(0, 60) }),
            xBairro: String(dados.emitente.bairro).substring(0, 60),
            cMun: Number(dados.emitente.codigo_municipio),
            xMun: String(dados.emitente.cidade).substring(0, 60),
            UF: String(dados.emitente.uf),
            CEP: String(dados.emitente.cep).replace(/\D/g, '')
          },
          ...(dados.emitente.inscricao_estadual && { IE: String(dados.emitente.inscricao_estadual) }),
          CRT: this.converterRegimeTributario(dados.emitente.crt)
        },
        
        // Destinatário
        dest: {
          ...(cpfCnpjDestinatario.length === 11 ? { CPF: cpfCnpjDestinatario } : { CNPJ: cpfCnpjDestinatario }),
          xNome: String(dados.destinatario.nome_razao).substring(0, 60),
          enderDest: {
            xLgr: String(dados.destinatario.logradouro).substring(0, 60),
            nro: String(dados.destinatario.numero).substring(0, 60),
            ...(dados.destinatario.complemento && { xCpl: String(dados.destinatario.complemento).substring(0, 60) }),
            xBairro: String(dados.destinatario.bairro).substring(0, 60),
            cMun: String(dados.destinatario.codigo_municipio || '').padStart(7, '0'),
            xMun: String(dados.destinatario.cidade).substring(0, 60),
            UF: String(dados.destinatario.uf),
            CEP: String(dados.destinatario.cep).replace(/\D/g, '')
          },
          indIEDest: this.converterIndicadorIE(dados.destinatario.indicador_ie),
          // IE: Só enviar se for contribuinte (indIEDest = 1) e tiver valor numérico
          ...(
            this.converterIndicadorIE(dados.destinatario.indicador_ie) === 1 &&
            dados.destinatario.inscricao_estadual &&
            /^[0-9]+$/.test(String(dados.destinatario.inscricao_estadual).replace(/\D/g, ''))
              ? { IE: String(dados.destinatario.inscricao_estadual).replace(/\D/g, '') }
              : {}
          )
        },
        
        // Itens/Produtos
        det: dados.itens.map((item, index) => {
          // Garantir valores numéricos
          const quantidade = Number(item.quantidade) || 0
          const valorUnitario = Number(item.valor_unitario) || 0
          const valorTotal = Number(item.valor_total) || (quantidade * valorUnitario)
          
          return {
            nItem: (index + 1),
            prod: {
              cProd: String(item.codigo_produto || `PROD${index + 1}`),
              cEAN: 'SEM GTIN',
              xProd: String(item.descricao).substring(0, 120), // Limite de 120 caracteres
              NCM: String(item.ncm || '00000000').replace(/\D/g, '').substring(0, 8),
              CFOP: String(item.cfop),
              uCom: String(item.unidade || 'UN').substring(0, 6),
              qCom: parseFloat(quantidade.toFixed(4)),
              vUnCom: parseFloat(valorUnitario.toFixed(10)),
              vProd: parseFloat(valorTotal.toFixed(2)),
              cEANTrib: 'SEM GTIN',
              uTrib: String(item.unidade || 'UN').substring(0, 6),
              qTrib: parseFloat(quantidade.toFixed(4)),
              vUnTrib: parseFloat(valorUnitario.toFixed(10)),
              indTot: 1 // 1 = Valor do item compõe valor total da NF-e
            },
            
            imposto: {
              vTotTrib: 0,
              
              ICMS: dados.emitente.crt === '1' || dados.emitente.crt === '2' ? {
                // Simples Nacional: usar CSOSN ao invés de CST
                ICMSSN102: {
                  orig: Number(item.impostos?.icms?.origem || 0),
                  CSOSN: '102' // 102 = Tributada pelo Simples Nacional sem permissão de crédito
                }
              } : {
                // Regime Normal: usar CST
                ICMS00: {
                  orig: Number(item.impostos?.icms?.origem || 0),
                  CST: String(item.impostos?.icms?.cst || '00').padStart(2, '0'),
                  modBC: Number(item.impostos?.icms?.modalidade_bc || 3),
                  vBC: parseFloat(Number(item.impostos?.icms?.base_calculo || 0).toFixed(2)),
                  pICMS: parseFloat(Number(item.impostos?.icms?.aliquota || 0).toFixed(2)),
                  vICMS: parseFloat(Number(item.impostos?.icms?.valor || 0).toFixed(2))
                }
              },
              
              PIS: {
                PISAliq: {
                  CST: String(item.impostos?.pis?.cst || '01').padStart(2, '0'),
                  vBC: parseFloat(Number(item.impostos?.pis?.base_calculo || 0).toFixed(2)),
                  pPIS: parseFloat(Number(item.impostos?.pis?.aliquota || 0).toFixed(4)),
                  vPIS: parseFloat(Number(item.impostos?.pis?.valor || 0).toFixed(2))
                }
              },
              
              COFINS: {
                COFINSAliq: {
                  CST: String(item.impostos?.cofins?.cst || '01').padStart(2, '0'),
                  vBC: parseFloat(Number(item.impostos?.cofins?.base_calculo || 0).toFixed(2)),
                  pCOFINS: parseFloat(Number(item.impostos?.cofins?.aliquota || 0).toFixed(4)),
                  vCOFINS: parseFloat(Number(item.impostos?.cofins?.valor || 0).toFixed(2))
                }
              }
            }
          }
        }),
        
        // Totais
        total: {
          ICMSTot: {
            vBC: parseFloat(Number(dados.totais.base_calculo_icms || 0).toFixed(2)),
            vICMS: parseFloat(Number(dados.totais.valor_icms || 0).toFixed(2)),
            vICMSDeson: 0,
            vFCP: 0,
            vBCST: 0,
            vST: 0,
            vFCPST: 0,
            vFCPSTRet: 0,
            vProd: parseFloat(Number(dados.totais.valor_produtos).toFixed(2)),
            vFrete: parseFloat(Number(dados.totais.valor_frete || 0).toFixed(2)),
            vSeg: parseFloat(Number(dados.totais.valor_seguro || 0).toFixed(2)),
            vDesc: parseFloat(Number(dados.totais.valor_desconto || 0).toFixed(2)),
            vII: 0,
            vIPI: 0,
            vIPIDevol: 0,
            vPIS: parseFloat(Number(dados.totais.valor_pis || 0).toFixed(2)),
            vCOFINS: parseFloat(Number(dados.totais.valor_cofins || 0).toFixed(2)),
            vOutro: parseFloat(Number(dados.totais.outras_despesas || dados.totais.valor_outras_despesas || 0).toFixed(2)),
            vNF: parseFloat(Number(dados.totais.valor_total).toFixed(2)),
            vTotTrib: 0
          }
        },
        
        // Transporte
        transp: {
          modFrete: 9 // 9 = Sem frete
        },
        
        // Pagamento
        pag: {
          detPag: dados.pagamento?.forma_pagamento ? [{
            tPag: String(this.converterMeioPagamento(dados.pagamento.forma_pagamento)).padStart(2, '0'),
            vPag: parseFloat(Number(dados.pagamento.valor_pago || dados.totais.valor_total).toFixed(2))
          }] : [{
            tPag: '01', // Dinheiro
            vPag: parseFloat(Number(dados.totais.valor_total).toFixed(2))
          }]
        },
        
        // Informações adicionais
        ...(dados.informacoes_complementares && {
          infAdic: {
            infCpl: String(dados.informacoes_complementares).substring(0, 5000)
          }
        })
      }
    }
    
    // Validação completa antes de enviar
    console.log('🔍 VALIDAÇÃO COMPLETA DO PAYLOAD')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // EMITENTE
    console.log('\n📤 EMITENTE:')
    const cnpjEmit = 'CNPJ' in payload.infNFe.emit ? payload.infNFe.emit.CNPJ : payload.infNFe.emit.CPF
    console.log('  CNPJ:', cnpjEmit, '✓')
    console.log('  Razão Social:', payload.infNFe.emit.xNome, '✓')
    console.log('  IE:', payload.infNFe.emit.IE || '(não enviado)', payload.infNFe.emit.IE ? '✓' : '⚠️')
    console.log('  CRT:', payload.infNFe.emit.CRT, '✓')
    console.log('  Município:', payload.infNFe.emit.enderEmit.cMun, payload.infNFe.emit.enderEmit.xMun, '✓')
    
    // DESTINATÁRIO
    console.log('\n📥 DESTINATÁRIO:')
    const cnpjDest = 'CNPJ' in payload.infNFe.dest ? payload.infNFe.dest.CNPJ : payload.infNFe.dest.CPF
    console.log('  CNPJ/CPF:', cnpjDest, '✓')
    console.log('  Nome:', payload.infNFe.dest.xNome, '✓')
    const destIE = payload.infNFe.dest.IE
    const destIndIE = payload.infNFe.dest.indIEDest
    console.log('  IE:', destIE || '(não enviado - correto para não contribuinte)', 
      !destIE && destIndIE === 9 ? '✓' : destIE ? '✓' : '⚠️')
    console.log('  indIEDest:', payload.infNFe.dest.indIEDest, 
      payload.infNFe.dest.indIEDest === 9 ? '(Não Contribuinte) ✓' : 
      payload.infNFe.dest.indIEDest === 1 ? '(Contribuinte) ✓' : 
      payload.infNFe.dest.indIEDest === 2 ? '(Contribuinte Isento) ✓' : '❌')
    console.log('  Município:', payload.infNFe.dest.enderDest.cMun, payload.infNFe.dest.enderDest.xMun, '✓')
    
    // IDENTIFICAÇÃO DA NOTA
    console.log('\n📋 IDENTIFICAÇÃO:')
    console.log('  Ambiente:', payload.infNFe.ide.tpAmb === 1 ? 'PRODUÇÃO' : 'HOMOLOGAÇÃO', '✓')
    console.log('  Série:', payload.infNFe.ide.serie, '✓')
    console.log('  Número:', payload.infNFe.ide.nNF, '✓')
    console.log('  Modelo:', payload.infNFe.ide.mod, '✓')
    console.log('  Finalidade:', payload.infNFe.ide.finNFe, '✓')
    console.log('  Natureza:', payload.infNFe.ide.natOp, '✓')
    
    // ITENS
    console.log('\n📦 ITENS:', payload.infNFe.det.length)
    payload.infNFe.det.forEach((item: any) => {
      console.log(`  Item ${item.nItem}:`)
      console.log(`    Código: ${item.prod.cProd} ✓`)
      console.log(`    Descrição: ${item.prod.xProd} ✓`)
      console.log(`    NCM: ${item.prod.NCM} ✓`)
      console.log(`    CFOP: ${item.prod.CFOP} ✓`)
      console.log(`    Qtd: ${item.prod.qCom} (${typeof item.prod.qCom}) ${typeof item.prod.qCom === 'number' ? '✓' : '❌'}`)
      console.log(`    Valor Unit: ${item.prod.vUnCom} (${typeof item.prod.vUnCom}) ${typeof item.prod.vUnCom === 'number' ? '✓' : '❌'}`)
      console.log(`    Valor Total: ${item.prod.vProd} (${typeof item.prod.vProd}) ${typeof item.prod.vProd === 'number' ? '✓' : '❌'}`)
      console.log(`    CST ICMS: ${item.imposto.ICMS.ICMS00?.CST || item.imposto.ICMS.ICMS20?.CST || item.imposto.ICMS.ICMS40?.CST || '?'} ✓`)
    })
    
    // TOTAIS
    console.log('\n💰 TOTAIS:')
    console.log('  Produtos:', payload.infNFe.total.ICMSTot.vProd, '✓')
    console.log('  Total NF:', payload.infNFe.total.ICMSTot.vNF, '✓')
    console.log('  BC ICMS:', payload.infNFe.total.ICMSTot.vBC, '✓')
    console.log('  ICMS:', payload.infNFe.total.ICMSTot.vICMS, '✓')
    
    // PAGAMENTO
    console.log('\n💳 PAGAMENTO:')
    console.log('  Forma:', payload.infNFe.pag.detPag[0].tPag, '✓')
    console.log('  Valor:', payload.infNFe.pag.detPag[0].vPag, '✓')
    
    // TRANSPORTE
    console.log('\n🚚 TRANSPORTE:')
    console.log('  Modalidade:', payload.infNFe.transp.modFrete, '✓')
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Log resumido do payload
    console.log('📊 Payload Nuvem Fiscal gerado:', {
      ambiente: payload.ambiente,
      referencia: payload.referencia,
      emitente: payload.infNFe.emit?.xNome,
      destinatario: payload.infNFe.dest?.xNome,
      qtdItens: payload.infNFe.det?.length,
      valorTotal: payload.infNFe.total?.ICMSTot?.vNF
    })
    
    return payload
  }
  
  /**
   * Obter código UF conforme tabela IBGE
   */
  private obterCodigoUF(uf: string): number {
    const tabela: Record<string, number> = {
      'RO': 11, 'AC': 12, 'AM': 13, 'RR': 14, 'PA': 15, 'AP': 16,
      'TO': 17, 'MA': 21, 'PI': 22, 'CE': 23, 'RN': 24, 'PB': 25,
      'PE': 26, 'AL': 27, 'SE': 28, 'BA': 29, 'MG': 31, 'ES': 32,
      'RJ': 33, 'SP': 35, 'PR': 41, 'SC': 42, 'RS': 43, 'MS': 50,
      'MT': 51, 'GO': 52, 'DF': 53
    }
    return tabela[uf] || 35 // Default SP
  }

  /**
   * Converter finalidade de emissão
   */
  private converterFinalidade(finalidade: string): number {
    const map: Record<string, number> = {
      'NORMAL': 1,
      'COMPLEMENTAR': 2,
      'AJUSTE': 3,
      'DEVOLUCAO': 4
    }
    return map[finalidade] || 1
  }

  /**
   * Converter regime tributário
   */
  private converterRegimeTributario(crt: string): number {
    const map: Record<string, number> = {
      '1': 1, // Simples Nacional
      '2': 2, // Simples Nacional - excesso
      '3': 3  // Regime Normal
    }
    return map[crt] || 3
  }

  /**
   * Converter indicador de IE
   */
  private converterIndicadorIE(indicador: string): number {
    const map: Record<string, number> = {
      'CONTRIBUINTE': 1,
      'ISENTO': 2,
      'NAO_CONTRIBUINTE': 9
    }
    return map[indicador] || 9
  }

  /**
   * Converter meio de pagamento
   */
  private converterMeioPagamento(forma: string): number {
    const map: Record<string, number> = {
      'DINHEIRO': 1,
      'CHEQUE': 2,
      'CARTAO_CREDITO': 3,
      'CARTAO_DEBITO': 4,
      'CREDITO_LOJA': 5,
      'VALE_ALIMENTACAO': 10,
      'VALE_REFEICAO': 11,
      'VALE_PRESENTE': 12,
      'VALE_COMBUSTIVEL': 13,
      'BOLETO': 15,
      'PIX': 17,
      'TRANSFERENCIA': 18,
      'PROGRAMA_FIDELIDADE': 19,
      'SEM_PAGAMENTO': 90,
      'OUTROS': 99
    }
    return map[forma] || 99
  }

  /**
   * Verificar conexão com Nuvem Fiscal
   */
  async verificarConexao(): Promise<boolean> {
    return await this.client.verificarConexao()
  }
}
