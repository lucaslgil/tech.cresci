-- ═══════════════════════════════════════════════════════════════════════════
-- CORREÇÃO DE SEGURANÇA V2 — Execute no Supabase SQL Editor
-- Resolve: security_definer_view (17) + rls_disabled_in_public (13+)
--          + sensitive_columns_exposed (1)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- PARTE 1: SECURITY DEFINER VIEWS
-- Problema: Views com SECURITY DEFINER executam com permissões do criador,
-- ignorando o RLS do usuário que faz a consulta.
-- Solução: security_invoker = true — a view passa a usar as permissões
-- e o RLS do usuário que a consulta (comportamento correto).
-- ───────────────────────────────────────────────────────────────────────────

ALTER VIEW public.vw_regras_tributacao_ordenadas   SET (security_invoker = true);
ALTER VIEW public.vw_itens_com_anexos              SET (security_invoker = true);
ALTER VIEW public.v_franquia_unidades_ranking      SET (security_invoker = true);
ALTER VIEW public.vw_notificacoes_girabot          SET (security_invoker = true);
ALTER VIEW public.vw_cobranca_clientes             SET (security_invoker = true);
ALTER VIEW public.v_franquia_unidades_resumo       SET (security_invoker = true);
ALTER VIEW public.vw_produtos_com_tributacao       SET (security_invoker = true);
ALTER VIEW public.produtos_view                    SET (security_invoker = true);
ALTER VIEW public.vw_usuarios_empresas             SET (security_invoker = true);
ALTER VIEW public.vw_produtos_completo             SET (security_invoker = true);
ALTER VIEW public.vw_vendas_pdv                    SET (security_invoker = true);
ALTER VIEW public.vw_caixa_resumo_diario           SET (security_invoker = true);
ALTER VIEW public.vw_clientes_com_operacao_padrao  SET (security_invoker = true);
ALTER VIEW public.vw_notas_fiscais_resumo          SET (security_invoker = true);
ALTER VIEW public.vw_certificados_vencimento       SET (security_invoker = true);
ALTER VIEW public.vw_vendas_resumo                 SET (security_invoker = true);
ALTER VIEW public.vw_clientes_completo             SET (security_invoker = true);

-- ───────────────────────────────────────────────────────────────────────────
-- PARTE 2: TABELAS DE REFERÊNCIA FISCAL (lookup / dados públicos do governo)
-- Estas tabelas contêm dados de referência (NCM, CEST, etc.) que qualquer
-- usuário autenticado pode ler — sem escrita direta via API.
-- ───────────────────────────────────────────────────────────────────────────

-- ncm_tabela
ALTER TABLE public.ncm_tabela ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ncm_leitura_autenticados" ON public.ncm_tabela;
CREATE POLICY "ncm_leitura_autenticados"
  ON public.ncm_tabela FOR SELECT TO authenticated USING (true);

-- cest_tabela
ALTER TABLE public.cest_tabela ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cest_leitura_autenticados" ON public.cest_tabela;
CREATE POLICY "cest_leitura_autenticados"
  ON public.cest_tabela FOR SELECT TO authenticated USING (true);

-- validacoes_fiscais
ALTER TABLE public.validacoes_fiscais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "validacoes_fiscais_leitura" ON public.validacoes_fiscais;
CREATE POLICY "validacoes_fiscais_leitura"
  ON public.validacoes_fiscais FOR SELECT TO authenticated USING (true);

-- reforma_aliquotas_ncm (tabela da reforma tributária)
ALTER TABLE public.reforma_aliquotas_ncm ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reforma_aliquotas_leitura" ON public.reforma_aliquotas_ncm;
CREATE POLICY "reforma_aliquotas_leitura"
  ON public.reforma_aliquotas_ncm FOR SELECT TO authenticated USING (true);

-- reforma_cronograma_transicao (tabela da reforma tributária)
ALTER TABLE public.reforma_cronograma_transicao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reforma_cronograma_leitura" ON public.reforma_cronograma_transicao;
CREATE POLICY "reforma_cronograma_leitura"
  ON public.reforma_cronograma_transicao FOR SELECT TO authenticated USING (true);

-- formas_pagamento (referência de meios de pagamento)
ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "formas_pagamento_leitura" ON public.formas_pagamento;
CREATE POLICY "formas_pagamento_leitura"
  ON public.formas_pagamento FOR SELECT TO authenticated USING (true);

