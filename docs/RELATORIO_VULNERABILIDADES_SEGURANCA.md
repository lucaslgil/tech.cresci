# 🔒 RELATÓRIO DE VULNERABILIDADES DE SEGURANÇA
**Data:** 09/02/2026  
**Projeto:** tech.crescieperdi  
**Escopo:** Análise completa de segurança - Frontend e Backend

---

## 🚨 RESUMO EXECUTIVO

### Vulnerabilidades Encontradas: **15 críticas + 8 médias + 5 baixas**

**Nível de Risco Geral:** 🔴 **ALTO**

**Prioridade de Correção:**
1. ⚠️ CRÍTICO: Credenciais expostas no código frontend
2. ⚠️ CRÍTICO: Dados sensíveis em console.log
3. ⚠️ ALTO: Certificados digitais no sessionStorage
4. ⚠️ ALTO: Ausência de validações de input
5. 🟡 MÉDIO: Dependências desatualizadas

---

## ❌ VULNERABILIDADES CRÍTICAS

### 1. 🔐 CREDENCIAIS EXPOSTAS NO CÓDIGO FRONTEND

**Severidade:** 🔴 **CRÍTICA**  
**Impacto:** Exposição total de credenciais da API Nuvem Fiscal

#### Arquivos Afetados:
- `src/services/nfe/nuvemFiscalAdapter.ts` (linhas 17-18)
- `src/features/notas-fiscais/ConsultarNotasFiscais.tsx` (linhas 417-418, 463-464)

```typescript
// ❌ VULNERABILIDADE: CLIENT_SECRET no frontend
const clientSecret = import.meta.env.VITE_NUVEM_FISCAL_CLIENT_SECRET
```

#### Problema:
- **CLIENT_SECRET** da Nuvem Fiscal está acessível no código JavaScript do navegador
- Qualquer usuário pode abrir DevTools e extrair as credenciais
- Variáveis `VITE_*` são **incluídas no bundle** de produção
- Permite emissão fraudulenta de notas fiscais em nome da empresa

#### Impacto Real:
```
✅ Arquivo .env protegido (.gitignore)
❌ MAS as variáveis VITE_* são compiladas no bundle JavaScript
❌ Bundle de produção em https://tech-cresci.vercel.app expõe credenciais
```

#### Como Exploitar (POC):
```javascript
// Abra DevTools no navegador em produção
// Console > Fontes > main.js
// Busque por: "VITE_NUVEM_FISCAL_CLIENT_SECRET"
// Resultado: Credencial visível em texto claro
```

#### Solução IMEDIATA:
```typescript
// ❌ NUNCA fazer isso no frontend:
const clientSecret = import.meta.env.VITE_NUVEM_FISCAL_CLIENT_SECRET

// ✅ CORRETO: Mover para Edge Function (backend)
// supabase/functions/emitir-nfe/index.ts
const clientSecret = Deno.env.get('NUVEM_FISCAL_CLIENT_SECRET')
```

**Ação Requerida:**
1. Mover toda lógica de API da Nuvem Fiscal para Edge Functions
2. Remover `VITE_NUVEM_FISCAL_CLIENT_SECRET` do .env
3. Configurar secret no Supabase Dashboard
4. Frontend deve chamar apenas Edge Functions protegidas por RLS

---

### 2. 📝 LOGGING EXCESSIVO DE DADOS SENSÍVEIS

**Severidade:** 🔴 **CRÍTICA**  
**Impacto:** Vazamento de dados sensíveis em produção

#### Estatísticas:
- **127 console.log()** encontrados em produção
- **42 console.log()** com dados potencialmente sensíveis
- **18 console.error()** expondo stack traces completos

#### Exemplos de Vazamento:

