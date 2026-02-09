-- =====================================================
-- EXECUTAR AGORA NO SUPABASE SQL EDITOR
-- Correção do Sistema de Numeração de NF-e
-- Data: 05/02/2026
-- =====================================================

-- 1. Garantir que a tabela de numeração existe
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

-- 2. Atualizar registro de HOMOLOGAÇÃO para NFE Série 1
-- Começar do número 10 para evitar conflito com notas antigas autorizadas (1 e 2)
-- Último número = 9, próximo será 10
INSERT INTO notas_fiscais_numeracao (tipo_nota, serie, ultimo_numero, ambiente, ativo)
VALUES ('NFE', 1, 9, 'HOMOLOGACAO', true)
ON CONFLICT (tipo_nota, serie, ambiente) 
DO UPDATE SET 
    ultimo_numero = 9,
    updated_at = NOW();

-- 3. Criar registro para NFCE se não existir
INSERT INTO notas_fiscais_numeracao (tipo_nota, serie, ultimo_numero, ambiente, ativo)
VALUES ('NFCE', 1, 0, 'HOMOLOGACAO', true)
ON CONFLICT (tipo_nota, serie, ambiente) DO NOTHING;

-- 4. Criar registros para PRODUÇÃO
INSERT INTO notas_fiscais_numeracao (tipo_nota, serie, ultimo_numero, ambiente, ativo)
VALUES 
    ('NFE', 1, 0, 'PRODUCAO', true),
    ('NFCE', 1, 0, 'PRODUCAO', true)
ON CONFLICT (tipo_nota, serie, ambiente) DO NOTHING;

-- 5. Atualizar CRT da empresa para Lucro Presumido (se necessário)
UPDATE empresas
SET 
  regime_tributario = 'PRESUMIDO',
  crt = '3'
WHERE cnpj = '43670056000166';

-- 6. VERIFICAR RESULTADO
SELECT 
    tipo_nota,
    serie,
    ultimo_numero,
    ultimo_numero + 1 as proximo_numero,
    ambiente,
    CASE WHEN ativo THEN '✓ Automático' ELSE 'Manual' END as modo
FROM notas_fiscais_numeracao
ORDER BY ambiente DESC, tipo_nota;

-- ✅ DEPOIS DE EXECUTAR:
-- - NFE Série 1 HOMOLOGAÇÃO: último = 9, próximo = 10
-- - Sistema vai mostrar "Próxima Nota: 000010"
-- - Isso evita conflito com notas 1 e 2 já autorizadas em 2022
-- - Edição manual nos Parâmetros Fiscais vai funcionar
