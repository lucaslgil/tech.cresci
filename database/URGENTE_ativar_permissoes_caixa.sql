-- =====================================================
-- ATIVAR PERMISSÕES MOVIMENTAÇÕES DE CAIXA URGENTE
-- Execute este script para visualizar o menu
-- Data: 11/02/2026
-- =====================================================

-- Ativar permissão de visualização para seu usuário MASTER
UPDATE usuarios
SET permissoes = jsonb_set(
  permissoes,
  '{movimentacoes_caixa_visualizar}', 'true'::jsonb
)
WHERE cargo ILIKE '%MASTER%' OR email = 'suporte.ti@crescieperdi.com.br';

-- Ativar todas as outras permissões também
UPDATE usuarios
SET permissoes = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        permissoes,
        '{movimentacoes_caixa_criar}', 'true'::jsonb
      ),
      '{movimentacoes_caixa_editar}', 'true'::jsonb
    ),
    '{movimentacoes_caixa_excluir}', 'true'::jsonb
  ),
  '{caixa_abrir_fechar}', 'true'::jsonb
)
WHERE cargo ILIKE '%MASTER%' OR email = 'suporte.ti@crescieperdi.com.br';

-- =====================================================
-- VALIDAR
-- =====================================================

SELECT 
  email,
  nome,
  cargo,
  permissoes->'movimentacoes_caixa_visualizar' as visualizar,
  permissoes->'movimentacoes_caixa_criar' as criar,
  permissoes->'caixa_abrir_fechar' as abrir_fechar
FROM usuarios
WHERE cargo ILIKE '%MASTER%';
