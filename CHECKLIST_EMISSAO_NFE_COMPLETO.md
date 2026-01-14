# ✅ CHECKLIST COMPLETO PARA EMISSÃO DE NOTAS FISCAIS ELETRÔNICAS

## 📋 ESTRUTURA ATUAL DO SISTEMA

Revisão completa dos campos e tabelas já criados para emissão de NF-e/NFC-e/NFS-e.

---

## 🏗️ TABELAS E CAMPOS EXISTENTES

### ✅ 1. EMPRESAS (Emitente)
**Status:** Estrutura completa

**Campos disponíveis:**
```sql
✅ id
✅ codigo                        -- Código interno da empresa
✅ razao_social                  -- Razão social oficial
✅ nome_fantasia                 -- Nome fantasia
✅ cnpj                          -- CNPJ formatado
✅ inscricao_estadual            -- IE
✅ inscricao_municipal           -- IM (para NFS-e)
✅ regime_tributario             -- SIMPLES, PRESUMIDO, REAL
✅ codigo_regime_tributario      -- 1=Simples, 2=Simples excesso, 3=Normal
✅ indicador_ie                  -- 1=Contribuinte, 2=Isento, 9=Não Contribuinte
✅ cnae                          -- CNAE Principal
✅ email                         -- Email da empresa
✅ telefone                      -- Telefone
✅ cep                           -- CEP
✅ endereco                      -- Logradouro
✅ numero                        -- Número
✅ bairro                        -- Bairro
✅ complemento                   -- Complemento
✅ cidade                        -- Cidade
✅ estado / uf                   -- UF
✅ codigo_municipio              -- Código IBGE do município
```

**❌ FALTA ADICIONAR:**
```sql
❌ certificado_digital_path      -- Caminho do certificado A1
❌ certificado_digital_senha     -- Senha do certificado (criptografada)
❌ certificado_validade          -- Data de validade do certificado
❌ ambiente_emissao              -- 1=Produção, 2=Homologação ⭐ OBRIGATÓRIO
❌ serie_nfe                     -- Série padrão NF-e (ex: 1)
❌ serie_nfce                    -- Série padrão NFC-e (ex: 1)
❌ serie_nfse                    -- Série padrão NFS-e (ex: 1)
❌ ultimo_numero_nfe             -- Último número emitido NF-e
❌ ultimo_numero_nfce            -- Último número emitido NFC-e
❌ ultimo_numero_nfse            -- Último número emitido NFS-e
❌ csc_nfce                      -- Código de Segurança do Contribuinte (NFC-e)
❌ id_token_csc_nfce            -- ID do Token CSC (NFC-e)
```

---

### ✅ 2. PRODUTOS
**Status:** Estrutura completa com IBS/CBS

**Campos disponíveis:**
```sql
✅ id
✅ codigo                        -- Código interno do produto
✅ descricao                     -- Descrição completa
✅ ncm                           -- NCM obrigatório (8 dígitos)
✅ cest                          -- CEST (quando aplicável ICMS-ST)
✅ unidade                       -- Unidade de medida (UN, KG, PC, etc.)
✅ valor_unitario                -- Valor unitário
✅ tipo_produto                  -- MERCADORIA ou SERVICO
✅ ativo                         -- Status do produto

-- Campos Tributários (Sistema Antigo)
✅ origem_mercadoria             -- 0=Nacional, 1=Estrangeira, etc.
✅ aliquota_icms                 -- Alíquota ICMS
✅ aliquota_ipi                  -- Alíquota IPI
✅ aliquota_pis                  -- Alíquota PIS
✅ aliquota_cofins               -- Alíquota COFINS

-- Campos Reforma Tributária 2026
✅ aliquota_ibs                  -- Alíquota IBS (27% padrão)
✅ aliquota_cbs                  -- Alíquota CBS (12% padrão)
✅ aliquota_ibs_reduzida         -- IBS reduzido (cesta básica, medicamentos)
✅ aliquota_cbs_reduzida         -- CBS reduzido
✅ regime_transicao              -- MISTO, ANTIGO, NOVO
✅ excecao_ibs                   -- Regime especial IBS
✅ excecao_cbs                   -- Regime especial CBS
✅ cst_ibs                       -- CST IBS
✅ cst_cbs                       -- CST CBS
```

