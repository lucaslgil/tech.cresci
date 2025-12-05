# 🌐 Formulário Público de Solicitações

## 📋 Visão Geral

A tela de **Nova Solicitação** é uma página **pública** que funciona independentemente do sistema de login. Qualquer pessoa com o link pode acessar e enviar solicitações.

---

## 🔗 Link de Acesso Público

### URL da Página:
```
https://seu-dominio.com/nova-solicitacao
```

**Características:**
- ✅ **Não requer login** - Acesso totalmente público
- ✅ **Funciona em qualquer navegador** - Desktop e Mobile
- ✅ **Link compartilhável** - Pode ser enviado por email, WhatsApp, etc.
- ✅ **Sempre disponível** - 24/7

---

## 🎯 Como Funcionar

### 1. Para Usuários Finais (Solicitantes)

**Passo a passo:**
1. Acesse o link: `/nova-solicitacao`
2. Preencha o formulário com:
   - ✅ Título da solicitação
   - ✅ Descrição detalhada
   - ✅ Seu nome
   - ✅ Seu email
   - 📋 Categoria (opcional)
   - ⚡ Prioridade
3. Clique em "Enviar Solicitação"
4. Veja a tela de confirmação
5. Clique em "Enviar Nova Solicitação" para criar outra

**Campos Obrigatórios:**
- Título
- Descrição
- Nome
- Email
- Prioridade

---

### 2. Para Administradores (Gerenciamento)

**Acessar solicitações recebidas:**
1. Faça login no sistema
2. Acesse `/tarefas`
3. Veja todas as solicitações recebidas
4. Filtre, atribua responsáveis e gerencie

**Compartilhar o link:**
- Copie: `https://seu-dominio.com/nova-solicitacao`
- Envie por: Email, WhatsApp, SMS, QR Code, etc.
- Publique em: Site, Intranet, Portal do Colaborador

---

## 🔐 Configuração de Segurança

### Política RLS (Row Level Security) no Supabase:

```sql
-- Permite que QUALQUER PESSOA (anônima ou autenticada) insira tarefas
CREATE POLICY "Permitir inserção de tarefas para QUALQUER PESSOA"
ON tarefas FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```

**Importante:**
- ✅ **Inserção** é pública (qualquer pessoa pode criar)
- 🔒 **Leitura** só para usuários autenticados
- 🔒 **Atualização** só para usuários autenticados
- 🔒 **Exclusão** só para usuários autenticados

---

## 🎨 Design da Página

### Layout:
- **Fundo**: Gradiente azul suave
- **Formulário**: Card branco centralizado com shadow
- **Campos**: Layout de 2 colunas responsivo
- **Botões**: Limpar Formulário + Enviar

### Tela de Sucesso:
- ✅ Ícone de check verde grande
- ✅ Mensagem de confirmação
- ✅ Botão para enviar nova solicitação
- ✅ Design clean e profissional

---

## 📱 Uso em Diferentes Contextos

### 1. **QR Code**
Gere um QR Code apontando para `/nova-solicitacao` e:
- Cole em murais
- Imprima em cartazes
- Adicione em crachás
- Publique em comunicados

### 2. **Email Corporativo**
```html
Precisa de suporte? 
Abra uma solicitação: https://sistema.empresa.com/nova-solicitacao
```

### 3. **WhatsApp/SMS**
```
Olá! Para abrir uma solicitação, acesse:
https://sistema.empresa.com/nova-solicitacao
```

### 4. **Site/Intranet**
```html
<a href="https://sistema.empresa.com/nova-solicitacao" 
   target="_blank" 
   class="btn btn-primary">
   Abrir Solicitação
</a>
```

### 5. **Portal do Colaborador**
Adicione um botão fixo ou menu item apontando para o formulário.

---

## 🔄 Fluxo Completo

### Visão do Solicitante:
```
1. Acessa link público
   ↓
2. Preenche formulário
   ↓
3. Envia solicitação
   ↓
4. Vê confirmação de sucesso
   ↓
5. Pode enviar outra ou fechar
```

### Visão do Atendente:
```
1. Solicitação é criada no banco
   ↓
2. Aparece na lista de Tarefas (status: Aberto)
   ↓
3. Atendente faz login
   ↓
4. Vê solicitação no dashboard
   ↓
5. Atribui responsável
   ↓
6. Atualiza status conforme andamento
   ↓
7. Marca como Concluído
```

---

## ⚙️ Configurações Técnicas

### Rotas no Sistema:

**Rota Pública (Sem Login):**
```tsx
<Route path="/nova-solicitacao" element={<NovaSolicitacao />} />
```

**Rota Protegida (Com Login):**
```tsx
<Route path="/tarefas" element={<GerenciamentoTarefas />} />
```

### Botão no Sistema:
No painel de Tarefas, há um botão verde "Nova Solicitação" que:
- Abre o formulário em **nova aba**
- Permite que atendentes testem o formulário
- Pode ser usado para criar solicitações internas

---

## 📊 Dados Coletados

