-- ============================================
-- Script de atualização: Adicionar campo STATUS em Colaboradores
-- Data: 2025-10-28
-- Descrição: Adiciona coluna 'status' na tabela colaboradores
-- ============================================

-- 1. Adicionar coluna status na tabela colaboradores
ALTER TABLE colaboradores 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Ativo';

-- 2. Criar índice para melhorar performance de consultas por status
CREATE INDEX IF NOT EXISTS idx_colaboradores_status ON colaboradores(status);

-- 3. Atualizar registros existentes sem status definido
UPDATE colaboradores 
SET status = 'Ativo' 
WHERE status IS NULL;

-- 4. Adicionar constraint para garantir valores válidos
ALTER TABLE colaboradores 
ADD CONSTRAINT chk_colaborador_status 
CHECK (status IN ('Ativo', 'Inativo'));

-- ============================================
-- VALIDAÇÃO
-- ============================================

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'colaboradores' 
  AND column_name = 'status';

-- Verificar distribuição de status
SELECT 
  status,
  COUNT(*) as total
FROM colaboradores
GROUP BY status
ORDER BY status;

-- ============================================
-- TESTES DE CONSULTA
-- ============================================

-- 1. Listar todos os colaboradores com seus status
SELECT 
  id,
  nome,
  cpf,
  cnpj,
  email,
  setor,
  cargo,
  status,
  created_at
FROM colaboradores
ORDER BY nome;

-- 2. Listar apenas colaboradores ativos
SELECT 
  nome,
  email,
  setor,
  cargo,
  status
FROM colaboradores
WHERE status = 'Ativo'
ORDER BY nome;

-- 3. Listar apenas colaboradores inativos
SELECT 
  nome,
  email,
  setor,
  cargo,
  status
FROM colaboradores
WHERE status = 'Inativo'
ORDER BY nome;

-- 4. Consulta completa com join na tabela empresas
SELECT 
  c.id,
  c.nome,
  c.cpf,
  c.cnpj,
  c.email,
  c.telefone,
  c.setor,
  c.cargo,
  c.status,
  e.razao_social as empresa,
  c.created_at
FROM colaboradores c
LEFT JOIN empresas e ON c.empresa_id = e.id
ORDER BY c.status, c.nome;

-- ============================================
-- OBSERVAÇÕES
-- ============================================

/*
1. A coluna 'status' permite dois valores: 'Ativo' ou 'Inativo'
2. O valor padrão é 'Ativo' para novos cadastros
3. Colaboradores inativos permanecem no banco mas podem ser filtrados
4. O índice melhora performance de queries que filtram por status
5. Registros existentes serão automaticamente marcados como 'Ativo'

PRÓXIMOS PASSOS:
- Execute este script no Supabase SQL Editor
- Verifique se a coluna foi criada corretamente
- Teste as consultas de validação
- Atualize os colaboradores existentes conforme necessário
*/
