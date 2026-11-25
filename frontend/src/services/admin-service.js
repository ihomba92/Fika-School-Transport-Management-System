import { PLANS } from '@/config/plans'
import { sampleNow } from '@/data/sample-clock'
import { SCHOOL } from '@/data/school'
import { toDateKey } from '@/lib/dates'
import { formatTime } from '@/lib/format'
import { checkShift, schoolWeek, shiftRows } from '@/lib/shifts'
import { filterStudents } from '@/lib/student-filters'
import {
  AdminServiceError,
  busLoad,
  currentShift,
  currentTerm,
  findBus,
  findRoute,
  findStudent,
  liveTrips,
  store,
  withDetails,
} from './admin-store'
import { simulateNetwork } from './mock-network'

// Stand-in for the admin part of the Flask API: the dashboard, live trips
// and students. Buses, drivers, routes and the schedule are in
// fleet-service.js. The real API does the same checks (capacity, required
// photo) on the server, whatever the browser sends.

export { AdminServiceError }

// Today's morning runs with each bus's live status (FR-5.4). The live map
// and dashboard poll this every 10 seconds.
export async function getLiveBuses() {
  await simulateNetwork(200)
  const now = sampleNow()
  return { buses: liveTrips(now), updatedAt: now }
}

const RUN_NAMES = { morning: 'morning', evening: 'evening' }

// Everything the dashboard needs in one request.
export async function getAdminOverview() {
  await simulateNetwork(300)
  const now = sampleNow()
  const live = liveTrips(now)
  const students = store.students.map(withDetails)
  const billed = students.filter((s) => !s.isWaiting)
  const flagged = students.filter((s) => s.isFlagged)
  const waiting = students.filter((s) => s.isWaiting)
  const riding = students.filter((s) => s.morningBusId)

  const attention = []
  for (const trip of live.filter((t) => t.status === 'signal-lost')) {
    const driver = trip.bus.driver
    attention.push({
      kind: 'signal',
      title: `${trip.bus.number} has no signal`,
      detail: `No location since ${formatTime(trip.lastSeenAt)} with ${trip.onBoard} students on board.`,
      action: driver
        ? { label: `Call ${driver.name}`, href: `tel:${driver.phone}` }
        : null,
    })
  }
  // The shift on now, checked with the same rules as the Schedule screen.
  const shift = currentShift(now)
  const check = checkShift({
    rows: shift.rows,
    run: shift.run,
    buses: store.buses,
    drivers: store.drivers,
    routes: store.routes,
    students: store.students,
  })
  const busNotes = Object.entries(check.rowNotes).map(
    ([busId, notes]) => `${findBus(busId).number}: ${notes.join(' ')}`,
  )
  const shiftNotes = [...check.shiftNotes, ...busNotes]
  if (shiftNotes.length) {
    attention.push({
      kind: 'shift',
      title: `Today's ${RUN_NAMES[shift.run]} shift needs a look`,
      detail: shiftNotes.join(' '),
      action: {
        label: 'Open the schedule',
        to: `/admin/schedule?date=${shift.date}&run=${shift.run}`,
      },
    })
  }
  if (flagged.length) {
    attention.push({
      kind: 'fees',
      title: `${flagged.length} accounts past the grace period`,
      detail: `KES ${sum(flagged, (s) => s.fees.balance).toLocaleString('en-KE')} is overdue. Removing a student from a bus needs your confirmation.`,
      action: { label: 'Review accounts', to: '/admin/students?fees=overdue' },
    })
  }
  if (waiting.length) {
    attention.push({
      kind: 'waiting',
      title: `${waiting.length} students waiting for a bus`,
      detail: 'Their parents added them; they need a route and a bus.',
      action: { label: 'See students', to: '/admin/students?bus=waiting' },
    })
  }

  return {
    now,
    term: currentTerm(),
    buses: live,
    stats: {
      busCount: store.buses.length,
      busesRunning: live.filter((t) => t.isRunning).length,
      busesArrived: live.filter((t) => t.status === 'arrived').length,
      riding: riding.length,
      pickedUp:
        sum(live, (t) => t.onBoard) +
        sum(
          live.filter((t) => t.status === 'arrived'),
          (t) => t.riderCount,
        ),
      feesCollected: sum(billed, (s) => s.fees.paid),
      feesExpected: sum(billed, (s) => s.fees.fee),
      flagged: flagged.length,
      waiting: waiting.length,
    },
    attention,
  }
}

