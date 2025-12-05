# 🚀 GUIA DE INSTALAÇÃO - MÓDULO DE PRODUTOS

## 📋 PRÉ-REQUISITOS

- Projeto React + TypeScript configurado
- Supabase configurado e rodando
- Acesso ao banco de dados PostgreSQL do Supabase

---

## ⚙️ PASSO A PASSO DE INSTALAÇÃO

### 1️⃣ Executar Migration do Banco de Dados

Acesse o **SQL Editor** do Supabase e execute o arquivo:

```
database/criar_tabela_produtos.sql
```

Este script irá criar:
- ✅ Tabela `produtos` com todos os campos fiscais
- ✅ Tabela `produtos_movimentacoes` para controle de estoque
- ✅ Tabela `produtos_precos_historico` para auditoria
- ✅ View `vw_produtos_estoque` com status calculado
- ✅ Índices de performance
- ✅ Triggers automáticos
- ✅ Políticas RLS (Row Level Security)

**⚠️ IMPORTANTE:** Certifique-se de que o usuário tem permissões de CREATE TABLE e CREATE FUNCTION.

---

### 2️⃣ Verificar Estrutura de Arquivos

Os seguintes arquivos devem estar presentes:

```
src/features/produtos/
├── CadastroProdutos.tsx          # ✅ Criado
├── ModalFormularioProduto.tsx    # ✅ Criado
├── types.ts                       # ✅ Criado
└── produtosService.ts             # ✅ Criado

database/
└── criar_tabela_produtos.sql     # ✅ Criado

docs/
└── MODULO_PRODUTOS.md            # ✅ Criado
```

---

### 3️⃣ Verificar Rotas

As rotas já foram adicionadas em:

#### `src/App.tsx`
```tsx
import { CadastroProdutos } from './features/produtos/CadastroProdutos'

// ...
<Route path="cadastro/produtos" element={<CadastroProdutos />} />
```

#### `src/shared/components/Layout.tsx`
```tsx
<Link to="/cadastro/produtos">
  Produtos
</Link>
```

---

### 4️⃣ Testar no Supabase

Execute as seguintes queries para verificar:

```sql
-- Verificar se a tabela foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'produtos';

-- Verificar colunas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'produtos'
ORDER BY ordinal_position;

-- Testar inserção
INSERT INTO produtos (
  codigo_interno,
  nome,
  ncm,
  unidade_medida,
  preco_venda,
  estoque_atual,
  ativo
) VALUES (
  'PROD-001',
  'Produto Teste',
  '12345678',
  'UN',
  100.00,
  10,
  true
) RETURNING *;

-- Verificar view
SELECT * FROM vw_produtos_estoque LIMIT 1;
```

---

### 5️⃣ Acessar no Sistema

1. Faça login no sistema
2. No menu lateral, vá em **Cadastro → Produtos**
3. Clique em **"Adicionar Produto"**
4. Preencha os dados fiscais mínimos:
   - Nome
   - Código interno
   - NCM (8 dígitos)
   - Preço de venda
5. Clique em **"Cadastrar"**

---

## 🧪 TESTES RECOMENDADOS

### Teste 1: Validação de NCM
- Tente cadastrar produto sem NCM → Deve dar erro
- Tente NCM com menos de 8 dígitos → Deve dar erro
- Cadastre com NCM válido (ex: 12345678) → Deve funcionar

### Teste 2: Validação de Regime Tributário
- Configure **Simples Nacional** + preencha CSOSN → OK
- Configure **Simples Nacional** + preencha CST → Deve dar erro
- Configure **Lucro Presumido** + preencha CST → OK
- Configure **Lucro Presumido** + preencha CSOSN → Deve dar erro

### Teste 3: Cálculo de Margem
- Preencha Preço de Custo: R$ 50,00
- Preencha Preço de Venda: R$ 100,00
- Margem deve calcular automaticamente: 100%

### Teste 4: Estoque
- Cadastre produto com estoque atual: 5
- Cadastre estoque mínimo: 10
- Na listagem deve aparecer badge "Estoque Baixo"

