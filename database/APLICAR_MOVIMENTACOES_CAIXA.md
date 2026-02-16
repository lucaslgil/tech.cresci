# Aplicar Movimentações de Caixa no Banco de Dados

## 📋 Scripts a serem aplicados (nesta ordem):

### 1. `criar_movimentacoes_caixa.sql`
✅ **O que faz:**
- Cria tabela `movimentacoes_caixa` com RLS multi-tenant
- Adiciona triggers de auditoria
- Cria funções: `abrir_caixa()`, `fechar_caixa()`, `status_caixa()`
- Configura políticas de segurança (RLS)
- Adiciona índices para performance

### 2. `adicionar_permissoes_movimentacoes_caixa.sql`
✅ **O que faz:**
- Adiciona 5 novas permissões ao sistema
- Concede permissões ao perfil MASTER automaticamente

---

## 🚀 Como Aplicar (Supabase Dashboard)

### **Opção 1: Via SQL Editor (RECOMENDADO)**

1. Acesse seu projeto no **Supabase Dashboard**
2. Vá em **SQL Editor** (menu lateral)
3. Clique em **New Query**
4. **Execute o primeiro script:**
   - Copie todo o conteúdo de `criar_movimentacoes_caixa.sql`
   - Cole no editor
   - Clique em **Run** ou pressione `Ctrl+Enter`
   - ✅ Aguarde mensagem de sucesso

5. **Execute o segundo script:**
   - Clique em **New Query** novamente
   - Copie todo o conteúdo de `adicionar_permissoes_movimentacoes_caixa.sql`
   - Cole no editor
   - Clique em **Run**
   - ✅ Aguarde mensagem de sucesso

---

### **Opção 2: Via psql (Terminal)**

Se você tiver as credenciais do banco:

```powershell
# Aplicar primeiro script
psql "postgresql://postgres:[SUA-SENHA]@[SEU-HOST]:5432/postgres" -f "database\criar_movimentacoes_caixa.sql"

# Aplicar segundo script
psql "postgresql://postgres:[SUA-SENHA]@[SEU-HOST]:5432/postgres" -f "database\adicionar_permissoes_movimentacoes_caixa.sql"
```

---

## ✅ Verificação

Após aplicar os scripts, verifique se tudo está OK:

```sql
-- 1. Verificar se a tabela foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'movimentacoes_caixa';

-- 2. Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'movimentacoes_caixa';

-- 3. Verificar funções criadas
SELECT proname 
FROM pg_proc 
WHERE proname IN ('abrir_caixa', 'fechar_caixa', 'status_caixa');

-- 4. Verificar permissões adicionadas
SELECT codigo, nome 
FROM permissoes_disponiveis 
WHERE codigo LIKE 'movimentacoes_caixa.%' OR codigo = 'caixa.abrir_fechar';
```

---

## 🎯 Resultado Esperado

Após aplicação bem-sucedida:

✅ Tabela `movimentacoes_caixa` criada  
✅ RLS configurado para multi-tenant  
✅ 3 funções criadas (abrir/fechar/status caixa)  
✅ 5 permissões adicionadas ao sistema  
✅ Perfis MASTER recebem permissões automaticamente  
✅ Sistema pronto para gravar movimentações de caixa  

---

## 🔗 Próximos Passos

Depois de aplicar os scripts:

1. ✅ Testar abertura de caixa na retaguarda ([/vendas/movimentacoes-caixa](src/features/vendas/MovimentacoesCaixa.tsx))
2. ⏳ Integrar F1 do PDV com a retaguarda
3. ⏳ Testar fluxo completo: PDV → Sync → Retaguarda

---

## 📝 Observações Importantes

- **Multi-tenant:** Todos os dados ficam isolados por `empresa_id`
- **Segurança:** RLS impede acesso entre empresas diferentes
- **Auditoria:** Todos os registros guardam usuário e data de criação
- **Soft Delete:** Registros não são deletados, apenas marcados (`deleted_at`)

---

**Data de criação:** 11/02/2026  
**Módulo:** Vendas > Movimentações de Caixa
