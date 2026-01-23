-- =====================================================
-- ADICIONAR CONFIGURAÇÃO DE EMPRESA PADRÃO PARA NF-e
-- Data: 23/01/2026
-- Objetivo: Permitir definir uma empresa padrão para
--           pré-selecionar na emissão de notas fiscais
-- =====================================================

-- 1. Adicionar campo empresa_padrao_nfe na tabela empresas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'empresas' 
        AND column_name = 'empresa_padrao_nfe'
    ) THEN
        ALTER TABLE empresas 
        ADD COLUMN empresa_padrao_nfe BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE '✅ Campo empresa_padrao_nfe adicionado na tabela empresas';
    ELSE
        RAISE NOTICE '⚠️ Campo empresa_padrao_nfe já existe';
    END IF;
END $$;

-- 2. Criar índice para melhorar performance nas buscas
CREATE INDEX IF NOT EXISTS idx_empresas_padrao_nfe 
ON empresas(empresa_padrao_nfe) 
WHERE empresa_padrao_nfe = TRUE;

-- 3. Adicionar comentário na coluna
COMMENT ON COLUMN empresas.empresa_padrao_nfe IS 
'Indica se esta empresa deve ser pré-selecionada como padrão na emissão de NF-e';

-- 4. Criar função para garantir apenas uma empresa padrão por vez
CREATE OR REPLACE FUNCTION garantir_unica_empresa_padrao_nfe()
RETURNS TRIGGER AS $$
BEGIN
    -- Se está marcando como padrão
    IF NEW.empresa_padrao_nfe = TRUE THEN
        -- Desmarcar todas as outras empresas
        UPDATE empresas 
        SET empresa_padrao_nfe = FALSE 
        WHERE id != NEW.id 
        AND empresa_padrao_nfe = TRUE;
        
        RAISE NOTICE '✅ Empresa % definida como padrão para NF-e', NEW.nome_fantasia;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para executar a função
DROP TRIGGER IF EXISTS trg_garantir_unica_empresa_padrao_nfe ON empresas;
CREATE TRIGGER trg_garantir_unica_empresa_padrao_nfe
    BEFORE INSERT OR UPDATE ON empresas
    FOR EACH ROW
    WHEN (NEW.empresa_padrao_nfe = TRUE)
    EXECUTE FUNCTION garantir_unica_empresa_padrao_nfe();

-- 6. Se houver apenas uma empresa emissora ativa, definir como padrão
DO $$
DECLARE
    empresas_ativas INTEGER;
    primeira_empresa_id INTEGER;
BEGIN
    SELECT COUNT(*), MIN(id) 
    INTO empresas_ativas, primeira_empresa_id
    FROM empresas 
    WHERE ativo = TRUE 
    AND emite_nfe = TRUE;
    
    IF empresas_ativas = 1 THEN
        UPDATE empresas 
        SET empresa_padrao_nfe = TRUE 
        WHERE id = primeira_empresa_id;
        
        RAISE NOTICE '✅ Única empresa emissora definida como padrão automaticamente (ID: %)', primeira_empresa_id;
    ELSE
        RAISE NOTICE 'ℹ️ Existem % empresas emissoras. Defina manualmente qual será a padrão.', empresas_ativas;
    END IF;
END $$;

-- 7. Verificação final
SELECT 
    id,
    codigo,
    nome_fantasia,
    cnpj,
    emite_nfe,
    empresa_padrao_nfe,
    ativo
FROM empresas
WHERE ativo = TRUE
ORDER BY empresa_padrao_nfe DESC NULLS LAST, nome_fantasia;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- ✅ Campo empresa_padrao_nfe criado
-- ✅ Índice criado para performance
-- ✅ Função e trigger criados para garantir unicidade
-- ✅ Primeira empresa (se única) definida como padrão
-- =====================================================
