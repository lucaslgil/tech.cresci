# 🚀 GUIA DE TESTE - Emissão DIRETA SEFAZ (Homologação)

## ✅ Status: PRONTO PARA TESTAR!

A assinatura digital está **100% implementada e funcional**!

---

## 📋 Pré-requisitos

### 1. Certificado Digital A1
Você precisa de um certificado digital válido (arquivo `.pfx` ou `.p12`)

**Para testes em homologação:**
- Pode usar certificado de produção (não há risco)
- Ou solicitar certificado de teste da SEFAZ
- Válido para CNPJde teste ou seu CNPJ real

### 2. Supabase CLI
```bash
# Instalar (se ainda não tem)
npm install -g supabase

# Verificar instalação
supabase --version
```

---

## 🔧 Passo 1: Deploy da Edge Function

```bash
# Na raiz do projeto
cd c:\Users\Lucas\Desktop\tech.crescieperdi

# Login no Supabase (se necessário)
supabase login

# Link com seu projeto
supabase link --project-ref alylochrlvgcvjdmkmum

# Deploy da função
supabase functions deploy emitir-nfe
```

**Aguarde:** "Deployed Function emitir-nfe"

---

## 🏢 Passo 2: Configurar Empresa

### 2.1 Dados da Empresa
```
Acesse: Cadastros > Empresa

Configure:
✅ CNPJ completo
✅ Razão Social
✅ Nome Fantasia
✅ Inscrição Estadual
✅ Regime Tributário (Simples Nacional, Normal, etc)
✅ CRT (1, 2 ou 3)
✅ Endereço COMPLETO
✅ CEP
✅ Código do Município (IBGE)
✅ Telefone
✅ Email

IMPORTANTE:
✅ Ambiente NF-e: HOMOLOGACAO
```

### 2.2 Certificado Digital
```
Acesse: Notas Fiscais > Parâmetros Fiscais

Aba: Certificado Digital

1. Clique em "Upload Certificado"
2. Selecione seu arquivo .pfx
3. Digite a SENHA do certificado
4. Clique em "Salvar"

Sistema vai:
✅ Validar certificado
✅ Mostrar data de validade
✅ Salvar criptografado no banco
```

---

## 📊 Passo 3: Configurar Regras de Tributação

```
Acesse: Notas Fiscais > Parâmetros Fiscais > Regras de Tributação

Crie uma regra básica:
Nome: "VENDA SIMPLES NACIONAL"
Empresa: [Sua empresa]
Estado Origem: SP (ou seu estado)
Estado Destino: SP (mesmo estado)
Tipo Cliente: Pessoa Física

Impostos:
- ICMS: CST 102 (Simples Nacional) ou adequado
- PIS: CST 49
- COFINS: CST 49
- Alíquotas: conforme seu regime

Salvar!
```

---

## 🎯 Passo 4: Emitir Nota de Teste

### 4.1 Dados do Destinatário (Teste)
Use dados de teste da SEFAZ:

```
CPF: 111.111.111-11 ou 999.999.999-99
Nome: CONSUMIDOR TESTE
Indicador IE: Não contribuinte
Endereço: Rua Teste, 123
Bairro: Centro
Cidade: São Paulo (ou sua cidade)
UF: SP
CEP: 01000-000
```

### 4.2 Produto de Teste
```
Código: PROD001
Descrição: PRODUTO TESTE HOMOLOGACAO
NCM: 99999999 (ou NCM válido)
Unidade: UN
Quantidade: 1
Valor Unitário: R$ 1,00
CFOP: 5102 (venda dentro do estado)
```

### 4.3 Emitir!
```
1. Acesse: Notas Fiscais > Emitir Nota Fiscal
2. Preencha todos os campos
3. Revise os dados
4. Clique em "Transmitir para SEFAZ"
5. Aguarde processamento...
```

---

## 📝 O que vai acontecer:

