import {
  SAMPLE_ACCOUNTS,
  SAMPLE_GOOGLE_USER,
  SAMPLE_PASSWORD,
} from '@/data/sample-accounts'
import { simulateNetwork } from './mock-network'

// The mock of the Flask auth routes (api/openapi.yaml, Auth). It signs
// people in the way the real API will (api/decisions/0001-sign-in-tokens.md):
// a short-lived access token in the answer, and a refresh "cookie".
//
// A real HttpOnly cookie can't be set without a server, so the mock keeps
// it in localStorage under its own key. Only this file reads it; the rest
// of the app never sees a refresh token, just as with the real API.

export class AuthError extends Error {
  constructor(message, status = 401, code = 'INVALID_CREDENTIALS') {
    super(message)
    this.status = status
    this.code = code
  }
}

const COOKIE_KEY = 'fika-mock-refresh-cookie'
// 15 minutes, as the real access token. Tests can shorten it.
let accessLifetimeMs = 15 * 60 * 1000

export function setAccessLifetime(ms) {
  accessLifetimeMs = ms
}

function readCookie() {
  try {
    return JSON.parse(localStorage.getItem(COOKIE_KEY))
  } catch {
    return null
  }
}

function writeCookie(user) {
  try {
    if (user) localStorage.setItem(COOKIE_KEY, JSON.stringify({ user }))
    else localStorage.removeItem(COOKIE_KEY)
  } catch {
    // No storage (private mode): the session lasts until the page reloads.
  }
}

// Not a real JWT: the mock server only needs to read the role and expiry.
function accessTokenFor(user) {
  const claims = {
    email: user.email,
    role: user.role,
    exp: Date.now() + accessLifetimeMs,
  }
  return `mock.${btoa(JSON.stringify(claims))}`
}

// What the server reads from `Authorization: Bearer …`: the claims, or
// why the token can't be used.
export function readAccessToken(token) {
  if (!token?.startsWith('mock.')) return { problem: 'UNAUTHENTICATED' }
  try {
    const claims = JSON.parse(atob(token.slice(5)))
    if (claims.exp < Date.now()) return { problem: 'TOKEN_EXPIRED' }
    return { claims }
  } catch {
    return { problem: 'UNAUTHENTICATED' }
  }
}

function signIn(user) {
  writeCookie(user)
  return { user, accessToken: accessTokenFor(user) }
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
      403,
      'EMAIL_NOT_VERIFIED',
    )
  }
  return signIn({
    name: account.name,
    email: account.email,
    role: account.role,
  })
}

export async function restoreSession() {
  await simulateNetwork(200)
  const cookie = readCookie()
  if (!cookie?.user) {
    throw new AuthError('Log in to continue.', 401, 'UNAUTHENTICATED')
  }
  return signIn(cookie.user)
}

export async function logOut() {
  writeCookie(null)
  await simulateNetwork(200)
}

export async function signUp({ email }) {
  await simulateNetwork()
  if (SAMPLE_ACCOUNTS.some((a) => a.email === email)) {
    throw new AuthError(
      'An account with this email already exists. Try logging in.',
      409,
      'EMAIL_TAKEN',
    )
  }
  return { email }
}

export async function continueWithGoogle() {
  await simulateNetwork()
  return {
    ...SAMPLE_GOOGLE_USER,
    needsProfile: true,
    signupToken: 'mock-signup-token',
  }
}

export async function completeProfile({ fullName }) {
  await simulateNetwork()
  return signIn({
    name: fullName,
    email: SAMPLE_GOOGLE_USER.email,
    role: 'parent',
  })
}

export async function updateMe(user, { language }) {
  await simulateNetwork(200)
  return { ...user, language }
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
