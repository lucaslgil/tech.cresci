import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug: Verificar se as variáveis estão sendo carregadas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERRO: Variáveis de ambiente não carregadas!')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Definida' : 'NÃO DEFINIDA')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Definida' : 'NÃO DEFINIDA')
}

// SEGURANÇA: Nunca fazer log das credenciais
// Use placeholder values if environment variables are not set
const url = supabaseUrl && supabaseUrl !== 'your_supabase_project_url_here' 
  ? supabaseUrl 
  : 'https://placeholder.supabase.co'

const key = supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key_here'
  ? supabaseAnonKey
  : 'placeholder-key'

// SEGURANÇA: Cliente criado sem logs
export const supabase = createClient(url, key, {
  auth: {
    debug: false, // Desabilitar logs de debug
    persistSession: true,
    autoRefreshToken: true
  },
  global: {
    headers: {
      'x-application-name': 'inventory-system'
    }
  },
  // IMPORTANTE: Desabilitar todos os logs em produção
  realtime: {
    logger: undefined
  }
})

// Flag to check if Supabase is properly configured
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url_here' && 
  supabaseAnonKey !== 'your_supabase_anon_key_here'
)

// Database types
export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string
          nome: string
          cnpj: string
          email: string
          telefone: string
          endereco: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          cnpj: string
          email: string
          telefone: string
          endereco: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cnpj?: string
          email?: string
          telefone?: string
          endereco?: string
          created_at?: string
          updated_at?: string
        }
      }
      colaboradores: {
        Row: {
          id: string
          nome: string
          email: string
          telefone: string
          cargo: string
          empresa_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          telefone: string
          cargo: string
          empresa_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          telefone?: string
          cargo?: string
          empresa_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      itens: {
        Row: {
          id: string
          nome: string
          descricao: string
          categoria: string
          quantidade: number
          preco: number
          codigo: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao: string
          categoria: string
          quantidade: number
          preco: number
          codigo: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string
          categoria?: string
          quantidade?: number
          preco?: number
          codigo?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}