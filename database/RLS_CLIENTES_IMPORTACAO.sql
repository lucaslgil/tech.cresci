-- =============================================================
-- RLS - TABELA CLIENTES (IMPORTAÇÃO EM LOTE)
-- Execute este SQL no SQL Editor do Supabase
-- =============================================================

-- 1. Garantir que RLS está ativo na tabela clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- 2. Limpar políticas antigas (evita conflito)
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS clientes_select_policy    ON clientes;
DROP POLICY IF EXISTS clientes_insert_policy    ON clientes;
DROP POLICY IF EXISTS clientes_update_policy    ON clientes;
DROP POLICY IF EXISTS clientes_delete_policy    ON clientes;
DROP POLICY IF EXISTS clientes_select           ON clientes;
DROP POLICY IF EXISTS clientes_insert           ON clientes;
DROP POLICY IF EXISTS clientes_update           ON clientes;
DROP POLICY IF EXISTS clientes_delete           ON clientes;

-- ---------------------------------------------------------------
-- 3. Criar políticas baseadas em empresa_id do usuário logado
-- ---------------------------------------------------------------

-- SELECT: usuário só vê clientes da sua empresa
CREATE POLICY clientes_select ON clientes
  FOR SELECT TO authenticated
  USING (
    empresa_id = (
      SELECT empresa_id FROM usuarios
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

-- INSERT: usuário só insere clientes na sua empresa
CREATE POLICY clientes_insert ON clientes
  FOR INSERT TO authenticated
  WITH CHECK (
    empresa_id = (
      SELECT empresa_id FROM usuarios
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

-- UPDATE: usuário só atualiza clientes da sua empresa
CREATE POLICY clientes_update ON clientes
  FOR UPDATE TO authenticated
  USING (
    empresa_id = (
      SELECT empresa_id FROM usuarios
      WHERE id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    empresa_id = (
      SELECT empresa_id FROM usuarios
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

-- DELETE: usuário só deleta clientes da sua empresa
CREATE POLICY clientes_delete ON clientes
  FOR DELETE TO authenticated
  USING (
    empresa_id = (
      SELECT empresa_id FROM usuarios
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

-- ---------------------------------------------------------------
-- 4. Verificar se a coluna empresa_id existe em clientes
--    (Se der erro acima, rode este bloco separado primeiro)
-- ---------------------------------------------------------------
-- ALTER TABLE clientes ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id);

-- ---------------------------------------------------------------
-- 5. (OPCIONAL) Index para performance na importação em lote
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_cpf    ON clientes (empresa_id, cpf)  WHERE cpf  IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_cnpj   ON clientes (empresa_id, cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id     ON clientes (empresa_id);

-- ---------------------------------------------------------------
-- FIM
-- ---------------------------------------------------------------
