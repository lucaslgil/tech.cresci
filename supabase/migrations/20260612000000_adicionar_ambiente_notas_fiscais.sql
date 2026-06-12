-- Adiciona coluna ambiente em notas_fiscais para distinguir
-- emissões em homologação das emissões em produção.

ALTER TABLE notas_fiscais
  ADD COLUMN IF NOT EXISTS ambiente VARCHAR(20)
    NOT NULL DEFAULT 'HOMOLOGACAO'
    CHECK (ambiente IN ('PRODUCAO', 'HOMOLOGACAO'));

-- Registros existentes são todos de homologação
-- (o default já garante isso; UPDATE explícito por clareza)
UPDATE notas_fiscais SET ambiente = 'HOMOLOGACAO' WHERE ambiente IS NULL;

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_ambiente ON notas_fiscais(ambiente);

COMMENT ON COLUMN notas_fiscais.ambiente IS
  'Ambiente SEFAZ em que a nota foi emitida: PRODUCAO ou HOMOLOGACAO';
