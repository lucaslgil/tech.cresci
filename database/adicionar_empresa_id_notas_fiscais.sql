-- =====================================================
-- ADICIONAR CAMPO EMPRESA_ID NA TABELA NOTAS FISCAIS
-- Data: 03/02/2026
-- =====================================================

-- Adicionar coluna empresa_id com referência à tabela empresas
ALTER TABLE notas_fiscais 
  ADD COLUMN IF NOT EXISTS empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT;

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_empresa_id ON notas_fiscais(empresa_id);

-- Adicionar comentário
COMMENT ON COLUMN notas_fiscais.empresa_id IS 'ID da empresa emissora da nota fiscal';

-- Verificar se foi adicionado
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notas_fiscais' 
AND column_name = 'empresa_id';
