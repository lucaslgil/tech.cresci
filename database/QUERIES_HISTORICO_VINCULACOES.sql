-- ========================================
-- QUERIES ÚTEIS: Histórico de Vinculações
-- ========================================
-- Consultas prontas para análise e relatórios
-- ========================================

-- 1. VER TODO O HISTÓRICO (ordenado por data mais recente)
SELECT 
  acao,
  data_acao,
  colaborador_nome,
  item_codigo,
  item_nome,
  item_valor,
  usuario_acao
FROM historico_vinculacao_itens
ORDER BY data_acao DESC;

-- 2. HISTÓRICO DE UM COLABORADOR ESPECÍFICO
SELECT 
  acao,
  data_acao,
  item_codigo,
  item_nome,
  item_categoria,
  item_valor,
  usuario_acao,
  observacao
FROM historico_vinculacao_itens
WHERE colaborador_nome ILIKE '%Nome do Colaborador%'
ORDER BY data_acao DESC;

-- 3. HISTÓRICO DE UM ITEM ESPECÍFICO
SELECT 
  acao,
  data_acao,
  colaborador_nome,
  colaborador_cargo,
  colaborador_setor,
  usuario_acao
FROM historico_vinculacao_itens
WHERE item_codigo = 'ITEM-001'
ORDER BY data_acao DESC;

-- 4. ITENS QUE FORAM VINCULADOS E DESVINCULADOS (movimentação)
SELECT 
  item_codigo,
  item_nome,
  COUNT(*) as total_movimentacoes,
  SUM(CASE WHEN acao = 'vinculado' THEN 1 ELSE 0 END) as vinculacoes,
  SUM(CASE WHEN acao = 'desvinculado' THEN 1 ELSE 0 END) as desvinculacoes
FROM historico_vinculacao_itens
GROUP BY item_codigo, item_nome
HAVING COUNT(*) > 1
ORDER BY total_movimentacoes DESC;

-- 5. COLABORADORES COM MAIS MOVIMENTAÇÕES
SELECT 
  colaborador_nome,
  colaborador_cargo,
  COUNT(*) as total_movimentacoes,
  SUM(CASE WHEN acao = 'vinculado' THEN 1 ELSE 0 END) as itens_recebidos,
  SUM(CASE WHEN acao = 'desvinculado' THEN 1 ELSE 0 END) as itens_devolvidos,
  SUM(item_valor) as valor_total_movimentado
FROM historico_vinculacao_itens
GROUP BY colaborador_nome, colaborador_cargo
ORDER BY total_movimentacoes DESC;

-- 6. MOVIMENTAÇÕES POR PERÍODO (último mês)
SELECT 
  DATE(data_acao) as dia,
  COUNT(*) as total_acoes,
  SUM(CASE WHEN acao = 'vinculado' THEN 1 ELSE 0 END) as vinculacoes,
  SUM(CASE WHEN acao = 'desvinculado' THEN 1 ELSE 0 END) as desvinculacoes
FROM historico_vinculacao_itens
WHERE data_acao >= NOW() - INTERVAL '30 days'
GROUP BY DATE(data_acao)
ORDER BY dia DESC;

-- 7. VALOR TOTAL MOVIMENTADO POR SETOR
SELECT 
  colaborador_setor,
  COUNT(DISTINCT colaborador_id) as total_colaboradores,
  COUNT(*) as total_movimentacoes,
  SUM(item_valor) as valor_total_movimentado,
  AVG(item_valor) as valor_medio_item
FROM historico_vinculacao_itens
WHERE acao = 'vinculado'
GROUP BY colaborador_setor
ORDER BY valor_total_movimentado DESC;

-- 8. ÚLTIMAS 10 AÇÕES NO SISTEMA
SELECT 
  acao,
  data_acao,
  colaborador_nome,
  item_codigo,
  item_nome,
  item_valor,
  usuario_acao
FROM historico_vinculacao_itens
ORDER BY data_acao DESC
LIMIT 10;

-- 9. ITENS NUNCA DESVINCULADOS (vinculados uma única vez)
SELECT 
  item_codigo,
  item_nome,
  item_categoria,
  item_valor,
  colaborador_nome,
  data_acao as data_vinculacao
FROM historico_vinculacao_itens
WHERE item_id IN (
  SELECT item_id
  FROM historico_vinculacao_itens
  GROUP BY item_id
  HAVING COUNT(*) = 1 AND MAX(acao) = 'vinculado'
)
ORDER BY data_acao DESC;

-- 10. ANÁLISE DE USUÁRIOS QUE MAIS FAZEM AÇÕES
SELECT 
  usuario_acao,
  COUNT(*) as total_acoes,
  SUM(CASE WHEN acao = 'vinculado' THEN 1 ELSE 0 END) as vinculacoes_feitas,
  SUM(CASE WHEN acao = 'desvinculado' THEN 1 ELSE 0 END) as desvinculacoes_feitas,
  MIN(data_acao) as primeira_acao,
  MAX(data_acao) as ultima_acao
FROM historico_vinculacao_itens
GROUP BY usuario_acao
ORDER BY total_acoes DESC;

-- 11. ITENS DESVINCULADOS COM OBSERVAÇÃO (possíveis problemas)
SELECT 
  data_acao,
  item_codigo,
  item_nome,
  colaborador_nome,
  observacao,
  usuario_acao
