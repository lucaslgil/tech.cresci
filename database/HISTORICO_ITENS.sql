-- ============================================================
-- HISTÓRICO DE VINCULAÇÕES DE ITENS DO INVENTÁRIO
-- Registra automaticamente toda troca de responsável em itens
-- ============================================================

-- Tabela de histórico
CREATE TABLE IF NOT EXISTS public.historico_itens (
  id             BIGSERIAL PRIMARY KEY,
  item_id        UUID NOT NULL REFERENCES public.itens(id) ON DELETE CASCADE,
  campo_alterado VARCHAR(50) NOT NULL DEFAULT 'responsavel',
  valor_anterior TEXT,       -- nome do colaborador anterior (ou NULL se era sem responsável)
  valor_novo     TEXT,       -- nome do novo colaborador (ou NULL se removeu responsável)
  usuario_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_alteracao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.historico_itens IS
  'Histórico completo de vinculações de responsáveis aos itens do inventário';

-- RLS
ALTER TABLE public.historico_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Autenticados podem visualizar histórico de itens" ON public.historico_itens;
CREATE POLICY "Autenticados podem visualizar histórico de itens"
  ON public.historico_itens FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Sistema pode inserir histórico de itens" ON public.historico_itens;
CREATE POLICY "Sistema pode inserir histórico de itens"
  ON public.historico_itens FOR INSERT TO authenticated WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_historico_itens_item_id   ON public.historico_itens(item_id);
CREATE INDEX IF NOT EXISTS idx_historico_itens_data      ON public.historico_itens(data_alteracao DESC);
CREATE INDEX IF NOT EXISTS idx_historico_itens_campo     ON public.historico_itens(campo_alterado);

-- ============================================================
-- TRIGGER: grava histórico toda vez que responsavel_id muda
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_item_responsavel_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nome_anterior TEXT;
  v_nome_novo     TEXT;
BEGIN
  IF OLD.responsavel_id IS DISTINCT FROM NEW.responsavel_id THEN

    IF OLD.responsavel_id IS NOT NULL THEN
      SELECT nome INTO v_nome_anterior
        FROM public.colaboradores
       WHERE id = OLD.responsavel_id;
    END IF;

    IF NEW.responsavel_id IS NOT NULL THEN
      SELECT nome INTO v_nome_novo
        FROM public.colaboradores
       WHERE id = NEW.responsavel_id;
    END IF;

    INSERT INTO public.historico_itens
      (item_id, campo_alterado, valor_anterior, valor_novo, usuario_id)
    VALUES
      (NEW.id, 'responsavel', v_nome_anterior, v_nome_novo, auth.uid());

  END IF;
  RETURN NEW;
END;
$$;

-- Recria o trigger para garantir versão atualizada
DROP TRIGGER IF EXISTS trigger_log_item_responsavel ON public.itens;
CREATE TRIGGER trigger_log_item_responsavel
  AFTER UPDATE OF responsavel_id ON public.itens
  FOR EACH ROW
  EXECUTE FUNCTION public.log_item_responsavel_change();
