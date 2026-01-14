# 📋 DOCUMENTAÇÃO COMPLETA - MÓDULO DE EMISSÃO DE NOTAS FISCAIS
**Sistema ERP com Reforma Tributária 2026 (IBS e CBS)**

---

## 🎯 VISÃO GERAL

Este módulo implementa um sistema completo de emissão de notas fiscais eletrônicas (NF-e e NFC-e) com suporte total à **Reforma Tributária 2026**, incluindo os novos impostos **IBS** (Imposto sobre Bens e Serviços) e **CBS** (Contribuição sobre Bens e Serviços).

### Características Principais

✅ **Emissão Avulsa**: Criação manual de notas fiscais  
✅ **Emissão via Venda**: Conversão automática de pedidos em notas  
✅ **Cálculo Tributário Automático**: Motor inteligente de impostos  
✅ **Reforma Tributária 2026**: Suporte completo a IBS/CBS  
✅ **Período de Transição**: Cálculo simultâneo dos dois sistemas (2026-2033)  
✅ **Validações Fiscais**: Conformidade com legislação brasileira  
✅ **Alíquotas Diferenciadas**: Suporte a exceções por NCM

---

## 📊 ARQUITETURA DO SISTEMA

### 1. Camadas da Aplicação

```
┌─────────────────────────────────────────┐
│   INTERFACE (React/TypeScript)          │
│   EmissaoNotasFiscais.tsx                │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│   SERVIÇOS DE NEGÓCIO                    │
│   - notasFiscaisService.ts               │
│   - calculoTributarioService.ts          │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│   BANCO DE DADOS (Supabase/PostgreSQL)  │
│   - notas_fiscais                        │
│   - notas_fiscais_itens                  │
│   - reforma_aliquotas_ncm                │
│   - reforma_cronograma_transicao         │
└─────────────────────────────────────────┘
```

### 2. Fluxo de Emissão

#### **Modo Avulsa**
```
Usuário preenche dados → Validação → Cálculo Tributário → Inserção no BD → Geração XML
```

#### **Modo Venda**
```
Seleção de Venda → Busca dados da venda → Conversão automática → Cálculo → Emissão
```

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### Tabelas Principais

#### 1. **notas_fiscais**
Armazena o cabeçalho das notas fiscais.

```sql
CREATE TABLE notas_fiscais (
  id BIGSERIAL PRIMARY KEY,
  tipo_nota VARCHAR(10) NOT NULL, -- 'NFE' ou 'NFCE'
  numero INTEGER NOT NULL,
  serie INTEGER NOT NULL,
  chave_acesso VARCHAR(44) UNIQUE,
  data_emissao TIMESTAMPTZ NOT NULL,
  
  -- Destinatário
  cliente_id BIGINT,
  destinatario_cpf_cnpj VARCHAR(14),
  destinatario_nome VARCHAR(255),
  destinatario_uf VARCHAR(2),
  
  -- Totais - Sistema Antigo
  valor_icms NUMERIC(15,2) DEFAULT 0.00,
  valor_pis NUMERIC(15,2) DEFAULT 0.00,
  valor_cofins NUMERIC(15,2) DEFAULT 0.00,
  
  -- Totais - Sistema Novo (Reforma 2026)
  valor_ibs NUMERIC(15,2) DEFAULT 0.00,
  valor_cbs NUMERIC(15,2) DEFAULT 0.00,
  base_calculo_ibs NUMERIC(15,2) DEFAULT 0.00,
  base_calculo_cbs NUMERIC(15,2) DEFAULT 0.00,
  
  -- Controle
  regime_tributario_nota VARCHAR(20) DEFAULT 'TRANSICAO',
  ano_competencia INTEGER DEFAULT 2026,
  status VARCHAR(20) NOT NULL DEFAULT 'RASCUNHO'
);
```

#### 2. **notas_fiscais_itens**
Detalha cada item da nota com tributação completa.

