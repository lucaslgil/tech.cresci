-- =====================================================
-- CORRIGIR USUÁRIO suprimentos@crescieperdi.com.br
--
-- CAUSA DO PROBLEMA:
--   A policy RLS "usuarios_ver_mesma_empresa" filtra usuários
--   cujo campo empresa_id na tabela usuarios é NULL.
--   O usuário foi criado sem empresa_id nessa coluna.
--
-- Execute no SQL Editor do Supabase.
-- =====================================================

-- Passo 1: Corrigir empresa_id na tabela usuarios
-- (usa o mesmo empresa_id dos outros usuários visíveis)
UPDATE public.usuarios
SET empresa_id = (
  SELECT empresa_id 
  FROM public.usuarios 
  WHERE email = 'suporte.ti@crescieperdi.com.br'  -- usuário admin de referência
  LIMIT 1
)
WHERE email = 'suprimentos@crescieperdi.com.br';

-- Passo 2: Garantir vínculo em users_empresas
INSERT INTO public.users_empresas (user_id, empresa_id)
SELECT 
  u.id,
  u.empresa_id
FROM public.usuarios u
WHERE u.email = 'suprimentos@crescieperdi.com.br'
  AND u.empresa_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Verificação: deve retornar 1 linha com empresa_id preenchido
SELECT 
  u.id,
  u.email,
  u.nome,
  u.empresa_id  AS empresa_id_usuarios,
  u.ativo
FROM public.usuarios u
WHERE u.email = 'suprimentos@crescieperdi.com.br';
