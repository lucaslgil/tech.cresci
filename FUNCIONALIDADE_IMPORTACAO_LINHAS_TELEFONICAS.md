# Funcionalidade de Importação de Linhas Telefônicas via Excel

## Resumo da Implementação
Implementada funcionalidade completa de importação de linhas telefônicas através de arquivos Excel na tela `/inventario/linhas-telefonicas`.

## Data da Implementação
04 de Novembro de 2025

## Arquivos Modificados
- `src/features/inventario/LinhasTelefonicas.tsx`

## Funcionalidades Adicionadas

### 1. Baixar Modelo (Template)
- **Botão**: "Baixar Modelo" (verde)
- **Ação**: Gera e baixa arquivo `template_linhas_telefonicas.xlsx`
- **Conteúdo do Template**:
  - Colunas: Número da Linha, Tipo, Plano, Valor do Plano, Responsável
  - Duas linhas de exemplo com dados pré-preenchidos
  - Larguras de coluna otimizadas para visualização

### 2. Importar Excel
- **Botão**: "Importar Excel" (roxo)
- **Ação**: Permite upload de arquivo .xlsx ou .xls
- **Processamento**:
  - Lê o arquivo Excel
  - Valida cada linha individualmente
  - Busca responsável pelo nome no cadastro de colaboradores
  - Importa apenas linhas válidas
  - Exibe resultado detalhado em modal

### 3. Modal de Resultado
- **Estatísticas visuais**:
  - Card verde: Número de linhas importadas com sucesso
  - Card vermelho: Número de erros encontrados
- **Lista detalhada de erros**:
  - Indica linha do Excel com problema
  - Descreve o erro específico
- **Mensagem de sucesso**: Quando não há erros

## Validações Implementadas

### Campos Obrigatórios
1. **Número da Linha**: Deve estar preenchido
2. **Tipo**: Deve ser "Chip Físico" ou "eSIM" (exatamente)
3. **Plano**: Deve estar preenchido
4. **Valor do Plano**: Não pode ser negativo

### Campo Opcional
- **Responsável**: Pode estar vazio
  - Se preenchido, busca colaborador pelo nome exato (case insensitive)
  - Se não encontrar, gera erro mas continua processando outras linhas

## Formato do Excel

### Colunas Aceitas (ordem não importa)
```
Número da Linha | Tipo         | Plano              | Valor do Plano | Responsável
(11) 98765-4321 | Chip Físico  | Plano Controle 20GB| 79.90          | João Silva
(11) 91234-5678 | eSIM         | Plano Pós 30GB     | 99.90          | (vazio)
```

### Nomes Alternativos de Colunas
O sistema aceita variações de nomenclatura:
- "Número da Linha" ou "numero_linha" ou "Numero da Linha"
- "Tipo" ou "tipo"
- "Plano" ou "plano"
- "Valor do Plano" ou "valor_plano" ou "Valor do Plano"
- "Responsável" ou "responsavel" ou "Responsavel"

## Fluxo de Uso

1. **Preparar dados**:
   - Clicar em "Baixar Modelo"
   - Abrir arquivo Excel baixado
   - Preencher com dados reais das linhas telefônicas
   - Salvar arquivo

2. **Importar**:
   - Clicar em "Importar Excel"
   - Selecionar arquivo preenchido
   - Aguardar processamento

3. **Verificar resultado**:
   - Modal abre automaticamente
   - Verificar estatísticas (sucessos e erros)
   - Se houver erros, ler detalhes
   - Corrigir erros no Excel
   - Reimportar apenas linhas com erro (ou todas novamente)

4. **Finalizar**:
   - Clicar em "Fechar" no modal
   - Tabela atualiza automaticamente com novas linhas

## Tratamento de Erros

### Erros Comuns e Soluções

1. **"Número da Linha é obrigatório"**
   - Solução: Preencher coluna "Número da Linha"

2. **"Tipo deve ser 'Chip Físico' ou 'eSIM'"**
   - Solução: Usar exatamente um desses valores (com acentos e espaços corretos)

3. **"Plano é obrigatório"**
   - Solução: Preencher coluna "Plano"

4. **"Valor do Plano não pode ser negativo"**
   - Solução: Usar valores positivos ou zero

5. **"Responsável 'Nome' não encontrado"**
   - Solução 1: Verificar se nome está escrito exatamente como no cadastro
   - Solução 2: Deixar campo vazio se não houver responsável
   - Solução 3: Cadastrar colaborador antes de importar

### Comportamento em Caso de Erro
- ❌ Linhas com erro são **puladas** (não importadas)
- ✅ Linhas válidas são **importadas normalmente**
- 📊 Modal exibe resumo: quantas foram importadas e quantas falharam
- 📝 Lista detalhada de erros para correção

## Tecnologias Utilizadas
- **xlsx**: Biblioteca para leitura/escrita de arquivos Excel
- **React Hooks**: useState, useEffect
- **Supabase**: Inserção em lote (bulk insert)
- **TypeScript**: Tipagem forte e validações

## Melhorias Futuras (Sugestões)
1. Permitir atualização de linhas existentes (baseado no número)
2. Exportar linhas cadastradas para Excel
3. Validação de formato de telefone
4. Preview dos dados antes de importar
5. Download de relatório de importação em PDF
6. Importação de responsável por CPF/ID além do nome

## Testes Recomendados

### Cenários de Teste
1. ✅ Importar arquivo vazio (deve exibir erro)
2. ✅ Importar apenas linhas válidas (todas devem ser importadas)
3. ✅ Importar com algumas linhas inválidas (deve importar só as válidas)
4. ✅ Importar com responsáveis existentes e não existentes
5. ✅ Importar com diferentes formatos de número de telefone
6. ✅ Importar com valores decimais (com vírgula e ponto)
7. ✅ Testar tipos: "Chip Físico" e "eSIM"
8. ✅ Importar sem responsável (campo vazio)

## Notas Técnicas

### Estados Adicionados
```typescript
const [showImportModal, setShowImportModal] = useState(false)
const [importResult, setImportResult] = useState<{ 
  success: number; 
  errors: string[] 
}>({ success: 0, errors: [] })
```

### Funções Principais
1. `handleDownloadTemplate()`: Gera e baixa template Excel
2. `handleImportExcel(event)`: Processa arquivo Excel e importa dados

### Integração com Supabase
```typescript
const { data: insertedData, error } = await supabase
  .from('linhas_telefonicas')
  .insert(linhasParaImportar)
  .select()
```

## Interface de Usuário

### Botões no Header (ordem da esquerda para direita)
1. 🟢 **Baixar Modelo** (Verde) - Download do template
2. 🟣 **Importar Excel** (Roxo) - Upload e importação
3. 🔵 **Nova Linha** (Azul) - Cadastro manual (já existia)

### Modal de Resultado
- Design responsivo e moderno
- Cards coloridos para estatísticas
- Lista scrollável de erros
- Ícone de sucesso quando tudo ocorre bem
- Botão de fechar claramente visível

## Acessibilidade
- Botões com ícones e texto
- Cores contrastantes
- Feedback visual claro
- Mensagens de erro descritivas

## Compatibilidade
- ✅ Arquivos .xlsx (Excel moderno)
- ✅ Arquivos .xls (Excel antigo)
- ✅ LibreOffice Calc
- ✅ Google Sheets (exportar como .xlsx)

## Conclusão
Funcionalidade completa e robusta para importação em lote de linhas telefônicas, facilitando o cadastro de múltiplas linhas de uma só vez e reduzindo trabalho manual.
