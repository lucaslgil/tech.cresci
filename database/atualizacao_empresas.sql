-- MIGRAÇÃO: Atualização da tabela empresas
-- Execute este SQL no Supabase para atualizar a estrutura da tabela empresas

-- 1. Backup da tabela atual (opcional, mas recomendado)
CREATE TABLE empresas_backup AS SELECT * FROM empresas;

-- 2. Deletar a tabela atual se existir
DROP TABLE IF EXISTS empresas CASCADE;

-- 3. Criar nova tabela empresas com todos os campos necessários
CREATE TABLE empresas (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    cep VARCHAR(10) NOT NULL,
    endereco VARCHAR(255) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar índices para melhor performance
CREATE INDEX idx_empresas_codigo ON empresas(codigo);
CREATE INDEX idx_empresas_cnpj ON empresas(cnpj);
CREATE INDEX idx_empresas_razao_social ON empresas(razao_social);

-- 5. Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_empresas_updated_at
    BEFORE UPDATE ON empresas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Inserir dados de exemplo (opcional)
INSERT INTO empresas (
    codigo, razao_social, nome_fantasia, cnpj, email, telefone, 
    cep, endereco, numero, cidade, estado, observacoes
) VALUES (
    'EMP001', 
    'CRESCI E PERDI FRANCHISING LTDA', 
    'Cresci e Perdi',
    '27.767.670/0001-94',
    'contato@crescieperdi.com.br',
    '(19) 3608-1234',
    '13720-000',
    'Rua das Flores',
    '123',
    'São José do Rio Pardo',
    'SP',
    'Empresa matriz'
);

-- 7. Habilitar RLS (Row Level Security) se necessário
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- 8. Criar política de acesso (ajuste conforme suas necessidades)
CREATE POLICY "Usuários autenticados podem ver empresas" ON empresas
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir empresas" ON empresas
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar empresas" ON empresas
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar empresas" ON empresas
    FOR DELETE USING (auth.role() = 'authenticated');

-- 9. Comentários nas colunas para documentação
COMMENT ON TABLE empresas IS 'Tabela para cadastro e gerenciamento de empresas do sistema';
COMMENT ON COLUMN empresas.codigo IS 'Código único da empresa (ex: EMP001)';
COMMENT ON COLUMN empresas.razao_social IS 'Razão social oficial da empresa';
COMMENT ON COLUMN empresas.nome_fantasia IS 'Nome fantasia da empresa (opcional)';
COMMENT ON COLUMN empresas.cnpj IS 'CNPJ formatado (xx.xxx.xxx/xxxx-xx)';
COMMENT ON COLUMN empresas.email IS 'Email principal da empresa';
COMMENT ON COLUMN empresas.telefone IS 'Telefone formatado ((xx) xxxxx-xxxx)';
COMMENT ON COLUMN empresas.cep IS 'CEP formatado (xxxxx-xxx)';
COMMENT ON COLUMN empresas.endereco IS 'Logradouro/endereço da empresa';
COMMENT ON COLUMN empresas.numero IS 'Número do endereço';
COMMENT ON COLUMN empresas.cidade IS 'Cidade da empresa';
COMMENT ON COLUMN empresas.estado IS 'Estado (UF) da empresa';
COMMENT ON COLUMN empresas.observacoes IS 'Observações gerais sobre a empresa';