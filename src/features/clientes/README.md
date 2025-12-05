# Módulo de Clientes - Sistema ERP

## 📋 Visão Geral

Módulo completo para cadastro e gerenciamento de clientes (Pessoa Física e Jurídica) com suporte a:
- ✅ Cadastro de Pessoa Física e Pessoa Jurídica
- ✅ Dados fiscais completos (NFe, tributação, etc.)
- ✅ Dados financeiros (limites de crédito, condições de pagamento)
- ✅ Múltiplos endereços por cliente
- ✅ Múltiplos contatos (telefone, e-mail, WhatsApp)
- ✅ Histórico completo de atividades
- ✅ Validações CPF/CNPJ
- ✅ Consulta automática de CEP (ViaCEP)
- ✅ Consulta automática de CNPJ (ReceitaWS)
- ✅ Bloqueio de crédito
- ✅ Auditoria completa

## 📁 Estrutura de Arquivos

```
src/features/clientes/
├── types.ts                      # Tipos TypeScript (420 linhas)
├── utils.ts                      # Validações e utilitários (580 linhas)
├── services.ts                   # Integração Supabase (580 linhas)
├── CadastroClientes.tsx          # Componente principal de cadastro
├── ListagemClientes.tsx          # Listagem e filtros
├── index.ts                      # Exportações do módulo
└── components/
    ├── DadosPessoaFisica.tsx     # Formulário PF
    ├── DadosPessoaJuridica.tsx   # Formulário PJ
    ├── DadosFiscais.tsx          # Dados fiscais
    ├── DadosFinanceiros.tsx      # Dados financeiros
    ├── GerenciadorEnderecos.tsx  # CRUD de endereços
    ├── GerenciadorContatos.tsx   # CRUD de contatos
    └── HistoricoCliente.tsx      # Visualização de histórico
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

1. **clientes** - Dados principais do cliente
2. **clientes_enderecos** - Endereços do cliente
3. **clientes_contatos** - Contatos do cliente
4. **clientes_historico** - Histórico de alterações
5. **condicoes_pagamento** - Condições de pagamento
6. **tabelas_preco** - Tabelas de preço

### ENUMs

- `tipo_pessoa`: FISICA, JURIDICA
- `tipo_endereco`: COMERCIAL, RESIDENCIAL, COBRANCA, ENTREGA, OUTROS
- `tipo_contato`: TELEFONE, CELULAR, WHATSAPP, EMAIL, SKYPE, OUTROS
- `regime_tributario`: SIMPLES, PRESUMIDO, REAL, MEI
- `contribuinte_icms`: CONTRIBUINTE, NAO_CONTRIBUINTE, ISENTO
- `status_cliente`: ATIVO, INATIVO, BLOQUEADO
- `tipo_bloqueio`: CREDITO, INADIMPLENCIA, DUPLICATAS, OUTROS

## 🔧 Funcionalidades

### Cadastro de Pessoa Física
- Nome completo
- CPF (com validação)
- RG
- Data de nascimento
- Sexo
- Estado civil
- Observações

### Cadastro de Pessoa Jurídica
- Razão social
- Nome fantasia
- CNPJ (com validação e consulta Receita Federal)
- Inscrição Estadual / Municipal
- CNAE Principal
- Data de abertura
- Situação cadastral
- Observações

### Dados Fiscais
- Regime tributário
- Contribuinte ICMS
- Inscrição SUFRAMA
- Consumidor final
- Optante Simples Nacional
- Observações fiscais para NFe

### Dados Financeiros
- Condição de pagamento padrão
- Tabela de preço
- Limite de crédito
- Desconto máximo permitido
- Vendedor responsável
- Bloqueio de crédito (com motivo e tipo)
- Observações financeiras

### Gerenciamento de Endereços
- Múltiplos endereços por cliente
- Tipos: Comercial, Residencial, Cobrança, Entrega
- Marcação de endereço principal
- Consulta automática de CEP
- Validação completa

### Gerenciamento de Contatos
- Múltiplos contatos por cliente
- Tipos: Telefone, Celular, WhatsApp, E-mail, Skype
- Marcação de contato principal
- Flags: NFe, Cobrança, Marketing
- Validação de formato

### Histórico de Atividades
- Registro automático de alterações
- Tipos: Cadastro, Edição, Bloqueio, Venda, Pagamento
- Rastreamento de usuário
- Timeline visual

## 🎨 Interface do Usuário

### Listagem de Clientes
- Tabela com paginação
- Filtros: Busca, Tipo de Pessoa, Status
- Estatísticas: Total, Ativos, PF, PJ
- Ações rápidas: Editar, Bloquear/Desbloquear

### Formulário de Cadastro
- Abas organizadas:
  1. **Dados Principais** - PF ou PJ
  2. **Dados Fiscais** - Regime, ICMS, SUFRAMA
  3. **Dados Financeiros** - Crédito, Pagamento, Bloqueio
  4. **Endereços** - CRUD completo
  5. **Contatos** - CRUD completo
  6. **Histórico** - Timeline de atividades

## 🔌 APIs Externas Integradas

### ViaCEP
- Consulta automática de endereço por CEP
- Preenchimento automático: Logradouro, Bairro, Cidade, UF
- URL: `https://viacep.com.br/ws/{cep}/json/`

