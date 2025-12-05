/**
 * UTILITÁRIOS E VALIDAÇÕES - MÓDULO DE CLIENTES
 * Funções para validação de CPF, CNPJ, CEP, formatação, etc.
 */

import type { ValidationError, ValidationResult } from './types'

// =====================================================
// VALIDAÇÕES DE DOCUMENTOS
// =====================================================

/**
 * Valida CPF
 */
export function validarCPF(cpf: string): boolean {
  const numeros = cpf.replace(/\D/g, '')
  
  if (numeros.length !== 11) return false
  if (/^(\d)\1+$/.test(numeros)) return false // 111.111.111-11
  
  let soma = 0
  let resto: number
  
  // Valida primeiro dígito
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(numeros.substring(i - 1, i)) * (11 - i)
  }
  
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(numeros.substring(9, 10))) return false
  
  // Valida segundo dígito
  soma = 0
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(numeros.substring(i - 1, i)) * (12 - i)
  }
  
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(numeros.substring(10, 11))) return false
  
  return true
}

/**
 * Valida CNPJ
 */
export function validarCNPJ(cnpj: string): boolean {
  const numeros = cnpj.replace(/\D/g, '')
  
  if (numeros.length !== 14) return false
  if (/^(\d)\1+$/.test(numeros)) return false // 00.000.000/0000-00
  
  let tamanho = numeros.length - 2
  let numeros_cnpj = numeros.substring(0, tamanho)
  const digitos = numeros.substring(tamanho)
  let soma = 0
  let pos = tamanho - 7
  
  // Valida primeiro dígito
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros_cnpj.charAt(tamanho - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(0))) return false
  
  // Valida segundo dígito
  tamanho = tamanho + 1
  numeros_cnpj = numeros.substring(0, tamanho)
  soma = 0
  pos = tamanho - 7
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros_cnpj.charAt(tamanho - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(1))) return false
  
  return true
}

/**
 * Valida CEP
 */
export function validarCEP(cep: string): boolean {
  const numeros = cep.replace(/\D/g, '')
  return numeros.length === 8
}

/**
 * Valida email
 */
export function validarEmail(email: string): boolean {
  const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  return regex.test(email)
}

/**
 * Valida telefone brasileiro
 */
export function validarTelefone(telefone: string): boolean {
  const numeros = telefone.replace(/\D/g, '')
  return numeros.length === 10 || numeros.length === 11
}

// =====================================================
// FORMATAÇÕES
// =====================================================

/**
 * Formata CPF
 */
