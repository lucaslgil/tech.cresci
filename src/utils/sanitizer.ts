/**
 * Utilitários de Sanitização de Inputs
 * 
 * ✅ Remove HTML malicioso
 * ✅ Escapa caracteres XML
 * ✅ Valida e limpa strings
 */

/**
 * Remove TODAS as tags HTML e scripts
 * Usar DOMPurify seria ideal, mas essa é uma versão simplificada
 */
export const sanitizeHTML = (input: string): string => {
  if (!input) return ''
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

/**
 * Remove caracteres perigosos para XML
 */
export const sanitizeXML = (input: string): string => {
  if (!input) return ''
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Remove apenas números
 */
export const onlyNumbers = (input: string): string => {
  if (!input) return ''
  return input.replace(/\D/g, '')
}

/**
 * Remove caracteres especiais (mantém apenas letras, números, espaços e hífens)
 */
export const sanitizeText = (input: string): string => {
  if (!input) return ''
  return input.replace(/[^\w\sÀ-ÿ\-]/g, '').trim()
}

/**
 * Valida e sanitiza CPF/CNPJ
 */
export const sanitizeCpfCnpj = (input: string): string => {
  const numbers = onlyNumbers(input)
  if (numbers.length !== 11 && numbers.length !== 14) {
    throw new Error('CPF/CNPJ inválido')
  }
  return numbers
}

/**
 * Valida e sanitiza email
 */
export const sanitizeEmail = (input: string): string => {
  if (!input) return ''
  
  const email = input.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email)) {
    throw new Error('Email inválido')
  }
  
  return email
}

/**
 * Sanitiza objeto completo recursivamente
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = { ...obj }

  for (const key in sanitized) {
    const value = sanitized[key]
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHTML(value) as T[Extract<keyof T, string>]
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item: any) => 
        typeof item === 'object' ? sanitizeObject(item) : 
        typeof item === 'string' ? sanitizeHTML(item) : item
      ) as T[Extract<keyof T, string>]
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    }
  }

  return sanitized
}

/**
 * Valida tamanho de string
 */
export const validateLength = (input: string, min: number, max: number, fieldName: string): void => {
  if (input.length < min) {
    throw new Error(`${fieldName} deve ter no mínimo ${min} caracteres`)
  }
  if (input.length > max) {
    throw new Error(`${fieldName} deve ter no máximo ${max} caracteres`)
  }
}

/**
 * Valida se string contém apenas caracteres permitidos
 */
export const validateChars = (input: string, pattern: RegExp, fieldName: string): void => {
  if (!pattern.test(input)) {
    throw new Error(`${fieldName} contém caracteres inválidos`)
  }
}