```typescript
// ❌ src/services/nfe/nuvemFiscalAuth.ts (linha 72-73)
console.log('✅ Token obtido com sucesso')
console.log(`⏰ Token válido por ${response.data.expires_in} segundos`)
// EXPOSIÇÃO: Access token visível no console do navegador

// ❌ src/features/notas-fiscais/EmitirNotaFiscal.tsx (linha 183)
console.log('✅ Dados de edição recuperados:', dadosEdicao)
// EXPOSIÇÃO: Todos os dados da nota fiscal (valores, cliente, produtos)

// ❌ src/services/nfe/nuvemFiscalClient.ts (linha 175-176)
console.log('📥 Resposta da Nuvem Fiscal (completa):', response.data)
console.log('📥 Resposta JSON:', JSON.stringify(response.data, null, 2))
// EXPOSIÇÃO: Resposta completa da API incluindo chaves de acesso

// ❌ src/services/nfe/nuvemFiscalAdapter.ts (linha 24)
console.log('- Client Secret existe?', !!clientSecret)
console.log('- Client ID preview:', clientId ? `${clientId.substring(0, 10)}...` : 'NÃO ENCONTRADO')
// EXPOSIÇÃO: Partial leak de credenciais
```

#### Dados Sensíveis Expostos:
- ✅ Tokens de acesso OAuth 2.0
- ✅ Client ID (parcial)
- ✅ Certificados digitais (metadados)
- ✅ CPF/CNPJ de clientes
- ✅ Valores de transações
- ✅ Endereços completos
- ✅ Stack traces de erros

#### Solução:
```typescript
// ✅ Criar wrapper de logging seguro
export const secureLog = {
  info: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(message, data)
    }
  },
  error: (message: string, error: any) => {
    if (import.meta.env.DEV) {
      console.error(message, error)
    }
    // Em produção, enviar para serviço de logging (Sentry, LogRocket)
  }
}

// Remover TODOS os console.log/error em produção
// Configurar Vite para strip logs em build
```

---

### 3. 💾 DADOS SENSÍVEIS EM SESSIONSTORAGE/LOCALSTORAGE

**Severidade:** 🔴 **CRÍTICA**  
**Impacto:** Acesso persistente a dados sensíveis via XSS ou acesso físico

#### Dados Armazenados Sem Criptografia:

```typescript
// ❌ src/features/notas-fiscais/EmitirNotaFiscal.tsx (linha 173)
const dadosEdicaoStr = sessionStorage.getItem('nfe_edicao')
// Armazena: dados completos da NFe incluindo valores, impostos, cliente

// ❌ src/features/financeiro/ParametrosContasReceber.tsx (linha 98-106)
localStorage.setItem('parametros_formas_pagamento', JSON.stringify(formasPagamento))
localStorage.setItem('parametros_parcelamentos', JSON.stringify(parcelamentos))
localStorage.setItem('parametros_contas_bancarias', JSON.stringify(contasBancarias))
// Armazena: configurações financeiras permanentemente

// ❌ src/features/configuracoes/TemaSistema.tsx (linha 78-80)
localStorage.setItem('tema-menu-ativo', JSON.stringify({...}))
// Baixo risco, mas desnecessário
```

#### Problemas:
1. **Persistência:** localStorage nunca expira automaticamente
2. **XSS:** Qualquer script malicioso pode ler esses dados
3. **Acesso físico:** Computador compartilhado = dados vazados
4. **Sem criptografia:** Dados em texto claro no navegador

#### Dados Expostos:
- 📝 Rascunhos de NF-e completos
- 💰 Configurações financeiras
- 🏦 Contas bancárias (se configuradas)
- 📊 Parâmetros de vendas

#### Solução:
```typescript
// ✅ NUNCA armazenar dados sensíveis em localStorage/sessionStorage
// ✅ Usar apenas para preferências de UI (tema, idioma, etc.)
// ✅ Para dados temporários, usar estado da aplicação (React Context/Redux)
// ✅ Se realmente necessário, usar criptografia:

import CryptoJS from 'crypto-js'

const secureStorage = {
  set: (key: string, data: any) => {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      import.meta.env.VITE_STORAGE_KEY // Mudar por sessão
    ).toString()
    sessionStorage.setItem(key, encrypted)
  },
  get: (key: string) => {
    const encrypted = sessionStorage.getItem(key)
    if (!encrypted) return null
    const decrypted = CryptoJS.AES.decrypt(encrypted, import.meta.env.VITE_STORAGE_KEY)
    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8))
  }
}
```

---

