-- =====================================================
-- CORREÇÃO: Clientes "SEM DOCUMENTO" classificados como PJ
-- Problema: Clientes vindos da Solutto sem CPF/CNPJ estavam
--           sendo gravados como JURIDICA por engano.
-- Solução:  Atualizar para FISICA quando não há CNPJ.
-- =====================================================

-- 1. Verificar quantos clientes serão afetados (somente consulta)
SELECT 
  id,
  codigo,
  tipo_pessoa,
  razao_social,
  nome_completo,
  cnpj,
  cpf,
  solutto_cliente_id
FROM clientes
WHERE tipo_pessoa = 'JURIDICA'
  AND (cnpj IS NULL OR cnpj = '')
ORDER BY id;

-- =====================================================
-- 2. APLICAR A CORREÇÃO
--    Muda tipo_pessoa de JURIDICA → FISICA e move
--    razao_social → nome_completo (se nome_completo estiver vazio)
-- =====================================================
UPDATE clientes
SET
  tipo_pessoa   = 'FISICA',
  nome_completo = COALESCE(
                    NULLIF(nome_completo, ''),
                    NULLIF(razao_social, ''),
                    nome_fantasia
                  ),
  razao_social  = NULL
WHERE tipo_pessoa = 'JURIDICA'
  AND (cnpj IS NULL OR cnpj = '');

-- 3. Confirmar resultado
SELECT 
  tipo_pessoa,
  COUNT(*) AS total,
  SUM(CASE WHEN cnpj IS NULL OR cnpj = '' THEN 1 ELSE 0 END) AS sem_cnpj,
  SUM(CASE WHEN cpf  IS NULL OR cpf  = '' THEN 1 ELSE 0 END) AS sem_cpf
FROM clientes
GROUP BY tipo_pessoa
ORDER BY tipo_pessoa;
