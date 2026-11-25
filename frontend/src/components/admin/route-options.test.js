import { describe, expect, it } from 'vitest'
import { routeFit } from '@/lib/route-fit'
import { busesText, needsReview, suggestionText } from './route-options'

const bus03 = { id: 'bus-03', number: 'Bus 03', seats: 40 }
const bus06 = { id: 'bus-06', number: 'Bus 06', seats: 33 }
const bus08 = { id: 'bus-08', number: 'Bus 08', seats: 33 }
const peter = { name: 'Peter Otieno' }

const route = (buses, used, suggestion = null) => {
  const seats = buses.length
    ? buses.reduce((total, b) => total + b.bus.seats, 0)
    : null
  return {
    buses,
    fit: routeFit({ morning: used, evening: 0 }, seats),
    suggestion,
  }
}

describe('busesText', () => {
  it('names the bus and driver, or every bus on the route', () => {
    expect(busesText(route([{ bus: bus03, driver: peter }], 17))).toBe(
      'Bus 03 · Peter Otieno',
    )
    expect(
      busesText(
        route(
          [
            { bus: bus06, driver: null },
            { bus: bus08, driver: null },
          ],
          40,
        ),
      ),
    ).toBe('Bus 06 and Bus 08')
    expect(busesText(route([], 12))).toBe('No bus this shift')
  })
})

describe('suggestionText', () => {
  it('suggests a smaller free bus for a roomy route', () => {
    const kilimani = route([{ bus: bus03, driver: peter }], 17, {
      kind: 'smaller',
      bus: bus08,
    })
    expect(suggestionText(kilimani)).toBe(
      'Only 17 of 40 seats are used. Bus 08 (33 seats) has no route this shift and would do, freeing Bus 03 for a busier route.',
    )
  })

  it('suggests adding a free bus to a full route', () => {
    const ruaka = route([{ bus: bus06, driver: null }], 31, {
      kind: 'add',
      bus: bus08,
    })
    expect(suggestionText(ruaka)).toBe(
      'The buses are 94% full. Bus 08 (33 seats) has no route this shift and could run it too.',
    )
    expect(needsReview(ruaka)).toBe(true)
  })

  it('says nothing about a route that fits, and skips empty routes', () => {
    const fits = route([{ bus: bus06, driver: null }], 25)
    expect(suggestionText(fits)).toBeNull()
    expect(needsReview(fits)).toBe(false)
    expect(needsReview(route([], 0))).toBe(false)
  })
})
