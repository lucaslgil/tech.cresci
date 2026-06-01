-- =====================================================
-- CRON DIÁRIO 20h — Sincronização Contas a Receber Solutto
-- =====================================================
-- Agenda um job no pg_cron que chama a Edge Function
-- `solutto-sync-contas-receber-novas` todos os dias às 20h (BRT = UTC-3),
-- ou seja, 23h UTC. Como a Edge processa um lote por chamada (10 clientes),
-- o cron dispara várias vezes seguidas até esvaziar a fila ou esgotar a janela.
-- =====================================================
-- PRÉ-REQUISITOS
-- =====================================================
-- 1) Habilitar extensões (uma vez, no Supabase Dashboard → Database → Extensions
--    ou via SQL abaixo). O Supabase já costuma deixá-las disponíveis.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;  -- para http_post assíncrono

-- 2) Definir as variáveis de ambiente do projeto. Substitua os valores
--    antes de executar este script.
--    SUPABASE_URL e CRON_SECRET DEVEM bater com os valores configurados
--    como secrets da Edge Function.

-- Armazena os valores em uma tabela auxiliar para fácil consulta pelo job
CREATE TABLE IF NOT EXISTS app_settings (
    chave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
);

-- AJUSTE OS VALORES ABAIXO:
INSERT INTO app_settings (chave, valor) VALUES
    ('supabase_url', 'https://alylochrlvgcvjdmkmum.supabase.co'),
    ('cron_secret',  'I1dNTvnEcQus39fh2b7wQY6tUhqShCHysGHRwA6wo')
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;

-- =====================================================
-- FUNÇÃO QUE DISPARA A EDGE FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION cron_solutto_sync_contas_receber()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_supabase_url TEXT;
    v_cron_secret  TEXT;
    v_url          TEXT;
BEGIN
    SELECT valor INTO v_supabase_url FROM app_settings WHERE chave = 'supabase_url';
    SELECT valor INTO v_cron_secret  FROM app_settings WHERE chave = 'cron_secret';

    v_url := v_supabase_url || '/functions/v1/solutto-sync-contas-receber-novas';

    -- Dispara HTTP POST assíncrono (não bloqueia o cron worker)
    PERFORM net.http_post(
        url     := v_url,
        headers := jsonb_build_object(
            'Content-Type',    'application/json',
            'X-Cron-Secret',   v_cron_secret
        ),
        body    := jsonb_build_object('limite', 50)
    );
END;
$$;

-- =====================================================
-- AGENDAMENTO
-- =====================================================
-- Remove agendamento anterior (idempotente)
SELECT cron.unschedule('solutto-sync-contas-receber-diario')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'solutto-sync-contas-receber-diario'
);

-- Agenda: 23:00 UTC = 20:00 horário de Brasília (UTC-3)
-- Formato: minute hour day month day_of_week
SELECT cron.schedule(
    'solutto-sync-contas-receber-diario',
    '0 23 * * *',
    $$SELECT cron_solutto_sync_contas_receber();$$
);

-- Agenda chamadas de "drenagem" subsequentes a cada 2 minutos
-- entre 23h05 e 23h59 UTC, para varrer mais clientes em lotes.
-- Cada chamada processa até 50 clientes; permite até ~28 chamadas/noite.
SELECT cron.unschedule('solutto-sync-contas-receber-drenagem')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'solutto-sync-contas-receber-drenagem'
);

SELECT cron.schedule(
    'solutto-sync-contas-receber-drenagem',
    '*/2 23 * * *',
    $$SELECT cron_solutto_sync_contas_receber();$$
);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- SELECT * FROM cron.job;
-- SELECT * FROM cron.job_run_details
--   WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname LIKE 'solutto%')
--   ORDER BY start_time DESC LIMIT 20;
