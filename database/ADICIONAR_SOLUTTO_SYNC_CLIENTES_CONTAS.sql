-- =====================================================
-- MIGRAÇÃO: Campo de controle de sync Solutto em clientes
-- Data: 17/04/2026
-- =====================================================

-- 1. Adicionar campo de controle de última sync de contas a receber por cliente
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS solutto_contas_sincronizado_em TIMESTAMPTZ;

COMMENT ON COLUMN clientes.solutto_contas_sincronizado_em
  IS 'Última vez que as contas a receber deste cliente foram sincronizadas via Solutto';

-- Índice para ordenação por prioridade (clientes não sincronizados aparecem primeiro)
CREATE INDEX IF NOT EXISTS idx_clientes_solutto_contas_sync
  ON clientes (solutto_contas_sincronizado_em ASC NULLS FIRST)
  WHERE solutto_cliente_id IS NOT NULL;

-- =====================================================
-- AGENDAMENTO AUTOMÁTICO (pg_cron) - 3x por dia
-- =====================================================
-- Para ativar:
-- 1. Habilite a extensão pg_cron no Dashboard > Database > Extensions
-- 2. Substitua os valores abaixo e execute os comandos
-- =====================================================

-- Habilitar extensão (se ainda não estiver ativa)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar sync às 06h, 12h e 18h (horário de Brasília = UTC-3 → 09h, 15h, 21h UTC)
-- Substitua SUPABASE_URL pela URL do seu projeto e SERVICE_ROLE_KEY pela chave de serviço
-- e CRON_SECRET pelo valor definido no secret da Edge Function

/*
SELECT cron.schedule(
  'solutto-sync-contas-manha',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://alylochrlvgcvjdmkmum.supabase.co/functions/v1/solutto-sync-all-contas',
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'apikey',         'SEU_ANON_KEY',
      'X-Cron-Secret',  'SEU_CRON_SECRET'
    ),
    body    := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'solutto-sync-contas-tarde',
  '0 15 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://alylochrlvgcvjdmkmum.supabase.co/functions/v1/solutto-sync-all-contas',
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'apikey',         'SEU_ANON_KEY',
      'X-Cron-Secret',  'SEU_CRON_SECRET'
    ),
    body    := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'solutto-sync-contas-noite',
  '0 21 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://alylochrlvgcvjdmkmum.supabase.co/functions/v1/solutto-sync-all-contas',
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'apikey',         'SEU_ANON_KEY',
      'X-Cron-Secret',  'SEU_CRON_SECRET'
    ),
    body    := '{}'::jsonb
  );
  $$
);
*/

-- Para verificar jobs agendados:
-- SELECT * FROM cron.job;

-- Para remover um job:
-- SELECT cron.unschedule('solutto-sync-contas-manha');