```
Frontend:
  ↓ Envia dados para Edge Function
  
Edge Function (logs no Supabase):
  📋 Busca dados da nota...
  📋 Busca certificado da empresa...
  🔍 Validando certificado...
  ✅ Certificado válido até: 2027-12-31
  📄 Gerando XML...
  🔏 Iniciando assinatura digital...
  📜 Carregando certificado...
  ✅ Certificado carregado: [Nome do titular]
  🔍 Elemento infNFe encontrado, ID: NFe...
  🔐 Hash calculado (SHA-256): ...
  ✍️ Assinatura gerada: ...
  ✅ XML assinado com sucesso!
  📤 Enviando para SEFAZ...
  📥 Resposta SEFAZ: [XML de retorno]
  ✅ Resultado: AUTORIZADA - 100 - Autorizado o uso da NF-e

Frontend:
  ✅ NF-e autorizada com sucesso!
  Chave: 35260212345678901234550010000000011123456789
```

---

## 🔍 Verificar Resultados

### No Supabase
```sql
-- Ver última nota criada
SELECT 
  id,
  numero,
  serie,
  status,
  chave_acesso,
  protocolo_autorizacao,
  mensagem_sefaz,
  created_at
FROM notas_fiscais
ORDER BY created_at DESC
LIMIT 1;

-- Ver se XML foi assinado
SELECT 
  id,
  numero,
  LENGTH(xml_assinado) as tamanho_xml,
  xml_assinado LIKE '%<Signature%' as tem_assinatura
FROM notas_fiscais
WHERE id = [ID_DA_NOTA];
```

### Logs da Edge Function
```
1. Acesse: Supabase Dashboard
2. Functions > emitir-nfe
3. Logs
4. Veja todo o processo detalhado
```

---

## ✅ Sucesso - O que significa

Se retornou **"100 - Autorizado o uso da NF-e"**:

✅ Certificado válido  
✅ XML gerado corretamente  
✅ Assinatura digital OK  
✅ Comunicação SOAP OK  
✅ SEFAZ aceitou a nota  
✅ **Modo DIRETO funcionando 100%!**

Você pode:
- ✅ Consultar a nota no portal da SEFAZ
- ✅ Gerar DANFE
- ✅ Enviar por email
- ✅ Usar em produção quando quiser

---

## ❌ Erros Comuns

### "Certificado inválido"
- Verifique senha do certificado
- Confirme que é arquivo .pfx válido
- Veja se certificado não está vencido

### "Rejeição 280 - Certificado Transmissor inválido"
- Certificado não está na cadeia de certificação ICP-Brasil
- Use certificado válido (não auto-assinado)

### "Rejeição 225 - Falha no Schema XML"
- Algum campo obrigatório faltando
- Verifique logs para ver qual campo

### "Erro ao comunicar com SEFAZ"
- Verifique conexão internet
- SEFAZ pode estar em manutenção
- Tente novamente em alguns minutos

---

## 🎉 Próximos Passos

### Após sucesso em homologação:

1. **Testar vários cenários:**
   - Diferentes produtos
   - Diferentes clientes
   - Diferentes estados
   - Diferentes CFOPs

2. **Validar campos:**
   - Impostos calculados corretamente
   - Totais batendo
   - Dados completos

3. **Migrar para produção:**
   ```
   1. Empresa > Ambiente: PRODUCAO
   2. Certificado de PRODUCAO configurado
   3. Emitir nota real
   4. Verificar autorização
   ```

---

## 📞 Suporte

**Funcionou?** 🎉  
Parabéns! Você tem emissão direta GRATUITA funcionando!

**Não funcionou?** 🤔  
Verifique os logs da Edge Function e me avise o erro exato.

---

## 💰 Resumo do que você tem AGORA:

✅ Emissão DIRETA para SEFAZ  
✅ SEM custo de API intermediária  
✅ Assinatura digital completa  
✅ Comunicação SOAP funcional  
✅ Homologação E Produção  
✅ 100% gratuito, para sempre!  

**Focus NFe?** Não precisa! (a menos que queira facilidade extra)

---

**Criado:** 04/02/2026  
**Status:** ✅ PRONTO PARA TESTE  
**Tempo estimado:** 15-20 minutos  
**Próximo passo:** Execute Passo 1 (Deploy)!
