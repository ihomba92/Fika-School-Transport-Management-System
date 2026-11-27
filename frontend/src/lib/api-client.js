import i18n from 'i18next'

// The one place the front end talks to the Fika API (api/openapi.yaml).
// Services call `api.get('/parent/family')` and get the answer's JSON, with
// dates as Date objects, or an ApiError with the server's message.
//
// Signing in (api/decisions/0001-sign-in-tokens.md): the access token lives
// only in this module's memory. The refresh token is an HttpOnly cookie the
// browser sends to /auth/refresh by itself; JavaScript never sees it.
//
// Without VITE_API_URL the requests go to the mock server in src/mocks/,
// which answers like Flask will: same paths, JSON, status codes and errors.

const BASE_URL = import.meta.env.VITE_API_URL
export const USES_MOCK_SERVER = !BASE_URL

export const NETWORK_ERROR = 'Check your internet connection and try again.'

// What the API said went wrong. `message` is the sentence to show (for
// parents and drivers it is also the Kiswahili translation key); `fields`
// maps form fields to their messages on 422 answers.
export class ApiError extends Error {
  constructor({ status, code, message, fields = null }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }
}

let accessToken = null
let refreshing = null
const sessionListeners = new Set()

export function setAccessToken(token) {
  accessToken = token
}

// Called when the session can't be renewed (the refresh cookie expired or
// was revoked): the AuthProvider listens and shows the log in page.
export function onSessionEnded(listener) {
  sessionListeners.add(listener)
  return () => sessionListeners.delete(listener)
}

// ISO instants with a time and an offset ("2026-10-12T06:52:00+03:00").
// Dates without a time ("2026-10-12") stay strings, as the contract says.
const INSTANT =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/

export function reviveDates(value) {
  if (typeof value === 'string') {
    return INSTANT.test(value) ? new Date(value) : value
  }
  if (Array.isArray(value)) return value.map(reviveDates)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, reviveDates(item)]),
    )
  }
  return value
}

function queryString(query) {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value)
    }
  }
  const text = params.toString()
  return text ? `?${text}` : ''
}

async function send({ method, path, query, body, withCookie }) {
  const headers = {
    Accept: 'application/json',
    'Accept-Language': i18n.language?.startsWith('sw') ? 'sw' : 'en',
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  // The two cookie requests carry this header so other sites can't make
  // them (api/decisions/0001-sign-in-tokens.md, CSRF).
  if (withCookie) headers['X-Fika-Client'] = 'web'

  let payload
  if (body instanceof FormData) {
    payload = body // the browser sets the multipart Content-Type
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const request = {
    method,
    path: path + queryString(query),
    headers,
    body: payload,
  }
  try {
    if (USES_MOCK_SERVER) {
      const { handleRequest } = await import('@/mocks/server')
      return await handleRequest(request)
    }
    const response = await fetch(BASE_URL + request.path, {
      method,
      headers,
      body: payload,
      credentials: 'include',
    })
    const text = await response.text()
    return { status: response.status, json: text ? JSON.parse(text) : null }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ApiError({
        status: 0,
        code: 'BAD_RESPONSE',
        message: NETWORK_ERROR,
      })
    }
    // fetch only throws when the request never got an answer.
    throw new ApiError({ status: 0, code: 'NETWORK', message: NETWORK_ERROR })
  }
}

function toError({ status, json }) {
  const error = json?.error
  return new ApiError({
    status,
    code: error?.code ?? 'UNKNOWN',
    message: error?.message ?? NETWORK_ERROR,
    fields: error?.fields ?? null,
  })
}

// Gets a new access token from the refresh cookie. Several requests whose
// token expired at the same moment share one refresh call.
export function refreshSession() {
  refreshing ??= send({
    method: 'POST',
    path: '/auth/refresh',
    withCookie: true,
  })
    .then((answer) => {
      if (answer.status !== 200) throw toError(answer)
      accessToken = answer.json.accessToken
      return reviveDates(answer.json)
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

export function endSession() {
  accessToken = null
}

async function request(method, path, { query, body, withCookie } = {}) {
  let answer = await send({ method, path, query, body, withCookie })

  if (answer.status === 401 && answer.json?.error?.code === 'TOKEN_EXPIRED') {
    try {
      await refreshSession()
    } catch {
      endSession()
      for (const listener of sessionListeners) listener()
      throw toError(answer)
    }
    answer = await send({ method, path, query, body, withCookie })
  }

  if (answer.status === 204) return null
  if (answer.status >= 400) throw toError(answer)
  return reviveDates(answer.json)
}

export const api = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body, options) => request('POST', path, { body, ...options }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  delete: (path) => request('DELETE', path),
}

// Puts one id into a path, safely ("+" and "/" in an id stay part of it).
export const segment = (id) => encodeURIComponent(id)
