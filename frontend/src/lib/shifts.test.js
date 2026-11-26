import { describe, expect, it } from 'vitest'
import {
  busShift,
  busStudents,
  checkShift,
  copyShift,
  daysOnRoute,
  driverShifts,
  isPastShift,
  runStops,
  schoolWeek,
  shiftRows,
} from './shifts'

const seniorPickup = {
  id: 'am-senior',
  name: 'Senior pickup',
  run: 'morning',
  time: '06:00',
  firstGrade: 'Grade 4',
  lastGrade: 'Grade 9',
}
const juniorPickup = {
  id: 'am-junior',
  name: 'Junior pickup',
  run: 'morning',
  time: '08:00',
  firstGrade: 'PP1',
  lastGrade: 'Grade 3',
}
const juniorDropoff = {
  id: 'pm-junior',
  name: 'Junior drop-off',
  run: 'evening',
  time: '14:00',
  firstGrade: 'PP1',
  lastGrade: 'Grade 3',
}
const trips = [juniorDropoff, juniorPickup, seniorPickup]

describe('schoolWeek', () => {
  it('gives Monday to Friday of the week', () => {
    const week = [
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
    ]
    expect(schoolWeek('2026-10-13')).toEqual(week)
    expect(schoolWeek('2026-10-12')).toEqual(week)
    expect(schoolWeek('2026-10-18')).toEqual(week) // Sunday
  })
})

describe('isPastShift', () => {
  const at = (time) => new Date(`2026-10-13T${time}:00+03:00`)

  it("keeps today's shift open until a later trip time is on", () => {
    expect(isPastShift('2026-10-13', seniorPickup, trips, at('06:52'))).toBe(
      false,
    )
    expect(isPastShift('2026-10-13', seniorPickup, trips, at('08:05'))).toBe(
      true,
    )
    expect(isPastShift('2026-10-13', juniorPickup, trips, at('08:05'))).toBe(
      false,
    )
    expect(isPastShift('2026-10-12', juniorDropoff, trips, at('06:52'))).toBe(
      true,
    )
    expect(isPastShift('2026-10-14', seniorPickup, trips, at('15:00'))).toBe(
      false,
    )
  })
})

describe('runStops', () => {
  const route = {
    stops: [
      { id: 'depot', time: '06:15' },
      { id: 's1', time: '06:24' },
      { id: 'school', time: '07:41' },
    ],
  }

  it('starts a pickup at the trip time, keeping the gaps', () => {
    expect(runStops(route, juniorPickup)).toEqual([
      { id: 'depot', time: '08:00' },
      { id: 's1', time: '08:09' },
      { id: 'school', time: '09:26' },
    ])
  })

  it('runs a drop-off in reverse from the trip time', () => {
    expect(runStops(route, juniorDropoff)).toEqual([
      { id: 'school', time: '14:00' },
      { id: 's1', time: '15:17' },
      { id: 'depot', time: '15:26' },
    ])
  })
})

const buses = [
  { id: 'bus-01', number: 'Bus 01', seats: 3 },
  { id: 'bus-02', number: 'Bus 02', seats: 40 },
  { id: 'bus-08', number: 'Bus 08', seats: 33 },
]
const drivers = [
  { id: 'mary', name: 'Mary Achieng' },
  { id: 'john', name: 'John Kamau' },
]
const routes = [
  { id: 'lavington', name: 'Lavington route' },
  { id: 'ruaka', name: 'Ruaka route' },
]
const student = (id, busId, routeId, grade = 'Grade 6') => ({
  id,
  grade,
  morningBusId: busId,
  morningRouteId: routeId,
  eveningBusId: null,
  eveningRouteId: null,
})
const students = [
  student('a', 'bus-01', 'lavington'),
  student('b', 'bus-01', 'lavington'),
  student('c', 'bus-01', 'lavington'),
  student('d', 'bus-01', 'ruaka'),
  student('e', 'bus-02', 'ruaka'),
  // A junior on Bus 01: rides the junior pickup, not the senior one.
  student('f', 'bus-01', 'lavington', 'PP2'),
]
const row = (busId, driverId, routeId) => ({ busId, driverId, routeId })
const check = (rows, trip = seniorPickup) =>
  checkShift({ rows, trip, buses, drivers, routes, students })

describe('busStudents', () => {
  it('counts the students on a bus for a trip, by grade and run', () => {
    expect(busStudents(students, 'bus-01', seniorPickup)).toHaveLength(4)
    expect(busStudents(students, 'bus-01', juniorPickup)).toHaveLength(1)
    expect(busStudents(students, 'bus-01', juniorDropoff)).toHaveLength(0)
  })
})

