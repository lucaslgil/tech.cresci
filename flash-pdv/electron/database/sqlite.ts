import initSqlJs, { Database } from 'sql.js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export class SQLiteDatabase {
  private db: Database | null = null
  private dbPath: string
  private SQL: any = null

  constructor(dbPath: string) {
    this.dbPath = dbPath
  }

  async initialize() {
    // Inicializar sql.js com o arquivo wasm local
    const wasmBinary = readFileSync(
      join(__dirname, '../../node_modules/sql.js/dist/sql-wasm.wasm')
    )
    
    this.SQL = await initSqlJs({
      wasmBinary
    })
    
    // Carregar banco existente ou criar novo
    if (existsSync(this.dbPath)) {
      const buffer = readFileSync(this.dbPath)
      this.db = new this.SQL.Database(buffer)
      console.log('✅ Banco de dados carregado:', this.dbPath)
    } else {
      this.db = new this.SQL.Database()
      console.log('✅ Novo banco de dados criado')
    }
    
    // Habilitar foreign keys
    this.db.run('PRAGMA foreign_keys = ON')
    
    await this.createTables()
    await this.runMigrations()
    
    // Salvar após criar tabelas
    this.save()
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized')

    // Metadados de sincronização
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        last_sync_at TEXT,
        last_sync_id TEXT,
        empresa_id BIGINT NOT NULL,
        UNIQUE(table_name, empresa_id)
      );
    `)

    // Configuração local
    this.db.run(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Empresas (cache da retaguarda)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS empresas (
        id INTEGER PRIMARY KEY,
        codigo TEXT,
        razao_social TEXT NOT NULL,
        nome_fantasia TEXT,
        cnpj TEXT,
        ie TEXT,
        regime_tributario TEXT,
        uf TEXT,
        synced BOOLEAN DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Produtos (cache da retaguarda)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS produtos (
        id TEXT PRIMARY KEY,
        empresa_id INTEGER NOT NULL,
        codigo_interno TEXT NOT NULL,
        nome TEXT NOT NULL,
        codigo_barras TEXT,
        unidade_medida TEXT,
        preco_venda REAL,
        estoque_atual REAL DEFAULT 0,
        ncm TEXT,
        cfop_saida TEXT,
        cest TEXT,
        origem_mercadoria TEXT,
        synced BOOLEAN DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        ativo BOOLEAN DEFAULT 1,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
      );
      CREATE INDEX IF NOT EXISTS idx_produtos_empresa ON produtos(empresa_id);
      CREATE INDEX IF NOT EXISTS idx_produtos_codigo_interno ON produtos(codigo_interno);
      CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON produtos(codigo_barras);
    `)

    // Clientes (cache da retaguarda)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY,
        empresa_id INTEGER NOT NULL,
        codigo TEXT,
        nome_completo TEXT,
        razao_social TEXT,
        cpf TEXT,
        cnpj TEXT,
        tipo_pessoa TEXT,
        email TEXT,
        telefone TEXT,
        cep TEXT,
        logradouro TEXT,
        numero TEXT,
        bairro TEXT,
        cidade TEXT,
        uf TEXT,
        synced BOOLEAN DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
      );
      CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);
      CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);
      CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes(cnpj);
    `)

    // Vendas (local, sincroniza para retaguarda)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empresa_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        usuario_nome TEXT NOT NULL,
        numero INTEGER,
        cliente_id INTEGER,
        cliente_nome TEXT,
        cliente_cpf TEXT,
        data_venda TEXT NOT NULL,
        tipo_venda TEXT NOT NULL DEFAULT 'VENDA',
        status TEXT NOT NULL DEFAULT 'PEDIDO_ABERTO',
        subtotal REAL NOT NULL DEFAULT 0,
        desconto REAL NOT NULL DEFAULT 0,
        acrescimo REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        observacoes TEXT,
        retaguarda_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
      );
      CREATE INDEX IF NOT EXISTS idx_vendas_empresa ON vendas(empresa_id);
      CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(data_venda);
    `)

    // Itens da Venda
    this.db.run(`
      CREATE TABLE IF NOT EXISTS vendas_itens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venda_local_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        produto_codigo TEXT NOT NULL,
        produto_descricao TEXT NOT NULL,
        quantidade REAL NOT NULL,
        preco_unitario REAL NOT NULL,
        desconto REAL DEFAULT 0,
        acrescimo REAL DEFAULT 0,
        valor_total REAL NOT NULL,
        numero_item INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (venda_local_id) REFERENCES vendas(id) ON DELETE CASCADE,
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
      );
      CREATE INDEX IF NOT EXISTS idx_vendas_itens_venda ON vendas_itens(venda_local_id);
    `)

    // Pagamentos da Venda
    this.db.run(`
      CREATE TABLE IF NOT EXISTS vendas_pagamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venda_local_id INTEGER NOT NULL,
        forma_pagamento TEXT NOT NULL,
        valor REAL NOT NULL,
        numero_parcela INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (venda_local_id) REFERENCES vendas(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_vendas_pagamentos_venda ON vendas_pagamentos(venda_local_id);
    `)

    // Formas de Pagamento (cache da retaguarda)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS formas_pagamento (
        id INTEGER PRIMARY KEY,
        empresa_id INTEGER NOT NULL,
        codigo TEXT,
        nome TEXT NOT NULL,
        ativo BOOLEAN DEFAULT 1,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(id, empresa_id)
      );
      CREATE INDEX IF NOT EXISTS idx_formas_empresa ON formas_pagamento(empresa_id);
    `)

    // Movimentações de Caixa (local, sincroniza para retaguarda)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS movimentacoes_caixa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        empresa_id INTEGER NOT NULL,
        tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA', 'ABERTURA', 'FECHAMENTO')),
        valor REAL NOT NULL,
        data_movimentacao TEXT NOT NULL,
        descricao TEXT NOT NULL,
        categoria TEXT,
        venda_local_id INTEGER,
        origem TEXT DEFAULT 'PDV',
        caixa_aberto INTEGER DEFAULT 1,
        caixa_numero INTEGER,
        usuario_id INTEGER NOT NULL,
        usuario_nome TEXT NOT NULL,
        sincronizado BOOLEAN DEFAULT 0,
        retaguarda_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id),
        FOREIGN KEY (venda_local_id) REFERENCES vendas(id)
      );
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_empresa ON movimentacoes_caixa(empresa_id);
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON movimentacoes_caixa(tipo);
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_data ON movimentacoes_caixa(data_movimentacao);
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_sincronizado ON movimentacoes_caixa(sincronizado);
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_uuid ON movimentacoes_caixa(uuid);
    `)

    console.log('✅ Tabelas SQLite criadas')
  }

  private async runMigrations() {
    if (!this.db) throw new Error('Database not initialized')

    // Migração 1: Adicionar coluna 'ativo' na tabela produtos se não existir
    try {
      // Verificar se a coluna existe
      const result = this.db.exec(`PRAGMA table_info(produtos)`)
      const columns = result[0]?.values || []
      const hasAtivoColumn = columns.some((col: any) => col[1] === 'ativo')
      
      if (!hasAtivoColumn) {
        console.log('🔄 Adicionando coluna "ativo" na tabela produtos...')
        this.db.run(`ALTER TABLE produtos ADD COLUMN ativo BOOLEAN DEFAULT 1`)
        console.log('✅ Coluna "ativo" adicionada')
      }
    } catch (error) {
      console.warn('⚠️ Erro ao adicionar coluna ativo:', error)
    }

    // Migração 2: Criar índice ativo na tabela produtos se não existir
    try {
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo)`)
    } catch (error) {
      console.warn('⚠️ Erro ao criar índice idx_produtos_ativo:', error)
    }

    // Migração 3: Adicionar coluna 'uuid' na tabela vendas se não existir
    try {
      const result = this.db.exec(`PRAGMA table_info(vendas)`)
      const columns = result[0]?.values || []
      const hasUuidColumn = columns.some((col: any) => col[1] === 'uuid')
      
      if (!hasUuidColumn) {
        console.log('🔄 Adicionando coluna "uuid" na tabela vendas...')
        // Gerar UUIDs para vendas existentes
        this.db.run(`ALTER TABLE vendas ADD COLUMN uuid TEXT`)
        this.db.run(`UPDATE vendas SET uuid = lower(hex(randomblob(16))) WHERE uuid IS NULL`)
        console.log('✅ Coluna "uuid" adicionada')
      }
    } catch (error) {
      console.warn('⚠️ Erro ao adicionar coluna uuid:', error)
    }

    // Migração 4: Criar índice uuid na tabela vendas
    try {
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_vendas_uuid ON vendas(uuid)`)
    } catch (error) {
      console.warn('⚠️ Erro ao criar índice idx_vendas_uuid:', error)
    }

    // Migração 5: Adicionar coluna 'sincronizado' na tabela vendas se não existir
    try {
      const result = this.db.exec(`PRAGMA table_info(vendas)`)
      const columns = result[0]?.values || []
      const hasSincronizadoColumn = columns.some((col: any) => col[1] === 'sincronizado')
      
      if (!hasSincronizadoColumn) {
        console.log('🔄 Adicionando coluna "sincronizado" na tabela vendas...')
        this.db.run(`ALTER TABLE vendas ADD COLUMN sincronizado BOOLEAN DEFAULT 0`)
        console.log('✅ Coluna "sincronizado" adicionada')
      }
    } catch (error) {
      console.warn('⚠️ Erro ao adicionar coluna sincronizado:', error)
    }

    // Migração 6: Criar índice sincronizado na tabela vendas
    try {
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_vendas_sincronizado ON vendas(sincronizado)`)
    } catch (error) {
      console.warn('⚠️ Erro ao criar índice idx_vendas_sincronizado:', error)
    }

    // Migração 7: Adicionar coluna 'ativo' na tabela clientes se não existir
    try {
      const result = this.db.exec(`PRAGMA table_info(clientes)`)
      const columns = result[0]?.values || []
      const hasAtivoColumn = columns.some((col: any) => col[1] === 'ativo')
      
      if (!hasAtivoColumn) {
        console.log('🔄 Adicionando coluna "ativo" na tabela clientes...')
        this.db.run(`ALTER TABLE clientes ADD COLUMN ativo BOOLEAN DEFAULT 1`)
        console.log('✅ Coluna "ativo" adicionada na tabela clientes')
      }
    } catch (error) {
      console.warn('⚠️ Erro ao adicionar coluna ativo em clientes:', error)
    }

    // Migração 8: Criar índice ativo na tabela clientes se não existir
    try {
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo)`)
    } catch (error) {
      console.warn('⚠️ Erro ao criar índice idx_clientes_ativo:', error)
    }

    // Migração 9: Atualizar campos da tabela produtos (codigo → codigo_interno, descricao → nome)
    try {
      const result = this.db.exec(`PRAGMA table_info(produtos)`)
      const columns = result[0]?.values || []
      const hasCodigoInterno = columns.some((col: any) => col[1] === 'codigo_interno')
      const hasCodigo = columns.some((col: any) => col[1] === 'codigo')
      
      if (!hasCodigoInterno && hasCodigo) {
        console.log('🔄 Migrando estrutura da tabela produtos...')
        
        // Criar tabela temporária com nova estrutura
        this.db.run(`
          CREATE TABLE produtos_new (
            id TEXT PRIMARY KEY,
            empresa_id INTEGER NOT NULL,
            codigo_interno TEXT NOT NULL,
            nome TEXT NOT NULL,
            codigo_barras TEXT,
            unidade_medida TEXT,
            preco_venda REAL,
            estoque_atual REAL DEFAULT 0,
            ncm TEXT,
            cfop_saida TEXT,
            cest TEXT,
            origem_mercadoria TEXT,
            synced BOOLEAN DEFAULT 0,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            ativo BOOLEAN DEFAULT 1
          )
        `)
        
        // Copiar dados da tabela antiga para nova
        this.db.run(`
          INSERT INTO produtos_new 
          SELECT id, empresa_id, codigo as codigo_interno, descricao as nome, 
                 ean13 as codigo_barras, unidade as unidade_medida, preco_venda, 
                 estoque_atual, ncm, cfop as cfop_saida, cest, origem_mercadoria, 
                 synced, updated_at, ativo
          FROM produtos
        `)
        
        // Remover tabela antiga e renomear nova
        this.db.run(`DROP TABLE produtos`)
        this.db.run(`ALTER TABLE produtos_new RENAME TO produtos`)
        
        // Recriar índices
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo)`)
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_produtos_empresa ON produtos(empresa_id)`)
        
        console.log('✅ Estrutura da tabela produtos atualizada')
      }
    } catch (error) {
      console.warn('⚠️ Erro ao migrar tabela produtos:', error)
    }

    console.log('✅ Migrações executadas')
  }

  query(sql: string, params?: any[]): any[] {
    if (!this.db) throw new Error('Database not initialized')
    
    const stmt = this.db.prepare(sql)
    if (params) stmt.bind(params)
    
    const results: any[] = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()
    
    return results
  }

  execute(sql: string, params?: any[]) {
    if (!this.db) throw new Error('Database not initialized')
    
    if (params) {
      const stmt = this.db.prepare(sql)
      stmt.bind(params)
      stmt.step()
      stmt.free()
    } else {
      this.db.run(sql)
    }
    
    this.save()
    
    return { changes: this.db.getRowsModified() }
  }

  save() {
    if (!this.db) return
    
    const data = this.db.export()
    const buffer = Buffer.from(data)
    writeFileSync(this.dbPath, buffer)
  }

  close() {
    if (this.db) {
      this.save()
      this.db.close()
      this.db = null
    }
  }
  
  // Método auxiliar para obter referência do DB (usado no SyncService)
  getDb() {
    return this.db
  }
}
