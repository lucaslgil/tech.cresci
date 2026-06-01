-- =====================================================
-- MÓDULO: Contas a Receber - Solutto
-- =====================================================
-- Tabela dedicada para armazenar contas a receber sincronizadas
-- do webservice Solutto. Diferente de `contas_receber`, esta tabela:
--   - Recebe apenas INSERTS (registros nunca são atualizados pela sync)
--   - Tem unique constraint em (empresa_id, solutto_id) para que
--     re-sincronizações ignorem automaticamente registros já gravados
--   - Será exposta via API a um sistema externo de negociação de débitos
-- =====================================================

CREATE TABLE IF NOT EXISTS contas_receber_solutto (
    id BIGSERIAL PRIMARY KEY,

    -- Vínculos
    empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    cliente_id BIGINT REFERENCES clientes(id) ON DELETE SET NULL,
    solutto_cliente_id BIGINT NOT NULL,

    -- Identificação no Solutto
    solutto_id BIGINT NOT NULL,

    -- Dados do cliente (snapshot — não muda mesmo se cliente for atualizado)
    cliente_nome TEXT NOT NULL,
    cliente_cpf_cnpj TEXT,

    -- Dados da conta
    numero_documento TEXT,
    descricao TEXT,
    data_emissao DATE,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    valor_original NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_pago NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_saldo NUMERIC(15,2) NOT NULL DEFAULT 0,
    forma_pagamento TEXT,
    observacoes TEXT,

    -- Status: ABERTO, QUITADA, PARCIAL, VENCIDO
    status TEXT NOT NULL DEFAULT 'ABERTO'
        CHECK (status IN ('ABERTO', 'QUITADA', 'PARCIAL', 'VENCIDO', 'CANCELADO')),

    -- Estado da negociação (preenchido por sistema externo no futuro)
    negociacao_status TEXT,
    negociacao_atualizada_em TIMESTAMPTZ,

    -- Auditoria
    sincronizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    solutto_dados_extras JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraint: cada conta da Solutto só pode ser gravada uma vez por empresa
    CONSTRAINT contas_receber_solutto_unique UNIQUE (empresa_id, solutto_id)
);

CREATE INDEX IF NOT EXISTS idx_crs_empresa_id ON contas_receber_solutto(empresa_id);
CREATE INDEX IF NOT EXISTS idx_crs_cliente_id ON contas_receber_solutto(cliente_id);
CREATE INDEX IF NOT EXISTS idx_crs_solutto_cliente_id ON contas_receber_solutto(solutto_cliente_id);
CREATE INDEX IF NOT EXISTS idx_crs_status ON contas_receber_solutto(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_crs_vencimento ON contas_receber_solutto(empresa_id, data_vencimento);

-- =====================================================
-- LOG de execuções da sincronização (manual e automática)
-- =====================================================
CREATE TABLE IF NOT EXISTS contas_receber_solutto_sync_log (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT REFERENCES empresas(id) ON DELETE CASCADE,
    origem TEXT NOT NULL CHECK (origem IN ('MANUAL', 'CRON')),
    iniciado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    finalizado_em TIMESTAMPTZ,
    clientes_processados INT NOT NULL DEFAULT 0,
    contas_inseridas INT NOT NULL DEFAULT 0,
    contas_ignoradas INT NOT NULL DEFAULT 0,
    erros INT NOT NULL DEFAULT 0,
    detalhes_erros JSONB,
    sucesso BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_crs_sync_log_iniciado
    ON contas_receber_solutto_sync_log(iniciado_em DESC);

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE contas_receber_solutto ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber_solutto_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crs_select_empresa" ON contas_receber_solutto;
CREATE POLICY "crs_select_empresa" ON contas_receber_solutto
    FOR SELECT USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "crs_insert_empresa" ON contas_receber_solutto;
CREATE POLICY "crs_insert_empresa" ON contas_receber_solutto
    FOR INSERT WITH CHECK (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "crs_update_empresa" ON contas_receber_solutto;
CREATE POLICY "crs_update_empresa" ON contas_receber_solutto
    FOR UPDATE USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "crs_sync_log_select" ON contas_receber_solutto_sync_log;
CREATE POLICY "crs_sync_log_select" ON contas_receber_solutto_sync_log
    FOR SELECT USING (
        empresa_id IS NULL OR empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    );

-- =====================================================
-- PERMISSÃO: financeiro_contas_receber_solutto
-- =====================================================
-- Atualiza JSON `permissoes` de todos os usuários, adicionando a chave
-- nova como `false` se ainda não existir. Admins podem ativar manualmente.
UPDATE usuarios
SET permissoes = jsonb_set(
    COALESCE(permissoes, '{}'::jsonb),
    '{financeiro_contas_receber_solutto}',
    'false'::jsonb,
    true
)
WHERE NOT (permissoes ? 'financeiro_contas_receber_solutto');

-- Ativa para o usuário master/admin (ajustar email conforme necessário)
UPDATE usuarios
SET permissoes = jsonb_set(
    permissoes,
    '{financeiro_contas_receber_solutto}',
    'true'::jsonb
)
WHERE email = 'suporte.ti@crescieperdi.com.br';

COMMENT ON TABLE contas_receber_solutto IS
'Histórico append-only de contas a receber sincronizadas do Solutto. Registros nunca são atualizados pela sync; serão expostos via API externa para negociação.';
