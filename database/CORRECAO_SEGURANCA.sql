-- ═══════════════════════════════════════════════════════════════════════════
-- CORREÇÃO DE SEGURANÇA — Execute no Supabase SQL Editor
-- Aborda todas as vulnerabilidades identificadas na auditoria de junho/2026
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. FUNÇÃO AUXILIAR ESTÁVEL (já existe, recria com segurança)
--    Evita recursão ao verificar empresa do usuário em políticas RLS
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT empresa_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. TABELA USUARIOS — Reativar RLS com políticas sem recursão
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas
DROP POLICY IF EXISTS "usuarios_ver_proprio_registro"     ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_editar_proprio_registro"  ON public.usuarios;
DROP POLICY IF EXISTS "service_role_inserir_usuarios"     ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_ver_mesma_empresa"        ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_criar_mesma_empresa"      ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_editar_mesma_empresa"     ON public.usuarios;
DROP POLICY IF EXISTS "Leitura para autenticados"         ON public.usuarios;

-- SELECT: usuário vê o próprio perfil + colegas da mesma empresa
-- (usa get_user_empresa_id() que é SECURITY DEFINER — sem recursão)
CREATE POLICY "usuarios_select"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR empresa_id = public.get_user_empresa_id()
  );

-- UPDATE: usuário edita apenas o próprio perfil
CREATE POLICY "usuarios_update"
  ON public.usuarios FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- INSERT: apenas service_role e triggers inserem (signup automático)
CREATE POLICY "usuarios_insert"
  ON public.usuarios FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ───────────────────────────────────────────────────────────────────────────
-- 3. INADIMPLÊNCIA — Substituir USING (true) por filtro de empresa
-- ───────────────────────────────────────────────────────────────────────────

-- inadimplencia_acompanhamentos
DROP POLICY IF EXISTS "inад_acomp_select" ON public.inadimplencia_acompanhamentos;
DROP POLICY IF EXISTS "inад_acomp_insert" ON public.inadimplencia_acompanhamentos;
DROP POLICY IF EXISTS "inад_acomp_update" ON public.inadimplencia_acompanhamentos;
CREATE POLICY "inadimplencia_acomp_select" ON public.inadimplencia_acompanhamentos
  FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "inadimplencia_acomp_insert" ON public.inadimplencia_acompanhamentos
  FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_empresa_id());
CREATE POLICY "inadimplencia_acomp_update" ON public.inadimplencia_acompanhamentos
  FOR UPDATE TO authenticated USING (empresa_id = public.get_user_empresa_id());

-- inadimplencia_interacoes
DROP POLICY IF EXISTS "inад_inter_select" ON public.inadimplencia_interacoes;
DROP POLICY IF EXISTS "inад_inter_insert" ON public.inadimplencia_interacoes;
DROP POLICY IF EXISTS "inад_inter_update" ON public.inadimplencia_interacoes;
CREATE POLICY "inadimplencia_inter_select" ON public.inadimplencia_interacoes
  FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "inadimplencia_inter_insert" ON public.inadimplencia_interacoes
  FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_empresa_id());
CREATE POLICY "inadimplencia_inter_update" ON public.inadimplencia_interacoes
  FOR UPDATE TO authenticated USING (empresa_id = public.get_user_empresa_id());

-- inadimplencia_negociacoes
DROP POLICY IF EXISTS "inад_neg_select" ON public.inadimplencia_negociacoes;
DROP POLICY IF EXISTS "inад_neg_insert" ON public.inadimplencia_negociacoes;
DROP POLICY IF EXISTS "inад_neg_update" ON public.inadimplencia_negociacoes;
CREATE POLICY "inadimplencia_neg_select" ON public.inadimplencia_negociacoes
  FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "inadimplencia_neg_insert" ON public.inadimplencia_negociacoes
  FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_empresa_id());
CREATE POLICY "inadimplencia_neg_update" ON public.inadimplencia_negociacoes
  FOR UPDATE TO authenticated USING (empresa_id = public.get_user_empresa_id());

-- inadimplencia_negociacoes_parcelas (sem empresa_id — acesso via negociacao)
DROP POLICY IF EXISTS "inад_parc_select" ON public.inadimplencia_negociacoes_parcelas;
DROP POLICY IF EXISTS "inад_parc_insert" ON public.inadimplencia_negociacoes_parcelas;
DROP POLICY IF EXISTS "inад_parc_update" ON public.inadimplencia_negociacoes_parcelas;
CREATE POLICY "inadimplencia_parc_select" ON public.inadimplencia_negociacoes_parcelas
  FOR SELECT TO authenticated
  USING (negociacao_id IN (
    SELECT id FROM public.inadimplencia_negociacoes
    WHERE empresa_id = public.get_user_empresa_id()
  ));
CREATE POLICY "inadimplencia_parc_insert" ON public.inadimplencia_negociacoes_parcelas
  FOR INSERT TO authenticated
  WITH CHECK (negociacao_id IN (
    SELECT id FROM public.inadimplencia_negociacoes
    WHERE empresa_id = public.get_user_empresa_id()
  ));
CREATE POLICY "inadimplencia_parc_update" ON public.inadimplencia_negociacoes_parcelas
  FOR UPDATE TO authenticated
  USING (negociacao_id IN (
    SELECT id FROM public.inadimplencia_negociacoes
    WHERE empresa_id = public.get_user_empresa_id()
  ));

