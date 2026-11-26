import { PLANS } from '@/config/plans'
import { sampleNow } from '@/data/sample-clock'
import { SCHOOL_LOCATION } from '@/data/sample-transport'
import { toDateKey } from '@/lib/dates'
import { nextBusNumber, samePlate } from '@/lib/fleet'
import { OWN_BUS_SIZE, groupByArea, placementOptions } from '@/lib/grouping'
import { freeBusSuggestion, routeFit } from '@/lib/route-fit'
import {
  busStudents,
  checkShift,
  copyShift,
  isPastShift,
  runStops,
  schoolWeek,
  shiftId,
  shiftRows,
} from '@/lib/shifts'
import { checkTripTimes, gradeIndex } from '@/lib/trip-times'
import {
  AdminServiceError,
  allTrips,
  busLoad,
  currentShift,
  findBus,
  findDriver,
  findRoute,
  findTrip,
  routeLoad,
  shiftView,
  store,
  studentTrips,
} from './admin-store'
import { simulateNetwork } from './mock-network'

// Stand-in for the Flask API's buses, drivers, routes and schedule (FR-3.1,
// FR-3.8 to FR-3.11). Buses, drivers and routes are separate lists; the
// schedule puts them together, one shift (one trip time on one day) at a
// time. The trip times themselves are set here too.

export { AdminServiceError }

// ── Buses and drivers ────────────────────────────────────────────────────

// Every bus and every driver, with what each does in the shift on now.
export async function getFleet() {
  await simulateNetwork(250)
  const shift = currentShift()
  const views = shift.rows.map(shiftView)
  return {
    shift: { date: shift.date, trip: shift.trip },
    trips: allTrips(),
    buses: store.buses.map((bus) => {
      const row = views.find((r) => r.busId === bus.id)
      return {
        ...bus,
        load: busLoad(bus.id),
        now: { driver: row?.driver ?? null, route: row?.route ?? null },
      }
    }),
    drivers: store.drivers.map((driver) => {
      const row = views.find((r) => r.driverId === driver.id)
      return {
        ...driver,
        now: row ? { bus: row.bus, route: row.route } : null,
      }
    }),
  }
}

// FR-3.9: an admin adds a bus. It is in every shift from now on, with no
// driver or route until the admin schedules it.
export async function createBus(values) {
  await simulateNetwork()
  const existing = store.buses.find((bus) => samePlate(bus.plate, values.plate))
  if (existing) {
    throw new AdminServiceError(
      `${values.plate} is already on the list as ${existing.number}.`,
    )
  }
  const number = nextBusNumber(store.buses)
  const bus = {
    id: `bus-${number.replace(/\D/g, '')}`,
    number,
    plate: values.plate,
    seats: values.seats,
  }
  store.buses.push(bus)
  return bus
}

// FR-1.2, FR-3.1, FR-3.8: an admin creates a driver account. The photo is
// required. The real API emails a temporary password, which the driver must
// change at first log in.
export async function createDriver(values) {
  await simulateNetwork()
  if (store.drivers.some((driver) => driver.email === values.email)) {
    throw new AdminServiceError('A driver with this email already exists.')
  }
  const driver = {
    id: crypto.randomUUID(),
    name: values.fullName,
    email: values.email,
    phone: values.phone,
    licence: values.licence,
    // The real API stores the uploaded file and returns its address.
    photoUrl: URL.createObjectURL(values.photo),
  }
  store.drivers.push(driver)
  return driver
}

// ── Schedule ─────────────────────────────────────────────────────────────

// One shift with a row for every bus: the saved row, or an empty one.
function rowsFor(date, tripId) {
  const saved = shiftRows(store.shifts, date, tripId)
  return store.buses.map(
    (bus) =>
      saved.find((row) => row.busId === bus.id) ?? {
        id: shiftId(date, tripId, bus.id),
        date,
        tripId,
        busId: bus.id,
        driverId: null,
        routeId: null,
      },
  )
}

