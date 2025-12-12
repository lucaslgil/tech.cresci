# Melhorias nos Parâmetros Financeiros - Padrão ERP

## ✅ Correção Implementada na Tela de Vendas

### Data de Vencimento Automática
- **Antes:** Usava a data da venda como vencimento (causava vencimentos no passado)
- **Agora:** Calcula automaticamente baseado no `diasPrazo` da forma de pagamento
- **Exemplo:** Boleto com 30 dias de prazo → vencimento em 30 dias a partir da data da venda

## 🚀 Novas Funcionalidades nos Parâmetros (Padrão ERP)

### 1. Formas de Pagamento - Campos Adicionados

#### Tipo de Recebimento (Classificação)
- DINHEIRO
- TRANSFERÊNCIA
- CARTÃO_CREDITO
- CARTÃO_DEBITO
- BOLETO
- PIX
- CHEQUE
- OUTROS

**Utilidade:** Facilita relatórios e conciliação bancária

#### Permite Parcelamento (Sim/Não)
**Utilidade:** Controla quais formas permitem dividir o pagamento

#### Taxa de Juros (% ao mês)
**Utilidade:** Aplica juros automáticos em pagamentos parcelados

#### Desconto à Vista (%)
**Utilidade:** Oferece desconto automático para pagamento à vista

#### Gera Financeiro (Sim/Não)
**Utilidade:** 
- Dinheiro/PIX à vista → Não gera contas a receber (recebimento imediato)
- Boleto/Cartão → Gera contas a receber

### 2. Parcelamentos - Campos Adicionados

#### Taxa de Juros (% sobre total)
**Utilidade:** Calcula juros no valor parcelado

#### Primeiro Vencimento (dias)
**Utilidade:** Define quando vence a primeira parcela
- Ex: "30 dias" = primeira parcela vence 30 dias após a venda

### 3. Contas Bancárias - Campos Adicionados

#### Código do Banco (3 dígitos)
**Utilidade:** Identificação numérica do banco (001-BB, 341-Itaú, etc.)

#### Tipo de Conta
- CORRENTE
- POUPANÇA
- PAGAMENTO

**Utilidade:** Classificação para controle financeiro

#### Saldo Inicial
**Utilidade:** Para controle de saldo e conciliação

## 📊 Benefícios das Melhorias

### Operacionais
✅ Cálculo automático de vencimentos
✅ Controle de formas que geram ou não financeiro
✅ Aplicação automática de descontos e juros
✅ Melhor rastreabilidade dos recebimentos

### Relatórios
✅ Separação por tipo de recebimento
✅ Análise de inadimplência por forma de pagamento
✅ Cálculo preciso de juros e descontos
✅ Conciliação bancária facilitada

### Gestão
✅ Flexibilidade em condições comerciais
✅ Automação de regras financeiras
✅ Redução de erros manuais
✅ Padronização de processos

## 🔄 Próximos Passos Sugeridos

1. **Integração com a Venda:**
   - Aplicar desconto à vista automaticamente
   - Calcular juros em parcelamentos
   - Filtrar formas que geram financeiro

2. **Relatórios:**
   - Recebimentos por tipo
   - Análise de inadimplência
   - Comissões por forma de pagamento

3. **Integrações:**
   - API de boletos bancários
   - Gateway de pagamento (cartão)
   - Conciliação automática (OFX)

## 📝 Status da Implementação

- [x] Correção de vencimento automático na tela de vendas
- [x] Definição de novos campos (interfaces)
- [ ] Atualização dos formulários com novos campos
- [ ] Migração dos dados existentes
- [ ] Integração com tela de vendas
- [ ] Documentação para usuários

## 💡 Exemplo de Uso

### Cenário 1: Venda à Vista com Desconto
- Forma: Dinheiro
- Desconto à Vista: 5%
- Gera Financeiro: Não
- **Resultado:** Valor com 5% de desconto, sem conta a receber

### Cenário 2: Venda Parcelada com Juros
- Forma: Cartão de Crédito
- Parcelamento: 3x sem juros
- Taxa Juros: 2%/mês
- **Resultado:** 3 parcelas com juros de 2% ao mês

### Cenário 3: Boleto Bancário
- Forma: Boleto
- Dias Prazo: 30
- Gera Financeiro: Sim
- **Resultado:** Vencimento em 30 dias, cria conta a receber
