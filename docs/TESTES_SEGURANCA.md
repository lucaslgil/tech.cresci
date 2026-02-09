# 🧪 TESTES DE SEGURANÇA - CHECKLIST

Execute estes testes para verificar as vulnerabilidades identificadas.

---

## 🔴 TESTES CRÍTICOS

### Teste 1: Extrair CLIENT_SECRET do Bundle de Produção

**Objetivo:** Verificar se credenciais estão expostas no JavaScript compilado

**Como testar:**

```bash
# 1. Build de produção
npm run build

# 2. Procurar por credenciais no bundle
cd dist/assets
grep -r "NUVEM_FISCAL" *.js
grep -r "CLIENT_SECRET" *.js
grep -r "alylochrlvgcvjdmkmum" *.js  # URL do Supabase

# Windows PowerShell:
Select-String -Path ".\dist\assets\*.js" -Pattern "NUVEM_FISCAL"
Select-String -Path ".\dist\assets\*.js" -Pattern "CLIENT_SECRET"
```

**Resultado esperado:**
- ❌ **VULNERÁVEL:** Se encontrar "CLIENT_SECRET" ou valores de credenciais
- ✅ **SEGURO:** Se não encontrar nenhuma credencial

**Alternativa (via navegador):**
1. Abrir https://tech-cresci.vercel.app
2. DevTools (F12) > Fontes (Sources)
3. Ctrl+F buscar por: "NUVEM_FISCAL", "CLIENT_SECRET"
4. Se encontrar = VULNERÁVEL

---

### Teste 2: Verificar Console.log em Produção

**Objetivo:** Confirmar que logs sensíveis não aparecem em produção

**Como testar:**

1. Abrir https://tech-cresci.vercel.app
2. DevTools (F12) > Console
3. Fazer login
4. Navegar para "Emitir NF-e"
5. Observar mensagens no console

**Resultado esperado:**
- ❌ **VULNERÁVEL:** Se aparecer logs com:
  - "Token obtido com sucesso"
  - "Dados de edição recuperados: {...}"
  - "Client Secret existe?"
  - Qualquer objeto com dados sensíveis
- ✅ **SEGURO:** Console limpo ou apenas erros não-sensíveis

**Automated Test:**

```typescript
// test/security/console-logs.spec.ts
describe('Console Logs em Produção', () => {
  it('não deve ter console.log em produção', () => {
    const consoleLog = jest.spyOn(console, 'log')
    
    // Executar alguma ação do sistema
    render(<EmitirNotaFiscal />)
    
    // Verificar que console.log não foi chamado
    expect(consoleLog).not.toHaveBeenCalled()
  })
})
```

---

### Teste 3: Acessar Dados de Outras Empresas (Bypass RLS)

**Objetivo:** Verificar se RLS está funcionando corretamente

**Pré-requisito:** 
- 2 usuários de empresas diferentes
- Usuário A: empresa_id = "empresa-a"
- Usuário B: empresa_id = "empresa-b"

**Como testar:**

```javascript
// 1. Login como Usuário A
// 2. Abrir DevTools > Console
// 3. Executar:

const { data: notasEmpresaA } = await supabase
  .from('notas_fiscais')
  .select('*')

console.log('Notas da empresa A:', notasEmpresaA)

// 4. Tentar acessar nota de outra empresa
const { data: notaEmpresaB } = await supabase
  .from('notas_fiscais')
  .select('*')
  .eq('empresa_id', 'empresa-b') // ID de outra empresa

console.log('Tentou acessar empresa B:', notaEmpresaB)

// 5. Tentar criar nota em nome de outra empresa
const { data, error } = await supabase
  .from('notas_fiscais')
  .insert({
    empresa_id: 'empresa-b', // ID de outra empresa
    numero: 999,
    serie: 1,
    // ... outros campos
  })

console.log('Tentou criar nota empresa B:', { data, error })
```

**Resultado esperado:**
- ✅ **SEGURO:**
  - `notasEmpresaA` retorna apenas notas da empresa A
  - `notaEmpresaB` retorna vazio ou erro
  - INSERT em empresa B retorna erro de política
- ❌ **VULNERÁVEL:**
  - `notaEmpresaB` retorna dados de outra empresa
  - INSERT em empresa B é bem-sucedido

---

### Teste 4: XSS (Cross-Site Scripting)

**Objetivo:** Verificar se inputs aceitam scripts maliciosos

**Como testar:**

