-- Script para criar tabela de histórico de linhas telefônicas
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de histórico
CREATE TABLE IF NOT EXISTS historico_linhas_telefonicas (
  id BIGSERIAL PRIMARY KEY,
  linha_id BIGINT NOT NULL REFERENCES linhas_telefonicas(id) ON DELETE CASCADE,
  campo_alterado VARCHAR(50) NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  data_alteracao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_campo_alterado CHECK (campo_alterado IN ('responsavel', 'usuario_setor'))
);

-- 2. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_historico_linhas_linha_id ON historico_linhas_telefonicas(linha_id);
CREATE INDEX IF NOT EXISTS idx_historico_linhas_data ON historico_linhas_telefonicas(data_alteracao DESC);
CREATE INDEX IF NOT EXISTS idx_historico_linhas_campo ON historico_linhas_telefonicas(campo_alterado);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE historico_linhas_telefonicas ENABLE ROW LEVEL SECURITY;

-- 4. Criar política para permitir leitura
CREATE POLICY "Permitir leitura do histórico para usuários autenticados"
ON historico_linhas_telefonicas
FOR SELECT
TO authenticated
USING (true);

-- 5. Criar política para permitir inserção
CREATE POLICY "Permitir inserção no histórico para usuários autenticados"
ON historico_linhas_telefonicas
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6. Verificar a estrutura
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'historico_linhas_telefonicas'
ORDER BY ordinal_position;

-- 7. Comentários nas colunas
COMMENT ON TABLE historico_linhas_telefonicas IS 'Tabela para armazenar histórico de alterações das linhas telefônicas';
COMMENT ON COLUMN historico_linhas_telefonicas.linha_id IS 'ID da linha telefônica';
COMMENT ON COLUMN historico_linhas_telefonicas.campo_alterado IS 'Campo que foi alterado (responsavel ou usuario_setor)';
COMMENT ON COLUMN historico_linhas_telefonicas.valor_anterior IS 'Valor antes da alteração';
COMMENT ON COLUMN historico_linhas_telefonicas.valor_novo IS 'Valor depois da alteração';
COMMENT ON COLUMN historico_linhas_telefonicas.usuario_id IS 'ID do usuário que fez a alteração';
COMMENT ON COLUMN historico_linhas_telefonicas.data_alteracao IS 'Data e hora da alteração';
