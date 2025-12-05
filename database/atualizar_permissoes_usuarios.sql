-- ATUALIZAÇÃO DA ESTRUTURA DE PERMISSÕES DOS USUÁRIOS
-- Este script atualiza a coluna 'permissoes' da tabela 'usuarios' para incluir todos os módulos do sistema

-- Passo 1: Adicionar as novas permissões mantendo as existentes
-- Nota: Este comando irá atualizar todos os usuários existentes

UPDATE usuarios
SET permissoes = jsonb_build_object(
  -- CADASTROS
  'cadastro_empresa', COALESCE((permissoes->>'cadastro_empresa')::boolean, false),
  'cadastro_colaborador', COALESCE((permissoes->>'cadastro_colaborador')::boolean, false),
  'cadastro_produtos', COALESCE((permissoes->>'cadastro_produtos')::boolean, false),
  'cadastro_clientes', COALESCE((permissoes->>'cadastro_clientes')::boolean, false),
  
  -- INVENTÁRIO
  'inventario_itens', COALESCE((permissoes->>'inventario_item')::boolean, COALESCE((permissoes->>'inventario_itens')::boolean, false)),
  'inventario_relatorio', COALESCE((permissoes->>'inventario_relatorio')::boolean, false),
  'inventario_linhas', COALESCE((permissoes->>'inventario_linhas')::boolean, false),
  
  -- VENDAS
  'vendas_listagem', COALESCE((permissoes->>'vendas_listagem')::boolean, false),
  'vendas_nova', COALESCE((permissoes->>'vendas_nova')::boolean, false),
  'vendas_relatorios', COALESCE((permissoes->>'vendas_relatorios')::boolean, false),
  
  -- NOTAS FISCAIS
  'notas_fiscais_emitir', COALESCE((permissoes->>'notas_fiscais_emitir')::boolean, false),
  'notas_fiscais_parametros', COALESCE((permissoes->>'notas_fiscais_parametros')::boolean, false),
  
  -- FINANCEIRO
  'financeiro_contas_pagar', COALESCE((permissoes->>'financeiro_contas_pagar')::boolean, false),
  'financeiro_contas_receber', COALESCE((permissoes->>'financeiro_contas_receber')::boolean, false),
  'financeiro_parametros', COALESCE((permissoes->>'financeiro_parametros')::boolean, false),
  
  -- OUTROS
  'franquias', COALESCE((permissoes->>'franquias')::boolean, false),
  'tarefas', COALESCE((permissoes->>'tarefas')::boolean, false),
  'documentacao', COALESCE((permissoes->>'documentacao')::boolean, false),
  'configuracoes', COALESCE((permissoes->>'configuracoes')::boolean, false)
);

-- Passo 2: Para novos usuários, definir valor padrão
-- (Opcional) Se você quiser dar permissões completas para algum usuário específico (ex: admin)
-- Descomente e ajuste o email do usuário admin:

-- Para dar TODAS as permissões para o seu usuário, execute este comando:
UPDATE usuarios
SET permissoes = jsonb_build_object(
  'cadastro_empresa', true,
  'cadastro_colaborador', true,
  'cadastro_produtos', true,
  'cadastro_clientes', true,
  'inventario_itens', true,
  'inventario_relatorio', true,
  'inventario_linhas', true,
  'vendas_listagem', true,
  'vendas_nova', true,
  'vendas_relatorios', true,
  'notas_fiscais_emitir', true,
  'notas_fiscais_parametros', true,
  'financeiro_contas_pagar', true,
  'financeiro_contas_receber', true,
  'financeiro_parametros', true,
  'franquias', true,
  'tarefas', true,
  'documentacao', true,
  'configuracoes', true
)
WHERE email = 'suporte.ti@crescieperdi.com.br';

-- OU, se preferir dar permissões para TODOS os usuários:
/*
UPDATE usuarios
SET permissoes = jsonb_build_object(
  'cadastro_empresa', true,
  'cadastro_colaborador', true,
  'cadastro_produtos', true,
  'cadastro_clientes', true,
  'inventario_itens', true,
  'inventario_relatorio', true,
  'inventario_linhas', true,
  'vendas_listagem', true,
  'vendas_nova', true,
  'vendas_relatorios', true,
  'notas_fiscais_emitir', true,
  'notas_fiscais_parametros', true,
  'financeiro_contas_pagar', true,
  'financeiro_contas_receber', true,
  'financeiro_parametros', true,
  'franquias', true,
  'tarefas', true,
  'documentacao', true,
  'configuracoes', true
);
*/

-- Verificar resultado
SELECT 
  id,
  email, 
  nome,
  ativo,
  permissoes
FROM usuarios
ORDER BY created_at DESC;