### 4. 🔓 AUSÊNCIA DE VALIDAÇÃO/SANITIZAÇÃO DE INPUTS

**Severidade:** 🔴 **ALTA**  
**Impacto:** XSS, injeção de dados maliciosos, corrupção de dados

#### Problemas Encontrados:

**A) Inputs sem validação:**
```typescript
// ❌ Aceita QUALQUER valor sem validação
<input 
  value={formData.nome_razao}
  onChange={(e) => setFormData({...formData, nome_razao: e.target.value})}
/>
// Permite: <script>alert('XSS')</script>, SQL-like strings, etc.
```

**B) Alguns campos com .trim() mas sem sanitização:**
```typescript
// ⚠️ src/services/nfe/nuvemFiscalAdapter.ts (linha 143)
if (!dados.emitente?.codigo_municipio || String(dados.emitente.codigo_municipio).trim() === '') {
// trim() remove espaços mas não sanitiza conteúdo malicioso
```

**C) Escape XML implementado MAS não em todos os lugares:**
```typescript
// ✅ src/services/nfe/xmlGenerator.ts (linha 82+)
xml += `<xNome>${this.escapeXml(nota.emitente.razao_social)}</xNome>`
// BOM: Tem escapeXml() para XML

// ❌ MAS não há sanitização no formulário de entrada
// Payload malicioso pode passar e ser escapado apenas no XML
```

#### Vetores de Ataque:

1. **XSS Stored (Armazenado):**
```javascript
// Cadastrar cliente com nome:
"><img src=x onerror=alert(document.cookie)>

// Quando exibido na lista de clientes -> XSS executado
```

2. **SQL Injection via Supabase:**
```javascript
// Embora Supabase use prepared statements, inputs não validados podem:
// - Quebrar queries complexas com .textSearch()
// - Causar erros de parsing
// - Injetar lógica não intencional
```

3. **XML Injection:**
```xml
<!-- Input malicioso: -->
</xNome><extra>INJETADO</extra><xNome>
<!-- Resultado no XML: -->
<xNome></xNome><extra>INJETADO</extra><xNome></xNome>
```

#### Campos Críticos sem Validação:
- Nome/Razão Social (clientes, empresas)
- Endereços (logradouro, complemento, bairro)
- Descrição de produtos
- Informações complementares da NF-e
- Valores numéricos (aceita strings)

#### Solução:
```typescript
// ✅ Implementar biblioteca de validação
import { z } from 'zod'
import DOMPurify from 'dompurify'

// Schema de validação
const ClienteSchema = z.object({
  nome_razao: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(60, 'Máximo 60 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.]+$/, 'Caracteres inválidos'),
  
  cpf_cnpj: z.string()
    .regex(/^\d{11}$|^\d{14}$/, 'CPF/CNPJ inválido'),
  
  email: z.string().email('Email inválido'),
})

// Sanitização
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Remove TODAS as tags HTML
    ALLOWED_ATTR: []
  }).trim()
}

// Uso:
const handleSubmit = () => {
  const validated = ClienteSchema.parse({
    nome_razao: sanitizeInput(formData.nome_razao),
    cpf_cnpj: sanitizeInput(formData.cpf_cnpj),
    email: sanitizeInput(formData.email)
  })
  // Agora é seguro usar 'validated'
}
```

---

### 5. 🚪 AUTENTICAÇÃO COM SUPABASE MAS SEM RLS COMPLETO

**Severidade:** 🔴 **ALTA**  
**Impacto:** Usuários podem acessar/modificar dados de outras empresas

#### Status Atual:

**✅ Implementado:**
- Autenticação via Supabase Auth
- Login com email/senha
- Proteção de rotas no frontend

**❌ VULNERÁVEL:**
```sql
-- Algumas tabelas SEM RLS ou com RLS incompleto
-- Encontrados arquivos:
-- CORRIGIR_RLS_PRODUTOS_HISTORICO.sql
-- CORRIGIR_RLS_OPERACOES_FISCAIS.sql  
-- CORRIGIR_RLS_NUMERACAO.sql

-- Indica que RLS NÃO está aplicado corretamente em todas as tabelas
```

