# 🏢 Sistema Multi-Empresa: Usuários com Acesso a Múltiplas Empresas

## 📋 Visão Geral

Implementamos um sistema completo para permitir que usuários tenham acesso a uma, várias ou todas as empresas do sistema.

---

## 🎯 Casos de Uso

### 1️⃣ Usuário com Acesso a UMA Empresa
**Exemplo:** Vendedor da loja A
- ✅ Acessa apenas produtos/clientes/vendas da empresa A
- ✅ No PDV, a empresa é automaticamente selecionada
- ✅ Não pode ver dados de outras empresas

### 2️⃣ Usuário com Acesso a VÁRIAS Empresas
**Exemplo:** Gerente regional com 3 lojas
- ✅ Acessa dados das 3 empresas na retaguarda
- ✅ No PDV, **precisa escolher qual empresa usar**
- ✅ Escolha fica gravada permanentemente no PDV

### 3️⃣ Usuário com Acesso a TODAS as Empresas
**Exemplo:** Administrador geral / Master
- ✅ Acessa dados de todas as empresas
- ✅ No PDV, **precisa escolher qual empresa usar**
- ✅ Pode reconfigurar o PDV para outra empresa a qualquer momento

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `users_empresas` (Novo!)
```sql
CREATE TABLE users_empresas (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  empresa_id BIGINT REFERENCES empresas(id),
  criado_em TIMESTAMP,
  UNIQUE(user_id, empresa_id)
);
```

**Relacionamento:** N:N (Muitos para Muitos)
- 1 usuário pode ter acesso a N empresas
- 1 empresa pode ser acessada por N usuários

### Visualização Rápida
```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│     usuarios     │         │ users_empresas   │         │     empresas     │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│ id (UUID)        │<───┐    │ id               │    ┌───>│ id               │
│ email            │    └────│ user_id (FK)     │    │    │ nome_fantasia    │
│ nome             │         │ empresa_id (FK)  │────┘    │ cnpj             │
│ cargo            │         └──────────────────┘         └──────────────────┘
└──────────────────┘
```

---

## 📝 Scripts SQL Criados

### 1. `criar_users_empresas.sql`
Script principal com:
- ✅ Criação da tabela `users_empresas`
- ✅ Migração de dados existentes (`usuarios.empresa_id`)
- ✅ Policies RLS
- ✅ Função `get_user_empresas()` para listar empresas do usuário
- ✅ View `vw_usuarios_empresas` para consultas
- ✅ Atualização de RLS de todas as tabelas

**Como usar:**
```sql
-- 1. Executar no SQL Editor do Supabase
-- Copie e cole todo o conteúdo de criar_users_empresas.sql

-- 2. Verificar se funcionou
SELECT * FROM vw_usuarios_empresas;
```

---

## 🖥️ Retaguarda (Sistema Web)

### Tela: Gerenciar Usuários

**Novidades:**
1. **Seção "Empresas com Acesso"**
   - Lista todas as empresas com checkboxes
   - Botões "Selecionar Todas" e "Desmarcar Todas"
   - Contador de empresas selecionadas
   - Feedback visual sobre o tipo de acesso

2. **Validação**
   - ⚠️ Obrigatório selecionar pelo menos 1 empresa
   - ✅ Mostra mensagem de sucesso após salvar

3. **Ao Criar Usuário:**
   ```
   1. Criar usuário no Supabase Auth
   2. Criar registro em usuarios
   3. Criar vínculos em users_empresas (N registros)
   ```

4. **Ao Editar Usuário:**
   ```
   1. Atualizar dados em usuarios
   2. Deletar vínculos antigos
   3. Inserir novos vínculos
   ```

**Screenshot Conceitual:**
```
┌─────────────────────────────────────────────────┐
│ Empresas com Acesso *                           │
├─────────────────────────────────────────────────┤
│ [Selecionar Todas] [Desmarcar Todas]  1 de 3   │
│                                                 │
│ ☑ CRESCI E PERDI                                │
│   Código: EMP001                                │
│                                                 │
│ ☐ Loja Centro                                   │
│   Código: EMP002                                │
│                                                 │
│ ☐ Loja Shopping                                 │
│   Código: EMP003                                │
│                                                 │
│ ✓ Usuário terá acesso apenas à empresa         │
│   selecionada                                   │
└─────────────────────────────────────────────────┘
```

---

## 📱 FLASH PDV (Electron App)

