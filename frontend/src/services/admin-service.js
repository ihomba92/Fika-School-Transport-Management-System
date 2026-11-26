import { PLANS } from '@/config/plans'
import { sampleNow } from '@/data/sample-clock'
import { SCHOOL } from '@/data/school'
import { toDateKey } from '@/lib/dates'
import { formatTime, plural } from '@/lib/format'
import { checkShift, schoolWeek } from '@/lib/shifts'
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
  studentToday,
  studentTrips,
  withDetails,
} from './admin-store'
import { markPresent, missingAtBoarding } from './attendance-store'
import { simulateNetwork } from './mock-network'

// Stand-in for the admin part of the Flask API: the dashboard, live trips,
// students and new applications. Buses, drivers, routes and the schedule
// are in fleet-service.js. The real API does the same checks (capacity,
// required photo) on the server, whatever the browser sends.

export { AdminServiceError }

// The runs of the shift on now with each bus's live status (FR-5.4). The
// live map and dashboard poll this every 10 seconds.
export async function getLiveBuses() {
  await simulateNetwork(200)
  const now = sampleNow()
  const { trip } = currentShift(now)
  return { buses: liveTrips(now), trip, updatedAt: now }
}

const byStage = (students, stage) => students.filter((s) => s.stage === stage)

// Everything the dashboard needs in one request.
export async function getAdminOverview() {
  await simulateNetwork(300)
  const now = sampleNow()
  const live = liveTrips(now)
  const students = store.students.map(withDetails)
  const billed = byStage(students, 'on-route')
  const flagged = students.filter((s) => s.isFlagged)
  const applications = byStage(students, 'applied')
  const needsRoute = byStage(students, 'needs-route')

  const attention = []
  for (const absence of missingAtBoarding(toDateKey(now))) {
    const student = findStudent(absence.studentId)
    attention.push({
      kind: 'boarding',
      title: `${student.name} didn't board ${findBus(absence.busId).number} at school`,
      detail: `The driver marked ${student.name} (${student.grade}) missing at ${formatTime(absence.markedAt)}. They aren't on the bus home.`,
      action: {
        label: `Call ${student.guardian.name}`,
        href: `tel:${student.guardian.phone}`,
      },
      link: { label: 'Open profile', to: `/admin/students/${student.id}` },
    })
  }
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
  if (shift.trip) {
    const check = checkShift({
      rows: shift.rows,
      trip: shift.trip,
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
        title: `Today's ${shift.trip.name.toLowerCase()} needs a look`,
        detail: shiftNotes.join(' '),
        action: {
          label: 'Open the schedule',
          to: `/admin/schedule?date=${shift.date}&trip=${shift.trip.id}`,
        },
      })
    }
  }
  if (flagged.length) {
    attention.push({
      kind: 'fees',
      title: `${flagged.length} accounts past the grace period`,
      detail: `KES ${sum(flagged, (s) => s.fees.balance).toLocaleString('en-KE')} is overdue. Removing a student from a bus needs your confirmation.`,
      action: { label: 'Review accounts', to: '/admin/students?fees=overdue' },
    })
  }
  if (applications.length) {
    attention.push({
      kind: 'applications',
      title: `${plural(applications.length, 'new application')} to review`,
      detail:
        'Parents added these children. Accept them into Fika, or decline with a reason.',
      action: { label: 'Review applications', to: '/admin/applications' },
    })
  }
  if (needsRoute.length) {
    attention.push({
      kind: 'waiting',
      title: `${plural(needsRoute.length, 'accepted student')} ${needsRoute.length === 1 ? 'needs' : 'need'} a route`,
      detail: 'They were accepted and are waiting for a route, stop and bus.',
      action: { label: 'Place them', to: '/admin/routes' },
    })
  }

  return {
    now,
    term: currentTerm(),
    trip: shift.trip,
    buses: live,
    stats: {
      busCount: store.buses.length,
      busesRunning: live.filter((t) => t.isRunning).length,
      busesArrived: live.filter((t) => t.status === 'arrived').length,
      riding: sum(live, (t) => t.riderCount),
      // Picked up so far on a pickup; dropped off so far on a drop-off.
      done:
        shift.trip?.run === 'evening'
          ? sum(live, (t) => t.riderCount - t.onBoard)
          : sum(live, (t) => t.onBoard) +
            sum(
              live.filter((t) => t.status === 'arrived'),
              (t) => t.riderCount,
            ),
      feesCollected: sum(billed, (s) => s.fees.paid),
      feesExpected: sum(billed, (s) => s.fees.fee),
      flagged: flagged.length,
      applications: applications.length,
      needsRoute: needsRoute.length,
    },
    attention,
  }
}

