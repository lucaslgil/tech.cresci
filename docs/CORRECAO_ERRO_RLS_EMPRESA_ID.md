# ❌ ERRO: Column "empresa_id" does not exist

**Data:** 09/02/2026  
**Erro:** `ERROR: 42703: column "empresa_id" does not exist`  
**Local:** Ao executar [database/APLICAR_RLS_COMPLETO.sql](../database/APLICAR_RLS_COMPLETO.sql)

---

## 🔍 CAUSA DO ERRO

O arquivo SQL de RLS assume que **todas** as tabelas têm a coluna `empresa_id`, mas na realidade:

### ❌ Tabelas SEM `empresa_id`:
1. **`usuarios`** - não tem `empresa_id`
2. **`clientes`** - não tem `empresa_id`
3. **`produtos`** - não tem `empresa_id`
4. **`vendas`** - não tem `empresa_id`
5. **`vendas_itens`** - não tem `empresa_id`

### ✅ Tabelas COM `empresa_id`:
1. **`empresas`** - é a tabela mestre
2. **`colaboradores`** - tem `empresa_id BIGINT`
3. **`notas_fiscais`** - tem `empresa_id BIGINT`
4. **`operacoes_fiscais`** - tem `empresa_id BIGINT`
5. **`notas_fiscais_numeracao`** - tem `empresa_id BIGINT`

---

## ✅ SOLUÇÃO

Execute os scripts na ordem correta:

### **1️⃣ Adicionar `empresa_id` nas tabelas faltantes** (10 min)

```sql
-- Arquivo: database/ADICIONAR_EMPRESA_ID_TODAS_TABELAS.sql
-- Local: Supabase Dashboard > SQL Editor
```

**O que faz:**
- Adiciona coluna `empresa_id BIGINT` em: `usuarios`, `clientes`, `produtos`, `vendas`, `vendas_itens`
- Cria índices para performance
- Adiciona foreign keys para `empresas(id)`

---

### **2️⃣ Atualizar registros existentes** (5-15 min)

⚠️ **IMPORTANTE:** Se você já tem dados no banco, precisa vincular os registros existentes a uma empresa.

#### Se você tem **apenas 1 empresa**:

```sql
-- Pegar o ID da empresa
SELECT id, razao_social FROM empresas;

-- Atualizar todos os registros (substitua '1' pelo ID da sua empresa)
UPDATE usuarios SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE clientes SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE produtos SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE vendas SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE vendas_itens SET empresa_id = 1 WHERE empresa_id IS NULL;
```

#### Se você tem **múltiplas empresas**:

Precisa definir lógica específica. Exemplos:

```sql
-- Opção A: Vincular por created_by
UPDATE clientes c
SET empresa_id = u.empresa_id
FROM usuarios u
WHERE c.created_by = u.id AND c.empresa_id IS NULL;

-- Opção B: Vincular vendas através da venda_id em vendas_itens
UPDATE vendas_itens vi
SET empresa_id = v.empresa_id
FROM vendas v
WHERE vi.venda_id = v.id AND vi.empresa_id IS NULL;
```

---

### **3️⃣ Tornar `empresa_id` obrigatório** (1 min)

⚠️ Execute **SOMENTE DEPOIS** de garantir que todos os registros têm `empresa_id`:

```sql
-- Verificar se há registros sem empresa_id
SELECT 'usuarios' as tabela, COUNT(*) as sem_empresa FROM usuarios WHERE empresa_id IS NULL
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes WHERE empresa_id IS NULL
UNION ALL
SELECT 'produtos', COUNT(*) FROM produtos WHERE empresa_id IS NULL
UNION ALL
SELECT 'vendas', COUNT(*) FROM vendas WHERE empresa_id IS NULL;

-- Se todos retornarem 0, pode executar:
ALTER TABLE usuarios ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE clientes ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE produtos ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE vendas ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE vendas_itens ALTER COLUMN empresa_id SET NOT NULL;
```

---

### **4️⃣ Aplicar RLS corrigido** (2 min)

```sql
-- Arquivo: database/APLICAR_RLS_CORRIGIDO.sql
-- Local: Supabase Dashboard > SQL Editor
```

**O que faz:**
- Habilita RLS em 11 tabelas
- Cria 40+ políticas de isolamento por empresa
- Garante que usuários só acessem dados da própria empresa

---

## 🧪 TESTAR RLS

### Teste 1: Verificar se RLS está ativado

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('usuarios', 'clientes', 'produtos', 'vendas', 'notas_fiscais')
ORDER BY tablename;