### Fluxo de Configuração Atualizado

**STEP 1:** Conexão Supabase  
**STEP 2:** Login com Email/Senha  
**STEP 3:** Seleção de Empresa ⭐ ATUALIZADO

### Mudanças no Step 3:

**Antes:**
```sql
SELECT * FROM empresas ORDER BY nome_fantasia;
-- Mostrava TODAS as empresas
```

**Agora:**
```sql
SELECT * FROM get_user_empresas();
-- Mostra APENAS empresas que o usuário tem acesso
```

### Comportamento Dinâmico:

#### Caso 1: Usuário com 1 empresa
```
✅ Empresa automaticamente selecionada
✅ Avança direto para o dashboard
```

#### Caso 2: Usuário com 2+ empresas
```
📋 Mostra lista de empresas
👆 Usuário clica na empresa desejada
💾 Vínculo permanente é gravado
```

#### Caso 3: Usuário Master
```
📋 Mostra lista de empresas
👆 Escolhe empresa
🔓 Botão ⚙️ aparece no dashboard
🔄 Pode trocar de empresa depois
```

**Exemplo de Tela:**
```
🏢 Selecionar Empresa
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Operador: Lucas Silva
📧 lucas@email.com • 💼 Gerente Regional
🏢 Você tem acesso a 3 empresas

┌───────────────────────────────────────┐
│ ◉ CRESCI E PERDI                      │
│ CNPJ: 27.767.670/0001-94              │
│ Código: EMP001                        │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ ○ Loja Centro                         │
│ CNPJ: 11.111.111/0001-11              │
│ Código: EMP002                        │
└───────────────────────────────────────┘

┌───────────────────────────────────────────┐
│ ○ Loja Shopping                           │
│ CNPJ: 22.222.222/0001-22                  │
│ Código: EMP003                            │
└───────────────────────────────────────────┘

🔓 Permissão Master: Você poderá trocar a 
   empresa vinculada posteriormente.

[← Voltar] [✅ Finalizar Configuração]
```

---

## 🧪 Como Testar

### Passo 1: Executar o SQL
```sql
-- No Supabase SQL Editor, executar:
-- database/criar_users_empresas.sql
```

### Passo 2: Criar Usuário de Teste

1. Acessar **Configurações → Gerenciar Usuários**
2. Clicar em **Novo Usuário**
3. Preencher dados:
   - Email: `teste@multiplas.com`
   - Senha: `teste123`
   - Nome: `Teste Multi-Empresa`
   - Cargo: `Gerente`
4. **Empresas com Acesso:**
   - Marcar 2 ou 3 empresas
5. Salvar

### Passo 3: Testar no PDV

1. Deletar config antiga:
   ```sql
   DELETE FROM config WHERE key = 'pdv_config';
   ```
2. Reiniciar FLASH PDV
3. Configurar conexão (Step 1)
4. Fazer login com `teste@multiplas.com` / `teste123`
5. **Verificar:** Aparecerão apenas as empresas selecionadas
6. Escolher uma empresa
7. Finalizar configuração

### Passo 4: Verificar Vínculos

```sql
-- Ver empresas do usuário teste
SELECT * FROM vw_usuarios_empresas 
WHERE email = 'teste@multiplas.com';

-- Ver quantas empresas cada usuário tem
SELECT 
  u.nome,
  u.email,
  COUNT(ue.empresa_id) as total_empresas,
  STRING_AGG(e.nome_fantasia, ', ') as empresas
FROM usuarios u
LEFT JOIN users_empresas ue ON ue.user_id = u.id
LEFT JOIN empresas e ON e.id = ue.empresa_id
GROUP BY u.id, u.nome, u.email
ORDER BY total_empresas DESC;
```

---

## 🔐 Segurança (RLS)

### Empresas Filtradas Automaticamente

**Antes:**
```sql
SELECT * FROM produtos;
-- Usuário via TODOS os produtos de TODAS as empresas ❌
```

**Agora:**
```sql
SELECT * FROM produtos;
-- RLS aplica automaticamente:
WHERE empresa_id IN (
  SELECT empresa_id FROM users_empresas WHERE user_id = auth.uid()
)
-- Usuário vê APENAS produtos das empresas que tem acesso ✅
```

### Tabelas Protegidas
- ✅ produtos
- ✅ clientes
- ✅ vendas
- ✅ vendas_itens
- ✅ colaboradores
- ✅ notas_fiscais
- ✅ todas as outras com `empresa_id`

