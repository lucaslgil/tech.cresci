-- =====================================================
-- CRIAÇÃO DAS TABELAS DE NOTAS FISCAIS (NF-e / NFC-e)
-- Sistema Fiscal Completo
-- Data: 01/12/2025
-- =====================================================

-- 1. TABELA DE NOTAS FISCAIS
CREATE TABLE IF NOT EXISTS notas_fiscais (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identificação
    tipo_nota VARCHAR(10) NOT NULL CHECK (tipo_nota IN ('NFE', 'NFCE')),
    numero INTEGER NOT NULL,
    serie INTEGER NOT NULL,
    chave_acesso VARCHAR(44) UNIQUE,
    
    -- Datas
    data_emissao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_saida TIMESTAMPTZ,
    
    -- Natureza da Operação
    natureza_operacao VARCHAR(255) NOT NULL,
    cfop_predominante VARCHAR(4) NOT NULL,
    
    -- Finalidade
    finalidade VARCHAR(1) NOT NULL CHECK (finalidade IN ('1', '2', '3', '4')),
    
    -- Destinatário
    cliente_id BIGINT,
    destinatario_tipo VARCHAR(20) CHECK (destinatario_tipo IN ('CLIENTE', 'FORNECEDOR', 'OUTRO')),
    destinatario_cpf_cnpj VARCHAR(14),
    destinatario_nome VARCHAR(255),
    destinatario_ie VARCHAR(20),
    destinatario_email VARCHAR(255),
    destinatario_telefone VARCHAR(20),
    
    -- Endereço
    destinatario_logradouro VARCHAR(255),
    destinatario_numero VARCHAR(20),
    destinatario_complemento VARCHAR(100),
    destinatario_bairro VARCHAR(100),
    destinatario_cidade VARCHAR(100),
    destinatario_uf VARCHAR(2),
    destinatario_cep VARCHAR(8),
    destinatario_codigo_municipio VARCHAR(7),
    
    -- Totais
    valor_produtos NUMERIC(15,2) DEFAULT 0.00,
    valor_frete NUMERIC(15,2) DEFAULT 0.00,
    valor_seguro NUMERIC(15,2) DEFAULT 0.00,
    valor_desconto NUMERIC(15,2) DEFAULT 0.00,
    valor_outras_despesas NUMERIC(15,2) DEFAULT 0.00,
    valor_total NUMERIC(15,2) NOT NULL,
    
    -- Impostos
    base_calculo_icms NUMERIC(15,2) DEFAULT 0.00,
    valor_icms NUMERIC(15,2) DEFAULT 0.00,
    base_calculo_icms_st NUMERIC(15,2) DEFAULT 0.00,
    valor_icms_st NUMERIC(15,2) DEFAULT 0.00,
    valor_ipi NUMERIC(15,2) DEFAULT 0.00,
    valor_pis NUMERIC(15,2) DEFAULT 0.00,
    valor_cofins NUMERIC(15,2) DEFAULT 0.00,
    valor_aproximado_tributos NUMERIC(15,2) DEFAULT 0.00,
    
    -- Transporte
    modalidade_frete VARCHAR(1) CHECK (modalidade_frete IN ('0', '1', '2', '3', '4', '9')),
    transportadora_cpf_cnpj VARCHAR(14),
    transportadora_nome VARCHAR(255),
    transportadora_ie VARCHAR(20),
    transportadora_endereco VARCHAR(255),
    transportadora_municipio VARCHAR(100),
    transportadora_uf VARCHAR(2),
    veiculo_placa VARCHAR(7),
    veiculo_uf VARCHAR(2),
    volume_quantidade INTEGER,
    volume_especie VARCHAR(100),
    volume_peso_bruto NUMERIC(15,3),
    volume_peso_liquido NUMERIC(15,3),
    
    -- Pagamento
    forma_pagamento VARCHAR(1) CHECK (forma_pagamento IN ('0', '1')),
    meio_pagamento VARCHAR(2),
    valor_pago NUMERIC(15,2),
    valor_troco NUMERIC(15,2),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'RASCUNHO' CHECK (status IN ('RASCUNHO', 'PROCESSANDO', 'AUTORIZADA', 'CANCELADA', 'DENEGADA', 'REJEITADA', 'INUTILIZADA')),
    status_sefaz VARCHAR(255),
    codigo_status_sefaz VARCHAR(10),
    motivo_status TEXT,
    
    -- XML e Protocolo
    xml_enviado TEXT,
    xml_autorizado TEXT,
    protocolo_autorizacao VARCHAR(50),
    data_autorizacao TIMESTAMPTZ,
    
    -- Cancelamento
    data_cancelamento TIMESTAMPTZ,
    protocolo_cancelamento VARCHAR(50),
    motivo_cancelamento TEXT,
    
    -- Contingência
    em_contingencia BOOLEAN DEFAULT false,
    tipo_contingencia VARCHAR(10),
    motivo_contingencia TEXT,
    
    -- Observações
    informacoes_complementares TEXT,
    informacoes_fisco TEXT,
    
    -- Controle
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT chk_numero_positivo CHECK (numero > 0),
    CONSTRAINT chk_serie_positiva CHECK (serie > 0),
    CONSTRAINT chk_valor_total_positivo CHECK (valor_total >= 0)
);

