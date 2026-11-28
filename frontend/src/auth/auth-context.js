import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

// { status, user, hasExpired, saveLogin, logOut }. `user` is null when
// logged out; `status` is 'checking' while the app opens.
export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return auth
}
