-- =====================================================================
-- ADICIONAR franqueado_id E VINCULAR EM MASSA
-- Cole tudo no Supabase SQL Editor e execute.
-- =====================================================================

-- 1. Cria a coluna
ALTER TABLE franquia_unidades
  ADD COLUMN IF NOT EXISTS franqueado_id integer REFERENCES clientes(id) ON DELETE SET NULL;

-- 2. Índice
CREATE INDEX IF NOT EXISTS idx_franquia_unidades_franqueado_id
  ON franquia_unidades (franqueado_id);

-- 3. Vincula pelo nome_franqueado já salvo (cruza com clientes PF)
UPDATE franquia_unidades u
SET
    franqueado_id = c.id,
    updated_at    = NOW()
FROM clientes c
WHERE c.empresa_id = u.empresa_id
  AND c.tipo_pessoa = 'FISICA'
  AND lower(trim(c.nome_completo)) = lower(trim(u.nome_franqueado))
  AND u.franqueado_id IS NULL
  AND u.nome_franqueado IS NOT NULL
  AND u.nome_franqueado <> '';

-- 4. Resultado
SELECT
    COUNT(*) FILTER (WHERE franqueado_id IS NOT NULL) AS com_franqueado_vinculado,
    COUNT(*) FILTER (WHERE franqueado_id IS NULL)      AS sem_franqueado_vinculado,
    COUNT(*)                                           AS total
FROM franquia_unidades;


-- =====================================================================
-- SEGUNDA PASSAGEM: 520 sem vínculo
-- Tenta bater também por razao_social / nome_fantasia (PJ ou PF)
-- =====================================================================

UPDATE franquia_unidades u
SET
    franqueado_id = c.id,
    updated_at    = NOW()
FROM clientes c
WHERE c.empresa_id = u.empresa_id
  AND (
    lower(trim(COALESCE(c.nome_completo, '')))  = lower(trim(u.nome_franqueado))
    OR lower(trim(COALESCE(c.razao_social, ''))) = lower(trim(u.nome_franqueado))
    OR lower(trim(COALESCE(c.nome_fantasia, ''))) = lower(trim(u.nome_franqueado))
  )
  AND u.franqueado_id IS NULL
  AND u.nome_franqueado IS NOT NULL
  AND u.nome_franqueado <> '';

-- Resultado após segunda passagem
SELECT
    COUNT(*) FILTER (WHERE franqueado_id IS NOT NULL) AS com_franqueado_vinculado,
    COUNT(*) FILTER (WHERE franqueado_id IS NULL)      AS sem_franqueado_vinculado,
    COUNT(*)                                           AS total
FROM franquia_unidades;

-- =====================================================================
-- DIAGNÓSTICO: quais ainda não vincularam
-- Mostra nome_franqueado das unidades sem vínculo e o cliente mais
-- parecido encontrado (para identificar diferenças de digitação)
-- =====================================================================

SELECT
    u.codigo_unidade,
    u.nome_unidade,
    u.nome_franqueado                                           AS nome_na_unidade,
    c.id                                                        AS cliente_sugerido_id,
    COALESCE(c.nome_completo, c.razao_social)                   AS nome_no_cadastro,
    c.tipo_pessoa
FROM franquia_unidades u
LEFT JOIN LATERAL (
    SELECT id, nome_completo, razao_social, tipo_pessoa
    FROM clientes
    WHERE empresa_id = u.empresa_id
      AND (
        lower(COALESCE(nome_completo,'')) LIKE '%' || lower(split_part(trim(u.nome_franqueado), ' ', 1)) || '%'
        OR lower(COALESCE(razao_social,'')) LIKE '%' || lower(split_part(trim(u.nome_franqueado), ' ', 1)) || '%'
      )
    LIMIT 1
) c ON true
WHERE u.franqueado_id IS NULL
  AND u.nome_franqueado IS NOT NULL
  AND u.nome_franqueado <> ''
ORDER BY u.nome_franqueado;