```javascript
// Payloads de teste
const xssPayloads = [
  '<script>alert("XSS")</script>',
  '"><img src=x onerror=alert("XSS")>',
  '<iframe src="javascript:alert(\'XSS\')">',
  '\'><script>alert(String.fromCharCode(88,83,83))</script>',
  '<svg/onload=alert("XSS")>',
]

// 1. Ir para Cadastro de Cliente
// 2. No campo "Nome/Razão Social", inserir cada payload
// 3. Salvar
// 4. Ir para Lista de Clientes
// 5. Verificar se algum script é executado
```

**Locais para testar:**
- [ ] Cadastro de Cliente - Nome
- [ ] Cadastro de Produto - Descrição
- [ ] NF-e - Informações Complementares
- [ ] Cadastro de Empresa - Razão Social
- [ ] Endereço - Logradouro, Complemento

**Resultado esperado:**
- ✅ **SEGURO:** Nenhum alert() é disparado, texto é escapado ou recusado
- ❌ **VULNERÁVEL:** Alert() é executado = XSS confirmado

---

### Teste 5: SQL Injection via Supabase

**Objetivo:** Verificar se queries aceitam injeção SQL

**Como testar:**

```javascript
// Payloads de teste
const sqlPayloads = [
  "' OR '1'='1",
  "'; DROP TABLE clientes; --",
  "1' UNION SELECT * FROM usuarios--",
]

// 1. Campo de busca de clientes
// 2. Inserir payload no campo de busca
// 3. Observar comportamento

// Exemplo de teste direto:
const payload = "' OR '1'='1"

const { data } = await supabase
  .from('clientes')
  .select('*')
  .ilike('nome_razao', `%${payload}%`) // ⚠️ Perigoso se não sanitizado
```

**Resultado esperado:**
- ✅ **SEGURO:** Supabase escapa automaticamente (prepared statements)
- ⚠️ **ATENÇÃO:** Se usar .textSearch() ou funções RPC custom, validar inputs

---

### Teste 6: Acesso a Dados em localStorage/sessionStorage

**Objetivo:** Verificar se dados sensíveis estão armazenados localmente

**Como testar:**

```javascript
// 1. Fazer login e usar o sistema
// 2. DevTools > Console

// Listar TODOS os dados no localStorage
console.log('localStorage:')
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i)
  console.log(`${key}:`, localStorage.getItem(key))
}

// Listar TODOS os dados no sessionStorage
console.log('sessionStorage:')
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i)
  console.log(`${key}:`, sessionStorage.getItem(key))
}

// Procurar por dados sensíveis
const allStorage = {
  ...localStorage,
  ...sessionStorage
}

const sensitiveKeys = [
  'nfe_edicao',
  'token',
  'password',
  'certificado',
  'parametros',
  'cliente',
  'nota_fiscal'
]

sensitiveKeys.forEach(key => {
  Object.keys(allStorage).forEach(storageKey => {
    if (storageKey.toLowerCase().includes(key)) {
      console.warn('🚨 Dado sensível encontrado:', storageKey)
    }
  })
})
```

**Resultado esperado:**
- ❌ **VULNERÁVEL:** Se encontrar:
  - `nfe_edicao` com dados completos da nota
  - `parametros_contas_bancarias`
  - `certificado_digital`
  - Qualquer token ou credencial
- ✅ **SEGURO:** Apenas preferências de UI (tema, idioma, etc.)

---

## 🟡 TESTES MÉDIOS

### Teste 7: Dependências Vulneráveis

**Objetivo:** Identificar bibliotecas com vulnerabilidades conhecidas

**Como testar:**

```bash
# Auditar dependências
npm audit

# Ver relatório detalhado
npm audit --json > audit-report.json

# Verificar apenas vulnerabilidades críticas e altas
npm audit --audit-level=moderate
```

**Resultado esperado:**
- ✅ **SEGURO:** 0 vulnerabilidades críticas/altas
- ⚠️ **ATENÇÃO:** Vulnerabilidades encontradas = atualizar pacotes

**Fix automático:**

```bash
npm audit fix
npm audit fix --force  # Para updates breaking
```

---

### Teste 8: HTTPS e Headers de Segurança

**Objetivo:** Verificar headers HTTP de segurança

**Como testar:**

```bash
# Usando curl
curl -I https://tech-cresci.vercel.app

# Verificar headers esperados:
# - Strict-Transport-Security (HSTS)
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY
# - X-XSS-Protection: 1; mode=block
# - Content-Security-Policy
```

**Alternativa (via navegador):**
1. Abrir https://tech-cresci.vercel.app
2. DevTools (F12) > Rede (Network)
3. Recarregar página
4. Clicar no primeiro request
5. Ver aba "Cabeçalhos" (Headers)

