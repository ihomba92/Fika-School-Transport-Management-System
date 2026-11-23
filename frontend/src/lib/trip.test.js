import { describe, expect, it } from 'vitest'
import { atNairobiTime } from './dates'
import { tripProgress, withArrivalTimes } from './trip'

const stops = withArrivalTimes({
  date: '2026-10-13',
  stops: [
    { id: 'a', position: [0, 0], time: '06:00' },
    { id: 'b', position: [0, 10], time: '06:10' },
    { id: 'c', position: [10, 10], time: '06:20' },
  ],
})
const at = (time) => atNairobiTime('2026-10-13', time)

describe('tripProgress', () => {
  it('waits at the first stop before the trip starts', () => {
    expect(tripProgress(stops, at('05:50'))).toEqual({
      status: 'not-started',
      position: [0, 0],
      lastPassedIndex: -1,
    })
  })

  it('places the bus between stops in proportion to the time', () => {
    const progress = tripProgress(stops, at('06:05'))
    expect(progress.status).toBe('on-the-way')
    expect(progress.position).toEqual([0, 5])
    expect(progress.lastPassedIndex).toBe(0)
  })

  it('counts a stop as passed once its time is reached', () => {
    expect(tripProgress(stops, at('06:10')).lastPassedIndex).toBe(1)
  })

  it('finishes at the last stop', () => {
    expect(tripProgress(stops, at('06:30'))).toEqual({
      status: 'finished',
      position: [10, 10],
      lastPassedIndex: 2,
    })
  })
})
