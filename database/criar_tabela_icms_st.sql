-- =====================================================
-- TABELA: ICMS-ST POR UF
-- Centraliza MVA e alíquotas internas por par (UF origem, UF destino) e NCM/CEST
-- Data: 23/12/2025
-- =====================================================

CREATE TABLE IF NOT EXISTS icms_st_por_uf (
  id BIGSERIAL PRIMARY KEY,
  uf_origem VARCHAR(2) NOT NULL,
  uf_destino VARCHAR(2) NOT NULL,
  ncm VARCHAR(8),
  cest VARCHAR(7),
  mva NUMERIC(7,4) DEFAULT 0.0000, -- % MVA
  aliquota_interna NUMERIC(7,4) DEFAULT 0.0000, -- % alíquota interna do estado destino
  aliquota_fcp NUMERIC(7,4) DEFAULT 0.0000, -- % FCP ST
  modalidade_bc_st VARCHAR(10),
  reducao_bc_st NUMERIC(7,4) DEFAULT 0.0000,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_icmsst_uf_ncm ON icms_st_por_uf(uf_origem, uf_destino, ncm) WHERE ncm IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_icmsst_uf ON icms_st_por_uf(uf_origem, uf_destino);
CREATE INDEX IF NOT EXISTS idx_icmsst_ativo ON icms_st_por_uf(ativo);

-- Triggers
CREATE OR REPLACE FUNCTION update_icmsst_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_icmsst_updated_at ON icms_st_por_uf;
CREATE TRIGGER trigger_icmsst_updated_at
  BEFORE UPDATE ON icms_st_por_uf
  FOR EACH ROW
  EXECUTE FUNCTION update_icmsst_updated_at();

-- RLS
ALTER TABLE icms_st_por_uf ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários autenticados podem ver ICMS-ST" ON icms_st_por_uf;
CREATE POLICY "Usuários autenticados podem ver ICMS-ST"
  ON icms_st_por_uf FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem manipular ICMS-ST" ON icms_st_por_uf;
CREATE POLICY "Usuários autenticados podem manipular ICMS-ST"
  ON icms_st_por_uf FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

COMMENT ON TABLE icms_st_por_uf IS 'Tabela com MVA / aliquotas e configurações de ICMS-ST por par UF origem/destino e NCM/CEST';
COMMENT ON COLUMN icms_st_por_uf.mva IS 'Margem de Valor Agregado (MVA) em percentual (ex: 40.00)';
COMMENT ON COLUMN icms_st_por_uf.aliquota_interna IS 'Alíquota interna do estado destino em percentual';
COMMENT ON COLUMN icms_st_por_uf.aliquota_fcp IS 'Percentual de FCP para ST';

-- Dados iniciais mínimos (opcional)
INSERT INTO icms_st_por_uf (uf_origem, uf_destino, ncm, mva, aliquota_interna, ativo)
SELECT 'SP','RJ', NULL, 40.0, 18.0, true
WHERE NOT EXISTS (SELECT 1 FROM icms_st_por_uf WHERE uf_origem='SP' AND uf_destino='RJ' AND ncm IS NULL);
