# 🆓 SOLUÇÃO GRATUITA - Emissão NF-e sem Custos Mensais

## ✅ O QUE FOI IMPLEMENTADO

Comunicação **DIRETA com SEFAZ** via SOAP - **100% GRATUITA**!

### Arquitetura Gratuita
```
src/services/nfe/
├── assinaturaDigitalService.ts  ✅ Assina XML com certificado A1
├── sefazClientDireto.ts         ✅ Cliente SOAP direto SEFAZ
├── sefazClient.ts               ✅ Suporta MODO GRATUITO + PAGO
└── ...
```

## 💰 COMPARATIVO: GRATUITO vs PAGO

### 🆓 MODO GRATUITO (Implementado Agora)
```
✅ Custo mensal: R$ 0
✅ Comunicação: SOAP direto com SEFAZ
✅ Requer: Certificado Digital A1 (R$ 150-250/ano)*
✅ Complexidade: Média
✅ Suporte: Documentação SEFAZ
```

### 💳 MODO PAGO (Focus NFe)
```
💰 Custo mensal: R$ 29-299
✅ Comunicação: REST API
❌ Certificado: Não obrigatório (Focus assina)
✅ Complexidade: Baixa
✅ Suporte: Equipe técnica
```

**Importante:** Certificado Digital é **obrigatório por lei** para emitir NF-e, independente do método.

## 🚀 COMO USAR O MODO GRATUITO

### Passo 1: Obter Certificado Digital A1

#### Onde Comprar:
- **Serasa Experian**: https://certificadodigital.serasaexperian.com.br
- **Valid**: https://www.validcertificadora.com.br
- **Certisign**: https://www.certisign.com.br

#### Preços (2026):
- e-CNPJ A1: R$ 150-250/ano
- Validade: 12 meses
- Renovação: Anual

#### Processo:
1. Escolher certificadora
2. Pagar e agendar videoconferência
3. Validar documentos e identidade
4. Baixar certificado (.pfx ou .p12)
5. Definir senha (guardar bem!)

### Passo 2: Configurar no Sistema

#### Opção A: Via Painel Parâmetros Fiscais

1. Acesse: **Notas Fiscais → Parâmetros Fiscais**
2. Aba: **Certificado Digital**
3. Selecione arquivo .pfx/.p12
4. Digite senha
5. Clique "Validar e Salvar"

#### Opção B: Deixar .env VAZIO (Modo Gratuito Ativa Automaticamente)

```env
# .env - Deixe token vazio para ativar modo gratuito
VITE_NFE_AMBIENTE=HOMOLOGACAO

# Token VAZIO = Modo Gratuito ativo
VITE_FOCUS_NFE_TOKEN_HOMOLOGACAO=

# Certificado será carregado via interface
```

### Passo 3: Emitir Primeira Nota

1. **Notas Fiscais → Emitir Nota Fiscal**
2. Sistema detecta modo gratuito automaticamente
3. Carrega certificado da configuração
4. Assina XML localmente
5. Envia SOAP direto para SEFAZ
6. ✅ NF-e autorizada!

## 🔧 FUNCIONAMENTO TÉCNICO

### Fluxo Modo Gratuito:
```
1. Usuário preenche nota
2. Sistema gera XML formato SEFAZ
3. AssinaturaDigitalService.assinarXML()
   → Usa certificado A1 para assinar
4. SefazClientDireto.enviarNFe()
   → Monta SOAP envelope
   → Envia HTTPS para SEFAZ do estado
5. SEFAZ processa e retorna
6. Sistema atualiza banco
```

### Diferenças vs API Paga:
| Aspecto | Gratuito | Focus NFe |
|---------|----------|-----------|
| Assinatura XML | Local (node-forge) | API assina |
| Protocolo | SOAP 1.2 | REST JSON |
| Endpoints | SEFAZ estadual | Focus unificado |
| Certificado | Obrigatório | Opcional |
| URLs | Uma por estado | URL única |
| Complexidade | Média | Baixa |

## 🌐 ESTADOS SUPORTADOS

### Implementado:
- ✅ **São Paulo (SP)** - SEFAZ própria
- ✅ **Outros Estados** - Via SVRS (Sefaz Virtual RS)

### URLs Homologação:
- **SP**: `https://homologacao.nfe.fazenda.sp.gov.br/ws/`
- **SVRS**: `https://nfe-homologacao.svrs.rs.gov.br/ws/`

### URLs Produção:
- **SP**: `https://nfe.fazenda.sp.gov.br/ws/`
- **SVRS**: `https://nfe.svrs.rs.gov.br/ws/`

