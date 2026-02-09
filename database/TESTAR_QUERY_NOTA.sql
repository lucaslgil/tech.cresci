-- Testar se a query da Edge Function funciona
-- Substitua 999 pelo ID da nota que foi criada

SELECT 
  nf.*,
  e.id as empresa_id,
  e.cnpj as empresa_cnpj,
  e.razao_social as empresa_razao_social,
  e.certificado_digital as empresa_certificado_digital
FROM notas_fiscais nf
JOIN empresas e ON e.id = nf.empresa_id
WHERE nf.id = 999
ORDER BY nf.id DESC
LIMIT 5;

-- Se não retornar nada, veja as últimas notas criadas:
SELECT id, empresa_id, numero, serie, status, created_at
FROM notas_fiscais
ORDER BY created_at DESC
LIMIT 5;
