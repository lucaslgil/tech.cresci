-- Adicionar colunas faltantes na tabela notas_fiscais para emissão completa

-- Adicionar indicador IE do destinatário
ALTER TABLE notas_fiscais 
ADD COLUMN IF NOT EXISTS destinatario_indicador_ie VARCHAR(20);

-- Adicionar campos de transporte
ALTER TABLE notas_fiscais
ADD COLUMN IF NOT EXISTS transportadora_cnpj VARCHAR(18),
ADD COLUMN IF NOT EXISTS transportadora_nome VARCHAR(255),
ADD COLUMN IF NOT EXISTS veiculo_placa VARCHAR(10),
ADD COLUMN IF NOT EXISTS veiculo_uf VARCHAR(2);

-- Adicionar campos de pagamento
ALTER TABLE notas_fiscais
ADD COLUMN IF NOT EXISTS meio_pagamento VARCHAR(2);

-- Adicionar campos de controle
ALTER TABLE notas_fiscais
ADD COLUMN IF NOT EXISTS xml_gerado TEXT,
ADD COLUMN IF NOT EXISTS data_autorizacao TIMESTAMP WITH TIME ZONE;

-- Comentários
COMMENT ON COLUMN notas_fiscais.destinatario_indicador_ie IS 'Indicador IE: CONTRIBUINTE, NAO_CONTRIBUINTE, ISENTO';
COMMENT ON COLUMN notas_fiscais.meio_pagamento IS 'Código do meio de pagamento: 01=Dinheiro, 03=Cartão Crédito, 04=Cartão Débito, 17=PIX, etc';
COMMENT ON COLUMN notas_fiscais.xml_gerado IS 'XML gerado antes de assinar';
COMMENT ON COLUMN notas_fiscais.data_autorizacao IS 'Data/hora em que a nota foi autorizada pela SEFAZ';