// FR-3.11: a school week of shifts, one per trip time per day, with
// everything the Schedule screen needs to check a shift before saving it.
export async function getSchedule(weekOf) {
  await simulateNetwork(250)
  const now = sampleNow()
  const week = schoolWeek(weekOf ?? toDateKey(now))
  const trips = allTrips()
  return {
    week,
    today: toDateKey(now),
    current: currentShift(now),
    trips,
    shifts: week.flatMap((date) =>
      trips.flatMap((trip) => rowsFor(date, trip.id)),
    ),
    past: Object.fromEntries(
      week.flatMap((date) =>
        trips.map((trip) => [
          `${date}-${trip.id}`,
          isPastShift(date, trip, store.tripTimes, now),
        ]),
      ),
    ),
    buses: store.buses,
    drivers: store.drivers.map(({ id, name, photoUrl }) => ({
      id,
      name,
      photoUrl,
    })),
    routes: store.routes.map(({ id, name }) => ({ id, name })),
    students: store.students.map((s) => ({
      id: s.id,
      grade: s.grade,
      morningRouteId: s.morningRouteId,
      morningBusId: s.morningBusId,
      eveningRouteId: s.eveningRouteId,
      eveningBusId: s.eveningBusId,
    })),
  }
}

function tripOrThrow(tripId) {
  const trip = findTrip(tripId)
  if (!trip) throw new AdminServiceError('We could not find that trip time.')
  return trip
}

function assertCanChange(date, trip) {
  if (isPastShift(date, trip, store.tripTimes, sampleNow())) {
    throw new AdminServiceError(
      'That shift has finished, so it can no longer be changed.',
    )
  }
}

// Saves one shift: for each bus, its driver and route. Any shift that
// hasn't finished can be changed, including the one running now (a driver
// can fall ill, a bus can break down): parents and drivers see the change
// the next time their screen loads.
export async function saveShift(date, tripId, rows) {
  await simulateNetwork()
  const trip = tripOrThrow(tripId)
  assertCanChange(date, trip)
  const clean = rows.map((row) => {
    if (!findBus(row.busId)) throw new AdminServiceError('Unknown bus.')
    if (row.driverId && !findDriver(row.driverId)) {
      throw new AdminServiceError('Unknown driver.')
    }
    if (row.routeId && !findRoute(row.routeId)) {
      throw new AdminServiceError('Unknown route.')
    }
    return {
      id: shiftId(date, tripId, row.busId),
      date,
      tripId,
      busId: row.busId,
      driverId: row.driverId || null,
      routeId: row.routeId || null,
    }
  })
  const { errors } = checkShift({
    rows: clean,
    trip,
    buses: store.buses,
    drivers: store.drivers,
    routes: store.routes,
    students: store.students,
  })
  const firstError = Object.values(errors)[0]
  if (firstError) throw new AdminServiceError(firstError)

  store.shifts = [
    ...store.shifts.filter(
      (row) => !(row.date === date && row.tripId === tripId),
    ),
    ...clean,
  ]
}

// Copies a saved shift to the same trip time on the later days of its week.
export async function copyShiftToRestOfWeek(date, tripId) {
  await simulateNetwork()
  const trip = tripOrThrow(tripId)
  const now = sampleNow()
  const later = schoolWeek(date).filter(
    (day) => day > date && !isPastShift(day, trip, store.tripTimes, now),
  )
  store.shifts = copyShift(
    [
      ...store.shifts.filter((r) => !(r.date === date && r.tripId === tripId)),
      ...rowsFor(date, tripId),
    ],
    { date, tripId },
    later,
  )
  return later
}

// ── Trip times ───────────────────────────────────────────────────────────

// The school's trip times, pickups first, with how many students ride each
// and any grades left without a pickup or drop-off.
export async function getTripTimes() {
  await simulateNetwork(200)
  const trips = allTrips()
  return {
    trips: trips.map((trip) => ({
      ...trip,
      studentCount: store.students.filter(
        (s) =>
          s.stage === 'on-route' && studentTrips(s)[trip.run]?.id === trip.id,
      ).length,
    })),
    notes: checkTripTimes(trips).notes,
  }
}

