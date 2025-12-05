-- =====================================================
-- MIGRATION: AJUSTES CADASTROS FISCAIS
-- Adiciona campos faltantes
-- Data: 02/12/2025
-- =====================================================

-- Adicionar campos faltantes na tabela operacoes_fiscais se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='operacoes_fiscais' AND column_name='natureza_operacao') THEN
        ALTER TABLE operacoes_fiscais ADD COLUMN natureza_operacao VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='operacoes_fiscais' AND column_name='mensagem_nota') THEN
        ALTER TABLE operacoes_fiscais ADD COLUMN mensagem_nota TEXT;
    END IF;
END $$;

-- Atualizar valores padrão
UPDATE operacoes_fiscais SET natureza_operacao = nome WHERE natureza_operacao IS NULL;

-- Tornar campo obrigatório
ALTER TABLE operacoes_fiscais ALTER COLUMN natureza_operacao SET NOT NULL;

-- Comentários
COMMENT ON COLUMN operacoes_fiscais.natureza_operacao IS 'Descrição da natureza da operação que aparecerá na nota fiscal';
COMMENT ON COLUMN operacoes_fiscais.mensagem_nota IS 'Mensagem padrão para aparecer nas notas fiscais desta operação';
