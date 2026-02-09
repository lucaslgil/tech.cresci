# 🚀 INFORMAÇÕES NECESSÁRIAS PARA EMITIR A PRIMEIRA NOTA FISCAL

## ✅ PASSO A PASSO RÁPIDO

### 1️⃣ EXECUTAR SCRIPT NO BANCO DE DADOS

**Arquivo:** `database/ADICIONAR_CAMPOS_EMISSAO_NFE.sql`

**O que faz:**
- ✅ Adiciona campos de certificado digital
- ✅ Adiciona controle de ambiente (homologação/produção)
- ✅ Adiciona séries e numeração
- ✅ Adiciona CSC para NFC-e
- ✅ Adiciona chave de acesso e protocolo SEFAZ
- ✅ Cria funções automáticas de geração de chave
- ✅ Cria validações antes de emitir

**Como executar:**
1. Abrir Supabase SQL Editor
2. Copiar todo o conteúdo do arquivo
3. Colar e executar (Run)

---

## 📋 2️⃣ INFORMAÇÕES QUE VOCÊ PRECISA OBTER/CONFIGURAR

### 🔐 A) CERTIFICADO DIGITAL (OBRIGATÓRIO)

**O que é:** Arquivo .pfx (A1) ou Token (A3) que assina digitalmente as notas

**Onde obter:**
- Comprar em Autoridade Certificadora credenciada
- Empresas: Serasa, Certisign, Valid, Soluti
- Tipo: e-CNPJ A1 (arquivo) ou A3 (token/cartão)
- Validade: A1 = 1 ano | A3 = 3 anos
- Custo: R$ 150,00 a R$ 300,00

**Dados a configurar no sistema:**
```
✅ Tipo: A1 ou A3
✅ Arquivo .pfx: Fazer upload (se A1)
✅ Senha: [senha do certificado]
✅ Validade: dd/mm/aaaa
```

**⚠️ SEGURANÇA:** A senha DEVE ser criptografada no backend antes de salvar!

---

### 🎛️ B) AMBIENTE DE EMISSÃO (OBRIGATÓRIO)

**Campo a adicionar na tela de configuração:**

```
[ Configuração de Emissão de Notas Fiscais ]

Ambiente de Emissão:
  ( ) Homologação - Testes (padrão inicial) ⭐
  ( ) Produção - Notas válidas fiscalmente

⚠️ IMPORTANTE: 
- Em HOMOLOGAÇÃO, as notas são apenas para teste
- Não têm validade fiscal
- Use para testar todo o fluxo
- Mude para PRODUÇÃO apenas após testes completos
```

**Como implementar:**
1. Criar um toggle/radio button na tela de Configurações
2. Salvar valor em `empresas.ambiente_emissao`
3. Valor 2 = Homologação (padrão)
4. Valor 1 = Produção

**Exemplo de implementação:**
```typescript
// Estado do componente
const [ambienteEmissao, setAmbienteEmissao] = useState<1 | 2>(2); // 2=Homologação

// Salvar no banco
const salvarConfiguracao = async () => {
  await supabase
    .from('empresas')
    .update({ 
      ambiente_emissao: ambienteEmissao // 1=Produção, 2=Homologação
    })
    .eq('id', empresaId);
};

// Interface
<div className="space-y-2">
  <label className="block text-sm font-medium text-slate-700">
    Ambiente de Emissão
  </label>
  <div className="space-y-2">
    <label className="flex items-center">
      <input
        type="radio"
        checked={ambienteEmissao === 2}
        onChange={() => setAmbienteEmissao(2)}
        className="mr-2"
      />
      <span>Homologação (Testes)</span>
      <span className="ml-2 text-xs text-slate-500">
        ⭐ Padrão inicial - notas sem valor fiscal
      </span>
    </label>
    <label className="flex items-center">
      <input
        type="radio"
        checked={ambienteEmissao === 1}
        onChange={() => setAmbienteEmissao(1)}
        className="mr-2"
      />
      <span>Produção (Notas Válidas)</span>
      <span className="ml-2 text-xs text-orange-600">
        ⚠️ Apenas após testes completos
      </span>
    </label>
  </div>
</div>
```

---

### 🔢 C) SÉRIES E NUMERAÇÃO FISCAL

