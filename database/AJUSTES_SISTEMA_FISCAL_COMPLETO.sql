-- =====================================================
-- AJUSTES SISTEMA FISCAL - PRONTO PARA EMISSÃO
-- Implementa todas as melhorias para NF-e, NFC-e e NFS-e
-- Data: 05/01/2026
-- =====================================================

-- =====================================================
-- 1. ADICIONAR REGIME TRIBUTÁRIO NA TABELA EMPRESAS
-- =====================================================

ALTER TABLE empresas 
  ADD COLUMN IF NOT EXISTS regime_tributario VARCHAR(20) DEFAULT 'SIMPLES',
  ADD COLUMN IF NOT EXISTS indicador_ie INTEGER DEFAULT 1, -- 1=Contribuinte ICMS, 2=Isento, 9=Não Contribuinte
  ADD COLUMN IF NOT EXISTS inscricao_estadual VARCHAR(20),
  ADD COLUMN IF NOT EXISTS inscricao_municipal VARCHAR(20),
  ADD COLUMN IF NOT EXISTS codigo_regime_tributario VARCHAR(1) DEFAULT '1', -- 1=Simples, 2=Simples excesso, 3=Regime Normal
  ADD COLUMN IF NOT EXISTS cnae VARCHAR(10),
  ADD COLUMN IF NOT EXISTS uf VARCHAR(2),
  ADD COLUMN IF NOT EXISTS codigo_municipio VARCHAR(7),
  ADD COLUMN IF NOT EXISTS bairro VARCHAR(100),
  ADD COLUMN IF NOT EXISTS complemento VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_empresas_regime ON empresas(regime_tributario);

COMMENT ON COLUMN empresas.regime_tributario IS 'SIMPLES, PRESUMIDO, REAL';
COMMENT ON COLUMN empresas.codigo_regime_tributario IS '1=Simples Nacional, 2=Simples Nacional - excesso, 3=Regime Normal';
COMMENT ON COLUMN empresas.indicador_ie IS '1=Contribuinte ICMS, 2=Isento, 9=Não Contribuinte';

-- =====================================================
-- 2. TIPO DE DOCUMENTO FISCAL NA TABELA REGRAS_TRIBUTACAO
-- =====================================================

ALTER TABLE regras_tributacao
  ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(10) DEFAULT 'NFE', -- 'NFE', 'NFCE', 'NFSE'
  ADD COLUMN IF NOT EXISTS uf_origem VARCHAR(2),
  ADD COLUMN IF NOT EXISTS uf_destino VARCHAR(2),
  ADD COLUMN IF NOT EXISTS prioridade INTEGER DEFAULT 0; -- Maior valor = maior prioridade