-- planos_parcelamento (referência de parcelamentos)
ALTER TABLE public.planos_parcelamento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "planos_parcelamento_leitura" ON public.planos_parcelamento;
CREATE POLICY "planos_parcelamento_leitura"
  ON public.planos_parcelamento FOR SELECT TO authenticated USING (true);

-- ───────────────────────────────────────────────────────────────────────────
-- PARTE 3: TABELAS COM DADOS DA EMPRESA (filtro por empresa_id)
-- ───────────────────────────────────────────────────────────────────────────

-- contas_bancarias
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contas_bancarias_select" ON public.contas_bancarias;
DROP POLICY IF EXISTS "contas_bancarias_insert" ON public.contas_bancarias;
DROP POLICY IF EXISTS "contas_bancarias_update" ON public.contas_bancarias;
DROP POLICY IF EXISTS "contas_bancarias_delete" ON public.contas_bancarias;
CREATE POLICY "contas_bancarias_select" ON public.contas_bancarias
  FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "contas_bancarias_insert" ON public.contas_bancarias
  FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_empresa_id());
CREATE POLICY "contas_bancarias_update" ON public.contas_bancarias
  FOR UPDATE TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "contas_bancarias_delete" ON public.contas_bancarias
  FOR DELETE TO authenticated USING (empresa_id = public.get_user_empresa_id());

-- parametros_financeiros
ALTER TABLE public.parametros_financeiros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parametros_financeiros_select" ON public.parametros_financeiros;
DROP POLICY IF EXISTS "parametros_financeiros_insert" ON public.parametros_financeiros;
DROP POLICY IF EXISTS "parametros_financeiros_update" ON public.parametros_financeiros;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='parametros_financeiros' AND column_name='empresa_id') THEN
    CREATE POLICY "parametros_financeiros_select" ON public.parametros_financeiros
      FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
    CREATE POLICY "parametros_financeiros_insert" ON public.parametros_financeiros
      FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_empresa_id());
    CREATE POLICY "parametros_financeiros_update" ON public.parametros_financeiros
      FOR UPDATE TO authenticated USING (empresa_id = public.get_user_empresa_id());
  ELSE
    CREATE POLICY "parametros_financeiros_select" ON public.parametros_financeiros
      FOR SELECT TO authenticated USING (true);
    CREATE POLICY "parametros_financeiros_insert" ON public.parametros_financeiros
      FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "parametros_financeiros_update" ON public.parametros_financeiros
      FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- produtos_precos_especiais
ALTER TABLE public.produtos_precos_especiais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "precos_especiais_select" ON public.produtos_precos_especiais;
DROP POLICY IF EXISTS "precos_especiais_insert" ON public.produtos_precos_especiais;
DROP POLICY IF EXISTS "precos_especiais_update" ON public.produtos_precos_especiais;
DROP POLICY IF EXISTS "precos_especiais_delete" ON public.produtos_precos_especiais;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='produtos_precos_especiais' AND column_name='empresa_id') THEN
    CREATE POLICY "precos_especiais_select" ON public.produtos_precos_especiais
      FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
    CREATE POLICY "precos_especiais_insert" ON public.produtos_precos_especiais
      FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_empresa_id());
    CREATE POLICY "precos_especiais_update" ON public.produtos_precos_especiais
      FOR UPDATE TO authenticated USING (empresa_id = public.get_user_empresa_id());
    CREATE POLICY "precos_especiais_delete" ON public.produtos_precos_especiais
      FOR DELETE TO authenticated USING (empresa_id = public.get_user_empresa_id());
  ELSE
    CREATE POLICY "precos_especiais_select" ON public.produtos_precos_especiais
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- empresa_membros
-- NOTA: empresa_id aqui é UUID (referência a auth.users/empresas UUID), não BIGINT.
-- A política correta é filtrar pelo usuario_id (quem é membro).
ALTER TABLE public.empresa_membros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "empresa_membros_select" ON public.empresa_membros;
DROP POLICY IF EXISTS "empresa_membros_insert" ON public.empresa_membros;
DROP POLICY IF EXISTS "empresa_membros_update" ON public.empresa_membros;
DROP POLICY IF EXISTS "empresa_membros_delete" ON public.empresa_membros;
CREATE POLICY "empresa_membros_select" ON public.empresa_membros
  FOR SELECT TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "empresa_membros_insert" ON public.empresa_membros
  FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "empresa_membros_update" ON public.empresa_membros
  FOR UPDATE TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "empresa_membros_delete" ON public.empresa_membros
  FOR DELETE TO authenticated USING (usuario_id = auth.uid());

