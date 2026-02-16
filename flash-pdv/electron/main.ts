import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { SQLiteDatabase } from './database/sqlite'
import { SyncService } from './database/sync'

let mainWindow: BrowserWindow | null = null
let database: SQLiteDatabase | null = null

function createWindow() {
  const isDev = !app.isPackaged
  
  // Caminho absoluto do preload baseado no diretório do executável
  let preloadPath: string
  if (isDev) {
    // Em dev: out/main/index.js → out/preload/index.js (agora CommonJS)
    preloadPath = join(__dirname, '..', 'preload', 'index.js')
  } else {
    // Em prod: resources/app.asar/out/main → resources/app.asar/out/preload
    preloadPath = join(__dirname, '..', 'preload', 'index.js')
  }
  
  console.log('🔧 Modo:', isDev ? 'DESENVOLVIMENTO' : 'PRODUÇÃO')
  console.log('📂 __dirname:', __dirname)
  console.log('📂 Preload path:', preloadPath)
  console.log('📂 Preload existe?:', require('fs').existsSync(preloadPath))

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'FLASH PDV',
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: true,  // ⚠️ TEMPORÁRIO para teste!
      contextIsolation: false,  // ⚠️ TEMPORÁRIO para teste!
      sandbox: false,
      // Garantir que o preload seja carregado
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    show: false  // Não mostrar até estar pronto
  })

  // Mostrar janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    console.log('🪟 Janela pronta para exibir')
    mainWindow?.show()
  })

  // Desenvolvimento: carregar servidor Vite
  // Em dev, o electron-vite passa a URL como argumento ou podemos usar is.dev
  
  if (isDev) {
    // Tentar portas em sequência (electron-vite usa 5174 por padrão)
    const ports = [5174, 5175, 5176]
    
    const tryLoadUrl = async (index = 0) => {
      if (index >= ports.length) {
        console.error('❌ Nenhuma porta disponível!')
        return
      }
      
      const url = `http://localhost:${ports[index]}`
      console.log(`🔗 Tentando carregar: ${url}`)
      
      try {
        await mainWindow.loadURL(url)
        console.log(`✅ Carregado com sucesso na porta ${ports[index]}`)
      } catch (err) {
        console.log(`❌ Porta ${ports[index]} falhou, tentando próxima...`)
        await tryLoadUrl(index + 1)
      }
    }
    
    tryLoadUrl()
    mainWindow.webContents.openDevTools()
  } else {
    // Produção: carregar arquivo HTML
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Debug: verificar quando a página termina de carregar
  mainWindow.webContents.on('dom-ready', () => {
    console.log('📄 DOM pronto, injetando API diretamente...')
    
    // SOLUÇÃO TEMPORÁRIA: Injetar API manualmente
    // (Isso NÃO é seguro para produção, apenas para teste)
    mainWindow?.webContents.executeJavaScript(`
      console.warn('⚠️ USANDO API TEMP PARA TESTE - Preload não carregou');
      
      // Criar API temporária que usa IPC do renderer
      if (typeof window.electronAPI === 'undefined') {
        // Expor require temporariamente para acessar ipcRenderer
        const { ipcRenderer } = require('electron');
        
        window.electronAPI = {
          db: {
            query: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
            execute: (sql, params) => ipcRenderer.invoke('db:execute', sql, params)
          },
          sync: {
            start: () => ipcRenderer.invoke('sync:start')
          },
          app: {
            getVersion: () => ipcRenderer.invoke('app:getVersion')
          }
        };
        
        console.log('✅ API TEMP injetada manualmente!');
        
        // Disparar evento para o React saber que está pronto
        window.dispatchEvent(new Event('electronAPI-ready'));
      }
    `).catch(err => {
      console.error('❌ Erro ao injetar API:', err)
    })
  })
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Página carregada!')
    
    // Injetar electronAPI manualmente se o preload falhar
    mainWindow?.webContents.executeJavaScript(`
      console.log('🔍 Verificando electronAPI após carregamento...');
      console.log('electronAPI existe?', typeof window.electronAPI);
      
      if (typeof window.electronAPI === 'undefined') {
        console.warn('⚠️ electronAPI não foi carregado pelo preload, tentando fallback...');
      } else {
        console.log('✅ electronAPI carregado com sucesso!');
      }
    `)
  })
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Falha ao carregar página:', errorCode, errorDescription)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Inicializar banco de dados SQLite
async function initDatabase() {
  const userDataPath = app.getPath('userData')
  database = new SQLiteDatabase(join(userDataPath, 'flash-pdv.db'))
  await database.initialize()
  console.log('✅ Banco de dados local inicializado')
}

