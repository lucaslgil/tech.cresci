-- =====================================================
-- ADICIONAR CONFIGURAÇÕES FISCAIS DA EMPRESA
-- Data: 06/02/2026
-- Permite configurar informações complementares e 
-- responsável técnico para as notas fiscais
-- =====================================================

-- Adicionar campos de configuração fiscal na tabela empresas
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS informacoes_complementares_padrao TEXT;

ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS resp_tec_cnpj VARCHAR(18);

ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS resp_tec_nome VARCHAR(200);

ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS resp_tec_email VARCHAR(100);

ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS resp_tec_telefone VARCHAR(20);

ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS resp_tec_id_csrt VARCHAR(100);

ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS resp_tec_csrt VARCHAR(500);

-- Comentários descritivos
COMMENT ON COLUMN empresas.informacoes_complementares_padrao IS 'Texto padrão que aparece em todas as notas fiscais no campo "Informações Complementares"';
COMMENT ON COLUMN empresas.resp_tec_cnpj IS 'CNPJ do responsável técnico (software house)';
COMMENT ON COLUMN empresas.resp_tec_nome IS 'Nome/Razão Social do responsável técnico';
COMMENT ON COLUMN empresas.resp_tec_email IS 'Email de contato do responsável técnico';
COMMENT ON COLUMN empresas.resp_tec_telefone IS 'Telefone do responsável técnico';
COMMENT ON COLUMN empresas.resp_tec_id_csrt IS 'ID do CSRT para identificação do software';
COMMENT ON COLUMN empresas.resp_tec_csrt IS 'Código CSRT fornecido pela SEFAZ';

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_empresas_resp_tec_cnpj ON empresas(resp_tec_cnpj);
