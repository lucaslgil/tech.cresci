-- =====================================================
-- SCRIPT: APLICAR CADASTROS AUXILIARES
-- Garantir que as tabelas NCM, CFOP, Operações Fiscais existam
-- Execute este script no Supabase SQL Editor
-- Data: 02/12/2025
-- =====================================================

-- =====================================================
-- FUNÇÃO AUXILIAR DE UPDATED_AT (SE NÃO EXISTIR)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABELA: NCM (Nomenclatura Comum do Mercosul)
-- =====================================================

CREATE TABLE IF NOT EXISTS ncm (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    unidade_tributaria VARCHAR(10),
    aliquota_nacional_federal DECIMAL(5,2),
    cest VARCHAR(10),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para NCM
CREATE INDEX IF NOT EXISTS idx_ncm_codigo ON ncm(codigo);
CREATE INDEX IF NOT EXISTS idx_ncm_ativo ON ncm(ativo);
CREATE INDEX IF NOT EXISTS idx_ncm_descricao ON ncm USING gin(to_tsvector('portuguese', descricao));

-- Comentários
COMMENT ON TABLE ncm IS 'Nomenclatura Comum do Mercosul - Classificação fiscal de produtos';
COMMENT ON COLUMN ncm.codigo IS 'Código NCM formato 0000.00.00';
COMMENT ON COLUMN ncm.cest IS 'Código Especificador da Substituição Tributária';

-- =====================================================
-- TABELA: CFOP (Código Fiscal de Operações e Prestações)
-- =====================================================

CREATE TABLE IF NOT EXISTS cfop (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(5) NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    aplicacao TEXT NOT NULL,
    tipo_operacao VARCHAR(20) NOT NULL CHECK (tipo_operacao IN ('ENTRADA', 'SAIDA', 'ENTRADA_IMPORTACAO')),
    movimenta_estoque BOOLEAN DEFAULT false,
    movimenta_financeiro BOOLEAN DEFAULT false,
    calcula_icms BOOLEAN DEFAULT false,
    calcula_ipi BOOLEAN DEFAULT false,
    calcula_pis BOOLEAN DEFAULT false,
    calcula_cofins BOOLEAN DEFAULT false,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para CFOP
CREATE INDEX IF NOT EXISTS idx_cfop_codigo ON cfop(codigo);
CREATE INDEX IF NOT EXISTS idx_cfop_tipo_operacao ON cfop(tipo_operacao);
CREATE INDEX IF NOT EXISTS idx_cfop_ativo ON cfop(ativo);
CREATE INDEX IF NOT EXISTS idx_cfop_descricao ON cfop USING gin(to_tsvector('portuguese', descricao));

-- Comentários
COMMENT ON TABLE cfop IS 'Código Fiscal de Operações e Prestações';
COMMENT ON COLUMN cfop.codigo IS 'Código CFOP formato 0.000';
COMMENT ON COLUMN cfop.tipo_operacao IS 'Tipo: ENTRADA, SAIDA ou ENTRADA_IMPORTACAO';

-- =====================================================
-- TABELA: OPERAÇÕES FISCAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS operacoes_fiscais (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    
    -- CFOPs por destino
    cfop_dentro_estado VARCHAR(5),
    cfop_fora_estado VARCHAR(5),
    cfop_exterior VARCHAR(5),
    
    -- Tipo e Finalidade
    tipo_operacao VARCHAR(20) NOT NULL CHECK (tipo_operacao IN ('VENDA', 'COMPRA', 'DEVOLUCAO_VENDA', 'DEVOLUCAO_COMPRA', 'TRANSFERENCIA', 'REMESSA', 'RETORNO', 'OUTRAS')),
    finalidade VARCHAR(20) NOT NULL CHECK (finalidade IN ('NORMAL', 'COMPLEMENTAR', 'AJUSTE', 'DEVOLUCAO')),
    natureza_operacao VARCHAR(100) NOT NULL,
    
    -- Tributação
    calcular_icms BOOLEAN DEFAULT true,
    calcular_ipi BOOLEAN DEFAULT true,
    calcular_pis BOOLEAN DEFAULT true,
    calcular_cofins BOOLEAN DEFAULT true,
    calcular_st BOOLEAN DEFAULT false,
    
    -- Controles
    movimenta_estoque BOOLEAN DEFAULT true,
    movimenta_financeiro BOOLEAN DEFAULT true,
    gera_duplicata BOOLEAN DEFAULT true,
    gera_comissao BOOLEAN DEFAULT true,
    
    -- Observações
    mensagem_nota TEXT,
    observacoes TEXT,
    
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para Operações Fiscais
CREATE INDEX IF NOT EXISTS idx_operacoes_codigo ON operacoes_fiscais(codigo);
CREATE INDEX IF NOT EXISTS idx_operacoes_tipo ON operacoes_fiscais(tipo_operacao);
CREATE INDEX IF NOT EXISTS idx_operacoes_ativo ON operacoes_fiscais(ativo);
CREATE INDEX IF NOT EXISTS idx_operacoes_nome ON operacoes_fiscais USING gin(to_tsvector('portuguese', nome));

-- Comentários
COMMENT ON TABLE operacoes_fiscais IS 'Operações Fiscais - Regras de tributação por tipo de operação';

-- =====================================================
-- TABELA: UNIDADES DE MEDIDA
-- =====================================================

CREATE TABLE IF NOT EXISTS unidades_medida (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(6) NOT NULL UNIQUE,
    descricao VARCHAR(100) NOT NULL,
    sigla VARCHAR(6) NOT NULL UNIQUE,
    permite_decimal BOOLEAN DEFAULT false,
    casas_decimais INTEGER DEFAULT 0 CHECK (casas_decimais >= 0 AND casas_decimais <= 4),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para Unidades de Medida
CREATE INDEX IF NOT EXISTS idx_unidades_codigo ON unidades_medida(codigo);
CREATE INDEX IF NOT EXISTS idx_unidades_sigla ON unidades_medida(sigla);
CREATE INDEX IF NOT EXISTS idx_unidades_ativo ON unidades_medida(ativo);

-- Comentários
COMMENT ON TABLE unidades_medida IS 'Unidades de Medida comerciais e tributárias';
COMMENT ON COLUMN unidades_medida.sigla IS 'Sigla da unidade (UN, KG, L, etc)';
COMMENT ON COLUMN unidades_medida.permite_decimal IS 'Permite quantidade fracionária';

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

DROP TRIGGER IF EXISTS update_ncm_updated_at ON ncm;
CREATE TRIGGER update_ncm_updated_at
    BEFORE UPDATE ON ncm
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cfop_updated_at ON cfop;
CREATE TRIGGER update_cfop_updated_at
    BEFORE UPDATE ON cfop
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_operacoes_fiscais_updated_at ON operacoes_fiscais;
CREATE TRIGGER update_operacoes_fiscais_updated_at
    BEFORE UPDATE ON operacoes_fiscais
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_unidades_medida_updated_at ON unidades_medida;
CREATE TRIGGER update_unidades_medida_updated_at
    BEFORE UPDATE ON unidades_medida
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS (ROW LEVEL SECURITY)
-- =====================================================

ALTER TABLE ncm ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfop ENABLE ROW LEVEL SECURITY;
ALTER TABLE operacoes_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades_medida ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (usuários autenticados podem ler/editar)
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar NCM" ON ncm;
CREATE POLICY "Usuários autenticados podem visualizar NCM"
    ON ncm FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem inserir NCM" ON ncm;
CREATE POLICY "Usuários autenticados podem inserir NCM"
    ON ncm FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar NCM" ON ncm;
CREATE POLICY "Usuários autenticados podem atualizar NCM"
    ON ncm FOR UPDATE
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem deletar NCM" ON ncm;
CREATE POLICY "Usuários autenticados podem deletar NCM"
    ON ncm FOR DELETE
    USING (auth.role() = 'authenticated');

-- CFOP Policies
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar CFOP" ON cfop;
CREATE POLICY "Usuários autenticados podem visualizar CFOP"
    ON cfop FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem inserir CFOP" ON cfop;
CREATE POLICY "Usuários autenticados podem inserir CFOP"
    ON cfop FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar CFOP" ON cfop;
CREATE POLICY "Usuários autenticados podem atualizar CFOP"
    ON cfop FOR UPDATE
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem deletar CFOP" ON cfop;
CREATE POLICY "Usuários autenticados podem deletar CFOP"
    ON cfop FOR DELETE
    USING (auth.role() = 'authenticated');

-- Operações Fiscais Policies
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar Operações Fiscais" ON operacoes_fiscais;
CREATE POLICY "Usuários autenticados podem visualizar Operações Fiscais"
    ON operacoes_fiscais FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem inserir Operações Fiscais" ON operacoes_fiscais;
CREATE POLICY "Usuários autenticados podem inserir Operações Fiscais"
    ON operacoes_fiscais FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar Operações Fiscais" ON operacoes_fiscais;
CREATE POLICY "Usuários autenticados podem atualizar Operações Fiscais"
    ON operacoes_fiscais FOR UPDATE
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem deletar Operações Fiscais" ON operacoes_fiscais;
CREATE POLICY "Usuários autenticados podem deletar Operações Fiscais"
    ON operacoes_fiscais FOR DELETE
    USING (auth.role() = 'authenticated');

-- Unidades de Medida Policies
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar Unidades de Medida" ON unidades_medida;
CREATE POLICY "Usuários autenticados podem visualizar Unidades de Medida"
    ON unidades_medida FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem inserir Unidades de Medida" ON unidades_medida;
CREATE POLICY "Usuários autenticados podem inserir Unidades de Medida"
    ON unidades_medida FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar Unidades de Medida" ON unidades_medida;
CREATE POLICY "Usuários autenticados podem atualizar Unidades de Medida"
    ON unidades_medida FOR UPDATE
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem deletar Unidades de Medida" ON unidades_medida;
CREATE POLICY "Usuários autenticados podem deletar Unidades de Medida"
    ON unidades_medida FOR DELETE
    USING (auth.role() = 'authenticated');

-- =====================================================
-- DADOS INICIAIS - UNIDADES DE MEDIDA COMUNS
-- =====================================================

INSERT INTO unidades_medida (codigo, descricao, sigla, permite_decimal, casas_decimais) VALUES
('UN', 'Unidade', 'UN', false, 0),
('PC', 'Peça', 'PC', false, 0),
('PAR', 'Par', 'PAR', false, 0),
('CX', 'Caixa', 'CX', false, 0),
('DZ', 'Dúzia', 'DZ', false, 0),
('KG', 'Quilograma', 'KG', true, 3),
('G', 'Grama', 'G', true, 3),
('TON', 'Tonelada', 'TON', true, 3),
('L', 'Litro', 'L', true, 3),
('ML', 'Mililitro', 'ML', true, 2),
('M', 'Metro', 'M', true, 2),
('M2', 'Metro Quadrado', 'M2', true, 2),
('M3', 'Metro Cúbico', 'M3', true, 3),
('CM', 'Centímetro', 'CM', true, 2),
('MM', 'Milímetro', 'MM', true, 2)
ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- DADOS INICIAIS - CFOPs MAIS COMUNS
-- =====================================================

INSERT INTO cfop (codigo, descricao, aplicacao, tipo_operacao, movimenta_estoque, movimenta_financeiro, calcula_icms, calcula_ipi, calcula_pis, calcula_cofins) VALUES
-- Vendas Dentro do Estado
('5.101', 'Venda de produção do estabelecimento', 'Venda de produtos industrializados ou produzidos pelo estabelecimento', 'SAIDA', true, true, true, true, true, true),
('5.102', 'Venda de mercadoria adquirida ou recebida de terceiros', 'Venda de mercadorias adquiridas para revenda', 'SAIDA', true, true, true, true, true, true),
('5.405', 'Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária', 'Venda com ST', 'SAIDA', true, true, true, true, true, true),
('5.949', 'Outra saída de mercadoria ou prestação de serviço não especificado', 'Outras saídas não classificadas', 'SAIDA', true, true, true, true, true, true),

-- Vendas Fora do Estado
('6.101', 'Venda de produção do estabelecimento', 'Venda de produtos industrializados para fora do estado', 'SAIDA', true, true, true, true, true, true),
('6.102', 'Venda de mercadoria adquirida ou recebida de terceiros', 'Venda de mercadorias para fora do estado', 'SAIDA', true, true, true, true, true, true),
('6.405', 'Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária', 'Venda com ST interestadual', 'SAIDA', true, true, true, true, true, true),
('6.949', 'Outra saída de mercadoria ou prestação de serviço não especificado', 'Outras saídas interestaduais', 'SAIDA', true, true, true, true, true, true),

-- Compras Dentro do Estado
('1.101', 'Compra para industrialização ou produção rural', 'Compra de produtos para industrialização', 'ENTRADA', true, true, true, true, true, true),
('1.102', 'Compra para comercialização', 'Compra de mercadorias para revenda', 'ENTRADA', true, true, true, true, true, true),
('1.949', 'Outra entrada de mercadoria ou prestação de serviço não especificado', 'Outras entradas não classificadas', 'ENTRADA', true, true, true, true, true, true),

-- Compras Fora do Estado
('2.101', 'Compra para industrialização ou produção rural', 'Compra interestadual para industrialização', 'ENTRADA', true, true, true, true, true, true),
('2.102', 'Compra para comercialização', 'Compra interestadual para revenda', 'ENTRADA', true, true, true, true, true, true),
('2.949', 'Outra entrada de mercadoria ou prestação de serviço não especificado', 'Outras entradas interestaduais', 'ENTRADA', true, true, true, true, true, true),

-- Devoluções
('5.201', 'Devolução de compra para industrialização ou produção rural', 'Devolução de mercadorias compradas', 'SAIDA', true, false, true, true, true, true),
('1.201', 'Devolução de venda de produção do estabelecimento', 'Devolução de vendas', 'ENTRADA', true, false, true, true, true, true)

ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- DADOS INICIAIS - OPERAÇÕES FISCAIS PADRÃO
-- =====================================================

INSERT INTO operacoes_fiscais (codigo, nome, descricao, tipo_operacao, finalidade, natureza_operacao, cfop_dentro_estado, cfop_fora_estado) VALUES
('VENDA', 'Venda', 'Operação de venda padrão', 'VENDA', 'NORMAL', 'Venda de mercadoria', '5.102', '6.102'),
('COMPRA', 'Compra', 'Operação de compra padrão', 'COMPRA', 'NORMAL', 'Compra para comercialização', '1.102', '2.102'),
('DEVOL_V', 'Devolução de Venda', 'Devolução de mercadoria vendida', 'DEVOLUCAO_VENDA', 'DEVOLUCAO', 'Devolução de venda', '1.201', '2.201'),
('DEVOL_C', 'Devolução de Compra', 'Devolução de mercadoria comprada', 'DEVOLUCAO_COMPRA', 'DEVOLUCAO', 'Devolução de compra', '5.201', '6.201')
ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- MENSAGEM FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Cadastros Auxiliares criados com sucesso!';
    RAISE NOTICE '📦 Tabelas: ncm, cfop, operacoes_fiscais, unidades_medida';
    RAISE NOTICE '🔒 RLS habilitado em todas as tabelas';
    RAISE NOTICE '📊 Dados iniciais inseridos';
END $$;
