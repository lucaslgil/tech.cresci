# 🚀 FLASH PDV - Setup Completo

## ✅ O que foi criado

### 📁 Estrutura do Projeto
```
flash-pdv/
├── electron/                    # Processo principal (Node.js)
│   ├── main.ts                 # Entry point do Electron
│   ├── preload.ts              # Bridge IPC (React ↔ Node)
│   └── database/
│       ├── sqlite.ts           # Gerenciador SQLite (sql.js)
│       └── sync.ts             # Sincronização bidirecional
├── src/                        # Interface React
│   ├── main.tsx               # Entry point React
│   ├── App.tsx                # Tela principal (dashboard)
│   ├── index.css              # Estilos globais
│   └── types/
│       └── electron.d.ts      # TypeScript definitions
├── package.json               # Dependências e scripts
├── electron.vite.config.ts    # Config do Electron + Vite
├── tailwind.config.cjs        # TailwindCSS (cores FLASH)
├── tsconfig.json              # TypeScript config
├── index.html                 # HTML base
├── README.md                  # Documentação do PDV
├── INTEGRACAO_RETAGUARDA.md  # Doc de integração
└── .gitignore                # Arquivos ignorados
```

## 🎯 Funcionalidades Implementadas

### ✅ Banco de Dados Local (SQLite)
- **Tabelas criadas:**
  - `empresas` - Cache da empresa
  - `produtos` - Catálogo local
  - `clientes` - Base de clientes
  - `vendas` - Vendas realizadas offline
  - `vendas_itens` - Itens de cada venda
  - `sync_metadata` - Controle de sincronização
  - `config` - Configurações locais

### ✅ Sincronização Bidirecional
- **Download (Retaguarda → PDV):**
  - Produtos atualizados
  - Clientes novos/alterados
  - Sincronização incremental (apenas o que mudou)
  
- **Upload (PDV → Retaguarda):**
  - Vendas realizadas offline
  - Itens das vendas
  - Tratamento de erros e retry

### ✅ Interface Inicial
- Dashboard com cards:
  - 🛒 Nova Venda
  - 📦 Produtos
  - 📊 Relatórios
