# 📋 PLANO DE AÇÃO: Implementação Completa de Emissão de NF-e

## Status Atual ✅
- ✅ Estrutura de banco de dados completa (notas_fiscais, notas_fiscais_itens, eventos)
- ✅ Interface de emissão avulsa (/notas-fiscais/emitir) 
- ✅ Service notasFiscaisService com fluxo básico
- ✅ Motor fiscal (fiscalEngine) para aplicar regras tributárias
- ✅ Cadastros auxiliares: Empresas, Clientes, Produtos, NCM, CFOP, Operações Fiscais
- ✅ Regras de Tributação funcionando
- ✅ Integração com módulo de Vendas (passa venda para emissão)

## O Que Falta Implementar 🔧

### 1. COMPLETAR DADOS DA EMPRESA EMISSORA (Unidade Emissora)
**Onde:** EmitirNotaFiscal.tsx
**O que fazer:**
- [ ] Adicionar seletor de "Unidade Emissora" na Etapa 1
- [ ] Buscar empresas cadastradas com `emite_nfe = true`
- [ ] Preencher automaticamente:
  - CNPJ, IE, Regime Tributário, CRT
  - Endereço completo (logradouro, número, bairro, município, UF, CEP)
  - Dados do certificado digital
  - Série e último número da NF-e

**Campos necessários da empresa:**
```typescript
- cnpj, razao_social, nome_fantasia
- inscricao_estadual, inscricao_municipal
- regime_tributario, crt
- endereco, numero, bairro, cidade, estado, cep
- telefone, email
- certificado_digital_id, ambiente_nfe, serie_nfe, ultimo_numero_nfe
```

### 2. INTEGRAÇÃO COM VENDAS
**Onde:** EmitirNotaFiscal.tsx (receber state da navegação)
**O que fazer:**
- [ ] Detectar quando vem de uma venda (useLocation state)
- [ ] Pre-preencher automaticamente:
  - **Destinatário:** Dados do cliente da venda
  - **Produtos:** Itens da venda com NCM, CFOP, valores
  - **Pagamento:** Forma e valores da venda
  - **Unidade Emissora:** Empresa da venda
- [ ] Aplicar regras tributárias automaticamente nos itens

**Estrutura esperada:**
```typescript
interface VendaParaNFe {
  empresa_id: number
  cliente: { cpf_cnpj, nome, endereco, cidade, uf, cep, email, telefone }
  itens: { produto, quantidade, valor_unitario, desconto, ncm, cfop }
  forma_pagamento, meio_pagamento, valor_total
}
```

### 3. APLICAR MOTOR FISCAL AOS ITENS
**Onde:** fiscalEngine.ts + EmitirNotaFiscal.tsx
**O que fazer:**
- [ ] Ao adicionar um item, buscar regra tributária aplicável:
  ```typescript
  const regra = await buscarRegraTributaria({
    empresa_id,
    ncm: item.ncm,
    cfop: item.cfop,
    tipo_contribuinte: destinatario.ie ? 'CONTRIBUINTE' : 'NAO_CONTRIBUINTE'
  })
  ```
- [ ] Calcular impostos automaticamente:
  - ICMS (CST, alíquota, base de cálculo, valor)
  - ICMS ST (CST ST, MVA, alíquota, base, valor)
  - PIS (CST, alíquota, valor)
  - COFINS (CST, alíquota, valor)
  - IPI (CST, alíquota, valor)
  - IBS e CBS (Reforma Tributária 2026)
- [ ] Preencher campos tributários do item:
  ```typescript
  {
    cst_icms, aliquota_icms, bc_icms, valor_icms,
    cst_pis, aliquota_pis, valor_pis,
    cst_cofins, aliquota_cofins, valor_cofins,
    cst_ipi, aliquota_ipi, valor_ipi,
    aliquota_ibs, valor_ibs,
    aliquota_cbs, valor_cbs
  }
  ```

### 4. VALIDAÇÕES PRÉ-EMISSÃO
**Onde:** notasFiscaisService.ts (função validarNotaFiscal)
**Validar:**
- [ ] Empresa emissora configurada (certificado, série, ambiente)
- [ ] CNPJ/CPF destinatário válido (cálculo de dígito verificador)
- [ ] Inscrição Estadual válida (quando informada)
- [ ] Todos os itens têm NCM, CFOP, valores
- [ ] Totais consistentes (soma itens = total nota)
- [ ] Impostos calculados em todos os itens
- [ ] Chave de acesso gerada corretamente (44 dígitos)

