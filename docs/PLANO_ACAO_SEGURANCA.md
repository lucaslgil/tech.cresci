# 📋 PLANO DE AÇÃO - CORREÇÃO DE VULNERABILIDADES

**Início:** Hoje (09/02/2026)  
**Conclusão prevista:** 01/03/2026 (3 semanas)  
**Dedicação:** 27 horas técnicas + 8 horas testes

---

## 🚨 DIA 0 - MITIGAÇÃO IMEDIATA (HOJE - 2 horas)

### ☑️ Checklist de Ações Emergenciais:

- [ ] **URGENTE:** Revogar credenciais atuais da Nuvem Fiscal
  - Acessar: https://app.nuvemfiscal.com.br
  - Ir em: Configurações > API > Gerar novo Client Secret
  - Salvar novas credenciais em local SEGURO (1Password, Vault)
  - ⏱️ 15 minutos

- [ ] **URGENTE:** Desativar emissão de NFe temporariamente
  ```typescript
  // src/features/notas-fiscais/EmitirNotaFiscal.tsx
  // Adicionar no topo do componente:
  return (
    <div className="p-8">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
        <p className="font-bold">⚠️ Módulo em Manutenção</p>
        <p>Emissão de NF-e temporariamente desativada para manutenção de segurança.</p>
      </div>
    </div>
  )
  ```
  - ⏱️ 10 minutos

- [ ] Auditar acessos recentes no Supabase
  - Authentication > Users > Verificar logins recentes
  - Logs > Procurar por atividades suspeitas
  - ⏱️ 20 minutos

- [ ] Criar branch de segurança no Git
  ```bash
  git checkout -b feature/seguranca-critica
  ```
  - ⏱️ 5 minutos

- [ ] Comunicar equipe sobre manutenção
  - Email/Slack informando sobre correções
  - Timeline prevista
  - ⏱️ 15 minutos

- [ ] Backup completo do banco de dados
  - Supabase Dashboard > Database > Backups
  - Download manual se necessário
  - ⏱️ 10 minutos

- [ ] Criar secrets no Supabase (preparação)
  ```bash
  # Via CLI ou Dashboard
  supabase secrets set NUVEM_FISCAL_CLIENT_ID="novo_client_id"
  supabase secrets set NUVEM_FISCAL_CLIENT_SECRET="novo_client_secret_seguro"
  supabase secrets set NUVEM_FISCAL_AMBIENTE="SANDBOX"
  ```
  - ⏱️ 15 minutos

**Total Dia 0:** 1h 30min

---

## 📅 SEMANA 1 - VULNERABILIDADES CRÍTICAS

### 🔴 DIA 1 - Edge Function (Parte 1) - 4h

**Objetivo:** Criar Edge Function para Nuvem Fiscal

#### Manhã (2h):
- [ ] Criar estrutura de Edge Function
  ```bash
  mkdir -p supabase/functions/nuvem-fiscal
  touch supabase/functions/nuvem-fiscal/index.ts
  ```

