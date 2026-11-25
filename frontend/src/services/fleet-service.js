import { sampleNow } from '@/data/sample-clock'
import { SCHOOL_LOCATION } from '@/data/sample-transport'
import { toDateKey } from '@/lib/dates'
import { nextBusNumber, samePlate } from '@/lib/fleet'
import { freeBusSuggestion, routeFit } from '@/lib/route-fit'
import {
  RUNS,
  busStudents,
  checkShift,
  copyShift,
  isPastShift,
  schoolWeek,
  shiftId,
  shiftRows,
} from '@/lib/shifts'
import {
  AdminServiceError,
  busLoad,
  currentShift,
  findBus,
  findDriver,
  findRoute,
  routeLoad,
  shiftView,
  store,
} from './admin-store'
import { simulateNetwork } from './mock-network'

// Stand-in for the Flask API's buses, drivers, routes and schedule (FR-3.1,
// FR-3.8 to FR-3.11). Buses, drivers and routes are separate lists; the
// schedule puts them together, one shift (one run on one day) at a time.

export { AdminServiceError }

// ── Buses and drivers ────────────────────────────────────────────────────

// Every bus and every driver, with what each does in the shift on now.
export async function getFleet() {
  await simulateNetwork(250)
  const shift = currentShift()
  const views = shift.rows.map(shiftView)
  return {
    shift: { date: shift.date, run: shift.run },
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
function rowsFor(date, run) {
  const saved = shiftRows(store.shifts, date, run)
  return store.buses.map(
    (bus) =>
      saved.find((row) => row.busId === bus.id) ?? {
        id: shiftId(date, run, bus.id),
        date,
        run,
        busId: bus.id,
        driverId: null,
        routeId: null,
      },
  )
}

// FR-3.11: a school week of shifts, morning and evening, with everything
// the Schedule screen needs to check a shift before saving it.
export async function getSchedule(weekOf) {
  await simulateNetwork(250)
  const now = sampleNow()
  const week = schoolWeek(weekOf ?? toDateKey(now))
  return {
    week,
    today: toDateKey(now),
    current: currentShift(now),
    shifts: week.flatMap((date) => RUNS.flatMap((run) => rowsFor(date, run))),
    past: Object.fromEntries(
      week.flatMap((date) =>
        RUNS.map((run) => [`${date}-${run}`, isPastShift(date, run, now)]),
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
      morningRouteId: s.morningRouteId,
      morningBusId: s.morningBusId,
      eveningRouteId: s.eveningRouteId,
      eveningBusId: s.eveningBusId,
    })),
  }
}

function assertCanChange(date, run) {
  if (isPastShift(date, run, sampleNow())) {
    throw new AdminServiceError(
      'That shift has finished, so it can no longer be changed.',
    )
  }
}

// Saves one shift: for each bus, its driver and route. Any shift that
// hasn't finished can be changed, including the one running now (a driver
// can fall ill, a bus can break down): parents and drivers see the change
// the next time their screen loads.
export async function saveShift(date, run, rows) {
  await simulateNetwork()
  assertCanChange(date, run)
  const clean = rows.map((row) => {
    if (!findBus(row.busId)) throw new AdminServiceError('Unknown bus.')
    if (row.driverId && !findDriver(row.driverId)) {
      throw new AdminServiceError('Unknown driver.')
    }
    if (row.routeId && !findRoute(row.routeId)) {
      throw new AdminServiceError('Unknown route.')
    }
    return {
      id: shiftId(date, run, row.busId),
      date,
      run,
      busId: row.busId,
      driverId: row.driverId || null,
      routeId: row.routeId || null,
    }
  })
  const { errors } = checkShift({
    rows: clean,
    run,
    buses: store.buses,
    drivers: store.drivers,
    routes: store.routes,
    students: store.students,
  })
  const firstError = Object.values(errors)[0]
  if (firstError) throw new AdminServiceError(firstError)

  store.shifts = [
    ...store.shifts.filter((row) => !(row.date === date && row.run === run)),
    ...clean,
  ]
}

// Copies a saved shift to the same run on the later days of its week.
export async function copyShiftToRestOfWeek(date, run) {
  await simulateNetwork()
  const now = sampleNow()
  const later = schoolWeek(date).filter(
    (day) => day > date && !isPastShift(day, run, now),
  )
  store.shifts = copyShift(
    [
      ...store.shifts.filter((r) => !(r.date === date && r.run === run)),
      ...rowsFor(date, run),
    ],
    { date, run },
    later,
  )
  return later
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

  const routes = store.routes.map((route) => {
    const onRoute = views
      .filter((row) => row.routeId === route.id)
      .map((row) => ({
        bus: row.bus,
        driver: row.driver,
        students: busStudents(store.students, row.busId, shift.run).length,
      }))
    const seats = onRoute.length
      ? onRoute.reduce((total, r) => total + r.bus.seats, 0)
      : null
    const load = routeLoad(route.id)
    const fit = routeFit(load, seats)
    const riders = store.students.filter((s) => s.morningRouteId === route.id)
    return {
      id: route.id,
      name: route.name,
      buses: onRoute,
      seats,
      load,
      fit,
      suggestion: freeBusSuggestion(fit, seats, onRoute.length, freeBuses),
      stops: route.stops.map((stop) => ({
        ...stop,
        riders: riders
          .filter((s) => s.pickup.stopId === stop.id)
          .map(({ id, name, grade }) => ({ id, name, grade })),
      })),
      withoutStop: riders.filter((s) => !s.pickup.stopId).length,
    }
  })
  return { shift: { date: shift.date, run: shift.run }, routes, freeBuses }
}

// One route for the editor, with how many students use each stop (a stop
// with students can't be removed).
export async function getRoute(routeId) {
  await simulateNetwork(200)
  const route = findRoute(routeId)
  if (!route) throw new AdminServiceError('We could not find that route.')
  return {
    ...route,
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