### 5. GERAÇÃO DE XML COMPLETO
**Onde:** notasFiscaisService.ts (função gerarXMLNFe)
**Implementar estrutura completa conforme layout 4.0:**
```xml
<NFe>
  <infNFe>
    <ide> <!-- Identificação --> </ide>
    <emit> <!-- Emitente --> </emit>
    <dest> <!-- Destinatário --> </dest>
    <det nItem="1"> <!-- Produtos -->
      <prod> <!-- Dados do produto --> </prod>
      <imposto> <!-- ICMS, PIS, COFINS, IPI --> </imposto>
    </det>
    <total> <!-- Totais --> </total>
    <transp> <!-- Transporte --> </transp>
    <pag> <!-- Pagamento --> </pag>
    <infAdic> <!-- Informações Adicionais --> </infAdic>
  </infNFe>
</NFe>
```

### 6. ASSINATURA DIGITAL
**Onde:** Criar arquivo assinaturaDigital.ts
**Implementar:**
- [ ] Carregar certificado digital (A1 em base64 ou A3 via token)
- [ ] Assinar tag `<infNFe>` com XMLDSig
- [ ] Validar assinatura antes de enviar

**Opções de implementação:**
- **Backend Node.js:** Biblioteca `node-forge` ou `xmldsigjs`
- **Edge Function Supabase:** Assinar no servidor
- **Serviço externo:** API de assinatura (mais seguro)

### 7. INTEGRAÇÃO COM SEFAZ
**Onde:** Criar arquivo sefazIntegration.ts
**Implementar webservices:**
- [ ] **NFeAutorizacao4:** Enviar lote de NF-e para autorização
- [ ] **NFeRetAutorizacao4:** Consultar resultado do processamento
- [ ] **NFeConsultaProtocolo4:** Consultar NF-e autorizada
- [ ] **NFeInutilizacao4:** Inutilizar numeração
- [ ] **NFeEventoCancelamento:** Cancelar NF-e
- [ ] **NFeEventoCCe:** Carta de Correção Eletrônica

**URLs por ambiente:**
- **Homologação:** https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx
- **Produção:** https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx

### 8. GERAÇÃO DE DANFE (PDF)
**Onde:** Criar arquivo danfeGenerator.ts
**Implementar:**
- [ ] Gerar PDF a partir do XML autorizado
- [ ] QR Code (para NFC-e)
- [ ] Código de barras da chave de acesso
- [ ] Layout padrão DANFE retrato/paisagem

**Bibliotecas sugeridas:**
- `pdfkit` ou `jspdf` para geração de PDF
- `qrcode` para QR Code
- `jsbarcode` para código de barras

### 9. FLUXO COMPLETO DE EMISSÃO
```typescript
// 1. Preencher formulário (manual ou a partir de venda)
// 2. Aplicar motor fiscal aos itens
// 3. Salvar rascunho
const nota = await notasFiscaisService.criarRascunho(formData)

// 4. Emitir
const resultado = await notasFiscaisService.emitir(nota.id)
// → Gera chave de acesso
// → Gera XML
// → Assina digitalmente
// → Envia para SEFAZ
// → Processa retorno
// → Gera DANFE

// 5. Resultado
if (resultado.sucesso) {
  // Nota autorizada
  // Protocolo: resultado.protocolo
  // Chave: resultado.chave_acesso
  // XML: resultado.xml_autorizado
  // DANFE: resultado.danfe_pdf
} else {
  // Nota rejeitada
  // Código: resultado.codigo
  // Mensagem: resultado.mensagem
}
```

### 10. CONTINGÊNCIA
**Implementar modos de contingência:**
- [ ] SVC-AN (Sefaz Virtual de Contingência Ambiente Nacional)
- [ ] SVC-RS (Sefaz Virtual de Contingência Rio Grande do Sul)
- [ ] FS-DA (Formulário de Segurança para Impressão de Documento Auxiliar)
- [ ] Offline (impressão em contingência)

---

## 🎯 Próximos Passos Imediatos

### FASE 1: Estruturar Formulário Completo
1. Adicionar seletor de Unidade Emissora
2. Pré-preencher dados quando vem de venda
3. Aplicar motor fiscal nos itens automaticamente

### FASE 2: Validações e XML
1. Implementar validações completas
2. Gerar XML conforme layout 4.0
3. Implementar cálculos de totais

### FASE 3: Assinatura e SEFAZ
1. Implementar assinatura digital
2. Integrar webservices SEFAZ
3. Processar retornos

### FASE 4: DANFE e Finalização
1. Gerar DANFE em PDF
2. Enviar email para cliente
3. Armazenar XMLs no storage

---

## 📚 Documentação Necessária
- [x] Layout NF-e 4.0: https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=tW+YMyk/50s=
- [ ] Manual de Integração: Webservices SEFAZ
- [ ] Códigos de Situação Tributária (CST)
- [ ] Tabela de NCM
- [ ] Tabela de CFOP

---

## 🔍 Próxima Ação Sugerida
Vou começar implementando a **FASE 1** - estruturar o formulário com:
1. Seletor de Unidade Emissora
2. Pré-preenchimento automático a partir de venda
3. Aplicação automática do motor fiscal

**Posso começar?** Ou prefere que eu foque em outra parte primeiro?
