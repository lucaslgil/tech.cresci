-- ====================================
-- CRIAÇÃO DA TABELA DE PRODUTOS
-- Sistema ERP Brasileiro - Compatível com NF-e, NFC-e, CF-e-SAT, SPED
-- ====================================

-- 1. Criar tabela de categorias de produtos
CREATE TABLE IF NOT EXISTS categorias_produtos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de unidades de medida
CREATE TABLE IF NOT EXISTS unidades_medida (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sigla TEXT NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inserir unidades de medida padrão
INSERT INTO unidades_medida (sigla, descricao) VALUES
    ('UN', 'Unidade'),
    ('CX', 'Caixa'),
    ('KG', 'Quilograma'),
    ('G', 'Grama'),
    ('L', 'Litro'),
    ('ML', 'Mililitro'),
    ('M', 'Metro'),
    ('M2', 'Metro Quadrado'),
    ('M3', 'Metro Cúbico'),
    ('PC', 'Peça'),
    ('PAR', 'Par'),
    ('DZ', 'Dúzia'),
    ('KIT', 'Kit'),
    ('JG', 'Jogo'),
    ('CONJ', 'Conjunto')
ON CONFLICT (sigla) DO NOTHING;

-- 4. Criar tabela principal de produtos
CREATE TABLE IF NOT EXISTS produtos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- DADOS GERAIS
    nome TEXT NOT NULL,
    descricao TEXT,
    codigo_interno TEXT NOT NULL UNIQUE,
    codigo_barras TEXT UNIQUE, -- EAN/GTIN
    categoria_id UUID REFERENCES categorias_produtos(id),
    unidade_medida TEXT NOT NULL DEFAULT 'UN',
    
    -- DADOS FISCAIS (NF-e / NFC-e / SAT)
    ncm TEXT NOT NULL, -- Nomenclatura Comum do Mercosul (8 dígitos)
    cest TEXT, -- Código Especificador da Substituição Tributária
    cfop_entrada TEXT, -- CFOP padrão para entrada
    cfop_saida TEXT, -- CFOP padrão para saída
    origem_mercadoria INTEGER NOT NULL DEFAULT 0 CHECK (origem_mercadoria BETWEEN 0 AND 8), -- 0-Nacional, 1-Estrangeira-Importação direta, etc
    
    -- CST/CSOSN - ICMS
    cst_icms TEXT, -- CST para regime normal
    csosn_icms TEXT, -- CSOSN para Simples Nacional
    aliquota_icms DECIMAL(5,2) DEFAULT 0.00,
    reducao_base_icms DECIMAL(5,2) DEFAULT 0.00,
    
    -- PIS
    cst_pis TEXT,
    aliquota_pis DECIMAL(5,2) DEFAULT 0.00,
    
    -- COFINS
    cst_cofins TEXT,
    aliquota_cofins DECIMAL(5,2) DEFAULT 0.00,
    
    -- IPI
    cst_ipi TEXT,
    aliquota_ipi DECIMAL(5,2) DEFAULT 0.00,
    codigo_enquadramento_ipi TEXT DEFAULT '999', -- Código de enquadramento IPI
    
    -- SUBSTITUIÇÃO TRIBUTÁRIA
    tem_substituicao_tributaria BOOLEAN DEFAULT FALSE,
    mva_st DECIMAL(5,2) DEFAULT 0.00, -- Margem de Valor Agregado para ST
    aliquota_icms_st DECIMAL(5,2) DEFAULT 0.00,
    reducao_base_icms_st DECIMAL(5,2) DEFAULT 0.00,
    
    -- OUTROS IMPOSTOS
    aliquota_aproximada_tributos DECIMAL(5,2) DEFAULT 0.00, -- Lei da Transparência
    informacoes_adicionais_fiscais TEXT,
    
    -- DADOS COMERCIAIS
    preco_custo DECIMAL(10,2) DEFAULT 0.00 CHECK (preco_custo >= 0),
    preco_venda DECIMAL(10,2) DEFAULT 0.00 CHECK (preco_venda >= 0),
    margem_lucro DECIMAL(5,2) DEFAULT 0.00,
    permite_desconto BOOLEAN DEFAULT TRUE,
    desconto_maximo DECIMAL(5,2) DEFAULT 0.00,
    
    -- DADOS DE ESTOQUE
    estoque_atual INTEGER DEFAULT 0 CHECK (estoque_atual >= 0),
    estoque_minimo INTEGER DEFAULT 0 CHECK (estoque_minimo >= 0),
    estoque_maximo INTEGER DEFAULT 0 CHECK (estoque_maximo >= 0),
    localizacao TEXT, -- Localização física no estoque
    controla_lote BOOLEAN DEFAULT FALSE,
    controla_serie BOOLEAN DEFAULT FALSE,
    controla_validade BOOLEAN DEFAULT FALSE,
    dias_validade INTEGER, -- Dias de validade do produto
    
    -- STATUS E CONTROLE
    status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
    observacoes TEXT,
    
    -- AUDITORIA
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 5. Criar tabela para lotes (se controla_lote = true)
CREATE TABLE IF NOT EXISTS produtos_lotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    numero_lote TEXT NOT NULL,
    data_fabricacao DATE,
    data_validade DATE,
    quantidade INTEGER NOT NULL DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(produto_id, numero_lote)
);

