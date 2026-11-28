import { sampleNow } from '@/data/sample-clock'
import { CURRENT_TERM_ID } from '@/data/fee-settings'
import { MORNING_CONDITIONS, SAMPLE_FLEET } from '@/data/sample-fleet'
import { busLiveStatus } from '@/lib/bus-status'
import { atNairobiTime, toDateKey } from '@/lib/dates'
import {
  dueDatesFor,
  feeStatus,
  planFee,
  splitIntoInstalments,
} from '@/lib/fees'
import { busStudents, runStops, shiftRows, tripStudents } from '@/lib/shifts'
import { PLANS } from '@/config/plans'
import { currentTrip, sortTrips, tripFor } from '@/lib/trip-times'
import { withArrivalTimes } from '@/lib/trip'
import { absenceOn, isAbsentFor } from './attendance-store'

// The in-memory data behind the admin services (admin-service.js for the
// dashboard, live trips and students; fleet-service.js for buses, drivers,
// routes and the schedule), and the read helpers they share. It plays the
// part of the database:
//   buses     id, number, plate, seats
//   drivers   id, name, email, phone, licence, photoUrl
//   routes    id, name, stops
//   tripTimes id, name, run, time, firstGrade, lastGrade  (Trip times)
//   shifts    id, date, tripId, busId, driverId, routeId
//   students  …, stage, morningRouteId, morningBusId, eveningRouteId,
//             eveningBusId  (stage: see data/sample-fleet.js)
//   payments  receipt, studentId, termId, amount, paidAt, status, payer
//   terms     id, name, opens, closes, fee, dueDates   (Fee settings)
// Buses, drivers and routes have no links of their own: each shift row puts
// a bus, a driver and a route together for one trip time (FR-3.9).
// Changes last until the page is reloaded.

export class AdminServiceError extends Error {}

export const store = structuredClone(SAMPLE_FLEET)

// The term whose fees are being paid now. Read it each time: the admin can
// change it in Fee settings.
export function currentTerm() {
  return store.terms.find((term) => term.id === CURRENT_TERM_ID)
}

// What a student's family has paid this term: its successful payments.
export function amountPaid(studentId, termId = CURRENT_TERM_ID) {
  return store.payments
    .filter(
      (p) =>
        p.studentId === studentId && p.termId === termId && p.status === 'paid',
    )
    .reduce((total, p) => total + p.amount, 0)
}

const findIn = (list, id) => list.find((item) => item.id === id) ?? null
export const findBus = (busId) => findIn(store.buses, busId)
export const findDriver = (driverId) => findIn(store.drivers, driverId)
export const findRoute = (routeId) => findIn(store.routes, routeId)

export const findTrip = (tripId) => findIn(store.tripTimes, tripId)

// The trip times, pickups first, each run by time.
export function allTrips() {
  return sortTrips(store.tripTimes)
}

// The trips a student rides: their grade's pickup and drop-off, for the
// runs in their plan. Either can be null.
export function studentTrips(student) {
  const plan = PLANS[student.plan]
  return {
    morning: plan.hasMorning
      ? tripFor(store.tripTimes, 'morning', student.grade)
      : null,
    evening: plan.hasEvening
      ? tripFor(store.tripTimes, 'evening', student.grade)
      : null,
  }
}

export function findStudent(studentId) {
  const student = findIn(store.students, studentId)
  if (!student) throw new AdminServiceError('We could not find that student.')
  return student
}

