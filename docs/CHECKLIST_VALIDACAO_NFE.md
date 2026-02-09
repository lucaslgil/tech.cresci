# ✅ Checklist de Validação para Emissão de NF-e

## 📋 Este documento lista TODOS os campos necessários para emitir uma NF-e

---

## 1️⃣ DADOS DO EMITENTE (OBRIGATÓRIOS)

- [ ] **CNPJ**: 14 dígitos, apenas números
- [ ] **Razão Social**: Até 60 caracteres
- [ ] **Inscrição Estadual (IE)**: Numérico, 2-14 dígitos (enviar apenas se preenchido)
- [ ] **CRT** (Código Regime Tributário): 1, 2 ou 3
- [ ] **Endereço**:
  - [ ] Logradouro: Até 60 caracteres
  - [ ] Número: Até 60 caracteres
  - [ ] Complemento: Até 60 caracteres (opcional)
  - [ ] Bairro: Até 60 caracteres
  - [ ] **Código Município**: 7 dígitos (ex: 3549706)
  - [ ] Município: Até 60 caracteres
  - [ ] UF: 2 caracteres
  - [ ] CEP: 8 dígitos

---

## 2️⃣ DADOS DO DESTINATÁRIO (OBRIGATÓRIOS)

- [ ] **CPF ou CNPJ**: 11 ou 14 dígitos, apenas números
- [ ] **Nome/Razão Social**: Até 60 caracteres
- [ ] **Indicador IE** (indIEDest):
  - 1 = Contribuinte ICMS (IE obrigatória)
  - 2 = Contribuinte isento (IE opcional)
  - 9 = Não contribuinte (IE não deve ser enviada)
- [ ] **Inscrição Estadual (IE)**: 
  - Se indIEDest = 1: Obrigatória, formato numérico 2-14 dígitos
  - Se indIEDest = 9: NÃO enviar o campo
- [ ] **Endereço**:
  - [ ] Logradouro: Até 60 caracteres
  - [ ] Número: Até 60 caracteres
  - [ ] Complemento: Até 60 caracteres (opcional, não enviar se vazio)
  - [ ] Bairro: Até 60 caracteres
  - [ ] **Código Município**: 7 dígitos (ex: 3549706)
  - [ ] Município: Até 60 caracteres
  - [ ] UF: 2 caracteres
  - [ ] CEP: 8 dígitos

---

## 3️⃣ IDENTIFICAÇÃO DA NOTA (OBRIGATÓRIOS)

- [ ] **Ambiente** (tpAmb): 1 = Produção, 2 = Homologação
- [ ] **Série**: Número inteiro (geralmente 1)
- [ ] **Número**: Número inteiro sequencial
- [ ] **Modelo**: 55 (NF-e) ou 65 (NFC-e)
- [ ] **Código UF**: Código IBGE da UF (ex: SP = 35)
- [ ] **Natureza da Operação**: Texto até 60 chars (ex: "VENDA DE MERCADORIA")
- [ ] **Finalidade** (finNFe): 
  - 1 = Normal
  - 2 = Complementar
  - 3 = Ajuste
  - 4 = Devolução
- [ ] **Tipo de Nota** (tpNF): 0 = Entrada, 1 = Saída
- [ ] **Indicador Operação**: 1 = Interna, 2 = Interestadual, 3 = Exterior
- [ ] **Código Município Geração**: 7 dígitos
- [ ] **Tipo Impressão**: 1 = Retrato, 2 = Paisagem
- [ ] **Tipo Emissão**: 1 = Normal
- [ ] **Indicador Consumidor Final**: 0 = Não, 1 = Sim
- [ ] **Indicador Presença**: 
  - 0 = Não se aplica
  - 1 = Presencial
  - 2 = Internet
  - 3 = Teleatendimento
  - 4 = Entrega em domicílio
  - 9 = Outros
- [ ] **Processo Emissão**: 0 = Aplicação própria

---

## 4️⃣ ITENS/PRODUTOS (MÍNIMO 1)

Para cada item:

- [ ] **nItem**: Número sequencial (1, 2, 3...) - **TIPO INTEGER**
- [ ] **Código Produto**: Alfanumérico
- [ ] **Descrição**: Até 120 caracteres
- [ ] **NCM**: 8 dígitos
- [ ] **CFOP**: 4 dígitos
- [ ] **Unidade Comercial**: Até 6 caracteres (ex: UN, KG, PC)
- [ ] **Quantidade Comercial**: Número decimal - **TIPO DOUBLE**
- [ ] **Valor Unitário Comercial**: Número decimal com até 10 casas - **TIPO DOUBLE**
- [ ] **Valor Total Bruto**: Número decimal - **TIPO DOUBLE**
- [ ] **EAN Comercial**: "SEM GTIN" se não tiver código de barras
- [ ] **EAN Tributável**: "SEM GTIN" se não tiver código de barras
- [ ] **Unidade Tributável**: Até 6 caracteres
- [ ] **Quantidade Tributável**: Número decimal - **TIPO DOUBLE**
- [ ] **Valor Unitário Tributável**: Número decimal - **TIPO DOUBLE**

### 4.1 Impostos do Item:

