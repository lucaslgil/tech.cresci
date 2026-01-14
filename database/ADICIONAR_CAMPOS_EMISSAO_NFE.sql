-- =====================================================
-- CAMPOS OBRIGATÓRIOS PARA EMISSÃO DE NF-e/NFC-e/NFS-e
-- Execute este script no Supabase SQL Editor
-- Data: 14/01/2026
-- =====================================================
-- 
-- Este script adiciona os campos faltantes necessários
-- para fazer a emissão completa de notas fiscais
-- 
-- =====================================================

-- =====================================================
-- 1. ADICIONAR CAMPOS DE CERTIFICADO DIGITAL (EMPRESAS)
-- =====================================================

ALTER TABLE empresas 
  ADD COLUMN IF NOT EXISTS certificado_digital_path TEXT,
  ADD COLUMN IF NOT EXISTS certificado_digital_senha TEXT, -- ⚠️ CRIPTOGRAFAR NO BACKEND!
  ADD COLUMN IF NOT EXISTS certificado_validade DATE,
  ADD COLUMN IF NOT EXISTS tipo_certificado VARCHAR(2) DEFAULT 'A1'; -- A1 ou A3

CREATE INDEX IF NOT EXISTS idx_empresas_cert_validade ON empresas(certificado_validade);

COMMENT ON COLUMN empresas.certificado_digital_path IS 'Caminho do arquivo .pfx do certificado A1 ou identificador do A3';
COMMENT ON COLUMN empresas.certificado_digital_senha IS '⚠️ CRIPTOGRAFAR! Senha do certificado digital';
COMMENT ON COLUMN empresas.certificado_validade IS 'Data de validade do certificado digital (alertar 30 dias antes)';
COMMENT ON COLUMN empresas.tipo_certificado IS 'A1=Arquivo .pfx (1 ano), A3=Token/Cartão (3 anos)';

-- =====================================================
-- 2. AMBIENTE DE EMISSÃO ⭐ CRÍTICO
-- =====================================================

ALTER TABLE empresas 
  ADD COLUMN IF NOT EXISTS ambiente_emissao INTEGER DEFAULT 2; -- 1=Produção, 2=Homologação

COMMENT ON COLUMN empresas.ambiente_emissao IS '⭐ 1=Produção (notas válidas), 2=Homologação (testes). SEMPRE começar em homologação!';

-- =====================================================
-- 3. SÉRIES E NUMERAÇÃO FISCAL
-- =====================================================

ALTER TABLE empresas 
  ADD COLUMN IF NOT EXISTS serie_nfe INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS serie_nfce INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS serie_nfse INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS ultimo_numero_nfe BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_numero_nfce BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_numero_nfse BIGINT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_empresas_series ON empresas(serie_nfe, serie_nfce, serie_nfse);

COMMENT ON COLUMN empresas.serie_nfe IS 'Série padrão para NF-e (geralmente 1)';
COMMENT ON COLUMN empresas.serie_nfce IS 'Série padrão para NFC-e (geralmente 1)';
COMMENT ON COLUMN empresas.serie_nfse IS 'Série padrão para NFS-e (geralmente 1)';
COMMENT ON COLUMN empresas.ultimo_numero_nfe IS 'Último número emitido de NF-e (controle sequencial)';
COMMENT ON COLUMN empresas.ultimo_numero_nfce IS 'Último número emitido de NFC-e (controle sequencial)';
COMMENT ON COLUMN empresas.ultimo_numero_nfse IS 'Último número emitido de NFS-e (controle sequencial)';

-- =====================================================
-- 4. CSC - CÓDIGO DE SEGURANÇA DO CONTRIBUINTE (NFC-e)
-- =====================================================

ALTER TABLE empresas 
  ADD COLUMN IF NOT EXISTS csc_nfce VARCHAR(255),
  ADD COLUMN IF NOT EXISTS id_token_csc_nfce INTEGER DEFAULT 1;

COMMENT ON COLUMN empresas.csc_nfce IS 'Código de Segurança do Contribuinte (obrigatório para NFC-e). Obter na SEFAZ';
COMMENT ON COLUMN empresas.id_token_csc_nfce IS 'ID do Token CSC (geralmente 1). Fornecido pela SEFAZ junto com o CSC';

