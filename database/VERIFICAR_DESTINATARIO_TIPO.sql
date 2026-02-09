-- Verificar constraint do campo destinatario_tipo
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE conrelid = 'notas_fiscais'::regclass
  AND conname LIKE '%destinatario_tipo%';

-- Ver também a definição da coluna
SELECT 
  column_name, 
  data_type, 
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'notas_fiscais' 
  AND column_name = 'destinatario_tipo';
