import { StatusBadge } from '@/components/common/status-badge'
import { busStatusLabel } from './bus-status-text'

export function BusStatusBadge({ live }) {
  const { tone, label } = busStatusLabel(live)
  return (
    <StatusBadge tone={tone} dot>
      {label}
    </StatusBadge>
  )
}
