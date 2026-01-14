-- =====================================================
-- MIGRATION: CADASTROS FISCAIS AUXILIARES (idempotent)
-- Tabelas: NCM, CFOP, Operações Fiscais, Unidades de Medida
-- Data: 02/12/2025 (reaplicada)
-- =====================================================

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
    cfop_dentro_estado VARCHAR(5),
    cfop_fora_estado VARCHAR(5),
    cfop_exterior VARCHAR(5),
    tipo_operacao VARCHAR(20) NOT NULL CHECK (tipo_operacao IN ('VENDA', 'COMPRA', 'DEVOLUCAO_VENDA', 'DEVOLUCAO_COMPRA', 'TRANSFERENCIA', 'REMESSA', 'RETORNO', 'OUTRAS')),
    finalidade VARCHAR(20) NOT NULL CHECK (finalidade IN ('NORMAL', 'COMPLEMENTAR', 'AJUSTE', 'DEVOLUCAO')),
    natureza_operacao VARCHAR(100) NOT NULL,
    calcular_icms BOOLEAN DEFAULT true,
    calcular_ipi BOOLEAN DEFAULT true,
    calcular_pis BOOLEAN DEFAULT true,
    calcular_cofins BOOLEAN DEFAULT true,
    calcular_st BOOLEAN DEFAULT false,
    movimenta_estoque BOOLEAN DEFAULT true,
    movimenta_financeiro BOOLEAN DEFAULT true,
    gera_duplicata BOOLEAN DEFAULT true,
    gera_comissao BOOLEAN DEFAULT true,
    mensagem_nota TEXT,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (cfop_dentro_estado) REFERENCES cfop(codigo) ON DELETE SET NULL,
    FOREIGN KEY (cfop_fora_estado) REFERENCES cfop(codigo) ON DELETE SET NULL,
    FOREIGN KEY (cfop_exterior) REFERENCES cfop(codigo) ON DELETE SET NULL
);

-- Índices para Operações Fiscais
CREATE INDEX IF NOT EXISTS idx_operacoes_codigo ON operacoes_fiscais(codigo);
CREATE INDEX IF NOT EXISTS idx_operacoes_tipo ON operacoes_fiscais(tipo_operacao);
CREATE INDEX IF NOT EXISTS idx_operacoes_ativo ON operacoes_fiscais(ativo);
CREATE INDEX IF NOT EXISTS idx_operacoes_nome ON operacoes_fiscais USING gin(to_tsvector('portuguese', nome));

COMMENT ON TABLE operacoes_fiscais IS 'Operações Fiscais - Regras de tributação por tipo de operação';

-- =====================================================
-- TABELA: UNIDADES DE MEDIDA
-- =====================================================

CREATE TABLE IF NOT EXISTS unidades_medida (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(6) NOT NULL UNIQUE,
    descricao VARCHAR(100) NOT NULL,
    sigla VARCHAR(6),
    permite_decimal BOOLEAN DEFAULT false,
    casas_decimais INTEGER DEFAULT 0 CHECK (casas_decimais >= 0 AND casas_decimais <= 4),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para Unidades de Medida (guardas para esquemas antigos)
CREATE INDEX IF NOT EXISTS idx_unidades_codigo ON unidades_medida(codigo);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='unidades_medida' AND column_name='sigla') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='unidades_medida' AND indexname='idx_unidades_sigla') THEN
      EXECUTE 'CREATE INDEX idx_unidades_sigla ON unidades_medida(sigla)';
    END IF;
  END IF;
END$$;
CREATE INDEX IF NOT EXISTS idx_unidades_ativo ON unidades_medida(ativo);

COMMENT ON TABLE unidades_medida IS 'Unidades de Medida comerciais e tributárias';
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='unidades_medida' AND column_name='sigla') THEN
    PERFORM pg_catalog.set_config('search_path', current_schema(), false);
    EXECUTE 'COMMENT ON COLUMN unidades_medida.sigla IS ''Sigla da unidade (UN, KG, L, etc)''';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='unidades_medida' AND column_name='permite_decimal') THEN
    EXECUTE 'COMMENT ON COLUMN unidades_medida.permite_decimal IS ''Permite quantidade fracionária''';
  END IF;
END$$;

-- =====================================================
-- TRIGGERS PARA UPDATED_AT (idempotentes)
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
-- RLS (ROW LEVEL SECURITY) e POLÍTICAS (idempotentes)
-- =====================================================

