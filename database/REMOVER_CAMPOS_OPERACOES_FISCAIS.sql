-- =====================================================
-- REMOVER CAMPOS DESNECESSÁRIOS DE OPERAÇÕES FISCAIS
-- Execute este script no Supabase SQL Editor
-- Data: 14/01/2026
-- =====================================================
-- 
-- Este script remove os campos que não são necessários
-- na tabela de operações fiscais:
-- - mensagem_nota
-- - movimenta_estoque
-- - movimenta_financeiro
-- - gera_duplicata
-- - gera_comissao
-- 
-- Esses campos eram mais úteis para controle de
-- processos internos de vendas, não para configuração
-- fiscal de notas fiscais.
-- 
-- =====================================================

-- =====================================================
-- 1. REMOVER CAMPOS DA TABELA OPERACOES_FISCAIS
-- =====================================================

ALTER TABLE operacoes_fiscais 
  DROP COLUMN IF EXISTS mensagem_nota,
  DROP COLUMN IF EXISTS movimenta_estoque,
  DROP COLUMN IF EXISTS movimenta_financeiro,
  DROP COLUMN IF EXISTS gera_duplicata,
  DROP COLUMN IF EXISTS gera_comissao;

-- =====================================================
-- 2. ATUALIZAR COMENTÁRIOS DA TABELA
-- =====================================================

COMMENT ON TABLE operacoes_fiscais IS 'Operações fiscais: configuração de CFOPs, natureza da operação e comportamento tributário para emissão de notas fiscais';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

SELECT 'Campos removidos com sucesso da tabela operacoes_fiscais!' AS resultado;
