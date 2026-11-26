import { describe, expect, it } from 'vitest'
import {
  checkTripTimes,
  coversGrade,
  currentTrip,
  gradeRange,
  sortTrips,
  tripFor,
} from './trip-times'

const trip = (id, run, time, firstGrade, lastGrade) => ({
  id,
  name: id,
  run,
  time,
  firstGrade,
  lastGrade,
})
const seniorPickup = trip(
  'Senior pickup',
  'morning',
  '06:00',
  'Grade 4',
  'Grade 9',
)
const juniorPickup = trip('Junior pickup', 'morning', '08:00', 'PP1', 'Grade 3')
const juniorDropoff = trip(
  'Junior drop-off',
  'evening',
  '14:00',
  'PP1',
  'Grade 3',
)
const seniorDropoff = trip(
  'Senior drop-off',
  'evening',
  '15:45',
  'Grade 4',
  'Grade 9',
)
const trips = [seniorDropoff, juniorPickup, juniorDropoff, seniorPickup]

describe('grades', () => {
  it('knows which grades a trip covers', () => {
    expect(coversGrade(juniorPickup, 'PP2')).toBe(true)
    expect(coversGrade(juniorPickup, 'Grade 4')).toBe(false)
    expect(coversGrade(juniorPickup, 'Form 1')).toBe(false)
  })

  it('finds the trip a child rides on each run', () => {
    expect(tripFor(trips, 'morning', 'Grade 2')).toBe(juniorPickup)
    expect(tripFor(trips, 'evening', 'Grade 7')).toBe(seniorDropoff)
    expect(tripFor([seniorPickup], 'morning', 'PP1')).toBeNull()
  })

  it('names the grades', () => {
    expect(gradeRange(juniorPickup)).toBe('PP1 – Grade 3')
    expect(gradeRange(trip('x', 'morning', '07:00', 'PP1', 'Grade 9'))).toBe(
      'All grades',
    )
    expect(gradeRange(trip('x', 'morning', '07:00', 'PP2', 'PP2'))).toBe('PP2')
  })
})

describe('sortTrips', () => {
  it('lists pickups first, each run by time', () => {
    expect(sortTrips(trips).map((t) => t.id)).toEqual([
      'Senior pickup',
      'Junior pickup',
      'Junior drop-off',
      'Senior drop-off',
    ])
  })
})

describe('currentTrip', () => {
  const at = (time) => new Date(`2026-10-13T${time}:00+03:00`)

  it('is the trip on now, else the next one, else the last', () => {
    expect(currentTrip(trips, at('05:00')).id).toBe('Senior pickup')
    expect(currentTrip(trips, at('06:52')).id).toBe('Senior pickup')
    expect(currentTrip(trips, at('08:30')).id).toBe('Junior pickup')
    // Two hours after a start, the next trip is shown.
    expect(currentTrip(trips, at('10:30')).id).toBe('Junior drop-off')
    expect(currentTrip(trips, at('21:00')).id).toBe('Senior drop-off')
    expect(currentTrip([], at('06:00'))).toBeNull()
  })
})

describe('checkTripTimes', () => {
  it('accepts trips that cover every grade once per run', () => {
    expect(checkTripTimes(trips)).toEqual({ errors: {}, notes: [] })
  })

  it('refuses two pickups for the same grade', () => {
    const clash = trip('Early pickup', 'morning', '05:45', 'Grade 3', 'Grade 4')
    const result = checkTripTimes([...trips, clash])
    expect(result.errors).toEqual({
      'Early pickup':
        'Shares grades with Junior pickup. Each grade can have only one pickup time.',
    })
  })

  it('notes grades with no pickup or drop-off', () => {
    const result = checkTripTimes([seniorPickup, juniorDropoff])
    expect(result.notes).toEqual([
      'No pickup time for PP1, PP2, Grade 1, Grade 2 and Grade 3.',
      'No drop-off time for Grade 4, Grade 5, Grade 6, Grade 7, Grade 8 and Grade 9.',
    ])
  })
})
