# 🚀 Quick Start - Deploy Credenciais Seguras

**Copie e cole estes comandos no PowerShell/Terminal**

---

## Passo 1: Instalar Supabase CLI

```powershell
npm install -g supabase
```

---

## Passo 2: Login e Link

```powershell
# Login no Supabase
supabase login

# Link com seu projeto (substitua SEU_PROJECT_REF)
# Encontrar em: https://app.supabase.com > Seu Projeto > Settings > General > Reference ID
supabase link --project-ref SEU_PROJECT_REF
```

---

## Passo 3: Configurar Secrets

```powershell
# Suas novas credenciais Nuvem Fiscal
supabase secrets set NUVEM_FISCAL_CLIENT_ID=SEU_CLIENT_ID_AQUI

supabase secrets set NUVEM_FISCAL_CLIENT_SECRET=SEU_CLIENT_SECRET_AQUI

# Verificar se foi configurado
supabase secrets list
```

**Deve aparecer:**
```
NUVEM_FISCAL_CLIENT_ID
NUVEM_FISCAL_CLIENT_SECRET
```

---

## Passo 4: Deploy Edge Function

```powershell
# Deploy
supabase functions deploy nuvem-fiscal

# Ver logs (Ctrl+C para sair)
supabase functions logs nuvem-fiscal --tail
```

**Sucesso quando aparecer:**
```
✅ Function deployed successfully
```

---

## Passo 5: Testar (no navegador)

1. Abra seu sistema no navegador
2. Faça login
3. Abra DevTools (F12) > Console
4. Cole e execute:

```javascript
// Testar conexão
const { testarConexao } = await import('./src/services/nuvemFiscalService.js')
const result = await testarConexao()
console.log('✅ Resultado:', result)
```

**Deve retornar:**
```json
{
  "success": true,
  "message": "Token obtained successfully",
  "hasToken": true
}
```

---

## ✅ Pronto!

Edge Function configurada e funcionando! 🎉

**Próximos passos opcionais:**
- Migrar código existente (ver: docs/GUIA_MIGRACAO_CREDENCIAIS_SEGURAS.md)
- Revogar credenciais antigas (se foram expostas)

---

## 🆘 Problemas?

### Erro: "command not found: supabase"
```powershell
# Tentar com admin
npm install -g supabase --force

# Ou adicionar ao PATH manualmente
```

### Erro: "Failed to link project"
- Verificar PROJECT_REF correto
- Verificar login: `supabase login`

### Erro: "Failed to deploy function"
```powershell
# Ver erros detalhados
supabase functions deploy nuvem-fiscal --debug
```

### Teste dá erro "Authorization header required"
- Fazer login no sistema antes de testar
- Verificar se está usando https (não http)

---

## 📚 Documentação Completa

- [CREDENCIAIS_SEGURAS_RESUMO.md](./CREDENCIAIS_SEGURAS_RESUMO.md) - Overview completo
- [CONFIGURAR_NUVEM_FISCAL_SEGURO.md](./CONFIGURAR_NUVEM_FISCAL_SEGURO.md) - Guia detalhado
- [GUIA_MIGRACAO_CREDENCIAIS_SEGURAS.md](./GUIA_MIGRACAO_CREDENCIAIS_SEGURAS.md) - Migrar código