-- =====================================================
-- 5. CAMPOS SEFAZ NA TABELA NOTAS_FISCAIS
-- =====================================================

ALTER TABLE notas_fiscais 
  ADD COLUMN IF NOT EXISTS chave_acesso VARCHAR(44) UNIQUE,
  ADD COLUMN IF NOT EXISTS modelo VARCHAR(2), -- 55=NF-e, 65=NFC-e, SE=NFS-e
  ADD COLUMN IF NOT EXISTS ambiente INTEGER, -- 1=Produção, 2=Homologação
  ADD COLUMN IF NOT EXISTS protocolo_autorizacao VARCHAR(50),
  ADD COLUMN IF NOT EXISTS data_autorizacao TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS xml_enviado TEXT,
  ADD COLUMN IF NOT EXISTS xml_retorno TEXT,
  ADD COLUMN IF NOT EXISTS motivo_rejeicao TEXT,
  ADD COLUMN IF NOT EXISTS qrcode_url TEXT, -- Para NFC-e
  ADD COLUMN IF NOT EXISTS danfe_pdf BYTEA; -- DANFE em PDF (opcional)

CREATE INDEX IF NOT EXISTS idx_notas_chave_acesso ON notas_fiscais(chave_acesso);
CREATE INDEX IF NOT EXISTS idx_notas_modelo ON notas_fiscais(modelo);
CREATE INDEX IF NOT EXISTS idx_notas_ambiente ON notas_fiscais(ambiente);
CREATE INDEX IF NOT EXISTS idx_notas_protocolo ON notas_fiscais(protocolo_autorizacao);

COMMENT ON COLUMN notas_fiscais.chave_acesso IS 'Chave de acesso de 44 dígitos (formato: cUF + AAMM + CNPJ + mod + serie + nNF + tpEmis + cNF + DV)';
COMMENT ON COLUMN notas_fiscais.modelo IS '55=NF-e (produto), 65=NFC-e (consumidor final), SE=NFS-e (serviço)';
COMMENT ON COLUMN notas_fiscais.ambiente IS '1=Produção (nota válida), 2=Homologação (teste)';
COMMENT ON COLUMN notas_fiscais.protocolo_autorizacao IS 'Número do protocolo de autorização da SEFAZ';
COMMENT ON COLUMN notas_fiscais.data_autorizacao IS 'Data e hora da autorização pela SEFAZ';
COMMENT ON COLUMN notas_fiscais.xml_enviado IS 'XML completo enviado para SEFAZ (com assinatura)';
COMMENT ON COLUMN notas_fiscais.xml_retorno IS 'XML de retorno da SEFAZ (com protocolo)';
COMMENT ON COLUMN notas_fiscais.motivo_rejeicao IS 'Motivo da rejeição pela SEFAZ (se status = REJEITADA)';
COMMENT ON COLUMN notas_fiscais.qrcode_url IS 'URL do QR Code para NFC-e (consulta pelo consumidor)';
COMMENT ON COLUMN notas_fiscais.danfe_pdf IS 'DANFE em formato PDF (opcional, pode ser gerado sob demanda)';

-- =====================================================
-- 6. FUNÇÃO PARA GERAR PRÓXIMO NÚMERO DE NOTA
-- =====================================================

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS obter_proximo_numero_nota CASCADE;

CREATE OR REPLACE FUNCTION obter_proximo_numero_nota(
  p_empresa_id BIGINT,
  p_tipo_documento VARCHAR(10)
)
RETURNS BIGINT AS $$
DECLARE
  v_proximo_numero BIGINT;
  v_campo_update TEXT;
