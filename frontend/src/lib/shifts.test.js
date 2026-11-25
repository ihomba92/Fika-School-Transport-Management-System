import { describe, expect, it } from 'vitest'
import {
  busShift,
  busStudents,
  daysOnRoute,
  driverShifts,
  checkShift,
  copyShift,
  currentRun,
  isPastShift,
  runStops,
  schoolWeek,
  shiftRows,
} from './shifts'

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

describe('currentRun and isPastShift', () => {
  const morning = new Date('2026-10-13T06:52:00+03:00')
  const afternoon = new Date('2026-10-13T14:00:00+03:00')

  it('is the morning run until noon in Nairobi', () => {
    expect(currentRun(morning)).toBe('morning')
    expect(currentRun(afternoon)).toBe('evening')
  })

  it("keeps today's running shift open for changes", () => {
    expect(isPastShift('2026-10-13', 'morning', morning)).toBe(false)
    expect(isPastShift('2026-10-13', 'morning', afternoon)).toBe(true)
    expect(isPastShift('2026-10-12', 'evening', morning)).toBe(true)
    expect(isPastShift('2026-10-14', 'morning', afternoon)).toBe(false)
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

  it('runs the evening in reverse from 15:45, keeping the gaps', () => {
    expect(runStops(route, 'morning')).toBe(route.stops)
    expect(runStops(route, 'evening')).toEqual([
      { id: 'school', time: '15:45' },
      { id: 's1', time: '17:02' },
      { id: 'depot', time: '17:11' },
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
const student = (id, busId, routeId) => ({
  id,
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
]
const row = (busId, driverId, routeId) => ({ busId, driverId, routeId })
const check = (rows) =>
  checkShift({ rows, run: 'morning', buses, drivers, routes, students })

describe('busStudents', () => {
  it('counts the students on a bus for a run', () => {
    expect(busStudents(students, 'bus-01', 'morning')).toHaveLength(4)
    expect(busStudents(students, 'bus-01', 'evening')).toHaveLength(0)
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
})

describe('copyShift', () => {
  it("copies a shift to other days, replacing those days' rows", () => {
    const shifts = [
      {
        id: 'x1',
        date: '2026-10-12',
        run: 'morning',
        busId: 'bus-01',
        driverId: 'mary',
        routeId: 'lavington',
      },
      {
        id: 'x2',
        date: '2026-10-13',
        run: 'morning',
        busId: 'bus-01',
        driverId: 'john',
        routeId: 'ruaka',
      },
      {
        id: 'x3',
        date: '2026-10-13',
        run: 'evening',
        busId: 'bus-01',
        driverId: 'john',
        routeId: 'ruaka',
      },
    ]
    const copied = copyShift(shifts, { date: '2026-10-12', run: 'morning' }, [
      '2026-10-13',
      '2026-10-14',
    ])
    expect(shiftRows(copied, '2026-10-13', 'morning')).toEqual([
      {
        id: '2026-10-13-morning-bus-01',
        date: '2026-10-13',
        run: 'morning',
        busId: 'bus-01',
        driverId: 'mary',
        routeId: 'lavington',
      },
    ])
    expect(shiftRows(copied, '2026-10-14', 'morning')).toHaveLength(1)
    // The evening is untouched.
    expect(shiftRows(copied, '2026-10-13', 'evening')[0].driverId).toBe('john')
  })
})

describe('busShift, driverShifts and daysOnRoute', () => {
  const shifts = [
    {
      date: '2026-10-12',
      run: 'morning',
      busId: 'bus-03',
      driverId: 'peter',
      routeId: 'kilimani',
    },
    {
      date: '2026-10-12',
      run: 'evening',
      busId: 'bus-03',
      driverId: 'peter',
      routeId: 'kilimani',
    },
    {
      date: '2026-10-13',
      run: 'morning',
      busId: 'bus-03',
      driverId: 'joseph',
      routeId: 'karen',
    },
  ]

  it('finds the row for a bus, and the rows for a driver', () => {
    expect(busShift(shifts, '2026-10-13', 'morning', 'bus-03').driverId).toBe(
      'joseph',
    )
    expect(busShift(shifts, '2026-10-13', 'evening', 'bus-03')).toBeNull()
    expect(
      driverShifts(shifts, '2026-10-12', 'peter').map((r) => r.run),
    ).toEqual(['morning', 'evening'])
  })

  it('counts the days a bus runs a route', () => {
    const week = ['2026-10-12', '2026-10-13']
    expect(daysOnRoute(shifts, week, 'morning', 'bus-03', 'kilimani')).toBe(1)
  })
})