CREATE INDEX IF NOT EXISTS idx_regras_tipo_documento ON regras_tributacao(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_regras_prioridade ON regras_tributacao(prioridade DESC);
CREATE INDEX IF NOT EXISTS idx_regras_uf_origem_destino ON regras_tributacao(uf_origem, uf_destino);

COMMENT ON COLUMN regras_tributacao.tipo_documento IS 'Tipo de documento: NFE (produto), NFCE (consumidor), NFSE (serviço)';
COMMENT ON COLUMN regras_tributacao.prioridade IS 'Prioridade de aplicação da regra (maior valor = maior prioridade)';

-- =====================================================
-- 3. CAMPOS ISS PARA NFS-e NA TABELA REGRAS_TRIBUTACAO
-- =====================================================

ALTER TABLE regras_tributacao
  ADD COLUMN IF NOT EXISTS aliquota_iss NUMERIC(5,4) DEFAULT 0.0000,
  ADD COLUMN IF NOT EXISTS retencao_iss BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS municipio_incidencia_iss VARCHAR(7), -- Código IBGE município
  ADD COLUMN IF NOT EXISTS codigo_servico_municipal VARCHAR(20),
  ADD COLUMN IF NOT EXISTS item_lista_servico_lc116 VARCHAR(10), -- Item da LC 116/2003
  ADD COLUMN IF NOT EXISTS codigo_tributacao_municipio_iss VARCHAR(20),
  ADD COLUMN IF NOT EXISTS mensagem_nf_iss TEXT,
  ADD COLUMN IF NOT EXISTS exigibilidade_iss INTEGER DEFAULT 1, -- 1=Exigível, 2=Não incide, etc.
  ADD COLUMN IF NOT EXISTS processo_suspensao_iss VARCHAR(30);

COMMENT ON COLUMN regras_tributacao.aliquota_iss IS 'Alíquota do ISS em % (NFS-e)';
COMMENT ON COLUMN regras_tributacao.retencao_iss IS 'Indica se deve reter ISS na NFS-e';
COMMENT ON COLUMN regras_tributacao.item_lista_servico_lc116 IS 'Item da Lista de Serviços LC 116/2003';
COMMENT ON COLUMN regras_tributacao.exigibilidade_iss IS '1=Exigível, 2=Não incide, 3=Isenção, 4=Exportação, 5=Imunidade, 6=Suspensa Decisão Judicial, 7=Suspensa Processo Administrativo';

-- =====================================================
-- 4. MENSAGENS FISCAIS AUTOMÁTICAS
-- =====================================================

CREATE TABLE IF NOT EXISTS mensagens_fiscais (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  tipo_documento VARCHAR(10) NOT NULL, -- 'NFE', 'NFCE', 'NFSE'
  mensagem TEXT NOT NULL,
  permite_variaveis BOOLEAN DEFAULT TRUE,
  ativo BOOLEAN DEFAULT TRUE,
  
  -- Condições de aplicação
  cfop VARCHAR(5),
  cst_icms VARCHAR(3),
  csosn_icms VARCHAR(5),
  ncm VARCHAR(8),
  uf_destino VARCHAR(2),
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_mensagens_fiscais_empresa ON mensagens_fiscais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_fiscais_tipo ON mensagens_fiscais(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_mensagens_fiscais_ativo ON mensagens_fiscais(ativo);

-- RLS
ALTER TABLE mensagens_fiscais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver mensagens fiscais"
  ON mensagens_fiscais FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem criar mensagens fiscais"
  ON mensagens_fiscais FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar mensagens fiscais"
  ON mensagens_fiscais FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar mensagens fiscais"
  ON mensagens_fiscais FOR DELETE
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE mensagens_fiscais IS 'Mensagens fiscais automáticas para notas fiscais';
COMMENT ON COLUMN mensagens_fiscais.permite_variaveis IS 'Se TRUE, permite uso de variáveis como {{cfop}}, {{cst}}, {{aliquota_icms}}';

-- =====================================================
-- 5. TABELA DE VALIDAÇÕES FISCAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS validacoes_fiscais (
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo_documento VARCHAR(10) NOT NULL, -- 'NFE', 'NFCE', 'NFSE'
  campo_validado VARCHAR(100) NOT NULL,
  regra_validacao TEXT NOT NULL, -- Expressão SQL ou regex
  mensagem_erro TEXT NOT NULL,
  bloqueante BOOLEAN DEFAULT TRUE, -- Se TRUE, impede emissão
  ativo BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validacoes_tipo_doc ON validacoes_fiscais(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_validacoes_ativo ON validacoes_fiscais(ativo);

COMMENT ON TABLE validacoes_fiscais IS 'Validações obrigatórias antes da emissão de notas fiscais';
COMMENT ON COLUMN validacoes_fiscais.bloqueante IS 'Se TRUE, impede emissão da nota em caso de falha';

-- =====================================================
-- 6. INSERIR VALIDAÇÕES FISCAIS OBRIGATÓRIAS
-- =====================================================

INSERT INTO validacoes_fiscais (codigo, nome, descricao, tipo_documento, campo_validado, regra_validacao, mensagem_erro, bloqueante) VALUES
  -- NF-e / NFC-e
  ('NFE_NCM_OBRIGATORIO', 'NCM Obrigatório', 'Todos os produtos devem ter NCM válido', 'NFE', 'ncm', 'LENGTH(ncm) = 8', 'NCM é obrigatório e deve ter 8 dígitos', TRUE),
  ('NFCE_NCM_OBRIGATORIO', 'NCM Obrigatório', 'Todos os produtos devem ter NCM válido', 'NFCE', 'ncm', 'LENGTH(ncm) = 8', 'NCM é obrigatório e deve ter 8 dígitos', TRUE),
  ('NFE_CFOP_VALIDO', 'CFOP Compatível', 'CFOP deve ser compatível com UF de destino', 'NFE', 'cfop', 'cfop IS NOT NULL', 'CFOP é obrigatório', TRUE),
  ('NFE_CST_REGIME', 'CST/CSOSN conforme Regime', 'CST para regime normal, CSOSN para Simples', 'NFE', 'cst_icms', 'cst_icms IS NOT NULL OR csosn_icms IS NOT NULL', 'CST ou CSOSN é obrigatório conforme regime tributário', TRUE),
  ('NFE_ICMS_ST_CEST', 'ICMS-ST exige CEST', 'ICMS-ST só pode ser aplicado se houver CEST', 'NFE', 'cest', 'cest IS NOT NULL', 'CEST é obrigatório quando há ICMS-ST', TRUE),
  
  -- NFS-e
  ('NFSE_ISS_OBRIGATORIO', 'ISS Obrigatório', 'Alíquota ISS é obrigatória para serviços', 'NFSE', 'aliquota_iss', 'aliquota_iss > 0', 'Alíquota ISS é obrigatória para NFS-e', TRUE),
  ('NFSE_ITEM_LISTA_LC116', 'Item Lista LC 116/2003', 'Item da lista de serviços é obrigatório', 'NFSE', 'item_lista_servico', 'item_lista_servico IS NOT NULL', 'Item da Lista de Serviços LC 116/2003 é obrigatório', TRUE),
  ('NFSE_MUNICIPIO_INCIDENCIA', 'Município de Incidência', 'Município de incidência do ISS é obrigatório', 'NFSE', 'municipio_incidencia_iss', 'municipio_incidencia_iss IS NOT NULL', 'Município de incidência do ISS é obrigatório', TRUE),
  
  -- Validações de incompatibilidade
  ('NFE_SEM_ISS', 'NF-e não pode ter ISS', 'ISS não se aplica a produtos', 'NFE', 'aliquota_iss', 'aliquota_iss IS NULL OR aliquota_iss = 0', 'ISS não pode ser aplicado em NF-e (produtos)', TRUE),
  ('NFSE_SEM_ICMS', 'NFS-e não pode ter ICMS', 'ICMS não se aplica a serviços', 'NFSE', 'aliquota_icms', 'aliquota_icms IS NULL OR aliquota_icms = 0', 'ICMS não pode ser aplicado em NFS-e (serviços)', TRUE),
  ('NFSE_SEM_IPI', 'NFS-e não pode ter IPI', 'IPI não se aplica a serviços', 'NFSE', 'aliquota_ipi', 'aliquota_ipi IS NULL OR aliquota_ipi = 0', 'IPI não pode ser aplicado em NFS-e (serviços)', TRUE),
  ('NFSE_SEM_NCM', 'NFS-e não exige NCM', 'NCM não se aplica a serviços', 'NFSE', 'ncm', 'TRUE', 'NCM não é utilizado em NFS-e', FALSE)
ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- 7. FUNÇÃO PARA CALCULAR PRIORIDADE DE REGRAS
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_prioridade_regra(regra regras_tributacao)
RETURNS INTEGER AS $$
DECLARE
  prioridade_calculada INTEGER := 0;
BEGIN
  -- Quanto mais específica a regra, maior a prioridade
  
  -- Tipo de documento específico
  IF regra.tipo_documento IS NOT NULL THEN
    prioridade_calculada := prioridade_calculada + 100;
  END IF;
  
  -- NCM específico (muito específico)
  IF regra.ncm IS NOT NULL AND LENGTH(regra.ncm) = 8 THEN
    prioridade_calculada := prioridade_calculada + 1000;
  END IF;
  
  -- CEST específico
  IF regra.cest IS NOT NULL AND LENGTH(regra.cest) = 7 THEN
    prioridade_calculada := prioridade_calculada + 800;
  END IF;
  
  -- UF Origem e Destino específicos
  IF regra.uf_origem IS NOT NULL THEN
    prioridade_calculada := prioridade_calculada + 500;
  END IF;
  
  IF regra.uf_destino IS NOT NULL THEN
    prioridade_calculada := prioridade_calculada + 500;
  END IF;
  
  -- CFOP específico
  IF regra.cfop_saida IS NOT NULL THEN
    prioridade_calculada := prioridade_calculada + 300;
  END IF;
  
  IF regra.cfop_entrada IS NOT NULL THEN
    prioridade_calculada := prioridade_calculada + 300;
  END IF;
  
  -- Operação fiscal específica
  IF regra.operacao_fiscal IS NOT NULL THEN
    prioridade_calculada := prioridade_calculada + 200;
  END IF;
  
  -- Categoria
  IF regra.categoria IS NOT NULL THEN
    prioridade_calculada := prioridade_calculada + 50;
  END IF;
  
  -- Origem mercadoria
  IF regra.origem_mercadoria IS NOT NULL THEN
    prioridade_calculada := prioridade_calculada + 10;
  END IF;
  
  RETURN prioridade_calculada;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_prioridade_regra IS 'Calcula automaticamente a prioridade de uma regra de tributação baseada em sua especificidade';

-- =====================================================
-- 8. TRIGGER PARA ATUALIZAR PRIORIDADE AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION atualizar_prioridade_regra()
RETURNS TRIGGER AS $$
BEGIN
  -- Se prioridade não foi definida manualmente, calcular automaticamente
  IF NEW.prioridade IS NULL OR NEW.prioridade = 0 THEN
    NEW.prioridade := calcular_prioridade_regra(NEW);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_prioridade_regra ON regras_tributacao;

CREATE TRIGGER trigger_atualizar_prioridade_regra
  BEFORE INSERT OR UPDATE ON regras_tributacao
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_prioridade_regra();

-- =====================================================
-- 9. FUNÇÃO PARA BUSCAR REGRA MAIS ESPECÍFICA
-- =====================================================

CREATE OR REPLACE FUNCTION buscar_regra_tributacao(
  p_empresa_id BIGINT,
  p_tipo_documento VARCHAR(10),
  p_ncm VARCHAR(8) DEFAULT NULL,
  p_cest VARCHAR(7) DEFAULT NULL,
  p_cfop VARCHAR(5) DEFAULT NULL,
  p_uf_origem VARCHAR(2) DEFAULT NULL,
  p_uf_destino VARCHAR(2) DEFAULT NULL,
  p_operacao_fiscal VARCHAR(100) DEFAULT NULL,
  p_categoria VARCHAR(100) DEFAULT NULL
)
RETURNS regras_tributacao AS $$
DECLARE
  regra_encontrada regras_tributacao;
BEGIN
  -- Buscar regra com maior prioridade que atenda aos critérios
  SELECT * INTO regra_encontrada
  FROM regras_tributacao
  WHERE empresa_id = p_empresa_id
    AND ativo = TRUE
    AND (tipo_documento = p_tipo_documento OR tipo_documento IS NULL)
    AND (ncm = p_ncm OR ncm IS NULL)
    AND (cest = p_cest OR cest IS NULL)
    AND (cfop_saida = p_cfop OR cfop_saida IS NULL)
    AND (uf_origem = p_uf_origem OR uf_origem IS NULL)
    AND (uf_destino = p_uf_destino OR uf_destino IS NULL)
    AND (operacao_fiscal = p_operacao_fiscal OR operacao_fiscal IS NULL)
    AND (categoria = p_categoria OR categoria IS NULL)
  ORDER BY prioridade DESC, id DESC
  LIMIT 1;
  
  RETURN regra_encontrada;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION buscar_regra_tributacao IS 'Busca a regra de tributação mais específica baseada nos critérios fornecidos';

-- =====================================================
-- 10. FUNÇÃO PARA VALIDAR NOTA FISCAL ANTES DA EMISSÃO
-- =====================================================

CREATE OR REPLACE FUNCTION validar_nota_fiscal(
  p_tipo_documento VARCHAR(10),
  p_regime_tributario VARCHAR(20),
  p_dados_nota JSONB
)
RETURNS TABLE (
  valido BOOLEAN,
  codigo_erro VARCHAR(50),
  mensagem_erro TEXT,
  bloqueante BOOLEAN
) AS $$
BEGIN
  -- Validar NCM obrigatório para NF-e e NFC-e
  IF p_tipo_documento IN ('NFE', 'NFCE') THEN
    IF p_dados_nota->>'ncm' IS NULL OR LENGTH(p_dados_nota->>'ncm') != 8 THEN
      RETURN QUERY SELECT FALSE, 'NFE_NCM_OBRIGATORIO'::VARCHAR, 'NCM é obrigatório e deve ter 8 dígitos'::TEXT, TRUE;
    END IF;
  END IF;
  
  -- Validar ISS obrigatório para NFS-e
  IF p_tipo_documento = 'NFSE' THEN
    IF (p_dados_nota->>'aliquota_iss')::NUMERIC IS NULL OR (p_dados_nota->>'aliquota_iss')::NUMERIC = 0 THEN
      RETURN QUERY SELECT FALSE, 'NFSE_ISS_OBRIGATORIO'::VARCHAR, 'Alíquota ISS é obrigatória para NFS-e'::TEXT, TRUE;
    END IF;
    
    IF p_dados_nota->>'item_lista_servico' IS NULL THEN
      RETURN QUERY SELECT FALSE, 'NFSE_ITEM_LISTA_LC116'::VARCHAR, 'Item da Lista de Serviços LC 116/2003 é obrigatório'::TEXT, TRUE;
    END IF;
  END IF;
  
  -- Validar CST/CSOSN conforme regime tributário
  IF p_tipo_documento IN ('NFE', 'NFCE') THEN
    IF p_regime_tributario = 'SIMPLES' THEN
      IF p_dados_nota->>'csosn_icms' IS NULL THEN
        RETURN QUERY SELECT FALSE, 'NFE_CST_REGIME'::VARCHAR, 'CSOSN é obrigatório para empresas do Simples Nacional'::TEXT, TRUE;
      END IF;
    ELSE
      IF p_dados_nota->>'cst_icms' IS NULL THEN
        RETURN QUERY SELECT FALSE, 'NFE_CST_REGIME'::VARCHAR, 'CST é obrigatório para empresas do Regime Normal'::TEXT, TRUE;
      END IF;
    END IF;
  END IF;
  
  -- Validar incompatibilidades
  IF p_tipo_documento IN ('NFE', 'NFCE') AND (p_dados_nota->>'aliquota_iss')::NUMERIC > 0 THEN
    RETURN QUERY SELECT FALSE, 'NFE_SEM_ISS'::VARCHAR, 'ISS não pode ser aplicado em NF-e (produtos)'::TEXT, TRUE;
  END IF;
  
  IF p_tipo_documento = 'NFSE' AND (p_dados_nota->>'aliquota_icms')::NUMERIC > 0 THEN
    RETURN QUERY SELECT FALSE, 'NFSE_SEM_ICMS'::VARCHAR, 'ICMS não pode ser aplicado em NFS-e (serviços)'::TEXT, TRUE;
  END IF;
  
  IF p_tipo_documento = 'NFSE' AND (p_dados_nota->>'aliquota_ipi')::NUMERIC > 0 THEN
    RETURN QUERY SELECT FALSE, 'NFSE_SEM_IPI'::VARCHAR, 'IPI não pode ser aplicado em NFS-e (serviços)'::TEXT, TRUE;
  END IF;
  
  -- Se passou por todas as validações
  IF NOT FOUND THEN
    RETURN QUERY SELECT TRUE, NULL::VARCHAR, NULL::TEXT, FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_nota_fiscal IS 'Valida dados da nota fiscal antes da emissão conforme tipo de documento e regime tributário';

-- =====================================================
-- 11. VIEW PARA REGRAS COM PRIORIDADE CALCULADA
-- =====================================================

CREATE OR REPLACE VIEW vw_regras_tributacao_ordenadas AS
SELECT 
  r.*,
  calcular_prioridade_regra(r) as prioridade_calculada,
  CASE 
    WHEN r.tipo_documento = 'NFE' THEN 'NF-e (Produto)'
    WHEN r.tipo_documento = 'NFCE' THEN 'NFC-e (Consumidor)'
    WHEN r.tipo_documento = 'NFSE' THEN 'NFS-e (Serviço)'
    ELSE 'Todos'
  END as tipo_documento_desc,
  CASE 
    WHEN r.ncm IS NOT NULL AND r.uf_origem IS NOT NULL AND r.uf_destino IS NOT NULL THEN 'Muito Específica'
    WHEN r.ncm IS NOT NULL OR (r.uf_origem IS NOT NULL AND r.uf_destino IS NOT NULL) THEN 'Específica'
    WHEN r.cfop_saida IS NOT NULL OR r.operacao_fiscal IS NOT NULL THEN 'Média'
    ELSE 'Genérica'
  END as nivel_especificidade
FROM regras_tributacao r
WHERE r.ativo = TRUE
ORDER BY r.prioridade DESC, calcular_prioridade_regra(r) DESC, r.id DESC;

COMMENT ON VIEW vw_regras_tributacao_ordenadas IS 'Regras de tributação ordenadas por prioridade e especificidade';

-- =====================================================
-- 12. ADICIONAR TIPO DOCUMENTO NA TABELA DE PRODUTOS
-- =====================================================

ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS tipo_produto VARCHAR(10) DEFAULT 'MERCADORIA'; -- MERCADORIA, SERVICO

CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON produtos(tipo_produto);

COMMENT ON COLUMN produtos.tipo_produto IS 'MERCADORIA (para NF-e/NFC-e) ou SERVICO (para NFS-e)';

-- =====================================================
-- 13. INSERIR MENSAGENS FISCAIS PADRÃO
-- =====================================================

-- Esta parte precisa ser executada após ter pelo menos uma empresa cadastrada
-- Exemplo (ajuste o empresa_id conforme necessário):
-- INSERT INTO mensagens_fiscais (empresa_id, nome, tipo_documento, mensagem, cfop) VALUES
--   (1, 'Simples Nacional - ICMS não destacado', 'NFE', 'DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. NÃO GERA DIREITO A CRÉDITO FISCAL DE ICMS.', '5102'),
--   (1, 'Operação com ST', 'NFE', 'Valor aproximado dos tributos: R$ {{valor_tributos}} ({{percentual_tributos}}%) - Fonte: IBPT', NULL);

-- =====================================================
-- 14. COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON TABLE regras_tributacao IS 'Regras de tributação automática por tipo de documento, NCM, CFOP e UF. Prioridade calculada automaticamente pela especificidade.';
COMMENT ON TABLE mensagens_fiscais IS 'Mensagens fiscais automáticas para notas fiscais com suporte a variáveis dinâmicas';
COMMENT ON TABLE validacoes_fiscais IS 'Validações obrigatórias antes da emissão de notas fiscais para garantir conformidade fiscal';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

-- INSTRUÇÕES DE USO:
-- 1. Execute este script no Supabase SQL Editor
-- 2. Atualize o regime_tributario das empresas cadastradas
-- 3. Configure as regras de tributação por tipo de documento
-- 4. Cadastre mensagens fiscais padrão conforme necessidade
-- 5. Sistema estará pronto para emissão em homologação
