-- ====================================
-- SCRIPT PARA CRIAR USUÁRIO DE TESTE
-- Execute este script APÓS o supabase_setup.sql
-- ====================================

-- ====================================
-- PASSO A PASSO PARA CRIAR USUÁRIO DE TESTE
-- ====================================

-- MÉTODO 1: Via Dashboard do Supabase (RECOMENDADO)
-- 1. Vá para: https://supabase.com/dashboard/project/alylochrlvgcvjdmkmum
-- 2. Clique em "Authentication" no menu lateral
-- 3. Clique em "Users"
-- 4. Clique em "Add user" (botão verde)
-- 5. Preencha:
--    Email: admin@teste.com
--    Password: 123456
--    Email Confirmed: ✓ (marque a caixa)
-- 6. Clique em "Create user"

-- MÉTODO 2: Habilitar Sign-up público (alternativa)
-- 1. Vá para Authentication > Settings
-- 2. Encontre "User Signups" 
-- 3. Ative "Enable email confirmations"
-- 4. Depois use o formulário do sistema para criar a conta

-- Alternativamente, execute este JavaScript no console do seu navegador 
-- (na página do sistema) para criar o usuário:

/*
// Cole este código no console do navegador (F12):
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://alylochrlvgcvjdmkmum.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFseWxvY2hybHZnY3ZqZG1rbXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDcwMjAsImV4cCI6MjA3NTkyMzAyMH0.Jw6iJqy1JthecYfFKNJcftI-5yi_YyGL44f9hNQgqIY'
);

// Criar usuário de teste
supabaseClient.auth.signUp({
  email: 'admin@teste.com',
  password: '123456'
}).then(result => {
  console.log('Usuário criado:', result);
}).catch(error => {
  console.error('Erro:', error);
});
*/

-- Para verificar se as tabelas foram criadas corretamente:
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('empresas', 'colaboradores', 'itens')
ORDER BY table_name, ordinal_position;

-- Para verificar os dados de exemplo:
SELECT 'empresas' as tabela, count(*) as registros FROM empresas
UNION ALL
SELECT 'colaboradores' as tabela, count(*) as registros FROM colaboradores  
UNION ALL
SELECT 'itens' as tabela, count(*) as registros FROM itens;