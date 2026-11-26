import { StatusBadge } from '@/components/common/status-badge'
import { feeBadge } from './fee-text'
import { useTranslation } from 'react-i18next'

export function FeeStatusBadge({ fees }) {
  const { t } = useTranslation()
  const { tone, label } = feeBadge(fees)
  return (
    <StatusBadge tone={tone} dot>
      {t(label)}
    </StatusBadge>
  )
}