ALTER TABLE ncm ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfop ENABLE ROW LEVEL SECURITY;
ALTER TABLE operacoes_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades_medida ENABLE ROW LEVEL SECURITY;

-- Policies NCM
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar NCM" ON ncm;
CREATE POLICY "Usuários autenticados podem visualizar NCM" ON ncm FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Usuários autenticados podem inserir NCM" ON ncm;
CREATE POLICY "Usuários autenticados podem inserir NCM" ON ncm FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar NCM" ON ncm;
CREATE POLICY "Usuários autenticados podem atualizar NCM" ON ncm FOR UPDATE USING (auth.role() = 'authenticated');

-- Policies CFOP
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar CFOP" ON cfop;
CREATE POLICY "Usuários autenticados podem visualizar CFOP" ON cfop FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Usuários autenticados podem inserir CFOP" ON cfop;
CREATE POLICY "Usuários autenticados podem inserir CFOP" ON cfop FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar CFOP" ON cfop;
CREATE POLICY "Usuários autenticados podem atualizar CFOP" ON cfop FOR UPDATE USING (auth.role() = 'authenticated');

-- Policies Operações Fiscais
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar Operações Fiscais" ON operacoes_fiscais;
CREATE POLICY "Usuários autenticados podem visualizar Operações Fiscais" ON operacoes_fiscais FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Usuários autenticados podem inserir Operações Fiscais" ON operacoes_fiscais;
CREATE POLICY "Usuários autenticados podem inserir Operações Fiscais" ON operacoes_fiscais FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar Operações Fiscais" ON operacoes_fiscais;
CREATE POLICY "Usuários autenticados podem atualizar Operações Fiscais" ON operacoes_fiscais FOR UPDATE USING (auth.role() = 'authenticated');

-- Policies Unidades de Medida
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar Unidades de Medida" ON unidades_medida;
CREATE POLICY "Usuários autenticados podem visualizar Unidades de Medida" ON unidades_medida FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Usuários autenticados podem inserir Unidades de Medida" ON unidades_medida;
CREATE POLICY "Usuários autenticados podem inserir Unidades de Medida" ON unidades_medida FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar Unidades de Medida" ON unidades_medida;
CREATE POLICY "Usuários autenticados podem atualizar Unidades de Medida" ON unidades_medida FOR UPDATE USING (auth.role() = 'authenticated');

-- =====================================================
-- DADOS INICIAIS - UNIDADES DE MEDIDA
-- Insere dinamicamente somente as colunas existentes
-- =====================================================
DO $$
DECLARE
  rows CONSTANT TEXT[][] := ARRAY[
    ARRAY['UN','Unidade','UN','f','0'],
    ARRAY['PC','Peça','PC','f','0'],
    ARRAY['PAR','Par','PAR','f','0'],
    ARRAY['CX','Caixa','CX','f','0'],
    ARRAY['DZ','Dúzia','DZ','f','0'],
    ARRAY['KG','Quilograma','KG','t','3'],
    ARRAY['G','Grama','G','t','3'],
    ARRAY['TON','Tonelada','TON','t','3'],
    ARRAY['L','Litro','L','t','3'],
    ARRAY['ML','Mililitro','ML','t','2'],
    ARRAY['M','Metro','M','t','2'],
    ARRAY['M2','Metro Quadrado','M2','t','2'],
    ARRAY['M3','Metro Cúbico','M3','t','3'],
    ARRAY['CM','Centímetro','CM','t','2'],
    ARRAY['MM','Milímetro','MM','t','2']
  ];
  has_sigla BOOLEAN := EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='unidades_medida' AND column_name='sigla');
  has_permite BOOLEAN := EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='unidades_medida' AND column_name='permite_decimal');
  has_casas BOOLEAN := EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='unidades_medida' AND column_name='casas_decimais');
    i INT;
    code TEXT;
    descricao_text TEXT;
    sig TEXT;
    permite TEXT;
    casas TEXT;
    sql TEXT;
