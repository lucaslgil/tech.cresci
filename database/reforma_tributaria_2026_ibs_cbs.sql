-- =====================================================
-- REFORMA TRIBUTÁRIA 2026 - IBS E CBS
-- Atualização do sistema fiscal para nova legislação
-- Data: 13/01/2026
-- =====================================================
-- 
-- CONTEXTO DA REFORMA TRIBUTÁRIA 2026:
-- 
-- 1. IBS (Imposto sobre Bens e Serviços) - Substitui ICMS e ISS
--    - Alíquota única de aproximadamente 27%
--    - Não-cumulativo (crédito pleno sobre insumos)
--    - Base ampla (bens e serviços)
--    - Arrecadação no destino
--
-- 2. CBS (Contribuição sobre Bens e Serviços) - Substitui PIS/COFINS
--    - Alíquota única de aproximadamente 12%
--    - Não-cumulativo
--    - Base ampla
--
-- 3. PERÍODO DE TRANSIÇÃO (2026-2032):
--    - 2026-2027: Convivência dos dois sistemas (teste)
--    - 2027-2032: Redução gradual de ICMS/ISS/PIS/COFINS
--    - 2033: Apenas IBS/CBS em vigor
--
-- =====================================================

-- =====================================================
-- 1. ADICIONAR CAMPOS IBS/CBS À TABELA DE PRODUTOS
-- =====================================================

ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS aliquota_ibs NUMERIC(5,4) DEFAULT 0.0000,
  ADD COLUMN IF NOT EXISTS aliquota_cbs NUMERIC(5,4) DEFAULT 0.0000,
  ADD COLUMN IF NOT EXISTS regime_transicao VARCHAR(20) DEFAULT 'MISTO', -- MISTO, ANTIGO, NOVO
  ADD COLUMN IF NOT EXISTS excecao_ibs BOOLEAN DEFAULT FALSE, -- Para regimes especiais
  ADD COLUMN IF NOT EXISTS excecao_cbs BOOLEAN DEFAULT FALSE, -- Para regimes especiais
  ADD COLUMN IF NOT EXISTS aliquota_ibs_reduzida NUMERIC(5,4), -- Para produtos com alíquota reduzida
  ADD COLUMN IF NOT EXISTS aliquota_cbs_reduzida NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS cst_ibs VARCHAR(3), -- Código de Situação Tributária do IBS
  ADD COLUMN IF NOT EXISTS cst_cbs VARCHAR(3); -- Código de Situação Tributária da CBS

CREATE INDEX IF NOT EXISTS idx_produtos_ibs ON produtos(aliquota_ibs);
CREATE INDEX IF NOT EXISTS idx_produtos_cbs ON produtos(aliquota_cbs);
CREATE INDEX IF NOT EXISTS idx_produtos_regime_transicao ON produtos(regime_transicao);

COMMENT ON COLUMN produtos.aliquota_ibs IS 'Alíquota do IBS (Imposto sobre Bens e Serviços) - Reforma 2026';
COMMENT ON COLUMN produtos.aliquota_cbs IS 'Alíquota da CBS (Contribuição sobre Bens e Serviços) - Reforma 2026';
COMMENT ON COLUMN produtos.regime_transicao IS 'MISTO (ambos sistemas), ANTIGO (só ICMS/ISS/PIS/COFINS), NOVO (só IBS/CBS)';
COMMENT ON COLUMN produtos.excecao_ibs IS 'Produto com regime especial ou alíquota diferenciada de IBS';
COMMENT ON COLUMN produtos.excecao_cbs IS 'Produto com regime especial ou alíquota diferenciada de CBS';

-- =====================================================
-- 2. ADICIONAR CAMPOS IBS/CBS À TABELA REGRAS_TRIBUTACAO
-- =====================================================

