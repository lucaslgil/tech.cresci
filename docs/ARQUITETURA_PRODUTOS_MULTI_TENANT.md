# Arquitetura Multi-Tenant de Produtos - Melhor Prática

## Problema Identificado
- Produtos cadastrados estão vinculados a empresa_id específico
- PDV configurado para empresa 4 não encontra produtos
- Necessidade de definir estratégia multi-tenant

## Solução Arquitetural: Produtos Compartilhados

### Estrutura de Dados

```
produtos_catalogo (Catálogo Centralizado)
├── id
├── codigo (único global)
├── descricao
├── ean13, ncm, cest (dados fiscais)
└── ativo

empresa_produtos (Vínculo Empresa-Produto)
├── empresa_id
├── produto_catalogo_id
├── preco_venda (específico da empresa)
├── estoque_atual (específico da empresa)
├── cfop (específico da empresa)
└── ativo
```

### Vantagens

1. **Cadastro Único**: Produto cadastrado uma vez, usado em várias empresas
2. **Precificação Diferenciada**: Cada empresa define seu preço
3. **Estoque Separado**: Controle independente por empresa
4. **Gestão Centralizada**: Atualizar dados fiscais em um lugar só
5. **Flexibilidade**: Produto pode estar ativo em uma empresa e inativo em outra

### Fluxo de Cadastro na Interface

#### Tela: Cadastro de Produtos

**Dados Globais (produtos_catalogo):**
- Código Interno
- Descrição
- EAN13
- NCM, CEST, Origem
- Ativo/Inativo

**Dados por Empresa (empresa_produtos):**
```
┌─────────────────────────────────────────┐
│ Produto: ADESIVO AMARELINHA             │
├─────────────────────────────────────────┤
│ [x] Disponível em:                      │
│                                         │
│ [ ] CRESCI E PERDI - SÃO JOSÉ DO PARDO │
│     Preço Venda: R$ ________            │
│     Estoque: ________                   │
│     CFOP: ________                      │
│                                         │
│ [x] Empresa Central                     │
│     Preço Venda: R$ 15.50               │
│     Estoque: 100                        │
│     CFOP: 5102                          │
│                                         │
│ [ ] Filial ABC                          │
│     Preço Venda: R$ ________            │
│     Estoque: ________                   │
│     CFOP: ________                      │
└─────────────────────────────────────────┘
```

**Lógica:**
- Usuário marca em quais empresas o produto estará disponível
- Para cada empresa marcada, define preço/estoque específico
- Sistema cria/atualiza registros em `empresa_produtos`

### Implementação

#### Fase 1: Migração (Executar SQL)
1. `ARQUITETURA_MULTI_TENANT_PRODUTOS.sql` - Cria nova estrutura
2. Migra dados existentes automaticamente
3. Cria view de compatibilidade

#### Fase 2: Solução Rápida (Apenas para testar PDV)
1. `SOLUCAO_RAPIDA_PRODUTOS_EMPRESA4.sql` - Copia produtos para empresa 4
2. Permite testar sincronização imediatamente

#### Fase 3: Ajustar Frontend (Código React)
**Arquivos a modificar:**

1. **src/pages/Cadastro/Produtos.tsx**
   - Adicionar seção "Empresas com acesso"
   - Checkbox para cada empresa
   - Campos preço/estoque por empresa

2. **src/services/produtosService.ts**
   - Criar: `createProdutoCatalogo()`
   - Criar: `vincularEmpresa(produtoId, empresaId, dados)`
   - Listar: `getProdutosByEmpresa(empresaId)`

3. **flash-pdv/electron/database/sync.ts**
   - Alterar query de:
     ```typescript
     .from('produtos')
     .eq('empresa_id', this.empresaId)
     ```
   - Para:
     ```typescript
     .from('empresa_produtos')
     .select(`
       id,
       empresa_id,
       preco_venda,
       estoque_atual,
       cfop,
       produtos_catalogo:produto_catalogo_id (
         codigo,
         descricao,
         unidade,
         ean13,
         ncm,
         cest,
         origem_mercadoria
       )
     `)
     .eq('empresa_id', this.empresaId)
     ```

### Queries Úteis

**Listar produtos de uma empresa:**
```sql
SELECT 
  pc.codigo,
  pc.descricao,
  ep.preco_venda,
  ep.estoque_atual,
  pc.ean13
FROM empresa_produtos ep
INNER JOIN produtos_catalogo pc ON pc.id = ep.produto_catalogo_id
WHERE ep.empresa_id = 4 AND ep.ativo = true;
```

**Adicionar produto a uma empresa:**
```sql
INSERT INTO empresa_produtos (
  empresa_id, 
  produto_catalogo_id, 
  preco_venda, 
  estoque_atual
)
VALUES (4, 123, 25.50, 100);
```

**Ver em quantas empresas um produto está:**
```sql
SELECT 
  pc.descricao,
  COUNT(ep.empresa_id) as qtd_empresas
FROM produtos_catalogo pc
LEFT JOIN empresa_produtos ep ON ep.produto_catalogo_id = pc.id
GROUP BY pc.id, pc.descricao;
```

## Decisão Necessária

**AGORA:** Qual abordagem usar?

1. **Arquitetura Completa** (recomendado para produção)
   - Execute: `ARQUITETURA_MULTI_TENANT_PRODUTOS.sql`
   - Necessita ajustes no código (1-2 dias)
   - Implementação definitiva e escalável

2. **Solução Rápida** (para testar PDV hoje)
   - Execute: `SOLUCAO_RAPIDA_PRODUTOS_EMPRESA4.sql`
   - Copia produtos para empresa 4
   - Permite sincronizar imediatamente
   - Migração para arquitetura completa depois

## Recomendação

✅ **Execute Solução Rápida AGORA** para destravar o PDV
✅ **Planeje Arquitetura Completa** para implementar esta semana
✅ Melhor prática: Um produto, múltiplos vínculos empresariais
