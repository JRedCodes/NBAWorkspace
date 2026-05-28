import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function AuthGuard() {
  // Derive from user presence — isAuthenticated is not persisted, user is
  const user = useAuthStore((s) => s.user)
  return user !== null ? <Outlet /> : <Navigate to="/login" replace />
}