// Adds a trip time (`tripId` null) or changes one. `values` come from the
// trip time form: { name, run, time, firstGrade, lastGrade }. A grade can
// have only one pickup and one drop-off, so each child's trip is clear.
// A new trip time starts with no shifts: the admin plans its buses in the
// schedule.
export async function saveTripTime(tripId, values) {
  await simulateNetwork()
  const existing = tripId ? tripOrThrow(tripId) : null
  if (gradeIndex(values.firstGrade) > gradeIndex(values.lastGrade)) {
    throw new AdminServiceError('The first grade must come before the last.')
  }
  const trip = {
    id: existing?.id ?? `trip-${crypto.randomUUID().slice(0, 8)}`,
    name: values.name,
    run: values.run,
    time: values.time,
    firstGrade: values.firstGrade,
    lastGrade: values.lastGrade,
  }
  const trips = existing
    ? store.tripTimes.map((t) => (t.id === trip.id ? trip : t))
    : [...store.tripTimes, trip]
  const error = checkTripTimes(trips).errors[trip.id]
  if (error) throw new AdminServiceError(error)
  // A trip time keeps its run: its shifts' buses and students depend on it.
  if (existing && existing.run !== trip.run) {
    throw new AdminServiceError(
      'A pickup can’t become a drop-off. Add a new trip time instead.',
    )
  }
  store.tripTimes = trips
  return trip
}

// Removes a trip time and its shifts from today on. Children of its grades
// have no bus on that run until another trip time covers them. (The real
// API keeps past shifts as records.)
export async function deleteTripTime(tripId) {
  await simulateNetwork()
  const trip = tripOrThrow(tripId)
  const today = toDateKey(sampleNow())
  store.tripTimes = store.tripTimes.filter((t) => t.id !== trip.id)
  store.shifts = store.shifts.filter(
    (row) => row.tripId !== trip.id || row.date < today,
  )
}

// ── Routes ───────────────────────────────────────────────────────────────

// Every route with the buses on it in the shift on now, how well its
// students fit their seats, a free bus that would help, and its stops with
// the students at each (FR-3.10).
export async function getRoutes() {
  await simulateNetwork(250)
  const shift = currentShift()
  const views = shift.rows.map(shiftView)
  const freeBuses = views.filter((row) => !row.routeId).map((row) => row.bus)

  const { trip } = shift
  const timesTrip =
    trip.run === 'morning'
      ? trip
      : (allTrips().find((t) => t.run === 'morning') ?? trip)
  const routes = store.routes.map((route) => {
    const onRoute = views
      .filter((row) => row.routeId === route.id)
      .map((row) => ({
        bus: row.bus,
        driver: row.driver,
        students: busStudents(store.students, row.busId, trip).length,
      }))
    const seats = onRoute.length
      ? onRoute.reduce((total, r) => total + r.bus.seats, 0)
      : null
    const load = routeLoad(route.id)
    // The seats this shift needs: the route's students on this trip.
    const fit = routeFit({ [trip.id]: load[trip.id] ?? 0 }, seats)
    const riders = store.students.filter((s) => s.morningRouteId === route.id)
    return {
      id: route.id,
      name: route.name,
      buses: onRoute,
      seats,
      load,
      fit,
      studentCount: store.students.filter(
        (s) => s.morningRouteId === route.id || s.eveningRouteId === route.id,
      ).length,
      suggestion: freeBusSuggestion(fit, seats, onRoute.length, freeBuses),
      // Stop times as on a pickup: this shift's if it is one, else the
      // first pickup of the day.
      stops: runStops(route, timesTrip).map((stop) => ({
        ...stop,
        riders: riders
          .filter((s) => s.pickup.stopId === stop.id)
          .map(({ id, name, grade }) => ({ id, name, grade })),
      })),
      withoutStop: riders.filter((s) => !s.pickup.stopId).length,
    }
  })
  return {
    shift: { date: shift.date, trip },
    timesTrip,
    routes,
    freeBuses,
  }
}

