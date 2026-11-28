import {
  api,
  endSession,
  refreshSession,
  setAccessToken,
} from '@/lib/api-client'

// Sign-in requests (api/openapi.yaml, Auth). The access token goes straight
// into api-client.js's memory; pages only get the user. The refresh token is
// a cookie the browser keeps (api/decisions/0001-sign-in-tokens.md).

function keepToken({ user, accessToken }) {
  setAccessToken(accessToken)
  return { user }
}

export async function logIn({ email, password }) {
  return keepToken(await api.post('/auth/login', { email, password }))
}

// Called once when the app opens: signs the person back in from the
// refresh cookie, or fails if there is none.
export async function restoreSession() {
  const { user } = await refreshSession()
  return { user }
}

export async function logOut() {
  try {
    await api.post('/auth/logout', undefined, { withCookie: true })
  } finally {
    endSession()
  }
}

export async function signUp({ fullName, phone, email, password, consent }) {
  return api.post('/auth/signup', { fullName, phone, email, password, consent })
}

// `credential` is Google's ID token, from Google Identity Services once it
// is connected. A new account comes back with a `signupToken` for
// completeProfile.
export async function continueWithGoogle(
  credential = 'mock-google-credential',
) {
  const result = await api.post('/auth/google', { credential })
  return result.needsProfile ? result : keepToken(result)
}

export async function completeProfile({
  signupToken,
  fullName,
  phone,
  consent,
}) {
  return keepToken(
    await api.post('/auth/complete-profile', {
      signupToken,
      fullName,
      phone,
      consent,
    }),
  )
}

// Saves the EN / SW choice, so emails, SMS and push notifications use it.
export async function updateMe({ language }) {
  return api.patch('/me', { language })
}

export async function resendVerificationEmail(email) {
  return api.post('/auth/resend-verification', { email })
}

export async function requestPasswordReset(email) {
  return api.post('/auth/forgot-password', { email })
}

export async function resetPassword({ token, password }) {
  return api.post('/auth/reset-password', { token, password })
}
