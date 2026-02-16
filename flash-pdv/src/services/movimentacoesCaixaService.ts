/**
 * Serviço de Movimentações de Caixa - PDV
 * Gerencia abertura, fechamento e movimentações do caixa local
 * com sincronização automática para retaguarda
 */

import { ConfigPDV } from '../types/electron'

// Helper para gerar UUID
const generateUUID = (): string => {
  return crypto.randomUUID()
}

export type TipoMovimentacao = 'ENTRADA' | 'SAIDA' | 'ABERTURA' | 'FECHAMENTO'

export interface MovimentacaoCaixa {
  id?: number
  uuid: string
  empresa_id: number
  tipo: TipoMovimentacao
  valor: number
  data_movimentacao: string
  descricao: string
  categoria?: string
  venda_local_id?: number
  origem: string
  caixa_aberto: boolean
  caixa_numero?: number
  usuario_id: string
  usuario_nome: string
  sincronizado: boolean
  retaguarda_id?: number
  created_at?: string
  updated_at?: string
}

export interface StatusCaixa {
  caixaAberto: boolean
  caixaNumero?: number
  valorAbertura?: number
  totalEntradas: number
  totalSaidas: number
  saldoAtual: number
  dataAbertura?: string
}

export class MovimentacoesCaixaService {
  /**
   * Verifica o status atual do caixa
   */
  static async statusCaixa(config: ConfigPDV): Promise<StatusCaixa> {
    try {
      const hoje = new Date().toISOString().split('T')[0]
      
      // Buscar abertura de caixa do dia
      const abertura = await window.electronAPI.db.query(
        `SELECT * FROM movimentacoes_caixa 
         WHERE empresa_id = ? 
           AND tipo = 'ABERTURA'
           AND DATE(data_movimentacao) = DATE(?)
           AND caixa_aberto = 1
         ORDER BY created_at DESC
         LIMIT 1`,
        [config.empresaId, hoje]
      )

      if (!abertura || abertura.length === 0) {
        return {
          caixaAberto: false,
          totalEntradas: 0,
          totalSaidas: 0,
          saldoAtual: 0
        }
      }

      const caixaInfo = abertura[0]
      
      // Calcular movimentações do dia
      const movimentacoes = await window.electronAPI.db.query(
        `SELECT tipo, SUM(valor) as total
         FROM movimentacoes_caixa
         WHERE empresa_id = ?
           AND caixa_numero = ?
           AND DATE(data_movimentacao) = DATE(?)
           AND tipo IN ('ENTRADA', 'SAIDA')
         GROUP BY tipo`,
        [config.empresaId, caixaInfo.caixa_numero, hoje]
      )

      let totalEntradas = 0
      let totalSaidas = 0

      movimentacoes.forEach((mov: any) => {
        if (mov.tipo === 'ENTRADA') totalEntradas = mov.total
        if (mov.tipo === 'SAIDA') totalSaidas = mov.total
      })

      const saldoAtual = caixaInfo.valor + totalEntradas - totalSaidas

      return {
        caixaAberto: true,
        caixaNumero: caixaInfo.caixa_numero,
        valorAbertura: caixaInfo.valor,
        totalEntradas,
        totalSaidas,
        saldoAtual,
        dataAbertura: caixaInfo.data_movimentacao
      }
    } catch (error) {
      console.error('Erro ao verificar status do caixa:', error)
      throw error
    }
  }

