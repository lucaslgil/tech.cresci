# Tela de Configurações - Documentação

## 📋 Visão Geral

Nova tela de Configurações do Sistema acessível através do menu lateral (ícone de engrenagem) ou clicando na foto/ícone do usuário no topo do menu.

**Rota**: `/configuracoes`

---

## 🎯 Funcionalidades Implementadas

### 1. **Aba: Usuários**

Sistema completo de gerenciamento de usuários com controle de permissões.

#### Funcionalidades:

##### ✅ **Criação de Usuários**
- Integração com Supabase Authentication
- Campos obrigatórios: E-mail e Senha (mínimo 6 caracteres)
- Campos opcionais: Nome Completo, Cargo, Telefone
- Seleção de status: Ativo/Inativo
- E-mail de confirmação automático enviado ao criar usuário

##### ✅ **Edição de Usuários**
- Atualizar dados pessoais (Nome, Cargo, Telefone)
- Alterar permissões de acesso
- Ativar/Desativar usuário
- E-mail não pode ser alterado (campo bloqueado)

##### ✅ **Sistema de Permissões**
Controle granular de acesso aos módulos do sistema:

| Permissão | Módulo |
|-----------|--------|
| `cadastro_empresa` | Cadastro de Empresa |
| `cadastro_colaborador` | Cadastro de Colaborador |
| `inventario_item` | Inventário - Itens |
| `inventario_relatorio` | Inventário - Relatórios |
| `inventario_linhas` | Inventário - Linhas Telefônicas |
| `configuracoes` | Configurações do Sistema |

##### ✅ **Interface de Usuários**
- Listagem completa com foto de perfil
- Indicador visual de status (Ativo/Inativo)
- Ações: Editar e Desativar
- Contador de usuários ativos
- Modal responsivo para cadastro/edição

---

### 2. **Aba: Tema do Sistema**

Sistema de personalização visual completo com temas pré-definidos e customização avançada.

#### Funcionalidades:

##### ✅ **Temas Pré-definidos**
6 temas prontos para uso:

1. **Slate (Padrão)** - Cinza profissional
2. **Azul Profissional** - Blue corporativo
3. **Verde Corporativo** - Emerald clean
4. **Roxo Moderno** - Violet vibrante
5. **Laranja Energético** - Orange dinâmico
6. **Modo Escuro** - Dark mode completo

##### ✅ **Personalização de Cores**
Editor completo com 6 categorias de cores:

- **Cor Primária**: Botões principais, headers
- **Cor Secundária**: Hover states, emphasis
- **Cor de Destaque**: Links, ações importantes
- **Cor de Fundo**: Background principal
- **Cor do Texto**: Texto padrão
- **Cor da Borda**: Bordas e separadores

Cada cor pode ser ajustada através de:
- Color picker visual
- Input de código hexadecimal manual

##### ✅ **Preview em Tempo Real**
- Visualização instantânea das cores escolhidas
- Botões de exemplo (Primário, Secundário, Destaque)
- Exemplo de texto e bordas

##### ✅ **Exportar/Importar Tema**
- **Exportar**: Baixa arquivo JSON com configurações
- **Importar**: Carrega tema de arquivo JSON
- **Persistência**: Salva no localStorage do navegador

##### ✅ **Restaurar Padrão**
- Botão para voltar ao tema Slate original
- Confirmação antes de restaurar

---

## 🗄️ Estrutura de Arquivos

```
src/features/configuracoes/
├── Configuracoes.tsx          # Componente principal com sistema de abas
├── GerenciarUsuarios.tsx      # Aba de gerenciamento de usuários
└── TemaSistema.tsx            # Aba de personalização de tema
```

---

## 🗃️ Banco de Dados

### Tabela: `usuarios`

Novas colunas adicionadas:

```sql
-- Coluna de permissões (JSONB)
permissoes JSONB DEFAULT '{
  "cadastro_empresa": false,
  "cadastro_colaborador": false,
  "inventario_item": false,
  "inventario_relatorio": false,
  "inventario_linhas": false,
  "configuracoes": false
}'

-- Coluna de status
ativo BOOLEAN DEFAULT true
```

#### Índices criados:
- `idx_usuarios_ativo` - Otimiza buscas por status
- `idx_usuarios_permissoes` - GIN index para buscas em JSON

---

## 🔧 Configuração Necessária

### 1. Executar Script SQL

Execute o arquivo `adicionar_permissoes_usuarios.sql` no Supabase SQL Editor:

