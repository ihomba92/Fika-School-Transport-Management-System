import { describe, expect, it } from 'vitest'
import { atNairobiTime } from './dates'
import { tripProgress, withArrivalTimes } from './trip'
import { stopStreet, summarizeTrip, tripTimeline } from './trip-summary'

const stops = withArrivalTimes({
  date: '2026-10-13',
  stops: [
    { id: 'depot', name: 'Depot', position: [0, 0], time: '06:15' },
    { id: 's1', name: 'Stop 1 · Jabavu Rd', position: [0, 1], time: '06:50' },
    {
      id: 's2',
      name: 'Stop 2 · Kindaruma Rd',
      position: [0, 2],
      time: '06:53',
    },
    {
      id: 's3',
      name: 'Stop 3 · Argwings Kodhek Rd',
      position: [0, 3],
      time: '06:55',
    },
    { id: 'school', name: 'School', position: [0, 4], time: '07:40' },
  ],
})

function tripAt(time) {
  const now = atNairobiTime('2026-10-13', time)
  const trip = { stops, yourStopId: 's3', progress: tripProgress(stops, now) }
  return { trip, now }
}

describe('stopStreet', () => {
  it('drops the stop number', () => {
    expect(stopStreet(stops[3])).toBe('Argwings Kodhek Rd')
  })
})

describe('summarizeTrip', () => {
  it('counts minutes and stops until the bus reaches your stop', () => {
    const { trip, now } = tripAt('06:52')
    const summary = summarizeTrip(trip, now)
    expect(summary.phase).toBe('coming')
    expect(summary.minutesAway).toBe(3)
    expect(summary.stopsAway).toBe(2)
    expect(summary.lastPassed.id).toBe('s1')
    expect(summary.nextStop.id).toBe('s2')
  })

  it('heads to school once your stop is passed', () => {
    const { trip, now } = tripAt('07:00')
    const summary = summarizeTrip(trip, now)
    expect(summary.phase).toBe('to-school')
    expect(summary.minutesAway).toBe(40)
  })

  it('knows before the start and after the end', () => {
    const before = tripAt('06:00')
    const after = tripAt('08:00')
    expect(summarizeTrip(before.trip, before.now).phase).toBe('not-started')
    expect(summarizeTrip(after.trip, after.now).phase).toBe('at-school')
  })
})

describe('tripTimeline', () => {
  it('shows the start, the last stop passed, the next stops, yours and the school', () => {
    const { trip } = tripAt('06:52')
    const rows = tripTimeline(trip).map((row) => [
      row.stop.id,
      row.state,
      row.isYours,
    ])
    expect(rows).toEqual([
      ['depot', 'passed', false],
      ['s1', 'passed', false],
      ['s2', 'next', false],
      ['s3', 'coming', true],
      ['school', 'coming', false],
    ])
  })
})
