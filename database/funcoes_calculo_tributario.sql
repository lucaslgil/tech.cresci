-- =====================================================
-- FUNÇÕES DE CÁLCULO TRIBUTÁRIO COMPLETO
-- Suporte para sistema antigo e novo (Reforma 2026)
-- Data: 13/01/2026
-- =====================================================

-- =====================================================
-- 1. FUNÇÃO: DETERMINAR CST/CSOSN DE ICMS
-- =====================================================

CREATE OR REPLACE FUNCTION determinar_cst_icms(
  p_regime_tributario VARCHAR(20),
  p_cfop VARCHAR(5),
  p_uf_origem VARCHAR(2),
  p_uf_destino VARCHAR(2)
)
RETURNS VARCHAR(4) AS $$
BEGIN
  -- Simples Nacional usa CSOSN
  IF p_regime_tributario = 'SIMPLES' THEN
    -- Operação interna
    IF p_uf_origem = p_uf_destino THEN
      RETURN '102'; -- Tributada pelo Simples sem permissão de crédito
    ELSE
      RETURN '400'; -- Não tributada pelo Simples
    END IF;
  END IF;
  
  -- Regime Normal usa CST
  -- Simplificação: retornar CST genérico
  RETURN '00'; -- Tributada integralmente
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. FUNÇÃO: CALCULAR ICMS NORMAL
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_icms(
  p_valor_base NUMERIC,
  p_uf_origem VARCHAR(2),
  p_uf_destino VARCHAR(2),
  p_cfop VARCHAR(5)
)
RETURNS TABLE (
  base_calculo NUMERIC,
  aliquota NUMERIC,
  valor_icms NUMERIC,
  cst VARCHAR(3)
) AS $$
DECLARE
  v_aliquota NUMERIC;
  v_base_calculo NUMERIC;
  v_valor_icms NUMERIC;
BEGIN
  v_base_calculo := p_valor_base;
  
  -- Determinar alíquota (simplificado)
  IF p_uf_origem = p_uf_destino THEN
    v_aliquota := 18.00; -- Alíquota interna média
  ELSE
    v_aliquota := 12.00; -- Alíquota interestadual
  END IF;
  
  v_valor_icms := ROUND(v_base_calculo * v_aliquota / 100, 2);
  
  RETURN QUERY SELECT
    v_base_calculo,
    v_aliquota,
    v_valor_icms,
    '00'::VARCHAR(3) as cst;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. FUNÇÃO: CALCULAR PIS/COFINS
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_pis_cofins(
  p_valor_base NUMERIC,
  p_regime_tributario VARCHAR(20)
)
RETURNS TABLE (
  base_calculo_pis NUMERIC,
  aliquota_pis NUMERIC,
  valor_pis NUMERIC,
  base_calculo_cofins NUMERIC,
  aliquota_cofins NUMERIC,
  valor_cofins NUMERIC
) AS $$
DECLARE
  v_aliquota_pis NUMERIC;
  v_aliquota_cofins NUMERIC;
BEGIN
  -- Alíquotas não-cumulativo (Lucro Real)
  IF p_regime_tributario = 'REAL' THEN
    v_aliquota_pis := 1.65;
    v_aliquota_cofins := 7.60;
  -- Alíquotas cumulativo (Lucro Presumido/Simples)
  ELSE
    v_aliquota_pis := 0.65;
    v_aliquota_cofins := 3.00;
  END IF;
  
  RETURN QUERY SELECT
    p_valor_base as base_calculo_pis,
    v_aliquota_pis as aliquota_pis,
    ROUND(p_valor_base * v_aliquota_pis / 100, 2) as valor_pis,
    p_valor_base as base_calculo_cofins,
    v_aliquota_cofins as aliquota_cofins,
    ROUND(p_valor_base * v_aliquota_cofins / 100, 2) as valor_cofins;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FUNÇÃO: CALCULAR IBS/CBS (REFORMA 2026)
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_ibs_cbs(
  p_valor_base NUMERIC,
  p_ncm VARCHAR(8),
  p_ano INTEGER
)
RETURNS TABLE (
  base_calculo_ibs NUMERIC,
  aliquota_ibs NUMERIC,
  valor_ibs NUMERIC,
  base_calculo_cbs NUMERIC,
  aliquota_cbs NUMERIC,
  valor_cbs NUMERIC,
  percentual_aplicado NUMERIC
) AS $$
DECLARE
  v_cronograma reforma_cronograma_transicao%ROWTYPE;
  v_aliquota_ibs NUMERIC;
  v_aliquota_cbs NUMERIC;
