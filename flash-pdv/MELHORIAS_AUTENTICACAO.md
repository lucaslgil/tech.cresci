# 🔐 Melhorias no Fluxo de Autenticação do FLASH PDV

## 📋 Mudanças Implementadas

### 🎯 Objetivo
Melhorar a vinculação da empresa ao PDV com autenticação real e controle de permissões.

---

## 🔄 Fluxo Anterior vs Novo

### ❌ ANTES (Manual e Inseguro):
```
1. Informar URL + Key do Supabase
2. Digitar manualmente:
   - ID da empresa (número)
   - Nome da empresa  
   - UUID do usuário (copiar/colar)
   - Nome do operador
```

**Problemas:**
- ✗ Sem autenticação real
- ✗ Dados manuais propensos a erros
- ✗ Qualquer um pode configurar qualquer empresa
- ✗ Não há controle de permissão

---

### ✅ AGORA (Autenticado e Seguro):
```
1️⃣ Informar URL + Key do Supabase
2️⃣ Login com Email + Senha (autenticação real)
3️⃣ Selecionar empresa disponível (lista automática)
```

**Benefícios:**
- ✓ Autenticação real via Supabase Auth
- ✓ Dados puxados automaticamente do banco
- ✓ Apenas empresas permitidas aparecem
- ✓ Controle de permissão Master/Restrita
- ✓ UX muito melhor

---

## 📝 Detalhes Técnicos

### Interface ConfigPDV Atualizada

```typescript
interface ConfigPDV {
  // Conexão
  supabaseUrl: string
  supabaseKey: string
  
  // Empresa vinculada
  empresaId: number
  empresaNome: string
  
  // Usuário autenticado
  usuarioId: string  // UUID do Supabase Auth
  usuarioEmail: string
  usuarioNome: string
  usuarioCargo: string
  
  // Permissões
  permissaoMaster: boolean  // Pode trocar empresa vinculada
}
```

---

## 🔐 Controle de Permissões

### Usuário Master (pode trocar empresa):
✅ Cargo contém "Admin" ou "Master"  
✅ Ou não tem `empresa_id` específica (acesso múltiplas empresas)

**Identificação:**
```tsx
const permissaoMaster = 
  usuario.cargo?.includes('admin') ||
  usuario.cargo?.includes('master') ||
  !usuario.empresa_id
```

### Usuário Restrito (não pode trocar):
🔒 Tem `empresa_id` específica  
🔒 Cargo não é Admin/Master  
🔒 Botão de reconfiguração **oculto** no dashboard

---

## 🏗️ Arquivos Modificados

### 1. `src/types/electron.d.ts`
```typescript
export interface ConfigPDV {
  supabaseUrl: string
  supabaseKey: string
  empresaId: number
  empresaNome: string
  usuarioId: string  
  usuarioEmail: string       // ← NOVO
  usuarioNome: string        // ← NOVO
  usuarioCargo: string       // ← NOVO
  permissaoMaster: boolean   // ← NOVO
}
```

### 2. `src/components/ConfiguracaoInicial.tsx`
- ✅ 3 steps de configuração (antes 2)
- ✅ Step 2: Login com email/senha
- ✅ Step 3: Seleção visual de empresas
- ✅ Busca automática de empresas via RLS
- ✅ Detecção de permissão Master
- ✅ Avisos visuais sobre permissões

### 3. `src/App.tsx`
- ✅ Atualizado para novos campos da interface
- ✅ Exibe `usuarioNome` em vez de `nomeOperador`
- ✅ Botão ⚙️ só aparece se `permissaoMaster === true`

---

## 📱 Fluxo de Telas

### STEP 1: Conexão Supabase
```
🔗 Conectar com Retaguarda
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 URL do Supabase: [input]
🔑 Anon Public Key: [textarea]

[🚀 Testar e Continuar]
```

### STEP 2: Login
```
🔐 Fazer Login
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: [input]
🔒 Senha: [input]

[← Voltar] [✅ Fazer Login]
```

### STEP 3: Seleção de Empresa
```
🏢 Selecionar Empresa
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Operador: Lucas Silva
📧 lucas@email.com • 💼 Vendedor

┌─────────────────────────┐
│ ◉ CRESCI E PERDI        │
│ 27.767.670/0001-94      │
│ Código: EMP001          │
└─────────────────────────┘

🔓 Permissão Master: Você poderá trocar 
   a empresa vinculada posteriormente.

[← Voltar] [✅ Finalizar Configuração]
```

