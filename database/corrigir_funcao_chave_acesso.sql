-- =====================================================
-- CORREÇÃO: FUNÇÃO GERAR CHAVE DE ACESSO NF-e
-- Data: 03/02/2026
-- Problema: Função estava concatenando CNPJ 3 vezes
-- =====================================================

CREATE OR REPLACE FUNCTION gerar_chave_acesso_nfe(
  p_uf VARCHAR(2),
  p_ano_mes VARCHAR(4),
  p_cnpj VARCHAR(14),
  p_modelo VARCHAR(2),
  p_serie INTEGER,
  p_numero BIGINT,
  p_tipo_emissao INTEGER DEFAULT 1,
  p_codigo_numerico INTEGER DEFAULT NULL
)
RETURNS VARCHAR(44) AS $$
DECLARE
  v_chave_sem_dv VARCHAR(43);
  v_codigo_numerico VARCHAR(8);
  v_digito_verificador INTEGER;
  v_chave_completa VARCHAR(44);
  v_codigo_uf VARCHAR(2);
  v_cnpj_limpo VARCHAR(14);
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
  
  -- Limpar CNPJ (apenas números) UMA VEZ
  v_cnpj_limpo := REGEXP_REPLACE(p_cnpj, '[^0-9]', '', 'g');
  
  -- Gerar código numérico aleatório se não fornecido
  IF p_codigo_numerico IS NULL THEN
    v_codigo_numerico := LPAD((RANDOM() * 99999999)::INTEGER::TEXT, 8, '0');
  ELSE
    v_codigo_numerico := LPAD(p_codigo_numerico::TEXT, 8, '0');
  END IF;
  
  -- Montar chave sem DV (43 caracteres)
  -- Formato: cUF(2) + AAMM(4) + CNPJ(14) + mod(2) + serie(3) + nNF(9) + tpEmis(1) + cNF(8) = 43
  v_chave_sem_dv := 
    v_codigo_uf ||                              -- 2 dígitos
    p_ano_mes ||                                -- 4 dígitos
    v_cnpj_limpo ||                             -- 14 dígitos
    LPAD(p_modelo, 2, '0') ||                   -- 2 dígitos
    LPAD(p_serie::TEXT, 3, '0') ||              -- 3 dígitos
    LPAD(p_numero::TEXT, 9, '0') ||             -- 9 dígitos
    p_tipo_emissao::TEXT ||                     -- 1 dígito
    v_codigo_numerico;                          -- 8 dígitos
  
  -- Calcular dígito verificador (Módulo 11)
  v_digito_verificador := calcular_dv_modulo11(v_chave_sem_dv);
  
  -- Montar chave completa (44 caracteres)
  v_chave_completa := v_chave_sem_dv || v_digito_verificador::TEXT;
  
  RETURN v_chave_completa;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION gerar_chave_acesso_nfe IS '✅ CORRIGIDO: Gera chave de acesso de 44 dígitos para NF-e/NFC-e';
