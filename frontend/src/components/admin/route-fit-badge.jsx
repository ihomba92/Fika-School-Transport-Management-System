import { StatusBadge } from '@/components/common/status-badge'
import { FIT_TEXT } from './route-options'

// "Good fit", "Nearly full", "No bus"… for a route's students and its bus.
export function RouteFitBadge({ fit }) {
  const { label, tone } = FIT_TEXT[fit.status]
  return (
    <StatusBadge tone={tone} dot>
      {label}
    </StatusBadge>
  )
}
