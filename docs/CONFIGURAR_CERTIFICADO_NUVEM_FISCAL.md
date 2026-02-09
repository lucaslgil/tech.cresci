# 🔐 Configurar Empresa e Certificado na Nuvem Fiscal

## 🎯 Problema Atual

Erro ao emitir nota:
```json
{
  "error": {
    "code": "ConfigNfeNotFound",
    "message": "Configuração de NF-e da empresa não encontrada"
  }
}
```

**Causa:** A empresa precisa ser cadastrada no dashboard da Nuvem Fiscal antes de emitir notas.

---

## ✅ O Que Já Está Funcionando

Antes de configurar a empresa, confirme que **TODOS os campos da nota estão corretos**:

✅ Emitente (CNPJ, IE, endereço, código município)
✅ Destinatário (sem IE para não contribuinte)  
✅ Itens (tipos de dados corretos - integers, doubles, strings)
✅ Totais e Pagamento
✅ OAuth 2.0 autenticando corretamente

**Agora só falta cadastrar a empresa no dashboard!**

---

## 📋 Passo a Passo COMPLETO

### Passo 1: Acessar Dashboard Nuvem Fiscal

1. Acesse: **https://sandbox.nuvemfiscal.com.br** (SANDBOX/Homologação)
   - Ou: https://app.nuvemfiscal.com.br (PRODUÇÃO)
2. Faça login com suas credenciais OAuth 2.0:
   - Client ID: `eo17RT4POBe1nzGqQKwA`
   - Client Secret: `VW0xpCgR06m6K0wHpXUSzfq7fEPJSUhw4im9ozYA`

### Passo 2: Cadastrar Empresa

1. No menu lateral, clique em **"Empresas"**
2. Clique em **"Adicionar Empresa"** ou **"Nova Empresa"**
3. Preencha os dados:
   ```
   CNPJ: 43.670.056/0001-66
   Razão Social: CRESCI E PERDI SUPRIMENTOS LTDA
   Nome Fantasia: CRESCI E PERDI - SUPRIMENTOS
   Inscrição Estadual: 646103926110
   ```
4. Clique em **"Salvar"**

### Passo 3: Fazer Upload do Certificado Digital

1. Dentro da empresa cadastrada, procure a seção **"Certificado Digital"**
2. Clique em **"Fazer Upload"** ou **"Adicionar Certificado"**
3. Selecione o arquivo **.pfx** ou **.p12**
4. Digite a **senha** do certificado
5. Clique em **"Enviar"** ou **"Salvar"**

### Passo 4: Configurar NF-e (se necessário)

Algumas plataformas pedem configurações adicionais:

1. Procure **"Configurações de NF-e"** dentro da empresa
2. Configure:
   ```
   Ambiente: Homologação (para testes)
   Série NF-e: 1
   Próximo Número: 1
   ```
3. Salve as configurações

### Passo 5: Testar Emissão

1. Volte ao seu sistema
2. Tente emitir a nota novamente
3. **Deve funcionar agora!** ✅

---

## 🔍 Onde Está o Certificado no Sistema?

O sistema já tem o certificado salvo! Para verificar:

### No Banco de Dados:
```sql
SELECT 
  cnpj,
  razao_social,
  certificado_digital IS NOT NULL as tem_certificado,
  certificado_validade
FROM empresas
WHERE cnpj = '43.670.056/0001-66';
```

### Na Interface:
```
Menu: PARÂMETROS FISCAIS
  → Aba: Certificado Digital
    → Mostra informações do certificado
```

Se o certificado existir no banco, você pode:
1. Baixar o arquivo .pfx
2. Usar para fazer upload na Nuvem Fiscal

---

## ⚠️ IMPORTANTE: Ambiente SANDBOX vs PRODUÇÃO

### SANDBOX (Homologação) - Atual:
- ✅ URL: https://sandbox.nuvemfiscal.com.br
- ✅ Para **testes** apenas
- ✅ Notas **NÃO têm validade fiscal**
- ✅ Use certificado **real** (mesmo da produção funciona)
- ✅ Perfeito para validar integração

### PRODUÇÃO:
- ⚠️ URL: https://app.nuvemfiscal.com.br
- ⚠️ Notas **com validade fiscal real**
- ⚠️ Certificado **deve ser válido**
- ⚠️ Só use após validar em homologação

---

## 🎯 Próximos Erros Esperados

Depois de configurar a empresa, você pode encontrar:

### ✅ Sucesso Total:
```json
{
  "status": "autorizada",
  "chave": "35260143670056000166550010000000011234567890",
  "protocolo": "123456789012345"
}
```

### ❌ Erros de Validação SEFAZ:
São regras fiscais que precisam ser ajustadas:

1. **Rejeição 229**: IE do destinatário inválida
2. **Rejeição 542**: Município difere do cadastro
3. **Rejeição 785**: CST inválido para a operação
4. **Rejeição 204**: Duplicidade de NF-e

**Isso é NORMAL!** São validações fiscais finas que ajustaremos conforme necessário.

---

## 💡 Dicas Importantes

### Se o Dashboard Pedir Certificado A3:
- Nuvem Fiscal aceita **certificado A1** (.pfx/.p12)
- Se só mostrar opção A3, procure "Adicionar A1" ou "Upload de arquivo"

### Se Não Conseguir Acessar o Dashboard:
1. Verifique suas credenciais OAuth
2. Tente criar conta no site: https://sandbox.nuvemfiscal.com.br/signup
3. Entre em contato com suporte da Nuvem Fiscal

### Se o Certificado Estiver Vencido:
- Certificados A1 valem **12 meses**
- Renove em: Serasa, Valid ou Certisign
- Preço: R$ 150-250/ano

---

## 📚 Documentação de Referência

- **Nuvem Fiscal SANDBOX**: https://sandbox.nuvemfiscal.com.br
- **Documentação API**: https://dev.nuvemfiscal.com.br
- **Suporte**: Dentro do dashboard após login

---

## 🎉 Resumo do Fluxo

```
1. Você emite nota no sistema ✅
2. Sistema valida todos os campos ✅
3. Envia para API Nuvem Fiscal ✅
4. API verifica: "Empresa não cadastrada" ❌
5. VOCÊ cadastra empresa no dashboard 👉 AQUI
6. VOCÊ faz upload do certificado 👉 AQUI  
7. Tenta emitir novamente ✅
8. SUCESSO! 🎉
```

**Você está quase lá!** Só falta esse cadastro manual no dashboard.

---

## ❓ FAQ

**P: Por que não pode ser automático?**
R: A API não expõe endpoint público para cadastro de empresa. É necessário fazer via dashboard por questões de segurança.

**P: Preciso pagar para usar a Nuvem Fiscal?**
R: Verifique os planos no site. Geralmente há trial gratuito para testes.

**P: Posso usar outro provedor?**
R: Sim! O sistema já suporta emissão direta para SEFAZ (modo gratuito). Consulte `MODO_GRATUITO_NFE.md`.
