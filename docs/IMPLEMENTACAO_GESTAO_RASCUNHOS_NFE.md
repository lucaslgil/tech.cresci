# Sistema de Gestão de Rascunhos - Notas Fiscais

## Data: 27/01/2026

## Resumo das Implementações

Sistema completo para gerenciar rascunhos de notas fiscais, garantindo a conformidade com as regras da SEFAZ sobre sequência numérica.

---

## ✅ Funcionalidades Implementadas

### 1. Salvamento de Rascunho
- **Localização:** `EmitirNotaFiscal.tsx` - função `handleSalvarRascunho()`
- **Comportamento:**
  - Salva a nota com status `RASCUNHO` no banco de dados
  - Reserva o número sequencial da nota (não pode ser pulado)
  - **NÃO reseta** o formulário após salvar (permite continuar editando)
  - Exibe mensagem informando que a nota está salva e pode ser consultada
  - Armazena o ID da nota salva no estado `notaAtualId`

### 2. Exibição em "Consultar Notas Fiscais"
- **Localização:** `ConsultarNotasFiscais.tsx`
- **Comportamento:**
  - Lista todas as notas, incluindo rascunhos
  - Exibe badge visual com status "Rascunho" (ícone de relógio)
  - Mostra no dashboard: quantidade de rascunhos pendentes
  - Permite filtrar por status = "RASCUNHO"

### 3. Alerta de Perda de Sequência
- **Localização:** `EmitirNotaFiscal.tsx` - Alerta visual no topo da tela
- **Comportamento:**
  - Ao carregar a tela de emissão, verifica se existem rascunhos pendentes
  - Se houver rascunhos não transmitidos, exibe alerta destacado:
    - ⚠️ Aviso sobre perda de sequência numérica
    - Explicação sobre proibição da SEFAZ
    - Lista de todos os rascunhos pendentes com:
      - Número/Série
      - Nome do cliente
      - Valor total
      - Botão para excluir cada rascunho
  - Opções de ação:
    - "Entendi, continuar mesmo assim" (fecha o alerta)
    - "Ir para Consultar Notas" (redireciona)
    - Botão X para fechar o alerta
    - Botão "Excluir" em cada rascunho

### 4. Função de Exclusão de Rascunho
- **Localização:** `EmitirNotaFiscal.tsx` - função `excluirRascunho()`
- **Comportamento:**
  - Solicita confirmação antes de excluir
  - Remove o rascunho do banco de dados
  - Atualiza a lista de rascunhos pendentes
  - Exibe mensagem de sucesso/erro

---

## 📁 Arquivos Modificados

### 1. `EmitirNotaFiscal.tsx`
**Estados adicionados:**
```typescript
const [rascunhosPendentes, setRascunhosPendentes] = useState<NotaFiscal[]>([])
const [mostrarAlertaRascunho, setMostrarAlertaRascunho] = useState(false)
const [notaAtualId, setNotaAtualId] = useState<number | null>(null)
```

**Funções adicionadas:**
- `verificarRascunhosPendentes()` - Busca rascunhos ao carregar a tela
- `excluirRascunho(id)` - Exclui um rascunho específico

**Funções modificadas:**
- `handleSalvarRascunho()` - Não reseta mais o formulário após salvar

**Componente visual adicionado:**
- Alerta de rascunhos pendentes (logo após o header)

### 2. `ConsultarNotasFiscais.tsx`
**Sem alterações necessárias** - Já estava funcionando corretamente:
- Lista todas as notas incluindo rascunhos
- Exibe status visual correto
- Dashboard conta rascunhos

### 3. `notasFiscaisService.ts`
**Sem alterações necessárias** - Já tinha:
- `criarRascunho()` - Cria nota com status RASCUNHO
- `deletar()` - Exclui nota em rascunho
- `listar()` - Lista todas as notas

---

## 🔐 Regras de Negócio Implementadas

### Sequência Numérica
- ✅ Ao salvar rascunho, o número é **reservado** imediatamente
- ✅ O número NÃO pode ser pulado (conforme SEFAZ)
- ✅ Sistema alerta usuário sobre perda de sequência
- ✅ Usuário pode excluir rascunho para liberar o número

### Exclusão de Rascunho
- ✅ Apenas notas com status `RASCUNHO` podem ser excluídas
- ✅ Confirmação obrigatória antes de excluir
- ✅ Exclusão remove da lista de pendentes automaticamente

### Visualização
- ✅ Rascunhos aparecem na consulta de notas
- ✅ Badge visual diferenciado (cinza com ícone de relógio)
- ✅ Dashboard conta rascunhos separadamente
- ✅ Pode filtrar apenas rascunhos

---

## 🎨 Interface do Usuário

### Alerta de Rascunhos Pendentes
```
┌─────────────────────────────────────────────────────┐
│ ⚠️ Atenção: Existem 2 nota(s) fiscal(is) salva(s)  │
│    e não transmitida(s)                             │
│                                                     │
│ IMPORTANTE: Ao iniciar uma nova emissão sem         │
│ transmitir as notas salvas, você irá pular a       │
│ sequência numérica, o que é proibido pela SEFAZ.  │
│                                                     │
│ Notas pendentes:                                    │
│ ┌─────────────────────────────────────────────┐   │
│ │ NF-e #000000001/1 - Cliente ABC (R$ 1.500)  │   │
│ │                              [Excluir]      │   │
│ ├─────────────────────────────────────────────┤   │
│ │ NF-e #000000002/1 - Cliente XYZ (R$ 2.300)  │   │
│ │                              [Excluir]      │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ [Entendi, continuar]  [Ir para Consultar Notas]   │
└─────────────────────────────────────────────────────┘
```

