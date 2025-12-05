// =====================================================
// SERVIÇOS DE API - MÓDULO DE PRODUTOS
// CRUD completo e operações especiais
// Data: 01/12/2025
// =====================================================

import { supabase } from '../../lib/supabase'
import type { 
  Produto, 
  ProdutoFormData, 
  ProdutoComEstoque,
  MovimentacaoEstoque,
  HistoricoPrecos,
  ProdutoFiltros,
  TipoMovimentacao
} from './types'

/**
 * Buscar todos os produtos com filtros opcionais
 */
export async function buscarProdutos(filtros?: ProdutoFiltros) {
  try {
    let query = supabase
      .from('produtos')
      .select('*')
      .order('nome', { ascending: true })

    // Aplicar filtros
    if (filtros?.nome) {
      query = query.ilike('nome', `%${filtros.nome}%`)
    }

    if (filtros?.categoria) {
      query = query.eq('categoria', filtros.categoria)
    }

    if (filtros?.ncm) {
      query = query.eq('ncm', filtros.ncm)
    }

    if (filtros?.cfop) {
      query = query.or(`cfop_entrada.eq.${filtros.cfop},cfop_saida.eq.${filtros.cfop}`)
    }

    if (filtros?.ativo !== undefined) {
      query = query.eq('ativo', filtros.ativo)
    }

    if (filtros?.estoque_baixo) {
      query = query.lt('estoque_atual', supabase.rpc('estoque_minimo'))
    }

    const { data, error } = await query

    if (error) throw error
    return { data: data as Produto[], error: null }
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return { data: null, error }
  }
}

/**
 * Buscar produtos com informação de status de estoque
 */
export async function buscarProdutosComEstoque(filtros?: ProdutoFiltros) {
  try {
    let query = supabase
      .from('produtos')
      .select('*')
      .order('nome', { ascending: true })

    // Aplicar filtros
    if (filtros?.nome) {
      query = query.ilike('nome', `%${filtros.nome}%`)
    }

    if (filtros?.categoria) {
      query = query.eq('categoria', filtros.categoria)
    }

    if (filtros?.ativo !== undefined) {
      query = query.eq('ativo', filtros.ativo)
    }

    const { data, error } = await query

    if (error) throw error
    
    // Retornar produtos com seus valores reais de estoque
    const produtosComEstoque: ProdutoComEstoque[] = (data || []).map(produto => ({
      ...produto,
      status_estoque: calcularStatusEstoque(
        produto.estoque_atual || 0,
        produto.estoque_minimo || 0,
        produto.estoque_maximo || 0
      )
    }))
    
    return { data: produtosComEstoque, error: null }
  } catch (error) {
    console.error('Erro ao buscar produtos com estoque:', error)
    return { data: null, error }
  }
}

/**
 * Calcular status do estoque
 */
function calcularStatusEstoque(
  atual: number,
  minimo: number,
  maximo: number
): 'normal' | 'baixo' | 'alto' | 'zerado' {
  if (atual <= 0) return 'zerado'
  if (minimo > 0 && atual < minimo) return 'baixo'
  if (maximo > 0 && atual > maximo) return 'alto'
  return 'normal'
}

/**
 * Buscar produto por ID
 */
export async function buscarProdutoPorId(id: string) {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data: data as Produto, error: null }
  } catch (error) {
    console.error('Erro ao buscar produto:', error)
    return { data: null, error }
  }
}

/**
 * Buscar produto por código interno
 */
export async function buscarProdutoPorCodigo(codigo: string) {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('codigo_interno', codigo)
      .single()

    if (error) throw error
    return { data: data as Produto, error: null }
  } catch (error) {
    console.error('Erro ao buscar produto por código:', error)
    return { data: null, error }
  }
}

/**
 * Buscar produto por código de barras
 */
export async function buscarProdutoPorCodigoBarras(codigoBarras: string) {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('codigo_barras', codigoBarras)
      .single()

    if (error) throw error
    return { data: data as Produto, error: null }
  } catch (error) {
    console.error('Erro ao buscar produto por código de barras:', error)
    return { data: null, error }
  }
}

/**
 * Criar novo produto
 */
export async function criarProduto(produto: ProdutoFormData) {
  try {
    // Limpar campos vazios (converter "" para null)
    const produtoLimpo = Object.fromEntries(
      Object.entries(produto).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    ) as ProdutoFormData

    // Validar código de barras duplicado (apenas se preenchido)
    if (produtoLimpo.codigo_barras) {
      const { data: existente } = await supabase
        .from('produtos')
        .select('id, nome')
        .eq('codigo_barras', produtoLimpo.codigo_barras)
        .maybeSingle()

      if (existente) {
        return { 
          data: null, 
          error: { message: `Código de barras já existe no produto: ${existente.nome}` } 
        }
      }
    }

    // Validar código interno duplicado (apenas se preenchido)
    if (produtoLimpo.codigo_interno) {
      const { data: existente } = await supabase
        .from('produtos')
        .select('id, nome')
        .eq('codigo_interno', produtoLimpo.codigo_interno)
        .maybeSingle()

      if (existente) {
        return { 
          data: null, 
          error: { message: `Código interno já existe no produto: ${existente.nome}` } 
        }
      }
    }

    // Buscar usuário autenticado
    const { data: { user } } = await supabase.auth.getUser()

    const produtoData = {
      ...produtoLimpo,
      usuario_cadastro: user?.id,
      usuario_atualizacao: user?.id
    }

    const { data, error } = await supabase
      .from('produtos')
      .insert([produtoData])
      .select()
      .single()

    if (error) return { data: null, error }
    return { data: data as Produto, error: null }
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return { data: null, error }
  }
}

