-- =====================================================
-- CRIAÇÃO: Planos de Parcelamento, Contas Bancárias, Parâmetros Financeiros
-- e função de processamento financeiro de venda
-- Execute no Supabase SQL Editor
-- Data: 2026-02-13
-- =====================================================

-- 1) Planos de Parcelamento
CREATE TABLE IF NOT EXISTS planos_parcelamento (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT REFERENCES empresas(id) ON DELETE RESTRICT,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  numero_parcelas INTEGER NOT NULL DEFAULT 1,
  intervalo_meses INTEGER NOT NULL DEFAULT 1,
  taxa_juros DECIMAL(8,4) DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  parametros JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_planos_parcelamento_empresa_codigo ON planos_parcelamento(empresa_id, codigo);
CREATE INDEX IF NOT EXISTS idx_planos_parcelamento_empresa ON planos_parcelamento(empresa_id);

-- 2) Contas Bancárias
CREATE TABLE IF NOT EXISTS contas_bancarias (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT REFERENCES empresas(id) ON DELETE RESTRICT,
  codigo TEXT,
  nome TEXT NOT NULL,
  banco_codigo TEXT,
  agencia TEXT,
  conta TEXT,
  tipo TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  parametros JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contas_bancarias_empresa ON contas_bancarias(empresa_id);

-- 3) Parâmetros Financeiros (chave-valor por empresa)
CREATE TABLE IF NOT EXISTS parametros_financeiros (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT REFERENCES empresas(id) ON DELETE RESTRICT,
  chave TEXT NOT NULL,
  valor JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_parametros_financeiros_empresa_chave ON parametros_financeiros(empresa_id, chave);

-- 4) Função: processar_financeiro_venda(venda_id)
-- Esta função cria registros em contas_receber a partir de uma venda existente.
-- NOTA: Execute manualmente quando quiser que o backend gere as contas (por exemplo, após confirmar venda).

CREATE OR REPLACE FUNCTION processar_financeiro_venda(p_venda_id BIGINT)
RETURNS TABLE(conta_id BIGINT) AS $$
DECLARE
  v_venda RECORD;
  v_valor_total NUMERIC;
  v_num_parcelas INTEGER;
  v_intervalo INTEGER;
  v_taxa NUMERIC;
  v_data DATE;
  v_cliente RECORD;
  v_plano RECORD;
  i INTEGER;
  v_parcela_valor NUMERIC;
BEGIN
  SELECT * INTO v_venda FROM vendas WHERE id = p_venda_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venda % não encontrada', p_venda_id;
  END IF;

  -- Obter cliente
  SELECT id, nome INTO v_cliente FROM clientes WHERE id = v_venda.cliente_id;

  -- Decidir plano de parcelamento: busca por codigo em v_venda.plano_parcelamento (campo opcional)
  IF v_venda.plano_parcelamento IS NOT NULL THEN
    SELECT * INTO v_plano FROM planos_parcelamento WHERE codigo = v_venda.plano_parcelamento AND (empresa_id = v_venda.empresa_id OR empresa_id IS NULL) LIMIT 1;
  END IF;

  IF v_plano IS NULL THEN
    v_num_parcelas := COALESCE(v_venda.numero_parcelas, 1);
    v_intervalo := 1;
    v_taxa := 0;
  ELSE
    v_num_parcelas := v_plano.numero_parcelas;
    v_intervalo := v_plano.intervalo_meses;
    v_taxa := v_plano.taxa_juros;
  END IF;

  v_valor_total := COALESCE(v_venda.valor_total, 0);
  v_data := COALESCE(v_venda.data_venda::date, CURRENT_DATE);

  IF v_num_parcelas <= 1 THEN
    -- Cria uma conta única
    INSERT INTO contas_receber (
      venda_id, numero_venda, cliente_id, cliente_nome, descricao, numero_documento,
      numero_parcela, total_parcelas, valor_original, valor_juros, valor_desconto, valor_total,
      valor_pago, valor_saldo, data_emissao, data_vencimento, status, forma_pagamento, observacoes, created_at
    ) VALUES (
      v_venda.id, v_venda.numero, v_cliente.id, v_cliente.nome,
      COALESCE(v_venda.descricao, 'Pagamento Venda ' || v_venda.numero), v_venda.numero_documento,
      1, 1, v_valor_total, 0, 0, v_valor_total,
      0, v_valor_total, CURRENT_DATE, v_data, 'ABERTO', v_venda.forma_pagamento, NULL, NOW()
    ) RETURNING id INTO conta_id;
    RETURN NEXT;
  ELSE
    -- Parcelado: divide e cria parcelas
    v_parcela_valor := ROUND(v_valor_total::numeric / v_num_parcelas::numeric, 2);
    FOR i IN 1..v_num_parcelas LOOP
      INSERT INTO contas_receber (
        venda_id, numero_venda, cliente_id, cliente_nome, descricao, numero_documento,
        numero_parcela, total_parcelas, valor_original, valor_juros, valor_desconto, valor_total,
        valor_pago, valor_saldo, data_emissao, data_vencimento, status, forma_pagamento, observacoes, created_at
      ) VALUES (
        v_venda.id, v_venda.numero, v_cliente.id, v_cliente.nome,
        COALESCE(v_venda.descricao, 'Parcela venda ' || v_venda.numero), v_venda.numero_documento,
        i, v_num_parcelas, v_parcela_valor, 0, 0, v_parcela_valor,
        0, v_parcela_valor, CURRENT_DATE, (v_data + (i-1) * (INTERVAL '1 month' * v_intervalo))::date, 'ABERTO', v_venda.forma_pagamento, NULL, NOW()
      ) RETURNING id INTO conta_id;
      RETURN NEXT;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Observações:
-- - Esta função é um ponto de partida. Ajuste regras de juros, arredondamento e vinculação a contas bancárias conforme necessidade.
-- - Recomenda-se executar a função dentro de uma transação quando for chamada por endpoints.
