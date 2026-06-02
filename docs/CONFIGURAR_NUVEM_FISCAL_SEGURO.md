# 🔐 Como Configurar Credenciais Nuvem Fiscal (SEGURO)

## ⚠️ IMPORTANTE: NUNCA faça isso!

```env
# ❌ ERRADO - Expõe credenciais no bundle JavaScript
VITE_NUVEM_FISCAL_CLIENT_ID=xxx
VITE_NUVEM_FISCAL_CLIENT_SECRET=xxx
```

**Por quê?** Qualquer variável com prefixo `VITE_` é compilada no bundle JavaScript e fica publicamente acessível.

---

## ✅ Solução SEGURA: Edge Function

### Arquitetura

```
Frontend (React)
    ↓
Edge Function (Supabase)
    ↓ (credenciais seguras)
Nuvem Fiscal API
```

**Vantagens:**
- ✅ Credenciais ficam no servidor
- ✅ Não aparecem no bundle JavaScript
- ✅ Não aparecem no Network DevTools
- ✅ Cache de token OAuth2 automático
- ✅ Logs centralizados

---

## 📦 Passo 1: Instalar Supabase CLI

```bash
# Windows (via npm)
npm install -g supabase

# Verificar instalação
supabase --version
```

---

## 🔑 Passo 2: Configurar Secrets (Credenciais)

```bash
# Login no Supabase
supabase login

# Link com seu projeto
supabase link --project-ref SEU_PROJECT_REF

# Configurar credenciais como secrets
supabase secrets set NUVEM_FISCAL_CLIENT_ID=WQoXHnGx1dcbwoprcKIw
supabase secrets set NUVEM_FISCAL_CLIENT_SECRET=gtzrgTGFEdsz87LHQLbqdixmp07qoWFdVcmJb8TU

# Verificar secrets configurados
supabase secrets list
```

**Encontrar PROJECT_REF:**
1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Settings > General > Reference ID

---

## 🚀 Passo 3: Deploy da Edge Function

```bash
# Deploy
supabase functions deploy nuvem-fiscal

# Verificar logs (em tempo real)
supabase functions logs nuvem-fiscal --tail
```

**Estrutura criada:**
```
supabase/
  functions/
    nuvem-fiscal/
      index.ts          # ✅ Criado
    _shared/
      cors.ts           # ✅ Criado
```

---

## 🧪 Passo 4: Testar Conexão

### Teste 1: Via código
```typescript
import { testarConexao } from '../services/nuvemFiscalService'

try {
  const result = await testarConexao()
  console.log('✅ Conexão OK:', result)
} catch (error) {
  console.error('❌ Erro:', error)
}
```

### Teste 2: Via cURL
```bash
curl -X POST "https://SEU_PROJECT_REF.supabase.co/functions/v1/nuvem-fiscal" \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"test"}'
```

---

## 💻 Passo 5: Atualizar Componentes

### Antes (❌ INSEGURO)
```typescript
// EmitirNotaFiscal.tsx
const CLIENT_ID = import.meta.env.VITE_NUVEM_FISCAL_CLIENT_ID  // ❌ Exposto
const CLIENT_SECRET = import.meta.env.VITE_NUVEM_FISCAL_CLIENT_SECRET  // ❌ Exposto

// Fazer fetch direto
const response = await fetch('https://api.nuvemfiscal.com.br/nfe', {
  headers: {
    'Authorization': `Bearer ${token}`  // ❌ Token visível no Network
  }
})
```

### Depois (✅ SEGURO)
```typescript
// EmitirNotaFiscal.tsx
import { emitirNFe } from '../../services/nuvemFiscalService'

// Usar Edge Function
const resultado = await emitirNFe({
  nfeData: {
    natureza_operacao: 'VENDA',
    // ... outros dados
  },
  ambiente: 'homologacao'  // ou 'producao'
})
```

---

## 📝 Exemplos de Uso

