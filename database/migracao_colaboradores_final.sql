-- MIGRAÇÃO: Criação da tabela colaboradores
-- Execute este SQL no Supabase para criar a estrutura da tabela colaboradores

-- 1. Criar tabela colaboradores se não existir
CREATE TABLE IF NOT EXISTS colaboradores (
    id BIGSERIAL PRIMARY KEY,
    tipo_pessoa VARCHAR(10) NOT NULL CHECK (tipo_pessoa IN ('fisica', 'juridica')),
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    cnpj VARCHAR(18) UNIQUE,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    setor VARCHAR(100) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    empresa_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_documento CHECK (
        (tipo_pessoa = 'fisica' AND cpf IS NOT NULL AND cnpj IS NULL) OR
        (tipo_pessoa = 'juridica' AND cnpj IS NOT NULL AND cpf IS NULL)
    ),
    CONSTRAINT fk_colaboradores_empresa 
        FOREIGN KEY (empresa_id) 
        REFERENCES empresas(id) 
        ON DELETE RESTRICT
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_tipo_pessoa ON colaboradores(tipo_pessoa);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cpf ON colaboradores(cpf);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cnpj ON colaboradores(cnpj);
CREATE INDEX IF NOT EXISTS idx_colaboradores_email ON colaboradores(email);
CREATE INDEX IF NOT EXISTS idx_colaboradores_empresa_id ON colaboradores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_nome ON colaboradores(nome);

-- 3. Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_colaboradores_updated_at ON colaboradores;
CREATE TRIGGER update_colaboradores_updated_at
    BEFORE UPDATE ON colaboradores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Inserir dados de exemplo (opcional - apenas se a tabela estiver vazia)
INSERT INTO colaboradores (
    tipo_pessoa, nome, cpf, cnpj, email, telefone, setor, cargo, empresa_id
) 
SELECT 
    'fisica',
    'João Silva',
    '123.456.789-00',
    NULL,
    'joao@crescieperdi.com.br',
    '(19) 99999-9999',
    'Tecnologia da Informação',
    'Desenvolvedor',
    1
WHERE NOT EXISTS (SELECT 1 FROM colaboradores WHERE cpf = '123.456.789-00');

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas de acesso (ajuste conforme suas necessidades)
DROP POLICY IF EXISTS "Usuários autenticados podem ver colaboradores" ON colaboradores;
CREATE POLICY "Usuários autenticados podem ver colaboradores" ON colaboradores
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem inserir colaboradores" ON colaboradores;
CREATE POLICY "Usuários autenticados podem inserir colaboradores" ON colaboradores
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar colaboradores" ON colaboradores;
CREATE POLICY "Usuários autenticados podem atualizar colaboradores" ON colaboradores
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem deletar colaboradores" ON colaboradores;
CREATE POLICY "Usuários autenticados podem deletar colaboradores" ON colaboradores
    FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Comentários nas colunas para documentação
COMMENT ON TABLE colaboradores IS 'Tabela para cadastro e gerenciamento de colaboradores do sistema';
COMMENT ON COLUMN colaboradores.tipo_pessoa IS 'Tipo de pessoa: fisica ou juridica';
COMMENT ON COLUMN colaboradores.nome IS 'Nome completo da pessoa física ou razão social da pessoa jurídica';
COMMENT ON COLUMN colaboradores.cpf IS 'CPF formatado (apenas para pessoa física)';
COMMENT ON COLUMN colaboradores.cnpj IS 'CNPJ formatado (apenas para pessoa jurídica)';
COMMENT ON COLUMN colaboradores.email IS 'Email do colaborador';
COMMENT ON COLUMN colaboradores.telefone IS 'Telefone formatado do colaborador';
COMMENT ON COLUMN colaboradores.setor IS 'Setor de trabalho do colaborador';
COMMENT ON COLUMN colaboradores.cargo IS 'Cargo/função do colaborador';
COMMENT ON COLUMN colaboradores.empresa_id IS 'ID da empresa à qual o colaborador pertence';

-- 8. Verificar se a tabela foi criada corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'colaboradores' 
ORDER BY ordinal_position;