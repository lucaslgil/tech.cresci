import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SQLiteDatabase } from './sqlite'

export interface SyncConfig {
  supabaseUrl: string
  supabaseKey: string
  empresaId: number
}

export class SyncService {
  private supabase: SupabaseClient | null = null
  private localDb: SQLiteDatabase
  private empresaId: number

  constructor(localDb: SQLiteDatabase, config: SyncConfig) {
    this.localDb = localDb
    this.empresaId = config.empresaId
    
    // SEGURANÇA: Validar chave antes de criar cliente
    if (config.supabaseKey && config.supabaseKey.includes('service_role')) {
      throw new Error('ERRO DE SEGURANÇA: Service Role Key detectada. Use apenas Anon Public Key no PDV!')
    }
    
    if (config.supabaseUrl && config.supabaseKey) {
      this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
    }
  }

  // ==========================================
  // DOWNLOAD: Retaguarda → PDV Local
  // ==========================================

  async syncProdutos() {
    if (!this.supabase) throw new Error('Supabase not configured')

    console.log('📥 Sincronizando produtos...')
    console.log('   Empresa ID:', this.empresaId)
    console.log('   Supabase:', this.supabase ? 'Configurado' : 'Não configurado')

    // Buscar última sincronização
    const lastSync = this.localDb.query(
      'SELECT last_sync_at FROM sync_metadata WHERE table_name = ? AND empresa_id = ?',
      ['produtos', this.empresaId]
    )[0] as any

    console.log('   Última sincronização:', lastSync?.last_sync_at || 'Primeira vez')

    // Buscar produtos atualizados desde última sync
    console.log('   Preparando query no Supabase...')
    console.log('   Filtros: empresa_id =', this.empresaId, ', ativo = true')
    
    const query = this.supabase
      .from('produtos')
      .select('*')
      .eq('empresa_id', this.empresaId)
      .eq('ativo', true)

    if (lastSync?.last_sync_at) {
      query.gt('updated_at', lastSync.last_sync_at)
      console.log('   Buscando produtos atualizados após:', lastSync.last_sync_at)
    } else {
      console.log('   Buscando TODOS os produtos (primeira sincronização)')
    }

    console.log('   Executando query no Supabase...')
    const { data: produtos, error } = await query

    if (error) {
      console.error('❌ Erro ao buscar produtos no Supabase:', error)
      console.error('   Tipo do erro:', typeof error)
      console.error('   Erro.message:', error?.message)
      console.error('   Erro completo:', JSON.stringify(error, null, 2))
      throw new Error(`Erro ao buscar produtos: ${error.message || error.hint || 'Erro desconhecido'}`)
    }

    console.log('   Resposta do Supabase recebida!')
    console.log(`   Produtos encontrados no Supabase: ${produtos?.length || 0}`)

    if (!produtos || produtos.length === 0) {
      console.log('⚠️ Nenhum produto encontrado no Supabase para esta empresa')
      console.log('   Verifique se:')
      console.log('   1. Os produtos têm empresa_id =', this.empresaId)
      console.log('   2. Os produtos têm ativo = true')
      console.log('   3. As políticas RLS estão configuradas corretamente')
      
      // Verificar quantos produtos existem no banco local
      const count = this.localDb.query(
        'SELECT COUNT(*) as total FROM produtos WHERE empresa_id = ?',
        [this.empresaId]
      )[0] as any
      
      if (count.total === 0) {
        throw new Error(`Nenhum produto encontrado no Supabase para empresa ${this.empresaId}. Verifique RLS e empresa_id.`)
      } else {
        console.log(`   Banco local já tem ${count.total} produtos. Nada a sincronizar.`)
        return
      }
    }

    console.log('📝 Detalhes dos primeiros 3 produtos:')
    produtos.slice(0, 3).forEach((p, i) => {
      console.log(`   ${i + 1}. ID: ${p.id}, Código: ${p.codigo_interno}, Nome: ${p.nome}, Ativo: ${p.ativo}`)
    })

    // Inserir/atualizar no SQLite
    let inserted = 0
    let updated = 0
    
    for (const prod of produtos) {
      const ativoValue = prod.ativo !== undefined ? (prod.ativo ? 1 : 0) : 1
      
      try {
        const result = this.localDb.execute(
          `INSERT INTO produtos (id, empresa_id, codigo_interno, nome, codigo_barras, unidade_medida, preco_venda, 
            estoque_atual, ncm, cfop_saida, cest, origem_mercadoria, ativo, synced, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
          ON CONFLICT(id) DO UPDATE SET
            codigo_interno = excluded.codigo_interno,
            nome = excluded.nome,
            codigo_barras = excluded.codigo_barras,
            unidade_medida = excluded.unidade_medida,
            preco_venda = excluded.preco_venda,
            estoque_atual = excluded.estoque_atual,
            ncm = excluded.ncm,
            cfop_saida = excluded.cfop_saida,
            cest = excluded.cest,
            origem_mercadoria = excluded.origem_mercadoria,
            ativo = excluded.ativo,
            synced = 1,
            updated_at = excluded.updated_at`,
          [
            prod.id,
            prod.empresa_id,
            prod.codigo_interno,
            prod.nome,
            prod.codigo_barras,
            prod.unidade_medida,
            prod.preco_venda,
            prod.estoque_atual,
            prod.ncm,
            prod.cfop_saida,
            prod.cest,
            prod.origem_mercadoria,
            ativoValue,
            prod.updated_at
          ]
        )
        
        if (result.changes > 0) inserted++
        else updated++
      } catch (error) {
        console.error(`❌ Erro ao inserir produto ${prod.codigo}:`, error)
        throw error
      }
    }

    console.log(`   Inseridos: ${inserted}, Atualizados: ${updated}`)

    // Verificar quantos produtos existem agora no banco local
    const count = this.localDb.query(
      'SELECT COUNT(*) as total FROM produtos WHERE empresa_id = ?',
      [this.empresaId]
    )[0] as any

    console.log(`   Total de produtos no banco local agora: ${count.total}`)

    // Atualizar metadata de sync
    this.localDb.execute(
      `INSERT INTO sync_metadata (table_name, last_sync_at, empresa_id)
       VALUES (?, datetime('now'), ?)
       ON CONFLICT(table_name, empresa_id) DO UPDATE SET last_sync_at = datetime('now')`,
      ['produtos', this.empresaId]
    )

    console.log(`✅ ${produtos.length} produtos sincronizados com sucesso!`)
  }

