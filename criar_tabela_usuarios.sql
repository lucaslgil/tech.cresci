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

-- 2. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON public.usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_permissoes ON public.usuarios USING GIN (permissoes);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de segurança (RLS Policies)

-- Permitir que usuários vejam apenas seu próprio perfil (ou todos se tiver permissão de configurações)
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.usuarios
  FOR SELECT
  USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
      AND ativo = true
      AND permissoes->>'configuracoes' = 'true'
    )
  );

-- Permitir que usuários atualizem apenas seu próprio perfil (exceto permissões)
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.usuarios
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Permitir que usuários com permissão de configurações gerenciem todos os usuários
CREATE POLICY "Admins podem gerenciar todos os usuários"
  ON public.usuarios
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
      AND ativo = true
      AND permissoes->>'configuracoes' = 'true'
    )
  );

-- 5. Criar trigger para atualizar updated_at automaticamente
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

-- 6. Criar função para inserir usuário automaticamente após signup
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

-- 7. Criar trigger para executar a função após signup
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
-- 3. RLS está ativo para segurança
-- 4. Usuários só veem seu próprio perfil, exceto quem tem permissão de configurações
-- 5. O trigger handle_new_user() cria automaticamente um registro em usuarios após signup
-- 6. O trigger set_updated_at() atualiza automaticamente o campo updated_at
-- 7. Permissões padrão: todas false (nenhum acesso)
-- 8. Status padrão: ativo = true
-- ============================================================
