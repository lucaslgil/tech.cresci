-- ============================================================
-- TABELA: radar_relatorios_salvos
-- Armazena relatórios do Radar de Inatividade por empresa/usuário
-- ============================================================

CREATE TABLE IF NOT EXISTS radar_relatorios_salvos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  INTEGER     NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo      TEXT        NOT NULL,
  resumo      TEXT        NOT NULL DEFAULT '',
  resultado   JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para buscas rápidas por empresa
CREATE INDEX IF NOT EXISTS idx_radar_relatorios_empresa
  ON radar_relatorios_salvos (empresa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_radar_relatorios_usuario
  ON radar_relatorios_salvos (usuario_id, created_at DESC);

-- ============================================================
-- RLS (Row Level Security)
-- Cada empresa só vê seus próprios relatórios
-- ============================================================

ALTER TABLE radar_relatorios_salvos ENABLE ROW LEVEL SECURITY;

-- Leitura: usuário vê relatórios da sua empresa
CREATE POLICY "radar_relatorios_select"
  ON radar_relatorios_salvos
  FOR SELECT
  USING (
    empresa_id = (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- Inserção: usuário só insere para sua empresa
CREATE POLICY "radar_relatorios_insert"
  ON radar_relatorios_salvos
  FOR INSERT
  WITH CHECK (
    empresa_id = (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
    AND usuario_id = auth.uid()
  );

-- Exclusão: usuário só exclui relatórios da sua empresa
CREATE POLICY "radar_relatorios_delete"
  ON radar_relatorios_salvos
  FOR DELETE
  USING (
    empresa_id = (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );
