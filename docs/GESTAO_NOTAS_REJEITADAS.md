# 📋 GESTÃO DE NOTAS FISCAIS REJEITADAS - MELHORES PRÁTICAS

## 🎯 Como ERPs Profissionais Gerenciam

### SAP, TOTVS, Sankhya, Senior - Padrão da Indústria

**Princípios Fundamentais:**

1. **NUNCA excluir notas rejeitadas**
   - Mantém histórico completo para auditoria fiscal
   - Rastreabilidade de todas as tentativas
   - Compliance com legislação

2. **EDITAR e RETRANSMITIR**
   - Mesmo número da nota original
   - Não desperdiça numeração
   - Corrige apenas o que está errado

3. **Incrementar APENAS após SUCESSO**
   - Último número usado só avança quando autorizada
   - Evita "buracos" na sequência numérica
   - Facilita controle fiscal

---

## 🔄 Fluxo Implementado no Sistema

### Status de Notas Fiscais

```
RASCUNHO
   ↓
PROCESSANDO (enviando para SEFAZ)
   ↓
   ├─→ AUTORIZADA ✅
   │      ├─ Imprimir DANFE
   │      ├─ Enviar por email
   │      ├─ Baixar XML
   │      └─ Cancelar (se necessário)
   │
   └─→ REJEITADA ❌
          ├─ Visualizar motivo da rejeição
          ├─ EDITAR E RETRANSMITIR (recomendado) ⭐
          ├─ Manter como histórico
          └─ Inutilizar (apenas se não for retransmitir)
```

---

## ⭐ Funcionalidades Implementadas

### 1. Editar e Retransmitir (PRINCIPAL)

**Quando usar:** Nota foi rejeitada e você quer corrigir

**Como funciona:**
1. Na tela "Consultar Notas Fiscais"
2. Localize a nota REJEITADA
3. Clique no ícone 🔄 (Editar e Retransmitir)
4. Sistema abre formulário pré-preenchido
5. Corrija os campos com erro
6. Emita novamente com o **MESMO número**
7. Se autorizada → incrementa numeração automaticamente

**Vantagens:**
- ✅ Não desperdiça números
- ✅ Mantém histórico
- ✅ Facilita correção
- ✅ Padrão de mercado

---

### 2. Visualizar Detalhes

**Quando usar:** Ver informações completas da rejeição

**O que mostra:**
- Código da rejeição (ex: 539, 590)
- Mensagem detalhada da SEFAZ
- Chave de acesso (se gerada)
- Todos os dados da nota
- Botão destacado "Editar e Retransmitir"

---

### 3. Manter como Histórico

**Quando usar:** Para auditoria futura

**Como funciona:**
- Notas rejeitadas ficam no banco
- Status "REJEITADA" permanente
- Disponível para consulta
- Não interfere na numeração

---

### 4. Inutilizar Numeração

**Quando usar:** Situações ESPECIAIS:
- Erro no sistema que gerou números pulados
- Problemas técnicos que não permitem retransmissão
- Mudança de estratégia (não vai mais usar aquele número)

**Como funciona:**
1. Botão "Inutilizar Numeração" nos filtros
2. Informa: Empresa, Série, Número Inicial, Final
3. Justificativa (mínimo 15 caracteres)
4. Sistema envia evento de inutilização para SEFAZ
5. Números ficam oficialmente inutilizados

⚠️ **ATENÇÃO:** Só inutilize se realmente não for usar o número!

---

## 🔢 Controle de Numeração

### Como Funciona

```javascript
// ANTES (errado - incrementava sempre):
numeroNota = empresas.ultimo_numero_nfe + 1
empresas.ultimo_numero_nfe += 1  // ❌ Incrementa antes de autorizar
emitirNota(numeroNota)

// AGORA (correto - incrementa só após autorização):
numeroNota = empresas.ultimo_numero_nfe + 1
resultado = emitirNota(numeroNota)
if (resultado.status === 'AUTORIZADA') {
  empresas.ultimo_numero_nfe += 1  // ✅ Só incrementa se autorizada
}
```

### Exemplos Práticos

**Cenário 1: Primeira emissão rejeitada**
```
ultimo_numero_nfe = 0
Tenta emitir nota 1 → REJEITADA (erro de CRT)
ultimo_numero_nfe = 0 (não incrementou)

Edita e retransmite nota 1 → AUTORIZADA ✅
ultimo_numero_nfe = 1 (agora incrementa)

Próxima nota = 2
```

**Cenário 2: Múltiplas rejeições**
```
ultimo_numero_nfe = 10
Tenta emitir nota 11 → REJEITADA
ultimo_numero_nfe = 10

Corrige e retransmite nota 11 → REJEITADA (outro erro)
ultimo_numero_nfe = 10

Corrige novamente nota 11 → AUTORIZADA ✅
ultimo_numero_nfe = 11

Próxima nota = 12
```

