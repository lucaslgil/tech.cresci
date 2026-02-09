# 🛡️ SOLUÇÕES DE SEGURANÇA - IMPLEMENTAÇÃO

Este documento contém código pronto para implementar as correções de segurança identificadas.

---

## 1. 🔐 MOVER NUVEM FISCAL PARA EDGE FUNCTION

### Criar Edge Function no Supabase

```bash
# Criar estrutura
mkdir -p supabase/functions/nuvem-fiscal
```

### `supabase/functions/nuvem-fiscal/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NUVEM_FISCAL_CONFIG = {
  clientId: Deno.env.get('NUVEM_FISCAL_CLIENT_ID')!,
  clientSecret: Deno.env.get('NUVEM_FISCAL_CLIENT_SECRET')!, // ✅ SEGURO: Server-side
  ambiente: Deno.env.get('NUVEM_FISCAL_AMBIENTE') || 'SANDBOX',
  baseUrl: Deno.env.get('NUVEM_FISCAL_AMBIENTE') === 'PRODUCAO'
    ? 'https://api.nuvemfiscal.com.br'
    : 'https://api.sandbox.nuvemfiscal.com.br'
}

interface NFeDados {
  emitente: any
  destinatario: any
  itens: any[]
  pagamento: any
  // ... outros campos
}

// Cache de token OAuth
let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  // Se token existe e ainda é válido, retornar do cache
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  // Obter novo token
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: NUVEM_FISCAL_CONFIG.clientId,
    client_secret: NUVEM_FISCAL_CONFIG.clientSecret,
  })

  const response = await fetch('https://auth.nuvemfiscal.com.br/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })

  if (!response.ok) {
    throw new Error('Falha ao obter token de acesso')
  }

  const data = await response.json()
  
  // Cachear token (expiração - 5 minutos de buffer)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000)
  }

  return cachedToken.token
}

async function emitirNFe(dados: NFeDados): Promise<any> {
  const token = await getAccessToken()

  const response = await fetch(`${NUVEM_FISCAL_CONFIG.baseUrl}/nfe`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(JSON.stringify(error))
  }

  return await response.json()
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Unauthorized')
    }

    // Verificar sessão do Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Verificar empresa do usuário (RLS aplicado automaticamente)
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (!usuario) {
      throw new Error('Usuário não encontrado')
    }

    // Processar requisição
    const { action, data } = await req.json()

    let result
    switch (action) {
      case 'emitir':
        // Validar que empresa_id na requisição corresponde ao usuário
        if (data.empresa_id !== usuario.empresa_id) {
          throw new Error('Forbidden: Empresa inválida')
        }
        result = await emitirNFe(data)
        break

      case 'consultar':
        // ... outras ações
        break

      default:
        throw new Error('Ação inválida')
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: error.message === 'Unauthorized' ? 401 : 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      }
    )
  }
})

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // Em produção: especificar domínio
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}
```

### Configurar Secrets no Supabase

```bash
# Via dashboard ou CLI
supabase secrets set NUVEM_FISCAL_CLIENT_ID="seu_client_id"
supabase secrets set NUVEM_FISCAL_CLIENT_SECRET="seu_client_secret"
supabase secrets set NUVEM_FISCAL_AMBIENTE="SANDBOX"
```

### Atualizar Frontend

```typescript
// src/services/nfe/nuvemFiscalService.ts
import { supabase } from '../../lib/supabase'

export class NuvemFiscalService {
  async emitirNFe(dados: NotaFiscalDados): Promise<RetornoSEFAZ> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Não autenticado')
    }

    // ✅ SEGURO: Credenciais no servidor
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nuvem-fiscal`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'emitir',
          data: dados
        })
      }
    )

    if (!response.ok) {
      throw new Error('Falha ao emitir NF-e')
    }

    return await response.json()
  }
}
```

---

## 2. 📝 REMOVER CONSOLE.LOG EM PRODUÇÃO

### Criar Wrapper de Logging Seguro

