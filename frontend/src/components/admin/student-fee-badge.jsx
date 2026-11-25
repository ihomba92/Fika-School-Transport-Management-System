import { StatusBadge } from '@/components/common/status-badge'
import { formatKes } from '@/lib/format'

// A student's fee status as the admin sees it. "Flagged" means past the
// 3-day grace period: the system suggests removal and an admin decides.
export function StudentFeeBadge({ student }) {
  const { fees } = student
  if (fees.status === 'not-billed') {
    return <StatusBadge tone="neutral">Not billed yet</StatusBadge>
  }
  if (student.isFlagged) {
    return (
      <span className="flex flex-col items-start gap-0.5">
        <StatusBadge tone="danger" dot>
          Flagged
        </StatusBadge>
        <span className="text-xs text-danger">
          {formatKes(fees.balance)} overdue
        </span>
      </span>
    )
  }
  if (fees.status === 'overdue') {
    return (
      <StatusBadge tone="warning" dot>
        Overdue
      </StatusBadge>
    )
  }
  if (fees.status === 'paid') {
    return (
      <StatusBadge tone="success" dot>
        Paid in full
      </StatusBadge>
    )
  }
  return <StatusBadge tone="neutral">Up to date</StatusBadge>
}
