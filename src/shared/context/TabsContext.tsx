/**
 * CONTEXT: GERENCIAMENTO DE ABAS
 * Sistema de navegação por abas similar a navegador
 */

import React, { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface Tab {
  id: string
  title: string
  path: string
  icon?: ReactNode
}

interface TabsContextData {
  tabs: Tab[]
  activeTabId: string | null
  openTab: (tab: Omit<Tab, 'id'>) => void
  closeTab: (tabId: string) => void
  switchTab: (tabId: string) => void
  closeAllTabs: () => void
  isTabOpen: (path: string) => boolean
}

const TabsContext = createContext<TabsContextData>({} as TabsContextData)

export const TabsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const navigate = useNavigate()

  // Abrir nova aba ou ativar existente
  const openTab = useCallback((tab: Omit<Tab, 'id'>) => {
    setTabs(currentTabs => {
      // Verificar se aba já existe
      const existingTab = currentTabs.find(t => t.path === tab.path)
      
      if (existingTab) {
        // Aba já existe, apenas ativar
        setActiveTabId(existingTab.id)
        navigate(tab.path)
        return currentTabs
      }

      // Criar nova aba
      const newTab: Tab = {
        ...tab,
        id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      setActiveTabId(newTab.id)
      navigate(tab.path)
      return [...currentTabs, newTab]
    })
  }, [navigate])

  // Fechar aba
  const closeTab = useCallback((tabId: string) => {
    setTabs(currentTabs => {
      const tabIndex = currentTabs.findIndex(t => t.id === tabId)
      if (tabIndex === -1) return currentTabs

      const newTabs = currentTabs.filter(t => t.id !== tabId)

      // Se fechar aba ativa, ativar outra
      if (activeTabId === tabId) {
        if (newTabs.length > 0) {
          // Ativar aba anterior ou próxima
          const newActiveTab = newTabs[Math.max(0, tabIndex - 1)]
          setActiveTabId(newActiveTab.id)
          navigate(newActiveTab.path)
        } else {
          // Sem abas, voltar ao dashboard
          setActiveTabId(null)
          navigate('/dashboard')
        }
      }

      return newTabs
    })
  }, [activeTabId, navigate])

  // Trocar aba ativa
  const switchTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab) {
      setActiveTabId(tabId)
      navigate(tab.path)
    }
  }, [tabs, navigate])

  // Fechar todas as abas
  const closeAllTabs = useCallback(() => {
    setTabs([])
    setActiveTabId(null)
    navigate('/dashboard')
  }, [navigate])

  // Verificar se aba está aberta
  const isTabOpen = useCallback((path: string) => {
    return tabs.some(t => t.path === path)
  }, [tabs])

  return (
    <TabsContext.Provider
      value={{
        tabs,
        activeTabId,
        openTab,
        closeTab,
        switchTab,
        closeAllTabs,
        isTabOpen
      }}
    >
      {children}
    </TabsContext.Provider>
  )
}

export const useTabs = () => {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('useTabs deve ser usado dentro de TabsProvider')
  }
  return context
}
