-- =====================================================
-- LIMPEZA COMPLETA DA BASE DE CLIENTES
-- Para ressincronização com a Solutto
--
-- ⚠️  ATENÇÃO: OPERAÇÃO IRREVERSÍVEL
--     Execute SOMENTE no SQL Editor do Supabase
--     Faça backup antes se necessário
--
-- Dependências tratadas:
--   clientes_historico   → deletado em cascata
--   clientes_contatos    → deletado em cascata
--   clientes_enderecos   → deletado em cascata
--   contas_receber       → cliente_id zerado (ON DELETE RESTRICT)
--   unidades.cliente_id  → zerado automaticamente (ON DELETE SET NULL)
--   unidades.franqueado_id → zerado automaticamente (ON DELETE SET NULL)
-- =====================================================

BEGIN;

-- =====================================================
-- ETAPA 0: RELATÓRIO ANTES DA LIMPEZA
-- =====================================================

DO $$
DECLARE
  v_clientes       INTEGER;
  v_enderecos      INTEGER;
  v_contatos       INTEGER;
  v_historico      INTEGER;
  v_contas_rec     INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_clientes    FROM clientes;
  SELECT COUNT(*) INTO v_enderecos   FROM clientes_enderecos;
  SELECT COUNT(*) INTO v_contatos    FROM clientes_contatos;
  SELECT COUNT(*) INTO v_contas_rec  FROM contas_receber WHERE cliente_id IS NOT NULL;

  -- clientes_historico pode não existir em todas as instâncias
  BEGIN
    EXECUTE 'SELECT COUNT(*) FROM clientes_historico' INTO v_historico;
  EXCEPTION WHEN undefined_table THEN
    v_historico := 0;
  END;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'SITUAÇÃO ANTES DA LIMPEZA:';
  RAISE NOTICE '  clientes           : %', v_clientes;
  RAISE NOTICE '  clientes_enderecos : %', v_enderecos;
  RAISE NOTICE '  clientes_contatos  : %', v_contatos;
  RAISE NOTICE '  clientes_historico : %', v_historico;
  RAISE NOTICE '  contas_receber com cliente_id: %', v_contas_rec;
  RAISE NOTICE '==============================================';
END $$;

-- =====================================================
-- ETAPA 1: REMOVER VÍNCULOS EM CONTAS_RECEBER
-- (ON DELETE RESTRICT — precisa ser feito manualmente)
-- Os dados financeiros são preservados; apenas o vínculo é desfeito.
-- =====================================================

UPDATE contas_receber
SET cliente_id = NULL
WHERE cliente_id IS NOT NULL;

-- =====================================================
-- ETAPA 2: DELETAR TABELAS FILHAS
-- =====================================================

DELETE FROM clientes_enderecos;
DELETE FROM clientes_contatos;

-- clientes_historico (tabela opcional — ignora se não existir)
DO $$
BEGIN
  DELETE FROM clientes_historico;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Tabela clientes_historico não encontrada — ignorando.';
END $$;

-- =====================================================
-- ETAPA 3: DELETAR TODOS OS CLIENTES
-- (unidades.cliente_id e unidades.franqueado_id são
--  zerados automaticamente pelo ON DELETE SET NULL)
-- =====================================================

DELETE FROM clientes;

-- =====================================================
-- ETAPA 4: RELATÓRIO FINAL
-- =====================================================

DO $$
DECLARE
  v_clientes   INTEGER;
  v_enderecos  INTEGER;
  v_contatos   INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_clientes   FROM clientes;
  SELECT COUNT(*) INTO v_enderecos  FROM clientes_enderecos;
  SELECT COUNT(*) INTO v_contatos   FROM clientes_contatos;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'LIMPEZA CONCLUÍDA:';
  RAISE NOTICE '  clientes           : %', v_clientes;
  RAISE NOTICE '  clientes_enderecos : %', v_enderecos;
  RAISE NOTICE '  clientes_contatos  : %', v_contatos;
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Próximo passo: acesse Cadastros > Clientes';
  RAISE NOTICE 'e execute a Sincronização com Solutto.';
  RAISE NOTICE '==============================================';
END $$;

COMMIT;

-- =====================================================
-- APÓS EXECUTAR ESTE SCRIPT:
--
-- 1. Acesse o sistema: Cadastros > Clientes
-- 2. Clique em "Sincronizar com Solutto"
-- 3. Aguarde o processo completar
--
-- A sincronização irá recriar todos os clientes
-- com os dados atualizados da Solutto, incluindo
-- o status correto (ATIVO/INATIVO via tag <Status>).
-- =====================================================
