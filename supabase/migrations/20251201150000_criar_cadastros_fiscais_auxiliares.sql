-- =====================================================
-- CRIAÇÃO DE CADASTROS FISCAIS AUXILIARES
-- Sistema Fiscal Moderno - ERP Brasileiro
-- Data: 01/12/2025
-- =====================================================

-- 1. TABELA DE NCM (Nomenclatura Comum do Mercosul)
CREATE TABLE IF NOT EXISTS ncm_cadastro (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(8) UNIQUE NOT NULL, -- 8 dígitos
    descricao TEXT NOT NULL,
    unidade_tributavel VARCHAR(10),
    aliquota_nacional NUMERIC(5,2), -- % médio
    aliquota_importacao NUMERIC(5,2),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_ncm_codigo CHECK (LENGTH(codigo) = 8 AND codigo ~ '^[0-9]{8}$')
);

CREATE INDEX idx_ncm_codigo ON ncm_cadastro(codigo);
CREATE INDEX idx_ncm_ativo ON ncm_cadastro(ativo);

COMMENT ON TABLE ncm_cadastro IS 'Cadastro de NCM - Nomenclatura Comum do Mercosul';
COMMENT ON COLUMN ncm_cadastro.codigo IS 'Código NCM com 8 dígitos numéricos';

-- 2. TABELA DE CEST (Código Especificador da Substituição Tributária)
CREATE TABLE IF NOT EXISTS cest_cadastro (
    id BIGSERIAL PRIMARY KEY,
    ncm_id BIGINT REFERENCES ncm_cadastro(id) ON DELETE RESTRICT,
    codigo VARCHAR(7) UNIQUE NOT NULL, -- 7 dígitos
    descricao TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_cest_codigo CHECK (LENGTH(codigo) = 7 AND codigo ~ '^[0-9]{7}$')
);

CREATE INDEX idx_cest_ncm ON cest_cadastro(ncm_id);
CREATE INDEX idx_cest_codigo ON cest_cadastro(codigo);

COMMENT ON TABLE cest_cadastro IS 'Código Especificador da Substituição Tributária';

