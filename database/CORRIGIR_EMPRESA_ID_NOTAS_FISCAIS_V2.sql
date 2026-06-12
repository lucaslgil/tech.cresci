-- ============================================================
-- DIAGNÓSTICO E CORREÇÃO: empresa_id em notas_fiscais
-- Execute cada bloco separadamente no SQL Editor do Supabase
-- ============================================================

-- PASSO 1 — Diagnóstico: confira se os empresa_id batem
SELECT
  nf.id          AS nota_id,
  nf.numero,
  nf.empresa_id  AS nota_empresa_id,
  u.email,
  u.empresa_id   AS usuario_empresa_id,
  CASE
    WHEN nf.empresa_id = u.empresa_id THEN '✅ OK'
    ELSE '❌ DIVERGENTE — nota não aparecerá no front-end'
  END AS situacao
FROM notas_fiscais nf
CROSS JOIN usuarios u
ORDER BY nf.id;

-- ============================================================
-- PASSO 2 — Correção: iguala empresa_id de todas as notas
-- ao empresa_id do primeiro usuário cadastrado.
-- Execute SOMENTE se o PASSO 1 mostrar ❌ DIVERGENTE.
-- ============================================================

UPDATE notas_fiscais
SET empresa_id = (
  SELECT empresa_id FROM usuarios ORDER BY created_at LIMIT 1
);

-- PASSO 3 — Confirma correção
SELECT nf.id, nf.numero, nf.empresa_id AS nota_empresa_id, u.empresa_id AS usuario_empresa_id,
       CASE WHEN nf.empresa_id = u.empresa_id THEN '✅ OK' ELSE '❌ AINDA DIVERGENTE' END AS situacao
FROM notas_fiscais nf
CROSS JOIN usuarios u;
