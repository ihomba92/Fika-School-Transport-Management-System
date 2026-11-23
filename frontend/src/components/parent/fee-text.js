// How a child's fee status is shown as a badge.
export function feeBadge(fees) {
  if (fees.status === 'paid') return { tone: 'success', label: 'Paid in full' }
  if (fees.status === 'overdue') return { tone: 'danger', label: 'Overdue' }
  return { tone: 'neutral', label: 'Up to date' }
}
