# MÓDULO DE PRODUTOS - ERP BRASILEIRO

**Data de Implementação:** 01 de Dezembro de 2025  
**Versão:** 1.0.0  
**Compatibilidade:** NF-e, NFC-e, CF-e-SAT, SPED Fiscal

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
3. [Funcionalidades](#funcionalidades)
4. [Dados Fiscais](#dados-fiscais)
5. [Como Usar](#como-usar)
6. [Validações](#validações)
7. [Integração Futura](#integração-futura)

---

## 🎯 VISÃO GERAL

O módulo de Produtos é um sistema completo de cadastro e gerenciamento de produtos comerciais, desenvolvido seguindo as normas fiscais brasileiras e preparado para integração com módulos de emissão de documentos fiscais eletrônicos.

### Características Principais

✅ **Cadastro Completo de Produtos**
- Dados gerais (nome, código, descrição, categoria)
- Informações fiscais compatíveis com NF-e/NFC-e
- Dados comerciais (preços, margens, descontos)
- Controle de estoque (atual, mínimo, máximo)
- Rastreabilidade (lote, série, validade)

✅ **Conformidade Fiscal**
- NCM obrigatório (8 dígitos)
- CEST para produtos sujeitos à ST
- CFOPs de entrada e saída
- Origem da mercadoria (0 a 8)
- CST/CSOSN de ICMS
- CST de PIS/COFINS
- CST de IPI
- Alíquotas e bases de cálculo
- Substituição tributária completa

✅ **Gestão Comercial**
- Preço de custo e venda
- Cálculo automático de margem de lucro
- Controle de descontos
- Múltiplas categorias

✅ **Controle de Estoque**
- Estoque atual, mínimo e máximo
- Alertas de estoque baixo
- Localização física
- Controle por lote/série/validade
- Histórico de movimentações

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### Tabela Principal: `produtos`

```sql
CREATE TABLE public.produtos (
  -- Identificação
  id UUID PRIMARY KEY,
  codigo_interno VARCHAR(100) UNIQUE NOT NULL,
  codigo_barras VARCHAR(14) UNIQUE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  
  -- Classificação
  categoria VARCHAR(100),
  unidade_medida VARCHAR(10) DEFAULT 'UN',
  
  -- Dados Fiscais (NF-e / NFC-e / SAT)
  ncm VARCHAR(8) NOT NULL,
  cest VARCHAR(7),
  cfop_entrada VARCHAR(4),
  cfop_saida VARCHAR(4),
  origem_mercadoria INTEGER CHECK (origem_mercadoria BETWEEN 0 AND 8),
  
  -- ICMS
  cst_icms VARCHAR(3),
  csosn_icms VARCHAR(4),
  aliquota_icms DECIMAL(5,2),
  reducao_bc_icms DECIMAL(5,2),
  
  -- Substituição Tributária
  cst_icms_st VARCHAR(3),
  mva_st DECIMAL(5,2),
  aliquota_icms_st DECIMAL(5,2),
  reducao_bc_icms_st DECIMAL(5,2),
  
  -- PIS/COFINS
  cst_pis VARCHAR(2),
  aliquota_pis DECIMAL(5,2),
  cst_cofins VARCHAR(2),
  aliquota_cofins DECIMAL(5,2),
  
  -- IPI
  cst_ipi VARCHAR(2),
  aliquota_ipi DECIMAL(5,2),
  enquadramento_ipi VARCHAR(3),
  
  -- Comercial
  preco_custo DECIMAL(15,2),
  preco_venda DECIMAL(15,2) CHECK (preco_venda >= 0),
  margem_lucro DECIMAL(5,2),
  permite_desconto BOOLEAN,
  desconto_maximo DECIMAL(5,2),
  
  -- Estoque
  estoque_atual DECIMAL(15,3) CHECK (estoque_atual >= 0),
  estoque_minimo DECIMAL(15,3),
  estoque_maximo DECIMAL(15,3),
  localizacao VARCHAR(100),
  
  -- Controles
  controla_lote BOOLEAN,
  controla_serie BOOLEAN,
  controla_validade BOOLEAN,
  dias_validade INTEGER,
  
  -- Status
  ativo BOOLEAN,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabelas Auxiliares

#### `produtos_movimentacoes`
Registra todas as movimentações de estoque (entrada, saída, ajuste, inventário, devolução).

#### `produtos_precos_historico`
Mantém histórico de alterações de preços para auditoria e análise.

### View: `vw_produtos_estoque`
Retorna produtos com status de estoque calculado automaticamente.

---

## ⚙️ FUNCIONALIDADES

### 1. Cadastro de Produtos

**Rota:** `/cadastro/produtos`

**Abas do Formulário:**

#### 📌 Dados Gerais
- Código interno (obrigatório, único)
- Código de barras EAN-13 (opcional, único)
- Nome do produto (obrigatório)
- Descrição
- Categoria
- Unidade de medida
- Status (Ativo/Inativo)
- Observações

#### 📌 Dados Fiscais
- **NCM** (obrigatório, 8 dígitos)
- **CEST** (opcional, 7 dígitos)
- **CFOP** de entrada e saída
- **Origem da Mercadoria** (0 a 8)
- **Regime Tributário** (Simples Nacional, Lucro Presumido, Lucro Real)
- **ICMS:**
  - CST ou CSOSN (conforme regime)
  - Alíquota
  - Redução de base de cálculo
- **Substituição Tributária:**
  - CST ST
  - MVA (Margem de Valor Agregado)
  - Alíquota ST
  - Redução BC ST
- **PIS/COFINS:**
  - CST
  - Alíquotas
- **IPI:**
  - CST
  - Alíquota
  - Enquadramento legal

#### 📌 Dados Comerciais
- Preço de custo
- Preço de venda (obrigatório)
- Margem de lucro (calculada automaticamente)
- Permite desconto
- Desconto máximo (%)

#### 📌 Estoque
- Estoque atual (obrigatório)
- Estoque mínimo
- Estoque máximo
- Localização física
- **Controles de Rastreabilidade:**
  - Controlar por lote
  - Controlar por número de série
  - Controlar validade
  - Dias de validade padrão

### 2. Listagem de Produtos

**Funcionalidades:**
- Busca por nome, código, NCM, categoria
- Filtros:
  - Categoria
  - Status (Ativo/Inativo)
  - Estoque baixo
- Ordenação por qualquer coluna
- Visualização rápida de:
  - Código interno
  - Nome e EAN
  - Categoria
  - NCM formatado
  - Preço de venda
  - Estoque com badge de status
  - Status do produto

**Ações:**
- 👁️ Visualizar detalhes
- ✏️ Editar
- 🗑️ Excluir

### 3. Controle de Estoque

**Status Automático:**
- 🔴 **Sem Estoque** - Estoque atual = 0
- 🟡 **Estoque Baixo** - Estoque < Estoque Mínimo
- 🟢 **Normal** - Estoque entre mínimo e máximo
- 🟣 **Estoque Alto** - Estoque > Estoque Máximo

---

## 📊 DADOS FISCAIS

### NCM (Nomenclatura Comum do Mercosul)

**Obrigatório:** Sim  
**Formato:** 8 dígitos numéricos  
**Exemplo:** 84713012

O NCM identifica a mercadoria e determina a tributação aplicável.

### CEST (Código Especificador da Substituição Tributária)

**Obrigatório:** Não (apenas para produtos sujeitos à ST)  
**Formato:** 7 dígitos  
**Exemplo:** 0100100

### CFOP (Código Fiscal de Operações e Prestações)

**Entrada:** Ex: 1102 (Compra para comercialização)  
**Saída:** Ex: 5102 (Venda de mercadoria)

### Origem da Mercadoria

| Código | Descrição |
|--------|-----------|
| 0 | Nacional |
| 1 | Estrangeira - Importação direta |
| 2 | Estrangeira - Mercado interno |
| 3 | Nacional com conteúdo de importação > 40% e ≤ 70% |
| 4 | Nacional - Processos produtivos básicos |
| 5 | Nacional com conteúdo de importação ≤ 40% |
| 6 | Estrangeira - Importação direta sem similar |
| 7 | Estrangeira - Mercado interno sem similar |
| 8 | Nacional com conteúdo de importação > 70% |

### Regime Tributário

O sistema valida automaticamente:
- **Simples Nacional:** Deve usar CSOSN (não CST)
- **Lucro Presumido/Real:** Deve usar CST (não CSOSN)

---

## 📖 COMO USAR

### Cadastrar Novo Produto

1. Acesse **Cadastro → Produtos**
2. Clique em **"Adicionar Produto"**
3. Preencha os dados em cada aba:
   - **Dados Gerais:** Nome, código, categoria
   - **Dados Fiscais:** NCM, CST/CSOSN, alíquotas
   - **Dados Comerciais:** Preços e margens
   - **Estoque:** Quantidade e controles
4. Clique em **"Cadastrar"**

### Editar Produto

1. Na listagem, clique no ícone de **editar** (✏️)
2. Modifique os campos necessários
3. Clique em **"Atualizar"**

### Buscar Produtos

- Use a barra de busca para localizar por nome, código ou NCM
- Use os filtros para refinar a busca
- Clique nos cabeçalhos da tabela para ordenar

### Gerenciar Estoque

O estoque é atualizado automaticamente através de:
- Movimentações manuais
- Integração com módulo fiscal (futuro)
- Inventário

---

## ✅ VALIDAÇÕES

### Validações Obrigatórias

✔️ Nome do produto  
✔️ Código interno (único)  
✔️ NCM (8 dígitos válidos)  
✔️ Preço de venda ≥ 0  
✔️ Estoque atual ≥ 0

### Validações Fiscais

✔️ **NCM:** 8 dígitos numéricos  
✔️ **CEST:** 7 dígitos (se informado)  
✔️ **CFOP:** 4 dígitos (se informado)  
✔️ **EAN-13:** Código de barras válido com dígito verificador  
✔️ **Regime x CST/CSOSN:** Compatibilidade automática

### Validações de Unicidade

✔️ Código interno único  
✔️ Código de barras único (se informado)

---

## 🔮 INTEGRAÇÃO FUTURA

O módulo de Produtos está preparado para integração com:

### ✅ Módulo de NF-e / NFC-e
- Todos os dados fiscais necessários já estão cadastrados
- Validações conforme layout da SEFAZ
- Cálculo automático de impostos

### ✅ SPED Fiscal
- Registros C170, C190 e outros
- Rastreabilidade completa

### ✅ CF-e-SAT
- Emissão de Cupom Fiscal Eletrônico
- Integração com equipamento SAT

### ✅ Módulo de Vendas/PDV
- Leitura de código de barras
- Consulta rápida de preços
- Atualização automática de estoque

### ✅ Integração com Fornecedores
- Importação de XML de compra
- Atualização automática de custos

---

## 🛠️ ARQUIVOS DO MÓDULO

```
src/features/produtos/
├── CadastroProdutos.tsx          # Componente principal (listagem)
├── ModalFormularioProduto.tsx    # Formulário com abas
├── types.ts                       # Tipos e interfaces
└── produtosService.ts             # Serviços de API e validações

database/
└── criar_tabela_produtos.sql     # Migration completa
```

---

## 📞 SUPORTE

Para dúvidas sobre:
- **Tributação:** Consulte um contador
- **NCM/CEST:** Use o portal da Receita Federal ou IBPT
- **Sistema:** Consulte a equipe de TI

---

## 📝 CHANGELOG

### Versão 1.0.0 - 01/12/2025
- ✅ Implementação inicial do módulo
- ✅ CRUD completo de produtos
- ✅ Validações fiscais brasileiras
- ✅ Controle de estoque básico
- ✅ Histórico de preços
- ✅ Interface responsiva
- ✅ Preparação para NF-e/NFC-e

---

**Desenvolvido seguindo as normas fiscais brasileiras vigentes.**  
**Última atualização:** 01 de Dezembro de 2025
