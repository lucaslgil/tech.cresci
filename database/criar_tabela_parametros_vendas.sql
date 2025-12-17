-- =====================================================
-- CRIAR TABELA: parametros_vendas
-- Armazena configurações e parâmetros de vendas
-- Data: 17/12/2025
-- =====================================================

-- Criar tabela de parâmetros de vendas
CREATE TABLE IF NOT EXISTS parametros_vendas (
  id BIGSERIAL PRIMARY KEY,
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  tipo VARCHAR(50) NOT NULL DEFAULT 'texto', -- texto, imagem, numero, booleano
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE parametros_vendas IS 'Configurações e parâmetros de vendas do sistema';
COMMENT ON COLUMN parametros_vendas.chave IS 'Identificador único do parâmetro';
COMMENT ON COLUMN parametros_vendas.valor IS 'Valor do parâmetro (pode ser texto, URL, JSON, etc)';
COMMENT ON COLUMN parametros_vendas.tipo IS 'Tipo do parâmetro: texto, imagem, numero, booleano';
COMMENT ON COLUMN parametros_vendas.descricao IS 'Descrição do parâmetro';

-- Índices
CREATE INDEX IF NOT EXISTS idx_parametros_vendas_chave ON parametros_vendas(chave);

-- RLS (Row Level Security)
ALTER TABLE parametros_vendas ENABLE ROW LEVEL SECURITY;

-- Policies: Todos usuários autenticados podem ler
CREATE POLICY "Todos podem visualizar parâmetros de vendas"
  ON parametros_vendas
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policies: Apenas administradores podem criar/atualizar/deletar
CREATE POLICY "Apenas admin pode inserir parâmetros de vendas"
  ON parametros_vendas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() 
      AND cargo = 'Admin'
    )
  );

CREATE POLICY "Apenas admin pode atualizar parâmetros de vendas"
  ON parametros_vendas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() 
      AND cargo = 'Admin'
    )
  );

CREATE POLICY "Apenas admin pode deletar parâmetros de vendas"
  ON parametros_vendas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() 
      AND cargo = 'Admin'
    )
  );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_parametros_vendas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trg_parametros_vendas_updated_at ON parametros_vendas;
CREATE TRIGGER trg_parametros_vendas_updated_at
  BEFORE UPDATE ON parametros_vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_parametros_vendas_updated_at();

-- Inserir parâmetro padrão para logotipo de impressão
INSERT INTO parametros_vendas (chave, valor, tipo, descricao)
VALUES (
  'logo_impressao_vendas',
  NULL,
  'imagem',
  'URL do logotipo exibido no cabeçalho da impressão de vendas'
)
ON CONFLICT (chave) DO NOTHING;

-- Inserir outros parâmetros úteis
INSERT INTO parametros_vendas (chave, valor, tipo, descricao)
VALUES 
  ('nome_empresa_impressao', 'CRESCI E PERDI FRANCHISING', 'texto', 'Nome da empresa exibido na impressão'),
  ('slogan_impressao', 'Sistema de Gestão', 'texto', 'Slogan/subtítulo exibido na impressão'),
  ('mostrar_logo_impressao', 'true', 'booleano', 'Exibir ou ocultar logotipo na impressão')
ON CONFLICT (chave) DO NOTHING;