  async syncClientes() {
    if (!this.supabase) throw new Error('Supabase not configured')

    console.log('📥 Sincronizando clientes...')
    console.log('   Empresa ID:', this.empresaId)

    const lastSync = this.localDb.query(
      'SELECT last_sync_at FROM sync_metadata WHERE table_name = ? AND empresa_id = ?',
      ['clientes', this.empresaId]
    )[0] as any

    console.log('   Última sincronização:', lastSync?.last_sync_at || 'Primeira vez')

    const query = this.supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', this.empresaId)
      // Removido filtro .eq('ativo', true) temporariamente para evitar erro

    if (lastSync?.last_sync_at) {
      query.gt('updated_at', lastSync.last_sync_at)
      console.log('   Buscando clientes atualizados após:', lastSync.last_sync_at)
    } else {
      console.log('   Buscando TODOS os clientes (primeira sincronização)')
    }

    const { data: clientes, error } = await query

    if (error) {
      console.error('❌ Erro ao buscar clientes no Supabase:', error)
      console.error('   Tipo do erro:', typeof error)
      console.error('   Erro.message:', error?.message)
      console.error('   Erro completo:', JSON.stringify(error, null, 2))
      throw new Error(`Erro ao buscar clientes: ${error.message || error.hint || 'Erro desconhecido'}`)
    }

    console.log(`   Clientes encontrados: ${clientes?.length || 0}`)

    if (!clientes || clientes.length === 0) {
      console.log('⚠️ Nenhum cliente encontrado no Supabase para esta empresa')
      
      // Verificar quantos clientes existem no banco local
      const count = this.localDb.query(
        'SELECT COUNT(*) as total FROM clientes WHERE empresa_id = ?',
        [this.empresaId]
      )[0] as any
      
      if (count.total === 0) {
        console.log('   Nenhum cliente encontrado localmente também. Isso é normal se não houver clientes cadastrados.')
        return
      } else {
        console.log(`   Banco local já tem ${count.total} clientes. Nada a sincronizar.`)
        return
      }
    }

    // Inserir/atualizar no SQLite
    for (const cli of clientes) {
      // Garantir que ativo seja 1 se não existir no registro
      const ativoValue = cli.ativo !== undefined ? (cli.ativo ? 1 : 0) : 1
      
      this.localDb.execute(
        `INSERT INTO clientes (id, empresa_id, codigo, nome_completo, razao_social, 
          cpf, cnpj, tipo_pessoa, email, telefone, cep, logradouro, numero, 
          bairro, cidade, uf, ativo, synced, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        ON CONFLICT(id) DO UPDATE SET
          codigo = excluded.codigo,
          nome_completo = excluded.nome_completo,
          razao_social = excluded.razao_social,
          cpf = excluded.cpf,
          cnpj = excluded.cnpj,
          tipo_pessoa = excluded.tipo_pessoa,
          email = excluded.email,
          telefone = excluded.telefone,
          cep = excluded.cep,
          logradouro = excluded.logradouro,
          numero = excluded.numero,
          bairro = excluded.bairro,
          cidade = excluded.cidade,
          uf = excluded.uf,
          ativo = excluded.ativo,
          synced = 1,
          updated_at = excluded.updated_at`,
        [
          cli.id,
          cli.empresa_id,
          cli.codigo,
          cli.nome_completo,
          cli.razao_social,
          cli.cpf,
          cli.cnpj,
          cli.tipo_pessoa,
          cli.email,
          cli.telefone,
          cli.cep,
          cli.logradouro,
          cli.numero,
          cli.bairro,
          cli.cidade,
          cli.uf,
          ativoValue,
          cli.updated_at
        ]
      )
    }

    // Atualizar metadata de sync
    this.localDb.execute(
      `INSERT INTO sync_metadata (table_name, last_sync_at, empresa_id)
       VALUES (?, datetime('now'), ?)
       ON CONFLICT(table_name, empresa_id) DO UPDATE SET last_sync_at = datetime('now')`,
      ['clientes', this.empresaId]
    )

    console.log(`✅ ${clientes.length} clientes sincronizados`)
  }

