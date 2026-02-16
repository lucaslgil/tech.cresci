// =====================================================
// SERVICES - PRODUTOS PDV
// Gestão de produtos com segurança multi-tenant
// =====================================================

import { ConfigPDV } from '../types/electron'

export interface Produto {
  id: number
  codigo_interno: string
  nome: string
  preco_venda: number
  estoque_atual: number
  codigo_barras?: string
  ncm?: string
  cfop_saida?: string
  cest?: string
  origem_mercadoria?: string
  unidade_medida?: string
  empresa_id: number
  ativo: boolean
  updated_at: string
}

export interface ProdutoFiltros {
  busca?: string
  codigo?: string
  ean13?: string
  ativo?: boolean
}

export class ProdutosService {
  private config: ConfigPDV

  constructor(config: ConfigPDV) {
    this.config = config
  }

  /**
   * Lista produtos com filtros (respeita tenant)
   */
  async listar(filtros?: ProdutoFiltros): Promise<Produto[]> {
    let sql = `
      SELECT * FROM produtos 
      WHERE empresa_id = ? 
        AND ativo = 1
    `
    const params: any[] = [this.config.empresaId]

    if (filtros?.busca) {
      sql += ` AND (codigo_interno LIKE ? OR nome LIKE ? OR codigo_barras LIKE ?)`
      const buscaLike = `%${filtros.busca}%`
      params.push(buscaLike, buscaLike, buscaLike)
    }

    if (filtros?.codigo) {
      sql += ` AND codigo = ?`
      params.push(filtros.codigo)
    }

    if (filtros?.ean13) {
      sql += ` AND codigo_barras = ?`
      params.push(filtros.ean13)
    }

    sql += ` ORDER BY descricao LIMIT 100`

    const result = await window.electronAPI.db.query(sql, params)
    return result || []
  }

  /**
   * Busca produto por ID (valida tenant)
   */
  async buscarPorId(id: number): Promise<Produto | null> {
    const result = await window.electronAPI.db.query(
      `SELECT * FROM produtos WHERE id = ? AND empresa_id = ?`,
      [id, this.config.empresaId]
    )

    return result && result.length > 0 ? result[0] : null
  }

  /**
   * Busca produto por código (valida tenant)
   */
  async buscarPorCodigo(codigo: string): Promise<Produto | null> {
    const result = await window.electronAPI.db.query(
      `SELECT * FROM produtos WHERE codigo = ? AND empresa_id = ? AND ativo = 1`,
      [codigo, this.config.empresaId]
    )

    return result && result.length > 0 ? result[0] : null
  }

  /**
   * Busca produto por código de barras (valida tenant)
   */
  async buscarPorEan(ean13: string): Promise<Produto | null> {
    const result = await this.electronAPI.db.query(
      `SELECT * FROM produtos WHERE codigo_barras = ? AND empresa_id = ? AND ativo = 1`,
      [ean13, this.config.empresaId]
    )

    return result && result.length > 0 ? result[0] : null
  }

  /**
   * Verificar se há estoque disponível
   */
  async verificarEstoque(id: number, quantidade: number): Promise<boolean> {
    const produto = await this.buscarPorId(id)
    if (!produto) return false
    return produto.estoque_atual >= quantidade
  }

  /**
   * Atualizar estoque local (após venda)
   */
  async atualizarEstoque(id: number, quantidade: number): Promise<void> {
    await window.electronAPI.db.execute(
      `UPDATE produtos 
       SET estoque_atual = estoque_atual - ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND empresa_id = ?`,
      [quantidade, id, this.config.empresaId]
    )
  }
}
