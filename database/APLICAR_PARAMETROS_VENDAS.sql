-- =====================================================
-- SCRIPT COMPLETO: Configurar Parâmetros de Vendas
-- Executa todas as configurações necessárias
-- Data: 17/12/2025
-- =====================================================

-- PASSO 1: Criar tabela de parâmetros de vendas
CREATE TABLE IF NOT EXISTS parametros_vendas (
  id BIGSERIAL PRIMARY KEY,
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  tipo VARCHAR(50) NOT NULL DEFAULT 'texto',
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE parametros_vendas IS 'Configurações e parâmetros de vendas do sistema';

-- Índices
CREATE INDEX IF NOT EXISTS idx_parametros_vendas_chave ON parametros_vendas(chave);

-- RLS
ALTER TABLE parametros_vendas ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Todos podem visualizar parâmetros de vendas" ON parametros_vendas;
CREATE POLICY "Todos podem visualizar parâmetros de vendas"
  ON parametros_vendas FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Apenas admin pode inserir parâmetros de vendas" ON parametros_vendas;
CREATE POLICY "Apenas admin pode inserir parâmetros de vendas"
  ON parametros_vendas FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND cargo = 'Admin')
  );

DROP POLICY IF EXISTS "Apenas admin pode atualizar parâmetros de vendas" ON parametros_vendas;
CREATE POLICY "Apenas admin pode atualizar parâmetros de vendas"
  ON parametros_vendas FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND cargo = 'Admin')
  );

DROP POLICY IF EXISTS "Apenas admin pode deletar parâmetros de vendas" ON parametros_vendas;
CREATE POLICY "Apenas admin pode deletar parâmetros de vendas"
  ON parametros_vendas FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND cargo = 'Admin')
  );

-- Trigger
CREATE OR REPLACE FUNCTION update_parametros_vendas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_parametros_vendas_updated_at ON parametros_vendas;
CREATE TRIGGER trg_parametros_vendas_updated_at
  BEFORE UPDATE ON parametros_vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_parametros_vendas_updated_at();

-- Inserir parâmetros padrão
INSERT INTO parametros_vendas (chave, valor, tipo, descricao)
VALUES 
  ('logo_impressao_vendas', NULL, 'imagem', 'URL do logotipo exibido no cabeçalho da impressão de vendas'),
  ('nome_empresa_impressao', 'CRESCI E PERDI FRANCHISING', 'texto', 'Nome da empresa exibido na impressão'),
  ('slogan_impressao', 'Sistema de Gestão', 'texto', 'Slogan/subtítulo exibido na impressão'),
  ('mostrar_logo_impressao', 'true', 'booleano', 'Exibir ou ocultar logotipo na impressão')
ON CONFLICT (chave) DO NOTHING;

-- PASSO 2: Adicionar permissão aos usuários Admin
UPDATE usuarios
SET permissoes = CASE 
  WHEN permissoes IS NULL THEN '["vendas_parametros"]'::jsonb
  WHEN NOT (permissoes @> '"vendas_parametros"'::jsonb) THEN permissoes || '"vendas_parametros"'::jsonb
  ELSE permissoes
END
WHERE cargo = 'Admin';

-- PASSO 3: Verificar se tudo foi criado corretamente
SELECT 'Tabela criada:' as status, COUNT(*) as total FROM parametros_vendas
UNION ALL
SELECT 'Usuários Admin com permissão:', COUNT(*) FROM usuarios WHERE cargo = 'Admin' AND permissoes @> '"vendas_parametros"'::jsonb;

-- PASSO 4: Mostrar parâmetros criados
SELECT * FROM parametros_vendas ORDER BY chave;

-- IMPORTANTE: Após executar este script, faça logout e login novamente no sistema
-- para que as permissões sejam atualizadas!