**Configuração inicial (já vem com padrão):**

```
Série NF-e: 1 (padrão)
Série NFC-e: 1 (padrão)
Próximo número NF-e: 1 (primeira nota)
Próximo número NFC-e: 1 (primeira nota)
```

**⚠️ ATENÇÃO AO MIGRAR PARA PRODUÇÃO:**
- Se já emitiu notas em outro sistema, consultar na SEFAZ o último número usado
- Configurar `ultimo_numero_nfe` com o último número emitido
- Sistema incrementa automaticamente a cada emissão

**Onde configurar:**
```sql
-- Exemplo: última nota emitida foi 150
UPDATE empresas 
SET ultimo_numero_nfe = 150 
WHERE id = 1;

-- Próxima nota será automaticamente 151
```

---

### 🔐 D) CSC - CÓDIGO DE SEGURANÇA (SOMENTE PARA NFC-e)

**O que é:** Código usado para gerar QR Code da NFC-e (Nota Fiscal ao Consumidor)

**Quando necessário:** SOMENTE se for emitir NFC-e

**Como obter:**
1. Acessar portal da SEFAZ do seu estado
2. Entrar com certificado digital
3. Ir em "NFC-e" > "Configurações" > "Gerar CSC"
4. Sistema fornece:
   - CSC: Código alfanumérico (ex: `A1B2C3D4E5F6...`)
   - ID Token: Geralmente é "1"

**Onde configurar no sistema:**
```
✅ CSC NFC-e: [código fornecido pela SEFAZ]
✅ ID Token CSC: 1 (padrão)
```

**⚠️ Se for emitir SOMENTE NF-e (produtos), não precisa de CSC.**

---

### 🌐 E) URLs DOS WEBSERVICES SEFAZ

**URLs variam por estado!**

**Exemplo para São Paulo:**

**HOMOLOGAÇÃO:**
```
NF-e Autorização: https://hom.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx
NF-e Consulta: https://hom.nfe.fazenda.sp.gov.br/ws/nfeconsulta4.asmx
NF-e Status: https://hom.nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx
NFC-e Autorização: https://hom.nfce.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx
```

**PRODUÇÃO:**
```
NF-e Autorização: https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx
NF-e Consulta: https://nfe.fazenda.sp.gov.br/ws/nfeconsulta4.asmx
NF-e Status: https://nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx
NFC-e Autorização: https://nfce.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx
```

