# Implementação de Anexos no Inventário

## ✅ Implementação Concluída

Foi adicionada a funcionalidade completa de anexar arquivos (PDF, imagens, etc.) aos itens do inventário.

## 📋 O que foi implementado

### 1. Banco de Dados (`database/adicionar_anexos_inventario.sql`)

#### Estrutura criada:
- **Coluna `anexos` na tabela `itens`**: Armazena metadados dos arquivos em formato JSONB
- **Bucket Storage `inventario-anexos`**: Armazena os arquivos físicos
- **Políticas RLS**: Controle de acesso aos arquivos por empresa

#### Estrutura do JSONB (anexos):
```json
[
  {
    "id": "uuid",
    "nome": "documento.pdf",
    "tipo": "application/pdf",
    "tamanho": 102400,
    "url": "caminho/no/storage",
    "data_upload": "2024-01-15T10:30:00Z",
    "usuario_upload": "nome.usuario"
  }
]
```

#### Funções criadas:
- `validar_tipo_arquivo_inventario()`: Valida tipos e tamanhos de arquivo
- `adicionar_anexo_item()`: Adiciona anexo ao array JSONB
- `remover_anexo_item()`: Remove anexo do array JSONB

### 2. Interface React (`CadastroItem.tsx`)

#### Novos elementos:

**Interface Anexo:**
```typescript
interface Anexo {
  id: string
  nome: string
  tipo: string
  tamanho: number
  url: string
  data_upload: string
  usuario_upload?: string
}
```

**Estados adicionados:**
- `uploadingFiles`: Controla loading do upload
- `selectedFiles`: Arquivos selecionados para upload
- `showAnexosModal`: Controla exibição do modal
- `itemAnexos`: Lista de anexos do item atual
- `fileInputRef`: Referência para input de arquivo

**Funções implementadas:**
- `handleFileSelect()`: Valida e adiciona arquivos selecionados
- `removeSelectedFile()`: Remove arquivo da lista de selecionados
- `uploadFiles()`: Faz upload para Storage e atualiza banco
- `downloadAnexo()`: Baixa arquivo
- `visualizarAnexo()`: Abre arquivo em nova aba
- `deleteAnexo()`: Remove arquivo do Storage e banco
- `formatFileSize()`: Formata bytes para MB/KB
- `getFileIcon()`: Retorna ícone SVG por tipo de arquivo

### 3. Interface Visual

#### Botão na lista/cards:
- **Ícone laranja** de anexo nos botões de ação
- **Badge numérico** mostrando quantidade de anexos
- Aparece apenas quando Supabase está configurado

#### Modal de Anexos:
- **Lista de arquivos existentes** com informações (nome, tamanho, data, usuário)
- **Botões de ação**: Visualizar, Baixar, Excluir
- **Área de upload**: Drag & drop ou clique para selecionar
- **Preview** dos arquivos selecionados antes do upload
- **Upload em lote**: Envia múltiplos arquivos de uma vez

#### Modal de Edição:
- **Seção "Anexos"** após o campo "Detalhes"
- Funcionalidade completa de gestão de anexos inline

## 🔧 Como usar

### 1. Executar SQL no Supabase

```sql
-- Execute o arquivo: database/adicionar_anexos_inventario.sql
-- Isso criará:
-- - Coluna anexos na tabela itens
-- - Bucket de storage
-- - Políticas de segurança
-- - Funções auxiliares
```

### 2. Verificar configuração do Storage

No painel do Supabase:
1. Vá em **Storage**
2. Verifique se o bucket `inventario-anexos` foi criado
3. Confirme que as políticas estão ativas

### 3. Usar no sistema

**Para adicionar anexos:**
1. Acesse http://localhost:5173/inventario/cadastro
2. Edite um item existente
3. Localize a seção "Anexos" no modal
4. Clique para selecionar arquivos ou arraste
5. Clique em "Enviar X arquivo(s)"

**Para visualizar anexos:**
1. Na lista de itens, clique no botão laranja de anexo
2. Modal abrirá mostrando todos os anexos
3. Use os botões: 👁️ Visualizar | ⬇️ Baixar | 🗑️ Excluir

## 📝 Validações Implementadas

### Tipos de arquivo aceitos:
- **Documentos**: PDF
- **Imagens**: JPEG, JPG, PNG, GIF, BMP, WEBP

### Limites:
- **Tamanho máximo**: 10MB por arquivo
- **Upload múltiplo**: Sem limite de quantidade

### Segurança:
- Validação de tipo no frontend e backend
- Validação de tamanho
- RLS por empresa (usuário só vê anexos da sua empresa)
- URLs assinadas com expiração para download

## 🎨 Padrão Visual

Seguindo o padrão do sistema:
- **Cor do botão**: Laranja (#f97316) para anexos
- **Badges**: Contador em laranja quando há anexos
- **Modal**: Padrão #394353 para títulos e botões principais
- **Bordas**: #C9C4B5
- **Textos**: text-sm/text-xs conforme padrão

## 🔍 Recursos Adicionais

### Ícones por tipo de arquivo:
- 📄 PDF: Ícone vermelho
- 🖼️ Imagens: Ícone azul
- 📎 Outros: Ícone cinza genérico

### Informações exibidas:
- Nome do arquivo
- Tamanho formatado (KB/MB)
- Data de upload
- Usuário que fez upload

### Funcionalidades especiais:
- Preview antes do upload
- Upload em lote
- Download direto
- Visualização em nova aba
- Exclusão com confirmação
- Limpeza automática do Storage ao excluir item

## ⚠️ Importante

1. **Execute o SQL antes de testar**: O sistema só funcionará após executar o arquivo SQL no Supabase
2. **Verifique o Storage**: Certifique-se que o Supabase Storage está habilitado no projeto
3. **Backup**: Sempre faça backup antes de executar scripts SQL em produção
4. **Testes**: Teste com arquivos pequenos primeiro

## 📊 Status da Implementação

- ✅ Banco de dados (SQL)
- ✅ Interfaces TypeScript
- ✅ Funções de upload
- ✅ Funções de download
- ✅ Funções de exclusão
- ✅ Interface visual (modal)
- ✅ Botões na lista/cards
- ✅ Validações
- ✅ Ícones por tipo
- ✅ RLS e segurança
- ✅ Limpeza automática
- ✅ Preview de arquivos

## 🚀 Próximos Passos

1. Executar o SQL no Supabase
2. Testar upload de arquivos
3. Testar download e visualização
4. Testar exclusão
5. Verificar permissões RLS
6. (Opcional) Adicionar mais tipos de arquivo se necessário