#### ICMS:
- [ ] **Origem** (orig): 0-8 (0 = Nacional)
- [ ] **CST**: 2 dígitos (00, 10, 20, 30, 40, 41, 50, 51, 60, 70, 90)
- [ ] **Modalidade BC** (modBC): 0-3 (quando aplicável)
- [ ] **Base de Cálculo**: Número decimal - **TIPO DOUBLE**
- [ ] **Alíquota**: Número decimal - **TIPO DOUBLE**
- [ ] **Valor**: Número decimal - **TIPO DOUBLE**

#### PIS:
- [ ] **CST**: 2 dígitos (01-99)
- [ ] **Base de Cálculo**: Número decimal - **TIPO DOUBLE**
- [ ] **Alíquota**: Número decimal - **TIPO DOUBLE**
- [ ] **Valor**: Número decimal - **TIPO DOUBLE**

#### COFINS:
- [ ] **CST**: 2 dígitos (01-99)
- [ ] **Base de Cálculo**: Número decimal - **TIPO DOUBLE**
- [ ] **Alíquota**: Número decimal - **TIPO DOUBLE**
- [ ] **Valor**: Número decimal - **TIPO DOUBLE**

---

## 5️⃣ TOTAIS (OBRIGATÓRIOS)

- [ ] **Valor Total Produtos**: Soma dos itens - **TIPO DOUBLE**
- [ ] **Valor Total NF**: Total geral - **TIPO DOUBLE**
- [ ] **Base Cálculo ICMS**: Número decimal - **TIPO DOUBLE**
- [ ] **Valor ICMS**: Número decimal - **TIPO DOUBLE**
- [ ] **Valor Frete**: Número decimal - **TIPO DOUBLE**
- [ ] **Valor Seguro**: Número decimal - **TIPO DOUBLE**
- [ ] **Valor Desconto**: Número decimal - **TIPO DOUBLE**
- [ ] **Outras Despesas**: Número decimal - **TIPO DOUBLE**

---

## 6️⃣ TRANSPORTE (OBRIGATÓRIO)

- [ ] **Modalidade Frete** (modFrete): 
  - 0 = Por conta emitente
  - 1 = Por conta destinatário
  - 2 = Por conta terceiros
  - 9 = Sem frete

---

## 7️⃣ PAGAMENTO (OBRIGATÓRIO)

- [ ] **Forma de Pagamento** (tPag): String com 2 dígitos (ex: "01", "03", "15")
  - "01" = Dinheiro
  - "02" = Cheque
  - "03" = Cartão Crédito
  - "04" = Cartão Débito
  - "05" = Crédito Loja
  - "15" = Boleto
  - "99" = Outros
- [ ] **Valor Pago**: Número decimal - **TIPO DOUBLE**

---

## 🔍 VALIDAÇÕES DE TIPOS (CRÍTICO!)

### INTEGERS (números inteiros sem aspas):
- cUF, mod, serie, nNF, tpNF, idDest, cMunFG, tpImp, tpEmis, tpAmb, finNFe
- indFinal, indPres, procEmi, CRT, indIEDest, nItem, orig, modBC, indTot, modFrete

### STRINGS (texto com aspas):
- CNPJ, CPF, xNome, xLgr, nro, xCpl, xBairro, xMun, UF, CEP
- NCM, CFOP, CST, IE (quando enviada), tPag (com padStart), natOp

### DOUBLES (números decimais sem aspas):
- qCom, vUnCom, vProd, qTrib, vUnTrib
- vBC, pICMS, vICMS
- vPIS, pPIS
- vCOFINS, pCOFINS
- vNF, vFrete, vSeg, vDesc

---

## ⚠️ REGRAS ESPECIAIS

1. **IE (Inscrição Estadual)**:
   - Emitente: Enviar apenas se tiver valor
   - Destinatário: 
     - Se indIEDest = 1 (Contribuinte): OBRIGATÓRIO
     - Se indIEDest = 9 (Não Contribuinte): NÃO ENVIAR

2. **Complemento (xCpl)**:
   - Enviar apenas se não estiver vazio

3. **Código Município**:
   - Sempre 7 dígitos (usar padStart se necessário)
   - Obrigatório para emitente e destinatário

4. **Forma de Pagamento (tPag)**:
   - Sempre STRING com 2 dígitos
   - Usar padStart(2, '0')

5. **nItem**:
   - Sempre INTEGER (não string)
   - Sequencial começando em 1

---

## 🎯 CHECKLIST PRÉ-EMISSÃO

Antes de tentar emitir, verifique:

- [ ] Todos os campos obrigatórios preenchidos
- [ ] Tipos de dados corretos (integer, string, double)
- [ ] IE do destinatário: só enviar se indIEDest = 1
- [ ] Códigos de município com 7 dígitos
- [ ] Forma de pagamento como string com 2 dígitos
- [ ] Valores numéricos sem aspas (exceto strings)
- [ ] NCM com 8 dígitos
- [ ] CFOP com 4 dígitos
- [ ] CST com 2 dígitos

---

## 📝 LOG DE VALIDAÇÃO

O sistema agora exibe log completo mostrando:
- ✓ = Campo correto
- ⚠️ = Campo opcional não enviado
- ❌ = Campo com erro

Sempre conferir o console antes de reportar erros!