// The shift that is on now (or next today): its trip time and rows. `trip`
// is null only if the school has no trip times.
export function currentShift(now = sampleNow()) {
  const date = toDateKey(now)
  const trip = currentTrip(store.tripTimes, now)
  return {
    date,
    trip,
    rows: trip ? shiftRows(store.shifts, date, trip.id) : [],
  }
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

// Students on a bus, and on a route, for each trip time ({ tripId: count }),
// for the capacity rule (FR-3.5) and the route screens. Seats are counted
// per trip: the juniors' pickup doesn't take the seniors' seats.
export function busLoad(busId) {
  return Object.fromEntries(
    store.tripTimes.map((trip) => [
      trip.id,
      busStudents(store.students, busId, trip).length,
    ]),
  )
}

export function routeLoad(routeId) {
  return Object.fromEntries(
    store.tripTimes.map((trip) => [
      trip.id,
      tripStudents(store.students, trip).filter(
        (s) => s[`${trip.run}RouteId`] === routeId,
      ).length,
    ]),
  )
}

// Fees as the parent screens work them out, so both sides always agree.
// Students who aren't on a route yet (applied, accepted but waiting for a
// route, or declined) aren't billed. A student
// removed from the bus for unpaid fees still owes them. A student who
// joined mid-term (`joinedOn`) gets 7 days for anything already due.
// `term` can be a changed copy, to preview a Fee settings change.
export function studentFees(student, term = currentTerm()) {
  if (student.stage !== 'on-route')
    return { status: 'not-billed', fee: 0, paid: 0, balance: 0 }
  const fee = planFee(term.fee, student.plan)
  const paid = amountPaid(student.id, term.id)
  const instalments = splitIntoInstalments(
    fee,
    dueDatesFor(term.dueDates, student.joinedOn),
  )
  const today = toDateKey(sampleNow())
  return { fee, paid, ...feeStatus({ fee, paid, instalments, today }) }
}

// An overdue student past the 3-day grace period is flagged for removal; an
// admin must confirm before anyone is taken off a bus (FR-6.6).
function isFlagged(fees) {
  return fees.status === 'overdue' && fees.graceEndsOn < toDateKey(sampleNow())
}

// A student as the screens see it: their route, bus and trip time for each
// run, and their fees.
export function withDetails(student) {
  const fees = studentFees(student)
  const trips = studentTrips(student)
  return {
    ...student,
    morningTrip: trips.morning,
    eveningTrip: trips.evening,
    morningRoute: findRoute(student.morningRouteId),
    morningBus: findBus(student.morningBusId),
    eveningRoute: findRoute(student.eveningRouteId),
    eveningBus: findBus(student.eveningBusId),
    fees,
    isFlagged: isFlagged(fees),
  }
}

const RUNNING = ['on-time', 'late', 'signal-lost']

// Where a student gets off on the drop-off: their drop-off stop, else the
// stop they are picked up at.
export const dropoffStopId = (student) =>
  student.dropoff?.stopId ?? student.pickup?.stopId

// One bus's run today, from its shift row, with its live status (FR-5.4).
// The students are the bus's own students of the trip's grades. On a
// pickup they get on at each stop passed; on a drop-off they get off.
function liveTrip(row, trip, now) {
  const { bus, driver, route } = shiftView(row)
  const stops = withArrivalTimes({
    date: row.date,
    stops: runStops(route, trip),
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
  const isPickup = trip.run === 'morning'
  const stopOf = (s) => (isPickup ? s.pickup?.stopId : dropoffStopId(s))
  const riders = busStudents(store.students, bus.id, trip)
  const passedStopIds = new Set(
    stops.slice(0, status.stopsPassed + 1).map((stop) => stop.id),
  )
  const passed = riders.filter((s) => passedStopIds.has(stopOf(s))).length
  const onBoard =
    status.status === 'arrived'
      ? 0
      : isPickup
        ? passed
        : status.status === 'not-started'
          ? riders.length
          : riders.length - passed

  const delayMs = status.delayMinutes * 60_000

  // The next few stops with the names of the students getting on (or off)
  // there.
  const nextIndex = stops.findIndex((stop) => stop.id === status.nextStop?.id)
  const upcoming =
    nextIndex === -1
      ? []
      : stops.slice(nextIndex, nextIndex + 4).map((stop) => ({
          ...stop,
          arrivesAt: new Date(stop.arrivesAt.getTime() + delayMs),
          riders: riders
            .filter((s) => stopOf(s) === stop.id)
            .map((s) => s.name),
        }))

  return {
    shiftId: row.id,
    trip: { id: trip.id, name: trip.name, run: trip.run, time: trip.time },
    // Every stop with its expected arrival, for a student's "today" status.
    stops: stops.map((stop) => ({
      id: stop.id,
      name: stop.name,
      arrivesAt: new Date(stop.arrivesAt.getTime() + delayMs),
    })),
    // The screens show the bus with this shift's driver and route name.
    bus: { ...bus, driver, route: route.name },
    route: stops.map((stop) => stop.position),
    school: isPickup ? stops.at(-1) : stops[0],
    riderCount: riders.length,
    onBoard,
    upcoming,
    isRunning: RUNNING.includes(status.status),
    ...status,
  }
}

// The runs of the shift on now: every bus with a route in it.
export function liveTrips(now = sampleNow()) {
  const { trip, rows } = currentShift(now)
  return rows
    .filter((row) => row.routeId)
    .map((row) => liveTrip(row, trip, now))
}

// Where a student is today, for their profile: absent (and whether the
// office has marked them present again), and, if their trip is the one on
// now, where they are on it.
//   ride  { kind: 'not-started' | 'waiting' | 'on-bus' | 'at-school' |
//           'dropped-off', trip, bus, stop, dueAt }   or null
export function studentToday(student, now = sampleNow()) {
  const date = toDateKey(now)
  const absence = absenceOn(date, student.id)
  const { trip } = currentShift(now)
  const mine = trip ? studentTrips(student)[trip.run] : null
  // A student absent at pickup didn't ride it, even once the office has
  // marked them present for the ride home.
  const missedThisTrip =
    isAbsentFor(date, student.id) ||
    (absence?.at === 'pickup' && trip?.run === 'morning')
  let ride = null
  if (mine && mine.id === trip.id && !missedThisTrip) {
    const busId = student[`${trip.run}BusId`]
    const live = liveTrips(now).find((t) => t.bus.id === busId)
    if (live) ride = rideStatus(student, trip, live)
  }
  return {
    date,
    absence: absence && {
      ...absence,
      busNumber: findBus(absence.busId)?.number ?? 'the bus',
    },
    ride,
    trips: studentTrips(student),
  }
}

function rideStatus(student, trip, live) {
  const isPickup = trip.run === 'morning'
  const stopId = isPickup ? student.pickup?.stopId : dropoffStopId(student)
  const index = live.stops.findIndex((stop) => stop.id === stopId)
  const stop = live.stops[index] ?? null
  const passed = index !== -1 && index <= live.stopsPassed
  const base = {
    trip: live.trip,
    bus: { id: live.bus.id, number: live.bus.number },
    stop: stop && { id: stop.id, name: stop.name },
    dueAt: stop?.arrivesAt ?? null,
  }
  if (live.status === 'not-started') return { ...base, kind: 'not-started' }
  if (isPickup) {
    if (live.status === 'arrived') return { ...base, kind: 'at-school' }
    return { ...base, kind: passed ? 'on-bus' : 'waiting' }
  }
  return { ...base, kind: passed ? 'dropped-off' : 'on-bus' }
}