```typescript
// src/utils/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogConfig {
  enabled: boolean
  minLevel: LogLevel
  sendToAnalytics?: boolean
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

class SecureLogger {
  private config: LogConfig

  constructor() {
    this.config = {
      enabled: import.meta.env.DEV, // ✅ Só em desenvolvimento
      minLevel: 'debug',
      sendToAnalytics: import.meta.env.PROD
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled && level !== 'error') return false
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel]
  }

  private sanitize(data: any): any {
    if (typeof data !== 'object' || data === null) return data

    const sanitized = { ...data }
    const sensitiveKeys = [
      'password', 'senha', 'token', 'accessToken', 'refreshToken',
      'secret', 'apiKey', 'cpf', 'cnpj', 'certificado', 'chaveAcesso'
    ]

    for (const key in sanitized) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]'
      }
    }

    return sanitized
  }

  debug(message: string, data?: any) {
    if (this.shouldLog('debug')) {
      console.log(`🔍 [DEBUG] ${message}`, data ? this.sanitize(data) : '')
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog('info')) {
      console.log(`ℹ️ [INFO] ${message}`, data ? this.sanitize(data) : '')
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️ [WARN] ${message}`, data ? this.sanitize(data) : '')
    }
  }

  error(message: string, error: any) {
    // Sempre logar erros
    console.error(`❌ [ERROR] ${message}`, error)

    // Em produção, enviar para serviço de monitoramento
    if (this.config.sendToAnalytics) {
      this.sendToMonitoring(message, error)
    }
  }

  private sendToMonitoring(message: string, error: any) {
    // Integrar com Sentry, LogRocket, etc.
    // fetch('/api/log-error', { ... })
  }
}

export const logger = new SecureLogger()
```

### Uso:

```typescript
// ❌ ANTES:
console.log('✅ Token obtido com sucesso')
console.log('📝 Dados:', dadosCompletos)

// ✅ DEPOIS:
import { logger } from '@/utils/logger'

logger.info('Token obtido com sucesso')
logger.debug('Dados carregados', dadosCompletos) // Auto-sanitiza campos sensíveis
```

### Configurar Vite para Strip Logs

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    drop: ['console', 'debugger'], // ✅ Remove TODOS os console.* em produção
  },
  
  // Ou mais seletivo:
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: ['log', 'warn'], // Mantém console.error
        drop_debugger: true,
      }
    }
  }
})
```

---

## 3. 💾 REMOVER DADOS DE LOCALSTORAGE

### Substituir por React Context

```typescript
// src/contexts/NFeContext.tsx
import React, { createContext, useContext, useState } from 'react'

interface NFeDados {
  // ... campos da NF-e
}

interface NFeContextType {
  rascunho: NFeDados | null
  salvarRascunho: (dados: NFeDados) => void
  limparRascunho: () => void
}

const NFeContext = createContext<NFeContextType | undefined>(undefined)

export const NFeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ✅ Estado na memória (não persiste no navegador)
  const [rascunho, setRascunho] = useState<NFeDados | null>(null)

  const salvarRascunho = (dados: NFeDados) => {
    setRascunho(dados)
  }

  const limparRascunho = () => {
    setRascunho(null)
  }

  return (
    <NFeContext.Provider value={{ rascunho, salvarRascunho, limparRascunho }}>
      {children}
    </NFeContext.Provider>
  )
}

export const useNFe = () => {
  const context = useContext(NFeContext)
  if (!context) {
    throw new Error('useNFe deve ser usado dentro de NFeProvider')
  }
  return context
}
```

### Uso:

```typescript
// ❌ ANTES:
sessionStorage.setItem('nfe_edicao', JSON.stringify(dadosEdicao))
const dados = JSON.parse(sessionStorage.getItem('nfe_edicao') || '{}')

// ✅ DEPOIS:
import { useNFe } from '@/contexts/NFeContext'

const { rascunho, salvarRascunho, limparRascunho } = useNFe()

// Salvar
salvarRascunho(dadosEdicao)

// Recuperar
const dados = rascunho
```

### Para Dados que PRECISAM Persistir (com criptografia)