-- 6. Criar tabela para números de série (se controla_serie = true)
CREATE TABLE IF NOT EXISTS produtos_series (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    numero_serie TEXT NOT NULL UNIQUE,
    lote_id UUID REFERENCES produtos_lotes(id),
    status TEXT DEFAULT 'Em Estoque' CHECK (status IN ('Em Estoque', 'Vendido', 'Devolvido', 'Defeituoso')),
    colaborador_id UUID REFERENCES colaboradores(id), -- Se vinculado a alguém
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Criar tabela de histórico de movimentações de estoque
CREATE TABLE IF NOT EXISTS produtos_movimentacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    tipo_movimentacao TEXT NOT NULL CHECK (tipo_movimentacao IN ('Entrada', 'Saída', 'Ajuste', 'Transferência', 'Devolução')),
    quantidade INTEGER NOT NULL,
    quantidade_anterior INTEGER NOT NULL,
    quantidade_atual INTEGER NOT NULL,
    motivo TEXT,
    documento_fiscal TEXT, -- Número da NF-e, NFC-e, etc
    lote_id UUID REFERENCES produtos_lotes(id),
    responsavel_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Habilitar RLS (Row Level Security)
ALTER TABLE categorias_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades_medida ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos_lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos_movimentacoes ENABLE ROW LEVEL SECURITY;

-- 9. Criar políticas RLS para produtos
DROP POLICY IF EXISTS "Usuários autenticados podem ver produtos" ON produtos;
CREATE POLICY "Usuários autenticados podem ver produtos" 
    ON produtos FOR SELECT 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem inserir produtos" ON produtos;
CREATE POLICY "Usuários autenticados podem inserir produtos" 
    ON produtos FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar produtos" ON produtos;
CREATE POLICY "Usuários autenticados podem atualizar produtos" 
    ON produtos FOR UPDATE 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem deletar produtos" ON produtos;
CREATE POLICY "Usuários autenticados podem deletar produtos" 
    ON produtos FOR DELETE 
    USING (auth.role() = 'authenticated');

-- 10. Políticas RLS para categorias
DROP POLICY IF EXISTS "Usuários autenticados podem ver categorias" ON categorias_produtos;
CREATE POLICY "Usuários autenticados podem ver categorias" 
    ON categorias_produtos FOR SELECT 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar categorias" ON categorias_produtos;
CREATE POLICY "Usuários autenticados podem gerenciar categorias" 
    ON categorias_produtos FOR ALL 
    USING (auth.role() = 'authenticated');

-- 11. Políticas RLS para unidades de medida
DROP POLICY IF EXISTS "Todos podem ver unidades de medida" ON unidades_medida;
CREATE POLICY "Todos podem ver unidades de medida" 
    ON unidades_medida FOR SELECT 
    USING (auth.role() = 'authenticated');

-- 12. Políticas RLS para lotes
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar lotes" ON produtos_lotes;
CREATE POLICY "Usuários autenticados podem gerenciar lotes" 
    ON produtos_lotes FOR ALL 
    USING (auth.role() = 'authenticated');

-- 13. Políticas RLS para séries
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar séries" ON produtos_series;
CREATE POLICY "Usuários autenticados podem gerenciar séries" 
    ON produtos_series FOR ALL 
    USING (auth.role() = 'authenticated');

-- 14. Políticas RLS para movimentações
DROP POLICY IF EXISTS "Usuários autenticados podem ver movimentações" ON produtos_movimentacoes;
CREATE POLICY "Usuários autenticados podem ver movimentações" 
    ON produtos_movimentacoes FOR SELECT 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem registrar movimentações" ON produtos_movimentacoes;
CREATE POLICY "Usuários autenticados podem registrar movimentações" 
    ON produtos_movimentacoes FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- 15. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 16. Criar triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_produtos_updated_at ON produtos;
CREATE TRIGGER update_produtos_updated_at 
    BEFORE UPDATE ON produtos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categorias_produtos_updated_at ON categorias_produtos;
CREATE TRIGGER update_categorias_produtos_updated_at 
    BEFORE UPDATE ON categorias_produtos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 17. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_interno ON produtos(codigo_interno);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON produtos(codigo_barras) WHERE codigo_barras IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_produtos_ncm ON produtos(ncm);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_id ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_status ON produtos(status);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos USING gin(to_tsvector('portuguese', nome));
CREATE INDEX IF NOT EXISTS idx_produtos_descricao ON produtos USING gin(to_tsvector('portuguese', descricao));
CREATE INDEX IF NOT EXISTS idx_produtos_estoque_baixo ON produtos(estoque_atual, estoque_minimo) WHERE estoque_atual < estoque_minimo;
CREATE INDEX IF NOT EXISTS idx_produtos_lotes_produto_id ON produtos_lotes(produto_id);
CREATE INDEX IF NOT EXISTS idx_produtos_series_produto_id ON produtos_series(produto_id);
CREATE INDEX IF NOT EXISTS idx_produtos_series_numero_serie ON produtos_series(numero_serie);
CREATE INDEX IF NOT EXISTS idx_produtos_movimentacoes_produto_id ON produtos_movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_produtos_movimentacoes_created_at ON produtos_movimentacoes(created_at DESC);

-- 18. Criar view para produtos com estoque baixo
CREATE OR REPLACE VIEW vw_produtos_estoque_baixo AS
SELECT 
    p.*,
    c.nome AS categoria_nome
FROM produtos p
LEFT JOIN categorias_produtos c ON p.categoria_id = c.id
WHERE p.estoque_atual < p.estoque_minimo
  AND p.status = 'Ativo';

-- 19. Criar função para calcular margem de lucro automaticamente
CREATE OR REPLACE FUNCTION calcular_margem_lucro()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.preco_custo > 0 THEN
        NEW.margem_lucro = ((NEW.preco_venda - NEW.preco_custo) / NEW.preco_custo) * 100;
    ELSE
        NEW.margem_lucro = 0;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 20. Criar trigger para calcular margem automaticamente
DROP TRIGGER IF EXISTS trigger_calcular_margem_lucro ON produtos;
CREATE TRIGGER trigger_calcular_margem_lucro
    BEFORE INSERT OR UPDATE OF preco_custo, preco_venda ON produtos
    FOR EACH ROW
    EXECUTE FUNCTION calcular_margem_lucro();

-- 21. Criar função para registrar movimentação de estoque automaticamente
CREATE OR REPLACE FUNCTION registrar_movimentacao_estoque()
RETURNS TRIGGER AS $$
BEGIN
    -- Só registra se o estoque mudou
    IF OLD.estoque_atual IS DISTINCT FROM NEW.estoque_atual THEN
        INSERT INTO produtos_movimentacoes (
            produto_id,
            tipo_movimentacao,
            quantidade,
            quantidade_anterior,
            quantidade_atual,
            motivo,
            responsavel_id
        ) VALUES (
            NEW.id,
            CASE 
                WHEN NEW.estoque_atual > OLD.estoque_atual THEN 'Entrada'
                WHEN NEW.estoque_atual < OLD.estoque_atual THEN 'Saída'
                ELSE 'Ajuste'
            END,
            ABS(NEW.estoque_atual - OLD.estoque_atual),
            OLD.estoque_atual,
            NEW.estoque_atual,
            'Ajuste manual no cadastro',
            NEW.updated_by
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 22. Criar trigger para registrar movimentações
DROP TRIGGER IF EXISTS trigger_registrar_movimentacao ON produtos;
CREATE TRIGGER trigger_registrar_movimentacao
    AFTER UPDATE OF estoque_atual ON produtos
    FOR EACH ROW
    EXECUTE FUNCTION registrar_movimentacao_estoque();

-- 23. Inserir algumas categorias padrão
INSERT INTO categorias_produtos (nome, descricao) VALUES
    ('Eletrônicos', 'Produtos eletrônicos e tecnologia'),
    ('Informática', 'Computadores, periféricos e acessórios'),
    ('Telefonia', 'Celulares, chips e acessórios'),
    ('Materiais de Escritório', 'Materiais de uso geral em escritório'),
    ('Mobiliário', 'Móveis e equipamentos'),
    ('Limpeza', 'Produtos de limpeza e higiene'),
    ('Consumíveis', 'Materiais de consumo geral'),
    ('Equipamentos', 'Equipamentos diversos'),
    ('Outros', 'Produtos diversos')
ON CONFLICT (nome) DO NOTHING;

-- ====================================
-- FIM DA MIGRAÇÃO
-- ====================================
