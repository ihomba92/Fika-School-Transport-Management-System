import { PLANS } from '@/config/plans'
import { sampleNow } from '@/data/sample-clock'
import { toDateKey } from '@/lib/dates'
import { GRACE_DAYS, NEW_STUDENT_DAYS, planFee, termStatus } from '@/lib/fees'
import { formatDayMonth } from '@/lib/format'
import {
  AdminServiceError,
  currentTerm,
  findStudent,
  store,
  studentFees,
  withDetails,
} from './admin-store'
import { simulateNetwork } from './mock-network'

// Stand-in for the admin part of the Flask payments API (FR-6). M-Pesa is
// in mock mode: payments are simulated and no money moves. The real API
// takes payments from Safaricom's Daraja callbacks, sends reminders by
// email and push (FR-7.4), and runs the daily overdue check on a schedule.

export { AdminServiceError }

// When each student's parent was last reminded (the real API keeps this
// with the notification it sent).
const reminders = {}

// Everything the Payments page needs: this term's totals, the students
// behind on their fees, and the latest M-Pesa payments.
export async function getPaymentsOverview() {
  await simulateNetwork(300)
  const term = currentTerm()
  const billed = store.students.map(withDetails).filter((s) => !s.isWaiting)
  const overdue = billed.filter((s) => s.fees.status === 'overdue')

  const behind = overdue
    .map((s) => ({
      id: s.id,
      name: s.name,
      grade: s.grade,
      plan: s.plan,
      guardian: s.guardian,
      fee: s.fees.fee,
      paid: s.fees.paid,
      amountDue: s.fees.amountDue,
      balance: s.fees.balance,
      graceEndsOn: s.fees.graceEndsOn,
      isFlagged: s.isFlagged,
      removedOn: s.removedOn ?? null,
      remindedAt: reminders[s.id] ?? null,
    }))
    // Flagged first (they need a decision), then the largest amount due.
    .sort(
      (a, b) =>
        Number(b.isFlagged) - Number(a.isFlagged) || b.amountDue - a.amountDue,
    )

  const studentName = Object.fromEntries(
    store.students.map((s) => [s.id, { name: s.name, grade: s.grade }]),
  )
  const recent = store.payments
    .filter((p) => p.termId === term.id)
    .toSorted((a, b) => b.paidAt.localeCompare(a.paidAt))
    .slice(0, 6)
    .map((p) => ({ ...p, student: studentName[p.studentId] }))

  return {
    now: sampleNow(),
    term,
    stats: {
      fee: term.fee,
      oneWayFee: planFee(term.fee, 'morning'),
      collected: sum(billed, (s) => s.fees.paid),
      expected: sum(billed, (s) => s.fees.fee),
      billedCount: billed.length,
      bothWaysCount: billed.filter((s) => s.plan === 'both').length,
      overdueAmount: sum(overdue, (s) => s.fees.amountDue),
      overdueCount: overdue.length,
      flaggedCount: overdue.filter((s) => s.isFlagged).length,
    },
    behind,
    recent,
  }
}

// Every payment this term, for "Export statement".
export async function listTermPayments() {
  await simulateNetwork(200)
  const term = currentTerm()
  return store.payments
    .filter((p) => p.termId === term.id)
    .toSorted((a, b) => a.paidAt.localeCompare(b.paidAt))
    .map((p) => {
      const student = findStudent(p.studentId)
      return { ...p, studentName: student.name, plan: PLANS[student.plan] }
    })
}

// FR-6.4: remind the parents of these students that a payment is overdue.
// Returns how many parents were reminded (one parent can have two
// children behind).
export async function sendReminders(studentIds) {
  await simulateNetwork()
  const now = sampleNow().toISOString()
  const parents = new Set()
  for (const id of studentIds) {
    const student = findStudent(id)
    reminders[id] = now
    parents.add(student.guardian.phone)
  }
  return { parents: parents.size }
}

// FR-6.6: after the grace period, the system flags a student; nobody is
// taken off a bus until an admin confirms. Confirming takes them off their
// route and bus for both runs. They still owe the balance, and the parent
// is notified. The admin can put them back from the student's profile.
export async function removeForFees(studentId) {
  await simulateNetwork()
  const student = findStudent(studentId)
  if (!withDetails(student).isFlagged) {
    throw new AdminServiceError(
      `${student.name} is not flagged, so they can't be removed for fees.`,
    )
  }
  student.morningRouteId = null
  student.morningBusId = null
  student.eveningRouteId = null
  student.eveningBusId = null
  student.removedOn = toDateKey(sampleNow())
  return withDetails(student)
}

function sum(list, value) {
  return list.reduce((total, item) => total + value(item), 0)
}

// ── Fee settings ─────────────────────────────────────────────────────────

// FR-6.1: the school year's three terms with their dates, fee and due
// dates, which one is on now, and the rules that apply to every term.
export async function getFeeSettings() {
  await simulateNetwork(250)
  const today = toDateKey(sampleNow())
  return {
    terms: store.terms.map((term) => ({
      ...term,
      status: termStatus(term, today),
    })),
    billedCount: store.students.filter((s) => !s.isWaiting).length,
    rules: { graceDays: GRACE_DAYS, newStudentDays: NEW_STUDENT_DAYS },
  }
}

// How many students are overdue now, and would be with the term changed to
// `values`: shown before saving, because raising the fee or moving a due
// date earlier can make many families overdue at once.
export async function previewTermChange(termId, values) {
  await simulateNetwork(200)
  const term = store.terms.find((t) => t.id === termId)
  const changed = { ...term, ...values }
  const overdue = (t) =>
    store.students.filter((s) => studentFees(s, t).status === 'overdue').length
  return { overdueNow: overdue(term), overdueAfter: overdue(changed) }
}

// Saves one term. `values` come from the term form (termSchema), with the
// fee as a number. Terms can't overlap. Every balance for the term is
// worked out again from the new fee and due dates; payments stay as they
// were.
export async function saveTerm(termId, values) {
  await simulateNetwork()
  const term = store.terms.find((t) => t.id === termId)
  if (!term) throw new AdminServiceError('We could not find that term.')
  const overlapping = store.terms.find(
    (other) =>
      other.id !== termId &&
      values.opens <= other.closes &&
      other.opens <= values.closes,
  )
  if (overlapping) {
    throw new AdminServiceError(
      `These dates overlap ${overlapping.name} (${formatDayMonth(overlapping.opens)} – ${formatDayMonth(overlapping.closes)}).`,
    )
  }
  Object.assign(term, {
    opens: values.opens,
    closes: values.closes,
    fee: values.fee,
    dueDates: values.dueDates,
  })
  return term
}
