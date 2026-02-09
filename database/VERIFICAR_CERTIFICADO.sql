-- Ver tipo de dados da coluna certificado_digital
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_name = 'empresas' 
  AND column_name = 'certificado_digital';

-- Ver se existe certificado na empresa ID 4
SELECT 
  id,
  razao_social,
  certificado_digital IS NOT NULL as tem_certificado,
  LENGTH(certificado_digital::text) as tamanho_texto,
  certificado_senha IS NOT NULL as tem_senha
FROM empresas
WHERE id = 4;
