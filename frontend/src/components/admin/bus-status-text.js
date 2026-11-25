// The status of a bus on its trip, worded the same everywhere.
export function busStatusLabel(live) {
  switch (live.status) {
    case 'on-time':
      return { tone: 'success', label: 'On time' }
    case 'late':
      return { tone: 'warning', label: `${live.delayMinutes} min late` }
    case 'signal-lost':
      return { tone: 'danger', label: 'Signal lost' }
    case 'arrived':
      return { tone: 'neutral', label: 'Arrived' }
    default:
      return { tone: 'neutral', label: 'Not started' }
  }
}
