-- Execute APENAS estas 3 linhas primeiro (correção urgente)

ALTER TABLE notas_fiscais ALTER COLUMN forma_pagamento TYPE VARCHAR(2);
ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS tipo_emissao VARCHAR(20);
ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS destinatario_indicador_ie VARCHAR(20);
