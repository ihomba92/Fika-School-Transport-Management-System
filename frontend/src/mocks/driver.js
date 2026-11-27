import { sampleNow } from '@/data/sample-clock'
import { RIDERS } from '@/data/sample-riders'
import { SCHOOL } from '@/data/school'
import {
  BUSES,
  DRIVERS,
  ROUTES,
  SAMPLE_DATE,
  SHIFTS,
} from '@/data/sample-transport'
import { SAMPLE_TRIP_TIMES } from '@/data/trip-times'
import { atNairobiTime, toDateKey } from '@/lib/dates'
import { driverShifts, runStops } from '@/lib/shifts'
import { coversGrade } from '@/lib/trip-times'
import { tripRun } from '@/lib/trip-run'
import { withArrivalTimes } from '@/lib/trip'
import {
  absenceOn,
  isAbsentFor,
  recordAbsence,
  undoAbsence,
} from './attendance-store'
import { simulateNetwork } from './mock-network'

// Stand-in for the driver part of the Flask API. Changes are kept in memory
// until the page is reloaded. Every function returns data in the shape the
// real API will send.

export class DriverServiceError extends Error {}

// The logged-in driver. Drivers have no bus or route of their own: the
// admin's schedule puts them on a bus with a route for each shift (FR-3.9,
// FR-3.11), so their runs today are read from today's shifts, one per trip
// time (the senior pickup, the junior pickup, …).
const DRIVER_ID = 'driver-03'

// Today's runs for this driver: each shift that puts them on a bus with a
// route. `bus` carries the route's name for the screens.
function todaysTrips() {
  const today = toDateKey(sampleNow())
  return driverShifts(SHIFTS, SAMPLE_TRIP_TIMES, today, DRIVER_ID)
    .filter((row) => row.routeId)
    .map((row) => {
      const tripTime = SAMPLE_TRIP_TIMES.find((t) => t.id === row.tripId)
      return {
        id: row.id,
        kind: tripTime.run,
        tripTime,
        name: tripTime.name,
        date: row.date,
        busId: row.busId,
        bus: { ...BUSES[row.busId], route: ROUTES[row.routeId].name },
        stops: runStops(ROUTES[row.routeId], tripTime),
      }
    })
}

function findTrip(tripId) {
  const trip = todaysTrips().find((t) => t.id === tripId)
  if (!trip) throw new DriverServiceError('We could not find that trip.')
  return trip
}

// The students on a trip: the bus's students of the trip time's grades.
function tripRiders(trip) {
  return (RIDERS[trip.busId] ?? []).filter((rider) =>
    coversGrade(trip.tripTime, rider.grade),
  )
}

// On the sample morning (06:52) the senior pickup is running: the seniors
// at stops 1 to 8 have been marked, and Brian was absent (attendance-store).
const DONE_BEFORE_SAMPLE = ['achieng', 'mercy', 'tevin', 'ian', 'wanjiku']
const tripStore = (status, extra = {}) => ({
  status,
  marks: {},
  boarding: {},
  ...extra,
})
const store = {
  phone: DRIVERS[DRIVER_ID].phone,
  trips: {
    'bus-03-trip-senior-pickup': tripStore('active', {
      startedAt: atNairobiTime(SAMPLE_DATE, '06:00'),
      lastMarkAt: sampleNow(),
      marks: {
        ...Object.fromEntries(
          DONE_BEFORE_SAMPLE.map((id) => [id, { mark: 'picked-up' }]),
        ),
        brian: { mark: 'absent' },
      },
    }),
    'bus-03-trip-junior-pickup': tripStore('ready'),
    'bus-03-trip-junior-dropoff': tripStore('ready'),
    'bus-03-trip-senior-dropoff': tripStore('ready'),
  },
  lastPosition: null,
}

function tripState(tripId) {
  const state = store.trips[tripId]
  if (!state) throw new DriverServiceError('We could not find that trip.')
  return state
}

const today = () => toDateKey(sampleNow())

// Why a student isn't expected on a drop-off: absent at their pickup, or
// missing at this trip's boarding check. Null if they are expected (the
// office may have marked them present again).
function absentReason(trip, riderId) {
  if (!isAbsentFor(today(), riderId)) return null
  const absence = absenceOn(today(), riderId)
  if (absence.at === 'boarding' && absence.tripId === trip.id) return null
  return absence.at === 'pickup'
    ? 'Absent this morning'
    : 'Didn’t board at school'
}

