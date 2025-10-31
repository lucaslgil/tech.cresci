# 🚀 COMO USAR O SISTEMA

## Status Atual
✅ **Sistema configurado com Supabase**
✅ **CSS TailwindCSS funcionando**
✅ **Interface estilizada e moderna**

## 🔐 DADOS DE LOGIN
**Email:** `admin@teste.com`  
**Senha:** `123456`

## Acesso Rápido
1. **Abrir o navegador**: http://localhost:5174
2. **Fazer login** com as credenciais acima
3. **Ou criar sua própria conta** com qualquer email

## ⚠️ IMPORTANTE - PRIMEIRO ACESSO
Antes de fazer login, você precisa executar os scripts SQL no Supabase:

### Passo 1: Executar SQL Principal
1. Vá para https://supabase.com/dashboard
2. Abra seu projeto
3. Clique em "SQL Editor"
4. Cole todo o conteúdo do arquivo `supabase_setup.sql`
5. Clique em "Run"

### Passo 2: Criar Usuário de Teste
1. Vá para Authentication > Users
2. Clique em "Add user"
3. Email: `admin@teste.com`
4. Password: `123456`
5. Desmarque "Send confirmation email"
6. Clique em "Create user"

## Funcionalidades Disponíveis no Demo
- ✅ **Dashboard**: Visão geral do sistema
- ✅ **Cadastro de Empresa**: Formulário completo
- ✅ **Cadastro de Colaborador**: Com lista de empresas demo
- ✅ **Cadastro de Item**: Gerenciamento de inventário
- ✅ **Documentação**: Documentação completa do sistema

## Para Funcionalidade Completa (Opcional)
Se quiser salvar dados de verdade, configure o Supabase:

1. **Criar conta gratuita**: https://supabase.com
2. **Criar novo projeto**
3. **Copiar as credenciais** para o arquivo `.env`:
   ```
   VITE_SUPABASE_URL=sua_url_aqui
   VITE_SUPABASE_ANON_KEY=sua_chave_aqui
   ```
4. **Executar os SQL scripts** do README_SISTEMA.md
5. **Reiniciar o servidor**: `npm run dev`

## Comandos Úteis
```bash
npm run dev     # Iniciar servidor (já rodando)
npm run build   # Build para produção
npm run preview # Preview do build
```

## Estrutura do Sistema
- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Supabase (quando configurado)
- **Autenticação**: Supabase Auth + modo demo
- **UI**: Design limpo e responsivo

---
**Aproveite explorando o sistema! 🎉**