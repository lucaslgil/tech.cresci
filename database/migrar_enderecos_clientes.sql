-- =====================================================
-- MIGRAÇÃO: Criar endereços na tabela clientes_enderecos
-- a partir dos campos achatados da view
-- Data: 03/02/2026
-- =====================================================

-- Inserir endereços para clientes que têm dados na VIEW
-- mas não têm registros na tabela clientes_enderecos

INSERT INTO clientes_enderecos (
  cliente_id,
  tipo,
  principal,
  cep,
  logradouro,
  numero,
  bairro,
  cidade,
  estado,
  pais
)
SELECT 
  c.id as cliente_id,
  'COMERCIAL'::tipo_endereco as tipo,
  true as principal,
  COALESCE(vc.endereco_cep, '00000-000') as cep,
  COALESCE(vc.endereco_principal, 'Não informado') as logradouro,
  COALESCE(vc.endereco_numero, 'S/N') as numero,
  COALESCE(vc.endereco_bairro, 'Centro') as bairro,
  COALESCE(vc.endereco_cidade, 'Não informado') as cidade,
  COALESCE(vc.endereco_estado, 'SP') as estado,
  'Brasil' as pais
FROM clientes c
JOIN vw_clientes_completo vc ON vc.id = c.id
LEFT JOIN clientes_enderecos ce ON ce.cliente_id = c.id
WHERE ce.id IS NULL -- Apenas clientes sem endereços cadastrados
  AND vc.endereco_principal IS NOT NULL -- Que tenham dados de endereço na VIEW
ON CONFLICT DO NOTHING;

-- Buscar código IBGE para os endereços criados (opcional)
-- Como não temos esses dados, deixamos vazio
-- O usuário pode editar o cadastro e consultar o CEP novamente

SELECT 
  COUNT(*) as total_migrados,
  'Endereços migrados com sucesso!' as mensagem
FROM clientes_enderecos 
WHERE created_at >= NOW() - INTERVAL '1 minute';
