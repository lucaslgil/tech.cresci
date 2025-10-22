-- CRIAÇÃO DE TABELAS PARA GESTÃO DE SETORES E CARGOS
-- Execute este SQL no Supabase para implementar a gestão persistente

-- 1. Criar tabela de setores
CREATE TABLE IF NOT EXISTS setores (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Criar tabela de cargos  
CREATE TABLE IF NOT EXISTS cargos (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Inserir setores padrão
INSERT INTO setores (nome) VALUES 
    ('Administrativo'),
    ('Financeiro'),
    ('Recursos Humanos'),
    ('Tecnologia da Informação'),
    ('Vendas'),
    ('Marketing'),
    ('Operacional'),
    ('Produção'),
    ('Qualidade'),
    ('Logística'),
    ('Jurídico'),
    ('Compras'),
    ('Controladoria'),
    ('Diretoria')
ON CONFLICT (nome) DO NOTHING;

-- 4. Inserir cargos padrão
INSERT INTO cargos (nome) VALUES 
    ('Assistente Administrativo'),
    ('Analista Financeiro'),
    ('Coordenador de RH'),
    ('Desenvolvedor'),
    ('Analista de Sistemas'),
    ('Gerente de TI'),
    ('Vendedor'),
    ('Supervisor de Vendas'),
    ('Analista de Marketing'),
    ('Coordenador de Marketing'),
    ('Assistente Operacional'),
    ('Supervisor de Produção'),
    ('Analista de Qualidade'),
    ('Coordenador de Logística'),
    ('Assistente Jurídico'),
    ('Comprador'),
    ('Contador'),
    ('Diretor'),
    ('Gerente Geral'),
    ('Estagiário')
ON CONFLICT (nome) DO NOTHING;

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas de acesso
CREATE POLICY "Permitir leitura de setores para usuários autenticados" ON setores
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir escrita de setores para usuários autenticados" ON setores
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir leitura de cargos para usuários autenticados" ON cargos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir escrita de cargos para usuários autenticados" ON cargos
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_setores_nome ON setores(nome);
CREATE INDEX IF NOT EXISTS idx_setores_ativo ON setores(ativo);
CREATE INDEX IF NOT EXISTS idx_cargos_nome ON cargos(nome);
CREATE INDEX IF NOT EXISTS idx_cargos_ativo ON cargos(ativo);

-- 8. Adicionar comentários
COMMENT ON TABLE setores IS 'Tabela para gerenciamento de setores da empresa';
COMMENT ON TABLE cargos IS 'Tabela para gerenciamento de cargos da empresa';
COMMENT ON COLUMN setores.ativo IS 'Flag para soft delete - setores inativos não aparecem nas listas';
COMMENT ON COLUMN cargos.ativo IS 'Flag para soft delete - cargos inativos não aparecem nas listas';

-- 9. Verificar se as tabelas foram criadas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('setores', 'cargos')
ORDER BY table_name, ordinal_position;