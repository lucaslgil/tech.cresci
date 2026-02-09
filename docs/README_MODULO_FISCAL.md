# 🚀 GUIA DE IMPLEMENTAÇÃO RÁPIDA - MÓDULO FISCAL 2026

## 📋 Visão Geral

Sistema completo de emissão de notas fiscais com suporte à **Reforma Tributária 2026** (IBS e CBS).

**O que foi desenvolvido:**
- ✅ Motor de cálculo tributário com IBS/CBS
- ✅ Emissão avulsa de NF-e e NFC-e
- ✅ Emissão de nota a partir de vendas
- ✅ Cálculo automático de impostos (sistema antigo + novo)
- ✅ Período de transição 2026-2033
- ✅ Alíquotas diferenciadas por NCM
- ✅ Interface completa e responsiva

---

## 🗂️ ARQUIVOS CRIADOS

### 1. **Database (SQL)**
```
📁 database/
├── reforma_tributaria_2026_ibs_cbs.sql      # Schema com IBS/CBS
├── funcoes_calculo_tributario.sql           # Funções de cálculo
└── AJUSTES_SISTEMA_FISCAL_COMPLETO.sql      # Já existe, base fiscal
```

### 2. **Frontend (TypeScript/React)**
```
📁 src/features/fiscal/
├── EmissaoNotasFiscais.tsx                  # Tela de emissão
├── notasFiscaisService.ts                   # Lógica de emissão
└── calculoTributarioService.ts              # Motor de cálculo
```

### 3. **Documentação**
```
📁 docs/
└── DOCUMENTACAO_MODULO_FISCAL_2026.md       # Documentação completa
```

---

## ⚡ INSTALAÇÃO RÁPIDA

### Passo 1: Executar Migrations no Supabase

Acesse o **Supabase SQL Editor** e execute na ordem:

```sql
-- 1. Base fiscal (se ainda não executou)
-- Copie e cole: database/AJUSTES_SISTEMA_FISCAL_COMPLETO.sql

-- 2. Reforma Tributária 2026 (IBS/CBS)
-- Copie e cole: database/reforma_tributaria_2026_ibs_cbs.sql

-- 3. Funções de Cálculo
-- Copie e cole: database/funcoes_calculo_tributario.sql
```

### Passo 2: Verificar Instalação

Execute para testar:

```sql
-- Verificar cronograma de transição
SELECT * FROM reforma_cronograma_transicao ORDER BY ano;

-- Testar cálculo de IBS/CBS
SELECT * FROM calcular_impostos_reforma(1000.00, 0.27, 0.12, 2026);

-- Ver alíquotas diferenciadas
SELECT * FROM reforma_aliquotas_ncm WHERE ativo = TRUE;
```

### Passo 3: Configurar Rota no Frontend

Adicione a rota no seu sistema:

```typescript
// src/App.tsx ou routes.tsx
import EmissaoNotasFiscais from './features/fiscal/EmissaoNotasFiscais'

// Adicionar rota
{
  path: '/fiscal/emissao',
  element: <EmissaoNotasFiscais />
}
```

---

## 🧪 TESTANDO O SISTEMA

### Teste 1: Emissão Avulsa

1. Acesse a tela de emissão
2. Selecione **"Emissão Avulsa"**
3. Escolha tipo: **NF-e (Modelo 55)**
4. Preencha destinatário:
   - CPF/CNPJ: `12345678901234`
   - Nome: `Cliente Teste`
5. Adicione um item:
   - Descrição: `Produto Teste`
   - NCM: `04021000` (Leite em pó - alíquota zero)
   - CFOP: `5102`
   - Quantidade: `10`
   - Valor Unitário: `100.00`
6. Clique em **"Emitir Nota Fiscal"**

**Resultado Esperado:**
- ✅ Nota criada com sucesso
- ✅ IBS/CBS calculados (1% em 2026)
- ✅ ICMS/PIS/COFINS calculados (100% em 2026)
- ✅ Status: RASCUNHO

### Teste 2: Emissão via Venda

1. Certifique-se de ter uma venda com status `PEDIDO_FECHADO` e sem nota fiscal vinculada
2. Acesse **"Emissão via Venda"**
3. Selecione a venda na lista
4. Clique em **"Emitir Nota Fiscal"**

**Resultado Esperado:**
- ✅ Dados da venda importados automaticamente
- ✅ Nota criada e vinculada à venda
- ✅ Status da venda atualizado para `FATURADO`

### Teste 3: Cálculo de Alíquota Diferenciada

Execute no SQL:

```sql
-- Buscar alíquota de cesta básica (deve retornar 0%)
SELECT * FROM buscar_aliquotas_reforma('04021000', CURRENT_DATE);

-- Buscar alíquota de medicamento (deve retornar redução de 60%)
SELECT * FROM buscar_aliquotas_reforma('30049099', CURRENT_DATE);

-- Simular tributação ao longo dos anos
SELECT * FROM simular_tributacao_transicao(1000.00, '04021000');
```

---

## 📊 CONSULTAS ÚTEIS

### Ver todas as notas emitidas
```sql
SELECT 
  id,
  tipo_nota,
  numero,
  serie,
  destinatario_nome,
  valor_total,
  valor_ibs,
  valor_cbs,
  status,
  data_emissao
FROM notas_fiscais
ORDER BY data_emissao DESC
LIMIT 20;
```

