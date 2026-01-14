# 🚀 GUIA DE HOMOLOGAÇÃO - SISTEMA FISCAL

## ✅ CHECKLIST PRÉ-EMISSÃO

### 1. Executar Migration no Banco de Dados

Execute o arquivo `AJUSTES_SISTEMA_FISCAL_COMPLETO.sql` no Supabase SQL Editor:

```sql
-- Arquivo: database/AJUSTES_SISTEMA_FISCAL_COMPLETO.sql
-- Este arquivo adiciona:
-- - Regime tributário nas empresas
-- - Tipo de documento nas regras
-- - Campos ISS para NFS-e
-- - Mensagens fiscais automáticas
-- - Validações obrigatórias
-- - Prioridade de regras
```

### 2. Configurar Dados da Empresa Emitente

Acesse **Cadastro → Empresa** e preencha:

✅ Regime Tributário: `SIMPLES`, `PRESUMIDO` ou `REAL`
✅ Inscrição Estadual (se contribuinte ICMS)
✅ Inscrição Municipal (para NFS-e)
✅ CNAE Principal
✅ UF e Código do Município (IBGE)
✅ Endereço completo com bairro

### 3. Configurar Regras de Tributação

Acesse **Notas Fiscais → Regras de Tributação** e crie regras:

#### Para NF-e (Produtos - Simples Nacional):

```
Nome: Venda Dentro do Estado - Simples Nacional
Tipo de Documento: NFE
NCM: (deixe em branco para regra genérica ou preencha específico)
UF Origem: SP (sua UF)
UF Destino: SP (mesma UF)
CFOP Saída: 5102

ICMS:
  CSOSN: 102 (Tributada pelo Simples Nacional sem permissão de crédito)
  Alíquota ICMS: 0.00

PIS:
  CST: 49 (Outras Saídas)
  Alíquota: 0.00

COFINS:
  CST: 49 (Outras Saídas)
  Alíquota: 0.00

IPI:
  CST: 53 (Saída não tributada)
  Alíquota: 0.00

Mensagem Fiscal:
"DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. NÃO GERA DIREITO A CRÉDITO FISCAL DE ICMS."
```

#### Para NF-e (Produtos - Regime Normal):

```
Nome: Venda Dentro do Estado - Regime Normal
Tipo de Documento: NFE
UF Origem: SP
UF Destino: SP
CFOP Saída: 5102

ICMS:
  CST: 00 (Tributada Integralmente)
  Alíquota ICMS: 18.00 (varia por estado)
  Modalidade BC: 3 (Valor da operação)

PIS:
  CST: 01 (Operação Tributável - BC = Valor da operação)
  Alíquota: 1.65

COFINS:
  CST: 01 (Operação Tributável - BC = Valor da operação)
  Alíquota: 7.60

IPI:
  CST: 53 (Saída não tributada)
  Alíquota: 0.00
```

#### Para NFS-e (Serviços):

```
Nome: Prestação de Serviço Local
Tipo de Documento: NFSE
UF Origem: SP
UF Destino: SP
Município Incidência ISS: (código IBGE do município)

ISS:
  Alíquota ISS: 5.00 (varia por município e tipo de serviço)
  Retenção ISS: NÃO (ou SIM se for o caso)
  Item Lista Serviço: 01.01 (conforme LC 116/2003)
  Código Tributação: (conforme tabela do município)

PIS:
  CST: 01
  Alíquota: 0.65

COFINS:
  CST: 01
  Alíquota: 3.00

IR:
  Alíquota: 1.50 (se aplicável)

CSLL:
  Alíquota: 1.00 (se aplicável)

INSS:
  Alíquota: 0.00 (se não retém)
```

### 4. Cadastrar Produtos/Serviços

Todos os produtos devem ter:

**Para Produtos (NF-e/NFC-e):**
✅ NCM completo (8 dígitos) - OBRIGATÓRIO
✅ CEST (se sujeito à ST)
✅ CFOP padrão
✅ Unidade de medida
✅ Preço de venda
✅ Tipo Produto: `MERCADORIA`

**Para Serviços (NFS-e):**
✅ Descrição completa
✅ Item da Lista de Serviços (LC 116/2003)
✅ Alíquota ISS
✅ Tipo Produto: `SERVICO`

### 5. Cadastrar Clientes

Todos os clientes devem ter:

✅ CPF ou CNPJ válido
✅ Nome/Razão Social
✅ Endereço completo (Logradouro, Número, Bairro, CEP, Cidade, UF)
✅ Código do Município (IBGE)
✅ Indicador IE: `Contribuinte`, `Isento` ou `Não Contribuinte`
✅ Email (para envio do XML/DANFE)

---

## 🎯 FLUXO DE EMISSÃO

### Emissão de NF-e (Produto)

1. **Menu:** Notas Fiscais → Emitir Nota Fiscal
2. **Tipo de Nota:** Selecionar `NF-e (Modelo 55)`
3. **Série:** 1 (ou série configurada no SEFAZ)
4. **Destinatário:** Selecionar cliente cadastrado
5. **Adicionar Produtos:**
   - Código do produto
   - Quantidade
   - Valor unitário
   - NCM será preenchido automaticamente
6. **Calcular Tributos:** Sistema aplicará regras automaticamente
7. **Revisar:** Verificar todos os impostos calculados
8. **Validar:** Sistema executará validações obrigatórias
9. **Emitir:** Enviar para SEFAZ

### Emissão de NFC-e (Consumidor)

