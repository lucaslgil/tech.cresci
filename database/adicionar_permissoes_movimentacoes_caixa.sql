-- =====================================================
-- ADICIONAR PERMISSÕES - MOVIMENTAÇÕES DE CAIXA
-- Data: 11/02/2026
-- =====================================================

-- IMPORTANTE: Este sistema usa permissões no formato JSONB dentro da tabela usuarios
-- As permissões são gerenciadas pela aplicação, não por tabelas separadas

-- =====================================================
-- ADICIONAR PERMISSÕES NO JSONB DOS USUÁRIOS
-- =====================================================

-- Adicionar permissões de movimentações de caixa para todos os usuários ativos
-- (As permissões começam como 'false', devem ser ativadas pela interface)
UPDATE usuarios
SET permissoes = permissoes || 
  jsonb_build_object(
    'movimentacoes_caixa_visualizar', false,
    'movimentacoes_caixa_criar', false,
    'movimentacoes_caixa_editar', false,
    'movimentacoes_caixa_excluir', false,
    'caixa_abrir_fechar', false
  )
WHERE ativo = true
  AND NOT permissoes ? 'movimentacoes_caixa_visualizar';

-- =====================================================
-- CONCEDER PERMISSÕES PARA USUÁRIOS MASTER/ADMIN
-- =====================================================

-- Ativar todas as permissões para usuários com cargo contendo 'MASTER' ou 'ADMIN'
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
-- VALIDAÇÃO
-- =====================================================

-- Verificar se as permissões foram adicionadas
SELECT 
  id, 
  email, 
  nome,
  cargo,
  permissoes->'movimentacoes_caixa_visualizar' as mov_visualizar,
  permissoes->'movimentacoes_caixa_criar' as mov_criar,
  permissoes->'caixa_abrir_fechar' as caixa_abrir_fechar
FROM usuarios
WHERE ativo = true
LIMIT 10;

-- =====================================================
-- NOTA
-- =====================================================

/*
PERMISSÕES CRIADAS NO JSONB:
1. movimentacoes_caixa_visualizar - Ver movimentações (boolean)
2. movimentacoes_caixa_criar - Criar movimentações (boolean)
3. movimentacoes_caixa_editar - Editar movimentações (boolean)
4. movimentacoes_caixa_excluir - Excluir movimentações (boolean)
5. caixa_abrir_fechar - Abrir/Fechar caixa (boolean)

COMO USAR:
- As permissões são adicionadas com valor 'false' para todos os usuários
- Configure as permissões através da interface de Usuários na aplicação
- Ou use o bloco SQL comentado acima para dar permissões automáticas

ESTRUTURA JSONB:
{
  "cadastro_empresa": false,
  "cadastro_colaborador": false,
  "movimentacoes_caixa_visualizar": false,
  "movimentacoes_caixa_criar": false,
  "movimentacoes_caixa_editar": false,
  "movimentacoes_caixa_excluir": false,
  "caixa_abrir_fechar": false,
  ...
}
*/