// All students with their routes, buses and fees, filtered (FR-2.5). The
// real API pages the results on the server; the mock returns them all.
export async function listStudents(filters) {
  await simulateNetwork(250)
  const students = store.students.map(withDetails)
  return {
    students: filterStudents(students, filters),
    total: students.length,
    counts: {
      assigned: students.filter((s) => !s.isWaiting).length,
      waiting: students.filter((s) => s.isWaiting).length,
      flagged: students.filter((s) => s.isFlagged).length,
      plans: Object.fromEntries(
        Object.keys(PLANS).map((plan) => [
          plan,
          students.filter((s) => s.plan === plan).length,
        ]),
      ),
    },
    grades: [...new Set(students.map((s) => s.grade))].sort(gradeOrder),
    buses: store.buses.map(({ id, number }) => ({ id, number })),
  }
}

// One student's profile, with every route and every bus (with its seats
// used per run) they could be put on, and this week's shifts so the page
// can warn when the chosen bus isn't usually on the chosen route.
export async function getStudent(studentId) {
  await simulateNetwork(250)
  const week = schoolWeek(currentShift().date)
  return {
    student: withDetails(findStudent(studentId)),
    routeOptions: store.routes.map(({ id, name }) => ({ id, name })),
    busOptions: store.buses.map((bus) => ({
      id: bus.id,
      number: bus.number,
      seats: bus.seats,
      load: busLoad(bus.id),
    })),
    week,
    shifts: week.flatMap((date) =>
      ['morning', 'evening'].flatMap((run) =>
        shiftRows(store.shifts, date, run),
      ),
    ),
    officePhone: SCHOOL.officePhone,
  }
}

// FR-3.2 to FR-3.5: put a student on a route and a bus for each run in
// their plan. They stay there until the admin changes it. A run needs both
// or neither. A bus can never take more students than its seats on a run.
//   choice  { morning: { routeId, busId }, evening: { routeId, busId } }
export async function assignStudent(studentId, choice) {
  await simulateNetwork()
  const student = findStudent(studentId)
  const plan = PLANS[student.plan]
  const runs = {
    morning: plan.hasMorning ? choice.morning : null,
    evening: plan.hasEvening ? choice.evening : null,
  }
  for (const [run, pick] of Object.entries(runs)) {
    if (!pick) continue
    if (Boolean(pick.routeId) !== Boolean(pick.busId)) {
      throw new AdminServiceError(
        `Choose both a route and a bus for the ${run} run, or neither.`,
      )
    }
    if (!pick.busId || pick.busId === student[`${run}BusId`]) continue
    const bus = findBus(pick.busId)
    if (!bus || !findRoute(pick.routeId)) {
      throw new AdminServiceError('We could not find that route or bus.')
    }
    if (busLoad(bus.id)[run] >= bus.seats) {
      throw new AdminServiceError(
        `${bus.number} is full for the ${run} run (${bus.seats} seats).`,
      )
    }
  }
  for (const run of ['morning', 'evening']) {
    student[`${run}RouteId`] = runs[run]?.routeId || null
    student[`${run}BusId`] = runs[run]?.busId || null
  }
  const wasWaiting = student.isWaiting
  student.isWaiting = !student.morningBusId && !student.eveningBusId
  // Fees start when a waiting student first gets a bus.
  if (wasWaiting && !student.isWaiting) {
    student.joinedOn = toDateKey(sampleNow())
  }
  return withDetails(student)
}

function sum(list, value) {
  return list.reduce((total, item) => total + value(item), 0)
}

// PP1, PP2, Grade 1 … Grade 9 in school order, not alphabetical.
function gradeOrder(a, b) {
  const rank = (grade) =>
    grade.startsWith('PP')
      ? Number(grade.slice(2)) - 3
      : Number(grade.split(' ')[1])
  return rank(a) - rank(b)
}
