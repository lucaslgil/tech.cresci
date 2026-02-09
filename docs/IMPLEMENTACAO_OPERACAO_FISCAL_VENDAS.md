# Adição de Campo Operação Fiscal na Tela de Vendas

## 📋 Resumo da Implementação

Foi implementado o campo **Operação Fiscal** na tela de vendas, posicionado ao lado do campo "Data da Venda". Esta funcionalidade facilita a seleção da operação fiscal que será utilizada na emissão da Nota Fiscal Eletrônica (NF-e) a partir da venda.

**Data**: 28/01/2026

---

## ✨ O que foi implementado

### 1. Campo no Banco de Dados
- **Tabela**: `vendas`
- **Nova coluna**: `operacao_fiscal_id` (BIGINT)
- **Tipo**: Foreign Key para `operacoes_fiscais(id)`
- **Comportamento**: ON DELETE SET NULL (opcional)
- **Índice**: Criado para melhor performance

### 2. Interfaces TypeScript Atualizadas

#### Interface `Venda`
```typescript
// Opera\u00e7\u00e3o Fiscal (para emiss\u00e3o de NF-e)
operacao_fiscal_id?: number | string
operacao_fiscal_nome?: string
```

#### Interface `VendaFormData`
```typescript
// Opera\u00e7\u00e3o Fiscal (para emiss\u00e3o de NF-e)
operacao_fiscal_id?: number | string
```

### 3. Tela de Nova Venda

#### Layout Atualizado
- **Localização**: Seção "Dados Gerais"
- **Grid**: 3 colunas
  1. Tipo de Venda
  2. Data da Venda
  3. **Operação Fiscal** ⭐ NOVO

#### Características do Campo
- **Tipo**: Select/Dropdown
- **Obrigatoriedade**: Opcional
- **Carregamento**: Automático ao abrir a tela
- **Filtro**: Apenas operações fiscais ativas
- **Formato de exibição**: `Código - Nome` (ex: "5102 - Venda de Mercadoria")
- **Texto auxiliar**: "Usado na emissão de NF-e"

#### Comportamento
- **Ao criar nova venda**: Campo vazio por padrão
- **Ao editar venda**: Carrega operação fiscal selecionada
- **Estado bloqueado**: Desabilitado quando venda está fechada
- **Carregamento**: Mostra estado de loading enquanto busca operações

### 4. Serviço de Vendas (vendasService.ts)

#### Função `criar()`
```typescript
operacao_fiscal_id: formData.operacao_fiscal_id,
```

#### Função `atualizar()`
```typescript
operacao_fiscal_id: dados.operacao_fiscal_id,
```

---

## 🎯 Benefícios

### Para o Usuário
- **Facilidade**: Seleciona a operação fiscal diretamente na venda
- **Organização**: Vinculação clara entre venda e operação fiscal
- **Agilidade**: Não precisa informar na hora de emitir a NF-e

### Para o Sistema
- **Integração**: Preparado para emissão automática de NF-e
- **Rastreabilidade**: Histórico de qual operação foi usada em cada venda
- **Validação**: Pode ser usado para validações fiscais automáticas

### Para Emissão de NF-e
- **Automatização**: Sistema já sabe qual operação fiscal usar
- **CFOP automático**: Determina CFOP dentro/fora do estado
- **Tributação correta**: Aplica regras fiscais conforme operação

---

## 📦 Arquivos Modificados

### SQL
- ✅ `database/adicionar_operacao_fiscal_vendas.sql` (NOVO)
  - Script para adicionar coluna no banco
  - Criação de índice
  - Validações e mensagens

### TypeScript - Interfaces
- ✅ `src/features/vendas/types.ts`
  - Interface `Venda` atualizada
  - Interface `VendaFormData` atualizada

### TypeScript - Componentes
- ✅ `src/features/vendas/NovaVenda.tsx`
  - Import do service de operações fiscais
  - Estados para armazenar operações
  - useEffect para carregar operações
  - Campo visual no formulário
  - Carregamento do valor ao editar

### TypeScript - Serviços
- ✅ `src/features/vendas/vendasService.ts`
  - Salvar `operacao_fiscal_id` ao criar venda
  - Atualizar `operacao_fiscal_id` ao editar venda

---

## 🚀 Como Usar

### 1. Executar Script SQL
```sql
-- No SQL Editor do Supabase:
-- Execute o arquivo: database/adicionar_operacao_fiscal_vendas.sql
```

### 2. Acessar Tela de Vendas
1. Entre em **Vendas** → **Nova Venda**
2. Preencha os campos normalmente
3. No campo **Operação Fiscal**, selecione a operação desejada (opcional)
4. Continue o processo de venda normalmente

### 3. Editar Venda Existente
1. Abra uma venda já criada
2. O campo **Operação Fiscal** mostrará a operação previamente selecionada
3. Pode alterar se necessário (se venda não estiver fechada)

### 4. Emitir NF-e a partir da Venda
1. Quando for emitir a NF-e pela venda
2. O sistema usará automaticamente a operação fiscal selecionada
3. Determina CFOP e tributação conforme a operação

