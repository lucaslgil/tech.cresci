# Tipo de Contribuinte → Operação Fiscal Padrão

**Data:** 10/02/2026  
**Status:** ✅ Implementado

## 📋 Resumo

Sistema agora permite vincular **Tipos de Contribuinte** com **Operações Fiscais Padrão**. Quando um cliente tiver um tipo de contribuinte configurado, o sistema automaticamente pré-seleciona a operação fiscal correta na emissão de NF-e.

## 🎯 Problema Resolvido

**Cenário:**  
Cliente da Zona Franca de Manaus precisa sempre usar CFOP 6.109. Sem automação, o usuário precisava lembrar e selecionar manualmente toda vez.

**Solução:**  
```
Cliente → Tipo Contribuinte "Zona Franca Manaus" → Operação CFOP 6.109 (automática)
```

## 🏗️ Arquitetura

### Relacionamento:
```
clientes.tipo_contribuinte_id
    ↓
tipos_contribuinte.operacao_fiscal_padrao_id
    ↓
operacoes_fiscais.id
```

### Fluxo:
1. **Cadastrar Operação Fiscal** (ex: CFOP 6.109 - Zona Franca)
2. **Criar Tipo de Contribuinte** (ex: "Cliente Zona Franca")
3. **Vincular** operação fiscal ao tipo de contribuinte
4. **Associar** cliente ao tipo de contribuinte
5. **Emitir NF-e** → Sistema pré-seleciona automaticamente

## 🔧 O que foi implementado

### 1. **Banco de Dados** ✅

#### Migration: `vincular_tipo_contribuinte_operacao_fiscal.sql`

**Campo adicionado:**
```sql
ALTER TABLE tipos_contribuinte 
  ADD COLUMN operacao_fiscal_padrao_id BIGINT 
  REFERENCES operacoes_fiscais(id);
```

**View criada:**
```sql
vw_clientes_com_operacao_padrao
-- Retorna cliente + tipo contribuinte + operação fiscal padrão
```

**Função helper:**
```sql
get_operacao_fiscal_cliente(cliente_id, uf_destino)
-- Retorna operação fiscal baseada no tipo de contribuinte
-- Calcula CFOP correto (dentro/fora do estado)
```

**Exemplos de tipos:**
- Cliente Zona Franca de Manaus
- Cliente com Suframa
- Produtor Rural
- Revenda/Distribuidor
- Consumidor Final Pessoa Física

### 2. **Frontend** ✅

#### Componente: `CadastroTiposContribuinte.tsx`

**Campo adicionado:**
```tsx
<select 
  value={formData.operacao_fiscal_padrao_id} 
  onChange={...}
>
  <option value="">Nenhuma (usar operação manual)</option>
  {operacoesFiscais.map(op => (
    <option value={op.id}>
      {op.codigo} - {op.nome} | CFOP: {op.cfop_dentro/fora}
    </option>
  ))}
</select>
```

**Dica visual:**
> 💡 Quando um cliente tiver este tipo, o sistema pré-selecionará automaticamente esta operação fiscal na emissão de NF-e

#### Hook: `useOperacaoFiscalCliente.ts`

```typescript
const { buscarOperacaoFiscalCliente } = useOperacaoFiscalCliente()

// Uso:
const operacaoPadrao = await buscarOperacaoFiscalCliente(clienteId, ufDestino)
```

Retorna:
- `operacao_fiscal_id`
- `operacao_fiscal_codigo`
- `operacao_fiscal_nome`
- `cfop_dentro_estado` / `cfop_fora_estado` / `cfop_exterior`
- `natureza_operacao`
- `tipo_contribuinte_nome`
- `eh_exportacao`

## 📖 Como usar

### Passo 1: Cadastrar Operação Fiscal

**Menu:** Parâmetros Fiscais → Operações Fiscais

```
Código: VENDA-ZFM
Nome: Venda para Zona Franca de Manaus
CFOP Dentro Estado: 6.109
CFOP Fora Estado: 6.109
Tipo Operação: VENDA
Natureza: VENDA PARA ZONA FRANCA DE MANAUS
```

### Passo 2: Criar Tipo de Contribuinte

**Menu:** Parâmetros Fiscais → Tipos de Contribuinte

```
Nome: Cliente Zona Franca de Manaus
Descrição: Cliente localizado na ZFM - Requer CFOP 6.109
Contribuinte ICMS: Contribuinte
Consumidor Final: Não
Operação Fiscal Padrão: VENDA-ZFM (6.109)  ← NOVO CAMPO
```

### Passo 3: Vincular Cliente

**Menu:** Cadastros → Clientes → **Dados Fiscais**

```
Tipo de Contribuinte: Cliente Zona Franca de Manaus
```

### Passo 4: Emitir NF-e

**Menu:** Notas Fiscais → Emitir Nota

1. Selecionar Cliente
2. ✅ **Sistema pré-seleciona automaticamente:**
   - Operação Fiscal: VENDA-ZFM
   - CFOP: 6.109
   - Natureza: VENDA PARA ZONA FRANCA DE MANAUS

