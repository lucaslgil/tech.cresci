# 🎯 SOLUÇÃO: NCM COM FORMATAÇÃO DIFERENTE

## ❌ PROBLEMA IDENTIFICADO

### Incompatibilidade de Formatação:

**No Cadastro de Produtos:**
```
NCM: 0000.00.00  (com pontos)
CEST: 0000000    (7 dígitos)
```

**Na Regra de Tributação:**
```
NCM: 00000000    (8 dígitos sem formatação)
CFOP: 5102       (4 dígitos)
```

**Resultado:** Motor fiscal não encontrava match porque comparava strings exatas!

---

## ✅ SOLUÇÃO IMPLEMENTADA

### 1️⃣ Normalização no Banco de Dados

**Script criado:** `database/NORMALIZAR_NCM_CFOP.sql`

**O que faz:**
- ✅ Remove formatação de NCM e CFOP (pontos, traços, etc)
- ✅ Padroniza: NCM = 8 dígitos, CFOP = 4 dígitos
- ✅ Cria função `normalizar_ncm_cfop()`
- ✅ Cria triggers automáticos para INSERT/UPDATE
- ✅ Valida match entre produtos e regras

**Exemplo de normalização:**
```sql
'0000.00.00' → '00000000'
'5.102'      → '5102'
'12.345.678' → '12345678'
```

### 2️⃣ Normalização no Motor Fiscal (TypeScript)

**Arquivo modificado:** `src/features/notas-fiscais/fiscalEngine.ts`

**Função adicionada:**
```typescript
function normalizarCodigoFiscal(codigo: string | null | undefined): string {
  if (!codigo) return ''
  return codigo.replace(/[^0-9]/g, '')
}
```

**Onde é usada:**
1. Na comparação de NCM entre produto e regra
2. Na comparação de CEST entre produto e regra  
3. Na comparação de CFOP entre contexto e regra

**Antes (linha 173):**
```typescript
if (r.ncm && r.ncm !== item.ncm) return false
```

**Depois:**
```typescript
const itemNCM = normalizarCodigoFiscal(item.ncm)
const regraNcm = normalizarCodigoFiscal(r.ncm)
if (regraNcm !== itemNCM) return false
```

---

## 🚀 COMO APLICAR A CORREÇÃO

### Passo 1: Executar SQL de Normalização

```bash
1. Abrir Supabase SQL Editor
2. Copiar e colar: database/NORMALIZAR_NCM_CFOP.sql
3. Executar
4. Verificar resultado: "✅ NORMALIZAÇÃO CONCLUÍDA"
```

**O script irá:**
- Remover pontos de NCMs: `0000.00.00` → `00000000`
- Remover pontos de CFOPs: `5.102` → `5102`
- Criar triggers para normalização automática
- Validar match entre produtos e regras

### Passo 2: Verificar Produtos e Regras

**Produtos:**
```sql
SELECT codigo_interno, nome, ncm, cfop_saida 
FROM produtos 
WHERE ativo = true;
```

**Esperado:**
```
000001 | Produto Teste  | 00000000 | 5102
000002 | PRODUTO 2 TEST | 00000000 | 5102
```

**Regras:**
```sql
SELECT id, nome, ncm, cfop_saida, aliquota_icms 
FROM regras_tributacao 
WHERE ativo = true;
```

**Esperado:**
```
1 | 00000000 | 00000000 | 5102 | 18.00
```

### Passo 3: Testar Emissão de NF-e

```bash
1. Acessar: Notas Fiscais > Emitir NF-e
2. Remover produtos existentes (botão Remover)
3. Adicionar produtos novamente
4. Verificar tabela de impostos
```

**Resultado esperado (item de R$ 50,00):**
```
BC ICMS:     R$ 50,00
Vlr. ICMS:   R$ 9,00   (18%)
Vlr. PIS:    R$ 0,83   (1,65%)
Vlr. COFINS: R$ 3,80   (7,60%)
```

---

## 🔍 VALIDAÇÃO DO MATCH

### Consulta de Validação:

```sql
SELECT 
    p.codigo_interno,
    p.nome,
    p.ncm as produto_ncm,
    p.cfop_saida as produto_cfop,
    r.nome as regra_nome,
    r.ncm as regra_ncm,
    r.cfop_saida as regra_cfop,
    r.aliquota_icms,
    CASE 
        WHEN p.ncm = r.ncm AND p.cfop_saida = r.cfop_saida 
        THEN '✅ MATCH PERFEITO'
        ELSE '❌ SEM MATCH'
    END as status
FROM produtos p
LEFT JOIN regras_tributacao r ON (
    r.ncm = p.ncm AND 
    r.cfop_saida = p.cfop_saida AND
    r.ativo = true
)
WHERE p.ativo = true;
```

**Resultado esperado:**
```
000001 | Produto Teste | 00000000 | 5102 | 00000000 | 00000000 | 5102 | 18.00 | ✅ MATCH PERFEITO
000002 | PRODUTO 2     | 00000000 | 5102 | 00000000 | 00000000 | 5102 | 18.00 | ✅ MATCH PERFEITO
```

---

## 📊 POR QUE NÃO USAR FK DIRETA?

### ❌ Abordagem Errada: FK `regra_tributacao_id` no produto

```sql
-- NÃO FAZER ISSO:
ALTER TABLE produtos 
ADD COLUMN regra_tributacao_id INTEGER 
REFERENCES regras_tributacao(id);
```

**Problemas:**
1. 🚫 Mesma mercadoria pode ter regras diferentes por UF
2. 🚫 CFOP muda conforme operação (dentro/fora do estado)
3. 🚫 Regime tributário do cliente influencia
4. 🚫 Não permite regras genéricas (fallback)
5. 🚫 Dificulta manutenção (alterar regra afeta todos os produtos)

