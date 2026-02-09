-- =====================================================
-- LIMPAR NOTAS FISCAIS DE TESTE E RESETAR NUMERAÇÃO
-- Data: 03/02/2026
-- =====================================================

-- 1. Excluir todos os itens de notas fiscais
DELETE FROM notas_fiscais_itens WHERE nota_fiscal_id IN (
  SELECT id FROM notas_fiscais WHERE status = 'RASCUNHO'
);

-- 2. Excluir todas as notas fiscais em rascunho
DELETE FROM notas_fiscais WHERE status = 'RASCUNHO';

-- 3. Resetar a sequência de ID para começar do 1
ALTER SEQUENCE notas_fiscais_id_seq RESTART WITH 1;
ALTER SEQUENCE notas_fiscais_itens_id_seq RESTART WITH 1;

-- 4. Verificar se foi limpo
SELECT COUNT(*) as total_rascunhos FROM notas_fiscais WHERE status = 'RASCUNHO';
SELECT COUNT(*) as total_notas FROM notas_fiscais;

-- ✅ LIMPEZA CONCLUÍDA!
