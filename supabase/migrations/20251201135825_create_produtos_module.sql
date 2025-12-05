-- =====================================================
-- MÓDULO DE CADASTRO DE PRODUTOS - ERP FISCAL BRASIL
-- Data: 2025-12-01
-- Descrição: Sistema completo de cadastro de produtos
--            compatível com NF-e, NFC-e, SAT, SPED
--            Inclui: dados fiscais, tributários, estoque
-- =====================================================

-- =====================================================
-- 1. ENUMS E TIPOS CUSTOMIZADOS
-- =====================================================

-- Unidades de medida (compatível com NF-e)
CREATE TYPE unidade_medida AS ENUM (
  'UN', 'CX', 'PC', 'KG', 'G', 'L', 'ML', 'M', 'M2', 'M3',
  'TON', 'SC', 'FD', 'LT', 'KT', 'DZ', 'PR', 'RL', 'CONJ'
);

-- Origem da mercadoria (NF-e campo cProd)
CREATE TYPE origem_mercadoria AS ENUM (
  '0', -- 0 - Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8
  '1', -- 1 - Estrangeira - Importação direta, exceto a indicada no código 6
  '2', -- 2 - Estrangeira - Adquirida no mercado interno, exceto a indicada no código 7
  '3', -- 3 - Nacional, mercadoria ou bem com Conteúdo de Importação superior a 40% e inferior ou igual a 70%
  '4', -- 4 - Nacional, cuja produção tenha sido feita em conformidade com os processos produtivos básicos
  '5', -- 5 - Nacional, mercadoria ou bem com Conteúdo de Importação inferior ou igual a 40%
  '6', -- 6 - Estrangeira - Importação direta, sem similar nacional, constante em lista da CAMEX
  '7', -- 7 - Estrangeira - Adquirida no mercado interno, sem similar nacional, constante em lista da CAMEX
  '8'  -- 8 - Nacional, mercadoria ou bem com Conteúdo de Importação superior a 70%
);

-- Status do produto
CREATE TYPE status_produto AS ENUM ('ATIVO', 'INATIVO', 'DESCONTINUADO');

-- Tipo de produto (para classificação)
CREATE TYPE tipo_produto AS ENUM (
  'MERCADORIA',        -- Produto para revenda
  'MATERIA_PRIMA',     -- Matéria-prima
  'INSUMO',            -- Insumo
  'PRODUTO_ACABADO',   -- Produto acabado
  'SERVICO',           -- Serviço
  'ATIVO_IMOBILIZADO', -- Ativo imobilizado
  'CONSUMO'            -- Material de consumo
);

-- =====================================================
-- 2. TABELAS AUXILIARES
-- =====================================================

