# 💰 FUNCIONALIDADE: MÚLTIPLOS PAGAMENTOS EM VENDAS
**Data:** 09/12/2025  
**Módulo:** Vendas

---

## 📋 RESUMO

Implementação de funcionalidade para cadastro de múltiplas formas de pagamento em uma única venda, permitindo dividir o valor total entre diferentes métodos (Dinheiro, PIX, Cartão, Boleto, etc).

---

## ✅ PROBLEMA RESOLVIDO

**Antes:** Uma venda só podia ter UMA forma de pagamento  
**Agora:** Uma venda pode ter MÚLTIPLAS formas de pagamento

**Exemplo de Uso:**
- Venda de R$ 200,00
  - R$ 100,00 em Boleto
  - R$ 100,00 em Dinheiro
  
- Venda de R$ 350,00
  - R$ 150,00 em PIX
  - R$ 200,00 em Cartão de Crédito

---

## 🚀 FUNCIONALIDADES IMPLEMENTADAS

### 1. **Interface de Múltiplos Pagamentos** ✅

#### Formulário de Adição:
- Campo: Forma de Pagamento (dropdown)
- Campo: Valor (numérico com 2 casas decimais)
- Campo: Observação (opcional)
- Botão: **"+ Adicionar Pagamento"**

#### Tabela de Pagamentos Cadastrados:
- Coluna: Forma de Pagamento
- Coluna: Valor (R$)
- Coluna: Observação
- Coluna: Ação (botão remover)
- Rodapé: **TOTAL PAGO**
- Rodapé: **SALDO RESTANTE** (se aplicável)
- Indicador visual quando valor total é atingido

### 2. **Validações Implementadas** ✅

#### Validação ao Adicionar Pagamento:
- ✅ Valor deve ser maior que zero
- ✅ Soma dos pagamentos não pode exceder o total da venda
- ✅ Mensagens de erro claras e específicas

#### Validação ao Salvar Venda:
- ✅ Se houver pagamentos cadastrados, a soma DEVE ser exatamente igual ao total
- ✅ Mensagem mostrando total esperado vs total pago
- ✅ Pedido só é salvo se validação passar

**Regra de Negócio:**
```
SE pagamentos.length > 0 ENTÃO
  totalPagamentos === totalVenda
  SENÃO erro: "A soma dos pagamentos deve ser igual ao total da venda"
FIM SE
```

### 3. **Cálculos Automáticos** ✅

- **Total Pago:** Soma de todos os pagamentos cadastrados
- **Saldo Restante:** Total da venda - Total pago
- **Indicador Visual:** 
  - 🟡 Amarelo quando há saldo restante
  - 🟢 Verde quando valor total é atingido

### 4. **Gerenciamento de Pagamentos** ✅

**Adicionar:**
```typescript
adicionarPagamento()
- Valida valor > 0
- Valida soma não exceder total
- Adiciona ao array formData.pagamentos[]
- Reseta formulário
- Mostra toast de sucesso
```

**Remover:**
```typescript
removerPagamento(id: string)
- Remove do array por ID
- Recalcula totais automaticamente
- Mostra toast de confirmação
```

---

## 🎨 INTERFACE DO USUÁRIO

### Layout da Seção de Pagamentos:

```
┌─────────────────────────────────────────────────┐
│ Pagamentos                                       │
├─────────────────────────────────────────────────┤
│ Adicionar Pagamento                             │
│ ┌──────────────┬───────────┬─────────────────┐ │
│ │Forma Pgto *  │ Valor *   │ Observação      │ │
│ │[Dropdown]    │ [0,00]    │ [Texto]         │ │
│ └──────────────┴───────────┴─────────────────┘ │
│ [+ Adicionar Pagamento]                         │
├─────────────────────────────────────────────────┤
│ Pagamentos Cadastrados                          │
│ ┌──────┬──────────┬─────────────┬──────┐       │
│ │Forma │  Valor   │ Observação  │ Ação │       │
│ ├──────┼──────────┼─────────────┼──────┤       │
│ │PIX   │ R$ 50,00 │ Entrada     │  🗑   │       │
│ │Boleto│ R$150,00 │ Restante    │  🗑   │       │
│ ├──────┴──────────┴─────────────┴──────┤       │
│ │TOTAL PAGO:            R$ 200,00      │       │
│ │✓ Valor total atingido                │       │
│ └──────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

### Estados Visuais:

**Saldo Restante (Amarelo):**
```
┌───────────────────────────────────────┐
│ SALDO RESTANTE:      R$ 50,00         │
│ Adicione mais pagamentos              │
└───────────────────────────────────────┘
```

**Valor Atingido (Verde):**
```
┌───────────────────────────────────────┐
│ ✓ Valor total atingido                │
└───────────────────────────────────────┘
```

---

## 📊 ESTRUTURA DE DADOS

### Tipo PagamentoVendaFormData:
```typescript
interface PagamentoVendaFormData {
  id?: string                    // ID temporário para gerenciamento
  forma_pagamento: FormaPagamento // DINHEIRO, PIX, CARTAO, etc
  valor: number                   // Valor deste pagamento
  observacao?: string             // Observação opcional
}
```

### VendaFormData (atualizado):
```typescript
interface VendaFormData {
  // ... campos existentes ...
  
