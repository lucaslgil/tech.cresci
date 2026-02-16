-- =====================================================
-- CRIAÇÃO DA TABELA formas_pagamento
-- Execute no Supabase SQL Editor para tornar disponível às instâncias PDV
-- Data: 2026-02-13
-- =====================================================

-- Tabela de Formas de Pagamento (catálogo)
CREATE TABLE IF NOT EXISTS formas_pagamento (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT REFERENCES empresas(id) ON DELETE RESTRICT,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  parametros JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formas_pagamento_empresa ON formas_pagamento(empresa_id);
-- Criar índice único para permitir ON CONFLICT (codigo)
CREATE UNIQUE INDEX IF NOT EXISTS idx_formas_pagamento_codigo_unique ON formas_pagamento(codigo);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_formas_pagamento_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_formas_pagamento_timestamp
  BEFORE UPDATE ON formas_pagamento
  FOR EACH ROW
  EXECUTE FUNCTION update_formas_pagamento_timestamp();

-- RLS (Habilitar apenas se o projeto usar Row-Level Security)
-- ALTER TABLE formas_pagamento ENABLE ROW LEVEL SECURITY;

-- Exemplos de policies (ajustar conforme política da aplicação)
--
-- CREATE POLICY "Permitir seleção de formas"
--   ON formas_pagamento FOR SELECT
--   USING (true);
--
-- CREATE POLICY "Permitir inserção de formas autenticado"
--   ON formas_pagamento FOR INSERT
--   WITH CHECK (auth.uid() IS NOT NULL);

-- Inserir formas padrão (opcional)
-- Observação: se você usa múltiplas empresas, ajuste empresa_id conforme necessário
INSERT INTO formas_pagamento (empresa_id, codigo, nome, ativo)
SELECT NULL, v.codigo, v.nome, TRUE FROM (
  VALUES
    ('DIN', 'Dinheiro'),
    ('CC', 'Cartão de Crédito'),
    ('CD', 'Cartão de Débito'),
    ('PIX', 'PIX')
) AS v(codigo, nome)
ON CONFLICT (codigo) DO NOTHING;

-- NOTA: Após aplicar este script, execute a rotina de sincronização no PDV
-- (ou aguarde o próximo sync) para popular a tabela local SQLite `formas_pagamento`.
