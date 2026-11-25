import { sampleNow } from '@/data/sample-clock'
import { RIDERS } from '@/data/sample-riders'
import { SCHOOL } from '@/data/school'
import { BUSES, DRIVERS, ROUTES, SHIFTS } from '@/data/sample-transport'
import { atNairobiTime, toDateKey } from '@/lib/dates'
import { driverShifts, runStops } from '@/lib/shifts'
import { tripRun } from '@/lib/trip-run'
import { withArrivalTimes } from '@/lib/trip'
import { simulateNetwork } from './mock-network'

// Stand-in for the driver part of the Flask API. Changes are kept in memory
// until the page is reloaded. Every function returns data in the shape the
// real API will send.

export class DriverServiceError extends Error {}

// The logged-in driver. Drivers have no bus or route of their own: the
// admin's schedule puts them on a bus with a route for each shift (FR-3.9,
// FR-3.11), so their runs today are read from today's shifts.
const DRIVER_ID = 'driver-03'

// Today's runs for this driver: each shift that puts them on a bus with a
// route. `bus` carries the route's name for the screens.
function todaysTrips() {
  const today = toDateKey(sampleNow())
  return driverShifts(SHIFTS, today, DRIVER_ID)
    .filter((row) => row.routeId)
    .map((row) => ({
      id: row.id,
      kind: row.run,
      date: row.date,
      busId: row.busId,
      bus: { ...BUSES[row.busId], route: ROUTES[row.routeId].name },
      stops: runStops(ROUTES[row.routeId], row.run),
    }))
}

function findTrip(tripId) {
  const trip = todaysTrips().find((t) => t.id === tripId)
  if (!trip) throw new DriverServiceError('We could not find that trip.')
  return trip
}

// On the sample morning (06:52) the morning trip is already running: the
// students at stops 1 to 7 have been marked, and Liam was absent.
const DONE_BEFORE_SAMPLE = [
  'achieng',
  'kevin',
  'zawadi',
  'mercy',
  'tevin',
  'ian',
  'faith',
  'daniel',
  'neema',
]
const store = {
  phone: DRIVERS[DRIVER_ID].phone,
  trips: {
    'trip-03-am': {
      status: 'active',
      startedAt: atNairobiTime('2026-10-13', '06:15'),
      lastMarkAt: sampleNow(),
      marks: {
        ...Object.fromEntries(
          DONE_BEFORE_SAMPLE.map((id) => [id, { mark: 'picked-up' }]),
        ),
        liam: { mark: 'absent' },
      },
    },
    'trip-03-pm': { status: 'ready', marks: {} },
  },
  lastPosition: null,
}

function tripState(tripId) {
  const state = store.trips[tripId]
  if (!state) throw new DriverServiceError('We could not find that trip.')
  return state
}

function buildTrip(trip) {
  const state = store.trips[trip.id]
  const stops = withArrivalTimes(trip)
  // The students on this bus; each has a stop for the runs they ride.
  const riders = RIDERS[trip.busId] ?? []
  const run = tripRun({ kind: trip.kind, stops, riders, marks: state.marks })
  return {
    id: trip.id,
    kind: trip.kind,
    bus: trip.bus,
    status: state.status,
    startedAt: state.startedAt ?? null,
    startsAt: stops[0].arrivesAt,
    endsAt: stops.at(-1).arrivesAt,
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
  state.status = 'active'
  state.startedAt = sampleNow()
  state.lastMarkAt = sampleNow()
}

// Marks a student picked up, dropped off or absent. `mark: null` undoes it,
// for a tap made by mistake.
export async function markRider(tripId, riderId, mark) {
  await simulateNetwork(250)
  const state = tripState(tripId)
  if (state.status !== 'active') {
    throw new DriverServiceError('Start the trip before marking students.')
  }
  if (mark) state.marks[riderId] = { mark, at: sampleNow() }
  else delete state.marks[riderId]
  state.lastMarkAt = sampleNow()
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
