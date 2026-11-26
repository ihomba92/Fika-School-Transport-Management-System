import { useTranslation } from 'react-i18next'
// "Live · updated 6 s ago": shows the map is being refreshed.
export function LiveBadge({ updatedAt, now }) {
  const { t } = useTranslation()
  const seconds = Math.max(0, Math.round((now - updatedAt) / 1000))
  return (
    <span className="flex w-fit items-center gap-2 rounded-full bg-sidebar px-3 py-1.5 text-xs font-semibold text-sidebar-foreground">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-sidebar-success opacity-75 motion-reduce:hidden" />
        <span className="relative inline-flex size-2 rounded-full bg-sidebar-success" />
      </span>
      {t('Live · updated {{seconds}} s ago', { seconds })}
    </span>
  )
}
