import { StatusBadge } from '@/components/common/status-badge'
import { feeBadge } from './fee-text'

export function FeeStatusBadge({ fees }) {
  const { tone, label } = feeBadge(fees)
  return (
    <StatusBadge tone={tone} dot>
      {label}
    </StatusBadge>
  )
}
