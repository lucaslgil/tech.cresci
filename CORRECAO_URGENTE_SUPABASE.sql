-- CORREÇÃO URGENTE: Problema de relacionamento colaboradores x empresas
-- Execute estes comandos no Supabase SQL Editor na ordem exata

-- 1. PRIMEIRO: Verificar se as tabelas existem
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name IN ('empresas', 'colaboradores')
    AND table_schema = 'public';

-- 2. CRIAR TABELA EMPRESAS (se não existir)
CREATE TABLE IF NOT EXISTS empresas (
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

-- 3. INSERIR EMPRESA PADRÃO (se não existir)
INSERT INTO empresas (
    codigo, razao_social, nome_fantasia, cnpj, email, telefone, 
    cep, endereco, numero, cidade, estado, observacoes
) 
SELECT 
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
WHERE NOT EXISTS (SELECT 1 FROM empresas WHERE codigo = 'EMP001');

-- 4. DELETAR TABELA COLABORADORES (se existir com problema)
DROP TABLE IF EXISTS colaboradores CASCADE;

-- 5. CRIAR TABELA COLABORADORES CORRETAMENTE
CREATE TABLE colaboradores (
    id BIGSERIAL PRIMARY KEY,
    tipo_pessoa VARCHAR(10) NOT NULL CHECK (tipo_pessoa IN ('fisica', 'juridica')),
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    cnpj VARCHAR(18),
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    setor VARCHAR(100) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    empresa_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- CONSTRAINTS
    CONSTRAINT check_documento CHECK (
        (tipo_pessoa = 'fisica' AND cpf IS NOT NULL AND cnpj IS NULL) OR
        (tipo_pessoa = 'juridica' AND cnpj IS NOT NULL AND cpf IS NULL)
    ),
    CONSTRAINT unique_cpf UNIQUE (cpf),
    CONSTRAINT unique_cnpj UNIQUE (cnpj),
    
    -- FOREIGN KEY CORRETA
    CONSTRAINT fk_colaboradores_empresa 
        FOREIGN KEY (empresa_id) 
        REFERENCES empresas(id) 
        ON DELETE RESTRICT
);

-- 6. CRIAR ÍNDICES
CREATE INDEX idx_colaboradores_tipo_pessoa ON colaboradores(tipo_pessoa);
CREATE INDEX idx_colaboradores_cpf ON colaboradores(cpf);
CREATE INDEX idx_colaboradores_cnpj ON colaboradores(cnpj);
CREATE INDEX idx_colaboradores_email ON colaboradores(email);
CREATE INDEX idx_colaboradores_empresa_id ON colaboradores(empresa_id);
CREATE INDEX idx_colaboradores_nome ON colaboradores(nome);

-- 7. INSERIR COLABORADOR DE TESTE
INSERT INTO colaboradores (
    tipo_pessoa, nome, cpf, email, telefone, setor, cargo, empresa_id
) VALUES (
    'fisica',
    'João Silva',
    '123.456.789-00',
    'joao@crescieperdi.com.br',
    '(19) 99999-9999',
    'Tecnologia da Informação',
    'Desenvolvedor',
    (SELECT id FROM empresas WHERE codigo = 'EMP001' LIMIT 1)
);

-- 8. HABILITAR RLS
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;

-- 9. CRIAR POLÍTICAS BÁSICAS
-- Políticas para empresas
CREATE POLICY "Allow authenticated users to read empresas" ON empresas
    FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert empresas" ON empresas
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update empresas" ON empresas
    FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated users to delete empresas" ON empresas
    FOR DELETE USING (true);

-- Políticas para colaboradores
CREATE POLICY "Allow authenticated users to read colaboradores" ON colaboradores
    FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert colaboradores" ON colaboradores
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update colaboradores" ON colaboradores
    FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated users to delete colaboradores" ON colaboradores
    FOR DELETE USING (true);

-- 10. VERIFICAR SE TUDO FUNCIONOU
SELECT 
    c.id,
    c.nome,
    c.email,
    e.razao_social as empresa_nome
FROM colaboradores c
LEFT JOIN empresas e ON c.empresa_id = e.id;

-- 11. TESTAR A CONSULTA QUE O FRONTEND USA
SELECT 
    c.id,
    c.tipo_pessoa,
    c.nome,
    c.cpf,
    c.cnpj,
    c.email,
    c.telefone,
    c.setor,
    c.cargo,
    c.empresa_id,
    c.created_at,
    e.razao_social
FROM colaboradores c
LEFT JOIN empresas e ON c.empresa_id = e.id
ORDER BY c.nome;