BEGIN
  FOR i IN 1..array_length(rows,1) LOOP
    code := rows[i][1];
    descricao_text := rows[i][2];
    sig := rows[i][3];
    permite := rows[i][4];
    casas := rows[i][5];
    sql := 'INSERT INTO unidades_medida (codigo, descricao';
    IF has_sigla THEN sql := sql || ', sigla'; END IF;
    IF has_permite THEN sql := sql || ', permite_decimal'; END IF;
    IF has_casas THEN sql := sql || ', casas_decimais'; END IF;
    sql := sql || ') VALUES ('|| quote_literal(code) || ',' || quote_literal(descricao_text);
    IF has_sigla THEN sql := sql || ',' || quote_literal(sig); END IF;
    IF has_permite THEN sql := sql || ',' || (CASE WHEN permite='t' THEN 'true' WHEN permite='f' THEN 'false' ELSE quote_literal(permite) END); END IF;
    IF has_casas THEN sql := sql || ',' || casas; END IF;
    sql := sql || ') ON CONFLICT (codigo) DO NOTHING;';
    EXECUTE sql;
  END LOOP;
END$$;

-- =====================================================
-- DADOS INICIAIS - CFOPs MAIS COMUNS
-- =====================================================

INSERT INTO cfop (codigo, descricao, aplicacao, tipo_operacao, movimenta_estoque, movimenta_financeiro, calcula_icms, calcula_ipi, calcula_pis, calcula_cofins) VALUES
('5.101', 'Venda de produção do estabelecimento', 'Venda de produtos industrializados ou produzidos pelo estabelecimento', 'SAIDA', true, true, true, true, true, true),
('5.102', 'Venda de mercadoria adquirida ou recebida de terceiros', 'Venda de mercadorias adquiridas para revenda', 'SAIDA', true, true, true, true, true, true),
('5.949', 'Outra saída de mercadoria ou prestação de serviço não especificado', 'Outras saídas não classificadas', 'SAIDA', true, true, true, true, true, true),
('6.101', 'Venda de produção do estabelecimento', 'Venda de produtos industrializados para fora do estado', 'SAIDA', true, true, true, true, true, true),
('6.102', 'Venda de mercadoria adquirida ou recebida de terceiros', 'Venda de mercadorias para fora do estado', 'SAIDA', true, true, true, true, true, true),
('6.949', 'Outra saída de mercadoria ou prestação de serviço não especificado', 'Outras saídas interestaduais', 'SAIDA', true, true, true, true, true, true),
('1.101', 'Compra para industrialização ou produção rural', 'Compra de produtos para industrialização', 'ENTRADA', true, true, true, true, true, true),
('1.102', 'Compra para comercialização', 'Compra de mercadorias para revenda', 'ENTRADA', true, true, true, true, true, true),
('1.949', 'Outra entrada de mercadoria ou prestação de serviço não especificado', 'Outras entradas não classificadas', 'ENTRADA', true, true, true, true, true, true),
('2.101', 'Compra para industrialização ou produção rural', 'Compra interestadual para industrialização', 'ENTRADA', true, true, true, true, true, true),
('2.102', 'Compra para comercialização', 'Compra interestadual para revenda', 'ENTRADA', true, true, true, true, true, true),
('2.949', 'Outra entrada de mercadoria ou prestação de serviço não especificado', 'Outras entradas interestaduais', 'ENTRADA', true, true, true, true, true, true),
('5.201', 'Devolução de compra para industrialização ou produção rural', 'Devolução de mercadorias compradas', 'SAIDA', true, false, true, true, true, true),
('1.201', 'Devolução de venda de produção do estabelecimento', 'Devolução de vendas', 'ENTRADA', true, false, true, true, true, true)
ON CONFLICT (codigo) DO NOTHING;

-- End of migration
-- =====================================================
-- MIGRATION: CADASTROS FISCAIS AUXILIARES
-- Tabelas: NCM, CFOP, Operações Fiscais, Unidades de Medida
-- Data: 02/12/2025
-- =====================================================

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
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign Keys
    FOREIGN KEY (cfop_dentro_estado) REFERENCES cfop(codigo) ON DELETE SET NULL,
    FOREIGN KEY (cfop_fora_estado) REFERENCES cfop(codigo) ON DELETE SET NULL,
    FOREIGN KEY (cfop_exterior) REFERENCES cfop(codigo) ON DELETE SET NULL
);

-- Índices para Operações Fiscais
CREATE INDEX IF NOT EXISTS idx_operacoes_codigo ON operacoes_fiscais(codigo);
CREATE INDEX IF NOT EXISTS idx_operacoes_tipo ON operacoes_fiscais(tipo_operacao);
CREATE INDEX IF NOT EXISTS idx_operacoes_ativo ON operacoes_fiscais(ativo);
CREATE INDEX IF NOT EXISTS idx_operacoes_nome ON operacoes_fiscais USING gin(to_tsvector('portuguese', nome));