---

## 📊 Comparação com Concorrentes

| Funcionalidade | Sistema Atual | SAP | TOTVS | Sankhya |
|----------------|---------------|-----|-------|---------|
| Histórico de rejeições | ✅ | ✅ | ✅ | ✅ |
| Editar e retransmitir | ✅ | ✅ | ✅ | ✅ |
| Mesmo número na retransmissão | ✅ | ✅ | ✅ | ✅ |
| Inutilização de numeração | ✅ | ✅ | ✅ | ✅ |
| Cancelamento | ✅ | ✅ | ✅ | ✅ |
| Visualização detalhada | ✅ | ✅ | ✅ | ✅ |

**Conclusão:** Sistema implementado seguindo EXATAMENTE as melhores práticas dos ERPs líderes de mercado! 🎉

---

## 🚀 Como Usar - Passo a Passo

### Situação: Nota Rejeitada

1. **Acesse:** Menu INVENTÁRIO → Consultar Notas Fiscais

2. **Localize:** Nota com status "Rejeitada" (vermelho)

3. **Clique:** Ícone 🔄 ou botão "Ver Detalhes"

4. **Leia:** Código e mensagem da rejeição
   ```
   Exemplo: "Código 590: Informado CST para emissor do Simples Nacional"
   Significa: CRT da empresa está errado
   ```

5. **Corrija:** 
   - Se for erro cadastral (CRT, IE, etc) → Vá em CADASTRO → Empresa
   - Se for erro da nota → Clique "Editar e Retransmitir"

6. **Retransmita:** 
   - Formulário abre pré-preenchido
   - Corrija apenas o necessário
   - Emita novamente

7. **Confirme:** Nota agora aparece como "Autorizada" ✅

---

## 📝 Casos de Uso Reais

### Caso 1: Erro no CRT (seu caso)

**Problema:** Empresa no Lucro Presumido cadastrada como Simples Nacional

**Solução:**
1. Menu CADASTRO → Empresa
2. Alterar:
   - Regime Tributário = "Lucro Presumido"
   - CRT = "3"
3. Salvar
4. Voltar em Consultar Notas
5. Clicar "Editar e Retransmitir"
6. Emitir novamente

**Resultado:** Nota autorizada com mesmo número! ✅

---

### Caso 2: Erro em Item da Nota

**Problema:** NCM incorreto em um produto

**Solução:**
1. Consultar Notas → Clicar "Editar e Retransmitir"
2. Localizar item com erro
3. Corrigir NCM
4. Emitir novamente

**Resultado:** Nota autorizada, número preservado ✅

---

### Caso 3: Mudança de Cliente

**Problema:** Emitiu para cliente errado

**Solução:**
1. Consultar Notas → Clicar "Editar e Retransmitir"
2. Alterar cliente
3. Emitir novamente

**Resultado:** Nota autorizada para cliente correto ✅

---

## ⚠️ O QUE NÃO FAZER

❌ **NUNCA excluir nota rejeitada**
   - Perde histórico
   - Problemas em auditoria
   - Não é necessário

❌ **NUNCA inutilizar sem necessidade**
   - Desperdiça números
   - Gera burocracia
   - Só use em casos extremos

❌ **NUNCA emitir nova nota sem corrigir**
   - Vai rejeitar de novo
   - Desperdiça tempo
   - Frustrante

✅ **SEMPRE editar e retransmitir**
   - Mantém histórico
   - Preserva numeração
   - Padrão profissional

---

## 🎓 Legislação e Compliance

### Obrigação Acessória

Segundo a legislação brasileira (Ajuste SINIEF 07/05):

- Notas fiscais devem ter **numeração sequencial**
- Números não podem ser reutilizados de forma diferente
- Histórico de transmissões deve ser mantido
- Inutilização requer justificativa

**Nossa implementação está 100% compliance!** ✅

---

## 📞 Suporte

**Dúvidas frequentes:**

**P: Posso excluir nota rejeitada?**
R: Tecnicamente sim (rascunhos), mas NÃO RECOMENDADO. Melhor: editar e retransmitir.

**P: Quantas vezes posso retransmitir?**
R: Ilimitadas, enquanto corrigir o erro.

**P: O que fazer se não consigo corrigir?**
R: Analise o código de rejeição, consulte documentação da SEFAZ ou use inutilização.

**P: Preciso inutilizar nota rejeitada?**
R: NÃO! Só inutilize se não for retransmitir.

---

**Data:** 05/02/2026  
**Versão:** 1.0  
**Sistema:** ERP Cresci e Perdi