```typescript
// src/utils/secureStorage.ts
import CryptoJS from 'crypto-js'

// ⚠️ IMPORTANTE: Mudar chave por sessão
const getStorageKey = (): string => {
  let key = sessionStorage.getItem('__sk')
  if (!key) {
    key = CryptoJS.lib.WordArray.random(32).toString()
    sessionStorage.setItem('__sk', key)
  }
  return key
}

export const secureStorage = {
  set: (key: string, data: any): void => {
    try {
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        getStorageKey()
      ).toString()
      localStorage.setItem(key, encrypted)
    } catch (error) {
      console.error('Erro ao salvar dados:', error)
    }
  },

  get: <T>(key: string): T | null => {
    try {
      const encrypted = localStorage.getItem(key)
      if (!encrypted) return null

      const decrypted = CryptoJS.AES.decrypt(encrypted, getStorageKey())
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8)
      
      if (!jsonString) return null
      return JSON.parse(jsonString) as T
    } catch (error) {
      console.error('Erro ao recuperar dados:', error)
      return null
    }
  },

  remove: (key: string): void => {
    localStorage.removeItem(key)
  },

  clear: (): void => {
    localStorage.clear()
    sessionStorage.clear()
  }
}
```

---

## 4. 🛡️ VALIDAÇÃO E SANITIZAÇÃO DE INPUTS

### Instalar Dependências

```bash
npm install zod dompurify
npm install --save-dev @types/dompurify
```

### Criar Schemas de Validação

```typescript
// src/schemas/clienteSchema.ts
import { z } from 'zod'

// Regex helpers
const cpfRegex = /^\d{11}$/
const cnpjRegex = /^\d{14}$/
const cepRegex = /^\d{8}$/
const telefoneRegex = /^\d{10,11}$/

// Schema para Cliente
export const ClienteSchema = z.object({
  nome_razao: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(60, 'Nome deve ter no máximo 60 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.&]+$/, 'Nome contém caracteres inválidos'),

  cpf_cnpj: z.string()
    .refine((val) => cpfRegex.test(val) || cnpjRegex.test(val), {
      message: 'CPF/CNPJ inválido'
    })
    .transform((val) => val.replace(/\D/g, '')), // Remove formatação

  email: z.string()
    .email('Email inválido')
    .max(100, 'Email muito longo')
    .optional(),

  telefone: z.string()
    .regex(telefoneRegex, 'Telefone inválido')
    .optional(),

  inscricao_estadual: z.string()
    .max(20, 'Inscrição Estadual muito longa')
    .optional(),

  // Endereço
  cep: z.string()
    .regex(cepRegex, 'CEP inválido')
    .transform((val) => val.replace(/\D/g, '')),

  logradouro: z.string()
    .min(3, 'Logradouro deve ter no mínimo 3 caracteres')
    .max(100, 'Logradouro muito longo')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.\,]+$/, 'Logradouro com caracteres inválidos'),

  numero: z.string()
    .max(10, 'Número muito longo'),

  complemento: z.string()
    .max(60, 'Complemento muito longo')
    .optional(),

  bairro: z.string()
    .min(2, 'Bairro deve ter no mínimo 2 caracteres')
    .max(60, 'Bairro muito longo')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.]+$/, 'Bairro com caracteres inválidos'),

  cidade: z.string()
    .min(2, 'Cidade deve ter no mínimo 2 caracteres')
    .max(60, 'Cidade muito longa'),

  uf: z.string()
    .length(2, 'UF deve ter 2 caracteres')
    .regex(/^[A-Z]{2}$/, 'UF inválida'),

  codigo_municipio: z.string()
    .regex(/^\d{7}$/, 'Código do município inválido')
})

export type ClienteValidado = z.infer<typeof ClienteSchema>
```

### Criar Utilitários de Sanitização

```typescript
// src/utils/sanitizer.ts
import DOMPurify from 'dompurify'

/**
 * Remove TODAS as tags HTML e scripts
 */
export const sanitizeHTML = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Remove todas as tags
    ALLOWED_ATTR: []  // Remove todos os atributos
  }).trim()
}

/**
 * Remove caracteres perigosos para XML
 */
export const sanitizeXML = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Remove apenas números
 */
export const onlyNumbers = (input: string): string => {
  return input.replace(/\D/g, '')
}

/**
 * Remove caracteres especiais (mantém apenas letras, números, espaços e hífens)
 */
export const sanitizeText = (input: string): string => {
  return input.replace(/[^\w\sÀ-ÿ\-]/g, '').trim()
}

/**
 * Sanitiza objeto completo
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = { ...obj }

  for (const key in sanitized) {
    const value = sanitized[key]
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHTML(value) as T[Extract<keyof T, string>]
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    }
  }

  return sanitized
}
```

