# 📚 MANUAL TÉCNICO - SISTEMA FISCAL V2.0

## 🎯 ARQUITETURA DO SISTEMA FISCAL

### Módulos Principais

```
src/features/notas-fiscais/
├── EmitirNotaFiscal.tsx          # Interface de emissão
├── RegrasTributacao.tsx           # Gerenciamento de regras
├── ParametrosFiscais.tsx          # Configurações fiscais
├── fiscalEngine.ts                # Motor de cálculo tributário ⭐
├── notasFiscaisService.ts         # Comunicação com API
├── regrasTributacaoService.ts     # CRUD de regras
└── types.ts                       # Interfaces TypeScript
```

---

## 🔧 MOTOR FISCAL (fiscalEngine.ts)

### Funções Principais

#### 1. `validarDocumentoFiscal()`

Valida documento antes do cálculo de tributos.

```typescript
const validacao = await validarDocumentoFiscal(
  'NFE',           // Tipo: NFE, NFCE ou NFSE
  'SIMPLES',       // Regime: SIMPLES, PRESUMIDO ou REAL
  itens            // Array de itens
)

// Retorna:
{
  valido: boolean,
  erros: Array<{
    codigo: string,
    mensagem: string,
    bloqueante: boolean
  }>
}
```

**Validações Implementadas:**

- ✅ NCM obrigatório para NF-e/NFC-e (8 dígitos)
- ✅ CFOP obrigatório para NF-e/NFC-e
- ✅ ISS obrigatório para NFS-e
- ✅ Item da Lista LC 116/2003 para NFS-e
- ✅ Incompatibilidade ISS em produtos
- ✅ Incompatibilidade ICMS em serviços
- ✅ CST/CSOSN conforme regime tributário

#### 2. `aplicarMotorFiscalNoItem()`

Calcula tributos para um item individual.

```typescript
const tributos = await aplicarMotorFiscalNoItem(
  item,      // Dados do item
  contexto   // Contexto fiscal
)

// Retorna: TributosCalculados
{
  origem_mercadoria: string,
  cst_icms?: string,
  csosn_icms?: string,
  base_calculo_icms: number,
  aliquota_icms: number,
  valor_icms: number,
  // ... demais tributos
  mensagens_fiscais: string[]
}
```

**Cálculos Implementados:**

**Para NF-e/NFC-e:**
- ICMS (BC, alíquota, valor)
- ICMS-ST (MVA, BC ST, valor ST)
- IPI (BC, alíquota, valor)
- PIS (BC, alíquota, valor)
- COFINS (BC, alíquota, valor)

**Para NFS-e:**
- ISS (BC, alíquota, valor, retenção)
- PIS (BC, alíquota, valor)
- COFINS (BC, alíquota, valor)
- IR (alíquota, valor)
- CSLL (alíquota, valor)
- INSS (alíquota, valor)

#### 3. `processarNotaFiscalCompleta()`

Processa todos os itens da nota e retorna totalizadores.

```typescript
const resultado = await processarNotaFiscalCompleta(
  itens,     // Array de itens
  contexto   // Contexto fiscal
)

// Retorna:
{
  itensTributados: Array<Item & Tributos>,
  totais: {
    valor_produtos: number,
    valor_desconto: number,
    valor_frete: number,
    valor_total: number,
    base_calculo_icms: number,
    valor_icms: number,
    valor_icms_st: number,
    valor_ipi: number,
    valor_pis: number,
    valor_cofins: number,
    valor_iss?: number,
    valor_ir?: number,
    valor_csll?: number,
    valor_inss?: number
  },
  mensagens_fiscais: string[],
  validacao: ResultadoValidacao
}
```

---

## 🗄️ ESTRUTURA DE BANCO DE DADOS

### Tabela: `empresas`

Novos campos adicionados:

```sql
regime_tributario VARCHAR(20)     -- SIMPLES, PRESUMIDO, REAL
indicador_ie INTEGER               -- 1=Contribuinte, 2=Isento, 9=Não Contribuinte
inscricao_estadual VARCHAR(20)
inscricao_municipal VARCHAR(20)
codigo_regime_tributario VARCHAR(1) -- 1=Simples, 2=Excesso, 3=Normal
cnae VARCHAR(10)
uf VARCHAR(2)
codigo_municipio VARCHAR(7)
```

### Tabela: `regras_tributacao`

Novos campos adicionados:

```sql
-- Identificação do tipo de documento
tipo_documento VARCHAR(10)         -- NFE, NFCE, NFSE

-- Localização
uf_origem VARCHAR(2)
uf_destino VARCHAR(2)

-- Prioridade
prioridade INTEGER                 -- Calculada automaticamente

-- ISS (para NFS-e)
aliquota_iss NUMERIC(5,4)
retencao_iss BOOLEAN
municipio_incidencia_iss VARCHAR(7)
codigo_servico_municipal VARCHAR(20)
item_lista_servico_lc116 VARCHAR(10)
codigo_tributacao_municipio_iss VARCHAR(20)
mensagem_nf_iss TEXT
exigibilidade_iss INTEGER
processo_suspensao_iss VARCHAR(30)
```