const SCHOOL = {
  name: SCHOOL_LOCATION.name,
  position: SCHOOL_LOCATION.position,
}

// A blank route for "New route": one starting stop, and the school.
export async function getNewRoute() {
  await simulateNetwork(100)
  return {
    name: '',
    stops: [
      { name: '', time: '06:15', position: null, studentCount: 0 },
      { id: 'school', ...SCHOOL, time: '07:30' },
    ],
    school: SCHOOL,
  }
}

// One route for the editor, with how many students use each stop (a stop
// with students can't be removed), and where the school is.
export async function getRoute(routeId) {
  await simulateNetwork(200)
  const route = findRoute(routeId)
  if (!route) throw new AdminServiceError('We could not find that route.')
  return {
    ...route,
    school: SCHOOL,
    stops: route.stops.map((stop) => ({
      ...stop,
      studentCount: store.students.filter(
        (s) => s.pickup?.stopId === stop.id || s.dropoff?.stopId === stop.id,
      ).length,
    })),
  }
}

// FR-3.10: create a route, or change one (`routeId` given). `values` come
// from the route form: { name, stops: [{ id?, name, landmark, time,
// position }], schoolTime }. The school is always the last stop.
export async function saveRoute(routeId, values) {
  await simulateNetwork()
  const nameTaken = store.routes.some(
    (route) =>
      route.id !== routeId &&
      route.name.toLowerCase() === values.name.toLowerCase(),
  )
  if (nameTaken) {
    throw new AdminServiceError(
      `There is already a route called ${values.name}.`,
    )
  }
  const existing = routeId ? findRoute(routeId) : null
  if (routeId && !existing) {
    throw new AdminServiceError('We could not find that route.')
  }
  const id = existing?.id ?? `route-${crypto.randomUUID().slice(0, 8)}`

  // A stop that students use can't disappear from under them.
  const keptIds = new Set(values.stops.map((stop) => stop.id).filter(Boolean))
  const removedInUse = (existing?.stops ?? []).find(
    (stop) =>
      stop.id !== 'school' &&
      !keptIds.has(stop.id) &&
      store.students.some((s) => s.pickup?.stopId === stop.id),
  )
  if (removedInUse) {
    throw new AdminServiceError(
      `Students are picked up at ${removedInUse.name}. Move them to another stop before removing it.`,
    )
  }

  const route = {
    id,
    name: values.name,
    stops: [
      ...values.stops.map((stop) => ({
        id: stop.id || `${id}-${crypto.randomUUID().slice(0, 8)}`,
        name: stop.name,
        landmark: stop.landmark || undefined,
        position: stop.position,
        time: stop.time,
      })),
      {
        id: 'school',
        name: SCHOOL_LOCATION.name,
        position: SCHOOL_LOCATION.position,
        landmark: SCHOOL_LOCATION.detail,
        time: values.schoolTime,
      },
    ],
  }
  store.routes = existing
    ? store.routes.map((r) => (r.id === id ? route : r))
    : [...store.routes, route]
  return route
}

// ── Accepted students who need a route ───────────────────────────────────

// Groups the admin dismissed; they stay waiting, with no suggestion, until
// the page is reloaded (the real API stores this).
const dismissedGroups = new Set()

// The buses the schedule puts on a route this week, with their students per
// trip time and on how many days each is on it.
function busesOnRouteThisWeek(routeId) {
  const week = schoolWeek(toDateKey(sampleNow()))
  const onRoute = store.shifts.filter(
    (row) => week.includes(row.date) && row.routeId === routeId,
  )
  const busIds = new Set(onRoute.map((row) => row.busId))
  return [...busIds].map((busId) => ({
    ...findBus(busId),
    load: busLoad(busId),
    days: new Set(
      onRoute.filter((row) => row.busId === busId).map((row) => row.date),
    ).size,
  }))
}