export function formatarCPF(cpf: string): string {
  const numeros = cpf.replace(/\D/g, '')
  if (numeros.length !== 11) return cpf
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Formata CNPJ
 */
export function formatarCNPJ(cnpj: string): string {
  const numeros = cnpj.replace(/\D/g, '')
  if (numeros.length !== 14) return cnpj
  return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

/**
 * Formata CEP
 */
export function formatarCEP(cep: string): string {
  const numeros = cep.replace(/\D/g, '')
  if (numeros.length !== 8) return cep
  return numeros.replace(/(\d{5})(\d{3})/, '$1-$2')
}

/**
 * Formata telefone
 */
export function formatarTelefone(telefone: string): string {
  const numeros = telefone.replace(/\D/g, '')
  
  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (numeros.length === 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  
  return telefone
}

/**
 * Formata valor monetário
 */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

/**
 * Formata data para exibição
 */
export function formatarData(data: string): string {
  if (!data) return ''
  const d = new Date(data)
  return d.toLocaleDateString('pt-BR')
}

/**
 * Formata data e hora para exibição
 */
export function formatarDataHora(data: string): string {
  if (!data) return ''
  const d = new Date(data)
  return d.toLocaleString('pt-BR')
}

// =====================================================
// MÁSCARAS PARA INPUTS
// =====================================================

/**
 * Aplica máscara de CPF
 */
export function aplicarMascaraCPF(valor: string): string {
  let numeros = valor.replace(/\D/g, '')
  numeros = numeros.substring(0, 11)
  
  if (numeros.length <= 3) return numeros
  if (numeros.length <= 6) return numeros.replace(/(\d{3})(\d{0,3})/, '$1.$2')
  if (numeros.length <= 9) return numeros.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3')
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4')
}

/**
 * Aplica máscara de CNPJ
 */
export function aplicarMascaraCNPJ(valor: string): string {
  let numeros = valor.replace(/\D/g, '')
  numeros = numeros.substring(0, 14)
  
  if (numeros.length <= 2) return numeros
  if (numeros.length <= 5) return numeros.replace(/(\d{2})(\d{0,3})/, '$1.$2')
  if (numeros.length <= 8) return numeros.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3')
  if (numeros.length <= 12) return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4')
  return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5')
}

/**
 * Aplica máscara de CEP
 */
export function aplicarMascaraCEP(valor: string): string {
  let numeros = valor.replace(/\D/g, '')
  numeros = numeros.substring(0, 8)
  
  if (numeros.length <= 5) return numeros
  return numeros.replace(/(\d{5})(\d{0,3})/, '$1-$2')
}

/**
 * Aplica máscara de telefone
 */
export function aplicarMascaraTelefone(valor: string): string {
  let numeros = valor.replace(/\D/g, '')
  numeros = numeros.substring(0, 11)
  
  if (numeros.length <= 2) return numeros
  if (numeros.length <= 6) {
    return numeros.replace(/(\d{2})(\d{0,4})/, '($1) $2')
  }
  if (numeros.length <= 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
  }
  return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}

// =====================================================
// CONSULTAS EXTERNAS
// =====================================================

/**
 * Interface de retorno da API ViaCEP
 */
interface ViaCEPResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

/**
 * Consulta CEP na API ViaCEP
 */
export async function consultarCEP(cep: string): Promise<ViaCEPResponse | null> {
  const numeros = cep.replace(/\D/g, '')
  
  if (numeros.length !== 8) {
    throw new Error('CEP inválido')
  }
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${numeros}/json/`)
    const data = await response.json()
    
    if (data.erro) {
      throw new Error('CEP não encontrado')
    }
    
    return data
  } catch (error) {
    console.error('Erro ao consultar CEP:', error)
    return null
  }
}

/**
 * Interface de retorno da API ReceitaWS (CNPJ)
 */
interface ReceitaWSResponse {
  status: string
  cnpj: string
  tipo: string
  nome: string
  fantasia: string
  abertura: string
  natureza_juridica: string
  porte: string
  atividade_principal: Array<{
    code: string
    text: string
  }>
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  municipio: string
  uf: string
  cep: string
  email: string
  telefone: string
  situacao: string
}

/**
 * Consulta CNPJ na API ReceitaWS
 * Nota: API gratuita com limite de requisições
 * 
 * APIs alternativas caso ReceitaWS falhe:
 * 1. https://publica.cnpj.ws/cnpj/{cnpj}
 * 2. https://brasilapi.com.br/api/cnpj/v1/{cnpj}
 */
export async function consultarCNPJ(cnpj: string): Promise<ReceitaWSResponse | null> {
  const numeros = cnpj.replace(/\D/g, '')
  
  if (numeros.length !== 14) {
    throw new Error('CNPJ inválido')
  }
  
  // Lista de APIs para tentar
  const apis = [
    {
      nome: 'BrasilAPI',
      url: `https://brasilapi.com.br/api/cnpj/v1/${numeros}`,
      transformar: (data: any) => ({
        nome: data.razao_social,
        fantasia: data.nome_fantasia || data.razao_social,
        situacao: data.descricao_situacao_cadastral,
        abertura: data.data_inicio_atividade,
        atividade_principal: [{
          code: data.cnae_fiscal_principal?.codigo,
          text: data.cnae_fiscal_principal?.descricao
        }]
      })
    },
    {
      nome: 'ReceitaWS',
      url: `https://www.receitaws.com.br/v1/cnpj/${numeros}`,
      transformar: (data: any) => data
    }
  ]
  
  // Tenta cada API sequencialmente
  for (const api of apis) {
    try {
      console.log(`🔍 Tentando ${api.nome}:`, numeros)
      console.log('📡 URL:', api.url)
      
      const response = await fetch(api.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      })
      
      console.log(`📥 ${api.nome} - Status:`, response.status)
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`✅ ${api.nome} - Dados recebidos:`, data)
      
      // Verifica se é erro
      if (data.status === 'ERROR') {
        throw new Error(data.message || 'Erro ao consultar CNPJ')
      }
      
      // Transforma os dados para o formato padrão
      const dadosTransformados = api.transformar(data)
      console.log('🔄 Dados transformados:', dadosTransformados)
      
      return dadosTransformados
      
    } catch (error) {
      console.warn(`⚠️ ${api.nome} falhou:`, error)
      // Continua para próxima API
    }
  }
  
  // Se todas as APIs falharam
  console.error('❌ Todas as APIs de CNPJ falharam')
  throw new Error('Não foi possível consultar o CNPJ. APIs temporariamente indisponíveis. Por favor, preencha os dados manualmente.')
}

