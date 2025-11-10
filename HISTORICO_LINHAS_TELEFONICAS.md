# Sistema de Histórico de Linhas Telefônicas

## 📋 Visão Geral

Foi implementado um sistema completo de rastreamento de alterações para as Linhas Telefônicas. O sistema registra automaticamente todas as mudanças nos campos **Responsável** e **Usuário/Setor**.

---

## ✨ Funcionalidades

### 1. Registro Automático de Alterações
- ✅ Rastreia mudanças no campo **Responsável**
- ✅ Rastreia mudanças no campo **Usuário/Setor**
- ✅ Armazena valor anterior e valor novo
- ✅ Registra data/hora da alteração
- ✅ Identifica o usuário que fez a alteração

### 2. Visualização do Histórico
- ✅ Botão de histórico (ícone relógio) em cada linha
- ✅ Modal detalhado com todas as alterações
- ✅ Ordenação cronológica (mais recente primeiro)
- ✅ Cores diferentes para cada tipo de campo:
  - **Azul**: Alterações no Responsável
  - **Roxo**: Alterações no Usuário/Setor

### 3. Informações Registradas
Para cada alteração, o sistema armazena:
- **Campo alterado**: Responsável ou Usuário/Setor
- **Valor anterior**: O que estava antes
- **Valor novo**: O que foi definido
- **Data e hora**: Quando foi alterado
- **Usuário**: Quem fez a alteração

---

## 🔧 Configuração no Banco de Dados

### 1. Executar Script SQL

Execute o arquivo `criar_historico_linhas.sql` no SQL Editor do Supabase:

```sql
-- O script irá:
-- 1. Criar a tabela historico_linhas_telefonicas
-- 2. Criar índices para performance
-- 3. Configurar RLS (Row Level Security)
-- 4. Criar políticas de acesso
```

### 2. Estrutura da Tabela

```sql
historico_linhas_telefonicas
├── id (UUID) - Identificador único
├── linha_id (UUID) - Referência à linha telefônica
├── campo_alterado (VARCHAR) - 'responsavel' ou 'usuario_setor'
├── valor_anterior (TEXT) - Valor antes da mudança
├── valor_novo (TEXT) - Valor depois da mudança
├── usuario_id (UUID) - Usuário que fez a alteração
└── data_alteracao (TIMESTAMP) - Data/hora da alteração
```

### 3. Validações

- ✅ Constraint para aceitar apenas 'responsavel' ou 'usuario_setor'
- ✅ Cascade delete (se linha for deletada, histórico também é)
- ✅ Índices para buscas rápidas

---

## 🎯 Como Usar

### Visualizar Histórico de uma Linha

1. **Acesse** a tela de Linhas Telefônicas
2. **Localize** a linha desejada na lista
3. **Clique** no ícone de relógio (🕐) na coluna de Ações
4. **Visualize** todas as alterações registradas

### O que Aparece no Histórico

#### Sem Alterações
```
┌─────────────────────────────────┐
│  Nenhuma alteração registrada   │
│                                 │
│  As alterações nos campos       │
│  "Responsável" e "Usuário/Setor"│
│  serão registradas aqui         │
└─────────────────────────────────┘
```

#### Com Alterações
```
┌─────────────────────────────────────────┐
│ 🔵 Responsável    07/11/2025 14:30      │
│                                         │
│ De:   João Silva                        │
│ Para: Maria Santos        [Mais recente]│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🟣 Usuário/Setor  06/11/2025 10:15      │
│                                         │
│ De:   TI - Suporte                      │
│ Para: Vendas - Comercial                │
└─────────────────────────────────────────┘
```

---

## 🎨 Interface

### Botão de Histórico
- **Localização**: Coluna "Ações" na tabela
- **Posição**: Antes dos botões Editar e Excluir
- **Ícone**: History (relógio)
- **Cor**: Slate (cinza)
- **Hover**: Escurece ao passar o mouse
- **Tooltip**: "Ver Histórico"

