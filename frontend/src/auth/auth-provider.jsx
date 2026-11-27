import { useCallback, useEffect, useMemo, useState } from 'react'
import { onSessionEnded } from '@/lib/api-client'
import {
  logOut as endServerSession,
  restoreSession,
} from '@/services/auth-service'
import { AuthContext } from './auth-context'

// Who is signed in, for the screens. The tokens themselves never come here
// (api/decisions/0001-sign-in-tokens.md): the access token lives inside
// api-client.js, and the refresh token is an HttpOnly cookie.
//
// status: 'checking' while the app asks the API whether the refresh cookie
// still signs someone in (once, when the app opens), then 'signed-in' or
// 'signed-out'. `user` is only for display; the server checks every request.
export function AuthProvider({ children }) {
  const [session, setSession] = useState({ status: 'checking', user: null })
  // Set when the API ended the session (not when the person logged out), so
  // the log in page can say why.
  const [hasExpired, setHasExpired] = useState(false)

  useEffect(() => {
    // Tokens from before this change lived in localStorage; drop them.
    localStorage.removeItem('fika-auth')

    let isCurrent = true
    restoreSession()
      .then(({ user }) => {
        if (isCurrent) setSession({ status: 'signed-in', user })
      })
      .catch(() => {
        if (isCurrent) setSession({ status: 'signed-out', user: null })
      })
    const stopListening = onSessionEnded(() => {
      setHasExpired(true)
      setSession({ status: 'signed-out', user: null })
    })
    return () => {
      isCurrent = false
      stopListening()
    }
  }, [])

  const saveLogin = useCallback(({ user }) => {
    setHasExpired(false)
    setSession({ status: 'signed-in', user })
  }, [])

  // Waits for the server to revoke the refresh cookie, so reopening the app
  // straight away can't sign back in.
  const logOut = useCallback(async () => {
    try {
      await endServerSession()
    } catch {
      // Offline: the cookie stays valid until it expires (30 days), but this
      // device forgets the access token now.
    }
    setSession({ status: 'signed-out', user: null })
  }, [])

  const value = useMemo(
    () => ({
      status: session.status,
      user: session.user,
      hasExpired,
      saveLogin,
      logOut,
    }),
    [session, hasExpired, saveLogin, logOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
