-- =====================================================
-- CRIAR CONTROLE DE NUMERAÇÃO DE NOTAS FISCAIS
-- Data: 26/01/2026
-- =====================================================

-- Esta tabela controla a numeração de NF-e e NFC-e
-- IMPORTANTE: Numeração separada para PRODUCAO e HOMOLOGACAO

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS notas_fiscais_numeracao (
    id BIGSERIAL PRIMARY KEY,
    tipo_nota VARCHAR(10) NOT NULL,        -- 'NFE' ou 'NFCE'
    serie INTEGER NOT NULL,                -- Série da nota (1, 2, 3...)
    ultimo_numero INTEGER NOT NULL DEFAULT 0,  -- Último número emitido
    ambiente VARCHAR(15) NOT NULL,         -- 'PRODUCAO' ou 'HOMOLOGACAO'
    ativo BOOLEAN DEFAULT true,            -- TRUE = automático, FALSE = manual
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tipo_nota, serie, ambiente)     -- Um registro por tipo+série+ambiente
);

-- Inserir registros iniciais para HOMOLOGAÇÃO
INSERT INTO notas_fiscais_numeracao (tipo_nota, serie, ultimo_numero, ambiente, ativo)
VALUES 
    ('NFE', 1, 0, 'HOMOLOGACAO', true),
    ('NFCE', 1, 0, 'HOMOLOGACAO', true)
ON CONFLICT (tipo_nota, serie, ambiente) DO NOTHING;

-- Inserir registros iniciais para PRODUÇÃO
INSERT INTO notas_fiscais_numeracao (tipo_nota, serie, ultimo_numero, ambiente, ativo)
VALUES 
    ('NFE', 1, 0, 'PRODUCAO', true),
    ('NFCE', 1, 0, 'PRODUCAO', true)
ON CONFLICT (tipo_nota, serie, ambiente) DO NOTHING;

-- Verificar registros criados
SELECT 
    tipo_nota,
    serie,
    ultimo_numero,
    ambiente,
    CASE WHEN ativo THEN 'Automático' ELSE 'Manual' END as modo,
    created_at
FROM notas_fiscais_numeracao
ORDER BY ambiente, tipo_nota, serie;

-- ✅ Controle de numeração configurado!
-- HOMOLOGAÇÃO: Para testes (numeração independente)
-- PRODUÇÃO: Para notas fiscais oficiais (numeração independente)
