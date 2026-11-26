import { describe, expect, it } from 'vitest'
import { absenceLine, presentAgainLine, rideLine } from './student-today-text'

const ride = {
  bus: { number: 'Bus 03' },
  trip: { name: 'Senior pickup' },
  stop: { name: 'Stop 9 · Kirichwa Rd' },
  dueAt: new Date('2026-10-13T06:50:00+03:00'),
}

describe('rideLine', () => {
  it('says where the student is on the trip on now', () => {
    expect(rideLine({ ...ride, kind: 'waiting' })).toEqual({
      title: 'Waiting at Kirichwa Rd',
      detail: 'Bus 03 is due at 06:50 (Senior pickup).',
    })
    expect(rideLine({ ...ride, kind: 'on-bus' }).title).toBe('On Bus 03')
    expect(rideLine({ ...ride, kind: 'at-school' }).title).toBe('At school')
    expect(rideLine({ ...ride, kind: 'not-started' })).toEqual({
      title: "Senior pickup hasn't started",
      detail: 'Bus 03 is due at Kirichwa Rd at 06:50.',
    })
  })
})

describe('absenceLine', () => {
  it('says where and when the student was marked absent', () => {
    const markedAt = new Date('2026-10-13T06:41:00+03:00')
    expect(absenceLine({ at: 'pickup', markedAt }, 'Bus 03')).toEqual({
      title: 'Absent at pickup',
      detail: 'The driver of Bus 03 marked them absent at 06:41.',
    })
    expect(absenceLine({ at: 'boarding', markedAt }, 'Bus 03').title).toBe(
      'Missing at school boarding',
    )
  })
})

describe('presentAgainLine', () => {
  it('says the office marked them present', () => {
    const clearedAt = new Date('2026-10-13T09:15:00+03:00')
    expect(presentAgainLine({ at: 'pickup', clearedAt })).toEqual({
      title: 'Expected on the bus home',
      detail: 'Absent at pickup; marked present by the office at 09:15.',
    })
  })
})
