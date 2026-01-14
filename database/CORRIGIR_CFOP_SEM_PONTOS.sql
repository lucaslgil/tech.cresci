-- =====================================================
-- CORREÇÃO: CFOP sem pontos + Ajuste VARCHAR
-- Problema: cfop_entrada/cfop_saida = VARCHAR(4) mas recebe "5.102"
-- Solução: Aumentar para VARCHAR(5) e remover pontos dos CFOPs
-- Data: 14/01/2026
-- =====================================================

-- PARTE 1: Aumentar tamanho dos campos
ALTER TABLE regras_tributacao 
  ALTER COLUMN cfop_entrada TYPE VARCHAR(5),
  ALTER COLUMN cfop_saida TYPE VARCHAR(5),
  ALTER COLUMN csosn_icms TYPE VARCHAR(5);

-- PARTE 2: Remover pontos dos CFOPs já cadastrados na tabela cfops
UPDATE cfops 
SET codigo = REPLACE(codigo, '.', '')
WHERE codigo LIKE '%.%';

-- PARTE 3: Remover pontos dos CFOPs nas regras de tributação
UPDATE regras_tributacao 
SET cfop_entrada = REPLACE(cfop_entrada, '.', '')
WHERE cfop_entrada LIKE '%.%';

UPDATE regras_tributacao 
SET cfop_saida = REPLACE(cfop_saida, '.', '')
WHERE cfop_saida LIKE '%.%';

-- PARTE 4: Verificação
SELECT 
  'cfops' as tabela,
  codigo,
  descricao
FROM cfops
WHERE codigo LIKE '%[^0-9]%'
LIMIT 5;

SELECT 
  'regras_tributacao' as tabela,
  id,
  cfop_entrada,
  cfop_saida
FROM regras_tributacao
WHERE cfop_entrada LIKE '%.%' OR cfop_saida LIKE '%.%'
LIMIT 5;

-- Verificar tamanhos dos campos
SELECT 
  column_name,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'regras_tributacao' 
  AND column_name IN ('cfop_entrada', 'cfop_saida', 'csosn_icms')
ORDER BY column_name;

-- Deve mostrar todos com length = 5
