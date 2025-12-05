# 🔧 CORREÇÃO: EXCLUSÃO DE VENDAS

## Problema Identificado
Vendas não estavam sendo excluídas do banco de dados devido a:
1. **RLS (Row Level Security)** bloqueando DELETE
2. **Foreign Keys sem CASCADE** impedindo exclusão
3. **View cacheada** (`vw_vendas_resumo`) mostrando dados antigos

## Soluções Aplicadas

### 1. ✅ Frontend
- **Removido** botão de excluir da listagem de vendas
- **Botão de excluir** agora aparece **apenas dentro da página de detalhes** da venda
- **Mudança na query** de `vw_vendas_resumo` para tabela `vendas` direta (evita cache)

### 2. 🛠️ Backend/Database (APLICAR NO SUPABASE)

Execute os seguintes scripts **NA ORDEM** no SQL Editor do Supabase:

#### Passo 1: Corrigir Foreign Keys com CASCADE
```bash
# Arquivo: database/corrigir_cascade_vendas.sql
```

Este script:
- Remove foreign keys antigas
- Recria com `ON DELETE CASCADE`
- Garante que ao deletar venda, itens e parcelas são deletados automaticamente

#### Passo 2: Corrigir Políticas RLS
```bash
# Arquivo: database/corrigir_rls_vendas.sql
```

Este script:
- Habilita RLS nas tabelas vendas, vendas_itens, vendas_parcelas
- Cria política permitindo DELETE apenas para vendas com status `ORCAMENTO` ou `CANCELADO`
- Garante políticas para SELECT, INSERT, UPDATE

## Como Aplicar

### Via Supabase Dashboard:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Execute primeiro: `corrigir_cascade_vendas.sql`
5. Execute depois: `corrigir_rls_vendas.sql`

### Verificar se Funcionou:

1. Recarregue a aplicação (`http://localhost:5173/vendas`)
2. Entre em uma venda com status **Cancelado** ou **Orçamento**
3. Clique no botão **"Excluir Venda"** (dentro da venda, não na listagem)
4. Confirme a exclusão
5. Venda deve desaparecer da listagem e do banco

## Regras de Negócio

### Pode Excluir:
- ✅ Vendas com status `ORCAMENTO`
- ✅ Vendas com status `CANCELADO`

### NÃO Pode Excluir:
- ❌ Vendas `APROVADO`
- ❌ Vendas `EM_SEPARACAO`
- ❌ Vendas `FATURADO`
- ❌ Vendas `ENTREGUE`

### Cancelar vs Excluir

| Ação | O que faz | Quando usar |
|------|-----------|-------------|
| **Cancelar** | Muda status para CANCELADO (soft delete) | Manter histórico da venda |
| **Excluir** | Remove permanentemente do banco (hard delete) | Venda foi criada por engano |

## Arquivos Modificados

### Frontend:
- `src/features/vendas/vendasService.ts` - Query mudada de view para tabela
- `src/features/vendas/ListagemVendas.tsx` - Removido botão excluir da lista
- `src/features/vendas/NovaVenda.tsx` - Mantém botão excluir (já existia)

### Database:
- `database/corrigir_cascade_vendas.sql` - NOVO
- `database/corrigir_rls_vendas.sql` - NOVO

## Teste Completo

1. Criar uma venda de teste
2. Ir nos detalhes da venda
3. Clicar em "Excluir Venda"
4. Confirmar
5. Venda deve sumir da lista
6. Verificar no Supabase que registro foi deletado

---

**Data:** 03/12/2025
**Responsável:** GitHub Copilot Agent
