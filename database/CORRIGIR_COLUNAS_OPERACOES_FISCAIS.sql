-- =====================================================
-- CORRIGIR TODAS AS COLUNAS DE OPERAÇÕES FISCAIS
-- Execute este script no Supabase SQL Editor
-- Data: 14/01/2026
-- =====================================================
-- 
-- Este script garante que TODAS as colunas necessárias
-- existam na tabela operacoes_fiscais
-- 
-- =====================================================

-- =====================================================
-- 1. ADICIONAR TODAS AS COLUNAS SE NÃO EXISTIREM
-- =====================================================

-- Colunas básicas
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS codigo VARCHAR(10);
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS nome VARCHAR(100);
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS descricao TEXT;

-- CFOP
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS cfop_dentro_estado VARCHAR(5);
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS cfop_fora_estado VARCHAR(5);
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS cfop_exterior VARCHAR(5);

-- Tipo e natureza
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS tipo_operacao VARCHAR(20);
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS finalidade VARCHAR(20);
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS natureza_operacao VARCHAR(100);

-- Flags de cálculo (MANTER)
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS calcular_icms BOOLEAN DEFAULT true;
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS calcular_ipi BOOLEAN DEFAULT true;
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS calcular_pis BOOLEAN DEFAULT true;
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS calcular_cofins BOOLEAN DEFAULT true;
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS calcular_st BOOLEAN DEFAULT false;

-- Outras colunas
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE operacoes_fiscais ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- =====================================================
-- 2. ATUALIZAR VALORES NULOS
-- =====================================================

UPDATE operacoes_fiscais
SET 
  calcular_icms = COALESCE(calcular_icms, true),
  calcular_ipi = COALESCE(calcular_ipi, true),
  calcular_pis = COALESCE(calcular_pis, true),
  calcular_cofins = COALESCE(calcular_cofins, true),
  calcular_st = COALESCE(calcular_st, false),
  ativo = COALESCE(ativo, true);

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

SELECT 'Todas as colunas de operacoes_fiscais foram adicionadas com sucesso!' AS resultado;
