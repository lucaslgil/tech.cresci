# 🛒 Módulo de Vendas - FLASH PDV

## ✅ Implementação Completa

O módulo de vendas do FLASH PDV foi totalmente implementado com integração à retaguarda.

## 📋 Funcionalidades

### Tela de Vendas (VendaPDV.tsx)
- ✅ Busca de produtos por código ou EAN13
- ✅ Adição de itens ao carrinho
- ✅ Controle de quantidade
- ✅ Informações do cliente (opcional)
- ✅ Múltiplas formas de pagamento
- ✅ Cálculo automático de totais e troco
- ✅ Finalização de venda com validação

### Histórico de Vendas (HistoricoVendas.tsx)
- ✅ Listagem de vendas realizadas
- ✅ Estatísticas do dia (total, valor, status)
- ✅ Visualização detalhada de cada venda
- ✅ Indicação de vendas sincronizadas/pendentes

## 🔄 Integração com Retaguarda

### Estrutura de Dados

#### Tabela: vendas (PDV)
```sql
- uuid: Identificador único para sincronização
- empresa_id: Sempre respeita o tenant
- usuario_id, usuario_nome: Vendedor
- cliente_id, cliente_nome, cliente_cpf: Cliente (opcional)
- tipo_venda: VENDA | ORCAMENTO
- status: PEDIDO_ABERTO | PEDIDO_FECHADO | FATURADO | CANCELADO
- subtotal, desconto, acrescimo, total
- sincronizado: 0 (não) | 1 (sim)
- retaguarda_id: ID da venda na retaguarda após sync
```

#### Tabela: vendas_itens (PDV)
```sql
- venda_local_id: FK para vendas(id)
- produto_id, produto_codigo, produto_descricao
- quantidade, preco_unitario
- desconto, acrescimo, valor_total
- numero_item
```

#### Tabela: vendas_pagamentos (PDV)
```sql
- venda_local_id: FK para vendas(id)
- forma_pagamento: DINHEIRO | DEBITO | CREDITO | PIX
- valor
- numero_parcela
```

### Processo de Sincronização

1. **Venda Criada no PDV**
   - Status inicial: `PEDIDO_ABERTO`
   - `sincronizado = 0`
   - UUID gerado automaticamente

2. **Finalização da Venda**
   - Status muda para `PEDIDO_FECHADO`
   - Venda fica disponível para sincronização

3. **Sincronização**
   - Executada pelo botão "Sincronizar" ou automaticamente
   - Apenas vendas com status `PEDIDO_FECHADO` ou `FATURADO` são enviadas
   - Dados enviados para tabelas: `vendas`, `vendas_itens`, `vendas_pagamentos`
   - Campo `pdv_uuid` armazena o UUID original do PDV

4. **Após Sincronização**
   - `sincronizado = 1`
   - `retaguarda_id` armazena o ID da venda na retaguarda
   - Venda fica visível na retaguarda em `/vendas`

## 🔒 Segurança Multi-Tenant

### ProdutosService
- ✅ Todos os métodos validam `empresa_id`
- ✅ Apenas produtos da empresa configurada são retornados
- ✅ Validação em: listar, buscarPorId, buscarPorCodigo, buscarPorEan

### VendasService
- ✅ Vendas sempre criadas com `empresa_id` da configuração
- ✅ Listagem e consulta filtradas por `empresa_id`
- ✅ Impossível acessar dados de outras empresas

### SyncService
- ✅ Download de produtos: filtro por `empresa_id`
- ✅ Upload de vendas: valida `empresa_id` antes de enviar
- ✅ Apenas Anon Public Key permitida (não aceita Service Role Key)

## 🎨 Interface

Seguindo o padrão definido em `PADRAO_INTERFACE_SISTEMA.md`:
- **Cores**: #394353 (principal), #C9C4B5 (bordas)
- **Tipografia**: text-base (títulos), text-sm (conteúdo), text-xs (labels/tabelas)
- **Espaçamento**: p-4 (containers), p-3 (cards), gap-3 (grids)
- **Responsividade**: Mobile-first com breakpoints adequados

## 📊 Fluxo de Uso

```
┌─────────────────────────────────────────────────────┐
│                   FLASH PDV                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Configuração Inicial                           │
│     • Empresa, Usuário, Supabase                   │
│                                                     │
│  2. Sincronizar Dados (Download)                   │
│     • Produtos (empresa_id)                        │
│     • Clientes (empresa_id)                        │
│                                                     │
│  3. Realizar Venda                                 │
│     • Buscar produtos (código/EAN)                 │
│     • Adicionar itens ao carrinho                  │
│     • Informar cliente (opcional)                  │
│     • Definir formas de pagamento                  │
│     • Finalizar venda                              │
│                                                     │
│  4. Venda Gravada Localmente                       │
│     • UUID único gerado                            │
│     • Status: PEDIDO_FECHADO                       │
│     • sincronizado = 0                             │
│                                                     │
│  5. Sincronizar Vendas (Upload)                    │
│     • Envio para retaguarda                        │
│     • Criação em vendas, vendas_itens e           │
│       vendas_pagamentos                            │
│     • Marcação: sincronizado = 1                   │
│                                                     │
│  6. Consultar na Retaguarda                        │
│     • Menu: Vendas > Listagem                      │
│     • Filtrar por origem: PDV                      │
│     • Todos os dados visíveis                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 🚀 Próximos Passos

### Para usar o sistema:

1. **No FLASH PDV**:
   - Configurar empresa, usuário e credenciais Supabase
   - Sincronizar produtos e clientes
   - Realizar vendas
   - Sincronizar vendas periodicamente

2. **Na Retaguarda**:
   - Acessar menu "Vendas"
   - Consultar vendas originadas do PDV
   - Emitir notas fiscais (se necessário)
   - Gerar relatórios

### Melhorias Futuras:
- [ ] Sincronização automática em background
- [ ] Alertas de vendas pendentes de sincronização
- [ ] Impressão de cupom não fiscal
- [ ] Integração com TEF para pagamentos
- [ ] Relatórios locais no PDV
- [ ] Backup automático do banco SQLite

## 📝 Arquivos Criados

### Services
- `flash-pdv/src/services/produtosService.ts` - Gestão de produtos com RLS
- `flash-pdv/src/services/vendasService.ts` - Gestão de vendas local
- `flash-pdv/src/services/sincronizacaoVendasService.ts` - Upload vendas p/ retaguarda

### Components
- `flash-pdv/src/components/VendaPDV.tsx` - Tela de realização de vendas
- `flash-pdv/src/components/HistoricoVendas.tsx` - Histórico e estatísticas

### Database
- `flash-pdv/electron/database/sqlite.ts` - Estrutura de tabelas atualizada
- `flash-pdv/electron/database/sync.ts` - Sincronização bidirecional atualizada

### App
- `flash-pdv/src/App.tsx` - Navegação entre telas atualizada

## ✅ Checklist de Validação

- [x] Produtos respeitam tenant (empresa_id)
- [x] Vendas criadas com empresa_id correto
- [x] Sincronização valida empresa_id
- [x] UUID único para cada venda
- [x] Itens e pagamentos vinculados corretamente
- [x] Status da venda controlado adequadamente
- [x] Interface responsiva e moderna
- [x] Fluxo completo funcionando
- [x] Integração PDV → Retaguarda implementada
- [x] Consulta de vendas na retaguarda possível