BEGIN
  -- Buscar cronograma do ano
  SELECT * INTO v_cronograma
  FROM reforma_cronograma_transicao
  WHERE ano = p_ano;
  
  -- Se não encontrou, usar dados mais recentes
  IF v_cronograma.id IS NULL THEN
    SELECT * INTO v_cronograma
    FROM reforma_cronograma_transicao
    WHERE ano <= p_ano
    ORDER BY ano DESC
    LIMIT 1;
  END IF;
  
  -- Buscar alíquotas por NCM (pode ter exceções)
  SELECT 
    COALESCE(aliquota_ibs, 0.2700),
    COALESCE(aliquota_cbs, 0.1200)
  INTO v_aliquota_ibs, v_aliquota_cbs
  FROM buscar_aliquotas_reforma(p_ncm, CURRENT_DATE);
  
  -- Calcular valores proporcionais ao cronograma
  RETURN QUERY SELECT
    p_valor_base as base_calculo_ibs,
    v_aliquota_ibs as aliquota_ibs,
    ROUND(p_valor_base * v_aliquota_ibs * (v_cronograma.percentual_ibs / 100), 2) as valor_ibs,
    p_valor_base as base_calculo_cbs,
    v_aliquota_cbs as aliquota_cbs,
    ROUND(p_valor_base * v_aliquota_cbs * (v_cronograma.percentual_cbs / 100), 2) as valor_cbs,
    v_cronograma.percentual_ibs as percentual_aplicado;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. FUNÇÃO PRINCIPAL: CALCULAR TRIBUTAÇÃO COMPLETA
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_tributacao_completa(
  p_valor_base NUMERIC,
  p_ncm VARCHAR(8),
  p_cfop VARCHAR(5),
  p_uf_origem VARCHAR(2),
  p_uf_destino VARCHAR(2),
  p_regime_tributario VARCHAR(20),
  p_ano INTEGER DEFAULT 2026
)
RETURNS TABLE (
  -- Sistema Antigo
  base_calculo_icms NUMERIC,
  aliquota_icms NUMERIC,
  valor_icms NUMERIC,
  valor_pis NUMERIC,
  valor_cofins NUMERIC,
  total_impostos_antigos NUMERIC,
  percentual_antigo NUMERIC,
  
  -- Sistema Novo
  base_calculo_ibs NUMERIC,
  aliquota_ibs NUMERIC,
  valor_ibs NUMERIC,
  base_calculo_cbs NUMERIC,
  aliquota_cbs NUMERIC,
  valor_cbs NUMERIC,
  total_impostos_novos NUMERIC,
  percentual_novo NUMERIC,
  
  -- Totais
  total_tributos NUMERIC,
  carga_tributaria_percentual NUMERIC
) AS $$
DECLARE
  v_icms RECORD;
  v_pis_cofins RECORD;
  v_ibs_cbs RECORD;
  v_cronograma reforma_cronograma_transicao%ROWTYPE;
  v_total_antigos NUMERIC;
  v_total_novos NUMERIC;
  v_total_geral NUMERIC;
