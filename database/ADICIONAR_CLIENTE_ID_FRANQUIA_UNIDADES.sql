-- =====================================================
-- ADICIONAR VÍNCULO CLIENTE → UNIDADE FRANQUEADA
-- Data: 2026-03-05
-- Descrição: Permite vincular um cliente cadastrado
--            (tabela clientes) a uma unidade franqueada
-- =====================================================

-- Adicionar coluna cliente_id na tabela franquia_unidades
ALTER TABLE franquia_unidades
  ADD COLUMN IF NOT EXISTS cliente_id BIGINT
    REFERENCES clientes(id) ON DELETE SET NULL;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_franquia_unidades_cliente_id
  ON franquia_unidades(cliente_id);

-- Comentário
COMMENT ON COLUMN franquia_unidades.cliente_id IS
  'Referência ao cadastro de cliente vinculado a esta unidade';
