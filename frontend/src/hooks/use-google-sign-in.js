import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ROLE_HOME } from '@/config/roles'
import { continueWithGoogle } from '@/services/auth-service'

// Shared by the log in and sign up pages: runs Google sign-in, then sends new
// parents to finish their profile and everyone else to their home page.
export function useGoogleSignIn() {
  const navigate = useNavigate()
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState(null)

  async function start() {
    setIsBusy(true)
    setError(null)
    try {
      const user = await continueWithGoogle()
      if (user.needsProfile) {
        navigate('/complete-profile', {
          state: { email: user.email, name: user.name },
        })
      } else {
        navigate(ROLE_HOME[user.role])
      }
    } catch (signInError) {
      setError(signInError.message)
      setIsBusy(false)
    }
  }

  return { start, isBusy, error }
}