  // Múltiplos Pagamentos
  pagamentos?: PagamentoVendaFormData[]
  
  // Compatibilidade (usado quando há apenas 1 forma)
  forma_pagamento: FormaPagamento
  condicao_pagamento: CondicaoPagamento
  numero_parcelas?: number
}
```

---

## 🔧 FUNÇÕES PRINCIPAIS

### `adicionarPagamento()`
Adiciona um novo pagamento à lista

**Validações:**
- Valor > 0
- Soma não excede total da venda

**Comportamento:**
- Cria objeto com ID único
- Adiciona ao array
- Reseta formulário
- Exibe toast de sucesso

---

### `removerPagamento(id: string)`
Remove um pagamento da lista

**Parâmetros:**
- `id`: Identificador único do pagamento

**Comportamento:**
- Filtra array removendo o item
- Recalcula totais
- Exibe toast de confirmação

---

### `calcularTotalPagamentos(): number`
Retorna a soma de todos os pagamentos

**Retorno:**
```typescript
formData.pagamentos.reduce((acc, p) => acc + p.valor, 0)
```

---

### `calcularSaldoRestante(): number`
Retorna o saldo que ainda precisa ser pago

**Fórmula:**
```
Saldo = Total da Venda - Total dos Pagamentos
```

---

### `validarPagamentos(): boolean`
Valida se os pagamentos estão corretos

**Regras:**
- Se houver pagamentos: soma DEVE ser igual ao total
- Se não houver: permitir salvar normalmente
- Exibe toast de erro com valores detalhados

**Retorno:**
- `true`: Validação passou
- `false`: Validação falhou (com mensagem de erro)

---

## 📝 EXEMPLO DE USO

### Cenário: Venda de R$ 500,00

**Passo 1:** Adicionar itens totalizando R$ 500,00

**Passo 2:** Adicionar Pagamentos:
```
1º Pagamento:
  - Forma: PIX
  - Valor: R$ 200,00
  - Obs: Entrada
  [Adicionar]

2º Pagamento:
  - Forma: Boleto
  - Valor: R$ 300,00
  - Obs: 30 dias
  [Adicionar]
```

**Passo 3:** Verificar Totais:
```
TOTAL PAGO: R$ 500,00
✓ Valor total atingido
```

**Passo 4:** Salvar Pedido ✅

---

## ⚠️ VALIDAÇÕES E MENSAGENS DE ERRO

### Erro: Valor Zerado
```
❌ O valor do pagamento deve ser maior que zero
```

### Erro: Soma Excede Total
```
❌ A soma dos pagamentos não pode exceder o valor total da venda
```

### Erro: Soma Diferente do Total (ao salvar)
```
❌ A soma dos pagamentos (R$ 450,00) deve ser igual 
   ao total da venda (R$ 500,00)
```

---

## 🎯 COMPORTAMENTOS ESPECIAIS

### Compatibilidade com Sistema Antigo:
- Se `pagamentos[]` estiver vazio: usa `forma_pagamento` único
- Campos de parcelamento aparecem apenas se não houver múltiplos pagamentos
- Transição suave entre os dois modos

### Modo Híbrido:
```
SE pagamentos.length === 0 ENTÃO
  Mostrar: Plano de Parcelamento + Data Vencimento
SENÃO
  Ocultar: Campos de parcelamento
  Mostrar: Tabela de pagamentos
FIM SE
```

---

## 📂 ARQUIVOS MODIFICADOS

```
src/
├── features/
│   └── vendas/
│       ├── NovaVenda.tsx           [MODIFICADO]
│       └── types.ts                [MODIFICADO]
└── docs/
    └── MULTIPLOS_PAGAMENTOS.md     [NOVO]
```

---

## ✨ BENEFÍCIOS

- ✅ Maior flexibilidade para o cliente
- ✅ Reflete realidade do comércio (pagamentos mistos)
- ✅ Controle preciso de valores por forma de pagamento
- ✅ Validação automática evita erros
- ✅ Interface intuitiva e fácil de usar
- ✅ Rastreabilidade de cada pagamento

---

## 🔮 MELHORIAS FUTURAS (OPCIONAL)

- [ ] Salvar histórico de pagamentos no banco
- [ ] Relatório de formas de pagamento mais usadas
- [ ] Integração com contas a receber por forma
- [ ] Sugestão automática de divisão de valores
- [ ] Copiar pagamentos de vendas anteriores

---

## 📊 EXEMPLO VISUAL COMPLETO

### Antes (Sistema Antigo):
```
Venda: R$ 500,00
Pagamento: PIX (R$ 500,00) - Apenas 1 forma
```

### Depois (Sistema Novo):
```
Venda: R$ 500,00
Pagamentos:
  1. PIX       - R$ 150,00 (Entrada)
  2. Cartão    - R$ 200,00 (Débito)
  3. Boleto    - R$ 150,00 (30 dias)
  ─────────────────────────
  TOTAL        - R$ 500,00 ✓
```

---

**Desenvolvido por:** GitHub Copilot  
**Data:** 09/12/2025  
**Status:** ✅ IMPLEMENTADO E TESTADO  
**Versão:** 1.0