/**
 * Atualizar produto existente
 */
export async function atualizarProduto(id: string, produto: Partial<ProdutoFormData>) {
  try {
    console.log('🔧 atualizarProduto - Dados recebidos:', produto)
    console.log('🔧 Estoque no payload:', produto.estoque_atual)
    
    // Limpar campos vazios (converter "" para null)
    const produtoLimpo = Object.fromEntries(
      Object.entries(produto).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    ) as Partial<ProdutoFormData>

    console.log('🧹 Dados após limpeza:', produtoLimpo)

    // Buscar usuário autenticado
    const { data: { user } } = await supabase.auth.getUser()

    const produtoData = {
      ...produtoLimpo,
      usuario_atualizacao: user?.id
    }

    console.log('📤 Payload final para Supabase:', produtoData)

    const { data, error } = await supabase
      .from('produtos')
      .update(produtoData)
      .eq('id', id)
      .select()
      .single()

    console.log('📥 Resposta do Supabase:', { data, error })

    if (error) return { data: null, error }
    return { data: data as Produto, error: null }
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    return { data: null, error }
  }
}

/**
 * Excluir produto
 */
export async function excluirProduto(id: string) {
  try {
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Erro ao excluir produto:', error)
    return { error }
  }
}

/**
 * Ativar/Desativar produto
 */
export async function toggleAtivoProduto(id: string, ativo: boolean) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('produtos')
      .update({ 
        ativo,
        usuario_atualizacao: user?.id
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data: data as Produto, error: null }
  } catch (error) {
    console.error('Erro ao atualizar status do produto:', error)
    return { data: null, error }
  }
}

/**
 * Buscar produtos com estoque baixo
 */
export async function buscarProdutosEstoqueBaixo() {
  try {
    const { data, error } = await supabase
      .from('vw_produtos_estoque')
      .select('*')
      .eq('status_estoque', 'ESTOQUE_BAIXO')
      .eq('ativo', true)
      .order('estoque_atual', { ascending: true })

    if (error) throw error
    return { data: data as ProdutoComEstoque[], error: null }
  } catch (error) {
    console.error('Erro ao buscar produtos com estoque baixo:', error)
    return { data: null, error }
  }
}

/**
 * Buscar categorias únicas de produtos
 */
export async function buscarCategorias() {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('categoria')
      .not('categoria', 'is', null)
      .order('categoria')

    if (error) throw error
    
    // Remover duplicatas
    const categorias = [...new Set(data?.map(item => item.categoria) || [])]
    return { data: categorias as string[], error: null }
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return { data: null, error }
  }
}

// =====================================================
// MOVIMENTAÇÕES DE ESTOQUE
// =====================================================

/**
 * Registrar movimentação de estoque
 */
export async function registrarMovimentacaoEstoque(
  produtoId: string,
  tipoMovimentacao: TipoMovimentacao,
  quantidade: number,
  dados?: {
    documentoFiscalId?: string
    numeroDocumento?: string
    serieDocumento?: string
    lote?: string
    serie?: string
    dataValidade?: string
    observacoes?: string
  }
) {
  try {
    // Buscar produto atual
    const { data: produto, error: errorProduto } = await buscarProdutoPorId(produtoId)
    if (errorProduto || !produto) throw new Error('Produto não encontrado')

    const estoqueAnterior = produto.estoque_atual
    let estoqueAtual = estoqueAnterior

    // Calcular novo estoque baseado no tipo de movimentação
    switch (tipoMovimentacao) {
      case 'ENTRADA':
      case 'DEVOLUCAO':
        estoqueAtual = estoqueAnterior + quantidade
        break
      case 'SAIDA':
        estoqueAtual = estoqueAnterior - quantidade
        break
      case 'AJUSTE':
      case 'INVENTARIO':
        estoqueAtual = quantidade // Quantidade já é o valor final
        break
      case 'TRANSFERENCIA':
        // Para transferência, a quantidade pode ser negativa (saída) ou positiva (entrada)
        estoqueAtual = estoqueAnterior + quantidade
        break
    }

    // Validar estoque
    if (estoqueAtual < 0) {
      throw new Error('Estoque não pode ficar negativo')
    }

    // Buscar usuário autenticado
    const { data: { user } } = await supabase.auth.getUser()

    // Registrar movimentação
    const movimentacao = {
      produto_id: produtoId,
      tipo_movimentacao: tipoMovimentacao,
      quantidade,
      estoque_anterior: estoqueAnterior,
      estoque_atual: estoqueAtual,
      documento_fiscal_id: dados?.documentoFiscalId,
      numero_documento: dados?.numeroDocumento,
      serie_documento: dados?.serieDocumento,
      lote: dados?.lote,
      serie: dados?.serie,
      data_validade: dados?.dataValidade,
      observacoes: dados?.observacoes,
      usuario_id: user?.id
    }

    const { data: movData, error: errorMov } = await supabase
      .from('produtos_movimentacoes')
      .insert([movimentacao])
      .select()
      .single()

    if (errorMov) throw errorMov

    // Atualizar estoque do produto
    const { error: errorUpdate } = await supabase
      .from('produtos')
      .update({ 
        estoque_atual: estoqueAtual,
        usuario_atualizacao: user?.id
      })
      .eq('id', produtoId)

    if (errorUpdate) throw errorUpdate

    return { data: movData as MovimentacaoEstoque, error: null }
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error)
    return { data: null, error }
  }
}

