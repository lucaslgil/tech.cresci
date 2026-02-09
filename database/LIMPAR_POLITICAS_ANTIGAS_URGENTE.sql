-- =====================================================
-- LIMPAR POLÍTICAS RLS ANTIGAS (INSEGURAS) - URGENTE!
-- =====================================================

-- PROBLEMA CRÍTICO: Políticas antigas permissivas (true, auth.uid() IS NOT NULL)
-- estão coexistindo com as novas políticas restritivas (empresa_id).
-- PostgreSQL usa OR lógico, então as permissivas SOBREPÕEM as restritivas!

-- SOLUÇÃO: Remover TODAS as políticas antigas e manter APENAS as baseadas em empresa_id

-- =====================================================
-- CLIENTES - Remover políticas antigas
-- =====================================================
DROP POLICY IF EXISTS "Clientes visíveis para usuários autenticados" ON clientes;
DROP POLICY IF EXISTS "Permitir exclusão de clientes" ON clientes;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar clientes" ON clientes;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar clientes" ON clientes;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir clientes" ON clientes;

-- =====================================================
-- COLABORADORES - Remover políticas antigas
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated users to delete colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "Allow authenticated users to insert colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "Allow authenticated users to read colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "Allow authenticated users to update colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "Permitir exclusão de colaboradores" ON colaboradores;

-- =====================================================
-- EMPRESAS - Remover políticas antigas
-- =====================================================
DROP POLICY IF EXISTS "Permitir exclusão de empresas" ON empresas;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar empresas" ON empresas;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar empresas" ON empresas;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir empresas" ON empresas;
DROP POLICY IF EXISTS "Usuários autenticados podem ver empresas" ON empresas;

-- =====================================================
-- NOTAS_FISCAIS - Remover políticas antigas
-- =====================================================
DROP POLICY IF EXISTS "Permitir atualização notas" ON notas_fiscais;
DROP POLICY IF EXISTS "Permitir exclusão notas" ON notas_fiscais;
DROP POLICY IF EXISTS "Permitir inserção notas" ON notas_fiscais;
DROP POLICY IF EXISTS "Permitir leitura notas" ON notas_fiscais;

-- =====================================================
-- NOTAS_FISCAIS_ITENS - Remover políticas antigas
-- =====================================================
DROP POLICY IF EXISTS "Permitir atualização itens" ON notas_fiscais_itens;
DROP POLICY IF EXISTS "Permitir exclusão itens" ON notas_fiscais_itens;
DROP POLICY IF EXISTS "Permitir inserção itens" ON notas_fiscais_itens;
DROP POLICY IF EXISTS "Permitir leitura itens" ON notas_fiscais_itens;

-- =====================================================
-- NOTAS_FISCAIS_NUMERACAO - Remover políticas antigas
-- =====================================================
DROP POLICY IF EXISTS "Permitir atualização numeração admin" ON notas_fiscais_numeracao;
DROP POLICY IF EXISTS "Permitir leitura numeração" ON notas_fiscais_numeracao;

-- =====================================================
-- OPERACOES_FISCAIS - Remover políticas antigas
-- =====================================================
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar Operações Fiscais" ON operacoes_fiscais;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar Operações Fiscais" ON operacoes_fiscais;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir Operações Fiscais" ON operacoes_fiscais;
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar Operações Fiscais" ON operacoes_fiscais;

-- =====================================================
-- PRODUTOS - Remover políticas antigas
-- =====================================================
DROP POLICY IF EXISTS "Permitir exclusão de produtos" ON produtos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar produtos" ON produtos;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar produtos" ON produtos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir produtos" ON produtos;
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar produtos" ON produtos;

-- =====================================================
-- VENDAS - Remover políticas antigas
-- =====================================================
DROP POLICY IF EXISTS "Apenas admins podem deletar vendas" ON vendas;
DROP POLICY IF EXISTS "Permitir atualização de vendas" ON vendas;
DROP POLICY IF EXISTS "Permitir criação de vendas" ON vendas;
DROP POLICY IF EXISTS "Permitir exclusão de vendas" ON vendas;
DROP POLICY IF EXISTS "Permitir visualização de vendas" ON vendas;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar vendas" ON vendas;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir vendas" ON vendas;
DROP POLICY IF EXISTS "Usuários autenticados podem ver vendas" ON vendas;

-- =====================================================
-- VENDAS_ITENS - Remover políticas antigas
-- =====================================================
DROP POLICY IF EXISTS "Apenas admins podem deletar itens" ON vendas_itens;
DROP POLICY IF EXISTS "Permitir atualização de itens" ON vendas_itens;
DROP POLICY IF EXISTS "Permitir criação de itens" ON vendas_itens;
DROP POLICY IF EXISTS "Permitir exclusão de itens de vendas" ON vendas_itens;
DROP POLICY IF EXISTS "Permitir visualização de itens" ON vendas_itens;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar itens" ON vendas_itens;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir itens" ON vendas_itens;
DROP POLICY IF EXISTS "Usuários autenticados podem ver itens" ON vendas_itens;

-- =====================================================
-- VERIFICAÇÃO FINAL - Listar apenas políticas seguras
-- =====================================================

SELECT 
  tablename,
  policyname,
  cmd as "Comando",
  CASE 
    WHEN policyname LIKE '%mesma_empresa%' OR policyname LIKE '%proprio_registro%' OR policyname LIKE '%propria_empresa%' THEN '✅ SEGURA'
    ELSE '⚠️ VERIFICAR'
  END as "Status"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'empresas', 'usuarios', 'colaboradores', 'clientes', 'produtos', 
    'vendas', 'vendas_itens', 'notas_fiscais', 'notas_fiscais_itens', 
    'operacoes_fiscais', 'notas_fiscais_numeracao'
  )
ORDER BY tablename, policyname;

-- =====================================================
-- ✅ RESULTADO ESPERADO
-- =====================================================
-- Todas as políticas devem ter nomes como:
-- - *_mesma_empresa_* (para segurança por empresa_id)
-- - usuarios_ver_proprio_registro (para usuários)
-- - usuarios_editar_proprio_registro (para usuários)
-- - usuarios_ver_propria_empresa (para empresas)
-- - usuarios_editar_propria_empresa (para empresas)
-- - service_role_inserir_usuarios (para inserção)

-- Status deve mostrar apenas: ✅ SEGURA
