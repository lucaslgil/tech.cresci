-- =====================================================
-- PREPARAR RETAGUARDA PARA INTEGRAÇÃO COM FLASH PDV
-- Data: 10/02/2026
-- =====================================================

-- OBJETIVO:
-- Preparar o sistema web (retaguarda) para sincronização com PDV offline
-- Adiciona campos necessários para rastreamento e controle

-- =====================================================
-- 1. ADICIONAR CAMPO 'origem' NA TABELA vendas
-- =====================================================

-- Identificar de onde veio a venda: sistema web, PDV, API, importação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendas' 
    AND column_name = 'origem'
  ) THEN
    ALTER TABLE vendas 
      ADD COLUMN origem VARCHAR(20) DEFAULT 'WEB';
    
    RAISE NOTICE 'Coluna origem criada na tabela vendas';
  ELSE
    RAISE NOTICE 'Coluna origem já existe';
  END IF;
END $$;

-- Criar índice para facilitar filtros
CREATE INDEX IF NOT EXISTS idx_vendas_origem ON vendas(origem);

-- Adicionar comentário
COMMENT ON COLUMN vendas.origem IS 'Origem da venda: WEB, PDV, API, IMPORTACAO';

-- =====================================================
-- 2. GARANTIR CAMPO updated_at EM produtos
-- =====================================================

-- Necessário para sincronização incremental (só pega o que mudou)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produtos' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE produtos 
      ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    
    RAISE NOTICE 'Coluna updated_at criada na tabela produtos';
  ELSE
    RAISE NOTICE 'Coluna updated_at já existe';
  END IF;
END $$;

-- Criar trigger para atualizar automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS update_produtos_updated_at ON produtos;
CREATE TRIGGER update_produtos_updated_at 
  BEFORE UPDATE ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN produtos.updated_at IS 'Timestamp da última atualização (para sincronização PDV)';

-- =====================================================
-- 3. GARANTIR CAMPO updated_at EM clientes
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clientes' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE clientes 
      ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    
    RAISE NOTICE 'Coluna updated_at criada na tabela clientes';
  ELSE
    RAISE NOTICE 'Coluna updated_at já existe';
  END IF;
END $$;

-- Aplicar trigger
DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at 
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN clientes.updated_at IS 'Timestamp da última atualização (para sincronização PDV)';

-- =====================================================
-- 4. CRIAR TABELA DE LOG DE SINCRONIZAÇÃO (OPCIONAL)
-- =====================================================