```sql
CREATE TABLE notas_fiscais_itens (
  id BIGSERIAL PRIMARY KEY,
  nota_fiscal_id BIGINT REFERENCES notas_fiscais(id),
  numero_item INTEGER NOT NULL,
  
  -- Produto
  produto_id UUID,
  descricao VARCHAR(255) NOT NULL,
  ncm VARCHAR(8) NOT NULL,
  cfop VARCHAR(4) NOT NULL,
  quantidade_comercial NUMERIC(15,4) NOT NULL,
  valor_unitario_comercial NUMERIC(15,4) NOT NULL,
  
  -- Tributação Antiga
  cst_icms VARCHAR(3),
  aliquota_icms NUMERIC(5,2),
  valor_icms NUMERIC(15,2),
  valor_pis NUMERIC(15,2),
  valor_cofins NUMERIC(15,2),
  
  -- Tributação Nova (Reforma 2026)
  cst_ibs VARCHAR(3),
  aliquota_ibs NUMERIC(5,4),
  valor_ibs NUMERIC(15,2),
  credito_ibs NUMERIC(15,2), -- Sistema não-cumulativo
  
  cst_cbs VARCHAR(3),
  aliquota_cbs NUMERIC(5,4),
  valor_cbs NUMERIC(15,2),
  credito_cbs NUMERIC(15,2)
);
```

#### 3. **reforma_aliquotas_ncm**
Exceções de alíquotas IBS/CBS por NCM.

```sql
CREATE TABLE reforma_aliquotas_ncm (
  id BIGSERIAL PRIMARY KEY,
  ncm VARCHAR(8) NOT NULL,
  descricao_ncm TEXT,
  
  aliquota_ibs_padrao NUMERIC(5,4) DEFAULT 0.2700, -- 27%
  aliquota_cbs_padrao NUMERIC(5,4) DEFAULT 0.1200, -- 12%
  
  aliquota_ibs_reduzida NUMERIC(5,4), -- Para produtos especiais
  aliquota_cbs_reduzida NUMERIC(5,4),
  
  tem_aliquota_diferenciada BOOLEAN DEFAULT FALSE,
  tipo_beneficio VARCHAR(50), -- CESTA_BASICA, MEDICAMENTO, etc.
  
  data_inicio DATE DEFAULT '2026-01-01',
  data_fim DATE,
  ativo BOOLEAN DEFAULT TRUE
);
```

#### 4. **reforma_cronograma_transicao**
Cronograma oficial da transição (2026-2033).

```sql
CREATE TABLE reforma_cronograma_transicao (
  id BIGSERIAL PRIMARY KEY,
  ano INTEGER NOT NULL UNIQUE,
  
  -- Percentuais Sistema Antigo (decrescente)
  percentual_icms NUMERIC(5,2) DEFAULT 100.00,
  percentual_pis NUMERIC(5,2) DEFAULT 100.00,
  percentual_cofins NUMERIC(5,2) DEFAULT 100.00,
  
  -- Percentuais Sistema Novo (crescente)
  percentual_ibs NUMERIC(5,2) DEFAULT 0.00,
  percentual_cbs NUMERIC(5,2) DEFAULT 0.00,
  
  fase VARCHAR(50) NOT NULL -- TESTE, TRANSICAO, COMPLETA
);
```

**Dados do Cronograma:**
| Ano | ICMS | PIS | COFINS | IBS | CBS | Fase |
|-----|------|-----|--------|-----|-----|------|
| 2026 | 100% | 100% | 100% | 1% | 1% | TESTE |
| 2027 | 100% | 100% | 100% | 10% | 10% | TESTE |
| 2028 | 90% | 90% | 90% | 10% | 10% | TRANSIÇÃO |
| 2029 | 80% | 80% | 80% | 20% | 20% | TRANSIÇÃO |
| 2030 | 60% | 60% | 60% | 40% | 40% | TRANSIÇÃO |
| 2031 | 40% | 40% | 40% | 60% | 60% | TRANSIÇÃO |
| 2032 | 20% | 20% | 20% | 80% | 80% | TRANSIÇÃO |
| 2033 | 0% | 0% | 0% | 100% | 100% | COMPLETA |

---

## 🧮 MOTOR DE CÁLCULO TRIBUTÁRIO

### Função Principal: `calcularTributacaoItem()`

Calcula todos os impostos de um item considerando:
- **Sistema Antigo**: ICMS, PIS, COFINS, IPI
- **Sistema Novo**: IBS, CBS
- **Cronograma de Transição**: Aplica percentuais proporcionais

