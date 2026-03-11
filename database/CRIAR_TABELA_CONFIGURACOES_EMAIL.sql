-- =============================================================
-- CONFIGURAÇÕES DE EMAIL (SMTP)
-- Execute no SQL Editor do Supabase
-- =============================================================

CREATE TABLE IF NOT EXISTS configuracoes_email (
  id              SERIAL PRIMARY KEY,
  empresa_id      INTEGER REFERENCES empresas(id) ON DELETE CASCADE,

  -- Identificação da conta
  nome_remetente  TEXT NOT NULL DEFAULT 'CRESCI E PERDI',
  email_remetente TEXT NOT NULL,

  -- SMTP
  smtp_host       TEXT NOT NULL,
  smtp_porta      INTEGER NOT NULL DEFAULT 587,
  smtp_usuario    TEXT NOT NULL,
  smtp_senha      TEXT NOT NULL,
  smtp_seguranca  TEXT NOT NULL DEFAULT 'STARTTLS',  -- 'STARTTLS' | 'SSL/TLS' | 'NONE'

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índice por empresa
CREATE UNIQUE INDEX IF NOT EXISTS idx_config_email_empresa
  ON configuracoes_email (empresa_id);

-- RLS
ALTER TABLE configuracoes_email ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS config_email_select ON configuracoes_email;
DROP POLICY IF EXISTS config_email_insert ON configuracoes_email;
DROP POLICY IF EXISTS config_email_update ON configuracoes_email;
DROP POLICY IF EXISTS config_email_delete ON configuracoes_email;

CREATE POLICY config_email_select ON configuracoes_email FOR SELECT TO authenticated
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid() LIMIT 1));

CREATE POLICY config_email_insert ON configuracoes_email FOR INSERT TO authenticated
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid() LIMIT 1));

CREATE POLICY config_email_update ON configuracoes_email FOR UPDATE TO authenticated
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid() LIMIT 1))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid() LIMIT 1));

CREATE POLICY config_email_delete ON configuracoes_email FOR DELETE TO authenticated
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid() LIMIT 1));
