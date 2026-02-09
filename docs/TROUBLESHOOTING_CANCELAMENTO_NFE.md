# 🔧 TROUBLESHOOTING - Cancelamento de NF-e

## ❌ Erro 400 da API Nuvem Fiscal

### Possíveis Causas:

#### 1. **Nota já cancelada**
- **Sintoma**: Erro 400 ao tentar cancelar
- **Causa**: Nota já foi cancelada anteriormente
- **Solução**: Use o botão "Consultar Status SEFAZ" para verificar o status real

#### 2. **Justificativa inválida**
- **Sintoma**: Erro 400 ao enviar cancelamento
- **Causa**: Justificativa com menos de 15 caracteres ou caracteres especiais inválidos
- **Solução**: Use justificativa simples, sem emojis, mínimo 15 caracteres
  ```
  ✅ Correto: "Cancelamento solicitado pelo cliente"
  ❌ Errado: "Cancelar 🚫"
  ```

#### 3. **Prazo expirado**
- **Sintoma**: Erro 400 com mensagem sobre prazo
- **Causa**: Passou mais de 168 horas (7 dias) desde a autorização
- **Solução**: Após 7 dias, só é possível fazer Carta de Correção Eletrônica

#### 4. **Certificado digital**
- **Sintoma**: Erro 401 ou 400 relacionado ao certificado
- **Causa**: Certificado não configurado ou expirado na Nuvem Fiscal
- **Solução**: 
  1. Acessar https://sandbox.nuvemfiscal.com.br
  2. Ir em Configurações > Certificados
  3. Fazer upload do certificado .pfx

#### 5. **Nota não autorizada**
- **Sintoma**: Erro 400 indicando que nota não pode ser cancelada
- **Causa**: Status da nota não é AUTORIZADA
- **Solução**: Verificar status no banco e na SEFAZ

---

## 🔍 Como Debugar

### Passo 1: Verificar Logs no Console
Abra o Console do navegador (F12) e procure por:

```
🔍 Buscando nota X para cancelamento...
📋 Nota encontrada: { status, nuvem_fiscal_id, chave_acesso }
🚫 Enviando cancelamento para Nuvem Fiscal...
📤 Enviando cancelamento: { id, body }
```

Se aparecer erro 400, procure por:
```
📛 Status: 400
📛 Dados do erro: { mensagem detalhada }
```

### Passo 2: Verificar Status no Banco
No Supabase, execute:

```sql
SELECT 
  id,
  numero,
  status,
  nuvem_fiscal_id,
  chave_acesso,
  data_autorizacao,
  data_cancelamento
FROM notas_fiscais 
WHERE id = [ID_DA_NOTA];
```

Valores esperados para cancelamento:
- `status`: deve ser 'AUTORIZADA'
- `nuvem_fiscal_id`: não pode ser NULL
- `chave_acesso`: deve ter 44 caracteres
- `data_autorizacao`: não pode estar há mais de 7 dias

### Passo 3: Consultar Status na SEFAZ
Use o botão "Consultar Status SEFAZ" no modal da nota para verificar o status real.

---

## 🛠️ Códigos de Erro Comuns

### Erro 400 - Bad Request
**Mensagens possíveis:**

1. **"Nota fiscal já cancelada"**
   - Status atual na SEFAZ: CANCELADA
   - Ação: Use consulta de status para atualizar banco local

2. **"Prazo de cancelamento expirado"**
   - Passou 7 dias desde autorização
   - Ação: Não é mais possível cancelar

3. **"Justificativa inválida"**
   - Menos de 15 caracteres ou caracteres especiais
   - Ação: Reescrever justificativa

4. **"Certificado digital não encontrado"**
   - Falta certificado na Nuvem Fiscal
   - Ação: Upload do certificado no painel

### Erro 401 - Unauthorized
- **Causa**: Credenciais OAuth2 inválidas ou expiradas
- **Solução**: Verificar `VITE_NUVEM_FISCAL_CLIENT_ID` e `CLIENT_SECRET` no `.env`

### Erro 404 - Not Found
- **Causa**: `nuvem_fiscal_id` inválido ou nota não existe na Nuvem Fiscal
- **Solução**: Verificar se nota foi emitida pelo sistema atual

### Erro 500 - Internal Server Error
- **Causa**: Erro no servidor da Nuvem Fiscal ou SEFAZ
- **Solução**: Aguardar alguns minutos e tentar novamente

---

## 📋 Checklist para Cancelamento

Antes de tentar cancelar, verifique:

- [ ] Nota está com status **AUTORIZADA** no banco
- [ ] Campo `nuvem_fiscal_id` está preenchido
- [ ] Nota foi autorizada há **menos de 7 dias**
- [ ] Justificativa tem **mínimo 15 caracteres**
- [ ] Certificado digital está configurado na Nuvem Fiscal
- [ ] Credenciais OAuth2 estão corretas no `.env`
- [ ] Está usando o ambiente correto (SANDBOX vs PRODUÇÃO)

---

## 🔄 Fluxo de Recuperação

Se o cancelamento falhar:

1. **Verificar logs detalhados** no console
2. **Consultar status na SEFAZ** via botão azul
3. Se já está cancelada na SEFAZ:
   - Sistema atualizará automaticamente
   - Não precisa cancelar novamente
4. Se ainda está autorizada:
   - Verificar mensagem de erro específica
   - Corrigir problema identificado
   - Tentar novamente

---

## 🆘 Suporte

### Logs Úteis para Debug

Sempre que reportar problema, incluir:

1. **ID da nota fiscal**
2. **Mensagem de erro completa** (do console)
3. **Status atual no banco**
4. **Resposta da API** (📛 Dados do erro)
5. **Tempo desde autorização**

### Documentação da API

- Nuvem Fiscal: https://dev.nuvemfiscal.com.br/docs
- Eventos NF-e: https://dev.nuvemfiscal.com.br/docs/nfe/eventos

---

## ✅ Teste de Validação

Para testar se o cancelamento está funcionando:

1. Emitir nota de teste em homologação
2. Aguardar autorização
3. Imediatamente tentar cancelar
4. Verificar logs no console
5. Confirmar status via "Consultar Status SEFAZ"

**Tempo esperado**: 5-15 segundos para processar cancelamento

---

**Última atualização**: 06/02/2026  
**Versão**: 1.1
