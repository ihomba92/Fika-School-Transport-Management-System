import { formatDayMonth } from '@/lib/format'

// Words for the Payments page. Kept out of the components so they can be
// tested.

export const TERM_STATUS = {
  closed: { label: 'Closed', tone: 'neutral' },
  current: { label: 'Current term', tone: 'brand' },
  upcoming: { label: 'Upcoming', tone: 'success' },
}

const PAYMENT_STATUS = {
  paid: { label: 'Paid', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export function paymentStatus(status) {
  return PAYMENT_STATUS[status]
}

// Where a student who is behind stands: removed, flagged after the grace
// period (FR-6.6), or still inside it.
export function behindStatus(student) {
  if (student.removedOn) {
    return {
      label: 'Removed',
      tone: 'neutral',
      note: `Off the bus since ${formatDayMonth(student.removedOn)}`,
    }
  }
  if (student.isFlagged) {
    return {
      label: 'Flagged',
      tone: 'danger',
      note: `Grace ended ${formatDayMonth(student.graceEndsOn)}`,
    }
  }
  return {
    label: 'Overdue',
    tone: 'warning',
    note: `Grace until ${formatDayMonth(student.graceEndsOn)}`,
  }
}

// "Term 3 is paid in 2 instalments: by 1 Sep and by 1 Oct."
export function scheduleText(term) {
  const dates = term.dueDates.map((date) => `by ${formatDayMonth(date)}`)
  const list =
    dates.length === 1
      ? dates[0]
      : `${dates.slice(0, -1).join(', ')} and ${dates.at(-1)}`
  const count =
    term.dueDates.length === 1
      ? 'in one payment'
      : `in ${term.dueDates.length} instalments`
  return `${term.name} is paid ${count}: ${list}.`
}