### Tabela: `mensagens_fiscais` (NOVA)

Mensagens automáticas por regra:

```sql
CREATE TABLE mensagens_fiscais (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo_documento VARCHAR(10) NOT NULL,  -- NFE, NFCE, NFSE
  mensagem TEXT NOT NULL,
  permite_variaveis BOOLEAN DEFAULT TRUE,
  ativo BOOLEAN DEFAULT TRUE,
  
  -- Condições de aplicação
  cfop VARCHAR(5),
  cst_icms VARCHAR(3),
  csosn_icms VARCHAR(5),
  ncm VARCHAR(8),
  uf_destino VARCHAR(2)
)
```

**Variáveis suportadas:**
- `{{cfop}}`
- `{{cst}}`
- `{{csosn}}`
- `{{aliquota_icms}}`
- `{{base_calculo}}`
- `{{fundamento_legal}}`
- `{{valor_tributos}}`
- `{{percentual_tributos}}`

### Tabela: `validacoes_fiscais` (NOVA)

Validações obrigatórias:

```sql
CREATE TABLE validacoes_fiscais (
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo_documento VARCHAR(10) NOT NULL,
  campo_validado VARCHAR(100) NOT NULL,
  regra_validacao TEXT NOT NULL,
  mensagem_erro TEXT NOT NULL,
  bloqueante BOOLEAN DEFAULT TRUE,
  ativo BOOLEAN DEFAULT TRUE
)
```

---

## ⚙️ FUNÇÕES SQL IMPORTANTES

### 1. `calcular_prioridade_regra()`

Calcula automaticamente a prioridade de uma regra.

```sql
SELECT calcular_prioridade_regra(regra) FROM regras_tributacao;
```

**Sistema de pontuação:**
- Tipo documento: +100
- NCM (8 dígitos): +1000
- CEST (7 dígitos): +800
- UF Origem: +500
- UF Destino: +500
- CFOP Saída: +300
- CFOP Entrada: +300
- Operação Fiscal: +200
- Categoria: +50
- Origem Mercadoria: +10

### 2. `buscar_regra_tributacao()`

Busca a regra mais específica.

```sql
SELECT * FROM buscar_regra_tributacao(
  p_empresa_id := 1,
  p_tipo_documento := 'NFE',
  p_ncm := '22030000',
  p_cfop := '5102',
  p_uf_origem := 'SP',
  p_uf_destino := 'SP'
);
```

### 3. `validar_nota_fiscal()`

Valida dados antes da emissão.

```sql
SELECT * FROM validar_nota_fiscal(
  p_tipo_documento := 'NFE',
  p_regime_tributario := 'SIMPLES',
  p_dados_nota := '{
    "ncm": "22030000",
    "cfop": "5102",
    "csosn_icms": "102"
  }'::JSONB
);
```

---

## 🔄 FLUXO DE PROCESSAMENTO

### 1. Usuário Adiciona Item

```typescript
// EmitirNotaFiscal.tsx
const adicionarItem = () => {
  setFormData(prev => ({
    ...prev,
    itens: [...prev.itens, itemAtual]
  }))
}
```

### 2. Sistema Valida Item

```typescript
// fiscalEngine.ts
const validacao = await validarDocumentoFiscal(
  tipoDocumento,
  regimeEmitente,
  [itemAtual]
)

if (!validacao.valido) {
  // Exibir erros
  return
}
```

### 3. Motor Fiscal Calcula Tributos

```typescript
// fiscalEngine.ts

// 1. Busca regra mais específica
const regra = await buscarRegraTributacao(item, contexto)

// 2. Calcula valores base
const valor_total = quantidade * valor_unitario - desconto

// 3. Aplica tributos conforme tipo de documento
if (tipoDocumento === 'NFE') {
  // ICMS, IPI, PIS, COFINS
} else if (tipoDocumento === 'NFSE') {
  // ISS, IR, CSLL, INSS, PIS, COFINS
}

// 4. Retorna tributos calculados
return tributosCalculados
```

### 4. Sistema Totaliza Nota

```typescript
// fiscalEngine.ts
const resultado = await processarNotaFiscalCompleta(itens, contexto)

// Totais calculados automaticamente:
// - Soma de todos os itens
// - Soma de todos os impostos
// - Mensagens fiscais consolidadas
```

### 5. Validação Final

```typescript
// Antes de emitir
if (!resultado.validacao.valido) {
  const errosBloqueantes = resultado.validacao.erros
    .filter(e => e.bloqueante)
  
  if (errosBloqueantes.length > 0) {
    // Impedir emissão
    return
  }
}
```

