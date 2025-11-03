-- Tabela para histórico de vinculações de itens com colaboradores
-- Criada em: 2025-11-03
-- Mantém registro completo de todas as vinculações e desvinculações
-- NOTA: colaboradores usa BIGINT, itens usa UUID

CREATE TABLE IF NOT EXISTS historico_vinculacao_itens (
  id BIGSERIAL PRIMARY KEY,
  colaborador_id BIGINT NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES itens(id) ON DELETE CASCADE,
  acao VARCHAR(20) NOT NULL CHECK (acao IN ('vinculado', 'desvinculado')),
  data_acao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_acao VARCHAR(255), -- Email do usuário que fez a ação
  observacao TEXT, -- Campo opcional para observações
  
  -- Snapshot dos dados do item no momento da ação
  item_codigo VARCHAR(50),
  item_nome TEXT,
  item_modelo VARCHAR(255),
  item_categoria VARCHAR(100),
  item_numero_serie VARCHAR(255),
  item_valor DECIMAL(10, 2),
  
  -- Snapshot dos dados do colaborador no momento da ação
  colaborador_nome VARCHAR(255),
  colaborador_cpf_cnpj VARCHAR(20),
  colaborador_cargo VARCHAR(100),
  colaborador_setor VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_historico_vinculacao_colaborador 
  ON historico_vinculacao_itens(colaborador_id);

CREATE INDEX IF NOT EXISTS idx_historico_vinculacao_item 
  ON historico_vinculacao_itens(item_id);

CREATE INDEX IF NOT EXISTS idx_historico_vinculacao_data 
  ON historico_vinculacao_itens(data_acao DESC);

CREATE INDEX IF NOT EXISTS idx_historico_vinculacao_acao 
  ON historico_vinculacao_itens(acao);

-- Comentários para documentação
COMMENT ON TABLE historico_vinculacao_itens IS 
  'Mantém histórico completo de todas as vinculações e desvinculações de itens com colaboradores';

COMMENT ON COLUMN historico_vinculacao_itens.acao IS 
  'Tipo de ação realizada: vinculado ou desvinculado';

COMMENT ON COLUMN historico_vinculacao_itens.data_acao IS 
  'Data e hora em que a ação foi realizada';

COMMENT ON COLUMN historico_vinculacao_itens.usuario_acao IS 
  'Email do usuário que realizou a ação';

-- Habilitar Row Level Security (RLS)
ALTER TABLE historico_vinculacao_itens ENABLE ROW LEVEL SECURITY;

-- Política de leitura: todos usuários autenticados podem ler o histórico
CREATE POLICY "Usuários autenticados podem ler histórico"
  ON historico_vinculacao_itens
  FOR SELECT
  TO authenticated
  USING (true);

-- Política de inserção: todos usuários autenticados podem inserir no histórico
CREATE POLICY "Usuários autenticados podem inserir histórico"
  ON historico_vinculacao_itens
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Não permitir UPDATE ou DELETE (histórico é imutável)
-- Apenas para casos de correção, admin pode deletar
CREATE POLICY "Apenas leitura para histórico"
  ON historico_vinculacao_itens
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Apenas leitura para histórico delete"
  ON historico_vinculacao_itens
  FOR DELETE
  TO authenticated
  USING (false);
