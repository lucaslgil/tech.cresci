-- Script para adicionar campo aparelho_id na tabela linhas_telefonicas
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna aparelho_id (FK para tabela itens)
ALTER TABLE linhas_telefonicas 
ADD COLUMN IF NOT EXISTS aparelho_id UUID REFERENCES itens(id) ON DELETE SET NULL;

-- 2. Comentário na coluna
COMMENT ON COLUMN linhas_telefonicas.aparelho_id IS 'Referência ao aparelho celular vinculado à linha (categoria Celular)';

-- 3. Criar índice para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_linhas_aparelho ON linhas_telefonicas(aparelho_id);

-- 4. Verificar a estrutura
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'linhas_telefonicas'
  AND column_name = 'aparelho_id';
