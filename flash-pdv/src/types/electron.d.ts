export interface ConfigPDV {
  supabaseUrl: string
  supabaseKey: string
  empresaId: number
  empresaNome: string
  usuarioId: string  // UUID do Supabase Auth
  usuarioEmail: string
  usuarioNome: string
  usuarioCargo: string
  permissaoMaster: boolean  // Se pode trocar a empresa vinculada
}

export interface ElectronAPI {
  db: {
    query: (sql: string, params?: any[]) => Promise<any[]>
    execute: (sql: string, params?: any[]) => Promise<any>
  }
  sync: {
    start: () => Promise<{ success: boolean; message: string }>
  }
  app: {
    getVersion: () => Promise<string>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
