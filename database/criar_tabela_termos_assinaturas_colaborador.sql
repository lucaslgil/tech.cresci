-- Migration: criar_tabela_termos_assinaturas_colaborador.sql
-- Propósito: criar estrutura para termos de responsabilidade e fluxo de assinatura
-- Instruções: rodar este script no SQL Editor do Supabase

-- Extensão para gen_random_uuid (Supabase normalmente já tem pgcrypto)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  END IF;
END$$;

-- Tipo de status para o termo
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'colab_term_status') THEN
    CREATE TYPE colab_term_status AS ENUM ('draft','company_signed','pending_collaborator_signature','signed','canceled');
  END IF;
END$$;

-- Tabela principal de termos vinculados a colaboradores e itens
CREATE TABLE IF NOT EXISTS colaborador_termos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL,
  item_id uuid,
  titulo text,
  conteudo jsonb,
  empresa_signed_url text,
  empresa_signed_at timestamptz,
  colaborador_signed_url text,
  colaborador_signed_at timestamptz,
  status colab_term_status DEFAULT 'draft',
  valor numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tokens de assinatura (link único) para colaborador assinar
CREATE TABLE IF NOT EXISTS colaborador_assinatura_tokens (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id uuid NOT NULL REFERENCES colaborador_termos(id) ON DELETE CASCADE,
  colaborador_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_colaborador_termos_colaborador ON colaborador_termos (colaborador_id);
CREATE INDEX IF NOT EXISTS idx_colaborador_termos_item ON colaborador_termos (item_id);
CREATE INDEX IF NOT EXISTS idx_assinatura_tokens_term ON colaborador_assinatura_tokens (term_id);

-- Trigger para manter updated_at
CREATE OR REPLACE FUNCTION colaborador_termos_updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_colaborador_termos_updated_at ON colaborador_termos;
CREATE TRIGGER trg_colaborador_termos_updated_at
  BEFORE UPDATE ON colaborador_termos
  FOR EACH ROW
  EXECUTE PROCEDURE colaborador_termos_updated_at_trigger();

-- Função: gerar token de assinatura para um termo (retorna o token UUID)
CREATE OR REPLACE FUNCTION gerar_token_assinatura(p_term_id uuid, p_valid_days integer DEFAULT 7)
RETURNS uuid AS $$
DECLARE
  v_token uuid;
  v_colab uuid;
BEGIN
  SELECT colaborador_id INTO v_colab FROM colaborador_termos WHERE id = p_term_id;
  IF v_colab IS NULL THEN
    RAISE EXCEPTION 'Termo não encontrado: %', p_term_id;
  END IF;

  INSERT INTO colaborador_assinatura_tokens (term_id, colaborador_id, expires_at)
  VALUES (p_term_id, v_colab, now() + (p_valid_days || ' days')::interval)
  RETURNING token INTO v_token;

  -- atualiza status para pendente, caso ainda esteja como company_signed
  UPDATE colaborador_termos
  SET status = 'pending_collaborator_signature'
  WHERE id = p_term_id AND status IN ('company_signed','draft');

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: marcar token como usado (após colaborador assinar)
-- Recebe token e URL do PDF assinado pelo colaborador
CREATE OR REPLACE FUNCTION confirmar_assinatura_colaborador(p_token uuid, p_signed_url text)
RETURNS TABLE(success boolean, message text) AS $$
DECLARE
  v_term uuid;
  v_used_at timestamptz;
BEGIN
  SELECT term_id, used_at INTO v_term, v_used_at FROM colaborador_assinatura_tokens WHERE token = p_token;
  IF v_term IS NULL THEN
    RETURN QUERY SELECT false, 'Token inválido';
    RETURN;
  END IF;

  IF v_used_at IS NOT NULL THEN
    RETURN QUERY SELECT false, 'Token já utilizado';
    RETURN;
  END IF;

  IF (SELECT expires_at < now() FROM colaborador_assinatura_tokens WHERE token = p_token) THEN
    RETURN QUERY SELECT false, 'Token expirado';
    RETURN;
  END IF;

  -- Atualiza termo com URL do documento assinado pelo colaborador e status
  UPDATE colaborador_termos
  SET colaborador_signed_url = p_signed_url,
      colaborador_signed_at = now(),
      status = 'signed',
      updated_at = now()
  WHERE id = v_term;

  -- Marca token como usado
  UPDATE colaborador_assinatura_tokens SET used_at = now() WHERE token = p_token;

  RETURN QUERY SELECT true, 'Assinatura confirmada';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função utilitária: registrar assinatura da empresa (por exemplo, quando a empresa já assinou antes de gerar link)
CREATE OR REPLACE FUNCTION registrar_assinatura_empresa(p_term_id uuid, p_empresa_signed_url text)
RETURNS void AS $$
BEGIN
  UPDATE colaborador_termos
  SET empresa_signed_url = p_empresa_signed_url,
      empresa_signed_at = now(),
      status = CASE WHEN colaborador_signed_url IS NULL THEN 'company_signed' ELSE 'signed' END,
      updated_at = now()
  WHERE id = p_term_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLÍTICAS EXEMPLO (RLS): adapte conforme seu modelo de auth/usuários
-- Habilitar RLS se desejar (apenas exemplo; avalie antes de aplicar)
-- ALTER TABLE colaborador_termos ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "select_own_terms" ON colaborador_termos
--   FOR SELECT USING (colaborador_id::text = auth.uid());
-- CREATE POLICY "insert_terms_auth" ON colaborador_termos
--   FOR INSERT WITH CHECK (true);

-- Uso recomendado (exemplos):
-- 1) Criar termo (ex.: via backend) e registrar assinatura da empresa:
-- INSERT INTO colaborador_termos (colaborador_id, item_id, titulo, conteudo, valor)
-- VALUES ('<colab-uuid>', '<item-uuid>', 'Termo de Responsabilidade', jsonb_build_object('modelo','termo_v1'), 0.00)
-- RETURNING id;
-- SELECT registrar_assinatura_empresa('<term-id-uuid>','https://.../empresa_assinada.pdf');

-- 2) Gerar token e link para envio ao colaborador (backend):
-- SELECT gerar_token_assinatura('<term-id-uuid>');
-- Link público: https://seu-site/assinatura/<token>

-- 3) Após o colaborador assinar e o front/backend enviar PDF final para storage,
-- chamar:
-- SELECT * FROM confirmar_assinatura_colaborador('<token-uuid>','https://.../term_signed_by_colab.pdf');

-- Observações de segurança:
-- - Nunca envie chaves privadas ao frontend.
-- - O endpoint que valida o token e grava o PDF final deve autenticar a chamada
--   (por exemplo, ser acessado apenas pela página de assinatura ou através de webhook
--   de um provedor de assinatura) e validar o token antes de aceitar a URL do arquivo.