---

## 📊 Cenários de Uso Real

### Cenário 1: Rede com 3 Lojas

**Usuários:**
```
┌──────────────┬────────────┬─────────────────────────┐
│ Nome         │ Cargo      │ Acesso                  │
├──────────────┼────────────┼─────────────────────────┤
│ João Master  │ Dono       │ Todas (EMP001,2,3)      │
│ Maria Loja A │ Gerente    │ Apenas EMP001           │
│ Pedro Loja B │ Gerente    │ Apenas EMP002           │
│ Ana Regional │ Supervisora│ EMP001 + EMP002         │
└──────────────┴────────────┴─────────────────────────┘
```

**No PDV:**
- João: escolhe qual loja operar
- Maria: já entra em EMP001 automaticamente
- Pedro: já entra em EMP002 automaticamente
- Ana: escolhe entre EMP001 ou EMP002

### Cenário 2: Administrador Multi-Tenant

**Usuário:** `admin@sistema.com`  
**Acesso:** TODAS as empresas do sistema  
**No PDV:** Pode configurar PDVs para qualquer empresa  
**Permissão Master:** SIM (pode trocar empresa)

---

## 🆘 Troubleshooting

### Erro: "Usuário não tem acesso a nenhuma empresa"

**Causa:** Usuário não tem vínculos em `users_empresas`

**Solução:**
```sql
-- Verificar vínculos do usuário
SELECT * FROM users_empresas WHERE user_id = 'UUID_DO_USUARIO';

-- Se  estiver vazio, adicionar manualmente:
INSERT INTO users_empresas (user_id, empresa_id)
VALUES ('UUID_DO_USUARIO', 1);
```

### PDV não mostra empresas

**Verificar:**
1. Função `get_user_empresas()` existe?
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'get_user_empresas';
   ```

2. RLS está ativo?
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'users_empresas';
   ```

3. Testar função manualmente:
   ```sql
   -- No SQL Editor, após fazer login
   SELECT * FROM get_user_empresas();
   ```

### Usuário vê dados de outras empresas

**Causa:** RLS não atualizado para usar `users_empresas`

**Solução:** Re-executar seção "PASSO 7" do script `criar_users_empresas.sql`

---

## 📈 Estatísticas

```sql
-- Relatório de acessos
SELECT 
  CASE 
    WHEN empresa_count = 1 THEN '1 empresa'
    WHEN empresa_count BETWEEN 2 AND 5 THEN '2-5 empresas'
    ELSE '6+ empresas'
  END as tipo_acesso,
  COUNT(*) as total_usuarios
FROM (
  SELECT 
    u.id,
    COUNT(ue.empresa_id) as empresa_count
  FROM usuarios u
  LEFT JOIN users_empresas ue ON ue.user_id = u.id
  GROUP BY u.id
) subquery
GROUP BY tipo_acesso
ORDER BY tipo_acesso;
```

---

## ✅ Checklist de Implementação

**Backend:**
- [x] Tabela `users_empresas` criada
- [x] Função `get_user_empresas()` criada
- [x] View `vw_usuarios_empresas` criada
- [x] RLS atualizado em todas as tabelas
- [x] Migração de dados existentes

**Retaguarda:**
- [x] Tela de gerenciar usuários atualizada
- [x] Seleção múltipla de empresas
- [x] Validação obrigatória
- [x] Salvar vínculos no banco

**PDV:**
- [x] Buscar empresas via `get_user_empresas()`
- [x] Seleção automática se só tiver 1 empresa
- [x] Contador de empresas disponíveis
- [x] Feedback visual de permissão Master

**Documentação:**
- [x] Script SQL documentado
- [x] Guia de uso criado
- [x] Troubleshooting incluído

---

## 🎯 Benefícios

✅ **Flexibilidade:** Usuário pode ter acesso a 1, várias ou todas empresas  
✅ **Segurança:** RLS garante isolamento automático  
✅ **Usabilidade:** Seleção automática quando possível  
✅ **Auditoria:** Registro de todos os vínculos  
✅ **Escalabilidade:** Funciona para 2 ou 200 empresas  
✅ **PDV Offline:** Vinculação permanente por PDV  

---

**Data:** 10 de fevereiro de 2026  
**Sistema:** FLASH PDV + Retaguarda  
**Status:** ✅ Implementado e pronto para produção