## 🎨 Interface

### Tela: Cadastro de Tipos de Contribuinte

```
┌─────────────────────────────────────────────────────────┐
│ Novo Tipo de Contribuinte                               │
├─────────────────────────────────────────────────────────┤
│ Nome *                                                  │
│ [Cliente Zona Franca de Manaus_____________]           │
│                                                          │
│ Descrição                                               │
│ [Cliente localizado na ZFM - CFOP 6.109____]           │
│                                                          │
│ Contribuinte ICMS *        Consumidor Final             │
│ [1 - Contribuinte ▼]       [Não ▼]                     │
│                                                          │
│ Operação Fiscal Padrão                                  │
│ [VENDA-ZFM - Venda Zona Franca | CFOP: 6.109/6.109 ▼] │
│ 💡 Quando um cliente tiver este tipo, o sistema         │
│    pré-selecionará automaticamente esta operação        │
│                                                          │
│ Status                                                   │
│ [Ativo ▼]                                               │
│                                                          │
│              [Cancelar]  [Salvar]                       │
└─────────────────────────────────────────────────────────┘
```

## 🔍 Exemplos de uso prático

### Exemplo 1: Zona Franca de Manaus
```
Tipo: "Cliente Zona Franca"
Operação: CFOP 6.109
Clientes: SAMSUNG, LG, SONY (todas ZFM)
```

### Exemplo 2: Cliente com Suframa
```
Tipo: "Cliente com Suframa"
Operação: CFOP 6.109 (sem ICMS)
Clientes: Empresas da Amazônia com isenção
```

### Exemplo 3: Produtor Rural
```
Tipo: "Produtor Rural"
Operação: CFOP 5.102 (sem IE)
Clientes: Agricultores sem IE
```

### Exemplo 4: Revendedor ST
```
Tipo: "Revenda ST"
Operação: CFOP 5.405 (Substituição Tributária)
Clientes: Revendedores que precisam ST
```

### Exemplo 5: Exportação
```
Tipo: "Cliente no Exterior"
Operação: CFOP 7.102 (Exportação)
Clientes: Importadores internacionais
```

## 📊 Consultas SQL Úteis

### Ver tipos com operações vinculadas:
```sql
SELECT 
  tc.nome as tipo,
  of.codigo,
  of.nome as operacao,
  of.cfop_dentro_estado
FROM tipos_contribuinte tc
LEFT JOIN operacoes_fiscais of ON of.id = tc.operacao_fiscal_padrao_id
ORDER BY tc.nome;
```

### Ver clientes e suas operações padrão:
```sql
SELECT * FROM vw_clientes_com_operacao_padrao
WHERE operacao_fiscal_padrao_id IS NOT NULL;
```

### Buscar operação de um cliente específico:
```sql
SELECT * FROM get_operacao_fiscal_cliente(123, 'SP');
```

## 🚀 Próximos passos

### Implementar no formulário de emissão (pendente):
- [ ] Detectar quando cliente é selecionado
- [ ] Chamar `buscarOperacaoFiscalCliente()`
- [ ] Pré-preencher campo "Operação Fiscal"
- [ ] Mostrar tooltip informando qual tipo de contribuinte foi usado
- [ ] Permitir usuário trocar manualmente se necessário

## 📁 Arquivos criados/modificados

### Banco de Dados
- `database/vincular_tipo_contribuinte_operacao_fiscal.sql` (NOVO)

### Frontend
- `src/features/cadastros-fiscais/CadastroTiposContribuinte.tsx` (MODIFICADO)
  - Adicionado campo `operacao_fiscal_padrao_id`
  - Select de operações fiscais
  - Carregamento de operações fiscais

- `src/features/notas-fiscais/useOperacaoFiscalCliente.ts` (NOVO)
  - Hook para buscar operação fiscal do cliente
  - Função `buscarOperacaoFiscalCliente()`

- `docs/TIPO_CONTRIBUINTE_OPERACAO_FISCAL.md` (NOVO)
  - Documentação completa

## ✅ Checklist

- [x] Migration SQL criada
- [x] Campo `operacao_fiscal_padrao_id` adicionado
- [x] View `vw_clientes_com_operacao_padrao` criada
- [x] Função `get_operacao_fiscal_cliente()` criada
- [x] Exemplos de tipos de contribuinte inseridos
- [x] Componente `CadastroTiposContribuinte` atualizado
- [x] Hook `useOperacaoFiscalCliente` criado
- [x] Documentação completa
- [ ] Integração com formulário de emissão NF-e
- [ ] Testes em homologação

## 🎯 Benefícios

1. **Reduz erros:** Operação fiscal sempre correta
2. **Agiliza emissão:** Menos cliques, menos tempo
3. **Padronização:** Clientes similares seguem mesma regra
4. **Auditoria:** Rastro de qual tipo de contribuinte foi usado
5. **Flexibilidade:** Usuário pode trocar manualmente se necessário
