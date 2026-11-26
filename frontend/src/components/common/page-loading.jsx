import { useTranslation } from 'react-i18next'

// Grey placeholder blocks while a page's data loads. role="status" lets
// screen readers announce "Loading" once instead of reading empty boxes.
export function PageLoading({ label = 'Loading' }) {
  const { t } = useTranslation()
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className="sr-only">{t(label)}…</span>
      <div className="h-10 w-64 animate-pulse rounded-xl bg-muted" />
      <div className="h-48 animate-pulse rounded-3xl bg-muted" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-3xl bg-muted" />
        <div className="h-40 animate-pulse rounded-3xl bg-muted" />
      </div>
    </div>
  )
}
