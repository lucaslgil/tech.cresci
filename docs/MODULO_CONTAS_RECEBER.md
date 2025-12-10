# 💰 Módulo Contas a Receber - Documentação Completa

## 📋 VISÃO GERAL

Módulo financeiro para gestão completa de contas a receber com integração automática ao módulo de vendas.

### ✨ Funcionalidades

1. **Criação Automática**
   - Gera contas a receber automaticamente quando uma venda é finalizada
   - Suporta vendas à vista (1 conta) e parceladas (N contas)
   - Vincula automaticamente ao cliente da venda

2. **Criação Manual**
   - Permite cadastrar contas a receber independentes
   - Útil para recebimentos não originados de vendas
   - Busca inteligente de clientes com autocomplete

3. **Controle de Pagamentos**
   - Registro de pagamentos parciais ou totais
   - Histórico completo de cada pagamento
   - Atualização automática de status e saldo

4. **Gestão e Filtros**
   - Filtros por status, período, cliente
   - Dashboard com cards de resumo
   - Identificação automática de contas vencidas

---

## 🗂️ ESTRUTURA DE ARQUIVOS

```
src/features/financeiro/
├── ContasReceber.tsx                    # Tela principal
├── types.ts                             # Tipos e interfaces
├── contasReceberService.ts              # Service layer (API)
├── ContasPagar.tsx                      # Tela contas a pagar
└── ParametrosFinanceiros.tsx            # Configurações

database/
└── criar_modulo_contas_receber.sql      # Schema completo

APLICAR_MODULO_CONTAS_RECEBER.md        # Guia de instalação
```

---

## 📊 BANCO DE DADOS

### Tabela: `contas_receber`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | bigint | PK, auto-increment |
| venda_id | bigint | FK para vendas (nullable) |
| numero_venda | integer | Número da venda origem |
| cliente_id | bigint | FK para clientes (obrigatório) |
| cliente_nome | varchar(200) | Nome do cliente |
| cliente_cpf_cnpj | varchar(14) | CPF/CNPJ sem máscara |
| numero_documento | varchar(50) | Número do documento/nota |
| descricao | text | Descrição da conta |
| numero_parcela | integer | Número da parcela (1, 2, 3...) |
| total_parcelas | integer | Total de parcelas |
| data_emissao | date | Data de emissão |
| data_vencimento | date | Data de vencimento |
| valor_original | numeric(15,2) | Valor sem descontos/acréscimos |
| valor_acrescimo | numeric(15,2) | Valor de acréscimos |
| valor_desconto | numeric(15,2) | Valor de descontos |
| valor_total | numeric(15,2) | Valor final a receber |
| valor_pago | numeric(15,2) | Valor já pago |
| valor_saldo | numeric(15,2) | Saldo devedor |
| status | varchar(20) | ABERTO, PAGO, PARCIAL, VENCIDO, CANCELADO |
| observacoes | text | Observações gerais |

### Tabela: `pagamentos_receber`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | bigint | PK, auto-increment |
| conta_receber_id | bigint | FK para contas_receber |
| data_pagamento | date | Data do pagamento |
| valor_pago | numeric(15,2) | Valor do pagamento |
| forma_pagamento | varchar(50) | DINHEIRO, PIX, CARTAO... |
| observacoes | text | Observações do pagamento |

### 🔄 Triggers Automáticos

1. **update_timestamp**
   - Atualiza `updated_at` em cada modificação

2. **atualizar_conta_apos_pagamento**
   - Recalcula `valor_pago` somando todos os pagamentos
   - Recalcula `valor_saldo = valor_total - valor_pago`
   - Atualiza status:
     - PAGO se saldo = 0
     - PARCIAL se 0 < saldo < total
     - ABERTO se não há pagamentos

3. **marcar_contas_vencidas** (função)
   - Marca como VENCIDO contas com vencimento < hoje
   - Executada automaticamente

---

## 🎨 INTERFACE DO USUÁRIO

### Layout

A tela segue o **PADRÃO_INTERFACE_SISTEMA.md**:

- **Cores:**
  - Cabeçalhos/botões: `#394353`
  - Bordas: `#C9C4B5`

- **Tipografia:**
  - Títulos: `text-base`
  - Inputs: `text-sm`
  - Labels/tabelas: `text-xs`

- **Componentes:**
  - Cards de resumo com ícones
  - Tabela responsiva com hover
  - Modais para nova conta e pagamento
  - Autocomplete de clientes
  - Filtros avançados

### Cards de Resumo

| Card | Valor | Ícone | Cor |
|------|-------|-------|-----|
| Total a Receber | Valor pendente | DollarSign | Azul |
| Já Recebido | Valor pago | CheckCircle | Verde |
| Contas em Aberto | Quantidade | Clock | Laranja |
| Contas Vencidas | Quantidade | AlertCircle | Vermelho |

