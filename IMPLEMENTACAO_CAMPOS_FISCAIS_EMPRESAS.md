# IMPLEMENTAÇÃO DE CAMPOS FISCAIS - CADASTRO DE EMPRESAS

## 📋 RESUMO EXECUTIVO

O cadastro de empresas foi identificado como a **fonte primária** de dados do emitente para emissão de Nota Fiscal Eletrônica (NF-e). Para isso, foram adicionados **TODOS os campos obrigatórios** conforme legislação fiscal brasileira.

## 🎯 OBJETIVO

Transformar o cadastro de empresas em uma base de dados completa para:
1. **Emissão de NF-e** (Nota Fiscal Eletrônica)
2. **Emissão de NFC-e** (Nota Fiscal ao Consumidor Eletrônica)  
3. **Integração com SEFAZ** (Secretaria da Fazenda)
4. **Gestão de Certificados Digitais**
5. **Controle de séries e numeração de notas**

---

## 📦 ARQUIVOS CRIADOS/MODIFICADOS

### 1. Script SQL
**Arquivo:** `database/ADICIONAR_CAMPOS_FISCAIS_EMPRESAS.sql`
- Adiciona todas as colunas necessárias na tabela `empresas`
- Cria índices para otimização
- Adiciona comentários de documentação
- Define valores padrão

### 2. Documentação TypeScript
**Arquivo:** `src/features/empresa/CAMPOS_FISCAIS_INFO.ts`
- Interface TypeScript atualizada
- Labels para selects
- Comentários explicativos
- Validações necessárias

### 3. Componente Atualizado
**Arquivo:** `src/features/empresa/CadastroEmpresa.tsx`
- Interface `Empresa` atualizada
- FormData com novos campos
- Preparado para adicionar campos no formulário

---

## 🔧 PASSO A PASSO DE IMPLEMENTAÇÃO

### PASSO 1: Executar Script SQL no Supabase
```sql
-- Execute no Supabase SQL Editor
database/ADICIONAR_CAMPOS_FISCAIS_EMPRESAS.sql
```

Este script adiciona:
- ✅ Campos de endereço complementares (bairro, complemento, código município)
- ✅ Inscrições (Estadual, Municipal, SUFRAMA)
- ✅ Regime Tributário e CRT
- ✅ CNAE Principal e secundários
- ✅ Configurações de NF-e
- ✅ Certificado Digital
- ✅ Dados do Contador
- ✅ Controles de matriz/filial

### PASSO 2: Atualizar Interface do Formulário

Adicione as seguintes abas/seções no formulário de cadastro de empresas:

#### **ABA 1: Dados Cadastrais** (Já existe)
- Código
- Razão Social
- Nome Fantasia
- CNPJ
- Email
- Telefone

#### **ABA 2: Endereço** (Já existe parcialmente)
- CEP
- Endereço (Logradouro)
- Número
- **NOVO:** Bairro
- **NOVO:** Complemento
- Cidade
- Estado
- **NOVO:** Código Município (IBGE)

