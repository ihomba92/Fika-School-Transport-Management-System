import { useCallback, useMemo, useState } from 'react'
import { AuthContext } from './auth-context'

const STORAGE_KEY = 'fika-auth'

// Fika uses JWTs (Flask-JWT-Extended). Logging in returns:
//   accessToken  short-lived (about 15 min); sent with every API request as
//                `Authorization: Bearer <token>`
//   refreshToken longer-lived; used only to get a new access token
//   user         name, email and role, for showing on screen
// They are kept in localStorage so a page refresh doesn't log you out.
// The server checks the token's signature and role on every request; the
// `user` here is only for display and never trusted for access.
function readStoredLogin() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [login, setLogin] = useState(readStoredLogin)

  const saveLogin = useCallback(({ user, accessToken, refreshToken }) => {
    const next = { user, accessToken, refreshToken }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setLogin(next)
  }, [])

  // With the back end, this also tells the API to revoke the refresh token.
  const logOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setLogin(null)
  }, [])

  const value = useMemo(
    () => ({
      user: login?.user ?? null,
      accessToken: login?.accessToken ?? null,
      saveLogin,
      logOut,
    }),
    [login, saveLogin, logOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
