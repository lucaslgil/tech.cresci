-- Criação da tabela linhas_telefonicas
-- Execute este script no SQL Editor do Supabase

-- Criar a tabela
CREATE TABLE IF NOT EXISTS linhas_telefonicas (
    id BIGSERIAL PRIMARY KEY,
    responsavel_id BIGINT REFERENCES colaboradores(id) ON DELETE SET NULL,
    numero_linha VARCHAR(20) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('eSIM', 'Chip Físico')),
    plano VARCHAR(100) NOT NULL,
    valor_plano DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comentários nas colunas
COMMENT ON TABLE linhas_telefonicas IS 'Tabela para gerenciar linhas telefônicas da empresa';
COMMENT ON COLUMN linhas_telefonicas.id IS 'Identificador único da linha telefônica';
COMMENT ON COLUMN linhas_telefonicas.responsavel_id IS 'Referência ao colaborador responsável pela linha';
COMMENT ON COLUMN linhas_telefonicas.numero_linha IS 'Número da linha telefônica';
COMMENT ON COLUMN linhas_telefonicas.tipo IS 'Tipo da linha: eSIM ou Chip Físico';
COMMENT ON COLUMN linhas_telefonicas.plano IS 'Nome do plano contratado';
COMMENT ON COLUMN linhas_telefonicas.valor_plano IS 'Valor mensal do plano';
COMMENT ON COLUMN linhas_telefonicas.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN linhas_telefonicas.updated_at IS 'Data da última atualização';

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_linhas_responsavel ON linhas_telefonicas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_linhas_tipo ON linhas_telefonicas(tipo);
CREATE INDEX IF NOT EXISTS idx_linhas_numero ON linhas_telefonicas(numero_linha);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_linhas_telefonicas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_linhas_telefonicas_timestamp
    BEFORE UPDATE ON linhas_telefonicas
    FOR EACH ROW
    EXECUTE FUNCTION update_linhas_telefonicas_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE linhas_telefonicas ENABLE ROW LEVEL SECURITY;

-- Política de acesso: usuários autenticados podem fazer tudo
CREATE POLICY "Usuários autenticados podem gerenciar linhas telefônicas"
    ON linhas_telefonicas
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verificação da estrutura criada
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'linhas_telefonicas'
ORDER BY ordinal_position;

-- Inserir dados de exemplo (opcional - remova se não quiser)
-- INSERT INTO linhas_telefonicas (numero_linha, tipo, plano, valor_plano) VALUES
-- ('11987654321', 'Chip Físico', 'Plano Controle 20GB', 59.90),
-- ('11976543210', 'eSIM', 'Plano Pós 30GB', 89.90);

-- Consulta de teste
SELECT 
    lt.*,
    c.nome as responsavel_nome
FROM linhas_telefonicas lt
LEFT JOIN colaboradores c ON lt.responsavel_id = c.id
ORDER BY lt.created_at DESC;
