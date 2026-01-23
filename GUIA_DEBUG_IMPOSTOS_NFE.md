# 🔍 GUIA DE VALIDAÇÃO - CÁLCULO DE IMPOSTOS NF-e

**Data:** 23/01/2026  
**Problema:** Impostos não aparecem na tabela da NF-e  
**Causa:** Regra de tributação incompleta

---

## 🎯 ANÁLISE DOS PRINTS

### ✅ O que está CORRETO:
- ✅ Produtos cadastrados: 000001 e 000002
- ✅ NCM: `00000000`
- ✅ CFOP: `5102`
- ✅ Regra existe: NCM `00000000` + CFOP `5102`
- ✅ CSOSN: `101`
- ✅ CST PIS: `01`
- ✅ CST COFINS: `01`

### ❌ O que está FALTANDO:
- ❌ **Alíquota ICMS** não preenchida
- ❌ **Alíquota PIS** não preenchida
- ❌ **Alíquota COFINS** não preenchida
- ❌ **Origem da Mercadoria** não definida

---

## 🛠️ PASSO A PASSO PARA CORRIGIR

### **Opção 1: Corrigir pelo SQL (RECOMENDADO)**

1. Execute o script: `database/VALIDAR_E_CORRIGIR_REGRA_TRIBUTACAO.sql`
2. Verifique os resultados
3. Teste novamente na tela de emissão

### **Opção 2: Corrigir pela Interface**

1. **Acesse:** Notas Fiscais → Parâmetros Fiscais → Regras de Tributação
2. **Clique em:** "Alterações" ou "Detalhes" na regra NCM `00000000`
3. **Preencha os campos:**

```
📋 CAMPOS OBRIGATÓRIOS:

┌─────────────────────────────────────────┐
│ IDENTIFICAÇÃO                           │
├─────────────────────────────────────────┤
│ NCM: 00000000                          │
│ CFOP: 5102                             │
│ Origem Mercadoria: 0 (Nacional)        │
├─────────────────────────────────────────┤
│ ICMS (Simples Nacional)                │
├─────────────────────────────────────────┤
│ CSOSN: 101                             │
│ Alíquota ICMS: 18.00%                  │
│ Redução BC: 0%                         │
│ Modalidade BC: 0 (MVA)                 │
├─────────────────────────────────────────┤
│ PIS                                     │
├─────────────────────────────────────────┤
│ CST PIS: 01                            │
│ Alíquota PIS: 1.65%                    │
├─────────────────────────────────────────┤
│ COFINS                                  │
├─────────────────────────────────────────┤
│ CST COFINS: 01                         │
│ Alíquota COFINS: 7.60%                 │
├─────────────────────────────────────────┤
│ IPI                                     │
├─────────────────────────────────────────┤
│ CST IPI: 99 (Outras Saídas)           │
│ Alíquota IPI: 0%                       │
└─────────────────────────────────────────┘
```

4. **Clique em:** "Salvar"

---

## 🧪 TESTE ESPERADO

### Ao adicionar um produto de **R$ 50,00**:

```
┌────────────────────────────────────────────┐
│ CÁLCULOS ESPERADOS                        │
├────────────────────────────────────────────┤
│ Valor Unitário: R$ 50,00                  │
│ Quantidade: 1                              │
│ Valor Total: R$ 50,00                      │
├────────────────────────────────────────────┤
│ BC ICMS: R$ 50,00                          │
│ Aliq. ICMS: 18.00%                         │
│ VLR. ICMS: R$ 9,00 ✅                      │
├────────────────────────────────────────────┤
│ Vlr. PIS: R$ 0,83 ✅                       │
│ Vlr. COFINS: R$ 3,80 ✅                    │
│ Vlr. IPI: R$ 0,00 ✅                       │
├────────────────────────────────────────────┤
│ Total Tributos: R$ 13,63                   │
└────────────────────────────────────────────┘
```

---

## 🔧 DEBUG NO NAVEGADOR

Se os impostos **ainda não aparecerem**, abra o Console (F12):

### 1. **Verificar se o motor fiscal está sendo chamado:**
```javascript
// Procure por logs como:
✅ Item calculado com impostos: {...}
```

### 2. **Verificar erros:**
```javascript
// Procure por:
❌ Erro ao calcular tributos: ...
⚠️ Nenhuma regra encontrada para NCM ...
```

### 3. **Verificar contexto fiscal:**
```javascript
// O motor fiscal deve receber:
{
  empresaId: 1,
  tipoDocumento: 'NFE',
  tipoOperacao: 'SAIDA',
  ufOrigem: 'SP',  // ✅ Não pode ser hardcoded
  ufDestino: 'SP',
  regimeEmitente: 'SIMPLES',  // ✅ Da empresa
  cfop: '5102'
}
```

