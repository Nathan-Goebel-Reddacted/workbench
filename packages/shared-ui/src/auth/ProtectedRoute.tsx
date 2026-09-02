import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

type Props = { role?: string }

export function ProtectedRoute({ role }: Props) {
  const { user, loading, fetchError } = useAuth()

  if (loading) return null

  if (fetchError || !user) return <Navigate to="/login" replace />

  if (role && !user.roles.includes(role)) return <Navigate to="/" replace />

  return <Outlet />
}
