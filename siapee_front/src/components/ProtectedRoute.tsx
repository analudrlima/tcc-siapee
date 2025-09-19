import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute() {
  const { tokens, loading } = useAuth()
  if (loading) return null
  if (!tokens) return <Navigate to="/login" />
  return <Outlet />
}
