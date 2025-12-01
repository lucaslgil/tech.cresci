import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

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
      categorias_produtos: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          updated_at?: string
        }
      }
      unidades_medida: {
        Row: {
          id: string
          sigla: string
          descricao: string
          created_at: string
        }
        Insert: {
          id?: string
          sigla: string
          descricao: string
          created_at?: string
        }
        Update: {
          id?: string
          sigla?: string
          descricao?: string
        }
      }
      produtos: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          codigo_interno: string
          codigo_barras: string | null
          categoria_id: string | null
          unidade_medida: string
          ncm: string
          cest: string | null
          cfop_entrada: string | null
          cfop_saida: string | null
          origem_mercadoria: number
          cst_icms: string | null
          csosn_icms: string | null
          aliquota_icms: number
          reducao_base_icms: number
          cst_pis: string | null
          aliquota_pis: number
          cst_cofins: string | null
          aliquota_cofins: number
          cst_ipi: string | null
          aliquota_ipi: number
          codigo_enquadramento_ipi: string
          tem_substituicao_tributaria: boolean
          mva_st: number
          aliquota_icms_st: number
          reducao_base_icms_st: number
          aliquota_aproximada_tributos: number
          informacoes_adicionais_fiscais: string | null
          preco_custo: number
          preco_venda: number
          margem_lucro: number
          permite_desconto: boolean
          desconto_maximo: number
          estoque_atual: number
          estoque_minimo: number
          estoque_maximo: number
          localizacao: string | null
          controla_lote: boolean
          controla_serie: boolean
          controla_validade: boolean
          dias_validade: number | null
          status: string
          observacoes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          codigo_interno: string
          codigo_barras?: string | null
          categoria_id?: string | null
          unidade_medida?: string
          ncm: string
          cest?: string | null
          cfop_entrada?: string | null
          cfop_saida?: string | null
          origem_mercadoria?: number
          cst_icms?: string | null
          csosn_icms?: string | null
          aliquota_icms?: number
          reducao_base_icms?: number
          cst_pis?: string | null
          aliquota_pis?: number
          cst_cofins?: string | null
          aliquota_cofins?: number
          cst_ipi?: string | null
          aliquota_ipi?: number
          codigo_enquadramento_ipi?: string
          tem_substituicao_tributaria?: boolean
          mva_st?: number
          aliquota_icms_st?: number
          reducao_base_icms_st?: number
          aliquota_aproximada_tributos?: number
          informacoes_adicionais_fiscais?: string | null
          preco_custo?: number
          preco_venda?: number
          margem_lucro?: number
          permite_desconto?: boolean
          desconto_maximo?: number
          estoque_atual?: number
          estoque_minimo?: number
          estoque_maximo?: number
          localizacao?: string | null
          controla_lote?: boolean
          controla_serie?: boolean
          controla_validade?: boolean
          dias_validade?: number | null
          status?: string
          observacoes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          codigo_interno?: string
          codigo_barras?: string | null
          categoria_id?: string | null
          unidade_medida?: string
          ncm?: string
          cest?: string | null
          cfop_entrada?: string | null
          cfop_saida?: string | null
          origem_mercadoria?: number
          cst_icms?: string | null
          csosn_icms?: string | null
          aliquota_icms?: number
          reducao_base_icms?: number
          cst_pis?: string | null
          aliquota_pis?: number
          cst_cofins?: string | null
          aliquota_cofins?: number
          cst_ipi?: string | null
          aliquota_ipi?: number
          codigo_enquadramento_ipi?: string
          tem_substituicao_tributaria?: boolean
          mva_st?: number
          aliquota_icms_st?: number
          reducao_base_icms_st?: number
          aliquota_aproximada_tributos?: number
          informacoes_adicionais_fiscais?: string | null
          preco_custo?: number
          preco_venda?: number
          margem_lucro?: number
          permite_desconto?: boolean
          desconto_maximo?: number
          estoque_atual?: number
          estoque_minimo?: number
          estoque_maximo?: number
          localizacao?: string | null
          controla_lote?: boolean
          controla_serie?: boolean
          controla_validade?: boolean
          dias_validade?: number | null
          status?: string
          observacoes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
      }
    }
  }
}