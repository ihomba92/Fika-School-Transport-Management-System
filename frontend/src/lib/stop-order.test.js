import { describe, expect, it } from 'vitest'
import {
  legMinutes,
  minutesPerKm,
  nearestNeighbourOrder,
  retime,
  routeKm,
} from './stop-order'

// Points along a line going east, about 1.1 km apart.
const stop = (id, lng, time = '06:00') => ({ id, position: [-1.29, lng], time })
const school = { position: [-1.29, 36.8] }

describe('nearestNeighbourOrder', () => {
  it('keeps the start first and visits the nearest stop next', () => {
    const order = nearestNeighbourOrder([
      stop('start', 36.75),
      stop('far', 36.78),
      stop('near', 36.76),
      stop('middle', 36.77),
    ])
    expect(order.map((s) => s.id)).toEqual(['start', 'near', 'middle', 'far'])
  })
})

describe('minutesPerKm, legMinutes and retime', () => {
  it("measures the route's pace from its first stop to the school", () => {
    // 5.56 km in a straight line × 1.3 by road ≈ 7.2 km in 36 minutes.
    const stops = [stop('start', 36.75, '06:00')]
    expect(minutesPerKm(stops, school, '06:36')).toBeCloseTo(5, 0)
  })

  it('times each leg at that pace, at least a minute', () => {
    // 1.11 km × 1.3 ≈ 1.45 km at 5 minutes a km ≈ 7 minutes.
    expect(legMinutes([-1.29, 36.75], [-1.29, 36.76], 5)).toBe(7)
    expect(legMinutes([-1.29, 36.75], [-1.29, 36.75], 5)).toBe(1)
  })

  it('keeps the start time and times every stop after it', () => {
    const result = retime(
      [stop('start', 36.75, '06:15'), stop('a', 36.76), stop('b', 36.77)],
      school,
      5,
    )
    expect(result.stops.map((s) => s.time)).toEqual(['06:15', '06:22', '06:29'])
    expect(result.schoolTime).toBe('06:51')
  })
})

describe('routeKm', () => {
  it('is shorter after reordering a zig-zag route', () => {
    const zigzag = [
      stop('start', 36.75),
      stop('far', 36.78),
      stop('near', 36.76),
      stop('middle', 36.77),
    ]
    expect(routeKm(nearestNeighbourOrder(zigzag), school)).toBeLessThan(
      routeKm(zigzag, school),
    )
  })
})