#### Exemplo de Uso (TypeScript)

```typescript
import { calculoTributarioService } from './calculoTributarioService'

const resultado = await calculoTributarioService.calcularTributacaoItem({
  ncm: '04021000', // Leite em pó
  valorUnitario: 100.00,
  quantidade: 10,
  valorTotal: 1000.00,
  cfop: '5102',
  ufOrigem: 'SP',
  ufDestino: 'RJ',
  tipoOperacao: 'SAIDA',
  finalidadeNota: '1',
  anoOperacao: 2026,
  regimeTributario: 'SIMPLES'
})

console.log('Sistema Antigo:')
console.log('ICMS:', resultado.sistemaAntigo.icms.valor)
console.log('PIS:', resultado.sistemaAntigo.pis.valor)
console.log('COFINS:', resultado.sistemaAntigo.cofins.valor)

console.log('Sistema Novo:')
console.log('IBS:', resultado.sistemaNovo.ibs.valor)
console.log('CBS:', resultado.sistemaNovo.cbs.valor)

console.log('Total:', resultado.totalTributos)
```

### Funções SQL Disponíveis

#### 1. **calcular_tributacao_completa()**
Calcula toda a tributação de um produto.

```sql
SELECT * FROM calcular_tributacao_completa(
  1000.00,      -- valor base
  '04021000',   -- NCM
  '5102',       -- CFOP
  'SP',         -- UF origem
  'RJ',         -- UF destino
  'SIMPLES',    -- Regime tributário
  2026          -- Ano
);
```

**Retorna:**
- Base de cálculo e valores de ICMS, PIS, COFINS
- Base de cálculo e valores de IBS, CBS
- Totais e percentuais de transição

#### 2. **buscar_aliquotas_reforma()**
Busca alíquotas de IBS/CBS por NCM.

```sql
SELECT * FROM buscar_aliquotas_reforma('04021000', '2026-01-01');
```

**Retorna:**
- Alíquota IBS aplicável
- Alíquota CBS aplicável
- Indicador de alíquota diferenciada
- Tipo de benefício (se houver)

#### 3. **simular_tributacao_transicao()**
Simula a carga tributária ao longo dos anos.

```sql
SELECT * FROM simular_tributacao_transicao(1000.00, '04021000');
```

**Retorna:** Tabela com valores de impostos de 2026 a 2033.

---

## 💻 SERVIÇOS (TypeScript)

### 1. `notasFiscaisService.ts`

#### **Emissão Avulsa**
```typescript
const resultado = await notasFiscaisService.emitirNotaAvulsa({
  modo_emissao: 'AVULSA',
  tipo_nota: 'NFE',
  serie: 1,
  natureza_operacao: 'VENDA DE MERCADORIA',
  cfop_predominante: '5102',
  finalidade: '1',
  empresa_id: 1,
  destinatario_cpf_cnpj: '12345678901234',
  destinatario_nome: 'Cliente Exemplo',
  itens: [
    {
      codigo_produto: 'PROD001',
      descricao: 'Produto Teste',
      ncm: '04021000',
      cfop: '5102',
      unidade_comercial: 'UN',
      quantidade_comercial: 10,
      valor_unitario_comercial: 100.00,
      origem_mercadoria: '0'
    }
  ]
})

if (resultado.sucesso) {
  console.log('Nota emitida:', resultado.nota_fiscal_id)
}
```

#### **Emissão via Venda**
```typescript
const resultado = await notasFiscaisService.emitirNotaDeVenda(
  123,    // ID da venda
  'NFE',  // Tipo de nota
  1       // Série
)
```

---

## 🎨 INTERFACE DO USUÁRIO

### Tela: `EmissaoNotasFiscais.tsx`

