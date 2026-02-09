-- =====================================================
-- ADICIONAR CAMPOS PARA CANCELAMENTO DE NF-e
-- Sistema Fiscal - Integração Nuvem Fiscal
-- Data: 06/02/2026
-- =====================================================

-- Adicionar ID de referência da Nuvem Fiscal (essencial para operações)
ALTER TABLE notas_fiscais 
ADD COLUMN IF NOT EXISTS nuvem_fiscal_id VARCHAR(100);

-- Adicionar justificativa de cancelamento (campo correto)
ALTER TABLE notas_fiscais
ADD COLUMN IF NOT EXISTS justificativa_cancelamento TEXT;

-- Adicionar campo para protocolo de cancelamento (se ainda não existe)
ALTER TABLE notas_fiscais
ADD COLUMN IF NOT EXISTS protocolo_evento_cancelamento VARCHAR(50);

-- Criar índice para busca rápida por ID Nuvem Fiscal
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_nuvem_fiscal_id 
ON notas_fiscais(nuvem_fiscal_id);

-- Comentários
COMMENT ON COLUMN notas_fiscais.nuvem_fiscal_id IS 'ID interno da nota na Nuvem Fiscal (usado para operações posteriores como cancelamento)';
COMMENT ON COLUMN notas_fiscais.justificativa_cancelamento IS 'Justificativa do cancelamento (mínimo 15 caracteres conforme SEFAZ)';
COMMENT ON COLUMN notas_fiscais.protocolo_evento_cancelamento IS 'Protocolo do evento de cancelamento retornado pela SEFAZ';
