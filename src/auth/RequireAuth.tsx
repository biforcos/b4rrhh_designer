import { Navigate, Outlet } from 'react-router-dom'
import { authStore } from './authStore'

export function RequireAuth() {
  return authStore.isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />
}
