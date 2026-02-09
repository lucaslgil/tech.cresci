-- =====================================================
-- ADICIONAR CAMPOS CERTIFICADO DIGITAL
-- Armazenamento seguro do certificado A1
-- =====================================================

-- Adicionar campos na tabela empresas
ALTER TABLE empresas 
  ADD COLUMN IF NOT EXISTS certificado_digital BYTEA,
  ADD COLUMN IF NOT EXISTS certificado_senha TEXT,
  ADD COLUMN IF NOT EXISTS certificado_validade DATE,
  ADD COLUMN IF NOT EXISTS certificado_cnpj TEXT,
  ADD COLUMN IF NOT EXISTS certificado_razao_social TEXT;

-- Comentários
COMMENT ON COLUMN empresas.certificado_digital IS 'Arquivo .pfx do certificado A1 em formato binário';
COMMENT ON COLUMN empresas.certificado_senha IS '⚠️ Senha do certificado (criptografar no backend!)';
COMMENT ON COLUMN empresas.certificado_validade IS 'Data de validade do certificado';
COMMENT ON COLUMN empresas.certificado_cnpj IS 'CNPJ extraído do certificado para validação';
COMMENT ON COLUMN empresas.certificado_razao_social IS 'Razão social do certificado';

-- =====================================================
-- OBSERVAÇÃO DE SEGURANÇA
-- =====================================================
-- ⚠️ Em produção, considere:
-- 1. Criptografar a senha do certificado usando pgcrypto
-- 2. Armazenar certificado em storage seguro (AWS KMS, Azure Key Vault)
-- 3. Implementar rotação de chaves
-- 4. Audit log de acesso ao certificado
-- 
-- Exemplo com pgcrypto:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- 
-- ALTER TABLE empresas 
--   ALTER COLUMN certificado_senha 
--   TYPE BYTEA USING pgp_sym_encrypt(certificado_senha, 'sua-chave-secreta-forte');
-- 
-- Para descriptografar:
-- SELECT pgp_sym_decrypt(certificado_senha, 'sua-chave-secreta-forte') 
-- FROM empresas WHERE id = 1;
-- =====================================================

-- Verificação
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'empresas' 
  AND column_name IN (
    'certificado_digital',
    'certificado_senha',
    'certificado_validade',
    'certificado_cnpj',
    'certificado_razao_social'
  )
ORDER BY column_name;
