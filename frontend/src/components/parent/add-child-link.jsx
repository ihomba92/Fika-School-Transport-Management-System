import { Plus } from 'lucide-react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

export function AddChildLink() {
  const { t } = useTranslation()
  return (
    <Link
      to="/parent/children/new"
      className="flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted"
    >
      <Plus className="size-4" aria-hidden="true" />
      {t('Add a child')}
    </Link>
  )
}