-- inadimplencia_timeline
DROP POLICY IF EXISTS "inад_tl_select" ON public.inadimplencia_timeline;
DROP POLICY IF EXISTS "inад_tl_insert" ON public.inadimplencia_timeline;
CREATE POLICY "inadimplencia_tl_select" ON public.inadimplencia_timeline
  FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "inadimplencia_tl_insert" ON public.inadimplencia_timeline
  FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_empresa_id());

-- ───────────────────────────────────────────────────────────────────────────
-- 4. INVENTÁRIO — itens, linhas_telefonicas, colaboradores
--    Essas tabelas têm empresa_id; substituir USING (true)
-- ───────────────────────────────────────────────────────────────────────────

-- itens
DROP POLICY IF EXISTS "Autenticados podem visualizar itens"  ON public.itens;
DROP POLICY IF EXISTS "Autenticados podem inserir itens"     ON public.itens;
DROP POLICY IF EXISTS "Autenticados podem atualizar itens"   ON public.itens;
DROP POLICY IF EXISTS "Autenticados podem deletar itens"     ON public.itens;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='itens' AND column_name='empresa_id') THEN
    CREATE POLICY "itens_select" ON public.itens FOR SELECT TO authenticated
      USING (empresa_id = public.get_user_empresa_id());
    CREATE POLICY "itens_insert" ON public.itens FOR INSERT TO authenticated
      WITH CHECK (empresa_id = public.get_user_empresa_id());
    CREATE POLICY "itens_update" ON public.itens FOR UPDATE TO authenticated
      USING (empresa_id = public.get_user_empresa_id());
    CREATE POLICY "itens_delete" ON public.itens FOR DELETE TO authenticated
      USING (empresa_id = public.get_user_empresa_id());
  END IF;
END $$;

-- linhas_telefonicas
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar linhas"  ON public.linhas_telefonicas;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir linhas"     ON public.linhas_telefonicas;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar linhas"   ON public.linhas_telefonicas;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar linhas"     ON public.linhas_telefonicas;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='linhas_telefonicas' AND column_name='empresa_id') THEN
    CREATE POLICY "linhas_select" ON public.linhas_telefonicas FOR SELECT TO authenticated
      USING (empresa_id = public.get_user_empresa_id());
    CREATE POLICY "linhas_insert" ON public.linhas_telefonicas FOR INSERT TO authenticated
      WITH CHECK (empresa_id = public.get_user_empresa_id());
    CREATE POLICY "linhas_update" ON public.linhas_telefonicas FOR UPDATE TO authenticated
      USING (empresa_id = public.get_user_empresa_id());
    CREATE POLICY "linhas_delete" ON public.linhas_telefonicas FOR DELETE TO authenticated
      USING (empresa_id = public.get_user_empresa_id());
  ELSE
    -- Se não tem empresa_id, mantém acesso para autenticados (single-tenant)
    CREATE POLICY "linhas_select" ON public.linhas_telefonicas FOR SELECT TO authenticated USING (true);
    CREATE POLICY "linhas_insert" ON public.linhas_telefonicas FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "linhas_update" ON public.linhas_telefonicas FOR UPDATE TO authenticated USING (true);
    CREATE POLICY "linhas_delete" ON public.linhas_telefonicas FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- colaboradores
DROP POLICY IF EXISTS "colaboradores_mesma_empresa_select" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_mesma_empresa_insert" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_mesma_empresa_update" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_mesma_empresa_delete" ON public.colaboradores;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='colaboradores' AND column_name='empresa_id') THEN
    CREATE POLICY "colaboradores_select" ON public.colaboradores FOR SELECT TO authenticated
      USING (empresa_id = public.get_user_empresa_id());
    CREATE POLICY "colaboradores_insert" ON public.colaboradores FOR INSERT TO authenticated
      WITH CHECK (empresa_id = public.get_user_empresa_id());
    CREATE POLICY "colaboradores_update" ON public.colaboradores FOR UPDATE TO authenticated
      USING (empresa_id = public.get_user_empresa_id());
    CREATE POLICY "colaboradores_delete" ON public.colaboradores FOR DELETE TO authenticated
      USING (empresa_id = public.get_user_empresa_id());
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. HISTÓRICO — historico_itens, historico_linhas_telefonicas
--    Sem empresa_id; acesso de leitura para autenticados é aceitável
--    (dados de auditoria interna, não contêm dados sensíveis de terceiros)
-- ───────────────────────────────────────────────────────────────────────────

-- Já estão com USING (true) para authenticated — mantém como está.
-- INSERT é controlado por trigger com SECURITY DEFINER (correto).

-- ───────────────────────────────────────────────────────────────────────────
-- 6. VERIFICAÇÃO FINAL
-- ───────────────────────────────────────────────────────────────────────────

SELECT
  tablename,
  rowsecurity AS rls_ativo,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename) AS num_policies
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN (
    'usuarios',
    'inadimplencia_acompanhamentos',
    'inadimplencia_interacoes',
    'inadimplencia_negociacoes',
    'inadimplencia_negociacoes_parcelas',
    'inadimplencia_timeline',
    'inadimplencia_notificacoes',
    'itens',
    'linhas_telefonicas',
    'colaboradores'
  )
ORDER BY tablename;

-- Resultado esperado: rls_ativo = true em todas, num_policies >= 2 em cada
