// =====================================================
// INFORMAÇÕES IMPORTANTES - CAMPOS FISCAIS EMPRESAS
// =====================================================

/*
CAMPOS ADICIONADOS PARA EMISSÃO DE NF-e:

1. DADOS CADASTRAIS COMPLEMENTARES:
   - bairro: Bairro do endereço
   - complemento: Complemento do endereço
   - codigo_municipio: Código IBGE do município (7 dígitos)
   - pais: País (padrão: Brasil)
   - codigo_pais: Código do país (padrão: 1058 para Brasil)

2. INSCRIÇÕES:
   - inscricao_estadual: IE (OBRIGATÓRIO para emissão de NF-e)
   - inscricao_municipal: IM
   - inscricao_suframa: SUFRAMA (se aplicável)

3. REGIME TRIBUTÁRIO:
   - regime_tributario: 'SIMPLES' | 'PRESUMIDO' | 'REAL' (OBRIGATÓRIO)
   - crt: Código de Regime Tributário (OBRIGATÓRIO)
     * '1' = Simples Nacional
     * '2' = Simples Nacional - Excesso de sublimite de receita bruta
     * '3' = Regime Normal

4. CNAE:
   - cnae_principal: CNAE da atividade principal (OBRIGATÓRIO)
   - cnae_secundarios: Array de CNAEs das atividades secundárias

5. CONFIGURAÇÕES DE NF-e:
   - emite_nfe: Indica se a empresa emite NF-e
   - serie_nfe: Série da NF-e (geralmente '1')
   - ultimo_numero_nfe: Controle do último número emitido
   - ambiente_nfe: 'PRODUCAO' | 'HOMOLOGACAO'

6. CERTIFICADO DIGITAL:
   - certificado_digital_id: Referência ao certificado (OBRIGATÓRIO para NF-e)
   - certificado_senha: Senha do certificado (criptografada)
   - certificado_validade: Data de validade do certificado

7. CONTADOR RESPONSÁVEL:
   - contador_nome: Nome do contador
   - contador_cpf: CPF do contador (pessoa física)
   - contador_cnpj: CNPJ do escritório de contabilidade
   - contador_crc: Registro CRC do contador
   - contador_telefone: Telefone do contador
   - contador_email: Email do contador

8. OUTROS:
   - logo_url: URL da logo da empresa
   - ativo: Indica se a empresa está ativa
   - matriz: Indica se é empresa matriz
   - empresa_matriz_id: ID da empresa matriz (para filiais)

CAMPOS OBRIGATÓRIOS PARA EMISSÃO DE NF-e:
✅ CNPJ
✅ Razão Social
✅ Nome Fantasia (recomendado)
✅ Inscrição Estadual
✅ Regime Tributário (regime_tributario)
✅ CRT
✅ CNAE Principal
✅ Endereço completo (logradouro, número, bairro, CEP, cidade, estado)
✅ Código do Município (IBGE)
✅ Email (para envio do XML)
✅ Telefone
✅ Certificado Digital válido
✅ Série da NF-e
✅ Ambiente (Produção ou Homologação)

VALIDAÇÕES IMPORTANTES:
- CNPJ deve ser válido e único
- Inscrição Estadual deve ser válida conforme UF
- CRT deve estar de acordo com o Regime Tributário:
  * SIMPLES → CRT = '1' ou '2'
  * PRESUMIDO ou REAL → CRT = '3'
- CNAE Principal deve estar no formato 0000-0/00
- Código Município deve ter 7 dígitos
- Certificado Digital deve estar válido (não vencido)
- Email deve ser válido para receber XML da NF-e

REFERÊNCIA:
- Para buscar Código Município (IBGE): https://servicodados.ibge.gov.br/api/v1/localidades/municipios
- Para validar CNAE: https://concla.ibge.gov.br/busca-online-cnae.html
- Para validar IE: Cada estado tem sua própria regra de validação

*/

// TIPOS TYPESCRIPT ATUALIZADOS
export interface EmpresaFiscal {
  // Dados básicos
  id: number
  codigo: string
  razao_social: string
  nome_fantasia: string
  cnpj: string
  
  // Contato
  email: string
  telefone: string
  
  // Endereço
  cep: string
  endereco: string
  numero: string
  bairro?: string
  complemento?: string
  cidade: string
  estado: string
  codigo_municipio?: string
  pais?: string
  codigo_pais?: string
  
  // Inscrições
  inscricao_estadual?: string
  inscricao_municipal?: string
  inscricao_suframa?: string
  
  // Regime Tributário
  regime_tributario?: 'SIMPLES' | 'PRESUMIDO' | 'REAL'
  crt?: '1' | '2' | '3'
  
  // CNAE
  cnae_principal?: string
  cnae_secundarios?: string[]
  
  // NF-e
  emite_nfe?: boolean
  serie_nfe?: string
  ultimo_numero_nfe?: number
  ambiente_nfe?: 'PRODUCAO' | 'HOMOLOGACAO'
  
  // Certificado Digital
  certificado_digital_id?: number
  certificado_senha?: string
  certificado_validade?: string
  
  // Contador
  contador_nome?: string
  contador_cpf?: string
  contador_cnpj?: string
  contador_crc?: string
  contador_telefone?: string
  contador_email?: string
  
  // Outros
  logo_url?: string
  ativo?: boolean
  matriz?: boolean
  empresa_matriz_id?: number
  observacoes?: string
  created_at?: string
  updated_at?: string
}

// LABELS PARA REGIME TRIBUTÁRIO
export const REGIME_TRIBUTARIO_LABELS = [
  { value: 'SIMPLES', label: 'Simples Nacional', crt: '1' },
  { value: 'PRESUMIDO', label: 'Lucro Presumido', crt: '3' },
  { value: 'REAL', label: 'Lucro Real', crt: '3' }
]

// LABELS PARA CRT
export const CRT_LABELS = [
  { value: '1', label: '1 - Simples Nacional' },
  { value: '2', label: '2 - Simples Nacional - Excesso sublimite de receita bruta' },
  { value: '3', label: '3 - Regime Normal' }
]

// LABELS PARA AMBIENTE
export const AMBIENTE_NFE_LABELS = [
  { value: 'HOMOLOGACAO', label: 'Homologação (Testes)' },
  { value: 'PRODUCAO', label: 'Produção (Real)' }
]
