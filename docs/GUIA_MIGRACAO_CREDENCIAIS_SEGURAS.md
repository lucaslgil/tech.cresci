# 🔄 Guia de Migração - Credenciais Seguras

## ⚠️ AÇÃO NECESSÁRIA

Se você está vendo este documento, significa que o sistema precisa ser atualizado para usar **credenciais seguras** via Edge Function.

---

## 📋 Arquivos que precisam ser atualizados

### 1. src/services/nfe/nuvemFiscalAdapter.ts

**Antes (❌ INSEGURO):**
```typescript
const clientId = import.meta.env.VITE_NUVEM_FISCAL_CLIENT_ID
const clientSecret = import.meta.env.VITE_NUVEM_FISCAL_CLIENT_SECRET
```

**Depois (✅ SEGURO):**
```typescript
import { emitirNFe, consultarNFe } from '../nuvemFiscalService'

// Usar Edge Function
const resultado = await emitirNFe({ nfeData, ambiente })
```

---

### 2. src/features/notas-fiscais/EmitirNotaFiscal.tsx

Substituir chamadas diretas à API por:

```typescript
import { emitirNFe } from '../../services/nuvemFiscalService'

const handleEmitir = async () => {
  try {
    const resultado = await emitirNFe({
      nfeData: {
        // dados da nota...
      },
      ambiente: 'homologacao'
    })
    
    console.log('Emitida:', resultado.numero)
  } catch (error) {
    console.error('Erro:', error.message)
  }
}
```

---

### 3. src/features/notas-fiscais/ConsultarNotasFiscais.tsx

```typescript
import { consultarNFe, cancelarNFe } from '../../services/nuvemFiscalService'

// Consultar
const nota = await consultarNFe('id-da-nota')

// Cancelar
await cancelarNFe({
  id: 'id-da-nota',
  justificativa: 'Motivo do cancelamento (mín 15 caracteres)'
})
```

---

## 🚀 Passo a Passo de Migração

### Etapa 1: Configurar Edge Function (10 minutos)

```bash
# 1. Instalar Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link com projeto
supabase link --project-ref SEU_PROJECT_REF

# 4. Configurar secrets (usar novas credenciais!)
supabase secrets set NUVEM_FISCAL_CLIENT_ID=WQoXHnGx1dcbwoprcKIw
supabase secrets set NUVEM_FISCAL_CLIENT_SECRET=gtzrgTGFEdsz87LHQLbqdixmp07qoWFdVcmJb8TU

# 5. Deploy
supabase functions deploy nuvem-fiscal

# 6. Testar
supabase functions logs nuvem-fiscal --tail
```

---

### Etapa 2: Atualizar Componentes (30-60 minutos)

**Arquivo:** `src/services/nfe/nuvemFiscalAdapter.ts`

Substituir todo o conteúdo por:

```typescript
import { emitirNFe, consultarNFe, cancelarNFe } from '../nuvemFiscalService'

export class NuvemFiscalAdapter {
  async emitir(nfeData: any, ambiente: 'homologacao' | 'producao') {
    return await emitirNFe({ nfeData, ambiente })
  }

  async consultar(id: string) {
    return await consultarNFe(id)
  }

  async cancelar(id: string, justificativa: string) {
    return await cancelarNFe({ id, justificativa })
  }
}
```

---

**Arquivo:** `src/features/notas-fiscais/EmitirNotaFiscal.tsx`

Substituir:
```typescript
// ❌ Remover
const clientId = import.meta.env.VITE_NUVEM_FISCAL_CLIENT_ID
const clientSecret = import.meta.env.VITE_NUVEM_FISCAL_CLIENT_SECRET

// ✅ Adicionar no topo
import { emitirNFe } from '../../services/nuvemFiscalService'

// ✅ Usar no handler
const resultado = await emitirNFe({
  nfeData: notaFiscalData,
  ambiente: empresaAtual?.ambiente_nfe || 'homologacao'
})
```

