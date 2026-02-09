# ⚠️ AÇÕES IMEDIATAS - MANUAL OBRIGATÓRIO

**Data:** 09/02/2026 às 00:25  
**Criticidade:** 🔴 ALTA  
**Tempo estimado:** 45 minutos  

---

## ❌ ERRO ESPERADO: Column "empresa_id" does not exist

Se você tentou executar o RLS, provavelmente recebeu este erro. **Isso é normal!**

➡️ **Solução completa:** [docs/CORRECAO_ERRO_RLS_EMPRESA_ID.md](./CORRECAO_ERRO_RLS_EMPRESA_ID.md)

---

## 📋 CHECKLIST URGENTE - EXECUTE NESSA ORDEM

### 🟡 1. PRIMEIRO: Adicionar empresa_id nas tabelas (10 min)

**Arquivo:** `database/ADICIONAR_EMPRESA_ID_TODAS_TABELAS.sql`

**O que faz:**
- Adiciona coluna `empresa_id` em: usuarios, clientes, produtos, vendas, vendas_itens
- Cria índices para performance
- Prepara banco para RLS

**Como executar:**
1. Abrir https://app.supabase.com/project/[SEU_PROJECT_ID]/sql/new
2. Copiar conteúdo de `database/ADICIONAR_EMPRESA_ID_TODAS_TABELAS.sql`
3. Colar no editor SQL
4. Clicar em "Run" (F5)
5. Aguardar "Success"

**Verificar:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'usuarios' AND column_name = 'empresa_id';
-- Deve retornar: empresa_id
```

---

### 🟡 2. SEGUNDO: Atualizar registros existentes (5-15 min)

**⚠️ IMPORTANTE:** Se você já tem dados, vincule à empresa.

**Se tem APENAS 1 empresa:**
```sql
-- Pegar ID da empresa
SELECT id, razao_social FROM empresas;

-- Atualizar (substitua '1' pelo ID correto)
UPDATE usuarios SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE clientes SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE produtos SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE vendas SET empresa_id = 1 WHERE empresa_id IS NULL;
```

**Verificar (todos devem retornar 0):**
```sql
SELECT 'usuarios' as tab, COUNT(*) FROM usuarios WHERE empresa_id IS NULL
UNION ALL SELECT 'clientes', COUNT(*) FROM clientes WHERE empresa_id IS NULL;
```

---

### 🟡 3. TERCEIRO: Tornar empresa_id obrigatório (1 min)

**Execute SOMENTE após verificar que todos têm empresa_id:**

```sql
ALTER TABLE usuarios ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE clientes ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE produtos ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE vendas ALTER COLUMN empresa_id SET NOT NULL;
```

---

### 🔴 4. QUARTO: Aplicar RLS CORRIGIDO (2 min)

**Arquivo:** `database/APLICAR_RLS_CORRIGIDO.sql`

**Como executar:**
1. Abrir Supabase SQL Editor
2. Copiar `database/APLICAR_RLS_CORRIGIDO.sql`
3. Executar
4. Verificar query final retorna `rowsecurity=true`

**Testar:**
```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'clientes';
-- Deve retornar: clientes | true
```

---

### 🔴 5. Desativar Emissão NFe Temporariamente (5 min)

**Por quê:** Até migrar para Edge Function, credenciais estão expostas.

**Como fazer:**
1. Adicionar aviso temporário em `src/features/notas-fiscais/EmitirNotaFiscal.tsx`:
   ```tsx
   <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
     <p className="text-yellow-800">
       ⚠️ Emissão de NF-e temporariamente em manutenção para upgrade de segurança.
     </p>
   </div>
   ```
2. Ou desabilitar botão "Emitir" até migrar para Edge Function

---

### 🔴 6. Revogar Credenciais Nuvem Fiscal (15 min)

**Por quê:** Credenciais antigas expostas no bundle JavaScript e histórico git.

**Passos:**
1. Login: https://app.nuvemfiscal.com.br
2. Configurações > API > OAuth
3. **Revogar** credenciais atuais
4. Gerar novas credenciais
5. **NÃO** colocar no .env (vai para Edge Function)
6. Guardar em local seguro (1Password, Vault)

---

### 🟡 7. Fazer Backup do Banco (5 min)

**Passos:**
1. Supabase Dashboard > Database > Backups
2. "Create manual backup"
3. Nome: `backup-pre-rls-[DATA]`

---

## ✅ VERIFICAR SE TUDO FUNCIONOU

### Teste 1: RLS Ativado
```sql
SELECT COUNT(*) FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
-- Deve retornar: 11 ou mais
```

### Teste 2: Isolamento Multi-Tenant
```sql
-- Logar como usuário da Empresa 1
SELECT * FROM clientes;
-- Deve retornar APENAS clientes da empresa 1

