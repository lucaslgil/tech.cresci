# Módulo: Parâmetros de Vendas

**Data de implementação:** 17/12/2025  
**Desenvolvedor:** Sistema

## 📋 Resumo
Implementação de um submenu "Parâmetros de Vendas" dentro do menu Vendas, permitindo configurar logotipo e textos personalizados para o cabeçalho da impressão de vendas.

## ✨ Funcionalidades Implementadas

### 1. Página de Parâmetros de Vendas
- Upload de logotipo (JPG, PNG, GIF, WEBP - máx. 2MB)
- Configuração do nome da empresa
- Configuração do slogan/subtítulo
- Toggle para mostrar/ocultar logotipo na impressão
- Preview em tempo real do cabeçalho

### 2. Banco de Dados
- **Tabela:** `parametros_vendas`
- **Campos:**
  - `id` - Identificador único
  - `chave` - Chave do parâmetro (único)
  - `valor` - Valor do parâmetro
  - `tipo` - Tipo: texto, imagem, numero, booleano
  - `descricao` - Descrição do parâmetro
  - `created_at` / `updated_at` - Timestamps

### 3. Storage
- **Bucket:** `vendas`
- **Pasta:** `logos/`
- **Acesso:** Público para leitura, autenticado para upload
- **Limite:** 2MB por arquivo

### 4. Parâmetros Criados
| Chave | Tipo | Descrição |
|-------|------|-----------|
| `logo_impressao_vendas` | imagem | URL do logotipo |
| `nome_empresa_impressao` | texto | Nome da empresa |
| `slogan_impressao` | texto | Slogan/subtítulo |
| `mostrar_logo_impressao` | booleano | Exibir/ocultar logo |

## 🔐 Permissões
- **Permissão criada:** `vendas_parametros`
- **Acesso:** Apenas usuários Admin
- **Menu:** Vendas > Parâmetros de Vendas

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
1. `src/features/vendas/ParametrosVendas.tsx` - Página de configuração
2. `database/criar_tabela_parametros_vendas.sql` - Script de criação da tabela
3. `database/criar_bucket_storage_vendas.sql` - Instruções para bucket
4. `database/adicionar_permissao_vendas_parametros.sql` - Script de permissões

### Arquivos Modificados
1. `src/features/vendas/index.ts` - Export do novo componente
2. `src/features/vendas/components/ImpressaoPedido.tsx` - Integração com parâmetros
3. `src/App.tsx` - Nova rota `/vendas/parametros`
4. `src/shared/components/Layout.tsx` - Submenu no menu Vendas
5. `src/shared/hooks/useTabOpener.tsx` - Nova função de abertura de aba

## 🚀 Como Usar

### 1. Executar Scripts SQL
```sql
-- 1. Criar tabela de parâmetros
\i database/criar_tabela_parametros_vendas.sql

-- 2. Adicionar permissão aos admins
\i database/adicionar_permissao_vendas_parametros.sql
```

### 2. Criar Bucket no Supabase
1. Acesse Supabase Dashboard > Storage
2. Clique em "New bucket"
3. Configure:
   - Name: `vendas`
   - Public bucket: ✅ Habilitado
   - File size limit: 2MB
   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
4. Crie a pasta `logos/` dentro do bucket
5. Execute as policies do arquivo `criar_bucket_storage_vendas.sql`

### 3. Acessar no Sistema
1. Login como Admin
2. Menu Vendas > Parâmetros de Vendas
3. Configurar logotipo e textos
4. Salvar alterações
5. Testar impressão de uma venda

## 🎨 Padrões Aplicados

### Interface
- Cores: #394353 (cabeçalhos), #C9C4B5 (bordas)
- Tipografia: text-base (títulos), text-sm (inputs), text-xs (labels)
- Espaçamento: p-4 (containers), gap-3 (grids)
- Segue `PADRAO_INTERFACE_SISTEMA.md`

### Validações
- Tipos de arquivo: JPG, PNG, GIF, WEBP
- Tamanho máximo: 2MB
- Preview em tempo real
- Mensagens de erro/sucesso

## 📊 Fluxo de Dados

```
1. Usuário acessa Parâmetros de Vendas
   ↓
2. Sistema carrega parâmetros do banco
   ↓
3. Usuário faz upload de logotipo
   ↓
4. Arquivo é enviado para Supabase Storage
   ↓
5. URL pública é salva na tabela parametros_vendas
   ↓
6. Ao imprimir venda, sistema busca parâmetros
   ↓
7. Cabeçalho é renderizado com logotipo e textos
```

## 🔧 Manutenção

### Adicionar Novo Parâmetro
1. Inserir na tabela `parametros_vendas`:
```sql
INSERT INTO parametros_vendas (chave, valor, tipo, descricao)
VALUES ('meu_parametro', 'valor_padrao', 'texto', 'Descrição');
```

2. Adicionar estado no componente `ParametrosVendas.tsx`
3. Incluir no carregamento e salvamento
4. Usar no componente `ImpressaoPedido.tsx`

### Alterar Tamanho Máximo
1. Modificar validação em `ParametrosVendas.tsx`:
```typescript
if (file.size > 5 * 1024 * 1024) { // 5MB
```

2. Atualizar limite no bucket Supabase

## 🧪 Testes Recomendados
- [ ] Upload de diferentes formatos de imagem
- [ ] Upload de arquivo muito grande (validação)
- [ ] Alteração de textos
- [ ] Toggle de visibilidade do logo
- [ ] Preview do cabeçalho
- [ ] Impressão de venda com logotipo
- [ ] Impressão sem logotipo
- [ ] Permissões (apenas Admin acessa)

## 📝 Notas Importantes
1. O bucket `vendas` deve ser público para exibir logotipos
2. Apenas admins podem modificar parâmetros
3. Todos usuários podem visualizar os parâmetros
4. Logotipos antigos não são deletados automaticamente (melhoria futura)
5. Preview usa URL temporária (blob) antes do upload

## 🔄 Melhorias Futuras
- [ ] Deletar logotipos antigos ao fazer upload de novo
- [ ] Redimensionamento automático de imagens
- [ ] Múltiplos modelos de cabeçalho
- [ ] Configuração de rodapé personalizado
- [ ] Marca d'água opcional
- [ ] QR Code automático no pedido
