import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function ProtectedRoute() {
  const { user, loading, fetchError } = useAuth()

  if (loading) return null

  if (fetchError || !user) return <Navigate to="/login" replace />

  return <Outlet />
}
