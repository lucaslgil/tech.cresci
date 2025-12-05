-- =====================================================
-- MÓDULO DE CADASTRO DE CLIENTES - ERP/VENDAS/FISCAL
-- Data: 2025-11-26
-- Descrição: Sistema completo de cadastro de clientes
--            com suporte a PF/PJ, endereços, contatos,
--            dados fiscais e financeiros
-- =====================================================

-- =====================================================
-- 1. ENUMS E TIPOS CUSTOMIZADOS
-- =====================================================

-- Tipo de pessoa
CREATE TYPE tipo_pessoa AS ENUM ('FISICA', 'JURIDICA');

-- Tipo de endereço
CREATE TYPE tipo_endereco AS ENUM ('COMERCIAL', 'RESIDENCIAL', 'COBRANCA', 'ENTREGA');

-- Tipo de contato
CREATE TYPE tipo_contato AS ENUM ('TELEFONE', 'CELULAR', 'EMAIL', 'WHATSAPP');

-- Regime tributário
CREATE TYPE regime_tributario AS ENUM (
  'SIMPLES_NACIONAL',
  'LUCRO_PRESUMIDO',
  'LUCRO_REAL',
  'MEI',
  'ISENTO'
);

-- Contribuinte ICMS
CREATE TYPE contribuinte_icms AS ENUM ('CONTRIBUINTE', 'ISENTO', 'NAO_CONTRIBUINTE');

-- Status do cliente
CREATE TYPE status_cliente AS ENUM ('ATIVO', 'INATIVO', 'BLOQUEADO', 'SUSPENSO');

-- Tipo de bloqueio
CREATE TYPE tipo_bloqueio AS ENUM ('COMERCIAL', 'FINANCEIRO', 'COMPLETO');

-- =====================================================
-- 2. TABELA PRINCIPAL: CLIENTES
-- =====================================================

CREATE TABLE IF NOT EXISTS clientes (
  -- Identificação
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL, -- Código interno (gerado automaticamente)
  tipo_pessoa tipo_pessoa NOT NULL,
  
  -- Dados Pessoa Física
  nome_completo VARCHAR(200), -- Obrigatório se PF
  cpf VARCHAR(14) UNIQUE, -- Formato: 000.000.000-00
  rg VARCHAR(20),
  data_nascimento DATE,
  genero VARCHAR(20),
  
  -- Dados Pessoa Jurídica
  razao_social VARCHAR(200), -- Obrigatório se PJ
  nome_fantasia VARCHAR(200),
  cnpj VARCHAR(18) UNIQUE, -- Formato: 00.000.000/0000-00
  inscricao_estadual VARCHAR(20),
  inscricao_municipal VARCHAR(20),
  cnae_principal VARCHAR(10),
  
  -- Dados Fiscais
  regime_tributario regime_tributario,
  contribuinte_icms contribuinte_icms DEFAULT 'NAO_CONTRIBUINTE',
  consumidor_final BOOLEAN DEFAULT true,
  codigo_suframa VARCHAR(20),
  
  -- Dados Financeiros
  limite_credito DECIMAL(15,2) DEFAULT 0,
  condicao_pagamento_id BIGINT, -- FK para tabela de condições
  tabela_preco_id BIGINT, -- FK para tabela de preços
  
  -- Status e Bloqueios
  status status_cliente DEFAULT 'ATIVO',
  bloqueio tipo_bloqueio,
  motivo_bloqueio TEXT,
  data_bloqueio TIMESTAMPTZ,
  
  -- Observações
  observacoes TEXT,
  observacoes_internas TEXT, -- Visível apenas internamente
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by BIGINT, -- FK para usuários
  updated_by BIGINT,
  ultimo_vendedor_id BIGINT, -- FK para colaboradores
  
  -- Constraints
  CONSTRAINT chk_pessoa_fisica CHECK (
    tipo_pessoa = 'JURIDICA' OR 
    (nome_completo IS NOT NULL AND cpf IS NOT NULL)
  ),
  CONSTRAINT chk_pessoa_juridica CHECK (
    tipo_pessoa = 'FISICA' OR 
    (razao_social IS NOT NULL AND cnpj IS NOT NULL)
  ),
  CONSTRAINT chk_limite_credito CHECK (limite_credito >= 0)
);

