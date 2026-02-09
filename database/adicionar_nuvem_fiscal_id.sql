-- =====================================================
-- ADICIONAR CAMPO NUVEM_FISCAL_ID
-- Armazena o ID da nota na Nuvem Fiscal para operações futuras
-- =====================================================

-- Adicionar coluna nuvem_fiscal_id na tabela notas_fiscais
ALTER TABLE notas_fiscais 
ADD COLUMN IF NOT EXISTS nuvem_fiscal_id VARCHAR(100);

-- Criar índice para facilitar buscas
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_nuvem_fiscal_id 
ON notas_fiscais(nuvem_fiscal_id);

-- Comentário para documentação
COMMENT ON COLUMN notas_fiscais.nuvem_fiscal_id IS 'ID interno da nota na plataforma Nuvem Fiscal';