CREATE INDEX idx_notas_fiscais_chave ON notas_fiscais(chave_acesso);
CREATE INDEX idx_notas_fiscais_cliente ON notas_fiscais(cliente_id);
CREATE INDEX idx_notas_fiscais_status ON notas_fiscais(status);
CREATE INDEX idx_notas_fiscais_data_emissao ON notas_fiscais(data_emissao);
CREATE INDEX idx_notas_fiscais_tipo ON notas_fiscais(tipo_nota);
CREATE INDEX idx_notas_fiscais_numero_serie ON notas_fiscais(numero, serie, tipo_nota);

COMMENT ON TABLE notas_fiscais IS 'Notas Fiscais Eletrônicas (NF-e modelo 55 e NFC-e modelo 65)';

-- 2. TABELA DE ITENS DAS NOTAS FISCAIS
CREATE TABLE IF NOT EXISTS notas_fiscais_itens (
    id BIGSERIAL PRIMARY KEY,
    nota_fiscal_id BIGINT NOT NULL REFERENCES notas_fiscais(id) ON DELETE CASCADE,
    numero_item INTEGER NOT NULL,
    
    -- Produto
    produto_id BIGINT,
    codigo_produto VARCHAR(100) NOT NULL,
    codigo_barras VARCHAR(14),
    descricao VARCHAR(255) NOT NULL,
    ncm VARCHAR(8) NOT NULL,
    cest VARCHAR(7),
    cfop VARCHAR(4) NOT NULL,
    unidade_comercial VARCHAR(10) NOT NULL,
    
    -- Quantidades e Valores
    quantidade_comercial NUMERIC(15,4) NOT NULL,
    valor_unitario_comercial NUMERIC(15,4) NOT NULL,
    valor_bruto NUMERIC(15,2) NOT NULL,
    valor_desconto NUMERIC(15,2) DEFAULT 0.00,
    valor_frete NUMERIC(15,2) DEFAULT 0.00,
    valor_seguro NUMERIC(15,2) DEFAULT 0.00,
    valor_outras_despesas NUMERIC(15,2) DEFAULT 0.00,
    valor_total NUMERIC(15,2) NOT NULL,
    
    -- Unidade Tributável
    unidade_tributavel VARCHAR(10) NOT NULL,
    quantidade_tributavel NUMERIC(15,4) NOT NULL,
    valor_unitario_tributavel NUMERIC(15,4) NOT NULL,
    
    -- ICMS
    origem_mercadoria VARCHAR(1) NOT NULL,
    cst_icms VARCHAR(3),
    csosn_icms VARCHAR(4),
    modalidade_bc_icms VARCHAR(1),
    reducao_bc_icms NUMERIC(5,2) DEFAULT 0.00,
    base_calculo_icms NUMERIC(15,2) DEFAULT 0.00,
    aliquota_icms NUMERIC(5,2) DEFAULT 0.00,
    valor_icms NUMERIC(15,2) DEFAULT 0.00,
    
    -- ICMS ST
    modalidade_bc_icms_st VARCHAR(1),
    mva_st NUMERIC(5,2) DEFAULT 0.00,
    reducao_bc_icms_st NUMERIC(5,2) DEFAULT 0.00,
    base_calculo_icms_st NUMERIC(15,2) DEFAULT 0.00,
    aliquota_icms_st NUMERIC(5,2) DEFAULT 0.00,
    valor_icms_st NUMERIC(15,2) DEFAULT 0.00,
    
    -- ICMS Desoneração
    valor_icms_desoneracao NUMERIC(15,2) DEFAULT 0.00,
    motivo_desoneracao VARCHAR(2),
    
    -- PIS
    cst_pis VARCHAR(2),
    base_calculo_pis NUMERIC(15,2) DEFAULT 0.00,
    aliquota_pis NUMERIC(5,2) DEFAULT 0.00,
    valor_pis NUMERIC(15,2) DEFAULT 0.00,
    
    -- COFINS
    cst_cofins VARCHAR(2),
    base_calculo_cofins NUMERIC(15,2) DEFAULT 0.00,
    aliquota_cofins NUMERIC(5,2) DEFAULT 0.00,
    valor_cofins NUMERIC(15,2) DEFAULT 0.00,
    
    -- IPI
    cst_ipi VARCHAR(2),
    cnpj_produtor VARCHAR(14),
    codigo_selo VARCHAR(100),
    quantidade_selo INTEGER,
    enquadramento_ipi VARCHAR(3),
    base_calculo_ipi NUMERIC(15,2) DEFAULT 0.00,
    aliquota_ipi NUMERIC(5,2) DEFAULT 0.00,
    valor_ipi NUMERIC(15,2) DEFAULT 0.00,
    
    -- Informações Adicionais
    informacoes_adicionais TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT chk_item_quantidade_positiva CHECK (quantidade_comercial > 0),
    CONSTRAINT chk_item_valor_positivo CHECK (valor_total >= 0),
    UNIQUE(nota_fiscal_id, numero_item)
);