-- Índices para performance
CREATE INDEX idx_clientes_tipo_pessoa ON clientes(tipo_pessoa);
CREATE INDEX idx_clientes_status ON clientes(status);
CREATE INDEX idx_clientes_cpf ON clientes(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_clientes_cnpj ON clientes(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX idx_clientes_nome ON clientes(nome_completo) WHERE nome_completo IS NOT NULL;
CREATE INDEX idx_clientes_razao_social ON clientes(razao_social) WHERE razao_social IS NOT NULL;
CREATE INDEX idx_clientes_created_at ON clientes(created_at);

-- Comentários
COMMENT ON TABLE clientes IS 'Cadastro principal de clientes - PF e PJ';
COMMENT ON COLUMN clientes.codigo IS 'Código interno gerado automaticamente';
COMMENT ON COLUMN clientes.consumidor_final IS 'Define se é consumidor final para fins fiscais';
COMMENT ON COLUMN clientes.contribuinte_icms IS 'Indica se o cliente é contribuinte de ICMS';

-- =====================================================
-- 3. ENDEREÇOS DOS CLIENTES
-- =====================================================

CREATE TABLE IF NOT EXISTS clientes_enderecos (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  
  -- Tipo e identificação
  tipo tipo_endereco NOT NULL,
  principal BOOLEAN DEFAULT false, -- Apenas um principal por tipo
  
  -- Dados do endereço
  cep VARCHAR(10) NOT NULL, -- Formato: 00000-000
  logradouro VARCHAR(200) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  complemento VARCHAR(100),
  bairro VARCHAR(100) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  estado VARCHAR(2) NOT NULL, -- UF
  pais VARCHAR(50) DEFAULT 'Brasil',
  
  -- Coordenadas (opcional - para logística)
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  
  -- Observações
  observacoes TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_estado_uf CHECK (LENGTH(estado) = 2),
  CONSTRAINT chk_cep_formato CHECK (cep ~ '^\d{5}-?\d{3}$')
);

-- Índices
CREATE INDEX idx_enderecos_cliente ON clientes_enderecos(cliente_id);
CREATE INDEX idx_enderecos_tipo ON clientes_enderecos(tipo);
CREATE INDEX idx_enderecos_principal ON clientes_enderecos(principal) WHERE principal = true;
CREATE INDEX idx_enderecos_cep ON clientes_enderecos(cep);
CREATE INDEX idx_enderecos_cidade_estado ON clientes_enderecos(cidade, estado);

-- Comentários
COMMENT ON TABLE clientes_enderecos IS 'Endereços dos clientes - permite múltiplos por tipo';
COMMENT ON COLUMN clientes_enderecos.principal IS 'Apenas um endereço principal por tipo';

-- =====================================================
-- 4. CONTATOS DOS CLIENTES
-- =====================================================

CREATE TABLE IF NOT EXISTS clientes_contatos (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  
  -- Tipo e identificação
  tipo tipo_contato NOT NULL,
  descricao VARCHAR(50), -- Ex: "Telefone Comercial", "Email NFe"
  principal BOOLEAN DEFAULT false,
  
  -- Dados do contato
  valor VARCHAR(200) NOT NULL, -- Telefone, email, etc
  
  -- Flags especiais
  recebe_nfe BOOLEAN DEFAULT false, -- Email para envio de NF-e
  recebe_cobranca BOOLEAN DEFAULT false, -- Email/telefone para cobrança
  recebe_marketing BOOLEAN DEFAULT false, -- Aceita receber comunicações
  
  -- Validação
  validado BOOLEAN DEFAULT false,
  data_validacao TIMESTAMPTZ,
  
  -- Observações
  observacoes TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_email_formato CHECK (
    tipo != 'EMAIL' OR 
    valor ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

-- Índices
CREATE INDEX idx_contatos_cliente ON clientes_contatos(cliente_id);
CREATE INDEX idx_contatos_tipo ON clientes_contatos(tipo);
CREATE INDEX idx_contatos_principal ON clientes_contatos(principal) WHERE principal = true;
CREATE INDEX idx_contatos_nfe ON clientes_contatos(recebe_nfe) WHERE recebe_nfe = true;
CREATE INDEX idx_contatos_valor ON clientes_contatos(valor);

-- Comentários
COMMENT ON TABLE clientes_contatos IS 'Contatos dos clientes - telefones, emails, etc';
COMMENT ON COLUMN clientes_contatos.recebe_nfe IS 'Email configurado para receber NF-e';

-- =====================================================
-- 5. HISTÓRICO DE ALTERAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS clientes_historico (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  
  -- Tipo de alteração
  acao VARCHAR(50) NOT NULL, -- 'CRIACAO', 'ALTERACAO', 'BLOQUEIO', 'DESBLOQUEIO'
  campo_alterado VARCHAR(100),
  valor_anterior TEXT,
  valor_novo TEXT,
  
  -- Contexto
  descricao TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  usuario_id BIGINT, -- Quem fez a alteração
  ip_origem VARCHAR(45)
);

-- Índices
CREATE INDEX idx_historico_cliente ON clientes_historico(cliente_id);
CREATE INDEX idx_historico_acao ON clientes_historico(acao);
CREATE INDEX idx_historico_created_at ON clientes_historico(created_at);
CREATE INDEX idx_historico_usuario ON clientes_historico(usuario_id);

-- Comentários
COMMENT ON TABLE clientes_historico IS 'Log de todas as alterações realizadas em clientes';

-- =====================================================
-- 6. CONDIÇÕES DE PAGAMENTO (AUXILIAR)
-- =====================================================

CREATE TABLE IF NOT EXISTS condicoes_pagamento (
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  descricao VARCHAR(100) NOT NULL,
  
  -- Configuração
  parcelas INTEGER DEFAULT 1,
  dias_primeira_parcela INTEGER DEFAULT 0,
  dias_entre_parcelas INTEGER DEFAULT 30,
  percentual_entrada DECIMAL(5,2) DEFAULT 0,
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  padrao BOOLEAN DEFAULT false, -- Apenas uma pode ser padrão
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_parcelas CHECK (parcelas > 0),
  CONSTRAINT chk_percentual_entrada CHECK (percentual_entrada >= 0 AND percentual_entrada <= 100)
);

-- Índices
CREATE INDEX idx_condicoes_ativo ON condicoes_pagamento(ativo) WHERE ativo = true;
CREATE INDEX idx_condicoes_padrao ON condicoes_pagamento(padrao) WHERE padrao = true;

-- Comentários
COMMENT ON TABLE condicoes_pagamento IS 'Condições de pagamento disponíveis para vendas';

-- =====================================================
-- 7. TABELAS DE PREÇO (AUXILIAR)
-- =====================================================

CREATE TABLE IF NOT EXISTS tabelas_preco (
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  descricao VARCHAR(100) NOT NULL,
  
  -- Configuração
  percentual_desconto DECIMAL(5,2) DEFAULT 0,
  percentual_acrescimo DECIMAL(5,2) DEFAULT 0,
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  padrao BOOLEAN DEFAULT false,
  
  -- Vigência
  data_inicio DATE,
  data_fim DATE,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_vigencia CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

-- Índices
CREATE INDEX idx_tabelas_ativo ON tabelas_preco(ativo) WHERE ativo = true;
CREATE INDEX idx_tabelas_padrao ON tabelas_preco(padrao) WHERE padrao = true;
CREATE INDEX idx_tabelas_vigencia ON tabelas_preco(data_inicio, data_fim);

-- Comentários
COMMENT ON TABLE tabelas_preco IS 'Tabelas de preço para diferentes segmentos de clientes';

-- =====================================================
-- 8. FOREIGN KEYS ADICIONAIS
-- =====================================================

ALTER TABLE clientes
  ADD CONSTRAINT fk_clientes_condicao_pagamento 
    FOREIGN KEY (condicao_pagamento_id) 
    REFERENCES condicoes_pagamento(id) 
    ON DELETE SET NULL;

ALTER TABLE clientes
  ADD CONSTRAINT fk_clientes_tabela_preco 
    FOREIGN KEY (tabela_preco_id) 
    REFERENCES tabelas_preco(id) 
    ON DELETE SET NULL;

ALTER TABLE clientes
  ADD CONSTRAINT fk_clientes_vendedor 
    FOREIGN KEY (ultimo_vendedor_id) 
    REFERENCES colaboradores(id) 
    ON DELETE SET NULL;

-- =====================================================
-- 9. FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para gerar código automático do cliente
CREATE OR REPLACE FUNCTION gerar_codigo_cliente()
RETURNS TRIGGER AS $$
DECLARE
  novo_codigo VARCHAR(20);
  prefixo VARCHAR(5);
BEGIN
  -- Define prefixo baseado no tipo
  IF NEW.tipo_pessoa = 'FISICA' THEN
    prefixo := 'CLI-F';
  ELSE
    prefixo := 'CLI-J';
  END IF;
  
  -- Gera código sequencial
  novo_codigo := prefixo || LPAD(NEW.id::TEXT, 6, '0');
  NEW.codigo := novo_codigo;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gerar_codigo_cliente
  BEFORE INSERT ON clientes
  FOR EACH ROW
  WHEN (NEW.codigo IS NULL)
  EXECUTE FUNCTION gerar_codigo_cliente();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_enderecos_updated_at
  BEFORE UPDATE ON clientes_enderecos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_contatos_updated_at
  BEFORE UPDATE ON clientes_contatos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para registrar alterações no histórico
CREATE OR REPLACE FUNCTION registrar_historico_cliente()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO clientes_historico (
      cliente_id, acao, descricao, usuario_id
    ) VALUES (
      NEW.id, 'CRIACAO', 'Cliente cadastrado no sistema', NEW.created_by
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Registra bloqueio/desbloqueio
    IF OLD.bloqueio IS DISTINCT FROM NEW.bloqueio THEN
      INSERT INTO clientes_historico (
        cliente_id, acao, campo_alterado, valor_anterior, valor_novo, usuario_id
      ) VALUES (
        NEW.id,
        CASE WHEN NEW.bloqueio IS NULL THEN 'DESBLOQUEIO' ELSE 'BLOQUEIO' END,
        'bloqueio',
        OLD.bloqueio::TEXT,
        NEW.bloqueio::TEXT,
        NEW.updated_by
      );
    END IF;
    
    -- Registra mudança de status
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO clientes_historico (
        cliente_id, acao, campo_alterado, valor_anterior, valor_novo, usuario_id
      ) VALUES (
        NEW.id, 'ALTERACAO', 'status', OLD.status::TEXT, NEW.status::TEXT, NEW.updated_by
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_historico_cliente
  AFTER INSERT OR UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION registrar_historico_cliente();

-- Função para garantir apenas um endereço principal por tipo
CREATE OR REPLACE FUNCTION garantir_endereco_principal_unico()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.principal = true THEN
    UPDATE clientes_enderecos
    SET principal = false
    WHERE cliente_id = NEW.cliente_id
      AND tipo = NEW.tipo
      AND id != COALESCE(NEW.id, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_endereco_principal_unico
  BEFORE INSERT OR UPDATE ON clientes_enderecos
  FOR EACH ROW
  WHEN (NEW.principal = true)
  EXECUTE FUNCTION garantir_endereco_principal_unico();

-- Função para garantir apenas um contato principal por tipo
CREATE OR REPLACE FUNCTION garantir_contato_principal_unico()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.principal = true THEN
    UPDATE clientes_contatos
    SET principal = false
    WHERE cliente_id = NEW.cliente_id
      AND tipo = NEW.tipo
      AND id != COALESCE(NEW.id, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contato_principal_unico
  BEFORE INSERT OR UPDATE ON clientes_contatos
  FOR EACH ROW
  WHEN (NEW.principal = true)
  EXECUTE FUNCTION garantir_contato_principal_unico();

-- =====================================================
-- 10. VIEWS ÚTEIS
-- =====================================================

-- View com dados completos do cliente
CREATE OR REPLACE VIEW vw_clientes_completo AS
SELECT 
  c.*,
  -- Endereço principal
  e_principal.logradouro as endereco_principal,
  e_principal.numero as endereco_numero,
  e_principal.bairro as endereco_bairro,
  e_principal.cidade as endereco_cidade,
  e_principal.estado as endereco_estado,
  e_principal.cep as endereco_cep,
  -- Contatos principais
  t_principal.valor as telefone_principal,
  e_email.valor as email_principal,
  -- Dados financeiros
  cp.descricao as condicao_pagamento_descricao,
  tp.descricao as tabela_preco_descricao,
  -- Vendedor
  v.nome as vendedor_nome
FROM clientes c
LEFT JOIN clientes_enderecos e_principal ON 
  e_principal.cliente_id = c.id AND 
  e_principal.principal = true AND
  e_principal.tipo = 'COMERCIAL'
LEFT JOIN clientes_contatos t_principal ON 
  t_principal.cliente_id = c.id AND 
  t_principal.principal = true AND
  t_principal.tipo IN ('TELEFONE', 'CELULAR')
LEFT JOIN clientes_contatos e_email ON 
  e_email.cliente_id = c.id AND 
  e_email.principal = true AND
  e_email.tipo = 'EMAIL'
LEFT JOIN condicoes_pagamento cp ON cp.id = c.condicao_pagamento_id
LEFT JOIN tabelas_preco tp ON tp.id = c.tabela_preco_id
LEFT JOIN colaboradores v ON v.id = c.ultimo_vendedor_id;

COMMENT ON VIEW vw_clientes_completo IS 'View com dados completos do cliente incluindo endereço e contatos principais';

-- =====================================================
-- 11. DADOS INICIAIS (SEEDS)
-- =====================================================

-- Condições de pagamento padrão
INSERT INTO condicoes_pagamento (codigo, descricao, parcelas, dias_primeira_parcela, padrao, ativo)
VALUES 
  ('AV', 'À Vista', 1, 0, true, true),
  ('30DD', '30 Dias', 1, 30, false, true),
  ('2X', '2x (30/60)', 2, 30, false, true),
  ('3X', '3x (30/60/90)', 3, 30, false, true)
ON CONFLICT (codigo) DO NOTHING;

-- Tabela de preço padrão
INSERT INTO tabelas_preco (codigo, descricao, percentual_desconto, padrao, ativo)
VALUES 
  ('PADRAO', 'Tabela Padrão', 0, true, true),
  ('ATACADO', 'Atacado (5% desc)', 5, false, true),
  ('VIP', 'Clientes VIP (10% desc)', 10, false, true)
ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- 12. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilita RLS nas tabelas principais
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_historico ENABLE ROW LEVEL SECURITY;

-- Política para visualização (todos autenticados podem ver)
CREATE POLICY "Clientes visíveis para usuários autenticados"
  ON clientes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Endereços visíveis para usuários autenticados"
  ON clientes_enderecos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Contatos visíveis para usuários autenticados"
  ON clientes_contatos FOR SELECT
  TO authenticated
  USING (true);

-- Política para histórico (apenas leitura)
CREATE POLICY "Histórico visível para usuários autenticados"
  ON clientes_historico FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
