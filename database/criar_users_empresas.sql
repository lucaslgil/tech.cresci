-- =====================================================
-- CRIAR RELACIONAMENTO N:N ENTRE USUÁRIOS E EMPRESAS
-- =====================================================
-- Data: 10 de fevereiro de 2026
-- Objetivo: Permitir que um usuário pertença a múltiplas empresas
-- =====================================================

-- =====================================================
-- PASSO 1: CRIAR TABELA DE RELACIONAMENTO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.users_empresas (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id BIGINT NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Garantir que não haja duplicatas
  UNIQUE(user_id, empresa_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_empresas_user_id ON public.users_empresas(user_id);
CREATE INDEX IF NOT EXISTS idx_users_empresas_empresa_id ON public.users_empresas(empresa_id);

-- Comentários
COMMENT ON TABLE public.users_empresas IS 'Relacionamento N:N entre usuários e empresas. Um usuário pode ter acesso a múltiplas empresas.';
COMMENT ON COLUMN public.users_empresas.user_id IS 'UUID do usuário (auth.users)';
COMMENT ON COLUMN public.users_empresas.empresa_id IS 'ID da empresa que o usuário tem acesso';

-- =====================================================
-- PASSO 2: MIGRAR DADOS EXISTENTES
-- =====================================================

-- Copiar vínculos existentes da coluna empresa_id para a nova tabela
INSERT INTO public.users_empresas (user_id, empresa_id)
SELECT id, empresa_id 
FROM public.usuarios 
WHERE empresa_id IS NOT NULL
ON CONFLICT (user_id, empresa_id) DO NOTHING;

-- Verificar migração
SELECT 
  'Vínculos migrados' as status,
  COUNT(*) as total
FROM public.users_empresas;

-- =====================================================
-- PASSO 3: HABILITAR RLS
-- =====================================================

ALTER TABLE public.users_empresas ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário vê apenas seus próprios vínculos
CREATE POLICY "users_ver_proprias_empresas"
ON public.users_empresas FOR SELECT
USING (user_id = auth.uid());

-- Policy: Apenas admins podem inserir vínculos (via service_role ou função específica)
CREATE POLICY "admins_criar_vinculos"
ON public.users_empresas FOR INSERT
WITH CHECK (
  -- Permitir se for service_role OU se for admin da empresa
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND (
      cargo ILIKE '%admin%' 
      OR cargo ILIKE '%master%'
    )
  )
);

-- Policy: Apenas admins podem deletar vínculos
CREATE POLICY "admins_deletar_vinculos"
ON public.users_empresas FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND (
      cargo ILIKE '%admin%' 
      OR cargo ILIKE '%master%'
    )
  )
);

-- =====================================================
-- PASSO 4: CRIAR FUNÇÃO PARA LISTAR EMPRESAS DO USUÁRIO
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_empresas()
RETURNS TABLE (
  empresa_id BIGINT,
  codigo TEXT,
  razao_social TEXT,
  nome_fantasia TEXT,
  cnpj TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    e.id as empresa_id,
    e.codigo,
    e.razao_social,
    e.nome_fantasia,
    e.cnpj
  FROM public.empresas e
  INNER JOIN public.users_empresas ue ON ue.empresa_id = e.id
  WHERE ue.user_id = auth.uid()
  ORDER BY e.nome_fantasia;
$$;

COMMENT ON FUNCTION public.get_user_empresas() IS 'Retorna todas as empresas que o usuário autenticado tem acesso';

-- =====================================================
-- PASSO 5: CRIAR VIEW PARA FACILITAR CONSULTAS
-- =====================================================

CREATE OR REPLACE VIEW public.vw_usuarios_empresas AS
SELECT 
  u.id as usuario_id,
  u.email,
  u.nome as usuario_nome,
  u.cargo,
  e.id as empresa_id,
  e.codigo as empresa_codigo,
  e.nome_fantasia as empresa_nome,
  e.cnpj as empresa_cnpj,
  ue.criado_em as vinculo_criado_em
FROM public.usuarios u
INNER JOIN public.users_empresas ue ON ue.user_id = u.id
INNER JOIN public.empresas e ON e.id = ue.empresa_id
ORDER BY u.nome, e.nome_fantasia;

COMMENT ON VIEW public.vw_usuarios_empresas IS 'View que mostra todos os vínculos entre usuários e empresas';

-- =====================================================
-- PASSO 6: CRIAR FUNÇÃO PARA VERIFICAR ACESSO
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_tem_acesso_empresa(p_empresa_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.users_empresas 
    WHERE user_id = auth.uid() 
    AND empresa_id = p_empresa_id
  );
$$;

COMMENT ON FUNCTION public.user_tem_acesso_empresa(BIGINT) IS 'Verifica se o usuário autenticado tem acesso à empresa especificada';

-- =====================================================
-- PASSO 7: ATUALIZAR RLS DAS OUTRAS TABELAS
-- =====================================================

-- IMPORTANTE: Agora o RLS deve verificar se o usuário tem acesso à empresa
-- via users_empresas em vez de verificar usuarios.empresa_id

-- Exemplo para tabela produtos:
DROP POLICY IF EXISTS "produtos_mesma_empresa_select" ON produtos;
CREATE POLICY "produtos_mesma_empresa_select" ON produtos FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM public.users_empresas WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "produtos_mesma_empresa_insert" ON produtos;
CREATE POLICY "produtos_mesma_empresa_insert" ON produtos FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM public.users_empresas WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "produtos_mesma_empresa_update" ON produtos;
CREATE POLICY "produtos_mesma_empresa_update" ON produtos FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM public.users_empresas WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "produtos_mesma_empresa_delete" ON produtos;
CREATE POLICY "produtos_mesma_empresa_delete" ON produtos FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM public.users_empresas WHERE user_id = auth.uid()
  )
);