// The boarding check at school before a drop-off leaves: every student of
// the trip, marked 'boarded' or 'missing', or absent for the day.
function boardingCheck(trip, state) {
  const riders = tripRiders(trip).map((rider) => {
    const reason = absentReason(trip, rider.id)
    return {
      id: rider.id,
      name: rider.name,
      grade: rider.grade,
      photoUrl: rider.photoUrl,
      guardian: rider.guardian,
      absentReason: reason,
      mark: reason ? null : (state.boarding[rider.id] ?? null),
    }
  })
  const expected = riders.filter((r) => !r.absentReason)
  const count = (mark) => expected.filter((r) => r.mark?.mark === mark).length
  return {
    riders,
    expected: expected.length,
    boarded: count('boarded'),
    missing: count('missing'),
    absent: riders.length - expected.length,
    isComplete: expected.every((r) => r.mark),
  }
}

function buildTrip(trip) {
  const state = store.trips[trip.id]
  const stops = withArrivalTimes(trip)
  const riders = tripRiders(trip)
  // On a drop-off, students absent for the day (or missing at boarding)
  // are marked absent already, and the driver can't change that.
  const marks = { ...state.marks }
  if (trip.kind === 'evening') {
    for (const rider of riders) {
      const missing = state.boarding[rider.id]?.mark === 'missing'
      const reason =
        absentReason(trip, rider.id) ??
        (missing ? 'Didn’t board at school' : null)
      if (reason) marks[rider.id] = { mark: 'absent', isLocked: true, reason }
    }
  }
  const run = tripRun({ kind: trip.kind, stops, riders, marks })
  return {
    id: trip.id,
    kind: trip.kind,
    name: trip.name,
    bus: trip.bus,
    status: state.status,
    startedAt: state.startedAt ?? null,
    startsAt: stops[0].arrivesAt,
    endsAt: stops.at(-1).arrivesAt,
    boarding: trip.kind === 'evening' ? boardingCheck(trip, state) : null,
    ...run,
  }
}

// Where the bus is, for the map. The real app sends the phone's GPS position
// (see useLocationSharing); the mock moves the bus from the last finished
// stop towards the next one over about 90 seconds.
const MOCK_DRIVE_MS = 90_000

function mockBusPosition(trip, state) {
  const { stops, nextStopIndex } = trip
  const from = stops
    .slice(0, nextStopIndex)
    .findLast((stop) => stop.isDone || stop === stops[0])
  const to = stops[nextStopIndex]
  if (!from || from === to) return to.position
  const share = Math.min(
    1,
    (sampleNow() - (state.lastMarkAt ?? state.startedAt)) / MOCK_DRIVE_MS,
  )
  return [
    from.position[0] + (to.position[0] - from.position[0]) * share,
    from.position[1] + (to.position[1] - from.position[1]) * share,
  ]
}

function driverDetails() {
  return { ...DRIVERS[DRIVER_ID], phone: store.phone }
}

// Everything the Today page needs.
export async function getDriverDay() {
  await simulateNetwork(300)
  const trips = todaysTrips().map(buildTrip)
  return {
    driver: driverDetails(),
    // Today's bus: the one in the first shift (usually the same all day).
    bus: trips[0]?.bus ?? null,
    trips,
    activeTripId: trips.find((trip) => trip.status === 'active')?.id ?? null,
  }
}

// The trip being driven now, or null. The Active trip page polls this.
export async function getActiveTrip() {
  await simulateNetwork(200)
  const trip = todaysTrips().find((t) => store.trips[t.id]?.status === 'active')
  if (!trip) return null
  const built = buildTrip(trip)
  return {
    ...built,
    officePhone: SCHOOL.officePhone,
    busPosition: mockBusPosition(built, store.trips[trip.id]),
    updatedAt: sampleNow(),
  }
}

// FR-4.4: "Start trip". Only one trip can run at a time.
export async function startTrip(tripId) {
  await simulateNetwork()
  const state = tripState(tripId)
  const running = Object.values(store.trips).some(
    (trip) => trip.status === 'active',
  )
  if (running) {
    throw new DriverServiceError('Finish the trip you are on first.')
  }
  if (state.status === 'ended') {
    throw new DriverServiceError('This trip has already ended.')
  }
  const trip = buildTrip(findTrip(tripId))
  if (trip.boarding && !trip.boarding.isComplete) {
    throw new DriverServiceError(
      'Check every student at boarding first: on board or not here.',
    )
  }
  state.status = 'active'
  state.startedAt = sampleNow()
  state.lastMarkAt = sampleNow()
}

