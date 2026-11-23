import { describe, expect, it } from 'vitest'
import { tripRun } from './trip-run'

const stops = [{ id: 'depot' }, { id: 'a' }, { id: 'b' }, { id: 'school' }]
const riders = [
  { id: 'r1', morningStopId: 'a', eveningStopId: 'a' },
  { id: 'r2', morningStopId: 'a', eveningStopId: null },
  { id: 'r3', morningStopId: 'b', eveningStopId: 'b' },
]

function run(kind, marks = {}, tripStops = stops) {
  return tripRun({ kind, stops: tripStops, riders, marks })
}

describe('tripRun', () => {
  it('starts at the first stop with students', () => {
    const result = run('morning')
    expect(result.nextStop.id).toBe('a')
    expect(result.riderCount).toBe(3)
    expect(result.onBoard).toBe(0)
    expect(result.stopsLeft).toBe(3)
  })

  it('moves on once every student at a stop is marked', () => {
    const result = run('morning', {
      r1: { mark: 'picked-up' },
      r2: { mark: 'absent' },
    })
    expect(result.stops[1].isDone).toBe(true)
    expect(result.nextStop.id).toBe('b')
    expect(result.onBoard).toBe(1)
    expect(result.isEveryoneMarked).toBe(false)
  })

  it('heads for the last stop when everyone is marked', () => {
    const result = run('morning', {
      r1: { mark: 'picked-up' },
      r2: { mark: 'picked-up' },
      r3: { mark: 'absent' },
    })
    expect(result.nextStop.id).toBe('school')
    expect(result.onBoard).toBe(2)
    expect(result.stopsLeft).toBe(1)
    expect(result.isEveryoneMarked).toBe(true)
  })

  it('counts the evening run from the students who rode', () => {
    const evening = [...stops].reverse()
    const result = run('evening', { r1: { mark: 'dropped-off' } }, evening)
    // r2 is not on the evening run; r1 is off; r3 is still on board.
    expect(result.riderCount).toBe(2)
    expect(result.onBoard).toBe(1)
    expect(result.nextStop.id).toBe('b')
  })
})