// How many of `students` ride each trip time: { tripId: count }.
function tripNeeds(students) {
  const needs = {}
  for (const student of students) {
    for (const trip of Object.values(studentTrips(student))) {
      if (trip) needs[trip.id] = (needs[trip.id] ?? 0) + 1
    }
  }
  return needs
}

// "Kileleshwa, Nairobi" → "Kileleshwa", the name most of the group shares.
function areaName(students) {
  const names = students.map((s) => s.pickup.address.split(',')[0].trim())
  return names
    .toSorted(
      (a, b) =>
        names.filter((n) => n === b).length -
        names.filter((n) => n === a).length,
    )
    .at(0)
}

const groupId = (students) =>
  students
    .map((s) => s.id)
    .toSorted()
    .join('+')

// FR-3.3, FR-3.4: accepted students who need a route, grouped by where
// they live, each group with the ways it could be placed (route, bus and
// nearest stop), best first. Seats are counted per trip time.
export async function getWaitingGroups() {
  await simulateNetwork(250)
  const waiting = store.students.filter(
    (s) => s.stage === 'needs-route' && s.pickup?.position,
  )
  const groups = groupByArea(waiting).map((group) => {
    const needs = tripNeeds(group.students)
    return {
      id: groupId(group.students),
      area: areaName(group.students),
      students: group.students.map(({ id, name, grade, plan }) => ({
        id,
        name,
        grade,
        plan,
      })),
      spreadKm: group.spreadKm,
      needs,
      // Big enough to fill a bus of their own (FR-3.3).
      canFillBus: group.students.length >= OWN_BUS_SIZE,
      options: placementOptions(
        group,
        store.routes,
        busesOnRouteThisWeek,
        needs,
      ),
    }
  })
  const shown = groups.filter((group) => !dismissedGroups.has(group.id))
  return {
    groups: shown,
    waitingCount: waiting.length,
    dismissedCount: groups.length - shown.length,
    trips: allTrips(),
  }
}

// FR-3.6: the admin approves a group's placement (the suggested one, or
// another they chose): each student gets the route and bus for the runs in
// their plan, and the stop for pickup. Seats are checked for the whole
// group first, so it is placed all together or not at all.
export async function approveGroup(studentIds, { routeId, busId, stopId }) {
  await simulateNetwork()
  const route = findRoute(routeId)
  const bus = findBus(busId)
  if (!route || !bus || !route.stops.some((stop) => stop.id === stopId)) {
    throw new AdminServiceError('We could not find that route, bus or stop.')
  }
  const students = studentIds.map((id) =>
    store.students.find((s) => s.id === id),
  )
  if (students.some((s) => s?.stage !== 'needs-route')) {
    throw new AdminServiceError(
      'Some of these students already have a bus. Reload to see the latest.',
    )
  }
  const load = busLoad(bus.id)
  for (const [tripId, joining] of Object.entries(tripNeeds(students))) {
    const free = bus.seats - (load[tripId] ?? 0)
    if (joining > free) {
      throw new AdminServiceError(
        `${bus.number} has ${free} free seats on the ${findTrip(tripId).name.toLowerCase()}, not ${joining}.`,
      )
    }
  }
  for (const student of students) {
    const plan = PLANS[student.plan]
    student.morningRouteId = plan.hasMorning ? route.id : null
    student.morningBusId = plan.hasMorning ? bus.id : null
    student.eveningRouteId = plan.hasEvening ? route.id : null
    student.eveningBusId = plan.hasEvening ? bus.id : null
    student.pickup = { ...student.pickup, stopId }
    student.stage = 'on-route'
    // Fees start now, with 7 days for anything already due.
    student.joinedOn = toDateKey(sampleNow())
  }
  return { route: { id: route.id, name: route.name }, bus }
}

// FR-3.6: the admin rejects a suggestion. The students still need a route.
export async function dismissGroup(id) {
  await simulateNetwork(200)
  dismissedGroups.add(id)
}