### ReceitaWS
- Consulta automática de dados da empresa por CNPJ
- Preenchimento automático: Razão Social, Nome Fantasia, Situação, CNAE
- URL: `https://www.receitaws.com.br/v1/cnpj/{cnpj}`
- ⚠️ API gratuita com limite de requisições

## 🛡️ Validações Implementadas

### Documentos
- ✅ CPF: Validação com dígitos verificadores
- ✅ CNPJ: Validação com dígitos verificadores
- ✅ CEP: Formato e consulta ViaCEP
- ✅ E-mail: Formato RFC 5322
- ✅ Telefone: Formato brasileiro (10 ou 11 dígitos)

### Campos Obrigatórios
- **Pessoa Física**: Nome completo, CPF
- **Pessoa Jurídica**: Razão social, CNPJ
- **Endereço**: CEP, Logradouro, Número, Bairro, Cidade, UF
- **Contato**: Tipo, Valor

## 📊 Triggers e Automações

### Banco de Dados
1. **Geração automática de código do cliente**
   - Formato: CLI00001, CLI00002...
   - Incremento automático

2. **Atualização de timestamps**
   - `updated_at` atualizado automaticamente

3. **Registro de histórico**
   - Trigger automático em INSERT/UPDATE/DELETE
   - Registro de todas as alterações

4. **Endereço/Contato principal único**
   - Apenas um endereço pode ser principal
   - Apenas um contato pode ser principal
   - Validação por trigger

## 🚀 Como Usar

### 1. Importar o Módulo

```tsx
import { 
  CadastroClientes, 
  ListagemClientes 
} from '@/features/clientes'
```

### 2. Adicionar Rotas

```tsx
// No App.tsx ou router
<Route path="/cadastro/clientes" element={<ListagemClientes />} />
<Route path="/cadastro/clientes/novo" element={<CadastroClientes />} />
<Route path="/cadastro/clientes/:id" element={<CadastroClientes />} />
```

### 3. Adicionar ao Menu

```tsx
<MenuItem to="/cadastro/clientes">
  👥 Clientes
</MenuItem>
```

## 🔐 Segurança (RLS)

Row Level Security habilitado em todas as tabelas:
- Usuários autenticados podem ler todos os clientes
- Apenas usuários autenticados podem criar/editar
- Histórico é read-only (apenas sistema pode inserir)

## 📝 Exemplos de Uso

### Listar Clientes com Filtros

```typescript
import { listarClientes } from '@/features/clientes'

const { data, total } = await listarClientes({
  busca: 'João',
  tipo_pessoa: 'FISICA',
  status: 'ATIVO',
  limite: 20,
  offset: 0
})
```

### Criar Novo Cliente PF

```typescript
import { criarCliente } from '@/features/clientes'

const novoCliente = await criarCliente({
  tipo_pessoa: 'FISICA',
  nome_completo: 'João da Silva',
  cpf: '12345678900',
  status: 'ATIVO'
})
```

### Consultar CPF/CNPJ

```typescript
import { validarCPF, validarCNPJ } from '@/features/clientes'

const cpfValido = validarCPF('123.456.789-00') // true/false
const cnpjValido = validarCNPJ('00.000.000/0000-00') // true/false
```

### Consultar CEP

```typescript
import { consultarCEP } from '@/features/clientes'

const endereco = await consultarCEP('01310-100')
// { logradouro, bairro, cidade, uf, ... }
```

## 🎯 Próximas Melhorias

- [ ] Importação de clientes via CSV/Excel
- [ ] Exportação para PDF/Excel
- [ ] Integração com CRM
- [ ] Dashboard de clientes
- [ ] Geolocalização de endereços
- [ ] Envio de e-mail marketing
- [ ] WhatsApp Business API
- [ ] Análise de crédito automática
- [ ] Integração com Serasa/SPC

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação completa em `/documentacao`.
