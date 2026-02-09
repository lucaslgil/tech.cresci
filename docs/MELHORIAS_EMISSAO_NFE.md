# 🚀 MELHORIAS - EMISSÃO DE NOTA FISCAL

**Data:** 15/01/2026  
**Status:** ✅ Implementado

---

## 📋 Melhorias Implementadas

### 1. ✅ Botão "Salvar Rascunho"

**Objetivo:** Permitir salvar dados parciais da nota fiscal, reservando o número sem emitir para a SEFAZ.

**Funcionalidades:**
- Salva todos os dados da nota fiscal no banco com status `RASCUNHO`
- Reserva o número da nota fiscal automaticamente
- Permite retomar a emissão posteriormente
- Valida dados obrigatórios antes de salvar
- Exibe mensagem de sucesso com o número reservado

**Localização:**
- Arquivo: [EmitirNotaFiscal.tsx](src/features/notas-fiscais/EmitirNotaFiscal.tsx)
- Etapa: **Etapa 5 - Revisão**
- Posicionamento: Ao lado do botão "Emitir Nota Fiscal"

**Como usar:**
1. Preencha os dados da nota fiscal (empresa, destinatário, produtos)
2. Avance até a etapa de Revisão
3. Clique no botão **"Salvar Rascunho"**
4. O sistema salva os dados e reserva o número da nota
5. A nota fica com status `RASCUNHO` no banco de dados
6. Posteriormente, é possível localizar e concluir a emissão

**Ícone:** 💾 Ícone de download/save

---

### 2. ✅ Correção Exibição Código do Produto

**Problema identificado:**
Ao emitir nota fiscal a partir de uma venda, o código exibido na tabela de itens era o `id` (UUID) do banco de dados Supabase, ao invés do `codigo_interno` cadastrado no sistema.

**Solução implementada:**
- Alterada a consulta ao banco para buscar o campo `codigo_interno` do produto
- Priorização: `codigo_interno` → `codigo_produto` da venda → `produto_id` (fallback)
- Exibição consistente em toda a interface

**Arquivo modificado:**
- [EmitirNotaFiscal.tsx](src/features/notas-fiscais/EmitirNotaFiscal.tsx)
- Função: `preencherDadosVenda()`

**Antes:**
```typescript
codigo_produto: itemVenda.codigo_produto || String(itemVenda.produto_id)
```

**Depois:**
```typescript
codigo_produto: produto?.codigo_interno || itemVenda.codigo_produto || String(itemVenda.produto_id)
```

---

## 🎨 Design e Experiência do Usuário

### Botão "Salvar Rascunho"
- **Cor:** #394353 (cor oficial do sistema)
- **Tamanho:** text-sm font-semibold
- **Hover:** opacity-90
- **Ícone:** Download/Save SVG
- **Estado desabilitado:** bg-slate-400 (quando carregando)
- **Feedback visual:** Spinner animado durante salvamento

### Mensagens ao Usuário
- ✅ **Sucesso:** "Rascunho salvo com sucesso! Número reservado: {numero}/{serie}"
- ❌ **Erro:** Mensagem específica do erro ocorrido
- ⚠️ **Validação:** "Adicione pelo menos um item" / "Preencha os dados do destinatário"

---

## 🗄️ Impacto no Banco de Dados

### Status da Nota Fiscal
A nota salva como rascunho recebe o status: `RASCUNHO`

**Estados possíveis:**
- `RASCUNHO` - Nota salva parcialmente, aguardando emissão
- `PROCESSANDO` - Em processo de transmissão para SEFAZ
- `AUTORIZADA` - Autorizada pela SEFAZ
- `CANCELADA` - Cancelada após autorização
- `DENEGADA` - Denegada pela SEFAZ
- `REJEITADA` - Rejeitada pela SEFAZ
- `INUTILIZADA` - Numeração inutilizada

### Campos Salvos
Quando salvo como rascunho, são gravados:
- Todos os dados da empresa emissora
- Dados completos do destinatário
- Todos os itens com tributação calculada
- Totalizadores (produtos, impostos, etc)
- Modalidade de frete e pagamento
- Informações complementares

---

## 🔄 Fluxo de Trabalho

