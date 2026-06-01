-- ═══════════════════════════════════════════════════════════════════════════════
-- MELHORIAS: MÓDULO INADIMPLÊNCIA
-- Execute no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Múltiplos canais em interações
ALTER TABLE inadimplencia_interacoes
  ADD COLUMN IF NOT EXISTS canais TEXT[] DEFAULT '{}';

-- Migra canal existente para canais (apenas onde canais ainda está vazio)
UPDATE inadimplencia_interacoes
  SET canais = ARRAY[canal]
  WHERE (canais IS NULL OR canais = '{}') AND canal IS NOT NULL;

-- 2. Títulos negociados em negociações (snapshot dos CR agrupados)
ALTER TABLE inadimplencia_negociacoes
  ADD COLUMN IF NOT EXISTS titulos_negociados JSONB DEFAULT '[]';

-- 3. Bucket para anexos de interações (execute no Supabase Dashboard → Storage → New bucket)
--   Nome: inadimplencia-anexos  |  Public: SIM  |  Max: 10 MB
--   MIME permitidos: image/jpeg, image/png, image/webp, application/pdf
-- Ou via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('inadimplencia-anexos', 'inadimplencia-anexos', true)
-- ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