describe('checkShift', () => {
  it('refuses one driver on two buses', () => {
    const result = check([
      row('bus-01', 'mary', 'lavington'),
      row('bus-02', 'mary', 'ruaka'),
    ])
    expect(result.errors).toEqual({
      'bus-02': 'Mary Achieng is already on Bus 01.',
    })
  })

  it('allows two buses on one route', () => {
    const result = check([
      row('bus-01', 'mary', 'ruaka'),
      row('bus-02', 'john', 'ruaka'),
    ])
    expect(result.errors).toEqual({})
  })

  it('warns about seats, missing drivers and students on another route', () => {
    const result = check([
      row('bus-01', null, 'lavington'),
      row('bus-02', 'john', null),
      row('bus-08', null, null),
    ])
    expect(result.rowNotes['bus-01']).toEqual([
      '4 students for 3 seats.',
      'No driver.',
      '1 student on this bus is on another route.',
    ])
    expect(result.rowNotes['bus-02']).toEqual([
      '1 student rides this bus, but it has no route.',
    ])
    expect(result.rowNotes['bus-08']).toBeUndefined()
    expect(result.shiftNotes).toEqual([
      '2 students on the Ruaka route have no bus on it this shift.',
    ])
  })

  it('only counts the students of the trip’s grades', () => {
    const result = check([row('bus-01', 'mary', 'lavington')], juniorPickup)
    expect(result.rowNotes['bus-01']).toBeUndefined()
    expect(result.shiftNotes).toEqual([])
  })
})

describe('copyShift', () => {
  it("copies a shift to other days, replacing those days' rows", () => {
    const shifts = [
      {
        id: 'x1',
        date: '2026-10-12',
        tripId: 'am-senior',
        busId: 'bus-01',
        driverId: 'mary',
        routeId: 'lavington',
      },
      {
        id: 'x2',
        date: '2026-10-13',
        tripId: 'am-senior',
        busId: 'bus-01',
        driverId: 'john',
        routeId: 'ruaka',
      },
      {
        id: 'x3',
        date: '2026-10-13',
        tripId: 'am-junior',
        busId: 'bus-01',
        driverId: 'john',
        routeId: 'ruaka',
      },
    ]
    const copied = copyShift(
      shifts,
      { date: '2026-10-12', tripId: 'am-senior' },
      ['2026-10-13', '2026-10-14'],
    )
    expect(shiftRows(copied, '2026-10-13', 'am-senior')).toEqual([
      {
        id: '2026-10-13-am-senior-bus-01',
        date: '2026-10-13',
        tripId: 'am-senior',
        busId: 'bus-01',
        driverId: 'mary',
        routeId: 'lavington',
      },
    ])
    expect(shiftRows(copied, '2026-10-14', 'am-senior')).toHaveLength(1)
    // The other trip time is untouched.
    expect(shiftRows(copied, '2026-10-13', 'am-junior')[0].driverId).toBe(
      'john',
    )
  })
})

describe('busShift, driverShifts and daysOnRoute', () => {
  const shifts = [
    {
      date: '2026-10-12',
      tripId: 'pm-junior',
      busId: 'bus-03',
      driverId: 'peter',
      routeId: 'kilimani',
    },
    {
      date: '2026-10-12',
      tripId: 'am-senior',
      busId: 'bus-03',
      driverId: 'peter',
      routeId: 'kilimani',
    },
    {
      date: '2026-10-13',
      tripId: 'am-senior',
      busId: 'bus-03',
      driverId: 'joseph',
      routeId: 'karen',
    },
  ]

  it('finds the row for a bus, and the rows for a driver in trip order', () => {
    expect(busShift(shifts, '2026-10-13', 'am-senior', 'bus-03').driverId).toBe(
      'joseph',
    )
    expect(busShift(shifts, '2026-10-13', 'am-junior', 'bus-03')).toBeNull()
    expect(
      driverShifts(shifts, trips, '2026-10-12', 'peter').map((r) => r.tripId),
    ).toEqual(['am-senior', 'pm-junior'])
  })

  it('counts the days a bus runs a route', () => {
    const week = ['2026-10-12', '2026-10-13']
    expect(daysOnRoute(shifts, week, 'am-senior', 'bus-03', 'kilimani')).toBe(1)
  })
})
