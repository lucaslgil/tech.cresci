-- =====================================================
-- ADICIONAR CAMPO OPERAÇÃO FISCAL EM VENDAS
-- Script para vincular vendas a operações fiscais
-- Data: 28/01/2026
-- =====================================================

-- Adicionar coluna operacao_fiscal_id na tabela vendas
ALTER TABLE vendas
ADD COLUMN IF NOT EXISTS operacao_fiscal_id BIGINT REFERENCES operacoes_fiscais(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_vendas_operacao_fiscal ON vendas(operacao_fiscal_id);

-- Comentário explicativo
COMMENT ON COLUMN vendas.operacao_fiscal_id IS 'Operação fiscal vinculada à venda (utilizada para emissão de NF-e)';

-- =====================================================
-- VALIDAÇÕES E MENSAGENS
-- =====================================================

-- Verificar se a coluna foi criada com sucesso
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vendas' 
        AND column_name = 'operacao_fiscal_id'
    ) THEN
        RAISE NOTICE '✅ Coluna operacao_fiscal_id adicionada com sucesso na tabela vendas';
    ELSE
        RAISE EXCEPTION '❌ Erro: Coluna operacao_fiscal_id não foi criada';
    END IF;
END $$;
