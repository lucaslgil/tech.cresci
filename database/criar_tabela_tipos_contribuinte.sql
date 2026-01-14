-- =====================================================
-- TABELA: tipos_contribuinte
-- Descrição: Cadastro de tipos de contribuintes para padronizar operações fiscais
-- Data: 14/01/2026
-- =====================================================

-- Criar tabela
CREATE TABLE IF NOT EXISTS tipos_contribuinte (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identificação
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    
    -- Configurações Fiscais
    consumidor_final BOOLEAN DEFAULT true,
    contribuinte_icms VARCHAR(20) NOT NULL CHECK (contribuinte_icms IN ('CONTRIBUINTE', 'ISENTO', 'NAO_CONTRIBUINTE')) DEFAULT 'NAO_CONTRIBUINTE',
    
    -- Status
    ativo BOOLEAN DEFAULT true,
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT tipos_contribuinte_nome_unique UNIQUE(nome)
);

-- Índices
CREATE INDEX idx_tipos_contribuinte_ativo ON tipos_contribuinte(ativo) WHERE ativo = true;
CREATE INDEX idx_tipos_contribuinte_nome ON tipos_contribuinte(nome);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION atualizar_updated_at_tipos_contribuinte()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_updated_at_tipos_contribuinte
    BEFORE UPDATE ON tipos_contribuinte
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_updated_at_tipos_contribuinte();

-- Comentários
COMMENT ON TABLE tipos_contribuinte IS 'Tipos de contribuintes para padronização de operações fiscais';
COMMENT ON COLUMN tipos_contribuinte.nome IS 'Nome do tipo de contribuinte';
COMMENT ON COLUMN tipos_contribuinte.consumidor_final IS 'Define se é consumidor final para fins fiscais';
COMMENT ON COLUMN tipos_contribuinte.contribuinte_icms IS 'Tipo de contribuinte ICMS (CONTRIBUINTE, ISENTO, NAO_CONTRIBUINTE)';

-- Inserir tipos padrão
INSERT INTO tipos_contribuinte (nome, descricao, consumidor_final, contribuinte_icms) VALUES
('Consumidor Final Não Contribuinte', 'Cliente pessoa física ou jurídica não contribuinte do ICMS', true, 'NAO_CONTRIBUINTE'),
('Contribuinte ICMS', 'Cliente pessoa jurídica contribuinte do ICMS', false, 'CONTRIBUINTE'),
('Contribuinte Isento', 'Cliente pessoa jurídica isenta de ICMS', false, 'ISENTO'),
('Empresa Simples Nacional', 'Empresa optante pelo Simples Nacional', false, 'CONTRIBUINTE'),
('Órgão Público', 'Órgão público isento de ICMS', false, 'ISENTO')
ON CONFLICT (nome) DO NOTHING;

-- RLS (Row Level Security)
ALTER TABLE tipos_contribuinte ENABLE ROW LEVEL SECURITY;

-- Política: Todos usuários autenticados podem ler
CREATE POLICY "Usuários autenticados podem visualizar tipos de contribuinte"
    ON tipos_contribuinte FOR SELECT
    TO authenticated
    USING (true);

-- Política: Usuários autenticados podem inserir
CREATE POLICY "Usuários autenticados podem criar tipos de contribuinte"
    ON tipos_contribuinte FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política: Usuários autenticados podem atualizar
CREATE POLICY "Usuários autenticados podem atualizar tipos de contribuinte"
    ON tipos_contribuinte FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Política: Usuários autenticados podem deletar
CREATE POLICY "Usuários autenticados podem deletar tipos de contribuinte"
    ON tipos_contribuinte FOR DELETE
    TO authenticated
    USING (true);