-- pdv_sync_log (log interno do PDV — leitura restrita à empresa)
ALTER TABLE public.pdv_sync_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pdv_sync_log_select" ON public.pdv_sync_log;
DROP POLICY IF EXISTS "pdv_sync_log_insert" ON public.pdv_sync_log;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='pdv_sync_log' AND column_name='empresa_id') THEN
    CREATE POLICY "pdv_sync_log_select" ON public.pdv_sync_log
      FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
    CREATE POLICY "pdv_sync_log_insert" ON public.pdv_sync_log
      FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_empresa_id());
  ELSE
    CREATE POLICY "pdv_sync_log_select" ON public.pdv_sync_log
      FOR SELECT TO authenticated USING (true);
    CREATE POLICY "pdv_sync_log_insert" ON public.pdv_sync_log
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- PARTE 4: TABELAS SENSÍVEIS DE COLABORADORES
-- ───────────────────────────────────────────────────────────────────────────

-- colaborador_termos (termos assinados — acesso restrito à empresa)
ALTER TABLE public.colaborador_termos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "colaborador_termos_select" ON public.colaborador_termos;
DROP POLICY IF EXISTS "colaborador_termos_insert" ON public.colaborador_termos;
DROP POLICY IF EXISTS "colaborador_termos_update" ON public.colaborador_termos;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='colaborador_termos' AND column_name='empresa_id') THEN
    CREATE POLICY "colaborador_termos_select" ON public.colaborador_termos
      FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
    CREATE POLICY "colaborador_termos_insert" ON public.colaborador_termos
      FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_empresa_id());
    CREATE POLICY "colaborador_termos_update" ON public.colaborador_termos
      FOR UPDATE TO authenticated USING (empresa_id = public.get_user_empresa_id());
  ELSE
    CREATE POLICY "colaborador_termos_select" ON public.colaborador_termos
      FOR SELECT TO authenticated USING (true);
    CREATE POLICY "colaborador_termos_insert" ON public.colaborador_termos
      FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "colaborador_termos_update" ON public.colaborador_termos
      FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- colaborador_assinatura_tokens — CRÍTICO: contém tokens de assinatura
-- Nenhum usuário deve acessar tokens de outros via API REST
-- Apenas service_role (edge functions) e o próprio colaborador (por token único)
ALTER TABLE public.colaborador_assinatura_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tokens_assinatura_sem_acesso_direto" ON public.colaborador_assinatura_tokens;
-- Bloqueia todo acesso direto via API REST (service_role bypassa isso, edge functions continuam funcionando)
CREATE POLICY "tokens_assinatura_sem_acesso_direto"
  ON public.colaborador_assinatura_tokens FOR SELECT TO authenticated USING (false);

-- ───────────────────────────────────────────────────────────────────────────
-- PARTE 5: TABELA DE BACKUP (acesso bloqueado — somente service_role)
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.empresas_backup ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "empresas_backup_bloqueado" ON public.empresas_backup;
-- Nenhum usuário autenticado acessa backup diretamente
CREATE POLICY "empresas_backup_bloqueado"
  ON public.empresas_backup FOR ALL TO authenticated USING (false);

-- ───────────────────────────────────────────────────────────────────────────
-- VERIFICAÇÃO FINAL
-- ───────────────────────────────────────────────────────────────────────────

SELECT
  tablename,
  rowsecurity AS rls_ativo,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename) AS num_policies
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN (
    'formas_pagamento', 'planos_parcelamento', 'ncm_tabela', 'cest_tabela',
    'validacoes_fiscais', 'reforma_aliquotas_ncm', 'reforma_cronograma_transicao',
    'contas_bancarias', 'parametros_financeiros', 'produtos_precos_especiais',
    'empresa_membros', 'pdv_sync_log',
    'colaborador_termos', 'colaborador_assinatura_tokens', 'empresas_backup'
  )
ORDER BY tablename;

-- Verificar views com security_invoker
SELECT viewname, definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN (
    'vw_cobranca_clientes', 'vw_notificacoes_girabot', 'vw_usuarios_empresas',
    'vw_produtos_completo', 'vw_vendas_resumo', 'produtos_view'
  );
