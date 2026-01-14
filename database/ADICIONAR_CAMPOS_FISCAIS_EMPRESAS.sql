-- =====================================================
-- ADICIONAR CAMPOS FISCAIS NA TABELA EMPRESAS
-- Execute este script no Supabase SQL Editor
-- Data: 14/01/2026
-- =====================================================
-- 
-- Este script adiciona TODOS os campos necessários para
-- emissão de Nota Fiscal Eletrônica (NF-e) na tabela empresas
-- 
-- =====================================================

-- =====================================================
-- 1. ADICIONAR COLUNAS FISCAIS
-- =====================================================

-- Dados cadastrais complementares
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS complemento VARCHAR(100);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS codigo_municipio VARCHAR(7); -- Código IBGE
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS pais VARCHAR(50) DEFAULT 'Brasil';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS codigo_pais VARCHAR(4) DEFAULT '1058'; -- Brasil

-- Inscrições
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS inscricao_estadual VARCHAR(20);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS inscricao_municipal VARCHAR(20);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS inscricao_suframa VARCHAR(20);

-- Regime tributário
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS regime_tributario VARCHAR(20) CHECK (regime_tributario IN ('SIMPLES', 'PRESUMIDO', 'REAL'));
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS crt VARCHAR(1) CHECK (crt IN ('1', '2', '3')); 
-- CRT: 1=Simples Nacional, 2=Simples Nacional - Excesso, 3=Regime Normal

-- CNAE
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cnae_principal VARCHAR(10);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cnae_secundarios TEXT[]; -- Array de CNAEs

-- Configurações de NF-e
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS emite_nfe BOOLEAN DEFAULT false;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS serie_nfe VARCHAR(3) DEFAULT '1';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ultimo_numero_nfe INTEGER DEFAULT 0;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ambiente_nfe VARCHAR(15) DEFAULT 'HOMOLOGACAO' CHECK (ambiente_nfe IN ('PRODUCAO', 'HOMOLOGACAO'));

-- Certificado Digital
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS certificado_digital_id BIGINT REFERENCES certificados_digitais(id);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS certificado_senha VARCHAR(255); -- Criptografado
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS certificado_validade DATE;

-- Contabilidade e responsável
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS contador_nome VARCHAR(255);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS contador_cpf VARCHAR(14);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS contador_cnpj VARCHAR(18);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS contador_crc VARCHAR(20);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS contador_telefone VARCHAR(20);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS contador_email VARCHAR(255);

-- Logo e identidade visual
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cor_primaria VARCHAR(7) DEFAULT '#394353';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cor_secundaria VARCHAR(7) DEFAULT '#C9C4B5';

-- Status e controle
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS matriz BOOLEAN DEFAULT false;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS empresa_matriz_id BIGINT REFERENCES empresas(id);

-- =====================================================
-- 2. COMENTÁRIOS NAS COLUNAS (DOCUMENTAÇÃO)
-- =====================================================

COMMENT ON COLUMN empresas.bairro IS 'Bairro do endereço da empresa';
COMMENT ON COLUMN empresas.complemento IS 'Complemento do endereço';
COMMENT ON COLUMN empresas.codigo_municipio IS 'Código IBGE do município (7 dígitos)';
COMMENT ON COLUMN empresas.inscricao_estadual IS 'Inscrição Estadual (IE) da empresa';
COMMENT ON COLUMN empresas.inscricao_municipal IS 'Inscrição Municipal (IM) da empresa';
COMMENT ON COLUMN empresas.inscricao_suframa IS 'Inscrição SUFRAMA (se aplicável)';
COMMENT ON COLUMN empresas.regime_tributario IS 'Regime tributário: SIMPLES, PRESUMIDO ou REAL';
COMMENT ON COLUMN empresas.crt IS 'Código de Regime Tributário: 1=Simples Nacional, 2=Simples Excesso, 3=Regime Normal';
COMMENT ON COLUMN empresas.cnae_principal IS 'Código CNAE da atividade principal';
COMMENT ON COLUMN empresas.cnae_secundarios IS 'Array de CNAEs das atividades secundárias';
COMMENT ON COLUMN empresas.emite_nfe IS 'Indica se a empresa emite NF-e';
COMMENT ON COLUMN empresas.serie_nfe IS 'Série padrão para NF-e (geralmente 1)';
COMMENT ON COLUMN empresas.ultimo_numero_nfe IS 'Último número de NF-e emitida';
COMMENT ON COLUMN empresas.ambiente_nfe IS 'Ambiente de emissão: PRODUCAO ou HOMOLOGACAO';
COMMENT ON COLUMN empresas.certificado_digital_id IS 'Referência ao certificado digital';
COMMENT ON COLUMN empresas.certificado_senha IS 'Senha do certificado digital (criptografada)';
COMMENT ON COLUMN empresas.certificado_validade IS 'Data de validade do certificado';
COMMENT ON COLUMN empresas.contador_nome IS 'Nome do contador responsável';
COMMENT ON COLUMN empresas.contador_cpf IS 'CPF do contador (pessoa física)';
COMMENT ON COLUMN empresas.contador_cnpj IS 'CNPJ do escritório de contabilidade';
COMMENT ON COLUMN empresas.contador_crc IS 'Registro no CRC do contador';
COMMENT ON COLUMN empresas.logo_url IS 'URL da logo da empresa';
COMMENT ON COLUMN empresas.ativo IS 'Indica se a empresa está ativa';
COMMENT ON COLUMN empresas.matriz IS 'Indica se é empresa matriz';
COMMENT ON COLUMN empresas.empresa_matriz_id IS 'ID da empresa matriz (para filiais)';

-- =====================================================
-- 3. ÍNDICES PARA MELHOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_empresas_inscricao_estadual ON empresas(inscricao_estadual);
CREATE INDEX IF NOT EXISTS idx_empresas_regime_tributario ON empresas(regime_tributario);
CREATE INDEX IF NOT EXISTS idx_empresas_cnae_principal ON empresas(cnae_principal);
CREATE INDEX IF NOT EXISTS idx_empresas_ativo ON empresas(ativo);
CREATE INDEX IF NOT EXISTS idx_empresas_matriz ON empresas(matriz);

-- =====================================================
-- 4. ATUALIZAR DADOS EXISTENTES COM VALORES PADRÃO
-- =====================================================

-- Definir regime tributário padrão para empresas existentes
UPDATE empresas 
SET regime_tributario = 'SIMPLES',
    crt = '1',
    emite_nfe = false,
    ambiente_nfe = 'HOMOLOGACAO',
    serie_nfe = '1',
    ultimo_numero_nfe = 0,
    ativo = true,
    matriz = true
WHERE regime_tributario IS NULL;

-- =====================================================
-- 5. VERIFICAR ESTRUTURA DA TABELA
-- =====================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'empresas'
AND column_name IN (
    'inscricao_estadual', 'inscricao_municipal', 'regime_tributario', 
    'crt', 'cnae_principal', 'emite_nfe', 'serie_nfe', 
    'ultimo_numero_nfe', 'ambiente_nfe', 'certificado_digital_id'
)
ORDER BY column_name;

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================

SELECT '✅ Campos fiscais adicionados à tabela empresas com sucesso!' AS resultado;
