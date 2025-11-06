-- ============================================================
-- CRIAR TABELA 'USUARIOS' PARA DADOS ADICIONAIS
-- ============================================================
-- Data: 06 de Novembro de 2025
-- Objetivo: Criar tabela para armazenar dados complementares dos usuários
--           que são criados no Supabase Authentication (auth.users)
-- ============================================================

-- 1. Criar a tabela usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  telefone TEXT,
  cargo TEXT,
  foto_perfil TEXT,
  permissoes JSONB DEFAULT '{"cadastro_empresa": false, "cadastro_colaborador": false, "inventario_item": false, "inventario_relatorio": false, "inventario_linhas": false, "configuracoes": false}'::jsonb,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON public.usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_permissoes ON public.usuarios USING GIN (permissoes);

-- NOTA: RLS não será habilitado para evitar recursão infinita
-- O controle de permissões será feito na camada da aplicação

-- 4. Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Criar função para inserir usuário automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nome, ativo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Criar trigger para executar a função após signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- VERIFICAÇÕES
-- ============================================================

-- 1. Verificar se a tabela foi criada
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'usuarios';

-- 2. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'usuarios'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar índices criados
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'usuarios'
  AND schemaname = 'public';

-- 4. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'usuarios';

-- 5. Verificar triggers
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'usuarios'
   OR event_object_table = 'users';

-- ============================================================
-- POPULAR TABELA COM USUÁRIOS EXISTENTES (OPCIONAL)
-- ============================================================
-- Se você já tem usuários criados no auth.users, execute este comando
-- para popular a tabela usuarios com eles:

-- INSERT INTO public.usuarios (id, email, nome, ativo)
-- SELECT 
--   id,
--   email,
--   COALESCE(raw_user_meta_data->>'nome', email) as nome,
--   true as ativo
-- FROM auth.users
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.usuarios WHERE usuarios.id = users.id
-- );

-- ============================================================
-- ATUALIZAR PERMISSÕES DO PRIMEIRO USUÁRIO (ADMIN)
-- ============================================================
-- Após criar a tabela, dê todas as permissões ao primeiro usuário:

-- UPDATE public.usuarios 
-- SET permissoes = '{"cadastro_empresa": true, "cadastro_colaborador": true, "inventario_item": true, "inventario_relatorio": true, "inventario_linhas": true, "configuracoes": true}'::jsonb
-- WHERE email = 'SEU-EMAIL@EXEMPLO.COM';

-- ============================================================
-- ROLLBACK (Em caso de necessidade)
-- ============================================================
-- CUIDADO: Isso removerá toda a tabela e dados!
-- 
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP TRIGGER IF EXISTS set_updated_at ON public.usuarios;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP FUNCTION IF EXISTS public.handle_updated_at();
-- DROP TABLE IF EXISTS public.usuarios CASCADE;

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================
-- 1. A tabela usuarios está vinculada ao auth.users via Foreign Key
-- 2. Quando um usuário é deletado do auth.users, será deletado de usuarios também (CASCADE)
-- 3. RLS NÃO está ativo - controle de permissões feito na aplicação
-- 4. O trigger handle_new_user() cria automaticamente um registro em usuarios após signup
-- 5. O trigger set_updated_at() atualiza automaticamente o campo updated_at
-- 6. Permissões padrão: todas false (nenhum acesso)
-- 7. Status padrão: ativo = true
-- 8. Apenas usuários autenticados podem acessar a tabela
-- ============================================================
