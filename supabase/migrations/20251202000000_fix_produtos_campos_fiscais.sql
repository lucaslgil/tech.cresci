-- =====================================================
-- CORRIGIR ERRO: Could not find the 'aliquota_cofins' column
-- Adiciona todos os campos fiscais necessários
-- =====================================================

-- Adicionar campos fiscais de volta (caso não existam)
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS ncm VARCHAR(10);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cest VARCHAR(10);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cfop_entrada VARCHAR(10);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cfop_saida VARCHAR(10);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS origem_mercadoria INTEGER DEFAULT 0;

-- ICMS
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cst_icms VARCHAR(5);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS csosn_icms VARCHAR(5);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS aliquota_icms NUMERIC(5,2) DEFAULT 0;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS reducao_bc_icms NUMERIC(5,2) DEFAULT 0;

-- Substituição Tributária
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cst_icms_st VARCHAR(5);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS mva_st NUMERIC(5,2) DEFAULT 0;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS aliquota_icms_st NUMERIC(5,2) DEFAULT 0;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS reducao_bc_icms_st NUMERIC(5,2) DEFAULT 0;

-- PIS/COFINS
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cst_pis VARCHAR(5);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS aliquota_pis NUMERIC(5,2) DEFAULT 0;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cst_cofins VARCHAR(5);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS aliquota_cofins NUMERIC(5,2) DEFAULT 0;

-- IPI
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cst_ipi VARCHAR(5);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS aliquota_ipi NUMERIC(5,2) DEFAULT 0;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS enquadramento_ipi VARCHAR(10);

-- Regime Tributário
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS regime_tributario VARCHAR(20) DEFAULT 'SIMPLES';

-- Categoria (como texto por enquanto)
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_produtos_ncm ON produtos(ncm);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_regime ON produtos(regime_tributario);