Mesmo fluxo da NF-e, mas:
- Tipo de Nota: `NFC-e (Modelo 65)`
- Destinatário pode ser não identificado (venda balcão)
- Forma de pagamento obrigatória

### Emissão de NFS-e (Serviço)

1. **Menu:** Notas Fiscais → Emitir Nota Fiscal
2. **Tipo de Nota:** Selecionar `NFS-e (Serviço)`
3. **Tomador:** Selecionar cliente
4. **Adicionar Serviços:**
   - Descrição do serviço
   - Item da Lista LC 116/2003
   - Valor
5. **ISS:** Será calculado automaticamente
6. **Retenções:** IR, CSLL, INSS conforme regras
7. **Validar e Emitir**

---

## ⚠️ VALIDAÇÕES AUTOMÁTICAS

O sistema bloqueia emissão caso:

### NF-e / NFC-e:
❌ NCM ausente ou incompleto (8 dígitos)
❌ CFOP não preenchido
❌ CST/CSOSN não compatível com regime tributário
❌ ISS aplicado em produto
❌ ICMS-ST sem CEST

### NFS-e:
❌ Alíquota ISS não informada
❌ Item da Lista de Serviços ausente
❌ Município de incidência não informado
❌ ICMS aplicado em serviço
❌ IPI aplicado em serviço

---

## 📋 ORDEM DE PRIORIDADE DAS REGRAS

O sistema busca a regra mais específica nesta ordem:

1. **Máxima Especificidade:**
   - Tipo Documento + NCM + UF Origem + UF Destino + CFOP + Operação Fiscal

2. **Alta Especificidade:**
   - Tipo Documento + NCM + UF Destino + CFOP

3. **Média Especificidade:**
   - Tipo Documento + NCM
   - Tipo Documento + CFOP + UF Destino

4. **Baixa Especificidade:**
   - Tipo Documento + UF Destino
   - Tipo Documento + CFOP

5. **Genérica:**
   - Apenas Tipo Documento

**Importante:** Regras com maior prioridade manual sempre serão escolhidas primeiro!

---

## 🧪 TESTES EM HOMOLOGAÇÃO

### 1. Configurar Certificado Digital A1

No Supabase, adicionar na tabela `parametros_fiscais`:

```sql
INSERT INTO parametros_fiscais (
  chave,
  valor,
  tipo
) VALUES (
  'certificado_a1',
  '{"base64": "conteúdo_do_certificado", "senha": "senha_do_certificado"}',
  'JSON'
),
(
  'ambiente_nfe',
  'homologacao',
  'STRING'
);
```

### 2. Teste de NF-e Simples Nacional

```
Emitir NF-e com:
- Destinatário: CPF 111.111.111-11 (homologação)
- Produto: Qualquer produto com NCM
- Valor: R$ 100,00
- CSOSN: 102
```

**Resultado esperado:**
- Status: Autorizada
- Protocolo SEFAZ retornado
- XML gerado corretamente
- DANFE disponível para download

### 3. Teste de NF-e com ICMS-ST

```
Emitir NF-e com:
- Produto sujeito à ST (ex: bebidas NCM 2203)
- CEST preenchido
- MVA configurado na regra
```

**Resultado esperado:**
- ICMS-ST calculado corretamente
- Base de cálculo ST = (Valor + IPI) * (1 + MVA)
- Valor ICMS-ST = (BC ST * Aliq Interna) - ICMS Próprio

### 4. Teste de NFS-e

```
Emitir NFS-e com:
- Serviço com item da lista
- ISS 5%
- Sem retenções
```

**Resultado esperado:**
- ISS calculado corretamente
- RPS gerado e convertido em NFS-e
- Código de verificação disponível

---

## 🐛 TROUBLESHOOTING

### Erro: "NCM é obrigatório"
**Solução:** Cadastrar NCM no produto antes de adicionar ao pedido

### Erro: "CSOSN incompatível com regime"
**Solução:** Verificar regime tributário da empresa e ajustar regra

### Erro: "Regra de tributação não encontrada"
**Solução:** Criar regra genérica por tipo de documento

### Erro: "Certificado Digital inválido"
**Solução:** Verificar validade e senha do certificado A1

### Erro: "Rejeição 765: ICMS da operação própria difere"
**Solução:** Revisar cálculo do ICMS na regra de tributação

---

## 📞 SUPORTE

Em caso de dúvidas sobre:
- **Legislação Fiscal:** Consultar contador ou SEFAZ
- **Sistema:** Documentação técnica em `/docs`
- **Configuração:** Este guia

---

## ✅ CHECKLIST FINAL ANTES DE PRODUÇÃO

- [ ] Todas as validações testadas em homologação
- [ ] Pelo menos 10 NF-e emitidas e autorizadas
- [ ] Certificado Digital A1 válido e configurado
- [ ] Backup das regras de tributação
- [ ] Empresa completamente cadastrada
- [ ] Produtos com NCM e CEST corretos
- [ ] Clientes com endereço completo
- [ ] Mensagens fiscais configuradas
- [ ] Contador aprovou a parametrização

---

## 📌 LEMBRETE IMPORTANTE

> ⚠️ **ATENÇÃO:** Este sistema é uma ferramenta de apoio. A responsabilidade fiscal permanece com a empresa emitente e seu contador. Sempre valide as configurações tributárias com um profissional contábil antes de emitir notas em produção.

---

**Versão:** 2.0 - Janeiro 2026
**Status:** ✅ Pronto para homologação
