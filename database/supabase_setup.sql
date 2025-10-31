-- ====================================
-- SCRIPT SQL PARA SUPABASE
-- Sistema de Inventário e Cadastro
-- ====================================

-- 0. Criar tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT,
    email TEXT NOT NULL,
    telefone TEXT,
    cargo TEXT,
    foto_perfil TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para usuários
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver e editar apenas seus próprios dados
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON usuarios;
CREATE POLICY "Usuários podem ver seu próprio perfil" 
    ON usuarios FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON usuarios;
CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
    ON usuarios FOR UPDATE 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON usuarios;
CREATE POLICY "Usuários podem inserir seu próprio perfil" 
    ON usuarios FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Trigger para atualizar updated_at em usuários
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 1. Criar tabela de empresas
CREATE TABLE IF NOT EXISTS empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    cnpj TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL,
    endereco TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de colaboradores
CREATE TABLE IF NOT EXISTS colaboradores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo_pessoa TEXT NOT NULL CHECK (tipo_pessoa IN ('fisica', 'juridica')),
    nome TEXT NOT NULL,
    cpf TEXT,
    cnpj TEXT,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL,
    setor TEXT NOT NULL,
    cargo TEXT NOT NULL,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT cpf_cnpj_check CHECK (
        (tipo_pessoa = 'fisica' AND cpf IS NOT NULL AND cnpj IS NULL) OR
        (tipo_pessoa = 'juridica' AND cnpj IS NOT NULL AND cpf IS NULL)
    )
);

-- 3. Criar tabela de itens
CREATE TABLE IF NOT EXISTS itens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    item TEXT NOT NULL,
    modelo TEXT,
    numero_serie TEXT,
    detalhes TEXT,
    nota_fiscal TEXT,
    fornecedor TEXT,
    setor TEXT NOT NULL,
    status TEXT NOT NULL,
    valor NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Criar triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_empresas_updated_at ON empresas;
CREATE TRIGGER update_empresas_updated_at 
    BEFORE UPDATE ON empresas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_colaboradores_updated_at ON colaboradores;
CREATE TRIGGER update_colaboradores_updated_at 
    BEFORE UPDATE ON colaboradores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_itens_updated_at ON itens;
CREATE TRIGGER update_itens_updated_at 
    BEFORE UPDATE ON itens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Habilitar RLS (Row Level Security)
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS básicas (todos os usuários autenticados)
-- EMPRESAS
DROP POLICY IF EXISTS "Usuários autenticados podem ver empresas" ON empresas;
CREATE POLICY "Usuários autenticados podem ver empresas" 
    ON empresas FOR SELECT 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem inserir empresas" ON empresas;
CREATE POLICY "Usuários autenticados podem inserir empresas" 
    ON empresas FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar empresas" ON empresas;
CREATE POLICY "Usuários autenticados podem atualizar empresas" 
    ON empresas FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- COLABORADORES
DROP POLICY IF EXISTS "Usuários autenticados podem ver colaboradores" ON colaboradores;
CREATE POLICY "Usuários autenticados podem ver colaboradores" 
    ON colaboradores FOR SELECT 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem inserir colaboradores" ON colaboradores;
CREATE POLICY "Usuários autenticados podem inserir colaboradores" 
    ON colaboradores FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar colaboradores" ON colaboradores;
CREATE POLICY "Usuários autenticados podem atualizar colaboradores" 
    ON colaboradores FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- ITENS
DROP POLICY IF EXISTS "Usuários autenticados podem ver itens" ON itens;
CREATE POLICY "Usuários autenticados podem ver itens" 
    ON itens FOR SELECT 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem inserir itens" ON itens;
CREATE POLICY "Usuários autenticados podem inserir itens" 
    ON itens FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar itens" ON itens;
CREATE POLICY "Usuários autenticados podem atualizar itens" 
    ON itens FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- 8. Inserir dados de exemplo (opcional)
INSERT INTO empresas (nome, cnpj, email, telefone, endereco) VALUES
('Tech Solutions Ltda', '12.345.678/0001-90', 'contato@techsolutions.com', '(11) 99999-0001', 'Av. Paulista, 1000 - São Paulo, SP'),
('Inovação Digital ME', '98.765.432/0001-10', 'info@inovacaodigital.com', '(21) 88888-0002', 'Rua das Flores, 200 - Rio de Janeiro, RJ'),
('Gestão Empresarial S.A.', '11.222.333/0001-44', 'admin@gestaoempresarial.com', '(31) 77777-0003', 'Praça da Liberdade, 300 - Belo Horizonte, MG');

-- 9. Verificar se as tabelas foram criadas
SELECT 
    table_name,
    column_name,
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('empresas', 'colaboradores', 'itens')
ORDER BY table_name, ordinal_position;