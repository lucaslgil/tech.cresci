-- =====================================================
-- MIGRATION: Recriar tabela produtos com estrutura completa
-- Data: 01/12/2025
-- =====================================================

-- Desabilitar RLS temporariamente
ALTER TABLE IF EXISTS public.produtos DISABLE ROW LEVEL SECURITY;

-- Dropar objetos dependentes
DROP VIEW IF EXISTS public.vw_produtos_estoque CASCADE;
DROP TRIGGER IF EXISTS trigger_registrar_historico_precos ON public.produtos;
DROP TRIGGER IF EXISTS trigger_atualizar_timestamp_produtos ON public.produtos;
DROP TABLE IF EXISTS public.produtos_precos_historico CASCADE;
DROP TABLE IF EXISTS public.produtos_movimentacoes CASCADE;
DROP TABLE IF EXISTS public.produtos CASCADE;
DROP FUNCTION IF EXISTS public.registrar_historico_precos() CASCADE;
DROP FUNCTION IF EXISTS public.atualizar_timestamp_produtos() CASCADE;

-- Criar tabela de produtos
CREATE TABLE IF NOT EXISTS public.produtos (
  -- Identificação
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_interno VARCHAR(100) UNIQUE NOT NULL,
  codigo_barras VARCHAR(14) UNIQUE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  
  -- Classificação
  categoria VARCHAR(100),
  unidade_medida VARCHAR(10) DEFAULT 'UN',
  
  -- Dados Fiscais (NF-e / NFC-e / SAT)
  ncm VARCHAR(8) NOT NULL,
  cest VARCHAR(7),
  cfop_entrada VARCHAR(4),
  cfop_saida VARCHAR(4),
  origem_mercadoria INTEGER CHECK (origem_mercadoria BETWEEN 0 AND 8),
  
  -- ICMS
  cst_icms VARCHAR(3),
  csosn_icms VARCHAR(4),
  aliquota_icms DECIMAL(5,2) DEFAULT 0.00,
  reducao_bc_icms DECIMAL(5,2) DEFAULT 0.00,
  
  -- Substituição Tributária
  cst_icms_st VARCHAR(3),
  mva_st DECIMAL(5,2) DEFAULT 0.00,
  aliquota_icms_st DECIMAL(5,2) DEFAULT 0.00,
  reducao_bc_icms_st DECIMAL(5,2) DEFAULT 0.00,
  
  -- PIS
  cst_pis VARCHAR(2),
  aliquota_pis DECIMAL(5,2) DEFAULT 0.00,
  
  -- COFINS
  cst_cofins VARCHAR(2),
  aliquota_cofins DECIMAL(5,2) DEFAULT 0.00,
  
  -- IPI
  cst_ipi VARCHAR(2),
  aliquota_ipi DECIMAL(5,2) DEFAULT 0.00,
  enquadramento_ipi VARCHAR(3),
  
  -- Regime Tributário
  regime_tributario VARCHAR(20),
  
  -- Dados Comerciais
  preco_custo DECIMAL(15,2) DEFAULT 0.00,
  preco_venda DECIMAL(15,2) DEFAULT 0.00 CHECK (preco_venda >= 0),
  margem_lucro DECIMAL(5,2) DEFAULT 0.00,
  permite_desconto BOOLEAN DEFAULT TRUE,
  desconto_maximo DECIMAL(5,2) DEFAULT 0.00,
  
  -- Controle de Estoque
  estoque_atual DECIMAL(15,3) DEFAULT 0.000 CHECK (estoque_atual >= 0),
  estoque_minimo DECIMAL(15,3) DEFAULT 0.000,
  estoque_maximo DECIMAL(15,3) DEFAULT 0.000,
  localizacao VARCHAR(100),
  
  -- Controle de Lote/Série/Validade
  controla_lote BOOLEAN DEFAULT FALSE,
  controla_serie BOOLEAN DEFAULT FALSE,
  controla_validade BOOLEAN DEFAULT FALSE,
  dias_validade INTEGER,
  
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_interno ON public.produtos(codigo_interno);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON public.produtos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON public.produtos(nome);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_ncm ON public.produtos(ncm);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON public.produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_estoque_baixo ON public.produtos(estoque_atual, estoque_minimo) 
  WHERE estoque_atual < estoque_minimo;

-- Trigger para atualizar timestamp
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

-- View de produtos com estoque
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

-- Tabela de movimentações
CREATE TABLE IF NOT EXISTS public.produtos_movimentacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  tipo_movimentacao VARCHAR(50) NOT NULL,
  quantidade DECIMAL(15,3) NOT NULL,
  estoque_anterior DECIMAL(15,3) NOT NULL,
  estoque_atual DECIMAL(15,3) NOT NULL,
  documento_fiscal_id UUID,
  numero_documento VARCHAR(50),
  serie_documento VARCHAR(10),
  lote VARCHAR(50),
  serie VARCHAR(50),
  data_validade DATE,
  observacoes TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  data_movimentacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_produtos_movimentacoes_produto ON public.produtos_movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_produtos_movimentacoes_data ON public.produtos_movimentacoes(data_movimentacao);

-- Tabela de histórico de preços
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

-- Function para registrar histórico de preços
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

-- RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_precos_historico ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar produtos" ON public.produtos;
CREATE POLICY "Usuários autenticados podem visualizar produtos"
  ON public.produtos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem inserir produtos" ON public.produtos;
CREATE POLICY "Usuários autenticados podem inserir produtos"
  ON public.produtos FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar produtos" ON public.produtos;
CREATE POLICY "Usuários autenticados podem atualizar produtos"
  ON public.produtos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem deletar produtos" ON public.produtos;
CREATE POLICY "Usuários autenticados podem deletar produtos"
  ON public.produtos FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar movimentações" ON public.produtos_movimentacoes;
CREATE POLICY "Usuários autenticados podem visualizar movimentações"
  ON public.produtos_movimentacoes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem inserir movimentações" ON public.produtos_movimentacoes;
CREATE POLICY "Usuários autenticados podem inserir movimentações"
  ON public.produtos_movimentacoes FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar histórico de preços" ON public.produtos_precos_historico;
CREATE POLICY "Usuários autenticados podem visualizar histórico de preços"
  ON public.produtos_precos_historico FOR SELECT TO authenticated USING (true);

-- Comentários
COMMENT ON TABLE public.produtos IS 'Cadastro de produtos compatível com legislação fiscal brasileira (NF-e, NFC-e, SAT, SPED)';
COMMENT ON COLUMN public.produtos.ncm IS 'Nomenclatura Comum do Mercosul - 8 dígitos obrigatórios';
COMMENT ON COLUMN public.produtos.cest IS 'Código Especificador da Substituição Tributária';
COMMENT ON COLUMN public.produtos.origem_mercadoria IS '0-Nacional, 1-Estrangeira importação direta, 2-Estrangeira adquirida no mercado interno, etc.';
