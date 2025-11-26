-- Migration: Add index on colaboradores.nome for better search performance
-- Created: 2025-11-26

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_colaboradores_nome 
ON colaboradores (nome);

-- Add comment
COMMENT ON INDEX idx_colaboradores_nome IS 'Improves search performance on colaboradores.nome';
