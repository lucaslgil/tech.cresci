# ✅ CHECKLIST - ANTES DE TESTAR

## 🚨 AÇÕES OBRIGATÓRIAS (FAÇA AGORA!)

### ☑️ 1. Executar SQL no Supabase
**Status:** ⏳ PENDENTE

Acesse: https://supabase.com/dashboard/project/alylochrlvgcvjdmkmum/editor

Execute:
```sql
-- Adicionar campo nuvem_fiscal_id
ALTER TABLE notas_fiscais 
ADD COLUMN IF NOT EXISTS nuvem_fiscal_id VARCHAR(100);

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_nuvem_fiscal_id 
ON notas_fiscais(nuvem_fiscal_id);

-- Comentário
COMMENT ON COLUMN notas_fiscais.nuvem_fiscal_id 
IS 'ID interno da nota na plataforma Nuvem Fiscal';
```

### ☑️ 2. Reiniciar Servidor
**Status:** ⏳ PENDENTE

```bash
# No terminal, parar servidor (Ctrl+C)
# Depois reiniciar:
npm run dev
```

### ☑️ 3. Limpar Cache do Navegador
**Status:** ⏳ PENDENTE

- Abrir DevTools (F12)
- Aba "Network"
- Marcar "Disable cache"
- Recarregar página (Ctrl+Shift+R)

---

## ✅ VERIFICAÇÕES AUTOMÁTICAS

### ☑️ Variáveis de Ambiente
**Status:** ✅ CONFIGURADAS

```env
✅ VITE_NUVEM_FISCAL_AMBIENTE=SANDBOX
✅ VITE_NUVEM_FISCAL_API_KEY=eo17RT4POBe1nzGqQKwA
```

### ☑️ Arquivos Criados
**Status:** ✅ OK

- ✅ `src/services/nfe/nuvemFiscalClient.ts`
- ✅ `src/services/nfe/nuvemFiscalAdapter.ts`
- ✅ `database/adicionar_nuvem_fiscal_id.sql`

### ☑️ Arquivos Atualizados
**Status:** ✅ OK

- ✅ `src/services/nfe/nfeService.ts`
- ✅ `src/services/nfe/types.ts`
- ✅ `src/features/notas-fiscais/EmitirNotaFiscal.tsx`
- ✅ `.env`

### ☑️ Erros de Compilação
**Status:** ✅ NENHUM ERRO

---

## 🧪 TESTE RÁPIDO

Após completar as 3 ações obrigatórias acima:

### 1. Acessar Emissão
```
http://localhost:5173/notas-fiscais/emitir
```

### 2. Preencher Dados Mínimos
- ✅ Empresa emissora
- ✅ Cliente destinatário
- ✅ Produto (1 item)
- ✅ Forma de pagamento

### 3. Transmitir
- Clicar em **"Transmitir para SEFAZ"**
- Aguardar 10-30 segundos
- Verificar mensagem de sucesso

### 4. Verificar Console (F12)
Você DEVE ver:
```
🚀 Iniciando emissão via Nuvem Fiscal
🔄 Convertendo dados para formato Nuvem Fiscal
📤 Enviando NF-e para Nuvem Fiscal
📥 Resposta da Nuvem Fiscal: {...}
✅ NF-e emitida com sucesso
```

---

## 🆘 SE DER ERRO

### Erro: "nuvem_fiscal_id não existe"
➡️ **Você não executou o SQL!** Volte ao passo 1

### Erro: "API Key não configurada"
➡️ Verifique o arquivo `.env`

### Erro: "401 Unauthorized"
➡️ Chave de API inválida

### Erro: "Cannot find module"
➡️ Reinicie o servidor (passo 2)

### Outros erros
➡️ Abra o arquivo [`INTEGRACAO_NUVEM_FISCAL.md`](INTEGRACAO_NUVEM_FISCAL.md) seção "Troubleshooting"

---

## 📞 Documentação Completa

- 📖 [`GUIA_RAPIDO_NUVEM_FISCAL.md`](GUIA_RAPIDO_NUVEM_FISCAL.md)
- 📖 [`INTEGRACAO_NUVEM_FISCAL.md`](INTEGRACAO_NUVEM_FISCAL.md)
- 📖 [`CORRECAO_MUDANCA_NUVEM_FISCAL.md`](CORRECAO_MUDANCA_NUVEM_FISCAL.md)

---

**⚠️ LEMBRE-SE: Execute o SQL ANTES de testar!**