-- Categorias de produtos
CREATE TABLE IF NOT EXISTS categorias_produtos (
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  categoria_pai_id BIGINT REFERENCES categorias_produtos(id),
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE categorias_produtos IS 'Categorias para organização dos produtos';

-- NCM (Nomenclatura Comum do Mercosul) - Tabela de referência
CREATE TABLE IF NOT EXISTS ncm_tabela (
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(8) UNIQUE NOT NULL, -- 8 dígitos
  descricao TEXT NOT NULL,
  aliquota_ibpt_nacional DECIMAL(5,2) DEFAULT 0,
  aliquota_ibpt_estadual DECIMAL(5,2) DEFAULT 0,
  aliquota_ibpt_municipal DECIMAL(5,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ncm_tabela IS 'Tabela de NCM atualizada para consulta e validação';

-- CEST (Código Especificador da Substituição Tributária)
CREATE TABLE IF NOT EXISTS cest_tabela (
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(7) UNIQUE NOT NULL, -- 7 dígitos: SS.DDD.DD
  descricao TEXT NOT NULL,
  segmento VARCHAR(2) NOT NULL, -- Segmento (SS)
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE cest_tabela IS 'Código Especificador da Substituição Tributária';

-- =====================================================
-- 3. TABELA PRINCIPAL: PRODUTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS produtos (
  -- Identificação
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL, -- Código interno (gerado automaticamente)
  codigo_barras VARCHAR(14), -- EAN-13 ou EAN-8
  codigo_barras_tributavel VARCHAR(14), -- Para produtos com múltiplas embalagens
  
  -- Dados Gerais
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo tipo_produto DEFAULT 'MERCADORIA',
  categoria_id BIGINT REFERENCES categorias_produtos(id),
  unidade_medida unidade_medida DEFAULT 'UN',
  
  -- Dados Fiscais (NF-e / NFC-e / SAT)
  ncm VARCHAR(8) NOT NULL, -- Obrigatório (8 dígitos)
  ncm_id BIGINT REFERENCES ncm_tabela(id),
  cest VARCHAR(7), -- 7 dígitos (obrigatório para ST)
  cest_id BIGINT REFERENCES cest_tabela(id),
  
  cfop_venda_dentro_estado VARCHAR(4) DEFAULT '5102', -- CFOP venda dentro do estado
  cfop_venda_fora_estado VARCHAR(4) DEFAULT '6102',   -- CFOP venda fora do estado
  cfop_compra_dentro_estado VARCHAR(4) DEFAULT '1102',
  cfop_compra_fora_estado VARCHAR(4) DEFAULT '2102',
  
  origem_mercadoria origem_mercadoria NOT NULL DEFAULT '0',
  
  -- CST/CSOSN ICMS
  cst_icms VARCHAR(3), -- Para Lucro Presumido/Real (ex: 000, 010, 020...)
  csosn_icms VARCHAR(4), -- Para Simples Nacional (ex: 101, 102, 103...)
  
  -- Alíquotas ICMS
  aliquota_icms DECIMAL(5,2) DEFAULT 0, -- % ICMS
  reducao_base_icms DECIMAL(5,2) DEFAULT 0, -- % Redução base ICMS
  
  -- Substituição Tributária (ST)
  tem_st BOOLEAN DEFAULT false,
  mva_st DECIMAL(5,2) DEFAULT 0, -- Margem de Valor Agregado
  aliquota_icms_st DECIMAL(5,2) DEFAULT 0,
  reducao_base_icms_st DECIMAL(5,2) DEFAULT 0,
  base_calculo_st VARCHAR(20), -- Manual, Pauta, Sugerido
  
  -- PIS/COFINS
  cst_pis VARCHAR(2) DEFAULT '01', -- CST PIS (01 a 99)
  aliquota_pis DECIMAL(5,2) DEFAULT 0,
  cst_cofins VARCHAR(2) DEFAULT '01', -- CST COFINS
  aliquota_cofins DECIMAL(5,2) DEFAULT 0,
  
  -- IPI
  cst_ipi VARCHAR(2), -- CST IPI (00 a 99)
  aliquota_ipi DECIMAL(5,2) DEFAULT 0,
  codigo_enquadramento_ipi VARCHAR(5), -- Tabela IPI
  
  -- Outros impostos
  aliquota_issqn DECIMAL(5,2) DEFAULT 0, -- Para serviços
  codigo_servico_municipal VARCHAR(20), -- Código do serviço municipal
  
  -- IBPT (Tabela de impostos aproximados)
  aliquota_aproximada_tributos DECIMAL(5,2) DEFAULT 0,
  fonte_ibpt VARCHAR(50),
  
  -- Dados Comerciais
  preco_custo DECIMAL(15,2) DEFAULT 0,
  preco_venda DECIMAL(15,2) NOT NULL DEFAULT 0,
  margem_lucro DECIMAL(5,2) DEFAULT 0, -- Calculado automaticamente
  permite_desconto BOOLEAN DEFAULT true,
  desconto_maximo DECIMAL(5,2) DEFAULT 0,
  
  -- Comissão
  perc_comissao DECIMAL(5,2) DEFAULT 0,
  
  -- Dados de Estoque
  estoque_atual DECIMAL(15,3) DEFAULT 0,
  estoque_minimo DECIMAL(15,3) DEFAULT 0,
  estoque_maximo DECIMAL(15,3) DEFAULT 0,
  localizacao VARCHAR(100), -- Endereço no estoque
  
  controla_lote BOOLEAN DEFAULT false,
  controla_validade BOOLEAN DEFAULT false,
  dias_validade INTEGER, -- Dias de validade do produto
  
  -- Dimensões e peso (para frete)
  peso_bruto DECIMAL(10,3), -- KG
  peso_liquido DECIMAL(10,3), -- KG
  largura DECIMAL(10,2), -- CM
  altura DECIMAL(10,2), -- CM
  profundidade DECIMAL(10,2), -- CM
  
  -- Status e Observações
  status status_produto DEFAULT 'ATIVO',
  observacoes TEXT,
  observacoes_nfe TEXT, -- Informações adicionais para NF-e
  
  -- Imagens
  imagem_url TEXT,
  imagens JSONB, -- Array de URLs de imagens
  
  -- Fornecedor padrão
  fornecedor_id BIGINT, -- FK para clientes (tipo fornecedor)
  codigo_fornecedor VARCHAR(50), -- Código do produto no fornecedor
  
  -- Integração
  codigo_integracao VARCHAR(100), -- Para integrações externas
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by BIGINT,
  updated_by BIGINT,
  
  -- Constraints
  CONSTRAINT chk_preco_venda CHECK (preco_venda >= 0),
  CONSTRAINT chk_preco_custo CHECK (preco_custo >= 0),
  CONSTRAINT chk_estoque CHECK (estoque_atual >= 0),
  CONSTRAINT chk_ncm_length CHECK (LENGTH(ncm) = 8),
  CONSTRAINT chk_codigo_barras_unique UNIQUE NULLS NOT DISTINCT (codigo_barras)
);

COMMENT ON TABLE produtos IS 'Cadastro de produtos com dados fiscais completos para NF-e/NFC-e/SAT';

-- Índices para performance
CREATE INDEX idx_produtos_codigo ON produtos(codigo);
CREATE INDEX idx_produtos_codigo_barras ON produtos(codigo_barras) WHERE codigo_barras IS NOT NULL;
CREATE INDEX idx_produtos_nome ON produtos(nome);
CREATE INDEX idx_produtos_ncm ON produtos(ncm);
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_produtos_status ON produtos(status);
CREATE INDEX idx_produtos_estoque_baixo ON produtos(estoque_atual, estoque_minimo) WHERE estoque_atual < estoque_minimo;

-- =====================================================
-- 4. TABELAS RELACIONADAS
-- =====================================================

-- Lotes de produtos (para controle de rastreabilidade)
CREATE TABLE IF NOT EXISTS produtos_lotes (
  id BIGSERIAL PRIMARY KEY,
  produto_id BIGINT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  numero_lote VARCHAR(50) NOT NULL,
  data_fabricacao DATE,
  data_validade DATE,
  quantidade DECIMAL(15,3) DEFAULT 0,
  localizacao VARCHAR(100),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT uk_produto_lote UNIQUE(produto_id, numero_lote)
);

COMMENT ON TABLE produtos_lotes IS 'Controle de lotes para rastreabilidade';

-- Histórico de movimentações de estoque
CREATE TABLE IF NOT EXISTS produtos_estoque_historico (
  id BIGSERIAL PRIMARY KEY,
  produto_id BIGINT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  lote_id BIGINT REFERENCES produtos_lotes(id),
  tipo_movimento VARCHAR(20) NOT NULL, -- ENTRADA, SAIDA, AJUSTE, TRANSFERENCIA, INVENTARIO
  quantidade DECIMAL(15,3) NOT NULL,
  saldo_anterior DECIMAL(15,3) NOT NULL,
  saldo_novo DECIMAL(15,3) NOT NULL,
  preco_unitario DECIMAL(15,2),
  documento VARCHAR(50), -- Número do documento (NF, Pedido, etc)
  observacoes TEXT,
  usuario_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE produtos_estoque_historico IS 'Histórico de todas as movimentações de estoque';

CREATE INDEX idx_estoque_historico_produto ON produtos_estoque_historico(produto_id);
CREATE INDEX idx_estoque_historico_data ON produtos_estoque_historico(created_at);

-- Tabela de preços por cliente/grupo (para futuro)
CREATE TABLE IF NOT EXISTS produtos_precos_especiais (
  id BIGSERIAL PRIMARY KEY,
  produto_id BIGINT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  cliente_id BIGINT, -- FK para clientes
  tabela_preco_id BIGINT, -- FK para tabela de preços
  preco DECIMAL(15,2) NOT NULL,
  desconto_percentual DECIMAL(5,2) DEFAULT 0,
  data_inicio DATE,
  data_fim DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE produtos_precos_especiais IS 'Preços especiais por cliente ou tabela';

-- =====================================================
-- 5. TRIGGERS E FUNÇÕES
-- =====================================================

-- Função para gerar código automático
CREATE OR REPLACE FUNCTION gerar_codigo_produto()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := 'PROD-' || LPAD(NEXTVAL('produtos_id_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_produtos_codigo
  BEFORE INSERT ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION gerar_codigo_produto();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_produtos_updated_at
  BEFORE UPDATE ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trg_categorias_updated_at
  BEFORE UPDATE ON categorias_produtos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_updated_at();

-- Função para calcular margem de lucro
CREATE OR REPLACE FUNCTION calcular_margem_lucro()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.preco_custo > 0 THEN
    NEW.margem_lucro := ((NEW.preco_venda - NEW.preco_custo) / NEW.preco_custo) * 100;
  ELSE
    NEW.margem_lucro := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_produtos_margem
  BEFORE INSERT OR UPDATE OF preco_venda, preco_custo ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION calcular_margem_lucro();

-- =====================================================
-- 6. VIEWS ÚTEIS
-- =====================================================

-- View com dados completos do produto
CREATE OR REPLACE VIEW vw_produtos_completo AS
SELECT 
  p.*,
  c.nome as categoria_nome,
  c.codigo as categoria_codigo,
  -- Status de estoque
  CASE 
    WHEN p.estoque_atual <= 0 THEN 'SEM_ESTOQUE'
    WHEN p.estoque_atual <= p.estoque_minimo THEN 'ESTOQUE_BAIXO'
    WHEN p.estoque_atual >= p.estoque_maximo THEN 'ESTOQUE_ALTO'
    ELSE 'ESTOQUE_OK'
  END as status_estoque,
  -- Valor total em estoque
  (p.estoque_atual * p.preco_venda) as valor_estoque,
  (p.estoque_atual * p.preco_custo) as custo_estoque
FROM produtos p
LEFT JOIN categorias_produtos c ON c.id = p.categoria_id;

COMMENT ON VIEW vw_produtos_completo IS 'View com dados completos e calculados dos produtos';

-- =====================================================
-- 7. DADOS INICIAIS (SEEDS)
-- =====================================================

-- Categorias padrão
INSERT INTO categorias_produtos (codigo, nome, descricao, ativo) VALUES
  ('GERAL', 'Geral', 'Categoria geral para produtos sem classificação específica', true),
  ('ALIMENTOS', 'Alimentos e Bebidas', 'Produtos alimentícios', true),
  ('ELETRONICOS', 'Eletrônicos', 'Produtos eletrônicos e tecnologia', true),
  ('VESTUARIO', 'Vestuário', 'Roupas e acessórios', true),
  ('LIMPEZA', 'Limpeza', 'Produtos de limpeza e higiene', true)
ON CONFLICT (codigo) DO NOTHING;

-- NCMs mais comuns (exemplos - deve ser importada tabela completa)
INSERT INTO ncm_tabela (codigo, descricao, aliquota_ibpt_nacional, ativo) VALUES
  ('00000000', 'Não especificado', 0, true),
  ('84713012', 'Computador portátil', 18.50, true),
  ('85171231', 'Telefone celular', 20.30, true),
  ('62059000', 'Camisas, blusas e blusas-camiseiras de malha', 15.20, true)
ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- 8. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos_lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos_estoque_historico ENABLE ROW LEVEL SECURITY;

-- Políticas para produtos
CREATE POLICY "Produtos visíveis para usuários autenticados"
  ON produtos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir produtos"
  ON produtos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar produtos"
  ON produtos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar produtos"
  ON produtos FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para categorias
CREATE POLICY "Categorias visíveis para autenticados"
  ON categorias_produtos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para lotes
CREATE POLICY "Lotes visíveis para autenticados"
  ON produtos_lotes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para histórico
CREATE POLICY "Histórico visível para autenticados"
  ON produtos_estoque_historico FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Histórico pode ser inserido por autenticados"
  ON produtos_estoque_historico FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
