-- =====================================================
-- MÓDULO DE CONTAS A RECEBER
-- Criação das tabelas e estruturas necessárias
-- Data: 08/12/2025
-- =====================================================

-- Tabela de Contas a Receber
CREATE TABLE IF NOT EXISTS contas_receber (
  id BIGSERIAL PRIMARY KEY,
  
  -- Vínculo com venda (opcional - pode ser lançamento manual)
  venda_id BIGINT REFERENCES vendas(id) ON DELETE SET NULL,
  numero_venda INTEGER,
  
  -- Informações do Cliente
  cliente_id BIGINT REFERENCES clientes(id) ON DELETE RESTRICT,
  cliente_nome TEXT NOT NULL,
  cliente_cpf_cnpj TEXT,
  
  -- Dados da Conta
  descricao TEXT NOT NULL,
  numero_documento TEXT,
  numero_parcela INTEGER DEFAULT 1,
  total_parcelas INTEGER DEFAULT 1,
  
  -- Valores
  valor_original DECIMAL(15,2) NOT NULL,
  valor_juros DECIMAL(15,2) DEFAULT 0,
  valor_desconto DECIMAL(15,2) DEFAULT 0,
  valor_total DECIMAL(15,2) NOT NULL,
  valor_pago DECIMAL(15,2) DEFAULT 0,
  valor_saldo DECIMAL(15,2) NOT NULL,
  
  -- Datas
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'PAGO', 'PARCIAL', 'VENCIDO', 'CANCELADO')),
  
  -- Forma de Pagamento
  forma_pagamento TEXT,
  
  -- Observações
  observacoes TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Tabela de Pagamentos (baixas)
CREATE TABLE IF NOT EXISTS pagamentos_receber (
  id BIGSERIAL PRIMARY KEY,
  conta_receber_id BIGINT REFERENCES contas_receber(id) ON DELETE CASCADE,
  
  -- Dados do Pagamento
  data_pagamento DATE NOT NULL,
  valor_pago DECIMAL(15,2) NOT NULL,
  forma_pagamento TEXT NOT NULL,
  
  -- Juros e Descontos aplicados
  valor_juros DECIMAL(15,2) DEFAULT 0,
  valor_desconto DECIMAL(15,2) DEFAULT 0,
  
  -- Observações
  observacoes TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contas_receber_venda ON contas_receber(venda_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_cliente ON contas_receber(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON contas_receber(status);
CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento ON contas_receber(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_pagamentos_conta ON pagamentos_receber(conta_receber_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_contas_receber_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contas_receber_timestamp
  BEFORE UPDATE ON contas_receber
  FOR EACH ROW
  EXECUTE FUNCTION update_contas_receber_timestamp();

-- Trigger para atualizar status e saldo após pagamento
CREATE OR REPLACE FUNCTION atualizar_conta_apos_pagamento()
RETURNS TRIGGER AS $$
DECLARE
  v_total_pago DECIMAL(15,2);
  v_valor_total DECIMAL(15,2);
  v_novo_status TEXT;
BEGIN
  -- Calcular total pago
  SELECT COALESCE(SUM(valor_pago), 0) 
  INTO v_total_pago
  FROM pagamentos_receber 
  WHERE conta_receber_id = NEW.conta_receber_id;
  
  -- Buscar valor total da conta
  SELECT valor_total 
  INTO v_valor_total
  FROM contas_receber 
  WHERE id = NEW.conta_receber_id;
  
  -- Determinar novo status
  IF v_total_pago >= v_valor_total THEN
    v_novo_status := 'PAGO';
  ELSIF v_total_pago > 0 THEN
    v_novo_status := 'PARCIAL';
  ELSE
    v_novo_status := 'ABERTO';
  END IF;
  
  -- Atualizar conta
  UPDATE contas_receber 
  SET 
    valor_pago = v_total_pago,
    valor_saldo = v_valor_total - v_total_pago,
    status = v_novo_status,
    data_pagamento = CASE 
      WHEN v_novo_status = 'PAGO' THEN NEW.data_pagamento 
      ELSE NULL 
    END
  WHERE id = NEW.conta_receber_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_conta_apos_pagamento
  AFTER INSERT ON pagamentos_receber
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_conta_apos_pagamento();

-- Trigger para marcar contas vencidas (executar diariamente)
CREATE OR REPLACE FUNCTION marcar_contas_vencidas()
RETURNS void AS $$
BEGIN
  UPDATE contas_receber
  SET status = 'VENCIDO'
  WHERE status IN ('ABERTO', 'PARCIAL')
    AND data_vencimento < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_receber ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ver suas contas
CREATE POLICY "Permitir visualização de contas a receber"
  ON contas_receber FOR SELECT
  USING (true);

-- Policy: Usuários autenticados podem inserir
CREATE POLICY "Permitir inserção de contas a receber"
  ON contas_receber FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Usuários autenticados podem atualizar
CREATE POLICY "Permitir atualização de contas a receber"
  ON contas_receber FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Policy: Todos podem ver pagamentos
CREATE POLICY "Permitir visualização de pagamentos"
  ON pagamentos_receber FOR SELECT
  USING (true);

-- Policy: Usuários autenticados podem inserir pagamentos
CREATE POLICY "Permitir inserção de pagamentos"
  ON pagamentos_receber FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Comentários
COMMENT ON TABLE contas_receber IS 'Tabela de contas a receber do sistema';
COMMENT ON TABLE pagamentos_receber IS 'Tabela de pagamentos/baixas das contas a receber';