  // ==========================================
  // DOWNLOAD: Formas de Pagamento (Retaguarda → PDV Local)
  // ==========================================

  async syncFormasPagamento() {
    if (!this.supabase) throw new Error('Supabase not configured')

    console.log('📥 Sincronizando formas de pagamento...')
    const triedTables: string[] = []
    const candidateTables = [
      'formas_pagamento',
      'formas_pagamentos',
      'formas_de_pagamento',
      'financeiro_formas_pagamento',
      'parametros_formas_pagamento',
      'payment_methods'
    ]

    // Buscar última sincronização metadata (usaremos o nome 'formas_pagamento' local)
    const lastSync = this.localDb.query(
      'SELECT last_sync_at FROM sync_metadata WHERE table_name = ? AND empresa_id = ?',
      ['formas_pagamento', this.empresaId]
    )[0] as any

    let formas: any[] | null = null
    let sourceTable: string | null = null

    for (const tbl of candidateTables) {
      triedTables.push(tbl)

      try {
        const q = this.supabase.from(tbl).select('*').eq('empresa_id', this.empresaId)
        if (lastSync?.last_sync_at) q.gt('updated_at', lastSync.last_sync_at)

        console.log(`   Tentando buscar formas na tabela '${tbl}'...`)
        const { data, error } = await q

        if (error) {
          console.log(`   Tabela '${tbl}' retornou erro:`, error.message || error)
          continue
        }

        if (data && Array.isArray(data) && data.length > 0) {
          formas = data
          sourceTable = tbl
          console.log(`   Encontradas ${data.length} formas na tabela '${tbl}'`)
          break
        }

        // Se data vazia mas sem erro, ainda aceite como fonte (pode ser nova empresa)
        if (data && Array.isArray(data)) {
          formas = data
          sourceTable = tbl
          console.log(`   Tabela '${tbl}' existe, retornou 0 registros`)
          break
        }
      } catch (err) {
        console.log(`   Erro ao consultar '${tbl}':`, err)
      }
    }

    if (!formas || !sourceTable) {
      const attempted = triedTables.join(', ')
      console.error(`❌ Não foi possível encontrar tabela de formas no Supabase. Tentadas: ${attempted}`)
      throw new Error(`Could not find the table with payment methods in the schema cache. Tried: ${attempted}`)
    }

    // Inserir/atualizar no SQLite
    let inserted = 0
    let updated = 0

    for (const f of formas) {
      try {
        const result = this.localDb.execute(
          `INSERT INTO formas_pagamento (id, empresa_id, codigo, nome, ativo, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(id, empresa_id) DO UPDATE SET
             codigo = excluded.codigo,
             nome = excluded.nome,
             ativo = excluded.ativo,
             updated_at = excluded.updated_at`,
          [f.id, f.empresa_id, f.codigo || null, f.nome || f.description || f.tipo || f.tipo_nome || '', f.ativo ? 1 : 0, f.updated_at || null]
        )

        if (result.changes > 0) inserted++
        else updated++
      } catch (error) {
        console.error('❌ Erro ao inserir/atualizar forma:', error)
      }
    }

    console.log(`   Inseridos: ${inserted}, Atualizados: ${updated}`)

    this.localDb.execute(
      `INSERT INTO sync_metadata (table_name, last_sync_at, empresa_id)
       VALUES (?, datetime('now'), ?)
       ON CONFLICT(table_name, empresa_id) DO UPDATE SET last_sync_at = datetime('now')`,
      ['formas_pagamento', this.empresaId]
    )

    console.log(`✅ ${formas.length} formas de pagamento sincronizadas (fonte: ${sourceTable})`)
  }