-- Todas devem retornar rowsecurity = true
```

### Teste 2: Testar isolamento entre empresas

```sql
-- 1. Criar empresa de teste
INSERT INTO empresas (codigo, razao_social, nome_fantasia, cnpj, email, telefone, cep, endereco, numero, cidade, estado)
VALUES ('EMP002', 'Empresa Teste 2', 'Teste 2', '12.345.678/0001-99', 'teste2@test.com', '11999999999', '01310-000', 'Av Paulista', '1000', 'São Paulo', 'SP')
RETURNING id;

-- 2. Criar usuário para Empresa 2 (substitua user_uuid e empresa_id)
INSERT INTO usuarios (id, email, nome, empresa_id)
VALUES ('UUID_DO_USUARIO', 'usuario2@teste.com', 'Usuário Teste 2', ID_DA_EMPRESA_2);

-- 3. Logar como usuário da Empresa 1 e executar:
SELECT * FROM clientes;
-- Deve retornar APENAS clientes da empresa 1

-- 4. Logar como usuário da Empresa 2 e executar:
SELECT * FROM clientes;
-- Deve retornar APENAS clientes da empresa 2

-- ✅ Se funcionar: RLS está correto!
-- ❌ Se ver dados de outra empresa: RLS não está funcionando
```

---

## 📊 IMPACTO NO CÓDIGO FRONTEND

### ⚠️ BREAKING CHANGES:

Após executar os scripts acima, **TODOS** os inserts/updates no frontend precisarão incluir `empresa_id`:

#### Antes (❌ VAI FALHAR):
```typescript
await supabase.from('clientes').insert({
  nome_completo: 'João Silva',
  cpf: '123.456.789-00',
  email: 'joao@email.com'
})
```

#### Depois (✅ CORRETO):
```typescript
// Pegar empresa_id do usuário logado
const { data: usuario } = await supabase
  .from('usuarios')
  .select('empresa_id')
  .eq('id', user.id)
  .single()

await supabase.from('clientes').insert({
  nome_completo: 'João Silva',
  cpf: '123.456.789-00',
  email: 'joao@email.com',
  empresa_id: usuario.empresa_id // ✅ OBRIGATÓRIO
})
```

### 📝 Arquivos que precisarão ser atualizados:

1. **Cadastro de Clientes:**
   - [src/features/clientes/CadastroCliente.tsx](../src/features/clientes/CadastroCliente.tsx)
   
2. **Cadastro de Produtos:**
   - [src/features/produtos/CadastroProduto.tsx](../src/features/produtos/CadastroProduto.tsx)

3. **Vendas:**
   - [src/features/vendas/NovaVenda.tsx](../src/features/vendas/NovaVenda.tsx)
   - [src/features/vendas/vendasService.ts](../src/features/vendas/vendasService.ts)

4. **Outras operações:** Qualquer código que faz INSERT/UPDATE em:
   - `clientes`
   - `produtos`
   - `vendas`
   - `vendas_itens`

---

## 🎯 PRÓXIMOS PASSOS

### Fase 1 - URGENTE (15 min):
- [ ] Executar [database/ADICIONAR_EMPRESA_ID_TODAS_TABELAS.sql](../database/ADICIONAR_EMPRESA_ID_TODAS_TABELAS.sql)
- [ ] Atualizar registros existentes com empresa_id
- [ ] Tornar empresa_id NOT NULL
- [ ] Executar [database/APLICAR_RLS_CORRIGIDO.sql](../database/APLICAR_RLS_CORRIGIDO.sql)
- [ ] Testar RLS com 2 empresas

### Fase 2 - ATUALIZAÇÃO FRONTEND (4-6 horas):
- [ ] Criar hook `useEmpresaId()` para pegar empresa do usuário logado
- [ ] Atualizar CadastroCliente para incluir empresa_id
- [ ] Atualizar CadastroProduto para incluir empresa_id
- [ ] Atualizar NovaVenda para incluir empresa_id
- [ ] Atualizar vendasService para incluir empresa_id em todos os inserts
- [ ] Testar criação de clientes/produtos/vendas

### Fase 3 - VALIDAÇÃO (1 hora):
- [ ] Criar 2 empresas de teste
- [ ] Criar 2 usuários (1 por empresa)
- [ ] Testar isolamento: Empresa A não vê dados da Empresa B
- [ ] Testar operações CRUD em todas as tabelas
- [ ] Documentar qualquer problema encontrado

---

## 📚 REFERÊNCIAS

- [ADICIONAR_EMPRESA_ID_TODAS_TABELAS.sql](../database/ADICIONAR_EMPRESA_ID_TODAS_TABELAS.sql) - Adiciona empresa_id
- [APLICAR_RLS_CORRIGIDO.sql](../database/APLICAR_RLS_CORRIGIDO.sql) - RLS corrigido
- [Documentação RLS Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-tenancy Guide](https://supabase.com/docs/guides/auth/row-level-security#multi-tenancy)

---

**Última atualização:** 09/02/2026 às 00:15  
**Status:** ⏳ Aguardando execução dos scripts SQL
