# 🎯 GUIA COMPLETO: ONDE EDITAR ALÍQUOTAS IBS/CBS

## 📍 **1. REGRAS DE TRIBUTAÇÃO** ⭐ PRINCIPAL

### **Caminho no sistema:**
```
Menu → NOTAS FISCAIS → Parâmetros Fiscais → Regras de Tributação
```

### **Campos disponíveis:**

#### **Seção "Reforma Tributária 2026 - IBS e CBS"** (nova)
- ✅ **Alíquota IBS (%)**: Campo para informar/alterar alíquota de IBS
  - Padrão: 27%
  - Cesta básica: 0%
  - Medicamentos: 16,2% (60% de redução)
  - _Deixe em branco para usar alíquota por NCM automaticamente_

- ✅ **Alíquota CBS (%)**: Campo para informar/alterar alíquota de CBS
  - Padrão: 12%
  - Cesta básica: 0%
  - Medicamentos: 7,2% (60% de redução)
  - _Deixe em branco para usar alíquota por NCM automaticamente_

- ✅ **CST IBS**: Código de situação tributária do IBS
  - 00 - Tributado Integralmente
  - 10 - Tributado com Redução de BC
  - 20 - Tributado com Diferimento
  - 30 - Isento
  - 40 - Não Tributado
  - 41 - Suspenso

- ✅ **CST CBS**: Código de situação tributária da CBS
  - Mesmas opções do CST IBS

- ✅ **Redução BC IBS (%)**: Percentual de redução da base de cálculo do IBS

- ✅ **Redução BC CBS (%)**: Percentual de redução da base de cálculo da CBS

- ✅ **Diferimento IBS (%)**: Percentual de diferimento do IBS

- ✅ **Diferimento CBS (%)**: Percentual de diferimento da CBS

- ✅ **Ano de Vigência**: Ano inicial da regra (padrão: 2026)

- ✅ **Base de Cálculo IBS Diferenciada**: Checkbox para BC não padrão

- ✅ **Base de Cálculo CBS Diferenciada**: Checkbox para BC não padrão

### **Funcionalidade:**
As regras de tributação permitem configurar alíquotas IBS/CBS por:
- **NCM específico** (ex: todo produto com NCM 10061010 = Arroz)
- **CFOP específico** (ex: toda venda 5102)
- **Combinação NCM + CFOP + UF** (regras ultra específicas)
- **Categoria de produto**

**Exemplo de uso:**
1. Criar regra para NCM 10061010 (Arroz)
2. Informar IBS 0%, CBS 0%
3. TODOS os produtos com este NCM usarão essas alíquotas automaticamente

---

## 📍 **2. CADASTRO DE NCM** (Alíquotas diferenciadas nacionais)

### **Caminho no sistema:**
```
Menu → PARÂMETROS FISCAIS → Cadastros Auxiliares → NCM
```

### **Para produtos com alíquota diferenciada:**
O sistema já tem tabela `reforma_aliquotas_ncm` com 7 NCMs cadastrados:
- **Arroz** (10061010): IBS 0%, CBS 0%
- **Feijão** (07131010): IBS 0%, CBS 0%
- **Leite em pó** (04021000): IBS 0%, CBS 0%
- **Farinha de trigo** (19012000): IBS 0%, CBS 0%
- **Medicamentos** (30049099): IBS 16,2%, CBS 7,2% (redução 60%)
- **Livros didáticos** (49011000): IBS 0%, CBS 0%
- **Equipamentos médicos** (90189099): IBS 13,5%, CBS 6% (redução 50%)

**Para adicionar novos NCMs com alíquota diferenciada:**
```sql
INSERT INTO reforma_aliquotas_ncm (
  ncm, 
  descricao_ncm, 
  aliquota_ibs_reduzida, 
  aliquota_cbs_reduzida, 
  tem_aliquota_diferenciada, 
  tipo_beneficio,
  motivo_diferenciacao
) VALUES (
  '12345678', 
  'Nome do produto',
  0.10, -- 10% IBS ao invés de 27%
  0.05, -- 5% CBS ao invés de 12%
  TRUE,
  'CESTA_BASICA',
  'Produto essencial - alíquota reduzida'
);
```

---

## 📍 **3. VISUALIZAÇÃO EM TELA DE EMISSÃO DE NOTA**

### **Caminho no sistema:**
```
Menu → INVENTÁRIO → Emissão de Notas Fiscais
```

### **Como funciona:**
- Quando você **seleciona um produto** na nota fiscal
- O sistema **busca automaticamente** as alíquotas na seguinte ordem:
  1. **Regra de Tributação** específica (NCM + CFOP + UF)
  2. Se não encontrar, busca por **NCM na tabela de exceções** (`reforma_aliquotas_ncm`)
  3. Se não encontrar, busca no **produto** (`produtos.aliquota_ibs`)
  4. Se não encontrar, usa **padrão** (IBS 27%, CBS 12%)
- Calcula **automaticamente** baseado no cronograma de transição do ano
- Em 2026: cobra 100% antigo + 1% novo
- Em 2033: cobra 0% antigo + 100% novo