### Informações Capturadas:
1. **Título** - Assunto da solicitação
2. **Descrição** - Detalhes do problema/pedido
3. **Solicitante** - Nome da pessoa
4. **Email** - Para contato
5. **Categoria** - TI, RH, Manutenção, etc. (opcional)
6. **Prioridade** - Baixa, Média, Alta, Urgente
7. **Data/Hora** - Timestamp automático
8. **Status** - Sempre começa como "Aberto"

### Campos Preenchidos Automaticamente:
- `status`: "Aberto"
- `data_abertura`: NOW()
- `created_at`: NOW()
- `updated_at`: NOW()

---

## 🚨 Validações

### Front-end (JavaScript):
- ✅ Título não pode estar vazio
- ✅ Descrição não pode estar vazia
- ✅ Nome não pode estar vazio
- ✅ Email não pode estar vazio
- ✅ Email deve ter formato válido

### Mensagens de Erro:
- "Título é obrigatório"
- "Nome é obrigatório"
- "Email é obrigatório"
- "Erro ao enviar solicitação. Tente novamente."

---

## 💡 Dicas de Uso

### Para Maximizar Eficiência:

1. **Divulgue o Link**
   - Envie para todos os colaboradores
   - Adicione na assinatura de email
   - Publique na intranet

2. **Categorias Recomendadas**
   - TI (Suporte técnico)
   - RH (Questões de pessoal)
   - Manutenção (Reparos e infraestrutura)
   - Financeiro (Pagamentos e reembolsos)
   - Administrativo (Documentos e processos)

3. **Prioridades Sugeridas**
   - **Urgente**: Sistema parado, problema crítico
   - **Alta**: Impacta várias pessoas
   - **Média**: Pode esperar alguns dias
   - **Baixa**: Melhorias e sugestões

---

## 🔧 Personalização

### Alterar Texto do Header:
Edite em `NovaSolicitacao.tsx`:
```tsx
<h1>Central de Solicitações</h1>
<p>Preencha o formulário abaixo...</p>
```

### Adicionar Campos:
1. Atualize a tabela `tarefas` no banco
2. Adicione o campo no formulário
3. Atualize a interface `formData`

### Mudar Cores:
```tsx
// Gradiente de fundo
className="bg-gradient-to-br from-blue-50 to-indigo-50"

// Botão enviar
className="bg-blue-600 hover:bg-blue-700"
```

---

## 📈 Monitoramento

### Métricas Importantes:
- 📊 Total de solicitações recebidas
- ⏱️ Tempo médio de resposta
- 📋 Solicitações por categoria
- ⚡ Distribuição de prioridades
- ✅ Taxa de conclusão

### Acesse em:
```
/tarefas → Dashboard com métricas
```

---

## ✅ Checklist de Implementação

- [x] Tabela `tarefas` criada no Supabase
- [x] Política RLS configurada para `anon`
- [x] Rota pública `/nova-solicitacao` adicionada
- [x] Componente `NovaSolicitacao.tsx` criado
- [x] Validações implementadas
- [x] Tela de sucesso implementada
- [x] Botão no painel de gerenciamento
- [ ] **SQL executado no Supabase** ← PRÓXIMO PASSO
- [ ] Teste de envio de solicitação
- [ ] Divulgação do link aos usuários

---

## 🎯 Exemplo de Uso Real

**Cenário:** Empresa com 50 colaboradores

1. **Administrador** executa o SQL no Supabase
2. **Administrador** copia o link: `https://sistema.empresa.com/nova-solicitacao`
3. **Administrador** envia email para todos:
   ```
   Assunto: Nova Central de Solicitações

   Olá equipe!

   A partir de agora, todas as solicitações de TI, RH e Manutenção 
   devem ser feitas através do nosso novo sistema:

   🔗 https://sistema.empresa.com/nova-solicitacao

   É rápido, fácil e você receberá atualizações por email!

   Atenciosamente,
   Equipe de TI
   ```

4. **Colaboradores** acessam o link, preenchem e enviam
5. **Equipe de TI** acessa `/tarefas`, vê todas as solicitações
6. **Equipe** atribui responsáveis e atualiza status
7. **Sistema** funciona! 🎉

---

## 🆘 Problemas Comuns

### "Erro ao enviar solicitação"
**Solução:** Verifique se:
1. SQL foi executado no Supabase
2. Política RLS está habilitada para `anon`
3. Conexão com Supabase está funcionando

### "Formulário não aparece"
**Solução:** Verifique se:
1. Rota está correta: `/nova-solicitacao`
2. Componente foi importado no `App.tsx`
3. Não há erros no console do navegador

### "Solicitações não aparecem no painel"
**Solução:** Verifique se:
1. Usuário está autenticado
2. Política RLS permite leitura para `authenticated`
3. Refresh na página `/tarefas`

---

## 📞 Próximos Passos

1. **Execute o SQL** no Supabase SQL Editor
2. **Teste o formulário** acessando `/nova-solicitacao`
3. **Verifique** se aparece em `/tarefas`
4. **Compartilhe o link** com sua equipe
5. **Monitore** as solicitações recebidas

**Link do formulário pronto para usar:** 🎉
```
/nova-solicitacao
```

---

**Versão:** 1.0  
**Data:** 10/11/2025  
**Componente:** NovaSolicitacao.tsx  
**Acesso:** Público (sem login)