-- 3. TABELA DE UNIDADES DE MEDIDA
CREATE TABLE IF NOT EXISTS unidades_medida (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(6) UNIQUE NOT NULL, -- UN, CX, KG, etc.
    descricao VARCHAR(100) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_unidades_codigo ON unidades_medida(codigo);

COMMENT ON TABLE unidades_medida IS 'Unidades de medida padronizadas';

-- Inserir unidades padrão
INSERT INTO unidades_medida (codigo, descricao) VALUES
('UN', 'Unidade'),
('CX', 'Caixa'),
('PC', 'Peça'),
('KG', 'Quilograma'),
('G', 'Grama'),
('L', 'Litro'),
('ML', 'Mililitro'),
('M', 'Metro'),
('M2', 'Metro Quadrado'),
('M3', 'Metro Cúbico'),
('PAR', 'Par'),
('DZ', 'Dúzia'),
('FD', 'Fardo'),
('SC', 'Saco'),
('TON', 'Tonelada')
ON CONFLICT (codigo) DO NOTHING;

-- 4. TABELA DE CFOP (Código Fiscal de Operações e Prestações)
CREATE TABLE IF NOT EXISTS cfop_cadastro (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(4) UNIQUE NOT NULL, -- 1000-7999
    descricao TEXT NOT NULL,
    finalidade VARCHAR(10) NOT NULL CHECK (finalidade IN ('ENTRADA', 'SAIDA')),
    tipo_operacao VARCHAR(30) NOT NULL,
    movimenta_estoque BOOLEAN DEFAULT true,
    movimenta_financeiro BOOLEAN DEFAULT true,
    dentro_estado BOOLEAN DEFAULT true, -- 5xxx = dentro, 6xxx = fora, 7xxx = exterior
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_cfop_codigo CHECK (codigo ~ '^[1-7][0-9]{3}$')
);

CREATE INDEX idx_cfop_codigo ON cfop_cadastro(codigo);
CREATE INDEX idx_cfop_finalidade ON cfop_cadastro(finalidade);
CREATE INDEX idx_cfop_tipo ON cfop_cadastro(tipo_operacao);

COMMENT ON TABLE cfop_cadastro IS 'Cadastro de CFOP - Código Fiscal de Operações e Prestações';

-- Inserir CFOPs mais comuns
INSERT INTO cfop_cadastro (codigo, descricao, finalidade, tipo_operacao, dentro_estado) VALUES
-- Vendas Dentro do Estado
('5101', 'Venda de produção do estabelecimento', 'SAIDA', 'VENDA', true),
('5102', 'Venda de mercadoria adquirida ou recebida de terceiros', 'SAIDA', 'VENDA', true),
('5405', 'Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária', 'SAIDA', 'VENDA', true),
('5929', 'Lançamento efetuado em decorrência de emissão de documento fiscal relativo a operação ou prestação também registrada em equipamento Emissor de Cupom Fiscal - ECF', 'SAIDA', 'OUTRAS', true),

-- Vendas Fora do Estado
('6101', 'Venda de produção do estabelecimento', 'SAIDA', 'VENDA', false),
('6102', 'Venda de mercadoria adquirida ou recebida de terceiros', 'SAIDA', 'VENDA', false),
('6404', 'Venda de mercadoria sujeita ao regime de substituição tributária', 'SAIDA', 'VENDA', false),

-- Compras Dentro do Estado
('1102', 'Compra para comercialização', 'ENTRADA', 'COMPRA', true),
('1403', 'Compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária', 'ENTRADA', 'COMPRA', true),

-- Compras Fora do Estado
('2102', 'Compra para comercialização', 'ENTRADA', 'COMPRA', false),
('2403', 'Compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária', 'ENTRADA', 'COMPRA', false),

-- Devoluções
('5202', 'Devolução de compra para comercialização', 'SAIDA', 'DEVOLUCAO', true),
('1202', 'Devolução de venda de mercadoria adquirida ou recebida de terceiros', 'ENTRADA', 'DEVOLUCAO', true),
('6202', 'Devolução de compra para comercialização', 'SAIDA', 'DEVOLUCAO', false),
('2202', 'Devolução de venda de mercadoria adquirida ou recebida de terceiros', 'ENTRADA', 'DEVOLUCAO', false),

-- Transferências
('5151', 'Transferência de produção do estabelecimento', 'SAIDA', 'TRANSFERENCIA', true),
('5152', 'Transferência de mercadoria adquirida ou recebida de terceiros', 'SAIDA', 'TRANSFERENCIA', true),
('1152', 'Entrada de mercadoria recebida em transferência de outro estabelecimento', 'ENTRADA', 'TRANSFERENCIA', true),

-- Remessas/Retornos
('5949', 'Outra saída de mercadoria ou prestação de serviço não especificado', 'SAIDA', 'REMESSA', true),
('1949', 'Outra entrada de mercadoria ou prestação de serviço não especificado', 'ENTRADA', 'RETORNO', true)
ON CONFLICT (codigo) DO NOTHING;

-- 5. TABELA DE CATEGORIAS DE PRODUTOS
CREATE TABLE IF NOT EXISTS categorias_produtos (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    categoria_pai_id BIGINT REFERENCES categorias_produtos(id) ON DELETE SET NULL,
    operacao_fiscal_padrao_id BIGINT, -- Será FK depois que criar operacoes_fiscais
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna operacao_fiscal_padrao_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'categorias_produtos' 
                   AND column_name = 'operacao_fiscal_padrao_id') THEN
        ALTER TABLE categorias_produtos ADD COLUMN operacao_fiscal_padrao_id BIGINT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categorias_codigo ON categorias_produtos(codigo);
CREATE INDEX IF NOT EXISTS idx_categorias_pai ON categorias_produtos(categoria_pai_id);

COMMENT ON TABLE categorias_produtos IS 'Categorias hierárquicas de produtos';

-- 6. TABELA DE OPERAÇÕES FISCAIS (Regras Tributárias Completas)
CREATE TABLE IF NOT EXISTS operacoes_fiscais (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    
    -- CFOPs vinculados
    cfop_dentro_estado VARCHAR(4) NOT NULL,
    cfop_fora_estado VARCHAR(4) NOT NULL,
    cfop_exterior VARCHAR(4),
    
    -- Regime tributário aplicável
    regime_tributario VARCHAR(20) NOT NULL CHECK (regime_tributario IN ('SIMPLES', 'PRESUMIDO', 'REAL', 'TODOS')),
    
    -- Finalidade
    finalidade VARCHAR(10) NOT NULL CHECK (finalidade IN ('ENTRADA', 'SAIDA')),
    tipo_operacao VARCHAR(30) NOT NULL,
    
    -- ICMS
    cst_icms VARCHAR(3),
    csosn_icms VARCHAR(4),
    modalidade_bc_icms VARCHAR(1),
    reducao_bc_icms NUMERIC(5,2),
    aliquota_icms NUMERIC(5,2),
    
    -- Substituição Tributária
    calcula_st BOOLEAN DEFAULT false,
    cst_icms_st VARCHAR(3),
    modalidade_bc_st VARCHAR(1),
    mva_st NUMERIC(5,2),
    reducao_bc_st NUMERIC(5,2),
    aliquota_st NUMERIC(5,2),
    
    -- PIS
    cst_pis VARCHAR(2),
    aliquota_pis NUMERIC(5,2),
    
    -- COFINS
    cst_cofins VARCHAR(2),
    aliquota_cofins NUMERIC(5,2),
    
    -- IPI
    cst_ipi VARCHAR(2),
    aliquota_ipi NUMERIC(5,2),
    enquadramento_ipi VARCHAR(3),
    
    -- Controles
    calcula_icms BOOLEAN DEFAULT true,
    calcula_pis BOOLEAN DEFAULT true,
    calcula_cofins BOOLEAN DEFAULT true,
    calcula_ipi BOOLEAN DEFAULT false,
    
    -- DIFAL
    calcula_difal BOOLEAN DEFAULT false,
    
    -- FCP
    calcula_fcp BOOLEAN DEFAULT false,
    aliquota_fcp NUMERIC(5,2),
    
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_cfop_dentro FOREIGN KEY (cfop_dentro_estado) REFERENCES cfop_cadastro(codigo),
    CONSTRAINT fk_cfop_fora FOREIGN KEY (cfop_fora_estado) REFERENCES cfop_cadastro(codigo)
);

CREATE INDEX idx_operacoes_codigo ON operacoes_fiscais(codigo);
CREATE INDEX idx_operacoes_regime ON operacoes_fiscais(regime_tributario);
CREATE INDEX idx_operacoes_finalidade ON operacoes_fiscais(finalidade);

COMMENT ON TABLE operacoes_fiscais IS 'Operações fiscais pré-configuradas com regras tributárias completas';

-- Agora podemos criar a FK em categorias_produtos (se ainda não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_operacao_fiscal_padrao' 
                   AND table_name = 'categorias_produtos') THEN
        ALTER TABLE categorias_produtos 
        ADD CONSTRAINT fk_operacao_fiscal_padrao 
        FOREIGN KEY (operacao_fiscal_padrao_id) REFERENCES operacoes_fiscais(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 7. TABELA DE REGRAS ICMS POR UF
CREATE TABLE IF NOT EXISTS regras_icms_uf (
    id BIGSERIAL PRIMARY KEY,
    uf_origem VARCHAR(2) NOT NULL,
    uf_destino VARCHAR(2) NOT NULL,
    aliquota_interna NUMERIC(5,2) NOT NULL,
    aliquota_interestadual NUMERIC(5,2) NOT NULL,
    mva_original NUMERIC(5,2),
    mva_ajustada NUMERIC(5,2),
    fcp_aliquota NUMERIC(5,2),
    vigencia_inicio DATE NOT NULL,
    vigencia_fim DATE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(uf_origem, uf_destino, vigencia_inicio)
);

CREATE INDEX idx_regras_icms_ufs ON regras_icms_uf(uf_origem, uf_destino);
CREATE INDEX idx_regras_icms_vigencia ON regras_icms_uf(vigencia_inicio, vigencia_fim);

COMMENT ON TABLE regras_icms_uf IS 'Regras de ICMS entre estados (alíquotas interestaduais e MVA)';

-- 8. TABELA IBPT (Impostos Sobre Produtos)
CREATE TABLE IF NOT EXISTS tabela_ibpt (
    id BIGSERIAL PRIMARY KEY,
    ncm VARCHAR(8) NOT NULL,
    descricao TEXT,
    nacional_federal NUMERIC(5,2) NOT NULL,
    importados_federal NUMERIC(5,2) NOT NULL,
    estadual NUMERIC(5,2) NOT NULL,
    municipal NUMERIC(5,2) NOT NULL,
    vigencia_inicio DATE NOT NULL,
    vigencia_fim DATE NOT NULL,
    chave VARCHAR(255),
    versao VARCHAR(50),
    fonte VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibpt_ncm ON tabela_ibpt(ncm);
CREATE INDEX idx_ibpt_vigencia ON tabela_ibpt(vigencia_inicio, vigencia_fim);

COMMENT ON TABLE tabela_ibpt IS 'Tabela IBPT para cálculo de impostos aproximados';

-- 9. TABELA DE CERTIFICADOS DIGITAIS
CREATE TABLE IF NOT EXISTS certificados_digitais (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(2) NOT NULL CHECK (tipo IN ('A1', 'A3')),
    arquivo TEXT, -- Base64 para A1
    senha TEXT, -- Criptografada
    caminho TEXT, -- Para A3
    cnpj VARCHAR(14) NOT NULL,
    nome_empresa VARCHAR(255) NOT NULL,
    validade_inicio DATE NOT NULL,
    validade_fim DATE NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cert_cnpj ON certificados_digitais(cnpj);
CREATE INDEX idx_cert_validade ON certificados_digitais(validade_fim);

COMMENT ON TABLE certificados_digitais IS 'Certificados digitais A1/A3 para assinatura de documentos fiscais';

-- 10. TABELA DE PARÂMETROS FISCAIS GLOBAIS
CREATE TABLE IF NOT EXISTS parametros_fiscais (
    id BIGSERIAL PRIMARY KEY,
    
    -- Dados da Empresa
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    inscricao_estadual VARCHAR(20),
    inscricao_municipal VARCHAR(20),
    regime_tributario VARCHAR(20) NOT NULL CHECK (regime_tributario IN ('SIMPLES', 'PRESUMIDO', 'REAL')),
    crt VARCHAR(1) NOT NULL CHECK (crt IN ('1', '2', '3')),
    uf VARCHAR(2) NOT NULL,
    
    -- Numeração
    serie_nfe INTEGER DEFAULT 1,
    numero_atual_nfe INTEGER DEFAULT 0,
    serie_nfce INTEGER DEFAULT 1,
    numero_atual_nfce INTEGER DEFAULT 0,
    
    -- Certificado
    certificado_id BIGINT REFERENCES certificados_digitais(id),
    
    -- Ambiente
    ambiente VARCHAR(15) NOT NULL CHECK (ambiente IN ('PRODUCAO', 'HOMOLOGACAO')) DEFAULT 'HOMOLOGACAO',
    
    -- Responsável Técnico
    responsavel_cpf VARCHAR(11),
    responsavel_nome VARCHAR(255),
    responsavel_email VARCHAR(255),
    responsavel_telefone VARCHAR(20),
    
    -- CSC para NFC-e
    csc_id VARCHAR(6),
    csc_codigo TEXT,
    
    -- Configurações
    timeout_sefaz INTEGER DEFAULT 30,
    tentativas_reenvio INTEGER DEFAULT 3,
    
    -- Emails
    email_copia_xml VARCHAR(255),
    email_copia_danfe VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE parametros_fiscais IS 'Parâmetros fiscais globais do sistema';

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

ALTER TABLE ncm_cadastro ENABLE ROW LEVEL SECURITY;
ALTER TABLE cest_cadastro ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades_medida ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfop_cadastro ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE operacoes_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE regras_icms_uf ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabela_ibpt ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados_digitais ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametros_fiscais ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura (todos autenticados podem ler)
CREATE POLICY "Permitir leitura NCM" ON ncm_cadastro FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura CEST" ON cest_cadastro FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura Unidades" ON unidades_medida FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura CFOP" ON cfop_cadastro FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura Categorias" ON categorias_produtos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura Operações Fiscais" ON operacoes_fiscais FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura Regras ICMS" ON regras_icms_uf FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura IBPT" ON tabela_ibpt FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura Certificados" ON certificados_digitais FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura Parâmetros" ON parametros_fiscais FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas de escrita (apenas admins)
CREATE POLICY "Permitir inserção NCM admin" ON ncm_cadastro FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir atualização NCM admin" ON ncm_cadastro FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir deleção NCM admin" ON ncm_cadastro FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Permitir inserção CEST admin" ON cest_cadastro FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir atualização CEST admin" ON cest_cadastro FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Permitir inserção Unidades admin" ON unidades_medida FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir atualização Unidades admin" ON unidades_medida FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Permitir inserção CFOP admin" ON cfop_cadastro FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir atualização CFOP admin" ON cfop_cadastro FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Permitir inserção Categorias admin" ON categorias_produtos FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir atualização Categorias admin" ON categorias_produtos FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir deleção Categorias admin" ON categorias_produtos FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Permitir inserção Operações admin" ON operacoes_fiscais FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir atualização Operações admin" ON operacoes_fiscais FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir deleção Operações admin" ON operacoes_fiscais FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Permitir inserção Regras ICMS admin" ON regras_icms_uf FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir atualização Regras ICMS admin" ON regras_icms_uf FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Permitir inserção IBPT admin" ON tabela_ibpt FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir atualização IBPT admin" ON tabela_ibpt FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Permitir inserção Certificados admin" ON certificados_digitais FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir atualização Certificados admin" ON certificados_digitais FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir deleção Certificados admin" ON certificados_digitais FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Permitir inserção Parâmetros admin" ON parametros_fiscais FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir atualização Parâmetros admin" ON parametros_fiscais FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ncm_updated_at BEFORE UPDATE ON ncm_cadastro FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cest_updated_at BEFORE UPDATE ON cest_cadastro FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_unidades_updated_at BEFORE UPDATE ON unidades_medida FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cfop_updated_at BEFORE UPDATE ON cfop_cadastro FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias_produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_operacoes_updated_at BEFORE UPDATE ON operacoes_fiscais FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_regras_icms_updated_at BEFORE UPDATE ON regras_icms_uf FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ibpt_updated_at BEFORE UPDATE ON tabela_ibpt FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cert_updated_at BEFORE UPDATE ON certificados_digitais FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parametros_updated_at BEFORE UPDATE ON parametros_fiscais FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
