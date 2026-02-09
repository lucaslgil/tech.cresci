-- ============================================
-- SCRIPT COMPLETO - ADICIONAR TODAS COLUNAS FALTANTES
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Campos de identificação da nota
ALTER TABLE notas_fiscais 
ADD COLUMN IF NOT EXISTS tipo_emissao VARCHAR(20),
ADD COLUMN IF NOT EXISTS modelo VARCHAR(2),
ADD COLUMN IF NOT EXISTS finalidade VARCHAR(20);

-- Corrigir coluna ambiente se já existir (era integer, agora é integer)
-- Não precisa alterar, já está como integer

-- 2. Destinatário - Indicador IE e endereço
ALTER TABLE notas_fiscais 
ADD COLUMN IF NOT EXISTS destinatario_indicador_ie VARCHAR(20),
ADD COLUMN IF NOT EXISTS destinatario_codigo_municipio VARCHAR(10),
ADD COLUMN IF NOT EXISTS destinatario_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS destinatario_telefone VARCHAR(20);

-- 3. Totais e impostos
ALTER TABLE notas_fiscais
ADD COLUMN IF NOT EXISTS valor_total_tributos DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS base_calculo_icms DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS valor_icms DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS valor_pis DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS valor_cofins DECIMAL(15,2);

-- 4. Transporte
ALTER TABLE notas_fiscais
ADD COLUMN IF NOT EXISTS modalidade_frete VARCHAR(2),
ADD COLUMN IF NOT EXISTS transportadora_cnpj VARCHAR(18),
ADD COLUMN IF NOT EXISTS transportadora_nome VARCHAR(255),
ADD COLUMN IF NOT EXISTS veiculo_placa VARCHAR(10),
ADD COLUMN IF NOT EXISTS veiculo_uf VARCHAR(2);

-- 5. Pagamento - forma_pagamento deve ser VARCHAR(2) para suportar '01', '17', '99'
ALTER TABLE notas_fiscais
ADD COLUMN IF NOT EXISTS meio_pagamento VARCHAR(2),
ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(15,2);

-- Corrigir tamanho da coluna forma_pagamento se já existir com tamanho errado
ALTER TABLE notas_fiscais 
ALTER COLUMN forma_pagamento TYPE VARCHAR(2);

-- 6. Informações complementares
ALTER TABLE notas_fiscais
ADD COLUMN IF NOT EXISTS informacoes_complementares TEXT,
ADD COLUMN IF NOT EXISTS informacoes_fisco TEXT;

-- 7. Controle e XMLs
ALTER TABLE notas_fiscais
ADD COLUMN IF NOT EXISTS xml_gerado TEXT,
ADD COLUMN IF NOT EXISTS xml_autorizado TEXT,
ADD COLUMN IF NOT EXISTS data_autorizacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mensagem_sefaz TEXT;

-- 8. Valores adicionais
ALTER TABLE notas_fiscais
ADD COLUMN IF NOT EXISTS valor_frete DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_seguro DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_outras_despesas DECIMAL(15,2) DEFAULT 0;

-- ============================================
-- VERIFICAR COLUNAS CRIADAS
-- ============================================
SELECT 
  column_name, 
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'notas_fiscais' 
  AND column_name IN (
    'tipo_emissao', 'ambiente', 'modelo', 'finalidade',
    'destinatario_indicador_ie', 'destinatario_codigo_municipio',
    'valor_total_tributos', 'base_calculo_icms', 'valor_icms',
    'modalidade_frete', 'meio_pagamento', 'valor_pago',
    'informacoes_complementares', 'informacoes_fisco',
    'xml_gerado', 'xml_autorizado', 'data_autorizacao',
    'valor_frete', 'valor_seguro', 'valor_outras_despesas'
  )
ORDER BY column_name;

-- Se retornar 20+ linhas, está tudo certo! ✅
