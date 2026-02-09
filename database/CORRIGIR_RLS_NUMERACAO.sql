-- =====================================================
-- CORRIGIR RLS (Row Level Security) - NUMERAÇÃO NFE
-- EXECUTE ESTE SQL NO SUPABASE AGORA!
-- Data: 05/02/2026
-- =====================================================

-- Opção 1: Desabilitar RLS (mais simples)
ALTER TABLE notas_fiscais_numeracao DISABLE ROW LEVEL SECURITY;

-- Opção 2: Ou criar políticas permitindo tudo para usuários autenticados
-- (Use esta se preferir manter segurança)
/*
ALTER TABLE notas_fiscais_numeracao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir SELECT para todos"
  ON notas_fiscais_numeracao FOR SELECT
  USING (true);

CREATE POLICY "Permitir INSERT para autenticados"
  ON notas_fiscais_numeracao FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir UPDATE para autenticados"
  ON notas_fiscais_numeracao FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir DELETE para autenticados"
  ON notas_fiscais_numeracao FOR DELETE
  USING (auth.role() = 'authenticated');
*/

-- Verificar se RLS está desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'notas_fiscais_numeracao';

-- ✅ DEPOIS DE EXECUTAR:
-- rowsecurity deve mostrar: false (RLS desabilitado)
-- Agora o sistema vai conseguir salvar!
