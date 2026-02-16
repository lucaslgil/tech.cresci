# FLASH PDV 🛒

PDV (Ponto de Venda) offline integrado com a retaguarda FLASH.

## 🎯 Características

- ✅ **100% Offline**: Funciona sem internet
- ✅ **Sincronização Inteligente**: Envia vendas e recebe produtos/clientes
- ✅ **Banco Local SQLite**: Performance e confiabilidade
- ✅ **Interface Moderna**: React + TailwindCSS
- ✅ **Windows Desktop**: Aplicativo nativo com Electron

## 🚀 Desenvolvimento

```bash
# Instalar dependências
npm install

# Modo desenvolvimento
npm run dev

# Build de produção
npm run build

# Gerar instalador Windows
npm run dist
```

## 🔄 Fluxo de Sincronização

### Download (Retaguarda → PDV)
- Produtos atualizados
- Clientes novos/alterados
- Configurações fiscais

### Upload (PDV → Retaguarda)
- Vendas realizadas
- Movimentações de estoque
- Logs de erros

## 📦 Estrutura

```
flash-pdv/
├── electron/          # Processo principal (Node.js)
│   ├── main.ts       # Entry point do Electron
│   ├── preload.ts    # Bridge segura
│   └── database/     # SQLite + Sync
├── src/              # Interface React
│   ├── features/     # Módulos
│   ├── components/   # Componentes
│   └── types/        # TypeScript types
└── release/          # Builds gerados
```

## 🔐 Configuração

Na primeira execução, configurar:
- URL da retaguarda Supabase
- Chave de API
- ID da empresa
- Credenciais do operador

## 📊 Banco de Dados Local

### Tabelas Principais
- `produtos` - Cache de produtos
- `clientes` - Cache de clientes
- `vendas` - Vendas realizadas
- `vendas_itens` - Itens das vendas
- `sync_metadata` - Controle de sincronização

## 🛠️ Stack Tecnológica

- **Electron 28** - Desktop app
- **React 18** - Interface
- **TypeScript** - Type safety
- **SQLite (better-sqlite3)** - Banco local
- **Supabase Client** - Sincronização
- **TailwindCSS** - Estilização
- **Vite** - Build tool

## 📝 Roadmap

- [ ] Tela de vendas completa
- [ ] Busca de produtos por código/EAN
- [ ] Impressão de cupom
- [ ] Integração com NFC-e
- [ ] Controle de gaveta
- [ ] Múltiplas formas de pagamento
- [ ] Relatórios locais
- [ ] Backup automático

## 🤝 Integração com Retaguarda

O FLASH PDV se conecta com o sistema web principal para:
- Sincronizar catálogo de produtos
- Enviar vendas realizadas
- Atualizar estoque em tempo real (quando online)
- Receber parâmetros fiscais

## 📄 Licença

Proprietary - © 2026 FLASH System
