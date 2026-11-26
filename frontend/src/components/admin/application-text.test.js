import { describe, expect, it } from 'vitest'
import { appliedLine, tripsLine } from './application-text'

const trips = {
  morning: { name: 'Junior pickup', time: '08:00' },
  evening: { name: 'Junior drop-off', time: '14:00' },
}

describe('tripsLine', () => {
  it('names the trips the child would ride', () => {
    expect(tripsLine({ grade: 'PP2', trips })).toBe(
      'Rides the Junior pickup (08:00) and the Junior drop-off (14:00)',
    )
    expect(
      tripsLine({ grade: 'PP2', trips: { ...trips, evening: null } }),
    ).toBe('Rides the Junior pickup (08:00)')
    expect(
      tripsLine({ grade: 'Grade 9', trips: { morning: null, evening: null } }),
    ).toBe('No trip time covers Grade 9 yet')
  })
})

describe('appliedLine', () => {
  it('says when the parent applied', () => {
    expect(appliedLine({ submittedOn: '2026-10-10' }, '2026-10-13')).toBe(
      'Applied 10 Oct',
    )
    expect(appliedLine({ submittedOn: '2026-10-13' }, '2026-10-13')).toBe(
      'Applied today',
    )
  })
})
