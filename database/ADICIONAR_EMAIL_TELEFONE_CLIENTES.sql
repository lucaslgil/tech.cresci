-- =============================================================
-- ADICIONAR CAMPO EMAIL E TELEFONE NA TABELA CLIENTES
-- Execute no SQL Editor do Supabase
-- =============================================================

-- Adiciona a coluna email (campo direto no cadastro do cliente)
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS email    TEXT,
  ADD COLUMN IF NOT EXISTS telefone TEXT;

-- Índice opcional para busca por email
CREATE INDEX IF NOT EXISTS idx_clientes_email
  ON clientes (empresa_id, email)
  WHERE email IS NOT NULL;

-- =============================================================
-- FIM
-- =============================================================
