import { PLANS } from '@/config/plans'
import { addDays } from './dates'

// Days after a due date before an unpaid child is flagged for removal (FR-6).
export const GRACE_DAYS = 3

// A student who joins a bus during the term gets this many days to pay any
// instalment that was already due when they joined.
export const NEW_STUDENT_DAYS = 7

// The due dates for a student who joined on `joinedOn` (a date key, or null
// for a student who was there from the start). Due dates before they joined
// move to 7 days after it; later ones stay.
export function dueDatesFor(dueDates, joinedOn) {
  if (!joinedOn) return dueDates
  const firstDay = addDays(joinedOn, NEW_STUDENT_DAYS)
  return dueDates.map((date) => (date < firstDay ? firstDay : date))
}

// The fee a child pays this term: the full fee both ways, half for one way.
export function planFee(termFee, plan) {
  return termFee * PLANS[plan].feeShare
}

// Splits a fee into equal instalments, one per due date, in whole shillings.
// Any shillings left over go on the first instalment, so the total is exact.
export function splitIntoInstalments(total, dueDates) {
  const base = Math.floor(total / dueDates.length)
  const remainder = total - base * dueDates.length
  return dueDates.map((dueDate, index) => ({
    dueDate,
    amount: index === 0 ? base + remainder : base,
  }))
}

// Where a child's fee stands on `today` (a date key).
//   paid     – nothing left to pay this term
//   upcoming – up to date; `amountDue` is due by `dueDate`
//   overdue  – a deadline passed unpaid; `amountDue` was due on `dueDate`
export function feeStatus({ fee, paid, instalments, today }) {
  const balance = Math.max(0, fee - paid)
  if (balance === 0) return { status: 'paid', balance: 0 }

  // Walk the instalments, adding each one to a running total. The first one
  // the payments don't cover is the instalment that is overdue or due next.
  let runningTotal = 0
  for (const { dueDate, amount } of instalments) {
    runningTotal += amount
    if (paid >= runningTotal) continue

    const amountDue = runningTotal - paid
    if (dueDate < today) {
      return {
        status: 'overdue',
        balance,
        amountDue,
        dueDate,
        graceEndsOn: addDays(dueDate, GRACE_DAYS),
      }
    }
    return { status: 'upcoming', balance, amountDue, dueDate }
  }

  // Unreachable while instalments add up to the fee; kept as a safe answer.
  return { status: 'upcoming', balance, amountDue: balance, dueDate: null }
}

// How long a term is, for the Fee settings page: "9 weeks · 2 months".
// Months are counted as 30 days, rounded.
export function termLength(opens, closes) {
  const days = daysBetween(opens, closes) + 1
  return {
    weeks: Math.round(days / 7),
    months: Math.max(1, Math.round(days / 30)),
  }
}

// One instalment a month, up to three: Terms 1 and 2 (three months) are
// paid in thirds, Term 3 (two months) in halves.
export function suggestedInstalments(opens, closes) {
  return Math.min(3, termLength(opens, closes).months)
}

// Due dates spread over a term: the first on opening day, the rest at the
// start of each later month. Used when the admin changes how many
// instalments there are, as a starting point to edit.
export function spreadDueDates(opens, count) {
  const [year, month] = opens.split('-').map(Number)
  return Array.from({ length: count }, (_, index) => {
    if (index === 0) return opens
    const date = new Date(Date.UTC(year, month - 1 + index, 1))
    return date.toISOString().slice(0, 10)
  })
}

// Each instalment with how much has been paid in total once it is paid,
// for both-ways and one-way plans.
export function instalmentPlan(fee, dueDates) {
  let total = 0
  return splitIntoInstalments(fee, dueDates).map(({ dueDate, amount }) => {
    total += amount
    return { dueDate, amount, totalPaid: total }
  })
}

// Where a term stands on `today`.
export function termStatus(term, today) {
  if (today < term.opens) return 'upcoming'
  if (today > term.closes) return 'closed'
  return 'current'
}

function daysBetween(from, to) {
  return Math.round(
    (new Date(`${to}T12:00:00Z`) - new Date(`${from}T12:00:00Z`)) / 86_400_000,
  )
}
