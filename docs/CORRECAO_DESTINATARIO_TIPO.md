# 🔧 CORREÇÃO - Campo destinatario_tipo

## ❌ Problema
```
new row for relation "notas_fiscais" violates check constraint 
"notas_fiscais_destinatario_tipo_check"
```

## 🔍 Causa
O banco de dados espera valores `'F'` (Pessoa Física) ou `'J'` (Pessoa Jurídica), mas o código estava enviando `'CLIENTE'`.

## ✅ Solução Aplicada

Arquivo: [`nfeService.ts`](src/services/nfe/nfeService.ts) linha 211

**ANTES:**
```typescript
destinatario_tipo: 'CLIENTE', // Sempre CLIENTE por enquanto
```

**DEPOIS:**
```typescript
// Determinar tipo: 'F' (CPF/Física) ou 'J' (CNPJ/Jurídica)
destinatario_tipo: dados.destinatario.cpf_cnpj.replace(/\D/g, '').length === 11 ? 'F' : 'J',
```

## 🎯 Lógica
- CPF tem **11 dígitos** → `'F'` (Pessoa Física)
- CNPJ tem **14 dígitos** → `'J'` (Pessoa Jurídica)

## ✅ Status
**CORRIGIDO!** Agora você pode testar a emissão novamente.

---

**Data:** 05/02/2026  
**Erro:** 23514 - Check constraint violation  
**Correção:** Automática baseada em CPF/CNPJ
