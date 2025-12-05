# Sistema de Abas (Tabs) - Documentação

## ✅ IMPLEMENTADO COM SUCESSO

O sistema de navegação por abas foi implementado com sucesso, permitindo que múltiplas páginas fiquem abertas simultaneamente, similar a um navegador.

## 📋 Características

### ✨ Funcionalidades
- **Múltiplas abas abertas** ao mesmo tempo
- **Navegação rápida** entre abas sem perder contexto
- **Botão X** para fechar abas individuais
- **Aba ativa** visualmente destacada
- **Cores do sistema** (#394353 - mesma do menu lateral)
- **Ícones** para cada tipo de tela
- **Persistência** do estado ao trocar abas

### 🎨 Design
- **Barra horizontal** no topo (abaixo do cabeçalho mobile)
- **Cor de fundo**: #394353 (mesma do menu)
- **Aba ativa**: fundo branco com texto escuro
- **Abas inativas**: fundo #394353 com texto branco
- **Hover**: efeito de destaque (#4a5463)
- **Scroll horizontal**: quando muitas abas abertas

## 🔧 Arquitetura

### Arquivos Criados

1. **`src/shared/context/TabsContext.tsx`**
   - Context API para gerenciar estado das abas
   - Funções: `openTab`, `closeTab`, `switchTab`, `closeAllTabs`

2. **`src/shared/components/TabBar.tsx`**
   - Componente visual da barra de abas
   - Renderiza abas com títulos, ícones e botão fechar

3. **`src/shared/hooks/useTabOpener.tsx`**
   - Hook helper para abrir abas facilmente
   - Pré-configurado com todas as rotas do sistema

### Integração

**App.tsx:**
```tsx
<TabsProvider>
  <Routes>
    {/* rotas */}
  </Routes>
</TabsProvider>
```

**Layout.tsx:**
```tsx
<TabBar /> {/* Renderiza barra de abas */}
```

## 📖 Como Usar

### No Menu Lateral

Os links do menu agora abrem abas automaticamente:

```tsx
const tabs = useTabOpener()

// Ao clicar no menu:
<button onClick={() => tabs.cadastroProdutos()}>
  Produtos
</button>
```

### Em Qualquer Componente

```tsx
import { useTabOpener } from '@/shared/hooks/useTabOpener'

function MeuComponente() {
  const tabs = useTabOpener()
  
  return (
    <button onClick={() => tabs.cadastroClientes()}>
      Abrir Cadastro de Clientes
    </button>
  )
}
```

### Gerenciamento Direto

```tsx
import { useTabs } from '@/shared/context/TabsContext'

function MeuComponente() {
  const { openTab, closeTab, closeAllTabs } = useTabs()
  
  // Abrir aba customizada
  openTab({
    title: 'Minha Tela',
    path: '/minha-rota',
    icon: <Icon />
  })
  
  // Fechar aba específica
  closeTab('tab-id')
  
  // Fechar todas
  closeAllTabs()
}
```

## 🎯 Abas Disponíveis

### Cadastros
- `tabs.cadastroEmpresa()` - Cadastro de Empresa
- `tabs.cadastroColaborador()` - Cadastro de Colaboradores
- `tabs.cadastroProdutos()` - Cadastro de Produtos
- `tabs.cadastroClientes()` - Cadastro de Clientes
- `tabs.listagemClientes()` - Listagem de Clientes

### Inventário
- `tabs.cadastroItem()` - Cadastrar Item
- `tabs.relatorioItens()` - Relatório de Itens
- `tabs.linhasTelefonicas()` - Linhas Telefônicas

### Vendas
- `tabs.novaVenda()` - Nova Venda
- `tabs.listagemVendas()` - Listagem de Vendas
- `tabs.relatoriosVendas()` - Relatórios de Vendas

### Notas Fiscais
- `tabs.emitirNotaFiscal()` - Emitir Nota Fiscal
- `tabs.parametrosFiscais()` - Parâmetros Fiscais

### Financeiro
- `tabs.contasPagar()` - Contas a Pagar
- `tabs.contasReceber()` - Contas a Receber
- `tabs.parametrosFinanceiros()` - Parâmetros Financeiros

### Outros
- `tabs.franquias()` - Franquias
- `tabs.tarefas()` - Tarefas
- `tabs.configuracoes()` - Configurações
- `tabs.documentacao()` - Documentação

## 🚀 Comportamento

1. **Clicar no menu**: Abre nova aba (ou ativa se já existir)
2. **Clicar na aba**: Troca para aquela tela
3. **Clicar no X**: Fecha a aba
4. **Fechar aba ativa**: Sistema ativa a aba anterior
5. **Fechar última aba**: Volta ao Dashboard

## 🎨 Exemplo Visual

```
┌─────────────────────────────────────────────────────────┐
│ [Produtos X] [Clientes X] [Vendas X]                    │ ← Barra de Abas
├─────────────────────────────────────────────────────────┤
│                                                          │
│                  CONTEÚDO DA ABA ATIVA                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## ✅ Status

- ✅ Context implementado
- ✅ Barra visual criada
- ✅ Integração com menu
- ✅ Ícones configurados
- ✅ Cores do sistema aplicadas
- ✅ Botão fechar funcionando
- ✅ Navegação entre abas
- ✅ Fechamento inteligente

## 📝 Próximas Melhorias Possíveis

- [ ] Salvar abas abertas no localStorage
- [ ] Arrastar para reordenar abas
- [ ] Atalhos de teclado (Ctrl+W, Ctrl+Tab)
- [ ] Limite máximo de abas abertas
- [ ] Menu de contexto (botão direito na aba)

---

**Data de Implementação**: 05/12/2025  
**Desenvolvido por**: GitHub Copilot + Lucas