#### **ABA 3: Dados Fiscais** (NOVA)
```tsx
<div className="grid grid-cols-2 gap-4">
  {/* Inscrição Estadual */}
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      Inscrição Estadual * <span className="text-red-500">OBRIGATÓRIO PARA NF-e</span>
    </label>
    <input
      type="text"
      name="inscricao_estadual"
      value={formData.inscricao_estadual}
      onChange={handleChange}
      className="w-full border rounded-md px-3 py-2 text-sm"
      style={{ borderColor: '#C9C4B5' }}
      placeholder="123.456.789.012"
      required
    />
  </div>

  {/* Inscrição Municipal */}
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      Inscrição Municipal
    </label>
    <input
      type="text"
      name="inscricao_municipal"
      value={formData.inscricao_municipal}
      onChange={handleChange}
      className="w-full border rounded-md px-3 py-2 text-sm"
      style={{ borderColor: '#C9C4B5' }}
    />
  </div>

  {/* Regime Tributário */}
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      Regime Tributário * <span className="text-red-500">OBRIGATÓRIO PARA NF-e</span>
    </label>
    <select
      name="regime_tributario"
      value={formData.regime_tributario}
      onChange={handleChange}
      className="w-full border rounded-md px-3 py-2 text-sm"
      style={{ borderColor: '#C9C4B5' }}
      required
    >
      <option value="SIMPLES">Simples Nacional</option>
      <option value="PRESUMIDO">Lucro Presumido</option>
      <option value="REAL">Lucro Real</option>
    </select>
  </div>

  {/* CRT */}
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      CRT * <span className="text-red-500">OBRIGATÓRIO PARA NF-e</span>
    </label>
    <select
      name="crt"
      value={formData.crt}
      onChange={handleChange}
      className="w-full border rounded-md px-3 py-2 text-sm"
      style={{ borderColor: '#C9C4B5' }}
      required
    >
      <option value="1">1 - Simples Nacional</option>
      <option value="2">2 - Simples Nacional - Excesso</option>
      <option value="3">3 - Regime Normal</option>
    </select>
  </div>

  {/* CNAE Principal */}
  <div className="col-span-2">
    <label className="block text-xs font-medium text-gray-700 mb-1">
      CNAE Principal * <span className="text-red-500">OBRIGATÓRIO PARA NF-e</span>
    </label>
    <input
      type="text"
      name="cnae_principal"
      value={formData.cnae_principal}
      onChange={handleChange}
      className="w-full border rounded-md px-3 py-2 text-sm"
      style={{ borderColor: '#C9C4B5' }}
      placeholder="0000-0/00"
      required
    />
    <p className="text-xs text-gray-500 mt-1">
      Código CNAE da atividade principal. Consulte em: https://concla.ibge.gov.br
    </p>
  </div>
</div>
```

#### **ABA 4: Configurações NF-e** (NOVA)
```tsx
<div className="grid grid-cols-2 gap-4">
  {/* Emite NF-e */}
  <div className="col-span-2 flex items-center gap-2">
    <input
      type="checkbox"
      name="emite_nfe"
      checked={formData.emite_nfe}
      onChange={(e) => setFormData({ ...formData, emite_nfe: e.target.checked })}
      className="w-4 h-4"
    />
    <label className="text-sm font-medium text-gray-700">
      Esta empresa emite Nota Fiscal Eletrônica (NF-e)
    </label>
  </div>

  {formData.emite_nfe && (
    <>
      {/* Série NF-e */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Série NF-e *
        </label>
        <input
          type="text"
          name="serie_nfe"
          value={formData.serie_nfe}
          onChange={handleChange}
          className="w-full border rounded-md px-3 py-2 text-sm"
          style={{ borderColor: '#C9C4B5' }}
          placeholder="1"
          maxLength={3}
        />
      </div>

      {/* Último Número */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Último Número Emitido
        </label>
        <input
          type="number"
          name="ultimo_numero_nfe"
          value={formData.ultimo_numero_nfe}
          onChange={handleChange}
          className="w-full border rounded-md px-3 py-2 text-sm"
          style={{ borderColor: '#C9C4B5' }}
          readOnly
        />
        <p className="text-xs text-gray-500 mt-1">
          Atualizado automaticamente a cada emissão
        </p>
      </div>

      {/* Ambiente */}
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Ambiente de Emissão *
        </label>
        <select
          name="ambiente_nfe"
          value={formData.ambiente_nfe}
          onChange={handleChange}
          className="w-full border rounded-md px-3 py-2 text-sm"
          style={{ borderColor: '#C9C4B5' }}
        >
          <option value="HOMOLOGACAO">Homologação (Testes)</option>
          <option value="PRODUCAO">Produção (Notas Reais)</option>
        </select>
        <p className="text-xs text-yellow-600 mt-1">
          ⚠️ ATENÇÃO: Usar HOMOLOGAÇÃO apenas para testes. Notas emitidas em PRODUÇÃO têm valor fiscal real.
        </p>
      </div>
    </>
  )}
</div>
```

