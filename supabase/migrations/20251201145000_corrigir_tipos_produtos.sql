-- =====================================================
-- MIGRATION: Corrigir tipos de dados da tabela produtos
-- Data: 01/12/2025
-- =====================================================

-- Dropar view temporariamente
DROP VIEW IF EXISTS public.vw_produtos_estoque CASCADE;

-- Alterar tipos de colunas para corresponder aos tipos esperados
ALTER TABLE public.produtos 
  ALTER COLUMN preco_custo TYPE NUMERIC(10,3),
  ALTER COLUMN preco_venda TYPE NUMERIC(10,3),
  ALTER COLUMN margem_lucro TYPE NUMERIC(10,3),
  ALTER COLUMN aliquota_icms TYPE NUMERIC(10,3),
  ALTER COLUMN reducao_bc_icms TYPE NUMERIC(10,3),
  ALTER COLUMN mva_st TYPE NUMERIC(10,3),
  ALTER COLUMN aliquota_icms_st TYPE NUMERIC(10,3),
  ALTER COLUMN reducao_bc_icms_st TYPE NUMERIC(10,3),
  ALTER COLUMN aliquota_pis TYPE NUMERIC(10,3),
  ALTER COLUMN aliquota_cofins TYPE NUMERIC(10,3),
  ALTER COLUMN aliquota_ipi TYPE NUMERIC(10,3),
  ALTER COLUMN desconto_maximo TYPE NUMERIC(10,3);

-- Atualizar histórico de preços também
ALTER TABLE public.produtos_precos_historico
  ALTER COLUMN preco_custo_anterior TYPE NUMERIC(10,3),
  ALTER COLUMN preco_custo_novo TYPE NUMERIC(10,3),
  ALTER COLUMN preco_venda_anterior TYPE NUMERIC(10,3),
  ALTER COLUMN preco_venda_novo TYPE NUMERIC(10,3);

-- Recriar view com tipos corretos
CREATE OR REPLACE VIEW public.vw_produtos_estoque AS
SELECT 
  p.*,
  CASE 
    WHEN p.estoque_atual <= 0 THEN 'SEM_ESTOQUE'
    WHEN p.estoque_atual < p.estoque_minimo THEN 'ESTOQUE_BAIXO'
    WHEN p.estoque_atual > p.estoque_maximo THEN 'ESTOQUE_ALTO'
    ELSE 'ESTOQUE_NORMAL'
  END AS status_estoque
FROM public.produtos p;
