import { sampleNow } from '@/data/sample-clock'
import { atNairobiTime, addDays, toDateKey } from '@/lib/dates'
import { planFee, splitIntoInstalments, dueDatesFor } from '@/lib/fees'
import {
  feeCollection,
  monthOf,
  occupancyByBus,
  onTimeBy,
  onTimeSummary,
  schoolDays,
} from '@/lib/reports'
import { busStudents, runStops, schoolWeek, shiftRows } from '@/lib/shifts'
import {
  AdminServiceError,
  allTrips,
  currentTerm,
  findBus,
  findRoute,
  store,
} from './admin-store'
import { simulateNetwork } from './mock-network'

// Stand-in for the Flask reports API: GET /reports/months and
// GET /reports/monthly?month=2026-09. The real API runs SQL over the runs
// recorded by drivers' phones (when each bus reached school or its last
// stop, how many children were on board) and the M-Pesa payments, and
// caches finished months in Redis. The real API also renders the same
// report as a PDF with WeasyPrint; here the page prints to PDF.

export { AdminServiceError }

// The term so far, before the sample day: 1 September to 12 October.
const HISTORY_FROM = '2026-09-01'

// A tiny seeded random number generator, so the sample history is the same
// on every visit.
function seededRandom(seed) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Every run from the start of term to yesterday, as the drivers' phones
// would have recorded it. Each bus ran its usual route at every trip time
// (this week's Monday plan). Some routes are usually later than others
// (traffic on Mombasa Road, say), and a few children are absent each day.
let history = null
function runHistory() {
  if (history) return history
  const random = seededRandom(2609)
  const today = toDateKey(sampleNow())
  const monday = schoolWeek(today)[0]
  const trips = allTrips()
  // Usual minutes late per route: most are close to plan, one or two
  // struggle with traffic.
  const USUAL_LATENESS = [0, 1, 0, 4, 2, 1, 0, 3]
  const lateness = new Map(
    store.routes.map((route, index) => [
      route.id,
      USUAL_LATENESS[index % USUAL_LATENESS.length],
    ]),
  )
  history = schoolDays(HISTORY_FROM, addDays(today, -1)).flatMap((date) =>
    trips.flatMap((trip) =>
      shiftRows(store.shifts, monday, trip.id)
        .filter((row) => row.routeId)
        .map((row) => {
          const route = findRoute(row.routeId)
          const bus = findBus(row.busId)
          const last = runStops(route, trip).at(-1)
          const plannedAt = atNairobiTime(date, last.time)
          // Within a few minutes either way, and now and then a jam.
          const jam = random() < 0.04 ? 10 + random() * 15 : 0
          const delay = Math.round(
            lateness.get(route.id) + random() * 9 - 5 + jam,
          )
          const usual = busStudents(store.students, bus.id, trip).length
          return {
            date,
            tripId: trip.id,
            busId: bus.id,
            routeId: route.id,
            plannedAt: plannedAt.toISOString(),
            arrivedAt: new Date(
              plannedAt.getTime() + delay * 60_000,
            ).toISOString(),
            riders: Math.round(usual * (0.85 + random() * 0.15)),
            seats: bus.seats,
          }
        }),
    ),
  )
  return history
}

const MONTH_NAMES = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'Africa/Nairobi',
})
const monthLabel = (month) =>
  MONTH_NAMES.format(atNairobiTime(`${month}-15`, '12:00'))

// The months that have runs, latest first.
export async function getReportMonths() {
  await simulateNetwork(150)
  const months = [...new Set(runHistory().map((run) => monthOf(run.date)))]
  return months
    .toSorted()
    .reverse()
    .map((month) => ({ month, label: monthLabel(month) }))
}

// One month's report: on-time performance by route and by trip time, how
// full each bus was, and the fees collected.
export async function getMonthlyReport(month) {
  await simulateNetwork(350)
  const runs = runHistory().filter((run) => monthOf(run.date) === month)
  if (!runs.length) {
    throw new AdminServiceError('There are no trips recorded for that month.')
  }
  const days = [...new Set(runs.map((run) => run.date))].toSorted()
  const today = toDateKey(sampleNow())
  const tripName = (id) => allTrips().find((trip) => trip.id === id)

  return {
    month,
    label: monthLabel(month),
    from: days[0],
    to: days.at(-1),
    schoolDays: days.length,
    // The month isn't over yet: the numbers are so far.
    isPartial: monthOf(today) === month,
    onTime: onTimeSummary(runs),
    byRoute: onTimeBy(runs, 'routeId').map((row) => ({
      ...row,
      name: findRoute(row.id)?.name ?? row.id,
    })),
    byTrip: onTimeBy(runs, 'tripId').map((row) => ({
      ...row,
      name: tripName(row.id)?.name ?? row.id,
      time: tripName(row.id)?.time ?? '',
    })),
    occupancy: occupancyByBus(runs).map((row) => {
      const bus = findBus(row.busId)
      return { ...row, number: bus.number, plate: bus.plate }
    }),
    fees: { ...feeCollection(store.payments, month), due: dueInMonth(month) },
    generatedAt: sampleNow(),
  }
}

// What the families of students on a route owed in instalments falling due
// in the month (this term's fee).
function dueInMonth(month) {
  const term = currentTerm()
  return store.students
    .filter((s) => s.stage === 'on-route')
    .flatMap((s) =>
      splitIntoInstalments(
        planFee(term.fee, s.plan),
        dueDatesFor(term.dueDates, s.joinedOn),
      ),
    )
    .filter((instalment) => monthOf(instalment.dueDate) === month)
    .reduce((total, instalment) => total + instalment.amount, 0)
}
