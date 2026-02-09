# 🚀 GUIA RÁPIDO - Configurar Focus NFe para Homologação

## Passo 1: Criar Conta Focus NFe

1. Acesse: https://focusnfe.com.br
2. Clique em **"Teste Grátis"**
3. Preencha os dados (sem cobrança inicial)
4. Confirme o email

## Passo 2: Obter Token de Homologação

1. Faça login no painel Focus NFe
2. Vá em **Configurações → API**
3. Copie o **Token de Homologação** (diferente do token de produção)
4. Exemplo: `abc123def456ghi789jkl012mno345pqr678`

## Passo 3: Configurar no Sistema

### Opção A: Variáveis de Ambiente (Recomendado)

1. Crie/edite o arquivo `.env` na raiz do projeto:

```env
# Focus NFe - Homologação
VITE_NFE_AMBIENTE=HOMOLOGACAO
VITE_FOCUS_NFE_TOKEN_HOMOLOGACAO=seu_token_aqui
VITE_FOCUS_NFE_BASE_URL_HOMOLOGACAO=https://homologacao.focusnfe.com.br

# CSC - Obtido no portal da SEFAZ (deixe vazio por enquanto)
VITE_CSC_ID_HOMOLOGACAO=000001
VITE_CSC_CODIGO_HOMOLOGACAO=
```

2. **IMPORTANTE:** Reinicie o servidor de desenvolvimento após alterar `.env`

```bash
npm run dev
```

### Opção B: Hardcoded (Apenas para testes)

Edite temporariamente o arquivo `EmitirNotaFiscal.tsx` linha ~715:

```typescript
token: 'SEU_TOKEN_FOCUS_AQUI'
```

## Passo 4: Dados de Teste (Homologação)

### CPF de Teste SEFAZ:
- `111.111.111-91` ou `11111111191`

### CNPJ de Teste SEFAZ:
- `11.111.111/0001-81` ou `11111111000181`

### Inscrição Estadual de Teste:
- `111111111111` (12 dígitos genéricos)

## Passo 5: Emitir Primeira NF-e de Teste

1. No sistema, vá em **Notas Fiscais → Emitir Nota Fiscal**
2. Selecione a empresa emissora
3. Preencha destinatário com CPF de teste: `11111111191`
4. Adicione pelo menos 1 produto
5. Clique em **Transmitir para SEFAZ**

### Resultado Esperado:

✅ **Sucesso:** "NF-e autorizada com sucesso! Chave: 35..."
❌ **Erro:** Verifique mensagem de erro e consulte FAQ abaixo

## 📊 Verificar Nota no Painel Focus

1. Acesse o painel Focus NFe
2. Vá em **NF-e → Consultar**
3. Veja a nota emitida com status "Autorizada"
4. Baixe XML e DANFE para conferir

## ❓ FAQ - Problemas Comuns

### "Token inválido" ou "401 Unauthorized"
- ✅ Confirme que copiou o token completo
- ✅ Use o token de **Homologação**, não Produção
- ✅ Reinicie o servidor após configurar `.env`

### "Certificado digital não encontrado"
- ✅ Para Focus NFe não precisa certificado! O token já resolve
- ✅ Se ainda pedir, deixe campo vazio (Focus assina por você)

### "Erro 539: CNPJ destinatário não cadastrado"
- ✅ Use CPF/CNPJ de teste fornecidos pela SEFAZ
- ✅ No painel Focus, configure "Ambiente de Homologação"

### "CSC inválido"
- ✅ Para NFe (modelo 55): CSC não é obrigatório
- ✅ Para NFCe (modelo 65): Obtenha no portal da sua SEFAZ estadual
- ✅ Pode deixar vazio temporariamente para testar NFe

### "Nota fiscal já existe" (duplicidade)
- ✅ Sistema auto-incrementa o número
- ✅ Se der erro, aumente manualmente em Parâmetros Fiscais → Numeração

## 🔥 Dica: Log de Debug

Para ver detalhes técnicos, abra o Console do navegador (F12) ao emitir nota:

```
🚀 Iniciando emissão de NF-e...
📄 Gerando XML...
📤 Enviando para SEFAZ...
✅ Emissão finalizada
```

## 📱 Contato Focus NFe

- Email: suporte@focusnfe.com.br
- Telefone: (11) 4950-5070
- Chat: Disponível no painel

## 🎉 Próximos Passos

Após testar em homologação:

1. ✅ Adquirir certificado digital A1
2. ✅ Cadastrar CSC no portal da SEFAZ
3. ✅ Contratar plano Focus NFe produção
4. ✅ Alterar ambiente para PRODUCAO
5. ✅ Emitir notas reais!

---

**Última atualização:** 26/01/2026  
**Versão:** 1.0  
**Suporte:** Consulte README_INTEGRACAO_NFE.md para documentação completa
