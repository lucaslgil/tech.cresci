-- =====================================================
-- MÓDULO: GESTÃO DE UNIDADES FRANQUEADAS
-- Versão: 1.0.0
-- Data: 2026-03-05
-- Descrição: Schema completo para gestão de unidades
--            da rede franqueada.
-- Sistema Multi-Tenant: Baseado em empresa_id
-- =====================================================

-- =====================================================
-- TABELA PRINCIPAL: franquia_unidades
-- =====================================================
CREATE TABLE IF NOT EXISTS franquia_unidades (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id                  BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

  -- Identificação
  codigo_unidade              VARCHAR(30) NOT NULL,
  nome_unidade                VARCHAR(200) NOT NULL,
  nome_fantasia               VARCHAR(200),
  status                      VARCHAR(30) NOT NULL DEFAULT 'implantacao'
                                CHECK (status IN (
                                  'prospeccao', 'pre_contrato', 'implantacao',
                                  'inauguracao', 'ativa', 'suspensa', 'encerrada'
                                )),
  data_abertura               DATE,
  data_assinatura_contrato    DATE,

  -- Franqueado principal
  nome_franqueado             VARCHAR(200) NOT NULL,
  cpf_cnpj_franqueado         VARCHAR(20),
  email_franqueado            VARCHAR(200),
  telefone_franqueado         VARCHAR(25),

  -- Endereço
  cep                         VARCHAR(10),
  rua                         VARCHAR(300),
  numero                      VARCHAR(20),
  complemento                 VARCHAR(100),
  bairro                      VARCHAR(150),
  cidade                      VARCHAR(150),
  estado                      VARCHAR(2),
  pais                        VARCHAR(50)  DEFAULT 'Brasil',
  latitude                    NUMERIC(10, 8),
  longitude                   NUMERIC(11, 8),

  -- Informações contratuais
  tipo_contrato               VARCHAR(100),
  prazo_contrato_meses        INTEGER,
  data_inicio_contrato        DATE,
  data_termino_contrato       DATE,
  taxa_franquia               NUMERIC(15, 2),
  royalties_percentual        NUMERIC(5, 2),
  fundo_marketing_percentual  NUMERIC(5, 2),
  taxa_tecnologica            NUMERIC(5, 2),

  -- Informações operacionais
  modelo_unidade              VARCHAR(30)
                                CHECK (
                                  modelo_unidade IN ('loja', 'quiosque', 'dark_kitchen', 'home_office', 'outro')
                                  OR modelo_unidade IS NULL
                                ),
  tamanho_loja_m2             NUMERIC(10, 2),
  capacidade_operacional      INTEGER,
  horario_funcionamento       JSONB DEFAULT '{}',

  -- Ciclo de vida
  etapa_atual                 VARCHAR(30) NOT NULL DEFAULT 'prospeccao'
                                CHECK (etapa_atual IN (
                                  'prospeccao', 'pre_contrato', 'implantacao',
                                  'inauguracao', 'operacao', 'suspensao', 'encerramento'
                                )),

  -- Metas financeiras
  faturamento_meta_mensal     NUMERIC(15, 2),

  -- Auditoria
  created_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by                  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by                  UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Unicidade por empresa
  CONSTRAINT unq_codigo_unidade_empresa UNIQUE (empresa_id, codigo_unidade)
);

COMMENT ON TABLE franquia_unidades IS 'Cadastro central das unidades franqueadas da rede';
COMMENT ON COLUMN franquia_unidades.codigo_unidade IS 'Código único da unidade por franqueadora (ex: FRA001)';
COMMENT ON COLUMN franquia_unidades.horario_funcionamento IS 'JSON com descrição dos horários: {"descricao": "Seg-Sex: 08h-18h"}';
COMMENT ON COLUMN franquia_unidades.status IS 'Status do ciclo de vida: prospeccao > pre_contrato > implantacao > inauguracao > ativa | suspensa | encerrada';
COMMENT ON COLUMN franquia_unidades.etapa_atual IS 'Etapa detalhada do ciclo operacional da unidade';


