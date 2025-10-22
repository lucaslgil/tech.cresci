-- ALTERNATIVA: CONFIGURAÇÕES EM JSON
-- Uma abordagem mais simples usando JSON para armazenar as listas

-- 1. Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS configuracoes_sistema (
    id BIGSERIAL PRIMARY KEY,
    chave TEXT NOT NULL UNIQUE,
    valor JSONB NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Inserir configurações padrão
INSERT INTO configuracoes_sistema (chave, valor, descricao) VALUES 
(
    'setores_disponiveis',
    '["Administrativo", "Financeiro", "Recursos Humanos", "Tecnologia da Informação", "Vendas", "Marketing", "Operacional", "Produção", "Qualidade", "Logística", "Jurídico", "Compras", "Controladoria", "Diretoria"]',
    'Lista de setores disponíveis para cadastro de colaboradores'
),
(
    'cargos_disponiveis', 
    '["Assistente Administrativo", "Analista Financeiro", "Coordenador de RH", "Desenvolvedor", "Analista de Sistemas", "Gerente de TI", "Vendedor", "Supervisor de Vendas", "Analista de Marketing", "Coordenador de Marketing", "Assistente Operacional", "Supervisor de Produção", "Analista de Qualidade", "Coordenador de Logística", "Assistente Jurídico", "Comprador", "Contador", "Diretor", "Gerente Geral", "Estagiário"]',
    'Lista de cargos disponíveis para cadastro de colaboradores'
)
ON CONFLICT (chave) DO NOTHING;

-- 3. Habilitar RLS
ALTER TABLE configuracoes_sistema ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas
CREATE POLICY "Permitir leitura de configurações para usuários autenticados" ON configuracoes_sistema
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir escrita de configurações para usuários autenticados" ON configuracoes_sistema
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Criar índice
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes_sistema(chave);

-- 6. Função para buscar configuração
CREATE OR REPLACE FUNCTION get_configuracao(chave_param TEXT)
RETURNS JSONB AS $$
BEGIN
    RETURN (SELECT valor FROM configuracoes_sistema WHERE chave = chave_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função para atualizar configuração
CREATE OR REPLACE FUNCTION update_configuracao(chave_param TEXT, novo_valor JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE configuracoes_sistema 
    SET valor = novo_valor, updated_at = NOW() 
    WHERE chave = chave_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;