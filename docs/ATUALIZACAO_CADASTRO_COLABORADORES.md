# Atualização do Cadastro de Colaboradores

## Mudanças Implementadas

### Novos Campos do Formulário

O cadastro de colaboradores foi reformulado com os seguintes campos:

1. **Tipo de Pessoa** * (obrigatório) - Radio button: Física ou Jurídica
2. **Nome Completo** * (obrigatório) - Nome do colaborador
3. **CPF** * (condicional) - Exibido apenas se Pessoa Física
4. **CNPJ** * (condicional) - Exibido apenas se Pessoa Jurídica
5. **Email** * (obrigatório) - Email de contato
6. **Telefone** * (obrigatório) - Telefone com formatação automática
7. **Setor** * (obrigatório) - Dropdown com setores disponíveis
8. **Cargo** * (obrigatório) - Cargo/função do colaborador
9. **Empresa** * (obrigatório) - Dropdown com empresas cadastradas

### Funcionalidades Especiais

#### 1. Formatação Automática
- **CPF**: Formato `000.000.000-00` (aplicado automaticamente ao digitar)
- **CNPJ**: Formato `00.000.000/0000-00` (aplicado automaticamente ao digitar)
- **Telefone**: Formato `(00) 00000-0000` (aplicado automaticamente ao digitar)

#### 2. Campo Condicional CPF/CNPJ
- Ao selecionar **Pessoa Física**: exibe apenas campo CPF
- Ao selecionar **Pessoa Jurídica**: exibe apenas campo CNPJ
- Ao trocar o tipo de pessoa, o campo anterior é limpo automaticamente

#### 3. Integração com Empresas
- Busca automática das empresas cadastradas no banco
- Dropdown populado dinamicamente
- Validação: não permite cadastrar sem empresa vinculada
- Mensagem de alerta se não houver empresas cadastradas

### Opções de Setor Disponíveis
- Administrativo
- Financeiro
- TI
- RH
- Operacional
- Comercial
- Logística
- Outros

## Layout do Formulário

- **Grid responsivo**: 2 colunas em telas médias/grandes, 1 em mobile
- **Radio buttons**: Tipo de pessoa no topo
- **Campo Nome**: Largura completa (2 colunas)
- **Campo Empresa**: Largura completa (2 colunas)
- **Botões**: 
  - **Limpar**: Reseta o formulário
  - **Cadastrar Colaborador**: Salva os dados (desabilitado se não houver empresas)

## Banco de Dados

### Estrutura da Tabela `colaboradores`

```sql
CREATE TABLE colaboradores (
    id UUID PRIMARY KEY,
    tipo_pessoa TEXT NOT NULL CHECK (tipo_pessoa IN ('fisica', 'juridica')),
    nome TEXT NOT NULL,
    cpf TEXT,
    cnpj TEXT,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL,
    setor TEXT NOT NULL,
    cargo TEXT NOT NULL,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT cpf_cnpj_check CHECK (
        (tipo_pessoa = 'fisica' AND cpf IS NOT NULL AND cnpj IS NULL) OR
        (tipo_pessoa = 'juridica' AND cnpj IS NOT NULL AND cpf IS NULL)
    )
);
```

### Validações no Banco
- **Check Constraint**: Garante que tipo_pessoa seja 'fisica' ou 'juridica'
- **CPF/CNPJ Constraint**: Garante que:
  - Se física: tem CPF e não tem CNPJ
  - Se jurídica: tem CNPJ e não tem CPF
- **Foreign Key**: empresa_id vinculado à tabela empresas (CASCADE on delete)

## Migração do Banco de Dados

### Se você está criando o banco pela primeira vez:
Execute apenas o arquivo `supabase_setup.sql` (já está atualizado)

### Se você já tem a tabela antiga de colaboradores:
Execute o arquivo `migracao_colaboradores.sql` que irá:
1. Remover a tabela antiga
2. Criar a nova estrutura com validações
3. Configurar RLS e políticas
4. Criar índices para performance (cpf, cnpj, setor, empresa_id)

⚠️ **ATENÇÃO**: A migração apaga todos os dados existentes! Faça backup antes!

## Arquivos Modificados/Criados

- ✅ `src/features/colaborador/CadastroColaborador.tsx` - Formulário completo
- ✅ `supabase_setup.sql` - Estrutura atualizada da tabela
- ✅ `migracao_colaboradores.sql` - Script de migração (novo)
- ✅ `ATUALIZACAO_CADASTRO_COLABORADORES.md` - Esta documentação

## Melhorias de UX

1. **Validação inteligente**: CPF/CNPJ conforme tipo de pessoa
2. **Formatação automática**: CPF, CNPJ e Telefone formatados ao digitar
3. **Busca de empresas**: Carregamento automático com loading spinner
4. **Mensagem de alerta**: Aviso claro se não houver empresas cadastradas
5. **Botão desabilitado**: Não permite submissão sem empresa vinculada
6. **Botão "Limpar"**: Reseta todo o formulário rapidamente
7. **Layout moderno**: Grid responsivo com espaçamento adequado
8. **Cores consistentes**: Tema slate (azul-cinza) do sistema
9. **Placeholders informativos**: Exemplos em todos os campos

## Fluxo Recomendado de Uso

1. **Cadastre uma empresa primeiro** (menu Cadastro → Empresa)
2. Acesse **Cadastro → Colaborador**
3. Selecione o **tipo de pessoa** (Física ou Jurídica)
4. Preencha os campos obrigatórios
5. Selecione a **empresa** vinculada
6. Clique em **Cadastrar Colaborador**

## Como Testar

1. Execute a migração do banco de dados no Supabase SQL Editor
2. Certifique-se de ter pelo menos uma empresa cadastrada
3. Acesse o menu **Cadastro** → **Colaborador**
4. Teste cadastrar pessoa física e jurídica
5. Observe a formatação automática dos campos

## Validações Implementadas

### Frontend
- Campos obrigatórios marcados com *
- Validação de email (formato HTML5)
- Máximo de caracteres para CPF (14), CNPJ (18) e Telefone (15)
- Não permite submeter sem empresa selecionada

### Backend (Banco de Dados)
- CPF e CNPJ mutuamente exclusivos conforme tipo de pessoa
- Empresa_id deve existir na tabela empresas
- Tipo de pessoa deve ser 'fisica' ou 'juridica'

## Próximos Passos Sugeridos

- [ ] Criar tela de listagem de colaboradores
- [ ] Implementar busca e filtros (por empresa, setor, tipo)
- [ ] Adicionar edição de colaboradores existentes
- [ ] Validar CPF/CNPJ (algoritmo de validação)
- [ ] Criar relatórios de colaboradores por empresa/setor
- [ ] Adicionar campo de foto do colaborador
- [ ] Implementar importação em lote (Excel/CSV)