### Criar Hook Personalizado para Formulários

```typescript
// src/hooks/useValidatedForm.ts
import { useState } from 'react'
import { z } from 'zod'
import { sanitizeObject } from '@/utils/sanitizer'

export function useValidatedForm<T extends z.ZodType>(schema: T) {
  type FormData = z.infer<T>
  
  const [data, setData] = useState<Partial<FormData>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): FormData | null => {
    try {
      // Sanitizar antes de validar
      const sanitized = sanitizeObject(data)
      
      // Validar com Zod
      const validated = schema.parse(sanitized)
      
      setErrors({})
      return validated
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          const path = err.path.join('.')
          newErrors[path] = err.message
        })
        setErrors(newErrors)
      }
      return null
    }
  }

  const updateField = (field: keyof FormData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }))
    // Limpar erro do campo ao editar
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[field as string]
      return newErrors
    })
  }

  return {
    data,
    errors,
    validate,
    updateField,
    setData,
    reset: () => {
      setData({})
      setErrors({})
    }
  }
}
```

### Uso no Componente:

```typescript
// src/features/clientes/CadastroCliente.tsx
import React from 'react'
import { useValidatedForm } from '@/hooks/useValidatedForm'
import { ClienteSchema } from '@/schemas/clienteSchema'
import { supabase } from '@/lib/supabase'

export const CadastroCliente: React.FC = () => {
  const { data, errors, validate, updateField, reset } = useValidatedForm(ClienteSchema)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ✅ Validar e sanitizar
    const validated = validate()
    
    if (!validated) {
      alert('Corrija os erros no formulário')
      return
    }

    // ✅ Agora é seguro inserir no banco
    const { error } = await supabase
      .from('clientes')
      .insert(validated)

    if (error) {
      alert('Erro ao cadastrar cliente')
      return
    }

    alert('Cliente cadastrado com sucesso!')
    reset()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nome/Razão Social *</label>
        <input
          type="text"
          value={data.nome_razao || ''}
          onChange={(e) => updateField('nome_razao', e.target.value)}
          className={errors.nome_razao ? 'border-red-500' : ''}
        />
        {errors.nome_razao && (
          <span className="text-red-500 text-xs">{errors.nome_razao}</span>
        )}
      </div>

      <div>
        <label>CPF/CNPJ *</label>
        <input
          type="text"
          value={data.cpf_cnpj || ''}
          onChange={(e) => updateField('cpf_cnpj', e.target.value)}
          className={errors.cpf_cnpj ? 'border-red-500' : ''}
        />
        {errors.cpf_cnpj && (
          <span className="text-red-500 text-xs">{errors.cpf_cnpj}</span>
        )}
      </div>

      {/* ... outros campos ... */}

      <button type="submit">Cadastrar Cliente</button>
    </form>
  )
}
```

---

## 5. 🔒 APLICAR RLS COMPLETO NO SUPABASE

### Script SQL Completo

