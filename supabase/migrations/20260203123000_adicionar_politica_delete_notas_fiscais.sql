-- =====================================================
-- POLÍTICAS RLS: EXCLUSÃO DE NOTAS FISCAIS (RASCUNHO)
-- Data: 03/02/2026
-- =====================================================

-- Notas Fiscais: permitir exclusão apenas de rascunhos
DROP POLICY IF EXISTS "Permitir exclusão notas" ON notas_fiscais;
CREATE POLICY "Permitir exclusão notas" ON notas_fiscais
  FOR DELETE
  USING (auth.role() = 'authenticated' AND status = 'RASCUNHO');

-- Itens: permitir exclusão apenas quando a nota vinculada está em rascunho
DROP POLICY IF EXISTS "Permitir exclusão itens" ON notas_fiscais_itens;
CREATE POLICY "Permitir exclusão itens" ON notas_fiscais_itens
  FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1
      FROM notas_fiscais nf
      WHERE nf.id = notas_fiscais_itens.nota_fiscal_id
        AND nf.status = 'RASCUNHO'
    )
  );
