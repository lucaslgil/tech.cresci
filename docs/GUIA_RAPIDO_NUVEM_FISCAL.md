# 🚀 GUIA RÁPIDO - INTEGRAÇÃO NUVEM FISCAL

## ⚡ Início Rápido (5 minutos)

### 1️⃣ Configurar Variáveis de Ambiente

Edite o arquivo `.env`:

```env
# Adicione estas linhas:
VITE_NUVEM_FISCAL_AMBIENTE=SANDBOX
VITE_NUVEM_FISCAL_API_KEY=eo17RT4POBe1nzGqQKwA
```

### 2️⃣ Atualizar Banco de Dados

No Supabase SQL Editor, execute:

```sql
-- Adicionar campo para armazenar ID da Nuvem Fiscal
ALTER TABLE notas_fiscais 
ADD COLUMN IF NOT EXISTS nuvem_fiscal_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_nuvem_fiscal_id 
ON notas_fiscais(nuvem_fiscal_id);
```

### 3️⃣ Testar Emissão

1. Acesse: **Notas Fiscais > Emitir Nota Fiscal**
2. Preencha os dados da nota
3. Clique em **"Transmitir para SEFAZ"**
4. Aguarde o retorno (10-30 segundos)

---

## ✅ Checklist de Configuração

- [ ] Variáveis de ambiente configuradas
- [ ] Campo `nuvem_fiscal_id` adicionado ao banco
- [ ] Dados da empresa cadastrados (CNPJ, IE, endereço)
- [ ] Pelo menos um produto cadastrado
- [ ] Regra fiscal padrão configurada

---

## 📋 Próximos Passos

1. ✅ **Teste em SANDBOX** (ambiente atual)
   - Emita várias notas de teste
   - Teste diferentes CFOPs
   - Valide cálculos de impostos

2. 🎯 **Validação**
   - Verifique se XMLs estão sendo salvos
   - Confira cálculos de impostos
   - Teste cancelamento

3. 🚀 **Produção** (quando pronto)
   - Obtenha chave de API de produção
   - Altere `VITE_NUVEM_FISCAL_AMBIENTE=PRODUCAO`
   - Atualize a chave de API

---

## 🆘 Problemas Comuns

### "API Key não configurada"
➡️ Adicione `VITE_NUVEM_FISCAL_API_KEY` no `.env`

### "Erro 401"
➡️ Verifique se a chave está correta

### "Campo nuvem_fiscal_id não existe"
➡️ Execute o SQL do passo 2

### "Inscrição Estadual inválida"
➡️ Cadastre a IE da empresa em **Cadastros > Empresa**

---

## 📞 Ajuda

- 📖 **Documentação Completa**: Ver arquivo `INTEGRACAO_NUVEM_FISCAL.md`
- 🐛 **Debug**: Abrir console do navegador (F12)
- 💬 **Suporte Nuvem Fiscal**: https://dev.nuvemfiscal.com.br

---

**🎉 Pronto!** Seu sistema está integrado com a Nuvem Fiscal!
