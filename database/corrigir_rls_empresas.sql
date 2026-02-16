-- ============================================
-- DIAGNÓSTICO: EMPRESAS NÃO APARECEM NO SISTEMA
-- ============================================

-- 1. Listar TODAS as empresas cadastradas (sem RLS)
SELECT 
    id,
    codigo,
    razao_social,
    nome_fantasia,
    cnpj,
    ativo
FROM empresas
ORDER BY id;

-- 2. Verificar as policies da tabela empresas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'empresas'
ORDER BY policyname;

-- 3. Verificar se há coluna empresa_id na tabela empresas (não deveria ter)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'empresas'
ORDER BY ordinal_position;

-- 4. CORRIGIR: Remover RLS que filtra empresas por empresa_id
-- Empresas devem ser visíveis para todos os usuários autenticados
DROP POLICY IF EXISTS "Usuários podem ver empresas da sua empresa" ON empresas;

-- 5. CRIAR POLICY CORRETA: Permitir ver todas as empresas
CREATE POLICY "Usuários autenticados podem ver todas as empresas"
ON empresas
FOR SELECT
TO authenticated
USING (true);

-- 6. Permitir que usuários master possam gerenciar empresas
CREATE POLICY "Usuários master podem gerenciar empresas"
ON empresas
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.ativo = true
        AND (
            usuarios.cargo ILIKE '%master%' 
            OR usuarios.cargo ILIKE '%admin%'
            OR usuarios.permissoes->>'cadastro_empresa' = 'true'
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.ativo = true
        AND (
            usuarios.cargo ILIKE '%master%' 
            OR usuarios.cargo ILIKE '%admin%'
            OR usuarios.permissoes->>'cadastro_empresa' = 'true'
        )
    )
);

-- 7. Verificar resultado final - listar policies atualizadas
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'empresas'
ORDER BY policyname;

-- 8. Testar query que o sistema usa
SELECT id, codigo, razao_social, nome_fantasia
FROM empresas
ORDER BY nome_fantasia;