## 📋 CHECKLIST HOMOLOGAÇÃO GRATUITA

### Antes de Começar
- [ ] Certificado Digital A1 adquirido
- [ ] Arquivo .pfx/.p12 baixado
- [ ] Senha anotada (não perca!)
- [ ] Ambiente configurado: HOMOLOGACAO

### Configuração
- [ ] Token Focus NFe VAZIO no .env
- [ ] Certificado carregado em Parâmetros Fiscais
- [ ] Certificado validado (não vencido)
- [ ] Empresa configurada com dados fiscais

### Teste
- [ ] Emitir nota de teste (CPF: 11111111191)
- [ ] Verificar status AUTORIZADA
- [ ] XML salvo no banco
- [ ] Mensagem SEFAZ exibida

## ⚠️ LIMITAÇÕES MODO GRATUITO

### 1. Certificado Obrigatório
- Diferente da API paga, não funciona sem certificado
- Certificado deve estar válido (não vencido)
- Renovação anual obrigatória

### 2. Complexidade Técnica
- Erros SOAP podem ser crípticos
- Cada estado tem particularidades
- Troubleshooting mais trabalhoso

### 3. Performance
- Comunicação direta pode ser mais lenta
- Timeout em horários de pico
- Retry manual necessário

### 4. Sem Suporte Dedicado
- Documentação SEFAZ (técnica)
- Sem chat/telefone
- Comunidade online

## 🐛 TROUBLESHOOTING

### "Certificado digital não encontrado"
```
✅ Carregar certificado em Parâmetros Fiscais
✅ Verificar senha está correta
✅ Arquivo .pfx/.p12 não corrompido
```

### "Certificado vencido"
```
✅ Renovar certificado (anual)
✅ Baixar novo .pfx
✅ Recarregar no sistema
```

### "Erro SOAP 500"
```
✅ Verificar se SEFAZ está online
✅ Conferir XML gerado (formato correto)
✅ Tentar novamente em 5 minutos
```

### "Assinatura inválida"
```
✅ Certificado corresponde ao CNPJ emissor
✅ Certificado e-CNPJ (não e-CPF)
✅ Senha correta ao carregar
```

## 💡 DICAS PRO

### 1. Backup do Certificado
```
- Guardar .pfx em local seguro
- Fazer backup em nuvem criptografada
- Não enviar por email/WhatsApp
- Anotar senha fisicamente
```

### 2. Renovação Antecipada
```
- Renovar 15 dias antes do vencimento
- Testar novo certificado em homologação
- Trocar em produção só após validar
```

### 3. Fallback para API Paga
```
- Manter código Focus NFe
- Se SEFAZ ficar instável, mudar token
- Custo esporádico < custo fixo
```

### 4. Monitoramento
```
- Acompanhar taxa de sucesso
- Alertar se taxa < 95%
- Logs detalhados de erros
```

## 🎯 QUANDO USAR CADA MODO

### Use GRATUITO se:
- ✅ Orçamento limitado
- ✅ Baixo volume (< 50 notas/mês)
- ✅ Equipe técnica disponível
- ✅ Pode lidar com instabilidades

### Use API PAGA se:
- ✅ Orçamento disponível
- ✅ Alto volume (> 100 notas/mês)
- ✅ Precisa de suporte dedicado
- ✅ Quer simplicidade

## 📊 ECONOMIA ANUAL

### Modo Gratuito:
```
Certificado A1: R$ 200/ano
API: R$ 0/mês
TOTAL: R$ 200/ano
```

### Modo Pago (Focus Básico):
```
Certificado: R$ 0 (Focus assina)
API: R$ 29/mês × 12 = R$ 348/ano
TOTAL: R$ 348/ano
```

### Modo Pago (Focus Pro):
```
Certificado: R$ 0
API: R$ 99/mês × 12 = R$ 1.188/ano
TOTAL: R$ 1.188/ano
```

**Economia com modo gratuito: R$ 148-988/ano**

## 🎉 CONCLUSÃO

Você agora tem **DUAS OPÇÕES**:

1. **🆓 GRATUITO**: Certificado A1 + SOAP direto
2. **💳 PAGO**: Token Focus NFe + REST API

Ambas funcionam! Escolha conforme seu orçamento e necessidade.

### Próximo Passo:
Adquira seu certificado digital e comece a emitir **gratuitamente**! 🚀

---

**Atualizado em:** 26/01/2026  
**Versão:** 2.0 - Modo Gratuito Implementado  
**Economia:** R$ 148-988/ano vs API paga
