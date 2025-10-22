-- ====================================
-- CONFIGURAÇÃO DO STORAGE BUCKET PARA FOTOS DE PERFIL
-- Execute este SQL no Supabase SQL Editor
-- ====================================

-- 1. Criar bucket para fotos de perfil (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('perfis', 'perfis', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar políticas de acesso ao bucket
-- Política: Permitir que usuários autenticados façam upload de suas fotos
DROP POLICY IF EXISTS "Usuários podem fazer upload de suas fotos" ON storage.objects;
CREATE POLICY "Usuários podem fazer upload de suas fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'perfis' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = (storage.filename(name))[1]
);

-- Política: Permitir que todos vejam as fotos (bucket público)
DROP POLICY IF EXISTS "Fotos de perfil são públicas" ON storage.objects;
CREATE POLICY "Fotos de perfil são públicas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'perfis');

-- Política: Permitir que usuários deletem suas próprias fotos
DROP POLICY IF EXISTS "Usuários podem deletar suas fotos" ON storage.objects;
CREATE POLICY "Usuários podem deletar suas fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'perfis' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = (storage.filename(name))[1]
);

-- Política: Permitir que usuários atualizem suas próprias fotos
DROP POLICY IF EXISTS "Usuários podem atualizar suas fotos" ON storage.objects;
CREATE POLICY "Usuários podem atualizar suas fotos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'perfis' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = (storage.filename(name))[1]
);