### 6. Geração do XML

```typescript
// notasFiscaisService.ts
const xml = await gerarXML({
  empresa,
  destinatario,
  itens: resultado.itensTributados,
  totais: resultado.totais,
  mensagens: resultado.mensagens_fiscais
})
```

### 7. Envio para SEFAZ

```typescript
// notasFiscaisService.ts
const resposta = await enviarParaSEFAZ(xml, ambiente)

if (resposta.status === 'Autorizada') {
  // Armazenar protocolo, chave de acesso, XML autorizado
  // Gerar DANFE
}
```

---

## 🧪 TESTES UNITÁRIOS

### Teste de Validação

```typescript
// __tests__/fiscalEngine.test.ts

describe('validarDocumentoFiscal', () => {
  it('deve exigir NCM para NF-e', async () => {
    const itens = [{
      descricao: 'Produto sem NCM',
      ncm: '',  // INVÁLIDO
      quantidade: 1,
      valor: 100
    }]
    
    const validacao = await validarDocumentoFiscal('NFE', 'SIMPLES', itens)
    
    expect(validacao.valido).toBe(false)
    expect(validacao.erros[0].codigo).toBe('NFE_NCM_OBRIGATORIO')
  })
  
  it('deve exigir ISS para NFS-e', async () => {
    const itens = [{
      descricao: 'Serviço sem ISS',
      aliquota_iss: 0,  // INVÁLIDO
      quantidade: 1,
      valor: 100
    }]
    
    const validacao = await validarDocumentoFiscal('NFSE', 'SIMPLES', itens)
    
    expect(validacao.valido).toBe(false)
    expect(validacao.erros[0].codigo).toBe('NFSE_ISS_OBRIGATORIO')
  })
})
```

### Teste de Cálculo ICMS

```typescript
describe('aplicarMotorFiscalNoItem', () => {
  it('deve calcular ICMS corretamente', async () => {
    const item = {
      ncm: '22030000',
      quantidade_comercial: 10,
      valor_unitario_comercial: 10.00
    }
    
    const contexto = {
      empresaId: 1,
      tipoDocumento: 'NFE',
      ufOrigem: 'SP',
      ufDestino: 'SP',
      regimeEmitente: 'REAL'
    }
    
    const tributos = await aplicarMotorFiscalNoItem(item, contexto)
    
    expect(tributos.base_calculo_icms).toBe(100.00)
    expect(tributos.aliquota_icms).toBe(18.00)
    expect(tributos.valor_icms).toBe(18.00)
  })
})
```

---

## 📊 MONITORAMENTO E LOG

### Eventos Importantes a Logar

```typescript
// Logger fiscal
console.log('[FISCAL] Tipo Documento:', tipoDocumento)
console.log('[FISCAL] Regime Tributário:', regimeEmitente)
console.log('[FISCAL] Regra Aplicada:', regra?.nome)
console.log('[FISCAL] Tributos Calculados:', tributos)
console.log('[FISCAL] Validação:', validacao.valido)
```

### Métricas Sugeridas

- Tempo de cálculo de tributos
- Taxa de rejeição SEFAZ
- Regras mais utilizadas
- Erros de validação mais frequentes

---

## 🚨 ERROS COMUNS E SOLUÇÕES

### Erro: "Regra não encontrada"

**Causa:** Nenhuma regra compatível com os critérios.

**Solução:** Criar regra genérica por tipo de documento.

```sql
INSERT INTO regras_tributacao (
  empresa_id,
  nome,
  tipo_documento,
  ativo
) VALUES (
  1,
  'Regra Genérica NF-e',
  'NFE',
  TRUE
);
```

### Erro: "CSOSN incompatível"

**Causa:** Empresa Simples Nacional usando CST ao invés de CSOSN.

**Solução:** Verificar `regime_tributario` da empresa e ajustar regra.

### Erro: "NCM inválido"

**Causa:** NCM não tem 8 dígitos.

**Solução:** Completar NCM com zeros à direita se necessário.

---

## 🔐 SEGURANÇA

### Validação de Dados

- ✅ Todos os valores numéricos são validados
- ✅ CPF/CNPJ validados antes da emissão
- ✅ Certificado Digital verificado
- ✅ Ambiente (produção/homologação) claramente identificado

### Auditoria

Todas as tabelas fiscais possuem:
- `created_at`: Data de criação
- `updated_at`: Data de atualização
- `created_by`: Usuário que criou
- `updated_by`: Usuário que atualizou

---

## 📞 SUPORTE TÉCNICO

**Logs de Erro:**
```
src/features/notas-fiscais/logs/
```

**Documentação API:**
```
docs/API_NOTAS_FISCAIS.md
```

**Contato Técnico:**
- Sistema: Documentação interna
- Legislação: Consultar contador

---

**Versão:** 2.0
**Data:** Janeiro 2026
**Status:** ✅ Pronto para produção
