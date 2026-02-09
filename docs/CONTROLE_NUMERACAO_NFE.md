# 🔢 CONTROLE DE NUMERAÇÃO DE NOTAS FISCAIS

**Data:** 15/01/2026  
**Status:** ✅ Implementado

---

## 📋 Melhorias Implementadas

### 1. ✅ **Exibição do Número da Nota na Tela de Emissão**

Adicionado um **destaque visual** no canto superior direito da tela de emissão mostrando:
- Próximo número da nota fiscal
- Tipo de nota (NFE/NFCE)
- Série

**Características:**
- **Atualização automática:** Número é atualizado sempre que empresa, tipo de nota ou série são alterados
- **Design destacado:** Card com cor #394353 (padrão do sistema)
- **Formatação profissional:** Número exibido com 6 dígitos (ex: 000001)
- **Indicador de carregamento:** Spinner enquanto busca o próximo número

**Localização:** [EmitirNotaFiscal.tsx](src/features/notas-fiscais/EmitirNotaFiscal.tsx#L614-L648)

---

### 2. ✅ **Controle de Numeração Automática/Manual**

Implementado controle completo de numeração na tela de **Parâmetros Fiscais > Numeração**.

#### 🎛️ Toggle Automático/Manual

**Modo Automático (Padrão):**
- ✅ Sistema incrementa o número automaticamente
- ✅ Campo "Último Número Emitido" fica desabilitado
- ✅ Segurança: Previne alterações acidentais
- ✅ Recomendado para operação normal

**Modo Manual:**
- ✅ Permite editar o último número emitido
- ✅ Útil para migração de outros sistemas
- ✅ Correção de sequência em caso de problemas
- ✅ Alerta visual de atenção quando ativado

#### 📊 Funcionalidades por Tipo de Nota

**NF-e (Modelo 55):**
- Série configurável (1-999)
- Toggle automático/manual independente
- Campo "Último Número Emitido"
- Exibição do próximo número

**NFC-e (Modelo 65):**
- Série configurável (1-999)
- Toggle automático/manual independente
- Campo "Último Número Emitido"
- Exibição do próximo número

**Localização:** [ParametrosFiscais.tsx](src/features/notas-fiscais/ParametrosFiscais.tsx#L467-L649)

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `notas_fiscais_numeracao`

```sql
CREATE TABLE notas_fiscais_numeracao (
    id BIGSERIAL PRIMARY KEY,
    tipo_nota VARCHAR(10) NOT NULL,      -- 'NFE' ou 'NFCE'
    serie INTEGER NOT NULL,
    ultimo_numero INTEGER NOT NULL DEFAULT 0,
    ambiente VARCHAR(15) NOT NULL,       -- 'PRODUCAO' ou 'HOMOLOGACAO'
    ativo BOOLEAN DEFAULT true,          -- TRUE = automático, FALSE = manual
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tipo_nota, serie, ambiente)
);
```

### Campos Importantes:

- **ultimo_numero:** Último número emitido (próximo será +1)
- **ativo:** Controla se a numeração é automática (true) ou manual (false)
- **ambiente:** Separa numeração de homologação e produção

---

## 🔄 Fluxo de Funcionamento

### Modo Automático (ativo = true)

```mermaid
graph LR
    A[Usuário clica Emitir] --> B[Sistema busca último_numero]
    B --> C[Incrementa +1]
    C --> D[Reserva número]
    D --> E[Salva nota com número]
    E --> F[Atualiza ultimo_numero na tabela]
```

### Modo Manual (ativo = false)

```mermaid
graph LR
    A[Admin altera último_numero] --> B[Clica Salvar]
    B --> C[Atualiza tabela]
    C --> D[Próxima nota usará novo número + 1]
```

---

## 🎨 Interface do Usuário

### 1. Tela de Emissão

```
┌─────────────────────────────────────────────────────┐
│  Emitir Nota Fiscal                     ╔═══════════╗
│  Emissão de NF-e e NFC-e                ║  000042   ║
│                                          ║  NFE      ║
│  [ Etapas de emissão... ]               ║  Série 1  ║
│                                          ╚═══════════╝
└─────────────────────────────────────────────────────┘
```

### 2. Tela de Parâmetros (Modo Automático)

```
┌────────────────────────────────────────┐
│ NF-e (Modelo 55)                       │
│                                        │
│ Série NF-e: [1]                        │
│                                        │
│ Controle de Numeração                  │
│ [●─────] Automático                    │
│ Sistema incrementa automaticamente     │
│                                        │
│ Último Número Emitido: [42] 🔒         │
│ Próximo número: 43                     │
└────────────────────────────────────────┘
```

### 3. Tela de Parâmetros (Modo Manual)

```
┌────────────────────────────────────────┐
│ NF-e (Modelo 55)                       │
│                                        │
│ Série NF-e: [1]                        │
│                                        │
│ Controle de Numeração                  │
│ [─────●] Manual                        │
│ Permite alterar manualmente            │
│                                        │
│ Último Número Emitido: [150] ✏️         │
│ Próximo número: 151                    │
│                                        │
│ ⚠️ ATENÇÃO: Altere apenas se necessário│
│    Números duplicados causam rejeição  │
└────────────────────────────────────────┘
```

---

## 💡 Casos de Uso

### Caso 1: Operação Normal
**Situação:** Empresa emitindo notas regularmente  
**Configuração:** Modo Automático ativado  
**Resultado:** Sistema gerencia numeração automaticamente

### Caso 2: Migração de Sistema
**Situação:** Empresa migrando de outro sistema, última nota foi 5.432  
**Ação:**
1. Acessar Parâmetros Fiscais > Numeração
2. Desativar modo automático (toggle para Manual)
3. Alterar "Último Número Emitido" para 5432
4. Salvar
5. Próxima nota será 5433

### Caso 3: Correção de Sequência
**Situação:** Houve erro e é necessário voltar a numeração  
**Ação:**
1. Desativar modo automático
2. Ajustar último número para valor desejado
3. Salvar
4. Emitir nota com novo número
5. Reativar modo automático

---

## ⚠️ Alertas e Validações

### Alertas Visuais

**Modo Manual Ativado:**
```
⚠️ ATENÇÃO: Altere este número apenas se necessário. 
   Números duplicados podem causar rejeição pela SEFAZ.
```

### Validações Implementadas

✅ Não permite números negativos  
✅ Próximo número sempre é último + 1  
✅ Não permite série menor que 1 ou maior que 999  
✅ Confirma salvamento com toast de sucesso  

---

## 📊 Consultas SQL Úteis

### Ver configuração atual de numeração
```sql
SELECT 
  tipo_nota,
  serie,
  ultimo_numero,
  ultimo_numero + 1 as proximo_numero,
  CASE WHEN ativo THEN 'Automático' ELSE 'Manual' END as modo,
  ambiente,
  updated_at
FROM notas_fiscais_numeracao
ORDER BY tipo_nota, serie;
```

### Alterar modo para automático
```sql
UPDATE notas_fiscais_numeracao
SET ativo = true,
    updated_at = NOW()
WHERE tipo_nota = 'NFE' AND serie = 1 AND ambiente = 'HOMOLOGACAO';
```

### Ajustar último número manualmente (CUIDADO!)
```sql
UPDATE notas_fiscais_numeracao
SET ultimo_numero = 1000,
    updated_at = NOW()
WHERE tipo_nota = 'NFE' AND serie = 1 AND ambiente = 'HOMOLOGACAO';
```

### Verificar últimas notas emitidas
```sql
SELECT 
  tipo_nota,
  numero,
  serie,
  data_emissao,
  status
FROM notas_fiscais
WHERE tipo_nota = 'NFE' AND serie = 1
ORDER BY numero DESC
LIMIT 10;
```

---

## 🔧 Funções do Sistema

### `carregarProximoNumero()`
**Responsabilidade:** Buscar próximo número disponível para emissão  
**Quando executa:** 
- Ao selecionar empresa
- Ao mudar tipo de nota
- Ao mudar série

**Lógica:**
1. Consulta tabela `notas_fiscais_numeracao`
2. Se não existir registro, busca última nota emitida
3. Retorna último_numero + 1
4. Exibe no card da tela de emissão

### `salvarNumeracao()`
**Responsabilidade:** Salvar configurações de numeração  
**Executa:**
- Atualiza `ultimo_numero` para NFe
- Atualiza `ultimo_numero` para NFCe
- Atualiza campo `ativo` (automático/manual)
- Registra timestamp de atualização
- Exibe toast de confirmação

---

## 🎯 Boas Práticas

### ✅ Recomendado

- Manter modo **Automático** ativado em operação normal
- Fazer backup antes de alterar numeração manualmente
- Documentar motivo de alterações manuais
- Reativar modo automático após ajustes

### ❌ Não Recomendado

- Alterar números sem necessidade
- Voltar numeração para número já emitido
- Deixar modo manual ativado permanentemente
- Pular números sem justificativa fiscal

---

## 📝 Changelog

### v1.1.0 - 15/01/2026
- ✅ Adicionada exibição de número na tela de emissão
- ✅ Implementado toggle automático/manual
- ✅ Permitida edição manual do último número
- ✅ Adicionados alertas de segurança
- ✅ Seguido padrão de cores do sistema (#394353)
- ✅ Implementado feedback visual com toast

---

## 🚀 Próximos Passos (Futuro)

- [ ] Histórico de alterações de numeração
- [ ] Log de audit para mudanças manuais
- [ ] Validação anti-duplicação no backend
- [ ] Suporte para múltiplas séries por tipo
- [ ] Inutilização de faixas de numeração
- [ ] Relatório de sequência de notas

---

## 📞 Suporte

Em caso de dúvidas:
1. Consultar este documento
2. Verificar logs no console (F12)
3. Consultar tabela `notas_fiscais_numeracao`
4. Revisar arquivos:
   - [EmitirNotaFiscal.tsx](src/features/notas-fiscais/EmitirNotaFiscal.tsx)
   - [ParametrosFiscais.tsx](src/features/notas-fiscais/ParametrosFiscais.tsx)