### Modal de Histórico
- **Tamanho**: Responsivo (max-width: 768px)
- **Altura**: Máx 90% da viewport
- **Scroll**: Apenas no conteúdo (header/footer fixos)
- **Loading**: Spinner animado durante carregamento
- **Empty state**: Mensagem amigável quando vazio

### Cards de Alteração
- **Borda lateral colorida**:
  - Azul para Responsável
  - Roxo para Usuário/Setor
- **Badge**: Identifica o tipo de campo
- **Data/hora**: Formato brasileiro (DD/MM/AAAA HH:MM)
- **Destaque**: "Mais recente" na primeira alteração
- **Valores vazios**: Mostrados como "(vazio)" em itálico

---

## 📊 Exemplos de Uso

### Caso 1: Alteração de Responsável

**Antes:**
```
Número: (11) 98765-4321
Responsável: João Silva
Usuário/Setor: TI - Suporte
```

**Alteração:**
```
Responsável: João Silva → Maria Santos
```

**Histórico Registrado:**
```
Campo: responsavel
Valor Anterior: João Silva
Valor Novo: Maria Santos
Data: 07/11/2025 14:30
Usuário: user-id-123
```

### Caso 2: Alteração de Usuário/Setor

**Antes:**
```
Número: (11) 91234-5678
Responsável: Carlos Lima
Usuário/Setor: TI - Suporte
```

**Alteração:**
```
Usuário/Setor: TI - Suporte → Vendas - Comercial
```

**Histórico Registrado:**
```
Campo: usuario_setor
Valor Anterior: TI - Suporte
Valor Novo: Vendas - Comercial
Data: 07/11/2025 15:45
Usuário: user-id-456
```

### Caso 3: Múltiplas Alterações

**Sequência de Mudanças:**
1. 05/11 10:00 - Responsável: vazio → João Silva
2. 06/11 14:30 - Usuário/Setor: vazio → TI - Suporte
3. 07/11 09:15 - Responsável: João Silva → Maria Santos
4. 07/11 16:20 - Usuário/Setor: TI - Suporte → Vendas

**Modal mostrará:**
```
[Mais recente]
🟣 Usuário/Setor  07/11/2025 16:20
   De:   TI - Suporte
   Para: Vendas

🔵 Responsável    07/11/2025 09:15
   De:   João Silva
   Para: Maria Santos

🟣 Usuário/Setor  06/11/2025 14:30
   De:   (vazio)
   Para: TI - Suporte

🔵 Responsável    05/11/2025 10:00
   De:   (vazio)
   Para: João Silva
```

---

## 🔍 Comportamento Detalhado

### Quando o Histórico é Registrado

✅ **SIM - Registra:**
- Editar linha e alterar Responsável
- Editar linha e alterar Usuário/Setor
- Alterar ambos campos na mesma edição (gera 2 registros)
- Limpar um campo (de valor → vazio)
- Preencher um campo vazio (de vazio → valor)

❌ **NÃO - Não registra:**
- Criar nova linha (primeira vez não conta como alteração)
- Editar outros campos (número, tipo, operadora, etc.)
- Salvar sem alterar Responsável ou Usuário/Setor
- Excluir linha (histórico é deletado junto)

### Formato de Data/Hora

```javascript
// Formato brasileiro
07/11/2025 14:30

// Equivalente a:
new Date().toLocaleString('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})
```

### Valores Null/Empty

```typescript
// Valor null ou vazio é mostrado como:
<span className="italic text-gray-400">(vazio)</span>

// Exemplo no histórico:
De:   João Silva
Para: (vazio)  ← Campo foi limpo
```

---

## ⚙️ Configurações Técnicas

### Políticas de Segurança (RLS)

```sql
-- Leitura
CREATE POLICY "Permitir leitura do histórico para usuários autenticados"
ON historico_linhas_telefonicas
FOR SELECT TO authenticated
USING (true);

-- Inserção
CREATE POLICY "Permitir inserção no histórico para usuários autenticados"
ON historico_linhas_telefonicas
FOR INSERT TO authenticated
WITH CHECK (true);
```

### Índices para Performance