---

### ✅ 3. NCM (Nomenclatura Comum do Mercosul)
**Status:** Estrutura completa

```sql
✅ id
✅ codigo                        -- NCM 8 dígitos
✅ descricao                     -- Descrição do NCM
✅ unidade_tributaria            -- Unidade tributária
✅ aliquota_nacional_federal     -- Alíquota federal
✅ cest                          -- CEST vinculado
✅ ativo                         -- Status
```

---

### ✅ 4. REGRAS DE TRIBUTAÇÃO
**Status:** Estrutura completa e inteligente

**Campos disponíveis:**
```sql
✅ id
✅ empresa_id                    -- Empresa vinculada
✅ nome                          -- Nome da regra
✅ tipo_documento                -- NFE, NFCE, NFSE
✅ ncm                           -- NCM específico (opcional)
✅ cest                          -- CEST específico (opcional)
✅ cfop_saida / cfop_entrada     -- CFOP (opcional)
✅ uf_origem                     -- UF origem (opcional)
✅ uf_destino                    -- UF destino (opcional)
✅ operacao_fiscal               -- Tipo de operação (opcional)
✅ categoria                     -- Categoria do produto (opcional)
✅ prioridade                    -- Calculada automaticamente ⭐

-- Tributação Sistema Antigo
✅ aliquota_icms
✅ cst_icms / csosn_icms
✅ aliquota_ipi
✅ cst_ipi
✅ aliquota_pis
✅ cst_pis
✅ aliquota_cofins
✅ cst_cofins

-- Tributação Sistema Novo (IBS/CBS)
✅ aliquota_ibs
✅ aliquota_cbs
✅ cst_ibs
✅ cst_cbs
✅ base_calculo_ibs_diferenciada
✅ base_calculo_cbs_diferenciada
✅ reducao_base_ibs
✅ reducao_base_cbs
✅ percentual_diferimento_ibs
✅ percentual_diferimento_cbs
✅ ano_vigencia

-- ISS (NFS-e)
✅ aliquota_iss
✅ retencao_iss
✅ municipio_incidencia_iss
✅ codigo_servico_municipal
✅ item_lista_servico_lc116      -- Item da LC 116/2003
✅ codigo_tributacao_municipio_iss
✅ mensagem_nf_iss
✅ exigibilidade_iss
✅ processo_suspensao_iss
```

**⭐ DESTAQUE:** Sistema com priorização automática de regras!
- Busca automática da regra mais específica
- Prioridade calculada por: NCM + CFOP + UF + Tipo Documento

---

### ✅ 5. REFORMA TRIBUTÁRIA 2026 (IBS/CBS)

#### 5.1. Tabela: reforma_aliquotas_ncm
```sql
✅ ncm                           -- NCM com alíquota diferenciada
✅ descricao_ncm
✅ aliquota_ibs_padrao          -- 27% padrão
✅ aliquota_cbs_padrao          -- 12% padrão
✅ aliquota_ibs_reduzida        -- Redução (ex: 0% cesta básica)
✅ aliquota_cbs_reduzida        -- Redução
✅ tem_aliquota_diferenciada
✅ tipo_beneficio               -- CESTA_BASICA, MEDICAMENTO, etc.
✅ motivo_diferenciacao
✅ data_inicio / data_fim
```

#### 5.2. Tabela: reforma_cronograma_transicao
```sql
✅ ano                           -- 2026-2033
✅ percentual_icms               -- % Sistema Antigo
✅ percentual_iss
✅ percentual_pis
✅ percentual_cofins
✅ percentual_ibs                -- % Sistema Novo
✅ percentual_cbs
✅ fase                          -- TESTE, TRANSICAO, COMPLETA
```

