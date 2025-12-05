# 🚀 Guia Rápido: Configurar Usuários no Sistema

## ✅ Ordem de Execução dos Scripts SQL

Execute os scripts **nesta ordem exata** no Supabase SQL Editor:

---

### **1️⃣ Criar a Tabela Usuarios**
📄 **Arquivo:** `criar_tabela_usuarios.sql`

```sql
-- Executa o script completo
-- Cria tabela, índices e triggers
```

**O que faz:**
- ✅ Cria tabela `usuarios` vinculada ao `auth.users`
- ✅ Adiciona índices para performance
- ✅ Cria triggers para auto-inserção e update de timestamp
- ✅ **Não habilita RLS** (evita recursão infinita)

---

### **2️⃣ Desabilitar RLS (caso já tenha criado antes)**
📄 **Arquivo:** `recriar_politicas_rls_usuarios.sql`

```sql
-- Remove políticas antigas e desabilita RLS
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
```

**O que faz:**
- ✅ Remove todas as políticas RLS antigas
- ✅ Desabilita RLS para evitar erro de recursão infinita

---

### **3️⃣ Popular com Usuários Existentes**
📄 **Arquivo:** `popular_usuarios_existentes.sql`

```sql
-- Sincroniza auth.users com public.usuarios
INSERT INTO public.usuarios (id, email, nome, ativo, permissoes)
SELECT ...
```

**O que faz:**
- ✅ Copia todos os usuários de `auth.users` para `usuarios`
- ✅ Define permissões = false para todos
- ✅ Define ativo = true para todos
- ✅ Idempotente (pode executar várias vezes)

**Resultado esperado:**
```
Usuários inseridos: 2
```

---

### **4️⃣ Dar Permissões ao Administrador**
📄 **Arquivo:** `dar_permissoes_admin.sql`

```sql
UPDATE public.usuarios 
SET permissoes = '{"cadastro_empresa": true, ...}'::jsonb,
    nome = 'Paulo Pinheiro',
    cargo = 'Administrador do Sistema'
WHERE email = 'paulo.pinheiro@crescieperdi.com.br';
```

**O que faz:**
- ✅ Dá todas as permissões ao usuário admin
- ✅ Atualiza nome e cargo

**Resultado esperado:**
```
1 row affected
```

---

## 🎯 Verificação Final

Execute esta query para confirmar:

```sql
SELECT 
  email,
  nome,
  cargo,
  ativo,
  permissoes->>'configuracoes' as tem_acesso_config
FROM public.usuarios
ORDER BY created_at;
```

**Resultado esperado:**

| email | nome | cargo | ativo | tem_acesso_config |
|-------|------|-------|-------|-------------------|
| paulo.pinheiro@crescieperdi.com.br | Paulo Pinheiro | Administrador do Sistema | true | **true** ✅ |
| suporte.ti@crescieperdi.com.br | suporte.ti@... | null | true | false |

---

## 🖥️ Testar no Sistema

1. **Recarregue a página** do sistema
2. Acesse: `http://localhost:5173/configuracoes`
3. Clique na aba **"Usuários"**
4. Você deve ver **2 usuários** listados! 🎉

---

## 🔧 Troubleshooting

### ❌ Erro: "relation usuarios does not exist"
➡️ Execute o script **1️⃣** `criar_tabela_usuarios.sql`

### ❌ Erro: "Infinite recursion detected"
➡️ Execute o script **2️⃣** `recriar_politicas_rls_usuarios.sql`

### ❌ Tela vazia, sem usuários
➡️ Execute o script **3️⃣** `popular_usuarios_existentes.sql`

### ❌ "Erro ao carregar usuários"
➡️ Verifique no console do navegador (F12) qual o erro exato
➡️ Pode ser problema de autenticação ou conexão com Supabase

---

## 📝 Resumo dos Arquivos

| Arquivo | Quando Usar |
|---------|-------------|
| `criar_tabela_usuarios.sql` | **1ª vez** - Criar estrutura completa |
| `recriar_politicas_rls_usuarios.sql` | Corrigir problema de RLS |
| `popular_usuarios_existentes.sql` | Sincronizar usuários do auth.users |
| `dar_permissoes_admin.sql` | Dar permissões ao admin |
| `adicionar_permissoes_usuarios.sql` | ❌ Não usar (substituído pelos acima) |

---

## ✅ Checklist

- [ ] Script 1 executado: `criar_tabela_usuarios.sql`
- [ ] Script 2 executado: `recriar_politicas_rls_usuarios.sql`
- [ ] Script 3 executado: `popular_usuarios_existentes.sql`
- [ ] Script 4 executado: `dar_permissoes_admin.sql`
- [ ] Verificação executada: 2 usuários aparecem na query
- [ ] Página recarregada no navegador
- [ ] Tela /configuracoes acessada
- [ ] Aba "Usuários" exibe os 2 usuários

---

**Pronto!** Agora o sistema de usuários está funcionando completamente! 🚀