-- Exemplo para tabela clientes:
DROP POLICY IF EXISTS "clientes_mesma_empresa_select" ON clientes;
CREATE POLICY "clientes_mesma_empresa_select" ON clientes FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM public.users_empresas WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "clientes_mesma_empresa_insert" ON clientes;
CREATE POLICY "clientes_mesma_empresa_insert" ON clientes FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM public.users_empresas WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "clientes_mesma_empresa_update" ON clientes;
CREATE POLICY "clientes_mesma_empresa_update" ON clientes FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM public.users_empresas WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "clientes_mesma_empresa_delete" ON clientes;
CREATE POLICY "clientes_mesma_empresa_delete" ON clientes FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM public.users_empresas WHERE user_id = auth.uid()
  )
);

-- Exemplo para tabela vendas:
DROP POLICY IF EXISTS "vendas_mesma_empresa_select" ON vendas;
CREATE POLICY "vendas_mesma_empresa_select" ON vendas FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM public.users_empresas WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "vendas_mesma_empresa_insert" ON vendas;
CREATE POLICY "vendas_mesma_empresa_insert" ON vendas FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM public.users_empresas WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "vendas_mesma_empresa_update" ON vendas;
CREATE POLICY "vendas_mesma_empresa_update" ON vendas FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM public.users_empresas WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "vendas_mesma_empresa_delete" ON vendas;
CREATE POLICY "vendas_mesma_empresa_delete" ON vendas FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM public.users_empresas WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- PASSO 8: QUERIES DE VERIFICAÇÃO
-- =====================================================

-- Ver todos os vínculos
-- SELECT * FROM public.vw_usuarios_empresas;

-- Ver empresas de um usuário específico (substitua UUID_DO_USUARIO pelo ID real)
-- SELECT * FROM public.users_empresas WHERE user_id = 'UUID_DO_USUARIO';

-- Contar quantas empresas cada usuário tem acesso
SELECT 
  u.nome,
  u.email,
  COUNT(ue.empresa_id) as total_empresas
FROM public.usuarios u
LEFT JOIN public.users_empresas ue ON ue.user_id = u.id
GROUP BY u.id, u.nome, u.email
ORDER BY total_empresas DESC;

-- Ver usuários com acesso a múltiplas empresas
SELECT 
  u.nome,
  u.email,
  COUNT(ue.empresa_id) as total_empresas,
  STRING_AGG(e.nome_fantasia, ', ') as empresas
FROM public.usuarios u
INNER JOIN public.users_empresas ue ON ue.user_id = u.id
INNER JOIN public.empresas e ON e.id = ue.empresa_id
GROUP BY u.id, u.nome, u.email
HAVING COUNT(ue.empresa_id) > 1
ORDER BY total_empresas DESC;

-- =====================================================
-- PASSO 9: EXEMPLOS DE USO
-- =====================================================

-- Dar acesso de um usuário a uma empresa:
-- INSERT INTO public.users_empresas (user_id, empresa_id)
-- VALUES ('UUID_DO_USUARIO', 1);

-- Dar acesso de um usuário a múltiplas empresas:
-- INSERT INTO public.users_empresas (user_id, empresa_id)
-- VALUES 
--   ('UUID_DO_USUARIO', 1),
--   ('UUID_DO_USUARIO', 2),
--   ('UUID_DO_USUARIO', 3);

-- Remover acesso de um usuário a uma empresa:
-- DELETE FROM public.users_empresas 
-- WHERE user_id = 'UUID_DO_USUARIO' AND empresa_id = 1;

-- Listar empresas que o usuário logado tem acesso:
-- SELECT * FROM public.get_user_empresas();

-- =====================================================
-- OBSERVAÇÕES IMPORTANTES
-- =====================================================

-- 1. A coluna usuarios.empresa_id pode ser mantida por compatibilidade,
--    mas não é mais usada para controle de acesso
--
-- 2. O RLS agora verifica users_empresas em vez de usuarios.empresa_id
--
-- 3. Um usuário pode ter acesso a:
--    - Uma empresa (1 registro em users_empresas)
--    - Várias empresas (N registros em users_empresas)
--    - Todas as empresas (N registros = total de empresas)
--
-- 4. No PDV, após login, se usuário tiver múltiplas empresas,
--    o sistema deve perguntar qual empresa usar
--
-- 5. A empresa escolhida no PDV fica vinculada permanentemente
--    (ou até um usuário Master trocar)

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