### 1. Emitir NF-e
```typescript
import { emitirNFe } from '../services/nuvemFiscalService'

const handleEmitir = async () => {
  try {
    const resultado = await emitirNFe({
      nfeData: {
        natureza_operacao: 'VENDA',
        emitente: { /* ... */ },
        destinatario: { /* ... */ },
        itens: [ /* ... */ ]
      },
      ambiente: 'homologacao'
    })
    
    console.log('NF-e emitida:', resultado.numero)
  } catch (error) {
    console.error('Erro ao emitir:', error.message)
  }
}
```

### 2. Consultar NF-e
```typescript
import { consultarNFe } from '../services/nuvemFiscalService'

const nota = await consultarNFe('id-da-nota-123')
console.log('Status:', nota.status)
```

### 3. Cancelar NF-e
```typescript
import { cancelarNFe } from '../services/nuvemFiscalService'

await cancelarNFe({
  id: 'id-da-nota-123',
  justificativa: 'Nota emitida com erro nos valores dos produtos'
})
```

### 4. Inutilizar Numeração
```typescript
import { inutilizarNumeracao } from '../services/nuvemFiscalService'

await inutilizarNumeracao({
  cnpj: '12345678000190',
  serie: '1',
  numeroInicial: 100,
  numeroFinal: 105,
  justificativa: 'Numeração pulada por erro no sistema',
  ambiente: 'homologacao'
})
```

---

## 🔍 Debug e Logs

### Ver logs da Edge Function
```bash
# Em tempo real
supabase functions logs nuvem-fiscal --tail

# Últimas 100 linhas
supabase functions logs nuvem-fiscal --limit 100
```

### O que procurar nos logs:
- ✅ "Using cached token" → Token OAuth2 em cache (performance!)
- ✅ "Requesting new token" → Renovando token expirado
- ❌ "Failed to get token" → Credenciais inválidas
- ❌ "User not authenticated" → Frontend não enviou token do usuário

---

## 🛡️ Segurança Implementada

### 1. Autenticação
```typescript
// Edge Function verifica se usuário está logado
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) {
  throw new Error('User not authenticated')
}
```

### 2. Cache de Token OAuth2
```typescript
// Token válido por ~1 hora, renovado automaticamente 5min antes de expirar
if (tokenCache && tokenCache.expires_at > now + 300000) {
  return tokenCache.access_token
}
```

### 3. CORS Restrito
```typescript
// Apenas domínios permitidos podem chamar a função
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // ⚠️ Ajustar para seu domínio em produção
}
```

---

## 🚨 Revogar Credenciais Antigas

**IMPORTANTE:** Se credenciais antigas foram expostas no git, revogue-as!

1. Acesse https://app.nuvemfiscal.com.br
2. Login → Configurações → API
3. **Revogar** todas as credenciais antigas
4. Gerar novas credenciais
5. Configurar como secrets (Passo 2)

---

## ✅ Checklist Final

- [ ] Supabase CLI instalado
- [ ] Secrets configurados (NUVEM_FISCAL_CLIENT_ID, NUVEM_FISCAL_CLIENT_SECRET)
- [ ] Edge Function deployada
- [ ] Teste de conexão funcionando
- [ ] Componentes atualizados para usar `nuvemFiscalService.ts`
- [ ] Credenciais antigas revogadas (se foram expostas)
- [ ] Variáveis VITE_NUVEM_FISCAL_* removidas do .env

---

## 🆘 Problemas Comuns

### Erro: "Authorization header required"
**Solução:** Usuário não está logado. Verificar `supabase.auth.getSession()`

### Erro: "Failed to get token: 401"
**Solução:** Credenciais inválidas. Verificar secrets com `supabase secrets list`

### Erro: "CORS error"
**Solução:** Ajustar `corsHeaders` na Edge Function para permitir seu domínio

### Erro: "Function not found"
**Solução:** Fazer deploy: `supabase functions deploy nuvem-fiscal`

---

## 📚 Referências

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Nuvem Fiscal API](https://dev.nuvemfiscal.com.br/)
- [OAuth2 Client Credentials](https://oauth.net/2/grant-types/client-credentials/)