CREATE INDEX idx_nf_itens_nota ON notas_fiscais_itens(nota_fiscal_id);
CREATE INDEX idx_nf_itens_produto ON notas_fiscais_itens(produto_id);

COMMENT ON TABLE notas_fiscais_itens IS 'Itens das Notas Fiscais Eletrônicas com detalhamento tributário';

-- 3. TABELA DE EVENTOS DAS NOTAS FISCAIS
CREATE TABLE IF NOT EXISTS notas_fiscais_eventos (
    id BIGSERIAL PRIMARY KEY,
    nota_fiscal_id BIGINT NOT NULL REFERENCES notas_fiscais(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(20) NOT NULL CHECK (tipo_evento IN ('CANCELAMENTO', 'CARTA_CORRECAO', 'MANIFESTACAO', 'EPEC')),
    sequencia_evento INTEGER NOT NULL,
    chave_acesso VARCHAR(44) NOT NULL,
    data_evento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    descricao_evento TEXT NOT NULL,
    protocolo VARCHAR(50),
    xml_evento TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'REGISTRADO', 'REJEITADO')),
    codigo_status VARCHAR(10),
    motivo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(nota_fiscal_id, tipo_evento, sequencia_evento)
);

CREATE INDEX idx_nf_eventos_nota ON notas_fiscais_eventos(nota_fiscal_id);
CREATE INDEX idx_nf_eventos_tipo ON notas_fiscais_eventos(tipo_evento);
CREATE INDEX idx_nf_eventos_status ON notas_fiscais_eventos(status);

COMMENT ON TABLE notas_fiscais_eventos IS 'Eventos das NF-e: cancelamento, carta de correção, manifestação';

-- 4. TABELA DE NUMERAÇÃO DE NOTAS
CREATE TABLE IF NOT EXISTS notas_fiscais_numeracao (
    id BIGSERIAL PRIMARY KEY,
    tipo_nota VARCHAR(10) NOT NULL CHECK (tipo_nota IN ('NFE', 'NFCE')),
    serie INTEGER NOT NULL,
    ultimo_numero INTEGER NOT NULL DEFAULT 0,
    ambiente VARCHAR(15) NOT NULL CHECK (ambiente IN ('PRODUCAO', 'HOMOLOGACAO')),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tipo_nota, serie, ambiente)
);

