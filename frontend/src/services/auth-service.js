import {
  SAMPLE_ACCOUNTS,
  SAMPLE_GOOGLE_USER,
  SAMPLE_PASSWORD,
} from '@/data/sample-accounts'

// Stand-in for the Flask API until Module 1's back end exists.
// Each function has the shape the real API call will have, so pages won't change
// when these bodies are swapped for real requests.

const SIMULATED_DELAY_MS = 600

export class AuthError extends Error {}

function simulateNetwork() {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS))
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
  return { name: account.name, role: account.role }
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

export async function completeProfile({ fullName }) {
  await simulateNetwork()
  return { name: fullName, role: 'parent' }
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