**Online:**
- https://securityheaders.com/
- Inserir URL do site

**Resultado esperado:**
- ✅ **A+:** Todos os headers de segurança presentes
- ❌ **F:** Faltam headers importantes

---

### Teste 9: Rate Limiting em APIs

**Objetivo:** Verificar se há proteção contra abuso

**Como testar:**

```javascript
// Teste de stress na API ViaCEP
async function testRateLimit() {
  const requests = []
  
  // Fazer 100 requests simultâneos
  for (let i = 0; i < 100; i++) {
    requests.push(
      fetch('https://viacep.com.br/ws/01001000/json/')
    )
  }
  
  const start = Date.now()
  const results = await Promise.all(requests)
  const end = Date.now()
  
  console.log('Tempo:', end - start, 'ms')
  console.log('Sucesso:', results.filter(r => r.ok).length)
  console.log('Erro:', results.filter(r => !r.ok).length)
}

testRateLimit()
```

**Resultado esperado:**
- ❌ **VULNERÁVEL:** Todos os 100 requests são bem-sucedidos
- ✅ **SEGURO:** Requests são limitados (debounce/throttle implementado)

---

### Teste 10: Validação de Certificado Digital

**Objetivo:** Verificar se certificados inválidos são aceitos

**Como testar:**

1. Gerar certificado auto-assinado (inválido):

```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 1
openssl pkcs12 -export -out certificado-fake.pfx -inkey key.pem -in cert.pem
```

2. Tentar usar esse certificado no sistema:
   - Configurações Fiscais > Certificado Digital
   - Fazer upload do `certificado-fake.pfx`

**Resultado esperado:**
- ✅ **SEGURO:** Certificado é recusado com mensagem clara
- ❌ **VULNERÁVEL:** Certificado inválido é aceito

**Verificações necessárias:**
- [ ] Data de validade
- [ ] Autoridade Certificadora (CA)
- [ ] Tipo de certificado (e-CNPJ vs e-CPF)
- [ ] Cadeia de certificação
- [ ] Lista de revogação (CRL)

---

## 🟢 TESTES COMPLEMENTARES

### Teste 11: Session Fixation

**Objetivo:** Verificar se sessão é renovada após login

**Como testar:**

```javascript
// 1. Antes do login, pegar session_id
const sessionBefore = await supabase.auth.getSession()
console.log('Session antes:', sessionBefore.data.session?.access_token)

// 2. Fazer login
await supabase.auth.signInWithPassword({
  email: 'teste@example.com',
  password: 'senha123'
})

// 3. Pegar nova session
const sessionAfter = await supabase.auth.getSession()
console.log('Session depois:', sessionAfter.data.session?.access_token)

// 4. Comparar
console.log('Tokens diferentes?', sessionBefore.data.session?.access_token !== sessionAfter.data.session?.access_token)
```

**Resultado esperado:**
- ✅ **SEGURO:** Tokens são diferentes (sessão renovada)
- ❌ **VULNERÁVEL:** Token permanece o mesmo

---

### Teste 12: CSRF (Cross-Site Request Forgery)

**Objetivo:** Verificar se ações críticas exigem token CSRF

**Como testar:**

```html
<!-- Arquivo malicioso.html -->
<html>
<body>
<h1>Site Malicioso</h1>
<form id="attack" action="https://tech-cresci.vercel.app/api/nfe/emitir" method="POST">
  <input type="hidden" name="empresa_id" value="empresa-vitima">
  <input type="hidden" name="valor" value="9999">
</form>
<script>
  document.getElementById('attack').submit()
</script>
</body>
</html>
```

**Resultado esperado:**
- ✅ **SEGURO:** Request é bloqueado (Supabase Auth protege via tokens)
- ❌ **VULNERÁVEL:** Ação é executada

**Nota:** Supabase já protege contra CSRF via tokens JWT.

---

### Teste 13: Clickjacking

**Objetivo:** Verificar se site pode ser embutido em iframe

**Como testar:**

```html
<!-- malicioso.html -->
<html>
<body>
<h1>Clique no botão para ganhar iPhone!</h1>
<iframe src="https://tech-cresci.vercel.app" width="500" height="500"></iframe>
</body>
</html>
```

**Abrir malicioso.html no navegador e ver se o iframe carrega.**

**Resultado esperado:**
- ✅ **SEGURO:** Iframe bloqueado (X-Frame-Options: DENY)
- ❌ **VULNERÁVEL:** Site carrega dentro do iframe

**Fix:**

```typescript
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Content-Security-Policy",
          "value": "frame-ancestors 'none';"
        }
      ]
    }
  ]
}
```

