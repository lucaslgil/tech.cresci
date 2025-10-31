# Configuração da Tela de Perfil do Usuário

## Passos para configurar no Supabase:

### 1. Criar tabela de usuários
Execute o SQL atualizado em `supabase_setup.sql` no SQL Editor do Supabase.
Este arquivo já foi atualizado com a tabela `usuarios` no início.

### 2. Configurar Storage para fotos de perfil

#### 2.1. Executar SQL para criar bucket e políticas
Execute o arquivo `supabase_storage_setup.sql` no SQL Editor do Supabase.

#### 2.2. Verificar o bucket (alternativa manual)
Caso prefira criar manualmente:
1. Acesse o Supabase Dashboard
2. Vá em **Storage** no menu lateral
3. Clique em **New Bucket**
4. Nome: `perfis`
5. Marque como **Public bucket**
6. Clique em **Create bucket**

## Funcionalidades implementadas:

### ✅ Menu lateral melhorado
- Nome do usuário removido do título
- Perfil do usuário clicável (abre tela de configuração)
- Botão "Configurações" no rodapé

### ✅ Submenus colapsáveis
- **CADASTRO** (menu pai)
  - Empresa (submenu)
  - Colaborador (submenu)
- **INVENTÁRIO** (menu pai)
  - Cadastrar Item (submenu)

### ✅ Tela de Configuração do Usuário
**Rota:** `/configuracao`

**Recursos:**
- Upload de foto de perfil
- Edição de informações pessoais:
  - Nome completo
  - Email (somente leitura)
  - Telefone
  - Cargo
- Alteração de senha (envia email de redefinição)
- Design responsivo com cards separados

### ✅ Integração com Supabase
- Tabela `usuarios` com campos:
  - id (referência ao auth.users)
  - nome
  - email
  - telefone
  - cargo
  - foto_perfil (URL pública)
  - created_at / updated_at
- Storage bucket `perfis` para fotos
- Políticas RLS para segurança

## Como testar:

1. Execute os SQLs no Supabase
2. Faça login no sistema
3. Clique no seu nome/avatar no topo do menu lateral
4. Preencha seus dados e faça upload de uma foto
5. Teste os submenus clicando em CADASTRO e INVENTÁRIO

## Estrutura de arquivos criados:

```
src/features/perfil/
  └── ConfiguracaoUsuario.tsx     # Tela de configuração do usuário

supabase_storage_setup.sql         # SQL para configurar storage
supabase_setup.sql                 # Atualizado com tabela usuarios
```

## Próximos passos sugeridos:

- [ ] Adicionar validação de tamanho de arquivo (max 2MB)
- [ ] Implementar crop de imagem antes do upload
- [ ] Adicionar preview da foto antes de salvar
- [ ] Criar tela de redefinição de senha customizada
- [ ] Adicionar mais campos personalizados conforme necessário
