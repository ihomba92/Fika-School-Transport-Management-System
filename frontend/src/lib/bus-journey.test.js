import { describe, expect, it } from 'vitest'
import {
  easeInOut,
  journeyChapter,
  journeyClock,
  journeyAt,
  journeySeconds,
  planJourney,
  stopStatus,
  studentsOnBoard,
} from './bus-journey'

const stops = [
  { at: 0.25, riders: 2 },
  { at: 0.5, riders: 3 },
]
const options = {
  stops,
  driveSeconds: 8,
  stopSeconds: 2,
  startSeconds: 1,
  schoolSeconds: 3,
}

describe('planJourney', () => {
  it('drives out to school, stopping at each stop', () => {
    const segments = planJourney({ ...options, roundTrip: false })
    expect(segments.map((s) => s.kind)).toEqual([
      'wait',
      'drive',
      'stop',
      'drive',
      'stop',
      'drive',
      'wait',
    ])
    // 1 + 2 (8 s × 0.25) + 2 + 2 + 2 + 4 (8 s × 0.5) + 3
    expect(journeySeconds(segments)).toBe(16)
  })

  it('comes back the same way, dropping off in reverse', () => {
    const segments = planJourney(options)
    const evening = segments.filter((s) => s.action === 'alight')
    expect(evening.map((s) => s.stopIndex)).toEqual([1, 0])
    expect(journeySeconds(segments)).toBe(29)
  })
})

describe('journeyAt', () => {
  const segments = planJourney(options)

  it('waits at the start, then sets off towards school', () => {
    expect(journeyAt(segments, 0.5)).toMatchObject({
      position: 0,
      direction: 1,
      run: 'morning',
    })
    // Halfway through the first drive (1 s in, 1 s more): eased to half way.
    expect(journeyAt(segments, 2).position).toBeCloseTo(0.125)
  })

  it('stands still at a stop, and at school', () => {
    expect(journeyAt(segments, 3.5)).toMatchObject({ position: 0.25 })
    expect(journeyAt(segments, 14)).toMatchObject({
      position: 1,
      run: 'morning',
    })
  })

  it('drives back in the evening, and loops', () => {
    const evening = journeyAt(segments, 17)
    expect(evening.run).toBe('evening')
    expect(evening.direction).toBe(-1)
    expect(evening.position).toBeLessThan(1)
    expect(journeyAt(segments, 29 + 0.5)).toMatchObject({ position: 0 })
  })
})

describe('stopStatus and studentsOnBoard', () => {
  const segments = planJourney(options)
  const at = (seconds) => journeyAt(segments, seconds)

  it('follows the students of a stop through the day', () => {
    expect(stopStatus(segments, at(0.5), 0).status).toBe('waiting')
    expect(stopStatus(segments, at(4), 0)).toMatchObject({
      status: 'boarding',
      progress: 0.5,
    })
    expect(stopStatus(segments, at(12), 0).status).toBe('riding')
    expect(stopStatus(segments, at(28.5), 0).status).toBe('home')
  })

  it('counts children on the bus as they get on and off', () => {
    expect(studentsOnBoard(segments, at(0.5), stops)).toBe(0)
    expect(studentsOnBoard(segments, at(6), stops)).toBe(2)
    expect(studentsOnBoard(segments, at(14), stops)).toBe(5)
    expect(studentsOnBoard(segments, at(28.5), stops)).toBe(0)
  })
})

describe('easeInOut', () => {
  it('starts and ends gently', () => {
    expect(easeInOut(0)).toBe(0)
    expect(easeInOut(0.5)).toBe(0.5)
    expect(easeInOut(1)).toBe(1)
    expect(easeInOut(0.1)).toBeLessThan(0.1)
  })
})

describe('journeyChapter and journeyClock', () => {
  const segments = planJourney(options)
  const at = (seconds) => journeyAt(segments, seconds)

  it('names the part of the day', () => {
    expect(
      [0.5, 4, 14, 17, 28.5].map((s) => journeyChapter(segments, at(s))),
    ).toEqual(['leave', 'pickup', 'school', 'home', 'end'])
  })

  it('shows the morning and evening times', () => {
    expect(journeyClock(at(0.5))).toBe('06:15')
    expect(journeyClock(at(14))).toBe('07:41')
    expect(journeyClock(at(28.5))).toBe('17:11')
  })
})
