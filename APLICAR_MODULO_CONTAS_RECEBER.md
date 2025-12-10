# Aplicar Módulo de Contas a Receber

## ⚠️ IMPORTANTE: Executar no Supabase SQL Editor

Este módulo adiciona gestão completa de contas a receber com:
- ✅ Criação automática a partir de vendas
- ✅ Entrada manual de contas
- ✅ Controle de parcelas e pagamentos
- ✅ Atualização automática de status
- ✅ Marcação automática de contas vencidas

---

## 📋 PASSO A PASSO

### 1. Acessar Supabase SQL Editor
1. Ir para: https://supabase.com/dashboard
2. Selecionar o projeto **tech.crescieperdi**
3. Menu lateral: **SQL Editor**
4. Clicar em **New Query**

### 2. Executar o Script
1. Abrir o arquivo: `database/criar_modulo_contas_receber.sql`
2. Copiar TODO o conteúdo do arquivo
3. Colar no SQL Editor do Supabase
4. Clicar em **Run** (ou pressionar Ctrl/Cmd + Enter)
5. Aguardar mensagem: **Success. No rows returned**

### 3. Verificar Criação das Tabelas
Execute esta query para confirmar:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('contas_receber', 'pagamentos_receber')
ORDER BY table_name;
```

Deve retornar:
- ✅ contas_receber
- ✅ pagamentos_receber

### 4. Testar Triggers
Execute para testar a função de vencidos:
```sql
SELECT marcar_contas_vencidas();
```

---

## 🔄 COMO FUNCIONA

### Criação Automática (via Vendas)
Quando uma venda é salva:
1. Sistema verifica se status ≠ ORCAMENTO
2. Se houver cliente vinculado
3. Cria automaticamente contas a receber:
   - **À vista:** 1 conta com vencimento imediato
   - **Parcelado:** N contas com vencimentos mensais

### Criação Manual
Clique em "Nova Conta" na tela Contas a Receber:
1. Selecione o cliente
2. Preencha descrição e valor
3. Defina datas de emissão e vencimento
4. Salve

### Registrar Pagamento
Na listagem de contas:
1. Clique em "Receber" na conta desejada
2. Informe valor pago e data
3. Escolha forma de pagamento
4. Sistema atualiza automaticamente:
   - Saldo devedor
   - Status (PAGO, PARCIAL, ABERTO)

---

## 📊 STATUS AUTOMÁTICOS

| Status | Quando Aplica |
|--------|---------------|
| **ABERTO** | Criação inicial, sem pagamentos |
| **PARCIAL** | Valor pago < Valor total |
| **PAGO** | Valor pago = Valor total |
| **VENCIDO** | Data vencimento < Hoje + Status ≠ PAGO |
| **CANCELADO** | Cancelamento manual |

---

## 🔐 PERMISSÕES (RLS)

As tabelas possuem Row Level Security:
- ✅ SELECT: Todos os usuários autenticados
- ✅ INSERT/UPDATE/DELETE: Apenas usuários autenticados

Nenhuma configuração adicional necessária.

---

## 🧪 TESTE RÁPIDO

Após aplicar o SQL:

1. **Criar uma venda:**
   - Menu: Vendas > Nova Venda
   - Preencha cliente e itens
   - Escolha "Parcelado" em 3x
   - Salve

2. **Verificar contas criadas:**
   - Menu: Financeiro > Contas a Receber
   - Deve aparecer 3 contas para o cliente
   - Cada uma com vencimento mensal

3. **Registrar um pagamento:**
   - Clique em "Receber" em uma conta
   - Informe valor e forma de pagamento
   - Salve
   - Status deve mudar para PARCIAL ou PAGO

---

## ❓ TROUBLESHOOTING

### Erro: "relation 'contas_receber' does not exist"
- SQL não foi executado
- Execute o arquivo `criar_modulo_contas_receber.sql`

### Contas não aparecem após venda
- Verifique se a venda tem cliente vinculado
- Verifique se status ≠ ORCAMENTO
- Veja console do navegador (F12) para erros

### Erro de permissão ao criar conta
- Verifique se está logado no sistema
- Execute `dar_permissoes_admin.sql` se for admin

---

## 📞 SUPORTE

Em caso de dúvidas:
1. Verificar console do navegador (F12)
2. Verificar logs do Supabase
3. Revisar este documento

---

**Data de criação:** 08/12/2025  
**Módulo:** Financeiro - Contas a Receber  
**Versão:** 1.0
