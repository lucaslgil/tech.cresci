-- =====================================================
-- CRIAÇÃO DA TABELA DE PRODUTOS
-- Compatível com NF-e, NFC-e, CF-e-SAT, SPED
-- Data: 01/12/2025
-- =====================================================

-- Criar tabela de produtos
CREATE TABLE IF NOT EXISTS public.produtos (
  -- Identificação
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_interno VARCHAR(100) UNIQUE NOT NULL,
  codigo_barras VARCHAR(14) UNIQUE, -- EAN-13 ou EAN-8
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  
  -- Classificação
  categoria VARCHAR(100),
  unidade_medida VARCHAR(10) DEFAULT 'UN', -- UN, CX, KG, LT, MT, etc.
  
  -- Dados Fiscais (NF-e / NFC-e / SAT)
  ncm VARCHAR(8) NOT NULL, -- Nomenclatura Comum do Mercosul (8 dígitos)
  cest VARCHAR(7), -- Código Especificador da Substituição Tributária
  cfop_entrada VARCHAR(4), -- CFOP padrão para entrada
  cfop_saida VARCHAR(4), -- CFOP padrão para saída
  origem_mercadoria INTEGER CHECK (origem_mercadoria BETWEEN 0 AND 8), -- 0-Nacional, 1-Estrangeira importação direta, etc.
  
  -- ICMS
  cst_icms VARCHAR(3), -- CST do ICMS (00, 10, 20, etc.)
  csosn_icms VARCHAR(4), -- CSOSN para Simples Nacional (101, 102, 103, etc.)
  aliquota_icms DECIMAL(5,2) DEFAULT 0.00, -- % ICMS
  reducao_bc_icms DECIMAL(5,2) DEFAULT 0.00, -- % Redução base de cálculo
  
  -- Substituição Tributária
  cst_icms_st VARCHAR(3), -- CST para ST
  mva_st DECIMAL(5,2) DEFAULT 0.00, -- Margem de Valor Agregado (%)
  aliquota_icms_st DECIMAL(5,2) DEFAULT 0.00, -- % ICMS ST
  reducao_bc_icms_st DECIMAL(5,2) DEFAULT 0.00, -- % Redução BC ST
  
  -- PIS
  cst_pis VARCHAR(2), -- CST do PIS (01, 02, etc.)
  aliquota_pis DECIMAL(5,2) DEFAULT 0.00, -- % PIS
  
  -- COFINS
  cst_cofins VARCHAR(2), -- CST do COFINS
  aliquota_cofins DECIMAL(5,2) DEFAULT 0.00, -- % COFINS
  
  -- IPI
  cst_ipi VARCHAR(2), -- CST do IPI
  aliquota_ipi DECIMAL(5,2) DEFAULT 0.00, -- % IPI
  enquadramento_ipi VARCHAR(3), -- Código de enquadramento legal do IPI
  
  -- Regime Tributário
  regime_tributario VARCHAR(20), -- 'SIMPLES', 'PRESUMIDO', 'REAL'
  
  -- Dados Comerciais
  preco_custo DECIMAL(15,2) DEFAULT 0.00,
  preco_venda DECIMAL(15,2) DEFAULT 0.00 CHECK (preco_venda >= 0),
  margem_lucro DECIMAL(5,2) DEFAULT 0.00, -- % margem sugerida
  permite_desconto BOOLEAN DEFAULT TRUE,
  desconto_maximo DECIMAL(5,2) DEFAULT 0.00, -- % desconto máximo
  
  -- Controle de Estoque
  estoque_atual DECIMAL(15,3) DEFAULT 0.000 CHECK (estoque_atual >= 0),
  estoque_minimo DECIMAL(15,3) DEFAULT 0.000,
  estoque_maximo DECIMAL(15,3) DEFAULT 0.000,
  localizacao VARCHAR(100), -- Localização física no estoque
  
  -- Controle de Lote/Série/Validade
  controla_lote BOOLEAN DEFAULT FALSE,
  controla_serie BOOLEAN DEFAULT FALSE,
  controla_validade BOOLEAN DEFAULT FALSE,
  dias_validade INTEGER, -- Dias de validade padrão
  
  -- Status e Controle
  ativo BOOLEAN DEFAULT TRUE,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_cadastro UUID REFERENCES auth.users(id),
  usuario_atualizacao UUID REFERENCES auth.users(id),
  
  -- Observações
  observacoes TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_produtos_codigo_interno ON public.produtos(codigo_interno);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON public.produtos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON public.produtos(nome);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_ncm ON public.produtos(ncm);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON public.produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_estoque_baixo ON public.produtos(estoque_atual, estoque_minimo) 
  WHERE estoque_atual < estoque_minimo;

-- =====================================================
-- TRIGGER PARA ATUALIZAR DATA DE MODIFICAÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION public.atualizar_timestamp_produtos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.data_atualizacao = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_timestamp_produtos
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_timestamp_produtos();

-- =====================================================
-- VIEW PARA PRODUTOS COM STATUS DE ESTOQUE
-- =====================================================

CREATE OR REPLACE VIEW public.vw_produtos_estoque AS
SELECT 
  p.*,
  CASE 
    WHEN p.estoque_atual <= 0 THEN 'SEM_ESTOQUE'
    WHEN p.estoque_atual < p.estoque_minimo THEN 'ESTOQUE_BAIXO'
    WHEN p.estoque_atual > p.estoque_maximo THEN 'ESTOQUE_ALTO'
    ELSE 'ESTOQUE_NORMAL'
  END AS status_estoque
FROM public.produtos p;

-- =====================================================
-- TABELA DE HISTÓRICO DE MOVIMENTAÇÕES DE ESTOQUE
-- (Preparação para futuro módulo de estoque)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.produtos_movimentacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  tipo_movimentacao VARCHAR(50) NOT NULL, -- ENTRADA, SAIDA, AJUSTE, INVENTARIO, DEVOLUCAO
  quantidade DECIMAL(15,3) NOT NULL,
  estoque_anterior DECIMAL(15,3) NOT NULL,
  estoque_atual DECIMAL(15,3) NOT NULL,
  
  -- Referência ao documento fiscal (futuro)
  documento_fiscal_id UUID,
  numero_documento VARCHAR(50),
  serie_documento VARCHAR(10),
  
  -- Dados adicionais
  lote VARCHAR(50),
  serie VARCHAR(50),
  data_validade DATE,
  
  -- Auditoria
  observacoes TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  data_movimentacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_produtos_movimentacoes_produto ON public.produtos_movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_produtos_movimentacoes_data ON public.produtos_movimentacoes(data_movimentacao);

-- =====================================================
-- TABELA DE PREÇOS HISTÓRICOS
-- (Rastreamento de alterações de preço)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.produtos_precos_historico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  preco_custo_anterior DECIMAL(15,2),
  preco_custo_novo DECIMAL(15,2),
  preco_venda_anterior DECIMAL(15,2),
  preco_venda_novo DECIMAL(15,2),
  motivo VARCHAR(255),
  usuario_id UUID REFERENCES auth.users(id),
  data_alteracao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_produtos_precos_historico_produto ON public.produtos_precos_historico(produto_id);

-- =====================================================
-- FUNCTION PARA REGISTRAR HISTÓRICO DE PREÇOS
-- =====================================================

CREATE OR REPLACE FUNCTION public.registrar_historico_precos()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.preco_custo IS DISTINCT FROM NEW.preco_custo) OR 
     (OLD.preco_venda IS DISTINCT FROM NEW.preco_venda) THEN
    
    INSERT INTO public.produtos_precos_historico (
      produto_id,
      preco_custo_anterior,
      preco_custo_novo,
      preco_venda_anterior,
      preco_venda_novo,
      usuario_id
    ) VALUES (
      NEW.id,
      OLD.preco_custo,
      NEW.preco_custo,
      OLD.preco_venda,
      NEW.preco_venda,
      NEW.usuario_atualizacao
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_registrar_historico_precos
  AFTER UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_historico_precos();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_precos_historico ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ver todos os produtos
CREATE POLICY "Usuários autenticados podem visualizar produtos"
  ON public.produtos
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Usuários autenticados podem inserir produtos
CREATE POLICY "Usuários autenticados podem inserir produtos"
  ON public.produtos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: Usuários autenticados podem atualizar produtos
CREATE POLICY "Usuários autenticados podem atualizar produtos"
  ON public.produtos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política: Apenas admins podem deletar produtos (ajustar conforme necessário)
CREATE POLICY "Usuários autenticados podem deletar produtos"
  ON public.produtos
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para movimentações
CREATE POLICY "Usuários autenticados podem visualizar movimentações"
  ON public.produtos_movimentacoes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir movimentações"
  ON public.produtos_movimentacoes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas para histórico de preços
CREATE POLICY "Usuários autenticados podem visualizar histórico de preços"
  ON public.produtos_precos_historico
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- COMENTÁRIOS NA TABELA
-- =====================================================

COMMENT ON TABLE public.produtos IS 'Cadastro de produtos compatível com legislação fiscal brasileira (NF-e, NFC-e, SAT, SPED)';
COMMENT ON COLUMN public.produtos.ncm IS 'Nomenclatura Comum do Mercosul - 8 dígitos obrigatórios';
COMMENT ON COLUMN public.produtos.cest IS 'Código Especificador da Substituição Tributária';
COMMENT ON COLUMN public.produtos.origem_mercadoria IS '0-Nacional, 1-Estrangeira importação direta, 2-Estrangeira adquirida no mercado interno, etc.';
COMMENT ON COLUMN public.produtos.cst_icms IS 'Código de Situação Tributária do ICMS';
COMMENT ON COLUMN public.produtos.csosn_icms IS 'Código de Situação da Operação no Simples Nacional';

-- =====================================================
-- DADOS INICIAIS (OPCIONAL - CATEGORIAS PADRÃO)
-- =====================================================

-- Você pode adicionar categorias padrão aqui se desejar
-- INSERT INTO public.produtos_categorias (nome) VALUES 
--   ('Eletrônicos'),
--   ('Informática'),
--   ('Móveis'),
--   ('Material de Escritório'),
--   ('Ferramentas');

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