COMMENT ON TABLE notas_fiscais_numeracao IS 'Controle de numeração sequencial das NF-e e NFC-e';

-- Inserir numeração padrão
INSERT INTO notas_fiscais_numeracao (tipo_nota, serie, ultimo_numero, ambiente) VALUES
('NFE', 1, 0, 'HOMOLOGACAO'),
('NFCE', 1, 0, 'HOMOLOGACAO'),
('NFE', 1, 0, 'PRODUCAO'),
('NFCE', 1, 0, 'PRODUCAO')
ON CONFLICT (tipo_nota, serie, ambiente) DO NOTHING;

-- 5. TABELA DE INUTILIZAÇÃO DE NUMERAÇÃO
CREATE TABLE IF NOT EXISTS notas_fiscais_inutilizacao (
    id BIGSERIAL PRIMARY KEY,
    tipo_nota VARCHAR(10) NOT NULL CHECK (tipo_nota IN ('NFE', 'NFCE')),
    serie INTEGER NOT NULL,
    numero_inicial INTEGER NOT NULL,
    numero_final INTEGER NOT NULL,
    justificativa TEXT NOT NULL,
    chave_acesso VARCHAR(44),
    protocolo VARCHAR(50),
    data_inutilizacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PROCESSADO', 'REJEITADO')),
    codigo_status VARCHAR(10),
    motivo TEXT,
    xml_retorno TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT chk_inut_numero_final_maior CHECK (numero_final >= numero_inicial)
);

CREATE INDEX idx_inutilizacao_tipo_serie ON notas_fiscais_inutilizacao(tipo_nota, serie);

COMMENT ON TABLE notas_fiscais_inutilizacao IS 'Registro de inutilização de numeração de NF-e/NFC-e';

-- 6. VIEW PARA CONSULTAS RESUMIDAS
CREATE OR REPLACE VIEW vw_notas_fiscais_resumo AS
SELECT 
    nf.id,
    nf.tipo_nota,
    nf.numero,
    nf.serie,
    nf.chave_acesso,
    nf.data_emissao,
    nf.destinatario_cpf_cnpj,
    nf.destinatario_nome,
    nf.valor_total,
    nf.status,
    nf.protocolo_autorizacao,
    COUNT(nfi.id) as quantidade_itens,
    SUM(nfi.quantidade_comercial) as quantidade_total_itens
FROM notas_fiscais nf
LEFT JOIN notas_fiscais_itens nfi ON nf.id = nfi.nota_fiscal_id
GROUP BY nf.id;

COMMENT ON VIEW vw_notas_fiscais_resumo IS 'View resumida das notas fiscais com totalizadores';

-- 7. FUNÇÃO PARA OBTER PRÓXIMO NÚMERO
CREATE OR REPLACE FUNCTION get_proximo_numero_nota(
    p_tipo_nota VARCHAR(10),
    p_serie INTEGER,
    p_ambiente VARCHAR(15)
) RETURNS INTEGER AS $$
DECLARE
    v_proximo_numero INTEGER;
BEGIN
    -- Incrementar e retornar próximo número
    UPDATE notas_fiscais_numeracao
    SET ultimo_numero = ultimo_numero + 1,
        updated_at = NOW()
    WHERE tipo_nota = p_tipo_nota
      AND serie = p_serie
      AND ambiente = p_ambiente
      AND ativo = true
    RETURNING ultimo_numero INTO v_proximo_numero;
    
    RETURN v_proximo_numero;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_proximo_numero_nota IS 'Obtém e incrementa o próximo número disponível para emissão';

-- 8. FUNÇÃO PARA GERAR CHAVE DE ACESSO
CREATE OR REPLACE FUNCTION gerar_chave_acesso_nfe(
    p_uf VARCHAR(2),
    p_data_emissao TIMESTAMPTZ,
    p_cnpj VARCHAR(14),
    p_modelo VARCHAR(2),
    p_serie INTEGER,
    p_numero INTEGER,
    p_tipo_emissao VARCHAR(1),
    p_codigo_numerico VARCHAR(8)
) RETURNS VARCHAR(44) AS $$
DECLARE
    v_chave VARCHAR(44);
    v_uf_codigo VARCHAR(2);
    v_ano_mes VARCHAR(4);
    v_digito_verificador INTEGER;
    v_chave_sem_dv VARCHAR(43);
    v_soma INTEGER := 0;
    v_multiplicador INTEGER := 2;
    v_i INTEGER;