---

## 🔄 Fluxo Completo

```
1. Usuário cria nova venda
   ↓
2. Seleciona Operação Fiscal (ex: "5102 - Venda de Mercadoria")
   ↓
3. Sistema salva venda com operacao_fiscal_id
   ↓
4. Ao emitir NF-e, sistema consulta operação fiscal vinculada
   ↓
5. Define CFOP automaticamente:
   - Cliente mesmo estado → usa cfop_dentro_estado
   - Cliente outro estado → usa cfop_fora_estado
   ↓
6. Aplica regras tributárias da operação fiscal
   ↓
7. NF-e é emitida com configurações corretas
```

---

## 📊 Estrutura de Dados

### Tabela `vendas` (campo adicionado)
```sql
operacao_fiscal_id BIGINT REFERENCES operacoes_fiscais(id) ON DELETE SET NULL
```

### Tabela `operacoes_fiscais` (já existente)
```sql
id BIGINT PRIMARY KEY
codigo VARCHAR(20)
nome VARCHAR(100)
cfop_dentro_estado VARCHAR(4)
cfop_fora_estado VARCHAR(4)
cfop_exterior VARCHAR(4)
tipo_operacao VARCHAR(30)
finalidade VARCHAR(10)
...
```

---

## ⚙️ Configurações e Validações

### Campo Obrigatório?
- **NÃO** - O campo é opcional
- Permite flexibilidade para vendas que não geram NF-e
- Recomendado preencher para vendas que serão faturadas

### Quando Preencher?
- ✅ Vendas que serão faturadas (geram NF-e)
- ✅ Quando há operação fiscal específica definida
- ⚠️ Opcional para orçamentos (podem não gerar NF-e)

### Validações
- Campo desabilitado se venda está fechada
- Lista apenas operações fiscais ativas
- Permite campo vazio (NULL no banco)

---

## 🎨 Design e Estilo

### Padrão Aplicado
- **Cores**: Borda `#C9C4B5`, foco `#394353` (conforme PADRAO_INTERFACE_SISTEMA.md)
- **Tipografia**: text-sm (campos de input)
- **Espaçamento**: gap-3 (grid)
- **Label**: text-xs font-medium text-gray-700

### Acessibilidade
- Label descritivo e claro
- Texto auxiliar explicativo
- Estado de loading visível
- Estado desabilitado quando apropriado

---

## 🧪 Testes Recomendados

### Casos de Teste
1. ✅ Criar venda sem operação fiscal
2. ✅ Criar venda com operação fiscal selecionada
3. ✅ Editar venda e alterar operação fiscal
4. ✅ Editar venda e remover operação fiscal (limpar campo)
5. ✅ Abrir venda existente (verificar se carrega operação)
6. ✅ Tentar editar venda fechada (campo deve estar desabilitado)

---

## ⚠️ Observações Importantes

1. **Campo Opcional**: Não é obrigatório, mas recomendado para vendas que geram NF-e
2. **Integração com NF-e**: Este campo será usado futuramente na emissão automática
3. **Operações Ativas**: Apenas operações fiscais marcadas como ativas aparecem
4. **Performance**: Índice criado para otimizar consultas
5. **Compatibilidade**: Vendas antigas continuam funcionando (campo NULL)

---

## 📚 Documentos Relacionados

- `PADRAO_INTERFACE_SISTEMA.md` - Padrão visual do sistema
- `regras_do_sistema.txt` - Regras gerais do projeto
- `database/MODULO_NOTAS_FISCAIS.md` - Documentação do módulo fiscal
- `src/features/cadastros-fiscais/` - Cadastro de operações fiscais

---

## 🐛 Troubleshooting

### Erro: Tabela 'operacoes_fiscais' não encontrada
- **Solução**: Execute os scripts SQL de cadastros fiscais auxiliares
- Arquivo: `database/aplicar_cadastros_auxiliares.sql`

### Campo não aparece na tela
- **Solução**: Limpe cache do navegador (Ctrl+F5)
- Verifique se está na última versão do código

### Lista de operações vazia
- **Solução**: Cadastre operações fiscais em:
  - Menu: **Cadastros Fiscais** → **Operações Fiscais**
- Certifique-se de que estão marcadas como "ativas"

### Erro ao salvar venda
- **Solução**: Execute o script SQL:
  - `database/adicionar_operacao_fiscal_vendas.sql`
- Verifique se a coluna foi criada no banco

---

## 📞 Próximos Passos

### Futuras Melhorias
1. Validar operação fiscal ao emitir NF-e
2. Sugerir operação fiscal baseada no tipo de venda
3. Filtrar operações por regime tributário da empresa
4. Exibir preview de CFOP ao selecionar operação
5. Relatório de vendas agrupadas por operação fiscal

---

**Versão**: 1.0  
**Data**: 28/01/2026  
**Desenvolvido por**: Sistema de Gestão - Tech Cresci e Perdi
