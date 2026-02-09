-- =====================================================
-- ADICIONAR TODOS OS CAMPOS FALTANTES EM NOTAS_FISCAIS_ITENS
-- Data: 03/02/2026
-- =====================================================

-- Adicionar campos básicos do produto
ALTER TABLE notas_fiscais_itens
  ADD COLUMN IF NOT EXISTS produto_codigo VARCHAR(100),
  ADD COLUMN IF NOT EXISTS produto_descricao VARCHAR(255),
  ADD COLUMN IF NOT EXISTS unidade VARCHAR(10),
  ADD COLUMN IF NOT EXISTS quantidade NUMERIC(15,4),
  ADD COLUMN IF NOT EXISTS valor_unitario NUMERIC(15,4);

-- Adicionar TODOS os campos de impostos
ALTER TABLE notas_fiscais_itens
  -- ICMS
  ADD COLUMN IF NOT EXISTS icms_origem VARCHAR(1),
  ADD COLUMN IF NOT EXISTS icms_cst VARCHAR(3),
  ADD COLUMN IF NOT EXISTS icms_base_calculo NUMERIC(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS icms_aliquota NUMERIC(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS icms_valor NUMERIC(15,2) DEFAULT 0.00,
  
  -- PIS
  ADD COLUMN IF NOT EXISTS pis_cst VARCHAR(2),
  ADD COLUMN IF NOT EXISTS pis_base_calculo NUMERIC(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS pis_aliquota NUMERIC(5,4) DEFAULT 0.0000,
  ADD COLUMN IF NOT EXISTS pis_valor NUMERIC(15,2) DEFAULT 0.00,
  
  -- COFINS
  ADD COLUMN IF NOT EXISTS cofins_cst VARCHAR(2),
  ADD COLUMN IF NOT EXISTS cofins_base_calculo NUMERIC(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS cofins_aliquota NUMERIC(5,4) DEFAULT 0.0000,
  ADD COLUMN IF NOT EXISTS cofins_valor NUMERIC(15,2) DEFAULT 0.00;

-- Índices
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_itens_nota_id ON notas_fiscais_itens(nota_fiscal_id);

-- ✅ SCRIPT EXECUTADO COM SUCESSO!
