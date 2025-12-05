# Sistema de Permissões - Implementação Completa

## 📋 Visão Geral

O sistema de permissões foi implementado para controlar o acesso dos usuários às diferentes funcionalidades do sistema. Cada usuário pode ter permissões específicas configuradas através da tela de Configurações > Usuários.

## 🔧 Componentes Implementados

### 1. Hook `usePermissions`
**Localização:** `src/shared/hooks/usePermissions.tsx`

Hook personalizado que gerencia as permissões do usuário logado.

**Funções disponíveis:**
- `hasPermission(permissao)` - Verifica se usuário tem uma permissão específica
- `hasAnyPermission([permissoes])` - Verifica se usuário tem pelo menos uma das permissões
- `hasAllPermissions([permissoes])` - Verifica se usuário tem todas as permissões
- `permissoes` - Objeto com todas as permissões do usuário
- `loading` - Estado de carregamento

### 2. Atualização do Layout
**Localização:** `src/shared/components/Layout.tsx`

O menu lateral agora verifica as permissões antes de exibir cada item. Os menus são ocultados automaticamente se o usuário não tiver permissão.

### 3. Gerenciamento de Usuários
**Localização:** `src/features/configuracoes/GerenciarUsuarios.tsx`

Modal de edição de usuários com todas as permissões organizadas por grupos.

## 📦 Permissões Disponíveis

### CADASTROS
- `cadastro_empresa` - Cadastro de Empresa
- `cadastro_colaborador` - Cadastro de Colaborador
- `cadastro_produtos` - Cadastro de Produtos
- `cadastro_clientes` - Cadastro de Clientes

### INVENTÁRIO
- `inventario_itens` - Inventário - Itens
- `inventario_relatorio` - Inventário - Relatórios
- `inventario_linhas` - Inventário - Linhas Telefônicas

### VENDAS
- `vendas_listagem` - Vendas - Listagem
- `vendas_nova` - Vendas - Nova Venda
- `vendas_relatorios` - Vendas - Relatórios

### NOTAS FISCAIS
- `notas_fiscais_emitir` - Emitir Nota Fiscal
- `notas_fiscais_parametros` - Parâmetros Fiscais

### FINANCEIRO
- `financeiro_contas_pagar` - Contas a Pagar
- `financeiro_contas_receber` - Contas a Receber
- `financeiro_parametros` - Parâmetros Financeiros

### OUTROS
- `franquias` - Franquias
- `tarefas` - Tarefas
- `documentacao` - Documentação
- `configuracoes` - Configurações do Sistema

## 🗄️ Estrutura no Banco de Dados

As permissões são armazenadas na coluna `permissoes` (tipo JSONB) da tabela `usuarios`.

**Exemplo de estrutura:**
```json
{
  "cadastro_empresa": true,
  "cadastro_colaborador": false,
  "inventario_itens": true,
  "financeiro_contas_pagar": false,
  ...
}
```

## 🔄 Fluxo de Funcionamento

1. **Login do Usuário:** 
   - Usuário faz login no sistema

2. **Carregamento de Permissões:**
   - Hook `usePermissions` busca as permissões do usuário na tabela `usuarios`
   - Permissões são armazenadas no estado do hook

3. **Verificação no Menu:**
   - Layout usa `hasPermission()` ou `hasAnyPermission()` para verificar cada item
   - Menus sem permissão são ocultados automaticamente

4. **Gerenciamento:**
   - Admin acessa Configurações > Usuários
   - Edita permissões do usuário através do modal
   - Permissões são salvas no banco de dados
   - Na próxima navegação, o menu se atualiza automaticamente

## 📝 Como Usar

### Aplicar permissão em novo componente:

```tsx
import { usePermissions } from '../hooks/usePermissions'

export const MeuComponente = () => {
  const { hasPermission } = usePermissions()
  
  return (
    <div>
      {hasPermission('nome_da_permissao') && (
        <button>Ação Protegida</button>
      )}
    </div>
  )
}
```

### Verificar múltiplas permissões:

```tsx
// Qualquer uma das permissões
{hasAnyPermission(['perm1', 'perm2']) && <Component />}

// Todas as permissões
{hasAllPermissions(['perm1', 'perm2']) && <Component />}
```

## 🔐 Segurança

### Nível Frontend:
- Menus ocultos automaticamente
- Componentes protegidos por verificação

### Nível Backend (Recomendado):
- **Importante:** Implementar Row Level Security (RLS) no Supabase
- Políticas RLS devem verificar `usuarios.permissoes` antes de permitir operações

## 🚀 Migração

Para aplicar as novas permissões aos usuários existentes:

1. Execute o arquivo SQL: `database/atualizar_permissoes_usuarios.sql`
2. Isso irá adicionar todas as novas permissões com valor `false`
3. Manualmente configure permissões para cada usuário conforme necessário

## ✅ Checklist de Implementação

- [x] Hook usePermissions criado
- [x] Layout com verificação de permissões
- [x] Modal de gerenciamento atualizado
- [x] Todas as 23 permissões mapeadas
- [x] Menus protegidos (Cadastros, Vendas, Inventário, Notas Fiscais, Financeiro, Franquias, Tarefas, Configurações, Documentação)
- [x] Script SQL de migração criado
- [ ] RLS policies no Supabase (próximo passo recomendado)

## 📌 Observações

- Dashboard está sempre visível (não requer permissão)
- Perfil do usuário está sempre visível
- Sistema funciona mesmo sem permissões configuradas (usuário vê apenas Dashboard)
- Permissões são carregadas automaticamente ao fazer login