-- Comentários
COMMENT ON TABLE operacoes_fiscais IS 'Operações Fiscais - Regras de tributação por tipo de operação';


    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(6) NOT NULL UNIQUE,
    descricao VARCHAR(100) NOT NULL,
    sigla VARCHAR(6) NOT NULL UNIQUE,
    permite_decimal BOOLEAN DEFAULT false,
    casas_decimais INTEGER DEFAULT 0 CHECK (casas_decimais >= 0 AND casas_decimais <= 4),
    observacoes TEXT,
        DECLARE
            col_list TEXT := 'codigo, descricao';
            has_sigla BOOLEAN;
            has_permite BOOLEAN;
            has_casas BOOLEAN;
            rec RECORD;
            insert_sql TEXT;
            rows CONSTANT TEXT[][] := ARRAY[
                ARRAY['UN','Unidade','UN','f','0'],
                ARRAY['PC','Peça','PC','f','0'],
                ARRAY['PAR','Par','PAR','f','0'],
                ARRAY['CX','Caixa','CX','f','0'],
                ARRAY['DZ','Dúzia','DZ','f','0'],
                ARRAY['KG','Quilograma','KG','t','3'],
                ARRAY['G','Grama','G','t','3'],
                ARRAY['TON','Tonelada','TON','t','3'],
                ARRAY['L','Litro','L','t','3'],
                ARRAY['ML','Mililitro','ML','t','2'],
                ARRAY['M','Metro','M','t','2'],
                ARRAY['M2','Metro Quadrado','M2','t','2'],
                ARRAY['M3','Metro Cúbico','M3','t','3'],
                ARRAY['CM','Centímetro','CM','t','2'],
                ARRAY['MM','Milímetro','MM','t','2'
            ];
        BEGIN
            SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='unidades_medida' AND column_name='sigla') INTO has_sigla;
            SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='unidades_medida' AND column_name='permite_decimal') INTO has_permite;
            SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='unidades_medida' AND column_name='casas_decimais') INTO has_casas;

            IF has_sigla THEN
                col_list := col_list || ', sigla';
            END IF;
            IF has_permite THEN
                col_list := col_list || ', permite_decimal';
            END IF;
            IF has_casas THEN
                col_list := col_list || ', casas_decimais';
            END IF;

            FOR i IN 1..array_length(rows,1) LOOP
                rec := ROW(rows[i][1], rows[i][2], rows[i][3], rows[i][4], rows[i][5]);
                insert_sql := 'INSERT INTO unidades_medida (' || col_list || ') VALUES (';
                insert_sql := insert_sql || quote_literal(rec.f1) || ', ' || quote_literal(rec.f2);
                IF has_sigla THEN
                    insert_sql := insert_sql || ', ' || quote_literal(rec.f3);
                END IF;
                IF has_permite THEN
                    insert_sql := insert_sql || ', ' || CASE WHEN rec.f4 = 't' THEN 'true' WHEN rec.f4 = 'f' THEN 'false' ELSE quote_literal(rec.f4) END;
                END IF;
                IF has_casas THEN
                    insert_sql := insert_sql || ', ' || rec.f5;
                END IF;
                insert_sql := insert_sql || ') ON CONFLICT (codigo) DO NOTHING;';
                EXECUTE insert_sql;
            END LOOP;
        END$$;
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Ensure triggers are idempotent
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
-- Policies for NCM (make idempotent)
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

-- Policies for CFOP (make idempotent)
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

-- Policies for Operações Fiscais (make idempotent)
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

-- Policies for Unidades de Medida (make idempotent)
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

-- =====================================================
-- DADOS INICIAIS - UNIDADES DE MEDIDA COMUNS
-- =====================================================

