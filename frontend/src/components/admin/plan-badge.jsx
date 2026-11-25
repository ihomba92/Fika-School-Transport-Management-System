import { StatusBadge } from '@/components/common/status-badge'

const SHORT = {
  both: ['neutral', 'Both ways'],
  morning: ['brand', 'Morning only'],
  evening: ['neutral', 'Evening only'],
}

export function PlanBadge({ plan }) {
  const [tone, label] = SHORT[plan]
  return <StatusBadge tone={tone}>{label}</StatusBadge>
}