-- =====================================================
-- TABELA: Sócios/Investidores da Unidade
-- =====================================================
CREATE TABLE IF NOT EXISTS franquia_unidades_socios (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id               UUID NOT NULL REFERENCES franquia_unidades(id) ON DELETE CASCADE,
  empresa_id               BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome                     VARCHAR(200) NOT NULL,
  cpf_cnpj                 VARCHAR(20),
  email                    VARCHAR(200),
  telefone                 VARCHAR(25),
  percentual_participacao  NUMERIC(5, 2),
  tipo_socio               VARCHAR(30) DEFAULT 'socio'
                             CHECK (tipo_socio IN ('administrador', 'socio', 'investidor', 'outro')),
  created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE franquia_unidades_socios IS 'Sócios e investidores vinculados à unidade franqueada';


-- =====================================================
-- TABELA: Histórico de Etapas do Ciclo de Vida
-- =====================================================
CREATE TABLE IF NOT EXISTS franquia_unidades_historico_etapa (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id        UUID NOT NULL REFERENCES franquia_unidades(id) ON DELETE CASCADE,
  empresa_id        BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  etapa_anterior    VARCHAR(30),
  etapa_nova        VARCHAR(30) NOT NULL,
  responsavel_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  responsavel_nome  VARCHAR(200),
  notas             TEXT,
  data_mudanca      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE franquia_unidades_historico_etapa IS 'Histórico completo de mudanças de etapa no ciclo de vida da unidade';


-- =====================================================
-- TABELA: Documentos da Unidade
-- =====================================================
CREATE TABLE IF NOT EXISTS franquia_unidades_documentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id      UUID NOT NULL REFERENCES franquia_unidades(id) ON DELETE CASCADE,
  empresa_id      BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo_documento  VARCHAR(50) NOT NULL
                    CHECK (tipo_documento IN (
                      'contrato_franquia', 'aditivo_contratual', 'documento_franqueado',
                      'alvara', 'licenca', 'outro'
                    )),
  nome_arquivo    VARCHAR(300) NOT NULL,
  url_arquivo     TEXT,
  storage_path    TEXT,
  data_documento  DATE,
  data_validade   DATE,
  versao          VARCHAR(20),
  notas           TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE franquia_unidades_documentos IS 'Gestão de documentos vinculados às unidades (contratos, alvarás, licenças)';


-- =====================================================
-- TABELA: Território de Exclusividade
-- =====================================================
CREATE TABLE IF NOT EXISTS franquia_unidades_territorios (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id            UUID NOT NULL REFERENCES franquia_unidades(id) ON DELETE CASCADE,
  empresa_id            BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  descricao_area        TEXT,
  exclusividade         BOOLEAN DEFAULT FALSE,
  raio_atendimento_km   NUMERIC(10, 2),
  cidades_cobertas      TEXT[],
  bairros_cobertos      TEXT[],
  poligono_geojson      JSONB,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE franquia_unidades_territorios IS 'Definição de território de atuação e exclusividade por unidade';


-- =====================================================
-- TABELA: Indicadores Mensais
-- =====================================================
CREATE TABLE IF NOT EXISTS franquia_unidades_indicadores (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id              UUID NOT NULL REFERENCES franquia_unidades(id) ON DELETE CASCADE,
  empresa_id              BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  mes_referencia          DATE NOT NULL,
  faturamento_bruto       NUMERIC(15, 2),
  faturamento_liquido     NUMERIC(15, 2),
  valor_royalties         NUMERIC(15, 2),
  valor_marketing         NUMERIC(15, 2),
  valor_taxa_tecnologica  NUMERIC(15, 2),
  status_pagamento        VARCHAR(20) DEFAULT 'pendente'
                            CHECK (status_pagamento IN ('pendente', 'pago', 'inadimplente', 'negociando')),
  notas                   TEXT,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unq_indicador_unidade_mes UNIQUE (unidade_id, mes_referencia)
);

COMMENT ON TABLE franquia_unidades_indicadores IS 'Indicadores financeiros mensais por unidade franqueada';


-- =====================================================
-- TABELA: Log de Auditoria
-- =====================================================
CREATE TABLE IF NOT EXISTS franquia_unidades_auditoria (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id      UUID NOT NULL REFERENCES franquia_unidades(id) ON DELETE CASCADE,
  empresa_id      BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo_alteracao  VARCHAR(60) NOT NULL
                    CHECK (tipo_alteracao IN (
                      'cadastro', 'edicao_cadastro', 'mudanca_status', 'alteracao_contrato',
                      'troca_franqueado', 'mudanca_etapa', 'adicao_socio', 'remocao_socio',
                      'upload_documento', 'outros'
                    )),
  campo_alterado  VARCHAR(100),
  valor_anterior  TEXT,
  valor_novo      TEXT,
  usuario_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_nome    VARCHAR(200),
  data_alteracao  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  detalhes        JSONB DEFAULT '{}'
);

COMMENT ON TABLE franquia_unidades_auditoria IS 'Log completo de auditoria de todas as alterações nas unidades';


-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_franquia_unidades_empresa_id     ON franquia_unidades(empresa_id);
CREATE INDEX IF NOT EXISTS idx_franquia_unidades_status         ON franquia_unidades(status);
CREATE INDEX IF NOT EXISTS idx_franquia_unidades_etapa          ON franquia_unidades(etapa_atual);
CREATE INDEX IF NOT EXISTS idx_franquia_unidades_estado         ON franquia_unidades(estado);
CREATE INDEX IF NOT EXISTS idx_franquia_unidades_codigo         ON franquia_unidades(codigo_unidade);
CREATE INDEX IF NOT EXISTS idx_franquia_unidades_nome           ON franquia_unidades(nome_unidade);
CREATE INDEX IF NOT EXISTS idx_franquia_unidades_franqueado     ON franquia_unidades(nome_franqueado);
CREATE INDEX IF NOT EXISTS idx_franquia_unidades_contrato_fim   ON franquia_unidades(data_termino_contrato);

CREATE INDEX IF NOT EXISTS idx_fu_socios_unidade    ON franquia_unidades_socios(unidade_id);
CREATE INDEX IF NOT EXISTS idx_fu_socios_empresa    ON franquia_unidades_socios(empresa_id);

CREATE INDEX IF NOT EXISTS idx_fu_hist_etapa_unidade ON franquia_unidades_historico_etapa(unidade_id);
CREATE INDEX IF NOT EXISTS idx_fu_hist_etapa_data    ON franquia_unidades_historico_etapa(data_mudanca DESC);

CREATE INDEX IF NOT EXISTS idx_fu_documentos_unidade  ON franquia_unidades_documentos(unidade_id);
CREATE INDEX IF NOT EXISTS idx_fu_documentos_validade ON franquia_unidades_documentos(data_validade);

CREATE INDEX IF NOT EXISTS idx_fu_territorios_unidade ON franquia_unidades_territorios(unidade_id);

CREATE INDEX IF NOT EXISTS idx_fu_indicadores_unidade ON franquia_unidades_indicadores(unidade_id);
CREATE INDEX IF NOT EXISTS idx_fu_indicadores_mes     ON franquia_unidades_indicadores(mes_referencia DESC);

CREATE INDEX IF NOT EXISTS idx_fu_auditoria_unidade ON franquia_unidades_auditoria(unidade_id);
CREATE INDEX IF NOT EXISTS idx_fu_auditoria_data     ON franquia_unidades_auditoria(data_alteracao DESC);


-- =====================================================
-- TRIGGERS: updated_at automático
-- =====================================================
CREATE OR REPLACE FUNCTION fn_franquia_unidades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_franquia_unidades_updated_at
  BEFORE UPDATE ON franquia_unidades
  FOR EACH ROW EXECUTE FUNCTION fn_franquia_unidades_updated_at();

CREATE OR REPLACE FUNCTION fn_fu_territorios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fu_territorios_updated_at
  BEFORE UPDATE ON franquia_unidades_territorios
  FOR EACH ROW EXECUTE FUNCTION fn_fu_territorios_updated_at();

CREATE OR REPLACE FUNCTION fn_fu_indicadores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fu_indicadores_updated_at
  BEFORE UPDATE ON franquia_unidades_indicadores
  FOR EACH ROW EXECUTE FUNCTION fn_fu_indicadores_updated_at();


-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE franquia_unidades             ENABLE ROW LEVEL SECURITY;
ALTER TABLE franquia_unidades_socios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE franquia_unidades_historico_etapa ENABLE ROW LEVEL SECURITY;
ALTER TABLE franquia_unidades_documentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE franquia_unidades_territorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE franquia_unidades_indicadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE franquia_unidades_auditoria   ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para obter empresa_id do usuário autenticado
-- (Utiliza SECURITY DEFINER para evitar recursão no RLS)
CREATE OR REPLACE FUNCTION get_user_empresa_id()
RETURNS BIGINT AS $$
  SELECT empresa_id FROM usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- Políticas RLS: franquia_unidades
CREATE POLICY "fu_select" ON franquia_unidades
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "fu_insert" ON franquia_unidades
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "fu_update" ON franquia_unidades
  FOR UPDATE USING (empresa_id = get_user_empresa_id());

CREATE POLICY "fu_delete" ON franquia_unidades
  FOR DELETE USING (empresa_id = get_user_empresa_id());


-- Políticas RLS: sócios
CREATE POLICY "fu_socios_select" ON franquia_unidades_socios
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "fu_socios_insert" ON franquia_unidades_socios
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "fu_socios_update" ON franquia_unidades_socios
  FOR UPDATE USING (empresa_id = get_user_empresa_id());

CREATE POLICY "fu_socios_delete" ON franquia_unidades_socios
  FOR DELETE USING (empresa_id = get_user_empresa_id());


-- Políticas RLS: histórico de etapas
CREATE POLICY "fu_hist_select" ON franquia_unidades_historico_etapa
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "fu_hist_insert" ON franquia_unidades_historico_etapa
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id());


-- Políticas RLS: documentos
CREATE POLICY "fu_doc_select" ON franquia_unidades_documentos
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "fu_doc_insert" ON franquia_unidades_documentos
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "fu_doc_update" ON franquia_unidades_documentos
  FOR UPDATE USING (empresa_id = get_user_empresa_id());

CREATE POLICY "fu_doc_delete" ON franquia_unidades_documentos
  FOR DELETE USING (empresa_id = get_user_empresa_id());


-- Políticas RLS: territórios
CREATE POLICY "fu_ter_select" ON franquia_unidades_territorios
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "fu_ter_insert" ON franquia_unidades_territorios
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "fu_ter_update" ON franquia_unidades_territorios
  FOR UPDATE USING (empresa_id = get_user_empresa_id());

CREATE POLICY "fu_ter_delete" ON franquia_unidades_territorios
  FOR DELETE USING (empresa_id = get_user_empresa_id());


-- Políticas RLS: indicadores
CREATE POLICY "fu_ind_select" ON franquia_unidades_indicadores
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "fu_ind_insert" ON franquia_unidades_indicadores
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "fu_ind_update" ON franquia_unidades_indicadores
  FOR UPDATE USING (empresa_id = get_user_empresa_id());

CREATE POLICY "fu_ind_delete" ON franquia_unidades_indicadores
  FOR DELETE USING (empresa_id = get_user_empresa_id());


-- Políticas RLS: auditoria
CREATE POLICY "fu_aud_select" ON franquia_unidades_auditoria
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "fu_aud_insert" ON franquia_unidades_auditoria
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id());


-- =====================================================
-- ATUALIZAR PERMISSÃO franquias_unidades NOS USUÁRIOS
-- =====================================================

-- Garante que a coluna permissoes existe e é JSONB
-- (Já deve existir no sistema)

-- Adiciona franquias_unidades: false para usuários que ainda não possuem essa chave
UPDATE usuarios
SET permissoes = permissoes || '{"franquias_unidades": false}'::jsonb
WHERE permissoes IS NOT NULL
  AND NOT (permissoes ? 'franquias_unidades');

-- Para usuários que já têm franquias=true, habilita automaticamente franquias_unidades
UPDATE usuarios
SET permissoes = permissoes || '{"franquias_unidades": true}'::jsonb
WHERE permissoes IS NOT NULL
  AND (permissoes->>'franquias')::boolean = true
  AND NOT (permissoes ? 'franquias_unidades');


-- =====================================================
-- VIEWS ANALÍTICAS
-- =====================================================

-- View: Resumo por status
CREATE OR REPLACE VIEW v_franquia_unidades_resumo AS
SELECT
  empresa_id,
  status,
  COUNT(*)                                                                          AS total,
  COUNT(*) FILTER (
    WHERE data_termino_contrato IS NOT NULL
      AND data_termino_contrato <= CURRENT_DATE + INTERVAL '90 days'
      AND data_termino_contrato >= CURRENT_DATE
  )                                                                                 AS contratos_vencendo_90_dias
FROM franquia_unidades
GROUP BY empresa_id, status;

COMMENT ON VIEW v_franquia_unidades_resumo IS 'Resumo de unidades por status para uso em dashboards';


-- View: Ranking de unidades por faturamento (último mês disponível)
CREATE OR REPLACE VIEW v_franquia_unidades_ranking AS
SELECT
  u.id,
  u.empresa_id,
  u.codigo_unidade,
  u.nome_unidade,
  u.status,
  u.cidade,
  u.estado,
  i.mes_referencia,
  i.faturamento_bruto,
  i.status_pagamento,
  RANK() OVER (
    PARTITION BY u.empresa_id
    ORDER BY i.faturamento_bruto DESC NULLS LAST
  ) AS ranking
FROM franquia_unidades u
LEFT JOIN LATERAL (
  SELECT *
  FROM franquia_unidades_indicadores fi
  WHERE fi.unidade_id = u.id
  ORDER BY fi.mes_referencia DESC
  LIMIT 1
) i ON true;

COMMENT ON VIEW v_franquia_unidades_ranking IS 'Ranking das unidades por faturamento mensal mais recente';


-- =====================================================
-- NOTA: BUCKET DE STORAGE PARA DOCUMENTOS
-- =====================================================
-- Execute manualmente no Dashboard do Supabase:
--   Storage > Buckets > New Bucket
--   Nome: franquia-documentos
--   Public: false
--   File size limit: 50 MB
--   Allowed MIME types:
--     application/pdf
--     image/jpeg, image/png, image/webp
--     application/msword
--     application/vnd.openxmlformats-officedocument.wordprocessingml.document
-- =====================================================

-- FIM DO SCRIPT
