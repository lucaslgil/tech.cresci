-- =====================================================
-- VERIFICAR TAMANHO DOS CAMPOS VARCHAR
-- Encontrar qual campo tem limite de 4 caracteres
-- Data: 14/01/2026
-- =====================================================

SELECT 
  column_name,
  data_type,
  character_maximum_length,
  CONCAT(data_type, 
    CASE 
      WHEN character_maximum_length IS NOT NULL 
      THEN CONCAT('(', character_maximum_length, ')')
      WHEN numeric_precision IS NOT NULL
      THEN CONCAT('(', numeric_precision, ',', numeric_scale, ')')
      ELSE ''
    END
  ) as tipo_completo
FROM information_schema.columns
WHERE table_name = 'regras_tributacao' 
  AND (
    (data_type = 'character varying' AND character_maximum_length <= 10)
    OR column_name IN ('csosn_icms', 'cst_icms', 'cst_pis', 'cst_cofins', 'cst_ipi')
  )
ORDER BY character_maximum_length, column_name;

-- Deve mostrar qual campo tem exatamente 4 caracteres de limite
