-- =====================================================
-- VINCULAR TIPO DE CONTRIBUINTE COM OPERAÇÃO FISCAL PADRÃO
-- Data: 10/02/2026
-- =====================================================

-- OBJETIVO:
-- Permitir que cada Tipo de Contribuinte tenha uma Operação Fiscal padrão
-- Quando o cliente tiver um tipo de contribuinte, o sistema pré-seleciona
-- automaticamente a operação fiscal na emissão de NF-e

-- EXEMPLO DE USO:
-- Cliente: INDÚSTRIA DA ZONA FRANCA DE MANAUS
--   ↓
-- Tipo Contribuinte: "Cliente Zona Franca de Manaus"
--   ↓  
-- Operação Fiscal Padrão: "Venda para Zona Franca" (CFOP 6.109)
--   ↓
-- Emissão NF-e: Sistema pré-seleciona automaticamente CFOP 6.109

-- =====================================================
-- 1. ADICIONAR CAMPO operacao_fiscal_padrao_id
-- =====================================================

-- Verificar se a tabela tipos_contribuinte existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tipos_contribuinte') THEN
    RAISE EXCEPTION 'Tabela tipos_contribuinte não existe. Execute primeiro: database/criar_tabela_tipos_contribuinte.sql';
  END IF;
END $$;

-- Verificar se a tabela operacoes_fiscais existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operacoes_fiscais') THEN
    RAISE EXCEPTION 'Tabela operacoes_fiscais não existe. Execute primeiro as migrations de cadastros fiscais.';
  END IF;
END $$;

-- Adicionar coluna se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tipos_contribuinte' 
    AND column_name = 'operacao_fiscal_padrao_id'
  ) THEN
    ALTER TABLE tipos_contribuinte 
      ADD COLUMN operacao_fiscal_padrao_id BIGINT;
    
    -- Adicionar constraint de FK
    ALTER TABLE tipos_contribuinte
      ADD CONSTRAINT fk_tipos_contribuinte_operacao_fiscal
      FOREIGN KEY (operacao_fiscal_padrao_id) 
      REFERENCES operacoes_fiscais(id) 
      ON DELETE SET NULL;
    
    RAISE NOTICE 'Coluna operacao_fiscal_padrao_id criada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna operacao_fiscal_padrao_id já existe';
  END IF;
END $$;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_tipos_contribuinte_operacao_fiscal 
  ON tipos_contribuinte(operacao_fiscal_padrao_id);

-- Adicionar comentário
COMMENT ON COLUMN tipos_contribuinte.operacao_fiscal_padrao_id IS 'Operação fiscal padrão aplicada aos clientes deste tipo';

-- =====================================================
-- 2. ATUALIZAR TIPOS DE CONTRIBUINTE EXISTENTES (EXEMPLOS)
-- =====================================================

-- Exemplo: Atualizar tipos existentes com operações fiscais padrão
-- (Ajuste conforme as operações fiscais cadastradas no seu sistema)

-- Consumidor Final → Operação de Venda Simples (CFOP 5.102)
UPDATE tipos_contribuinte 
SET operacao_fiscal_padrao_id = (
  SELECT id FROM operacoes_fiscais 
  WHERE codigo = 'VENDA-SN' 
    OR cfop_dentro_estado = '5102' 
  LIMIT 1
)
WHERE nome = 'Consumidor Final Não Contribuinte'
  AND operacao_fiscal_padrao_id IS NULL;

-- Contribuinte ICMS → Operação de Venda Normal
UPDATE tipos_contribuinte 
SET operacao_fiscal_padrao_id = (
  SELECT id FROM operacoes_fiscais 
  WHERE tipo_operacao = 'VENDA' 
    AND finalidade = 'NORMAL'
    AND ativo = true
  LIMIT 1
)
WHERE nome = 'Contribuinte ICMS'
  AND operacao_fiscal_padrao_id IS NULL;

-- =====================================================
-- 3. CRIAR VIEW PARA FACILITAR CONSULTAS
-- =====================================================

CREATE OR REPLACE VIEW vw_clientes_com_operacao_padrao AS
SELECT 
  c.id as cliente_id,
  c.codigo as cliente_codigo,
  c.nome_completo,
  c.razao_social,
  c.tipo_pessoa,
  c.cpf,
  c.cnpj,
  
  -- Tipo de Contribuinte
  tc.id as tipo_contribuinte_id,
  tc.nome as tipo_contribuinte_nome,
  tc.consumidor_final,
  tc.contribuinte_icms,
  
  -- Operação Fiscal Padrão (vinda do tipo de contribuinte)
  of.id as operacao_fiscal_padrao_id,
  of.codigo as operacao_fiscal_codigo,
  of.nome as operacao_fiscal_nome,
  of.cfop_dentro_estado,
  of.cfop_fora_estado,
  of.cfop_exterior,
  of.tipo_operacao,
  of.natureza_operacao,
  of.eh_exportacao
  