// The school's students (accepted ones: on a route, or waiting for one)
// with their routes, buses and fees, filtered (FR-2.5). Applications live
// on their own screen. The real API pages the results on the server; the
// mock returns them all.
export async function listStudents(filters) {
  await simulateNetwork(250)
  const students = store.students
    .filter((s) => s.stage === 'on-route' || s.stage === 'needs-route')
    .map(withDetails)
  return {
    students: filterStudents(students, filters),
    total: students.length,
    counts: {
      onRoute: byStage(students, 'on-route').length,
      needsRoute: byStage(students, 'needs-route').length,
      applications: byStage(store.students, 'applied').length,
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
// used per trip) they could be put on, this week's shifts so the page can
// warn when the chosen bus isn't usually on the chosen route, and where
// the student is today.
export async function getStudent(studentId) {
  await simulateNetwork(250)
  const student = findStudent(studentId)
  if (student.stage === 'applied' || student.stage === 'declined') {
    throw new AdminServiceError(
      'This child is an application, not a student yet. See New applications.',
    )
  }
  const week = schoolWeek(currentShift().date)
  return {
    student: withDetails(student),
    today: studentToday(student),
    routeOptions: store.routes.map(({ id, name }) => ({ id, name })),
    busOptions: store.buses.map((bus) => ({
      id: bus.id,
      number: bus.number,
      seats: bus.seats,
      load: busLoad(bus.id),
    })),
    week,
    shifts: store.shifts.filter((row) => week.includes(row.date)),
    officePhone: SCHOOL.officePhone,
  }
}

// FR-3.2 to FR-3.5: put a student on a route and a bus for each run in
// their plan. They stay there until the admin changes it. A run needs both
// or neither. A bus can never take more students than its seats on the
// student's trip (the pickup or drop-off for their grade).
//   choice  { morning: { routeId, busId }, evening: { routeId, busId } }
export async function assignStudent(studentId, choice) {
  await simulateNetwork()
  const student = findStudent(studentId)
  if (student.stage !== 'on-route' && student.stage !== 'needs-route') {
    throw new AdminServiceError('Accept the application first.')
  }
  const plan = PLANS[student.plan]
  const trips = studentTrips(student)
  const runs = {
    morning: plan.hasMorning ? choice.morning : null,
    evening: plan.hasEvening ? choice.evening : null,
  }
  for (const [run, pick] of Object.entries(runs)) {
    if (!pick) continue
    const what = run === 'morning' ? 'pickup' : 'drop-off'
    if (Boolean(pick.routeId) !== Boolean(pick.busId)) {
      throw new AdminServiceError(
        `Choose both a route and a bus for the ${what}, or neither.`,
      )
    }
    if (!pick.busId || pick.busId === student[`${run}BusId`]) continue
    const bus = findBus(pick.busId)
    if (!bus || !findRoute(pick.routeId)) {
      throw new AdminServiceError('We could not find that route or bus.')
    }
    const trip = trips[run]
    if (trip && busLoad(bus.id)[trip.id] >= bus.seats) {
      throw new AdminServiceError(
        `${bus.number} is full on the ${trip.name.toLowerCase()} (${bus.seats} seats).`,
      )
    }
  }
  for (const run of ['morning', 'evening']) {
    student[`${run}RouteId`] = runs[run]?.routeId || null
    student[`${run}BusId`] = runs[run]?.busId || null
  }
  const hasBus = Boolean(student.morningBusId || student.eveningBusId)
  // Fees start when an accepted student first gets a bus.
  if (student.stage === 'needs-route' && hasBus) {
    student.joinedOn = toDateKey(sampleNow())
  }
  student.stage = hasBus ? 'on-route' : 'needs-route'
  return withDetails(student)
}

// The office marks a student present for the rest of today, after an
// absence at pickup (a parent drove them in) or at boarding (they were
// found). The driver's drop-off expects them again.
export async function markStudentPresent(studentId) {
  await simulateNetwork()
  const student = findStudent(studentId)
  const now = sampleNow()
  markPresent(toDateKey(now), student.id, now)
  return studentToday(student, now)
}

// ── New applications ─────────────────────────────────────────────────────

function applicationView(student) {
  const trips = studentTrips(student)
  return {
    id: student.id,
    name: student.name,
    grade: student.grade,
    photoUrl: student.photoUrl,
    plan: student.plan,
    guardian: student.guardian,
    pickup: student.pickup,
    dropoff: student.dropoff ?? null,
    submittedOn: student.application?.submittedOn ?? null,
    decidedOn: student.application?.decidedOn ?? null,
    declineReason: student.application?.declineReason ?? null,
    // The trip times their grade would ride.
    trips: {
      morning: trips.morning && {
        name: trips.morning.name,
        time: trips.morning.time,
      },
      evening: trips.evening && {
        name: trips.evening.name,
        time: trips.evening.time,
      },
    },
  }
}

// Children their parents added, which the office hasn't decided on yet
// (oldest first), and the ones it declined.
export async function listApplications() {
  await simulateNetwork(250)
  const oldestFirst = (a, b) =>
    (a.submittedOn ?? '').localeCompare(b.submittedOn ?? '')
  return {
    pending: byStage(store.students, 'applied')
      .map(applicationView)
      .sort(oldestFirst),
    declined: byStage(store.students, 'declined').map(applicationView),
    needsRouteCount: byStage(store.students, 'needs-route').length,
    today: toDateKey(sampleNow()),
  }
}

function findApplication(studentId, stage) {
  const student = findStudent(studentId)
  if (student.stage !== stage) {
    throw new AdminServiceError(
      'This application has already been handled. Reload to see the latest.',
    )
  }
  return student
}

// Accepting a child makes them a student who needs a route: the office
// then places them in Routes & assignment. Fees start once they have a
// bus. The real API tells the parent.
export async function acceptApplication(studentId) {
  await simulateNetwork()
  const student = findApplication(studentId, 'applied')
  student.stage = 'needs-route'
  student.application = {
    ...student.application,
    decidedOn: toDateKey(sampleNow()),
  }
  return applicationView(student)
}

// The parent sees the reason, so it is required.
export async function declineApplication(studentId, reason) {
  await simulateNetwork()
  const student = findApplication(studentId, 'applied')
  if (!reason?.trim()) {
    throw new AdminServiceError('Give the parent a reason.')
  }
  student.stage = 'declined'
  student.application = {
    ...student.application,
    decidedOn: toDateKey(sampleNow()),
    declineReason: reason.trim(),
  }
  return applicationView(student)
}

// Puts a declined application back in the list, to decide again.
export async function reopenApplication(studentId) {
  await simulateNetwork()
  const student = findApplication(studentId, 'declined')
  student.stage = 'applied'
  student.application = {
    submittedOn: student.application?.submittedOn ?? null,
  }
  return applicationView(student)
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
