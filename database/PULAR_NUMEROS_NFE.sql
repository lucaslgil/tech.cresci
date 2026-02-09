-- =====================================================
-- DEBUG E CORREÇÃO - CONTROLE MANUAL DE NUMERAÇÃO
-- Execute este script para resolver o problema
-- Data: 05/02/2026
-- =====================================================

-- 1. VER O QUE TEM ATUALMENTE NO BANCO
SELECT 
    id,
    tipo_nota,
    serie,
    ultimo_numero,
    ultimo_numero + 1 as proximo_numero,
    ambiente,
    ativo,
    created_at,
    updated_at
FROM notas_fiscais_numeracao
ORDER BY ambiente DESC, tipo_nota;

-- 2. GARANTIR QUE O REGISTRO EXISTE
-- Se não existir, cria com número 9 (próximo 10)
INSERT INTO notas_fiscais_numeracao (tipo_nota, serie, ultimo_numero, ambiente, ativo)
VALUES ('NFE', 1, 9, 'HOMOLOGACAO', true)
ON CONFLICT (tipo_nota, serie, ambiente) DO NOTHING;

-- 3. ATUALIZAR MANUALMENTE PARA NÚMERO DESEJADO
-- Mude o valor '50' abaixo para o número que você quer pular
-- Exemplo: Se quer pular até 50, coloque 49 (próximo será 50)
UPDATE notas_fiscais_numeracao
SET 
    ultimo_numero = 50,  -- ⚠️ ALTERE AQUI PARA O NÚMERO DESEJADO
    updated_at = NOW()
WHERE tipo_nota = 'NFE'
  AND serie = 1
  AND ambiente = 'HOMOLOGACAO';

-- 4. VERIFICAR RESULTADO
SELECT 
    tipo_nota,
    serie,
    ultimo_numero as ultimo_usado,
    ultimo_numero + 1 as proxima_nota,
    ambiente,
    CASE WHEN ativo THEN '✓ Automático' ELSE 'Manual' END as modo
FROM notas_fiscais_numeracao
WHERE tipo_nota = 'NFE'
  AND serie = 1
  AND ambiente = 'HOMOLOGACAO';

-- =====================================================
-- RESULTADO ESPERADO:
-- tipo_nota: NFE
-- serie: 1
-- ultimo_usado: 50
-- proxima_nota: 51
-- ambiente: HOMOLOGACAO
-- =====================================================

-- 💡 DICA: Para pular mais números, execute novamente alterando o valor na linha 29
