-- =====================================================
-- MIGRATION: CRIAR TABELAS DE VENDAS
-- Sistema completo de gestão de vendas
-- Data: 02/12/2025
-- =====================================================

-- =====================================================
-- 1. TABELA: vendas
-- Armazena cabeçalho das vendas/orçamentos/pedidos
-- =====================================================
CREATE TABLE IF NOT EXISTS vendas (
  id BIGSERIAL PRIMARY KEY,
  numero INTEGER NOT NULL,
  tipo_venda VARCHAR(20) NOT NULL CHECK (tipo_venda IN ('ORCAMENTO', 'PEDIDO', 'VENDA_DIRETA')),
  status VARCHAR(20) NOT NULL DEFAULT 'ORCAMENTO' CHECK (status IN ('ORCAMENTO', 'APROVADO', 'EM_SEPARACAO', 'FATURADO', 'ENTREGUE', 'CANCELADO')),
  
  -- Cliente (FK para clientes)
  cliente_id BIGINT REFERENCES clientes(id) ON DELETE RESTRICT,
  cliente_nome TEXT,
  cliente_cpf_cnpj VARCHAR(14),
  
  -- Datas
  data_venda DATE NOT NULL DEFAULT CURRENT_DATE,
  data_validade DATE,
  data_aprovacao TIMESTAMP,
  data_faturamento TIMESTAMP,
  data_entrega TIMESTAMP,
  
  -- Valores
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  desconto NUMERIC(15,2) DEFAULT 0,
  acrescimo NUMERIC(15,2) DEFAULT 0,
  frete NUMERIC(15,2) DEFAULT 0,
  outras_despesas NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  -- Pagamento
  forma_pagamento VARCHAR(20) NOT NULL CHECK (forma_pagamento IN ('DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO', 'TRANSFERENCIA', 'CHEQUE', 'CREDIARIO')),
  condicao_pagamento VARCHAR(20) NOT NULL DEFAULT 'A_VISTA' CHECK (condicao_pagamento IN ('A_VISTA', 'PARCELADO', 'A_PRAZO')),
  numero_parcelas INTEGER DEFAULT 1,
  
  -- Vendedor e comissão
  vendedor TEXT,
  comissao_percentual NUMERIC(5,2),
  comissao_valor NUMERIC(15,2),
  
  -- Observações
  observacoes TEXT,
  observacoes_internas TEXT,
  
  -- Vínculo com Nota Fiscal (se faturado)
  nota_fiscal_id BIGINT REFERENCES notas_fiscais(id) ON DELETE SET NULL,
  nota_fiscal_chave VARCHAR(44),
  
  -- Metadados
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  
  -- Índices
  CONSTRAINT vendas_numero_unique UNIQUE (numero)
);

CREATE INDEX idx_vendas_cliente ON vendas(cliente_id);
CREATE INDEX idx_vendas_status ON vendas(status);
CREATE INDEX idx_vendas_tipo ON vendas(tipo_venda);
CREATE INDEX idx_vendas_data ON vendas(data_venda);
CREATE INDEX idx_vendas_vendedor ON vendas(vendedor);
CREATE INDEX idx_vendas_nota_fiscal ON vendas(nota_fiscal_id);

-- =====================================================
-- 2. TABELA: vendas_itens
-- Itens/produtos de cada venda
-- =====================================================
CREATE TABLE IF NOT EXISTS vendas_itens (
  id BIGSERIAL PRIMARY KEY,
  venda_id BIGINT NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  numero_item INTEGER NOT NULL,
  
  -- Produto (FK para produtos - UUID)
  produto_id UUID REFERENCES produtos(id) ON DELETE RESTRICT,
  produto_codigo TEXT,
  produto_nome TEXT NOT NULL,
  
  -- Quantidades e valores
  quantidade NUMERIC(15,4) NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(15,2) NOT NULL,
  valor_total NUMERIC(15,2) NOT NULL,
  desconto_percentual NUMERIC(5,2) DEFAULT 0,
  desconto_valor NUMERIC(15,2) DEFAULT 0,
  acrescimo_percentual NUMERIC(5,2) DEFAULT 0,
  acrescimo_valor NUMERIC(15,2) DEFAULT 0,
  valor_final NUMERIC(15,2) NOT NULL,
  
  -- Observações
  observacoes TEXT,
  
  -- Metadados
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint
  CONSTRAINT vendas_itens_unique UNIQUE (venda_id, numero_item)
);

