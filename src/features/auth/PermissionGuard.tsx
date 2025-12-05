import React from 'react'
import { Navigate } from 'react-router-dom'
import { usePermissions } from '../../shared/hooks/usePermissions'

interface PermissionGuardProps {
  children: React.ReactNode
  requiredPermissions: string[]
  requireAll?: boolean // Se true, precisa de todas. Se false, precisa de pelo menos uma
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  children, 
  requiredPermissions,
  requireAll = false 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions()

  // Enquanto carrega, não mostra nada
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Verificar permissões
  let hasAccess = false

  if (requiredPermissions.length === 1) {
    hasAccess = hasPermission(requiredPermissions[0] as any)
  } else if (requireAll) {
    hasAccess = hasAllPermissions(requiredPermissions as any)
  } else {
    hasAccess = hasAnyPermission(requiredPermissions as any)
  }

  // Se não tem permissão, redireciona para dashboard
  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