#### **ABA 5: Contador** (NOVA)
```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="col-span-2">
    <label className="block text-xs font-medium text-gray-700 mb-1">
      Nome do Contador
    </label>
    <input
      type="text"
      name="contador_nome"
      value={formData.contador_nome}
      onChange={handleChange}
      className="w-full border rounded-md px-3 py-2 text-sm"
      style={{ borderColor: '#C9C4B5' }}
    />
  </div>

  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      CPF do Contador
    </label>
    <input
      type="text"
      name="contador_cpf"
      value={formData.contador_cpf}
      onChange={handleChange}
      className="w-full border rounded-md px-3 py-2 text-sm"
      style={{ borderColor: '#C9C4B5' }}
      placeholder="000.000.000-00"
    />
  </div>

  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      CNPJ do Escritório
    </label>
    <input
      type="text"
      name="contador_cnpj"
      value={formData.contador_cnpj}
      onChange={handleChange}
      className="w-full border rounded-md px-3 py-2 text-sm"
      style={{ borderColor: '#C9C4B5' }}
      placeholder="00.000.000/0000-00"
    />
  </div>

  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      CRC (Registro)
    </label>
    <input
      type="text"
      name="contador_crc"
      value={formData.contador_crc}
      onChange={handleChange}
      className="w-full border rounded-md px-3 py-2 text-sm"
      style={{ borderColor: '#C9C4B5' }}
      placeholder="SP-123456/O-7"
    />
  </div>

  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      Telefone do Contador
    </label>
    <input
      type="tel"
      name="contador_telefone"
      value={formData.contador_telefone}
      onChange={handleChange}
      className="w-full border rounded-md px-3 py-2 text-sm"
      style={{ borderColor: '#C9C4B5' }}
      placeholder="(00) 00000-0000"
    />
  </div>

  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      Email do Contador
    </label>
    <input
      type="email"
      name="contador_email"
      value={formData.contador_email}
      onChange={handleChange}
      className="w-full border rounded-md px-3 py-2 text-sm"
      style={{ borderColor: '#C9C4B5' }}
    />
  </div>
</div>
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Backend (Supabase)
- [ ] Executar script SQL `ADICIONAR_CAMPOS_FISCAIS_EMPRESAS.sql`
- [ ] Verificar se todas as colunas foram criadas
- [ ] Verificar se os índices foram criados
- [ ] Testar inserção de dados via SQL

### Frontend (React/TypeScript)
- [ ] Atualizar interface `Empresa` no componente
- [ ] Atualizar `formData` com novos campos
- [ ] Atualizar função `resetForm()`
- [ ] Atualizar função `openModal()` para edição
- [ ] Adicionar abas no formulário
- [ ] Adicionar campos de Dados Fiscais
- [ ] Adicionar campos de Configurações NF-e
- [ ] Adicionar campos de Contador
- [ ] Adicionar validações de campos obrigatórios
- [ ] Testar cadastro de nova empresa
- [ ] Testar edição de empresa existente
- [ ] Testar busca de CEP (deve preencher bairro também)

### Integrações
- [ ] Integrar busca de Código Município via API IBGE
- [ ] Validar formato de CNAE
- [ ] Validar formato de Inscrição Estadual por UF
- [ ] Integrar com módulo de Certificados Digitais

---

## 📚 REFERÊNCIAS ÚTEIS

### APIs Úteis
- **IBGE (Municípios):** `https://servicodados.ibge.gov.br/api/v1/localidades/municipios`
- **ViaCEP:** `https://viacep.com.br/ws/{CEP}/json/`
- **ReceitaWS (CNPJ):** `https://www.receitaws.com.br/v1/cnpj/{CNPJ}`

### Documentação
- **Manual NF-e SEFAZ:** http://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=tW+YMyk/50s=
- **CNAE:** https://concla.ibge.gov.br/busca-online-cnae.html
- **Códigos IBGE:** https://www.ibge.gov.br/explica/codigos-dos-municipios.php

---

## 🎯 PRÓXIMOS PASSOS

1. **Executar script SQL** no Supabase
2. **Atualizar formulário** com novas abas
3. **Implementar validações**
4. **Testar cadastro completo**
5. **Conectar com módulo de Regras de Tributação**
6. **Usar campo "Unidade Emissora" como referência à empresa**

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

1. **Campos obrigatórios para NF-e:**
   - Inscrição Estadual
   - Regime Tributário
   - CRT
   - CNAE Principal
   - Código Município
   - Certificado Digital válido

2. **Validação de CRT x Regime:**
   - Simples Nacional → CRT = '1' ou '2'
   - Lucro Presumido/Real → CRT = '3'

3. **Ambiente de Emissão:**
   - HOMOLOGAÇÃO: Para testes (não tem valor fiscal)
   - PRODUÇÃO: Notas reais com valor fiscal

4. **Certificado Digital:**
   - Deve estar válido (não vencido)
   - Senha criptografada no banco
   - Controle de validade

---

**Data:** 14/01/2026  
**Responsável:** GitHub Copilot  
**Status:** ✅ Scripts criados, aguardando implementação no frontend
