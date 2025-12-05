-- ====================================
-- MELHORIAS NO CONTROLE DE VENDAS
-- Adicionar campo bloqueado e melhorar fluxo
-- Data: 03/12/2025
-- ====================================

BEGIN;

-- ====================================
-- 1. ADICIONAR CAMPO BLOQUEADO
-- ====================================

-- Adicionar campo bloqueado na tabela vendas
ALTER TABLE vendas 
ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN DEFAULT FALSE;

-- Adicionar campo bloqueado_por (usuário que bloqueou)
ALTER TABLE vendas 
ADD COLUMN IF NOT EXISTS bloqueado_por UUID REFERENCES auth.users(id);

-- Adicionar campo bloqueado_em (data/hora do bloqueio)
ALTER TABLE vendas 
ADD COLUMN IF NOT EXISTS bloqueado_em TIMESTAMP WITH TIME ZONE;

-- Adicionar campo motivo_bloqueio
ALTER TABLE vendas 
ADD COLUMN IF NOT EXISTS motivo_bloqueio TEXT;

-- Adicionar comentário explicativo
COMMENT ON COLUMN vendas.bloqueado IS 'Indica se a venda está bloqueada para edição';
COMMENT ON COLUMN vendas.bloqueado_por IS 'Usuário que bloqueou a venda';
COMMENT ON COLUMN vendas.bloqueado_em IS 'Data e hora do bloqueio';
COMMENT ON COLUMN vendas.motivo_bloqueio IS 'Motivo do bloqueio da venda';

-- ====================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- ====================================

CREATE INDEX IF NOT EXISTS idx_vendas_bloqueado ON vendas(bloqueado);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON vendas(status);
CREATE INDEX IF NOT EXISTS idx_vendas_numero ON vendas(numero);

-- ====================================
-- 3. ATUALIZAR POLÍTICAS RLS
-- ====================================

-- Atualizar política de UPDATE para considerar bloqueio
DROP POLICY IF EXISTS "Permitir atualização de vendas" ON vendas;
CREATE POLICY "Permitir atualização de vendas"
ON vendas FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND bloqueado = FALSE  -- Não permite editar se estiver bloqueada
);

-- Criar política específica para bloquear/desbloquear (apenas admin ou criador)
DROP POLICY IF EXISTS "Permitir bloquear vendas" ON vendas;
CREATE POLICY "Permitir bloquear vendas"
ON vendas FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  -- Permite atualizar campo bloqueado independente do status atual
);

-- ====================================
-- 4. CRIAR FUNÇÃO PARA BLOQUEAR VENDA
-- ====================================

CREATE OR REPLACE FUNCTION bloquear_venda(
  p_venda_id BIGINT,
  p_motivo TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_venda RECORD;
BEGIN
  -- Buscar venda
  SELECT * INTO v_venda FROM vendas WHERE id = p_venda_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'sucesso', false,
      'mensagem', 'Venda não encontrada'
    );
  END IF;
  
  -- Verificar se já está bloqueada
  IF v_venda.bloqueado = TRUE THEN
    RETURN jsonb_build_object(
      'sucesso', false,
      'mensagem', 'Venda já está bloqueada'
    );
  END IF;
  
  -- Bloquear venda
  UPDATE vendas 
  SET 
    bloqueado = TRUE,
    bloqueado_por = auth.uid(),
    bloqueado_em = NOW(),
    motivo_bloqueio = p_motivo
  WHERE id = p_venda_id;
  
  RETURN jsonb_build_object(
    'sucesso', true,
    'mensagem', 'Venda bloqueada com sucesso'
  );
END;
$$;

-- ====================================
-- 5. CRIAR FUNÇÃO PARA DESBLOQUEAR VENDA
-- ====================================

CREATE OR REPLACE FUNCTION desbloquear_venda(
  p_venda_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_venda RECORD;
BEGIN
  -- Buscar venda
  SELECT * INTO v_venda FROM vendas WHERE id = p_venda_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'sucesso', false,
      'mensagem', 'Venda não encontrada'
    );
  END IF;
  
  -- Verificar se está bloqueada
  IF v_venda.bloqueado = FALSE THEN
    RETURN jsonb_build_object(
      'sucesso', false,
      'mensagem', 'Venda não está bloqueada'
    );
  END IF;
  
  -- Desbloquear venda
  UPDATE vendas 
  SET 
    bloqueado = FALSE,
    bloqueado_por = NULL,
    bloqueado_em = NULL,
    motivo_bloqueio = NULL
  WHERE id = p_venda_id;
  
  RETURN jsonb_build_object(
    'sucesso', true,
    'mensagem', 'Venda desbloqueada com sucesso'
  );
END;
$$;

-- ====================================
-- 6. CRIAR TRIGGER PARA BLOQUEAR AUTOMATICAMENTE
-- ====================================

-- Bloquear automaticamente quando faturar
CREATE OR REPLACE FUNCTION trigger_bloquear_ao_faturar()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'FATURADO' AND OLD.status != 'FATURADO' THEN
    NEW.bloqueado := TRUE;
    NEW.bloqueado_por := auth.uid();
    NEW.bloqueado_em := NOW();
    NEW.motivo_bloqueio := 'Bloqueado automaticamente ao faturar';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bloquear_ao_faturar ON vendas;
CREATE TRIGGER trg_bloquear_ao_faturar
  BEFORE UPDATE ON vendas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_bloquear_ao_faturar();

COMMIT;

-- ====================================
-- VERIFICAÇÃO
-- ====================================

-- Verificar se colunas foram criadas
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'vendas'
  AND column_name IN ('bloqueado', 'bloqueado_por', 'bloqueado_em', 'motivo_bloqueio');

-- Verificar funções criadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('bloquear_venda', 'desbloquear_venda')
ORDER BY routine_name;
