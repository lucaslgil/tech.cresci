# 🗄️ Gerenciamento de Banco de Dados com Supabase CLI

Este projeto usa **Supabase CLI** para gerenciar migrações de banco de dados de forma versionada e automatizada.

## 📋 Pré-requisitos

- ✅ Supabase CLI instalado (via Scoop)
- ✅ Projeto vinculado ao Supabase remoto

## 🚀 Comandos Principais

### 1. **Criar uma nova migração**

```powershell
# Formato do nome: YYYYMMDDHHMMSS_descricao.sql
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$descricao = "add_campo_telefone_colaboradores"
New-Item -Path "supabase\migrations\${timestamp}_${descricao}.sql" -ItemType File
```

### 2. **Aplicar migrações no banco remoto**

```powershell
supabase db push
```

Este comando:
- 🔍 Verifica novas migrações na pasta `migrations/`
- 📤 Aplica no banco de dados remoto
- ✅ Registra quais migrações foram aplicadas

### 3. **Verificar status das migrações**

```powershell
supabase migration list
```

### 4. **Criar migração para nova funcionalidade**

Exemplo: Adicionar campo `telefone_emergencia` em `colaboradores`:

```sql
-- supabase/migrations/20251126100000_add_telefone_emergencia.sql

ALTER TABLE colaboradores 
ADD COLUMN IF NOT EXISTS telefone_emergencia VARCHAR(20);

COMMENT ON COLUMN colaboradores.telefone_emergencia IS 'Telefone para emergências';
```

Depois execute:
```powershell
supabase db push
```

## 📁 Estrutura de Pastas

```
supabase/
├── migrations/          # Migrações SQL versionadas
│   ├── 20251126093125_add_index_colaboradores_nome.sql
│   └── 20251126123110_remote_schema.sql
├── config.toml         # Configurações do projeto
└── README.md           # Este arquivo
```

## ✨ Vantagens

1. **Versionamento**: Todas as alterações no banco ficam no Git
2. **Automação**: Não precisa copiar/colar SQL manualmente no Supabase
3. **Rastreabilidade**: Histórico completo de mudanças
4. **Colaboração**: Outros desenvolvedores aplicam as mesmas migrações
5. **Rollback**: Possibilidade de reverter mudanças

## 🔧 Exemplos de Uso

### Adicionar nova tabela

```sql
-- supabase/migrations/20251126100001_create_table_setores.sql

CREATE TABLE IF NOT EXISTS setores (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_setores_nome ON setores(nome);
```

### Adicionar coluna em tabela existente

```sql
-- supabase/migrations/20251126100002_add_setor_id_to_colaboradores.sql

ALTER TABLE colaboradores
ADD COLUMN IF NOT EXISTS setor_id BIGINT REFERENCES setores(id);

CREATE INDEX idx_colaboradores_setor ON colaboradores(setor_id);
```

### Modificar tipo de dados

```sql
-- supabase/migrations/20251126100003_change_cpf_to_varchar.sql

ALTER TABLE colaboradores
ALTER COLUMN cpf TYPE VARCHAR(14);
```

## ⚠️ Boas Práticas

1. ✅ Use `IF NOT EXISTS` para evitar erros em reexecuções
2. ✅ Adicione comentários explicando o propósito
3. ✅ Teste a migração localmente antes de aplicar
4. ✅ Use nomes descritivos para os arquivos
5. ✅ Nunca modifique migrações já aplicadas
6. ✅ Faça commit das migrações junto com o código

## 🔗 Links Úteis

- [Documentação Supabase CLI](https://supabase.com/docs/guides/cli)
- [Guia de Migrações](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [SQL Reference](https://www.postgresql.org/docs/current/sql.html)

---

**Projeto vinculado**: `alylochrlvgcvjdmkmum`