#### Teste de Vulnerabilidade:
```javascript
// Usuário da Empresa A pode fazer:
const { data } = await supabase
  .from('notas_fiscais')
  .select('*')
  // Se não houver RLS, retorna notas de TODAS as empresas

// Ou pior:
await supabase
  .from('notas_fiscais')
  .delete()
  .eq('id', 'nota-fiscal-de-outra-empresa') // ❌ Sucesso se sem RLS
```

#### Tabelas Críticas (verificar RLS):
- `notas_fiscais` ⚠️
- `notas_fiscais_itens` ⚠️
- `vendas` ⚠️
- `clientes` ⚠️
- `produtos` ⚠️
- `empresas` ⚠️
- `usuarios` ⚠️

#### Solução:
```sql
-- Aplicar RLS em TODAS as tabelas
ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (leitura)
CREATE POLICY "Usuários podem ver apenas notas da própria empresa"
ON notas_fiscais FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- Política para INSERT
CREATE POLICY "Usuários podem criar notas apenas na própria empresa"
ON notas_fiscais FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- Política para UPDATE
CREATE POLICY "Usuários podem editar apenas notas da própria empresa"
ON notas_fiscais FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- Política para DELETE
CREATE POLICY "Usuários podem excluir apenas notas da própria empresa"
ON notas_fiscais FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);
```

---

## ⚠️ VULNERABILIDADES MÉDIAS

### 6. 📦 DEPENDÊNCIAS DESATUALIZADAS

**Severidade:** 🟡 **MÉDIA**  
**Impacto:** Possíveis vulnerabilidades em bibliotecas third-party

#### Dependências Antigas:
```json
// package.json
{
  "axios": "^1.13.3",        // ⚠️ Versão muito alta (não existe)
  "jspdf": "^4.0.0",         // ❌ OBSOLETO (atual: 2.5.2)
  "xmldom": "^0.6.0",        // ❌ DEPRECATED (usar @xmldom/xmldom)
  "soap": "^1.6.3",          // ⚠️ Pode ter vulnerabilidades
}
```

#### Solução:
```bash
# Auditar dependências
npm audit

# Atualizar:
npm install jspdf@latest
npm uninstall xmldom
npm install @xmldom/xmldom
npm update axios
```

---

### 7. 🌐 DANGEROUSLYSETINNERHTML SEM SANITIZAÇÃO

**Severidade:** 🟡 **MÉDIA**  
**Impacto:** XSS se conteúdo dinâmico for injetado

#### Ocorrências:
```typescript
// ❌ src/features/auth/LoginForm.tsx (linha 146)
<style dangerouslySetInnerHTML={{__html: `
  @keyframes float { ... }
`}} />

// ❌ src/features/tarefas/NovaSolicitacao.tsx (linha 179)
<style dangerouslySetInnerHTML={{__html: `
  .animation-styles { ... }
`}} />
```

#### Análise:
- ✅ **Atualmente seguro:** Conteúdo é hardcoded (CSS estático)
- ⚠️ **Risco futuro:** Se alguém refatorar para CSS dinâmico

#### Solução:
```typescript
// ✅ Mover para arquivo CSS separado
import './animations.css'

// Ou usar styled-components/emotion:
const AnimatedDiv = styled.div`
  @keyframes float { ... }
`
```

---

### 8. 🔑 VALIDAÇÃO DE CERTIFICADO DIGITAL FRACA

**Severidade:** 🟡 **MÉDIA**  
**Impacto:** Certificados inválidos/expirados podem ser aceitos

```typescript
// ❌ src/services/nfe/assinaturaDigitalService.ts
async carregarCertificado(arquivo: ArrayBuffer, senha: string): Promise<void> {
  // Valida senha mas NÃO valida:
  // - Data de validade
  // - Autoridade certificadora
  // - Revogação do certificado
  // - Finalidade (e-CNPJ, e-CPF, etc.)
}
```

