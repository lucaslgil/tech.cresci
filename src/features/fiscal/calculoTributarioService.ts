// =====================================================
// MOTOR DE CÁLCULO TRIBUTÁRIO - REFORMA 2026
// Cálculo automático de impostos com IBS e CBS
// Data: 13/01/2026
// =====================================================

import { supabase } from '../../lib/supabase'

/**
 * TIPOS E INTERFACES
 */

export interface DadosCalculoTributario {
  // Produto
  ncm: string
  cest?: string
  valorUnitario: number
  quantidade: number
  valorTotal: number
  
  // Operação
  cfop: string
  ufOrigem: string
  ufDestino: string
  tipoOperacao: 'ENTRADA' | 'SAIDA'
  finalidadeNota: '1' | '2' | '3' | '4' // 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
  
  // Ano da operação (para transição)
  anoOperacao: number
  
  // Regime tributário do emitente
  regimeTributario: 'SIMPLES' | 'PRESUMIDO' | 'REAL'
}

export interface ResultadoCalculoTributario {
  // Sistema Antigo (em transição gradual 2026-2032)
  sistemaAntigo: {
    icms: {
      baseCalculo: number
      aliquota: number
      valor: number
      cst?: string
      csosn?: string
    }
    pis: {
      baseCalculo: number
      aliquota: number
      valor: number
      cst: string
    }
    cofins: {
      baseCalculo: number
      aliquota: number
      valor: number
      cst: string
    }
    ipi?: {
      baseCalculo: number
      aliquota: number
      valor: number
      cst: string
    }
    totalImpostosAntigos: number
    percentualAplicado: number // % do sistema antigo aplicado (ex: 100% em 2026, 90% em 2028...)
  }
  
  // Sistema Novo (Reforma 2026 - crescente até 2033)
  sistemaNovo: {
    ibs: {
      baseCalculo: number
      aliquota: number
      valor: number
      cst: string
      creditoApropriado: number // Sistema não-cumulativo
    }
    cbs: {
      baseCalculo: number
      aliquota: number
      valor: number
      cst: string
      creditoApropriado: number // Sistema não-cumulativo
    }
    totalImpostosNovos: number
    percentualAplicado: number // % do sistema novo aplicado (ex: 1% em 2026, 10% em 2027...)
  }
  
  // Totais Gerais
  totalTributos: number
  valorLiquido: number // Valor total - tributos
  cargaTributariaPercentual: number
}

/**
 * SERVIÇO DE CÁLCULO TRIBUTÁRIO
 */
