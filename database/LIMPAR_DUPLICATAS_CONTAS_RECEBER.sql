-- =====================================================
-- SCRIPT PARA LIMPAR DUPLICATAS EM CONTAS_RECEBER
-- Execute este script no Supabase SQL Editor
-- Data: 11/12/2025
-- =====================================================

-- 1. Identificar duplicatas (para visualizar antes de deletar)
SELECT 
    venda_id,
    forma_pagamento,
    valor_original,
    data_vencimento,
    COUNT(*) as quantidade
FROM contas_receber
WHERE venda_id IS NOT NULL
GROUP BY venda_id, forma_pagamento, valor_original, data_vencimento
HAVING COUNT(*) > 1
ORDER BY venda_id;

-- 2. Deletar duplicatas, mantendo apenas o registro mais antigo (menor ID)
-- ATENÇÃO: Execute este comando apenas após verificar os resultados acima!

DELETE FROM contas_receber
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY venda_id, forma_pagamento, valor_original, data_vencimento 
                ORDER BY id ASC
            ) as rn
        FROM contas_receber
        WHERE venda_id IS NOT NULL
    ) t
    WHERE rn > 1
);

-- 3. Verificar se ainda existem duplicatas (deve retornar vazio)
SELECT 
    venda_id,
    forma_pagamento,
    valor_original,
    data_vencimento,
    COUNT(*) as quantidade
FROM contas_receber
WHERE venda_id IS NOT NULL
GROUP BY venda_id, forma_pagamento, valor_original, data_vencimento
HAVING COUNT(*) > 1;
