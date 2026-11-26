import { GRADES } from '@/config/plans'

// Trip times: when the buses run each school day (FR-3.11). The admin sets
// as many as the school needs, for example
//   { id, name: 'Senior pickup', run: 'morning', time: '06:00',
//     firstGrade: 'Grade 4', lastGrade: 'Grade 9' }
//   { id, name: 'Junior pickup', run: 'morning', time: '08:00',
//     firstGrade: 'PP1', lastGrade: 'Grade 3' }
// `run` is 'morning' (pickup: home to school) or 'evening' (drop-off:
// school to home). `time` is when the run starts: the bus leaves its first
// stop (pickup) or the school (drop-off). A child rides the pickup and the
// drop-off whose grades include theirs, so small children can come later
// and go home earlier than the senior grades.
// Pure functions, shared by the mock services and the tests.

export const RUNS = ['morning', 'evening']

export function gradeIndex(grade) {
  return GRADES.indexOf(grade)
}

export function coversGrade(trip, grade) {
  const index = gradeIndex(grade)
  return (
    index !== -1 &&
    index >= gradeIndex(trip.firstGrade) &&
    index <= gradeIndex(trip.lastGrade)
  )
}

export function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function toClock(totalMinutes) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
  const minutes = String(totalMinutes % 60).padStart(2, '0')
  return `${hours}:${minutes}`
}

// Pickups first, then drop-offs, each by time.
export function sortTrips(trips) {
  return trips.toSorted(
    (a, b) =>
      RUNS.indexOf(a.run) - RUNS.indexOf(b.run) ||
      toMinutes(a.time) - toMinutes(b.time),
  )
}

// The trip a child of `grade` rides on `run`, or null if no trip time
// covers their grade.
export function tripFor(trips, run, grade) {
  return (
    trips.find((trip) => trip.run === run && coversGrade(trip, grade)) ?? null
  )
}

// Minutes since midnight in Nairobi.
export function nairobiMinutes(now) {
  const [hours, minutes] = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Africa/Nairobi',
  })
    .format(now)
    .split(':')
    .map(Number)
  return hours * 60 + minutes
}

// A trip counts as "on now" for this long after it starts; after that the
// next trip of the day is shown.
const ON_FOR_MINUTES = 120

// The trip that is on now, or the next one today. Late in the day, the
// last one. Null when there are no trip times.
export function currentTrip(trips, now) {
  const byTime = trips.toSorted((a, b) => toMinutes(a.time) - toMinutes(b.time))
  const minutes = nairobiMinutes(now)
  const started = byTime.findLast((trip) => toMinutes(trip.time) <= minutes)
  if (started && minutes - toMinutes(started.time) < ON_FOR_MINUTES) {
    return started
  }
  return (
    byTime.find((trip) => toMinutes(trip.time) > minutes) ??
    byTime.at(-1) ??
    null
  )
}

// "PP1 – Grade 3", "Grade 5", or "All grades".
export function gradeRange(trip) {
  if (trip.firstGrade === trip.lastGrade) return trip.firstGrade
  if (trip.firstGrade === GRADES[0] && trip.lastGrade === GRADES.at(-1)) {
    return 'All grades'
  }
  return `${trip.firstGrade} – ${trip.lastGrade}`
}

// Problems with a list of trip times, before it is saved.
//   errors  { tripId: message }  two pickups (or drop-offs) share a grade,
//                                so a child's trip would be unclear
//   notes   [message]            grades with no pickup or no drop-off:
//                                those children have no bus on that run
export function checkTripTimes(trips) {
  const errors = {}
  for (const run of RUNS) {
    const onRun = trips.filter((trip) => trip.run === run)
    onRun.forEach((trip, index) => {
      const clash = onRun
        .slice(0, index)
        .find((other) =>
          GRADES.some(
            (grade) => coversGrade(trip, grade) && coversGrade(other, grade),
          ),
        )
      if (clash) {
        errors[trip.id] =
          `Shares grades with ${clash.name}. Each grade can have only one ${run === 'morning' ? 'pickup' : 'drop-off'} time.`
      }
    })
  }

  const notes = RUNS.flatMap((run) => {
    const missing = GRADES.filter((grade) => !tripFor(trips, run, grade))
    if (!missing.length) return []
    const what = run === 'morning' ? 'pickup' : 'drop-off'
    return [`No ${what} time for ${listGrades(missing)}.`]
  })
  return { errors, notes }
}

function listGrades(grades) {
  if (grades.length === 1) return grades[0]
  return `${grades.slice(0, -1).join(', ')} and ${grades.at(-1)}`
}
