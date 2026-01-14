-- =====================================================
-- ADICIONAR CAMPO tipo_contribuinte_id NA TABELA clientes
-- Data: 14/01/2026
-- =====================================================

-- Adicionar coluna tipo_contribuinte_id
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS tipo_contribuinte_id BIGINT REFERENCES tipos_contribuinte(id);

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_clientes_tipo_contribuinte ON clientes(tipo_contribuinte_id);

-- Comentário
COMMENT ON COLUMN clientes.tipo_contribuinte_id IS 'FK para tipo de contribuinte - padroniza operações fiscais';
