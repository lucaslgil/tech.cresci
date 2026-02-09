# 🔑 COMO OBTER CREDENCIAIS NUVEM FISCAL

## ❌ O Problema Anterior

A integração estava usando apenas uma "API Key" simples, mas a **Nuvem Fiscal usa OAuth 2.0** com:
- **Client ID**
- **Client Secret**

Esses dois valores são trocados por um **Access Token** temporário que é usado nas requisições.

---

## ✅ PASSO A PASSO - Obter Credenciais

### 1️⃣ Criar Conta na Nuvem Fiscal

Acesse: https://console.nuvemfiscal.com.br

- Clique em "Criar conta" se não tiver
- **Plano Grátis** disponível para testes!

### 2️⃣ Acessar Console

Após fazer login: https://console.nuvemfiscal.com.br/credenciais

### 3️⃣ Criar Credencial SANDBOX

1. Clique em **"Criar credencial"**
2. Escolha **"Sandbox"** (para testes)
3. Clique em **"Confirmar"**

### 4️⃣ Anotar Credenciais

A tela mostrará:
- **Client ID**: `abcd1234...`
- **Client Secret**: `xyz9876...`

⚠️ **IMPORTANTE:**
- O **Client Secret** é mostrado **apenas uma vez**!
- Copie AMBOS os valores
- Ou clique em "Baixar credencial" (arquivo CSV)

---

## 📝 Configurar no Sistema

### 1. Editar arquivo `.env`

Abra: `c:\Users\Lucas\Desktop\tech.crescieperdi\.env`

```env
# Nuvem Fiscal API Configuration (OAuth 2.0)
VITE_NUVEM_FISCAL_AMBIENTE=SANDBOX
VITE_NUVEM_FISCAL_CLIENT_ID=cole_seu_client_id_aqui
VITE_NUVEM_FISCAL_CLIENT_SECRET=cole_seu_client_secret_aqui
```

**Exemplo (valores fictícios):**
```env
VITE_NUVEM_FISCAL_AMBIENTE=SANDBOX
VITE_NUVEM_FISCAL_CLIENT_ID=abc123def456ghi789
VITE_NUVEM_FISCAL_CLIENT_SECRET=xyz987wvu654tsr321
```

### 2. Salvar arquivo

Salve o arquivo `.env` com as credenciais corretas.

### 3. Reiniciar servidor

No terminal:
```bash
# Parar (Ctrl+C)
npm run dev
```

### 4. Testar

Abra o sistema e tente emitir uma nota.

---

## 🔍 Verificar se Funcionou

No console do navegador (F12), você DEVE ver:

```
✅ 🔍 Debug Nuvem Fiscal:
✅ - Ambiente: SANDBOX
✅ - Client ID existe? true
✅ - Client ID preview: abc123def4...
✅ - Client Secret existe? true
```

Depois:

```
✅ 🔄 Obtendo novo token de acesso...
✅ ✅ Token obtido com sucesso
✅ ⏰ Token válido por 2592000 segundos
```

---

## 🎯 Como Funciona o OAuth 2.0

1. **Sistema envia** Client ID + Client Secret para `https://auth.nuvemfiscal.com.br/oauth/token`
2. **Nuvem Fiscal valida** as credenciais
3. **Retorna** um Access Token (válido por ~30 dias)
4. **Sistema usa** esse token em todas as requisições: `Authorization: Bearer <token>`

**Benefício:** Maior segurança - o Client Secret nunca é enviado diretamente para a API!

---

## 🆘 Troubleshooting

### Erro: "Client ID existe? false"
➡️ Verifique se salvou o arquivo `.env` corretamente

### Erro: "invalid_client"
➡️ Client ID ou Secret incorretos - verifique se copiou corretamente

### Erro: "invalid_grant"
➡️ Credenciais não correspondem ao ambiente (Sandbox vs Produção)

### Não sei mais o Client Secret
➡️ Crie novas credenciais no console (você terá um novo Client ID também)

---

## 📚 Documentação Oficial

- **Console:** https://console.nuvemfiscal.com.br
- **Docs Autenticação:** https://dev.nuvemfiscal.com.br/docs/autenticacao
- **API Reference:** https://dev.nuvemfiscal.com.br/docs/api

---

## 📋 Checklist

- [ ] Conta criada na Nuvem Fiscal
- [ ] Credencial SANDBOX criada
- [ ] Client ID copiado
- [ ] Client Secret copiado
- [ ] Valores colados no `.env`
- [ ] Arquivo `.env` salvo
- [ ] Servidor reiniciado
- [ ] Teste realizado

---

**🎉 Com as credenciais corretas, o sistema funcionará perfeitamente!**
