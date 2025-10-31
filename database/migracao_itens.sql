-- ====================================
-- MIGRAÇÃO DA TABELA DE ITENS
-- Execute este SQL se você já tem a tabela itens antiga
-- ====================================

-- 1. Remover a tabela antiga (CUIDADO: isso apaga todos os dados!)
-- Se você tem dados importantes, faça backup antes!
DROP TABLE IF EXISTS itens CASCADE;

-- 2. Criar a nova tabela de itens com os campos atualizados
CREATE TABLE itens (
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

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE itens ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS básicas (todos os usuários autenticados)
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

DROP POLICY IF EXISTS "Usuários autenticados podem deletar itens" ON itens;
CREATE POLICY "Usuários autenticados podem deletar itens" 
    ON itens FOR DELETE 
    USING (auth.role() = 'authenticated');

-- 5. Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_itens_updated_at ON itens;
CREATE TRIGGER update_itens_updated_at 
    BEFORE UPDATE ON itens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_itens_codigo ON itens(codigo);
CREATE INDEX IF NOT EXISTS idx_itens_setor ON itens(setor);
CREATE INDEX IF NOT EXISTS idx_itens_status ON itens(status);
CREATE INDEX IF NOT EXISTS idx_itens_fornecedor ON itens(fornecedor);