### Badge de Status - Rascunho
- **Cor:** Cinza (`bg-gray-50`, `text-gray-600`)
- **Ícone:** Relógio (`Clock`)
- **Texto:** "Rascunho"

---

## 🔄 Fluxo de Trabalho

### Cenário 1: Salvar Rascunho e Continuar
1. Usuário preenche dados da nota
2. Clica em "Salvar Rascunho"
3. Sistema salva com status RASCUNHO e reserva número
4. **Formulário permanece preenchido** (pode continuar editando)
5. Usuário pode transmitir depois ou salvar novamente

### Cenário 2: Salvar Rascunho e Sair
1. Usuário preenche dados da nota
2. Clica em "Salvar Rascunho"
3. Fecha a tela (navegador ou clica em outro menu)
4. Nota fica salva com status RASCUNHO
5. Aparece em "Consultar Notas Fiscais"

### Cenário 3: Tentar Emitir Nova Nota com Rascunhos Pendentes
1. Usuário acessa "Emitir Nota Fiscal"
2. Sistema detecta rascunhos pendentes
3. Exibe alerta destacado no topo
4. Usuário pode:
   - Excluir os rascunhos
   - Ir para consultar notas e transmitir
   - Ignorar e continuar (assumindo o risco)

### Cenário 4: Excluir Rascunho
1. No alerta ou na consulta, clica em "Excluir"
2. Sistema pede confirmação
3. Usuário confirma
4. Rascunho é removido do banco
5. Número fica liberado para uso

---

## 📊 Tabela de Status Possíveis

| Status | Descrição | Pode Editar? | Pode Excluir? | Reserva Número? |
|--------|-----------|--------------|---------------|-----------------|
| RASCUNHO | Nota salva, não transmitida | ✅ Sim | ✅ Sim | ✅ Sim |
| PROCESSANDO | Enviando para SEFAZ | ❌ Não | ❌ Não | ✅ Sim |
| AUTORIZADA | Aprovada pela SEFAZ | ❌ Não | ❌ Não | ✅ Sim |
| REJEITADA | Rejeitada pela SEFAZ | ⚠️ Depende | ⚠️ Depende | ❌ Não* |
| CANCELADA | Cancelada após autorização | ❌ Não | ❌ Não | ✅ Sim |

*Nota rejeitada: número pode ser reutilizado conforme regras da SEFAZ

---

## 🧪 Testes Recomendados

### Teste 1: Salvar Rascunho
- [ ] Preencher nota e salvar rascunho
- [ ] Verificar se aparece em consulta
- [ ] Verificar se número foi reservado
- [ ] Formulário permanece preenchido

### Teste 2: Alerta de Sequência
- [ ] Salvar um rascunho
- [ ] Sair e voltar para emitir nota
- [ ] Verificar se alerta aparece
- [ ] Verificar se lista o rascunho pendente

### Teste 3: Excluir Rascunho
- [ ] Salvar um rascunho
- [ ] Tentar excluir (deve pedir confirmação)
- [ ] Confirmar exclusão
- [ ] Verificar se sumiu da lista
- [ ] Verificar se alerta não aparece mais

### Teste 4: Múltiplos Rascunhos
- [ ] Salvar 3 rascunhos diferentes
- [ ] Verificar se todos aparecem no alerta
- [ ] Excluir um por um
- [ ] Verificar atualização da lista

---

## 🚀 Próximos Passos (Sugestões)

1. **Editar Rascunho**
   - Botão "Editar" na consulta de notas
   - Carrega dados do rascunho no formulário de emissão

2. **Transmitir Direto da Consulta**
   - Botão "Transmitir" para rascunhos na consulta
   - Valida e envia para SEFAZ sem precisar abrir a emissão

3. **Histórico de Rascunhos**
   - Log de quando foram criados
   - Quem criou cada rascunho

4. **Limpeza Automática**
   - Rascunhos com mais de X dias podem ser marcados para exclusão
   - Notificação de rascunhos antigos

---

## ✅ Checklist de Conformidade SEFAZ

- [x] Número sequencial não pode ser pulado
- [x] Rascunho reserva o número
- [x] Alerta sobre perda de sequência
- [x] Usuário é informado sobre regras da SEFAZ
- [x] Rascunho pode ser excluído (liberando número)
- [x] Status visual claro na consulta

---

## 📝 Observações Importantes

1. **Número Reservado:** Ao salvar rascunho, o número JÁ está reservado. Se excluir o rascunho, esse número volta a estar disponível.

2. **Ordem de Transmissão:** SEFAZ exige que as notas sejam transmitidas na ordem sequencial dos números. Pular números pode gerar autuação.

3. **Rascunhos Antigos:** É recomendado transmitir ou excluir rascunhos rapidamente para não criar "buracos" na sequência.

4. **Múltiplas Séries:** O controle de sequência é por série. Série 1 e Série 2 têm numerações independentes.

---

**Implementado por:** GitHub Copilot
**Data:** 27/01/2026
**Versão:** 1.0
