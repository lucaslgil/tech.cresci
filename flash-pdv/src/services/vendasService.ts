// =====================================================
// SERVICES - VENDAS PDV
// Gestão de vendas com sincronização para retaguarda
// =====================================================

import { ConfigPDV } from '../types/electron'

export interface VendaItem {
  id?: number
  venda_local_id?: number
  produto_id: number
  produto_codigo: string
  produto_descricao: string
  quantidade: number
  preco_unitario: number
  desconto: number
  acrescimo: number
  valor_total: number
  numero_item: number
}

export interface VendaPagamento {
  id?: number
  venda_local_id?: number
  forma_pagamento: string
  valor: number
  numero_parcela: number
}

export interface Venda {
  id?: number
  uuid: string // UUID único para sincronização
  numero?: number
  empresa_id: number
  usuario_id: number
  usuario_nome: string
  cliente_id?: number
  cliente_nome?: string
  cliente_cpf?: string
  data_venda: string
  tipo_venda: 'VENDA' | 'ORCAMENTO'
  status: 'PEDIDO_ABERTO' | 'PEDIDO_FECHADO' | 'FATURADO' | 'CANCELADO'
  subtotal: number
  desconto: number
  acrescimo: number
  total: number
  observacoes?: string
  sincronizado: boolean
  retaguarda_id?: number // ID da venda na retaguarda após sincronização
  created_at: string
  updated_at: string
  itens?: VendaItem[]
  pagamentos?: VendaPagamento[]
}

export interface VendaFormData {
  cliente_id?: number
  cliente_nome?: string
  cliente_cpf?: string
  tipo_venda: 'VENDA' | 'ORCAMENTO'
  observacoes?: string
  itens: VendaItem[]
  pagamentos: VendaPagamento[]
}

export class VendasService {
  private config: ConfigPDV

  constructor(config: ConfigPDV) {
    this.config = config
  }

  /**
   * Gerar UUID único para a venda
   */
  private gerarUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * Calcular totais da venda
   */
  private calcularTotais(itens: VendaItem[]): { subtotal: number; total: number } {
    const subtotal = itens.reduce((sum, item) => sum + item.valor_total, 0)
    const total = subtotal
    return { subtotal, total }
  }

  /**
   * Criar nova venda
   */
  async criar(dados: VendaFormData): Promise<Venda> {
    const uuid = this.gerarUUID()
    const dataVenda = new Date().toISOString()
    const { subtotal, total } = this.calcularTotais(dados.itens)

    // Inserir venda
    const resultVenda = await window.electronAPI.db.execute(
      `INSERT INTO vendas (
        uuid, empresa_id, usuario_id, usuario_nome,
        cliente_id, cliente_nome, cliente_cpf,
        data_venda, tipo_venda, status,
        subtotal, desconto, acrescimo, total,
        observacoes, sincronizado, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid,
        this.config.empresaId,
        this.config.usuarioId,
        this.config.usuarioNome,
        dados.cliente_id || null,
        dados.cliente_nome || null,
        dados.cliente_cpf || null,
        dataVenda,
        dados.tipo_venda,
        'PEDIDO_ABERTO',
        subtotal,
        0,
        0,
        total,
        dados.observacoes || null,
        0, // não sincronizado
        dataVenda,
        dataVenda
      ]
    )

    const vendaId = resultVenda.lastInsertRowid

    // Inserir itens
    for (let i = 0; i < dados.itens.length; i++) {
      const item = dados.itens[i]
      await window.electronAPI.db.execute(
        `INSERT INTO vendas_itens (
          venda_local_id, produto_id, produto_codigo, produto_descricao,
          quantidade, preco_unitario, desconto, acrescimo, valor_total, numero_item
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          vendaId,
          item.produto_id,
          item.produto_codigo,
          item.produto_descricao,
          item.quantidade,
          item.preco_unitario,
          item.desconto || 0,
          item.acrescimo || 0,
          item.valor_total,
          i + 1
        ]
      )
    }

    // Inserir pagamentos
    for (let i = 0; i < dados.pagamentos.length; i++) {
      const pagamento = dados.pagamentos[i]
      await window.electronAPI.db.execute(
        `INSERT INTO vendas_pagamentos (
          venda_local_id, forma_pagamento, valor, numero_parcela
        ) VALUES (?, ?, ?, ?)`,
        [vendaId, pagamento.forma_pagamento, pagamento.valor, i + 1]
      )
    }

