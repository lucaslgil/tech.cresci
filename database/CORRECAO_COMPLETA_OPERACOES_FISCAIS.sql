-- =====================================================
-- CORREÇÃO COMPLETA - OPERAÇÕES FISCAIS
-- Execute este script no Supabase SQL Editor
-- Data: 14/01/2026
-- =====================================================
-- 
-- Este script corrige TODOS os problemas da tabela
-- operacoes_fiscais de uma vez:
-- 1. RLS Policies
-- 2. Coluna regime_tributario (tornar opcional)
-- 3. Constraint finalidade (valores corretos)
-- 
-- =====================================================

-- =====================================================
-- PARTE 1: CORRIGIR RLS POLICIES
-- =====================================================

-- Remover todas as policies antigas
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar Operações Fiscais" ON operacoes_fiscais;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir Operações Fiscais" ON operacoes_fiscais;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar Operações Fiscais" ON operacoes_fiscais;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar Operações Fiscais" ON operacoes_fiscais;
DROP POLICY IF EXISTS "Permitir leitura Operações Fiscais" ON operacoes_fiscais;
DROP POLICY IF EXISTS "Permitir inserção Operações admin" ON operacoes_fiscais;
DROP POLICY IF EXISTS "Permitir atualização Operações admin" ON operacoes_fiscais;
DROP POLICY IF EXISTS "Permitir deleção Operações admin" ON operacoes_fiscais;

-- Criar novas policies corretas
CREATE POLICY "Usuários autenticados podem visualizar Operações Fiscais"
  ON operacoes_fiscais FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir Operações Fiscais"
  ON operacoes_fiscais FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar Operações Fiscais"
  ON operacoes_fiscais FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar Operações Fiscais"
  ON operacoes_fiscais FOR DELETE
  USING (auth.role() = 'authenticated');

-- Garantir que RLS está habilitado
ALTER TABLE operacoes_fiscais ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PARTE 2: CORRIGIR COLUNA REGIME_TRIBUTARIO
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'operacoes_fiscais' 
        AND column_name = 'regime_tributario'
    ) THEN
        ALTER TABLE operacoes_fiscais ALTER COLUMN regime_tributario DROP NOT NULL;
        ALTER TABLE operacoes_fiscais ALTER COLUMN regime_tributario SET DEFAULT 'TODOS';
        UPDATE operacoes_fiscais SET regime_tributario = 'TODOS' WHERE regime_tributario IS NULL;
        RAISE NOTICE 'Coluna regime_tributario ajustada!';
    ELSE
        ALTER TABLE operacoes_fiscais 
        ADD COLUMN regime_tributario VARCHAR(20) DEFAULT 'TODOS'
        CHECK (regime_tributario IN ('SIMPLES', 'PRESUMIDO', 'REAL', 'TODOS'));
        RAISE NOTICE 'Coluna regime_tributario criada!';
    END IF;
END $$;

-- =====================================================
-- PARTE 3: CORRIGIR CONSTRAINT FINALIDADE
-- =====================================================

-- Remover constraint antiga
ALTER TABLE operacoes_fiscais DROP CONSTRAINT IF EXISTS operacoes_fiscais_finalidade_check;

-- Criar nova constraint com valores corretos
ALTER TABLE operacoes_fiscais 
ADD CONSTRAINT operacoes_fiscais_finalidade_check 
CHECK (finalidade IN ('NORMAL', 'COMPLEMENTAR', 'AJUSTE', 'DEVOLUCAO'));

-- =====================================================
-- VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar policies
SELECT 
  'POLICIES:' AS tipo,
  policyname AS nome,
  cmd AS operacao
FROM pg_policies
WHERE tablename = 'operacoes_fiscais'
ORDER BY policyname;

-- Verificar colunas
SELECT 
  'COLUNAS:' AS tipo,
  column_name AS nome,
  data_type AS tipo_dado,
  is_nullable AS aceita_null,
  column_default AS valor_padrao
FROM information_schema.columns
WHERE table_name = 'operacoes_fiscais'
AND column_name IN ('regime_tributario', 'finalidade')
ORDER BY column_name;

-- Verificar constraints
SELECT 
  'CONSTRAINTS:' AS tipo,
  con.conname AS nome,
  pg_get_constraintdef(con.oid) AS definicao
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'operacoes_fiscais'
AND con.contype = 'c'
AND (con.conname LIKE '%finalidade%' OR con.conname LIKE '%regime%')
ORDER BY con.conname;

-- =====================================================
-- FIM DA CORREÇÃO COMPLETA
-- =====================================================

SELECT '✅ TODAS AS CORREÇÕES APLICADAS COM SUCESSO!' AS resultado;