**Características:**
- ✅ Interface responsiva (mobile, tablet, desktop)
- ✅ Seguem o padrão de cores do sistema (#394353, #C9C4B5)
- ✅ Validação em tempo real
- ✅ Cálculo automático de totais
- ✅ Mensagens de sucesso/erro claras

**Modos de Emissão:**

1. **Emissão Avulsa**
   - Preencher dados do destinatário
   - Adicionar itens manualmente
   - Configurar valores adicionais (frete, desconto, etc.)

2. **Emissão via Venda**
   - Listar vendas pendentes de faturamento
   - Selecionar venda
   - Sistema busca automaticamente todos os dados

---

## 📝 REFORMA TRIBUTÁRIA 2026 - DETALHES

### O que é IBS e CBS?

#### **IBS - Imposto sobre Bens e Serviços**
- Substitui: ICMS e ISS
- Alíquota padrão: **27%**
- Característica: **Não-cumulativo** (crédito pleno sobre insumos)
- Arrecadação: **No destino**

#### **CBS - Contribuição sobre Bens e Serviços**
- Substitui: PIS e COFINS
- Alíquota padrão: **12%**
- Característica: **Não-cumulativo**
- Base ampla de incidência

### Exceções e Alíquotas Diferenciadas

| Categoria | IBS | CBS | Observação |
|-----------|-----|-----|------------|
| **Padrão** | 27% | 12% | Maioria dos produtos |
| **Cesta Básica** | 0% | 0% | Alíquota zero |
| **Medicamentos** | 16,2% | 7,2% | Redução de 60% |
| **Educação** | 0% | 0% | Livros e material didático |
| **Saúde** | 13,5% | 6% | Redução de 50% |

### Período de Transição

**2026-2027**: Fase de teste (1% e 10%)  
**2028-2032**: Transição gradual  
**2033**: Sistema novo completo (apenas IBS/CBS)

Durante a transição, **ambos os sistemas são calculados** com percentuais proporcionais.

---

## 🔧 INSTALAÇÃO E CONFIGURAÇÃO

### 1. Executar Migrations de Banco de Dados

```sql
-- 1. Aplicar ajustes fiscais básicos
\i database/AJUSTES_SISTEMA_FISCAL_COMPLETO.sql

-- 2. Aplicar reforma tributária 2026
\i database/reforma_tributaria_2026_ibs_cbs.sql

-- 3. Criar funções de cálculo
\i database/funcoes_calculo_tributario.sql
```

### 2. Configurar Empresa Emissora

```sql
UPDATE empresas 
SET 
  regime_tributario = 'SIMPLES',
  uf = 'SP',
  codigo_municipio = '3550308', -- São Paulo
  inscricao_estadual = '123456789',
  cnae = '4711302'
WHERE id = 1;
```

### 3. Inserir Alíquotas Diferenciadas (Exemplos)

```sql
INSERT INTO reforma_aliquotas_ncm (ncm, descricao_ncm, aliquota_ibs_reduzida, aliquota_cbs_reduzida, tipo_beneficio) VALUES
  ('04021000', 'Leite em pó', 0.0000, 0.0000, 'CESTA_BASICA'),
  ('30049099', 'Medicamentos', 0.1620, 0.0720, 'MEDICAMENTO'),
  ('49011000', 'Livros didáticos', 0.0000, 0.0000, 'EDUCACAO');
```

---

## 🚀 INTEGRAÇÃO FUTURA COM SEFAZ

### Fluxo Completo de Emissão

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Criar NF   │──────>│ Gerar XML   │──────>│ Assinar XML │
└─────────────┘       └─────────────┘       └─────────────┘
                                                    │
                                                    ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Receber    │<──────│  Aguardar   │<──────│ Enviar para │
│  Protocolo  │       │  Retorno    │       │   SEFAZ     │
└─────────────┘       └─────────────┘       └─────────────┘
```

### Endpoints SEFAZ (Homologação)

**NF-e Modelo 55:**
- Autorização: `https://hom.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx`
- Consulta: `https://hom.nfe.fazenda.sp.gov.br/ws/nfeconsulta4.asmx`
- Cancelamento: `https://hom.nfe.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx`

**NFC-e Modelo 65:**
- Autorização: `https://hom.nfce.fazenda.sp.gov.br/ws/nfceautorizacao4.asmx`

---

## 📊 RELATÓRIOS E CONSULTAS ÚTEIS

### 1. Notas Emitidas por Período
```sql
SELECT 
  tipo_nota,
  COUNT(*) as quantidade,
  SUM(valor_total) as total,
  SUM(valor_ibs + valor_cbs) as total_impostos_novos,
  SUM(valor_icms + valor_pis + valor_cofins) as total_impostos_antigos
FROM notas_fiscais
WHERE data_emissao BETWEEN '2026-01-01' AND '2026-12-31'
  AND status = 'AUTORIZADA'
GROUP BY tipo_nota;
```

### 2. Produtos com Maior IBS/CBS
```sql
SELECT 
  p.nome,
  p.ncm,
  p.aliquota_ibs,
  p.aliquota_cbs,
  COUNT(nfi.id) as vezes_vendido,
  SUM(nfi.valor_ibs + nfi.valor_cbs) as total_impostos_novos
FROM produtos p
JOIN notas_fiscais_itens nfi ON nfi.produto_id = p.id
GROUP BY p.id, p.nome, p.ncm, p.aliquota_ibs, p.aliquota_cbs
ORDER BY total_impostos_novos DESC
LIMIT 20;
```

### 3. Simulação de Carga Tributária
```sql
-- Comparar carga tributária em diferentes anos
SELECT * FROM simular_tributacao_transicao(1000.00, '04021000');
```

---

## 🧪 TESTES E VALIDAÇÃO

### Cenários de Teste

#### 1. **Emissão Avulsa - NF-e**
- ✅ Produto padrão (alíquota 27% IBS, 12% CBS)
- ✅ Produto cesta básica (alíquota 0%)
- ✅ Produto com múltiplos itens
- ✅ Validação de NCM inválido

#### 2. **Emissão via Venda**
- ✅ Venda com 1 item
- ✅ Venda com múltiplos itens
- ✅ Venda sem cliente (consumidor final)
- ✅ Venda com frete e desconto

#### 3. **Cálculo Tributário**
- ✅ Verificar percentuais de transição por ano
- ✅ Validar alíquotas diferenciadas por NCM
- ✅ Conferir base de cálculo

---

## 🔐 SEGURANÇA

### Validações Implementadas

1. **Campos Obrigatórios**
   - NCM (8 dígitos)
   - CFOP
   - CPF/CNPJ destinatário
   - Quantidade e valor unitário > 0

2. **Regras de Negócio**
   - Apenas vendas sem nota fiscal podem ser faturadas
   - Status da venda deve ser PEDIDO_FECHADO
   - Validação de regime tributário (CST x CSOSN)

3. **Row Level Security (RLS)**
   - Todas as tabelas possuem RLS habilitado
   - Apenas usuários autenticados podem acessar

---

## 📞 PRÓXIMOS PASSOS

### Funcionalidades Pendentes

1. **Integração SEFAZ**
   - [ ] Geração de XML no padrão NF-e 4.0
   - [ ] Assinatura digital (Certificado A1/A3)
   - [ ] Envio para autorização
   - [ ] Consulta de protocolo
   - [ ] Cancelamento e Carta de Correção

2. **Movimentação de Estoque**
   - [ ] Baixa automática no estoque ao emitir nota
   - [ ] Devolução de estoque ao cancelar

3. **Relatórios**
   - [ ] Dashboard de notas emitidas
   - [ ] Análise de carga tributária
   - [ ] Comparativo sistema antigo x novo

4. **Melhorias**
   - [ ] Busca de produtos por NCM
   - [ ] Histórico de alterações
   - [ ] Download de XML e DANFE
   - [ ] Envio automático por e-mail

---

## 📚 REFERÊNCIAS

- **Reforma Tributária**: Lei Complementar nº 192/2025 (fictícia para exemplo)
- **NF-e**: Manual de Orientação do Contribuinte v7.0
- **NCM**: Nomenclatura Comum do Mercosul (8 dígitos)
- **CFOP**: Código Fiscal de Operações e Prestações

---

## 👨‍💻 SUPORTE

Para dúvidas ou problemas:
1. Consultar esta documentação
2. Verificar logs do sistema
3. Executar queries de diagnóstico
4. Contatar contador para questões fiscais

---

**Desenvolvido com ❤️ por:** Sistema ERP Tech Solutions  
**Data:** 13/01/2026  
**Versão:** 1.0.0