-- Registrar sincronizações do PDV para auditoria
CREATE TABLE IF NOT EXISTS pdv_sync_log (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT NOT NULL REFERENCES empresas(id),
  pdv_identificador VARCHAR(100), -- Serial/MAC do computador PDV
  tipo_sync VARCHAR(20) NOT NULL, -- 'DOWNLOAD', 'UPLOAD'
  tabela VARCHAR(50),
  registros_afetados INTEGER DEFAULT 0,
  sucesso BOOLEAN DEFAULT true,
  erro TEXT,
  duracao_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pdv_sync_log_empresa ON pdv_sync_log(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pdv_sync_log_data ON pdv_sync_log(created_at);

COMMENT ON TABLE pdv_sync_log IS 'Log de sincronizações realizadas pelos PDVs';

-- =====================================================
-- 5. CONFIGURAR RLS PARA SINCRONIZAÇÃO PDV
-- =====================================================

-- Criar função auxiliar se não existir
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT empresa_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$;

-- Garantir que o PDV consiga buscar produtos e clientes da empresa
-- (Assumindo que RLS já está habilitado)

-- Policy para produtos: permitir SELECT para empresa do usuário
DROP POLICY IF EXISTS pdv_sync_produtos_select ON produtos;
CREATE POLICY pdv_sync_produtos_select ON produtos
  FOR SELECT
  USING (
    empresa_id = public.get_user_empresa_id()
  );

-- Policy para clientes: permitir SELECT para empresa do usuário
DROP POLICY IF EXISTS pdv_sync_clientes_select ON clientes;
CREATE POLICY pdv_sync_clientes_select ON clientes
  FOR SELECT
  USING (
    empresa_id = public.get_user_empresa_id()
  );

-- Policy para vendas: permitir INSERT de vendas do PDV
DROP POLICY IF EXISTS pdv_sync_vendas_insert ON vendas;
CREATE POLICY pdv_sync_vendas_insert ON vendas
  FOR INSERT
  WITH CHECK (
    empresa_id = public.get_user_empresa_id()
    AND origem = 'PDV'
  );

-- Policy para vendas_itens: permitir INSERT
DROP POLICY IF EXISTS pdv_sync_vendas_itens_insert ON vendas_itens;
CREATE POLICY pdv_sync_vendas_itens_insert ON vendas_itens
  FOR INSERT
  WITH CHECK (true); -- RLS controlado pela tabela vendas

-- =====================================================
-- 6. CRIAR VIEW PARA MONITORAR VENDAS DO PDV
-- =====================================================

CREATE OR REPLACE VIEW vw_vendas_pdv AS
SELECT 
  v.id,
  v.empresa_id,
  e.nome_fantasia as empresa_nome,
  v.numero,
  v.data_venda,
  v.total as valor_final,
  v.forma_pagamento,
  v.status,
  v.origem,
  COALESCE(c.razao_social, c.nome_completo) as cliente_nome,
  v.created_at as enviado_em,
  COUNT(vi.id) as qtd_itens
FROM vendas v
LEFT JOIN empresas e ON e.id = v.empresa_id
LEFT JOIN clientes c ON c.id = v.cliente_id
LEFT JOIN vendas_itens vi ON vi.venda_id = v.id
WHERE v.origem = 'PDV'
GROUP BY v.id, v.empresa_id, e.nome_fantasia, v.numero, 
         v.data_venda, v.total, v.forma_pagamento, v.status, 
         v.origem, c.razao_social, c.nome_completo, v.created_at
ORDER BY v.created_at DESC;

COMMENT ON VIEW vw_vendas_pdv IS 'Visualização de vendas enviadas pelo PDV';

-- =====================================================
-- 7. FUNÇÃO HELPER: Obter último ID sincronizado
-- =====================================================

CREATE OR REPLACE FUNCTION get_last_sync_id(
  p_empresa_id BIGINT,
  p_tabela VARCHAR(50)
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_last_sync TIMESTAMPTZ;
BEGIN
  SELECT MAX(created_at) INTO v_last_sync
  FROM pdv_sync_log
  WHERE empresa_id = p_empresa_id
    AND tabela = p_tabela
    AND tipo_sync = 'DOWNLOAD'
    AND sucesso = true;
  
  RETURN COALESCE(v_last_sync, '1970-01-01'::TIMESTAMPTZ);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_last_sync_id IS 'Retorna timestamp da última sincronização bem-sucedida';

-- =====================================================
-- 8. ATUALIZAR updated_at DOS REGISTROS EXISTENTES
-- =====================================================

-- Atualizar produtos existentes (para primeira sincronização)
UPDATE produtos 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- Atualizar clientes existentes
UPDATE clientes 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- Marcar vendas antigas como 'WEB'
UPDATE vendas 
SET origem = 'WEB' 
WHERE origem IS NULL;

-- =====================================================
-- 9. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice composto para sincronização incremental de produtos
CREATE INDEX IF NOT EXISTS idx_produtos_empresa_updated 
  ON produtos(empresa_id, updated_at DESC);

-- Índice composto para sincronização incremental de clientes
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_updated 
  ON clientes(empresa_id, updated_at DESC);

-- =====================================================
-- 10. VERIFICAÇÃO
-- =====================================================

-- Ver estrutura atualizada de vendas
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'vendas'
  AND column_name IN ('origem', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- Ver estrutura de produtos
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'produtos'
  AND column_name IN ('updated_at', 'ativo')
ORDER BY ordinal_position;

-- Ver estrutura de clientes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'clientes'
  AND column_name IN ('updated_at', 'ativo')
ORDER BY ordinal_position;

-- Testar view de vendas PDV
SELECT * FROM vw_vendas_pdv LIMIT 5;

-- Ver logs de sincronização
SELECT * FROM pdv_sync_log 
ORDER BY created_at DESC 
LIMIT 10;

-- =====================================================
-- ✅ RESULTADO ESPERADO
-- =====================================================
-- 1. Campo 'origem' em vendas
-- 2. Campo 'updated_at' em produtos e clientes
-- 3. Triggers automáticos funcionando
-- 4. RLS configurado para sincronização
-- 5. View vw_vendas_pdv criada
-- 6. Índices de performance adicionados
-- 7. Sistema pronto para receber sincronizações do PDV

-- =====================================================
-- 📝 PRÓXIMOS PASSOS
-- =====================================================
-- 1. Testar sincronização:
--    - Criar uma venda no PDV
--    - Sincronizar
--    - Verificar em vw_vendas_pdv
--
-- 2. Monitorar performance:
--    SELECT * FROM pdv_sync_log WHERE sucesso = false;
--
-- 3. Configurar credenciais no PDV:
--    - URL: https://xxx.supabase.co
--    - Anon Key ou Service Key
--    - ID da empresa
