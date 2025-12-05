# Sistema de Inventário e Cadastro - Instruções para Copilot

## Regras obrigatórias do projeto:
1. Sempre ler o arquivo `regras_do_sistema.txt` antes de gerar ou modificar código
2. Toda nova funcionalidade deve ser documentada na página `/documentacao`
3. Usar componentização moderna em React com hooks e Context API
4. Utilizar Supabase para auth e banco de dados
5. Seguir a estrutura organizacional por domínios (/features/)
6. Manter UI limpa, responsiva e moderna com TailwindCSS
7. **OBRIGATÓRIO:** Seguir o padrão de interface definido em `PADRAO_INTERFACE_SISTEMA.md`

## Padrão de Interface (OBRIGATÓRIO):
- **Cores oficiais:** #394353 (botões/cabeçalhos), #C9C4B5 (bordas)
- **Tipografia:** text-base (títulos), text-sm (inputs), text-xs (labels/tabelas)
- **Espaçamento:** p-4 (containers), p-3 (cards), gap-3 (grids)
- **Tabelas:** Cabeçalho #394353 com texto branco, células com text-xs
- **Botões:** Cor #394353, text-sm font-semibold, hover:opacity-90
- **Consultar:** `PADRAO_INTERFACE_SISTEMA.md` para detalhes completos

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
- **Aplicar PADRAO_INTERFACE_SISTEMA.md em todas as telas**