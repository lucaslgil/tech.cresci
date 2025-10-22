import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../shared/context/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Allow access in demo mode when Supabase is not configured
  if (!isSupabaseConfigured || user) {
    return <>{children}</>
  }

  return <Navigate to="/login" replace />
}