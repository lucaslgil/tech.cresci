-- =====================================================
-- CONVERTER TABELAS FISCAIS DE UUID PARA BIGINT
-- Altera IDs e FKs das tabelas fiscais auxiliares
-- Data: 01/12/2025
-- =====================================================

-- 1. REMOVER CONSTRAINT FK de categorias_produtos (antes de alterar)
ALTER TABLE categorias_produtos DROP CONSTRAINT IF EXISTS fk_operacao_fiscal_padrao;

-- 2. DROP e RECREATE tabelas na ordem correta (respeitando dependências)
DROP TABLE IF EXISTS regras_icms_uf CASCADE;
DROP TABLE IF EXISTS tabela_ibpt CASCADE;
DROP TABLE IF EXISTS certificados_digitais CASCADE;
DROP TABLE IF EXISTS parametros_fiscais CASCADE;
DROP TABLE IF EXISTS operacoes_fiscais CASCADE;
DROP TABLE IF EXISTS cest_cadastro CASCADE;
DROP TABLE IF EXISTS ncm_cadastro CASCADE;
DROP TABLE IF EXISTS unidades_medida CASCADE;
DROP TABLE IF EXISTS cfop_cadastro CASCADE;

-- 3. RECRIAR TABELAS COM BIGSERIAL

-- NCM
CREATE TABLE ncm_cadastro (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(8) UNIQUE NOT NULL,
    descricao TEXT NOT NULL,
    unidade_tributavel VARCHAR(10),
    aliquota_nacional NUMERIC(5,2),
    aliquota_importacao NUMERIC(5,2),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_ncm_codigo CHECK (LENGTH(codigo) = 8 AND codigo ~ '^[0-9]{8}$')
);

CREATE INDEX idx_ncm_codigo ON ncm_cadastro(codigo);
CREATE INDEX idx_ncm_ativo ON ncm_cadastro(ativo);

-- CEST
CREATE TABLE cest_cadastro (
    id BIGSERIAL PRIMARY KEY,
    ncm_id BIGINT REFERENCES ncm_cadastro(id) ON DELETE RESTRICT,
    codigo VARCHAR(7) UNIQUE NOT NULL,
    descricao TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_cest_codigo CHECK (LENGTH(codigo) = 7 AND codigo ~ '^[0-9]{7}$')
);

CREATE INDEX idx_cest_ncm ON cest_cadastro(ncm_id);
CREATE INDEX idx_cest_codigo ON cest_cadastro(codigo);

