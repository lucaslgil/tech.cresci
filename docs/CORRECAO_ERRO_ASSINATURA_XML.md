# 🔧 CORREÇÃO: Erro de Assinatura Digital XML

## ❌ Problema Identificado

O sistema estava tentando **assinar o XML da NF-e no FRONTEND (browser)**, usando bibliotecas Node.js como:
- `node-forge`
- `xml-crypto` 
- `crypto` (módulo nativo do Node.js)

**ERRO:**
```
Erro ao assinar XML: cryptoSt.createHash is not a function
crypto has been externalized for browser compatibility
```

## 🔍 Causa Raiz

1. **Módulos Node.js não funcionam no browser** - O módulo `crypto` do Node.js não existe no navegador
2. **Assinatura digital requer backend** - Por segurança e capacidade técnica, a assinatura digital DEVE ser feita no servidor
3. **Certificados sensíveis** - Manipular certificados digitais no frontend é inseguro

## ✅ Solução Implementada

### 1. **Supabase Edge Function** (Backend)
Criada função serverless para processar emissão no backend:
```
supabase/functions/emitir-nfe/index.ts
```

**Responsabilidades:**
- ✅ Buscar dados da nota no banco
- ✅ Buscar certificado digital da empresa
- ✅ Gerar XML da NF-e
- ✅ Assinar digitalmente com certificado
- ✅ Enviar para SEFAZ (via API ou SOAP direto)
- ✅ Processar retorno e atualizar banco

### 2. **Novo Serviço Frontend**
Criado serviço simplificado que delega para o backend:
```typescript
// src/services/nfe/nfeServiceEdge.ts
export class NFeServiceEdge {
  async emitir(dados: NotaFiscalDados) {
    // 1. Salva rascunho no banco
    // 2. Chama Edge Function para processar
    // 3. Retorna resultado
  }
}
```

### 3. **Frontend Atualizado**
```typescript
// EmitirNotaFiscal.tsx
import { criarServicoNFeEdge } from '../../services/nfe'

// Agora usa Edge Function (backend)
const nfeService = criarServicoNFeEdge({
  ambiente: 'HOMOLOGACAO',
  api_intermediaria: { provider: 'FOCUS', token: '...' }
})

const resultado = await nfeService.emitir(dadosNota)
```

## 🚀 Como Testar

### 1. **Subir Edge Function** (se usando Supabase local)
```bash
supabase functions serve emitir-nfe
```

### 2. **Configurar variáveis** (`.env`)
```env
# API Paga (Focus NFe - Homologação é gratuita)
VITE_FOCUS_NFE_TOKEN_HOMOLOGACAO=seu_token_aqui
VITE_FOCUS_NFE_BASE_URL_HOMOLOGACAO=https://homologacao.focusnfe.com.br

# OU deixar vazio para modo DIRETO (gratuito, requer certificado configurado)
```

### 3. **Testar Emissão**
1. Acesse **Notas Fiscais > Emitir Nota Fiscal**
2. Preencha os dados
3. Clique em "Transmitir para SEFAZ"
4. ✅ Deve processar sem erro de assinatura

## 📋 Modos de Operação

### Modo 1: API Paga (Recomendado para começar)
- **Provider:** Focus NFe, TecnoSpeed, etc.
- **Vantagens:** Mais simples, homologação gratuita
- **Requer:** Token da API
- **Edge Function:** Repassa XML para API intermediária

### Modo 2: Comunicação Direta (Gratuito, avançado)
- **Provider:** DIRETO
- **Vantagens:** Sem custo de API
- **Requer:** Certificado A1 configurado na empresa
- **Edge Function:** Assina XML + envia SOAP para SEFAZ
- **Status:** ⚠️ Em desenvolvimento

## 🎯 Próximos Passos

### Para usar Focus NFe (homologação gratuita):
1. ✅ Edge Function já criada
2. ✅ Frontend adaptado
3. ⏳ Criar conta Focus NFe (modo teste)
4. ⏳ Configurar token no `.env`
5. ⏳ Testar emissão completa

### Para modo DIRETO (gratuito):
1. ✅ Edge Function base criada
2. ⏳ Implementar geração XML completo
3. ⏳ Implementar assinatura digital (forge + xml-crypto no Deno)
4. ⏳ Implementar cliente SOAP SEFAZ
5. ⏳ Testar com certificado válido

## 📚 Arquivos Alterados

```
✅ CRIADOS:
   supabase/functions/emitir-nfe/index.ts       (Edge Function)
   src/services/nfe/nfeServiceEdge.ts           (Novo serviço frontend)
   
✅ MODIFICADOS:
   src/services/nfe/index.ts                    (Export novo serviço)
   src/features/notas-fiscais/EmitirNotaFiscal.tsx  (Usa Edge Function)
   
⚠️ MANTIDOS (não deletar ainda):
   src/services/nfe/nfeService.ts               (Serviço antigo)
   src/services/nfe/assinaturaDigitalService.ts (Ref. futura)
   src/services/nfe/sefazClient.ts              (Ref. futura)
```

## 🔐 Segurança

### ✅ Antes (INSEGURO):
- Certificado digital carregado no frontend
- Chave privada exposta no browser
- Assinatura digital no cliente

### ✅ Depois (SEGURO):
- Certificado permanece no banco (criptografado)
- Assinatura digital no servidor (Edge Function)
- Chave privada nunca sai do backend

## 💡 Dica

Para testar rapidamente, use **Focus NFe em modo homologação**:
- ✅ É **gratuito**
- ✅ Não precisa certificado digital
- ✅ API já está integrada
- ✅ Basta criar conta e pegar token

**Cadastro:** https://homologacao.focusnfe.com.br

---

**Documentação criada em:** 04/02/2026  
**Status:** ✅ Correção implementada, aguardando testes