**📚 Consultar URLs do seu estado:**
- [Portal Nacional NF-e - WebServices](http://www.nfe.fazenda.gov.br/portal/webServices.aspx)

---

## 🎯 3️⃣ CRIAR TELA DE CONFIGURAÇÃO FISCAL

### Estrutura da tela:

```
📁 src/features/fiscal/ConfiguracaoFiscal.tsx

┌─────────────────────────────────────────────────────┐
│  [≡ Menu] CONFIGURAÇÕES FISCAIS                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [Aba: Certificado Digital]                         │
│  [Aba: Ambiente de Emissão] ⭐                      │
│  [Aba: Séries e Numeração]                          │
│  [Aba: CSC NFC-e]                                   │
│  [Aba: Mensagens Fiscais]                           │
│                                                      │
│  ─────────────────────────────────────────          │
│                                                      │
│  ABA: CERTIFICADO DIGITAL                           │
│                                                      │
│  Tipo de Certificado:                               │
│    (*) A1 - Arquivo .pfx (1 ano)                    │
│    ( ) A3 - Token/Cartão (3 anos)                   │
│                                                      │
│  Arquivo do Certificado (.pfx):                     │
│    [Escolher arquivo...] certificado.pfx            │
│                                                      │
│  Senha do Certificado:                              │
│    [••••••••••]                                     │
│                                                      │
│  Validade:                                          │
│    [14/01/2027]                                     │
│    ✅ Válido por 365 dias                           │
│                                                      │
│  [Salvar Configuração]                              │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ABA: AMBIENTE DE EMISSÃO ⭐                        │
│                                                      │
│  Selecione onde as notas serão emitidas:            │
│                                                      │
│    (*) Homologação (Testes)                         │
│        ⭐ Padrão inicial                             │
│        Notas emitidas aqui são apenas para teste    │
│        Não têm valor fiscal                         │
│                                                      │
│    ( ) Produção (Notas Válidas)                     │
│        ⚠️ Apenas após testes completos              │
│        Notas emitidas aqui têm validade fiscal      │
│                                                      │
│  Ambiente atual: HOMOLOGAÇÃO                        │
│  Última alteração: 14/01/2026 10:30                 │
│                                                      │
│  [Salvar Configuração]                              │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ABA: SÉRIES E NUMERAÇÃO                            │
│                                                      │
│  NF-e (Nota Fiscal Eletrônica):                     │
│    Série: [1]                                       │
│    Último número emitido: [0]                       │
│    Próximo número: 1                                │
│                                                      │
│  NFC-e (Nota ao Consumidor):                        │
│    Série: [1]                                       │
│    Último número emitido: [0]                       │
│    Próximo número: 1                                │
│                                                      │
│  NFS-e (Nota de Serviço):                           │
│    Série: [1]                                       │
│    Último número emitido: [0]                       │
│    Próximo número: 1                                │
│                                                      │
│  ⚠️ ATENÇÃO: Ao migrar para produção, consulte      │
│     o último número usado na SEFAZ                  │
│                                                      │
│  [Salvar Configuração]                              │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ABA: CSC NFC-e                                     │
│                                                      │
│  ℹ️  Necessário apenas para emissão de NFC-e        │
│                                                      │
│  Como obter o CSC:                                  │
│  1. Acesse o portal da SEFAZ do seu estado          │
│  2. Entre com certificado digital                   │
│  3. Vá em NFC-e > Configurações > Gerar CSC         │
│  4. Copie o código gerado                           │
│                                                      │
│  Código de Segurança (CSC):                         │
│    [________________________________]               │
│                                                      │
│  ID Token CSC:                                      │
│    [1]                                              │
│                                                      │
│  Status: ❌ Não configurado                         │
│                                                      │
│  [Salvar Configuração]                              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🎬 4️⃣ ORDEM DE IMPLEMENTAÇÃO

### FASE 1: Preparação do Banco (15min)
```
✅ Executar script: database/ADICIONAR_CAMPOS_EMISSAO_NFE.sql
✅ Verificar se campos foram criados
✅ Testar função de geração de chave de acesso
```

### FASE 2: Obter Certificado Digital (1-3 dias)
```
✅ Comprar certificado e-CNPJ A1 em AC credenciada
✅ Baixar arquivo .pfx
✅ Anotar senha
✅ Anotar data de validade
```

### FASE 3: Criar Tela de Configuração (4-6 horas)
```
✅ Criar componente ConfiguracaoFiscal.tsx
✅ Implementar upload de certificado
✅ Implementar toggle Homologação/Produção ⭐
✅ Implementar configuração de séries
✅ Implementar configuração de CSC (se for usar NFC-e)
✅ Salvar tudo na tabela empresas
```

### FASE 4: Integrar Biblioteca de Emissão (2-5 dias)

**OPÇÃO A: API de Terceiros (RECOMENDADO - 1-2 dias)**
```
Serviços recomendados:
- Focusnfe.com.br
- NFe.io
- PlugNotas

Vantagens:
✅ Rápido de implementar
✅ Não lida com XML manualmente
✅ Suporte técnico
✅ Atualizações automáticas

Custo: R$ 0,25 a R$ 1,00 por nota
```

**OPÇÃO B: Biblioteca Open Source (3-5 dias)**
```
Bibliotecas:
- node-nfe (Node.js)
- python-nfe (Python)

Vantagens:
✅ Gratuito
✅ Controle total

Desvantagens:
❌ Mais complexo
❌ Precisa assinar XML manualmente
❌ Manutenção por sua conta
```

### FASE 5: Testar em Homologação (2-3 dias)
```
✅ Configurar ambiente = HOMOLOGAÇÃO
✅ Emitir 10-20 notas de teste
✅ Validar cálculos tributários
✅ Conferir XML gerado
✅ Testar consulta de status
✅ Testar cancelamento
✅ Corrigir erros encontrados
```

### FASE 6: Ir para Produção (1 dia)
```
✅ Consultar último número na SEFAZ
✅ Configurar numeração inicial
✅ Alterar ambiente para PRODUÇÃO
✅ Emitir primeira nota real
✅ Validar DANFE
✅ Monitorar por 30 dias
```

---

## 📊 5️⃣ CHECKLIST ANTES DE EMITIR EM PRODUÇÃO

```
DADOS DO EMITENTE:
[ ] CNPJ válido e ativo na Receita Federal
[ ] Inscrição Estadual válida e ativa na SEFAZ
[ ] Regime tributário definido (Simples/Presumido/Real)
[ ] Endereço completo e correto
[ ] Código IBGE do município (7 dígitos)

CERTIFICADO DIGITAL:
[ ] Certificado e-CNPJ A1 ou A3 adquirido
[ ] Certificado instalado/configurado no sistema
[ ] Senha do certificado anotada
[ ] Validade do certificado ≥ 30 dias

PRODUTOS:
[ ] Todos os produtos têm NCM (8 dígitos)
[ ] CFOP configurado para cada operação
[ ] Unidade de medida definida
[ ] Valor unitário > 0
[ ] Categoria fiscal definida

REGRAS FISCAIS:
[ ] Pelo menos uma regra de tributação padrão criada
[ ] CST/CSOSN configurados conforme regime
[ ] Alíquotas de ICMS/PIS/COFINS/IPI configuradas
[ ] Alíquotas de IBS/CBS configuradas (Reforma 2026)
[ ] Mensagens fiscais padrão cadastradas

TESTES:
[ ] 10+ notas emitidas com sucesso em HOMOLOGAÇÃO
[ ] Cálculos tributários conferidos
[ ] DANFE gerado corretamente
[ ] Consulta de status funcionando
[ ] Cancelamento testado

PRODUÇÃO:
[ ] Último número consultado na SEFAZ
[ ] Numeração inicial configurada
[ ] Ambiente alterado para PRODUÇÃO
[ ] Backup do banco de dados feito
[ ] Equipe treinada para emissão
```

---

## 🎯 RESUMO: 5 INFORMAÇÕES CRÍTICAS

### 1. Certificado Digital 🔐
```
Tipo: e-CNPJ A1 (.pfx)
Comprar em: Serasa, Certisign, Valid
Custo: R$ 150-300
Validade: 1 ano
```

### 2. Ambiente de Emissão ⭐ OBRIGATÓRIO
```
Campo no sistema: empresas.ambiente_emissao
Valor padrão: 2 (Homologação)
Produção: 1 (Apenas após testes)

Criar toggle na tela de configuração!
```

### 3. Séries e Numeração 🔢
```
Série NF-e: 1 (padrão)
Série NFC-e: 1 (padrão)
Número inicial: 1 (primeira nota)

⚠️ Consultar SEFAZ ao migrar de outro sistema
```

### 4. CSC - NFC-e 🔐
```
Necessário: Apenas para NFC-e
Obter em: Portal da SEFAZ do seu estado
Exemplo: A1B2C3D4E5F6G7H8I9J0...
ID Token: 1 (padrão)
```

### 5. URLs SEFAZ 🌐
```
Variam por estado!
Consultar: http://www.nfe.fazenda.gov.br/portal/webServices.aspx

Sempre começar com URLs de HOMOLOGAÇÃO
```

---

## 📞 SUPORTE

**Documentação Oficial:**
- Portal NF-e: http://www.nfe.fazenda.gov.br
- Manual de Integração: http://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=/fOGw5fZWGk=
- Schemas XML: http://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=BMPFMBoln3w=

**SEFAZ São Paulo:**
- Portal: https://www.fazenda.sp.gov.br/nfe/
- Telefone: (11) 2930-3750

---

## ✅ PRÓXIMOS PASSOS IMEDIATOS

```
1. [ ] Executar script no Supabase (15min)
2. [ ] Comprar certificado digital (1-3 dias)
3. [ ] Criar tela de configuração com toggle de ambiente (4-6 horas)
4. [ ] Decidir: API terceiros ou biblioteca própria (1-5 dias)
5. [ ] Testar em homologação (2-3 dias)
6. [ ] Ir para produção (1 dia)
```

**TEMPO TOTAL ESTIMADO: 7-14 dias**

---

**✅ TUDO PRONTO PARA COMEÇAR!**
