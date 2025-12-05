// Hook para toast simples
import { useState, useCallback } from 'react'

interface ToastState {
  message: string
  type: 'success' | 'error' | 'warning'
  show: boolean
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', show: false })

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type, show: true })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 3000)
  }, [])

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast])
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast])
  const warning = useCallback((message: string) => showToast(message, 'warning'), [showToast])

  return {
    toast,
    showToast,
    success,
    error,
    warning
  }
}