```sql
-- Adicionar colunas
ALTER TABLE usuarios ADD COLUMN permissoes JSONB ...
ALTER TABLE usuarios ADD COLUMN ativo BOOLEAN ...

-- Criar índices
CREATE INDEX idx_usuarios_ativo ...
CREATE INDEX idx_usuarios_permissoes ...
```

### 2. Dar Permissões ao Primeiro Usuário

Após executar o script, atualize o primeiro usuário (admin):

```sql
UPDATE usuarios 
SET permissoes = '{
  "cadastro_empresa": true,
  "cadastro_colaborador": true,
  "inventario_item": true,
  "inventario_relatorio": true,
  "inventario_linhas": true,
  "configuracoes": true
}'::jsonb
WHERE email = 'seu-email@exemplo.com';
```

---

## 🎨 Design

### Componentes de Interface:

#### **Sistema de Abas**
- Navegação horizontal com ícones
- Indicador visual de aba ativa
- Descrição de cada aba
- Ícones: Users (Usuários), Palette (Tema)

#### **Aba Usuários**
- Tabela responsiva com hover states
- Modal centralizado com scroll
- Checkboxes para permissões em fundo slate-50
- Botão "Novo Usuário" com ícone UserPlus
- Indicadores de status com badges coloridos
- Campo de senha com toggle show/hide

#### **Aba Tema**
- Grid responsivo de temas pré-definidos
- Preview de paleta de cores por tema
- Editor de cores em grid 2/3 colunas
- Inputs color picker + text hex
- Preview section com exemplos práticos
- Botões de ação no topo

### Paleta de Cores (Padrão Slate):
- Primária: `#334155` (slate-700)
- Secundária: `#1e293b` (slate-800)
- Destaque: `#0ea5e9` (sky-500)
- Fundo: `#f8fafc` (slate-50)
- Texto: `#1e293b` (slate-800)
- Borda: `#cbd5e1` (slate-300)

---

## 🚀 Como Usar

### Acessar Configurações:
1. Clique no ícone/foto do usuário no topo do menu lateral, OU
2. Clique em "Configurações" no rodapé do menu lateral

### Gerenciar Usuários:
1. Acesse aba "Usuários"
2. Clique em "Novo Usuário"
3. Preencha e-mail e senha (obrigatórios)
4. Selecione permissões desejadas
5. Clique em "Criar Usuário"

### Personalizar Tema:
1. Acesse aba "Tema do Sistema"
2. **Opção 1**: Escolha um tema pré-definido
3. **Opção 2**: Personalize cores manualmente e clique em "Aplicar Cores Personalizadas"
4. Use "Exportar Tema" para salvar configuração
5. Use "Importar Tema" para carregar configuração salva

---

## 📝 Notas Técnicas

### Supabase Auth:
- Criação de usuário usa `supabase.auth.signUp()`
- E-mail de confirmação enviado automaticamente
- Usuário criado em `auth.users` e dados em `usuarios` table

### LocalStorage:
- Tema salvo em `tema-sistema`
- Persiste entre sessões
- Formato JSON com id, cores e flag customizado

### TypeScript:
- Interfaces tipadas para Usuario e TemaConfig
- Type-safe nas permissões e cores
- Props validadas com React.FC

### Responsividade:
- Mobile-first design
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Grid adaptável e scroll em modais

---

## ✅ Checklist de Implementação

- [x] Criar estrutura de pastas
- [x] Componente Configuracoes.tsx com abas
- [x] Componente GerenciarUsuarios.tsx
- [x] Componente TemaSistema.tsx
- [x] Integração com Supabase Auth
- [x] Sistema de permissões JSONB
- [x] CRUD completo de usuários
- [x] 6 temas pré-definidos
- [x] Editor de cores customizadas
- [x] Preview em tempo real
- [x] Exportar/Importar tema
- [x] LocalStorage persistência
- [x] Atualizar rotas no App.tsx
- [x] Atualizar menu lateral
- [x] Script SQL para permissões
- [x] Documentação completa
- [x] Commit e push para GitHub

---

## 🔜 Próximos Passos Sugeridos

1. **Implementar controle de permissões nas rotas**
   - Criar ProtectedRoute com verificação de permissões
   - Bloquear acesso a módulos sem permissão

2. **Adicionar mais configurações**
   - Configurações de e-mail/notificações
   - Configurações de backup
   - Configurações de relatórios

3. **Melhorias no tema**
   - Aplicar cores dinamicamente em todo o sistema
   - CSS Variables globais
   - Dark mode completo com switch

4. **Auditoria**
   - Log de alterações de permissões
   - Histórico de usuários desativados
   - Relatório de acessos

---

**Desenvolvido em**: 06 de Novembro de 2025  
**Commit**: 9907ca7