  /**
   * Abre um novo caixa
   */
  static async abrirCaixa(
    config: ConfigPDV,
    valorInicial: number,
    usuarioNome: string,
    observacoes?: string
  ): Promise<MovimentacaoCaixa> {
    try {
      // Verificar se já existe caixa aberto
      const status = await this.statusCaixa(config)
      if (status.caixaAberto) {
        throw new Error('Já existe um caixa aberto. Feche o caixa atual antes de abrir um novo.')
      }

      const hoje = new Date().toISOString().split('T')[0]
      
      // Obter próximo número de caixa do dia
      const resultado = await window.electronAPI.db.query(
        `SELECT COALESCE(MAX(caixa_numero), 0) + 1 as proximo_numero
         FROM movimentacoes_caixa
         WHERE empresa_id = ?
           AND DATE(data_movimentacao) = DATE(?)`,
        [config.empresaId, hoje]
      )

      const caixaNumero = resultado[0]?.proximo_numero || 1

      // Criar movimentação de abertura
      const movimentacao: MovimentacaoCaixa = {
        uuid: generateUUID(),
        empresa_id: config.empresaId,
        tipo: 'ABERTURA',
        valor: valorInicial,
        data_movimentacao: new Date().toISOString(),
        descricao: observacoes ? `Abertura de Caixa - ${observacoes}` : 'Abertura de Caixa',
        categoria: 'SISTEMA',
        origem: 'PDV',
        caixa_aberto: true,
        caixa_numero: caixaNumero,
        usuario_id: config.usuarioId,
        usuario_nome: usuarioNome,
        sincronizado: false
      }

      // Inserir no banco
      const result = await window.electronAPI.db.execute(
        `INSERT INTO movimentacoes_caixa (
          uuid, empresa_id, tipo, valor, data_movimentacao, descricao,
          categoria, origem, caixa_aberto, caixa_numero, usuario_id, usuario_nome, sincronizado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          movimentacao.uuid,
          movimentacao.empresa_id,
          movimentacao.tipo,
          movimentacao.valor,
          movimentacao.data_movimentacao,
          movimentacao.descricao,
          movimentacao.categoria,
          movimentacao.origem,
          movimentacao.caixa_aberto ? 1 : 0,
          movimentacao.caixa_numero,
          movimentacao.usuario_id,
          movimentacao.usuario_nome,
          movimentacao.sincronizado ? 1 : 0
        ]
      )

      console.log('✅ Caixa aberto com sucesso:', {
        numero: caixaNumero,
        valor: valorInicial
      })

      // Disparar sincronização em background
      this.sincronizarPendentes(config).catch(err => 
        console.warn('Erro na sincronização automática:', err)
      )

      return movimentacao
    } catch (error) {
      console.error('Erro ao abrir caixa:', error)
      throw error
    }
  }

  /**
   * Fecha o caixa atual
   */
  static async fecharCaixa(
    config: ConfigPDV,
    valorFinal: number,
    usuarioNome: string,
    observacoes?: string
  ): Promise<MovimentacaoCaixa> {
    try {
      // Verificar se existe caixa aberto
      const status = await this.statusCaixa(config)
      if (!status.caixaAberto) {
        throw new Error('Não há caixa aberto para fechar.')
      }

      // Calcular diferença
      const diferenca = valorFinal - status.saldoAtual
      let categoriaFechamento = 'CONFERIDO'
      
      if (diferenca > 0) {
        categoriaFechamento = `SOBRA: R$ ${diferenca.toFixed(2)}`
      } else if (diferenca < 0) {
        categoriaFechamento = `FALTA: R$ ${Math.abs(diferenca).toFixed(2)}`
      }

      const descricaoFinal = [
        'Fechamento de Caixa',
        observacoes ? observacoes : null,
        diferenca !== 0 ? categoriaFechamento : null
      ].filter(Boolean).join(' - ')

      // Criar movimentação de fechamento
      const movimentacao: MovimentacaoCaixa = {
        uuid: generateUUID(),
        empresa_id: config.empresaId,
        tipo: 'FECHAMENTO',
        valor: valorFinal,
        data_movimentacao: new Date().toISOString(),
        descricao: descricaoFinal,
        categoria: categoriaFechamento,
        origem: 'PDV',
        caixa_aberto: false,
        caixa_numero: status.caixaNumero,
        usuario_id: config.usuarioId,
        usuario_nome: usuarioNome,
        sincronizado: false
      }

      // Inserir fechamento
      await window.electronAPI.db.execute(
        `INSERT INTO movimentacoes_caixa (
          uuid, empresa_id, tipo, valor, data_movimentacao, descricao,
          categoria, origem, caixa_aberto, caixa_numero, usuario_id, usuario_nome, sincronizado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          movimentacao.uuid,
          movimentacao.empresa_id,
          movimentacao.tipo,
          movimentacao.valor,
          movimentacao.data_movimentacao,
          movimentacao.descricao,
          movimentacao.categoria,
          movimentacao.origem,
          movimentacao.caixa_aberto ? 1 : 0,
          movimentacao.caixa_numero,
          movimentacao.usuario_id,
          movimentacao.usuario_nome,
          movimentacao.sincronizado ? 1 : 0
        ]
      )

      // Marcar todas as movimentações do caixa como fechadas
      await window.electronAPI.db.execute(
        `UPDATE movimentacoes_caixa 
         SET caixa_aberto = 0
         WHERE empresa_id = ?
           AND caixa_numero = ?
           AND DATE(data_movimentacao) = DATE(?)`,
        [config.empresaId, status.caixaNumero, new Date().toISOString()]
      )

      console.log('✅ Caixa fechado com sucesso:', {
        numero: status.caixaNumero,
        valorFinal,
        diferenca
      })

      // Disparar sincronização em background
      this.sincronizarPendentes(config).catch(err =>
        console.warn('Erro na sincronização automática:', err)
      )

      return movimentacao
    } catch (error) {
      console.error('Erro ao fechar caixa:', error)
      throw error
    }
  }

  /**
   * Registra uma entrada de caixa
   */
  static async registrarEntrada(
    config: ConfigPDV,
    valor: number,
    descricao: string,
    categoria?: string,
    vendaLocalId?: number
  ): Promise<MovimentacaoCaixa> {
    return this.registrarMovimentacao(config, 'ENTRADA', valor, descricao, categoria, vendaLocalId)
  }

  /**
   * Registra uma saída de caixa
   */
  static async registrarSaida(
    config: ConfigPDV,
    valor: number,
    descricao: string,
    categoria?: string
  ): Promise<MovimentacaoCaixa> {
    return this.registrarMovimentacao(config, 'SAIDA', valor, descricao, categoria)
  }

