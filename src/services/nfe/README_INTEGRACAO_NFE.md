# Integração NF-e - Documentação Completa

## 📋 Estrutura Criada

```
src/services/nfe/
├── types.ts              # Definições TypeScript completas
├── xmlGenerator.ts       # Geração de XML formato SEFAZ
├── sefazClient.ts        # Comunicação com SEFAZ/APIs
├── nfeService.ts         # Serviço principal (orquestrador)
└── index.ts              # Exportações
```

## 🚀 Como Usar

### 1. Configurar API Intermediária (Focus NFe - Recomendado)

```typescript
import { criarServicoNFe } from './services/nfe'

const nfeService = criarServicoNFe({
  ambiente: 'HOMOLOGACAO', // ou 'PRODUCAO'
  api_intermediaria: {
    provider: 'FOCUS',
    token: 'SEU_TOKEN_FOCUS_NFE_AQUI',
    base_url: 'https://homologacao.focusnfe.com.br'
  },
  csc: {
    id: '1', // ID CSC da empresa
    codigo: 'SEU_CSC_AQUI' // Código CSC
  }
})
```

### 2. Emitir Nota Fiscal

```typescript
const resultado = await nfeService.emitir({
  numero: 1,
  serie: 1,
  tipo_nota: 'NFE',
  modelo: '55',
  ambiente: 'HOMOLOGACAO',
  finalidade: 'NORMAL',
  
  emitente: { /* dados da empresa */ },
  destinatario: { /* dados do cliente */ },
  itens: [ /* produtos */ ],
  totais: { /* valores */ }
})

if (resultado.sucesso) {
  console.log('✅ Nota autorizada!')
  console.log('Chave:', resultado.retorno.chave_acesso)
} else {
  console.log('❌ Erro:', resultado.retorno.mensagem)
}
```

### 3. Consultar Nota

```typescript
const status = await nfeService.consultar('CHAVE_DE_43_DIGITOS')
console.log('Status:', status.status)
```

### 4. Cancelar Nota

```typescript
const resultado = await nfeService.cancelar(
  notaId, 
  'Justificativa com no mínimo 15 caracteres'
)
```

## 🔧 Configuração Focus NFe

### Criar Conta

1. Acesse: https://focusnfe.com.br
2. Crie uma conta (tem teste grátis)
3. Vá em **Configurações > API**
4. Copie o **Token de Homologação**

### Ambiente de Homologação

- Token diferente de produção
- Testes ilimitados
- Mesmas validações da SEFAZ
- CPF/CNPJ de teste: Use os disponíveis no site da SEFAZ

### Custos (2026)

- **Plano Básico**: R$ 29/mês - até 50 notas
- **Plano Profissional**: R$ 99/mês - até 500 notas
- **Empresarial**: R$ 299/mês - até 5.000 notas

## 📦 Campos Obrigatórios

### Emitente
- CNPJ
- Razão Social
- Inscrição Estadual
- CRT (Código Regime Tributário)
- Endereço completo

### Destinatário
- CPF ou CNPJ
- Nome/Razão Social
- Indicador IE (CONTRIBUINTE, ISENTO, NAO_CONTRIBUINTE)
- Endereço completo

### Itens
- Código do Produto
- Descrição
- NCM (8 dígitos)
- CFOP
- Unidade
- Quantidade e Valor
- Impostos: ICMS, PIS, COFINS

### Totais
- Valor dos Produtos
- Base de Cálculo ICMS
- Valor ICMS
- Valor PIS e COFINS
- Valor Total

## 🔐 Segurança

### Certificado Digital (A1)

```typescript
const nfeService = criarServicoNFe({
  ambiente: 'PRODUCAO',
  certificado: {
    tipo: 'A1',
    arquivo: certificadoBuffer,
    senha: 'SENHA_DO_CERTIFICADO'
  }
})
```

**Importante:** 
- Certificado A1 (.pfx/.p12) deve ser válido
- Senha não é armazenada no banco
- Renovação anual obrigatória

### CSC (Código de Segurança do Contribuinte)

- Obrigatório para NFC-e
- Obtido no portal da SEFAZ do seu estado
- Armazenar de forma segura (variáveis de ambiente)

## 🌐 Comunicação Direta SEFAZ (Avançado)

Para comunicação direta sem API intermediária:

```typescript
const nfeService = criarServicoNFe({
  ambiente: 'HOMOLOGACAO',
  api_intermediaria: {
    provider: 'DIRETO'
  },
  certificado: {
    tipo: 'A1',
    arquivo: certificadoA1,
    senha: 'senha123'
  }
})
```

⚠️ **Requer implementação SOAP** (não incluído nesta versão)

## 📊 Status Possíveis

- `RASCUNHO`: Nota salva mas não enviada
- `PROCESSANDO`: Enviada, aguardando resposta SEFAZ
- `AUTORIZADA`: ✅ Aprovada pela SEFAZ
- `REJEITADA`: ❌ Rejeitada (corrigir e reenviar)
- `DENEGADA`: Denegada por irregularidade fiscal
- `CANCELADA`: Cancelada após autorização
- `INUTILIZADA`: Numeração inutilizada

## 🔄 Fluxo Completo

```
1. Usuário preenche formulário
2. Sistema valida dados
3. Gera XML formato SEFAZ
4. Envia para API intermediária (Focus)
5. Focus comunica com SEFAZ
6. Retorna chave de acesso + protocolo
7. Salva XML autorizado
8. Gera DANFE (PDF)
9. Envia email cliente
```

## 🐛 Tratamento de Erros

```typescript
try {
  const resultado = await nfeService.emitir(dados)
  
  if (resultado.retorno.status === 'REJEITADA') {
    resultado.retorno.erros?.forEach(erro => {
      console.log(`Erro ${erro.codigo}: ${erro.mensagem}`)
    })
  }
} catch (error) {
  console.error('Erro fatal:', error.message)
}
```

## 📝 Códigos de Erro Comuns

- **539**: CNPJ do destinatário não cadastrado na UF
- **204**: Duplicidade de NF-e
- **233**: IE do destinatário não cadastrada
- **780**: Certificado digital vencido
- **225**: Falha no schema XML

## 🔗 Links Úteis

- Focus NFe: https://focusnfe.com.br
- Manual NF-e 4.0: http://www.nfe.fazenda.gov.br
- Consulta NF-e: http://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx
- Tabela CFOP: https://www.confaz.fazenda.gov.br
- Tabela NCM: https://www.gov.br/receitafederal/pt-br

## 📞 Próximos Passos

1. ✅ Estrutura de integração criada
2. ⏳ Testar com Focus NFe em homologação
3. ⏳ Gerar DANFE (PDF)
4. ⏳ Envio automático de email
5. ⏳ Integração com estoque
6. ⏳ Relatórios fiscais

---

**Criado em:** 26/01/2026  
**Versão:** 1.0.0  
**Sistema:** CRESCI E PERDI - Gestão Empresarial
