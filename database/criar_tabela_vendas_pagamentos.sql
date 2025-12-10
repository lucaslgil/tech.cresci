-- =====================================================
-- CRIAR TABELA VENDAS_PAGAMENTOS
-- Permite múltiplas formas de pagamento por venda
-- Data: 09/12/2025
-- =====================================================

-- Criar tabela vendas_pagamentos
CREATE TABLE IF NOT EXISTS vendas_pagamentos (
  id BIGSERIAL PRIMARY KEY,
  venda_id BIGINT NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  forma_pagamento TEXT NOT NULL,
  valor DECIMAL(15,2) NOT NULL DEFAULT 0,
  observacao TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT vendas_pagamentos_valor_positivo CHECK (valor > 0),
  CONSTRAINT vendas_pagamentos_forma_valida CHECK (
    forma_pagamento IN (
      'DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO',
      'BOLETO', 'TRANSFERENCIA', 'CHEQUE', 'CREDIARIO'
    )
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vendas_pagamentos_venda_id ON vendas_pagamentos(venda_id);
CREATE INDEX IF NOT EXISTS idx_vendas_pagamentos_forma ON vendas_pagamentos(forma_pagamento);

-- Criar função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION vendas_pagamentos_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS set_vendas_pagamentos_updated_at ON vendas_pagamentos;
CREATE TRIGGER set_vendas_pagamentos_updated_at
  BEFORE UPDATE ON vendas_pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION vendas_pagamentos_set_updated_at();

-- Comentários
COMMENT ON TABLE vendas_pagamentos IS 'Formas de pagamento vinculadas a vendas (permite múltiplos pagamentos)';
COMMENT ON COLUMN vendas_pagamentos.venda_id IS 'ID da venda';
COMMENT ON COLUMN vendas_pagamentos.forma_pagamento IS 'Forma de pagamento (DINHEIRO, PIX, CARTAO_CREDITO, etc)';
COMMENT ON COLUMN vendas_pagamentos.valor IS 'Valor pago nesta forma de pagamento';
COMMENT ON COLUMN vendas_pagamentos.observacao IS 'Observações sobre o pagamento';

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE vendas_pagamentos ENABLE ROW LEVEL SECURITY;

-- Policy SELECT (todos usuários autenticados)
CREATE POLICY "Permitir leitura de pagamentos de vendas"
  ON vendas_pagamentos FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy INSERT (todos usuários autenticados)
CREATE POLICY "Permitir inserção de pagamentos de vendas"
  ON vendas_pagamentos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy UPDATE (todos usuários autenticados)
CREATE POLICY "Permitir atualização de pagamentos de vendas"
  ON vendas_pagamentos FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Policy DELETE (todos usuários autenticados)
CREATE POLICY "Permitir exclusão de pagamentos de vendas"
  ON vendas_pagamentos FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar tabela criada
SELECT 
  table_name,
  CASE 
    WHEN table_type = 'BASE TABLE' THEN '✅ Tabela Criada'
    ELSE '❌ Não Encontrada'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'vendas_pagamentos';

-- Verificar colunas
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'vendas_pagamentos'
ORDER BY ordinal_position;

-- Verificar policies
SELECT 
  policyname,
  cmd,
  qual as condicao
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'vendas_pagamentos'
ORDER BY cmd, policyname;

-- =====================================================
-- RESUMO
-- =====================================================
-- Este script:
-- 1. Cria tabela vendas_pagamentos com validações
-- 2. Permite múltiplas formas de pagamento por venda
-- 3. Configura CASCADE delete (deletar venda = deletar pagamentos)
-- 4. Configura RLS com policies permissivas
-- 5. Valida forma_pagamento e valor > 0
-- =====================================================