### Cenário 1: Emissão Completa (Normal)
1. Preencher dados → Revisar → **Emitir Nota Fiscal**
2. Sistema cria rascunho + envia para SEFAZ
3. Recebe autorização e status muda para `AUTORIZADA`

### Cenário 2: Salvar para Depois
1. Preencher dados → Revisar → **Salvar Rascunho**
2. Sistema cria rascunho e **não** envia para SEFAZ
3. Status permanece `RASCUNHO`
4. Usuário pode retomar depois

### Cenário 3: Emissão a partir de Venda
1. Em Vendas, clicar "Emitir Nota Fiscal"
2. Sistema preenche automaticamente os dados
3. **Código do produto exibido corretamente** (código interno)
4. Usuário revisa e escolhe: Salvar Rascunho ou Emitir

---

## ✅ Validações Implementadas

Antes de salvar rascunho, o sistema valida:
- ✅ Pelo menos 1 item adicionado
- ✅ CPF/CNPJ do destinatário preenchido
- ✅ Nome/Razão Social do destinatário preenchido
- ✅ Empresa emissora selecionada
- ✅ Natureza da operação informada

---

## 📱 Compatibilidade

- ✅ Desktop
- ✅ Tablet
- ✅ Mobile (responsivo)

---

## 🧪 Testes Recomendados

### Teste 1: Salvar Rascunho Simples
1. Preencher nota fiscal completa
2. Clicar em "Salvar Rascunho"
3. Verificar mensagem de sucesso com número reservado
4. Consultar banco: `SELECT * FROM notas_fiscais WHERE status = 'RASCUNHO'`

### Teste 2: Validação de Campos
1. Tentar salvar rascunho sem itens → Deve exibir erro
2. Tentar salvar sem destinatário → Deve exibir erro
3. Preencher tudo e salvar → Deve funcionar

### Teste 3: Código do Produto na Venda
1. Criar uma venda com produtos cadastrados
2. Clicar em "Emitir Nota Fiscal" na venda
3. Na tabela de itens, verificar se o código exibido é o `codigo_interno`
4. Não deve aparecer UUID/ID do banco

### Teste 4: Interface Responsiva
1. Testar em diferentes resoluções
2. Verificar se botões ficam alinhados
3. Garantir que mensagens são legíveis

---

## 🚀 Próximos Passos (Futuro)

- [ ] Criar tela de "Rascunhos de Notas Fiscais"
- [ ] Permitir editar rascunho salvo
- [ ] Permitir emitir a partir de um rascunho
- [ ] Adicionar filtro de rascunhos na listagem de notas
- [ ] Implementar exclusão de rascunhos antigos

---

## 📊 Consultas SQL Úteis

### Listar rascunhos salvos
```sql
SELECT 
  id,
  numero,
  serie,
  destinatario_nome,
  valor_total,
  data_emissao,
  created_at
FROM notas_fiscais
WHERE status = 'RASCUNHO'
ORDER BY created_at DESC;
```

### Contar rascunhos por empresa
```sql
SELECT 
  e.nome_fantasia,
  COUNT(*) as total_rascunhos
FROM notas_fiscais nf
JOIN empresas e ON e.id = nf.empresa_id
WHERE nf.status = 'RASCUNHO'
GROUP BY e.nome_fantasia;
```

### Ver itens de um rascunho
```sql
SELECT 
  codigo_produto,
  descricao,
  quantidade_comercial,
  valor_unitario_comercial,
  valor_total
FROM notas_fiscais_itens
WHERE nota_fiscal_id = [ID_DO_RASCUNHO];
```

---

## 📝 Changelog

### v1.0.0 - 15/01/2026
- ✅ Implementado botão "Salvar Rascunho"
- ✅ Corrigida exibição do código do produto
- ✅ Adicionadas validações de campos obrigatórios
- ✅ Implementado feedback visual (spinner, mensagens)
- ✅ Seguido padrão de interface oficial (#394353, text-sm)

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Consultar este documento
2. Verificar logs no console do navegador
3. Consultar tabela `notas_fiscais` no Supabase
4. Revisar arquivo [EmitirNotaFiscal.tsx](src/features/notas-fiscais/EmitirNotaFiscal.tsx)
