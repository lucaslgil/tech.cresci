-- =====================================================
-- ADICIONAR SUPORTE A ANEXOS NO INVENTÁRIO
-- Permite anexar PDF, imagens (JPEG, PNG) aos itens
-- Data: 05/01/2026
-- =====================================================

-- =====================================================
-- 1. ADICIONAR COLUNA DE ANEXOS NA TABELA ITENS
-- =====================================================

ALTER TABLE itens
  ADD COLUMN IF NOT EXISTS anexos JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_itens_anexos ON itens USING GIN (anexos);

COMMENT ON COLUMN itens.anexos IS 'Array JSON com os anexos do item (PDFs, imagens, etc.)';

-- =====================================================
-- 2. CRIAR BUCKET DE STORAGE PARA ANEXOS DO INVENTÁRIO
-- =====================================================

-- Criar bucket público (ou privado, dependendo da necessidade)
INSERT INTO storage.buckets (id, name, public)
VALUES ('inventario-anexos', 'inventario-anexos', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. POLÍTICAS DE ACESSO AO STORAGE
-- =====================================================

-- Permitir upload para usuários autenticados
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload" ON storage.objects;
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'inventario-anexos');

-- Permitir leitura para usuários autenticados
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar anexos" ON storage.objects;
CREATE POLICY "Usuários autenticados podem visualizar anexos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'inventario-anexos');

-- Permitir atualização para usuários autenticados
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar anexos" ON storage.objects;
CREATE POLICY "Usuários autenticados podem atualizar anexos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'inventario-anexos');

-- Permitir exclusão para usuários autenticados
DROP POLICY IF EXISTS "Usuários autenticados podem excluir anexos" ON storage.objects;
CREATE POLICY "Usuários autenticados podem excluir anexos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'inventario-anexos');

-- =====================================================
-- 4. FUNÇÃO PARA VALIDAR TIPO DE ARQUIVO
-- =====================================================

