import { addDays, atNairobiTime, toDateKey } from './dates'
import { plural } from './format'
import {
  coversGrade,
  currentTrip,
  sortTrips,
  toClock,
  toMinutes,
} from './trip-times'

// Routes, buses and drivers are separate records with no standing links
// (FR-3.9). For every shift the admin decides, for each bus, who drives it
// and which route it runs. A shift is one trip time (lib/trip-times.js) on
// one school day:
//   shift row  { id, date, tripId, busId, driverId, routeId }
// One row per bus per shift; driverId and routeId may be null. A route can
// have several buses in a shift; a driver can be on only one bus. A driver
// can drive several shifts in a day (the senior pickup, then the junior).
// Pure functions, shared by the mock services and the tests. The Flask API
// checks the same rules on the server.

// Monday to Friday of the week that `dateKey` is in.
export function schoolWeek(dateKey) {
  const day = atNairobiTime(dateKey, '12:00').getUTCDay() // 0 Sunday … 6 Saturday
  const monday = addDays(dateKey, day === 0 ? -6 : 1 - day)
  return [0, 1, 2, 3, 4].map((offset) => addDays(monday, offset))
}

// A shift that has finished can't be changed: it is a record of what
// happened. Today's shifts can, until a later trip time is on (a driver can
// fall ill, a bus can break down while it is out).
export function isPastShift(date, trip, trips, now) {
  const today = toDateKey(now)
  if (date !== today) return date < today
  const current = currentTrip(trips, now)
  return Boolean(current) && toMinutes(current.time) > toMinutes(trip.time)
}

export function shiftRows(shifts, date, tripId) {
  return shifts.filter((row) => row.date === date && row.tripId === tripId)
}

// The stops of a route on one trip. A route stores its stops in pickup
// order (depot first, school last) with times; the trip time moves them so
// the run starts at the trip's time, keeping the gaps between stops. A
// drop-off is the same stops in reverse, leaving school at the trip's time.
export function runStops(route, trip) {
  const start = toMinutes(trip.time)
  if (trip.run === 'morning') {
    const shift = start - toMinutes(route.stops[0].time)
    return route.stops.map((stop) => ({
      ...stop,
      time: toClock(toMinutes(stop.time) + shift),
    }))
  }
  const school = toMinutes(route.stops.at(-1).time)
  return route.stops.toReversed().map((stop) => ({
    ...stop,
    time: toClock(start + (school - toMinutes(stop.time))),
  }))
}

// The students who ride a trip: their grade is the trip's, and their plan
// has that run (only then do they have a bus for it).
export function tripStudents(students, trip) {
  return students.filter(
    (s) => s[`${trip.run}BusId`] && coversGrade(trip, s.grade),
  )
}

// Students on a bus for one trip. A student's route and bus stay the same
// until the admin changes them, whatever the shift.
export function busStudents(students, busId, trip) {
  return tripStudents(students, trip).filter(
    (s) => s[`${trip.run}BusId`] === busId,
  )
}

// Problems in one shift, before it is saved.
//   errors      { busId: message }   the shift can't be saved
//   rowNotes    { busId: [message] } warnings shown on the bus's row
//   shiftNotes  [message]            warnings about the whole shift
export function checkShift({ rows, trip, buses, drivers, routes, students }) {
  const errors = {}
  const rowNotes = {}
  const shiftNotes = []
  const { run } = trip
  const byId = (list, id) => list.find((item) => item.id === id)
  const note = (busId, message) => {
    rowNotes[busId] = [...(rowNotes[busId] ?? []), message]
  }

  const busOfDriver = {}
  for (const row of rows) {
    const bus = byId(buses, row.busId)
    if (row.driverId) {
      const other = busOfDriver[row.driverId]
      if (other) {
        errors[row.busId] =
          `${byId(drivers, row.driverId).name} is already on ${byId(buses, other).number}.`
      } else {
        busOfDriver[row.driverId] = row.busId
      }
    }

    const riders = busStudents(students, row.busId, trip)
    if (riders.length > bus.seats) {
      note(
        row.busId,
        `${plural(riders.length, 'student')} for ${bus.seats} seats.`,
      )
    }
    if (row.routeId && !row.driverId) note(row.busId, 'No driver.')
    if (!row.routeId && riders.length) {
      const one = riders.length === 1
      note(
        row.busId,
        `${plural(riders.length, 'student')} ${one ? 'rides' : 'ride'} this bus, but it has no route.`,
      )
    }
    if (row.routeId) {
      const elsewhere = riders.filter((s) => s[`${run}RouteId`] !== row.routeId)
      if (elsewhere.length) {
        const one = elsewhere.length === 1
        note(
          row.busId,
          `${plural(elsewhere.length, 'student')} on this bus ${one ? 'is' : 'are'} on another route.`,
        )
      }
    }
  }

  // A route whose students' buses aren't on it this shift.
  const riding = tripStudents(students, trip)
  for (const route of routes) {
    const stranded = riding.filter(
      (s) =>
        s[`${run}RouteId`] === route.id &&
        !rows.some(
          (row) => row.busId === s[`${run}BusId`] && row.routeId === route.id,
        ),
    )
    if (stranded.length) {
      const one = stranded.length === 1
      shiftNotes.push(
        `${plural(stranded.length, 'student')} on the ${route.name} ${one ? 'has' : 'have'} no bus on it this shift.`,
      )
    }
  }

  return { errors, rowNotes, shiftNotes }
}

// Copies one shift's rows to the same trip time on other days, replacing
// what those days had. Returns the new list of all shift rows.
export function copyShift(shifts, { date, tripId }, toDates) {
  const source = shiftRows(shifts, date, tripId)
  const kept = shifts.filter(
    (row) => !(row.tripId === tripId && toDates.includes(row.date)),
  )
  const copies = toDates.flatMap((toDate) =>
    source.map((row) => ({
      ...row,
      id: shiftId(toDate, tripId, row.busId),
      date: toDate,
    })),
  )
  return [...kept, ...copies]
}

export function shiftId(date, tripId, busId) {
  return `${date}-${tripId}-${busId}`
}

// A bus's row in a shift: who drives it and which route it runs, or null.
export function busShift(shifts, date, tripId, busId) {
  return (
    shifts.find(
      (row) =>
        row.date === date && row.tripId === tripId && row.busId === busId,
    ) ?? null
  )
}

// A driver's rows on a day, in the order of the trip times: the buses they
// drive.
export function driverShifts(shifts, trips, date, driverId) {
  return sortTrips(trips)
    .map((trip) =>
      shifts.find(
        (row) =>
          row.date === date &&
          row.tripId === trip.id &&
          row.driverId === driverId,
      ),
    )
    .filter(Boolean)
}

// On how many days of `week` a bus runs `routeId` on a trip: lets the
// student profile warn when a child's bus isn't usually on the child's
// route.
export function daysOnRoute(shifts, week, tripId, busId, routeId) {
  return week.filter(
    (date) => busShift(shifts, date, tripId, busId)?.routeId === routeId,
  ).length
}