BEGIN
  -- Determinar qual campo atualizar
  v_campo_update := CASE p_tipo_documento
    WHEN 'NFE' THEN 'ultimo_numero_nfe'
    WHEN 'NFCE' THEN 'ultimo_numero_nfce'
    WHEN 'NFSE' THEN 'ultimo_numero_nfse'
    ELSE 'ultimo_numero_nfe'
  END;
  
  -- Incrementar e retornar próximo número (com lock para evitar duplicação)
  EXECUTE format('
    UPDATE empresas 
    SET %I = %I + 1 
    WHERE id = $1 
    RETURNING %I
  ', v_campo_update, v_campo_update, v_campo_update)
  INTO v_proximo_numero
  USING p_empresa_id;
  
  RETURN v_proximo_numero;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obter_proximo_numero_nota IS 'Obtém e incrementa o próximo número de nota fiscal (com controle de concorrência)';

-- =====================================================
-- 7. FUNÇÃO PARA GERAR CHAVE DE ACESSO
-- =====================================================

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS gerar_chave_acesso_nfe CASCADE;

CREATE OR REPLACE FUNCTION gerar_chave_acesso_nfe(
  p_uf VARCHAR(2),
  p_ano_mes VARCHAR(4), -- AAMM (ex: 2601 para janeiro/2026)
  p_cnpj VARCHAR(14),
  p_modelo VARCHAR(2), -- 55=NF-e, 65=NFC-e
  p_serie INTEGER,
  p_numero BIGINT,
  p_tipo_emissao INTEGER DEFAULT 1, -- 1=Normal
  p_codigo_numerico INTEGER DEFAULT NULL -- Se NULL, gera aleatório
)
RETURNS VARCHAR(44) AS $$
DECLARE
  v_chave_sem_dv VARCHAR(43);
  v_codigo_numerico VARCHAR(8);
  v_digito_verificador INTEGER;
  v_chave_completa VARCHAR(44);
  v_codigo_uf VARCHAR(2);
BEGIN
  -- Converter UF em código
  v_codigo_uf := CASE p_uf
    WHEN 'AC' THEN '12'
    WHEN 'AL' THEN '27'
    WHEN 'AP' THEN '16'
    WHEN 'AM' THEN '13'
    WHEN 'BA' THEN '29'
    WHEN 'CE' THEN '23'
    WHEN 'DF' THEN '53'
    WHEN 'ES' THEN '32'
    WHEN 'GO' THEN '52'
    WHEN 'MA' THEN '21'
    WHEN 'MT' THEN '51'
    WHEN 'MS' THEN '50'
    WHEN 'MG' THEN '31'
    WHEN 'PA' THEN '15'
    WHEN 'PB' THEN '25'
    WHEN 'PR' THEN '41'
    WHEN 'PE' THEN '26'
    WHEN 'PI' THEN '22'
    WHEN 'RJ' THEN '33'
    WHEN 'RN' THEN '24'
    WHEN 'RS' THEN '43'
    WHEN 'RO' THEN '11'
    WHEN 'RR' THEN '14'
    WHEN 'SC' THEN '42'
    WHEN 'SP' THEN '35'
    WHEN 'SE' THEN '28'
    WHEN 'TO' THEN '17'
    ELSE '35'
  END;
  
  -- Gerar código numérico aleatório se não fornecido
  IF p_codigo_numerico IS NULL THEN
    v_codigo_numerico := LPAD((RANDOM() * 99999999)::INTEGER::TEXT, 8, '0');
  ELSE
    v_codigo_numerico := LPAD(p_codigo_numerico::TEXT, 8, '0');
  END IF;
  
  -- Montar chave sem DV
  v_chave_sem_dv := 
    v_codigo_uf || 
    p_ano_mes || 
    REPLACE(p_cnpj, '.', '') || REPLACE(REPLACE(p_cnpj, '.', ''), '/', '') || REPLACE(REPLACE(REPLACE(p_cnpj, '.', ''), '/', ''), '-', '') ||
    LPAD(p_modelo, 2, '0') || 
    LPAD(p_serie::TEXT, 3, '0') || 
    LPAD(p_numero::TEXT, 9, '0') || 
    p_tipo_emissao::TEXT || 
    v_codigo_numerico;
  
  -- Limpar CNPJ (apenas números)
  v_chave_sem_dv := 
    v_codigo_uf || 
    p_ano_mes || 
    REGEXP_REPLACE(p_cnpj, '[^0-9]', '', 'g') ||
    LPAD(p_modelo, 2, '0') || 
    LPAD(p_serie::TEXT, 3, '0') || 
    LPAD(p_numero::TEXT, 9, '0') || 
    p_tipo_emissao::TEXT || 
    v_codigo_numerico;
  
  -- Calcular dígito verificador (Módulo 11)
  v_digito_verificador := calcular_dv_modulo11(v_chave_sem_dv);
  
  -- Montar chave completa
  v_chave_completa := v_chave_sem_dv || v_digito_verificador::TEXT;
  
  RETURN v_chave_completa;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION gerar_chave_acesso_nfe IS 'Gera chave de acesso de 44 dígitos para NF-e/NFC-e conforme padrão SEFAZ';

-- =====================================================
-- 8. FUNÇÃO AUXILIAR: CALCULAR DÍGITO VERIFICADOR MÓDULO 11
-- =====================================================

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS calcular_dv_modulo11 CASCADE;

CREATE OR REPLACE FUNCTION calcular_dv_modulo11(p_chave VARCHAR(43))
RETURNS INTEGER AS $$
DECLARE
  v_soma INTEGER := 0;
  v_multiplicador INTEGER := 2;
  v_digito INTEGER;
  v_resto INTEGER;
  i INTEGER;
BEGIN
  -- Percorrer chave de trás para frente
  FOR i IN REVERSE LENGTH(p_chave)..1 LOOP
    v_soma := v_soma + (SUBSTRING(p_chave, i, 1)::INTEGER * v_multiplicador);
    v_multiplicador := v_multiplicador + 1;
    
    -- Reiniciar multiplicador em 2 após 9
    IF v_multiplicador > 9 THEN
      v_multiplicador := 2;
    END IF;
  END LOOP;
  
  -- Calcular resto
  v_resto := v_soma % 11;
  
  -- Definir dígito verificador
  IF v_resto = 0 OR v_resto = 1 THEN
    v_digito := 0;
  ELSE
    v_digito := 11 - v_resto;
  END IF;
  
  RETURN v_digito;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_dv_modulo11 IS 'Calcula dígito verificador usando Módulo 11 (padrão SEFAZ)';

-- =====================================================
-- 9. TRIGGER PARA GERAR CHAVE DE ACESSO AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_gerar_chave_acesso()
RETURNS TRIGGER AS $$
DECLARE
  v_empresa empresas%ROWTYPE;
  v_ano_mes VARCHAR(4);
BEGIN
  -- Se chave já existe, não gerar novamente
  IF NEW.chave_acesso IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar dados da empresa
  SELECT * INTO v_empresa FROM empresas WHERE id = NEW.empresa_id;
  
  -- Formatar AAMM
  v_ano_mes := TO_CHAR(NEW.data_emissao, 'YYMM');
  
  -- Gerar chave de acesso
  NEW.chave_acesso := gerar_chave_acesso_nfe(
    v_empresa.uf,
    v_ano_mes,
    REGEXP_REPLACE(v_empresa.cnpj, '[^0-9]', '', 'g'),
    NEW.modelo,
    NEW.serie,
    NEW.numero,
    1 -- Tipo emissão normal
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_gerar_chave_acesso_nfe ON notas_fiscais;

CREATE TRIGGER trigger_gerar_chave_acesso_nfe
  BEFORE INSERT ON notas_fiscais
  FOR EACH ROW
  WHEN (NEW.chave_acesso IS NULL AND NEW.modelo IN ('55', '65'))
  EXECUTE FUNCTION trigger_gerar_chave_acesso();

COMMENT ON FUNCTION trigger_gerar_chave_acesso IS 'Gera automaticamente a chave de acesso antes de inserir nota fiscal';

-- =====================================================
-- 10. VIEW PARA MONITORAR CERTIFICADOS PRÓXIMOS DO VENCIMENTO
-- =====================================================

CREATE OR REPLACE VIEW vw_certificados_vencimento AS
SELECT 
  e.id,
  e.codigo,
  e.razao_social,
  e.cnpj,
  e.certificado_validade,
  e.tipo_certificado,
  CASE 
    WHEN e.certificado_validade IS NULL THEN 'SEM CERTIFICADO'
    WHEN e.certificado_validade < CURRENT_DATE THEN 'VENCIDO'
    WHEN e.certificado_validade <= CURRENT_DATE + INTERVAL '30 days' THEN 'VENCE EM 30 DIAS'
    WHEN e.certificado_validade <= CURRENT_DATE + INTERVAL '60 days' THEN 'VENCE EM 60 DIAS'
    ELSE 'VÁLIDO'
  END as status_certificado,
  e.certificado_validade - CURRENT_DATE as dias_para_vencer
FROM empresas e
ORDER BY e.certificado_validade ASC NULLS LAST;

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS validar_empresa_emissao CASCADE;

COMMENT ON VIEW vw_certificados_vencimento IS 'Monitora certificados digitais próximos do vencimento';

-- =====================================================
-- 11. FUNÇÃO PARA VALIDAR SE EMPRESA PODE EMITIR
-- =====================================================

CREATE OR REPLACE FUNCTION validar_empresa_emissao(p_empresa_id BIGINT)
RETURNS TABLE (
  pode_emitir BOOLEAN,
  motivo_bloqueio TEXT
) AS $$
DECLARE
  v_empresa empresas%ROWTYPE;
BEGIN
  -- Buscar empresa
  SELECT * INTO v_empresa FROM empresas WHERE id = p_empresa_id;
  
  -- Validar CNPJ
  IF v_empresa.cnpj IS NULL OR LENGTH(REGEXP_REPLACE(v_empresa.cnpj, '[^0-9]', '', 'g')) != 14 THEN
    RETURN QUERY SELECT FALSE, 'CNPJ inválido ou não informado';
    RETURN;
  END IF;
  
  -- Validar Inscrição Estadual
  IF v_empresa.inscricao_estadual IS NULL AND v_empresa.indicador_ie = 1 THEN
    RETURN QUERY SELECT FALSE, 'Inscrição Estadual não informada (empresa é contribuinte ICMS)';
    RETURN;
  END IF;
  
  -- Validar certificado digital
  IF v_empresa.certificado_digital_path IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Certificado digital não configurado';
    RETURN;
  END IF;
  
  -- Validar validade do certificado
  IF v_empresa.certificado_validade IS NULL OR v_empresa.certificado_validade < CURRENT_DATE THEN
    RETURN QUERY SELECT FALSE, 'Certificado digital vencido ou sem data de validade';
    RETURN;
  END IF;
  
  -- Validar endereço completo
  IF v_empresa.endereco IS NULL OR v_empresa.numero IS NULL OR 
     v_empresa.cidade IS NULL OR v_empresa.uf IS NULL OR v_empresa.cep IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Endereço da empresa incompleto';
    RETURN;
  END IF;
  
  -- Validar código município IBGE
  IF v_empresa.codigo_municipio IS NULL OR LENGTH(v_empresa.codigo_municipio) != 7 THEN
    RETURN QUERY SELECT FALSE, 'Código do município IBGE não informado';
    RETURN;
  END IF;
  
  -- Se passou por todas as validações
  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_empresa_emissao IS 'Valida se empresa está apta a emitir notas fiscais';

-- =====================================================
-- 12. INSERIR CONFIGURAÇÃO PADRÃO PARA EMPRESAS EXISTENTES
-- =====================================================

-- Atualizar empresas existentes com valores padrão
UPDATE empresas
SET 
  ambiente_emissao = 2, -- Homologação por padrão
  serie_nfe = 1,
  serie_nfce = 1,
  serie_nfse = 1,
  ultimo_numero_nfe = 0,
  ultimo_numero_nfce = 0,
  ultimo_numero_nfse = 0,
  tipo_certificado = 'A1',
  id_token_csc_nfce = 1
WHERE ambiente_emissao IS NULL;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

-- INSTRUÇÕES DE USO:
-- 1. Execute este script no Supabase SQL Editor
-- 2. Configure certificado digital para cada empresa
-- 3. Configure ambiente de emissão (começar em HOMOLOGAÇÃO)
-- 4. Configure série e numeração inicial
-- 5. Para NFC-e, configure CSC (obter na SEFAZ)
-- 6. Teste geração de chave de acesso:
--    SELECT gerar_chave_acesso_nfe('SP', '2601', '27767670000194', '55', 1, 1);
-- 7. Valide empresa antes de emitir:
--    SELECT * FROM validar_empresa_emissao(1);
-- 8. Monitore certificados:
--    SELECT * FROM vw_certificados_vencimento;

SELECT 'Script executado com sucesso! Campos de emissão adicionados.' AS resultado;
