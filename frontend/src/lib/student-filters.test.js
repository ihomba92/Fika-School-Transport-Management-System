import { describe, expect, it } from 'vitest'
import { ALL, filterStudents } from './student-filters'

const students = [
  {
    name: 'Wanjiku Mwangi',
    grade: 'Grade 4',
    plan: 'both',
    guardian: { name: 'Jane Mwangi', phone: '+254722118340' },
    morningBusId: 'bus-03',
    eveningBusId: 'bus-03',
    fees: { status: 'paid' },
  },
  {
    name: 'Baraka Mwangi',
    grade: 'Grade 1',
    plan: 'morning',
    guardian: { name: 'Jane Mwangi', phone: '+254722118340' },
    morningBusId: 'bus-03',
    eveningBusId: null,
    fees: { status: 'overdue' },
  },
  {
    name: 'Amani Kariuki',
    grade: 'Grade 2',
    plan: 'both',
    guardian: { name: 'Lucy Kariuki', phone: '+254790331864' },
    morningBusId: null,
    eveningBusId: null,
    isWaiting: true,
    fees: { status: 'paid' },
  },
]
const none = { search: '', grade: ALL, plan: ALL, bus: ALL, fees: ALL }
const names = (filters) =>
  filterStudents(students, { ...none, ...filters }).map((s) => s.name)

describe('filterStudents', () => {
  it('returns everyone with no filters', () => {
    expect(names({})).toHaveLength(3)
  })

  it('searches names, guardians and phone numbers', () => {
    expect(names({ search: 'baraka' })).toEqual(['Baraka Mwangi'])
    expect(names({ search: 'Lucy K' })).toEqual(['Amani Kariuki'])
    expect(names({ search: '0722 118' })).toEqual([
      'Wanjiku Mwangi',
      'Baraka Mwangi',
    ])
  })

  it('filters by plan, bus, waiting and fees together', () => {
    expect(names({ plan: 'morning' })).toEqual(['Baraka Mwangi'])
    expect(names({ bus: 'waiting' })).toEqual(['Amani Kariuki'])
    expect(names({ bus: 'bus-03', fees: 'overdue' })).toEqual(['Baraka Mwangi'])
  })
})
