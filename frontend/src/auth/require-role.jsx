import { Navigate, useLocation } from 'react-router'
import { ROLE_HOME } from '@/config/roles'
import { useAuth } from './auth-context'

// Shows `children` only to someone logged in with this role.
// Logged out → log in page (then back here). Wrong role → their own Home.
// This is for a good experience only: the back end must check every request
// too, because anyone can change code running in their own browser.
export function RequireRole({ role, children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (user.role !== role) {
    return <Navigate to={ROLE_HOME[user.role]} replace />
  }
  return children
}
