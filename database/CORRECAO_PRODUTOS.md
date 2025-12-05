# CORREÇÃO URGENTE - Erro ao Cadastrar Produtos

## Problema
A tabela `produtos` está sem as colunas fiscais necessárias (aliquota_cofins, aliquota_pis, etc), causando erro ao salvar produtos.

## Solução Imediata

### PASSO 1: Aplicar SQL no Supabase

1. Acesse: https://supabase.com/dashboard/project/alylochrlvgcvjdmkmum/sql

2. Copie e cole o conteúdo do arquivo `APLICAR_URGENTE_produtos.sql` no editor SQL

3. Clique em **RUN** para executar

4. Verifique se a última query retorna as colunas criadas

### PASSO 2: Testar o Cadastro

1. Recarregue a página do sistema (F5)

2. Vá em **Cadastro** → **Produtos**

3. Clique em **Novo Produto**

4. Preencha os dados básicos:
   - Nome
   - Código Interno
   - NCM
   - Categoria

5. Na aba **Dados Fiscais**, preencha:
   - CFOP de Entrada: 1102
   - CFOP de Saída: 5102
   - Regime Tributário: Simples Nacional
   - CSOSN ICMS: 101
   - CST PIS: 01
   - Alíquota PIS: 0.65
   - CST COFINS: 01
   - Alíquota COFINS: 3.00

6. Clique em **Cadastrar**

7. Se funcionar, verá mensagem de sucesso ✅

## O que foi feito

A migration `20251201152000_refatorar_tabela_produtos.sql` havia removido as colunas fiscais da tabela produtos com a intenção de normalizar o banco de dados, mas isso quebrou o cadastro de produtos.

A solução foi adicionar essas colunas de volta para que o sistema continue funcionando normalmente.

## Alternativa Futura

No futuro, podemos implementar um modelo normalizado onde:
- Os dados fiscais ficam em tabelas separadas (operacoes_fiscais, ncm_cadastro, etc)
- A tabela produtos tem apenas referências (FK) para essas tabelas
- A lógica de negócio busca os dados fiscais conforme a operação

Mas por enquanto, mantemos a estrutura atual funcionando.