CREATE OR REPLACE FUNCTION validar_tipo_arquivo_inventario(nome_arquivo TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  extensao TEXT;
BEGIN
  -- Extrair extensão do arquivo (case insensitive)
  extensao := LOWER(SUBSTRING(nome_arquivo FROM '\.([^.]+)$'));
  
  -- Permitir: PDF, JPEG, JPG, PNG, GIF, BMP, WEBP
  RETURN extensao IN ('pdf', 'jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_tipo_arquivo_inventario IS 'Valida se o tipo de arquivo é permitido (PDF, JPEG, PNG, etc.)';

-- =====================================================
-- 5. ESTRUTURA JSON DOS ANEXOS
-- =====================================================

-- Estrutura esperada do array de anexos em itens.anexos:
-- [
--   {
--     "id": "uuid",
--     "nome": "nota_fiscal.pdf",
--     "tipo": "application/pdf",
--     "tamanho": 1024000,
--     "url": "caminho/no/storage",
--     "data_upload": "2026-01-05T10:00:00Z",
--     "usuario_upload": "uuid_usuario"
--   }
-- ]

-- =====================================================
-- 6. FUNÇÃO PARA ADICIONAR ANEXO AO ITEM
-- =====================================================

CREATE OR REPLACE FUNCTION adicionar_anexo_item(
  p_item_id UUID,
  p_anexo JSONB
)
RETURNS JSONB AS $$
DECLARE
  anexos_atuais JSONB;
  anexos_novos JSONB;
BEGIN
  -- Buscar anexos atuais
  SELECT anexos INTO anexos_atuais
  FROM itens
  WHERE id = p_item_id;
  
  -- Se não houver anexos, criar array vazio
  IF anexos_atuais IS NULL THEN
    anexos_atuais := '[]'::jsonb;
  END IF;
  
  -- Adicionar novo anexo ao array
  anexos_novos := anexos_atuais || jsonb_build_array(p_anexo);
  
  -- Atualizar item
  UPDATE itens
  SET anexos = anexos_novos,
      updated_at = NOW()
  WHERE id = p_item_id;
  
  RETURN anexos_novos;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION adicionar_anexo_item IS 'Adiciona um novo anexo ao array de anexos do item';

-- =====================================================
-- 7. FUNÇÃO PARA REMOVER ANEXO DO ITEM
-- =====================================================

CREATE OR REPLACE FUNCTION remover_anexo_item(
  p_item_id UUID,
  p_anexo_id UUID
)
RETURNS JSONB AS $$
DECLARE
  anexos_atuais JSONB;
  anexos_novos JSONB;
BEGIN
  -- Buscar anexos atuais
  SELECT anexos INTO anexos_atuais
  FROM itens
  WHERE id = p_item_id;
  
  -- Se não houver anexos, retornar array vazio
  IF anexos_atuais IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  
  -- Remover anexo do array (filtrar por id)
  SELECT jsonb_agg(elem)
  INTO anexos_novos
  FROM jsonb_array_elements(anexos_atuais) elem
  WHERE elem->>'id' != p_anexo_id::text;
  
  -- Se todos foram removidos, garantir array vazio
  IF anexos_novos IS NULL THEN
    anexos_novos := '[]'::jsonb;
  END IF;
  
  -- Atualizar item
  UPDATE itens
  SET anexos = anexos_novos,
      updated_at = NOW()
  WHERE id = p_item_id;
  
  RETURN anexos_novos;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION remover_anexo_item IS 'Remove um anexo específico do array de anexos do item';

-- =====================================================
-- 8. VIEW PARA LISTAR ITENS COM CONTAGEM DE ANEXOS
-- =====================================================

CREATE OR REPLACE VIEW vw_itens_com_anexos AS
SELECT 
  i.*,
  COALESCE(jsonb_array_length(i.anexos), 0) as total_anexos,
  CASE 
    WHEN jsonb_array_length(i.anexos) > 0 THEN TRUE
    ELSE FALSE
  END as tem_anexos
FROM itens i;

COMMENT ON VIEW vw_itens_com_anexos IS 'Itens com informação sobre quantidade de anexos';

-- =====================================================
-- 9. TRIGGER PARA LIMPAR STORAGE QUANDO ITEM É EXCLUÍDO
-- =====================================================

CREATE OR REPLACE FUNCTION limpar_anexos_item_excluido()
RETURNS TRIGGER AS $$
DECLARE
  anexo JSONB;
  caminho_storage TEXT;
BEGIN
  -- Para cada anexo do item excluído
  FOR anexo IN SELECT * FROM jsonb_array_elements(OLD.anexos)
  LOOP
    -- Extrair caminho do storage
    caminho_storage := anexo->>'url';
    
    -- Deletar do storage (nota: isso requer extensão pg_net ou função customizada)
    -- Por segurança, apenas logar - a limpeza pode ser feita manualmente ou via API
    RAISE NOTICE 'Item excluído - anexo para remover: %', caminho_storage;
  END LOOP;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_limpar_anexos_item ON itens;
CREATE TRIGGER trigger_limpar_anexos_item
  BEFORE DELETE ON itens
  FOR EACH ROW
  EXECUTE FUNCTION limpar_anexos_item_excluido();

-- =====================================================
-- 10. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE itens IS 'Itens do inventário com suporte a anexos (PDFs, imagens)';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

-- INSTRUÇÕES DE USO:
-- 1. Execute este script no Supabase SQL Editor
-- 2. Verifique se o bucket 'inventario-anexos' foi criado em Storage
-- 3. Configure as políticas de acesso conforme necessidade
-- 4. Atualize o frontend para permitir upload/download de arquivos
-- 5. Tipos de arquivo permitidos: PDF, JPEG, JPG, PNG, GIF, BMP, WEBP

-- ESTRUTURA DO ANEXO:
-- {
--   "id": "uuid-gerado",
--   "nome": "arquivo.pdf",
--   "tipo": "application/pdf",
--   "tamanho": 1024000,
--   "url": "caminho/no/storage",
--   "data_upload": "2026-01-05T10:00:00Z",
--   "usuario_upload": "uuid_usuario"
-- }