BEGIN
  -- Buscar cronograma
  SELECT * INTO v_cronograma
  FROM reforma_cronograma_transicao
  WHERE ano = p_ano
  LIMIT 1;
  
  -- Calcular ICMS
  SELECT * INTO v_icms
  FROM calcular_icms(p_valor_base, p_uf_origem, p_uf_destino, p_cfop);
  
  -- Ajustar ICMS pelo cronograma de transição
  v_icms.valor_icms := ROUND(v_icms.valor_icms * (COALESCE(v_cronograma.percentual_icms, 100) / 100), 2);
  
  -- Calcular PIS/COFINS
  SELECT * INTO v_pis_cofins
  FROM calcular_pis_cofins(p_valor_base, p_regime_tributario);
  
  -- Ajustar PIS/COFINS pelo cronograma
  v_pis_cofins.valor_pis := ROUND(v_pis_cofins.valor_pis * (COALESCE(v_cronograma.percentual_pis, 100) / 100), 2);
  v_pis_cofins.valor_cofins := ROUND(v_pis_cofins.valor_cofins * (COALESCE(v_cronograma.percentual_cofins, 100) / 100), 2);
  
  -- Calcular IBS/CBS
  SELECT * INTO v_ibs_cbs
  FROM calcular_ibs_cbs(p_valor_base, p_ncm, p_ano);
  
  -- Totais
  v_total_antigos := v_icms.valor_icms + v_pis_cofins.valor_pis + v_pis_cofins.valor_cofins;
  v_total_novos := v_ibs_cbs.valor_ibs + v_ibs_cbs.valor_cbs;
  v_total_geral := v_total_antigos + v_total_novos;
  
  RETURN QUERY SELECT
    -- Sistema Antigo
    v_icms.base_calculo,
    v_icms.aliquota,
    v_icms.valor_icms,
    v_pis_cofins.valor_pis,
    v_pis_cofins.valor_cofins,
    v_total_antigos,
    COALESCE(v_cronograma.percentual_icms, 100.00),
    
    -- Sistema Novo
    v_ibs_cbs.base_calculo_ibs,
    v_ibs_cbs.aliquota_ibs,
    v_ibs_cbs.valor_ibs,
    v_ibs_cbs.base_calculo_cbs,
    v_ibs_cbs.aliquota_cbs,
    v_ibs_cbs.valor_cbs,
    v_total_novos,
    COALESCE(v_cronograma.percentual_ibs, 1.00),
    
    -- Totais
    v_total_geral,
    ROUND((v_total_geral / p_valor_base) * 100, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_tributacao_completa IS 'Calcula toda a tributação (sistema antigo + novo) considerando transição';

-- =====================================================
-- 6. FUNÇÃO: SIMULAR TRIBUTAÇÃO EM DIFERENTES ANOS
-- =====================================================

CREATE OR REPLACE FUNCTION simular_tributacao_transicao(
  p_valor_base NUMERIC,
  p_ncm VARCHAR(8)
)
RETURNS TABLE (
  ano INTEGER,
  valor_icms NUMERIC,
  valor_pis NUMERIC,
  valor_cofins NUMERIC,
  total_antigos NUMERIC,
  valor_ibs NUMERIC,
  valor_cbs NUMERIC,
  total_novos NUMERIC,
  total_geral NUMERIC,
  carga_tributaria NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.ano,
    ROUND(p_valor_base * 0.18 * (c.percentual_icms / 100), 2) as valor_icms,
    ROUND(p_valor_base * 0.0165 * (c.percentual_pis / 100), 2) as valor_pis,
    ROUND(p_valor_base * 0.076 * (c.percentual_cofins / 100), 2) as valor_cofins,
    ROUND(
      (p_valor_base * 0.18 * (c.percentual_icms / 100)) +
      (p_valor_base * 0.0165 * (c.percentual_pis / 100)) +
      (p_valor_base * 0.076 * (c.percentual_cofins / 100)), 2
    ) as total_antigos,
    ROUND(p_valor_base * 0.27 * (c.percentual_ibs / 100), 2) as valor_ibs,
    ROUND(p_valor_base * 0.12 * (c.percentual_cbs / 100), 2) as valor_cbs,
    ROUND(
      (p_valor_base * 0.27 * (c.percentual_ibs / 100)) +
      (p_valor_base * 0.12 * (c.percentual_cbs / 100)), 2
    ) as total_novos,
    ROUND(
      (p_valor_base * 0.18 * (c.percentual_icms / 100)) +
      (p_valor_base * 0.0165 * (c.percentual_pis / 100)) +
      (p_valor_base * 0.076 * (c.percentual_cofins / 100)) +
      (p_valor_base * 0.27 * (c.percentual_ibs / 100)) +
      (p_valor_base * 0.12 * (c.percentual_cbs / 100)), 2
    ) as total_geral,
    ROUND((
      ((p_valor_base * 0.18 * (c.percentual_icms / 100)) +
      (p_valor_base * 0.0165 * (c.percentual_pis / 100)) +
      (p_valor_base * 0.076 * (c.percentual_cofins / 100)) +
      (p_valor_base * 0.27 * (c.percentual_ibs / 100)) +
      (p_valor_base * 0.12 * (c.percentual_cbs / 100))) / p_valor_base
    ) * 100, 2) as carga_tributaria
  FROM reforma_cronograma_transicao c
  ORDER BY c.ano;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION simular_tributacao_transicao IS 'Simula a carga tributária ao longo dos anos de transição (2026-2033)';

-- =====================================================
-- EXEMPLO DE USO
-- =====================================================
-- 
-- SELECT * FROM calcular_tributacao_completa(
--   1000.00,  -- valor base
--   '04021000',  -- NCM (leite em pó)
--   '5102',   -- CFOP
--   'SP',     -- UF origem
--   'RJ',     -- UF destino
--   'SIMPLES', -- Regime tributário
--   2026      -- Ano
-- );
-- 
-- SELECT * FROM simular_tributacao_transicao(1000.00, '04021000');
-- 
-- =====================================================