### Teste 5: Unicidade
- Cadastre produto com código "PROD-001"
- Tente cadastrar outro com mesmo código → Deve dar erro

---

## 🔧 TROUBLESHOOTING

### Erro: "Tabela produtos não encontrada"
**Solução:** Execute novamente o script `criar_tabela_produtos.sql`

### Erro: "Permission denied"
**Solução:** Verifique as políticas RLS no Supabase. Execute:
```sql
-- Ver políticas
SELECT * FROM pg_policies WHERE tablename = 'produtos';

-- Se necessário, desabilitar RLS temporariamente (APENAS DESENVOLVIMENTO)
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;
```

### Erro: "Column does not exist"
**Solução:** Verifique se todas as colunas foram criadas corretamente:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'produtos';
```

### Erro de importação do componente
**Solução:** Verifique se o caminho está correto:
```tsx
import { CadastroProdutos } from './features/produtos/CadastroProdutos'
```

### Erro de validação fiscal
**Solução:** Certifique-se de que:
- NCM tem exatamente 8 dígitos
- CFOP tem 4 dígitos (se informado)
- Regime tributário está compatível com CST/CSOSN

---

## 📊 DADOS DE EXEMPLO

Para popular o banco com dados de teste, execute:

```sql
INSERT INTO produtos (
  codigo_interno, codigo_barras, nome, descricao, categoria, unidade_medida,
  ncm, cfop_entrada, cfop_saida, origem_mercadoria,
  csosn_icms, aliquota_icms,
  cst_pis, aliquota_pis, cst_cofins, aliquota_cofins,
  regime_tributario, preco_custo, preco_venda, margem_lucro,
  estoque_atual, estoque_minimo, estoque_maximo, ativo
) VALUES 
(
  'MOUSE-001', 
  '7891234567890',
  'Mouse Óptico USB',
  'Mouse óptico com cabo USB, 1000 DPI, 3 botões',
  'Informática',
  'UN',
  '84716053',
  '1102',
  '5102',
  0,
  '102',
  0,
  '01',
  1.65,
  '01',
  7.60,
  'SIMPLES',
  15.00,
  35.00,
  133.33,
  50,
  10,
  100,
  true
),
(
  'TECLADO-001',
  '7891234567891',
  'Teclado ABNT2 USB',
  'Teclado padrão ABNT2 com teclas multimídia',
  'Informática',
  'UN',
  '84716061',
  '1102',
  '5102',
  0,
  '102',
  0,
  '01',
  1.65,
  '01',
  7.60,
  'SIMPLES',
  25.00,
  60.00,
  140.00,
  30,
  15,
  80,
  true
),
(
  'NOTEBOOK-001',
  NULL,
  'Notebook 15.6" Core i5 8GB',
  'Notebook com processador Intel Core i5, 8GB RAM, SSD 256GB',
  'Informática',
  'UN',
  '84713012',
  '1102',
  '5102',
  0,
  '102',
  0,
  '01',
  1.65,
  '01',
  7.60,
  'SIMPLES',
  2500.00,
  3500.00,
  40.00,
  5,
  2,
  10,
  true
);
```

---

## 📚 PRÓXIMOS PASSOS

1. ✅ Módulo de Produtos instalado e funcionando
2. 📋 Próximo: Implementar módulo de **Clientes/Fornecedores**
3. 📋 Próximo: Implementar módulo de **Vendas/PDV**
4. 📋 Próximo: Implementar emissão de **NF-e/NFC-e**
5. 📋 Próximo: Integração com **SPED Fiscal**

---

## 🎓 DOCUMENTAÇÃO COMPLETA

Para mais detalhes, consulte: `docs/MODULO_PRODUTOS.md`

---

## 📞 SUPORTE

Em caso de dúvidas ou problemas, consulte:
- Documentação do sistema
- Equipe de desenvolvimento
- Contador (para questões fiscais)

---

**✅ Instalação concluída com sucesso!**  
O módulo de Produtos está pronto para uso.