// Marks a student picked up, dropped off or absent. `mark: null` undoes it,
// for a tap made by mistake. Absent at a pickup means absent for the day:
// the boarding check and the drop-off show it (attendance-store.js).
export async function markRider(tripId, riderId, mark) {
  await simulateNetwork(250)
  const state = tripState(tripId)
  if (state.status !== 'active') {
    throw new DriverServiceError('Start the trip before marking students.')
  }
  const trip = findTrip(tripId)
  const now = sampleNow()
  // Who is on a drop-off was settled at the boarding check: everyone on
  // the bus gets off, so a drop-off has no "absent".
  if (trip.kind === 'evening' && mark === 'absent') {
    throw new DriverServiceError(
      'On a drop-off, mark each child dropped off. Children who didn’t board were marked at school.',
    )
  }
  if (
    trip.kind === 'evening' &&
    buildTrip(trip).stops.some((stop) =>
      stop.riders.some((r) => r.id === riderId && r.mark?.isLocked),
    )
  ) {
    throw new DriverServiceError(
      'This student isn’t on the bus today. The office can change that.',
    )
  }
  if (mark) state.marks[riderId] = { mark, at: now }
  else delete state.marks[riderId]
  if (trip.kind === 'morning') {
    if (mark === 'absent') {
      recordAbsence({
        date: today(),
        studentId: riderId,
        at: 'pickup',
        busId: trip.busId,
        tripId,
        now,
      })
    } else {
      undoAbsence(today(), riderId, tripId)
    }
  }
  state.lastMarkAt = now
}

// The boarding check at school, before a drop-off leaves: the driver marks
// each student 'boarded' or 'missing' (`null` undoes it). A missing student
// is absent from the drop-off and the office is told straight away.
// Students absent at their pickup can't be marked: the office can mark
// them present first.
export async function markBoarding(tripId, riderId, mark) {
  await simulateNetwork(200)
  const state = tripState(tripId)
  const trip = findTrip(tripId)
  if (trip.kind !== 'evening') {
    throw new DriverServiceError('Boarding is checked on drop-offs.')
  }
  if (state.status !== 'ready') {
    throw new DriverServiceError('This trip has already left school.')
  }
  if (!tripRiders(trip).some((r) => r.id === riderId)) {
    throw new DriverServiceError('This student isn’t on this trip.')
  }
  if (absentReason(trip, riderId)) {
    throw new DriverServiceError(
      'This student was absent this morning. The office can mark them present.',
    )
  }
  const now = sampleNow()
  if (mark) state.boarding[riderId] = { mark, at: now }
  else delete state.boarding[riderId]
  if (mark === 'missing') {
    recordAbsence({
      date: today(),
      studentId: riderId,
      at: 'boarding',
      busId: trip.busId,
      tripId,
      now,
    })
  } else {
    undoAbsence(today(), riderId, tripId)
  }
}

// FR-4.4: "End trip", allowed once every student is marked.
export async function endTrip(tripId) {
  await simulateNetwork()
  const state = tripState(tripId)
  const trip = buildTrip(findTrip(tripId))
  if (!trip.isEveryoneMarked) {
    throw new DriverServiceError('Mark every student before ending the trip.')
  }
  state.status = 'ended'
  state.endedAt = sampleNow()
}

// FR-4.5: the phone sends its GPS position every 10–15 s during a trip.
// The mock only remembers it; the server will store it and share it with
// the parents of children on the route.
export async function sendPosition(position) {
  await simulateNetwork(100)
  store.lastPosition = position
}

// The driver's details and today's bus with its route, from the schedule.
export async function getDriverProfile() {
  await simulateNetwork(300)
  return { driver: driverDetails(), bus: todaysTrips()[0]?.bus ?? null }
}

// FR-4.6: drivers can change their own phone number; the change is logged
// and the transport office is told. Name, photo and licence stay admin-only.
export async function updateDriverPhone({ phone }) {
  await simulateNetwork()
  store.phone = phone
  return driverDetails()
}