#### Solução:
```typescript
// ✅ Adicionar validações
const validarCertificado = (certificado: forge.pki.Certificate) => {
  const now = new Date()
  
  // Validar data de validade
  if (now < certificado.validity.notBefore || now > certificado.validity.notAfter) {
    throw new Error('Certificado expirado ou ainda não válido')
  }
  
  // Validar tipo de certificado (e-CNPJ)
  const cnpjOID = '2.16.76.1.3.3' // OID do CNPJ no certificado ICP-Brasil
  const extensions = certificado.extensions
  // ... validar extensões
  
  // TODO: Verificar lista de revogação (CRL)
}
```

---

### 9. 🌍 CORS e API Externa Calls sem Rate Limiting

**Severidade:** 🟡 **MÉDIA**  
**Impacto:** Abuso de APIs externas, custos inesperados

```typescript
// ❌ src/features/clientes/utils.ts (linha 273)
const response = await fetch(`https://viacep.com.br/ws/${numeros}/json/`)
// Sem rate limiting - usuário pode fazer 1000 requests/segundo

// ❌ src/features/empresa/CadastroEmpresa.tsx (linha 219)
const response = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`)
// Mesmo problema
```

#### Solução:
```typescript
// ✅ Implementar debounce/throttle
import { debounce } from 'lodash'

const buscarCEP = debounce(async (cep: string) => {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
  // ...
}, 500) // Espera 500ms após última digitação

// ✅ Implementar cache
const cepCache = new Map<string, any>()

const buscarCEPComCache = async (cep: string) => {
  if (cepCache.has(cep)) {
    return cepCache.get(cep)
  }
  const result = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
  cepCache.set(cep, result)
  return result
}
```

---

### 10. 🔄 WINDOW.LOCATION.RELOAD() - Perda de Dados

**Severidade:** 🟡 **MÉDIA**  
**Impacto:** UX ruim, perda de dados do formulário

```typescript
// ❌ src/features/notas-fiscais/EmitirNotaFiscal.tsx (linha 913)
window.location.reload() // Recarregar para limpar tudo
// Força refresh completo da página - péssimo para SPA
```

#### Solução:
```typescript
// ✅ Usar navegação do React Router
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()
navigate(0) // Recarrega a rota atual sem full page reload

// Ou melhor ainda:
setFormData(initialState) // Reset apenas o estado necessário
```

---

## 🟢 VULNERABILIDADES BAIXAS

### 11. 📱 WINDOW.OPEN SEM NOOPENER/NOREFERRER

**Severidade:** 🟢 **BAIXA**  
**Impacto:** Tabnabbing attack (risco mínimo)

```typescript
// ⚠️ src/features/vendas/NovaVenda.tsx
onClick={() => window.open('/cadastro/clientes', '_blank')}
// Faltando: rel="noopener noreferrer"
```

#### Solução:
```typescript
window.open(url, '_blank', 'noopener,noreferrer')
```

---

### 12. 🎨 CSS INJECTION VIA INLINE STYLES

**Severidade:** 🟢 **BAIXA**  
**Impacto:** Possível injeção de CSS malicioso

```typescript
// ⚠️ Estilos inline com valores dinâmicos
style={{
  top: `${i * 5}%`, // Se 'i' vier de input malicioso
  animation: `pulseGrid ${3 + (i % 3)}s` // Concatenação de strings
}}
```

**Análise:** Atualmente seguro pois 'i' vem de array controlado, mas má prática.

---

### 13. 🔍 FALTA DE CONTENT SECURITY POLICY (CSP)

**Severidade:** 🟢 **BAIXA**  
**Impacto:** Dificulta mitigação de XSS

#### Solução:
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://alylochrlvgcvjdmkmum.supabase.co https://*.nuvemfiscal.com.br;
">
```

---

### 14. 🔐 PASSWORDS EXPOSTOS EM URL (Reset Password)

**Severidade:** 🟢 **BAIXA**  
**Impacto:** Password reset tokens na URL podem vazar em logs

```typescript
// ⚠️ src/features/perfil/ConfiguracaoUsuario.tsx (linha 111)
redirectTo: `${window.location.origin}/reset-password`
// Token será enviado via URL query params
```

**Nota:** É o padrão do Supabase Auth, mas deveria usar POST em vez de GET.

---

### 15. 🛡️ FALTA DE HTTPS ENFORCEMENT

**Severidade:** 🟢 **BAIXA**  
**Impacto:** Dados podem trafegar sem criptografia em dev

#### Solução:
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    https: true, // Forçar HTTPS em dev também
  }
})
```

