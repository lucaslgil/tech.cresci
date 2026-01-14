-- =====================================================
-- TABELA: REGRAS DE TRIBUTAÇÃO
-- Configuração automática de impostos por NCM/CFOP
-- Data: 02/12/2025
-- =====================================================

CREATE TABLE IF NOT EXISTS regras_tributacao (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  
  -- Identificação da Regra
  nome VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  
  -- Filtros de Aplicação
  ncm VARCHAR(8),
  cest VARCHAR(7),
  categoria VARCHAR(100),
  cfop_entrada VARCHAR(5),
  cfop_saida VARCHAR(5),
  origem_mercadoria VARCHAR(1),
  
  -- Configurações Operacionais
  operacao_fiscal VARCHAR(100),
  unidade_emissora VARCHAR(100),
  tipo_contribuinte VARCHAR(50),
  codigo_tributacao_municipio VARCHAR(20),
  item_lista_servico VARCHAR(10),
  
  -- ICMS Básico
  cst_icms VARCHAR(3),
  csosn_icms VARCHAR(5),
  aliquota_icms NUMERIC(5,2),
  reducao_bc_icms NUMERIC(5,2),
  incide_icms_ipi BOOLEAN DEFAULT false,
  mensagem_nf_icms TEXT,
  
  -- ICMS Operação Própria
  aliquota_icms_proprio NUMERIC(5,4),
  aliquota_fcp NUMERIC(5,4),
  modalidade_bc_icms VARCHAR(1),
  reducao_bc_icms_proprio NUMERIC(5,4),
  
  -- ICMS Substituição Tributária (ST)
  cst_icms_st VARCHAR(3),
  mva_st NUMERIC(7,4),
  aliquota_icms_st NUMERIC(5,4),
  aliquota_fcp_st NUMERIC(5,4),
  modalidade_bc_st VARCHAR(1),
  reducao_bc_st NUMERIC(5,4),
  fator_multiplicador_st NUMERIC(10,4),
  
  -- ICMS Diferimento
  aliquota_diferimento NUMERIC(5,2),
  
  -- ICMS DIFAL
  aliquota_interestadual NUMERIC(5,4),
  aliquota_uf_destino NUMERIC(5,4),
  aliquota_fcp_uf_destino NUMERIC(5,4),
  partilha_origem NUMERIC(5,2),
  partilha_destino NUMERIC(5,2),
  informar_difal_outras_despesas BOOLEAN DEFAULT false,
  utilizar_calculo_difal_dentro BOOLEAN DEFAULT false,
  
  -- ICMS Desoneração
  codigo_beneficio_fiscal VARCHAR(20),
  aliquota_desoneracao NUMERIC(5,4),
  motivo_desoneracao VARCHAR(2),
  
  -- PIS
  cst_pis VARCHAR(2),
  aliquota_pis NUMERIC(5,4),
  reducao_bc_pis NUMERIC(5,4),
  mensagem_nf_pis TEXT,
  icms_nao_incide_pis BOOLEAN DEFAULT false,
  
  -- COFINS
  cst_cofins VARCHAR(2),
  aliquota_cofins NUMERIC(5,4),
  reducao_bc_cofins NUMERIC(5,4),
  mensagem_nf_cofins TEXT,
  icms_nao_incide_cofins BOOLEAN DEFAULT false,
  
  -- IPI
  cst_ipi VARCHAR(2),
  aliquota_ipi NUMERIC(5,4),
  reducao_bc_ipi NUMERIC(5,4),
  mensagem_nf_ipi TEXT,
  enquadramento_ipi VARCHAR(3),
  
  -- CSLL
  aliquota_csll NUMERIC(5,4),
  mensagem_nf_csll TEXT,
  
  -- IR
  aliquota_ir NUMERIC(5,4),
  mensagem_nf_ir TEXT,
  
  -- INSS
  aliquota_inss NUMERIC(5,4),
  mensagem_nf_inss TEXT,
  
  -- Outras Retenções
  outras_retencoes TEXT,
  aliquota_outras_retencoes NUMERIC(5,4),
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_regras_tributacao_empresa ON regras_tributacao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_regras_tributacao_ncm ON regras_tributacao(ncm) WHERE ncm IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_regras_tributacao_categoria ON regras_tributacao(categoria) WHERE categoria IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_regras_tributacao_cfop_saida ON regras_tributacao(cfop_saida) WHERE cfop_saida IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_regras_tributacao_ativo ON regras_tributacao(ativo);

-- RLS Policies
ALTER TABLE regras_tributacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver regras de tributação"
  ON regras_tributacao FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem criar regras de tributação"
  ON regras_tributacao FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar regras de tributação"
  ON regras_tributacao FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar regras de tributação"
  ON regras_tributacao FOR DELETE
  USING (auth.role() = 'authenticated');

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_regras_tributacao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_regras_tributacao_updated_at
  BEFORE UPDATE ON regras_tributacao
  FOR EACH ROW
  EXECUTE FUNCTION update_regras_tributacao_updated_at();

-- Comentários
COMMENT ON TABLE regras_tributacao IS 'Regras de tributação automática por NCM, categoria ou CFOP';
COMMENT ON COLUMN regras_tributacao.ncm IS 'Código NCM (8 dígitos) para aplicação automática';
COMMENT ON COLUMN regras_tributacao.categoria IS 'Categoria de produto alternativa ao NCM';
COMMENT ON COLUMN regras_tributacao.cfop_saida IS 'CFOP de saída para aplicação da regra';
COMMENT ON COLUMN regras_tributacao.mva_st IS 'Margem de Valor Agregado para cálculo do ICMS ST';
COMMENT ON COLUMN regras_tributacao.partilha_origem IS 'Percentual da partilha DIFAL para UF origem';
COMMENT ON COLUMN regras_tributacao.partilha_destino IS 'Percentual da partilha DIFAL para UF destino';