**Exemplo 2026:** ICMS 100% + IBS 1% (teste em paralelo)
**Exemplo 2033:** ICMS 0% + IBS 100% (transição completa)

---

### ✅ 6. NOTAS FISCAIS (Cabeçalho)

**Campos já existentes:**
```sql
✅ id
✅ empresa_id                    -- Emitente
✅ tipo                          -- NFE, NFCE, NFSE
✅ serie
✅ numero
✅ data_emissao
✅ cliente_id                    -- Destinatário (se houver)
✅ venda_id                      -- Venda vinculada (se aplicável)

-- Valores
✅ valor_produtos
✅ valor_desconto
✅ valor_frete
✅ valor_seguro
✅ valor_outras_despesas
✅ valor_total

-- Tributação Sistema Antigo
✅ valor_icms
✅ valor_ipi
✅ valor_pis
✅ valor_cofins

-- Tributação Sistema Novo (IBS/CBS)
✅ valor_ibs
✅ valor_cbs
✅ base_calculo_ibs
✅ base_calculo_cbs
✅ regime_tributario_nota        -- ANTIGO, NOVO, TRANSICAO
✅ ano_competencia               -- Ano fiscal (ex: 2026)

-- Status
✅ status                        -- RASCUNHO, AUTORIZADA, CANCELADA, REJEITADA
```

**❌ FALTA ADICIONAR:**
```sql
❌ chave_acesso                  -- Chave de 44 dígitos ⭐ OBRIGATÓRIO
❌ protocolo_autorizacao         -- Protocolo SEFAZ
❌ data_autorizacao              -- Data/hora autorização
❌ modelo                        -- 55=NF-e, 65=NFC-e, SE=NFS-e
❌ ambiente                      -- 1=Produção, 2=Homologação
❌ xml_enviado                   -- XML enviado para SEFAZ
❌ xml_retorno                   -- XML retornado pela SEFAZ
❌ motivo_rejeicao               -- Motivo em caso de rejeição
❌ qrcode_url                    -- QR Code (NFC-e)
❌ danfe_pdf                     -- DANFE em PDF (opcional)
```

---

### ✅ 7. NOTAS FISCAIS ITENS

**Campos já existentes:**
```sql
✅ id
✅ nota_fiscal_id
✅ produto_id
✅ codigo_produto
✅ descricao
✅ ncm
✅ cest
✅ cfop
✅ unidade
✅ quantidade
✅ valor_unitario
✅ valor_total

-- Tributação Sistema Antigo
✅ cst_icms / csosn_icms
✅ aliquota_icms
✅ valor_icms
✅ base_calculo_icms
✅ aliquota_ipi
✅ valor_ipi
✅ aliquota_pis
✅ valor_pis
✅ aliquota_cofins
✅ valor_cofins

-- Tributação Sistema Novo (IBS/CBS)
✅ cst_ibs
✅ aliquota_ibs
✅ valor_ibs
✅ base_calculo_ibs
✅ cst_cbs
✅ aliquota_cbs
✅ valor_cbs
✅ base_calculo_cbs
✅ credito_ibs                   -- Crédito não-cumulativo
✅ credito_cbs                   -- Crédito não-cumulativo
✅ diferimento_ibs
✅ diferimento_cbs
```

---

### ✅ 8. FUNÇÕES SQL CRIADAS

**Sistema de cálculo automático:**
```sql
✅ calcular_impostos_reforma()         -- Calcula IBS/CBS conforme ano
✅ buscar_aliquotas_reforma()          -- Busca alíquota por NCM
✅ buscar_regra_tributacao()           -- Busca regra mais específica
✅ calcular_prioridade_regra()         -- Calcula prioridade da regra
✅ validar_nota_fiscal()               -- Valida antes de emitir
```

---

### ✅ 9. CLIENTES (Destinatário)