// IPC Handlers - Comunicação com o renderer
ipcMain.handle('db:query', async (_, sql: string, params?: any[]) => {
  if (!database) throw new Error('Database not initialized')
  return database.query(sql, params)
})

ipcMain.handle('db:execute', async (_, sql: string, params?: any[]) => {
  if (!database) throw new Error('Database not initialized')
  return database.execute(sql, params)
})

ipcMain.handle('sync:start', async () => {
  if (!database) throw new Error('Database not initialized')
  
  try {
    console.log('🔄 Iniciando sincronização...')
    
    // Buscar configuração salva
    const configResult = database.query(
      'SELECT value FROM config WHERE key = ?',
      ['pdv_config']
    )
    
    if (!configResult || configResult.length === 0) {
      throw new Error('Configuração do PDV não encontrada. Configure o PDV primeiro.')
    }
    
    const config = JSON.parse(configResult[0].value)
    console.log('✅ Configuração carregada:', {
      empresaId: config.empresaId,
      empresaNome: config.empresaNome,
      supabaseUrl: config.supabaseUrl ? 'OK' : 'MISSING'
    })
    
    // Criar serviço de sincronização
    const syncService = new SyncService(database, {
      supabaseUrl: config.supabaseUrl,
      supabaseKey: config.supabaseKey,
      empresaId: config.empresaId
    })
    
    let mensagens: string[] = []
    // Sincronizar formas de pagamento (primeiro, para o PDV usar como espelho)
    try {
      console.log('💳 Sincronizando formas de pagamento...')
      await syncService.syncFormasPagamento()
      mensagens.push('✅ Formas de pagamento sincronizadas')
    } catch (error: any) {
      console.error('❌ Erro ao sincronizar formas de pagamento:', error)
      const errorMsg = error?.message || error?.msg || JSON.stringify(error) || 'Erro desconhecido'
      mensagens.push(`⚠️ Formas: ${errorMsg}`)
    }

    // Sincronizar produtos
    try {
      console.log('📦 Sincronizando produtos...')
      await syncService.syncProdutos()
      mensagens.push('✅ Produtos sincronizados')
    } catch (error: any) {
      console.error('❌ Erro ao sincronizar produtos:', error)
      const errorMsg = error?.message || error?.msg || JSON.stringify(error) || 'Erro desconhecido'
      mensagens.push(`⚠️ Produtos: ${errorMsg}`)
    }

    // Sincronizar clientes
    try {
      console.log('👥 Sincronizando clientes...')
      await syncService.syncClientes()
      mensagens.push('✅ Clientes sincronizados')
    } catch (error: any) {
      console.error('❌ Erro ao sincronizar clientes:', error)
      const errorMsg = error?.message || error?.msg || JSON.stringify(error) || 'Erro desconhecido'
      mensagens.push(`⚠️ Clientes: ${errorMsg}`)
    }
    
    console.log('✅ Sincronização concluída!')
    
    return { 
      success: true, 
      message: mensagens.join('\n')
    }
  } catch (error: any) {
    console.error('❌ Erro na sincronização:', error)
    return { 
      success: false, 
      message: `❌ Erro: ${error.message}` 
    }
  }
})

ipcMain.handle('app:getVersion', () => {
  return app.getVersion()
})

// Ciclo de vida do app
app.whenReady().then(async () => {
  await initDatabase()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    database?.close()
    app.quit()
  }
})

app.on('before-quit', () => {
  database?.close()
})
