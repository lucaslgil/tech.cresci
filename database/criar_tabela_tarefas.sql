-- Script para criar tabela de tarefas/chamados
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de tarefas
CREATE TABLE IF NOT EXISTS tarefas (
  id BIGSERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  solicitante VARCHAR(200) NOT NULL,
  email_solicitante VARCHAR(200),
  categoria VARCHAR(100),
  prioridade VARCHAR(20) NOT NULL DEFAULT 'Média',
  status VARCHAR(50) NOT NULL DEFAULT 'Aberto',
  responsavel_id BIGINT REFERENCES colaboradores(id) ON DELETE SET NULL,
  data_abertura TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT check_prioridade CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Urgente')),
  CONSTRAINT check_status CHECK (status IN ('Aberto', 'Em Andamento', 'Aguardando', 'Concluído', 'Cancelado'))
);

-- 2. Comentários nas colunas
COMMENT ON TABLE tarefas IS 'Tabela para gerenciar tarefas e chamados de atendimento';
COMMENT ON COLUMN tarefas.id IS 'Identificador único da tarefa';
COMMENT ON COLUMN tarefas.titulo IS 'Título/assunto da tarefa';
COMMENT ON COLUMN tarefas.descricao IS 'Descrição detalhada da tarefa/problema';
COMMENT ON COLUMN tarefas.solicitante IS 'Nome da pessoa que solicitou';
COMMENT ON COLUMN tarefas.email_solicitante IS 'Email do solicitante';
COMMENT ON COLUMN tarefas.categoria IS 'Categoria da tarefa (TI, RH, Manutenção, etc)';
COMMENT ON COLUMN tarefas.prioridade IS 'Prioridade: Baixa, Média, Alta, Urgente';
COMMENT ON COLUMN tarefas.status IS 'Status atual: Aberto, Em Andamento, Aguardando, Concluído, Cancelado';
COMMENT ON COLUMN tarefas.responsavel_id IS 'Colaborador responsável pelo atendimento';
COMMENT ON COLUMN tarefas.data_abertura IS 'Data/hora de abertura da tarefa';
COMMENT ON COLUMN tarefas.data_conclusao IS 'Data/hora de conclusão da tarefa';
COMMENT ON COLUMN tarefas.observacoes IS 'Observações e anotações do atendimento';

-- 3. Índices para otimização
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_prioridade ON tarefas(prioridade);
CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel ON tarefas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_categoria ON tarefas(categoria);
CREATE INDEX IF NOT EXISTS idx_tarefas_data_abertura ON tarefas(data_abertura DESC);

-- 4. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_tarefas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tarefas_timestamp
    BEFORE UPDATE ON tarefas
    FOR EACH ROW
    EXECUTE FUNCTION update_tarefas_updated_at();

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de acesso
CREATE POLICY "Permitir leitura de tarefas para todos autenticados"
ON tarefas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir inserção de tarefas para QUALQUER PESSOA (anônima ou autenticada)"
ON tarefas FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Permitir atualização de tarefas para todos autenticados"
ON tarefas FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir exclusão de tarefas para todos autenticados"
ON tarefas FOR DELETE
TO authenticated
USING (true);

-- 7. Verificar a estrutura
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tarefas'
ORDER BY ordinal_position;