### ✅ Abordagem Correta: Busca Dinâmica

**Critérios de match (em ordem de prioridade):**
1. NCM do produto
2. CFOP da operação (contexto)
3. UF Origem (empresa)
4. UF Destino (cliente)
5. Regime tributário (Simples, Presumido, Real)
6. Tipo de documento (NF-e, NFC-e)

**Motor fiscal escolhe a regra mais específica em tempo real!**

---

## 🎯 FLUXO CORRETO DE TRIBUTAÇÃO

```
┌─────────────────────────────────────────────────────────┐
│ 1. USUÁRIO ADICIONA PRODUTO NA NF-e                     │
│    - NCM: 0000.00.00 (pode ter formatação)              │
│    - CFOP: 5102                                          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 2. MOTOR FISCAL NORMALIZA CÓDIGOS                       │
│    normalizarCodigoFiscal("0000.00.00") → "00000000"    │
│    normalizarCodigoFiscal("5102") → "5102"              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 3. BUSCA REGRA DE TRIBUTAÇÃO                            │
│    SELECT * FROM regras_tributacao                      │
│    WHERE ncm = '00000000'                               │
│    AND cfop_saida = '5102'                              │
│    AND ativo = true                                     │
│    ORDER BY prioridade DESC LIMIT 1                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 4. APLICA ALÍQUOTAS DA REGRA                            │
│    - ICMS: 18%    → R$ 50,00 × 18% = R$ 9,00           │
│    - PIS: 1.65%   → R$ 50,00 × 1.65% = R$ 0,83         │
│    - COFINS: 7.60% → R$ 50,00 × 7.60% = R$ 3,80        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 5. EXIBE IMPOSTOS NA TABELA                             │
│    ✅ BC ICMS, Vlr. ICMS, Vlr. PIS, Vlr. COFINS        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 MANUTENÇÃO FUTURA

### Triggers Criados:

**1. `trg_normalizar_produtos`**
- Dispara: BEFORE INSERT OR UPDATE em `produtos`
- Função: Remove formatação de NCM e CFOP automaticamente
- Resultado: Usuário pode digitar `0000.00.00`, salva `00000000`

**2. `trg_normalizar_regras`**
- Dispara: BEFORE INSERT OR UPDATE em `regras_tributacao`
- Função: Remove formatação de NCM, CFOP e CEST automaticamente
- Resultado: Consistência garantida no banco

### Cadastro via Interface:

**Produtos:**
- Usuário digita: `1234.56.78`
- Trigger normaliza: `12345678`
- Motor fiscal compara: `12345678` = `12345678` ✅

**Regras:**
- Usuário digita: `5.102`
- Trigger normaliza: `5102`
- Motor fiscal compara: `5102` = `5102` ✅

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após executar o script SQL:

- [ ] Produtos com NCM sem formatação (8 dígitos)
- [ ] Produtos com CFOP sem formatação (4 dígitos)
- [ ] Regras com NCM sem formatação (8 dígitos)
- [ ] Regras com CFOP sem formatação (4 dígitos)
- [ ] Regras com alíquotas preenchidas (> 0)
- [ ] Match perfeito entre produto e regra (consulta SQL)
- [ ] Impostos calculados corretamente na emissão
- [ ] Console sem erros (F12)

---

## 📞 TROUBLESHOOTING

### Se os impostos ainda não aparecerem:

**1. Verificar NCM e CFOP normalizados:**
```sql
SELECT codigo_interno, ncm, LENGTH(ncm), cfop_saida, LENGTH(cfop_saida)
FROM produtos WHERE ativo = true;
```
Esperado: LENGTH(ncm) = 8, LENGTH(cfop_saida) = 4

**2. Verificar alíquotas preenchidas:**
```sql
SELECT nome, ncm, cfop_saida, aliquota_icms, aliquota_pis, aliquota_cofins
FROM regras_tributacao WHERE ativo = true;
```
Esperado: Todas as alíquotas > 0

**3. Verificar console do navegador:**
```
F12 → Console
Procurar por: "✅ Item calculado com impostos"
            ou "❌ Erro ao calcular tributos"
```

**4. Testar busca de regra manualmente:**
```sql
SELECT * FROM regras_tributacao
WHERE ncm = '00000000'
AND cfop_saida = '5102'
AND ativo = true;
```
Deve retornar 1 regra com alíquotas preenchidas.

---

## 🎓 LIÇÕES APRENDIDAS

1. ✅ **NCM e CFOP devem ser armazenados SEM formatação** (apenas números)
2. ✅ **Triggers garantem normalização automática** no INSERT/UPDATE
3. ✅ **Motor fiscal deve normalizar antes de comparar** (função TypeScript)
4. ✅ **Busca dinâmica é superior a FK direta** (flexibilidade tributária)
5. ✅ **Regras específicas têm prioridade** sobre regras genéricas
6. ✅ **Validação de match é essencial** para debug tributário

---

## 📚 ARQUIVOS RELACIONADOS

- ✅ `database/NORMALIZAR_NCM_CFOP.sql` - Normalização e triggers
- ✅ `database/VALIDAR_E_CORRIGIR_REGRA_TRIBUTACAO.sql` - Alíquotas
- ✅ `src/features/notas-fiscais/fiscalEngine.ts` - Motor fiscal
- ✅ `src/features/cadastro/produtos/CadastroProdutos.tsx` - Interface
- ✅ `src/features/notas-fiscais/ParametrosFiscais.tsx` - Regras

---

**✅ Solução completa implementada!**
**🚀 Execute o SQL e teste a emissão de NF-e!**
