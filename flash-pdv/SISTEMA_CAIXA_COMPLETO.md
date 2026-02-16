# Sistema de Movimentações de Caixa - PDV ↔ Retaguarda

## 📋 Visão Geral

Sistema completo de controle de caixa com sincronização bidirecional entre PDV (offline-first) e retaguarda (online).

---

## 🏗️ Arquitetura

### PDV (Flash-PDV - Electron)
- **Banco Local:** SQLite para operação offline
- **Sincronização:** Automática em background após cada operação
- **Atalho:** F1 para abrir/fechar caixa
- **UUID:** Rastreamento único de cada movimentação

### Retaguarda (Web - React + Supabase)
- **Banco:** PostgreSQL (Supabase) com RLS multi-tenant
- **Interface:** Tela de consulta e gerenciamento
- **Permissões:** Sistema granular de acesso

---

## 🗄️ Estrutura de Dados

### Tabela SQLite (PDV Local)
```sql
CREATE TABLE movimentacoes_caixa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,              -- Rastreamento
  empresa_id INTEGER NOT NULL,
  tipo TEXT NOT NULL,                     -- ENTRADA, SAIDA, ABERTURA, FECHAMENTO
  valor REAL NOT NULL,
  data_movimentacao TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT,
  venda_local_id INTEGER,                 -- FK para vendas local
  origem TEXT DEFAULT 'PDV',
  caixa_aberto INTEGER DEFAULT 1,
  caixa_numero INTEGER,                   -- Número sequencial do dia
  usuario_id INTEGER NOT NULL,
  usuario_nome TEXT NOT NULL,
  sincronizado BOOLEAN DEFAULT 0,         -- Flag de sincronização
  retaguarda_id INTEGER,                  -- ID após sincronizar
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela PostgreSQL (Retaguarda)
```sql
CREATE TABLE movimentacoes_caixa (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA', 'ABERTURA', 'FECHAMENTO')),
  valor DECIMAL(15,2) NOT NULL,
  data_movimentacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  descricao TEXT NOT NULL,
  categoria TEXT,
  venda_id BIGINT,                        -- FK para vendas retaguarda
  origem TEXT,                            -- 'PDV', 'RETAGUARDA', 'MANUAL'
  pdv_uuid TEXT,                          -- Referência ao UUID do PDV
  caixa_aberto BOOLEAN DEFAULT TRUE,
  caixa_numero INTEGER,
  usuario_id UUID NOT NULL,
  usuario_nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT fk_movimentacoes_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  CONSTRAINT fk_movimentacoes_venda FOREIGN KEY (venda_id) REFERENCES vendas(id),
  CONSTRAINT fk_movimentacoes_usuario FOREIGN KEY (usuario_id) REFERENCES auth.users(id)
);
```

---

## 🔄 Fluxo de Sincronização

### 1. Abertura de Caixa no PDV

```typescript
// Usuário pressiona F1 ou clica em "Abrir Caixa"
await MovimentacoesCaixaService.abrirCaixa(config, 100.00, 'João Silva', 'Abertura normal')

// O que acontece:
// 1. Valida se não há caixa aberto
// 2. Gera próximo número de caixa do dia
// 3. Cria registro no SQLite com UUID único
// 4. Marca sincronizado = false
// 5. Dispara sincronização em background
```

### 2. Sincronização Automática

```typescript
// Executado automaticamente após operação
await MovimentacoesCaixaService.sincronizarPendentes(config)

