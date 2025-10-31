# Template para Importação de Colaboradores

## Formato do Arquivo Excel

O arquivo Excel deve conter as seguintes colunas (os nomes podem estar em maiúsculas ou minúsculas):

### Colunas Obrigatórias:
- **nome** ou **Nome**: Nome completo do colaborador
- **email** ou **Email**: Email do colaborador
- **empresa** ou **Empresa** ou **empresa_id**: Nome da empresa ou ID da empresa

### Colunas Opcionais:
- **cpf** ou **CPF**: CPF do colaborador (para pessoa física)
- **cnpj** ou **CNPJ**: CNPJ do colaborador (para pessoa jurídica)
- **telefone** ou **Telefone**: Telefone do colaborador
- **setor** ou **Setor**: Setor do colaborador
- **cargo** ou **Cargo**: Cargo do colaborador
- **status** ou **Status**: Status do colaborador (Ativo/Inativo, padrão: Ativo)

## Exemplo de Estrutura

| nome | email | empresa | cpf | telefone | setor | cargo | status |
|------|-------|---------|-----|----------|-------|-------|--------|
| João Silva | joao@email.com | Empresa XYZ | 123.456.789-00 | (11) 98765-4321 | TI | Desenvolvedor | Ativo |
| Maria Santos | maria@email.com | Empresa ABC | 987.654.321-00 | (11) 91234-5678 | RH | Analista | Ativo |

## Observações Importantes:

1. **Nome da Empresa**: Se você usar o nome da empresa (ao invés do ID), ele deve corresponder exatamente ao nome cadastrado no sistema
2. **CPF ou CNPJ**: Informe apenas um deles. Se informar CNPJ, o colaborador será cadastrado como pessoa jurídica
3. **Status**: Se não informado, será cadastrado como "Ativo" por padrão
4. **Erros**: O sistema mostrará uma lista de erros para linhas inválidas, mas importará as linhas válidas

## Como Importar:

1. Prepare seu arquivo Excel seguindo o formato acima
2. Acesse a tela de **Gestão de Colaboradores**
3. Clique no botão **"Importar Excel"**
4. Selecione seu arquivo `.xlsx` ou `.xls`
5. Aguarde a confirmação da importação
6. Verifique se há mensagens de erro para linhas que não foram importadas

## Dicas:

- Certifique-se de que todas as empresas já estejam cadastradas no sistema antes de importar
- Revise o arquivo para evitar dados duplicados
- Use o formato de email válido para evitar erros
- Mantenha os nomes das colunas exatamente como especificado (maiúsculas/minúsculas são aceitas)
