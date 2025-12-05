-- ====================================
-- ATUALIZAR STATUS DE VENDAS
-- Remover status antigos e adicionar novos
-- Data: 04/12/2025
-- ====================================

BEGIN;

-- ====================================
-- 1. REMOVER CONSTRAINT ANTIGA DE STATUS
-- ====================================

ALTER TABLE vendas 
DROP CONSTRAINT IF EXISTS vendas_status_check;

-- ====================================
-- 2. ADICIONAR NOVA CONSTRAINT COM STATUS CORRETOS
-- ====================================

ALTER TABLE vendas
ADD CONSTRAINT vendas_status_check 
CHECK (status IN ('ORCAMENTO', 'PEDIDO_ABERTO', 'PEDIDO_FECHADO', 'CANCELADO'));

-- ====================================
-- 3. ATUALIZAR VENDAS EXISTENTES
-- ====================================

-- Converter status antigos para novos
UPDATE vendas 
SET status = 'PEDIDO_FECHADO' 
WHERE status IN ('APROVADO', 'EM_SEPARACAO', 'FATURADO', 'ENTREGUE');

UPDATE vendas 
SET status = 'ORCAMENTO' 
WHERE status NOT IN ('ORCAMENTO', 'PEDIDO_ABERTO', 'PEDIDO_FECHADO', 'CANCELADO');

-- ====================================
-- 4. COMENTÁRIO EXPLICATIVO
-- ====================================

COMMENT ON COLUMN vendas.status IS 'Status da venda: ORCAMENTO, PEDIDO_ABERTO, PEDIDO_FECHADO, CANCELADO';

COMMIT;

-- ====================================
-- VERIFICAÇÃO
-- ====================================

SELECT status, COUNT(*) as quantidade
FROM vendas
GROUP BY status
ORDER BY status;
