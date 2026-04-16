-- =====================================================
-- RELAXAR CONSTRAINTS DA TABELA CLIENTES
-- Permite importar clientes sem CPF/CNPJ (ex: vindos da Solutto sem documento)
--
-- Execute no SQL Editor do Supabase ANTES de rodar a sincronização.
--
-- Antes:
--   chk_pessoa_fisica:   FISICA exige nome_completo + cpf NOT NULL
--   chk_pessoa_juridica: JURIDICA exige razao_social + cnpj NOT NULL
--
-- Depois:
--   chk_pessoa_fisica:   FISICA exige apenas nome_completo NOT NULL (cpf opcional)
--   chk_pessoa_juridica: JURIDICA exige apenas razao_social NOT NULL (cnpj opcional)
-- =====================================================

ALTER TABLE clientes DROP CONSTRAINT IF EXISTS chk_pessoa_fisica;
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS chk_pessoa_juridica;

ALTER TABLE clientes ADD CONSTRAINT chk_pessoa_fisica CHECK (
  tipo_pessoa = 'JURIDICA' OR nome_completo IS NOT NULL
);

ALTER TABLE clientes ADD CONSTRAINT chk_pessoa_juridica CHECK (
  tipo_pessoa = 'FISICA' OR razao_social IS NOT NULL
);