-- Logar como usuário da Empresa 2
SELECT * FROM clientes;
-- Deve retornar APENAS clientes da empresa 2
```

### Teste 3: empresa_id Obrigatório
```sql
-- Tentar criar cliente sem empresa_id
INSERT INTO clientes (nome_completo, cpf, email) 
VALUES ('Teste', '123.456.789-00', 'teste@test.com');
-- Deve retornar ERRO: null value in column "empresa_id"
```

---

## 📊 IMPACTO NO CÓDIGO

**⚠️ BREAKING CHANGES:** Após executar, todo INSERT precisa incluir `empresa_id`.

**Solução:** Use o hook criado:

```typescript
import { useEmpresaId } from '../../shared/hooks/useEmpresaId'

function MeuComponente() {
  const { empresaId, loading } = useEmpresaId()
  
  const handleSubmit = async () => {
    await supabase.from('clientes').insert({
      nome: 'Cliente',
      empresa_id: empresaId // ✅ OBRIGATÓRIO
    })
  }
}
```

**Arquivos que precisarão atualização:**
- `src/features/clientes/CadastroCliente.tsx`
- `src/features/produtos/CadastroProduto.tsx`
- `src/features/vendas/NovaVenda.tsx`
- `src/features/vendas/vendasService.ts`

---

## 📚 DOCUMENTAÇÃO COMPLETA

- [CORRECAO_ERRO_RLS_EMPRESA_ID.md](./CORRECAO_ERRO_RLS_EMPRESA_ID.md) - Erro e solução detalhada
- [README_SEGURANCA.md](./README_SEGURANCA.md) - Índice de segurança
- [CORRECOES_APLICADAS.md](./CORRECOES_APLICADAS.md) - Resumo do que foi feito

---

**Última atualização:** 09/02/2026 às 00:30  
**Próximo passo:** Executar passos 1-7 acima

## 🟡 5. CRIAR SECRETS NO SUPABASE (Quando criar Edge Function)

**Quando:** Antes de deployar a Edge Function da Nuvem Fiscal

### Via Dashboard:
1. Supabase Dashboard > **Edge Functions**
2. **Secrets** (menu lateral)
3. Adicionar:
   - `NUVEM_FISCAL_CLIENT_ID` = `[novo_client_id_do_passo_2]`
   - `NUVEM_FISCAL_CLIENT_SECRET` = `[novo_client_secret_do_passo_2]`
   - `NUVEM_FISCAL_AMBIENTE` = `SANDBOX` (por enquanto)

### Via CLI (alternativa):
```bash
supabase secrets set NUVEM_FISCAL_CLIENT_ID="..."
supabase secrets set NUVEM_FISCAL_CLIENT_SECRET="..."
supabase secrets set NUVEM_FISCAL_AMBIENTE="SANDBOX"
```

---

## 📋 CHECKLIST DE AÇÕES IMEDIATAS

- [ ] ✅ Desativar emissão de NFe temporariamente
- [ ] ✅ Revogar credenciais antigas da Nuvem Fiscal
- [ ] ✅ Gerar novas credenciais (anotar em local seguro)
- [ ] ✅ Executar SQL de RLS no Supabase
- [ ] ✅ Verificar que RLS foi aplicado corretamente
- [ ] ✅ Fazer backup manual do banco de dados
- [ ] ✅ Comunicar equipe sobre manutenção temporária
- [ ] ⏳ Criar Edge Function (próximo passo)
- [ ] ⏳ Configurar secrets no Supabase
- [ ] ⏳ Testar em SANDBOX antes de produção

---

## 🚨 COMUNICADO PARA USUÁRIOS

**Sugestão de mensagem:**

```
🔧 Manutenção de Segurança

O módulo de emissão de NF-e está temporariamente indisponível 
para manutenção de segurança.

⏱️ Previsão: [XX horas/dias]

Outras funcionalidades do sistema continuam operando normalmente.

Agradecemos a compreensão!
```

---

## 📞 CONTATOS DE EMERGÊNCIA

**Suporte Nuvem Fiscal:**
- Email: suporte@nuvemfiscal.com.br
- Tel: (11) XXXX-XXXX

**Suporte Supabase:**
- https://supabase.com/support
- Discord: https://discord.supabase.com

---

## ✅ PRÓXIMOS PASSOS (Após ações imediatas)

1. Criar Edge Function para Nuvem Fiscal (4h)
2. Migrar frontend para usar Edge Function (4h)
3. Testar emissão em SANDBOX (2h)
4. Deploy para produção (1h)
5. Reativar módulo de NFe (5min)

**Tempo total estimado:** 11-12 horas

---

## 📊 STATUS

| Ação | Status | Data |
|------|--------|------|
| Desativar NFe | ⏳ Pendente | - |
| Revogar credenciais | ⏳ Pendente | - |
| Gerar novas credenciais | ⏳ Pendente | - |
| Executar RLS SQL | ⏳ Pendente | - |
| Backup banco | ⏳ Pendente | - |
| Criar Edge Function | ⏳ Pendente | - |
| Testes SANDBOX | ⏳ Pendente | - |
| Deploy produção | ⏳ Pendente | - |

---

**Data:** 09/02/2026  
**Prioridade:** 🔴 URGENTE  
**Última atualização:** Agora