---

## 🔒 Segurança Multi-Tenant

### Como funciona o RLS:
1. Usuário faz login → Supabase Auth gera sessão
2. Backend identifica `auth.uid()` em cada query
3. RLS filtra dados: `WHERE empresa_id = get_user_empresa_id()`
4. PDV **só vê empresas permitidas**

### Exemplo prático:
```sql
-- Usuário ID: e87f9555-a68b-46db-b5fd-94cf7f1cba19
-- Empresa: 4 (CRESCI E PERDI)

SELECT * FROM empresas;
-- RLS retorna APENAS empresa 4

SELECT * FROM usuarios;  
-- RLS retorna APENAS usuário e87f9555-...
```

---

## 🎨 Melhorias de UX

### Visual de Seleção de Empresa
```tsx
{empresasDisponiveis.map(empresa => (
  <button 
    className={empresaSelecionada?.id === empresa.id 
      ? 'border-flash-dark bg-flash-dark/5'  // Selecionada
      : 'border-gray-200 hover:border-flash-light'
    }
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="font-bold">{empresa.nome_fantasia}</p>
        <p className="text-xs">CNPJ: {empresa.cnpj}</p>
      </div>
      <div className="w-5 h-5 rounded-full">
        {selecionada && <CheckIcon />}
      </div>
    </div>
  </button>
))}
```

### Indicador de Permissão
```tsx
{permissaoMaster ? (
  <div className="bg-green-50 border-green-200">
    🔓 Permissão Master: Pode trocar empresa
  </div>
) : (
  <div className="bg-yellow-50 border-yellow-200">
    🔒 Permissão Restrita: Vinculação permanente
  </div>
)}
```

---

## 🧪 Como Testar

### Cenário 1: Usuário Master
1. Fazer login com admin/master
2. Verá todas as empresas cadastradas
3. Escolher qualquer uma
4. Dashboard exibe botão ⚙️ de reconfiguração

### Cenário 2: Usuário Restrito
1. Fazer login com vendedor comum
2. Verá apenas sua empresa (ou empresas permitidas)
3. Escolher empresa
4. Dashboard **NÃO** exibe botão ⚙️

### Cenário 3: Trocar Empresa (Master)
1. No dashboard, clicar botão ⚙️
2. Fazer login novamente
3. Selecionar outra empresa
4. PDV passa a trabalhar com nova empresa

---

## ⚡ Próximos Passos

1. ✅ **Concluído:** Autenticação real
2. ✅ **Concluído:** Seleção de empresa
3. ✅ **Concluído:** Controle de permissões
4. ⏳ **Pendente:** Testar sincronização com nova estrutura
5. ⏳ **Pendente:** Desenvolver tela de vendas
6. ⏳ **Pendente:** Implementar busca de produtos

---

## 📊 Comparativo de Dados Salvos

### ANTES:
```json
{
  "supabaseUrl": "https://xxx.supabase.co",
  "supabaseKey": "eyJ...",
  "empresaId": 4,
  "empresaNome": "CRESCI E PERDI",
  "usuarioId": "e87f9555-...",
  "nomeOperador": "Lucas"
}
```

### AGORA:
```json
{
  "supabaseUrl": "https://xxx.supabase.co",
  "supabaseKey": "eyJ...",
  "empresaId": 4,
  "empresaNome": "CRESCI E PERDI",
  "usuarioId": "e87f9555-...",
  "usuarioEmail": "lucas@email.com",    // ← NOVO
  "usuarioNome": "Lucas Silva",         // ← NOVO
  "usuarioCargo": "Vendedor",           // ← NOVO
  "permissaoMaster": false              // ← NOVO
}
```

---

## 🎯 Resultado Final

✅ **Segurança:** Autenticação real obrigatória  
✅ **Usabilidade:** Menos digitação manual  
✅ **Controle:** Permissões Master/Restrita  
✅ **Multi-tenant:** RLS garante isolamento  
✅ **UX:** Seleção visual de empresas  
✅ **Auditoria:** Email e cargo registrados  

---

**Data:** 10 de fevereiro de 2026  
**Sistema:** FLASH PDV v1.0.0  
**Status:** ✅ Implementado e pronto para testes