  // ==========================================
  // UPLOAD: PDV Local → Retaguarda
  // ==========================================

  async syncVendas() {
    if (!this.supabase) throw new Error('Supabase not configured')

    console.log('📤 Sincronizando vendas para retaguarda...')

    // Buscar vendas não sincronizadas com status PEDIDO_FECHADO ou FATURADO
    const vendas = this.localDb.query(
      `SELECT * FROM vendas 
       WHERE sincronizado = 0 
         AND empresa_id = ? 
         AND status IN ('PEDIDO_FECHADO', 'FATURADO')`,
      [this.empresaId]
    ) as any[]

    if (vendas.length === 0) {
      console.log('✅ Nenhuma venda pendente de sincronização')
      return
    }

    let sincronizadas = 0
    let erros = 0

    for (const venda of vendas) {
      try {
        // Buscar itens da venda
        const itens = this.localDb.query(
          'SELECT * FROM vendas_itens WHERE venda_local_id = ?',
          [venda.id]
        ) as any[]

        // Buscar pagamentos da venda
        const pagamentos = this.localDb.query(
          'SELECT * FROM vendas_pagamentos WHERE venda_local_id = ?',
          [venda.id]
        ) as any[]

        // Inserir venda na retaguarda
        const { data: vendaRetaguarda, error: vendaError } = await this.supabase
          .from('vendas')
          .insert({
            empresa_id: venda.empresa_id,
            tipo_venda: venda.tipo_venda,
            status: venda.status,
            cliente_id: venda.cliente_id,
            data_venda: venda.data_venda,
            subtotal: venda.subtotal,
            desconto: venda.desconto,
            acrescimo: venda.acrescimo,
            total: venda.total,
            vendedor: venda.usuario_nome,
            observacoes: venda.observacoes,
            origem: 'PDV',
            pdv_uuid: venda.uuid
          })
          .select()
          .single()

        if (vendaError) throw vendaError

        // Inserir itens na retaguarda
        if (itens.length > 0) {
          const { error: itensError } = await this.supabase
            .from('vendas_itens')
            .insert(
              itens.map((item: any) => ({
                venda_id: vendaRetaguarda.id,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario,
                desconto: item.desconto,
                acrescimo: item.acrescimo,
                valor_total: item.valor_total,
                numero_item: item.numero_item
              }))
            )

          if (itensError) throw itensError
        }

        // Inserir pagamentos na retaguarda (se houver)
        if (pagamentos.length > 0) {
          const { error: pagError } = await this.supabase
            .from('vendas_pagamentos')
            .insert(
              pagamentos.map((pag: any) => ({
                venda_id: vendaRetaguarda.id,
                forma_pagamento: pag.forma_pagamento,
                valor: pag.valor,
                parcela: pag.numero_parcela
              }))
            )

          if (pagError) throw pagError
        }

        // Marcar como sincronizado no PDV
        this.localDb.execute(
          `UPDATE vendas 
           SET sincronizado = 1, retaguarda_id = ?, updated_at = datetime('now')
           WHERE id = ?`,
          [vendaRetaguarda.id, venda.id]
        )

        sincronizadas++
        console.log(`✅ Venda UUID ${venda.uuid} sincronizada (ID retaguarda: ${vendaRetaguarda.id})`)
      } catch (error: any) {
        erros++
        console.error(`❌ Erro ao sincronizar venda UUID ${venda.uuid}:`, error.message)
      }
    }

    console.log(`📊 Sincronização de vendas concluída: ${sincronizadas} ok, ${erros} erros`)
  }