-- Unidades de Medida
CREATE TABLE unidades_medida (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(6) UNIQUE NOT NULL,
    descricao VARCHAR(100) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_unidades_codigo ON unidades_medida(codigo);

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
('TON', 'Tonelada');

-- CFOP
CREATE TABLE cfop_cadastro (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(4) UNIQUE NOT NULL,
    descricao TEXT NOT NULL,
    finalidade VARCHAR(10) NOT NULL CHECK (finalidade IN ('ENTRADA', 'SAIDA')),
    tipo_operacao VARCHAR(30) NOT NULL,
    movimenta_estoque BOOLEAN DEFAULT true,
    movimenta_financeiro BOOLEAN DEFAULT true,
    dentro_estado BOOLEAN DEFAULT true,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_cfop_codigo CHECK (codigo ~ '^[1-7][0-9]{3}$')
);

CREATE INDEX idx_cfop_codigo ON cfop_cadastro(codigo);
CREATE INDEX idx_cfop_finalidade ON cfop_cadastro(finalidade);
CREATE INDEX idx_cfop_tipo ON cfop_cadastro(tipo_operacao);

-- Inserir CFOPs mais comuns
INSERT INTO cfop_cadastro (codigo, descricao, finalidade, tipo_operacao, dentro_estado) VALUES
('5101', 'Venda de produção do estabelecimento', 'SAIDA', 'VENDA', true),
('5102', 'Venda de mercadoria adquirida ou recebida de terceiros', 'SAIDA', 'VENDA', true),
('5405', 'Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária', 'SAIDA', 'VENDA', true),
('5929', 'Lançamento efetuado em decorrência de emissão de documento fiscal relativo a operação ou prestação também registrada em equipamento Emissor de Cupom Fiscal - ECF', 'SAIDA', 'OUTRAS', true),
('6101', 'Venda de produção do estabelecimento', 'SAIDA', 'VENDA', false),
('6102', 'Venda de mercadoria adquirida ou recebida de terceiros', 'SAIDA', 'VENDA', false),
('6404', 'Venda de mercadoria sujeita ao regime de substituição tributária', 'SAIDA', 'VENDA', false),
('1102', 'Compra para comercialização', 'ENTRADA', 'COMPRA', true),
('1403', 'Compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária', 'ENTRADA', 'COMPRA', true),
('2102', 'Compra para comercialização', 'ENTRADA', 'COMPRA', false),
('2403', 'Compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária', 'ENTRADA', 'COMPRA', false),
('5202', 'Devolução de compra para comercialização', 'SAIDA', 'DEVOLUCAO', true),
('1202', 'Devolução de venda de mercadoria adquirida ou recebida de terceiros', 'ENTRADA', 'DEVOLUCAO', true),
('6202', 'Devolução de compra para comercialização', 'SAIDA', 'DEVOLUCAO', false),
('2202', 'Devolução de venda de mercadoria adquirida ou recebida de terceiros', 'ENTRADA', 'DEVOLUCAO', false),
('5151', 'Transferência de produção do estabelecimento', 'SAIDA', 'TRANSFERENCIA', true),
('5152', 'Transferência de mercadoria adquirida ou recebida de terceiros', 'SAIDA', 'TRANSFERENCIA', true),
('1152', 'Entrada de mercadoria recebida em transferência de outro estabelecimento', 'ENTRADA', 'TRANSFERENCIA', true),
('5949', 'Outra saída de mercadoria ou prestação de serviço não especificado', 'SAIDA', 'REMESSA', true),
('1949', 'Outra entrada de mercadoria ou prestação de serviço não especificado', 'ENTRADA', 'RETORNO', true);

-- Operações Fiscais
CREATE TABLE operacoes_fiscais (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    cfop_dentro_estado VARCHAR(4) NOT NULL,
    cfop_fora_estado VARCHAR(4) NOT NULL,
    cfop_exterior VARCHAR(4),
    regime_tributario VARCHAR(20) NOT NULL CHECK (regime_tributario IN ('SIMPLES', 'PRESUMIDO', 'REAL', 'TODOS')),
    finalidade VARCHAR(10) NOT NULL CHECK (finalidade IN ('ENTRADA', 'SAIDA')),
    tipo_operacao VARCHAR(30) NOT NULL,
    cst_icms VARCHAR(3),
    csosn_icms VARCHAR(4),
    modalidade_bc_icms VARCHAR(1),
    reducao_bc_icms NUMERIC(5,2),
    aliquota_icms NUMERIC(5,2),
    calcula_st BOOLEAN DEFAULT false,
    cst_icms_st VARCHAR(3),
    modalidade_bc_st VARCHAR(1),
    mva_st NUMERIC(5,2),
    reducao_bc_st NUMERIC(5,2),
    aliquota_st NUMERIC(5,2),
    cst_pis VARCHAR(2),
    aliquota_pis NUMERIC(5,2),
    cst_cofins VARCHAR(2),
    aliquota_cofins NUMERIC(5,2),
    cst_ipi VARCHAR(2),
    aliquota_ipi NUMERIC(5,2),
    enquadramento_ipi VARCHAR(3),
    calcula_icms BOOLEAN DEFAULT true,
    calcula_pis BOOLEAN DEFAULT true,
    calcula_cofins BOOLEAN DEFAULT true,
    calcula_ipi BOOLEAN DEFAULT false,
    calcula_difal BOOLEAN DEFAULT false,
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

-- Regras ICMS UF
CREATE TABLE regras_icms_uf (
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

-- Tabela IBPT
CREATE TABLE tabela_ibpt (
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

-- Certificados Digitais
CREATE TABLE certificados_digitais (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(2) NOT NULL CHECK (tipo IN ('A1', 'A3')),
    arquivo TEXT,
    senha TEXT,
    caminho TEXT,
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

-- Parâmetros Fiscais
CREATE TABLE parametros_fiscais (
    id BIGSERIAL PRIMARY KEY,
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    inscricao_estadual VARCHAR(20),
    inscricao_municipal VARCHAR(20),
    regime_tributario VARCHAR(20) NOT NULL CHECK (regime_tributario IN ('SIMPLES', 'PRESUMIDO', 'REAL')),
    crt VARCHAR(1) NOT NULL CHECK (crt IN ('1', '2', '3')),
    uf VARCHAR(2) NOT NULL,
    serie_nfe INTEGER DEFAULT 1,
    numero_atual_nfe INTEGER DEFAULT 0,
    serie_nfce INTEGER DEFAULT 1,
    numero_atual_nfce INTEGER DEFAULT 0,
    certificado_id BIGINT REFERENCES certificados_digitais(id),
    ambiente VARCHAR(15) NOT NULL CHECK (ambiente IN ('PRODUCAO', 'HOMOLOGACAO')) DEFAULT 'HOMOLOGACAO',
    responsavel_cpf VARCHAR(11),
    responsavel_nome VARCHAR(255),
    responsavel_email VARCHAR(255),
    responsavel_telefone VARCHAR(20),
    csc_id VARCHAR(6),
    csc_codigo TEXT,
    timeout_sefaz INTEGER DEFAULT 30,
    tentativas_reenvio INTEGER DEFAULT 3,
    email_copia_xml VARCHAR(255),
    email_copia_danfe VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Adicionar coluna operacao_fiscal_padrao_id em categorias_produtos (se não existir)
DO $$
BEGIN
    -- Verifica se a coluna existe
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'categorias_produtos' 
               AND column_name = 'operacao_fiscal_padrao_id') THEN
        -- Se existir, alterar tipo para BIGINT
        EXECUTE 'ALTER TABLE categorias_produtos ALTER COLUMN operacao_fiscal_padrao_id TYPE BIGINT USING operacao_fiscal_padrao_id::text::bigint';
    ELSE
        -- Se não existir, criar como BIGINT
        ALTER TABLE categorias_produtos ADD COLUMN operacao_fiscal_padrao_id BIGINT;
    END IF;
END $$;

-- 5. Recriar FK
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

-- 6. RLS e Policies (manter mesmo padrão)
ALTER TABLE ncm_cadastro ENABLE ROW LEVEL SECURITY;
ALTER TABLE cest_cadastro ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades_medida ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfop_cadastro ENABLE ROW LEVEL SECURITY;
ALTER TABLE operacoes_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE regras_icms_uf ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabela_ibpt ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados_digitais ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametros_fiscais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura NCM" ON ncm_cadastro FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura CEST" ON cest_cadastro FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura Unidades" ON unidades_medida FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura CFOP" ON cfop_cadastro FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura Operações Fiscais" ON operacoes_fiscais FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura Regras ICMS" ON regras_icms_uf FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura IBPT" ON tabela_ibpt FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura Certificados" ON certificados_digitais FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura Parâmetros" ON parametros_fiscais FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserção NCM admin" ON ncm_cadastro FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir atualização NCM admin" ON ncm_cadastro FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir deleção NCM admin" ON ncm_cadastro FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Permitir inserção CEST admin" ON cest_cadastro FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir atualização CEST admin" ON cest_cadastro FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Permitir inserção Unidades admin" ON unidades_medida FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir atualização Unidades admin" ON unidades_medida FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Permitir inserção CFOP admin" ON cfop_cadastro FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Permitir atualização CFOP admin" ON cfop_cadastro FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

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

-- 7. TRIGGERS para updated_at
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
CREATE TRIGGER update_operacoes_updated_at BEFORE UPDATE ON operacoes_fiscais FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_regras_icms_updated_at BEFORE UPDATE ON regras_icms_uf FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ibpt_updated_at BEFORE UPDATE ON tabela_ibpt FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cert_updated_at BEFORE UPDATE ON certificados_digitais FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parametros_updated_at BEFORE UPDATE ON parametros_fiscais FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
