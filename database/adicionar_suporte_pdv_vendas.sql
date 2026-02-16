-- =====================================================
-- ADICIONAR SUPORTE PDV NA TABELA VENDAS
-- Campos necessários para integração PDV → Retaguarda
-- =====================================================

-- Adicionar campo pdv_uuid para rastreabilidade
ALTER TABLE vendas 
ADD COLUMN IF NOT EXISTS pdv_uuid TEXT;

-- Adicionar campo origem para identificar vendas do PDV
ALTER TABLE vendas 
ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'RETAGUARDA';

-- Comentários
COMMENT ON COLUMN vendas.pdv_uuid IS 'UUID único da venda gerada no PDV (para rastreabilidade)';
COMMENT ON COLUMN vendas.origem IS 'Origem da venda: RETAGUARDA ou PDV';

-- Criar índice para busca rápida por vendas do PDV
CREATE INDEX IF NOT EXISTS idx_vendas_origem ON vendas(origem);
CREATE INDEX IF NOT EXISTS idx_vendas_pdv_uuid ON vendas(pdv_uuid);

-- Validação: garantir que pdv_uuid seja único quando informado
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendas_pdv_uuid_unique 
ON vendas(pdv_uuid) 
WHERE pdv_uuid IS NOT NULL;

-- =====================================================
-- NOTAS
-- =====================================================

/*
Este script adiciona suporte para receber vendas do FLASH PDV.

CAMPOS ADICIONADOS:
- pdv_uuid: Identificador único da venda no PDV (permite rastreamento)
- origem: Identifica se venda veio da RETAGUARDA ou do PDV

COMO FUNCIONA:
1. Venda criada no PDV com UUID único
2. Sincronização envia venda para retaguarda
3. Campo pdv_uuid armazena o UUID original
4. Campo origem marca como 'PDV'
5. Possível consultar vendas por origem

CONSULTAS ÚTEIS:

-- Listar vendas do PDV
SELECT * FROM vendas WHERE origem = 'PDV';

-- Buscar venda por UUID do PDV
SELECT * FROM vendas WHERE pdv_uuid = 'uuid-aqui';

-- Estatísticas por origem
SELECT origem, COUNT(*), SUM(total) 
FROM vendas 
GROUP BY origem;
*/