**Estrutura presumida (verificar se já existe):**
```sql
✅ id
✅ codigo
✅ razao_social / nome
✅ nome_fantasia
✅ cpf_cnpj
✅ tipo_pessoa                   -- F=Física, J=Jurídica
✅ inscricao_estadual
✅ indicador_ie                  -- 1=Contribuinte, 2=Isento, 9=Não Contribuinte
✅ email
✅ telefone
✅ cep
✅ endereco
✅ numero
✅ bairro
✅ complemento
✅ cidade
✅ estado
✅ codigo_municipio
```

---

## 🔴 CAMPOS CRÍTICOS FALTANTES PARA EMISSÃO

### 1. CERTIFICADO DIGITAL (Tabela: empresas)
```sql
ALTER TABLE empresas ADD COLUMN certificado_digital_path TEXT;
ALTER TABLE empresas ADD COLUMN certificado_digital_senha TEXT; -- Criptografar!
ALTER TABLE empresas ADD COLUMN certificado_validade DATE;
ALTER TABLE empresas ADD COLUMN tipo_certificado VARCHAR(2) DEFAULT 'A1'; -- A1 ou A3
```

### 2. AMBIENTE DE EMISSÃO ⭐ OBRIGATÓRIO (Tabela: empresas)
```sql
ALTER TABLE empresas ADD COLUMN ambiente_emissao INTEGER DEFAULT 2; 
-- 1=Produção
-- 2=Homologação ⭐ COMEÇAR SEMPRE EM HOMOLOGAÇÃO

COMMENT ON COLUMN empresas.ambiente_emissao IS '1=Produção, 2=Homologação. Controla onde as notas serão emitidas';
```

### 3. SÉRIES E NUMERAÇÃO (Tabela: empresas)
```sql
ALTER TABLE empresas ADD COLUMN serie_nfe INTEGER DEFAULT 1;
ALTER TABLE empresas ADD COLUMN serie_nfce INTEGER DEFAULT 1;
ALTER TABLE empresas ADD COLUMN serie_nfse INTEGER DEFAULT 1;
ALTER TABLE empresas ADD COLUMN ultimo_numero_nfe BIGINT DEFAULT 0;
ALTER TABLE empresas ADD COLUMN ultimo_numero_nfce BIGINT DEFAULT 0;
ALTER TABLE empresas ADD COLUMN ultimo_numero_nfse BIGINT DEFAULT 0;
```

### 4. CSC - NFC-e (Tabela: empresas)
```sql
ALTER TABLE empresas ADD COLUMN csc_nfce VARCHAR(255);
ALTER TABLE empresas ADD COLUMN id_token_csc_nfce INTEGER DEFAULT 1;

COMMENT ON COLUMN empresas.csc_nfce IS 'Código de Segurança do Contribuinte (obrigatório para NFC-e)';
COMMENT ON COLUMN empresas.id_token_csc_nfce IS 'ID do Token CSC (geralmente 1)';
```

### 5. CHAVE DE ACESSO (Tabela: notas_fiscais)
```sql
ALTER TABLE notas_fiscais ADD COLUMN chave_acesso VARCHAR(44) UNIQUE;
ALTER TABLE notas_fiscais ADD COLUMN modelo VARCHAR(2); -- 55=NF-e, 65=NFC-e
ALTER TABLE notas_fiscais ADD COLUMN ambiente INTEGER; -- 1=Prod, 2=Homolog
ALTER TABLE notas_fiscais ADD COLUMN protocolo_autorizacao VARCHAR(50);
ALTER TABLE notas_fiscais ADD COLUMN data_autorizacao TIMESTAMP;
ALTER TABLE notas_fiscais ADD COLUMN xml_enviado TEXT;
ALTER TABLE notas_fiscais ADD COLUMN xml_retorno TEXT;
ALTER TABLE notas_fiscais ADD COLUMN motivo_rejeicao TEXT;
ALTER TABLE notas_fiscais ADD COLUMN qrcode_url TEXT; -- Para NFC-e
ALTER TABLE notas_fiscais ADD COLUMN danfe_pdf BYTEA; -- DANFE em PDF

CREATE INDEX idx_notas_chave_acesso ON notas_fiscais(chave_acesso);
```

