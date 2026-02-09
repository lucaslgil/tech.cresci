# 🔧 SOLUÇÃO ERRO 401 - Nuvem Fiscal

## ❌ Problema
```
POST https://api.sandbox.nuvemfiscal.com.br/nfe 401 (Unauthorized)
```

## 🔍 Causas Possíveis

### 1. **Servidor não foi reiniciado após adicionar variáveis**
O Vite precisa ser reiniciado para ler novas variáveis do `.env`.

### 2. **Formato de autenticação incorreto**
Nuvem Fiscal usa formato específico de API key.

### 3. **Chave de API inválida**
Verifique se a chave está correta.

---

## ✅ SOLUÇÃO - Passo a Passo

### 1️⃣ **REINICIAR O SERVIDOR (OBRIGATÓRIO!)**

No terminal onde `npm run dev` está rodando:

```bash
# 1. Parar o servidor (Ctrl+C)
# 2. Limpar cache do Vite (opcional mas recomendado)
rm -rf node_modules/.vite
# ou no Windows PowerShell:
Remove-Item -Recurse -Force node_modules/.vite

# 3. Reiniciar
npm run dev
```

⚠️ **IMPORTANTE:** O Vite só lê variáveis de ambiente no STARTUP. Se você adicionou `VITE_NUVEM_FISCAL_*` depois de iniciar o servidor, DEVE reiniciar!

### 2️⃣ **Verificar Variáveis no Console**

Após reiniciar, abra o console do navegador (F12) e procure:

```
🔍 Debug Nuvem Fiscal:
- Ambiente: SANDBOX
- API Key existe? true
- API Key preview: eo17RT4POB...
```

Se aparecer `API Key existe? false` ou `NÃO ENCONTRADA`, o Vite não está lendo o `.env`.

### 3️⃣ **Verificar `.env`**

Confirme que o arquivo `.env` está na **raiz do projeto** e contém:

```env
VITE_NUVEM_FISCAL_AMBIENTE=SANDBOX
VITE_NUVEM_FISCAL_API_KEY=eo17RT4POBe1nzGqQKwA
```

**Checklist:**
- [ ] Arquivo está na raiz (mesmo nível que `package.json`)
- [ ] Nome correto: `.env` (não `.env.local` ou outro)
- [ ] Variáveis começam com `VITE_` (obrigatório para Vite)
- [ ] Sem espaços extras antes/depois do `=`
- [ ] Sem aspas nos valores

### 4️⃣ **Limpar Cache do Navegador**

- Abra DevTools (F12)
- Aba "Application" → "Storage" → "Clear site data"
- Ou use Ctrl+Shift+R para recarregar com cache limpo

---

## 🔑 Correções Aplicadas no Código

### 1. Formato de Autenticação

**ANTES:**
```typescript
'Authorization': `Bearer ${config.apiKey}`
```

**DEPOIS:**
```typescript
'Authorization': config.apiKey  // Nuvem Fiscal usa chave diretamente
```

### 2. Logs de Debug

Adicionados logs detalhados para identificar se a chave está sendo lida:

```typescript
console.log('🔍 Debug Nuvem Fiscal:')
console.log('- Ambiente:', ambiente)
console.log('- API Key existe?', !!apiKey)
console.log('- API Key preview:', apiKey?.substring(0, 10) + '...')
```

---

## 🧪 Testar Novamente

Após reiniciar o servidor:

1. **Abrir página** (Ctrl+Shift+R)
2. **Abrir console** (F12)
3. **Verificar logs** do Debug Nuvem Fiscal
4. **Preencher nota** e transmitir

---

## 🆘 Se Ainda Der Erro 401

### Possibilidade 1: Chave SANDBOX inválida
A chave `eo17RT4POBe1nzGqQKwA` pode não estar mais ativa.

**Solução:** Obter nova chave em https://nuvemfiscal.com.br

### Possibilidade 2: Formato de autenticação diferente
Nuvem Fiscal pode exigir header diferente.

**Teste manual com curl:**
```bash
curl -X GET https://api.sandbox.nuvemfiscal.com.br/empresas \
  -H "Authorization: eo17RT4POBe1nzGqQKwA" \
  -H "Content-Type: application/json"
```

Se der 401, testar:
```bash
curl -X GET https://api.sandbox.nuvemfiscal.com.br/empresas \
  -H "Authorization: Bearer eo17RT4POBe1nzGqQKwA" \
  -H "Content-Type: application/json"
```

### Possibilidade 3: Precisa cadastrar empresa na Nuvem Fiscal
Pode ser necessário cadastrar a empresa emissora na plataforma Nuvem Fiscal primeiro.

---

## 📞 Contato Nuvem Fiscal

- 📧 suporte@nuvemfiscal.com.br
- 📖 https://dev.nuvemfiscal.com.br/docs
- 💬 Chat no site

---

**✅ Ação Imediata:** REINICIE o servidor npm e teste novamente!
