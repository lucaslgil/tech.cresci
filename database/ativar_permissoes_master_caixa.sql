-- =====================================================
-- ATIVAR PERMISSÕES DE CAIXA PARA USUÁRIOS MASTER
-- Execução rápida
-- Data: 11/02/2026
-- =====================================================

-- Ativar todas as permissões para usuários MASTER
UPDATE usuarios
SET permissoes = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          permissoes,
          '{movimentacoes_caixa_visualizar}', 'true'::jsonb
        ),
        '{movimentacoes_caixa_criar}', 'true'::jsonb
      ),
      '{movimentacoes_caixa_editar}', 'true'::jsonb
    ),
    '{movimentacoes_caixa_excluir}', 'true'::jsonb
  ),
  '{caixa_abrir_fechar}', 'true'::jsonb
)
WHERE cargo ILIKE '%MASTER%' OR cargo ILIKE '%ADMIN%';

-- =====================================================
-- VALIDAR RESULTADO
-- =====================================================

SELECT 
  id, 
  email, 
  nome,
  cargo,
  permissoes->'movimentacoes_caixa_visualizar' as mov_visualizar,
  permissoes->'movimentacoes_caixa_criar' as mov_criar,
  permissoes->'movimentacoes_caixa_editar' as mov_editar,
  permissoes->'movimentacoes_caixa_excluir' as mov_excluir,
  permissoes->'caixa_abrir_fechar' as caixa_abrir_fechar
FROM usuarios
WHERE cargo ILIKE '%MASTER%' OR cargo ILIKE '%ADMIN%';