// Busca registros com sincronizado = 0
// Para cada movimentação:
//   - Envia para Supabase via API
//   - Recebe ID da retaguarda
//   - Atualiza registro local com retaguarda_id
//   - Marca sincronizado = 1
```

### 3. Visualização na Retaguarda

```typescript
// Usuário acessa: Menu > Vendas > Movimentações de Caixa
// Ver registros sincronizados do PDV em tempo real
// Filtrar por período, tipo, usuário
// Consultar status do caixa
```

---

## 🎯 Funcionalidades Implementadas

### ✅ PDV (Flash-PDV)

1. **Serviço Completo** ([movimentacoesCaixaService.ts](flash-pdv/src/services/movimentacoesCaixaService.ts))
   - `statusCaixa()` - Consulta status atual
   - `abrirCaixa()` - Abertura com validações
   - `fecharCaixa()` - Fechamento com cálculo de diferença
   - `registrarEntrada()` - Entrada manual
   - `registrarSaida()` - Saída manual
   - `sincronizarPendentes()` - Sync automático
   - `listarMovimentacoesCaixaAtual()` - Lista movimentações do caixa aberto

2. **Interface Modal F1** ([VendaPDV.tsx](flash-pdv/src/components/VendaPDV.tsx#L680))
   - Status em tempo real (aberto/fechado)
   - Valores: abertura, entradas, saídas, saldo
   - Cálculo automático de diferença no fechamento
   - Validações inteligentes
   - Loading states e mensagens de erro

3. **Banco de Dados Local** ([sqlite.ts](flash-pdv/electron/database/sqlite.ts))
   - Tabela criada automaticamente
   - Índices para performance
   - Migrações automáticas

4. **Sincronização** ([sync.ts](flash-pdv/electron/database/sync.ts))
   - Upload automático para retaguarda
   - Controle de falhas e retentativas
   - Log detalhado de operações

### ✅ Retaguarda (Web)

1. **Banco de Dados** ([criar_movimentacoes_caixa.sql](database/criar_movimentacoes_caixa.sql))
   - Tabela com RLS multi-tenant
   - Funções: `abrir_caixa()`, `fechar_caixa()`, `status_caixa()`
   - Políticas de segurança
   - Índices otimizados

2. **Serviço Backend** ([movimentacoesCaixaService.ts](src/features/vendas/movimentacoesCaixaService.ts))
   - CRUD completo
   - Integração com Supabase
   - Validações de negócio
   - Cálculo de totais

3. **Interface Web** ([MovimentacoesCaixa.tsx](src/features/vendas/MovimentacoesCaixa.tsx))
   - Listagem com paginação
   - Filtros: período, tipo, usuário
   - Totais consolidados
   - Abrir/Fechar caixa manual
   - Permissões granulares

4. **Permissões** ([adicionar_permissoes_movimentacoes_caixa.sql](database/adicionar_permissoes_movimentacoes_caixa.sql))
   - `movimentacoes_caixa_visualizar`
   - `movimentacoes_caixa_criar`
   - `movimentacoes_caixa_editar`
   - `movimentacoes_caixa_excluir`
   - `caixa_abrir_fechar`

---

## 🚀 Como Usar

### PDV

1. **Abrir Caixa**
   - Pressione `F1` ou clique no botão "F1 - Caixa"
   - Informe valor inicial
   - Confirme

2. **Durante o Dia**
   - Vendas são registradas automaticamente como ENTRADA
   - Caixa permanece aberto

3. **Fechar Caixa**
   - Pressione `F1` novamente
   - Informe valor final (contado fisicamente)
   - Sistema calcula diferença automaticamente
   - Confirme

4. **Sincronização**
   - Automática após cada operação
   - Funciona offline (sincroniza quando voltar online)

### Retaguarda

1. **Visualizar Movimentações**
   - Menu: Vendas > Movimentações de Caixa
   - Selecione período
   - Filtre por tipo, usuário, etc.

2. **Abrir Caixa Manual**
   - Clique em "Abrir Caixa"
   - Informe valores
   - Confirme

3. **Consultar Relatórios**
   - Totais por dia
   - Resumo por usuário
   - Histórico completo

---

## 🔐 Segurança

### Multi-Tenant
- Todas as operações isoladas por `empresa_id`
- RLS no PostgreSQL impede acesso cruzado
- PDV valida empresa em todas as operações

### Rastreabilidade
- UUID único para cada movimentação
- Origem identificada (PDV, RETAGUARDA, MANUAL)
- Usuário responsável registrado
- Timestamps completos

### Validações
- Não permite abrir caixa se já houver um aberto
- Não permite fechar caixa se não houver um aberto
- Valores negativos bloqueados
- Permissões granulares na retaguarda

---

## 📊 Exemplos de Uso

### Exemplo 1: Dia Normal

```
08:00 - João abre caixa com R$ 100,00 (PDV)
09:30 - Venda #001: R$ 50,00 (ENTRADA automática)
11:00 - Venda #002: R$ 75,00 (ENTRADA automática)
14:00 - Retirada bancária: R$ 100,00 (SAIDA manual)
18:00 - João fecha caixa com R$ 125,00
        Sistema calcula: R$ 100 + 50 + 75 - 100 = R$ 125 ✅ CONFERIDO
