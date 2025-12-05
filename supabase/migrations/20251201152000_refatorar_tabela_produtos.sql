-- =====================================================
-- REFATORAÇÃO DA TABELA PRODUTOS
-- Remove campos fiscais redundantes e cria FK para cadastros auxiliares
-- Data: 01/12/2025
-- =====================================================

-- 1. ADICIONAR NOVAS COLUNAS DE REFERÊNCIA (FK)
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS ncm_id BIGINT REFERENCES ncm_cadastro(id);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS categoria_id BIGINT REFERENCES categorias_produtos(id);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS unidade_medida_id BIGINT REFERENCES unidades_medida(id);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS operacao_fiscal_id BIGINT REFERENCES operacoes_fiscais(id);

-- 2. CRIAR ÍNDICES PARA AS FK
CREATE INDEX IF NOT EXISTS idx_produtos_ncm ON produtos(ncm_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_unidade ON produtos(unidade_medida_id);
CREATE INDEX IF NOT EXISTS idx_produtos_operacao_fiscal ON produtos(operacao_fiscal_id);

-- 3. REMOVER COLUNAS REDUNDANTES (que agora vêm das tabelas auxiliares)
-- Campos que agora virão de operacoes_fiscais:
ALTER TABLE produtos DROP COLUMN IF EXISTS cfop_venda_dentro_estado CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS cfop_venda_fora_estado CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS cst_icms CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS csosn_icms CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS origem_mercadoria CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS modalidade_bc_icms CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS aliquota_icms CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS reducao_bc_icms CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS cst_pis CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS aliquota_pis CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS cst_cofins CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS aliquota_cofins CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS cst_ipi CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS aliquota_ipi CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS enquadramento_ipi CASCADE;

-- Campos de Substituição Tributária (virão de operacoes_fiscais):
ALTER TABLE produtos DROP COLUMN IF EXISTS calcula_st CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS cst_icms_st CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS modalidade_bc_st CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS mva_st CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS reducao_bc_st CASCADE;
ALTER TABLE produtos DROP COLUMN IF EXISTS aliquota_st CASCADE;

-- Campo NCM (vem de ncm_cadastro):
ALTER TABLE produtos DROP COLUMN IF EXISTS ncm CASCADE;

-- Campo CEST (será vinculado por NCM):
ALTER TABLE produtos DROP COLUMN IF EXISTS cest CASCADE;

-- Campo Categoria (vem de categorias_produtos):
ALTER TABLE produtos DROP COLUMN IF EXISTS categoria CASCADE;

-- Campo Unidade (vem de unidades_medida):
ALTER TABLE produtos DROP COLUMN IF EXISTS unidade CASCADE;

-- 4. MANTER CAMPOS ESSENCIAIS DO PRODUTO
-- Estes campos permanecem pois são específicos do produto:
-- - codigo_sku (código interno)
-- - codigo_barras_ean (EAN/GTIN do produto)
-- - descricao
-- - preco_venda
-- - preco_custo
-- - estoque_minimo
-- - estoque_maximo
-- - estoque_atual
-- - peso_liquido
-- - peso_bruto
-- - largura
-- - altura
-- - comprimento
-- - observacoes
-- - ativo
-- - regime_tributario (pode variar por empresa/filial)

-- 5. COMENTÁRIOS EXPLICATIVOS
COMMENT ON COLUMN produtos.ncm_id IS 'Referência ao cadastro de NCM (contém alíquotas de importação)';
COMMENT ON COLUMN produtos.categoria_id IS 'Referência à categoria (que pode ter operação fiscal padrão)';
COMMENT ON COLUMN produtos.unidade_medida_id IS 'Referência à unidade de medida padronizada';
COMMENT ON COLUMN produtos.operacao_fiscal_id IS 'Referência à operação fiscal (contém todas regras tributárias: CFOPs, CST, alíquotas)';

-- 6. VIEW PARA FACILITAR CONSULTAS (produtos com dados fiscais completos)
CREATE OR REPLACE VIEW vw_produtos_completo AS
SELECT 
    p.id,
    p.codigo_interno,
    p.codigo_barras,
    p.nome,
    p.descricao,
    p.preco_venda,
    p.preco_custo,
    p.estoque_atual,
    p.estoque_minimo,
    p.estoque_maximo,
    p.margem_lucro,
    p.observacoes,
    p.ativo,
    p.regime_tributario,
    
    -- Dados da Categoria
    c.codigo as categoria_codigo,
    c.nome as categoria_nome,
    
    -- Dados do NCM
    n.codigo as ncm_codigo,
    n.descricao as ncm_descricao,
    n.aliquota_nacional as ncm_aliquota_nacional,
    n.aliquota_importacao as ncm_aliquota_importacao,
    
    -- Dados da Unidade
    u.codigo as unidade_codigo,
    u.descricao as unidade_descricao,
    
    -- Dados da Operação Fiscal
    op.codigo as operacao_fiscal_codigo,
    op.nome as operacao_fiscal_nome,
    op.cfop_dentro_estado,
    op.cfop_fora_estado,
    op.cfop_exterior,
    op.cst_icms,
    op.csosn_icms,
    op.aliquota_icms,
    op.reducao_bc_icms,
    op.calcula_st,
    op.mva_st,
    op.aliquota_st,
    op.cst_pis,
    op.aliquota_pis,
    op.cst_cofins,
    op.aliquota_cofins,
    op.cst_ipi,
    op.aliquota_ipi,
    
    p.created_at,
    p.updated_at
FROM produtos p
LEFT JOIN categorias_produtos c ON p.categoria_id = c.id
LEFT JOIN ncm_cadastro n ON p.ncm_id = n.id
LEFT JOIN unidades_medida u ON p.unidade_medida_id = u.id
LEFT JOIN operacoes_fiscais op ON p.operacao_fiscal_id = op.id;

COMMENT ON VIEW vw_produtos_completo IS 'View com produtos e todos os dados fiscais expandidos das tabelas auxiliares';

-- 7. FUNÇÃO PARA OBTER CFOP CORRETO BASEADO NA UF
CREATE OR REPLACE FUNCTION get_cfop_produto(
    p_produto_id BIGINT,
    p_uf_destino VARCHAR(2)
) RETURNS VARCHAR(4) AS $$
DECLARE
    v_uf_origem VARCHAR(2);
    v_cfop VARCHAR(4);
BEGIN
    -- Buscar UF da empresa nos parâmetros fiscais
    SELECT uf INTO v_uf_origem FROM parametros_fiscais LIMIT 1;
    
    -- Buscar CFOP da operação fiscal do produto
    SELECT 
        CASE 
            WHEN p_uf_destino = v_uf_origem THEN op.cfop_dentro_estado
            WHEN p_uf_destino IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO') THEN op.cfop_fora_estado
            ELSE op.cfop_exterior
        END INTO v_cfop
    FROM produtos p
    INNER JOIN operacoes_fiscais op ON p.operacao_fiscal_id = op.id
    WHERE p.id = p_produto_id;
    
    RETURN v_cfop;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_cfop_produto IS 'Retorna o CFOP correto para um produto baseado na UF de destino';

-- 8. FUNÇÃO PARA CALCULAR IMPOSTOS DE UM PRODUTO
CREATE OR REPLACE FUNCTION calcular_impostos_produto(
    p_produto_id BIGINT,
    p_valor_unitario NUMERIC(10,3),
    p_quantidade NUMERIC(10,3),
    p_uf_destino VARCHAR(2)
) RETURNS TABLE (
    base_calculo_icms NUMERIC(10,2),
    valor_icms NUMERIC(10,2),
    base_calculo_st NUMERIC(10,2),
    valor_st NUMERIC(10,2),
    valor_pis NUMERIC(10,2),
    valor_cofins NUMERIC(10,2),
    valor_ipi NUMERIC(10,2),
    valor_total NUMERIC(10,2)
) AS $$
DECLARE
    v_operacao operacoes_fiscais%ROWTYPE;
    v_total_produto NUMERIC(10,2);
BEGIN
    v_total_produto := p_valor_unitario * p_quantidade;
    
    -- Buscar operação fiscal do produto
    SELECT op.* INTO v_operacao
    FROM produtos p
    INNER JOIN operacoes_fiscais op ON p.operacao_fiscal_id = op.id
    WHERE p.id = p_produto_id;
    
    -- Calcular ICMS
    base_calculo_icms := v_total_produto;
    IF v_operacao.reducao_bc_icms IS NOT NULL THEN
        base_calculo_icms := base_calculo_icms * (1 - v_operacao.reducao_bc_icms / 100);
    END IF;
    valor_icms := base_calculo_icms * (COALESCE(v_operacao.aliquota_icms, 0) / 100);
    
    -- Calcular ST
    IF v_operacao.calcula_st THEN
        base_calculo_st := v_total_produto * (1 + COALESCE(v_operacao.mva_st, 0) / 100);
        IF v_operacao.reducao_bc_st IS NOT NULL THEN
            base_calculo_st := base_calculo_st * (1 - v_operacao.reducao_bc_st / 100);
        END IF;
        valor_st := (base_calculo_st * COALESCE(v_operacao.aliquota_st, 0) / 100) - valor_icms;
    ELSE
        base_calculo_st := 0;
        valor_st := 0;
    END IF;
    
    -- Calcular PIS
    IF v_operacao.calcula_pis THEN
        valor_pis := v_total_produto * (COALESCE(v_operacao.aliquota_pis, 0) / 100);
    ELSE
        valor_pis := 0;
    END IF;
    
    -- Calcular COFINS
    IF v_operacao.calcula_cofins THEN
        valor_cofins := v_total_produto * (COALESCE(v_operacao.aliquota_cofins, 0) / 100);
    ELSE
        valor_cofins := 0;
    END IF;
    
    -- Calcular IPI
    IF v_operacao.calcula_ipi THEN
        valor_ipi := v_total_produto * (COALESCE(v_operacao.aliquota_ipi, 0) / 100);
    ELSE
        valor_ipi := 0;
    END IF;
    
    -- Total
    valor_total := v_total_produto + valor_st + valor_ipi;
    
    RETURN QUERY SELECT 
        base_calculo_icms, 
        valor_icms, 
        base_calculo_st, 
        valor_st, 
        valor_pis, 
        valor_cofins, 
        valor_ipi, 
        valor_total;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_impostos_produto IS 'Calcula todos os impostos de um produto baseado na operação fiscal configurada';
