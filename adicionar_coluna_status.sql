-- Script para adicionar a coluna 'status' na tabela linhas_telefonicas
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar a coluna status (VARCHAR com valores permitidos: 'Ativa' ou 'Inativa')
ALTER TABLE linhas_telefonicas
ADD COLUMN IF NOT EXISTS status VARCHAR(10) DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa'));

-- 2. Atualizar as linhas existentes para ter status 'Ativa' (caso ainda não tenham)
UPDATE linhas_telefonicas
SET status = 'Ativa'
WHERE status IS NULL;

-- 3. Verificar os dados
SELECT id, numero_linha, operadora, status, created_at
FROM linhas_telefonicas
ORDER BY created_at DESC
LIMIT 10;
