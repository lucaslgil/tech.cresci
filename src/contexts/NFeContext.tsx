/**
 * Context para gerenciar rascunhos de NF-e
 * 
 * ✅ Substitui sessionStorage (não persiste dados sensíveis no navegador)
 * ✅ Dados ficam apenas na memória
 * ✅ Limpo ao fechar aba/recarregar página
 */

import React, { createContext, useContext, useState, type ReactNode } from 'react'

interface NFeDados {
  empresa_id?: string
  cliente_id?: string
  operacao_fiscal_id?: string
  natureza_operacao?: string
  finalidade?: string
  itens?: any[]
  pagamento?: any
  frete?: any
  informacoes_complementares?: string
  informacoes_fisco?: string
  [key: string]: any
}

interface NFeContextType {
  rascunho: NFeDados | null
  salvarRascunho: (dados: NFeDados) => void
  limparRascunho: () => void
  atualizarCampo: (campo: string, valor: any) => void
}

const NFeContext = createContext<NFeContextType | undefined>(undefined)

export const NFeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ✅ Estado na memória (não persiste no navegador)
  const [rascunho, setRascunho] = useState<NFeDados | null>(null)

  const salvarRascunho = (dados: NFeDados) => {
    setRascunho(dados)
  }

  const limparRascunho = () => {
    setRascunho(null)
  }

  const atualizarCampo = (campo: string, valor: any) => {
    setRascunho(prev => prev ? { ...prev, [campo]: valor } : { [campo]: valor })
  }

  return (
    <NFeContext.Provider value={{ rascunho, salvarRascunho, limparRascunho, atualizarCampo }}>
      {children}
    </NFeContext.Provider>
  )
}

export const useNFe = () => {
  const context = useContext(NFeContext)
  if (!context) {
    throw new Error('useNFe deve ser usado dentro de NFeProvider')
  }
  return context
}