```sql
-- =====================================================
-- APLICAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- =====================================================

-- ============ EMPRESAS ============
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas a própria empresa
CREATE POLICY "usuarios_ver_propria_empresa"
ON empresas FOR SELECT
USING (
  id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- Apenas admin pode atualizar empresa
CREATE POLICY "usuarios_editar_propria_empresa"
ON empresas FOR UPDATE
USING (
  id IN (
    SELECT empresa_id FROM usuarios 
    WHERE id = auth.uid() AND perfil = 'admin'
  )
);

-- ============ USUÁRIOS ============
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_ver_mesma_empresa"
ON usuarios FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

CREATE POLICY "usuarios_criar_mesma_empresa"
ON usuarios FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM usuarios 
    WHERE id = auth.uid() AND perfil = 'admin'
  )
);

-- ============ CLIENTES ============
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes_mesma_empresa_select"
ON clientes FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

CREATE POLICY "clientes_mesma_empresa_insert"
ON clientes FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

CREATE POLICY "clientes_mesma_empresa_update"
ON clientes FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

CREATE POLICY "clientes_mesma_empresa_delete"
ON clientes FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- ============ PRODUTOS ============
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "produtos_mesma_empresa_select"
ON produtos FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

CREATE POLICY "produtos_mesma_empresa_insert"
ON produtos FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

CREATE POLICY "produtos_mesma_empresa_update"
ON produtos FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

CREATE POLICY "produtos_mesma_empresa_delete"
ON produtos FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- ============ VENDAS ============
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendas_mesma_empresa_select"
ON vendas FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

CREATE POLICY "vendas_mesma_empresa_insert"
ON vendas FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

CREATE POLICY "vendas_mesma_empresa_update"
ON vendas FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

CREATE POLICY "vendas_mesma_empresa_delete"
ON vendas FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- ============ NOTAS FISCAIS ============
ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notas_fiscais_mesma_empresa_select"
ON notas_fiscais FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

CREATE POLICY "notas_fiscais_mesma_empresa_insert"
ON notas_fiscais FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

CREATE POLICY "notas_fiscais_mesma_empresa_update"
ON notas_fiscais FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

CREATE POLICY "notas_fiscais_mesma_empresa_delete"
ON notas_fiscais FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- ============ NOTAS FISCAIS ITENS ============
ALTER TABLE notas_fiscais_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notas_fiscais_itens_mesma_empresa_select"
ON notas_fiscais_itens FOR SELECT
USING (
  nota_fiscal_id IN (
    SELECT id FROM notas_fiscais
    WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "notas_fiscais_itens_mesma_empresa_insert"
ON notas_fiscais_itens FOR INSERT
WITH CHECK (
  nota_fiscal_id IN (
    SELECT id FROM notas_fiscais
    WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "notas_fiscais_itens_mesma_empresa_update"
ON notas_fiscais_itens FOR UPDATE
USING (
  nota_fiscal_id IN (
    SELECT id FROM notas_fiscais
    WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "notas_fiscais_itens_mesma_empresa_delete"
ON notas_fiscais_itens FOR DELETE
USING (
  nota_fiscal_id IN (
    SELECT id FROM notas_fiscais
    WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  )
);

-- ============ OPERAÇÕES FISCAIS ============
ALTER TABLE operacoes_fiscais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operacoes_fiscais_mesma_empresa_select"
ON operacoes_fiscais FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

CREATE POLICY "operacoes_fiscais_mesma_empresa_insert"
ON operacoes_fiscais FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

CREATE POLICY "operacoes_fiscais_mesma_empresa_update"
ON operacoes_fiscais FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

CREATE POLICY "operacoes_fiscais_mesma_empresa_delete"
ON operacoes_fiscais FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- ============ NUMERAÇÃO NF-E ============
ALTER TABLE notas_fiscais_numeracao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "numeracao_mesma_empresa_select"
ON notas_fiscais_numeracao FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

CREATE POLICY "numeracao_mesma_empresa_update"
ON notas_fiscais_numeracao FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- =====================================================
-- VERIFICAR RLS APLICADO
-- =====================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Deve retornar rowsecurity = true para todas as tabelas
```

### Testar RLS

```sql
-- Login como usuário da empresa A
SELECT set_config('request.jwt.claim.sub', 'user-id-empresa-A', true);

-- Deve retornar apenas dados da empresa A
SELECT * FROM notas_fiscais;

-- Tentar acessar nota de empresa B (deve falhar ou retornar vazio)
SELECT * FROM notas_fiscais WHERE empresa_id = 'empresa-B-id';
```

---

## 📋 RESUMO DE IMPLEMENTAÇÃO

### 1️⃣ PRIORIDADE MÁXIMA (Hoje):
- [ ] Mover Nuvem Fiscal para Edge Function
- [ ] Remover console.log em produção

### 2️⃣ ESTA SEMANA:
- [ ] Migrar localStorage para Context/Estado
- [ ] Implementar validação com Zod
- [ ] Aplicar RLS completo

### 3️⃣ PRÓXIMA SEMANA:
- [ ] Atualizar dependências
- [ ] Implementar CSP
- [ ] Testes de penetração

---

**Dúvidas?** Consulte [RELATORIO_VULNERABILIDADES_SEGURANCA.md](./RELATORIO_VULNERABILIDADES_SEGURANCA.md)