- [ ] Copiar código de [SOLUCOES_SEGURANCA.md](./SOLUCOES_SEGURANCA.md#1-mover-nuvem-fiscal-para-edge-function)
  - Implementar `getAccessToken()`
  - Implementar `emitirNFe()`
  - Configurar CORS

- [ ] Configurar secrets
  ```bash
  supabase secrets set NUVEM_FISCAL_CLIENT_ID="..."
  supabase secrets set NUVEM_FISCAL_CLIENT_SECRET="..."
  ```

#### Tarde (2h):
- [ ] Testar Edge Function localmente
  ```bash
  supabase functions serve nuvem-fiscal
  ```

- [ ] Criar arquivo de teste
  ```bash
  curl -X POST http://localhost:54321/functions/v1/nuvem-fiscal \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"action": "emitir", "data": {...}}'
  ```

- [ ] Deploy da Edge Function
  ```bash
  supabase functions deploy nuvem-fiscal
  ```

**Commit:** `feat: criar edge function para nuvem fiscal`

---

### 🔴 DIA 2 - Edge Function (Parte 2) - 4h

**Objetivo:** Atualizar frontend para usar Edge Function

#### Manhã (2h):
- [ ] Criar novo serviço no frontend
  ```bash
  touch src/services/nfe/nuvemFiscalServiceSecure.ts
  ```

- [ ] Implementar chamadas à Edge Function
  ```typescript
  // Copiar código de SOLUCOES_SEGURANCA.md
  export class NuvemFiscalServiceSecure {
    async emitirNFe(dados: NotaFiscalDados) {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nuvem-fiscal`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'emitir', data: dados })
        }
      )
      return response.json()
    }
  }
  ```

- [ ] Atualizar componentes para usar novo serviço
  - `EmitirNotaFiscal.tsx`
  - `ConsultarNotasFiscais.tsx`

#### Tarde (2h):
- [ ] Remover código antigo (vulnerável)
  ```bash
  # Deletar ou comentar:
  # src/services/nfe/nuvemFiscalAdapter.ts (linhas com CLIENT_SECRET)
  ```

- [ ] Remover variáveis VITE_NUVEM_FISCAL_* do .env
  ```bash
  # Backup primeiro
  cp .env .env.backup
  # Remover linhas:
  # VITE_NUVEM_FISCAL_CLIENT_ID=...
  # VITE_NUVEM_FISCAL_CLIENT_SECRET=...
  ```

- [ ] Testar emissão de NFe via Edge Function
  - Login no sistema
  - Emitir nota de teste em SANDBOX
  - Verificar logs

**Commit:** `feat: migrar nuvem fiscal para edge function segura`

---

### 🔴 DIA 3 - Remover Console.log (Parte 1) - 3h

**Objetivo:** Criar logger seguro e substituir primeiros console.log

#### Manhã (2h):
- [ ] Criar logger seguro
  ```bash
  touch src/utils/logger.ts
  ```

- [ ] Copiar código de [SOLUCOES_SEGURANCA.md](./SOLUCOES_SEGURANCA.md#2-remover-consolelog-em-producao)
  - Implementar `SecureLogger` class
  - Configurar sanitização de dados sensíveis

- [ ] Configurar Vite para strip logs
  ```typescript
  // vite.config.ts
  export default defineConfig({
    esbuild: {
      drop: ['console', 'debugger'],
    }
  })
  ```

#### Tarde (1h):
- [ ] Substituir console.log em arquivos críticos:
  - `src/services/nfe/nuvemFiscalAuth.ts` (10 ocorrências)
  - `src/services/nfe/nuvemFiscalClient.ts` (20 ocorrências)

**Commit:** `feat: criar logger seguro e configurar vite`

---

### 🔴 DIA 4 - Remover Console.log (Parte 2) - 3h

**Objetivo:** Continuar substituição de console.log

#### Dia todo (3h):
- [ ] Substituir console.log nos serviços:
  - `src/services/nfe/nfeService.ts`
  - `src/services/nfe/sefazClient.ts`
  - `src/services/nfe/sefazClientDireto.ts`

- [ ] Automatizar com script
  ```bash
  # Encontrar todos os console.log
  grep -rn "console.log" src/ > console-log-list.txt
  
  # Substituir automaticamente (com cuidado!)
  find src/ -type f -name "*.ts" -exec sed -i 's/console\.log/logger.debug/g' {} +
  ```

- [ ] Revisar mudanças manualmente
  - Verificar se substituição faz sentido
  - Ajustar níveis de log (debug, info, warn, error)

**Commit:** `refactor: substituir console.log por logger seguro em serviços`

---

### 🔴 DIA 5 - Remover Console.log (Parte 3) + localStorage - 4h

**Objetivo:** Finalizar logs e limpar localStorage

#### Manhã (2h):
- [ ] Substituir console.log nos componentes:
  - `src/features/notas-fiscais/EmitirNotaFiscal.tsx` (30 ocorrências)
  - `src/features/notas-fiscais/ConsultarNotasFiscais.tsx`
  - `src/features/empresas/ConfiguracoesFiscais.tsx`

- [ ] Build de produção e verificar bundle
  ```bash
  npm run build
  grep -r "console.log" dist/assets/*.js
  # Deve retornar vazio!
  ```

#### Tarde (2h):
- [ ] Criar React Context para NFe
  ```bash
  touch src/contexts/NFeContext.tsx
  ```

- [ ] Copiar código de [SOLUCOES_SEGURANCA.md](./SOLUCOES_SEGURANCA.md#3-remover-dados-de-localstorage)

- [ ] Substituir sessionStorage por Context
  - `EmitirNotaFiscal.tsx` (sessionStorage.setItem/getItem)
  - Remover todas as referências a `nfe_edicao`

- [ ] Mover parâmetros financeiros para Supabase
  - Criar tabela `parametros_sistema`
  - Migrar dados de localStorage

**Commit:** `feat: migrar dados sensíveis de localStorage para context/supabase`

---

## 📅 SEMANA 2 - VALIDAÇÃO E RLS

### 🟡 DIA 6-7 - Validação de Inputs (Parte 1) - 4h

**Objetivo:** Implementar Zod e DOMPurify

#### DIA 6 - Manhã (2h):
- [ ] Instalar dependências
  ```bash
  npm install zod dompurify
  npm install --save-dev @types/dompurify
  ```

- [ ] Criar schemas de validação
  ```bash
  mkdir src/schemas
  touch src/schemas/clienteSchema.ts
  touch src/schemas/produtoSchema.ts
  touch src/schemas/empresaSchema.ts
  ```

- [ ] Copiar schemas de [SOLUCOES_SEGURANCA.md](./SOLUCOES_SEGURANCA.md#4-validação-e-sanitização-de-inputs)

#### DIA 7 - Tarde (2h):
- [ ] Criar utilitários de sanitização
  ```bash
  touch src/utils/sanitizer.ts
  ```

- [ ] Implementar funções:
  - `sanitizeHTML()`
  - `sanitizeXML()`
  - `sanitizeObject()`

**Commit:** `feat: adicionar validação zod e sanitização`

---

### 🟡 DIA 8-9 - Validação de Inputs (Parte 2) - 4h

**Objetivo:** Criar hook e aplicar em formulários

#### DIA 8 (2h):
- [ ] Criar hook customizado
  ```bash
  touch src/hooks/useValidatedForm.ts
  ```

- [ ] Implementar `useValidatedForm<T>(schema)`

#### DIA 9 (2h):
- [ ] Aplicar validação em formulários:
  - Cadastro de Cliente
  - Cadastro de Empresa
  - Cadastro de Produto

- [ ] Testar validações:
  - Tentar cadastrar com dados inválidos
  - Verificar mensagens de erro
  - Testar XSS payloads

**Commit:** `feat: aplicar validação em formulários de cadastro`

---

### 🟡 DIA 10 - Aplicar RLS (Parte 1) - 3h

**Objetivo:** Habilitar RLS nas tabelas principais

#### Manhã (3h):
- [ ] Abrir Supabase SQL Editor

- [ ] Copiar script de [SOLUCOES_SEGURANCA.md](./SOLUCOES_SEGURANCA.md#5-aplicar-rls-completo-no-supabase)

- [ ] Aplicar RLS sequencialmente:
  ```sql
  -- 1. Empresas
  ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "usuarios_ver_propria_empresa" ON empresas ...
  
  -- 2. Usuários
  ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "usuarios_ver_mesma_empresa" ON usuarios ...
  
  -- 3. Clientes
  ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
  -- ... políticas
  
  -- etc.
  ```

- [ ] Verificar RLS ativo
  ```sql
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public';
  ```

**Commit:** `feat: habilitar RLS em todas as tabelas`

---

### 🟡 DIA 11 - Testar RLS (Parte 2) - 3h

**Objetivo:** Validar isolamento de dados

#### Manhã (2h):
- [ ] Criar 2 empresas de teste:
  - Empresa A (ID: empresa-teste-a)
  - Empresa B (ID: empresa-teste-b)

- [ ] Criar 2 usuários:
  - usuario-a@teste.com → empresa-teste-a
  - usuario-b@teste.com → empresa-teste-b

- [ ] Cadastrar dados em cada empresa:
  - 5 clientes
  - 5 produtos
  - 2 notas fiscais

#### Tarde (1h):
- [ ] Executar testes de [TESTES_SEGURANCA.md](./TESTES_SEGURANCA.md#teste-3-acessar-dados-de-outras-empresas)

- [ ] Verificar isolamento:
  ```javascript
  // Login como usuário A
  const { data } = await supabase.from('notas_fiscais').select('*')
  // Deve retornar APENAS notas da empresa A
  ```

- [ ] Documentar resultados dos testes

**Commit:** `test: validar RLS e isolamento de dados`

---

## 📅 SEMANA 3 - FINALIZAÇÕES E TESTES

### 🟢 DIA 12-13 - Melhorias Gerais - 4h

#### DIA 12 (2h):
- [ ] Atualizar dependências
  ```bash
  npm audit
  npm audit fix
  npm update jspdf
  npm uninstall xmldom
  npm install @xmldom/xmldom
  ```

- [ ] Remover `dangerouslySetInnerHTML`
  - Mover CSS para arquivos separados
  - `LoginForm.tsx`
  - `NovaSolicitacao.tsx`

#### DIA 13 (2h):
- [ ] Implementar rate limiting
  - Debounce em busca CEP
  - Cache de respostas

- [ ] Adicionar headers de segurança
  ```typescript
  // vercel.json
  {
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "Content-Security-Policy", "value": "..." }
        ]
      }
    ]
  }
  ```

**Commit:** `feat: melhorias gerais de segurança`

---

### 🧪 DIA 14-15 - Testes Completos - 8h

**Objetivo:** Validar TODAS as correções

#### DIA 14 (4h):
- [ ] Executar checklist de [TESTES_SEGURANCA.md](./TESTES_SEGURANCA.md)
  - ✅ Teste 1: CLIENT_SECRET no bundle
  - ✅ Teste 2: Console.log em produção
  - ✅ Teste 3: Bypass RLS
  - ✅ Teste 4: XSS
  - ✅ Teste 5: SQL Injection
  - ✅ Teste 6: localStorage
  - ✅ Teste 7: Dependências
  - ✅ Teste 8: Headers de segurança

#### DIA 15 (4h):
- [ ] Executar ferramentas automatizadas:
  ```bash
  # npm audit
  npm audit --audit-level=moderate
  
  # Lighthouse
  lighthouse https://tech-cresci-staging.vercel.app --view
  
  # Security Headers
  # https://securityheaders.com/
  ```

- [ ] Documentar resultados
  ```bash
  touch docs/RESULTADO_TESTES_SEGURANCA.md
  ```

- [ ] Corrigir itens pendentes identificados

**Commit:** `test: testes completos de segurança`

---

### 📦 DIA 16-17 - Build e Deploy - 4h

**Objetivo:** Deploy para produção

#### DIA 16 (2h):
- [ ] Build final de produção
  ```bash
  npm run build
  ```

- [ ] Verificações finais:
  ```bash
  # Nenhum console.log
  grep -r "console.log" dist/
  
  # Nenhuma credencial
  grep -r "CLIENT_SECRET" dist/
  grep -r "alylochrlvgcvjdmkmum" dist/
  
  # Bundle size OK
  ls -lh dist/assets/
  ```

- [ ] Merge para main
  ```bash
  git checkout main
  git merge feature/seguranca-critica
  ```

#### DIA 17 (2h):
- [ ] Deploy para staging
  ```bash
  vercel --prod --scope=staging
  ```

- [ ] Testar em staging (2h de smoke tests)
  - Login
  - Emissão de NFe
  - Cadastros
  - Consultas

- [ ] Deploy para produção
  ```bash
  git push origin main
  vercel --prod
  ```

- [ ] Monitorar logs por 1 hora

**Commit:** `release: correções de segurança v1.0.0`

---

### 📊 DIA 18 - Revisão Final - 2h

**Objetivo:** Calcular score e documentar

- [ ] Calcular score final de segurança
  - Score antes: 45/165 🔴
  - Score depois: ___ /165

- [ ] Atualizar documentação:
  ```bash
  touch docs/CHANGELOG_SEGURANCA.md
  ```

- [ ] Apresentação para equipe (1h)
  - O que foi feito
  - Resultados dos testes
  - Melhorias alcançadas

- [ ] Estabelecer rotina de segurança:
  - `npm audit` semanal
  - Revisão de código mensal
  - Testes de penetração trimestrais

---

## 📈 MÉTRICAS DE PROGRESSO

### Checklist Geral:

**CRÍTICO (Obrigatório):**
- [ ] ✅ CLIENT_SECRET movido para Edge Function
- [ ] ✅ 0 console.log em produção
- [ ] ✅ localStorage limpo de dados sensíveis
- [ ] ✅ Validação em todos os inputs
- [ ] ✅ RLS 100% aplicado

**MÉDIO (Recomendado):**
- [ ] ✅ Dependências atualizadas
- [ ] ✅ dangerouslySetInnerHTML removido
- [ ] ✅ Rate limiting implementado
- [ ] ✅ Headers de segurança configurados

**BAIXO (Opcional):**
- [ ] ✅ CSP implementado
- [ ] ✅ noopener/noreferrer adicionado
- [ ] ✅ HTTPS enforced

---

## 🔄 ROTINA PÓS-IMPLEMENTAÇÃO

### Diário:
- [ ] Monitorar logs de erro (Supabase Dashboard)
- [ ] Verificar tentativas de acesso suspeitas

### Semanal:
- [ ] Executar `npm audit`
- [ ] Revisar logs de autenticação
- [ ] Backup do banco de dados

### Mensal:
- [ ] Revisão de código focada em segurança
- [ ] Atualizar dependências
- [ ] Testar 2-3 vulnerabilidades aleatórias

### Trimestral:
- [ ] Teste de penetração completo
- [ ] Auditoria de RLS
- [ ] Renovar certificados digitais

---

## 🆘 CONTATOS DE EMERGÊNCIA

**Suporte Supabase:**
- https://supabase.com/support

**Nuvem Fiscal:**
- suporte@nuvemfiscal.com.br

**Receita Federal (NFe):**
- https://www.nfe.fazenda.gov.br

---

## ✅ CRITÉRIOS DE ACEITAÇÃO FINAL

Projeto considerado **SEGURO** quando:

- [ ] Score ≥ 150/165 (90%+)
- [ ] 0 vulnerabilidades críticas no npm audit
- [ ] A+ em securityheaders.com
- [ ] TODOS os testes de TESTES_SEGURANCA.md passando
- [ ] Code review aprovado por 2 desenvolvedores
- [ ] 1 semana em produção sem incidentes

---

**Data de início:** 09/02/2026  
**Data prevista de conclusão:** 01/03/2026  
**Status:** 🔴 AGUARDANDO INÍCIO

**Próxima ação:** Executar DIA 0 (Mitigação Imediata)
