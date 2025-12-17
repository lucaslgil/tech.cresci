-- =====================================================
-- ADICIONAR PERMISSÃO DIRETAMENTE AO USUÁRIO LOGADO
-- Execute este comando APÓS fazer login no sistema
-- =====================================================

-- Adicionar a permissão vendas_parametros ao seu usuário Admin
-- SUBSTITUA 'seu-email@exemplo.com' pelo email que você usa para fazer login

UPDATE usuarios
SET permissoes = 
  CASE 
    WHEN permissoes IS NULL THEN 
      '["vendas_parametros"]'::jsonb
    WHEN NOT (permissoes ? 'vendas_parametros') THEN 
      permissoes || '["vendas_parametros"]'::jsonb
    ELSE 
      permissoes
  END
WHERE email = 'seu-email@exemplo.com'  -- ⚠️ TROCAR PELO SEU EMAIL
  AND cargo = 'Admin';

-- Verificar se foi adicionado
SELECT 
  nome,
  email,
  cargo,
  permissoes
FROM usuarios
WHERE email = 'seu-email@exemplo.com';  -- ⚠️ TROCAR PELO SEU EMAIL

-- IMPORTANTE: Após executar, faça LOGOUT e LOGIN novamente no sistema!