ALTER TABLE regras_tributacao
  ADD COLUMN IF NOT EXISTS aliquota_ibs NUMERIC(5,4) DEFAULT 0.2700, -- 27% padrão
  ADD COLUMN IF NOT EXISTS aliquota_cbs NUMERIC(5,4) DEFAULT 0.1200, -- 12% padrão
  ADD COLUMN IF NOT EXISTS cst_ibs VARCHAR(3) DEFAULT '00', -- 00=Tributado integralmente
  ADD COLUMN IF NOT EXISTS cst_cbs VARCHAR(3) DEFAULT '00',
  ADD COLUMN IF NOT EXISTS base_calculo_ibs_diferenciada BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS base_calculo_cbs_diferenciada BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reducao_base_ibs NUMERIC(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS reducao_base_cbs NUMERIC(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS percentual_diferimento_ibs NUMERIC(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS percentual_diferimento_cbs NUMERIC(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS ano_vigencia INTEGER DEFAULT 2026;

CREATE INDEX IF NOT EXISTS idx_regras_ano_vigencia ON regras_tributacao(ano_vigencia);

COMMENT ON COLUMN regras_tributacao.aliquota_ibs IS 'Alíquota IBS padrão: 27% (0.2700)';
COMMENT ON COLUMN regras_tributacao.aliquota_cbs IS 'Alíquota CBS padrão: 12% (0.1200)';
COMMENT ON COLUMN regras_tributacao.ano_vigencia IS 'Ano de vigência da regra (para controlar transição)';

-- =====================================================
-- 3. ATUALIZAR TABELA NOTAS_FISCAIS PARA IBS/CBS
-- =====================================================

ALTER TABLE notas_fiscais
  ADD COLUMN IF NOT EXISTS valor_ibs NUMERIC(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS valor_cbs NUMERIC(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS base_calculo_ibs NUMERIC(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS base_calculo_cbs NUMERIC(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS regime_tributario_nota VARCHAR(20) DEFAULT 'TRANSICAO', -- ANTIGO, NOVO, TRANSICAO
  ADD COLUMN IF NOT EXISTS ano_competencia INTEGER DEFAULT 2026;

CREATE INDEX IF NOT EXISTS idx_notas_regime_tributario ON notas_fiscais(regime_tributario_nota);
CREATE INDEX IF NOT EXISTS idx_notas_ano_competencia ON notas_fiscais(ano_competencia);

COMMENT ON COLUMN notas_fiscais.valor_ibs IS 'Total do IBS na nota fiscal';
COMMENT ON COLUMN notas_fiscais.valor_cbs IS 'Total da CBS na nota fiscal';
COMMENT ON COLUMN notas_fiscais.regime_tributario_nota IS 'Sistema tributário usado: ANTIGO, NOVO ou TRANSICAO (ambos)';

-- =====================================================
-- 4. ATUALIZAR TABELA NOTAS_FISCAIS_ITENS PARA IBS/CBS
-- =====================================================

ALTER TABLE notas_fiscais_itens
  ADD COLUMN IF NOT EXISTS cst_ibs VARCHAR(3),
  ADD COLUMN IF NOT EXISTS base_calculo_ibs NUMERIC(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS aliquota_ibs NUMERIC(5,4) DEFAULT 0.0000,
  ADD COLUMN IF NOT EXISTS valor_ibs NUMERIC(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS cst_cbs VARCHAR(3),
  ADD COLUMN IF NOT EXISTS base_calculo_cbs NUMERIC(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS aliquota_cbs NUMERIC(5,4) DEFAULT 0.0000,
  ADD COLUMN IF NOT EXISTS valor_cbs NUMERIC(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS credito_ibs NUMERIC(15,2) DEFAULT 0.00, -- Crédito de IBS sobre insumos
  ADD COLUMN IF NOT EXISTS credito_cbs NUMERIC(15,2) DEFAULT 0.00, -- Crédito de CBS sobre insumos
  ADD COLUMN IF NOT EXISTS diferimento_ibs NUMERIC(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS diferimento_cbs NUMERIC(5,2) DEFAULT 0.00;

COMMENT ON COLUMN notas_fiscais_itens.cst_ibs IS 'Código de Situação Tributária do IBS';
COMMENT ON COLUMN notas_fiscais_itens.cst_cbs IS 'Código de Situação Tributária da CBS';
COMMENT ON COLUMN notas_fiscais_itens.credito_ibs IS 'Crédito de IBS apropriado (sistema não-cumulativo)';
COMMENT ON COLUMN notas_fiscais_itens.credito_cbs IS 'Crédito de CBS apropriado (sistema não-cumulativo)';

-- =====================================================
-- 5. TABELA DE ALÍQUOTAS IBS/CBS POR NCM (EXCEÇÕES)
-- =====================================================

CREATE TABLE IF NOT EXISTS reforma_aliquotas_ncm (
  id BIGSERIAL PRIMARY KEY,
  ncm VARCHAR(8) NOT NULL,
  descricao_ncm TEXT,
  
  -- Alíquotas
  aliquota_ibs_padrao NUMERIC(5,4) DEFAULT 0.2700,
  aliquota_cbs_padrao NUMERIC(5,4) DEFAULT 0.1200,
  aliquota_ibs_reduzida NUMERIC(5,4),
  aliquota_cbs_reduzida NUMERIC(5,4),
  
  -- Regime especial
  tem_aliquota_diferenciada BOOLEAN DEFAULT FALSE,
  motivo_diferenciacao TEXT,
  
  -- Exemplos: Cesta básica, medicamentos, etc.
  tipo_beneficio VARCHAR(50), -- CESTA_BASICA, MEDICAMENTO, EDUCACAO, SAUDE, ISENCAO
  
  -- Vigência
  data_inicio DATE DEFAULT '2026-01-01',
  data_fim DATE,
  ativo BOOLEAN DEFAULT TRUE,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_ncm_vigencia UNIQUE (ncm, data_inicio)
);

CREATE INDEX IF NOT EXISTS idx_reforma_ncm ON reforma_aliquotas_ncm(ncm);
CREATE INDEX IF NOT EXISTS idx_reforma_tipo_beneficio ON reforma_aliquotas_ncm(tipo_beneficio);
CREATE INDEX IF NOT EXISTS idx_reforma_vigencia ON reforma_aliquotas_ncm(data_inicio, data_fim);

COMMENT ON TABLE reforma_aliquotas_ncm IS 'Alíquotas diferenciadas de IBS/CBS por NCM (exceções e regimes especiais)';

-- =====================================================
-- 6. TABELA DE CRONOGRAMA DA TRANSIÇÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS reforma_cronograma_transicao (
  id BIGSERIAL PRIMARY KEY,
  ano INTEGER NOT NULL UNIQUE,
  
  -- Percentuais do Sistema ANTIGO (ICMS, ISS, PIS, COFINS)
  percentual_icms NUMERIC(5,2) DEFAULT 100.00,
  percentual_iss NUMERIC(5,2) DEFAULT 100.00,
  percentual_pis NUMERIC(5,2) DEFAULT 100.00,
  percentual_cofins NUMERIC(5,2) DEFAULT 100.00,
  
  -- Percentuais do Sistema NOVO (IBS, CBS)
  percentual_ibs NUMERIC(5,2) DEFAULT 0.00,
  percentual_cbs NUMERIC(5,2) DEFAULT 0.00,
  
  -- Fase da transição
  fase VARCHAR(50) NOT NULL, -- TESTE, TRANSICAO, COMPLETA
  descricao TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir cronograma oficial da reforma
INSERT INTO reforma_cronograma_transicao (ano, percentual_icms, percentual_iss, percentual_pis, percentual_cofins, percentual_ibs, percentual_cbs, fase, descricao) VALUES
  (2026, 100.00, 100.00, 100.00, 100.00, 1.00, 1.00, 'TESTE', 'Teste em paralelo - IBS/CBS 1% sobre operações piloto'),
  (2027, 100.00, 100.00, 100.00, 100.00, 10.00, 10.00, 'TESTE', 'Teste ampliado - IBS/CBS 10%'),
  (2028, 90.00, 90.00, 90.00, 90.00, 10.00, 10.00, 'TRANSICAO', 'Início da transição - Redução de 10% no sistema antigo'),
  (2029, 80.00, 80.00, 80.00, 80.00, 20.00, 20.00, 'TRANSICAO', 'Transição 20%'),
  (2030, 60.00, 60.00, 60.00, 60.00, 40.00, 40.00, 'TRANSICAO', 'Transição 40%'),
  (2031, 40.00, 40.00, 40.00, 40.00, 60.00, 60.00, 'TRANSICAO', 'Transição 60%'),
  (2032, 20.00, 20.00, 20.00, 20.00, 80.00, 80.00, 'TRANSICAO', 'Transição 80%'),
  (2033, 0.00, 0.00, 0.00, 0.00, 100.00, 100.00, 'COMPLETA', 'Sistema novo completo - Apenas IBS/CBS')
ON CONFLICT (ano) DO NOTHING;

COMMENT ON TABLE reforma_cronograma_transicao IS 'Cronograma de transição gradual do sistema tributário (2026-2033)';

-- =====================================================
-- 7. FUNÇÃO: CALCULAR IBS E CBS CONFORME ANO
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_impostos_reforma(
  p_valor_base NUMERIC,
  p_aliquota_ibs NUMERIC,
  p_aliquota_cbs NUMERIC,
  p_ano INTEGER
)
RETURNS TABLE (
  valor_ibs NUMERIC,
  valor_cbs NUMERIC,
  valor_icms_transitorio NUMERIC,
  valor_iss_transitorio NUMERIC,
  valor_pis_transitorio NUMERIC,
  valor_cofins_transitorio NUMERIC
) AS $$
DECLARE
  v_cronograma reforma_cronograma_transicao%ROWTYPE;
  v_valor_ibs_calculado NUMERIC;
  v_valor_cbs_calculado NUMERIC;
BEGIN
  -- Buscar cronograma do ano
  SELECT * INTO v_cronograma
  FROM reforma_cronograma_transicao
  WHERE ano = p_ano;
  
  -- Se não encontrou, usar ano mais recente disponível
  IF v_cronograma.id IS NULL THEN
    SELECT * INTO v_cronograma
    FROM reforma_cronograma_transicao
    WHERE ano <= p_ano
    ORDER BY ano DESC
    LIMIT 1;
  END IF;
  
  -- Calcular IBS e CBS proporcionais ao cronograma
  v_valor_ibs_calculado := p_valor_base * p_aliquota_ibs * (v_cronograma.percentual_ibs / 100.00);
  v_valor_cbs_calculado := p_valor_base * p_aliquota_cbs * (v_cronograma.percentual_cbs / 100.00);
  
  RETURN QUERY SELECT
    ROUND(v_valor_ibs_calculado, 2),
    ROUND(v_valor_cbs_calculado, 2),
    ROUND(p_valor_base * 0.18 * (v_cronograma.percentual_icms / 100.00), 2), -- ICMS aproximado 18%
    ROUND(p_valor_base * 0.05 * (v_cronograma.percentual_iss / 100.00), 2),   -- ISS aproximado 5%
    ROUND(p_valor_base * 0.0165 * (v_cronograma.percentual_pis / 100.00), 2), -- PIS aproximado 1.65%
    ROUND(p_valor_base * 0.0760 * (v_cronograma.percentual_cofins / 100.00), 2); -- COFINS aproximado 7.6%
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_impostos_reforma IS 'Calcula IBS/CBS e impostos antigos proporcionalmente ao cronograma de transição';

-- =====================================================
-- 8. FUNÇÃO: BUSCAR ALÍQUOTA IBS/CBS POR NCM
-- =====================================================

CREATE OR REPLACE FUNCTION buscar_aliquotas_reforma(
  p_ncm VARCHAR(8),
  p_data DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  aliquota_ibs NUMERIC,
  aliquota_cbs NUMERIC,
  tem_diferenciacao BOOLEAN,
  tipo_beneficio VARCHAR
) AS $$
DECLARE
  v_aliquota_ncm reforma_aliquotas_ncm%ROWTYPE;
BEGIN
  -- Buscar alíquota específica por NCM
  SELECT * INTO v_aliquota_ncm
  FROM reforma_aliquotas_ncm
  WHERE ncm = p_ncm
    AND ativo = TRUE
    AND data_inicio <= p_data
    AND (data_fim IS NULL OR data_fim >= p_data)
  ORDER BY data_inicio DESC
  LIMIT 1;
  
  -- Se encontrou alíquota diferenciada
  IF v_aliquota_ncm.id IS NOT NULL THEN
    RETURN QUERY SELECT
      COALESCE(v_aliquota_ncm.aliquota_ibs_reduzida, v_aliquota_ncm.aliquota_ibs_padrao),
      COALESCE(v_aliquota_ncm.aliquota_cbs_reduzida, v_aliquota_ncm.aliquota_cbs_padrao),
      v_aliquota_ncm.tem_aliquota_diferenciada,
      v_aliquota_ncm.tipo_beneficio;
  ELSE
    -- Retornar alíquotas padrão
    RETURN QUERY SELECT
      0.2700::NUMERIC, -- 27% IBS padrão
      0.1200::NUMERIC, -- 12% CBS padrão
      FALSE,
      NULL::VARCHAR;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION buscar_aliquotas_reforma IS 'Busca alíquotas de IBS/CBS por NCM considerando exceções e benefícios';

-- =====================================================
-- 9. INSERIR ALÍQUOTAS DIFERENCIADAS (EXEMPLOS)
-- =====================================================

INSERT INTO reforma_aliquotas_ncm (ncm, descricao_ncm, aliquota_ibs_padrao, aliquota_cbs_padrao, aliquota_ibs_reduzida, aliquota_cbs_reduzida, tem_aliquota_diferenciada, tipo_beneficio, motivo_diferenciacao) VALUES
  -- Cesta Básica (Alíquota Zero)
  ('04021000', 'Leite em pó', 0.2700, 0.1200, 0.0000, 0.0000, TRUE, 'CESTA_BASICA', 'Produto da cesta básica - alíquota zero'),
  ('19012000', 'Farinha de trigo', 0.2700, 0.1200, 0.0000, 0.0000, TRUE, 'CESTA_BASICA', 'Produto da cesta básica - alíquota zero'),
  ('10061010', 'Arroz', 0.2700, 0.1200, 0.0000, 0.0000, TRUE, 'CESTA_BASICA', 'Produto da cesta básica - alíquota zero'),
  ('07131010', 'Feijão', 0.2700, 0.1200, 0.0000, 0.0000, TRUE, 'CESTA_BASICA', 'Produto da cesta básica - alíquota zero'),
  
  -- Medicamentos (Alíquota Reduzida 60%)
  ('30049099', 'Medicamentos diversos', 0.2700, 0.1200, 0.1620, 0.0720, TRUE, 'MEDICAMENTO', 'Alíquota reduzida de 60% para medicamentos'),
  
  -- Educação (Alíquota Zero)
  ('49011000', 'Livros didáticos', 0.2700, 0.1200, 0.0000, 0.0000, TRUE, 'EDUCACAO', 'Material didático - alíquota zero'),
  
  -- Saúde (Alíquota Reduzida)
  ('90189099', 'Equipamentos médicos', 0.2700, 0.1200, 0.1350, 0.0600, TRUE, 'SAUDE', 'Equipamentos de saúde - alíquota reduzida de 50%')
ON CONFLICT (ncm, data_inicio) DO NOTHING;

-- =====================================================
-- 10. VIEW: PRODUTOS COM CÁLCULO COMPLETO DE IMPOSTOS
-- =====================================================
-- Esta VIEW será comentada pois depende da estrutura específica da tabela produtos
-- Descomente e ajuste conforme as colunas reais da sua tabela produtos

/*
CREATE OR REPLACE VIEW vw_produtos_tributacao_completa AS
SELECT 
  p.*,
  
  -- Alíquotas efetivas (com busca por NCM se não definidas)
  COALESCE(p.aliquota_ibs, (SELECT aliquota_ibs FROM buscar_aliquotas_reforma(p.ncm))) as aliquota_ibs_efetiva,
  COALESCE(p.aliquota_cbs, (SELECT aliquota_cbs FROM buscar_aliquotas_reforma(p.ncm))) as aliquota_cbs_efetiva,
  
  -- Cálculos de exemplo sobre preço de venda (Sistema Antigo)
  ROUND(p.preco_venda * COALESCE(p.aliquota_icms, 18.00) / 100, 2) as valor_icms_exemplo,
  ROUND(p.preco_venda * COALESCE(p.aliquota_pis, 1.65) / 100, 2) as valor_pis_exemplo,
  ROUND(p.preco_venda * COALESCE(p.aliquota_cofins, 7.60) / 100, 2) as valor_cofins_exemplo,
  
  -- Cálculos de exemplo sobre preço de venda (Sistema Novo)
  ROUND(p.preco_venda * COALESCE(p.aliquota_ibs, 0.27), 2) as valor_ibs_exemplo,
  ROUND(p.preco_venda * COALESCE(p.aliquota_cbs, 0.12), 2) as valor_cbs_exemplo
FROM produtos p;

COMMENT ON VIEW vw_produtos_tributacao_completa IS 'View com cálculo completo de tributação antiga e nova';
*/

-- Para usar a view acima, descomente e ajuste conforme a estrutura real da sua tabela produtos

-- =====================================================
-- 11. TRIGGER: ATUALIZAR ALÍQUOTAS IBS/CBS AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION atualizar_aliquotas_ibs_cbs()
RETURNS TRIGGER AS $$
DECLARE
  v_aliquotas RECORD;
BEGIN
  -- Se não foram definidas alíquotas IBS/CBS, buscar por NCM
  IF NEW.aliquota_ibs IS NULL OR NEW.aliquota_cbs IS NULL THEN
    SELECT * INTO v_aliquotas
    FROM buscar_aliquotas_reforma(NEW.ncm);
    
    IF v_aliquotas.aliquota_ibs IS NOT NULL THEN
      NEW.aliquota_ibs := v_aliquotas.aliquota_ibs;
    END IF;
    
    IF v_aliquotas.aliquota_cbs IS NOT NULL THEN
      NEW.aliquota_cbs := v_aliquotas.aliquota_cbs;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_aliquotas_ibs_cbs ON produtos;

CREATE TRIGGER trigger_atualizar_aliquotas_ibs_cbs
  BEFORE INSERT OR UPDATE ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_aliquotas_ibs_cbs();

-- =====================================================
-- 12. COMENTÁRIOS FINAIS E INSTRUÇÕES
-- =====================================================

COMMENT ON TABLE reforma_cronograma_transicao IS 'Cronograma oficial da Reforma Tributária 2026-2033';

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 
-- 1. Execute este script no Supabase SQL Editor
-- 2. Produtos cadastrados receberão automaticamente alíquotas IBS/CBS por NCM
-- 3. Use a função calcular_impostos_reforma() para cálculo durante transição
-- 4. Use a view vw_produtos_tributacao_completa para consultas
-- 5. Configure regime_transicao='MISTO' para calcular ambos sistemas
-- 6. Configure regime_transicao='NOVO' para calcular apenas IBS/CBS (a partir de 2033)
-- 
-- EXEMPLO DE USO:
-- SELECT * FROM calcular_impostos_reforma(1000.00, 0.27, 0.12, 2026);
-- SELECT * FROM buscar_aliquotas_reforma('04021000', '2026-01-01');
-- SELECT * FROM vw_produtos_tributacao_completa WHERE ncm = '04021000';
-- 
-- =====================================================
-- FIM DA MIGRATION - REFORMA TRIBUTÁRIA 2026
-- =====================================================
