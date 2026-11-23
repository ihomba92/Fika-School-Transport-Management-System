import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

// { user, accessToken, saveLogin, logOut }. `user` is null when logged out.
export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return auth
}
