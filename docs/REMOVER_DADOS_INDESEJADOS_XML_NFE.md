# REMOVER DADOS INDESEJADOS DO XML DA NF-e

## 🔍 Problema Identificado

Os dados que aparecem no XML da NF-e não são seus:

```xml
<infCpl>montesclaros@crescieperdi.com.br</infCpl>
<infRespTec>
  <CNPJ>04210657000134</CNPJ>
  <xContato>Erick Vils Seixas</xContato>
  <email>suporte@solutio.com.br</email>
  <fone>213005011</fone>
</infRespTec>
```

## 📌 De onde vêm esses dados?

### 1. **Email no `<infCpl>`** (Informações Complementares)
- Vem do campo **"Informações Complementares"** da nota fiscal
- **Solução**: Limpar ou configurar texto padrão correto

### 2. **`<infRespTec>`** (Responsável Técnico)
- São dados da **Software House/Desenvolvedor**
- Adicionados automaticamente pela **Nuvem Fiscal** com base na configuração da conta
- **Solução**: Configurar na conta da Nuvem Fiscal

---

## ✅ Soluções

### Solução 1: Configurar Informações Complementares (Sistema)

1. Execute a migração SQL no Supabase:
```bash
supabase/migrations/20260206001000_adicionar_configuracoes_fiscais_empresa.sql
```

2. Acesse no sistema: **Empresa → Configurações Fiscais**

3. Preencha o campo **"Informações Complementares Padrão"** com o texto que deseja:
```
Nota fiscal emitida conforme Lei 12.741/2012
Tributos aproximados: R$ XX,XX
```

4. Salve as configurações

---

### Solução 2: Remover/Alterar Responsável Técnico (Nuvem Fiscal)

Os dados do `<infRespTec>` são configurados **diretamente na Nuvem Fiscal**.

#### Opção A: Remover completamente

1. Acesse: https://sandbox.nuvemfiscal.com.br (ou producao se estiver em produção)
2. Faça login com suas credenciais
3. Vá em: **Configurações → Empresa → Responsável Técnico**
4. **Remova ou deixe em branco** os campos
5. Salve

#### Opção B: Colocar seus dados

1. **CNPJ**: Coloque o CNPJ da sua empresa ou software house
2. **Nome**: Seu nome ou razão social
3. **Email**: Seu email de suporte
4. **Telefone**: Seu telefone de contato

**Importante:** 
- O `<infRespTec>` é **opcional** na NF-e
- Só é obrigatório se você for um software house certificado pela SEFAZ
- Se você mesmo está emitindo suas notas, pode deixar em branco

---

## 🎯 Resultado Esperado

Após as configurações, seu XML ficará assim:

```xml
<infCpl>Nota fiscal emitida conforme Lei 12.741/2012</infCpl>
<!-- infRespTec: removido ou com seus dados -->
```

---

## 📝 Como testar

1. Aplique a migração SQL
2. Configure as informações no sistema
3. Emita uma nova nota de teste (ambiente SANDBOX)
4. Baixe o XML e verifique se está correto
5. Se ainda aparecer dados antigos, limpe o cache da Nuvem Fiscal

---

## ⚠️ Observações Importantes

1. **Alterações são imediatas**: Após configurar na Nuvem Fiscal, a próxima emissão já terá os dados novos

2. **Notas antigas não mudam**: Notas já emitidas ficarão com os dados anteriores

3. **Email no infCpl**: Se aparecer um email que você não configurou, verifique:
   - Se há algum valor padrão no banco de dados
   - Se o campo está sendo preenchido automaticamente em algum lugar do código

4. **Ambiente SANDBOX vs PRODUÇÃO**: Configure em ambos os ambientes separadamente

---

## 🔧 Se o problema persistir

1. Limpe o cache do navegador
2. Verifique se está usando as credenciais corretas (.env)
3. Consulte os logs da Nuvem Fiscal no painel deles
4. Entre em contato com o suporte da Nuvem Fiscal

---

## 📚 Documentação Oficial

- [Nuvem Fiscal - Responsável Técnico](https://dev.nuvemfiscal.com.br/docs/guias/nfe/responsavel-tecnico)
- [Manual da NF-e - infRespTec](http://nfe.fazenda.gov.br)
