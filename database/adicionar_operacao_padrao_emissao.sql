-- =====================================================
-- ADICIONAR CAMPO OPERAÇÃO PADRÃO DE EMISSÃO
-- Marca uma operação fiscal como padrão do sistema
-- Data: 02/02/2026
-- =====================================================

-- Adicionar coluna operacao_padrao na tabela operacoes_fiscais
ALTER TABLE operacoes_fiscais 
ADD COLUMN IF NOT EXISTS operacao_padrao BOOLEAN DEFAULT false;

-- Criar índice para busca rápida da operação padrão
CREATE INDEX IF NOT EXISTS idx_operacoes_padrao 
ON operacoes_fiscais(operacao_padrao) 
WHERE operacao_padrao = true;

-- Comentário
COMMENT ON COLUMN operacoes_fiscais.operacao_padrao IS 'Define se esta operação é o padrão do sistema para emissão de notas';

-- =====================================================
-- FUNÇÃO: Garantir apenas uma operação padrão ativa
-- =====================================================

CREATE OR REPLACE FUNCTION garantir_unica_operacao_padrao()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está marcando como padrão, desmarcar todas as outras
  IF NEW.operacao_padrao = true THEN
    UPDATE operacoes_fiscais 
    SET operacao_padrao = false 
    WHERE id != NEW.id 
    AND operacao_padrao = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trg_garantir_unica_operacao_padrao ON operacoes_fiscais;

CREATE TRIGGER trg_garantir_unica_operacao_padrao
BEFORE INSERT OR UPDATE OF operacao_padrao ON operacoes_fiscais
FOR EACH ROW
EXECUTE FUNCTION garantir_unica_operacao_padrao();

-- =====================================================
-- MARCAR OPERAÇÃO "VENDA" COMO PADRÃO (se existir)
-- =====================================================

UPDATE operacoes_fiscais 
SET operacao_padrao = true 
WHERE id = (
  SELECT id 
  FROM operacoes_fiscais
  WHERE codigo = 'VENDA' 
  AND ativo = true
  LIMIT 1
);