BEGIN
    -- Código da UF (tabela do IBGE)
    v_uf_codigo := CASE p_uf
        WHEN 'AC' THEN '12' WHEN 'AL' THEN '27' WHEN 'AP' THEN '16' WHEN 'AM' THEN '13'
        WHEN 'BA' THEN '29' WHEN 'CE' THEN '23' WHEN 'DF' THEN '53' WHEN 'ES' THEN '32'
        WHEN 'GO' THEN '52' WHEN 'MA' THEN '21' WHEN 'MT' THEN '51' WHEN 'MS' THEN '50'
        WHEN 'MG' THEN '31' WHEN 'PA' THEN '15' WHEN 'PB' THEN '25' WHEN 'PR' THEN '41'
        WHEN 'PE' THEN '26' WHEN 'PI' THEN '22' WHEN 'RJ' THEN '33' WHEN 'RN' THEN '24'
        WHEN 'RS' THEN '43' WHEN 'RO' THEN '11' WHEN 'RR' THEN '14' WHEN 'SC' THEN '42'
        WHEN 'SP' THEN '35' WHEN 'SE' THEN '28' WHEN 'TO' THEN '17'
    END;
    
    -- AAMM
    v_ano_mes := TO_CHAR(p_data_emissao, 'YYMM');
    
    -- Montar chave sem DV
    v_chave_sem_dv := v_uf_codigo || v_ano_mes || LPAD(p_cnpj, 14, '0') || 
                      p_modelo || LPAD(p_serie::TEXT, 3, '0') || 
                      LPAD(p_numero::TEXT, 9, '0') || p_tipo_emissao || p_codigo_numerico;
    
    -- Calcular dígito verificador (módulo 11)
    FOR v_i IN 1..LENGTH(v_chave_sem_dv) LOOP
        v_soma := v_soma + (SUBSTRING(v_chave_sem_dv, v_i, 1)::INTEGER * v_multiplicador);
        v_multiplicador := v_multiplicador + 1;
        IF v_multiplicador > 9 THEN
            v_multiplicador := 2;
        END IF;
    END LOOP;
    
    v_digito_verificador := 11 - (v_soma % 11);
    IF v_digito_verificador >= 10 THEN
        v_digito_verificador := 0;
    END IF;
    
    v_chave := v_chave_sem_dv || v_digito_verificador::TEXT;
    
    RETURN v_chave;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION gerar_chave_acesso_nfe IS 'Gera chave de acesso de 44 dígitos para NF-e/NFC-e';

-- 9. POLÍTICAS RLS
ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_fiscais_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_fiscais_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_fiscais_numeracao ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_fiscais_inutilizacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura notas" ON notas_fiscais FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção notas" ON notas_fiscais FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização notas" ON notas_fiscais FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir leitura itens" ON notas_fiscais_itens FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção itens" ON notas_fiscais_itens FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização itens" ON notas_fiscais_itens FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir leitura eventos" ON notas_fiscais_eventos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção eventos" ON notas_fiscais_eventos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir leitura numeração" ON notas_fiscais_numeracao FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização numeração admin" ON notas_fiscais_numeracao FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Permitir leitura inutilização" ON notas_fiscais_inutilizacao FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção inutilização" ON notas_fiscais_inutilizacao FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 10. TRIGGERS
CREATE TRIGGER update_notas_fiscais_updated_at 
BEFORE UPDATE ON notas_fiscais 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notas_fiscais_itens_updated_at 
BEFORE UPDATE ON notas_fiscais_itens 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notas_fiscais_eventos_updated_at 
BEFORE UPDATE ON notas_fiscais_eventos 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notas_fiscais_numeracao_updated_at 
BEFORE UPDATE ON notas_fiscais_numeracao 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
