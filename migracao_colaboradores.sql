-- ====================================
-- MIGRAÇÃO DA TABELA DE COLABORADORES
-- Execute este SQL se você já tem a tabela colaboradores antiga
-- ====================================

-- 1. Remover a tabela antiga (CUIDADO: isso apaga todos os dados!)
-- Se você tem dados importantes, faça backup antes!
DROP TABLE IF EXISTS colaboradores CASCADE;

-- 2. Criar a nova tabela de colaboradores com os campos atualizados
CREATE TABLE colaboradores (
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

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS básicas (todos os usuários autenticados)
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

DROP POLICY IF EXISTS "Usuários autenticados podem deletar colaboradores" ON colaboradores;
CREATE POLICY "Usuários autenticados podem deletar colaboradores" 
    ON colaboradores FOR DELETE 
    USING (auth.role() = 'authenticated');

-- 5. Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_colaboradores_updated_at ON colaboradores;
CREATE TRIGGER update_colaboradores_updated_at 
    BEFORE UPDATE ON colaboradores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_empresa_id ON colaboradores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cpf ON colaboradores(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_colaboradores_cnpj ON colaboradores(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_colaboradores_setor ON colaboradores(setor);
CREATE INDEX IF NOT EXISTS idx_colaboradores_tipo_pessoa ON colaboradores(tipo_pessoa);
