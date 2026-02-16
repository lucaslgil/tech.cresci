-- Adicionar coluna logo_url em empresas e função RPC para atualizar a logo

ALTER TABLE IF EXISTS empresas
ADD COLUMN IF NOT EXISTS logo_url text;

-- Coluna para armazenamento de cor de fundo para a logo (opcional)
ALTER TABLE IF EXISTS empresas
ADD COLUMN IF NOT EXISTS logo_bg text;

-- Função RPC para setar logo_url e logo_bg por empresa
CREATE OR REPLACE FUNCTION rpc_set_empresa_logo(p_empresa_id bigint, p_logo_url text, p_logo_bg text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE empresas
  SET logo_url = p_logo_url,
      logo_bg = COALESCE(p_logo_bg, logo_bg)
  WHERE id = p_empresa_id;

  IF NOT FOUND THEN
    RAISE NOTICE 'Empresa com id % não encontrada', p_empresa_id;
  END IF;
END;
$$;

-- Grant execute to anon and authenticated roles if using Supabase (adjust roles as needed)
-- GRANT EXECUTE ON FUNCTION rpc_set_empresa_logo(bigint, text, text) TO authenticated;
-- GRANT EXECUTE ON FUNCTION rpc_set_empresa_logo(bigint, text, text) TO anon;
