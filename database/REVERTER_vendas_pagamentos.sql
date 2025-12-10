-- =====================================================
-- REVERTER TABELA VENDAS_PAGAMENTOS
-- Remove tabela duplicada (usar apenas contas_receber)
-- Data: 09/12/2025
-- =====================================================

-- IMPORTANTE: Este script remove a tabela vendas_pagamentos
-- que foi criada por engano. O sistema deve usar APENAS
-- a tabela contas_receber para gerenciar pagamentos.

-- Deletar policies
DROP POLICY IF EXISTS "Permitir exclusão de pagamentos de vendas" ON vendas_pagamentos;
DROP POLICY IF EXISTS "Permitir atualização de pagamentos de vendas" ON vendas_pagamentos;
DROP POLICY IF EXISTS "Permitir inserção de pagamentos de vendas" ON vendas_pagamentos;
DROP POLICY IF EXISTS "Permitir leitura de pagamentos de vendas" ON vendas_pagamentos;

-- Deletar trigger
DROP TRIGGER IF EXISTS set_vendas_pagamentos_updated_at ON vendas_pagamentos;

-- Deletar função
DROP FUNCTION IF EXISTS vendas_pagamentos_set_updated_at();

-- Deletar tabela
DROP TABLE IF EXISTS vendas_pagamentos CASCADE;

-- Verificar se foi removida
SELECT 
  table_name,
  CASE 
    WHEN table_type IS NULL THEN '✅ Tabela Removida'
    ELSE '❌ Ainda Existe'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'vendas_pagamentos';

-- =====================================================
-- RESUMO
-- =====================================================
-- ✅ Tabela vendas_pagamentos removida
-- ✅ Policies removidas
-- ✅ Triggers removidos
-- ✅ Funções removidas
--
-- O sistema agora usa APENAS contas_receber para:
-- - Exibir pagamentos vinculados à venda
-- - Gerenciar recebimentos
-- - Controlar parcelas
-- =====================================================
