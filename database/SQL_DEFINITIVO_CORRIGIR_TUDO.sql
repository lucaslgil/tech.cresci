-- ============================================
-- SQL DEFINITIVO - RESOLVER TODOS OS PROBLEMAS
-- ============================================

-- ===========================================
-- PARTE 1: CORRIGIR CONSTRAINTS notas_fiscais
-- ===========================================

-- 1.1 Remover constraints antigas
ALTER TABLE notas_fiscais DROP CONSTRAINT IF EXISTS notas_fiscais_forma_pagamento_check;
ALTER TABLE notas_fiscais DROP CONSTRAINT IF EXISTS notas_fiscais_modalidade_frete_check;

-- 1.2 Criar constraints corretas
ALTER TABLE notas_fiscais 
ADD CONSTRAINT notas_fiscais_forma_pagamento_check 
CHECK (forma_pagamento IN ('01', '02', '03', '04', '05', '10', '11', '12', '13', '15', '17', '18', '19', '90', '99'));

ALTER TABLE notas_fiscais 
ADD CONSTRAINT notas_fiscais_modalidade_frete_check 
CHECK (modalidade_frete IN ('0', '1', '2', '3', '4', '9'));

-- ===========================================
-- PARTE 2: ADICIONAR COLUNAS FALTANTES notas_fiscais_itens
-- ===========================================

-- Adicionar coluna valor_total_tributos
ALTER TABLE notas_fiscais_itens 
ADD COLUMN IF NOT EXISTS valor_total_tributos NUMERIC(15,2) DEFAULT 0;

-- ===========================================
-- PARTE 3: VERIFICAÇÃO FINAL
-- ===========================================

-- Verificar constraints de notas_fiscais
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'notas_fiscais'::regclass
  AND conname IN (
    'notas_fiscais_forma_pagamento_check',
    'notas_fiscais_modalidade_frete_check',
    'notas_fiscais_destinatario_tipo_check',
    'notas_fiscais_finalidade_check'
  )
ORDER BY conname;

-- Verificar se valor_total_tributos foi criada
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'notas_fiscais_itens' 
  AND column_name = 'valor_total_tributos';

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- ✅ forma_pagamento aceita: 01, 02, 03, 04, 05, 10, 11, 12, 13, 15, 17, 18, 19, 90, 99
-- ✅ modalidade_frete aceita: 0, 1, 2, 3, 4, 9
-- ✅ destinatario_tipo aceita: F, J
-- ✅ finalidade aceita: 1, 2, 3, 4
-- ✅ valor_total_tributos existe em notas_fiscais_itens
