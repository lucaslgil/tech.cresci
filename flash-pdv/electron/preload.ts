import { contextBridge, ipcRenderer } from 'electron'

// Log imediato
console.log('🔌 [PRELOAD] Script iniciado!')
console.log('🔌 [PRELOAD] contextBridge disponível?', typeof contextBridge)
console.log('🔌 [PRELOAD] ipcRenderer disponível?', typeof ipcRenderer)

// API exposta para o renderer (React)
const api = {
  // Queries no banco local
  db: {
    query: (sql: string, params?: any[]) => {
      console.log('📊 [API] db.query chamado:', sql)
      return ipcRenderer.invoke('db:query', sql, params)
    },
    execute: (sql: string, params?: any[]) => {
      console.log('📊 [API] db.execute chamado:', sql)
      return ipcRenderer.invoke('db:execute', sql, params)
    },
  },
  
  // Sincronização com retaguarda
  sync: {
    start: () => {
      console.log('🔄 [API] sync.start chamado')
      return ipcRenderer.invoke('sync:start')
    },
  },
  
  // Info do app
  app: {
    getVersion: () => {
      console.log('ℹ️ [API] app.getVersion chamado')
      return ipcRenderer.invoke('app:getVersion')
    },
  }
}

try {
  console.log('✅ [PRELOAD] Expondo electronAPI no window...')
  contextBridge.exposeInMainWorld('electronAPI', api)
  console.log('✅ [PRELOAD] electronAPI exposto com sucesso!')
  console.log('✅ [PRELOAD] API contém:', Object.keys(api))
} catch (error) {
  console.error('❌ [PRELOAD] Erro ao expor API:', error)
}

// Types para TypeScript
export type ElectronAPI = typeof api
