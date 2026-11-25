import { addDays, atNairobiTime, toDateKey } from './dates'
import { plural } from './format'

// Routes, buses and drivers are separate records with no standing links
// (FR-3.9). For every shift the admin decides, for each bus, who drives it
// and which route it runs. A shift is one run on one school day:
//   shift row  { id, date, run, busId, driverId, routeId }
// One row per bus per shift; driverId and routeId may be null. A route can
// have several buses in a shift; a driver can be on only one bus.
// Pure functions, shared by the mock services and the tests. The Flask API
// checks the same rules on the server.

export const RUNS = ['morning', 'evening']

// The evening run leaves school at 15:45 (FR-4.1).
const EVENING_START = '15:45'

// Monday to Friday of the week that `dateKey` is in.
export function schoolWeek(dateKey) {
  const day = atNairobiTime(dateKey, '12:00').getUTCDay() // 0 Sunday … 6 Saturday
  const monday = addDays(dateKey, day === 0 ? -6 : 1 - day)
  return [0, 1, 2, 3, 4].map((offset) => addDays(monday, offset))
}

// The run that is on now, or next: morning until noon, then evening.
export function currentRun(now) {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      hour12: false,
      timeZone: 'Africa/Nairobi',
    }).format(now),
  )
  return hour < 12 ? 'morning' : 'evening'
}

// A shift that has finished can't be changed: it is a record of what
// happened. Today's shifts and later ones can, even while a bus is out (a
// driver can fall ill, a bus can break down).
export function isPastShift(date, run, now) {
  const today = toDateKey(now)
  if (date !== today) return date < today
  return run === 'morning' && currentRun(now) === 'evening'
}

export function shiftRows(shifts, date, run) {
  return shifts.filter((row) => row.date === date && row.run === run)
}

// The stops of a route for one run. A route stores its morning stops
// (depot first, school last) with times; the evening run is the same stops
// in reverse, leaving school at 15:45 and keeping the same gaps between
// stops.
export function runStops(route, run) {
  if (run === 'morning') return route.stops
  const school = toMinutes(route.stops.at(-1).time)
  const start = toMinutes(EVENING_START)
  return route.stops.toReversed().map((stop) => ({
    ...stop,
    time: toClock(start + (school - toMinutes(stop.time))),
  }))
}

// Students on a bus for one run. A student's route and bus stay the same
// until the admin changes them, whatever the shift.
export function busStudents(students, busId, run) {
  return students.filter((s) => s[`${run}BusId`] === busId)
}

// Problems in one shift, before it is saved.
//   errors      { busId: message }   the shift can't be saved
//   rowNotes    { busId: [message] } warnings shown on the bus's row
//   shiftNotes  [message]            warnings about the whole shift
export function checkShift({ rows, run, buses, drivers, routes, students }) {
  const errors = {}
  const rowNotes = {}
  const shiftNotes = []
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

    const riders = busStudents(students, row.busId, run)
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
  for (const route of routes) {
    const onRoute = students.filter((s) => s[`${run}RouteId`] === route.id)
    const stranded = onRoute.filter(
      (s) =>
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

// Copies one shift's rows to the same run on other days, replacing what
// those days had. Returns the new list of all shift rows.
export function copyShift(shifts, { date, run }, toDates) {
  const source = shiftRows(shifts, date, run)
  const kept = shifts.filter(
    (row) => !(row.run === run && toDates.includes(row.date)),
  )
  const copies = toDates.flatMap((toDate) =>
    source.map((row) => ({
      ...row,
      id: shiftId(toDate, run, row.busId),
      date: toDate,
    })),
  )
  return [...kept, ...copies]
}

export function shiftId(date, run, busId) {
  return `${date}-${run}-${busId}`
}

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function toClock(totalMinutes) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
  const minutes = String(totalMinutes % 60).padStart(2, '0')
  return `${hours}:${minutes}`
}

// A bus's row in a shift: who drives it and which route it runs, or null.
export function busShift(shifts, date, run, busId) {
  return (
    shifts.find(
      (row) => row.date === date && row.run === run && row.busId === busId,
    ) ?? null
  )
}

// A driver's rows on a day, morning first: the buses they drive.
export function driverShifts(shifts, date, driverId) {
  return RUNS.map((run) =>
    shifts.find(
      (row) =>
        row.date === date && row.run === run && row.driverId === driverId,
    ),
  ).filter(Boolean)
}

// On how many days of `week` a bus runs `routeId` on `run`: lets the student
// profile warn when a child's bus isn't usually on the child's route.
export function daysOnRoute(shifts, week, run, busId, routeId) {
  return week.filter(
    (date) => busShift(shifts, date, run, busId)?.routeId === routeId,
  ).length
}
