-- =====================================================
-- ADICIONAR CÓDIGO DO MUNICÍPIO NA TABELA CLIENTES
-- =====================================================

-- Verificar se a coluna já existe antes de adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clientes' 
        AND column_name = 'codigo_municipio'
    ) THEN
        -- Adicionar coluna codigo_municipio
        ALTER TABLE clientes 
        ADD COLUMN codigo_municipio VARCHAR(7);
        
        RAISE NOTICE 'Coluna codigo_municipio adicionada na tabela clientes';
    ELSE
        RAISE NOTICE 'Coluna codigo_municipio já existe na tabela clientes';
    END IF;
END $$;

-- Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_clientes_codigo_municipio 
ON clientes(codigo_municipio);

-- Comentário descrevendo a coluna
COMMENT ON COLUMN clientes.codigo_municipio IS 'Código IBGE do município (7 dígitos) - obrigatório para emissão de NF-e';

-- Atualizar registros existentes com o código do município de São José do Rio Pardo/SP (exemplo)
-- Você pode ajustar conforme necessário
UPDATE clientes 
SET codigo_municipio = '3549904'
WHERE cidade ILIKE '%São José do Rio Pardo%' 
  AND estado = 'SP'
  AND codigo_municipio IS NULL;

RAISE NOTICE '✅ Campo codigo_municipio adicionado com sucesso!';