### Ações Disponíveis

- **Nova Conta:** Abre modal para cadastro manual
- **Filtros:** Expande painel com filtros avançados
- **Receber:** Registra pagamento na conta
- **Cancelar:** Cancela conta em aberto

---

## 🔧 SERVICE LAYER

### `contasReceberService.ts`

```typescript
// Principais funções:

listarContasReceber(filtros?: FiltrosContasReceber)
// Lista contas com filtros opcionais
// Retorna: { data: ContaReceber[], error }

buscarContaPorId(id: number)
// Busca conta específica
// Retorna: { data: ContaReceber, error }

criarContaReceber(dados: ContaReceberFormData)
// Cria conta manualmente
// Retorna: { data: ContaReceber, error }

criarContasParceladas(params)
// Cria múltiplas contas de uma venda
// Parâmetros:
//   - venda_id, numero_venda
//   - cliente_id, cliente_nome, cliente_cpf_cnpj
//   - valor_total, numero_parcelas
//   - data_vencimento_primeira, dias_entre_parcelas
// Retorna: { data: ContaReceber[], error }

registrarPagamento(dados: PagamentoFormData)
// Registra pagamento (parcial ou total)
// Trigger atualiza automaticamente saldo e status
// Retorna: { data: PagamentoReceber, error }

cancelarConta(id: number)
// Cancela conta (status = CANCELADO)
// Retorna: { data, error }

obterResumo(filtros?: FiltrosContasReceber)
// Dashboard com estatísticas
// Retorna: { data: ResumoContasReceber, error }
```

---

## 🔗 INTEGRAÇÃO COM VENDAS

### Arquivo: `src/features/vendas/vendasService.ts`

```typescript
// Importação do serviço
import { criarContasParceladas } from '../financeiro/contasReceberService'

// Integração no método criar()
async criar(formData: VendaFormData) {
  // ... criação da venda ...

  // INTEGRAÇÃO: Criar contas a receber
  if (formData.status !== 'ORCAMENTO' && formData.cliente_id) {
    const numeroParcelas = formData.condicao_pagamento === 'PARCELADO' 
      ? formData.numero_parcelas 
      : 1

    const dataBase = new Date(formData.data_venda)
    const diasAteVencimento = formData.condicao_pagamento === 'A_VISTA' ? 0 : 30
    dataBase.setDate(dataBase.getDate() + diasAteVencimento)

    await criarContasParceladas({
      venda_id: venda.id,
      numero_venda: numero,
      cliente_id: formData.cliente_id,
      cliente_nome: clienteNome,
      cliente_cpf_cnpj: clienteCpfCnpj,
      valor_total: total,
      numero_parcelas: numeroParcelas,
      data_vencimento_primeira: dataBase.toISOString().split('T')[0],
      dias_entre_parcelas: 30
    })
  }

  return { sucesso: true, ... }
}
```

### Regras de Integração

1. **Não cria contas se:**
   - Status da venda = ORCAMENTO
   - Cliente não informado

2. **À Vista:**
   - Cria 1 conta
   - Vencimento: data da venda (0 dias)

3. **Parcelado:**
   - Cria N contas (N = numero_parcelas)
   - Primeira parcela: +30 dias da venda
   - Demais: +30 dias entre cada
   - Valor dividido igualmente

---

## 🎯 TIPOS E INTERFACES

### `types.ts`

```typescript
// Status possíveis
export const STATUS_CONTA = {
  ABERTO: 'ABERTO',
  PAGO: 'PAGO',
  PARCIAL: 'PARCIAL',
  VENCIDO: 'VENCIDO',
  CANCELADO: 'CANCELADO'
} as const

export type StatusConta = typeof STATUS_CONTA[keyof typeof STATUS_CONTA]

// Interface principal
export interface ContaReceber {
  id: number
  venda_id: number | null
  numero_venda: number | null
  cliente_id: number
  cliente_nome: string
  cliente_cpf_cnpj?: string
  numero_documento?: string
  descricao: string
  numero_parcela?: number
  total_parcelas?: number
  data_emissao: string
  data_vencimento: string
  valor_original: number
  valor_acrescimo: number
  valor_desconto: number
  valor_total: number
  valor_pago: number
  valor_saldo: number
  status: StatusConta
  observacoes?: string
  created_at: string
  updated_at: string
}

// Formulário de nova conta
export interface ContaReceberFormData {
  cliente_id: number
  cliente_nome: string
  cliente_cpf_cnpj?: string
  descricao: string
  numero_documento?: string
  valor_original: number
  valor_acrescimo?: number
  valor_desconto?: number
  data_emissao: string
  data_vencimento: string
  observacoes?: string
}

// Formulário de pagamento
export interface PagamentoFormData {
  conta_receber_id: number
  data_pagamento: string
  valor_pago: number
  forma_pagamento: string
  observacoes?: string
}

// Filtros de busca
export interface FiltrosContasReceber {
  status?: StatusConta | 'TODOS'
  cliente_id?: number
  data_inicio?: string
  data_fim?: string
  vencimento_inicio?: string
  vencimento_fim?: string
  busca?: string
}

// Resumo para dashboard
export interface ResumoContasReceber {
  total_contas: number
  total_aberto: number
  total_pago: number
  total_parcial: number
  total_vencido: number
  total_cancelado: number
  valor_total: number
  valor_pendente: number
  valor_recebido: number
}

// Funções auxiliares
export const calcularValorTotal = (conta: ContaReceber): number => {
  return conta.valor_original + (conta.valor_acrescimo || 0) - (conta.valor_desconto || 0)
}

export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

export const calcularDiasAtraso = (dataVencimento: string): number => {
  const hoje = new Date()
  const vencimento = new Date(dataVencimento + 'T00:00:00')
  const diff = Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

export const getStatusColor = (status: StatusConta): string => {
  const cores = {
    ABERTO: 'bg-blue-100 text-blue-800',
    PAGO: 'bg-green-100 text-green-800',
    PARCIAL: 'bg-yellow-100 text-yellow-800',
    VENCIDO: 'bg-red-100 text-red-800',
    CANCELADO: 'bg-gray-100 text-gray-800'
  }
  return cores[status] || 'bg-gray-100 text-gray-800'
}
```

