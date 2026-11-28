// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { setAccessLifetime } from '@/mocks/auth'
import { logIn, logOut, restoreSession } from '@/services/auth-service'
import {
  ApiError,
  api,
  endSession,
  onSessionEnded,
  reviveDates,
} from './api-client'

vi.mock('@/mocks/mock-network', () => ({
  simulateNetwork: () => Promise.resolve(),
}))

const PASSWORD = 'Fika2026!'

beforeEach(() => {
  endSession()
  localStorage.clear()
  setAccessLifetime(15 * 60 * 1000)
})

afterEach(() => vi.useRealTimers())

describe('reviveDates', () => {
  test('turns instants into Dates and leaves plain dates as strings', () => {
    const value = reviveDates({
      at: '2026-10-13T06:52:00+03:00',
      list: [{ paidAt: '2026-10-13T03:52:00.000Z' }],
      date: '2026-10-13',
      name: 'Baraka',
    })
    expect(value.at).toBeInstanceOf(Date)
    expect(value.at.toISOString()).toBe('2026-10-13T03:52:00.000Z')
    expect(value.list[0].paidAt).toBeInstanceOf(Date)
    expect(value.date).toBe('2026-10-13')
    expect(value.name).toBe('Baraka')
  })
})

describe('signing in', () => {
  test('a request without signing in is refused', async () => {
    await expect(api.get('/parent/family')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    })
  })

  test('the token from logging in is sent with every request', async () => {
    const { user } = await logIn({
      email: 'parent@example.com',
      password: PASSWORD,
    })
    expect(user.role).toBe('parent')
    const family = await api.get('/parent/family')
    expect(family.children.length).toBeGreaterThan(0)
  })

  test('another role’s pages are refused', async () => {
    await logIn({ email: 'parent@example.com', password: PASSWORD })
    await expect(api.get('/admin/overview')).rejects.toMatchObject({
      status: 403,
      code: 'WRONG_ROLE',
    })
  })

  test('a wrong password gives the sentence the form shows', async () => {
    const error = await logIn({
      email: 'parent@example.com',
      password: 'nope',
    }).catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(401)
    expect(error.message).toBe('Email or password is incorrect.')
  })

  test('reopening the app signs back in from the refresh cookie', async () => {
    await logIn({ email: 'driver@example.com', password: PASSWORD })
    endSession() // what a page reload does to the token in memory
    const { user } = await restoreSession()
    expect(user.email).toBe('driver@example.com')
    await expect(api.get('/driver/day')).resolves.toBeTruthy()
  })

  test('after logging out, reopening the app stays signed out', async () => {
    await logIn({ email: 'driver@example.com', password: PASSWORD })
    await logOut()
    await expect(restoreSession()).rejects.toMatchObject({ status: 401 })
    await expect(api.get('/driver/day')).rejects.toMatchObject({ status: 401 })
  })
})

describe('an expired access token', () => {
  test('is refreshed once and the request repeated', async () => {
    setAccessLifetime(-1) // every token is already expired
    await logIn({ email: 'admin@example.com', password: PASSWORD })
    setAccessLifetime(60_000)
    const overview = await api.get('/admin/overview')
    expect(overview.stats).toBeTruthy()
  })

  test('requests waiting at the same moment share one refresh', async () => {
    setAccessLifetime(-1)
    await logIn({ email: 'admin@example.com', password: PASSWORD })
    setAccessLifetime(60_000)
    const answers = await Promise.all([
      api.get('/admin/fleet'),
      api.get('/admin/trip-times'),
      api.get('/admin/routes'),
    ])
    expect(answers.every(Boolean)).toBe(true)
  })

  test('ends the session when the refresh cookie is gone', async () => {
    setAccessLifetime(-1)
    await logIn({ email: 'admin@example.com', password: PASSWORD })
    localStorage.clear() // the cookie expired or was revoked
    const ended = vi.fn()
    const stop = onSessionEnded(ended)
    await expect(api.get('/admin/overview')).rejects.toMatchObject({
      code: 'TOKEN_EXPIRED',
    })
    expect(ended).toHaveBeenCalledOnce()
    stop()
  })
})

describe('answers', () => {
  beforeEach(() => logIn({ email: 'parent@example.com', password: PASSWORD }))

  test('204 No Content becomes null', async () => {
    await expect(api.post('/parent/notifications/read')).resolves.toBeNull()
  })

  test('instants arrive as Dates', async () => {
    const [notification] = await api.get('/parent/notifications')
    expect(notification.at).toBeInstanceOf(Date)
  })

  test('a missing record is a 404 with the message to show', async () => {
    await expect(api.get('/parent/children/nobody')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
      message: 'We could not find that child.',
    })
  })
})
