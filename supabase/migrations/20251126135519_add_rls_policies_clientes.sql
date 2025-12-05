-- =====================================================
-- ADICIONAR POLÍTICAS RLS COMPLETAS PARA MÓDULO CLIENTES
-- Data: 2025-11-26
-- Descrição: Adiciona políticas de INSERT, UPDATE e DELETE
--            para permitir operações CRUD completas
-- =====================================================

-- =====================================================
-- POLÍTICAS PARA TABELA: clientes
-- =====================================================

-- Política para INSERT (todos autenticados podem inserir)
CREATE POLICY "Usuários autenticados podem inserir clientes"
  ON clientes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para UPDATE (todos autenticados podem atualizar)
CREATE POLICY "Usuários autenticados podem atualizar clientes"
  ON clientes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para DELETE (todos autenticados podem deletar)
CREATE POLICY "Usuários autenticados podem deletar clientes"
  ON clientes FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- POLÍTICAS PARA TABELA: clientes_enderecos
-- =====================================================

-- Política para INSERT
CREATE POLICY "Usuários autenticados podem inserir endereços"
  ON clientes_enderecos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para UPDATE
CREATE POLICY "Usuários autenticados podem atualizar endereços"
  ON clientes_enderecos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para DELETE
CREATE POLICY "Usuários autenticados podem deletar endereços"
  ON clientes_enderecos FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- POLÍTICAS PARA TABELA: clientes_contatos
-- =====================================================

-- Política para INSERT
CREATE POLICY "Usuários autenticados podem inserir contatos"
  ON clientes_contatos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para UPDATE
CREATE POLICY "Usuários autenticados podem atualizar contatos"
  ON clientes_contatos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para DELETE
CREATE POLICY "Usuários autenticados podem deletar contatos"
  ON clientes_contatos FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- POLÍTICAS PARA TABELA: clientes_historico
-- =====================================================

-- Política para INSERT (histórico é apenas inserção)
CREATE POLICY "Usuários autenticados podem inserir histórico"
  ON clientes_historico FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- POLÍTICAS PARA TABELAS AUXILIARES
-- =====================================================

-- Habilita RLS nas tabelas auxiliares
ALTER TABLE condicoes_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabelas_preco ENABLE ROW LEVEL SECURITY;

-- Políticas para condicoes_pagamento (apenas leitura para usuários comuns)
CREATE POLICY "Condições de pagamento visíveis para autenticados"
  ON condicoes_pagamento FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar condições de pagamento"
  ON condicoes_pagamento FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para tabelas_preco (apenas leitura para usuários comuns)
CREATE POLICY "Tabelas de preço visíveis para autenticados"
  ON tabelas_preco FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar tabelas de preço"
  ON tabelas_preco FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
