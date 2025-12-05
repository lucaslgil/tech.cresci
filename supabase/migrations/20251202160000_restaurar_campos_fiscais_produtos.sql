-- =====================================================
-- RESTAURAR CAMPOS FISCAIS NA TABELA PRODUTOS
-- Adiciona de volta os campos fiscais necessários para NF-e
-- Data: 02/12/2025
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

-- Comentários
COMMENT ON COLUMN produtos.ncm IS 'Nomenclatura Comum do Mercosul - 8 dígitos';
COMMENT ON COLUMN produtos.cest IS 'Código Especificador da Substituição Tributária';
COMMENT ON COLUMN produtos.cfop_entrada IS 'CFOP padrão para entradas';
COMMENT ON COLUMN produtos.cfop_saida IS 'CFOP padrão para saídas';
COMMENT ON COLUMN produtos.origem_mercadoria IS 'Origem da mercadoria (0-Nacional, 1-Estrangeira Importação Direta, etc)';
COMMENT ON COLUMN produtos.cst_icms IS 'Código de Situação Tributária do ICMS (Regime Normal)';
COMMENT ON COLUMN produtos.csosn_icms IS 'Código de Situação da Operação do Simples Nacional';
COMMENT ON COLUMN produtos.aliquota_icms IS 'Alíquota do ICMS em %';
COMMENT ON COLUMN produtos.reducao_bc_icms IS 'Percentual de redução da BC do ICMS';
COMMENT ON COLUMN produtos.cst_icms_st IS 'CST ICMS para Substituição Tributária';
COMMENT ON COLUMN produtos.mva_st IS 'Margem de Valor Agregado para ST';
COMMENT ON COLUMN produtos.aliquota_icms_st IS 'Alíquota do ICMS ST';
COMMENT ON COLUMN produtos.reducao_bc_icms_st IS 'Percentual de redução da BC do ICMS ST';
COMMENT ON COLUMN produtos.cst_pis IS 'Código de Situação Tributária do PIS';
COMMENT ON COLUMN produtos.aliquota_pis IS 'Alíquota do PIS em %';
COMMENT ON COLUMN produtos.cst_cofins IS 'Código de Situação Tributária do COFINS';
COMMENT ON COLUMN produtos.aliquota_cofins IS 'Alíquota do COFINS em %';
COMMENT ON COLUMN produtos.cst_ipi IS 'Código de Situação Tributária do IPI';
COMMENT ON COLUMN produtos.aliquota_ipi IS 'Alíquota do IPI em %';
COMMENT ON COLUMN produtos.enquadramento_ipi IS 'Código de Enquadramento Legal do IPI';
COMMENT ON COLUMN produtos.regime_tributario IS 'Regime tributário (SIMPLES, PRESUMIDO, REAL)';
COMMENT ON COLUMN produtos.categoria IS 'Categoria do produto';

-- Criar índices para melhorar performance em consultas fiscais
CREATE INDEX IF NOT EXISTS idx_produtos_ncm ON produtos(ncm);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_regime ON produtos(regime_tributario);
