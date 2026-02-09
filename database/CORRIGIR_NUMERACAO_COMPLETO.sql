-- =====================================================
-- CORREÇÃO COMPLETA DO SISTEMA DE NUMERAÇÃO
-- Data: 05/02/2026
-- =====================================================

-- 1. Garantir que a tabela existe
CREATE TABLE IF NOT EXISTS notas_fiscais_numeracao (
    id BIGSERIAL PRIMARY KEY,
    tipo_nota VARCHAR(10) NOT NULL,
    serie INTEGER NOT NULL,
    ultimo_numero INTEGER NOT NULL DEFAULT 0,
    ambiente VARCHAR(15) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tipo_nota, serie, ambiente)
);

-- 2. Inserir registros para HOMOLOGAÇÃO se não existirem
INSERT INTO notas_fiscais_numeracao (tipo_nota, serie, ultimo_numero, ambiente, ativo)
VALUES 
    ('NFE', 1, 1, 'HOMOLOGACAO', true),  -- Último número = 1 (próximo será 2)
    ('NFCE', 1, 0, 'HOMOLOGACAO', true)
ON CONFLICT (tipo_nota, serie, ambiente) 
DO UPDATE SET 
    ultimo_numero = EXCLUDED.ultimo_numero,
    updated_at = NOW();

-- 3. Inserir registros para PRODUÇÃO se não existirem
INSERT INTO notas_fiscais_numeracao (tipo_nota, serie, ultimo_numero, ambiente, ativo)
VALUES 
    ('NFE', 1, 0, 'PRODUCAO', true),
    ('NFCE', 1, 0, 'PRODUCAO', true)
ON CONFLICT (tipo_nota, serie, ambiente) DO NOTHING;

-- 4. Criar função para obter próximo número
CREATE OR REPLACE FUNCTION get_proximo_numero_nota(
    p_tipo_nota VARCHAR,
    p_serie INTEGER,
    p_ambiente VARCHAR
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_ultimo_numero INTEGER;
BEGIN
    -- Buscar último número da numeração
    SELECT ultimo_numero INTO v_ultimo_numero
    FROM notas_fiscais_numeracao
    WHERE tipo_nota = p_tipo_nota
      AND serie = p_serie
      AND ambiente = p_ambiente;
    
    -- Se não encontrou, criar registro
    IF v_ultimo_numero IS NULL THEN
        INSERT INTO notas_fiscais_numeracao (tipo_nota, serie, ultimo_numero, ambiente)
        VALUES (p_tipo_nota, p_serie, 0, p_ambiente)
        ON CONFLICT (tipo_nota, serie, ambiente) DO NOTHING;
        
        v_ultimo_numero := 0;
    END IF;
    
    RETURN v_ultimo_numero;
END;
$$;

-- 5. Criar função para incrementar número após emissão
CREATE OR REPLACE FUNCTION incrementar_numero_nota(
    p_tipo_nota VARCHAR,
    p_serie INTEGER,
    p_ambiente VARCHAR
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_novo_numero INTEGER;
BEGIN
    -- Incrementar e retornar novo número
    UPDATE notas_fiscais_numeracao
    SET ultimo_numero = ultimo_numero + 1,
        updated_at = NOW()
    WHERE tipo_nota = p_tipo_nota
      AND serie = p_serie
      AND ambiente = p_ambiente
    RETURNING ultimo_numero INTO v_novo_numero;
    
    -- Se não atualizou nada, criar registro
    IF v_novo_numero IS NULL THEN
        INSERT INTO notas_fiscais_numeracao (tipo_nota, serie, ultimo_numero, ambiente)
        VALUES (p_tipo_nota, p_serie, 1, p_ambiente)
        RETURNING ultimo_numero INTO v_novo_numero;
    END IF;
    
    RETURN v_novo_numero;
END;
$$;

-- 6. Verificar estado atual
SELECT 
    tipo_nota,
    serie,
    ultimo_numero,
    ambiente,
    CASE WHEN ativo THEN 'Automático ✓' ELSE 'Manual' END as modo,
    ultimo_numero + 1 as proximo_numero
FROM notas_fiscais_numeracao
ORDER BY ambiente DESC, tipo_nota, serie;

-- ✅ EXECUTE ESTE SCRIPT NO SUPABASE SQL EDITOR
-- Após executar:
-- - Função get_proximo_numero_nota criada
-- - Função incrementar_numero_nota criada
-- - Numeração configurada (último = 1, próximo = 2)
