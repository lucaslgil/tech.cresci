-- =====================================================
-- SCRIPT URGENTE: CRIAR TABELA NCM
-- Execute este script AGORA no Supabase SQL Editor
-- https://supabase.com/dashboard/project/alylochrlvgcvjdmkmum/sql/new
-- =====================================================

-- PASSO 1: Remover tabela antiga se existir (CASCADE remove tudo junto)
DROP TABLE IF EXISTS ncm CASCADE;

-- PASSO 2: Criar função de updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 3: Criar tabela NCM
CREATE TABLE ncm (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    unidade_tributaria VARCHAR(10),
    aliquota_nacional_federal DECIMAL(5,2),
    cest VARCHAR(10),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- PASSO 4: Criar índices (IF NOT EXISTS para evitar erro)
CREATE INDEX IF NOT EXISTS idx_ncm_codigo ON ncm(codigo);
CREATE INDEX IF NOT EXISTS idx_ncm_ativo ON ncm(ativo);
CREATE INDEX IF NOT EXISTS idx_ncm_descricao ON ncm USING gin(to_tsvector('portuguese', descricao));

-- PASSO 5: Criar trigger (DROP primeiro para evitar duplicação)
DROP TRIGGER IF EXISTS update_ncm_updated_at ON ncm;
CREATE TRIGGER update_ncm_updated_at
    BEFORE UPDATE ON ncm
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- PASSO 6: Habilitar RLS
ALTER TABLE ncm ENABLE ROW LEVEL SECURITY;

-- PASSO 7: Criar políticas RLS (DROP primeiro para evitar duplicação)
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar NCM" ON ncm;
CREATE POLICY "Usuários autenticados podem visualizar NCM"
    ON ncm FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem inserir NCM" ON ncm;
CREATE POLICY "Usuários autenticados podem inserir NCM"
    ON ncm FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar NCM" ON ncm;
CREATE POLICY "Usuários autenticados podem atualizar NCM"
    ON ncm FOR UPDATE
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem deletar NCM" ON ncm;
CREATE POLICY "Usuários autenticados podem deletar NCM"
    ON ncm FOR DELETE
    USING (auth.role() = 'authenticated');

-- PASSO 8: Inserir alguns NCMs de exemplo
INSERT INTO ncm (codigo, descricao, ativo) VALUES
('33029019', 'Outras preparações capilares', true),
('33029090', 'Outras preparações de toucador', true),
('84713000', 'Unidades de processamento de dados', true),
('85171200', 'Telefones móveis (celulares)', true),
('22021000', 'Águas minerais e gaseificadas', true)
ON CONFLICT (codigo) DO NOTHING;

-- COMENTÁRIOS
COMMENT ON TABLE ncm IS 'Nomenclatura Comum do Mercosul - Classificação fiscal de produtos';
COMMENT ON COLUMN ncm.codigo IS 'Código NCM formato 0000.00.00';
COMMENT ON COLUMN ncm.cest IS 'Código Especificador da Substituição Tributária';

-- MENSAGEM FINAL
SELECT 'Tabela NCM criada com sucesso!' AS resultado;
