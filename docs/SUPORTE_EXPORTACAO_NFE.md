# Suporte a Notas Fiscais de Exportação (CFOP 7xxx)

**Data:** 10/02/2026  
**Status:** ✅ Implementado

## 📋 Resumo

Sistema agora suporta emissão de NF-e de exportação (CFOP 7102, 7101, etc.) com detecção automática de destino da operação (idDest).

## 🎯 O que foi implementado

### 1. **Banco de Dados** ✅

#### Tabela `paises`
Nova tabela com países conforme código Bacen:
```sql
- id
- codigo_bacen (ex: 1058=Brasil, 0132=Argentina)
- codigo_iso2 (ex: BR, US)
- codigo_iso3 (ex: BRA, USA)
- nome
- nome_completo
```

21 países principais já cadastrados (América do Sul, América do Norte, Europa, Ásia).

#### Campos em `operacoes_fiscais`
```sql
- eh_exportacao BOOLEAN
- tipo_comercio_exterior VARCHAR(1)  -- 1=Venda direta, 2=Intermediada, 3=Outras
```

#### Campos em `notas_fiscais`
```sql
- eh_exportacao BOOLEAN
- uf_embarque VARCHAR(2)
- local_embarque VARCHAR(60)
- local_despacho VARCHAR(60)
- tipo_comercio_exterior VARCHAR(1)
- destinatario_pais_id BIGINT
- destinatario_pais_codigo VARCHAR(5)
- destinatario_pais_nome VARCHAR(100)
```

### 2. **TypeScript - Tipos** ✅

#### `src/services/nfe/types.ts`
```typescript
interface NotaFiscalDados {
  // ... campos existentes ...
  
  destinatario: {
    // ... campos existentes ...
    pais_codigo?: string  // Código Bacen
    pais_nome?: string
  }
  
  exportacao?: {
    uf_embarque: string
    local_embarque: string
    local_despacho?: string
    tipo_operacao: '1' | '2' | '3'
  }
}
```

#### `src/features/notas-fiscais/types.ts`
Campos de exportação adicionados em:
- `NotaFiscal`
- `NotaFiscalFormData`

#### `src/features/cadastros-fiscais/types.ts`
```typescript
interface OperacaoFiscal {
  eh_exportacao?: boolean
  tipo_comercio_exterior?: '1' | '2' | '3'
}
```

### 3. **Lógica de Negócio - Adapter Nuvem Fiscal** ✅

#### Detecção automática de `idDest`
```typescript
private calcularIdDest(dados: NotaFiscalDados): number {
  // 3 = Exterior (país diferente de Brasil)
  // 2 = Interestadual
  // 1 = Interna (mesma UF)
}
```

#### Montagem do destinatário
```typescript
private montarDestinatario(dados: NotaFiscalDados): any {
  // Se exterior:
  //   - idEstrangeiro
  //   - cMun = 9999999
  //   - UF = EX
  //   - CEP = 00000000
  //   - cPais + xPais
  // Se nacional:
  //   - CPF/CNPJ
  //   - Endereço completo
}
```

#### Grupo de exportação no XML
```typescript
{
  exporta: {
    UFSaidaPais: dados.exportacao.uf_embarque,
    xLocExporta: dados.exportacao.local_embarque,
    xLocDespacho: dados.exportacao.local_despacho
  }
}
```

## 🔧 Como usar

### 1. **No banco de dados**
```sql
-- Rodar migration
\i database/adicionar_suporte_exportacao_nfe.sql
```

### 2. **Cadastrar operação fiscal de exportação**

No menu **Parâmetros Fiscais → Operações Fiscais**:

```
Código: VENDA-EXP
Nome: Venda para Exportação
CFOP Exterior: 7102
Tipo Operação: VENDA
Finalidade: NORMAL
Natureza: VENDA PARA EXPORTACAO
✅ É Exportação: SIM
Tipo Comércio Exterior: 1 (Venda direta)
```