// =====================================================
// VALIDAÇÕES DE FORMULÁRIO
// =====================================================

/**
 * Valida dados de cliente (Pessoa Física)
 */
export function validarClientePF(data: any): ValidationResult {
  const errors: ValidationError[] = []
  
  if (!data.nome_completo || data.nome_completo.trim().length < 3) {
    errors.push({ field: 'nome_completo', message: 'Nome completo é obrigatório (mínimo 3 caracteres)' })
  }
  
  if (!data.cpf || !validarCPF(data.cpf)) {
    errors.push({ field: 'cpf', message: 'CPF inválido' })
  }
  
  if (data.data_nascimento) {
    const dataNasc = new Date(data.data_nascimento)
    const hoje = new Date()
    if (dataNasc > hoje) {
      errors.push({ field: 'data_nascimento', message: 'Data de nascimento não pode ser futura' })
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Valida dados de cliente (Pessoa Jurídica)
 */
export function validarClientePJ(data: any): ValidationResult {
  const errors: ValidationError[] = []
  
  if (!data.razao_social || data.razao_social.trim().length < 3) {
    errors.push({ field: 'razao_social', message: 'Razão social é obrigatória (mínimo 3 caracteres)' })
  }
  
  if (!data.cnpj || !validarCNPJ(data.cnpj)) {
    errors.push({ field: 'cnpj', message: 'CNPJ inválido' })
  }
  
  if (data.inscricao_estadual && data.inscricao_estadual.toUpperCase() !== 'ISENTO') {
    if (data.inscricao_estadual.length < 8) {
      errors.push({ field: 'inscricao_estadual', message: 'Inscrição Estadual inválida' })
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Valida endereço
 */
export function validarEndereco(data: any): ValidationResult {
  const errors: ValidationError[] = []
  
  if (!data.cep || !validarCEP(data.cep)) {
    errors.push({ field: 'cep', message: 'CEP inválido' })
  }
  
  if (!data.logradouro || data.logradouro.trim().length < 3) {
    errors.push({ field: 'logradouro', message: 'Logradouro é obrigatório' })
  }
  
  if (!data.numero) {
    errors.push({ field: 'numero', message: 'Número é obrigatório' })
  }
  
  if (!data.bairro || data.bairro.trim().length < 3) {
    errors.push({ field: 'bairro', message: 'Bairro é obrigatório' })
  }
  
  if (!data.cidade || data.cidade.trim().length < 3) {
    errors.push({ field: 'cidade', message: 'Cidade é obrigatória' })
  }
  
  if (!data.estado || data.estado.length !== 2) {
    errors.push({ field: 'estado', message: 'Estado (UF) é obrigatório' })
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Valida contato
 */
export function validarContato(data: any): ValidationResult {
  const errors: ValidationError[] = []
  
  if (!data.valor || data.valor.trim().length === 0) {
    errors.push({ field: 'valor', message: 'Valor do contato é obrigatório' })
  }
  
  if (data.tipo === 'EMAIL' && !validarEmail(data.valor)) {
    errors.push({ field: 'valor', message: 'E-mail inválido' })
  }
  
  if ((data.tipo === 'TELEFONE' || data.tipo === 'CELULAR' || data.tipo === 'WHATSAPP') 
      && !validarTelefone(data.valor)) {
    errors.push({ field: 'valor', message: 'Telefone inválido' })
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Remove acentos de string
 */
export function removerAcentos(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Gera iniciais do nome
 */
export function gerarIniciais(nome: string): string {
  if (!nome) return ''
  
  const palavras = nome.trim().split(' ')
  if (palavras.length === 1) {
    return palavras[0].substring(0, 2).toUpperCase()
  }
  
  return (palavras[0][0] + palavras[palavras.length - 1][0]).toUpperCase()
}

/**
 * Trunca texto
 */
export function truncarTexto(texto: string, tamanho: number): string {
  if (!texto || texto.length <= tamanho) return texto
  return texto.substring(0, tamanho) + '...'
}
