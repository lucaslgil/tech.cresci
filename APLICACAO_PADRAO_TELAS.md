# Aplicação do Padrão de Interface nas Telas
**Data:** 04/12/2025

## ✅ Telas Já Padronizadas

1. ✅ `/vendas` - NovaVenda.tsx
2. ✅ `/vendas` - ListagemVendas.tsx  
3. ✅ `/cadastro/empresa` - CadastroEmpresa.tsx
4. ✅ `/financeiro/parametros` - ParametrosContasReceber.tsx

## 📋 Telas Pendentes de Padronização

### 1. Colaborador
**Arquivo:** `src/features/colaboradores/CadastroColaborador.tsx`

**Alterações necessárias:**
- Container: `min-h-screen bg-gray-50 p-4`
- Título: `text-base font-semibold`
- Subtítulo: `text-xs text-gray-600`
- Botões: cor `#394353`
- Tabela: cabeçalho `#394353`, células `text-xs`, padding `px-4 py-2.5`
- Inputs: bordas `#C9C4B5`, `text-sm`
- Modal: seguir padrão definido

### 2. Produtos
**Arquivo:** `src/features/produtos/CadastroProdutos.tsx`

**Alterações necessárias:**
- Mesmas alterações do padrão
- Atenção especial para campos de preço e estoque
- Tabela de produtos com cores padronizadas

### 3. Clientes
**Arquivos:** 
- `src/features/clientes/ListagemClientes.tsx`
- `src/features/clientes/CadastroClientes.tsx`

**Alterações necessárias:**
- Listagem: tabela com padrão #394353
- Formulário: inputs com bordas #C9C4B5
- Botões de ação: cor #394353

### 4. Linhas Telefônicas
**Arquivo:** `src/features/linhas/LinhasTelefonicas.tsx` (verificar nome)

**Alterações necessárias:**
- Tabela de linhas com padrão
- Formulário de cadastro/edição
- Botões de importação

### 5. Tarefas
**Arquivo:** `src/features/tarefas/Tarefas.tsx` (verificar nome)

**Alterações necessárias:**
- Cards de tarefas
- Filtros e busca
- Modal de criação/edição

## 🔧 Checklist de Aplicação

Para cada tela, aplicar:

### 1. Container Principal
```tsx
// ANTES
<div className="p-6">

// DEPOIS
<div className="min-h-screen bg-gray-50 p-4">
```

### 2. Título e Cabeçalho
```tsx
// ANTES
<h1 className="text-2xl font-bold text-gray-900">
  <Icon className="w-8 h-8 text-blue-600" />

// DEPOIS
<h1 className="text-base font-semibold text-gray-900">
  <Icon className="w-5 h-5" style={{ color: '#394353' }} />
```

### 3. Botão Principal
```tsx
// ANTES
className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"

// DEPOIS
style={{ backgroundColor: '#394353' }}
className="hover:opacity-90 text-white px-6 py-2.5 rounded-md text-sm font-semibold shadow-sm transition-all"
```

### 4. Cabeçalho de Tabela
```tsx
// ANTES
<thead className="bg-gray-50">
  <th className="px-6 py-3 text-xs text-gray-500">

// DEPOIS
<thead style={{ backgroundColor: '#394353' }}>
  <th className="px-4 py-2.5 text-xs font-semibold text-white">
```

### 5. Células de Tabela
```tsx
// ANTES
<td className="px-6 py-4 text-sm">

// DEPOIS
<td className="px-4 py-2.5 text-xs">
```

### 6. Inputs
```tsx
// ANTES
className="border border-gray-300 focus:ring-blue-500"

// DEPOIS
className="border focus:ring-2 focus:border-transparent text-sm"
style={{ borderColor: '#C9C4B5' }}
```

### 7. Modal
```tsx
// Header do Modal
<div 
  className="flex justify-between items-center mb-4 pb-3" 
  style={{ borderBottomWidth: '2px', borderBottomColor: '#C9C4B5' }}
>
  <h3 className="text-base font-bold">Título</h3>
</div>

// Grid de campos
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">

// Footer do Modal
<div 
  className="flex justify-end space-x-3 pt-3" 
  style={{ borderTopWidth: '2px', borderTopColor: '#C9C4B5' }}
>
```

## 🎯 Busca e Substituição Global

### Substituições Seguras via PowerShell

```powershell
# Substituir cor azul antiga por nova
(Get-Content "caminho/arquivo.tsx") -replace 'bg-blue-600','#394353 (verificar contexto)' | Set-Content "caminho/arquivo.tsx"

# Substituir padding de tabela
(Get-Content "caminho/arquivo.tsx") -replace 'px-6 py-4','px-4 py-2.5' | Set-Content "caminho/arquivo.tsx"

# Substituir tamanho de fonte de tabela
(Get-Content "caminho/arquivo.tsx") -replace 'text-sm','text-xs (verificar contexto)' | Set-Content "caminho/arquivo.tsx"
```

⚠️ **ATENÇÃO:** Sempre verificar manualmente após substituições automáticas!

## 📊 Progresso

- [ ] Colaborador
- [ ] Produtos
- [ ] Clientes (Listagem)
- [ ] Clientes (Cadastro)
- [ ] Linhas Telefônicas
- [ ] Tarefas
- [ ] Dashboard (revisar)
- [ ] Inventário/Itens
- [ ] Notas Fiscais (se existir)

## 🚀 Próximos Passos

1. Aplicar alterações em cada arquivo individualmente
2. Testar cada tela após alteração
3. Verificar responsividade
4. Marcar como concluído
5. Documentar mudanças específicas se necessário

## 💡 Dicas

- Use VS Code Find & Replace com regex para facilitar
- Teste uma tela por vez
- Mantenha um backup antes de alterações em massa
- Consulte `PADRAO_INTERFACE_SISTEMA.md` para dúvidas
- Verifique console do browser para erros após cada alteração

---

**Documento criado em:** 04/12/2025  
**Status:** Padrão documentado, aguardando aplicação nas telas pendentes