### Ver itens de uma nota
```sql
SELECT 
  numero_item,
  descricao,
  ncm,
  quantidade_comercial,
  valor_unitario_comercial,
  valor_total,
  valor_icms,
  valor_ibs,
  valor_cbs
FROM notas_fiscais_itens
WHERE nota_fiscal_id = 1;
```

### Comparar carga tributária
```sql
SELECT 
  ano,
  total_antigos,
  total_novos,
  total_geral,
  carga_tributaria
FROM simular_tributacao_transicao(1000.00, '04021000');
```

---

## 🎯 FLUXO DE USO

### Cenário 1: Loja de Varejo (NFC-e)

1. Cliente faz compra no PDV
2. Sistema cria pedido/venda
3. Operador acessa **Emissão de NFC-e**
4. Seleciona a venda
5. Sistema emite NFC-e automaticamente
6. Cliente recebe nota por e-mail

### Cenário 2: E-commerce (NF-e)

1. Cliente compra online
2. Sistema cria pedido
3. Pedido é confirmado (status: PEDIDO_FECHADO)
4. Sistema fiscal busca pedidos pendentes
5. Emite NF-e automaticamente
6. Envia XML e DANFE por e-mail

### Cenário 3: Venda B2B (NF-e Avulsa)

1. Venda negociada fora do sistema
2. Operador acessa **Emissão Avulsa**
3. Preenche dados do cliente e produtos
4. Sistema calcula tributos
5. Emite NF-e
6. Envia para SEFAZ (futuro)

---

## 🔍 TROUBLESHOOTING

### Problema: Erro "NCM inválido"
**Solução:** NCM deve ter exatamente 8 dígitos numéricos.

### Problema: Alíquota IBS/CBS não está sendo aplicada
**Solução:** Verifique se o produto tem NCM cadastrado corretamente.

### Problema: Erro ao calcular impostos
**Solução:** Execute:
```sql
-- Verificar se funções existem
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%calcula%';

-- Verificar se cronograma existe
SELECT COUNT(*) FROM reforma_cronograma_transicao;
```

### Problema: Venda não aparece para faturamento
**Solução:** Venda deve ter:
- `status = 'PEDIDO_FECHADO'`
- `nota_fiscal_id = NULL`

```sql
UPDATE vendas 
SET status = 'PEDIDO_FECHADO'
WHERE id = 123;
```

---

## 📈 ROADMAP DE INTEGRAÇÃO SEFAZ

### Fase 1: Preparação (CONCLUÍDA ✅)
- [x] Schema de banco de dados
- [x] Motor de cálculo tributário
- [x] Interface de emissão
- [x] Validações fiscais

### Fase 2: Geração de XML (PENDENTE)
- [ ] Gerar XML no layout NF-e 4.0
- [ ] Validar schema XSD
- [ ] Gerar chave de acesso
- [ ] Gerar QR Code (NFC-e)

### Fase 3: Assinatura Digital (PENDENTE)
- [ ] Integração com certificado A1
- [ ] Integração com certificado A3 (token/smart card)
- [ ] Assinar XML

### Fase 4: Comunicação SEFAZ (PENDENTE)
- [ ] Envio para autorização
- [ ] Tratamento de retorno
- [ ] Consulta de protocolo
- [ ] Eventos (cancelamento, carta de correção)

### Fase 5: Pós-Emissão (PENDENTE)
- [ ] Gerar DANFE (PDF)
- [ ] Envio automático por e-mail
- [ ] Download de XML
- [ ] Sincronização com contabilidade

---

## 🎓 CONCEITOS IMPORTANTES

### Reforma Tributária 2026

**IBS (Imposto sobre Bens e Serviços)**
- Substitui: ICMS + ISS
- Alíquota: 27% (padrão)
- Não-cumulativo (crédito pleno)

**CBS (Contribuição sobre Bens e Serviços)**
- Substitui: PIS + COFINS
- Alíquota: 12% (padrão)
- Não-cumulativo

**Transição:** 2026-2033 (ambos os sistemas simultaneamente)

### Códigos Fiscais

**NCM**: Nomenclatura Comum do Mercosul (8 dígitos)
- Exemplo: 04021000 (Leite em pó)

**CFOP**: Código Fiscal de Operações
- 5102: Venda de mercadoria
- 5101: Venda de produção própria
- 6102: Venda interestadual

**CST/CSOSN**: Código de Situação Tributária
- CST: Regime Normal
- CSOSN: Simples Nacional

---

## 📚 DOCUMENTAÇÃO COMPLETA

Para informações detalhadas, consulte:
- [DOCUMENTACAO_MODULO_FISCAL_2026.md](../docs/DOCUMENTACAO_MODULO_FISCAL_2026.md)

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Executar migrations no Supabase
- [ ] Verificar tabelas criadas
- [ ] Testar funções de cálculo
- [ ] Configurar empresa emissora
- [ ] Adicionar rota no frontend
- [ ] Testar emissão avulsa
- [ ] Testar emissão via venda
- [ ] Validar cálculos de impostos
- [ ] Revisar alíquotas diferenciadas
- [ ] Documentar fluxo para equipe

---

## 📞 SUPORTE

**Dúvidas Técnicas:**
- Consultar documentação completa
- Verificar logs do Supabase
- Testar consultas SQL

**Dúvidas Fiscais:**
- Consultar contador
- Verificar Manual NF-e
- Contatar SEFAZ do estado

---

**Desenvolvido em:** 13/01/2026  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para uso (sem integração SEFAZ)
