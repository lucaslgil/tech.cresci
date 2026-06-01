-- =====================================================
-- DEDUPLICAÇÃO DE CLIENTES - CPF / CNPJ DUPLICADOS
--
-- Problema: banco com 1.460 clientes vs 1.313 na Solutto.
-- Os extras são duplicatas do mesmo CPF/CNPJ.
--
-- Estratégia de escolha do registro a MANTER:
--   1. Prefere o que já tem solutto_cliente_id vinculado
--   2. Em caso de empate, mantém o mais antigo (menor created_at)
--
-- ⚠️  Execute no SQL Editor do Supabase.
--     Faça backup antes se necessário.
-- =====================================================

BEGIN;

-- =====================================================
-- DIAGNÓSTICO ANTES DA LIMPEZA
-- =====================================================

DO $$
DECLARE
  v_total        INTEGER;
  v_dup_cpf      INTEGER;
  v_dup_cnpj     INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM clientes;

  SELECT COUNT(*) INTO v_dup_cpf
  FROM (
    SELECT cpf FROM clientes
    WHERE cpf IS NOT NULL AND cpf <> ''
    GROUP BY cpf HAVING COUNT(*) > 1
  ) t;

  SELECT COUNT(*) INTO v_dup_cnpj
  FROM (
    SELECT cnpj FROM clientes
    WHERE cnpj IS NOT NULL AND cnpj <> ''
    GROUP BY cnpj HAVING COUNT(*) > 1
  ) t;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'SITUAÇÃO ANTES DA DEDUPLICAÇÃO:';
  RAISE NOTICE '  Total clientes      : %', v_total;
  RAISE NOTICE '  CPFs  duplicados    : %', v_dup_cpf;
  RAISE NOTICE '  CNPJs duplicados    : %', v_dup_cnpj;
  RAISE NOTICE '==============================================';
END $$;

-- =====================================================
-- DEDUPLICAR POR CPF
-- Mantém: quem tem solutto_cliente_id (ou o mais antigo)
-- =====================================================

DELETE FROM clientes
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY cpf
        ORDER BY
          CASE WHEN solutto_cliente_id IS NOT NULL THEN 0 ELSE 1 END ASC,
          created_at ASC
      ) AS rn
    FROM clientes
    WHERE cpf IS NOT NULL AND cpf <> ''
  ) ranked
  WHERE rn > 1
);

-- =====================================================
-- DEDUPLICAR POR CNPJ
-- Mantém: quem tem solutto_cliente_id (ou o mais antigo)
-- =====================================================

DELETE FROM clientes
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY cnpj
        ORDER BY
          CASE WHEN solutto_cliente_id IS NOT NULL THEN 0 ELSE 1 END ASC,
          created_at ASC
      ) AS rn
    FROM clientes
    WHERE cnpj IS NOT NULL AND cnpj <> ''
  ) ranked
  WHERE rn > 1
);

-- =====================================================
-- DIAGNÓSTICO DEPOIS DA LIMPEZA
-- =====================================================

DO $$
DECLARE
  v_total   INTEGER;
  v_dup_cpf INTEGER;
  v_dup_cnpj INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM clientes;

  SELECT COUNT(*) INTO v_dup_cpf
  FROM (
    SELECT cpf FROM clientes
    WHERE cpf IS NOT NULL AND cpf <> ''
    GROUP BY cpf HAVING COUNT(*) > 1
  ) t;

  SELECT COUNT(*) INTO v_dup_cnpj
  FROM (
    SELECT cnpj FROM clientes
    WHERE cnpj IS NOT NULL AND cnpj <> ''
    GROUP BY cnpj HAVING COUNT(*) > 1
  ) t;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'SITUAÇÃO APÓS A DEDUPLICAÇÃO:';
  RAISE NOTICE '  Total clientes      : %', v_total;
  RAISE NOTICE '  CPFs  duplicados    : %', v_dup_cpf;
  RAISE NOTICE '  CNPJs duplicados    : %', v_dup_cnpj;
  RAISE NOTICE '==============================================';
END $$;

COMMIT;