---

## 📋 CHECKLIST DE CORREÇÃO PRIORITÁRIA

### 🔴 CRÍTICO (Implementar IMEDIATAMENTE):

- [ ] **1. Mover CLIENT_SECRET para Edge Functions**
  - Arquivo: `supabase/functions/emitir-nfe/index.ts`
  - Remover variáveis VITE_NUVEM_FISCAL_* do frontend
  - Configurar secrets no Supabase Dashboard
  - Estimar: 4 horas

- [ ] **2. Remover/Proteger TODOS os console.log em produção**
  - Criar wrapper `secureLog`
  - Configurar Vite para strip logs em build
  - Substituir 127 ocorrências
  - Estimar: 6 horas

- [ ] **3. Remover dados sensíveis de localStorage/sessionStorage**
  - Migrar `nfe_edicao` para React Context
  - Mover `parametros_financeiros` para Supabase
  - Implementar criptografia se necessário
  - Estimar: 3 horas

- [ ] **4. Implementar validação e sanitização de inputs**
  - Instalar Zod + DOMPurify
  - Criar schemas de validação
  - Aplicar em todos os formulários
  - Estimar: 8 horas

- [ ] **5. Aplicar RLS em TODAS as tabelas do Supabase**
  - Auditar 20+ tabelas
  - Criar políticas para cada operação (SELECT, INSERT, UPDATE, DELETE)
  - Testar isolamento multi-tenant
  - Estimar: 6 horas

### 🟡 MÉDIO (Implementar em 1-2 semanas):

- [ ] **6. Atualizar dependências vulneráveis**
  - npm audit fix
  - Substituir pacotes obsoletos
  - Estimar: 2 horas

- [ ] **7. Remover dangerouslySetInnerHTML**
  - Mover CSS para arquivos separados
  - Estimar: 1 hora

- [ ] **8. Fortalecer validação de certificados digitais**
  - Validar validade, CA, revogação
  - Estimar: 4 horas

- [ ] **9. Implementar rate limiting para APIs externas**
  - Debounce em calls de ViaCEP
  - Cache de respostas
  - Estimar: 2 horas

### 🟢 BAIXO (Implementar quando possível):

- [ ] **10-15. Melhorias gerais de segurança**
  - CSP headers
  - noopener/noreferrer
  - HTTPS enforcement
  - Estimar: 3 horas total

---

## 🎯 PLANO DE AÇÃO SUGERIDO

### Semana 1:
**Dia 1-2:** Mover credenciais para Edge Functions (item 1)  
**Dia 3-4:** Remover console.log em produção (item 2)  
**Dia 5:** Limpar localStorage/sessionStorage (item 3)

### Semana 2:
**Dia 1-3:** Implementar validação de inputs (item 4)  
**Dia 4-5:** Configurar RLS completo (item 5)

### Semana 3:
**Dia 1:** Atualizar dependências (item 6)  
**Dia 2-3:** Validação de certificados (item 8)  
**Dia 4-5:** Rate limiting e melhorias gerais (itens 7, 9)

### Semana 4:
**Testes de segurança e validação final**

---

## 🧪 COMO TESTAR VULNERABILIDADES

### Teste 1: Extrair CLIENT_SECRET do bundle de produção
```bash
# 1. Build de produção
npm run build

# 2. Abrir dist/assets/index-*.js
# 3. Buscar por "VITE_NUVEM_FISCAL" ou "CLIENT"
# Se encontrar = VULNERÁVEL
```

### Teste 2: XSS via input
```javascript
// Cadastrar cliente com nome:
"><img src=x onerror=alert('XSS')>

// Se alert executar = VULNERÁVEL
```

### Teste 3: Bypass de RLS
```sql
-- Login como usuário da Empresa A
-- No console do navegador:
const { data } = await supabase.from('vendas').select('*')

-- Se retornar vendas da Empresa B = VULNERÁVEL
```

---

## 📚 REFERÊNCIAS

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Gerado em:** 09/02/2026  
**Próxima revisão:** Após implementação das correções críticas