---

### Teste 14: Enumeração de Usuários

**Objetivo:** Verificar se sistema revela existência de usuários

**Como testar:**

```javascript
// Tentar login com usuário inexistente
const result1 = await supabase.auth.signInWithPassword({
  email: 'usuario-fake@example.com',
  password: 'senha-qualquer'
})

console.log('Erro usuário fake:', result1.error?.message)

// Tentar login com usuário existente mas senha errada
const result2 = await supabase.auth.signInWithPassword({
  email: 'usuario-real@example.com',
  password: 'senha-errada'
})

console.log('Erro usuário real:', result2.error?.message)
```

**Resultado esperado:**
- ✅ **SEGURO:** Mensagens de erro são iguais
  - "Email ou senha inválidos"
- ❌ **VULNERÁVEL:** Mensagens diferentes revelam se usuário existe
  - "Usuário não encontrado" vs "Senha incorreta"

---

### Teste 15: Brute Force Protection

**Objetivo:** Verificar se há proteção contra tentativas excessivas de login

**Como testar:**

```javascript
async function bruteForceTeste() {
  for (let i = 0; i < 20; i++) {
    const result = await supabase.auth.signInWithPassword({
      email: 'usuario@example.com',
      password: 'senha-errada-' + i
    })
    
    console.log(`Tentativa ${i + 1}:`, result.error?.message)
    
    if (result.error?.message?.includes('muitas tentativas')) {
      console.log('✅ Proteção ativada após', i + 1, 'tentativas')
      return
    }
  }
  
  console.log('❌ Nenhuma proteção de rate limiting')
}

bruteForceTeste()
```

**Resultado esperado:**
- ✅ **SEGURO:** Bloqueio após 5-10 tentativas
- ❌ **VULNERÁVEL:** Permite tentativas ilimitadas

**Nota:** Supabase tem proteção nativa, mas verificar se está ativada.

---

## 📊 FERRAMENTAS AUTOMATIZADAS

### OWASP ZAP (Automated Security Testing)

```bash
# Instalar OWASP ZAP
# https://www.zaproxy.org/download/

# Escanear site
zap-cli quick-scan https://tech-cresci.vercel.app

# Gerar relatório
zap-cli report -o security-report.html -f html
```

### Lighthouse Security Audit

```bash
# Via Chrome DevTools
# F12 > Lighthouse > Security

# Via CLI
npm install -g lighthouse
lighthouse https://tech-cresci.vercel.app --view
```

### Snyk (Dependency Scan)

```bash
npm install -g snyk
snyk auth
snyk test
snyk monitor  # Monitoramento contínuo
```

---

## 📋 CHECKLIST COMPLETO

### 🔴 Crítico
- [ ] CLIENT_SECRET não está no bundle
- [ ] Console.log limpo em produção
- [ ] localStorage sem dados sensíveis
- [ ] RLS funcionando (dados isolados por empresa)
- [ ] Inputs validados e sanitizados

### 🟡 Médio
- [ ] Dependências atualizadas
- [ ] Headers de segurança presentes
- [ ] Rate limiting em APIs externas
- [ ] Certificados digitais validados corretamente

### 🟢 Baixo
- [ ] HTTPS enforced
- [ ] Session fixation prevenido
- [ ] CSRF protegido
- [ ] Clickjacking bloqueado
- [ ] Brute force protegido

---

## 🎯 SCORE DE SEGURANÇA

**Calcular pontuação:**

- Crítico OK = 20 pontos cada (máximo 100)
- Médio OK = 10 pontos cada (máximo 40)
- Baixo OK = 5 pontos cada (máximo 25)

**Total máximo:** 165 pontos

**Classificação:**
- 150-165: 🟢 **Excelente**
- 120-149: 🟡 **Bom** (melhorias necessárias)
- 80-119: 🟠 **Regular** (riscos moderados)
- 0-79: 🔴 **Crítico** (ação urgente)

---

## 🚀 AUTOMAÇÃO DE TESTES

### GitHub Actions Workflow

```yaml
# .github/workflows/security-tests.yml
name: Security Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Audit dependencies
        run: npm audit --audit-level=moderate
      
      - name: Build
        run: npm run build
      
      - name: Check for exposed secrets
        run: |
          grep -r "CLIENT_SECRET" dist/ && exit 1 || exit 0
          grep -r "alylochrlvgcvjdmkmum" dist/ && exit 1 || exit 0
      
      - name: OWASP ZAP Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'https://tech-cresci.vercel.app'
```

---

**Última atualização:** 09/02/2026  
**Próximo teste:** Após implementar correções