FROM clientes c
LEFT JOIN tipos_contribuinte tc ON tc.id = c.tipo_contribuinte_id
LEFT JOIN operacoes_fiscais of ON of.id = tc.operacao_fiscal_padrao_id;

COMMENT ON VIEW vw_clientes_com_operacao_padrao IS 
  'View com clientes e suas operações fiscais padrão baseadas no tipo de contribuinte';

-- =====================================================
-- 4. FUNÇÃO HELPER: Obter Operação Fiscal do Cliente
-- =====================================================

CREATE OR REPLACE FUNCTION get_operacao_fiscal_cliente(
  p_cliente_id BIGINT,
  p_uf_destino VARCHAR(2) DEFAULT NULL
)
RETURNS TABLE(
  operacao_fiscal_id BIGINT,
  operacao_fiscal_codigo VARCHAR(10),
  operacao_fiscal_nome VARCHAR(100),
  cfop VARCHAR(5),
  natureza_operacao VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    of.id,
    of.codigo,
    of.nome,
    CASE 
      -- Se UF destino = UF emitente → CFOP dentro do estado
      WHEN p_uf_destino IS NOT NULL AND p_uf_destino = (SELECT estado FROM empresas LIMIT 1) 
        THEN of.cfop_dentro_estado
      -- Se UF destino diferente → CFOP fora do estado  
      WHEN p_uf_destino IS NOT NULL 
        THEN of.cfop_fora_estado
      -- Se não informado, usar CFOP dentro do estado
      ELSE of.cfop_dentro_estado
    END as cfop,
    of.natureza_operacao
  FROM clientes c
  LEFT JOIN tipos_contribuinte tc ON tc.id = c.tipo_contribuinte_id
  LEFT JOIN operacoes_fiscais of ON of.id = tc.operacao_fiscal_padrao_id
  WHERE c.id = p_cliente_id
    AND of.id IS NOT NULL
    AND of.ativo = true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_operacao_fiscal_cliente IS 
  'Retorna a operação fiscal padrão do cliente baseada no tipo de contribuinte';

-- =====================================================
-- 5. EXEMPLOS DE TIPOS DE CONTRIBUINTE ESPECÍFICOS
-- =====================================================

-- Inserir tipos de contribuinte para casos específicos
INSERT INTO tipos_contribuinte (nome, descricao, consumidor_final, contribuinte_icms) VALUES
  ('Cliente Zona Franca de Manaus', 
   'Cliente localizado na Zona Franca de Manaus - Requer CFOP específico (6.109)', 
   false, 
   'CONTRIBUINTE'),
   
  ('Cliente com Suframa', 
   'Cliente com inscrição SUFRAMA ativa', 
   false, 
   'CONTRIBUINTE'),
   
  ('Produtor Rural', 
   'Produtor rural sem inscrição estadual', 
   false, 
   'NAO_CONTRIBUINTE'),
   
  ('Revenda/Distribuidor', 
   'Cliente que revende produtos (substituição tributária)', 
   false, 
   'CONTRIBUINTE'),
   
  ('Consumidor Final Pessoa Física', 
   'Pessoa física consumidora final', 
   true, 
   'NAO_CONTRIBUINTE')
ON CONFLICT (nome) DO NOTHING;

-- =====================================================
-- 6. ATUALIZAR POLÍTICAS RLS (se necessário)
-- =====================================================

-- Garantir que operacoes_fiscais esteja acessível
-- (Já deve estar configurado, mas garantir)

-- =====================================================
-- 7. VERIFICAÇÃO
-- =====================================================

-- Ver tipos de contribuinte com operações fiscais
SELECT 
  tc.id,
  tc.nome as tipo_contribuinte,
  tc.contribuinte_icms,
  of.codigo as operacao_codigo,
  of.nome as operacao_nome,
  of.cfop_dentro_estado,
  of.cfop_fora_estado
FROM tipos_contribuinte tc
LEFT JOIN operacoes_fiscais of ON of.id = tc.operacao_fiscal_padrao_id
ORDER BY tc.nome;

-- Testar a função helper
SELECT * FROM get_operacao_fiscal_cliente(
  (SELECT id FROM clientes LIMIT 1),  -- ID de um cliente qualquer
  'SP'  -- UF de destino
);

-- Ver clientes com suas operações fiscais padrão
SELECT 
  cliente_codigo,
  COALESCE(razao_social, nome_completo) as cliente_nome,
  tipo_contribuinte_nome,
  operacao_fiscal_nome,
  cfop_dentro_estado,
  natureza_operacao
FROM vw_clientes_com_operacao_padrao
WHERE operacao_fiscal_padrao_id IS NOT NULL
LIMIT 10;

-- =====================================================
-- ✅ RESULTADO ESPERADO
-- =====================================================
-- 1. Campo operacao_fiscal_padrao_id adicionado
-- 2. View vw_clientes_com_operacao_padrao criada
-- 3. Função get_operacao_fiscal_cliente() disponível
-- 4. Sistema pronto para pré-selecionar operação fiscal ao escolher cliente
