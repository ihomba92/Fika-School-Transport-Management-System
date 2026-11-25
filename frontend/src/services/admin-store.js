import { sampleNow } from '@/data/sample-clock'
import { CURRENT_TERM_ID, TERMS } from '@/data/fee-settings'
import { MORNING_CONDITIONS, SAMPLE_FLEET } from '@/data/sample-fleet'
import { busLiveStatus } from '@/lib/bus-status'
import { atNairobiTime, toDateKey } from '@/lib/dates'
import { feeStatus, planFee, splitIntoInstalments } from '@/lib/fees'
import { currentRun, runStops, shiftRows } from '@/lib/shifts'
import { withArrivalTimes } from '@/lib/trip'

// The in-memory data behind the admin services (admin-service.js for the
// dashboard, live trips and students; fleet-service.js for buses, drivers,
// routes and the schedule), and the read helpers they share. It plays the
// part of the database:
//   buses     id, number, plate, seats
//   drivers   id, name, email, phone, licence, photoUrl
//   routes    id, name, stops
//   shifts    id, date, run, busId, driverId, routeId
//   students  …, morningRouteId, morningBusId, eveningRouteId, eveningBusId
// Buses, drivers and routes have no links of their own: each shift row puts
// a bus, a driver and a route together for one run (FR-3.9).
// Changes last until the page is reloaded.

export class AdminServiceError extends Error {}

export const store = structuredClone(SAMPLE_FLEET)

export const currentTerm = TERMS.find((term) => term.id === CURRENT_TERM_ID)

const findIn = (list, id) => list.find((item) => item.id === id) ?? null
export const findBus = (busId) => findIn(store.buses, busId)
export const findDriver = (driverId) => findIn(store.drivers, driverId)
export const findRoute = (routeId) => findIn(store.routes, routeId)

export function findStudent(studentId) {
  const student = findIn(store.students, studentId)
  if (!student) throw new AdminServiceError('We could not find that student.')
  return student
}

// The shift that is on now (or next): today's morning until noon, then
// today's evening.
export function currentShift(now = sampleNow()) {
  const date = toDateKey(now)
  const run = currentRun(now)
  return { date, run, rows: shiftRows(store.shifts, date, run) }
}

// A shift row with its bus, driver and route filled in.
export function shiftView(row) {
  return {
    ...row,
    bus: findBus(row.busId),
    driver: findDriver(row.driverId),
    route: findRoute(row.routeId),
  }
}

// Students on a bus, and on a route, for each run, for the capacity rule
// (FR-3.5) and the route screens.
export function busLoad(busId) {
  return {
    morning: store.students.filter((s) => s.morningBusId === busId).length,
    evening: store.students.filter((s) => s.eveningBusId === busId).length,
  }
}

export function routeLoad(routeId) {
  return {
    morning: store.students.filter((s) => s.morningRouteId === routeId).length,
    evening: store.students.filter((s) => s.eveningRouteId === routeId).length,
  }
}

// Fees as the parent screens work them out, so both sides always agree.
// Students without a bus aren't billed yet.
function studentFees(student) {
  if (student.isWaiting)
    return { status: 'not-billed', fee: 0, paid: 0, balance: 0 }
  const fee = planFee(currentTerm.fee, student.plan)
  const paid = Math.round((fee * student.paidShare) / 50) * 50
  const instalments = splitIntoInstalments(fee, currentTerm.dueDates)
  const today = toDateKey(sampleNow())
  return { fee, paid, ...feeStatus({ fee, paid, instalments, today }) }
}

// An overdue student past the 3-day grace period is flagged for removal; an
// admin must confirm before anyone is taken off a bus (FR-6.6).
function isFlagged(fees) {
  return fees.status === 'overdue' && fees.graceEndsOn < toDateKey(sampleNow())
}

// A student as the screens see it: their route and bus for each run, and
// their fees.
export function withDetails(student) {
  const fees = studentFees(student)
  return {
    ...student,
    morningRoute: findRoute(student.morningRouteId),
    morningBus: findBus(student.morningBusId),
    eveningRoute: findRoute(student.eveningRouteId),
    eveningBus: findBus(student.eveningBusId),
    fees,
    isFlagged: isFlagged(fees),
  }
}

const RUNNING = ['on-time', 'late', 'signal-lost']

// One bus's morning run today, from its shift row, with its live status
// (FR-5.4). The students on board are the bus's own students.
function liveTrip(row, now) {
  const { bus, driver, route } = shiftView(row)
  const stops = withArrivalTimes({
    date: row.date,
    stops: runStops(route, 'morning'),
  })
  const condition = MORNING_CONDITIONS[bus.id] ?? {}
  const status = busLiveStatus({
    stops,
    delayMinutes: condition.delayMinutes ?? 0,
    signalLostAt: condition.signalLostAt
      ? atNairobiTime(row.date, condition.signalLostAt)
      : null,
    now,
  })
  const riders = store.students.filter((s) => s.morningBusId === bus.id)
  const passedStopIds = new Set(
    stops.slice(0, status.stopsPassed + 1).map((stop) => stop.id),
  )
  const onBoard =
    status.status === 'arrived'
      ? 0
      : riders.filter((s) => passedStopIds.has(s.pickup.stopId)).length

  // The next few stops with the names of the students waiting there.
  const nextIndex = stops.findIndex((stop) => stop.id === status.nextStop?.id)
  const upcoming =
    nextIndex === -1
      ? []
      : stops.slice(nextIndex, nextIndex + 4).map((stop) => ({
          ...stop,
          arrivesAt: new Date(
            stop.arrivesAt.getTime() + status.delayMinutes * 60_000,
          ),
          riders: riders
            .filter((s) => s.pickup.stopId === stop.id)
            .map((s) => s.name),
        }))

  return {
    shiftId: row.id,
    // The screens show the bus with this shift's driver and route name.
    bus: { ...bus, driver, route: route.name },
    route: stops.map((stop) => stop.position),
    school: stops.at(-1),
    riderCount: riders.length,
    onBoard,
    upcoming,
    isRunning: RUNNING.includes(status.status),
    ...status,
  }
}

// Today's morning runs: every bus with a route in today's morning shift.
export function liveTrips(now = sampleNow()) {
  return shiftRows(store.shifts, toDateKey(now), 'morning')
    .filter((row) => row.routeId)
    .map((row) => liveTrip(row, now))
}