---

## 📝 INFORMAÇÕES NECESSÁRIAS PARA CONFIGURAR NO SISTEMA

### 📌 1. DADOS DO CERTIFICADO DIGITAL
**Obrigatório para emissão:**
```
✅ Tipo de Certificado: A1 (arquivo .pfx) ou A3 (token/cartão)
✅ Arquivo do Certificado: Fazer upload do .pfx
✅ Senha do Certificado: [CRIPTOGRAFAR NO BACKEND]
✅ Data de Validade: dd/mm/aaaa
```

**⚠️ SEGURANÇA:**
- NUNCA armazenar senha em texto puro
- Criptografar com AES-256 antes de salvar
- Alertar usuário quando certificado estiver próximo do vencimento

---

### 📌 2. CONFIGURAÇÃO DE AMBIENTE ⭐

**Criar tela de configuração:**
```
[ ] Ambiente de Emissão:
    ( ) Homologação (Testes)  ⭐ PADRÃO INICIAL
    ( ) Produção (Real)

Observação: Em homologação, as notas são apenas para teste.
Não têm validade fiscal. Mude para produção apenas quando 
todos os testes estiverem OK.
```

**Implementar toggle simples:**
- Salvar em `empresas.ambiente_emissao`
- 2 = Homologação (padrão)
- 1 = Produção (após testes)

---

### 📌 3. SÉRIES E NUMERAÇÃO FISCAL

**Configuração inicial:**
```
✅ Série NF-e: 1 (padrão)
✅ Série NFC-e: 1 (padrão)
✅ Próximo número NF-e: 1 (primeira nota)
✅ Próximo número NFC-e: 1 (primeira nota)

⚠️ IMPORTANTE: Consultar último número usado na SEFAZ
antes de começar a emitir em produção!
```

---

### 📌 4. CSC - NFC-e (Código de Segurança)

**Somente para NFC-e:**
```
✅ CSC: Obter na SEFAZ do seu estado
✅ ID Token CSC: Geralmente 1

Como obter:
1. Acessar portal da SEFAZ do seu estado
2. Entrar com certificado digital
3. Solicitar geração do CSC
4. Copiar código e ID Token
```

---

### 📌 5. CONFIGURAÇÃO DA SEFAZ (Endpoints)

**URLs por ambiente:**

**Homologação:**
```
WebService NF-e: https://hom.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx
WebService NFC-e: https://hom.nfce.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx
WebService Consulta: https://hom.nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx
```

**Produção:**
```
WebService NF-e: https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx
WebService NFC-e: https://nfce.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx
WebService Consulta: https://nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx
```

**⚠️ OBS:** URLs variam por estado! Verificar documentação da SEFAZ.

---

## 🔄 FLUXO DE EMISSÃO DE NF-e

### FASE 1: PRÉ-EMISSÃO (Validações)
```
1. ✅ Verificar certificado digital válido
2. ✅ Validar dados do emitente completos
3. ✅ Validar dados do destinatário (se houver)
4. ✅ Validar itens da nota:
   - NCM obrigatório (8 dígitos)
   - CFOP válido
   - Unidade preenchida
   - Valor unitário > 0
   - Quantidade > 0
5. ✅ Buscar regras de tributação por item
6. ✅ Calcular impostos (antigo + novo conforme ano)
7. ✅ Validar totalizadores
8. ✅ Executar função validar_nota_fiscal()
```

### FASE 2: GERAÇÃO DA CHAVE DE ACESSO
```
Formato: cUF + AAMM + CNPJ + mod + serie + nNF + tpEmis + cNF + cDV

Exemplo:
35        -- UF São Paulo
2601      -- Janeiro de 2026
27767670000194  -- CNPJ
55        -- Modelo NF-e
001       -- Série
000000001 -- Número
1         -- Tipo emissão (normal)
12345678  -- Código numérico aleatório
9         -- Dígito verificador

Chave: 35260127767670000194550010000000011123456789
```

