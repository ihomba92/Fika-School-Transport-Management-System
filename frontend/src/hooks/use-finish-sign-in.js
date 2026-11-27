import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '@/auth/auth-context'
import { ROLE_HOME } from '@/config/roles'

// After any kind of log in: keep the tokens and user, then go back to the page
// they tried to open (if it belongs to their role) or to their Home.
export function useFinishSignIn() {
  const { saveLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // `login` is { user }: auth-service already kept the access token.
  return function finishSignIn(login) {
    saveLogin(login)
    const home = ROLE_HOME[login.user.role]
    const from = location.state?.from
    navigate(from?.startsWith(home) ? from : home, { replace: true })
  }
}
