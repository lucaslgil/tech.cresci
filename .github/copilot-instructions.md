# Sistema de Inventário e Cadastro - Instruções para Copilot

## Regras obrigatórias do projeto:
1. Sempre ler o arquivo `regras_do_sistema.txt` antes de gerar ou modificar código
2. Toda nova funcionalidade deve ser documentada na página `/documentacao`
3. Usar componentização moderna em React com hooks e Context API
4. Utilizar Supabase para auth e banco de dados
5. Seguir a estrutura organizacional por domínios (/features/)
6. Manter UI limpa, responsiva e moderna com TailwindCSS

## Estrutura do projeto:
- Frontend: React + TypeScript + Vite + TailwindCSS
- Backend: Supabase (auth + database)
- Organização: Por features/domínios

## Menus do sistema:
1. **CADASTRO**
   - Empresa
   - Colaborador
2. **INVENTÁRIO**
   - Cadastrar Item

## Responsabilidades:
- Ler regras_do_sistema.txt antes de qualquer alteração
- Atualizar documentação conforme mudanças
- Seguir padrões de código definidos
- Manter componentização e reutilização