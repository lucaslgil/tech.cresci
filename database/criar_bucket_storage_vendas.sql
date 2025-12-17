-- =====================================================
-- CRIAR BUCKET DE STORAGE: vendas
-- Bucket para armazenar logotipos e imagens de vendas
-- Data: 17/12/2025
-- =====================================================

-- IMPORTANTE: Este comando deve ser executado manualmente no Supabase Dashboard
-- ou via SQL Editor com as permissões corretas

-- 1. Criar bucket (via Dashboard é mais fácil)
--    - Nome: vendas
--    - Public: true (para permitir acesso público às imagens)
--    - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
--    - Max file size: 2MB

-- 2. Se precisar criar via SQL, use:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('vendas', 'vendas', true);

-- 3. Policies de acesso ao bucket
-- Todos usuários autenticados podem fazer upload
CREATE POLICY "Usuários autenticados podem fazer upload em vendas"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vendas' AND
  auth.role() = 'authenticated'
);

-- Todos podem visualizar (bucket público)
CREATE POLICY "Todos podem visualizar arquivos em vendas"
ON storage.objects FOR SELECT
USING (bucket_id = 'vendas');

-- Apenas admins podem deletar
CREATE POLICY "Apenas admin pode deletar arquivos em vendas"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vendas' AND
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND cargo = 'Admin'
  )
);

-- Apenas admins podem atualizar
CREATE POLICY "Apenas admin pode atualizar arquivos em vendas"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vendas' AND
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND cargo = 'Admin'
  )
);

-- =====================================================
-- INSTRUÇÕES DE CRIAÇÃO MANUAL (RECOMENDADO)
-- =====================================================
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em Storage
-- 3. Clique em "New bucket"
-- 4. Configure:
--    - Name: vendas
--    - Public bucket: Habilitado
--    - File size limit: 2MB
--    - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
-- 5. Crie a pasta "logos" dentro do bucket
-- 6. Execute as policies acima no SQL Editor
