import {
  SAMPLE_ACCOUNTS,
  SAMPLE_GOOGLE_USER,
  SAMPLE_PASSWORD,
} from '@/data/sample-accounts'
import { simulateNetwork } from './mock-network'

// Stand-in for the Flask API until Module 1's back end exists.
// Each function has the shape the real API call will have, so pages won't change
// when these bodies are swapped for real requests.

export class AuthError extends Error {}

// The real API (Flask-JWT-Extended) answers a successful log in with signed
// JWTs. The mock hands out placeholder strings in the same places.
function loginResponse(user) {
  return {
    user,
    accessToken: `mock-access-token.${user.email}`,
    refreshToken: `mock-refresh-token.${user.email}`,
  }
}

export async function logIn({ email, password }) {
  await simulateNetwork()
  const account = SAMPLE_ACCOUNTS.find((a) => a.email === email)

  // Same message for a wrong email or a wrong password, so nobody can discover
  // which emails have accounts.
  if (!account || password !== SAMPLE_PASSWORD) {
    throw new AuthError('Email or password is incorrect.')
  }
  if (!account.emailVerified) {
    throw new AuthError(
      'Confirm your email first. We sent you a link when you signed up.',
    )
  }
  return loginResponse({
    name: account.name,
    email: account.email,
    role: account.role,
  })
}

export async function signUp({ email }) {
  await simulateNetwork()
  if (SAMPLE_ACCOUNTS.some((a) => a.email === email)) {
    throw new AuthError(
      'An account with this email already exists. Try logging in.',
    )
  }
  return { email }
}

export async function continueWithGoogle() {
  await simulateNetwork()
  return { ...SAMPLE_GOOGLE_USER, needsProfile: true }
}

export async function completeProfile({ email, fullName }) {
  await simulateNetwork()
  return loginResponse({ name: fullName, email, role: 'parent' })
}

export async function resendVerificationEmail() {
  await simulateNetwork()
}

export async function requestPasswordReset() {
  await simulateNetwork()
}

export async function resetPassword() {
  await simulateNetwork()
}
