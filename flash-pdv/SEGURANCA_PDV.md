# 🔐 SEGURANÇA DO FLASH PDV

## Regras Fundamentais de Segurança

### ✅ O QUE USAR

**ANON PUBLIC KEY** - Chave segura para aplicativos cliente
- ✅ Use no FLASH PDV (Electron)
- ✅ Use em aplicativos web
- ✅ Use em aplicativos mobile
- ✅ Protegido por RLS (Row Level Security)
- ✅ Usuário vê apenas dados da sua empresa

**Exemplo:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFseWxvY2hybHZnY3ZqZG1rbXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDcwMjAsImV4cCI6MjA3NTkyMzAyMH0.Jw6iJqy1JthecYfFKNJcftI-5yi_YyGL44f9hNQgqIY
```

---

### ❌ O QUE NUNCA USAR

**SERVICE ROLE KEY** - ⚠️ **PERIGO EXTREMO**
- ❌ NUNCA use em aplicativos Electron
- ❌ NUNCA use em aplicativos web
- ❌ NUNCA use em aplicativos mobile
- ❌ NUNCA commite no Git
- 🚨 Bypassa TODAS as políticas RLS
- 🚨 Acesso total ao banco de dados
- 🚨 Pode ser extraída de aplicativos compilados

**Esta chave só deve existir em:**
- ✅ Servidores backend seguros com variáveis de ambiente
- ✅ Scripts administrativos locais (nunca compartilhados)
- ✅ CI/CD pipelines seguros

---

## Como o Sistema Funciona

### 1. **FLASH PDV usa Anon Key**
```typescript
// ✅ CORRETO
const supabase = createClient(
  'https://alylochrrlvgcvjdmkmum.supabase.co',
  'eyJ...anon_key_here'  // Anon Key segura
)
```

### 2. **RLS Protege os Dados**
```sql
-- Política de segurança na retaguarda
CREATE POLICY "pdv_sync_produtos_select" ON produtos
  FOR SELECT
  USING (empresa_id = get_user_empresa_id());
```

**O que isso significa:**
- Cada usuário autenticado vê apenas produtos da sua empresa
- Impossível acessar dados de outras empresas
- Mesmo com anon key exposta, dados estão protegidos

### 3. **Autenticação do Usuário**
```typescript
// O PDV autentica com usuário/senha via Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'operador@empresa.com',
  password: 'senha_segura'
})

// Token JWT gerado contém empresa_id do usuário
// RLS usa esse token para filtrar dados automaticamente
```

---

## Validações Implementadas

### No ConfiguracaoInicial.tsx
```typescript
// Detecta service_role key e bloqueia
if (formData.supabaseKey.toLowerCase().includes('service_role')) {
  throw new Error('⚠️ Use apenas ANON PUBLIC KEY!')
}
```

### No SyncService (sync.ts)
```typescript
// Valida chave no construtor
if (config.supabaseKey && config.supabaseKey.includes('service_role')) {
  throw new Error('ERRO DE SEGURANÇA: Service Role Key detectada!')
}
```

---

## Checklist de Segurança

Antes de implantar o FLASH PDV:

- [ ] Apenas anon public key no código
- [ ] Service role key armazenada em local seguro (gerenciador de senhas)
- [ ] RLS habilitado em todas as tabelas do Supabase
- [ ] Políticas RLS testadas e funcionando
- [ ] Autenticação de usuário obrigatória
- [ ] Senhas fortes para operadores
- [ ] Logs de sincronização habilitados
- [ ] Backup regular do banco local (SQLite)

---

## Onde Encontrar as Chaves

### No Supabase Dashboard:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Menu lateral: **Settings** → **API**
4. Na seção **Project API keys**:
   - ✅ **anon public** - Use esta no PDV
   - ❌ **service_role** - Guarde em local seguro, nunca use em apps

### URL do Projeto:
- Seção **Project URL**: `https://alylochrrlvgcvjdmkmum.supabase.co`

---

## Boas Práticas

### ✅ FAZER:
- Usar anon key em todos os clientes (web, mobile, desktop)
- Implementar autenticação de usuário via Supabase Auth
- Confiar no RLS para proteção de dados
- Rotacionar senhas regularmente
- Monitorar logs de acesso no Supabase

### ❌ NÃO FAZER:
- Usar service_role key fora de servidores seguros
- Commitar chaves no Git (use .env)
- Compartilhar credenciais por e-mail/chat
- Desabilitar RLS para "facilitar desenvolvimento"
- Usar mesma senha para múltiplos operadores

---

## Em Caso de Vazamento

### Se anon key for exposta:
- ✅ **OK - Relativamente seguro**
- RLS impede acesso não autorizado
- Regenere a chave no Supabase (Settings → API → Reset)
- Atualize todos os PDVs com nova chave

### Se service_role key for exposta:
- 🚨 **EMERGÊNCIA - Ação imediata**
- Regenere IMEDIATAMENTE no Supabase
- Revogue todas as sessões ativas
- Audite todos os acessos recentes
- Verifique logs de modificação no banco

---

## Resumo Visual

```
┌─────────────────────────────────────────────────────┐
│               FLASH PDV (Electron)                  │
│                                                     │
│  ✅ Anon Key                                        │
│  ✅ Auth do Usuário                                  │
│  ✅ Token JWT                                        │
└──────────────┬──────────────────────────────────────┘
               │
               │ HTTPS (seguro)
               ▼
┌─────────────────────────────────────────────────────┐
│            SUPABASE (Nuvem)                         │
│                                                     │
│  🛡️ RLS Policies                                    │
│  🔒 empresa_id = get_user_empresa_id()             │
│  ✅ Filtra automaticamente                          │
└─────────────────────────────────────────────────────┘

RESULTADO: 
✅ Seguro mesmo se anon key for extraída do app
✅ Cada empresa vê apenas seus dados
✅ Impossível acesso cross-tenant
```

---

## Suporte

Dúvidas sobre segurança? Revise:
1. Este documento
2. Documentação oficial: https://supabase.com/docs/guides/auth/row-level-security
3. Políticas RLS em: `database/preparar_retaguarda_para_pdv.sql`

**Lembre-se:** A segurança multi-tenant depende de RLS bem configurado + anon key + autenticação de usuário. Nunca pule nenhum desses três pilares!