CREATE INDEX idx_vendas_itens_venda ON vendas_itens(venda_id);
CREATE INDEX idx_vendas_itens_produto ON vendas_itens(produto_id);

-- =====================================================
-- 3. TABELA: vendas_parcelas
-- Parcelas de pagamento (se parcelado)
-- =====================================================
CREATE TABLE IF NOT EXISTS vendas_parcelas (
  id BIGSERIAL PRIMARY KEY,
  venda_id BIGINT NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL,
  
  -- Valores
  valor NUMERIC(15,2) NOT NULL,
  valor_pago NUMERIC(15,2) DEFAULT 0,
  
  -- Datas
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO')),
  
  -- Forma de pagamento (pode ser diferente por parcela)
  forma_pagamento VARCHAR(20),
  
  -- Observações
  observacoes TEXT,
  
  -- Metadados
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint
  CONSTRAINT vendas_parcelas_unique UNIQUE (venda_id, numero_parcela)
);

CREATE INDEX idx_vendas_parcelas_venda ON vendas_parcelas(venda_id);
CREATE INDEX idx_vendas_parcelas_status ON vendas_parcelas(status);
CREATE INDEX idx_vendas_parcelas_vencimento ON vendas_parcelas(data_vencimento);

-- =====================================================
-- 4. TABELA: vendas_historico
-- Histórico de mudanças de status
-- =====================================================
CREATE TABLE IF NOT EXISTS vendas_historico (
  id BIGSERIAL PRIMARY KEY,
  venda_id BIGINT NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  
  -- Mudança
  status_anterior VARCHAR(20),
  status_novo VARCHAR(20) NOT NULL,
  
  -- Detalhes
  observacoes TEXT,
  usuario TEXT,
  
  -- Metadados
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vendas_historico_venda ON vendas_historico(venda_id);

-- =====================================================
-- 5. SEQUENCE: vendas_numero_seq
-- Controle de numeração sequencial
-- =====================================================
CREATE SEQUENCE IF NOT EXISTS vendas_numero_seq START WITH 1;

-- =====================================================
-- 6. FUNCTION: obter_proximo_numero_venda
-- Retorna próximo número de venda e incrementa
-- =====================================================
CREATE OR REPLACE FUNCTION obter_proximo_numero_venda()
RETURNS INTEGER AS $$
DECLARE
  proximo_numero INTEGER;
BEGIN
  proximo_numero := nextval('vendas_numero_seq');
  RETURN proximo_numero;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. VIEW: vw_vendas_resumo
-- View com dados resumidos das vendas
-- =====================================================
CREATE OR REPLACE VIEW vw_vendas_resumo AS
SELECT 
  v.id,
  v.numero,
  v.tipo_venda,
  v.status,
  v.data_venda,
  v.cliente_id,
  v.cliente_nome,
  v.cliente_cpf_cnpj,
  v.total,
  v.forma_pagamento,
  v.condicao_pagamento,
  v.numero_parcelas,
  v.vendedor,
  v.nota_fiscal_chave,
  COUNT(vi.id) as total_itens,
  SUM(vi.quantidade) as total_quantidade,
  COALESCE(
    (SELECT COUNT(*) FROM vendas_parcelas WHERE venda_id = v.id AND status = 'PENDENTE'),
    0
  ) as parcelas_pendentes,
  COALESCE(
    (SELECT COUNT(*) FROM vendas_parcelas WHERE venda_id = v.id AND status = 'PAGO'),
    0
  ) as parcelas_pagas,
  v.created_at,
  v.updated_at
FROM vendas v
LEFT JOIN vendas_itens vi ON vi.venda_id = v.id
GROUP BY v.id;

-- =====================================================
-- 8. TRIGGER: atualizar updated_at
-- Atualiza automaticamente updated_at
-- =====================================================
CREATE TRIGGER update_vendas_updated_at
  BEFORE UPDATE ON vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendas_itens_updated_at
  BEFORE UPDATE ON vendas_itens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendas_parcelas_updated_at
  BEFORE UPDATE ON vendas_parcelas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. TRIGGER: registrar_historico_status
-- Registra mudanças de status automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION registrar_historico_status_venda()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO vendas_historico (venda_id, status_anterior, status_novo, usuario)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendas_status_change
  AFTER UPDATE ON vendas
  FOR EACH ROW
  EXECUTE FUNCTION registrar_historico_status_venda();

-- =====================================================
-- 10. TRIGGER: atualizar_status_parcelas
-- Atualiza status das parcelas vencidas
-- =====================================================
CREATE OR REPLACE FUNCTION atualizar_status_parcelas_vencidas()
RETURNS void AS $$
BEGIN
  UPDATE vendas_parcelas
  SET status = 'VENCIDO'
  WHERE status = 'PENDENTE' 
    AND data_vencimento < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. RLS POLICIES
-- Habilitar Row Level Security
-- =====================================================
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas_parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas_historico ENABLE ROW LEVEL SECURITY;

-- Políticas para vendas
CREATE POLICY "Usuários autenticados podem ver vendas"
  ON vendas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir vendas"
  ON vendas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar vendas"
  ON vendas FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas admins podem deletar vendas"
  ON vendas FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para vendas_itens
CREATE POLICY "Usuários autenticados podem ver itens"
  ON vendas_itens FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir itens"
  ON vendas_itens FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar itens"
  ON vendas_itens FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas admins podem deletar itens"
  ON vendas_itens FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para vendas_parcelas
CREATE POLICY "Usuários autenticados podem ver parcelas"
  ON vendas_parcelas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir parcelas"
  ON vendas_parcelas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar parcelas"
  ON vendas_parcelas FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas admins podem deletar parcelas"
  ON vendas_parcelas FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para vendas_historico
CREATE POLICY "Usuários autenticados podem ver histórico"
  ON vendas_historico FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Sistema pode inserir histórico"
  ON vendas_historico FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 12. COMENTÁRIOS DAS TABELAS
-- Documentação inline do schema
-- =====================================================
COMMENT ON TABLE vendas IS 'Cabeçalho de vendas, orçamentos e pedidos';
COMMENT ON TABLE vendas_itens IS 'Itens/produtos de cada venda';
COMMENT ON TABLE vendas_parcelas IS 'Parcelas de pagamento das vendas';
COMMENT ON TABLE vendas_historico IS 'Histórico de mudanças de status';

COMMENT ON COLUMN vendas.numero IS 'Número sequencial único da venda';
COMMENT ON COLUMN vendas.tipo_venda IS 'Tipo: ORCAMENTO, PEDIDO ou VENDA_DIRETA';
COMMENT ON COLUMN vendas.status IS 'Status atual da venda';
COMMENT ON COLUMN vendas.comissao_percentual IS 'Percentual de comissão do vendedor';
COMMENT ON COLUMN vendas.nota_fiscal_id IS 'FK para notas_fiscais se foi faturado';

COMMENT ON COLUMN vendas_itens.numero_item IS 'Número sequencial do item na venda';
COMMENT ON COLUMN vendas_itens.valor_final IS 'Valor após descontos e acréscimos';

COMMENT ON COLUMN vendas_parcelas.numero_parcela IS 'Número sequencial da parcela (1, 2, 3...)';
COMMENT ON COLUMN vendas_parcelas.status IS 'PENDENTE, PAGO, VENCIDO ou CANCELADO';