FROM historico_vinculacao_itens
WHERE acao = 'desvinculado' 
  AND observacao IS NOT NULL
ORDER BY data_acao DESC;

-- 12. RELATÓRIO COMPLETO DE UM COLABORADOR
SELECT 
  h.acao,
  h.data_acao,
  h.item_codigo,
  h.item_nome,
  h.item_modelo,
  h.item_categoria,
  h.item_numero_serie,
  h.item_valor,
  h.usuario_acao,
  h.observacao,
  -- Status atual do item
  CASE 
    WHEN i.responsavel_id = h.colaborador_id THEN 'Ainda vinculado'
    WHEN i.responsavel_id IS NULL THEN 'Disponível'
    ELSE 'Vinculado a outro'
  END as status_atual_item
FROM historico_vinculacao_itens h
LEFT JOIN itens i ON h.item_id = i.id
WHERE h.colaborador_id = 'UUID-DO-COLABORADOR'
ORDER BY h.data_acao DESC;

-- 13. ITENS QUE MUDARAM DE COLABORADOR
WITH item_transfers AS (
  SELECT 
    item_id,
    item_codigo,
    item_nome,
    LAG(colaborador_nome) OVER (PARTITION BY item_id ORDER BY data_acao) as colaborador_anterior,
    colaborador_nome as colaborador_atual,
    data_acao,
    acao
  FROM historico_vinculacao_itens
)
SELECT *
FROM item_transfers
WHERE colaborador_anterior IS NOT NULL 
  AND colaborador_anterior != colaborador_atual
  AND acao = 'vinculado'
ORDER BY data_acao DESC;

-- 14. ESTATÍSTICAS GERAIS DO SISTEMA
SELECT 
  COUNT(*) as total_registros,
  COUNT(DISTINCT colaborador_id) as colaboradores_unicos,
  COUNT(DISTINCT item_id) as itens_unicos,
  SUM(CASE WHEN acao = 'vinculado' THEN 1 ELSE 0 END) as total_vinculacoes,
  SUM(CASE WHEN acao = 'desvinculado' THEN 1 ELSE 0 END) as total_desvinculacoes,
  SUM(item_valor) as valor_total_movimentado,
  AVG(item_valor) as valor_medio_item,
  MIN(data_acao) as primeira_acao_sistema,
  MAX(data_acao) as ultima_acao_sistema
FROM historico_vinculacao_itens;

-- 15. ITENS DE ALTO VALOR MOVIMENTADOS (acima de R$ 1.000)
SELECT 
  item_codigo,
  item_nome,
  item_valor,
  colaborador_nome,
  acao,
  data_acao,
  usuario_acao
FROM historico_vinculacao_itens
WHERE item_valor > 1000
ORDER BY item_valor DESC, data_acao DESC;

-- 16. BUSCAR POR PERÍODO ESPECÍFICO
SELECT 
  acao,
  data_acao,
  colaborador_nome,
  item_codigo,
  item_nome,
  item_valor
FROM historico_vinculacao_itens
WHERE data_acao BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY data_acao DESC;

-- 17. RANKING DE CATEGORIAS MAIS MOVIMENTADAS
SELECT 
  item_categoria,
  COUNT(*) as total_movimentacoes,
  COUNT(DISTINCT item_id) as itens_diferentes,
  SUM(item_valor) as valor_total,
  AVG(item_valor) as valor_medio
FROM historico_vinculacao_itens
GROUP BY item_categoria
ORDER BY total_movimentacoes DESC;

-- 18. ITENS COM HISTÓRICO COMPLETO (vinculados e devolvidos)
SELECT 
  h.item_codigo,
  h.item_nome,
  h.item_categoria,
  COUNT(*) as total_ciclos,
  STRING_AGG(
    CONCAT(h.acao, ' - ', h.colaborador_nome, ' (', DATE(h.data_acao), ')'),
    ' → '
    ORDER BY h.data_acao
  ) as historico_completo
FROM historico_vinculacao_itens h
GROUP BY h.item_codigo, h.item_nome, h.item_categoria
HAVING COUNT(*) >= 2
ORDER BY total_ciclos DESC;

-- 19. EXPORT PARA CSV (copie resultado e salve como .csv)
SELECT 
  TO_CHAR(data_acao, 'DD/MM/YYYY HH24:MI:SS') as data_hora,
  acao,
  colaborador_nome,
  colaborador_cpf_cnpj,
  colaborador_cargo,
  colaborador_setor,
  item_codigo,
  item_nome,
  item_modelo,
  item_categoria,
  item_numero_serie,
  TO_CHAR(item_valor, 'FM999G999G990D00') as valor,
  usuario_acao,
  COALESCE(observacao, '') as observacao
FROM historico_vinculacao_itens
ORDER BY data_acao DESC;

-- 20. LIMPAR REGISTROS DE TESTE (USE COM CUIDADO!)
-- DELETE FROM historico_vinculacao_itens 
-- WHERE usuario_acao LIKE '%teste%' 
-- OR observacao LIKE '%teste%';

-- ========================================
-- DICAS DE USO:
-- ========================================
-- 1. Substitua 'UUID-DO-COLABORADOR' pelo ID real
-- 2. Ajuste os períodos de data conforme necessário
-- 3. Use ILIKE para buscas case-insensitive
-- 4. Para exportar, copie resultado e cole no Excel
-- 5. Crie VIEWS para queries que você usa frequentemente
-- ========================================
