-- =====================================================
-- RPCs / Funções SQL para CRUD em Formas, Planos, Contas Bancárias e Parâmetros
-- e wrapper RPC para processar_financeiro_venda
-- Execute no Supabase SQL Editor
-- Data: 2026-02-13
-- =====================================================

-- 0) Ajuste índice de unicidade para suportar multi-empresa
DROP INDEX IF EXISTS idx_formas_pagamento_codigo_unique;
CREATE UNIQUE INDEX IF NOT EXISTS ux_formas_pagamento_empresa_codigo ON formas_pagamento(empresa_id, codigo);

-- 1) Formas de Pagamento: criar
CREATE OR REPLACE FUNCTION rpc_criar_forma(
  p_empresa_id BIGINT,
  p_codigo TEXT,
  p_nome TEXT,
  p_ativo BOOLEAN DEFAULT TRUE,
  p_parametros JSONB DEFAULT '{}'::jsonb
)
RETURNS SETOF formas_pagamento AS $$
BEGIN
  RETURN QUERY
  INSERT INTO formas_pagamento (empresa_id, codigo, nome, ativo, parametros)
  VALUES (p_empresa_id, p_codigo, p_nome, p_ativo, p_parametros)
  ON CONFLICT (empresa_id, codigo) DO UPDATE
    SET nome = EXCLUDED.nome, ativo = EXCLUDED.ativo, parametros = EXCLUDED.parametros, updated_at = NOW()
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2) Formas de Pagamento: listar por empresa
CREATE OR REPLACE FUNCTION rpc_listar_formas(p_empresa_id BIGINT)
RETURNS SETOF formas_pagamento AS $$
BEGIN
  RETURN QUERY SELECT * FROM formas_pagamento WHERE empresa_id = p_empresa_id OR empresa_id IS NULL ORDER BY codigo;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3) Formas de Pagamento: excluir
CREATE OR REPLACE FUNCTION rpc_deletar_forma(p_id BIGINT)
RETURNS VOID AS $$
BEGIN
  DELETE FROM formas_pagamento WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Planos de Parcelamento: CRUD (upsert)
CREATE OR REPLACE FUNCTION rpc_upsert_plano(
  p_empresa_id BIGINT,
  p_codigo TEXT,
  p_nome TEXT,
  p_numero_parcelas INTEGER,
  p_intervalo_meses INTEGER,
  p_taxa_juros NUMERIC,
  p_ativo BOOLEAN DEFAULT TRUE,
  p_parametros JSONB DEFAULT '{}'::jsonb
)
RETURNS SETOF planos_parcelamento AS $$
BEGIN
  RETURN QUERY
  INSERT INTO planos_parcelamento (empresa_id, codigo, nome, numero_parcelas, intervalo_meses, taxa_juros, ativo, parametros)
  VALUES (p_empresa_id, p_codigo, p_nome, p_numero_parcelas, p_intervalo_meses, p_taxa_juros, p_ativo, p_parametros)
  ON CONFLICT (empresa_id, codigo) DO UPDATE
    SET nome = EXCLUDED.nome, numero_parcelas = EXCLUDED.numero_parcelas, intervalo_meses = EXCLUDED.intervalo_meses,
        taxa_juros = EXCLUDED.taxa_juros, ativo = EXCLUDED.ativo, parametros = EXCLUDED.parametros, updated_at = NOW()
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rpc_listar_planos(p_empresa_id BIGINT)
RETURNS SETOF planos_parcelamento AS $$
BEGIN
  RETURN QUERY SELECT * FROM planos_parcelamento WHERE empresa_id = p_empresa_id OR empresa_id IS NULL ORDER BY codigo;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5) Contas Bancárias: CRUD
CREATE OR REPLACE FUNCTION rpc_upsert_conta_bancaria(
  p_empresa_id BIGINT,
  p_codigo TEXT,
  p_nome TEXT,
  p_banco_codigo TEXT,
  p_agencia TEXT,
  p_conta TEXT,
  p_tipo TEXT,
  p_ativo BOOLEAN DEFAULT TRUE,
  p_parametros JSONB DEFAULT '{}'::jsonb
)
RETURNS SETOF contas_bancarias AS $$
BEGIN
  RETURN QUERY
  INSERT INTO contas_bancarias (empresa_id, codigo, nome, banco_codigo, agencia, conta, tipo, ativo, parametros)
  VALUES (p_empresa_id, p_codigo, p_nome, p_banco_codigo, p_agencia, p_conta, p_tipo, p_ativo, p_parametros)
  ON CONFLICT DO UPDATE SET nome = EXCLUDED.nome, banco_codigo = EXCLUDED.banco_codigo, agencia = EXCLUDED.agencia,
    conta = EXCLUDED.conta, tipo = EXCLUDED.tipo, ativo = EXCLUDED.ativo, parametros = EXCLUDED.parametros, updated_at = NOW()
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rpc_listar_contas_bancarias(p_empresa_id BIGINT)
RETURNS SETOF contas_bancarias AS $$
BEGIN
  RETURN QUERY SELECT * FROM contas_bancarias WHERE empresa_id = p_empresa_id ORDER BY nome;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6) Parâmetros Financeiros: upsert por chave
CREATE OR REPLACE FUNCTION rpc_upsert_parametro(p_empresa_id BIGINT, p_chave TEXT, p_valor JSONB)
RETURNS SETOF parametros_financeiros AS $$
BEGIN
  RETURN QUERY
  INSERT INTO parametros_financeiros (empresa_id, chave, valor)
  VALUES (p_empresa_id, p_chave, p_valor)
  ON CONFLICT (empresa_id, chave) DO UPDATE
    SET valor = EXCLUDED.valor, updated_at = NOW()
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rpc_get_parametro(p_empresa_id BIGINT, p_chave TEXT)
RETURNS parametros_financeiros AS $$
BEGIN
  RETURN (SELECT * FROM parametros_financeiros WHERE empresa_id = p_empresa_id AND chave = p_chave LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- 7) Wrapper RPC para processar_financeiro_venda
CREATE OR REPLACE FUNCTION rpc_processar_financeiro_venda(p_venda_id BIGINT)
RETURNS SETOF BIGINT AS $$
BEGIN
  RETURN QUERY SELECT * FROM processar_financeiro_venda(p_venda_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
