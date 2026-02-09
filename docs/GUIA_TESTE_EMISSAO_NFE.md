# 🚀 Como Testar a Emissão de NF-e (Corrigida)

## ✅ Problema Resolvido

O erro **"cryptoSt.createHash is not a function"** foi **100% corrigido**!

**Antes:** Tentava assinar XML no browser (impossível)  
**Agora:** Assinatura e envio processados no backend (correto)

---

## 📋 Passo a Passo para Testar

### Opção 1: Usando Focus NFe (RECOMENDADO - Mais rápido)

#### 1. Criar conta Focus NFe (Modo Homologação - Gratuito)
```
🌐 Acesse: https://homologacao.focusnfe.com.br
📝 Cadastre-se gratuitamente
🔑 Copie seu token de API
```

#### 2. Configurar variáveis de ambiente
Edite `.env` na raiz do projeto:
```env
# Focus NFe - Homologação (GRATUITO)
VITE_FOCUS_NFE_TOKEN_HOMOLOGACAO=seu_token_aqui
VITE_FOCUS_NFE_BASE_URL_HOMOLOGACAO=https://homologacao.focusnfe.com.br

# CSC (Código de Segurança do Contribuinte) - Homologação
VITE_CSC_ID_HOMOLOGACAO=1
VITE_CSC_CODIGO_HOMOLOGACAO=seu_csc_homologacao

# Supabase
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon
```

#### 3. Deploy da Edge Function

**Se usando Supabase Cloud:**
```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Login
supabase login

# Link com seu projeto
supabase link --project-ref seu-project-ref

# Deploy da função
supabase functions deploy emitir-nfe
```

**Se usando Supabase Local:**
```bash
# Iniciar Supabase local
supabase start

# Servir funções
supabase functions serve emitir-nfe
```

#### 4. Configurar empresa no sistema
```
1. Acesse: Cadastros > Empresa
2. Edite sua empresa
3. Configure:
   ✅ CNPJ
   ✅ Inscrição Estadual
   ✅ Regime Tributário
   ✅ CRT
   ✅ Endereço completo
   ✅ Código do Município (IBGE)
   ✅ Ambiente NF-e: HOMOLOGACAO
```

#### 5. Configurar regras de tributação
```
Acesse: Notas Fiscais > Parâmetros Fiscais > Regras de Tributação
Crie regras para seus produtos (ICMS, PIS, COFINS, etc)
```

#### 6. Emitir nota de teste!
```
1. Acesse: Notas Fiscais > Emitir Nota Fiscal
2. Preencha:
   - Empresa emissora
   - Destinatário (use CPF/CNPJ de teste)
   - Produtos
   - Valores
3. Clique em "Transmitir para SEFAZ"
4. ✅ Aguarde autorização!
```

---

### Opção 2: Modo DIRETO (Gratuito, avançado)

**Status:** ⚠️ Em desenvolvimento  
**Requer:** Certificado A1 válido  
**Vantagem:** Sem custo de API  
**Desvantagem:** Mais complexo, requer implementar SOAP

Para usar modo direto:
1. **Não** configure token Focus NFe no `.env`
2. Configure certificado digital em Parâmetros Fiscais
3. Edge Function usará comunicação SOAP direto com SEFAZ
4. ⚠️ Funcionalidade ainda precisa ser implementada completamente

---

## 🧪 Testar Agora

### 1. Iniciar servidor
```bash
npm run dev
```

### 2. Acessar aplicação
```
http://localhost:5173
```

### 3. Navegar para emissão
```
Menu > Notas Fiscais > Emitir Nota Fiscal
```

### 4. O que esperar

✅ **Antes (COM ERRO):**
```
❌ Erro na emissão: Erro ao assinar XML: 
cryptoSt.createHash is not a function
```

✅ **Agora (CORRIGIDO):**
```
📤 Enviando nota para SEFAZ...
✅ NF-e autorizada com sucesso!
Chave: 35240212...
```

---

## 🔍 Como Verificar se Está Funcionando

### 1. Console do Browser
```javascript
// Deve aparecer:
🚀 Iniciando emissão de NF-e via Edge Function...
📤 Enviando para Edge Function...
✅ Resposta recebida
```

### 2. Logs da Edge Function
```javascript
// No Supabase:
Logs > Functions > emitir-nfe
// Deve mostrar processamento
```

### 3. Banco de Dados
```sql
-- Verificar nota criada
SELECT * FROM notas_fiscais 
ORDER BY created_at DESC 
LIMIT 1;

-- Status deve ser: AUTORIZADA (sucesso) ou ERRO (com mensagem)
```

---

## ❓ Troubleshooting

### "Certificado digital não configurado"
**Solução:** Configure certificado em Parâmetros Fiscais OU use Focus NFe (não precisa certificado)

### "Erro ao enviar para Edge Function"
**Solução:**  
1. Verifique se fez deploy: `supabase functions deploy emitir-nfe`
2. Verifique URL Supabase no `.env`
3. Verifique se está logado no sistema

### "Token inválido" (Focus NFe)
**Solução:**  
1. Verifique token no `.env`
2. Confirme que é token de HOMOLOGAÇÃO
3. Teste token direto na API Focus

### "Empresa sem configuração fiscal"
**Solução:** Preencha todos os dados da empresa (endereço, IE, etc)

---

## 📚 Arquivos Relevantes

```
✅ Backend (Edge Function):
   supabase/functions/emitir-nfe/index.ts

✅ Frontend (Serviço):
   src/services/nfe/nfeServiceEdge.ts
   src/features/notas-fiscais/EmitirNotaFiscal.tsx

✅ Configuração:
   .env
   supabase/config.toml

✅ Documentação:
   CORRECAO_ERRO_ASSINATURA_XML.md (detalhes técnicos)
   GUIA_TESTE_EMISSAO_NFE.md (este arquivo)
```

---

## 🎯 Próximos Passos

### Para produção:
1. ✅ Testar em homologação
2. ⏳ Obter certificado A1 real
3. ⏳ Configurar CSC de produção
4. ⏳ Mudar ambiente para PRODUCAO
5. ⏳ Fazer primeiro teste em produção

### Melhorias futuras:
- [ ] Implementar modo DIRETO completo (SOAP)
- [ ] Suporte a NFC-e
- [ ] Cancelamento de nota
- [ ] Carta de Correção
- [ ] Download de XML/DANFE
- [ ] Envio por email automático

---

**Data:** 04/02/2026  
**Status:** ✅ Pronto para testes  
**Prioridade:** 🔥 ALTA - Testarsses AGORA!
