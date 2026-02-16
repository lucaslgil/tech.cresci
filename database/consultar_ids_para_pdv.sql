-- =====================================================
-- CONSULTAR IDs PARA CONFIGURAÇÃO DO FLASH PDV
-- =====================================================

-- Use este script para descobrir os IDs necessários
-- para configurar o PDV no Passo 2

-- =====================================================
-- 1. LISTAR EMPRESAS DISPONÍVEIS
-- =====================================================

SELECT 
  id as empresa_id,
  razao_social,
  nome_fantasia,
  cnpj,
  ativo
FROM empresas
WHERE ativo = true
ORDER BY nome_fantasia;

-- Anote o ID (empresa_id) da empresa que vai usar no PDV

-- =====================================================
-- 2. LISTAR USUÁRIOS DA SUA EMPRESA
-- =====================================================

-- SUBSTITUA 1 pelo ID da sua empresa encontrado acima
SELECT 
  u.id as usuario_id,
  u.email,
  u.nome,
  u.empresa_id,
  e.nome_fantasia as empresa_nome
FROM usuarios u
LEFT JOIN empresas e ON e.id = u.empresa_id
WHERE u.empresa_id = 1  -- <-- COLOQUE O ID DA SUA EMPRESA AQUI
  AND u.ativo = true
ORDER BY u.nome;

-- Anote o ID (usuario_id) do usuário que será o operador do PDV

-- =====================================================
-- 3. FORMATO PARA O PDV
-- =====================================================

-- Depois de encontrar os valores, use assim no PDV:

-- EXEMPLO:
-- Empresa ID: 1
-- Nome da Empresa: Minha Empresa Ltda
-- Usuário ID: abc123-def456-ghi789  (UUID do Supabase Auth)
-- Nome do Operador: João Silva

-- =====================================================
-- 4. SE NÃO TIVER USUÁRIO, CRIAR UM OPERADOR DE PDV
-- =====================================================

-- Opção A: Criar via Supabase Dashboard
-- 1. Acesse: Supabase Dashboard → Authentication → Users
-- 2. Clique em "Add user" → "Create new user"
-- 3. Email: pdv01@suaempresa.com
-- 4. Password: SenhaSegura123!
-- 5. Confirme e copie o UUID gerado

-- Opção B: Criar direto no banco (após Auth existir)
/*
-- Primeiro, crie o usuário no Supabase Auth via Dashboard
-- Depois, vincule à empresa:

INSERT INTO usuarios (
  id,              -- UUID do Supabase Auth
  email,
  nome,
  empresa_id,
  ativo
) VALUES (
  'uuid-do-auth',  -- Cole o UUID do Supabase Auth aqui
  'pdv01@suaempresa.com',
  'Operador PDV 01',
  1,               -- ID da sua empresa
  true
);
*/

-- =====================================================
-- 5. VERIFICAR CONFIGURAÇÃO
-- =====================================================

-- Depois de configurar o PDV, verifique se está correto:

SELECT 
  u.id as usuario_id,
  u.nome as operador,
  u.email,
  e.id as empresa_id,
  e.nome_fantasia as empresa
FROM usuarios u
LEFT JOIN empresas e ON e.id = u.empresa_id
WHERE u.id = 'cole-o-uuid-aqui';  -- <-- UUID do operador do PDV

-- =====================================================
-- 📝 RESUMO DOS DADOS NECESSÁRIOS
-- =====================================================

-- Para configurar o FLASH PDV você precisa de:

-- ✅ URL do Supabase: https://xxx.supabase.co
-- ✅ Anon Key: eyJhbGc... (encontrado no Dashboard)
-- ✅ Empresa ID: número (da query 1 acima)
-- ✅ Nome da Empresa: texto
-- ✅ Usuário ID: UUID (da query 2 acima)
-- ✅ Nome do Operador: texto