-- Insert unidades_medida adapting to schema that may or may not have 'sigla' column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='unidades_medida' AND column_name='sigla'
    ) THEN
        -- Insert unidades_medida adapting to whatever columns exist in the target schema
        DO $$
        DECLARE
            col_list TEXT := 'codigo, descricao';
            has_sigla BOOLEAN;
            has_permite BOOLEAN;
            has_casas BOOLEAN;
            rec RECORD;
            insert_sql TEXT;
            rows CONSTANT TEXT[][] := ARRAY[
                ARRAY['UN','Unidade','UN','f','0'],
                ARRAY['PC','Peça','PC','f','0'],
                ARRAY['PAR','Par','PAR','f','0'],
                ARRAY['CX','Caixa','CX','f','0'],
                ARRAY['DZ','Dúzia','DZ','f','0'],
                ARRAY['KG','Quilograma','KG','t','3'],
                ARRAY['G','Grama','G','t','3'],
                ARRAY['TON','Tonelada','TON','t','3'],
                ARRAY['L','Litro','L','t','3'],
                ARRAY['ML','Mililitro','ML','t','2'],
                ARRAY['M','Metro','M','t','2'],
                ARRAY['M2','Metro Quadrado','M2','t','2'],
                ARRAY['M3','Metro Cúbico','M3','t','3'],
                ARRAY['CM','Centímetro','CM','t','2'],
                ARRAY['MM','Milímetro','MM','t','2']
            ];
        BEGIN
            SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='unidades_medida' AND column_name='sigla') INTO has_sigla;
            SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='unidades_medida' AND column_name='permite_decimal') INTO has_permite;
            SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='unidades_medida' AND column_name='casas_decimais') INTO has_casas;

            IF has_sigla THEN
                col_list := col_list || ', sigla';
            END IF;
            IF has_permite THEN
                col_list := col_list || ', permite_decimal';
            END IF;
            IF has_casas THEN
                col_list := col_list || ', casas_decimais';
            END IF;

            FOR i IN 1..array_length(rows,1) LOOP
                rec := ROW(rows[i][1], rows[i][2], rows[i][3], rows[i][4], rows[i][5]);
                insert_sql := 'INSERT INTO unidades_medida (' || col_list || ') VALUES (';
                insert_sql := insert_sql || quote_literal(rec.f1) || ', ' || quote_literal(rec.f2);
                IF has_sigla THEN
                    insert_sql := insert_sql || ', ' || quote_literal(rec.f3);
                END IF;
                IF has_permite THEN
                    insert_sql := insert_sql || ', ' || CASE WHEN rec.f4 = 't' THEN 'true' WHEN rec.f4 = 'f' THEN 'false' ELSE quote_literal(rec.f4) END;
                END IF;
                IF has_casas THEN
                    insert_sql := insert_sql || ', ' || rec.f5;
                END IF;
                insert_sql := insert_sql || ') ON CONFLICT (codigo) DO NOTHING;';
                EXECUTE insert_sql;
            END LOOP;
        END$$;
    ELSE
        INSERT INTO unidades_medida (codigo, descricao, permite_decimal, casas_decimais) VALUES
            ('UN', 'Unidade', false, 0),
            ('PC', 'Peça', false, 0),
            ('PAR', 'Par', false, 0),
            ('CX', 'Caixa', false, 0),
            ('DZ', 'Dúzia', false, 0),
            ('KG', 'Quilograma', true, 3),
            ('G', 'Grama', true, 3),
            ('TON', 'Tonelada', true, 3),
            ('L', 'Litro', true, 3),
            ('ML', 'Mililitro', true, 2),
            ('M', 'Metro', true, 2),
            ('M2', 'Metro Quadrado', true, 2),
            ('M3', 'Metro Cúbico', true, 3),
            ('CM', 'Centímetro', true, 2),
            ('MM', 'Milímetro', true, 2)
        ON CONFLICT (codigo) DO NOTHING;
    END IF;
END$$;

-- =====================================================
-- DADOS INICIAIS - CFOPs MAIS COMUNS
-- =====================================================

INSERT INTO cfop (codigo, descricao, aplicacao, tipo_operacao, movimenta_estoque, movimenta_financeiro, calcula_icms, calcula_ipi, calcula_pis, calcula_cofins) VALUES
-- Vendas Dentro do Estado
('5.101', 'Venda de produção do estabelecimento', 'Venda de produtos industrializados ou produzidos pelo estabelecimento', 'SAIDA', true, true, true, true, true, true),
('5.102', 'Venda de mercadoria adquirida ou recebida de terceiros', 'Venda de mercadorias adquiridas para revenda', 'SAIDA', true, true, true, true, true, true),
('5.949', 'Outra saída de mercadoria ou prestação de serviço não especificado', 'Outras saídas não classificadas', 'SAIDA', true, true, true, true, true, true),

-- Vendas Fora do Estado
('6.101', 'Venda de produção do estabelecimento', 'Venda de produtos industrializados para fora do estado', 'SAIDA', true, true, true, true, true, true),
('6.102', 'Venda de mercadoria adquirida ou recebida de terceiros', 'Venda de mercadorias para fora do estado', 'SAIDA', true, true, true, true, true, true),
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