    return this.buscarPorId(Number(vendaId))!
  }

  /**
   * Buscar venda por ID com itens e pagamentos
   */
  async buscarPorId(id: number): Promise<Venda | null> {
    const result = await window.electronAPI.db.query(
      `SELECT * FROM vendas WHERE id = ? AND empresa_id = ?`,
      [id, this.config.empresaId]
    )

    if (!result || result.length === 0) return null

    const venda = result[0]

    // Buscar itens
    const itens = await window.electronAPI.db.query(
      `SELECT * FROM vendas_itens WHERE venda_local_id = ? ORDER BY numero_item`,
      [id]
    )

    // Buscar pagamentos
    const pagamentos = await window.electronAPI.db.query(
      `SELECT * FROM vendas_pagamentos WHERE venda_local_id = ? ORDER BY numero_parcela`,
      [id]
    )

    venda.itens = itens || []
    venda.pagamentos = pagamentos || []

    return venda
  }

  /**
   * Listar vendas (não sincronizadas primeiro)
   */
  async listar(limite = 50): Promise<Venda[]> {
    const result = await window.electronAPI.db.query(
      `SELECT * FROM vendas 
       WHERE empresa_id = ? 
       ORDER BY sincronizado ASC, created_at DESC 
       LIMIT ?`,
      [this.config.empresaId, limite]
    )

    return result || []
  }

  /**
   * Listar vendas não sincronizadas
   */
  async listarNaoSincronizadas(): Promise<Venda[]> {
    const result = await window.electronAPI.db.query(
      `SELECT * FROM vendas 
       WHERE empresa_id = ? 
         AND sincronizado = 0 
         AND status IN ('PEDIDO_FECHADO', 'FATURADO')
       ORDER BY created_at ASC`,
      [this.config.empresaId]
    )

    // Carregar itens para cada venda
    const vendas: Venda[] = []
    for (const venda of result || []) {
      const vendaCompleta = await this.buscarPorId(venda.id)
      if (vendaCompleta) vendas.push(vendaCompleta)
    }

    return vendas
  }

  /**
   * Atualizar status da venda
   */
  async atualizarStatus(id: number, status: Venda['status']): Promise<void> {
    await window.electronAPI.db.execute(
      `UPDATE vendas 
       SET status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND empresa_id = ?`,
      [status, id, this.config.empresaId]
    )
  }

  /**
   * Marcar venda como sincronizada
   */
  async marcarComoSincronizada(id: number, retaguardaId: number): Promise<void> {
    await window.electronAPI.db.execute(
      `UPDATE vendas 
       SET sincronizado = 1, retaguarda_id = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND empresa_id = ?`,
      [retaguardaId, id, this.config.empresaId]
    )
  }

  /**
   * Cancelar venda
   */
  async cancelar(id: number): Promise<void> {
    await this.atualizarStatus(id, 'CANCELADO')
  }

  /**
   * Estatísticas do dia
   */
  async estatisticasDoDia(): Promise<{
    totalVendas: number
    valorTotal: number
    vendasFechadas: number
    vendasAbertas: number
  }> {
    const hoje = new Date().toISOString().split('T')[0]

    const result = await window.electronAPI.db.query(
      `SELECT 
         COUNT(*) as total_vendas,
         SUM(CASE WHEN status != 'CANCELADO' THEN total ELSE 0 END) as valor_total,
         SUM(CASE WHEN status = 'PEDIDO_FECHADO' THEN 1 ELSE 0 END) as vendas_fechadas,
         SUM(CASE WHEN status = 'PEDIDO_ABERTO' THEN 1 ELSE 0 END) as vendas_abertas
       FROM vendas 
       WHERE empresa_id = ? 
         AND DATE(data_venda) = ?`,
      [this.config.empresaId, hoje]
    )

    if (result && result.length > 0) {
      return {
        totalVendas: result[0].total_vendas || 0,
        valorTotal: result[0].valor_total || 0,
        vendasFechadas: result[0].vendas_fechadas || 0,
        vendasAbertas: result[0].vendas_abertas || 0
      }
    }

    return {
      totalVendas: 0,
      valorTotal: 0,
      vendasFechadas: 0,
      vendasAbertas: 0
    }
  }
}