### FASE 3: GERAÇÃO DO XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe{chave_acesso}" versao="4.00">
      <!-- IDENTIFICAÇÃO DA NOTA -->
      <ide>
        <cUF>35</cUF>
        <cNF>12345678</cNF>
        <natOp>Venda de mercadoria</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>1</nNF>
        <dhEmi>2026-01-14T10:30:00-03:00</dhEmi>
        <tpNF>1</tpNF> <!-- 0=Entrada, 1=Saída -->
        <idDest>1</idDest> <!-- 1=Interna, 2=Interestadual, 3=Exterior -->
        <cMunFG>3549904</cMunFG> <!-- Código IBGE município -->
        <tpImp>1</tpImp> <!-- Formato DANFE -->
        <tpEmis>1</tpEmis> <!-- Tipo emissão -->
        <cDV>9</cDV>
        <tpAmb>2</tpAmb> <!-- 1=Produção, 2=Homologação -->
        <finNFe>1</finNFe> <!-- Finalidade -->
        <indFinal>1</indFinal> <!-- 0=Normal, 1=Consumidor final -->
        <indPres>1</indPres> <!-- Presença do comprador -->
        <procEmi>0</procEmi>
        <verProc>1.0</verProc>
      </ide>
      
      <!-- EMITENTE -->
      <emit>
        <CNPJ>27767670000194</CNPJ>
        <xNome>CRESCI E PERDI FRANCHISING LTDA</xNome>
        <xFant>Cresci e Perdi</xFant>
        <enderEmit>
          <xLgr>Rua das Flores</xLgr>
          <nro>123</nro>
          <xBairro>Centro</xBairro>
          <cMun>3549904</cMun>
          <xMun>São José do Rio Pardo</xMun>
          <UF>SP</UF>
          <CEP>13720000</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
          <fone>1936081234</fone>
        </enderEmit>
        <IE>123456789</IE>
        <CRT>1</CRT> <!-- 1=Simples Nacional -->
      </emit>
      
      <!-- DESTINATÁRIO -->
      <dest>
        <CNPJ>12345678000190</CNPJ>
        <xNome>CLIENTE EXEMPLO LTDA</xNome>
        <enderDest>
          <xLgr>Av Brasil</xLgr>
          <nro>1000</nro>
          <xBairro>Centro</xBairro>
          <cMun>3550308</cMun>
          <xMun>São Paulo</xMun>
          <UF>SP</UF>
          <CEP>01000000</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
        </enderDest>
        <indIEDest>1</indIEDest> <!-- 1=Contribuinte -->
        <IE>987654321</IE>
      </dest>
      
      <!-- ITENS -->
      <det nItem="1">
        <prod>
          <cProd>PROD001</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>Produto Exemplo</xProd>
          <NCM>84713000</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>1.0000</qCom>
          <vUnCom>100.00</vUnCom>
          <vProd>100.00</vProd>
          <cEANTrib>SEM GTIN</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>1.0000</qTrib>
          <vUnTrib>100.00</vUnTrib>
          <indTot>1</indTot>
        </prod>
        
        <!-- IMPOSTOS -->
        <imposto>
          <!-- ICMS -->
          <ICMS>
            <ICMSSN102>
              <orig>0</orig>
              <CSOSN>102</CSOSN> <!-- Simples Nacional sem permissão de crédito -->
            </ICMSSN102>
          </ICMS>
          
          <!-- IPI -->
          <IPI>
            <cEnq>999</cEnq>
            <IPINT>
              <CST>53</CST> <!-- Não tributado -->
            </IPINT>
          </IPI>
          
          <!-- PIS -->
          <PIS>
            <PISNT>
              <CST>07</CST> <!-- Simples Nacional -->
            </PISNT>
          </PIS>
          
          <!-- COFINS -->
          <COFINS>
            <COFINSNT>
              <CST>07</CST> <!-- Simples Nacional -->
            </COFINSNT>
          </COFINS>
          
          <!-- IBS (Reforma 2026) -->
          <IBS>
            <vBC>100.00</vBC>
            <pIBS>27.00</pIBS>
            <vIBS>2.70</vIBS> <!-- 27% * 1% em 2026 -->
          </IBS>
          
          <!-- CBS (Reforma 2026) -->
          <CBS>
            <vBC>100.00</vBC>
            <pCBS>12.00</pCBS>
            <vCBS>1.20</vCBS> <!-- 12% * 1% em 2026 -->
          </CBS>
        </imposto>
      </det>
      
      <!-- TOTALIZADORES -->
      <total>
        <ICMSTot>
          <vBC>0.00</vBC>
          <vICMS>0.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>100.00</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>0.00</vPIS>
          <vCOFINS>0.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>100.00</vNF>
          <vTotTrib>0.00</vTotTrib>
        </ICMSTot>
      </total>
      
      <!-- TRANSPORTE -->
      <transp>
        <modFrete>9</modFrete> <!-- 9=Sem frete -->
      </transp>
      
      <!-- INFORMAÇÕES ADICIONAIS -->
      <infAdic>
        <infCpl>DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. 
        NÃO GERA DIREITO A CRÉDITO FISCAL DE ICMS.</infCpl>
      </infAdic>
    </infNFe>
    
    <!-- ASSINATURA DIGITAL -->
    <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
      <!-- Assinado com certificado digital -->
    </Signature>
  </NFe>
