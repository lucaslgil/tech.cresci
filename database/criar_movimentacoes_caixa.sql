-- =====================================================
-- CRIAR TABELA DE MOVIMENTAÇÕES DE CAIXA
-- Sistema multi-tenant com RLS
-- Data: 11/02/2026
-- =====================================================

-- Tabela principal de movimentações de caixa
CREATE TABLE IF NOT EXISTS public.movimentacoes_caixa (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT NOT NULL,
  
  -- Dados da movimentação
  tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA', 'ABERTURA', 'FECHAMENTO')),
  valor DECIMAL(15,2) NOT NULL,
  data_movimentacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  descricao TEXT NOT NULL,
  
  -- Categoria (opcional)
  categoria TEXT,
  
  -- Vinculação (opcional)
  venda_id BIGINT,
  origem TEXT, -- 'PDV', 'RETAGUARDA', 'MANUAL'
  pdv_uuid TEXT, -- UUID da movimentação no PDV
  
  -- Controle de caixa
  caixa_aberto BOOLEAN DEFAULT TRUE,
  caixa_numero INTEGER, -- Número sequencial do caixa do dia
  
  -- Responsável
  usuario_id UUID NOT NULL,
  usuario_nome TEXT NOT NULL,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Foreign Keys
  CONSTRAINT fk_movimentacoes_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  CONSTRAINT fk_movimentacoes_venda FOREIGN KEY (venda_id) REFERENCES vendas(id),
  CONSTRAINT fk_movimentacoes_usuario FOREIGN KEY (usuario_id) REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_movimentacoes_caixa_empresa ON movimentacoes_caixa(empresa_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_caixa_tipo ON movimentacoes_caixa(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_caixa_data ON movimentacoes_caixa(data_movimentacao);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_caixa_usuario ON movimentacoes_caixa(usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_caixa_venda ON movimentacoes_caixa(venda_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_caixa_pdv_uuid ON movimentacoes_caixa(pdv_uuid);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_caixa_origem ON movimentacoes_caixa(origem);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_caixa_deleted ON movimentacoes_caixa(deleted_at) WHERE deleted_at IS NULL;

-- Comentários
COMMENT ON TABLE movimentacoes_caixa IS 'Movimentações de caixa (entradas, saídas, abertura e fechamento)';
COMMENT ON COLUMN movimentacoes_caixa.tipo IS 'ENTRADA, SAIDA, ABERTURA ou FECHAMENTO';
COMMENT ON COLUMN movimentacoes_caixa.origem IS 'Origem: PDV, RETAGUARDA ou MANUAL';
COMMENT ON COLUMN movimentacoes_caixa.pdv_uuid IS 'UUID do PDV para rastreabilidade';
COMMENT ON COLUMN movimentacoes_caixa.caixa_numero IS 'Número sequencial do caixa do dia';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE movimentacoes_caixa ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só veem movimentações da própria empresa
DROP POLICY IF EXISTS movimentacoes_caixa_tenant_isolation ON movimentacoes_caixa;
CREATE POLICY movimentacoes_caixa_tenant_isolation ON movimentacoes_caixa
  FOR ALL
  USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- Política: Apenas registros não deletados (SELECT apenas)
DROP POLICY IF EXISTS movimentacoes_caixa_not_deleted ON movimentacoes_caixa;
CREATE POLICY movimentacoes_caixa_not_deleted ON movimentacoes_caixa
  FOR SELECT
  USING (deleted_at IS NULL);

-- =====================================================
-- TRIGGER: UPDATED_AT
-- =====================================================

CREATE TRIGGER set_movimentacoes_caixa_updated_at
  BEFORE UPDATE ON movimentacoes_caixa
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PERMISSÕES
-- =====================================================

-- Permissões para usuários autenticados
GRANT SELECT, INSERT, UPDATE ON movimentacoes_caixa TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE movimentacoes_caixa_id_seq TO authenticated;

-- =====================================================
-- FUNÇÃO: ABRIR CAIXA
-- =====================================================

CREATE OR REPLACE FUNCTION abrir_caixa(
  p_empresa_id BIGINT,
  p_valor_inicial DECIMAL(15,2),
  p_usuario_nome TEXT
) RETURNS BIGINT AS $$
DECLARE
  v_movimentacao_id BIGINT;
  v_caixa_numero INTEGER;
BEGIN
  -- Verificar se já existe caixa aberto hoje
  IF EXISTS (
    SELECT 1 FROM movimentacoes_caixa 
    WHERE empresa_id = p_empresa_id 
      AND tipo = 'ABERTURA'
      AND DATE(data_movimentacao) = CURRENT_DATE
      AND caixa_aberto = TRUE
  ) THEN
    RAISE EXCEPTION 'Já existe um caixa aberto para hoje';
  END IF;

  -- Obter próximo número de caixa do dia
  SELECT COALESCE(MAX(caixa_numero), 0) + 1 
  INTO v_caixa_numero
  FROM movimentacoes_caixa
  WHERE empresa_id = p_empresa_id
    AND DATE(data_movimentacao) = CURRENT_DATE;

  -- Registrar abertura
  INSERT INTO movimentacoes_caixa (
    empresa_id, tipo, valor, descricao, categoria,
    origem, usuario_id, usuario_nome, caixa_aberto, caixa_numero
  ) VALUES (
    p_empresa_id, 'ABERTURA', p_valor_inicial, 'Abertura de Caixa', 'SISTEMA',
    'PDV', auth.uid(), p_usuario_nome, TRUE, v_caixa_numero
  ) RETURNING id INTO v_movimentacao_id;

  RETURN v_movimentacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO: FECHAR CAIXA
-- =====================================================

CREATE OR REPLACE FUNCTION fechar_caixa(
  p_empresa_id BIGINT,
  p_valor_final DECIMAL(15,2),
  p_usuario_nome TEXT,
  p_observacoes TEXT DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
  v_movimentacao_id BIGINT;
  v_caixa_numero INTEGER;
  v_valor_esperado DECIMAL(15,2);
  v_diferenca DECIMAL(15,2);
BEGIN
  -- Buscar caixa aberto
  SELECT caixa_numero INTO v_caixa_numero
  FROM movimentacoes_caixa
  WHERE empresa_id = p_empresa_id
    AND tipo = 'ABERTURA'
    AND DATE(data_movimentacao) = CURRENT_DATE
    AND caixa_aberto = TRUE
  LIMIT 1;

  IF v_caixa_numero IS NULL THEN
    RAISE EXCEPTION 'Não há caixa aberto para fechar';
  END IF;

  -- Calcular valor esperado
  SELECT 
    SUM(CASE 
      WHEN tipo IN ('ENTRADA', 'ABERTURA') THEN valor 
      WHEN tipo = 'SAIDA' THEN -valor 
      ELSE 0 
    END)
  INTO v_valor_esperado
  FROM movimentacoes_caixa
  WHERE empresa_id = p_empresa_id
    AND caixa_numero = v_caixa_numero
    AND DATE(data_movimentacao) = CURRENT_DATE;

  v_diferenca := p_valor_final - COALESCE(v_valor_esperado, 0);

  -- Registrar fechamento
  INSERT INTO movimentacoes_caixa (
    empresa_id, tipo, valor, descricao, categoria,
    origem, usuario_id, usuario_nome, caixa_aberto, caixa_numero
  ) VALUES (
    p_empresa_id, 'FECHAMENTO', p_valor_final, 
    'Fechamento de Caixa' || CASE WHEN p_observacoes IS NOT NULL THEN ' - ' || p_observacoes ELSE '' END,
    CASE 
      WHEN v_diferenca > 0 THEN 'SOBRA: R$ ' || v_diferenca::TEXT
      WHEN v_diferenca < 0 THEN 'FALTA: R$ ' || ABS(v_diferenca)::TEXT
      ELSE 'CONFERIDO'
    END,
    'PDV', auth.uid(), p_usuario_nome, FALSE, v_caixa_numero
  ) RETURNING id INTO v_movimentacao_id;

  -- Marcar caixa como fechado
  UPDATE movimentacoes_caixa
  SET caixa_aberto = FALSE
  WHERE empresa_id = p_empresa_id
    AND caixa_numero = v_caixa_numero
    AND DATE(data_movimentacao) = CURRENT_DATE;

  RETURN v_movimentacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO: STATUS DO CAIXA
-- =====================================================

CREATE OR REPLACE FUNCTION status_caixa(
  p_empresa_id BIGINT
) RETURNS TABLE(
  caixa_aberto BOOLEAN,
  caixa_numero INTEGER,
  valor_abertura DECIMAL(15,2),
  total_entradas DECIMAL(15,2),
  total_saidas DECIMAL(15,2),
  saldo_atual DECIMAL(15,2),
  data_abertura TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as caixa_aberto,
    mc.caixa_numero,
    mc.valor as valor_abertura,
    COALESCE(SUM(CASE WHEN mc2.tipo = 'ENTRADA' THEN mc2.valor ELSE 0 END), 0) as total_entradas,
    COALESCE(SUM(CASE WHEN mc2.tipo = 'SAIDA' THEN mc2.valor ELSE 0 END), 0) as total_saidas,
    mc.valor + 
      COALESCE(SUM(CASE WHEN mc2.tipo = 'ENTRADA' THEN mc2.valor ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN mc2.tipo = 'SAIDA' THEN mc2.valor ELSE 0 END), 0) as saldo_atual,
    mc.data_movimentacao as data_abertura
  FROM movimentacoes_caixa mc
  LEFT JOIN movimentacoes_caixa mc2 ON 
    mc2.empresa_id = mc.empresa_id AND
    mc2.caixa_numero = mc.caixa_numero AND
    mc2.tipo IN ('ENTRADA', 'SAIDA')
  WHERE mc.empresa_id = p_empresa_id
    AND mc.tipo = 'ABERTURA'
    AND DATE(mc.data_movimentacao) = CURRENT_DATE
    AND mc.caixa_aberto = TRUE
  GROUP BY mc.id, mc.caixa_numero, mc.valor, mc.data_movimentacao
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View: Resumo diário por empresa
CREATE OR REPLACE VIEW vw_caixa_resumo_diario AS
SELECT 
  empresa_id,
  DATE(data_movimentacao) as data,
  caixa_numero,
  SUM(CASE WHEN tipo = 'ABERTURA' THEN valor ELSE 0 END) as valor_abertura,
  SUM(CASE WHEN tipo = 'ENTRADA' THEN valor ELSE 0 END) as total_entradas,
  SUM(CASE WHEN tipo = 'SAIDA' THEN valor ELSE 0 END) as total_saidas,
  SUM(CASE WHEN tipo = 'FECHAMENTO' THEN valor ELSE 0 END) as valor_fechamento,
  MAX(CASE WHEN tipo = 'ABERTURA' THEN data_movimentacao END) as horario_abertura,
  MAX(CASE WHEN tipo = 'FECHAMENTO' THEN data_movimentacao END) as horario_fechamento,
  BOOL_OR(caixa_aberto) as caixa_esta_aberto
FROM movimentacoes_caixa
WHERE deleted_at IS NULL
GROUP BY empresa_id, DATE(data_movimentacao), caixa_numero;

COMMENT ON VIEW vw_caixa_resumo_diario IS 'Resumo diário das movimentações de caixa por empresa';

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

-- Inserir categorias padrão
-- INSERT INTO movimentacoes_caixa (empresa_id, tipo, valor, descricao, categoria, origem, usuario_id, usuario_nome)
-- SELECT 1, 'ENTRADA', 100.00, 'Venda #001', 'VENDA', 'PDV', auth.uid(), 'Sistema'
-- WHERE NOT EXISTS (SELECT 1 FROM movimentacoes_caixa LIMIT 1);

-- =====================================================
-- NOTAS DE IMPLEMENTAÇÃO
-- =====================================================

/*
TIPOS DE MOVIMENTAÇÃO:
- ABERTURA: Valor inicial ao abrir o caixa
- ENTRADA: Recebimentos (vendas, outros)
- SAIDA: Pagamentos, retiradas
- FECHAMENTO: Valor final ao fechar o caixa

FLUXO DE USO:
1. Abrir caixa (F1 no PDV ou manual na retaguarda)
2. Registrar entradas/saídas durante o dia
3. Fechar caixa (F1 no PDV ou manual na retaguarda)

INTEGRAÇÃO PDV:
- PDV envia movimentações com pdv_uuid único
- Campo origem = 'PDV' para rastreabilidade
- Sincronização automática via sync.ts

SEGURANÇA:
- RLS habilitado (multi-tenant)
- Apenas usuários da empresa veem suas movimentações
- Soft delete (deleted_at)

PERMISSÕES NECESSÁRIAS:
Adicionar em usuarios_permissoes:
- movimentacoes_caixa.visualizar
- movimentacoes_caixa.criar
- movimentacoes_caixa.editar
- movimentacoes_caixa.excluir
*/