---

## 📋 CHECKLIST COMPLETO

### Banco de Dados:
- [ ] Script SQL executado
- [ ] Regra atualizada com alíquotas
- [ ] Validação passou em todas as queries
- [ ] Produtos têm NCM e CFOP corretos

### Interface:
- [ ] Parâmetros Fiscais → Regras de Tributação
- [ ] Regra NCM 00000000 tem alíquotas preenchidas
- [ ] Regra está ATIVA

### Teste de Emissão:
- [ ] Acessar: Notas Fiscais → Emitir NF-e
- [ ] Adicionar produto (buscar do cadastro)
- [ ] Clicar em "Adicionar"
- [ ] **Verificar tabela:**
  - [ ] BC ICMS preenchida
  - [ ] Vlr. ICMS preenchido (≠ 0)
  - [ ] Vlr. PIS preenchido (≠ 0)
  - [ ] Vlr. COFINS preenchido (≠ 0)
  - [ ] Total tributos calculado

### Console (F12):
- [ ] Sem erros em vermelho
- [ ] Log: "✅ Item calculado com impostos"
- [ ] Dados da empresa carregados (UF, Regime)

---

## 🚨 PROBLEMAS COMUNS

### Problema 1: "Nenhuma regra encontrada"
**Causa:** NCM ou CFOP do produto diferente da regra  
**Solução:** 
```sql
-- Verificar correspondência
SELECT p.ncm, p.cfop_saida, r.ncm as regra_ncm, r.cfop_saida as regra_cfop
FROM produtos p
LEFT JOIN regras_tributacao r ON r.ncm = p.ncm AND r.cfop_saida = p.cfop_saida
WHERE p.ativo = true;
```

### Problema 2: "Impostos zerados"
**Causa:** Alíquotas NULL ou 0 na regra  
**Solução:** Execute script de validação (seção 2 do SQL)

### Problema 3: "UF de origem undefined"
**Causa:** Empresa não tem campo `estado` preenchido  
**Solução:**
```sql
UPDATE empresas SET estado = 'SP' WHERE id = 1;
```

### Problema 4: "Regime tributário undefined"
**Causa:** Empresa não tem `regime_tributario` preenchido  
**Solução:**
```sql
UPDATE empresas SET regime_tributario = 'SIMPLES' WHERE id = 1;
```

---

## 🎯 RESULTADO FINAL ESPERADO

Após todas as correções, a tabela deve exibir:

```
┌─────┬────────┬─────────────┬───────────┬───────┬──────┬────┬──────────┬───────────┬──────────┬─────────┬──────────┬──────────┬────────────┬─────────────┬──────────┬──────────┬─────────────┐
│  #  │ CÓDIGO │  DESCRIÇÃO  │    NCM    │ CFOP  │ QTD  │ UN │ VLR.UNIT │ VLR.TOTAL │ CST ICMS │ BC ICMS │ ALIQ.ICM │ VLR.ICMS │ BC ICMS-ST │ VLR.ICMS-ST │ VLR.IPI  │ VLR.PIS  │ VLR.COFINS │
├─────┼────────┼─────────────┼───────────┼───────┼──────┼────┼──────────┼───────────┼──────────┼─────────┼──────────┼──────────┼────────────┼─────────────┼──────────┼──────────┼─────────────┤
│  1  │ 000001 │Produto Teste│ 00000000  │ 5102  │ 1.00 │ UN │ R$ 50,00 │  R$ 50,00 │   101    │ R$ 50,00│  18.00%  │ R$ 9,00  │     -      │      -      │ R$ 0,00  │ R$ 0,83  │  R$ 3,80   │
└─────┴────────┴─────────────┴───────────┴───────┴──────┴────┴──────────┴───────────┴──────────┴─────────┴──────────┴──────────┴────────────┴─────────────┴──────────┴──────────┴─────────────┘

Total ICMS: R$ 9,00 | Total ST: R$ 0,00 | Total IPI: R$ 0,00 | Total PIS: R$ 0,83 | Total COFINS: R$ 3,80
```

---

## 📞 PRÓXIMOS PASSOS

1. ✅ **Execute:** `database/VALIDAR_E_CORRIGIR_REGRA_TRIBUTACAO.sql`
2. ✅ **Verifique:** Resultados do script
3. ✅ **Teste:** Adicionar produto na NF-e
4. ✅ **Confirme:** Impostos aparecem na tabela
5. ✅ **Se não funcionar:** Envie print do Console (F12)

---

**Criado em:** 23/01/2026  
**Status:** 🔧 Correção em Andamento