  /**
   * Registra uma movimentação genérica
   */
  private static async registrarMovimentacao(
    config: ConfigPDV,
    tipo: TipoMovimentacao,
    valor: number,
    descricao: string,
    categoria?: string,
    vendaLocalId?: number
  ): Promise<MovimentacaoCaixa> {
    try {
      // Verificar se há caixa aberto
      const status = await this.statusCaixa(config)
      if (!status.caixaAberto) {
        throw new Error('Não há caixa aberto. Abra o caixa antes de registrar movimentações.')
      }

      const movimentacao: MovimentacaoCaixa = {
        uuid: generateUUID(),
        empresa_id: config.empresaId,
        tipo,
        valor,
        data_movimentacao: new Date().toISOString(),
        descricao,
        categoria,
        venda_local_id: vendaLocalId,
        origem: 'PDV',
        caixa_aberto: true,
        caixa_numero: status.caixaNumero,
        usuario_id: config.usuarioId,
        usuario_nome: config.usuarioNome || 'Operador PDV',
        sincronizado: false
      }

      await window.electronAPI.db.execute(
        `INSERT INTO movimentacoes_caixa (
          uuid, empresa_id, tipo, valor, data_movimentacao, descricao,
          categoria, venda_local_id, origem, caixa_aberto, caixa_numero,
          usuario_id, usuario_nome, sincronizado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          movimentacao.uuid,
          movimentacao.empresa_id,
          movimentacao.tipo,
          movimentacao.valor,
          movimentacao.data_movimentacao,
          movimentacao.descricao,
          movimentacao.categoria,
          movimentacao.venda_local_id,
          movimentacao.origem,
          movimentacao.caixa_aberto ? 1 : 0,
          movimentacao.caixa_numero,
          movimentacao.usuario_id,
          movimentacao.usuario_nome,
          movimentacao.sincronizado ? 1 : 0
        ]
      )

      console.log(`✅ ${tipo} registrada:`, { valor, descricao })

      return movimentacao
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error)
      throw error
    }
  }

  /**
   * Sincroniza movimentações pendentes com a retaguarda
   */
  static async sincronizarPendentes(config: ConfigPDV): Promise<{ sucesso: number; erros: number }> {
    try {
      // Buscar movimentações não sincronizadas
      const pendentes = await window.electronAPI.db.query(
        `SELECT * FROM movimentacoes_caixa 
         WHERE empresa_id = ? AND sincronizado = 0
         ORDER BY created_at ASC`,
        [config.empresaId]
      )

      if (!pendentes || pendentes.length === 0) {
        console.log('✅ Nenhuma movimentação de caixa pendente')
        return { sucesso: 0, erros: 0 }
      }

      let sucesso = 0
      let erros = 0

      // Importar supabase client dinamicamente
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        config.supabaseUrl,
        config.supabaseKey
      )

      for (const mov of pendentes) {
        try {
          // Enviar para retaguarda
          const { data, error } = await supabase
            .from('movimentacoes_caixa')
            .insert({
              empresa_id: mov.empresa_id,
              tipo: mov.tipo,
              valor: mov.valor,
              data_movimentacao: mov.data_movimentacao,
              descricao: mov.descricao,
              categoria: mov.categoria,
              venda_id: mov.venda_local_id ? mov.venda_local_id : null,
              origem: mov.origem,
              pdv_uuid: mov.uuid,
              caixa_aberto: mov.caixa_aberto === 1,
              caixa_numero: mov.caixa_numero,
              usuario_id: mov.usuario_id,
              usuario_nome: mov.usuario_nome
            })
            .select()
            .single()

          if (error) throw error

          // Marcar como sincronizado
          await window.electronAPI.db.execute(
            `UPDATE movimentacoes_caixa 
             SET sincronizado = 1, retaguarda_id = ?
             WHERE uuid = ?`,
            [data.id, mov.uuid]
          )

          sucesso++
          console.log(`✅ Movimentação ${mov.uuid} sincronizada`)
        } catch (error) {
          erros++
          console.error(`❌ Erro ao sincronizar movimentação ${mov.uuid}:`, error)
        }
      }

      console.log(`✅ Sincronização concluída: ${sucesso} sucesso, ${erros} erros`)
      return { sucesso, erros }
    } catch (error) {
      console.error('Erro ao sincronizar movimentações:', error)
      throw error
    }
  }

  /**
   * Lista movimentações do caixa atual
   */
  static async listarMovimentacoesCaixaAtual(config: ConfigPDV): Promise<MovimentacaoCaixa[]> {
    try {
      const status = await this.statusCaixa(config)
      if (!status.caixaAberto) {
        return []
      }

      const movimentacoes = await window.electronAPI.db.query(
        `SELECT * FROM movimentacoes_caixa
         WHERE empresa_id = ?
           AND caixa_numero = ?
         ORDER BY created_at ASC`,
        [config.empresaId, status.caixaNumero]
      )

      return movimentacoes.map((m: any) => ({
        ...m,
        caixa_aberto: m.caixa_aberto === 1,
        sincronizado: m.sincronizado === 1
      }))
    } catch (error) {
      console.error('Erro ao listar movimentações:', error)
      throw error
    }
  }
}