  // ==========================================
  // UPLOAD: PDV Local → Retaguarda (MOVIMENTAÇÕES DE CAIXA)
  // ==========================================

  async syncMovimentacoesCaixa() {
    if (!this.supabase) throw new Error('Supabase not configured')

    console.log('💰 Sincronizando movimentações de caixa para retaguarda...')

    // Buscar movimentações não sincronizadas
    const movimentacoes = this.localDb.query(
      `SELECT * FROM movimentacoes_caixa 
       WHERE sincronizado = 0 
         AND empresa_id = ?
       ORDER BY created_at ASC`,
      [this.empresaId]
    ) as any[]

    if (movimentacoes.length === 0) {
      console.log('✅ Nenhuma movimentação de caixa pendente')
      return
    }

    let sincronizadas = 0
    let erros = 0

    for (const mov of movimentacoes) {
      try {
        // Inserir movimentação na retaguarda
        const { data: movRetaguarda, error: movError } = await this.supabase
          .from('movimentacoes_caixa')
          .insert({
            empresa_id: mov.empresa_id,
            tipo: mov.tipo,
            valor: mov.valor,
            data_movimentacao: mov.data_movimentacao,
            descricao: mov.descricao,
            categoria: mov.categoria,
            venda_id: mov.venda_local_id || null,
            origem: mov.origem || 'PDV',
            pdv_uuid: mov.uuid,
            caixa_aberto: mov.caixa_aberto === 1,
            caixa_numero: mov.caixa_numero,
            usuario_id: mov.usuario_id,
            usuario_nome: mov.usuario_nome
          })
          .select()
          .single()

        if (movError) throw movError

        // Marcar como sincronizado no PDV
        this.localDb.execute(
          `UPDATE movimentacoes_caixa 
           SET sincronizado = 1, retaguarda_id = ?, updated_at = datetime('now')
           WHERE id = ?`,
          [movRetaguarda.id, mov.id]
        )

        sincronizadas++
        console.log(`✅ Movimentação ${mov.tipo} UUID ${mov.uuid} sincronizada (ID retaguarda: ${movRetaguarda.id})`)
      } catch (error: any) {
        erros++
        console.error(`❌ Erro ao sincronizar movimentação UUID ${mov.uuid}:`, error.message)
      }
    }

    console.log(`📊 Sincronização de caixa concluída: ${sincronizadas} ok, ${erros} erros`)
  }

  // ==========================================
  // SINCRONIZAÇÃO COMPLETA
  // ==========================================

  async syncAll() {
    try {
      // Sincronizar configurações/formas antes dos produtos (para o PDV usar como espelho)
      await this.syncFormasPagamento()
      await this.syncProdutos()
      await this.syncClientes()
      await this.syncVendas()
      await this.syncMovimentacoesCaixa()
      
      return { success: true, message: 'Sincronização concluída' }
    } catch (error: any) {
      console.error('❌ Erro na sincronização:', error)
      return { success: false, message: error.message }
    }
  }
}
