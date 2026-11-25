import { describe, expect, it } from 'vitest'
import { routeFit, seatsNeeded, freeBusSuggestion } from './route-fit'

describe('seatsNeeded', () => {
  it('is the busier of the two runs', () => {
    expect(seatsNeeded({ morning: 30, evening: 26 })).toBe(30)
    expect(seatsNeeded({ morning: 0, evening: 12 })).toBe(12)
  })
})

describe('routeFit', () => {
  const fit = (used, seats) => routeFit({ morning: used, evening: 0 }, seats)

  it('describes how full the bus is', () => {
    expect(fit(34, 33).status).toBe('over')
    expect(fit(30, 33).status).toBe('full')
    expect(fit(25, 33).status).toBe('ok')
    expect(fit(17, 40).status).toBe('roomy')
    expect(fit(17, 40).share).toBeCloseTo(0.425)
  })

  it('treats a route with no bus, or no students, separately', () => {
    expect(fit(12, null)).toEqual({ status: 'no-bus', used: 12, share: null })
    expect(fit(0, 33).status).toBe('ok')
  })
})

describe('freeBusSuggestion', () => {
  const free = [
    { id: 'bus-08', seats: 33 },
    { id: 'bus-09', seats: 52 },
    { id: 'bus-10', seats: 14 },
  ]
  const suggest = (used, seats, busCount = 1) =>
    freeBusSuggestion(
      routeFit({ morning: used, evening: 0 }, seats),
      seats,
      busCount,
      free,
    )

  it('adds the smallest free bus that seats the students left over', () => {
    expect(suggest(31, 33)).toEqual({ kind: 'add', bus: free[2] })
    expect(suggest(50, 33)).toEqual({ kind: 'add', bus: free[0] })
    expect(suggest(70, 33)).toEqual({ kind: 'add', bus: free[1] })
  })

  it('offers a smaller free bus to a roomy route with one bus', () => {
    expect(suggest(17, 40)).toEqual({ kind: 'smaller', bus: free[0] })
    expect(suggest(12, 40)).toEqual({ kind: 'smaller', bus: free[2] })
    expect(suggest(17, 40, 2)).toBeNull()
  })

  it('offers a free bus that fits to a route with no bus', () => {
    expect(suggest(20, null, 0)).toEqual({ kind: 'assign', bus: free[0] })
    expect(suggest(60, null, 0)).toBeNull()
  })

  it('suggests nothing when the route fits its buses', () => {
    expect(suggest(25, 33)).toBeNull()
  })
})