### **Campos exibidos na nota:**
- ✅ Valor IBS calculado (por item e total)
- ✅ Valor CBS calculado (por item e total)
- ✅ Valores sistema antigo (ICMS/PIS/COFINS)
- ✅ Carga tributária total

---

## 🔄 **FLUXO AUTOMÁTICO DE CÁLCULO COM PRIORIDADES**

```
PRODUTO ADICIONADO NA NOTA FISCAL
    ↓
[1] Sistema busca REGRA DE TRIBUTAÇÃO para:
    - NCM + CFOP + UF do destinatário
    - Se encontrar, usa alíquotas da regra ✅
    ↓
[2] Se não encontrar regra, busca por NCM na tabela de exceções
    - reforma_aliquotas_ncm (cesta básica, medicamentos)
    - Se encontrar, usa alíquotas da exceção ✅
    ↓
[3] Se não encontrar exceção, busca no produto
    - produtos.aliquota_ibs e produtos.aliquota_cbs
    - Se encontrar, usa alíquotas do produto ✅
    ↓
[4] Se não encontrar em nenhum lugar, usa PADRÃO
    - IBS 27%, CBS 12% ✅
    ↓
[5] Busca cronograma do ano (ex: 2026 = 1% novo, 100% antigo)
    ↓
[6] Calcula impostos proporcionalmente:
    - ICMS = base × 18% × 100%
    - PIS = base × 1,65% × 100%
    - COFINS = base × 7,6% × 100%
    - IBS = base × alíquota_encontrada × 1%
    - CBS = base × alíquota_encontrada × 1%
    ↓
[7] Grava nota com AMBOS os valores
```

---

## 💡 **EXEMPLOS PRÁTICOS**

### **Exemplo 1: Regra de Tributação específica (MAIS COMUM)**
```
Configuração:
- Regra: NCM 10061010 (Arroz) + CFOP 5102 + Qualquer UF
- Alíquota IBS: 0%
- Alíquota CBS: 0%

Resultado na nota:
- Produto: Arroz Tipo 1 (NCM 10061010)
- CFOP: 5102
- Sistema encontra a REGRA e aplica:
  IBS 0%, CBS 0%
- Em 2026: R$ 0,00 IBS + R$ 0,00 CBS sobre R$ 1.000
```

### **Exemplo 2: Exceção por NCM (SEM regra específica)**
```
Configuração:
- Não tem regra de tributação
- Mas existe exceção na tabela reforma_aliquotas_ncm
- NCM 30049099: IBS 16,2%, CBS 7,2%

Resultado na nota:
- Produto: Dipirona 500mg (NCM 30049099)
- Sistema não encontra REGRA
- Sistema encontra EXCEÇÃO por NCM e aplica:
  IBS 16,2%, CBS 7,2%
- Em 2026: R$ 1,62 IBS + R$ 0,72 CBS sobre R$ 1.000
```

### **Exemplo 3: Produto padrão (sem regra nem exceção)**
```
Configuração:
- Não tem regra de tributação
- Não tem exceção no NCM
- Produto não tem alíquota customizada

Resultado na nota:
- Produto: Mouse USB (NCM 85176255)
- Sistema não encontra REGRA
- Sistema não encontra EXCEÇÃO
- Sistema não encontra alíquota no PRODUTO
- Sistema usa PADRÃO:
  IBS 27%, CBS 12%
- Em 2026: R$ 2,70 IBS + R$ 1,20 CBS sobre R$ 1.000
```

---

## ✅ **RESUMO FINAL**

| Local | Funcionalidade | Prioridade | Status |
|-------|----------------|------------|--------|
| **Regras de Tributação** | Configurar por NCM/CFOP/UF | 🥇 1ª | ✅ PRONTO |
| **Tabela reforma_aliquotas_ncm** | Exceções nacionais por NCM | 🥈 2ª | ✅ PRONTO |
| **Cadastro de Produtos** | Alíquota específica produto | 🥉 3ª | ✅ PRONTO |
| **Padrão do sistema** | IBS 27%, CBS 12% | 4ª | ✅ PRONTO |
| **Emissão de Notas** | Cálculo automático com transição | - | ✅ PRONTO |
| **Cronograma de transição** | Percentuais progressivos ano a ano | - | ✅ PRONTO |

---

## 🎯 **PARA ALTERAR ALÍQUOTA (RECOMENDADO):**

### **Opção 1: Criar Regra de Tributação** (MELHOR FORMA)

1. Acesse **Menu → NOTAS FISCAIS → Parâmetros Fiscais → Regras de Tributação**
2. Clique em **"Nova Regra"**
3. Preencha:
   - **Nome**: Ex: "Arroz - Cesta Básica"
   - **NCM**: 10061010 (opcional, mas recomendado)
   - **CFOP**: Deixe em branco para aplicar em todos CFOPs
   - Role até **"Reforma Tributária 2026"**
   - **Alíquota IBS**: 0
   - **Alíquota CBS**: 0
4. Clique em **Salvar**
5. ✅ Pronto! Todos produtos com este NCM terão IBS/CBS zerados

### **Opção 2: Adicionar Exceção Nacional por NCM** (SQL direto)
