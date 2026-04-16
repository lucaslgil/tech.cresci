-- ============================================================
-- EXECUTE CADA QUERY SEPARADA NO SQL EDITOR DO SUPABASE
-- ============================================================

-- QUERY 1: empresa_id das notas (copie o valor)
SELECT id, numero, empresa_id AS nota_empresa_id
FROM notas_fiscais;

-- QUERY 2: empresa_id dos usuários (copie o valor)
SELECT id, email, empresa_id AS usuario_empresa_id
FROM usuarios;

-- QUERY 3: comparação direta — mostra se batem ou não
SELECT
  nf.id,
  nf.numero,
  nf.empresa_id AS nota_empresa_id,
  u.email,
  u.empresa_id AS usuario_empresa_id,
  CASE WHEN nf.empresa_id = u.empresa_id THEN '✅ OK' ELSE '❌ DIVERGENTE' END AS situacao
FROM notas_fiscais nf
CROSS JOIN usuarios u;

-- ============================================================
-- CORREÇÃO: iguala o empresa_id da nota ao do usuário
-- (usa o empresa_id do primeiro usuário cadastrado)
-- ============================================================

UPDATE notas_fiscais
SET empresa_id = (SELECT empresa_id FROM usuarios ORDER BY created_at LIMIT 1);

-- CONFIRMA:
SELECT nf.id, nf.numero, nf.empresa_id AS nota_empresa_id, u.empresa_id AS usuario_empresa_id
FROM notas_fiscais nf
CROSS JOIN usuarios u;