### 3. **Emitir NF-e de exportação**

No formulário de emissão:

#### Destinatário:
```
Tipo: ESTRANGEIRO
País: Selecionar da lista (ex: Argentina)
Nome/Razão: EMPRESA IMPORTADORA LTDA
Endereço: Pode ser exterior
CEP: 00000000 (aceito)
```

#### Dados de Exportação:
```
UF Embarque: SP (porto de Santos)
Local Embarque: PORTO DE SANTOS
Local Despacho: (opcional)
```

O sistema detecta automaticamente:
- `idDest = 3` (exterior)
- Não exige IE do destinatário
- Aceita CEP genérico
- Código município = 9999999 (exterior)

## 📊 Diferenças entre CFOP 5102 vs 7102

| Campo | CFOP 5102 (Interna) | CFOP 7102 (Exportação) |
|-------|---------------------|------------------------|
| `idDest` | 1 (operação interna) | 3 (exterior) |
| `dest.CNPJ/CPF` | Obrigatório | `idEstrangeiro` |
| `dest.enderDest.cMun` | Código IBGE | 9999999 |
| `dest.enderDest.UF` | UF brasileira | EX |
| `dest.enderDest.CEP` | CEP válido | 00000000 |
| `dest.enderDest.cPais` | 1058 (Brasil) | Código Bacen |
| `dest.IE` | Obrigatório se contribuinte | Não exigido |
| Grupo `exporta` | Não | **Obrigatório** |
| `exporta.UFSaidaPais` | - | UF de embarque |
| `exporta.xLocExporta` | - | Local embarque |

## ✅ Validações implementadas

1. **Detecção automática de exportação**:
   - Se `pais_codigo != '1058'` → `idDest = 3`

2. **Campos obrigatórios para exportação**:
   - `uf_embarque`
   - `local_embarque`
   - `pais_codigo`
   - `pais_nome`

3. **Campos não exigidos para exterior**:
   - `inscricao_estadual`
   - CEP pode ser `00000000`
   - Código município pode ser `9999999`

## 📁 Arquivos modificados

### Banco de Dados
- `database/adicionar_suporte_exportacao_nfe.sql` (NOVO)

### TypeScript - Tipos
- `src/services/nfe/types.ts`
- `src/features/notas-fiscais/types.ts`
- `src/features/cadastros-fiscais/types.ts`

### Lógica de Negócio
- `src/services/nfe/nuvemFiscalAdapter.ts`
  - Método `calcularIdDest()`
  - Método `montarDestinatario()`
  - Grupo `exporta` no XML

## 🧪 Próximos passos

### Interface Frontend (ainda não implementado)
- [ ] Adicionar campo "País" no formulário de emissão
- [ ] Adicionar seção "Dados de Exportação" no formulário
- [ ] Campos: UF Embarque, Local Embarque, Local Despacho
- [ ] Mostrar/ocultar campos de exportação automaticamente
- [ ] Validação: Se CFOP 7xxx → campos de exportação obrigatórios

### Testes
- [ ] Testar emissão em homologação com CFOP 7102
- [ ] Validar XML gerado pela Nuvem Fiscal
- [ ] Verificar autorização SEFAZ para exportação
- [ ] Testar com diferentes países

## 📚 Referências

- **Layout NF-e 4.0**: Campo `ide.idDest` = 3 para exportação
- **Grupo exporta**: Obrigatório quando `idDest = 3`
- **Tabela Bacen**: Códigos de países
- **CFOP**: Série 7000 = Exportação

## 🎯 Status Final

| Componente | Status |
|------------|--------|
| Banco de dados | ✅ Pronto |
| Tipos TypeScript | ✅ Pronto |
| Lógica Adapter | ✅ Pronto |
| Formulário Frontend | ⏳ Pendente |
| Testes | ⏳ Pendente |

**Sistema preparado para backend, falta implementar interface de usuário.**
