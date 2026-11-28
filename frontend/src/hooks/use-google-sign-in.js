import { useState } from 'react'
import { useNavigate } from 'react-router'
import { continueWithGoogle } from '@/services/auth-service'
import { useFinishSignIn } from './use-finish-sign-in'

// Shared by the log in and sign up pages: runs Google sign-in, then sends new
// parents to finish their profile and everyone else to their home page.
export function useGoogleSignIn() {
  const navigate = useNavigate()
  const finishSignIn = useFinishSignIn()
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState(null)

  async function start() {
    setIsBusy(true)
    setError(null)
    try {
      const result = await continueWithGoogle()
      if (result.needsProfile) {
        navigate('/complete-profile', {
          state: {
            email: result.email,
            name: result.name,
            signupToken: result.signupToken,
          },
        })
      } else {
        finishSignIn(result)
      }
    } catch (signInError) {
      setError(signInError.message)
      setIsBusy(false)
    }
  }

  return { start, isBusy, error }
}
