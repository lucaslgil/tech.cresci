# 📁 Database - Scripts SQL

Esta pasta contém todos os scripts SQL e arquivos relacionados ao banco de dados do sistema.

## 📋 Conteúdo

### Scripts de Setup Inicial
- `supabase_setup.sql` - Configuração inicial do Supabase
- `supabase_storage_setup.sql` - Configuração do storage do Supabase
- `criar_usuario_supabase.html` - Interface para criação de usuários
- `criar_usuario_teste.sql` - Script para criar usuário de teste

### Scripts de Criação de Tabelas
- `criar_tabelas_setores_cargos.sql` - Criação das tabelas de setores e cargos
- `criar_tabela_linhas_telefonicas.sql` - Criação da tabela de linhas telefônicas
- `criar_historico_vinculacao_itens.sql` ⭐ **NOVO** - Criação da tabela de histórico de vinculações (✅ CORRIGIDO - usa BIGINT)
- `criar_historico_vinculacao_itens_CORRIGIDO.sql` - Versão alternativa com explicações adicionais

### Scripts de Migração
- `migracao_colaboradores.sql` - Migração inicial de colaboradores
- `migracao_colaboradores_final.sql` - Migração final de colaboradores
- `migracao_itens.sql` - Migração de itens do inventário
- `migracao_categoria_itens.sql` - Migração das categorias de itens

### Scripts de Atualização
- `atualizacao_empresas.sql` - Atualização da estrutura de empresas
- `atualizacao_itens_opcionalidade.sql` - Tornando campos de itens opcionais
- `atualizacao_itens_responsavel.sql` - Adicionando responsável aos itens
- `atualizacao_status_colaboradores.sql` - Adicionando campo de status aos colaboradores

### Scripts de Correção
- `CORRECAO_URGENTE_SUPABASE.sql` - Correções urgentes no banco de dados
- `configuracoes_json_alternativa.sql` - Configurações alternativas em JSON
- `setup_responsavel_itens.sql` - Setup do relacionamento responsável-itens

### Scripts de Guia/Teste
- `GUIA_APLICAR_HISTORICO.sql` ⭐ **NOVO** - Guia passo a passo para aplicar e testar o histórico de vinculações
- `CORRECAO_TIPOS_HISTORICO.md` ⚠️ **IMPORTANTE** - Explicação sobre a correção de tipos (UUID → BIGINT)

## 🔧 Como Usar

1. Execute primeiro os scripts de **Setup Inicial**
2. Em seguida, execute os scripts de **Criação de Tabelas**
3. Execute os scripts de **Migração** (se necessário)
4. Por fim, execute os scripts de **Atualização** conforme necessário

### 🎯 Para aplicar o Histórico de Vinculações (Novo):
1. Abra o Supabase SQL Editor
2. Execute o arquivo `criar_historico_vinculacao_itens.sql`
3. Use o arquivo `GUIA_APLICAR_HISTORICO.sql` para validar e testar
4. Consulte `docs/IMPLEMENTACAO_HISTORICO_VINCULACOES.md` para documentação completa

## ⚠️ Importante

- Sempre faça backup do banco antes de executar scripts de migração ou atualização
- Teste os scripts em ambiente de desenvolvimento primeiro
- Verifique as dependências entre scripts antes de executar

## 📝 Observações

- Scripts devem ser executados na ordem correta para evitar erros de dependência
- Alguns scripts podem ser destrutivos - leia cuidadosamente antes de executar
- Mantenha este diretório organizado e documentado