```

### Exemplo 2: Diferença de Caixa

```
08:00 - Maria abre caixa com R$ 50,00
...vendas diversas...
18:00 - Sistema mostra saldo: R$ 500,00
        Maria conta fisicamente: R$ 495,00
        Sistema registra: FALTA R$ 5,00 ⚠️
```

---

## 🛠️ Instalação e Configuração

### Retaguarda

1. **Aplicar SQL**
```bash
# No Supabase SQL Editor
# 1. Executar: database/criar_movimentacoes_caixa.sql
# 2. Executar: database/adicionar_permissoes_movimentacoes_caixa.sql
# 3. Executar: database/ativar_permissoes_master_caixa.sql (opcional)
```

2. **Verificar Permissões**
```sql
SELECT permissoes->'movimentacoes_caixa_visualizar' FROM usuarios WHERE email = 'seu@email.com';
```

### PDV

1. **Atualizar Código**
```bash
cd flash-pdv
npm install uuid @types/uuid
```

2. **Rebuild Electron**
```bash
npm run dev
```

3. **Testar**
   - Pressione F1
   - Faça uma abertura de caixa
   - Verifique sincronização na retaguarda

---

## 📝 Logs e Debugging

### PDV Console
```
🔐 Caixa aberto com sucesso: { numero: 1, valor: 100 }
✅ Movimentação ABERTURA sincronizada
📊 Sincronização concluída: 1 sucesso, 0 erros
```

### Retaguarda Console
```
✅ Caixa aberto com sucesso
🔄 Buscando movimentações...
📊 Total: 15 registros
```

---

## 🎨 Interface

### PDV Modal (F1)
- Design limpo e profissional
- Cores: Verde (abrir), Vermelho (fechar)
- Status visual do caixa em tempo real
- Cálculo automático de diferenças
- Feedback instantâneo

### Retaguarda
- Tabela responsiva com filtros
- Totais consolidados destacados
- Badges coloridos por tipo
- Ações rápidas (abrir/fechar)

---

## ✅ Checklist de Implementação

- [x] Tabela SQLite no PDV
- [x] Serviço completo no PDV
- [x] Modal F1 integrado
- [x] Sincronização automática
- [x] Tabela PostgreSQL na retaguarda
- [x] Funções SQL (abrir/fechar/status)
- [x] RLS multi-tenant
- [x] Serviço backend
- [x] Interface web
- [x] Sistema de permissões
- [x] Integração menu
- [x] Documentação completa

---

## 🎯 Próximos Passos (Opcional)

- [ ] Relatório de fechamento de caixa (PDF)
- [ ] Gráficos de movimentações
- [ ] Alertas de diferenças acima de % configurável
- [ ] Histórico de fechamentos
- [ ] Integração com impressora fiscal

---

**Data:** 11/02/2026  
**Módulo:** Vendas > Movimentações de Caixa  
**Status:** ✅ COMPLETO E FUNCIONAL
