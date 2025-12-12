-- =====================================================
-- SCRIPT PARA LIMPAR CONTAS SEM FORMA DE PAGAMENTO
-- Execute este script no Supabase SQL Editor
-- Data: 11/12/2025
-- =====================================================

-- 1. Visualizar contas com forma_pagamento vazia ou nula
SELECT 
    id,
    venda_id,
    cliente_nome,
    valor_original,
    data_vencimento,
    forma_pagamento,
    created_at
FROM contas_receber
WHERE forma_pagamento IS NULL 
   OR forma_pagamento = ''
   OR TRIM(forma_pagamento) = ''
ORDER BY created_at DESC;

-- 2. Deletar contas com forma_pagamento vazia
-- ATENÇÃO: Execute este comando apenas após verificar os resultados acima!

DELETE FROM contas_receber
WHERE forma_pagamento IS NULL 
   OR forma_pagamento = ''
   OR TRIM(forma_pagamento) = '';

-- 3. Verificar se ainda existem registros com forma_pagamento vazia (deve retornar vazio)
SELECT 
    id,
    venda_id,
    cliente_nome,
    valor_original,
    forma_pagamento
FROM contas_receber
WHERE forma_pagamento IS NULL 
   OR forma_pagamento = ''
   OR TRIM(forma_pagamento) = '';