---

**Arquivo:** `src/features/notas-fiscais/ConsultarNotasFiscais.tsx`

Substituir:
```typescript
// ❌ Remover todas as linhas com VITE_NUVEM_FISCAL_*

// ✅ Adicionar no topo
import { consultarNFe, cancelarNFe } from '../../services/nuvemFiscalService'

// ✅ Consultar
const nota = await consultarNFe(notaId)

// ✅ Cancelar
await cancelarNFe({ id: notaId, justificativa })
```

---

### Etapa 3: Limpar .env (5 minutos)

```bash
# 1. Abrir .env (se existir)
# 2. Remover COMPLETAMENTE essas linhas:
VITE_NUVEM_FISCAL_AMBIENTE=...
VITE_NUVEM_FISCAL_CLIENT_ID=...
VITE_NUVEM_FISCAL_CLIENT_SECRET=...

# 3. Salvar e reiniciar dev server
npm run dev
```

---

### Etapa 4: Revogar Credenciais Antigas (CRÍTICO!)

Se as credenciais antigas foram expostas no git ou bundle:

1. ✅ Acesse https://app.nuvemfiscal.com.br
2. ✅ Login → Configurações → API
3. ✅ **REVOGAR** todas as credenciais antigas
4. ✅ Gerar novas credenciais
5. ✅ Atualizar secrets: `supabase secrets set NUVEM_FISCAL_CLIENT_ID=...`

---

## 🧪 Testar Após Migração

```typescript
// teste-nuvem-fiscal.ts
import { testarConexao, emitirNFe } from './src/services/nuvemFiscalService'

// Teste 1: Conexão
const teste = await testarConexao()
console.log('✅ Conexão OK:', teste)

// Teste 2: Emissão (homologação)
const nota = await emitirNFe({
  nfeData: {
    natureza_operacao: 'VENDA',
    // ... dados mínimos
  },
  ambiente: 'homologacao'
})
console.log('✅ NF-e emitida:', nota.numero)
```

---

## ✅ Checklist Final

- [ ] Supabase CLI instalado
- [ ] Secrets configurados (NUVEM_FISCAL_CLIENT_ID, NUVEM_FISCAL_CLIENT_SECRET)
- [ ] Edge Function deployada (`supabase functions deploy nuvem-fiscal`)
- [ ] nuvemFiscalAdapter.ts atualizado
- [ ] EmitirNotaFiscal.tsx atualizado
- [ ] ConsultarNotasFiscais.tsx atualizado
- [ ] Variáveis VITE_NUVEM_FISCAL_* removidas do .env
- [ ] Dev server reiniciado (`npm run dev`)
- [ ] Teste de conexão funcionando
- [ ] Teste de emissão em homologação funcionando
- [ ] Credenciais antigas revogadas (se expostas)

---

## 🆘 Problemas Comuns

### "Authorization header required"
**Causa:** Usuário não autenticado  
**Solução:** Fazer login antes de chamar a API

### "Failed to get token: 401"
**Causa:** Credenciais inválidas nos secrets  
**Solução:** Verificar: `supabase secrets list`

### "Function not found"
**Causa:** Edge Function não deployada  
**Solução:** `supabase functions deploy nuvem-fiscal`

### Tudo funciona local mas não em produção
**Causa:** Secrets não configurados em produção  
**Solução:** Rodar `supabase secrets set ...` novamente

---

## 📚 Referências

- [docs/CONFIGURAR_NUVEM_FISCAL_SEGURO.md](./CONFIGURAR_NUVEM_FISCAL_SEGURO.md) - Guia completo
- [src/services/nuvemFiscalService.ts](../src/services/nuvemFiscalService.ts) - Service pronto
- [supabase/functions/nuvem-fiscal/index.ts](../supabase/functions/nuvem-fiscal/index.ts) - Edge Function