- Botão de sincronização
- Status offline/online
- Cores do padrão FLASH (#394353, #C9C4B5)

## 🔧 Como Usar

### 1. Desenvolvimento
```bash
cd flash-pdv
npm run dev
```

Isso abre o aplicativo Electron em modo desenvolvimento com hot reload.

### 2. Build de Produção
```bash
npm run build
npm run dist
```

Gera o instalador Windows em `flash-pdv/release/`.

### 3. Estrutura de Comandos
- `npm run dev` - Modo desenvolvimento
- `npm run build` - Build do código
- `npm run preview` - Preview do build
- `npm run pack` - Empacota sem instalar
- `npm run dist` - Cria instalador .exe

## 📊 Fluxo de Dados

```
┌──────────────────────────────────────────────────────┐
│              INTERFACE (React)                       │
│  - App.tsx (dashboard)                              │
│  - Vendas (a criar)                                 │
│  - Produtos (a criar)                               │
└─────────────────┬────────────────────────────────────┘
                  │ IPC (electronAPI)
┌─────────────────▼────────────────────────────────────┐
│           PROCESSO PRINCIPAL (Electron)              │
│  - main.ts: gerencia janela e IPC handlers          │
│  - preload.ts: expõe API segura                     │
└─────────────────┬────────────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        ▼                    ▼
┌───────────────┐    ┌──────────────────┐
│  SQLite       │    │  Supabase API    │
│  (Local)      │◄───┤  (Retaguarda)    │
│  - Produtos   │    │  - Auth          │
│  - Clientes   │    │  - Queries       │
│  - Vendas     │────►  - Upload        │
└───────────────┘    └──────────────────┘
   Offline             Online (sync)
```

## 🔐 Configuração Necessária (Próximo Passo)

Criar tela de configuração inicial para o operador inserir:

```typescript
interface Config {
  supabaseUrl: string       // URL da retaguarda
  supabaseKey: string       // Anon key ou service key
  empresaId: number         // ID da empresa no sistema
  usuarioId: number         // ID do operador
  nomeOperador: string      // Nome para logs
}
```

## 📝 Tarefas Pendentes

### Retaguarda (Sistema Web)
1. **Adicionar campo `origem` na tabela `vendas`**
   ```sql
   ALTER TABLE vendas 
     ADD COLUMN origem VARCHAR(20) DEFAULT 'WEB';
   -- Valores: 'WEB', 'PDV', 'API'
   ```

2. **Adicionar campo `updated_at` em produtos e clientes**
   ```sql
   ALTER TABLE produtos 
     ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
   
   CREATE TRIGGER update_produtos_updated_at 
     BEFORE UPDATE ON produtos
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();
   ```

### PDV (Flash PDV)
1. **Tela de Configuração Inicial**
   - Formulário para conectar com retaguarda
   - Validação de credenciais
   - Salvar em SQLite local

2. **Tela de Vendas**
   - Busca de produtos (código/EAN/descrição)
   - Adicionar itens ao carrinho
   - Aplicar descontos
   - Selecionar cliente (opcional)
   - Formas de pagamento
   - Finalizar venda

3. **Tela de Produtos**
   - Listagem do catálogo
   - Busca e filtros
   - Visualização de estoque

4. **Relatórios**
   - Vendas do dia
   - Vendas por período
   - Produtos mais vendidos
   - Pendentes de sincronização

## 🛠️ Stack Tecnológica

### Frontend (Renderer)
- **React 18** - Framework UI
- **TypeScript** - Type safety
- **TailwindCSS** - Estilização
- **Vite** - Build tool (HMR rápido)

### Backend (Main Process)
- **Electron 28** - Desktop framework
- **sql.js** - SQLite em JavaScript (sem compilação nativa)
- **Supabase Client** - Integração com retaguarda
- **Node.js** - Runtime

### Build & Deploy
- **electron-vite** - Build otimizado
- **electron-builder** - Geração de instaladores
- **NSIS** - Instalador Windows

## 📖 Documentação Criada

1. **README.md** - Visão geral do projeto
2. **INTEGRACAO_RETAGUARDA.md** - Documentação técnica completa:
   - Fluxo de sincronização
   - Estratégias de conflito
   - Exemplos de código
   - Diagramas
   - RLS e autenticação

## 🎨 Design System

Seguindo o padrão FLASH:
- **Cor principal:** `#394353` (flash-dark)
- **Cor secundária:** `#C9C4B5` (flash-light)
- **Tipografia:** Inter, SF Pro, Segoe UI
- **Espaçamento:** Sistema 4px base
- **Bordas:** Arredondadas (rounded-lg)

## 🚀 Próximos Passos Recomendados

### Curto Prazo (MVP)
1. ✅ ~~Estrutura do projeto~~ CONCLUÍDO
2. ✅ ~~SQLite + Sync~~ CONCLUÍDO
3. ⏳ Tela de configuração
4. ⏳ Tela de vendas simples
5. ⏳ Integrar sincronização real

### Médio Prazo
6. Impressão de cupom (ESC/POS)
7. Suporte a leitor de código de barras
8. Múltiplas formas de pagamento
9. Gestão de gaveta de dinheiro
10. Relatórios locais

### Longo Prazo
11. NFC-e (Nota Fiscal de Consumidor Eletrônica)
12. Integração com TEF (pagamento cartão)
13. Controle de múltiplos PDVs
14. Dashboard gerencial
15. Backup automático

## 🔥 Diferenciais do FLASH PDV

- ✅ **100% Offline** - Funciona sem internet
- ✅ **Sincronização Inteligente** - Apenas o que mudou
- ✅ **Zero Configuração de Banco** - SQLite gerenciado automaticamente
- ✅ **Integração Nativa** - Compartilha dados com sistema web
- ✅ **Moderno** - React + TypeScript + Electron
- ✅ **Rápido** - Vite HMR + SQLite in-memory
- ✅ **Confiável** - Retry automático, tratamento de erros

## 📞 Suporte

Para dúvidas sobre implementação, consulte:
- [INTEGRACAO_RETAGUARDA.md](INTEGRACAO_RETAGUARDA.md)
- [README.md](README.md)
- Documentação do Electron: https://electronjs.org
- Documentação do sql.js: https://sql.js.org

---

**Data de Criação:** 10/02/2026  
**Versão:** 1.0.0  
**Status:** 🟢 Estrutura completa, pronto para desenvolvimento de features