export const calculoTributarioService = {
  /**
   * Calcula todos os impostos de um item considerando a transição tributária
   */
  async calcularTributacaoItem(dados: DadosCalculoTributario): Promise<ResultadoCalculoTributario> {
    try {
      // 1. Buscar cronograma de transição do ano
      const { data: cronograma, error: cronoError } = await supabase
        .from('reforma_cronograma_transicao')
        .select('*')
        .eq('ano', dados.anoOperacao)
        .single()

      if (cronoError) throw cronoError

      // 2. Buscar alíquotas IBS/CBS por NCM (pode ter exceções)
      const { data: aliquotasReforma, error: aliqError } = await supabase
        .rpc('buscar_aliquotas_reforma', {
          p_ncm: dados.ncm,
          p_data: new Date().toISOString().split('T')[0]
        })

      if (aliqError) throw aliqError

      const aliquotaIBS = aliquotasReforma[0]?.aliquota_ibs || 0.27 // 27% padrão
      const aliquotaCBS = aliquotasReforma[0]?.aliquota_cbs || 0.12 // 12% padrão

      // 3. Calcular impostos do sistema ANTIGO (proporcionalmente ao cronograma)
      const percentualAntigo = cronograma?.percentual_icms || 100
      
      // ICMS (simplificado - 18% média)
      const baseICMS = dados.valorTotal
      const aliquotaICMS = 18.00
      const valorICMS = (baseICMS * aliquotaICMS / 100) * (percentualAntigo / 100)

      // PIS (1.65% não-cumulativo)
      const basePIS = dados.valorTotal
      const aliquotaPIS = 1.65
      const valorPIS = (basePIS * aliquotaPIS / 100) * (cronograma?.percentual_pis || 100) / 100

      // COFINS (7.6% não-cumulativo)
      const baseCOFINS = dados.valorTotal
      const aliquotaCOFINS = 7.6
      const valorCOFINS = (baseCOFINS * aliquotaCOFINS / 100) * (cronograma?.percentual_cofins || 100) / 100

      const totalImpostosAntigos = valorICMS + valorPIS + valorCOFINS

      // 4. Calcular impostos do sistema NOVO (IBS e CBS)
      const percentualNovo = cronograma?.percentual_ibs || 1
      
      const baseIBS = dados.valorTotal
      const valorIBS = baseIBS * aliquotaIBS * (percentualNovo / 100)

      const baseCBS = dados.valorTotal
      const valorCBS = baseCBS * aliquotaCBS * (percentualNovo / 100)

      const totalImpostosNovos = valorIBS + valorCBS

      // 5. Montar resultado
      const totalTributos = totalImpostosAntigos + totalImpostosNovos
      const valorLiquido = dados.valorTotal - totalTributos
      const cargaTributariaPercentual = (totalTributos / dados.valorTotal) * 100

      return {
        sistemaAntigo: {
          icms: {
            baseCalculo: baseICMS,
            aliquota: aliquotaICMS,
            valor: parseFloat(valorICMS.toFixed(2)),
            cst: this.determinarCSTICMS(dados.regimeTributario, dados.cfop),
            csosn: dados.regimeTributario === 'SIMPLES' ? '102' : undefined
          },
          pis: {
            baseCalculo: basePIS,
            aliquota: aliquotaPIS,
            valor: parseFloat(valorPIS.toFixed(2)),
            cst: '01' // Operação tributável (cumulativo/não-cumulativo)
          },
          cofins: {
            baseCalculo: baseCOFINS,
            aliquota: aliquotaCOFINS,
            valor: parseFloat(valorCOFINS.toFixed(2)),
            cst: '01'
          },
          totalImpostosAntigos: parseFloat(totalImpostosAntigos.toFixed(2)),
          percentualAplicado: percentualAntigo
        },
        sistemaNovo: {
          ibs: {
            baseCalculo: baseIBS,
            aliquota: aliquotaIBS,
            valor: parseFloat(valorIBS.toFixed(2)),
            cst: '00', // Tributado integralmente
            creditoApropriado: 0 // TODO: Calcular crédito de insumos
          },
          cbs: {
            baseCalculo: baseCBS,
            aliquota: aliquotaCBS,
            valor: parseFloat(valorCBS.toFixed(2)),
            cst: '00',
            creditoApropriado: 0
          },
          totalImpostosNovos: parseFloat(totalImpostosNovos.toFixed(2)),
          percentualAplicado: percentualNovo
        },
        totalTributos: parseFloat(totalTributos.toFixed(2)),
        valorLiquido: parseFloat(valorLiquido.toFixed(2)),
        cargaTributariaPercentual: parseFloat(cargaTributariaPercentual.toFixed(2))
      }
    } catch (error) {
      console.error('Erro ao calcular tributação:', error)
      throw error
    }
  },

  /**
   * Determina CST de ICMS baseado no regime e CFOP
   */
  determinarCSTICMS(regime: string, cfop: string): string {
    if (regime === 'SIMPLES') {
      return '' // Simples usa CSOSN
    }
    
    // Simplificação: retornar CST genérico
    if (cfop.startsWith('5') || cfop.startsWith('6')) {
      return '00' // Tributada integralmente
    }
    
    return '00'
  },

  /**
   * Validar se produto pode ser tributado
   */
  async validarTributacao(ncm: string, tipoDocumento: 'NFE' | 'NFCE' | 'NFSE'): Promise<{
    valido: boolean
    erros: string[]
  }> {
    const erros: string[] = []

    // Validar NCM
    if (!ncm || ncm.length !== 8) {
      erros.push('NCM inválido - deve ter 8 dígitos')
    }

    // Validar tipo de documento
    if (tipoDocumento === 'NFSE' && ncm) {
      erros.push('NFS-e não utiliza NCM (serviços)')
    }

    return {
      valido: erros.length === 0,
      erros
    }
  },

  /**
   * Buscar regra de tributação mais específica
   */
  async buscarRegraTributacao(
    empresaId: number,
    tipoDocumento: 'NFE' | 'NFCE' | 'NFSE',
    ncm: string,
    cfop: string,
    ufOrigem: string,
    ufDestino: string
  ): Promise<any> {
    const { data, error } = await supabase
      .rpc('buscar_regra_tributacao', {
        p_empresa_id: empresaId,
        p_tipo_documento: tipoDocumento,
        p_ncm: ncm,
        p_cfop: cfop,
        p_uf_origem: ufOrigem,
        p_uf_destino: ufDestino
      })

    if (error) throw error
    return data
  },

  /**
   * Calcular carga tributária total de uma nota
   */
  async calcularCargaTributariaNota(itens: DadosCalculoTributario[]): Promise<{
    totalProdutos: number
    totalTributos: number
    cargaTributariaPercentual: number
    totalNota: number
  }> {
    let totalProdutos = 0
    let totalTributos = 0

    for (const item of itens) {
      const resultado = await this.calcularTributacaoItem(item)
      totalProdutos += item.valorTotal
      totalTributos += resultado.totalTributos
    }

    return {
      totalProdutos,
      totalTributos,
      cargaTributariaPercentual: (totalTributos / totalProdutos) * 100,
      totalNota: totalProdutos + totalTributos
    }
  }
}

/**
 * HELPER: Formatar valor monetário
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

/**
 * HELPER: Formatar percentual
 */
export function formatarPercentual(valor: number): string {
  return `${valor.toFixed(2)}%`
}