</nfeProc>
```

### FASE 4: ASSINATURA DO XML
```
1. Carregar certificado digital A1 (.pfx)
2. Assinar tag <infNFe> com algoritmo SHA-256
3. Inserir tag <Signature> no XML
```

### FASE 5: ENVIO PARA SEFAZ
```
1. Montar envelope SOAP
2. Enviar para WebService NFeAutorizacao4
3. Aguardar resposta da SEFAZ
```

### FASE 6: PROCESSAMENTO DA RESPOSTA
```
✅ Status 100: Autorizado o uso da NF-e
   - Salvar protocolo
   - Salvar XML retorno
   - Atualizar status: AUTORIZADA
   - Gerar DANFE

❌ Status 500+: Rejeição
   - Salvar motivo da rejeição
   - Atualizar status: REJEITADA
   - Exibir erro para usuário corrigir

⏳ Status 105: Lote em processamento
   - Aguardar e consultar depois
```

---

## 🚀 PRÓXIMOS PASSOS (ORDEM DE IMPLEMENTAÇÃO)

### ✅ PASSO 1: Completar campos do banco de dados
```sql
-- Execute no Supabase SQL Editor:
-- Ver arquivo: ADICIONAR_CAMPOS_EMISSAO_NFE.sql (criar)
```

### ✅ PASSO 2: Criar tela de configuração fiscal
```
Menu → CONFIGURAÇÕES → Emissão de Notas Fiscais

Abas:
1. Certificado Digital
2. Ambiente de Emissão (Homologação/Produção)
3. Séries e Numeração
4. CSC (NFC-e)
5. Mensagens Fiscais Padrão
```

### ✅ PASSO 3: Implementar biblioteca de emissão
```
Opções:
1. node-nfe (Node.js)
2. Criar serviço próprio em Python/Node
3. Integrar com API de terceiros (Focusnfe, NFe.io)

