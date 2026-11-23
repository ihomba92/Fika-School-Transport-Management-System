import { PLANS } from '@/config/plans'
import { addDays } from './dates'

// Days after a due date before an unpaid child is flagged for removal (FR-6).
export const GRACE_DAYS = 3

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
