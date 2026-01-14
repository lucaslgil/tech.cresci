-- =====================================================
-- CORREÇÃO DIRETA - Alterar TODOS os campos NUMERIC(5,4) para NUMERIC(5,2)
-- Executar em sequência - NÃO pode falhar
-- Data: 14/01/2026
-- =====================================================

-- IMPORTANTE: Se já executou antes, ignore erros de "column already exists"

-- Passo 1: Remover view
DROP VIEW IF EXISTS vw_regras_tributacao_ordenadas CASCADE;

-- Passo 2: Adicionar campos IBS/CBS novos (pode dar erro se já existir - OK)
ALTER TABLE regras_tributacao ADD COLUMN IF NOT EXISTS cst_ibs VARCHAR(3);
ALTER TABLE regras_tributacao ADD COLUMN IF NOT EXISTS aliquota_ibs NUMERIC(5,2);
ALTER TABLE regras_tributacao ADD COLUMN IF NOT EXISTS reducao_bc_ibs NUMERIC(5,2);
ALTER TABLE regras_tributacao ADD COLUMN IF NOT EXISTS diferimento_ibs NUMERIC(5,2);
ALTER TABLE regras_tributacao ADD COLUMN IF NOT EXISTS mensagem_nf_ibs TEXT;
ALTER TABLE regras_tributacao ADD COLUMN IF NOT EXISTS cst_cbs VARCHAR(3);
ALTER TABLE regras_tributacao ADD COLUMN IF NOT EXISTS aliquota_cbs NUMERIC(5,2);
ALTER TABLE regras_tributacao ADD COLUMN IF NOT EXISTS reducao_bc_cbs NUMERIC(5,2);
ALTER TABLE regras_tributacao ADD COLUMN IF NOT EXISTS diferimento_cbs NUMERIC(5,2);
ALTER TABLE regras_tributacao ADD COLUMN IF NOT EXISTS mensagem_nf_cbs TEXT;

-- Passo 3: Alterar campos existentes - UM POR VEZ
-- ICMS Operação Própria
DO $$
BEGIN
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN aliquota_icms_proprio TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'aliquota_icms_proprio já está NUMERIC(5,2) ou não existe';
  END;
  
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN aliquota_fcp TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'aliquota_fcp já está NUMERIC(5,2) ou não existe';
  END;
  
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN reducao_bc_icms_proprio TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'reducao_bc_icms_proprio já está NUMERIC(5,2) ou não existe';
  END;
END $$;

-- ICMS ST
DO $$
BEGIN
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN aliquota_icms_st TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'aliquota_icms_st já está NUMERIC(5,2) ou não existe';
  END;
  
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN aliquota_fcp_st TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'aliquota_fcp_st já está NUMERIC(5,2) ou não existe';
  END;
  
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN reducao_bc_st TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'reducao_bc_st já está NUMERIC(5,2) ou não existe';
  END;
END $$;

-- ICMS DIFAL
DO $$
BEGIN
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN aliquota_interestadual TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'aliquota_interestadual já está NUMERIC(5,2) ou não existe';
  END;
  
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN aliquota_uf_destino TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'aliquota_uf_destino já está NUMERIC(5,2) ou não existe';
  END;
  
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN aliquota_fcp_uf_destino TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'aliquota_fcp_uf_destino já está NUMERIC(5,2) ou não existe';
  END;
END $$;

-- Desoneração
DO $$
BEGIN
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN aliquota_desoneracao TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'aliquota_desoneracao já está NUMERIC(5,2) ou não existe';
  END;
END $$;

-- PIS
DO $$
BEGIN
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN aliquota_pis TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'aliquota_pis já está NUMERIC(5,2) ou não existe';
  END;
  
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN reducao_bc_pis TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'reducao_bc_pis já está NUMERIC(5,2) ou não existe';
  END;
END $$;

-- COFINS
DO $$
BEGIN
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN aliquota_cofins TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'aliquota_cofins já está NUMERIC(5,2) ou não existe';
  END;
  
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN reducao_bc_cofins TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'reducao_bc_cofins já está NUMERIC(5,2) ou não existe';
  END;
END $$;

-- IPI
DO $$
BEGIN
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN aliquota_ipi TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'aliquota_ipi já está NUMERIC(5,2) ou não existe';
  END;
  
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN reducao_bc_ipi TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'reducao_bc_ipi já está NUMERIC(5,2) ou não existe';
  END;
END $$;

-- Outras retenções
DO $$
BEGIN
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN aliquota_csll TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'aliquota_csll já está NUMERIC(5,2) ou não existe';
  END;
  
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN aliquota_ir TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'aliquota_ir já está NUMERIC(5,2) ou não existe';
  END;
  
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN aliquota_inss TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'aliquota_inss já está NUMERIC(5,2) ou não existe';
  END;
  
  BEGIN
    ALTER TABLE regras_tributacao ALTER COLUMN aliquota_outras_retencoes TYPE NUMERIC(5,2);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'aliquota_outras_retencoes já está NUMERIC(5,2) ou não existe';
  END;
END $$;

-- Passo 4: Recriar view
CREATE OR REPLACE VIEW vw_regras_tributacao_ordenadas AS
SELECT 
  rt.*,
  (CASE WHEN rt.ncm IS NOT NULL THEN 100 ELSE 0 END +
   CASE WHEN rt.categoria IS NOT NULL THEN 50 ELSE 0 END +
   CASE WHEN rt.cfop_saida IS NOT NULL THEN 25 ELSE 0 END +
   CASE WHEN rt.cfop_entrada IS NOT NULL THEN 25 ELSE 0 END +
   CASE WHEN rt.tipo_contribuinte IS NOT NULL THEN 10 ELSE 0 END) as prioridade_calculada
FROM regras_tributacao rt
WHERE rt.ativo = true
ORDER BY prioridade_calculada DESC, rt.created_at DESC;

-- Passo 5: Verificação OBRIGATÓRIA
SELECT 
  column_name, 
  data_type,
  COALESCE(character_maximum_length::text, 
           CONCAT('NUMERIC(', numeric_precision, ',', numeric_scale, ')')) as tipo_completo
FROM information_schema.columns
WHERE table_name = 'regras_tributacao' 
  AND (column_name LIKE '%aliquota%' OR column_name LIKE '%reducao%' OR column_name LIKE '%diferimento%')
  AND data_type = 'numeric'
ORDER BY column_name;

-- Se ainda aparecer NUMERIC(5,4) acima, o script NÃO FUNCIONOU!
