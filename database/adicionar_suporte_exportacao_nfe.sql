-- =====================================================
-- ADICIONAR SUPORTE A NOTAS FISCAIS DE EXPORTAÇÃO
-- Data: 10/02/2026
-- =====================================================

-- PROBLEMA:
-- Sistema atual só emite NF-e com idDest=1 (operação interna)
-- Para CFOP 7102 (exportação) é necessário idDest=3

-- SOLUÇÃO:
-- 1. Adicionar campos de exportação na tabela operacoes_fiscais
-- 2. Adicionar campos de exportação na tabela notas_fiscais
-- 3. Criar tabela de países (código Bacen)
-- 4. Adicionar campos de país no destinatário

-- =====================================================
-- 1. TABELA DE PAÍSES (BACEN)
-- =====================================================

CREATE TABLE IF NOT EXISTS paises (
  id BIGSERIAL PRIMARY KEY,
  codigo_bacen VARCHAR(5) NOT NULL UNIQUE,
  codigo_iso2 VARCHAR(2) NOT NULL,
  codigo_iso3 VARCHAR(3) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  nome_completo VARCHAR(200),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paises_codigo_bacen ON paises(codigo_bacen);
CREATE INDEX IF NOT EXISTS idx_paises_iso2 ON paises(codigo_iso2);
CREATE INDEX IF NOT EXISTS idx_paises_nome ON paises USING gin(to_tsvector('portuguese', nome));

COMMENT ON TABLE paises IS 'Tabela de países conforme código Bacen para operações de exportação';
COMMENT ON COLUMN paises.codigo_bacen IS 'Código de 4 dígitos do Bacen (ex: 1058=Brasil, 0132=Argentina)';
COMMENT ON COLUMN paises.codigo_iso2 IS 'Código ISO 3166-1 alpha-2 (ex: BR, US, AR)';
COMMENT ON COLUMN paises.codigo_iso3 IS 'Código ISO 3166-1 alpha-3 (ex: BRA, USA, ARG)';

-- Inserir principais países
INSERT INTO paises (codigo_bacen, codigo_iso2, codigo_iso3, nome, nome_completo) VALUES
  ('1058', 'BR', 'BRA', 'Brasil', 'República Federativa do Brasil'),
  ('0132', 'AR', 'ARG', 'Argentina', 'República Argentina'),
  ('0310', 'BO', 'BOL', 'Bolívia', 'Estado Plurinacional da Bolívia'),
  ('0728', 'CL', 'CHL', 'Chile', 'República do Chile'),
  ('1023', 'CO', 'COL', 'Colômbia', 'República da Colômbia'),
  ('2399', 'EC', 'ECU', 'Equador', 'República do Equador'),
  ('2674', 'PY', 'PRY', 'Paraguai', 'República do Paraguai'),
  ('3263', 'PE', 'PER', 'Peru', 'República do Peru'),
  ('7370', 'UY', 'URY', 'Uruguai', 'República Oriental do Uruguai'),
  ('3697', 'VE', 'VEN', 'Venezuela', 'República Bolivariana da Venezuela'),
  ('0210', 'US', 'USA', 'Estados Unidos', 'Estados Unidos da América'),
  ('0434', 'CA', 'CAN', 'Canadá', 'Canadá'),
  ('2877', 'MX', 'MEX', 'México', 'Estados Unidos Mexicanos'),
  ('0639', 'CN', 'CHN', 'China', 'República Popular da China'),
  ('3595', 'JP', 'JPN', 'Japão', 'Japão'),
  ('1937', 'DE', 'DEU', 'Alemanha', 'República Federal da Alemanha'),
  ('2750', 'FR', 'FRA', 'França', 'República Francesa'),
  ('3514', 'IT', 'ITA', 'Itália', 'República Italiana'),
  ('6289', 'GB', 'GBR', 'Reino Unido', 'Reino Unido da Grã-Bretanha e Irlanda do Norte'),
  ('2496', 'ES', 'ESP', 'Espanha', 'Reino da Espanha'),
  ('5118', 'PT', 'PRT', 'Portugal', 'República Portuguesa')
ON CONFLICT (codigo_bacen) DO NOTHING;

-- =====================================================
-- 2. ADICIONAR CAMPOS DE EXPORTAÇÃO EM OPERACOES_FISCAIS
-- =====================================================

-- Indicar se a operação é de exportação
ALTER TABLE operacoes_fiscais 
  ADD COLUMN IF NOT EXISTS eh_exportacao BOOLEAN DEFAULT false;

-- Tipo de operação de comércio exterior
ALTER TABLE operacoes_fiscais 
  ADD COLUMN IF NOT EXISTS tipo_comercio_exterior VARCHAR(1) 
  CHECK (tipo_comercio_exterior IN ('1', '2', '3') OR tipo_comercio_exterior IS NULL);

COMMENT ON COLUMN operacoes_fiscais.eh_exportacao IS 'Indica se é operação de exportação (idDest=3)';
COMMENT ON COLUMN operacoes_fiscais.tipo_comercio_exterior IS '1=Venda direta, 2=Intermediada por trading, 3=Outras';

-- Atualizar operações existentes com CFOP de exportação
UPDATE operacoes_fiscais 
SET eh_exportacao = true 
WHERE cfop_exterior LIKE '7%' 
  AND eh_exportacao IS NOT DISTINCT FROM false;

-- =====================================================
-- 3. ADICIONAR CAMPOS DE EXPORTAÇÃO EM NOTAS_FISCAIS
-- =====================================================

-- Campos específicos de exportação
ALTER TABLE notas_fiscais 
  ADD COLUMN IF NOT EXISTS eh_exportacao BOOLEAN DEFAULT false;

ALTER TABLE notas_fiscais 
  ADD COLUMN IF NOT EXISTS uf_embarque VARCHAR(2);

ALTER TABLE notas_fiscais 
  ADD COLUMN IF NOT EXISTS local_embarque VARCHAR(60);

ALTER TABLE notas_fiscais 
  ADD COLUMN IF NOT EXISTS local_despacho VARCHAR(60);

ALTER TABLE notas_fiscais 
  ADD COLUMN IF NOT EXISTS tipo_comercio_exterior VARCHAR(1)
  CHECK (tipo_comercio_exterior IN ('1', '2', '3') OR tipo_comercio_exterior IS NULL);

COMMENT ON COLUMN notas_fiscais.eh_exportacao IS 'Indica se é NF-e de exportação';
COMMENT ON COLUMN notas_fiscais.uf_embarque IS 'UF de saída para o exterior (porto/aeroporto)';
COMMENT ON COLUMN notas_fiscais.local_embarque IS 'Descrição do local de embarque ou transposição de fronteira';
COMMENT ON COLUMN notas_fiscais.local_despacho IS 'Descrição do local de despacho (opcional)';
COMMENT ON COLUMN notas_fiscais.tipo_comercio_exterior IS '1=Venda direta, 2=Intermediada, 3=Outras';

-- =====================================================
-- 4. ADICIONAR CAMPOS DE PAÍS NO DESTINATÁRIO
-- =====================================================

-- Adicionar referência ao país do destinatário
ALTER TABLE notas_fiscais 
  ADD COLUMN IF NOT EXISTS destinatario_pais_id BIGINT REFERENCES paises(id);

ALTER TABLE notas_fiscais 
  ADD COLUMN IF NOT EXISTS destinatario_pais_codigo VARCHAR(5);

ALTER TABLE notas_fiscais 
  ADD COLUMN IF NOT EXISTS destinatario_pais_nome VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_notas_pais ON notas_fiscais(destinatario_pais_id);
CREATE INDEX IF NOT EXISTS idx_notas_exportacao ON notas_fiscais(eh_exportacao);

COMMENT ON COLUMN notas_fiscais.destinatario_pais_id IS 'ID do país do destinatário (para exportação)';
COMMENT ON COLUMN notas_fiscais.destinatario_pais_codigo IS 'Código Bacen do país (ex: 1058=Brasil)';
COMMENT ON COLUMN notas_fiscais.destinatario_pais_nome IS 'Nome do país do destinatário';

-- =====================================================
-- 5. ATUALIZAR RLS PARA TABELA DE PAÍSES
-- =====================================================

ALTER TABLE paises ENABLE ROW LEVEL SECURITY;

-- Todos podem visualizar países
CREATE POLICY "paises_visualizar" ON paises FOR SELECT
USING (true);

-- =====================================================
-- 6. TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_paises_updated_at ON paises;
CREATE TRIGGER trigger_paises_updated_at
  BEFORE UPDATE ON paises
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_updated_at();

-- =====================================================
-- 7. VERIFICAÇÃO
-- =====================================================

-- Verificar se os campos foram criados
SELECT 
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name IN ('paises', 'operacoes_fiscais', 'notas_fiscais')
  AND column_name IN (
    'eh_exportacao', 
    'tipo_comercio_exterior', 
    'uf_embarque', 
    'local_embarque', 
    'local_despacho',
    'destinatario_pais_id',
    'destinatario_pais_codigo',
    'destinatario_pais_nome',
    'codigo_bacen',
    'codigo_iso2',
    'nome'
  )
ORDER BY table_name, ordinal_position;

-- Verificar países cadastrados
SELECT codigo_bacen, codigo_iso2, nome, ativo 
FROM paises 
WHERE ativo = true 
ORDER BY nome;

-- =====================================================
-- ✅ RESULTADO ESPERADO
-- =====================================================
-- Tabela paises criada com 21 países principais
-- Campos de exportação adicionados em operacoes_fiscais
-- Campos de exportação adicionados em notas_fiscais
-- Sistema preparado para emitir NF-e com CFOP 7102