```sql
-- Busca por linha
CREATE INDEX idx_historico_linhas_linha_id 
ON historico_linhas_telefonicas(linha_id);

-- Ordenação por data
CREATE INDEX idx_historico_linhas_data 
ON historico_linhas_telefonicas(data_alteracao DESC);

-- Filtro por campo
CREATE INDEX idx_historico_linhas_campo 
ON historico_linhas_telefonicas(campo_alterado);
```

### Função de Registro

```typescript
const registrarHistorico = async (
  linhaId: string,
  campo: 'responsavel' | 'usuario_setor',
  valorAnterior: string | null,
  valorNovo: string | null
) => {
  const { data: { user } } = await supabase.auth.getUser()
  
  await supabase
    .from('historico_linhas_telefonicas')
    .insert([{
      linha_id: linhaId,
      campo_alterado: campo,
      valor_anterior: valorAnterior,
      valor_novo: valorNovo,
      usuario_id: user?.id || null
    }])
}
```

---

## 🐛 Troubleshooting

### Histórico não aparece

**Possíveis causas:**
1. ❌ Tabela não foi criada
   - **Solução**: Execute `criar_historico_linhas.sql`

2. ❌ RLS bloqueando acesso
   - **Solução**: Verifique políticas no Supabase

3. ❌ Usuário não autenticado
   - **Solução**: Faça login no sistema

### Erro ao registrar histórico

**Possíveis causas:**
1. ❌ Constraint de campo_alterado
   - **Solução**: Verificar se está usando 'responsavel' ou 'usuario_setor'

2. ❌ Linha foi deletada
   - **Solução**: Normal, histórico é deletado em cascade

3. ❌ Permissões insuficientes
   - **Solução**: Verificar RLS policies

### Modal vazio mesmo com alterações

**Possíveis causas:**
1. ❌ Linha foi editada antes da implementação
   - **Solução**: Normal, só registra alterações futuras

2. ❌ Apenas campos não rastreados foram alterados
   - **Solução**: Normal, só rastreia Responsável e Usuário/Setor

---

## 📈 Relatórios e Análises

### Consultas Úteis

#### Ver todas as alterações de uma linha
```sql
SELECT * FROM historico_linhas_telefonicas
WHERE linha_id = 'uuid-da-linha'
ORDER BY data_alteracao DESC;
```

#### Contar alterações por campo
```sql
SELECT 
  campo_alterado,
  COUNT(*) as total
FROM historico_linhas_telefonicas
GROUP BY campo_alterado;
```

#### Alterações nas últimas 24 horas
```sql
SELECT * FROM historico_linhas_telefonicas
WHERE data_alteracao >= NOW() - INTERVAL '24 hours'
ORDER BY data_alteracao DESC;
```

#### Linhas mais alteradas
```sql
SELECT 
  linha_id,
  COUNT(*) as total_alteracoes
FROM historico_linhas_telefonicas
GROUP BY linha_id
ORDER BY total_alteracoes DESC
LIMIT 10;
```

---

## 📝 Notas Importantes

1. **Primeira alteração**: A criação inicial da linha NÃO gera histórico
2. **Deleção**: Ao deletar uma linha, TODO o histórico é removido
3. **Performance**: Índices otimizam buscas mesmo com muitos registros
4. **Privacidade**: Histórico só é visível para usuários autenticados
5. **Auditoria**: Usuario_id permite rastrear quem fez cada mudança

---

## 🚀 Próximos Passos

### Possíveis Melhorias Futuras:
- [ ] Exportar histórico para PDF/Excel
- [ ] Filtrar histórico por data
- [ ] Gráficos de alterações ao longo do tempo
- [ ] Notificações quando linha é alterada
- [ ] Reverter alteração (desfazer)
- [ ] Comparação entre duas versões

---

## 📞 Suporte

Dúvidas sobre o sistema de histórico?
- Consulte `criar_historico_linhas.sql` para detalhes técnicos
- Veja `COMO_USAR.md` para guia geral do sistema
- Acesse `/documentacao` no sistema para docs completas

---

**Versão**: 1.0  
**Data**: 07/11/2025  
**Implementado em**: LinhasTelefonicas.tsx  
**Banco de Dados**: historico_linhas_telefonicas
