# Sistema de Inventário e Cadastro

Sistema web moderno desenvolvido com React, TypeScript, Vite e Supabase para gerenciamento de inventário e cadastros de empresas e colaboradores.

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: TailwindCSS
- **Backend**: Supabase (Autenticação + Banco de Dados)
- **Roteamento**: React Router DOM
- **Build Tool**: Vite

## 📋 Funcionalidades

### Menu CADASTRO
- **Empresa**: Cadastro completo com CNPJ, email, telefone e endereço
- **Colaborador**: Cadastro vinculado à empresa com cargo e informações pessoais

### Menu INVENTÁRIO
- **Cadastrar Item**: Gerenciamento de itens com categoria, quantidade, preço e código único

### Recursos Adicionais
- Sistema de autenticação seguro
- Documentação integrada
- Interface responsiva e moderna
- Validação de formulários
- Proteção de rotas

## 🛠 Configuração do Ambiente

### 1. Clonar e Instalar Dependências

```bash
git clone <repository-url>
cd tech.crescieperdi
npm install
```

### 2. Configurar Supabase

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Configure as variáveis de ambiente:

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas credenciais do Supabase
VITE_SUPABASE_URL=sua_url_do_projeto_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_supabase
```

### 3. Criar Tabelas no Supabase

Execute os seguintes SQL commands no Supabase SQL Editor:

```sql
-- Tabela de empresas
CREATE TABLE empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    cnpj TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL,
    endereco TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de colaboradores
CREATE TABLE colaboradores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL,
    cargo TEXT NOT NULL,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens
CREATE TABLE itens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL,
    categoria TEXT NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0,
    preco NUMERIC(10,2) NOT NULL DEFAULT 0,
    codigo TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_colaboradores_updated_at BEFORE UPDATE ON colaboradores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_itens_updated_at BEFORE UPDATE ON itens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4. Configurar Políticas RLS (Row Level Security)

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajuste conforme necessário)
CREATE POLICY "Usuários autenticados podem ver empresas" ON empresas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem inserir empresas" ON empresas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem atualizar empresas" ON empresas FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver colaboradores" ON colaboradores FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem inserir colaboradores" ON colaboradores FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem atualizar colaboradores" ON colaboradores FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver itens" ON itens FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem inserir itens" ON itens FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem atualizar itens" ON itens FOR UPDATE USING (auth.role() = 'authenticated');
```

## 🎯 Como Executar

### Desenvolvimento

```bash
npm run dev
```

O servidor será iniciado em http://localhost:5173

### Build para Produção

```bash
npm run build
```

### Preview do Build

```bash
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── features/              # Funcionalidades organizadas por domínio
│   ├── auth/             # Autenticação
│   ├── empresa/          # Cadastro de empresas
│   ├── colaborador/      # Cadastro de colaboradores
│   ├── inventario/       # Gerenciamento de inventário
│   ├── dashboard/        # Dashboard principal
│   └── documentacao/     # Documentação do sistema
├── shared/               # Componentes e contextos compartilhados
│   ├── components/       # Componentes reutilizáveis
│   ├── context/          # Contextos React
│   └── hooks/            # Hooks customizados
├── lib/                  # Configurações e utilitários
│   └── supabase.ts       # Cliente Supabase
└── App.tsx               # Componente raiz com roteamento
```

## 📚 Documentação

Acesse a documentação completa do sistema em `/documentacao` após fazer login na aplicação.

## 🔒 Autenticação

O sistema utiliza Supabase Auth para gerenciamento de usuários. Para criar sua conta:

1. Acesse a página de login
2. Se necessário, cadastre-se no Supabase Auth diretamente
3. Faça login com suas credenciais

## ⚠️ Regras de Desenvolvimento

**IMPORTANTE**: Antes de modificar qualquer código, consulte o arquivo `regras_do_sistema.txt` na raiz do projeto. Este arquivo contém as diretrizes obrigatórias para desenvolvimento e manutenção do sistema.

## 🤝 Contribuindo

1. Leia as regras em `regras_do_sistema.txt`
2. Siga a estrutura organizacional por features
3. Mantenha a documentação atualizada
4. Use TypeScript e siga os padrões estabelecidos
5. Teste suas mudanças antes de commitar

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).