/**
 * Buscar movimentações de um produto
 */
export async function buscarMovimentacoesProduto(produtoId: string) {
  try {
    const { data, error } = await supabase
      .from('produtos_movimentacoes')
      .select('*')
      .eq('produto_id', produtoId)
      .order('data_movimentacao', { ascending: false })

    if (error) throw error
    return { data: data as MovimentacaoEstoque[], error: null }
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error)
    return { data: null, error }
  }
}

/**
 * Buscar histórico de preços de um produto
 */
export async function buscarHistoricoPrecos(produtoId: string) {
  try {
    const { data, error } = await supabase
      .from('produtos_precos_historico')
      .select('*')
      .eq('produto_id', produtoId)
      .order('data_alteracao', { ascending: false })

    if (error) throw error
    return { data: data as HistoricoPrecos[], error: null }
  } catch (error) {
    console.error('Erro ao buscar histórico de preços:', error)
    return { data: null, error }
  }
}

// =====================================================
// VALIDAÇÕES FISCAIS
// =====================================================

/**
 * Validar NCM (8 dígitos numéricos)
 */
export function validarNCM(ncm: string): boolean {
  const ncmLimpo = ncm.replace(/\D/g, '')
  return ncmLimpo.length === 8
}

/**
 * Validar CEST (7 dígitos)
 */
export function validarCEST(cest: string): boolean {
  const cestLimpo = cest.replace(/\D/g, '')
  return cestLimpo.length === 7
}

/**
 * Validar CFOP (4 dígitos)
 */
export function validarCFOP(cfop: string): boolean {
  const cfopLimpo = cfop.replace(/\D/g, '')
  return cfopLimpo.length === 4
}

/**
 * Validar código de barras EAN-13
 */
export function validarEAN13(ean: string): boolean {
  const eanLimpo = ean.replace(/\D/g, '')
  
  if (eanLimpo.length !== 13) return false
  
  // Validar dígito verificador
  let soma = 0
  for (let i = 0; i < 12; i++) {
    const digito = parseInt(eanLimpo[i])
    soma += i % 2 === 0 ? digito : digito * 3
  }
  
  const digitoVerificador = (10 - (soma % 10)) % 10
  return digitoVerificador === parseInt(eanLimpo[12])
}

/**
 * Validar compatibilidade entre regime tributário e CST/CSOSN
 * NOTA: Validação removida temporariamente - campos fiscais simplificados
 */
export function validarRegimeTributario(
  _regimeTributario: string,
  _cstIcms?: string,
  _csosnIcms?: string
): { valido: boolean; mensagem?: string } {
  // Validação desabilitada - sistema simplificado mantém apenas NCM, CEST e Origem
  return { valido: true }
}

/**
 * Calcular margem de lucro
 */
export function calcularMargemLucro(precoCusto: number, precoVenda: number): number {
  if (precoCusto === 0) return 0
  return ((precoVenda - precoCusto) / precoCusto) * 100
}

/**
 * Calcular preço de venda baseado em custo e margem
 */
export function calcularPrecoVenda(precoCusto: number, margemLucro: number): number {
  return precoCusto * (1 + margemLucro / 100)
}

/**
 * Formatar NCM com pontos (1234.56.78)
 */
export function formatarNCM(ncm: string | null | undefined): string {
  if (!ncm) return '-'
  const ncmLimpo = ncm.replace(/\D/g, '')
  if (ncmLimpo.length !== 8) return ncm
  return `${ncmLimpo.slice(0, 4)}.${ncmLimpo.slice(4, 6)}.${ncmLimpo.slice(6, 8)}`
}

/**
 * Formatar CFOP (1.234)
 */
export function formatarCFOP(cfop: string): string {
  const cfopLimpo = cfop.replace(/\D/g, '')
  if (cfopLimpo.length !== 4) return cfop
  return `${cfopLimpo.slice(0, 1)}.${cfopLimpo.slice(1)}`
}
