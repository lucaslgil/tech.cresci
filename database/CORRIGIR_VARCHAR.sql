-- ============================================
-- CORRIGIR TODAS AS COLUNAS VARCHAR(1) PARA TAMANHOS ADEQUADOS
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Colunas que precisam de VARCHAR(2) para códigos numéricos
ALTER TABLE notas_fiscais 
ALTER COLUMN modalidade_frete TYPE VARCHAR(2),
ALTER COLUMN forma_pagamento TYPE VARCHAR(2),
ALTER COLUMN meio_pagamento TYPE VARCHAR(2);

-- 2. Colunas que precisam de VARCHAR(20) para valores descritivos
ALTER TABLE notas_fiscais 
ALTER COLUMN tipo_emissao TYPE VARCHAR(20),
ALTER COLUMN finalidade TYPE VARCHAR(20),
ALTER COLUMN destinatario_indicador_ie TYPE VARCHAR(20);

-- 3. Modelo é VARCHAR(2) - OK (apenas 55, 65)
-- Não precisa alterar

-- 4. VERIFICAR SE EXISTE E CORRIGIR crt (pode estar como VARCHAR(1))
ALTER TABLE empresas 
ALTER COLUMN crt TYPE VARCHAR(2);

-- ============================================
-- VERIFICAR AJUSTES
-- ============================================
SELECT 
  'notas_fiscais' as tabela,
  column_name, 
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'notas_fiscais' 
  AND column_name IN (
    'modalidade_frete', 'forma_pagamento', 'meio_pagamento',
    'tipo_emissao', 'finalidade', 'destinatario_indicador_ie'
  )
UNION ALL
SELECT 
  'empresas' as tabela,
  column_name, 
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'empresas' 
  AND column_name = 'crt'
ORDER BY tabela, column_name;

-- Resultado esperado:
-- Todas as colunas devem estar com character_maximum_length >= 2