---

## 📱 COMPONENTES DA TELA

### 1. Cards de Resumo
- Grid responsivo (1 col mobile, 4 cols desktop)
- Ícones coloridos
- Valores formatados
- Atualizados conforme filtros

### 2. Barra de Ações
- Botão "Nova Conta"
- Botão "Filtros"
- Pills de status (ABERTO, PAGO, VENCIDO, etc.)

### 3. Painel de Filtros (expansível)
- Período de emissão
- Período de vencimento
- Busca por cliente/documento

### 4. Tabela de Contas
- Colunas: Vencimento, Cliente, Descrição, Documento, Valor, Pago, Saldo, Status, Ações
- Destaque de dias em atraso
- Botões "Receber" e "Cancelar"
- Zebra striping (linhas alternadas)

### 5. Modal de Nova Conta
- Autocomplete de clientes
- Campos: descrição, documento, valor, datas
- Validação de campos obrigatórios

### 6. Modal de Pagamento
- Resumo da conta selecionada
- Form: data, valor, forma de pagamento
- Histórico de pagamentos anteriores
- Validação de valor máximo (saldo)

---

## 🔐 SEGURANÇA

### Row Level Security (RLS)

Todas as tabelas possuem políticas ativas:

```sql
-- SELECT: Qualquer usuário autenticado
CREATE POLICY "Permitir leitura para autenticados"
  ON contas_receber FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT/UPDATE/DELETE: Usuários autenticados
CREATE POLICY "Permitir escrita para autenticados"
  ON contas_receber FOR ALL
  USING (auth.uid() IS NOT NULL);
```

### Validações

- Cliente obrigatório
- Valor mínimo > 0
- Data de vencimento ≥ data de emissão
- Valor de pagamento ≤ saldo devedor

---

## 🧪 TESTES SUGERIDOS

### 1. Teste de Criação Automática
```
1. Criar venda à vista com cliente
2. Verificar criação de 1 conta
3. Vencimento = data da venda

1. Criar venda parcelada 3x com cliente
2. Verificar criação de 3 contas
3. Vencimentos: +30, +60, +90 dias
```

### 2. Teste de Criação Manual
```
1. Clicar em "Nova Conta"
2. Buscar cliente
3. Preencher dados
4. Salvar
5. Verificar na listagem
```

### 3. Teste de Pagamento
```
1. Selecionar conta aberta
2. Clicar em "Receber"
3. Informar valor parcial
4. Salvar
5. Verificar status = PARCIAL
6. Pagar restante
7. Verificar status = PAGO
```

### 4. Teste de Filtros
```
1. Filtrar por status ABERTO
2. Filtrar por período
3. Buscar por cliente
4. Verificar atualização de cards
```

### 5. Teste de Vencidos
```
1. Criar conta com vencimento passado
2. Executar: SELECT marcar_contas_vencidas();
3. Verificar status = VENCIDO
```

---

## 📚 REFERÊNCIAS

- **Padrão de Interface:** `PADRAO_INTERFACE_SISTEMA.md`
- **Instalação:** `APLICAR_MODULO_CONTAS_RECEBER.md`
- **Schema SQL:** `database/criar_modulo_contas_receber.sql`
- **Regras do Sistema:** `regras_do_sistema.txt`

---

**Versão:** 1.0  
**Data:** 08/12/2025  
**Desenvolvedor:** GitHub Copilot + Lucas  
**Status:** ✅ Pronto para Produção