Recomendação: Começar com API de terceiros para MVP
```

### ✅ PASSO 4: Testar em homologação
```
1. Emitir NF-e de teste
2. Validar cálculos tributários
3. Conferir XML gerado
4. Testar consulta de status
5. Testar cancelamento
```

### ✅ PASSO 5: Migrar para produção
```
1. Obter certificado A1 válido
2. Consultar última numeração na SEFAZ
3. Alterar ambiente para PRODUÇÃO
4. Emitir primeira nota real
5. Monitorar por 30 dias
```

---

## 📚 RESUMO: O QUE PRECISA SER FEITO

### ✅ JÁ TEMOS (80% pronto):
1. ✅ Estrutura de produtos com NCM
2. ✅ Regras de tributação inteligentes
3. ✅ Cálculo automático de impostos (antigo + novo)
4. ✅ Suporte IBS/CBS (Reforma 2026)
5. ✅ Tabela de notas fiscais
6. ✅ Validações fiscais automáticas
7. ✅ Sistema de priorização de regras

### ❌ FALTA IMPLEMENTAR (20%):
1. ❌ Campos de certificado digital na tabela empresas
2. ❌ Campo ambiente_emissao (homologação/produção) ⭐ CRÍTICO
3. ❌ Campos de série e numeração
4. ❌ Campo chave_acesso e protocolo
5. ❌ Tela de configuração fiscal
6. ❌ Biblioteca de geração e assinatura XML
7. ❌ Integração com WebService SEFAZ
8. ❌ Geração de DANFE (PDF)

---

## 🎯 DECISÃO MAIS IMPORTANTE AGORA

### ⚙️ **Como implementar a emissão?**

**Opção 1: API de Terceiros (RECOMENDADO para MVP)**
```
Vantagens:
✅ Rápido de implementar (1-2 dias)
✅ Não precisa lidar com XML/assinatura
✅ Suporte técnico
✅ Atualizações automáticas da legislação
✅ Homologação facilitada

Custo:
💰 R$ 0,25 a R$ 1,00 por nota emitida

Serviços:
- Focusnfe.com.br
- NFe.io
- PlugNotas
- TecnoSpeed
```

**Opção 2: Biblioteca Open Source**
```
Vantagens:
✅ Gratuito
✅ Controle total
✅ Sem dependência de terceiros

Desvantagens:
❌ Complexo de implementar (2-4 semanas)
❌ Precisa lidar com assinatura digital
❌ Manutenção constante
❌ Atualizações da legislação por sua conta

Bibliotecas:
- node-nfe (Node.js)
- python-nfe (Python)
- java-nfe (Java)
```

**Opção 3: Híbrida**
```
- Usar API de terceiros no início
- Migrar para biblioteca própria depois
```

---

## 📋 CHECKLIST FINAL ANTES DE EMITIR

```
DADOS DO EMITENTE:
[ ] CNPJ válido e ativo
[ ] Inscrição Estadual válida
[ ] Regime tributário definido
[ ] Endereço completo
[ ] Certificado digital A1 instalado
[ ] Certificado dentro da validade
[ ] Senha do certificado configurada
[ ] Ambiente definido (homologação/produção)
[ ] Série da nota definida
[ ] Numeração inicial definida

PRODUTOS:
[ ] Todos os produtos têm NCM (8 dígitos)
[ ] CFOP configurado
[ ] Unidade de medida definida
[ ] Valor unitário > 0
[ ] Regras de tributação cadastradas

REGRAS FISCAIS:
[ ] Pelo menos uma regra de tributação padrão
[ ] CST/CSOSN definidos conforme regime
[ ] Alíquotas de impostos configuradas
[ ] Mensagens fiscais padrão cadastradas

INFRAESTRUTURA:
[ ] Biblioteca de emissão instalada
[ ] WebServices SEFAZ configurados
[ ] Conexão com internet estável
[ ] Backup do banco de dados

TESTES:
[ ] Emisão em homologação OK
[ ] Consulta de status OK
[ ] Cálculos tributários conferidos
[ ] DANFE gerado corretamente
[ ] Cancelamento testado
```

---

## 🔗 DOCUMENTAÇÃO OFICIAL

- **Manual de Integração NF-e:** http://www.nfe.fazenda.gov.br/portal/principal.aspx
- **Schemas XML:** http://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=/fOGw5fZWGk=
- **LC 116/2003 (Serviços):** http://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm
- **Manual IBS/CBS:** https://www.gov.br/fazenda/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria

---

**✅ PRONTO PARA EMITIR APÓS IMPLEMENTAR OS 20% FALTANTES!**
